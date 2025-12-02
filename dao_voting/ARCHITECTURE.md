# Arquitectura del Sistema DAO Voting

## 📐 Visión General

```
┌─────────────────┐
│   Frontend      │
│   (Next.js 15)  │
│                 │
│  - React UI     │
│  - Web3 Context │
│  - ethers.js    │
└────────┬────────┘
         │
         │ 1. Firma EIP-712 (off-chain)
         │
         ▼
┌─────────────────┐
│  API Relay      │
│  /api/relay     │
│                 │
│  Node.js +      │
│  ethers.js      │
└────────┬────────┘
         │
         │ 2. execute(request, signature)
         │
         ▼
┌─────────────────┐      3. forwarded call + msg.sender
│ MinimalForwarder│ ────────────────────────────────────┐
│                 │                                      │
│  - verify()     │                                      │
│  - execute()    │                                      │
│  - getNonce()   │                                      │
└─────────────────┘                                      │
                                                         ▼
                                              ┌─────────────────┐
                                              │   DAOVoting     │
                                              │                 │
                                              │  - fundDAO()    │
                                              │  - createProp() │
                                              │  - vote()       │
                                              │  - execute()    │
                                              └─────────────────┘
```

## 🔄 Flujo de Meta-Transacción

### 1. Usuario Firma (Off-chain)

```javascript
// Frontend genera EIP-712 typed data
const domain = {
  name: 'MinimalForwarder',
  version: '0.0.1',
  chainId: 31337,
  verifyingContract: FORWARDER_ADDRESS
};

const types = {
  ForwardRequest: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'data', type: 'bytes' }
  ]
};

const request = {
  from: userAddress,
  to: daoAddress,
  value: 0,
  gas: 200000,
  nonce: currentNonce,
  data: encodedVoteCall
};

// Usuario solo firma (NO paga gas)
const signature = await signer.signTypedData(domain, types, request);
```

### 2. Relayer Ejecuta (On-chain)

```javascript
// API relay recibe firma y ejecuta
const tx = await forwarder.execute(request, signature, {
  gasLimit: 500000  // Relayer paga el gas
});
```

### 3. Forwarder Valida y Reenvía

```solidity
// MinimalForwarder.sol
function execute(ForwardRequest calldata req, bytes calldata signature) public payable {
    // 1. Validar firma
    require(verify(req, signature), "Invalid signature");
    
    // 2. Incrementar nonce (previene replay)
    _nonces[req.from]++;
    
    // 3. Llamar contrato destino con from original
    req.to.call(abi.encodePacked(req.data, req.from));
}
```

### 4. DAO Procesa con Usuario Original

```solidity
// DAOVoting.sol
function vote(uint256 proposalId, VoteType voteType) external {
    // _msgSender() extrae el from del calldata
    // NO usa msg.sender (que sería el forwarder)
    address voter = _msgSender();
    
    // Procesar voto del usuario original
    _hasVoted[proposalId][voter] = true;
    // ...
}
```

## 🏗️ Arquitectura de Componentes

### Smart Contracts (Foundry)

```
sc/
├── src/
│   ├── MinimalForwarder.sol      # EIP-2771 Relayer
│   │   ├── verify()              # Validar firma ECDSA
│   │   ├── execute()             # Ejecutar meta-tx
│   │   └── getNonce()            # Obtener nonce
│   │
│   └── DAOVoting.sol             # Lógica del DAO
│       ├── fundDAO()             # Depositar ETH
│       ├── createProposal()      # Crear propuesta (10% balance)
│       ├── vote()                # Votar (gasless)
│       └── executeProposal()     # Ejecutar aprobadas
│
├── test/
│   ├── MinimalForwarder.t.sol   # Tests de forwarder
│   └── DAOVoting.t.sol           # Tests de DAO
│
└── script/
    └── Deploy.s.sol              # Script de deployment
```

### Frontend (Next.js 15)

```
web/src/
├── app/
│   ├── layout.tsx                # Root layout con Web3Provider
│   ├── page.tsx                  # Página principal
│   │
│   └── api/
│       ├── relay/route.ts        # Endpoint para meta-tx
│       └── daemon/route.ts       # Auto-ejecutar propuestas
│
├── components/
│   ├── ConnectWallet.tsx         # Conexión MetaMask
│   ├── FundingPanel.tsx          # Depositar ETH
│   ├── CreateProposal.tsx        # Crear propuestas
│   ├── ProposalList.tsx          # Lista de propuestas
│   ├── ProposalCard.tsx          # Card individual
│   └── VoteButtons.tsx           # Botones de votación
│
├── context/
│   └── Web3Context.tsx           # Estado global Web3
│
├── hooks/
│   ├── useContracts.ts           # Instancias de contratos
│   ├── useDAOBalance.ts          # Balances del DAO
│   └── useProposals.ts           # Lista de propuestas
│
└── lib/
    └── contracts.ts              # ABIs y constantes
```

## 🔐 Seguridad

### Prevención de Replay Attacks

