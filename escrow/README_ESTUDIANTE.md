# 📚 README ESTUDIANTE - Proyecto Escrow DApp

> Guía completa para estudiantes - Fase 2: Smart Contract

## 🎯 Objetivo del Proyecto

Crear una **aplicación descentralizada (DApp)** completa para **intercambios seguros de tokens ERC20** usando un contrato inteligente Escrow.

### ¿Qué es un Escrow?
Un Escrow es un intermediario que **mantiene fondos en custodia** hasta que ambas partes cumplan las condiciones del acuerdo. En este proyecto:

1. **Usuario A** deposita **Token A** en el contrato
2. **Usuario B** acepta completar con **Token B**
3. El contrato ejecuta la **transferencia atómica** de ambos tokens

---

## 📁 Estructura del Proyecto

```
escrow/
│
├── 🔗 SMART CONTRACTS (Foundry - Solidity)
│   └── sc/
│       ├── src/
│       │   ├── Escrow.sol              # Contrato principal
│       │   ├── MockERC20.sol           # Token para testing
│       │   └── interfaces/IEscrow.sol  # Interfaz
│       ├── script/Deploy.s.sol         # Script deployment
│       └── test/Escrow.t.sol           # 23 Tests
│
├── 🎨 FRONTEND (Next.js 14 + React)
│   └── web/
│       └── src/
│           ├── app/                    # Páginas
│           ├── components/             # 6 Componentes React
│           ├── hooks/                  # 5 Hooks personalizados
│           ├── context/                # WalletContext
│           ├── lib/                    # Utilidades
│           └── types/                  # TypeScript types
│
└── 📝 DOCUMENTACIÓN
    ├── README_ESTUDIANTE.md            # ← Este archivo
    ├── QUICK_START.md                  # Guía rápida (5 min)
    ├── ARCHITECTURE.md                 # Arquitectura detallada
    ├── TESTING.md                      # Guía de testing
    ├── DEPLOYMENT.md                   # Deployment a testnet
    ├── setup.sh                        # Script setup
    └── deploy.sh                       # Script deployment automático
```

---

## 🔗 SMART CONTRACT (Escrow.sol)

### Funciones Principales

#### ✅ Admin (Solo Owner)
```solidity
// Agregar token permitido para intercambios
addToken(address _token)

// Remover token permitido
removeToken(address _token)
```

#### ✅ Operaciones (Usuarios)
```solidity
// 1. Crear operación de intercambio
//    - Deposita Token A del usuario al contrato
//    - Requiere aprobación previa
createOperation(
    uint256 _amountA,
    address _recipient,
    uint256 _amountB,
    address _tokenA,
    address _tokenB
) returns (uint256 operationId)

// 2. Completar operación
//    - Solo el recipient puede hacerlo
//    - Transfiere Token B a initiator
//    - Transfiere Token A del contrato a recipient
completeOperation(uint256 _operationId, uint256 _amountB)

// 3. Cancelar operación
//    - Solo el initiator puede hacerlo
//    - Devuelve Token A al initiator
cancelOperation(uint256 _operationId)
```

#### ✅ Lectura
```solidity
// Obtener detalles de una operación
getOperation(uint256 _operationId) returns (Operation memory)

// Obtener total de operaciones
getOperationCount() returns (uint256)

// Obtener lista de operaciones activas
getAllOperations() returns (uint256[] memory)

// Verificar si un token es permitido
isTokenAllowed(address _token) returns (bool)
```

### Estados de Operación
```
PENDING    → Esperando que recipient complete
COMPLETED → Operación completada exitosamente
CANCELLED → Operación cancelada, fondos devueltos
```

### Protecciones de Seguridad
- ✅ **ReentrancyGuard** - Previene ataques reentrancia
- ✅ **Validaciones exhaustivas** - Amounts > 0, addresses válidas, tokens distintos
- ✅ **Checks-Effects-Interactions** - Patrón seguro (cambio estado → transferencias)
- ✅ **Eventos** - Auditoría y tracking de operaciones

### Eventos Emitidos
```solidity
TokenAdded(address indexed token)
OperationCreated(uint256 indexed operationId, ...)
OperationCompleted(uint256 indexed operationId, ...)
OperationCancelled(uint256 indexed operationId, ...)
```

---

## 🎨 FRONTEND (React + TypeScript)

### 6 Componentes Principales

#### 1. **ConnectionButton.tsx**
```typescript
// Botón para conectar/desconectar MetaMask
// Muestra dirección acortada: 0x1234...5678
// Estados: Conectando | Conectado | Desconectado
```

#### 2. **AddToken.tsx** (Admin)
```typescript
// Formulario para agregar tokens permitidos
// Solo el owner (admin) puede usarlo
// Input: Dirección del contrato token (0x...)
```

#### 3. **CreateOperation.tsx**
```typescript
// Formulario para crear operación de swap
// Inputs:
//   - Token A (dirección)
//   - Cantidad A (número)
//   - Token B (dirección)
//   - Cantidad B (número)
//   - Recipient (dirección de usuario B)
// Requiere aprobación de Token A
```

