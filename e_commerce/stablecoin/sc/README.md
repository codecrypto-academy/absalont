# EuroToken Smart Contract

Token ERC20 que representa euros digitales (1 EURT = 1 EUR).

## Características

- **Nombre**: EuroToken (EURT)
- **Decimales**: 6 (para representar centavos)
- **Funcionalidad**: Mint y burn controlados por owner
- **Eventos**: Auditoría de mint y burn

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

# Tests con detalles
forge test -vvv

# Test específico
forge test --match-test testMintByOwner
```

## Deploy Local

```bash
# 1. Iniciar Anvil en otra terminal
anvil

# 2. Crear archivo .env con private key de Anvil
echo "PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" > .env

# 3. Deploy
forge script script/DeployEuroToken.s.sol --rpc-url http://localhost:8545 --broadcast
```

## Interacción con el Contrato

```bash
# Ver balance
cast call DIRECCION_TOKEN "balanceOf(address)(uint256)" DIRECCION_CUENTA --rpc-url http://localhost:8545

# Mint tokens (solo owner)
cast send DIRECCION_TOKEN "mint(address,uint256)" DIRECCION_DESTINO CANTIDAD --private-key PRIVATE_KEY --rpc-url http://localhost:8545

# Transfer tokens
cast send DIRECCION_TOKEN "transfer(address,uint256)" DIRECCION_DESTINO CANTIDAD --private-key PRIVATE_KEY --rpc-url http://localhost:8545
```

## Estructura

```
stablecoin/sc/
├── src/
│   └── EuroToken.sol          # Contrato principal
├── test/
│   └── EuroToken.t.sol        # Tests
├── script/
│   └── DeployEuroToken.s.sol  # Script de deploy
└── foundry.toml               # Configuración Foundry
```