```solidity
// Cada usuario tiene su propio nonce secuencial
mapping(address => uint256) private _nonces;

function execute(ForwardRequest calldata req, ...) {
    require(_nonces[req.from] == req.nonce, "Invalid nonce");
    _nonces[req.from]++;  // Incrementar después de usar
}
```

### Validación de Firmas

```solidity
function verify(ForwardRequest calldata req, bytes calldata signature) {
    bytes32 digest = _hashTypedDataV4(
        keccak256(abi.encode(TYPEHASH, req.from, req.to, ...))
    );
    address signer = ECDSA.recover(digest, signature);
    return signer == req.from && _nonces[req.from] == req.nonce;
}
```

### Contexto de Mensaje Original

```solidity
// ERC2771Context.sol (OpenZeppelin)
function _msgSender() internal view override returns (address sender) {
    if (isTrustedForwarder(msg.sender)) {
        // Extraer from original de calldata
        assembly {
            sender := shr(96, calldataload(sub(calldatasize(), 20)))
        }
    } else {
        sender = msg.sender;
    }
}
```

## 📊 Flujo de Datos

### Crear y Votar Propuesta

```
┌──────────┐
│  Usuario │
└────┬─────┘
     │
     │ 1. fundDAO(10 ETH)
     ▼
┌──────────────┐
│  DAOVoting   │
│  balance: 10 │
└────┬─────────┘
     │
     │ 2. createProposal(recipient, 5 ETH, deadline)
     │    (valida: usuario tiene ≥10% balance)
     ▼
┌──────────────┐
│  Propuesta#1 │
│  votes: 0    │
└────┬─────────┘
     │
     │ 3. vote(1, A_FAVOR) - GASLESS
     │    ├─> Firma EIP-712
     │    ├─> POST /api/relay
     │    ├─> Forwarder.execute()
     │    └─> DAOVoting.vote()
     ▼
┌──────────────┐
│  Propuesta#1 │
│  votesAFavor:│
│      1       │
└──────────────┘
```

### Ejecutar Propuesta

```
Deadline + Safety Period Pasado
     │
     │ Daemon verifica:
     │  - !executed
     │  - now > deadline + 1 hour
     │  - votesAFavor > votesEnContra
     │
     ▼
executeProposal(1)
     │
     ├─> Validaciones pasan
     │
     ├─> proposal.executed = true
     │
     ├─> Transfer(DAO → recipient, 5 ETH)
     │
     └─> emit ProposalExecuted(1, recipient, 5 ETH)
```

## 🎯 Decisiones de Diseño

### ¿Por qué EIP-2771?

- **Experiencia de Usuario**: Usuarios votan sin ETH para gas
- **Escalabilidad**: Relayer único paga gas por todos
- **Seguridad**: Firma off-chain valida identidad
- **Standard**: EIP-2771 es un estándar ampliamente adoptado

### ¿Por qué Período de Seguridad?

- **Protección**: Tiempo para revisar propuestas aprobadas
- **Reversibilidad**: Comunidad puede reaccionar
- **Transparencia**: Ejecución predecible

### ¿Por qué 10% de Balance?

- **Prevención de Spam**: Solo usuarios comprometidos crean propuestas
- **Economía**: Alinea incentivos con el DAO
- **Flexibilidad**: Dinámico basado en balance total

### ¿Por qué Cambio de Voto?

- **Deliberación**: Usuarios pueden reconsiderar
- **Información Nueva**: Responder a nuevos datos
- **Democracia**: Mayor expresión de preferencias

## 🔄 Estados de Propuesta

```
                    ┌─────────────┐
                    │   CREADA    │
                    └──────┬──────┘
                           │
                           │ Período de Votación
                           │
                    ┌──────▼──────┐
                    │   ACTIVA    │
                    └──────┬──────┘
                           │
                           │ Deadline pasa
                           │
               ┌───────────┴───────────┐
               │                       │
          votos A FAVOR         votos EN CONTRA
          > votos EN CONTRA     >= votos A FAVOR
               │                       │
               ▼                       ▼
        ┌─────────────┐         ┌─────────────┐
        │  APROBADA   │         │  RECHAZADA  │
        └──────┬──────┘         └─────────────┘
               │
               │ Safety Period pasa
               │
               ▼
        ┌─────────────┐
        │  EJECUTADA  │
        └─────────────┘
```

## 📈 Métricas y Monitoreo

### Eventos Emitidos

```solidity
// DAOVoting.sol
event DAOFunded(address indexed funder, uint256 amount);
event ProposalCreated(uint256 indexed proposalId, address indexed recipient, uint256 amount, uint256 deadline);
event Voted(uint256 indexed proposalId, address indexed voter, VoteType voteType);
event ProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount);

// MinimalForwarder.sol
event MetaTransactionExecuted(address indexed from, address indexed to, bytes data);
```

### Logs para Debugging

- Frontend: Console logs en desarrollo
- Relayer: Server logs en Next.js
- Contratos: `forge test -vvv` para traces

---

Esta arquitectura proporciona un sistema DAO robusto, seguro y fácil de usar con votación gasless completamente funcional.
