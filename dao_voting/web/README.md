# Frontend DAO Voting

Aplicación Next.js 15 para interactuar con el sistema de votación DAO.

## Instalación

```bash
cd web
npm install
```

## Configuración

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env.local
```

2. Edita `.env.local` con las direcciones de los contratos desplegados:
```
NEXT_PUBLIC_DAO_ADDRESS=0x...          # Dirección del contrato DAOVoting
NEXT_PUBLIC_FORWARDER_ADDRESS=0x...    # Dirección del MinimalForwarder
NEXT_PUBLIC_CHAIN_ID=31337             # 31337 para Anvil, 11155111 para Sepolia
RELAYER_PRIVATE_KEY=0x...              # Private key del relayer
RPC_URL=http://127.0.0.1:8545          # URL del RPC
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Funcionalidades

### 1. Conexión Wallet
- Conecta con MetaMask
- Muestra dirección conectada
- Maneja cambios de cuenta y red

### 2. Financiación del DAO
- Depositar ETH en el DAO
- Ver balance personal en el DAO
- Ver balance total del DAO

### 3. Crear Propuestas
- Validación automática del 10% de balance requerido
- Configurar beneficiario, cantidad y duración
- Feedback visual del proceso

### 4. Votación Gasless
- Votar A FAVOR, EN CONTRA o ABSTENCIÓN
- Sin pagar gas (meta-transacciones)
- Actualización en tiempo real
- Posibilidad de cambiar voto

### 5. Ejecución de Propuestas
- Ejecutar propuestas aprobadas manualmente
- Daemon automático via `/api/daemon`

## Estructura

```
src/
├── app/
│   ├── api/
│   │   ├── relay/       # Endpoint para meta-transacciones
│   │   └── daemon/      # Endpoint para ejecución automática
│   ├── layout.tsx       # Layout principal con Web3Provider
│   ├── page.tsx         # Página principal
│   └── globals.css      # Estilos globales
├── components/
│   ├── ConnectWallet.tsx
│   ├── FundingPanel.tsx
│   ├── CreateProposal.tsx
│   ├── ProposalList.tsx
│   ├── ProposalCard.tsx
│   └── VoteButtons.tsx
├── context/
│   └── Web3Context.tsx  # Context de Web3
├── hooks/
│   ├── useContracts.ts
│   ├── useDAOBalance.ts
│   └── useProposals.ts
└── lib/
    └── contracts.ts      # ABIs y direcciones
```

## API Routes

### POST /api/relay
Recibe meta-transacciones firmadas y las ejecuta a través del MinimalForwarder.

**Request:**
```json
{
  "request": {
    "from": "0x...",
    "to": "0x...",
    "value": "0",
    "gas": "200000",
    "nonce": "0",
    "data": "0x..."
  },
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "blockNumber": 123
}
```

### GET/POST /api/daemon
Ejecuta automáticamente propuestas aprobadas que hayan pasado el período de seguridad.

**Response:**
```json
{
  "success": true,
  "executedCount": 2,
  "proposals": [
    { "proposalId": 1, "txHash": "0x..." },
    { "proposalId": 3, "txHash": "0x..." }
  ]
}
```

## Daemon Automático

Para ejecutar el daemon periódicamente, puedes usar cron o un servicio como:

```bash
# Cada 5 minutos
*/5 * * * * curl http://localhost:3000/api/daemon
```

O configurar Vercel Cron Jobs si despliegas en Vercel.

## Build para Producción

```bash
npm run build
npm start
```

## Notas

- Asegúrate de que MetaMask esté conectado a la red correcta
- El relayer debe tener suficiente ETH para pagar gas
- Las meta-transacciones son firmadas off-chain con EIP-712
- Los eventos de contratos actualizan la UI en tiempo real
