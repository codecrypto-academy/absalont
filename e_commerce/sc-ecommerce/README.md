# E-commerce Smart Contract

Sistema completo de e-commerce en blockchain con gestión de empresas, productos, carritos e invoices.

## Arquitectura

El contrato utiliza librerías para modularizar la funcionalidad:

- **CompanyLib**: Gestión de empresas
- **ProductLib**: Gestión de productos y stock
- **CartLib**: Carrito de compras
- **InvoiceLib**: Facturas
- **PaymentLib**: Procesamiento de pagos con ERC20

## Instalación

```bash
# Instalar dependencias
forge install OpenZeppelin/openzeppelin-contracts
```

## Compilación

```bash
forge build
```

## Tests

```bash
# Ejecutar todos los tests
forge test

# Con detalles
forge test -vvv

# Test específico
forge test --match-test testFullFlow -vvv
```

## Deploy

```bash
# 1. Asegúrate de tener Anvil corriendo
anvil

# 2. Crear .env con las variables necesarias
cat > .env << EOF
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
EUROTOKEN_ADDRESS=<dirección_del_token_deployado>
EOF

# 3. Deploy
forge script script/DeployEcommerce.s.sol --rpc-url http://localhost:8545 --broadcast
```

## Funcionalidades

### Empresas

- Registrar empresa
- Obtener información de empresa
- Actualizar empresa

### Productos

- Agregar producto (solo owner de empresa)
- Actualizar producto
- Ver productos por empresa
- Ver todos los productos
- Control automático de stock

### Carrito

- Agregar productos
- Remover productos
- Actualizar cantidades
- Ver carrito
- Calcular total

### Invoices

- Crear invoice desde carrito
- Ver invoice
- Ver items de invoice
- Ver invoices por cliente
- Ver invoices por empresa

### Pagos

- Procesar pago con tokens
- Transferencia automática al comerciante
- Actualización de estado de invoice

## Ejemplo de Uso

```solidity
// 1. Registrar empresa
uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

// 2. Agregar producto
uint256 productId = ecommerce.addProduct(
    companyId,
    "Producto A",
    "Descripción",
    10000000, // 10 EUR (6 decimales)
    100,      // Stock
    "ipfs_hash"
);

// 3. Cliente agrega al carrito
ecommerce.addToCart(productId, 2);

// 4. Crear invoice
uint256 invoiceId = ecommerce.createInvoiceFromCart(companyId);

// 5. Aprobar tokens y pagar
token.approve(address(ecommerce), 20000000);
ecommerce.processPayment(msg.sender, 20000000, invoiceId);
```

## Estructura

```
sc-ecommerce/
├── src/
│   ├── Ecommerce.sol              # Contrato principal
│   └── libraries/
│       ├── CompanyLib.sol         # Gestión empresas
│       ├── ProductLib.sol         # Gestión productos
│       ├── CartLib.sol            # Carrito
│       ├── InvoiceLib.sol         # Facturas
│       └── PaymentLib.sol         # Pagos
├── test/
│   └── Ecommerce.t.sol            # Tests completos
└── script/
    └── DeployEcommerce.s.sol      # Script de deploy
```
