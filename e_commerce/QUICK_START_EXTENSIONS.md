# 🚀 Guía Rápida de Uso - Extensiones Bonus

## Setup Inicial

```bash
# Usar EcommerceV2 con todas las extensiones
./restart-all-v2.sh
```

Este script despliega EcommerceV2, LoyaltyNFT y configura todo el sistema.

---

## 1. Reviews ⭐

### Desde el Frontend (web-customer)

```typescript
import ReviewForm from '@/components/ReviewForm'
import ProductReviews from '@/components/ProductReviews'

// Mostrar reviews
<ProductReviews productId={1} />

// Formulario para agregar review
<ReviewForm productId={1} onReviewAdded={() => loadProduct()} />
```

### Desde la Terminal

```bash
# Cliente deja review (rating 5, productId 1)
cast send $ECOMMERCE_V2_ADDRESS \
  "addReview(uint256,uint8,string)(uint256)" \
  1 5 "Excelente producto, muy recomendado!" \
  --private-key $CUSTOMER_PRIVATE_KEY \
  --rpc-url http://localhost:8545

# Ver rating promedio
cast call $ECOMMERCE_V2_ADDRESS \
  "getProductRating(uint256)(uint256,uint256)" \
  1 \
  --rpc-url http://localhost:8545
# Output: 450 (4.50 estrellas), 10 (reviews)

# Ver IDs de todos los reviews
cast call $ECOMMERCE_V2_ADDRESS \
  "getProductReviews(uint256)(uint256[])" \
  1 \
  --rpc-url http://localhost:8545
```

---

## 2. Loyalty NFT 🎁

### Desde el Frontend (web-customer)

```typescript
import LoyaltyCard from '@/components/LoyaltyCard'

// Mostrar tarjeta de fidelidad del usuario
<LoyaltyCard account={account} />
```

### Comportamiento Automático

El NFT se crea automáticamente en la **primera compra** del cliente:

1. Cliente hace checkout
2. Sistema crea invoice
3. Cliente paga
4. **Sistema mintea Loyalty NFT automáticamente** (nivel Bronze)
5. Sistema agrega puntos según monto gastado
6. **Upgrade automático** si alcanza umbral

### Desde la Terminal

```bash
# Ver tarjeta de fidelidad de un cliente
cast call $LOYALTY_NFT_ADDRESS \
  "getLoyaltyCard(address)(tuple(uint8,uint256,uint256,uint256,uint256))" \
  $CUSTOMER_ADDRESS \
  --rpc-url http://localhost:8545

# Output ejemplo:
# (1, 150, 150000000, 5, 1701234567)
# tier=1 (Silver), points=150, totalSpent=150 EUR, discount=5%, issuedAt=timestamp

# Ver descuento actual del cliente
cast call $LOYALTY_NFT_ADDRESS \
  "getDiscount(address)(uint256)" \
  $CUSTOMER_ADDRESS \
  --rpc-url http://localhost:8545
# Output: 5 (5% de descuento)
```

### Niveles y Umbrales

```javascript
BRONZE:   0 EUR    → 0% descuento
SILVER:   100 EUR  → 5% descuento
GOLD:     500 EUR  → 10% descuento
PLATINUM: 1000 EUR → 15% descuento
```

**Ejemplo de progresión**:
- Compra #1: 50 EUR → Bronze (0%)
- Compra #2: 60 EUR → **Upgrade a Silver** (5%) - total 110 EUR
- Compra #3: 400 EUR → **Upgrade a Gold** (10%) - total 510 EUR

---

## 3. Multi-moneda 💱

### Agregar Stablecoins

```bash
# Agregar USDT (1 USDT = 1.05 EUR)
cast send $ECOMMERCE_V2_ADDRESS \
  "addSupportedToken(address,string,uint8,uint256)" \
  $USDT_ADDRESS "USDT" 6 1050000 \
  --private-key $OWNER_PRIVATE_KEY \
  --rpc-url http://localhost:8545

# Agregar DAI (1 DAI = 1.00 EUR)
cast send $ECOMMERCE_V2_ADDRESS \
  "addSupportedToken(address,string,uint8,uint256)" \
  $DAI_ADDRESS "DAI" 18 1000000 \
  --private-key $OWNER_PRIVATE_KEY \
  --rpc-url http://localhost:8545

# Ver tokens soportados
cast call $ECOMMERCE_V2_ADDRESS \
  "getSupportedTokens()(address[])" \
  --rpc-url http://localhost:8545
```

