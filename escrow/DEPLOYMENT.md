# 🚀 Deployment - Escrow DApp

## Deployment Local (Desarrollo)

### 1. Iniciar Anvil

```bash
anvil
```

Output esperado:
```
Listening on 127.0.0.1:8545
```

### 2. Compilar Contratos

```bash
cd escrow/sc
forge build
```

### 3. Desplegar

```bash
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

**Anota estas direcciones:**
```
ESCROW_ADDRESS: 0x...
TOKEN_A_ADDRESS: 0x...
TOKEN_B_ADDRESS: 0x...
```

### 4. Actualizar .env.local

```bash
cd escrow/web
cat > .env.local << EOF
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_A_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_B_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
EOF
```

### 5. Iniciar Frontend

```bash
npm run dev
```

## Deployment en Sepolia (Testnet)

### 1. Obtener RPC URL y Private Key

**Opción A: Alchemy**
```bash
# Ve a https://www.alchemy.com/
# Crea proyecto → Copia RPC URL
export SEPOLIA_RPC_URL="https://eth-sepolia.alchemyapi.io/v2/YOUR_API_KEY"
```

**Opción B: Infura**
```bash
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_API_KEY"
```

**Private Key:**
```bash
# De MetaMask: Settings → Security & Privacy → Show Private Key
export PRIVATE_KEY="0x..."
```

### 2. Obtener testnet ETH

- [Sepolia Faucet 1](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Sepolia Faucet 2](https://sepoliafaucet.com/)

### 3. Desplegar Contratos

```bash
cd escrow/sc

forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### 4. Configurar Frontend

```bash
cd escrow/web
cat > .env.local << EOF
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_A_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_B_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=$SEPOLIA_RPC_URL
NEXT_PUBLIC_CHAIN_ID=11155111
EOF
```

### 5. Desplegar Frontend a Vercel

```bash
npm install -g vercel
vercel
```

Sigue las instrucciones interactivas.

## Deployment en Mainnet

### ⚠️ IMPORTANTE

- **Testea todo en Sepolia primero**
- Revisa contratos múltiples veces
- Considera audit de seguridad
- Usa hardware wallet (Ledger/Trezor)

### Pasos

```bash
# 1. Obtener ETH real
# (envía desde exchange a tu wallet)

# 2. Exportar variables
export MAINNET_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/..."
export PRIVATE_KEY="0x..."
export ETHERSCAN_API_KEY="..."

# 3. Desplegar
cd escrow/sc
forge script script/Deploy.s.sol \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# 4. Verificar en https://etherscan.io/
```

## Verificar Contrato en Etherscan

Después de desplegar, Etherscan automáticamente verifica si usaste `--verify`.

Si necesitas verificar manualmente:

```bash
forge verify-contract \
  0x... \                          # Dirección del contrato
  src/Escrow.sol:Escrow \          # Ruta y nombre
  --rpc-url $SEPOLIA_RPC_URL \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Script de Deploy (Deploy.s.sol)

### Contenido Típico

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Escrow.sol";
import "../src/MockERC20.sol";

contract Deploy is Script {
    function run() public {
        // Comenzar broadcasting de transacciones
        vm.startBroadcast();
        
        // 1. Desplegar Escrow
        Escrow escrow = new Escrow();
        console.log("Escrow deployed at:", address(escrow));
        
        // 2. Desplegar Tokens
        MockERC20 tokenA = new MockERC20("Token A", "TKNA");
        MockERC20 tokenB = new MockERC20("Token B", "TKNB");
        
        console.log("Token A deployed at:", address(tokenA));
        console.log("Token B deployed at:", address(tokenB));
        
        // 3. Configurar tokens en Escrow
        escrow.addTokens(address(tokenA));
        escrow.addTokens(address(tokenB));
        
        // 4. Mint tokens para testing
        tokenA.mint(msg.sender, 1000e18);
        tokenB.mint(msg.sender, 1000e18);
        
        vm.stopBroadcast();
    }
}
```

## Troubleshooting Deployment

| Error | Solución |
|-------|----------|
| `insufficient funds for gas` | Asegúrate tener ETH en la billetera |
| `nonce too low` | Reinicia anvil o espera bloques en testnet |
| `contract not found` | Verifica la dirección desplegada |
| `verify failed` | Compila primero: `forge build` |
| `connection refused` | Verifica RPC URL |

## Monitoreo Post-Deployment

### Verificar Balance de Contrato

```bash
cast balance 0x... --rpc-url $RPC_URL
```

### Llamar Función

```bash
cast call 0x... "balanceOf(address)" 0x...
```

### Ver Eventos

```bash
cast logs \
  "Transfer(address indexed from, address indexed to, uint256 value)" \
  --from-block 12345 \
  --rpc-url $RPC_URL
```

## Checklist de Seguridad

- [ ] Tests pasen en local
- [ ] Deploy y test en Sepolia
- [ ] Verificar Escrow en Etherscan
- [ ] Verificar Tokens en Etherscan
- [ ] Probar frontend conectado
- [ ] Transacción de prueba exitosa
- [ ] Revisar gas costs
- [ ] Actualizar README con direcciones
- [ ] Commit cambios a Git

## Recursos

- [Foundry Deploy Docs](https://book.getfoundry.sh/forge/scripts/)
- [Etherscan Verification](https://docs.etherscan.io/tutorials/verify-contracts)
- [Sepolia Faucets](https://sepoliafaucet.com/)
- [MetaMask RPC Endpoints](https://docs.metamask.io/wallet/reference/rpc-api/)
