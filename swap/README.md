# 🔄 Solana Swap 2025

Un mercado de intercambio de tokens descentralizado construido en **Solana** con el framework **Anchor**. Permite a una autoridad inicializar mercados entre dos tokens SPL, establecer precios y agregar liquidez, mientras que cualquier usuario puede realizar intercambios en ambas direcciones (A ⇄ B).

Incluye un **frontend web moderno** para explorar y operar todos los markets disponibles en tiempo real.

---

## 🏗️ Arquitectura de la DApp

El programa utiliza **PDAs (Program Derived Addresses)** para gestionar el estado del mercado y custodiar los fondos de forma segura, sin necesidad de claves privadas.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Solana Blockchain                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Programa: solana_swap_2025                       │  │
│  │                                                               │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Market Account (PDA)                                  │  │  │
│  │  │  seeds: [b"market", mint_a, mint_b]                    │  │  │
│  │  │                                                        │  │  │
│  │  │   authority | token_mint_a | token_mint_b | price      │  │  │
│  │  └──────────────────┬─────────────────┬───────────────────┘  │  │
│  │                     │ posee           │ posee                 │  │
│  │    ┌────────────────▼──┐         ┌───▼─────────────────┐     │  │
│  │    │  Vault A (PDA)    │         │  Vault B (PDA)      │     │  │
│  │    │  seeds:           │         │  seeds:             │     │  │
│  │    │ [b"vault_a",      │         │ [b"vault_b",        │     │  │
│  │    │  market_key]      │         │  market_key]        │     │  │
│  │    │  [Token A]        │         │  [Token B]          │     │  │
│  │    └────────┬──────────┘         └──────────┬──────────┘     │  │
│  │             │                               │                 │  │
│  └─────────────┼───────────────────────────────┼─────────────── ┘  │
│                │                               │                    │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─A → B─ ─ ─ ─ ─ ─ ─ ─ ─                   │
│   User Token A ──────────►Vault A                                  │
│                            Vault B ──────────► User Token B        │
│                                                                     │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─B → A─ ─ ─ ─ ─ ─ ─ ─ ─                   │
│   User Token B ──────────►Vault B                                  │
│                            Vault A ──────────► User Token A        │
└─────────────────────────────────────────────────────────────────────┘

  Actores externos:
  ┌─────────────────┐  ┌─────────────────┐
  │   Initializer   │  │      User       │
  │ (Authority/LP)  │  │   (Trader)      │
  │ ATA Token A     │  │ ATA Token A     │
  │ ATA Token B     │  │ ATA Token B     │
  └─────────────────┘  └─────────────────┘
```

---

## ⚙️ Instrucciones del Programa

| Instrucción          | Actores            | Descripción                                              |
|---------------------|--------------------|----------------------------------------------------------|
| `initialize_market` | Initializer        | Crea el Market Account y los dos Vaults (A y B)          |
| `set_price`         | Initializer        | Actualiza la tasa de cambio del mercado                  |
| `add_liquidity`     | Initializer        | Deposita tokens en Vault A y/o Vault B                   |
| `swap`              | User               | Intercambia Token A por B (`a_to_b=true`) o B por A      |

### Cálculo del Precio

```
Swap A → B:  amount_b = (amount_a × price) / 10^6
Swap B → A:  amount_a = (amount_b × 10^6) / price
```

> El `price` se almacena con 6 decimales de precisión (factor = 10^6).
> Ejemplo: precio de 2.5 → se almacena como `2_500_000`.

---

## 📦 Cuentas y PDAs

### `MarketAccount`

| Campo           | Tipo      | Descripción                          |
|-----------------|-----------|--------------------------------------|
| `authority`     | `Pubkey`  | Administrador del mercado            |
| `token_mint_a`  | `Pubkey`  | Mint del Token A                     |
| `token_mint_b`  | `Pubkey`  | Mint del Token B                     |
| `price`         | `u64`     | Precio con 6 decimales de precisión  |
| `decimals_a`    | `u8`      | Decimales del Token A                |
| `decimals_b`    | `u8`      | Decimales del Token B                |
| `bump`          | `u8`      | Bump de la PDA del Market            |

### Derivación de PDAs

```rust
// Market PDA
seeds = [b"market", token_mint_a.key(), token_mint_b.key()]

// Vault A (Token Account para Token A)
seeds = [b"vault_a", market.key()]

// Vault B (Token Account para Token B)
seeds = [b"vault_b", market.key()]
```

---

## 🗂️ Estructura del Proyecto

```
swap/
├── app/                            # Frontend web (Vite + Vanilla JS)
│   ├── index.html                  # Estructura HTML de la SPA
│   ├── style.css                   # Sistema de diseño (glassmorphism)
│   ├── main.js                     # Lógica: Anchor + Phantom + Swap
│   ├── vite.config.js              # Configuración de Vite + polyfills
│   └── package.json                # Dependencias del frontend
├── programs/
│   └── solana-swap-2025/
│       └── src/
│           └── lib.rs              # Smart contract (Rust + Anchor)
├── tests/
│   └── solana-swap-2025.ts         # Suite de pruebas (TypeScript / Mocha)
├── Anchor.toml                     # Configuración de Anchor
├── Cargo.toml                      # Dependencias de Rust
└── package.json                    # Dependencias de Node.js (tests)
```

---

## 🚀 Configuración e Instalación

### Requisitos Previos

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solanalabs.com/cli/install) (v2.x)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (v0.31.x)
- Node.js >= 18 & npm
- [Phantom Wallet](https://phantom.app) (extensión del browser, para el frontend)

### Instalación del Proyecto

```bash
# 1. Instalar dependencias del proyecto (tests)
npm install

