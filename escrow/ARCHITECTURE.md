# 🏗️ Arquitectura del Proyecto Escrow

## Visión General

El proyecto Escrow DApp implementa un sistema de intercambio seguro de tokens ERC20 donde ninguna de las partes necesita confiar la una en la otra, sino en el contrato inteligente.

## Componentes Principales

### 1. Smart Contract (Escrow.sol)

**Responsabilidades:**
- Recibir y retener tokens durante operaciones de intercambio
- Validar aprobaciones de tokens
- Ejecutar lógica de transferencia atómica
- Mantener estado de operaciones

**Estrutura de Datos:**
```solidity
struct Operation {
    address initiator;           // Quien crea la operación
    address recipient;           // Quien debe completarla
    uint256 amountA;             // Tokens que pone initiator
    uint256 amountB;             // Tokens que debe poner recipient
    address tokenA;              // Dirección token A
    address tokenB;              // Dirección token B
    OperationStatus status;      // PENDING, COMPLETED, CANCELLED
    uint256 createdAt;           // Timestamp de creación
}

enum OperationStatus { PENDING, COMPLETED, CANCELLED }
```

**Funciones Principales:**
- `addTokens()` - Owner añade tokens permitidos
- `createOperation()` - Crear intercambio
- `completeOperation()` - Completar intercambio
- `cancelOperation()` - Cancelar intercambio
- `getOperationDetails()` - Obtener detalles

## Estructura del Proyecto

```
escrow/
├── sc/                                  # Smart Contracts (Foundry)
│   ├── src/
│   │   ├── Escrow.sol                  # ✅ Contrato principal
│   │   ├── MockERC20.sol               # ✅ Mock para testing
│   │   └── interfaces/
│   │       └── IEscrow.sol             # ✅ Interfaz del contrato
│   ├── script/
│   │   └── Deploy.s.sol                # ✅ Script de deployment
│   ├── test/
│   │   └── Escrow.t.sol                # ✅ Tests del contrato
│   ├── foundry.toml
│   └── remappings.txt
│
└── web/                                 # Frontend (Next.js 14)
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx               # Layout principal
    │   │   ├── page.tsx                 # Página de inicio
    │   │   └── globals.css              # Estilos globales
    │   │
    │   ├── components/                  # ✅ Componentes creados
    │   │   ├── ConnectionButton.tsx     # Conectar/desconectar wallet
    │   │   ├── AddToken.tsx             # Agregar tokens permitidos
    │   │   ├── CreateOperation.tsx      # Crear operación de intercambio
    │   │   ├── OperationsList.tsx       # Listar operaciones activas
    │   │   ├── BalanceDebug.tsx         # Debug de balances
    │   │   └── WalletSelector.tsx       # Selector de wallet
    │   │
    │   ├── context/
    │   │   └── WalletContext.tsx        # ✅ Contexto de wallet (ethers.js)
    │   │
    │   ├── hooks/
    │   │   ├── useContract.ts           # ✅ Hook unificado (nuevo)
    │   │   ├── useEscrow.ts             # Hook para operaciones escrow
    │   │   ├── useToken.ts              # Hook para operaciones ERC20
    │   │   └── useBalance.ts            # Hook para balances
    │   │
    │   ├── types/
    │   │   ├── escrow.ts                # ✅ Tipos Escrow (nuevo)
    │   │   ├── index.ts                 # Tipos generales
    │   │   └── ethereum.d.ts            # Types de window.ethereum
    │   │
    │   └── lib/
    │       ├── constants.ts             # Direcciones y ABIs
    │       └── ethers.ts                # Utilidades de ethers.js
    │
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── postcss.config.js
    ├── tailwind.config.js
    └── .env.example
```

## Componentes Creados ✅

### 1. **ConnectionButton.tsx**
- Conecta/desconecta la wallet
- Muestra dirección acortada cuando está conectada
- Estilos visuales para estados conectado/desconectado

### 2. **AddToken.tsx**
- Permite agregar tokens permitidos al contrato
- Solo Owner puede ejecutar esta operación
- Validaciones de dirección

### 3. **CreateOperation.tsx**
- Formulario para crear operaciones de intercambio
- Campos: Token A, Cantidad A, Token B, Cantidad B, Recipient
- Integración con `useContract`

### 4. **OperationsList.tsx**
- Listado de operaciones pendientes
- Botones para completar o cancelar operaciones
- Auto-actualización cada 5 segundos
- Muestra estado y detalles de cada operación

### 5. **BalanceDebug.tsx**
- Panel de debug expandible
- Verifica balance de tokens específicos
- Verifica balance en contrato Escrow
- Útil para debugging durante desarrollo