#### 4. **OperationsList.tsx**
```typescript
// Muestra operaciones activas (PENDING)
// Para cada operación:
//   - Si eres recipient: Botón "Completar"
//   - Si eres initiator: Botón "Cancelar"
// Auto-refresh cada 5 segundos
// Muestra estados: PENDING, COMPLETED, CANCELLED
```

#### 5. **BalanceDebug.tsx**
```typescript
// Panel debug para verificar balances
// Funcionalidades:
//   - Tu dirección wallet
//   - Verificar balance de cualquier token
//   - Balance en el contrato escrow
//   - Botón para actualizar
```

#### 6. **WalletSelector.tsx**
```typescript
// Selector de wallet (MetaMask)
// Cambiar cuenta
// Ver balance de la red
```

### 5 Hooks Personalizados

#### 1. **useWallet()**
```typescript
const { account, isConnected, connect, disconnect } = useWallet()
// Acceso al contexto global de wallet
// Conectar/desconectar MetaMask
// Obtener cuenta actual
```

#### 2. **useContract()**
```typescript
const { 
  createOperation, completeOperation, cancelOperation,
  getOperation, getOperations,
  getBalance, addToken,
  loading, error, account
} = useContract()
// Hook unificado para todas las operaciones del smart contract
```

#### 3. **useEscrow()**
```typescript
const { 
  createOperation, completeOperation, cancelOperation,
  getOperation, getOperationCount,
  loading, error
} = useEscrow()
// Métodos específicos del contrato Escrow
```

#### 4. **useBalance(tokenAddress)**
```typescript
const { balance, loading, refetch } = useBalance(tokenAddress)
// Obtener y actualizar balance de un token
```

#### 5. **useToken(tokenAddress)**
```typescript
const { approve, allowance, balanceOf, decimals, symbol } = useToken(tokenAddress)
// Operaciones de token: approve, balance, allowance
```

### Global State Management

#### **WalletContext.tsx**
```typescript
<WalletProvider>
  {/* Toda la app tiene acceso a */}
  account, signer, provider, connected, connect, disconnect
</WalletProvider>
```

---

## 🚀 Cómo Ejecutar

### Opción 1: Setup Automático (Recomendado)

```bash
# Ir a carpeta escrow
cd escrow

# Ejecutar setup (verifica herramientas, compila, instala)
bash setup.sh
```

**¿Qué hace setup.sh?**
- ✅ Verifica Foundry instalado
- ✅ Verifica Node.js instalado
- ✅ Instala librerías Foundry
- ✅ Compila smart contracts
- ✅ Ejecuta 23 tests
- ✅ Instala npm packages
- ✅ Crea .env.local

### Opción 2: Manual

**Terminal 1 - Blockchain Local:**
```bash
anvil
# Escucha en 127.0.0.1:8545
# Proporciona 10 cuentas precargadas con ETH
```

**Terminal 2 - Deploy Contratos:**
```bash
cd escrow/sc
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
# Output: Direcciones de Escrow, TokenA, TokenB
```

**Terminal 3 - Frontend:**
```bash
cd escrow/web

# Actualizar .env.local con direcciones del deploy
# NEXT_PUBLIC_ESCROW_ADDRESS=0x...
# NEXT_PUBLIC_TOKEN_A_ADDRESS=0x...
# NEXT_PUBLIC_TOKEN_B_ADDRESS=0x...

npm run dev
# Abre http://localhost:3000
```

---

## 📝 Flujo Típico de Usuario

### Escenario: User1 intercambia 100 TokenA por 50 TokenB de User2

#### PASO 1: Admin agrega tokens permitidos
```
1. Connect Wallet (User = Owner/Admin)
2. Click "Agregar Token"
3. Ingresa: 0x... (TokenA contract address)
4. Confirma en MetaMask
5. Token A ahora está permitido
6. Repite para Token B
```

#### PASO 2: User1 crea operación
```
1. Connect Wallet (User = User1)
2. Click "Crear Operación"
3. Ingresa:
   - Token A: 0x...
   - Cantidad A: 100
   - Token B: 0x...
   - Cantidad B: 50
   - Recipient: 0x... (Dirección de User2)
4. Click "Crear Operación"
5. MetaMask pide APPROVE de 100 TokenA
6. Confirma approve
7. MetaMask pide SIGNATURE para crear operación
8. Confirma → Operación creada ✅
   - 100 TokenA transferido del contrato al escrow
```

#### PASO 3: User2 completa operación
```
1. Cambiar cuenta en MetaMask (User = User2)
2. Refrescar página
3. Ver "Operaciones Activas"
4. Click "Completar" en la operación de User1
5. MetaMask pide APPROVE de 50 TokenB
6. Confirma approve
7. MetaMask pide SIGNATURE para completar
8. Confirma → Operación completada ✅
   - 50 TokenB → User1
   - 100 TokenA (del escrow) → User2
```

