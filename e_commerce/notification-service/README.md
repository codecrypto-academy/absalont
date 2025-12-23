# Notification Service

Servicio de notificaciones por email para el sistema e-commerce con soporte para órdenes y pagos.

## 🚀 Características

- 📧 **Notificaciones de Órdenes**: Alerta cuando se crea una orden
- 💰 **Confirmación de Pagos**: Confirmación cuando se procesa un pago
- 📊 **Reportes Diarios**: Reporte automático de ventas cada mañana
- 🔔 **Sistema de Suscripciones**: Empresas y clientes pueden suscribirse
- 🎨 **Emails HTML Profesionales**: Templates responsivos y atractivos
- ✅ **Conversión Correcta de Precios**: Soporta 6 decimales (euros)

## 🔧 Instalación

```bash
npm install
```

## ⚙️ Configuración

El archivo `.env` ya incluye la configuración correcta:

```dotenv
PORT=6005
RPC_URL=http://localhost:8545
ECOMMERCE_CONTRACT_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

## 🏃 Ejecución

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

Accede al dashboard en: **http://localhost:6005**

## 📡 API Endpoints

### Suscribir Empresa

```bash
POST /api/subscribe/company
{
  "companyId": 1,
  "email": "empresa@example.com"
}
```

### Suscribir Cliente

```bash
POST /api/subscribe/customer
{
  "address": "0x...",
  "email": "cliente@example.com"
}
```

### Ver Suscripciones

```bash
GET /api/subscriptions
```

### Enviar Email de Prueba

```bash
POST /api/test-email
{
  "to": "email@example.com",
  "subject": "Test",
  "message": "Mensaje"
}
```

### Health Check

```bash
GET /health
```

## 📧 Eventos Soportados

- ✅ `InvoiceCreated`: Se envía email a empresa y cliente cuando se crea una orden
- ✅ `PaymentProcessed`: Se confirma pago a ambas partes cuando se procesa el pago
- ✅ Reporte diario: Cada día a las 9:00 AM (automático)

## 💡 Tips

- Los precios se convierten con **6 decimales** (correcto para euros)
- Plantillas HTML responsivas y profesionales
- Direcciones blockchain ocultas parcialmente por privacidad
- Revisa la carpeta de spam si no recibes emails
- Los reportes diarios se envían automáticamente

## 🚨 Troubleshooting

### No recibo emails

1. Verifica la suscripción: `GET /api/subscriptions`
2. Envía un email de prueba: `POST /api/test-email`
3. Revisa la carpeta de spam
4. Verifica los logs del servicio

### SMTP Error

- Verifica credenciales en `.env`
- Si usas Gmail, usa "App Password" (no contraseña normal)
- Genera una nueva "App Password" si es necesario

### Sin conexión a blockchain

- Verifica que Anvil esté corriendo
- Verifica `ECOMMERCE_CONTRACT_ADDRESS` es correcta
- Verifica `RPC_URL` es accesible

## 📚 Documentación Completa

Ver `NOTIFICATION_SERVICE_GUIDE.md` para guía detallada de uso e integración
