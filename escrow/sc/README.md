# Smart Contracts - Escrow DApp

Contratos inteligentes para el sistema Escrow desarrollados con Foundry.

## Archivos

- `src/Escrow.sol` - Contrato principal
- `src/MockERC20.sol` - Token ERC20 para testing
- `src/interfaces/IEscrow.sol` - Interfaz del contrato
- `test/Escrow.t.sol` - Tests unitarios
- `script/Deploy.s.sol` - Script de deployment

## Compilar

```bash
forge build
```

## Tests

```bash
forge test
forge test -v
forge test --gas-report
```

## Deploy Local

```bash
anvil  # Terminal 1
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast  # Terminal 2
```

## Deploy Sepolia

```bash
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```
