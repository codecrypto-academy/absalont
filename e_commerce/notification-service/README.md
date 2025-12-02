# Notification Service

Servicio de notificaciones por email para el sistema e-commerce.

## Características

- 📧 Notificaciones por email cuando se crea una invoice
- 💰 Notificaciones de pagos recibidos
- 📊 Reportes diarios de ventas
- 🔔 Sistema de suscripciones para empresas y clientes

## Instalación

```bash
npm install
```

## Configuración

1. Copiar `.env.example` a `.env`
2. Configurar SMTP (Gmail, SendGrid, etc.)
3. Configurar dirección del contrato

### Configuración Gmail

1. Ir a tu cuenta de Google
2. Activar 2FA
3. Generar "App Password"
4. Usar esa contraseña en `SMTP_PASS`

## Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## API Endpoints

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

### Health Check

```bash
GET /health
```

## Eventos Escuchados

- `InvoiceCreated`: Se envía email a empresa y cliente
- `PaymentProcessed`: Se confirma pago a ambas partes
- Reporte diario: Cada día a las 9:00 AM

## Ejemplos de Notificaciones

### Nueva Orden (a Empresa)
```
Asunto: Nueva orden #123
Contenido: Detalles de la orden, cliente, monto
```

### Orden Confirmada (a Cliente)
```
Asunto: Orden confirmada #123
Contenido: Detalles y link para pagar
```

### Pago Recibido (a Empresa)
```
Asunto: ¡Pago recibido! Orden #123
Contenido: Confirmación de pago y monto
```

### Pago Exitoso (a Cliente)
```
Asunto: ¡Pago exitoso! Orden #123
Contenido: Confirmación y número de seguimiento
```

## Integración con Frontend

```typescript
// Suscribir empresa
fetch('http://localhost:6005/api/subscribe/company', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyId: 1,
    email: 'empresa@example.com'
  })
});

// Suscribir cliente
fetch('http://localhost:6005/api/subscribe/customer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: account,
    email: 'cliente@example.com'
  })
});
```

## Producción

Para producción, recomendamos:

- Usar base de datos (PostgreSQL, MongoDB)
- Implementar cola de mensajes (RabbitMQ, Redis)
- Usar servicio de email profesional (SendGrid, AWS SES)
- Agregar autenticación a los endpoints
- Implementar rate limiting
- Agregar logs estructurados

## Alternativas

En lugar de emails, también se podría implementar:

- Push notifications (Firebase Cloud Messaging)
- Notificaciones in-app
- SMS (Twilio)
- Webhooks
- Discord/Telegram bots
