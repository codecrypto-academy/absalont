# Proyecto E-Commerce con Blockchain y Stablecoins

Sistema completo de e-commerce basado en blockchain que integra stablecoins (EuroToken), pagos con criptomonedas y gestión de comercio electrónico mediante smart contracts.

## 🏗️ Arquitectura del Proyecto

```
e_commerce/
├── stablecoin/
│   ├── sc/                          # Smart Contract EuroToken (ERC20)
│   ├── compra-stableboin/           # App para comprar tokens con Stripe
│   └── pasarela-de-pago/            # Pasarela de pagos con tokens
├── sc-ecommerce/                    # Smart Contract E-commerce
├── web-admin/                       # Panel de administración (en desarrollo)
├── web-customer/                    # Tienda online (en desarrollo)
├── restart-all.sh                   # Script de deploy completo
└── PROYECTO.md                      # Especificación completa
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- Foundry (Forge, Anvil, Cast)
- MetaMask instalado en el navegador

### Instalación de Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Ejecutar Todo el Sistema

```bash
# Dar permisos de ejecución
chmod +x restart-all.sh

# Ejecutar script de deploy e inicio
./restart-all.sh
```

Este script:
1. Inicia blockchain local (Anvil)
2. Despliega smart contracts (EuroToken y Ecommerce)
3. Configura variables de entorno
4. Inicia todas las aplicaciones

## 📦 Componentes del Sistema

### 1. EuroToken (Stablecoin)

**Ubicación**: `stablecoin/sc/`

Token ERC20 que representa euros digitales (1 EURT = 1 EUR).

```bash
cd stablecoin/sc
forge build
forge test
```

**Características**:
- Estándar ERC20
- 6 decimales (centavos de euro)
- Función mint controlada por owner
- Eventos de auditoría

### 2. Aplicación de Compra de Tokens

**Ubicación**: `stablecoin/compra-stableboin/`  
**Puerto**: 6001

Permite comprar EuroTokens con tarjeta de crédito vía Stripe.

```bash
cd stablecoin/compra-stableboin
npm install
npm run dev
```

**Flujo**:
1. Usuario conecta MetaMask
2. Ingresa cantidad de EUR a comprar
3. Paga con tarjeta (Stripe)
4. Recibe EURT en su wallet

### 3. Pasarela de Pagos

**Ubicación**: `stablecoin/pasarela-de-pago/`  
**Puerto**: 6002

Procesa pagos con EuroTokens entre clientes y comerciantes.

```bash
cd stablecoin/pasarela-de-pago
npm install
npm run dev
```

**Uso**:
```
http://localhost:6002/?merchant_address=0x...&amount=100&invoice=INV-001
```

### 4. Smart Contract E-commerce

**Ubicación**: `sc-ecommerce/`

Sistema completo de e-commerce en blockchain.

```bash
cd sc-ecommerce
forge build
forge test
```

**Funcionalidades**:
- Gestión de empresas
- CRUD de productos
- Carrito de compras
- Sistema de facturas
- Procesamiento de pagos

**Librerías**:
- `CompanyLib`: Gestión de empresas
- `ProductLib`: Gestión de productos y stock
- `CartLib`: Carrito de compras
- `InvoiceLib`: Facturas
- `PaymentLib`: Procesamiento de pagos

### 5. Web Admin (En Desarrollo)

**Puerto**: 6003

Panel de administración para empresas.

**Funcionalidades planeadas**:
- Registro de empresas
- Gestión de productos
- Ver facturas
- Gestión de clientes

### 6. Web Customer (En Desarrollo)

**Puerto**: 6004

Tienda online para clientes.

**Funcionalidades planeadas**:
- Catálogo de productos
- Carrito de compras
- Checkout
- Historial de compras

## 🧪 Testing

### Smart Contracts

```bash
# EuroToken
cd stablecoin/sc
forge test -vvv

# Ecommerce
cd sc-ecommerce
forge test -vvv
```

## 🎁 Extensiones Bonus Implementadas

### 1. ✅ Sistema de Reviews
- Calificación de 1-5 estrellas
- Comentarios en productos
- Rating promedio calculado automáticamente
- Un review por cliente por producto

### 2. ✅ Programa de Fidelidad NFT
- NFTs soulbound (no transferibles)
- 4 niveles: Bronze, Silver, Gold, Platinum
- Descuentos automáticos: 0%, 5%, 10%, 15%
- Upgrade automático según gasto total

### 3. ✅ Multi-moneda
- Soporte para múltiples stablecoins (USDT, DAI, etc.)
- Conversión automática a EUR
- Tasas de cambio configurables

### 4. ✅ Analytics Dashboard
- Métricas de ventas en tiempo real
- Productos más vendidos
- Gráficos de ventas diarias
- Estadísticas por cliente

### 5. ✅ Marketplace Multi-vendor
- Múltiples empresas en una plataforma
- Comisión de plataforma (default 2%)
- Distribución automática de pagos

### 6. ✅ Sistema de Notificaciones
- Emails cuando se crea invoice
- Notificaciones de pagos recibidos
- Reportes diarios automáticos
- Servicio independiente en Node.js

Ver detalles completos en [EXTENSIONS.md](sc-ecommerce/EXTENSIONS.md)

## 🔧 Configuración

### Variables de Entorno

Cada aplicación necesita su archivo `.env`. El script `restart-all.sh` los configura automáticamente.

**Ejemplo para compra-stableboin**:
```env
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
WALLET_PRIVATE_KEY=0x...
```

### Cuentas de Prueba (Anvil)

El script `restart-all.sh` muestra las cuentas disponibles. Por defecto:

- **Account #0** (Deployer/Owner):
  - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

- **Account #1**:
  - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
  - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

### Configurar MetaMask

1. Agregar red local:
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. Importar cuenta de prueba usando la private key

## 🎯 Flujo Completo de Uso

### 1. Comprar Tokens

1. Ir a `http://localhost:6001`
2. Conectar MetaMask
3. Comprar tokens (usar tarjeta de prueba Stripe: `4242 4242 4242 4242`)
4. Verificar balance en MetaMask

