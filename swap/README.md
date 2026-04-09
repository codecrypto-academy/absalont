# 🔄 Solana Swap 2025

Un mercado de intercambio de tokens descentralizado construido en **Solana** con el framework **Anchor**. Permite a una autoridad inicializar mercados entre dos tokens SPL, establecer precios y agregar liquidez, mientras que cualquier usuario puede realizar intercambios en ambas direcciones (A ⇄ B).

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

### Cálculo del Precio (Swap A → B)

```
amount_b = (amount_a × price) / 10^6
```

### Cálculo del Precio (Swap B → A)

```
amount_a = (amount_b × 10^6) / price
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

## 🚀 Configuración e Instalación

### Requisitos Previos

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solanalabs.com/cli/install) (v2.x)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (v0.31.x)
- Node.js >= 18 & npm

### Pasos de Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar el programa
anchor build

# 3. Verificar y sincronizar el Program ID
anchor keys list
# Si el ID difiere, actualizar en:
#  - programs/solana-swap-2025/src/lib.rs → declare_id!(...)
#  - Anchor.toml → [programs.localnet]
# Luego volver a compilar: anchor build
```

---

## ▶️ Cómo Ejecutar la App

> ⚠️ **Nota de compatibilidad**: El CLI de Anchor v1.0.0-rc.5 utiliza `surfpool` como validador interno, pero en entornos con Solana CLI estándar esto no está disponible. **Usar el flujo manual** descrito a continuación.

---

### Prerequisitos (solo la primera vez)

```bash
# Configurar la wallet local
solana-keygen new --no-bip39-passphrase
solana config set --url localhost

# Instalar dependencias
npm install

# Compilar el programa
anchor build
```

---

### Flujo de ejecución (cada vez que quieras probar)

**Terminal 1 — Iniciar el validador** *(dejar corriendo en esta terminal)*

```bash
# Si es la primera vez o el ledger está corrupto, eliminarlo primero:
rm -rf test-ledger

# Iniciar el validador
solana-test-validator --quiet
```

Esperar hasta que aparezca el mensaje `Waiting for fees to stabilize...` y el prompt regrese.

**Terminal 2 — Desplegar y ejecutar pruebas**

```bash
# Verificar que el validador responde
solana cluster-version

# Desplegar el programa
anchor deploy

# Ejecutar las pruebas
anchor test --skip-local-validator
```

---

### Flujo completo en diagrama

```
[Terminal 1]                      [Terminal 2]
solana-test-validator --quiet
  │ (esperar inicio)
  │                   ──────────► solana cluster-version ✓
  │                               anchor deploy
  │                               anchor test --skip-local-validator
  │                                 ✔ Should initialize market
  │                                 ✔ Should set price
  │                                 ✔ Should add liquidity
  │                                 ✔ Should swap (A → B)
  │                                 ✔ Should swap back (B → A)
  │                               5 passing ✅
```

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

---

## 🗂️ Estructura del Proyecto

```
swap/
├── programs/
│   └── solana-swap-2025/
│       └── src/
│           └── lib.rs          # Lógica del smart contract (Rust + Anchor)
├── tests/
│   └── solana-swap-2025.ts     # Suite de pruebas (TypeScript / Mocha)
├── Anchor.toml                 # Configuración de Anchor
├── Cargo.toml                  # Dependencias de Rust
└── package.json                # Dependencias de Node.js
```

---

## 📄 Licencia

ISC


---

### Opción 2 — Paso a paso (manual)

**Paso 1 — Configurar la wallet local** *(solo la primera vez)*

```bash
solana-keygen new --no-bip39-passphrase
solana config set --url localhost
```

**Paso 2 — Compilar el programa**

```bash
anchor build
```

**Paso 3 — Instalar dependencias Node**

```bash
npm install
```

**Paso 4 — Iniciar el validador local** *(terminal separada, dejar corriendo)*

```bash
solana-test-validator --reset
```

**Paso 5 — Fondear la wallet**

```bash
solana airdrop 5
```

**Paso 6 — Desplegar el programa**

```bash
anchor deploy
```

**Paso 7 — Ejecutar las pruebas**

```bash
ANCHOR_PROVIDER_URL=http://127.0.0.1:8899 \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts
```

---

### Flujo completo

```
npm install
    │
    ▼
anchor build ──► Compila el .so del programa
    │
    ▼
solana-test-validator ──► Levanta la red local en 127.0.0.1:8899
    │
    ▼
anchor deploy ──► Despliega el programa en localnet
    │
    ▼
ts-mocha tests/ ──► Ejecuta: init → precio → liquidez → swap A→B → swap B→A
```

---


La suite de pruebas cubre el ciclo de vida completo del mercado:

1. ✅ Inicialización del mercado
2. ✅ Actualización del precio
3. ✅ Adición de liquidez
4. ✅ Intercambio A → B
5. ✅ Intercambio B → A (swap inverso)

### Ejecución con Anchor

```bash
anchor test
```

### Ejecución Manual (si el validador ya está corriendo)

```bash
# Terminal 1 (si no hay un validador en ejecución)
solana-test-validator

# Terminal 2
anchor deploy

ANCHOR_PROVIDER_URL=http://127.0.0.1:8899 \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts
```

---