---

## 🧪 Testing

```bash
cd escrow/sc
forge test
# Ejecuta 23 tests
# Coverage:
# - addToken: 4 tests
# - createOperation: 8 tests
# - completeOperation: 5 tests
# - cancelOperation: 4 tests
# - Complex flows: 2 tests
```

**Prueba individual:**
```bash
forge test --match-test testCreateOperation -v
```

---

## 📚 Archivos de Documentación

1. **README_ESTUDIANTE.md** ← Estás aquí
2. **QUICK_START.md** - Guía rápida (5 minutos)
3. **PROJECT_STATUS.md** - Estado completo del proyecto
4. **ARCHITECTURE.md** - Arquitectura detallada
5. **TESTING.md** - Guía completa de testing
6. **DEPLOYMENT.md** - Deployment a Sepolia testnet
7. **START_HERE.md** - Introducción general

---

## 💡 Conceptos Clave a Entender

### ERC20
Token estándar de Ethereum. Permite transferencias, aprobaciones, balances.

### Escrow
Sistema de custodia donde un tercero (el contrato) mantiene fondos hasta que ambas partes cumplan las condiciones.

### Atomic Swap
Intercambio donde o sucede todo o nada. Imposible que una parte quede con ambos tokens.

### ReentrancyGuard
Previene que un atacante llame a la función nuevamente antes de que termine.

### Checks-Effects-Interactions
Patrón seguro:
1. Checks: Validar condiciones
2. Effects: Cambiar estado interno
3. Interactions: Llamadas externas

---

## 🔒 Seguridad

El contrato implementa varias protecciones:

| Protección | Descripción |
|-----------|------------|
| ReentrancyGuard | Previene ataques reentrancia |
| Validaciones | Verifica amounts > 0, addresses válidas |
| Checks-Effects-Interactions | Estado cambia antes de transferencias |
| Ownable | Solo owner puede agregar tokens |
| Eventos | Auditoría y tracking |
| SafeERC20 (implícito) | Maneja retornos de ERC20 correctamente |

---

## ❓ Preguntas Frecuentes

### ¿Qué es anvil?
Blockchain local en Ethereum. Proporciona 10 cuentas precargadas con ETH para testing.

### ¿Por qué debo "aprobar" antes?
ERC20 requiere aprobación para que un contrato pueda transferir tus tokens.

### ¿Qué pasa si cancelo una operación?
Tu Token A es devuelto. La operación pasa a estado CANCELLED.

### ¿Puedo cambiar de red?
Sí, pero debes agregar Anvil Local (Chain ID: 31337) a MetaMask.

### ¿Cómo sé si funcionó?
Verifica los balances en el panel "Debug de Balances" o en MetaMask.

---

## 🚨 Troubleshooting

| Problema | Solución |
|---------|----------|
| "Provider not available" | MetaMask no está conectada |
| "Wallet not connected" | Click en "Conectar Wallet" |
| "Token not allowed" | Admin debe agregar el token primero |
| "Insufficient allowance" | Approve el token en el componente |
| "Transaction failed" | Verifica gas, balance, y que la operación esté PENDING |

---

## ✅ Checklist para Estudiantes

- [ ] Entendí qué es un Escrow
- [ ] Revisé el código de Escrow.sol
- [ ] Ejecuté los 23 tests exitosamente
- [ ] Configuré MetaMask con red Anvil
- [ ] Ejecuté setup.sh sin errores
- [ ] Inicié anvil en Terminal 1
- [ ] Desplegué contratos en Terminal 2
- [ ] Inicié frontend en Terminal 3
- [ ] Conecté wallet
- [ ] Agregué tokens (como admin)
- [ ] Creé una operación
- [ ] Completé una operación
- [ ] Probé cancelar una operación
- [ ] Revisé el código del frontend
- [ ] Entendí cómo funcionan los hooks

---

## 📞 Soporte

Para dudas:
1. Revisa los archivos de documentación
2. Consulta el código comentado
3. Prueba los tests como referencia

---

## 🎓 Lo Que Aprendiste

En este proyecto practicaste:

✅ **Smart Contracts**
- Solidity avanzado
- Patrones de seguridad
- Testing con Foundry
- Deployment scripts

✅ **Frontend**
- React + TypeScript
- Web3 integration (ethers.js)
- Context API para state management
- Hooks personalizados
- Tailwind CSS

✅ **Web3**
- Conectar wallets
- Interactuar con contratos
- Manejar tokens ERC20
- Firmar transacciones

✅ **DevOps**
- Blockchain local (anvil)
- Deployment scripts
- Testing automatizado

---

## 🎉 ¡Felicitaciones!

Has completado el proyecto Escrow DApp. Ahora entiendes cómo crear aplicaciones descentralizadas completas.

**Próximos pasos:** 
- Despliega a Sepolia testnet
- Agrega más funcionalidades
- Crea tu propia DApp

---

**Hecho con ❤️ para CodeCrypto Academy**
