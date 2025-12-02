# DAO Voting - Sistema de Votación Gasless

Sistema completo de DAO (Organización Autónoma Descentralizada) con votación gasless usando meta-transacciones EIP-2771.

## 🎯 Características

- ✅ **Votación Gasless**: Los usuarios votan sin pagar gas
- ✅ **Meta-transacciones EIP-2771**: Relayer paga el gas por los usuarios
- ✅ **Sistema de Propuestas**: Crear y gestionar propuestas de transferencia de fondos
- ✅ **Votación Flexible**: A FAVOR, EN CONTRA o ABSTENCIÓN
- ✅ **Ejecución Automática**: Daemon ejecuta propuestas aprobadas
- ✅ **Interfaz Moderna**: Next.js 15 con Tailwind CSS
- ✅ **Tests Completos**: >80% coverage en contratos

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

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- Foundry (Forge, Anvil)
- MetaMask

### 1. Instalar Dependencias

```bash
# Smart Contracts
cd sc
forge install

# Frontend
cd ../web
npm install
```

### 2. Iniciar Blockchain Local

En una terminal:
```bash
anvil
```

### 3. Desplegar Contratos

En otra terminal:
```bash
cd sc
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

Guarda las direcciones de los contratos desplegados.

### 4. Configurar Frontend

```bash
cd web
cp .env.example .env.local
```

Edita `.env.local` con las direcciones de los contratos:
```env
NEXT_PUBLIC_DAO_ADDRESS=0x...
NEXT_PUBLIC_FORWARDER_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=31337
RELAYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://127.0.0.1:8545
```

### 5. Iniciar Frontend

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📚 Flujo de Uso

### 1. Conectar Wallet
- Haz clic en "Conectar Wallet"
- Acepta la conexión en MetaMask
- Asegúrate de estar en la red correcta (localhost:8545)

### 2. Financiar el DAO
- Ve al panel "Financiar DAO"
- Ingresa la cantidad de ETH a depositar
- Confirma la transacción en MetaMask

### 3. Crear Propuesta
- Requieres al menos 10% del balance total del DAO
- Ingresa la dirección del beneficiario
- Especifica la cantidad de ETH
- Define los días de duración de votación

### 4. Votar (Gasless)
- Selecciona una propuesta activa
- Haz clic en "A Favor", "En Contra" o "Abstención"
- Firma el mensaje en MetaMask (sin pagar gas)
- El voto se registra automáticamente

### 5. Ejecutar Propuesta
- Las propuestas aprobadas se ejecutan automáticamente después del período de seguridad
- O manualmente haciendo clic en "Ejecutar Propuesta"

## 🔧 Desarrollo

### Ejecutar Tests

```bash
cd sc
forge test                    # Ejecutar todos los tests
forge test -vv               # Con detalle
forge test --gas-report      # Con reporte de gas
forge coverage               # Ver coverage
```

### Compilar Contratos

```bash
cd sc
forge build
```

### Verificar Contratos

```bash
forge verify-contract <ADDRESS> <CONTRACT> --chain-id <ID> --etherscan-api-key <KEY>
```

## 📖 Arquitectura

### Meta-transacciones (EIP-2771)

1. Usuario firma mensaje off-chain con EIP-712
2. Frontend envía firma al endpoint `/api/relay`
3. Relayer valida firma y llama a `MinimalForwarder.execute()`
4. Forwarder valida y ejecuta en `DAOVoting`
5. DAOVoting usa `_msgSender()` para obtener usuario original

### Sistema de Votación

- **Creación**: Requiere ≥10% del balance total
- **Votación**: Requiere balance > 0, un voto por propuesta
- **Cambio de voto**: Permitido antes del deadline
- **Ejecución**: Automática si votos positivos > negativos después de deadline + período de seguridad (1 hora)

## 🔐 Seguridad

- ✅ Validación de firmas con ECDSA
- ✅ Nonces para prevenir replay attacks
- ✅ Período de seguridad antes de ejecución
- ✅ Validación de balance para crear propuestas
- ✅ Uso de `_msgSender()` en lugar de `msg.sender`
- ✅ OpenZeppelin contracts auditados

## 🧪 Testing

El proyecto incluye tests completos:

- ✅ Tests de MinimalForwarder (verificación, ejecución, replay attacks)
- ✅ Tests de DAOVoting (creación, votación, ejecución)
- ✅ Tests de votación gasless
- ✅ Tests de edge cases
- ✅ Coverage >80%

## 📝 Comandos Útiles

```bash
# Smart Contracts
cd sc
forge test                # Tests
forge build              # Compilar
forge clean              # Limpiar
forge coverage           # Coverage

# Frontend
cd web
npm run dev             # Desarrollo
npm run build           # Build producción
npm run lint            # Linter
npm start               # Servidor producción

# Daemon (ejecutar propuestas)
curl http://localhost:3000/api/daemon
```

## 🌐 Deployment en Testnet

### 1. Configurar Variables

```bash
cd sc
cp .env.example .env
```

Edita `.env`:
```
PRIVATE_KEY=tu_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
ETHERSCAN_API_KEY=tu_api_key
```

### 2. Desplegar

```bash
source .env
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

### 3. Actualizar Frontend

Actualiza `.env.local` con las nuevas direcciones y `NEXT_PUBLIC_CHAIN_ID=11155111`

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE

## 🆘 Troubleshooting

### MetaMask no conecta
- Verifica que estés en la red correcta (Chain ID 31337 para Anvil)
- Añade red custom en MetaMask: RPC URL `http://127.0.0.1:8545`, Chain ID `31337`

### Error en votación gasless
- Verifica que el relayer tenga fondos
- Revisa las direcciones en `.env.local`
- Chequea logs del servidor Next.js

### Tests fallan
- Ejecuta `forge install` para instalar dependencias
- Limpia cache: `forge clean`
- Verifica versión de Solidity en contratos

## 📞 Soporte

Para preguntas o issues, abre un issue en GitHub.

---

**¡Disfruta tu DAO con votación gasless!** 🚀
