# Extensiones Bonus - E-commerce V2

Este directorio contiene las implementaciones de las extensiones opcionales del proyecto.

## 🎁 Funcionalidades Implementadas

### 1. ✅ Sistema de Reviews

**Archivo**: `src/libraries/ReviewLib.sol`

Permite a los clientes dejar reseñas y calificaciones de productos.

**Características**:
- Rating de 1-5 estrellas
- Comentarios de hasta 500 caracteres
- Un review por cliente por producto
- Cálculo automático de promedio de rating
- Actualización y eliminación de reviews

**Funciones principales**:
```solidity
function addReview(productId, rating, comment) returns (reviewId)
function getProductRating(productId) returns (average, count)
function getProductReviews(productId) returns (reviewIds[])
```

### 2. ✅ Programa de Fidelidad con NFTs

**Archivo**: `src/LoyaltyNFT.sol`

NFTs no transferibles (soulbound) que representan tarjetas de fidelidad con niveles.

**Niveles y Beneficios**:
- 🥉 **BRONZE**: 0% descuento (inicial)
- 🥈 **SILVER**: 5% descuento (≥100 EUR gastados)
- 🥇 **GOLD**: 10% descuento (≥500 EUR gastados)
- 💎 **PLATINUM**: 15% descuento (≥1000 EUR gastados)

**Características**:
- Puntos acumulativos (1 punto = 1 EUR gastado)
- Upgrade automático de nivel según gasto total
- NFT no transferible (vinculado al cliente)
- Descuentos aplicados automáticamente en checkout

### 3. ✅ Multi-moneda

**Archivo**: `src/libraries/MultiCurrencyLib.sol`

Soporte para múltiples stablecoins con conversión automática a EUR.

**Características**:
- Agregar múltiples tokens (USDT, DAI, etc.)
- Tasas de cambio configurables
- Conversión automática a EUR
- Pagos con cualquier token soportado

**Uso**:
```solidity
// Agregar USDT
addSupportedToken(usdtAddress, "USDT", 6, 1050000) // 1 USDT = 1.05 EUR

// Pagar con USDT
processPaymentWithToken(customer, amount, invoiceId, usdtAddress)
```

### 4. ✅ Analytics Dashboard

**Archivo**: `src/libraries/AnalyticsLib.sol`

Sistema de análisis y métricas de negocio en blockchain.

**Métricas disponibles**:
- Ventas totales por empresa
- Revenue total
- Número de órdenes
- Ventas por producto
- Ventas diarias
- Gasto por cliente

**Funciones**:
```solidity
function getCompanyAnalytics(companyId) returns (totalSales, totalRevenue, totalOrders)
function getProductSales(companyId, productId) returns (quantity)
function getDailySales(companyId, dayTimestamp) returns (revenue)
```

### 5. ✅ Marketplace Multi-vendor

Implementado directamente en `EcommerceV2.sol`

**Características**:
- Múltiples empresas en una plataforma
- Comisión de plataforma configurable (default 2%)
- Distribución automática de pagos
- Sistema de fees acumulados

**Configuración**:
```solidity
setPlatformFee(2) // 2% de comisión
withdrawPlatformFees(tokenAddress) // Retirar fees acumulados
```

## 🚀 Deploy

### Deploy EcommerceV2 con todas las extensiones:

```bash
cd sc-ecommerce

# Asegurarse de tener EUROTOKEN_ADDRESS en .env
forge script script/DeployEcommerceV2.s.sol --rpc-url http://localhost:8545 --broadcast
```

Este script despliega:
1. LoyaltyNFT contract
2. EcommerceV2 contract (con todas las extensiones)
3. Transfiere ownership del NFT al contrato Ecommerce

## 📊 Ejemplos de Uso

### Sistema de Reviews