### 2. Registrar Empresa (Usando Cast)

```bash
cast send $ECOMMERCE_ADDRESS \
  "registerCompany(string,string)(uint256)" \
  "Mi Tienda" "TAX123" \
  --private-key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d \
  --rpc-url http://localhost:8545
```

### 3. Agregar Productos

```bash
cast send $ECOMMERCE_ADDRESS \
  "addProduct(uint256,string,string,uint256,uint256,string)(uint256)" \
  1 "Producto A" "Descripción" 10000000 100 "ipfs_hash" \
  --private-key <empresa_private_key> \
  --rpc-url http://localhost:8545
```

### 4. Comprar (Flujo Completo)

1. Agregar al carrito
2. Crear invoice
3. Pagar en pasarela de pago

## 📚 Documentación Adicional

- Cada componente tiene su propio README con detalles específicos
- Ver `PROYECTO.md` para la especificación completa del proyecto
- Los smart contracts incluyen comentarios NatSpec

## 🛠️ Comandos Útiles

```bash
# Detener todo
pkill -f anvil && pkill -f "next dev"

# Ver logs de Anvil
tail -f anvil.log

# Ver logs de aplicación
tail -f compra-stableboin.log
tail -f pasarela-de-pago.log

# Verificar balance de tokens
cast call $EUROTOKEN_ADDRESS \
  "balanceOf(address)(uint256)" \
  <address> \
  --rpc-url http://localhost:8545

# Ver productos
cast call $ECOMMERCE_ADDRESS \
  "getProductCount()(uint256)" \
  --rpc-url http://localhost:8545
```

## 🔐 Seguridad

**⚠️ IMPORTANTE**: Este proyecto es para desarrollo y educación.

- Las private keys están expuestas para facilitar el desarrollo
- Stripe keys deben ser de prueba
- NO usar en producción sin auditoría de seguridad

## 🐛 Troubleshooting

### "Port already in use"

```bash
# Encontrar y matar proceso
lsof -ti:6001 | xargs kill -9
```

### "Contract not deployed"

Ejecutar nuevamente `restart-all.sh`

### MetaMask no se conecta

Verificar que la red esté configurada con Chain ID `31337`

## 📝 Estado del Proyecto

✅ **Completado**:
- EuroToken smart contract
- Tests de EuroToken
- Aplicación de compra de tokens
- Pasarela de pagos
- E-commerce smart contract con librerías
- Tests de E-commerce
- Script de deploy automático

✅ **Extensiones Bonus Completadas**:
- Sistema de Reviews
- Programa de Fidelidad NFT
- Multi-moneda (USDT, DAI, etc.)
- Analytics Dashboard
- Marketplace Multi-vendor
- Sistema de Notificaciones

🚧 **En Desarrollo**:
- Web Admin (panel de administración - estructura básica + componentes)
- Web Customer (tienda online - estructura básica + componentes)

## 🤝 Contribuir

Este es un proyecto educativo. Para contribuir:

1. Fork el proyecto
2. Crear rama de feature
3. Hacer commit de cambios
4. Push a la rama
5. Abrir Pull Request

## 📄 Licencia

MIT License - Ver detalles en cada archivo fuente

## 👨‍💻 Tecnologías Utilizadas

- **Blockchain**: Solidity, Foundry, Anvil
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Blockchain Integration**: Ethers.js v6
- **Payments**: Stripe
- **Wallet**: MetaMask

## 📞 Soporte

Para preguntas sobre el proyecto, revisar:
1. README de cada componente
2. PROYECTO.md (especificación completa)
3. Tests de los smart contracts
4. Issues en GitHub

---

## 🌟 Resumen Visual de Extensiones

| Extensión | Estado | Características | Archivos |
|-----------|--------|-----------------|----------|
| **Reviews** ⭐ | ✅ | Rating 1-5, Comentarios, Promedio automático | `ReviewLib.sol`, `ReviewForm.tsx`, `ProductReviews.tsx` |
| **Loyalty NFT** 🎁 | ✅ | 4 niveles, Descuentos 0-15%, Soulbound | `LoyaltyNFT.sol`, `LoyaltyCard.tsx` |
| **Multi-moneda** 💱 | ✅ | USDT, DAI, conversión EUR, tasas config | `MultiCurrencyLib.sol` |
| **Analytics** 📊 | ✅ | Ventas, Revenue, Top productos, Gráficos | `AnalyticsLib.sol`, `AnalyticsDashboard.tsx` |
| **Multi-vendor** 🏪 | ✅ | Comisión 2%, Múltiples empresas | `EcommerceV2.sol` |
| **Notificaciones** 📧 | ✅ | Emails, Reportes diarios, Node.js | `notification-service/` |

Ver documentación completa: [BONUS_EXTENSIONS.md](BONUS_EXTENSIONS.md)

---

Desarrollado con ❤️ para aprender sobre blockchain, DeFi y desarrollo de DApps
