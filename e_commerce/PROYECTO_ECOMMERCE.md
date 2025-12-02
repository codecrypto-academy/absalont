# Proyecto E-Commerce con Blockchain y Stablecoins

## Descripción General

Este proyecto es un sistema completo de e-commerce basado en blockchain que integra:
- Creación y gestión de una stablecoin (EuroToken)
- Compra de stablecoins con tarjeta de crédito (Stripe)
- Pasarela de pagos con criptomonedas
- Smart contracts para gestión de comercio electrónico
- Aplicación web de administración para empresas
- Aplicación web para clientes finales

## Arquitectura del Proyecto

```
30_eth_database_ecommerce/
├── stablecoin/
│   ├── sc/                          # Smart Contract EuroToken
│   ├── compra-stableboin/           # App para comprar tokens con Stripe
│   └── pasarela-de-pago/            # Pasarela de pagos con tokens
├── sc-ecommerce/                    # Smart Contract E-commerce
├── web-admin/                       # Panel de administración
├── web-customer/                    # Tienda online para clientes
└── restart-all.sh                   # Script de deploy completo
```

## Tecnologías Utilizadas

### Blockchain y Smart Contracts
- **Solidity**: Lenguaje para smart contracts
- **Foundry/Forge**: Framework de desarrollo y testing
- **Anvil**: Blockchain local para desarrollo
- **Ethers.js v6**: Librería para interactuar con Ethereum

### Frontend
- **Next.js 15**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos
- **MetaMask**: Wallet de criptomonedas

### Pagos
- **Stripe**: Procesamiento de pagos fiat
- **ERC20**: Estándar de token para EuroToken

---

## Parte 1: Smart Contract - EuroToken (Stablecoin)

### Objetivo
Crear un token ERC20 que represente euros digitales (1 EURT = 1 EUR).

### Ubicación
`stablecoin/sc/src/EuroToken.sol`

### Características Principales
```solidity
// Token ERC20 con funcionalidad de mint
contract EuroToken is ERC20 {
    address public owner;

    // Función para crear nuevos tokens (solo owner)
    function mint(address to, uint256 amount) external onlyOwner

    // Decimales: 6 (para representar centavos de euro)
    function decimals() public pure returns (uint8) {
        return 6;
    }
}
```

### Tareas del Estudiante

1. **Implementar el contrato EuroToken**
   - Heredar de OpenZeppelin ERC20
   - Configurar decimales en 6
   - Implementar función `mint` con control de acceso
   - Agregar eventos para auditoría

2. **Escribir tests**
   - Test de deploy
   - Test de mint por owner
   - Test de mint por no-owner (debe fallar)
   - Test de transferencias entre cuentas

3. **Script de deploy**
   - Crear script `DeployEuroToken.s.sol`
   - Deployar en red local (Anvil)
   - Hacer mint inicial de 1,000,000 tokens

### Comandos Útiles
```bash
# Compilar
forge build

# Tests
forge test

# Deploy local
forge script script/DeployEuroToken.s.sol --rpc-url http://localhost:8545 --broadcast

# Verificar balance
cast call DIRECCION_TOKEN "balanceOf(address)(uint256)" DIRECCION_CUENTA --rpc-url http://localhost:8545
```

---

## Parte 2: Aplicación de Compra de Stablecoins

### Objetivo
Permitir a usuarios comprar EuroTokens usando tarjeta de crédito (Stripe).

### Ubicación
`stablecoin/compra-stableboin/`

### Flujo del Usuario
1. Usuario conecta MetaMask
2. Ingresa cantidad de tokens a comprar (ej: 100 EUR = 100 EURT)
3. Paga con tarjeta de crédito vía Stripe
4. Backend hace mint de tokens a la wallet del usuario

### Componentes Principales

#### Frontend (Next.js)
```typescript
// Componente de compra
export default function EuroTokenPurchase() {
  // 1. Conectar MetaMask
  // 2. Crear Payment Intent con Stripe
  // 3. Mostrar formulario de pago
  // 4. Al completar pago → mint tokens
}
```

#### Backend (API Routes)
```typescript
// /api/create-payment-intent
// Crear intención de pago en Stripe

// /api/mint-tokens
// Hacer mint de tokens después de pago exitoso
```

### Tareas del Estudiante

1. **Setup de Stripe**
   - Crear cuenta de prueba en Stripe
   - Obtener API keys (publishable y secret)
   - Configurar webhooks

