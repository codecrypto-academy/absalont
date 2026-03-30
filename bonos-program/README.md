# 🏦 Solana Bonds DApp — `bonos-program`

Una DApp descentralizada construida sobre **Solana** y **Anchor Framework** que implementa el ciclo de vida completo de bonos financieros on-chain: emisión, compra, actualización de precio, cancelación, financiación de redención y canje al vencimiento.

---

## 📐 Arquitectura General

```
bonos/
├── dapp-bonos.pdf                  # Documento de especificación del proyecto
└── bonos-program/                  # Raíz del workspace Anchor
    ├── Anchor.toml                 # Configuración Anchor (cluster, wallet, scripts)
    ├── Cargo.toml                  # Workspace Rust con patches de dependencias
    ├── rust-toolchain.toml         # Rust 1.82.0 (canal fijo)
    ├── package.json                # Dependencias Node.js para tests
    ├── tsconfig.json               # Configuración TypeScript
    │
    ├── programs/
    │   └── bonos-program/          # Smart contract on-chain (Rust/Anchor)
    │       ├── Cargo.toml
    │       ├── Xargo.toml
    │       └── src/
    │           └── lib.rs          # Lógica del programa (~645 líneas)
    │
    ├── app/                        # Frontend (React + Vite)
    │   ├── index.html
    │   ├── vite.config.js
    │   └── src/
    │       ├── main.jsx
    │       ├── App.jsx             # UI principal con wallet adapter
    │       └── index.css
    │
    ├── tests/
    │   └── bonos-program.ts        # Suite de integración TypeScript (Mocha/Chai)
    │
    ├── migrations/
    │   └── deploy.ts               # Script de despliegue
    │
    └── patches/                    # Parches de crates para compatibilidad con BPF
        ├── constant_time_eq/
        └── wit-bindgen/
```

---

## ⚙️ Stack Tecnológico

| Capa | Tecnología | Versión Recomendada |
|---|---|---|
| **Blockchain** | Solana / Agave | **1.18.23** (Estable) |
| **Smart Contract** | Rust + Anchor | **0.31.0** (Estable) |
| **CLI Anchor** | Anchor CLI | **1.0.0-rc.5** / **0.31.0** |
| **Toolchain Rust** | `rustc` | **1.85.0** |
| **Frontend** | React 18 + Vite | Vite 5+ (Lucide Icons) |
| **RPCEndpoint** | Localnet / Devnet | `http://127.0.0.1:8899` |

---

## 🔑 Program ID

```
DtMmh3L7tDaEJ67THeKU3X8HRDXh7hK9zNGeGe2L9MD9
```
Configurado en `Anchor.toml` para `localnet` y `devnet`.

---

## 📜 Smart Contract — `bonos_program`

### Cuenta Principal: `BondListing`

PDA derivada con seeds `["listing", issuer, bond_mint]`.

| Campo | Tipo | Descripción |
|---|---|---|
| `issuer` | `Pubkey` | Dirección del emisor del bono |
| `bond_mint` | `Pubkey` | Mint del token que representa el bono |
| `stable_mint` | `Pubkey` | Mint de la stablecoin de pago (ej. USDC) |
| `price_per_bond` | `u64` | Precio de compra por unidad de bono |
| `available_bonds` | `u64` | Bonos aún disponibles en el escrow |
| `total_bonds` | `u64` | Total de bonos emitidos en el listing |
| `maturity_timestamp` | `i64` | Unix timestamp de vencimiento |
| `face_value` | `u64` | Valor de cara (pago al rescatar) |
| `total_redemption_funded` | `u64` | Stablecoins depositadas para redención |
| `is_active` | `bool` | Estado activo del listing |
| `token_name` | `String` | Nombre descriptivo del bono (ej. "Bono Navidad") |
| `token_symbol` | `String` | Símbolo o ticker del bono (ej. "BN") |

### PDAs del Programa

| PDA | Seeds | Propósito |
|---|---|---|
| `bond_listing` | `["listing", issuer, bond_mint]` | Estado del listing |
| `escrow_token_account` | `["escrow", bond_listing]` | Custodia de bonos durante venta |
| `redemption_vault` | `["redemption", bond_listing]` | Custodia de stablecoins para canje |

---

### 🔧 Instrucciones

