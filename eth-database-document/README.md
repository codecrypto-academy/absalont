# ETH Database Document - dApp de Verificación de Documentos

Una aplicación descentralizada (dApp) para almacenar y verificar la autenticidad de documentos utilizando blockchain Ethereum.

## 🚀 Características

- **Almacenamiento seguro**: Guarda hashes de archivos junto con timestamps y firmas digitales
- **Firma digital**: Los usuarios firman hashes de documentos usando wallets de Anvil
- **Selección de cuenta**: Interfaz para elegir entre 10 wallets de prueba de Anvil
- **Verificación**: Comprueba la autenticidad de un documento proporcionando el archivo y la dirección del firmante
- **Desarrollo simplificado**: Sin necesidad de MetaMask - usa wallets integradas de Anvil
- **Totalmente descentralizado**: Sin servidores centralizados, todo funciona en el navegador

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

## 🛠️ Requisitos Previos

- [Node.js](https://nodejs.org/) v18+
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (para contratos Solidity)
- [Anvil](https://book.getfoundry.sh/anvil/) (incluido con Foundry)
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd eth-database-document
```

### 2. Instalar dependencias de Foundry

```bash
# Instalar Foundry
curl -L https://foundry.paradigm.xyz | bash foundryup

# Instalar dependencias
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
```

### 3. Instalar dependencias de Node.js

```bash
cd dapp
npm install
```

## 🚀 Ejecución

### Paso 1: Iniciar Anvil (Terminal 1)

```bash
anvil
```

Esto iniciará un nodo local de Ethereum en `http://localhost:8545` con 10 cuentas de prueba.

### Paso 2: Desplegar el contrato (Terminal 2)

```bash
# Ingresar a la carpeta principal (raiz) del proyecto
cd eth-database-document

# Compilar contrato
forge build

# Ejecutar tests de Smart Contract
forge test -vv
forge coverage

# Desde la raíz del proyecto
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

Copia la dirección del contrato desplegado y actualiza el archivo `.env.local`:

```bash
cd dapp
cp .env.local.example .env.local
# Edita .env.local con la dirección del contrato

# Crear archivo .env.local
cat > .env.local << EOF
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_MNEMONIC="test test test test test test test test test test test junk"
EOF

```

### Paso 3: Iniciar la dApp (Terminal 3)

```bash
cd dapp
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🧪 Tests

### Tests de Contratos

```bash
forge test -vvv
```

### Tests con coverage

```bash
forge coverage
```

## 📱 Uso de la Aplicación

### 1. Seleccionar Wallet

- Usa el selector de wallet en la parte superior para elegir una de las 10 cuentas de Anvil
- Cada cuenta tiene 10,000 ETH de prueba

### 2. Firmar un Documento

1. Ve a la pestaña "Firmar"
2. Arrastra o selecciona un archivo
3. La aplicación calculará el hash SHA-256
4. Haz clic en "Firmar y Almacenar en Blockchain"
5. Confirma la transacción

### 3. Verificar un Documento

1. Ve a la pestaña "Verificar"
2. Selecciona el archivo a verificar
3. Ingresa la dirección del firmante esperado
4. Haz clic en "Verificar Documento"

### 4. Ver Historial

- Ve a la pestaña "Historial" para ver todos los documentos que has firmado
- Puedes expandir cada documento para ver detalles completos

## 🔐 Seguridad

- Los documentos nunca se suben a la blockchain, solo sus hashes SHA-256
- Las firmas digitales se generan usando ECDSA
- El contrato verifica que la firma corresponde al remitente de la transacción
- Cada documento solo puede registrarse una vez

## 🏗️ Arquitectura Técnica

### Contrato Inteligente

- **Solidity 0.8.20** con optimizaciones habilitadas
- Recuperación de firmas ECDSA
- Eventos para tracking de documentos

### Frontend

- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **Ethers.js v6** para interacción con blockchain
- **Context API** para gestión de estado global

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios propuestos.