2. **Implementar Frontend**
   - Componente de conexión MetaMask
   - Formulario para ingresar cantidad
   - Integración con Stripe Elements
   - Mostrar balance de tokens

3. **Implementar Backend**
   - Endpoint para crear Payment Intent
   - Endpoint para mint de tokens
   - Webhook para confirmar pagos
   - Seguridad: validar que el pago fue exitoso antes de mint

4. **Testing**
   - Usar tarjetas de prueba de Stripe
   - Verificar que tokens se acreditan correctamente
   - Probar manejo de errores

### Variables de Entorno
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
WALLET_PRIVATE_KEY=0x... # Para hacer mint desde backend
```

---

## Parte 3: Pasarela de Pagos

### Objetivo
Permitir pagos con EuroTokens entre clientes y comerciantes.

### Ubicación
`stablecoin/pasarela-de-pago/`

### Flujo de Pago
1. Usuario es redirigido desde tienda con datos de pago
2. Conecta MetaMask
3. Confirma monto y destinatario
4. Aprueba transferencia de tokens
5. Se ejecuta pago a través del contrato Ecommerce
6. Redirige de vuelta a la tienda

### Parámetros URL
```
http://localhost:6002/?
  merchant_address=0x...      # Dirección del comerciante
  amount=100.50              # Monto en EUR
  invoice=INV-001            # ID de factura
  date=2025-10-15            # Fecha
  redirect=http://...        # URL de retorno
```

### Tareas del Estudiante

1. **Implementar UI de Pago**
   - Mostrar detalles del pago
   - Botón para conectar MetaMask
   - Verificar saldo suficiente
   - Mostrar estado de transacción

2. **Integración con Smart Contracts**
   - Aprobar gasto de tokens al contrato Ecommerce
   - Llamar a `processPayment` del contrato
   - Esperar confirmación de transacción
   - Actualizar estado de invoice

3. **Manejo de Errores**
   - Saldo insuficiente → mostrar link para comprar tokens
   - Rechazo de transacción
   - Timeout de red

4. **Redirección**
   - Redirigir automáticamente después de pago exitoso
   - Pasar parámetros de resultado al comercio

---

## Parte 4: Smart Contract E-commerce

### Objetivo
Gestionar empresas, productos, carritos de compra e invoices en blockchain.

### Ubicación
`sc-ecommerce/src/Ecommerce.sol`

### Arquitectura
```
Ecommerce.sol (Contrato principal)
├── CompanyLib.sol        # Gestión de empresas
├── ProductLib.sol        # Gestión de productos
├── CustomerLib.sol       # Gestión de clientes
├── CartLib.sol          # Carrito de compras
├── InvoiceLib.sol       # Facturas
└── PaymentLib.sol       # Procesamiento de pagos
```

### Estructuras de Datos

#### Company
```solidity
struct Company {
    uint256 companyId;
    string name;
    address companyAddress;  // Wallet donde recibe pagos
    string taxId;
    bool isActive;
}
```

#### Product
```solidity
struct Product {
    uint256 productId;
    uint256 companyId;
    string name;
    string description;
    uint256 price;           // En centavos de euro (6 decimals)
    uint256 stock;
    string ipfsImageHash;
    bool isActive;
}
```

#### Invoice
```solidity
struct Invoice {
    uint256 invoiceId;
    uint256 companyId;
    address customerAddress;
    uint256 totalAmount;
    uint256 timestamp;
    bool isPaid;
    bytes32 paymentTxHash;
}
```

### Funciones Principales

```solidity
// Empresas
function registerCompany(string name, string taxId) returns (uint256)
function getCompany(uint256 companyId) returns (Company)

// Productos
function addProduct(companyId, name, description, price, stock) returns (uint256)
function updateProduct(productId, price, stock)
function getAllProducts() returns (Product[])

// Carrito
function addToCart(uint256 productId, uint256 quantity)
function getCart(address customer) returns (CartItem[])
function clearCart(address customer)