### 3. Contratos de Dependencias

- **OpenZeppelin ERC20**: Token standard
- **Foundry Std**: Utilidades para testing

## Flujo de Transacciones

### Crear Operación

```
User A                      Escrow Smart Contract         Token A
  │
  ├─ approve(escrow, amountA) ──────────────────────────────────→
  │                                                              │
  │                                                              │
  ├─ createOperation() ───────────────────────────────────────→│
  │                          │                                   │
  │                          ├─ transferFrom(A → contract)──────→
  │                          │                                   ✓
  │                          └─ emit OperationCreated
  │
  └─ Operation: PENDING
```

### Completar Operación

```
User B                      Escrow Smart Contract         Token B        Token A
  │
  ├─ approve(escrow, amountB) ───────────────────────────────────→
  │                                                              │
  │                                                              │
  ├─ completeOperation() ──────────────────────────────────────→│
  │                          │                                   │
  │                          ├─ transferFrom(B → contract)──────→
  │                          │                                   ✓
  │                          ├─ transfer(B → User A)─────────────→
  │                          │                                   │
  │                          ├─ transfer(A → User B)─────────────→
  │                          │                                   ✓
  │                          └─ emit OperationCompleted
  │
  └─ Operation: COMPLETED
```

### Cancelar Operación

```
User A                      Escrow Smart Contract         Token A
  │
  ├─ cancelOperation() ───────────────────────────────────────→│
  │                          │                                   │
  │                          ├─ transfer(A → User A)─────────────→
  │                          │                                   ✓
  │                          └─ emit OperationCancelled
  │
  └─ Operation: CANCELLED
```

## Interacción Frontend-Blockchain

### Consultar Estado (Read)

```typescript
// Hook: useEscrow
const { operations, getOperationDetails } = useEscrow();

// Sin transacción, solo lectura
const operation = await getOperationDetails(operationId);
```

**Secuencia:**
1. Usuario navega a página
2. useEscrow() se inicializa
3. ethers.js consulta contrato (read-only)
4. Estado se actualiza en componente

### Ejecutar Transacción (Write)

```typescript
// Hook: useEscrow
const { createOperation } = useEscrow();

// Ejecuta transacción
await createOperation(tokenA, amountA, recipient, tokenB, amountB);
```

**Secuencia:**
1. Usuario ingresa datos
2. useEscrow prepara transacción
3. ethers.js llama a MetaMask
4. Usuario confirma en MetaMask
5. Transacción se envía a blockchain
6. Contrato ejecuta operación
7. Frontend espera confirmación
8. Estado se actualiza

## Gestión de Estado

### Global (Context)
```typescript
interface WalletContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}
```

### Local (Componentes)
```typescript
// Por ejemplo en EscrowForm
const [operationId, setOperationId] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

## Seguridad

### Smart Contract
- ✅ Solo owner puede añadir tokens
- ✅ Validaciones de dirección zero
- ✅ Cheques de reentrancy (statefull)
- ✅ Eventos para cada acción

### Frontend
- ✅ Validación de inputs
- ✅ Manejo de errores de transacción
- ✅ Confirmación antes de crear operaciones
- ✅ Estado seguro (no guarda private keys)

## Testing

### Tests Unitarios (Foundry)
- Crear operación correcta
- Crear operación con usuario inválido
- Completar operación correcta
- Completar con fondos insuficientes
- Cancelar operación
- Eventos emitidos correctamente

### Tests de Integración (Frontend)
- Conectar wallet
- Crear operación
- Completar operación
- Ver balances actualizados

## Deployment

### Local (Desarrollo)
```bash
# 1. Iniciar anvil
anvil

# 2. Deploy
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

### Sepolia (Testnet)
```bash
# 1. Obtener RPC URL de Alchemy/Infura
export SEPOLIA_RPC_URL="https://eth-sepolia.alchemyapi.io/v2/..."

# 2. Deploy
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_KEY
```

## Mejoras Futuras

1. **Oracle de Precios**: Validar tipos de cambio
2. **Comisiones**: % del escrow para el protocolo
3. **Timeouts**: Liberar fondos después de X tiempo
4. **Multi-firma**: Requerir múltiples signatarios
5. **Historial**: Guardar todas las operaciones completadas
6. **Disputas**: Sistema de arbitraje

## Recursos

- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin ERC20](https://docs.openzeppelin.com/contracts/4.x/erc20/)
- [Web3 Best Practices](https://ethereum.org/en/developers/docs/smart-contracts/best-practices/)