```solidity
// Cliente deja review después de comprar
ecommerce.addReview(productId, 5, "Excelente producto!");

// Ver rating promedio
(uint256 avgRating, uint256 reviewCount) = ecommerce.getProductRating(productId);
// avgRating = 475 significa 4.75 estrellas

// Ver todos los reviews
uint256[] memory reviewIds = ecommerce.getProductReviews(productId);
```

### Programa de Fidelidad

```solidity
// NFT se mintea automáticamente en primera compra
// Cliente compra por 150 EUR
ecommerce.processPayment(customer, 150 * 10**6, invoiceId);

// Se upgradea automáticamente a SILVER (≥100 EUR)
// Siguiente compra tiene 5% descuento automático
```

### Multi-moneda

```solidity
// Owner agrega USDT (1 USDT = 1.05 EUR)
ecommerce.addSupportedToken(
    usdtAddress,
    "USDT",
    6,
    1050000 // Rate con 6 decimales
);

// Cliente paga con USDT
usdt.approve(ecommerceAddress, amount);
ecommerce.processPaymentWithToken(customer, amount, invoiceId, usdtAddress);
```

### Analytics

```solidity
// Ver métricas de empresa
(uint256 sales, uint256 revenue, uint256 orders) = 
    ecommerce.getCompanyAnalytics(companyId);

// Ver ventas de producto específico
uint256 productSales = ecommerce.getProductSales(companyId, productId);

// Ver ventas de hoy
uint256 today = (block.timestamp / 1 days) * 1 days;
uint256 todaySales = ecommerce.getDailySales(companyId, today);
```

## 🎨 Frontend Components (TODO)

Las extensiones de frontend para web-admin y web-customer incluirían:

### Para Reviews:
- Componente de estrellas para rating
- Lista de reviews con paginación
- Formulario para agregar/editar review
- Promedio de rating en tarjeta de producto

### Para Fidelidad:
- Card mostrando nivel actual (Bronze/Silver/Gold/Platinum)
- Barra de progreso hacia siguiente nivel
- Historial de puntos ganados
- Descuentos aplicados en checkout

### Para Multi-moneda:
- Selector de token para pago
- Preview de conversión
- Lista de tokens soportados con tasas

### Para Analytics:
- Gráficos de ventas (Chart.js/Recharts)
- Tabla de productos más vendidos
- Timeline de ventas diarias
- Métricas de clientes

## 🧪 Testing

```bash
# Tests de todas las extensiones están incluidos
forge test --match-path test/EcommerceV2.t.sol -vvv
```

## 📦 Integración con Proyecto Existente

Para usar EcommerceV2 en lugar de Ecommerce:

1. Actualizar `restart-all.sh` para usar `DeployEcommerceV2.s.sol`
2. Actualizar frontend para usar las nuevas funciones
3. Agregar componentes de reviews y fidelidad en web-customer
4. Agregar analytics dashboard en web-admin

## 🔧 Configuración Recomendada

```solidity
// Después del deploy
ecommerce.setPlatformFee(2); // 2% comisión

// Agregar USDT
ecommerce.addSupportedToken(
    usdtAddress,
    "USDT",
    6,
    1050000 // 1.05 EUR por USDT
);

// Agregar DAI
ecommerce.addSupportedToken(
    daiAddress,
    "DAI",
    18,
    1000000 // 1.00 EUR por DAI
);
```

## 🎯 Beneficios

- **Reviews**: Confianza y transparencia para compradores
- **Fidelidad**: Incentivos para clientes recurrentes
- **Multi-moneda**: Mayor flexibilidad de pago
- **Analytics**: Decisiones basadas en datos
- **Marketplace**: Escalabilidad multi-vendor

## 📚 Recursos Adicionales

- OpenZeppelin ERC721: https://docs.openzeppelin.com/contracts/erc721
- Soulbound Tokens: https://vitalik.ca/general/2022/01/26/soulbound.html
- Multi-sig Patterns: https://docs.gnosis-safe.io/

---

**Nota**: Estas extensiones son totalmente compatibles con el contrato Ecommerce original. El sistema puede funcionar con ambos contratos simultáneamente.