// Invoices
function createInvoice(address customer, uint256 companyId) returns (uint256)
function processPayment(address customer, uint256 amount, uint256 invoiceId)
function getInvoice(uint256 invoiceId) returns (Invoice)
```

### Tareas del Estudiante

1. **Implementar Librerías**
   - CompanyLib: CRUD de empresas
   - ProductLib: CRUD de productos con control de stock
   - CartLib: Agregar/quitar productos, calcular total
   - InvoiceLib: Crear facturas desde carrito
   - PaymentLib: Procesar pagos con EuroToken

2. **Implementar Contrato Principal**
   - Integrar todas las librerías
   - Controles de acceso (solo owner de empresa puede modificar)
   - Eventos para cada operación importante
   - Validaciones de negocio

3. **Tests Completos**
   - Test de registro de empresa
   - Test de agregar producto
   - Test de flujo completo: agregar al carrito → crear invoice → pagar
   - Test de control de stock
   - Test de permisos

4. **Optimizaciones**
   - Usar mapping para búsquedas O(1)
   - Minimizar storage writes
   - Gas optimization

---

## Parte 5: Web Admin (Panel de Administración)

### Objetivo
Panel para que empresas gestionen productos, vean facturas y clientes.

### Ubicación
`web-admin/`

### Funcionalidades

#### 1. Gestión de Empresas
- Registrar nueva empresa
- Ver lista de empresas
- Editar información de empresa

#### 2. Gestión de Productos
- Agregar producto (nombre, precio, stock, imagen)
- Editar producto
- Activar/desactivar producto
- Ver stock disponible

#### 3. Gestión de Facturas
- Ver todas las facturas de la empresa
- Filtrar por estado (pagada/pendiente)
- Ver detalles de cada factura
- Ver transacción en blockchain

#### 4. Clientes
- Ver lista de clientes
- Historial de compras por cliente

### Componentes Principales

```typescript
// Conexión de Wallet
function WalletConnect() {
  // Conectar MetaMask
  // Mostrar dirección y balance
}

// Registro de Empresa
function CompanyRegistration() {
  // Formulario para registrar empresa
  // Solo si wallet conectada no tiene empresa
}

// Lista de Productos
function ProductList({ companyId }) {
  // Cargar productos del contrato
  // Botones para editar/eliminar
}

// Formulario de Producto
function ProductForm({ companyId, productId? }) {
  // Agregar o editar producto
  // Upload de imagen a IPFS
}
```

### Tareas del Estudiante

1. **Setup del Proyecto**
   - Configurar Next.js con TypeScript
   - Instalar Ethers.js y dependencias
   - Configurar Tailwind CSS
   - Setup de variables de entorno

2. **Implementar Hooks**
   - `useWallet`: Gestión de conexión MetaMask
   - `useContract`: Instanciar contratos
   - `useCompany`: Datos de empresa
   - `useProducts`: Lista de productos

3. **Implementar Páginas**
   - `/`: Dashboard principal
   - `/companies`: Lista y registro de empresas
   - `/company/[id]`: Detalle de empresa con tabs
   - `/company/[id]/products`: Gestión de productos
   - `/company/[id]/invoices`: Lista de facturas

4. **Validaciones**
   - Solo owner de empresa puede editar
   - Validar que wallet esté conectada
   - Validar red correcta (localhost/31337)
   - Manejo de errores de transacciones

5. **UX/UI**
   - Dark mode support
   - Responsive design
   - Loading states
   - Mensajes de éxito/error
   - Confirmaciones antes de transacciones

---

## Parte 6: Web Customer (Tienda Online)

### Objetivo
Tienda online donde clientes compran productos con EuroTokens.

### Ubicación
`web-customer/`

### Funcionalidades

#### 1. Catálogo de Productos
- Ver todos los productos disponibles
- Filtrar por empresa
- Ver precio y stock
- Agregar al carrito

#### 2. Carrito de Compras
- Ver productos en carrito
- Modificar cantidades
- Ver total
- Proceder al pago

#### 3. Checkout
- Crear invoice desde carrito
- Redirigir a pasarela de pago
- Limpiar carrito después de crear invoice

#### 4. Mis Facturas
- Ver historial de compras
- Ver estado de pago
- Ver detalles de cada factura

### Flujo de Compra

```
1. Usuario navega productos
   ↓
2. Agrega productos al carrito
   ↓
3. Va a /cart y hace checkout
   ↓
4. Se crea Invoice en blockchain
   ↓
5. Carrito se limpia
   ↓
6. Redirige a pasarela de pago
   ↓
7. Usuario paga con tokens
   ↓
8. Regresa a /orders (invoices)
   ↓
