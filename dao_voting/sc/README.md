# Smart Contracts (Foundry)

Sistema de DAO con votación gasless usando meta-transacciones EIP-2771.

## Instalación

```bash
cd sc
forge install
```

## Dependencias

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
```

## Compilación

```bash
forge build
```

## Tests

```bash
# Ejecutar todos los tests
forge test

# Ver detalle de tests
forge test -vv

# Ver gas report
forge test --gas-report

# Ver coverage
forge coverage
```

## Deployment

### Local (Anvil)

1. Inicia Anvil en una terminal:
```bash
anvil
```

2. En otra terminal, deploya los contratos:
```bash
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

### Testnet (Sepolia)

1. Configura `.env`:
```bash
cp .env.example .env
# Edita .env con tu private key y RPC URL
```

2. Deploy:
```bash
source .env
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

## Contratos

### MinimalForwarder
- **Propósito**: Relayer de meta-transacciones (EIP-2771)
- **Funciones principales**:
  - `execute()`: Ejecuta meta-transacción validada
  - `verify()`: Valida firma de usuario
  - `getNonce()`: Obtiene nonce actual de usuario

### DAOVoting
- **Propósito**: Sistema de votación DAO con soporte gasless
- **Funciones principales**:
  - `fundDAO()`: Depositar ETH en el DAO
  - `createProposal()`: Crear propuesta (requiere 10% del balance)
  - `vote()`: Votar en propuesta (gasless disponible)
  - `executeProposal()`: Ejecutar propuesta aprobada
  - `getProposal()`: Obtener detalles de propuesta
  - `getUserBalance()`: Ver balance de usuario

## Flujo de Meta-Transacciones

1. Usuario firma mensaje off-chain (EIP-712)
2. Frontend envía firma al relayer
3. Relayer ejecuta `MinimalForwarder.execute()`
4. Forwarder valida firma y llama a DAOVoting
5. Usuario vota sin pagar gas

## Notas de Seguridad

- Usa `_msgSender()` en DAOVoting (no `msg.sender`)
- Nonces previenen replay attacks
- Período de seguridad antes de ejecución de propuestas
- Validación de firmas con ECDSA