#### 1. `initialize_listing`
Crea un nuevo listing. Transfiere los bonos del emisor al **escrow PDA**.

```
bond_amount: u64       — Cantidad de bonos a listar
price_per_bond: u64    — Precio en stablecoins por bono
maturity_timestamp: i64 — Timestamp Unix de vencimiento (debe ser futuro)
face_value: u64        — Valor a pagar al titular en el rescate
token_name: String     — Nombre del token del bono
token_symbol: String   — Símbolo del token del bono
```
Emite: `ListingCreated`

---

#### 2. `purchase_bonds`
Compra atómica: stablecoins del comprador → emisor, bonos del escrow → comprador.

```
amount: u64 — Cantidad de bonos a comprar
```
Valida: listing activo, bonos disponibles suficientes.  
Emite: `BondsPurchased`

---

#### 3. `cancel_listing`
El emisor cancela el listing. Los bonos no vendidos regresan al emisor.  
Emite: `ListingCancelled`

---

#### 4. `update_price`
Actualiza el precio por bono (solo el emisor, listing debe estar activo).

```
new_price: u64
```

---

#### 5. `add_bonds_to_listing`
Añade más bonos a un listing activo. Los transfiere al escrow.

```
extra_amount: u64
```

---

#### 6. `deposit_redemption_funds`
El emisor deposita stablecoins en el **redemption vault PDA** para financiar futuros canjes.

```
amount: u64
```
Emite: `RedemptionFunded`

---

#### 7. `redeem_bonds`
El titular canjea sus bonos por stablecoins tras el vencimiento.

```
amount: u64 — Cantidad de bonos a redimir
```
Valida: timestamp actual ≥ `maturity_timestamp`, fondos suficientes en vault.  
Flujo: bonos del titular → emisor; stablecoins del vault → titular.  
Emite: `BondsRedeemed`

---

### ❌ Errores Personalizados

| Error | Descripción |
|---|---|
| `ZeroBondAmount` | Cantidad de bonos debe ser > 0 |
| `ZeroPrice` | Precio debe ser > 0 |
| `ListingNotActive` | El listing no está activo |
| `InsufficientBonds` | No hay suficientes bonos disponibles |
| `Unauthorized` | Acción no autorizada |
| `Overflow` | Overflow aritmético |
| `InvalidMaturity` | Fecha de vencimiento debe ser en el futuro |
| `NotMaturedYet` | El bono aún no ha vencido |
| `InsufficientRedemptionFunds` | Fondos insuficientes en el vault de redención |

---

## 🖥️ Frontend — `app/`

Aplicación React 18 construida con **Vite**, conectada a la red Devnet de Solana.

### Características
- **Integración Multiview**:
  - **Dashboard**: Resumen de métricas globales y conexión.
  - **Faucet**: Grifo para fondear stablecoins de prueba (MTK).
  - **Mercado / History**: Explorador de listings activos con detalles técnicos.
  - **Mi Historial**: Registro personal de compras y redenciones.
- **Wallet Adapter**: Soporte para **Phantom** y otras wallets de Solana.
- **Acciones Atómicas**: Compra y redención (tras vencimiento) integradas.
- **Metadata de Tokens**: Visualización de Nombres y Símbolos de los bonos en todas las vistas (Dashboard, Market, History).

### Stack Frontend
```json
"@solana/wallet-adapter-react": "^0.15.35",
"@solana/web3.js": "^1.95.4",
"@coral-xyz/anchor": "^0.31.1",
"lucide-react": "^0.363.0",
"react-hot-toast": "^2.4.1"
```

---

## 🧪 Tests de Integración

Archivo: `tests/bonos-program.ts`  
Framework: **Mocha + Chai** vía `ts-mocha`

### Casos de prueba

| # | Test | Descripción |
|---|---|---|
| 1 | `Initializes a listing` | Crea listing y verifica estado inicial del escrow |
| 2 | `Purchases bonds` | Verifica transferencia de tokens y actualización de disponibles |
| 3 | `Updates price` | Confirma cambio de precio por el emisor |
| 4 | `Adds more bonds to listing` | Incrementa disponibles y verifica escrow |
| 5 | `Cancels the listing` | Verifica retorno de bonos al emisor y estado inactivo |
| 6 | `Deposits redemption funds` | Verifica depósito en redemption vault |
| 7 | `Fails to redeem bonds before maturity` | Prueba de guardia temporal (error `NotMaturedYet`) |
| 8 | `Redeems bonds after maturity` | Espera vencimiento y verifica pago de `face_value` |