9. Ve invoice marcada como "Paid"
```

### Componentes Principales

```typescript
// Lista de Productos
function ProductsPage() {
  // Cargar productos (sin necesidad de wallet)
  // Botón "Add to Cart" (requiere wallet)
}

// Carrito
function CartPage() {
  // Mostrar items del carrito
  // Calcular total
  // Botón "Checkout" → crear invoice
}

// Mis Facturas
function OrdersPage() {
  // Cargar facturas del cliente
  // Mostrar estado (Paid/Pending)
  // Ver detalles
}
```

### Tareas del Estudiante

1. **Implementar Catálogo**
   - Cargar productos sin wallet (read-only)
   - Diseño de tarjetas de producto
   - Paginación o infinite scroll
   - Sistema de búsqueda/filtros

2. **Implementar Carrito**
   - Hook `useCart` para gestión de estado
   - Agregar/quitar/actualizar productos
   - Persistencia en blockchain
   - Calcular total

3. **Implementar Checkout**
   - Agrupar items por empresa
   - Crear invoice llamando al contrato
   - Esperar confirmación de transacción
   - Construir URL de pasarela de pago
   - Limpiar carrito
   - Redirigir a pasarela

4. **Implementar Historial**
   - Cargar invoices del usuario
   - Mostrar detalles de cada invoice
   - Indicador visual de estado (Paid/Pending)
   - Link a transacción en blockchain

5. **Optimizaciones**
   - Cache de productos
   - Optimistic updates en carrito
   - Loading skeletons
   - Error boundaries

---

## Parte 7: Integración Completa

### Script de Deploy Automatizado

El archivo `restart-all.sh` automatiza todo el proceso:

```bash
#!/bin/bash

# 1. Detener aplicaciones anteriores
# 2. Iniciar Anvil (blockchain local)
# 3. Deploy EuroToken
# 4. Deploy Ecommerce
# 5. Actualizar variables de entorno
# 6. Iniciar todas las aplicaciones
```

### Variables de Entorno por Aplicación

#### compra-stableboin
```env
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

#### pasarela-de-pago
```env
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
```

#### web-admin
```env
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
```

#### web-customer
```env
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
```

### Puertos de las Aplicaciones
- Anvil: `http://localhost:8545`
- Compra Stablecoin: `http://localhost:6001`
- Pasarela de Pago: `http://localhost:6002`
- Web Admin: `http://localhost:6003`
- Web Customer: `http://localhost:6004`

---

## Parte 8: Testing del Sistema Completo

### Escenario de Prueba Completo

1. **Setup Inicial**
   ```bash
   # Iniciar todo el sistema
   ./restart-all.sh

   # Obtener addresses de los contratos desplegados
   # (se muestran al final del script)
   ```

2. **Comprar Tokens**
   - Ir a `http://localhost:6001`
   - Conectar MetaMask
   - Comprar 1000 EURT con tarjeta de prueba
   - Verificar balance en MetaMask

3. **Registrar Empresa (Admin)**
   - Ir a `http://localhost:6003`
   - Conectar con cuenta de empresa
   - Registrar empresa "Mi Tienda"
   - Agregar productos:
     - Producto A: €10, Stock: 100
     - Producto B: €25, Stock: 50

4. **Comprar Productos (Customer)**
   - Ir a `http://localhost:6004`
   - Ver catálogo de productos
   - Conectar wallet de cliente
   - Agregar Producto A (qty: 2) al carrito
   - Agregar Producto B (qty: 1) al carrito
   - Ir a carrito
   - Hacer checkout → crea invoice
   - Redirige a pasarela de pago

5. **Pagar en Pasarela**
   - Ver detalles del pago (€45)
   - Conectar MetaMask (cuenta cliente)
   - Verificar saldo suficiente
   - Confirmar pago
   - Aprobar gasto de tokens
   - Confirmar transacción processPayment
   - Ver confirmación de pago exitoso

6. **Verificar Invoice**
   - Redirige a `http://localhost:6004/orders`
   - Ver invoice marcada como "Paid"
   - Ver detalles de la compra

7. **Verificar Empresa (Admin)**
   - Volver a `http://localhost:6003`
   - Ver invoice en panel de empresa
   - Verificar balance de tokens recibidos
   - Ver stock actualizado:
     - Producto A: 98
     - Producto B: 49

### Tareas del Estudiante

