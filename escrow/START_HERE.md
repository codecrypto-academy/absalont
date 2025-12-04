# ⚡ Inicio Rápido - Escrow DApp

Sigue estos pasos para que el proyecto esté funcionando en **15 minutos**.

## Paso 1: Verificar Requisitos

```bash
# Node.js
node --version  # v18 o superior

# Foundry
forge --version

# Git
git --version
```

Si falta Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup
```

## Paso 2: Setup Inicial

```bash
cd escrow/
chmod +x setup.sh dev-start.sh
./setup.sh
```

Este script:
- ✅ Instala dependencias de Foundry
- ✅ Compila contratos
- ✅ Ejecuta tests
- ✅ Instala dependencias de npm
- ✅ Crea `.env.local` del frontend

## Paso 3: Iniciar Blockchain Local

Abre una **terminal nueva**:

```bash
anvil
```

Verás output como:
```
Listening on 127.0.0.1:8545
Ctrl+C to stop
```

## Paso 4: Desplegar Contratos

Abre otra **terminal nueva**:

```bash
cd escrow/sc
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

**Anota estas direcciones** (salida al final):
- `ESCROW_ADDRESS`: 0x...
- `TOKEN_A_ADDRESS`: 0x...
- `TOKEN_B_ADDRESS`: 0x...

## Paso 5: Configurar Frontend

Edita `escrow/web/.env.local`:

```env
NEXT_PUBLIC_ESCROW_ADDRESS=0x...             # De Paso 4
NEXT_PUBLIC_TOKEN_A_ADDRESS=0x...             # De Paso 4
NEXT_PUBLIC_TOKEN_B_ADDRESS=0x...             # De Paso 4
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

## Paso 6: Iniciar Frontend

Abre otra **terminal nueva**:

```bash
cd escrow/web
npm run dev
```

Verás:
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## Paso 7: Conectar MetaMask

1. Abre http://localhost:3000 en Chrome/Firefox
2. Haz clic en "Connect Wallet"
3. Confirma en MetaMask
4. **Si MetaMask no tiene la red local**:
   - Settings → Networks → Add Network Manually
   - Network Name: `Anvil Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

## Paso 8: Prueba las Funcionalidades

### Ver Balance
- Haz clic en "Get Balances"
- Deberías ver 10000 ETH y 1000 de cada token

### Crear Escrow (User A)
1. Ingresa cantidad de Token A a enviar
2. Ingresa dirección de User B (p. ej. segunda cuenta de anvil)
3. Haz clic en "Create Escrow"
4. Confirma en MetaMask
5. Verás ID de la operación

### Completar Escrow (User B)
1. Cambia de cuenta en MetaMask (segunda cuenta)
2. Ingresa el ID de operación
3. Ingresa cantidad de Token B
4. Haz clic en "Complete Escrow"
5. Confirma en MetaMask

### Cancelar Escrow (User A)
1. Vuelve a la primera cuenta
2. Ingresa ID de operación
3. Haz clic en "Cancel Escrow"
4. Confirma en MetaMask

## Cambiar Entre Cuentas (Anvil)

En MetaMask:
1. Haz clic en el icono de cuenta (arriba a la derecha)
2. Selecciona "Add account or import account"
3. Pega clave privada de anvil:
   - `0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadccb1995d6d97f3d161601` (Cuenta 0)
   - `0x59c6995e6671c53d0c8a4211a37f3b0c0e4476178e899f382e89d807452cb6d` (Cuenta 1)
   - Y más en el output de `anvil`

## Terminales Necesarias

Necesitas mantener **4 terminales abiertas**:
1. `anvil` - Blockchain local
2. `cd escrow/sc && forge build` (si necesitas recompilar)
3. `cd escrow/web && npm run dev` - Frontend
4. Tu navegador en http://localhost:3000

## Próximos Pasos

- Lee [ARCHITECTURE.md](./ARCHITECTURE.md) para entender el diseño
- Mira [TESTING.md](./TESTING.md) para escribir tests
- Consulta [DEPLOYMENT.md](./DEPLOYMENT.md) para desplegar en Sepolia/Mainnet

## Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| `command not found: forge` | Ejecuta `foundryup` |
| `Error: connection refused` | Asegúrate que `anvil` está corriendo |
| `ENOMEM: Out of memory` | Reinicia: `killall anvil node npm` |
| MetaMask "Network error" | Añade manualmente red local (ver Paso 7) |
| "Contract code not available" | Redeploy: `forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast` |

## ¿Necesitas ayuda?

- [README.md](./README.md) - Documentación completa
- [TESTING.md](./TESTING.md) - Cómo correr tests
- Revisa logs de `npm run dev` en la terminal del frontend