# 2. Compilar el programa
anchor build

# 3. Instalar dependencias del frontend
cd app && npm install && cd ..
```

---

## ▶️ Cómo Ejecutar Todo el Stack

### Flujo de uso paso a paso (Recomendado)

```bash
# 1. Terminal 1: Iniciar validator
solana-test-validator --reset --limit-ledger-size 100

# 2. Terminal 2: Setup completo (Mints, Markets, Liquidez y Tokens para tu Phantom)
# Sustituye [TU_PHANTOM_ADDRESS] por tu dirección real de Phantom
npm run setup:local:wallet [TU_PHANTOM_ADDRESS]

# 3. Terminal 3: Iniciar Frontend
cd app && npm run dev
```

---

## 🛠️ Script de Setup Localnet

Situado en `scripts/setup-localnet.ts`, este script automatiza la configuración pesada:
- Crea dos **Token Mints** únicos (A y B).
- Crea una **Market PDA** para esos tokens.
- Inicializa el mercado y agrega **liquidez masiva** (500k de cada uno).
- **Mintea tokens directamente a tu Phantom Wallet** (1 millón de cada uno).

Uso: `npm run setup:local:wallet <YOUR_WALLET_ADDRESS>`

---

## 🖥️ Frontend — Markets Explorer

El frontend es una **SPA (Single Page Application)** construida con Vite + Vanilla JS que se conecta al validator local y permite explorar y operar todos los markets on-chain.

### Tecnologías

| Tecnología | Uso |
|---|---|
| Vite 5 + Vanilla JS | Bundler y servidor de desarrollo |
| `@coral-xyz/anchor` | Lectura de cuentas del programa y ejecución de instrucciones |
| `@solana/web3.js` | Conexión RPC al validator local |
| `@solana/spl-token` | Gestión de Associated Token Accounts |
| Phantom Wallet | Firma de transacciones en el browser |
| Google Fonts (Outfit + JetBrains Mono) | Tipografía y estética premium |

### Funcionalidades

- **Markets Explorer** — Lista todos los `MarketAccount` encontrados on-chain con:
  - Par de tokens, precio actual y decimales (shortened Mint IDs).
  - Balance de Vault A y Vault B con barra de liquidez visual.
  - **Saldos del Usuario:** Visualización en tiempo real de tus tokens en cada mercado.
  - **Resaltado Inteligente:** Los mercados donde tienes fondos brillan en cian.
  - Auto-refresh cada 15 segundos.

- **Swap Panel** — Modal interactivo al seleccionar un market:
  - Selector de dirección: Token A → B o B → A.
  - Preview del monto a recibir en tiempo real.
  - **Botón MAX:** Rellena el input con el saldo máximo disponible.
  - Visualización de saldos de la wallet conectada.
  - Creación automática de ATAs si no existen.

- **Historial de Actividad:**
  - Guarda un registro local de tus swaps exitosos.
  - Persistencia mediante `localStorage`.
  - Enlaces directos a las firmas en el Explorador.

- **Wallet Integration** (Phantom):
  - Conectar / desconectar wallet.
  - Visualización del balance SOL en localnet.
  - Botón 💧 Airdrop automático cuando el balance es < 0.1 SOL.

---

## 🧪 Pruebas

La suite de pruebas (`tests/solana-swap-2025.ts`) cubre el ciclo de vida completo del mercado:

| # | Test | Descripción |
|---|------|-------------|
| 1 | ✅ Should initialize market | Crea la PDA del mercado y los vaults |
| 2 | ✅ Should set price | Actualiza el precio a 2.5 con 6 decimales |
| 3 | ✅ Should add liquidity | Deposita 1000 tokens en cada vault |
| 4 | ✅ Should swap (A → B) | Intercambia 100 Token A y recibe 250 Token B |
| 5 | ✅ Should swap back (B → A) | Intercambia 100 Token B y recibe 40 Token A |

```bash
# Ejecutar todas las pruebas (validator ya corriendo)
anchor test --skip-local-validator

# O con las variables de entorno explícitas
ANCHOR_PROVIDER_URL=http://127.0.0.1:8899 \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts
```

---

## 🔧 Mejoras Recientes

### Smart Contract (`lib.rs`)
- ✅ Eliminadas importaciones no utilizadas (`TransferChecked`, `std::ops::Mul`)
- ✅ Eliminadas variables no utilizadas en `add_liquidity` (`market`, `vault_a`, `vault_b`)
- ✅ Corregidos paréntesis innecesarios en `if (a_to_b)` → `if a_to_b`
- ✅ Suprimidos warnings de macros de Anchor (`unexpected_cfgs`, `deprecated`) con `#![allow(...)]`
- ✅ Build limpio: 0 warnings propios del código

### Frontend (`app/`)
- ✅ Nuevo frontend web con Vite + Vanilla JS
- ✅ Diseño glassmorphism oscuro con gradientes cian/morado
- ✅ Explorador de markets que lee todos los `MarketAccount` on-chain
- ✅ Panel de Swap integrado con preview de precios en tiempo real
- ✅ Integración con Phantom Wallet
- ✅ Airdrop automático de SOL para wallets sin fondos en localnet
- ✅ Creación automática de ATAs cuando no existen (evita `AccountNotInitialized`)
- ✅ Detección y mensajes claros para errores comunes

---

## 📄 Licencia

ISC