### Pagar con Token Alternativo

```bash
# Aprobar gasto de USDT
cast send $USDT_ADDRESS \
  "approve(address,uint256)" \
  $ECOMMERCE_V2_ADDRESS 100000000 \
  --private-key $CUSTOMER_PRIVATE_KEY \
  --rpc-url http://localhost:8545

# Pagar invoice con USDT
cast send $ECOMMERCE_V2_ADDRESS \
  "processPaymentWithToken(address,uint256,uint256,address)" \
  $CUSTOMER_ADDRESS 100000000 1 $USDT_ADDRESS \
  --private-key $CUSTOMER_PRIVATE_KEY \
  --rpc-url http://localhost:8545
```

### Actualizar Tasa de Cambio

```bash
# Actualizar tasa USDT a 1.10 EUR
cast send $ECOMMERCE_V2_ADDRESS \
  "updateTokenRate(address,uint256)" \
  $USDT_ADDRESS 1100000 \
  --private-key $OWNER_PRIVATE_KEY \
  --rpc-url http://localhost:8545
```

---

## 4. Analytics Dashboard 📊

### Desde el Frontend (web-admin)

```typescript
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

// Dashboard completo con gráficos
<AnalyticsDashboard companyId={1} />
```

### Desde la Terminal

```bash
# Ver analytics generales de empresa
cast call $ECOMMERCE_V2_ADDRESS \
  "getCompanyAnalytics(uint256)(uint256,uint256,uint256)" \
  1 \
  --rpc-url http://localhost:8545
# Output: totalSales, totalRevenue, totalOrders

# Ver ventas de un producto específico
cast call $ECOMMERCE_V2_ADDRESS \
  "getProductSales(uint256,uint256)(uint256)" \
  1 5 \
  --rpc-url http://localhost:8545
# Output: cantidad vendida del producto 5

# Ver ventas de un día específico
cast call $ECOMMERCE_V2_ADDRESS \
  "getDailySales(uint256,uint256)(uint256)" \
  1 1701129600 \
  --rpc-url http://localhost:8545
# Output: revenue de ese día
```

### Calcular Timestamp del Día

```bash
# Obtener timestamp de hoy
TODAY=$(date -d "today 00:00" +%s)

# Ver ventas de hoy
cast call $ECOMMERCE_V2_ADDRESS \
  "getDailySales(uint256,uint256)(uint256)" \
  1 $TODAY \
  --rpc-url http://localhost:8545
```

---

## 5. Marketplace Multi-vendor 🏪

### Configurar Comisión

```bash
# Configurar comisión al 3%
cast send $ECOMMERCE_V2_ADDRESS \
  "setPlatformFee(uint256)" \
  3 \
  --private-key $OWNER_PRIVATE_KEY \
  --rpc-url http://localhost:8545

# Máximo permitido es 10%
```

### Flujo de Pago con Comisión

Cuando un cliente paga 100 EUR con comisión del 2%:
- 2 EUR → Plataforma (owner)
- 98 EUR → Comerciante

```bash
# El pago se divide automáticamente
cast send $ECOMMERCE_V2_ADDRESS \
  "processPayment(address,uint256,uint256)" \
  $CUSTOMER_ADDRESS 100000000 1 \
  --private-key $CUSTOMER_PRIVATE_KEY \
  --rpc-url http://localhost:8545
```

### Retirar Fees Acumulados

```bash
# Owner retira fees en EUR
cast send $ECOMMERCE_V2_ADDRESS \
  "withdrawPlatformFees(address)" \
  $EUROTOKEN_ADDRESS \
  --private-key $OWNER_PRIVATE_KEY \
  --rpc-url http://localhost:8545

# Owner retira fees en USDT (si se acepta USDT)
cast send $ECOMMERCE_V2_ADDRESS \
  "withdrawPlatformFees(address)" \
  $USDT_ADDRESS \
  --private-key $OWNER_PRIVATE_KEY \
  --rpc-url http://localhost:8545
```

