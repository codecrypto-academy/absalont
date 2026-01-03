# 🔐 Escrow DApp - Guía para Estudiantes

## Objetivo del Proyecto

Crear una aplicación descentralizada (DApp) completa para realizar intercambios seguros de tokens ERC20 utilizando un contrato inteligente de escrow. El proyecto incluye:

- **Smart Contract**: Contrato Escrow en Solidity que gestiona operaciones de intercambio de tokens
- **Frontend**: Aplicación Next.js que permite interactuar con el contrato
- **Integración Web3**: Conexión con MetaMask usando ethers.js

## Funcionalidades Principales

1. **Agregar Tokens**: El owner puede autorizar qué tokens ERC20 se pueden intercambiar
2. **Crear Operación**: Usuario 1 deposita Token A y solicita Token B a cambio
3. **Completar Operación**: Usuario 2 proporciona Token B y recibe Token A
4. **Cancelar Operación**: Usuario 1 puede cancelar y recuperar sus tokens
5. **Visualizar Estado**: Panel de debug para ver balances y operaciones activas

## Estructura del Proyecto

```
escrow/
├── sc/                      # Smart Contracts (Foundry)
│   ├── src/
│   │   ├── Escrow.sol       # Contrato principal
│   │   └── interfaces/
│   │       └── IEscrow.sol  # Interfaz del contrato
│   ├── test/
│   │   └── Escrow.t.sol     # Tests unitarios
│   ├── script/
│   │   └── Deploy.s.sol     # Script de deployment
│   ├── foundry.toml
│   └── remappings.txt
├── web/                     # Frontend (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx     # Página principal
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
├── setup.sh                 # Script de setup inicial
├── dev-start.sh            # Script para iniciar dev local
├── START_HERE.md           # Instrucciones de inicio rápido
├── DEPLOYMENT.md           # Guía de deployment
```

## Requisitos Previos

- **Node.js** v18+
- **Foundry** - `curl -L https://foundry.paradigm.xyz | bash`
- **Git**
- **MetaMask** navegador extensión (para frontend)

## Inicio Rápido

### 1. Clonar y Setup

```bash
cd escrow/
chmod +x setup.sh
./setup.sh
```

### 2. Iniciar Blockchain Local

```bash
anvil
```

Esto levanta una red Ethereum local en `http://127.0.0.1:8545`

### 3. Desplegar Contratos

En otra terminal:

```bash
cd escrow/sc
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Anota las direcciones desplegadas de `ESCROW_ADDRESS` y tokens.

### 4. Configurar Frontend

Crea `escrow/web/.env.local`:

```env
NEXT_PUBLIC_ESCROW_ADDRESS=0x
NEXT_PUBLIC_TOKEN_A_ADDRESS=0x
NEXT_PUBLIC_TOKEN_B_ADDRESS=0x
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

### 5. Iniciar Frontend

```bash
cd escrow/web
npm run dev
```

Abre `http://localhost:3000` en tu navegador con MetaMask conectado.

## Documentación

- [START_HERE.md](./START_HERE.md) - Guía paso a paso
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Desplegar a redes públicas
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura técnica

## Scripts Disponibles

### Smart Contracts

```bash
cd sc/

# Compilar
forge build

# Tests
forge test
forge test -v      # Verbose
forge test --gas-report

# Desplegar a local
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Desplegar a Sepolia
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

### Frontend

```bash
cd web/

# Desarrollo
npm run dev

# Build producción
npm run build

# Lint
npm run lint
```

## Componentes Frontend ✅

### **ConnectionButton.tsx**
- Botón para conectar/desconectar wallet MetaMask
- Muestra dirección acortada cuando está conectada
- Estados visuales: conectado (verde) / desconectado (azul)

### **AddToken.tsx**
- Panel para agregar tokens permitidos al contrato
- Solo disponible para el owner del contrato
- Validación de dirección correcta

### **CreateOperation.tsx**
- Formulario completo para crear operaciones de intercambio
- Campos: Token A, Cantidad A, Token B, Cantidad B solicitada, Recipient
- Validaciones cliente-side
- Feedback de estado de transacción

### **OperationsList.tsx**
- Listado dinámico de operaciones pendientes, completadas y canceladas
- Botones para completar o cancelar operaciones (si están pending)
- Auto-actualización cada 5 segundos
- Muestra detalles: ID, participantes, tokens, montos

### **BalanceDebug.tsx**
- Panel expandible de debug para desarrollo
- Verifica balance de cualquier token ERC20
- Muestra balance en el contrato Escrow
- Útil para debugging y testing

## Flujo de Transacciones

1. **Crear Escrow**:
   - User A approva tokens a enviar
   - User A crea operación con monto y dirección destinataria
   - Tokens se transfieren al contrato escrow

2. **Completar Escrow**:
   - User B approva sus tokens
   - User B completa la operación
   - User A recibe tokens de User B
   - User B recibe tokens de User A

3. **Cancelar Escrow**:
   - User A cancela antes de que User B complete
   - User A recupera sus tokens

## Conceptos Clave

- **ERC20**: Token standard de Ethereum
- **approve()**: Autorizar al contrato a gastar tokens
- **Escrow**: Tercero de confianza que retiene fondos durante una transacción
- **MetaMask**: Wallet que administra claves privadas del usuario

## Troubleshooting

### "Contract not deployed"
- Verifica que `NEXT_PUBLIC_ESCROW_ADDRESS` en `.env.local` sea correcto
- Asegúrate de que anvil sigue corriendo

### "Insufficient balance"
- Usa las direcciones test de anvil (0x1..., 0x2..., etc.)
- Cada cuenta comienza con 10000 ETH

### MetaMask no conecta
- Añade red manual: `http://127.0.0.1:8545`, Chain ID: 31337
- Importa cuenta privada de anvil

## Recursos

- [Foundry Docs](https://book.getfoundry.sh/)
- [Ethers.js Docs](https://docs.ethers.org/)
- [Next.js Docs](https://nextjs.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## Licencia

MIT