1. **Documentar Pruebas**
   - Crear documento con capturas de pantalla
   - Documentar cada paso del flujo
   - Anotar hashes de transacciones
   - Verificar estados en blockchain

2. **Testing de Errores**
   - Intentar pagar sin saldo
   - Intentar agregar producto sin wallet
   - Intentar modificar producto de otra empresa
   - Producto sin stock

3. **Testing de Edge Cases**
   - Múltiples productos de diferentes empresas
   - Cancelar pago en pasarela
   - Cambiar de cuenta en MetaMask
   - Recarga de página durante proceso

---

## Recursos Adicionales

### Documentación
- [Solidity Docs](https://docs.soliditylang.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Ethers.js v6](https://docs.ethers.org/v6/)
- [Next.js Docs](https://nextjs.org/docs)
- [Stripe Docs](https://stripe.com/docs)

### Herramientas
- [Remix IDE](https://remix.ethereum.org/) - IDE online para Solidity
- [MetaMask](https://metamask.io/) - Wallet de criptomonedas
- [IPFS](https://ipfs.io/) - Almacenamiento descentralizado

### Comandos Útiles

```bash
# Foundry
forge build                    # Compilar contratos
forge test                     # Ejecutar tests
forge test -vvv               # Tests con logs detallados
forge fmt                      # Formatear código
forge clean                    # Limpiar builds

# Anvil
anvil                          # Iniciar blockchain local
anvil --accounts 10           # Con 10 cuentas precargadas

# Cast (interactuar con contratos)
cast call ADDRESS "functionName()" --rpc-url http://localhost:8545
cast send ADDRESS "functionName(args)" --private-key 0x... --rpc-url http://localhost:8545

# Next.js
npm run dev                    # Iniciar dev server
npm run build                  # Build para producción
npm run start                  # Ejecutar build
```

---

## Evaluación del Proyecto

### Criterios de Evaluación

1. **Smart Contracts (30%)**
   - Implementación correcta de ERC20
   - Arquitectura de librerías
   - Tests completos
   - Optimización de gas
   - Seguridad y validaciones

2. **Integración Blockchain (20%)**
   - Conexión con MetaMask
   - Manejo de transacciones
   - Manejo de errores
   - Eventos y logs

3. **Funcionalidad (25%)**
   - Todas las features funcionando
   - Flujo completo de compra
   - Gestión de estado
   - Persistencia de datos

4. **UX/UI (15%)**
   - Diseño intuitivo
   - Responsive
   - Loading states
   - Mensajes claros

5. **Documentación (10%)**
   - README completo
   - Comentarios en código
   - Documentación de API
   - Guía de usuario

---

## Entregables

1. **Código Fuente**
   - Repositorio Git con todo el código
   - Commits significativos
   - Branches organizadas

2. **Documentación**
   - README con instrucciones de instalación
   - Diagramas de arquitectura
   - Documentación de contratos
   - Guía de usuario

3. **Demo**
   - Video demo (5-10 minutos)
   - Presentación del proyecto
   - Explicación de decisiones técnicas

4. **Tests**
   - Coverage mínimo 80%
   - Tests de integración
   - Reporte de tests

---

## Extensiones Opcionales (Bonus)

1. **Multi-moneda**
   - Agregar más stablecoins (USDT, DAI)
   - Exchange entre monedas

2. **Sistema de Reviews**
   - Clientes pueden dejar reseñas
   - Rating de productos

3. **Programa de Fidelidad**
   - NFTs como recompensas
   - Descuentos para clientes frecuentes

4. **Marketplace Multi-vendor**
   - Múltiples empresas en una plataforma
   - Comisiones de plataforma

5. **Notificaciones**
   - Email cuando se crea invoice
   - Push notifications para pagos

6. **Analytics Dashboard**
   - Gráficos de ventas
   - Productos más vendidos
   - Métricas de negocio

---

## Conclusión

Este proyecto integra múltiples tecnologías modernas:
- Blockchain y Smart Contracts
- DeFi (stablecoins)
- Pagos tradicionales (Stripe)
- Full-stack web development
- TypeScript y React

Al completarlo, el estudiante tendrá experiencia práctica en:
- Desarrollo de smart contracts seguros
- Integración con wallets de criptomonedas
- Desarrollo de DApps
- Arquitectura de aplicaciones descentralizadas
- Testing en blockchain
- UX para aplicaciones crypto
