# Pasarela de Pago

Aplicación Next.js para procesar pagos con EuroTokens.

## Características

- Recibe parámetros de pago por URL
- Conexión con MetaMask
- Verifica saldo de tokens
- Aprueba y ejecuta pago
- Redirección automática después del pago

## Instalación

```bash
npm install
```

## Configuración

Crear archivo `.env` con:

```
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:6002`

## Uso

La pasarela recibe parámetros por URL:

```
http://localhost:6002/?merchant_address=0x...&amount=100.50&invoice=INV-001&date=2025-10-15&redirect=http://...
```

### Parámetros

- `merchant_address`: Dirección del comerciante
- `amount`: Monto en EUR
- `invoice`: ID de la factura
- `date`: Fecha de la transacción
- `redirect`: URL de retorno (opcional)

## Flujo de Pago

1. Usuario ve detalles del pago
2. Conecta MetaMask
3. Sistema verifica saldo
4. Usuario aprueba gasto de tokens
5. Sistema ejecuta pago
6. Redirige a URL de retorno
