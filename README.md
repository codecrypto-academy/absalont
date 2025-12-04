# absalont
###### Codecrypto Academy Student Repo

# Repositorio GitHub

Descargar proyectos en el local:
```
mkdir proyectos_absalont
cd proyectos_absalont
git init
git remote add origin https://github.com/codecrypto-academy/absalont.git
git remote -v
	origin	https://github.com/codecrypto-academy/absalont.git (fetch)
	origin	https://github.com/codecrypto-academy/absalont.git (push)
git fetch origin	
git checkout 4_proyectos	
git pull origin 4_proyectos
ls -lha
	dao_voting
	e_commerce
	eth-database-document
	escrow
	.git
	README.md
```

# Proyecto E-Commerce con Blockchain y Stablecoins

## Descripción General

Sistema completo de e-commerce basado en blockchain que integra stablecoins (EuroToken), pagos con criptomonedas y gestión de comercio electrónico mediante smart contracts.

## 📁 Estructura del Proyecto

```
e_commerce/
├── stablecoin/
│   ├── sc/                          # Smart Contract EuroToken (ERC20)
│   ├── compra-stableboin/           # App para comprar tokens con Stripe
│   └── pasarela-de-pago/            # Pasarela de pagos con tokens
├── sc-ecommerce/                    # Smart Contract E-commerce
├── web-admin/                       # Panel de administración (en desarrollo)
├── web-customer/                    # Tienda online (en desarrollo)
├── restart-all.sh                   # Script de deploy completo
└── PROYECTO.md                      # Especificación completa
```

# DAO Voting - Sistema de Votación Gasless

## Descripción General

Sistema completo de DAO (Organización Autónoma Descentralizada) que permite a los usuarios votar propuestas **sin pagar gas**, utilizando meta-transacciones (EIP-2771).

## 📁 Estructura del Proyecto

```
dao_voting/
├── sc/                          # Smart Contracts (Foundry)
│   ├── src/
│   │   ├── MinimalForwarder.sol # EIP-2771 Forwarder
│   │   └── DAOVoting.sol        # Contrato principal del DAO
│   ├── test/                    # Tests de contratos
│   ├── script/                  # Scripts de deployment
│   └── foundry.toml
│
├── web/                         # Frontend (Next.js 15)
│   ├── src/
│   │   ├── app/                 # App router
│   │   ├── components/          # Componentes React
│   │   ├── context/             # Web3 Context
│   │   ├── hooks/               # Custom hooks
│   │   └── lib/                 # Utilidades y ABIs
│   └── package.json
│
└── README.md
```

# ETH Database Document - dApp de Verificación de Documentos

## Descripción General

Una aplicación descentralizada (dApp) para almacenar y verificar la autenticidad de documentos utilizando blockchain Ethereum.

## 📁 Estructura del Proyecto

```
eth-database-document/
├── contracts/
│   ├── DocumentRegistry.sol
│   └── interfaces/
│       └── IDocumentRegistry.sol
├── test/
│   └── DocumentRegistry.t.sol
├── script/
│   └── Deploy.s.sol
├── dapp/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── providers.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── FileUploader.tsx
│   │   ├── DocumentSigner.tsx
│   │   ├── DocumentVerifier.tsx
│   │   ├── DocumentHistory.tsx
│   │   └── WalletSelector.tsx
│   ├── contexts/
│   │   └── WalletContext.tsx
│   ├── hooks/
│   │   ├── useContract.ts
│   │   └── useFileHash.ts
│   ├── utils/
│   │   ├── ethers.ts
│   │   └── hash.ts
│   ├── types/
│   │   └── ethereum.d.ts
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── foundry.toml
├── package.json
└── README.md
```

# Proyecto Escrow DApp

## Descripción General

Crear una aplicación descentralizada (DApp) completa para realizar intercambios seguros de tokens ERC20 utilizando un contrato inteligente de escrow.

## 📁 Estructura del Proyecto

```
escrow/
│
├── 🔗 Smart Contracts (Foundry)
│   └── sc/
│       ├── src/
│       │   ├── ✅ Escrow.sol              (250 líneas - Contrato principal)
│       │   ├── ✅ MockERC20.sol           (32 líneas - Mock para testing)
│       │   └── interfaces/
│       │       └── ✅ IEscrow.sol         (60 líneas - Interfaz del contrato)
│       ├── script/
│       │   └── ✅ Deploy.s.sol            (Script deployment)
│       └── test/
│           └── ✅ Escrow.t.sol            (348 líneas - 23 tests)
│
├── 🎨 Frontend (Next.js 14)
│   └── web/
│       └── src/
│           ├── ✅ components/             (6 componentes principales)
│           │   ├── ConnectionButton.tsx
│           │   ├── AddToken.tsx
│           │   ├── CreateOperation.tsx
│           │   ├── OperationsList.tsx
│           │   ├── BalanceDebug.tsx
│           │   └── WalletSelector.tsx
│           ├── ✅ hooks/                  (5 hooks personalizados)
│           │   ├── useWallet.ts
│           │   ├── useContract.ts
│           │   ├── useEscrow.ts
│           │   ├── useBalance.ts
│           │   └── useToken.ts
│           ├── ✅ context/                (Context wallet global)
│           │   └── WalletContext.tsx
│           ├── ✅ lib/                    (Utilidades)
│           │   ├── constants.ts
│           │   └── ethers.ts
│           └── ✅ types/                  (TypeScript types)
│               ├── index.ts
│               ├── escrow.ts
│               └── ethereum.d.ts
│
└── 📝 Documentación & Scripts
    ├── ✅ PROJECT_STATUS.md       (Resumen completo)
    ├── ✅ QUICK_START.md          (Guía rápida)
    ├── ✅ setup.sh                (Script setup)
    ├── ✅ dev-start.sh            (Script desarrollo)
    ├── ✅ START_HERE.md
    ├── ✅ TESTING.md
    ├── ✅ DEPLOYMENT.md
    └── ✅ ARCHITECTURE.md
```