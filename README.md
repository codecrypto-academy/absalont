# absalont
###### Codecrypto Academy Student Repo

# Repositorio GitHub

Descargar proyectos en el local:
```
mkdir blockchain_technology_rust_practice 
cd blockchain_technology_rust_practice
git init
git remote add origin https://github.com/codecrypto-academy/absalont.git
git remote -v
	origin	https://github.com/codecrypto-academy/absalont.git (fetch)
	origin	https://github.com/codecrypto-academy/absalont.git (push)
git fetch origin	
git checkout rust_practice	
git pull origin rust_practice
ls -lha
	bonos-program
	.git
	README.md
```

# 🏦 Solana Bonds DApp 

## Descripción General

Una DApp descentralizada construida sobre **Solana** y **Anchor Framework** que implementa el ciclo de vida completo de bonos financieros on-chain: emisión, compra, actualización de precio, cancelación, financiación de redención y canje al vencimiento.

## Estructura del Proyecto

```
── bonos-program/                   # Raíz del workspace Anchor
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

# Solana Auction DApp (Subastas)

## Descripción General

Este es un **Marketplace de Subastas Descentralizado** de alto rendimiento construido sobre la blockchain de Solana. Utiliza **Anchor** para la lógica de contratos inteligentes y **Next.js** para una experiencia de usuario fluida y profesional.

## Estructura del Proyecto

```
subastas/
├── subastas_program/          # Lógica On-Chain (Smart Contract)
│   ├── programs/
│   │   └── subastas_program/
│   │       └── src/
│   │           ├── instructions/  # Módulos de lógica procedimental
│   │           ├── state.rs       # Definición de estructuras de datos
│   │           └── lib.rs         # Entrypoint y Routing de cuentas
│   └── Anchor.toml            # Configuración del despliegue
├── subastas_app/              # Interfaz de Usuario (Frontend)
│   ├── src/
│   │   ├── app/               # Next.js App Router (Páginas y Estilos)
│   │   ├── context/           # GlobalContext (Sync de Wallet)
│   │   ├── services/          # SubastasProxy (Abstracción RPC)
│   │   └── constants/         # IDL y Direcciones del Programa
└── README.md                  # Documentación Maestra
```

# Solana Swap 2025

## Descripción General

Un mercado de intercambio de tokens descentralizado construido en **Solana** con el framework **Anchor**. Permite a una autoridad inicializar mercados entre dos tokens SPL, establecer precios y agregar liquidez, mientras que cualquier usuario puede realizar intercambios en ambas direcciones (A ⇄ B).

## Estructura del Proyecto

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

# Northwind Traders: E-Commerce & Dashboard Full-Stack

## Descripción General

Esta es una plataforma integral de alto rendimiento que combina un **Panel Administrativo (Dashboard)** y una **Tienda Virtual (E-commerce)**. El sistema utiliza **Rust** para un backend ultrarrápido y **Next.js** para una interfaz de usuario moderna, profesional y altamente interactiva.

## Estructura del Proyecto

```text
rust-telco/
├── back/                # Backend en Rust (Rocket + SQLite)
│   ├── src/
│   │   ├── main.rs      # Punto de entrada y configuración
│   │   ├── models.rs    # Modelos de datos (DTOs)
│   │   ├── db.rs        # Capa de persistencia y transacciones
│   │   └── routes.rs    # Controladores de la API (Stats, Checkout, CRM)
│   ├── northwind.db     # Base de datos SQLite persistente
│   └── Dockerfile       # Virtualización optimizada para Rust
├── front/               # Frontend en Next.js (App Router)
│   ├── src/
│   │   ├── app/         # Dashboard, Tienda y CRM
│   │   ├── components/  # Componentes UI (Shadcn/UI)
│   │   └── lib/         # Cliente API y lógica de estado
│   └── Dockerfile       # Multi-stage build para Next.js
└── docker-compose.yml   # Orquestación completa del ecosistema
```