**Parámetros de prueba:**
- 100 bonos emitidos, precio 1000 stablecoins, valor de cara 1100 stablecoins
- Vencimiento: 10 segundos desde el inicio del test
- 2 SOL de airdrop a emisor y comprador

---

## 🚀 Requisitos Previos

```bash
# Rust (Recomendado 1.85.0 para compatibilidad con crates modernos)
rustup default 1.85.0

# Solana CLI (Versión 1.18.23 recomendada para evitar conflictos de Agave 2.x)
agave-install init 1.18.23

# Anchor CLI
avm use 0.31.0
```

---

## ▶️ Instrucciones de Ejecución

### 1. Instalar dependencias

```bash
cd bonos-program
yarn install
```

### 2. Levantar validador local

```bash
solana-test-validator --reset
```

### 3. Ejecutar tests de integración

```bash
anchor test --skip-local-validator
```
> O simplemente `anchor test` para levantar el validador automáticamente.

### 4. Ejecutar el frontend

```bash
cd app
npm install
npm run dev
```
> Abre http://localhost:5173 en tu navegador.

### 5. Despliegue en Devnet

```bash
# Configurar red
solana config set --url devnet

# Fondear wallet
solana airdrop 2

# Build y deploy
anchor build
anchor deploy --provider.cluster devnet
```

---

---

## 🛠️ Hallazgos de Compatibilidad y Troubleshooting

Durante la configuración del entorno, se identificaron y resolvieron los siguientes puntos críticos:

### 1. Incompatibilidad de `Cargo.lock` v4
El toolchain moderno de Rust (1.80+) genera por defecto archivos `Cargo.lock` en versión 4. Sin embargo, el compilador SBF interno de Solana (basado en cargo 1.75.0) **no reconoce esta versión**.
- **Solución**: Se debe forzar el lockfile a versión 3 usando un downgrade manual o limitando la resolución de dependencias. En este proyecto se estabilizó usando Solana `1.18.23`.

### 2. Dependencias con `edition2024`
Crates como `toml_datetime`, `constant_time_eq` y `borsh` han empezado a requerir la edición 2024 de Rust en sus versiones más recientes. El compilador de Solana actual (Agave 2.x o Solana 1.18) aún no soporta esta edición para el target SBF.
- **Solución**: Se han aplicado parches en `Cargo.toml` o se han fijado versiones específicas (ej. `borsh 0.10.3`, `solana-program 1.17.31`) para mantener la compatibilidad.

### 3. Restricción de Hardware: AVX2
El comando `solana-test-validator` en las versiones de Agave (1.18.x+) requiere que el procesador soporte el conjunto de instrucciones **AVX2**. 
- **Problema**: Si tu CPU es antigua o no tiene AVX2, el validador abortará con `Incompatible CPU detected`.
- **Alternativa**: Utilizar la **Devnet** (`solana config set --url devnet`) para todas las pruebas funcionales.

### 5. Configuración del Toolchain Anchor
Para asegurar la compatibilidad entre el `anchor-lang` (0.31.0) y el CLI moderno (`1.0.0-rc.5`), es fundamental incluir la sección `[toolchain]` en el `Anchor.toml`.
- **Configuración**: 
  ```toml
  [toolchain]
  anchor_version = "0.31.0"
  ```
- **Nota**: Si persiste la advertencia visual en el build, asegúrese de que `avm` esté apuntando correctamente a la versión 0.31.0, aunque la configuración del archivo es la autoridad principal para el entorno.

---

## 📁 Archivos Importantes

| Archivo | Descripción |
|---|---|
| [`programs/bonos-program/src/lib.rs`](bonos-program/programs/bonos-program/src/lib.rs) | Smart contract principal |
| [`tests/bonos-program.ts`](bonos-program/tests/bonos-program.ts) | Suite de tests de integración |
| [`app/src/App.jsx`](bonos-program/app/src/App.jsx) | Frontend React principal |
| [`Anchor.toml`](bonos-program/Anchor.toml) | Configuración del proyecto Anchor |
| [`Cargo.toml`](bonos-program/Cargo.toml) | Workspace Rust y patches |

---

## 📄 Licencia

ISC
