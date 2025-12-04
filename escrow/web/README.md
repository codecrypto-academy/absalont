# Escrow DApp - Frontend

Frontend Next.js para interactuar con el contrato Escrow.

## Estructura

- `src/app/` - Páginas principales
- `src/components/` - Componentes reutilizables
- `src/context/` - Context API para estado global
- `src/hooks/` - Custom hooks
- `src/lib/` - Utilidades
- `src/types/` - Tipos TypeScript

## Setup

```bash
npm install
```

Crear `src/.env.local`:
```env
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_A_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_B_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

## Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000
