const express = require('express');
const { ethers } = require('ethers');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
app.use(express.json());

// Configuración de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Conectar a blockchain
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

const ECOMMERCE_ABI = [
  'event InvoiceCreated(uint256 indexed invoiceId, uint256 indexed companyId, address indexed customer, uint256 totalAmount)',
  'event InvoicePaid(uint256 indexed invoiceId, bytes32 paymentTxHash)',
  'event PaymentProcessed(address indexed customer, uint256 indexed invoiceId, uint256 amount, address indexed merchant)',
  'function getInvoice(uint256 invoiceId) external view returns (uint256, uint256, address, uint256, uint256, bool)',
  'function getCompany(uint256 companyId) external view returns (tuple(uint256,string,address,string,bool,uint256))',
];

const ecommerceAddress = process.env.ECOMMERCE_CONTRACT_ADDRESS;
const ecommerce = new ethers.Contract(ecommerceAddress, ECOMMERCE_ABI, provider);

// Base de datos en memoria (en producción usar DB real)
const emailSubscriptions = new Map(); // companyId => email
const customerEmails = new Map(); // address => email

// Endpoints para suscripciones
app.post('/api/subscribe/company', (req, res) => {
  const { companyId, email } = req.body;
  emailSubscriptions.set(companyId.toString(), email);
  res.json({ success: true, message: 'Empresa suscrita a notificaciones' });
});

app.post('/api/subscribe/customer', (req, res) => {
  const { address, email } = req.body;
  customerEmails.set(address.toLowerCase(), email);
  res.json({ success: true, message: 'Cliente suscrito a notificaciones' });
});

// Función para enviar email
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log(`Email enviado a ${to}: ${subject}`);
  } catch (error) {
    console.error('Error enviando email:', error);
  }
}

// Escuchar eventos de Invoice creado
ecommerce.on('InvoiceCreated', async (invoiceId, companyId, customer, totalAmount) => {
  console.log(`Nueva Invoice: #${invoiceId} - Company: ${companyId} - Total: ${totalAmount}`);

  try {
    // Notificar a la empresa
    const companyEmail = emailSubscriptions.get(companyId.toString());
    if (companyEmail) {
      const amount = ethers.formatUnits(totalAmount, 6);
      await sendEmail(
        companyEmail,
        `Nueva orden #${invoiceId}`,
        `
          <h2>Nueva Orden Recibida</h2>
          <p>Se ha creado una nueva orden en tu tienda:</p>
          <ul>
            <li><strong>ID de Orden:</strong> ${invoiceId}</li>
            <li><strong>Cliente:</strong> ${customer}</li>
            <li><strong>Total:</strong> €${amount}</li>
          </ul>
          <p>El cliente procederá a pagar en breve.</p>
        `
      );
    }

    // Notificar al cliente
    const customerEmail = customerEmails.get(customer.toLowerCase());
    if (customerEmail) {
      const amount = ethers.formatUnits(totalAmount, 6);
      await sendEmail(
        customerEmail,
        `Orden confirmada #${invoiceId}`,
        `
          <h2>Tu Orden ha sido Confirmada</h2>
          <p>Gracias por tu compra. Detalles de tu orden:</p>
          <ul>
            <li><strong>ID de Orden:</strong> ${invoiceId}</li>
            <li><strong>Total:</strong> €${amount}</li>
          </ul>
          <p>Por favor procede al pago para completar tu compra.</p>
          <a href="http://localhost:6002/?invoice=${invoiceId}&amount=${amount}">Pagar Ahora</a>
        `
      );
    }
  } catch (error) {
    console.error('Error procesando InvoiceCreated:', error);
  }
});

// Escuchar eventos de pago procesado
ecommerce.on('PaymentProcessed', async (customer, invoiceId, amount, merchant) => {
  console.log(`Pago procesado: Invoice #${invoiceId} - ${amount}`);

  try {
    // Obtener info de la invoice
    const invoiceData = await ecommerce.getInvoice(invoiceId);
    const companyId = invoiceData[1];

    // Notificar a la empresa
    const companyEmail = emailSubscriptions.get(companyId.toString());
    if (companyEmail) {
      const amountEur = ethers.formatUnits(amount, 6);
      await sendEmail(
        companyEmail,
        `¡Pago recibido! Orden #${invoiceId}`,
        `
          <h2>Pago Confirmado</h2>
          <p>Has recibido un pago:</p>
          <ul>
            <li><strong>ID de Orden:</strong> ${invoiceId}</li>
            <li><strong>Monto:</strong> €${amountEur}</li>
            <li><strong>Cliente:</strong> ${customer}</li>
          </ul>
          <p>Los fondos han sido transferidos a tu wallet.</p>
        `
      );
    }

    // Notificar al cliente
    const customerEmail = customerEmails.get(customer.toLowerCase());
    if (customerEmail) {
      const amountEur = ethers.formatUnits(amount, 6);
      await sendEmail(
        customerEmail,
        `¡Pago exitoso! Orden #${invoiceId}`,
        `
          <h2>Pago Confirmado</h2>
          <p>Tu pago ha sido procesado exitosamente:</p>
          <ul>
            <li><strong>ID de Orden:</strong> ${invoiceId}</li>
            <li><strong>Monto:</strong> €${amountEur}</li>
          </ul>
          <p>Gracias por tu compra. Tu pedido será procesado en breve.</p>
        `
      );
    }
  } catch (error) {
    console.error('Error procesando PaymentProcessed:', error);
  }
});

// Reporte diario (cada día a las 9:00 AM)
cron.schedule('0 9 * * *', async () => {
  console.log('Enviando reportes diarios...');

  for (const [companyId, email] of emailSubscriptions) {
    try {
      // Aquí se calcularían las métricas del día anterior
      const yesterday = Math.floor(Date.now() / 1000) - 86400;
      const dayTimestamp = Math.floor(yesterday / 86400) * 86400;

      await sendEmail(
        email,
        `Reporte Diario - Company #${companyId}`,
        `
          <h2>Reporte de Ventas Diarias</h2>
          <p>Resumen de ayer:</p>
          <p>Para ver métricas detalladas, visita tu dashboard de analytics.</p>
          <a href="http://localhost:6003/analytics">Ver Dashboard</a>
        `
      );
    } catch (error) {
      console.error(`Error enviando reporte a company ${companyId}:`, error);
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', subscriptions: emailSubscriptions.size });
});

const PORT = process.env.PORT || 6005;
app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
  console.log(`Listening to contract: ${ecommerceAddress}`);
});