---

## 6. Notificaciones 📧

### Configurar SMTP

Editar `notification-service/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

Para Gmail:
1. Activar verificación 2 pasos
2. Generar "App Password" en configuración de cuenta
3. Usar esa contraseña en `SMTP_PASS`

### Iniciar Servicio

```bash
cd notification-service
npm run dev
```

### Suscribir Empresa

```bash
curl -X POST http://localhost:6005/api/subscribe/company \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": 1,
    "email": "empresa@example.com"
  }'
```

### Suscribir Cliente

```bash
curl -X POST http://localhost:6005/api/subscribe/customer \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "email": "cliente@example.com"
  }'
```

### Emails Automáticos

Una vez suscritos, se envían emails automáticamente:

1. **InvoiceCreated** → Email a empresa y cliente
2. **PaymentProcessed** → Confirmación a ambos
3. **Reporte diario** → 9:00 AM todos los días

---

## 🎯 Flujo Completo de Ejemplo

```bash
# 1. Owner registra empresa
cast send $ECOMMERCE_V2_ADDRESS \
  "registerCompany(string,string)(uint256)" \
  "Tech Store" "TAX123" \
  --private-key $COMPANY_PRIVATE_KEY

# 2. Empresa agrega producto
cast send $ECOMMERCE_V2_ADDRESS \
  "addProduct(uint256,string,string,uint256,uint256,string)(uint256)" \
  1 "Laptop" "Gaming laptop" 1000000000 50 "ipfs_hash" \
  --private-key $COMPANY_PRIVATE_KEY

# 3. Empresa se suscribe a notificaciones
curl -X POST http://localhost:6005/api/subscribe/company \
  -d '{"companyId":1,"email":"tech@store.com"}'

# 4. Cliente agrega al carrito
cast send $ECOMMERCE_V2_ADDRESS \
  "addToCart(uint256,uint256)" \
  1 2 \
  --private-key $CUSTOMER_PRIVATE_KEY

# 5. Cliente crea invoice (recibe email)
cast send $ECOMMERCE_V2_ADDRESS \
  "createInvoiceFromCart(uint256)(uint256)" \
  1 \
  --private-key $CUSTOMER_PRIVATE_KEY

# 6. Cliente aprueba y paga (recibe NFT de fidelidad)
cast send $EUROTOKEN_ADDRESS \
  "approve(address,uint256)" \
  $ECOMMERCE_V2_ADDRESS 2000000000 \
  --private-key $CUSTOMER_PRIVATE_KEY

cast send $ECOMMERCE_V2_ADDRESS \
  "processPayment(address,uint256,uint256)" \
  $CUSTOMER_ADDRESS 2000000000 1 \
  --private-key $CUSTOMER_PRIVATE_KEY
# → Empresa recibe 98%, plataforma 2%
# → Cliente recibe Loyalty NFT (nivel Silver si >100 EUR)
# → Ambos reciben email de confirmación

# 7. Cliente deja review
cast send $ECOMMERCE_V2_ADDRESS \
  "addReview(uint256,uint8,string)" \
  1 5 "¡Excelente laptop!" \
  --private-key $CUSTOMER_PRIVATE_KEY

# 8. Empresa ve analytics
cast call $ECOMMERCE_V2_ADDRESS \
  "getCompanyAnalytics(uint256)" \
  1
```

---

## 🔍 Debugging

```bash
# Ver logs de aplicaciones
tail -f compra-stableboin.log
tail -f pasarela-de-pago.log
tail -f notification-service.log
tail -f web-admin.log
tail -f web-customer.log

# Ver logs de Anvil
tail -f anvil.log

# Health check del servicio de notificaciones
curl http://localhost:6005/health
```

---

## 📚 Más Información

- Documentación detallada: [BONUS_EXTENSIONS.md](BONUS_EXTENSIONS.md)
- Docs de extensiones: [sc-ecommerce/EXTENSIONS.md](sc-ecommerce/EXTENSIONS.md)
- Notification service: [notification-service/README.md](notification-service/README.md)
