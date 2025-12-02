# absalont
###### Codecrypto Academy Student Repo

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