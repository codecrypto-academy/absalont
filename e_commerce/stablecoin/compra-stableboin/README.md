# Compra de EuroToken

Aplicación Next.js para comprar EuroTokens con tarjeta de crédito mediante Stripe.

## Características

- Conexión con MetaMask
- Pago con tarjeta de crédito (Stripe)
- Mint automático de tokens después del pago
- Interface intuitiva

## Instalación

```bash
npm install
```

## Configuración

1. Crear archivo `.env` basado en `.env.example`
2. Configurar variables de entorno:
   - `NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS`: Dirección del contrato EuroToken
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Clave pública de Stripe
   - `STRIPE_SECRET_KEY`: Clave secreta de Stripe
   - `WALLET_PRIVATE_KEY`: Private key para hacer mint (cuenta owner del token)

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:6001`

## Producción

```bash
npm run build
npm start
```

## Tarjetas de Prueba Stripe

- Número: 4242 4242 4242 4242
- Fecha: Cualquier fecha futura
- CVC: Cualquier 3 dígitos

## Flujo de Usuario

1. Usuario conecta MetaMask
2. Ingresa cantidad de EUR a comprar
3. Paga con tarjeta de crédito
4. Sistema hace mint de tokens a su wallet
5. Tokens aparecen en su balance
