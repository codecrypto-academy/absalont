const express = require('express');
const { ethers } = require('ethers');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

console.log(`
╔════════════════════════════════════════════════════════════════╗
║       🔔 NOTIFICATION SERVICE - INICIANDO                    ║
╚════════════════════════════════════════════════════════════════╝
`);

const app = express();
app.use(express.json());

// Middleware CORS manual
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // O restringir a http://localhost:6004
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Dashboard de estado
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Notification Service</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 1000px; margin: 40px auto; padding: 20px; background: #f8fafc; color: #334155; }
          .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); margin-bottom: 20px; }
          h1 { color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; gap: 12px; }
          h2 { color: #1e293b; margin-top: 20px; font-size: 1.2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; display: flex; align-items: center; gap: 10px; }
          .status { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; background: #dcfce7; color: #166534; font-weight: bold; font-size: 0.875rem; }
          .status.error { background: #fee2e2; color: #991b1b; }
          .status.warning { background: #fef3c7; color: #92400e; }
          .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .stat-box { background: #f1f5f9; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .stat-content { flex: 1; }
          .label { font-size: 0.875rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
          .value { font-size: 2rem; font-weight: 800; color: #3b82f6; }
          .config-section { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .config-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #cbd5e1; }
          .config-key { font-weight: 600; color: #334155; }
          .config-value { font-family: monospace; color: #64748b; }
          .api-section { background: #ede9fe; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .api-endpoint { background: white; padding: 10px; border-radius: 4px; margin: 8px 0; font-family: monospace; font-size: 0.9rem; }
          .btn { background: #2563eb; color: white; padding: 8px 12px; border-radius: 4px; text-decoration: none; display: inline-block; margin: 5px 0; }
          .btn:hover { background: #1d4ed8; }
          .icon { width: 24px; height: 24px; }
          .icon-sm { width: 16px; height: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h1>
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
              </svg>
              Notification Service
            </h1>
            <span class="status">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="8"/>
              </svg>
              Running
            </span>
          </div>
          <p>Servicio de notificaciones blockchain activo y escuchando eventos.</p>
          
          <h2>
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"/>
            </svg>
            Estadísticas
          </h2>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-content">
                <div class="label">Empresas Suscritas</div>
                <div class="value">${emailSubscriptions.size}</div>
              </div>
            </div>
            <div class="stat-box">
              <div class="stat-content">
                <div class="label">Compradores Suscritos</div>
                <div class="value">${customerEmails.size}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Configuración de email
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000, // 10 segundos
  greetingTimeout: 5000,
  socketTimeout: 10000,
  logger: true,
  debug: true
};

console.log(`📧 SMTP Config: ${smtpConfig.host}:${smtpConfig.port} (Secure: ${smtpConfig.secure})`);

const transporter = nodemailer.createTransport(smtpConfig);

// Verificar conexión SMTP al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
    console.error('⚠️  ADVERTENCIA: El servicio de emails NO está configurado correctamente.');
    console.error('⚠️  Asegúrate de configurar SMTP_USER y SMTP_PASS en el archivo .env');
    console.error('⚠️  Si usas Gmail, necesitas una "App Password", no tu contraseña normal.');
  } else {
    console.log('✅ SMTP Connection: OK - Listo para enviar emails');
  }
});

// Función para enviar emails
async function sendEmail(to, subject, htmlContent) {
  if (!to || !subject || !htmlContent) {
    console.error('❌ sendEmail: Parámetros incompletos', { to, subject: subject ? 'presente' : 'falta', htmlContent: htmlContent ? 'presente' : 'falta' });
    return false;
  }

  try {
    console.log(`📨 Intentando enviar email a: ${to}`);
    const result = await transporter.sendMail({
      from: process.env.SMTP_USER || 'noreply@ecommerce.com',
      to,
      subject,
      html: htmlContent,
    });
    console.log(`✅ Email enviado exitosamente a ${to} (ID: ${result.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando email a ${to}:`, error.message);
    // console.error(`   Stack: ${error.stack}`);

    // Fallback: Log email content to console so user can see it
    console.log('\n⚠️  FALLBACK: CONTENIDO DEL EMAIL NO ENVIADO ⚠️');
    console.log('================================================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('------------------------------------------------');
    console.log('HTML Content Preview:');
    console.log(htmlContent.substring(0, 500) + '...');
    console.log('================================================\n');

    return false;
  }
}

// Conectar a blockchain
const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
console.log(`⛓️  Conectando a RPC: ${rpcUrl}`);

const provider = new ethers.JsonRpcProvider(rpcUrl);

// Verificar conexión a blockchain
provider.getBlockNumber()
  .then(blockNumber => {
    console.log(`✅ Blockchain Connection: OK - Bloque actual: ${blockNumber}`);
  })
  .catch(error => {
    console.error('❌ Blockchain Connection Error:', error.message);
    console.error('⚠️  ADVERTENCIA: No se puede conectar a blockchain en', rpcUrl);
  });

const ECOMMERCE_ABI = [
  'event InvoiceCreated(uint256 indexed invoiceId, uint256 indexed companyId, address indexed customer, uint256 totalAmount)',
  'event InvoicePaid(uint256 indexed invoiceId, bytes32 paymentTxHash)',
  'event PaymentProcessed(address indexed customer, uint256 indexed invoiceId, uint256 amount, address indexed merchant)',
  'function getInvoice(uint256 invoiceId) external view returns (uint256, uint256, address, uint256, uint256, bool)',
  'function getCompany(uint256 companyId) external view returns (tuple(uint256,string,address,string,bool,uint256))',
];

const ecommerceAddress = process.env.ECOMMERCE_CONTRACT_ADDRESS;
if (!ecommerceAddress) {
  console.error('❌ ECOMMERCE_CONTRACT_ADDRESS no está configurada');
} else {
  console.log(`📱 Contrato E-commerce: ${ecommerceAddress}`);
}

const ecommerce = new ethers.Contract(ecommerceAddress, ECOMMERCE_ABI, provider);

// Declarar Maps para suscripciones
const emailSubscriptions = new Map();
const customerEmails = new Map();

// Inicializar con datos de prueba
emailSubscriptions.set('1', 'admin@ecommerce.com');

// Endpoints para suscripciones
app.post('/api/subscribe/company', (req, res) => {
  const { companyId, email } = req.body;
  emailSubscriptions.set(companyId.toString(), email);
  console.log(`Suscripción agregada: Company ${companyId} -> ${email}`);
  res.json({ success: true, message: 'Empresa suscrita a notificaciones' });
});

app.post('/api/subscribe/customer', (req, res) => {
  const { address, email } = req.body;
  customerEmails.set(address.toLowerCase(), email);
  console.log(`Suscripción agregada: Customer ${address} -> ${email}`);
  res.json({ success: true, message: 'Cliente suscrito a notificaciones' });
});

// Endpoint para obtener todas las suscripciones
app.get('/api/subscriptions', (req, res) => {
  const companies = Array.from(emailSubscriptions.entries()).map(([id, email]) => ({
    companyId: id,
    email
  }));
  const customers = Array.from(customerEmails.entries()).map(([address, email]) => ({
    address,
    email
  }));
  res.json({ companies, customers });
});

// Endpoint para enviar email de prueba
app.post('/api/test-email', async (req, res) => {
  const { to, subject, message } = req.body;
  if (!to) {
    return res.status(400).json({ error: 'Email requerido' });
  }
  try {
    await sendEmail(to, subject || 'Test Email', `
      <html>
        <head>
          <style>
            body { font-family: system-ui, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Email de Prueba</h2>
            <p>${message || 'Este es un email de prueba del servicio de notificaciones.'}</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 30px;">
              Este email fue enviado desde el servicio de notificaciones de e-commerce.
            </p>
          </div>
        </body>
      </html>
    `);
    res.json({ success: true, message: 'Email de prueba enviado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ...

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
        `🛍️ Nueva orden #${invoiceId}`,
        `
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: system-ui, sans-serif; background: #f8fafc; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
                h2 { color: #0f172a; margin-bottom: 20px; }
                .info { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .info strong { color: #0f172a; display: block; margin-bottom: 5px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>🛍️ Nueva Orden Recibida</h2>
                <p>Se ha creado una nueva orden en tu tienda. El cliente procederá a realizar el pago.</p>
                
                <div class="info">
                  <strong>ID de Orden:</strong> #${invoiceId}
                </div>
                <div class="info">
                  <strong>Cliente:</strong> ${customer.substring(0, 6)}...${customer.substring(-4)}
                </div>
                <div class="info">
                  <strong>Monto Total:</strong> €${parseFloat(amount).toFixed(2)}
                </div>
                
                <p style="margin-top: 30px; color: #64748b;">
                  Accede a tu panel de administración para ver más detalles: 
                  <a href="http://localhost:6003" style="color: #2563eb;">Dashboard Admin</a>
                </p>
                
                <div class="footer">
                  <p>Este es un correo automático del sistema de e-commerce blockchain.</p>
                  <p>No responda a este correo.</p>
                </div>
              </div>
            </body>
          </html>
        `
      );
    } else {
      console.log(`No subscription found for Company ${companyId}`);
    }

    // Notificar al cliente
    const customerEmail = customerEmails.get(customer.toLowerCase());
    if (customerEmail) {
      const amountUnits = ethers.formatUnits(totalAmount, 6);
      await sendEmail(
        customerEmail,
        `✅ Orden confirmada #${invoiceId}`,
        `
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: system-ui, sans-serif; background: #f8fafc; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
                h2 { color: #0f172a; margin-bottom: 20px; }
                .info { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .info strong { color: #0f172a; display: block; margin-bottom: 5px; }
                .buyer-info { background: #ede9fe; border-left: 4px solid #7c3aed; padding: 15px; border-radius: 4px; margin: 20px 0; }
                .buyer-info strong { color: #0f172a; display: block; margin-bottom: 5px; }
                .cta-button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>✅ Tu Orden ha sido Confirmada</h2>
                <p>Gracias por tu compra. Tu orden está lista para ser pagada.</p>
                
                <div class="info">
                  <strong>ID de Orden:</strong> #${invoiceId}
                </div>
                <div class="info">
                  <strong>Monto a Pagar:</strong> €${parseFloat(amountUnits).toFixed(2)}
                </div>
                <div class="buyer-info">
                  <strong>👤 Información del Comprador</strong>
                  <p style="margin: 10px 0 0 0; word-break: break-all; font-family: monospace; font-size: 12px;">
                    Wallet: ${customer}
                  </p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">
                    Email: ${customerEmail}
                  </p>
                </div>
                
                <p style="text-align: center; margin: 30px 0;">
                  <a href="http://localhost:6002/?invoice=${invoiceId}" class="cta-button">💳 Pagar Ahora</a>
                </p>
                
                <p style="color: #64748b; font-size: 14px;">
                  Si no realizaste esta compra, ignora este correo.
                </p>
                
                <div class="footer">
                  <p>Este es un correo automático del sistema de e-commerce blockchain.</p>
                  <p>No responda a este correo.</p>
                </div>
              </div>
            </body>
          </html>
        `
      );
    } else {
      console.log(`No email subscription found for customer ${customer}`);
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
        `💰 ¡Pago recibido! Orden #${invoiceId}`,
        `
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: system-ui, sans-serif; background: #f8fafc; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
                h2 { color: #0f172a; margin-bottom: 20px; }
                .success { background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; border-radius: 4px; margin: 20px 0; }
                .info { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .info strong { color: #0f172a; display: block; margin-bottom: 5px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>💰 Pago Confirmado</h2>
                
                <div class="success">
                  ✅ Has recibido un pago de €${parseFloat(amountEur).toFixed(2)}
                </div>
                
                <div class="info">
                  <strong>ID de Orden:</strong> #${invoiceId}
                </div>
                <div class="info">
                  <strong>Monto Recibido:</strong> €${parseFloat(amountEur).toFixed(2)}
                </div>
                <div class="info">
                  <strong>Cliente:</strong> ${customer.substring(0, 6)}...${customer.substring(-4)}
                </div>
                
                <p style="margin-top: 30px; color: #64748b;">
                  Los fondos han sido transferidos a tu wallet de blockchain. 
                  Accede a tu <a href="http://localhost:6003" style="color: #2563eb;">dashboard de administración</a> para más detalles.
                </p>
                
                <div class="footer">
                  <p>Este es un correo automático del sistema de e-commerce blockchain.</p>
                  <p>No responda a este correo.</p>
                </div>
              </div>
            </body>
          </html>
        `
      );
    } else {
      console.log(`No subscription found for Company ${companyId}`);
    }

    // Notificar al cliente
    const customerEmail = customerEmails.get(customer.toLowerCase());
    if (customerEmail) {
      const amountEur = ethers.formatUnits(amount, 6);
      const customerDisplay = `${customer.substring(0, 6)}...${customer.substring(-4)}`
      await sendEmail(
        customerEmail,
        `🎉 ¡Pago exitoso! Orden #${invoiceId}`,
        `
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: system-ui, sans-serif; background: #f8fafc; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
                h2 { color: #0f172a; margin-bottom: 20px; }
                .success { background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; border-radius: 4px; margin: 20px 0; }
                .info { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .info strong { color: #0f172a; display: block; margin-bottom: 5px; }
                .buyer-info { background: #ede9fe; border-left: 4px solid #7c3aed; padding: 15px; border-radius: 4px; margin: 20px 0; }
                .buyer-info strong { color: #0f172a; display: block; margin-bottom: 5px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>🎉 ¡Pago Confirmado!</h2>
                
                <div class="success">
                  ✅ Tu pago ha sido procesado exitosamente
                </div>
                
                <p>Gracias por tu compra. Tu pedido será procesado en breve.</p>
                
                <div class="info">
                  <strong>ID de Orden:</strong> #${invoiceId}
                </div>
                <div class="info">
                  <strong>Monto Pagado:</strong> €${parseFloat(amountEur).toFixed(2)}
                </div>
                <div class="buyer-info">
                  <strong>👤 Información del Comprador</strong>
                  <p style="margin: 10px 0 0 0; word-break: break-all; font-family: monospace; font-size: 12px;">
                    Wallet: ${customer}
                  </p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">
                    Email: ${customerEmail}
                  </p>
                </div>
                
                <p style="margin-top: 30px; color: #64748b;">
                  Puedes seguir el estado de tu pedido en tu 
                  <a href="http://localhost:6001" style="color: #2563eb;">área de cliente</a>.
                </p>
                
                <div class="footer">
                  <p>Este es un correo automático del sistema de e-commerce blockchain.</p>
                  <p>No responda a este correo.</p>
                </div>
              </div>
            </body>
          </html>
        `
      );
    } else {
      console.log(`No email subscription found for customer ${customer}`);
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
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   ✅ SERVICIO LISTO                          ║
╚════════════════════════════════════════════════════════════════╝

🌐 Dashboard:  http://localhost:${PORT}
📊 Health:     http://localhost:${PORT}/health
📧 APIs:       http://localhost:${PORT}/api/...

Para ver logs en vivo:
  $ npm run dev

Ambiente:
  - RPC: ${rpcUrl}
  - Contrato: ${ecommerceAddress || '❌ NO CONFIGURADO'}
  - SMTP: ${process.env.SMTP_USER || '❌ NO CONFIGURADO'}
  - Puerto: ${PORT}

  `);
  console.log(`Listening to contract: ${ecommerceAddress}`);
});
