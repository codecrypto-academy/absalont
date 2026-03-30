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

## 📁 Estructura del Proyecto

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

# Proyecto web con Rocket

## Descripción General


## 📁 Estructura del Proyecto

```

```

