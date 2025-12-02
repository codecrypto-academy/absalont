# Guía de Deployment en Producción

Esta guía cubre el deployment del proyecto DAO Voting en redes de prueba y producción.

## 🌐 Deployment en Sepolia Testnet

### Prerrequisitos

1. **ETH de Sepolia** para deployment y relayer
   - Faucet: https://sepoliafaucet.com/
   - Necesitas ~0.1 ETH para deployment
   - Relayer necesita ~0.5 ETH para operaciones

2. **RPC Provider**
   - Alchemy: https://www.alchemy.com/
   - Infura: https://infura.io/
   - O cualquier otro provider

3. **Etherscan API Key** (opcional, para verificación)
   - https://etherscan.io/apis

### Paso 1: Configurar Variables de Entorno

```bash
cd sc
cp .env.example .env
```

Edita `.env`:
```bash
# Tu private key (cuenta con ETH de Sepolia)
PRIVATE_KEY=0x...

# RPC URL de Sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# API key de Etherscan (para verificación)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

⚠️ **IMPORTANTE**: NUNCA commitear el archivo `.env` con private keys reales.

### Paso 2: Desplegar Contratos

```bash
cd sc
source .env

# Desplegar y verificar
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

**Guardar output:**
```
MinimalForwarder deployed at: 0x1234...
DAOVoting deployed at: 0x5678...
```

### Paso 3: Verificar Contratos Manualmente (si falla auto-verificación)

```bash
# Verificar MinimalForwarder
forge verify-contract \
  0x1234... \
  src/MinimalForwarder.sol:MinimalForwarder \
  --chain-id 11155111 \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Verificar DAOVoting
forge verify-contract \
  0x5678... \
  src/DAOVoting.sol:DAOVoting \
  --chain-id 11155111 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" 0x1234...)
```

### Paso 4: Configurar Frontend

```bash
cd web
cp .env.example .env.local
```

Edita `.env.local`:
```bash
# Direcciones de contratos desplegados
NEXT_PUBLIC_DAO_ADDRESS=0x5678...
NEXT_PUBLIC_FORWARDER_ADDRESS=0x1234...

# Sepolia Chain ID
NEXT_PUBLIC_CHAIN_ID=11155111

# Relayer configuration (crear nueva wallet para relayer)
RELAYER_PRIVATE_KEY=0x... # NUEVA private key solo para relayer
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

### Paso 5: Financiar Relayer

El relayer necesita ETH para pagar gas de meta-transacciones:

```bash
# Enviar ETH a la dirección del relayer
# Mínimo recomendado: 0.5 ETH en Sepolia
```

### Paso 6: Deploy Frontend

#### Opción A: Vercel (Recomendado)

```bash
cd web
npm install -g vercel
vercel
```

Configurar variables de entorno en Vercel dashboard:
- `NEXT_PUBLIC_DAO_ADDRESS`
- `NEXT_PUBLIC_FORWARDER_ADDRESS`
- `NEXT_PUBLIC_CHAIN_ID`
- `RELAYER_PRIVATE_KEY` (marcar como secret)
- `RPC_URL`

#### Opción B: VPS (Digital Ocean, AWS, etc.)

```bash
# En el servidor
cd web
npm install
npm run build
npm start

# O con PM2
npm install -g pm2
pm2 start npm --name "dao-voting" -- start
```

#### Opción C: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t dao-voting .
docker run -p 3000:3000 --env-file .env.local dao-voting
```

## 🔧 Configuración del Daemon

### Opción 1: Vercel Cron Jobs

Crear `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/daemon",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Opción 2: Cron en VPS

```bash
# Editar crontab
crontab -e

# Agregar línea (cada 5 minutos)
*/5 * * * * curl https://tu-dominio.com/api/daemon
```

### Opción 3: GitHub Actions

Crear `.github/workflows/daemon.yml`:
```yaml
name: Execute Proposals Daemon

on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  execute:
    runs-on: ubuntu-latest
    steps:
      - name: Execute daemon
        run: curl https://tu-dominio.com/api/daemon
```

## 🔒 Seguridad en Producción

### 1. Proteger API Routes

```typescript
// src/app/api/relay/route.ts
export async function POST(request: NextRequest) {
  // Agregar rate limiting
  const ip = request.ip || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  // Validar origen
  const origin = request.headers.get('origin');
  if (!allowedOrigins.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ... resto del código
}
```

### 2. Variables de Entorno Seguras

- Usar variables de entorno para secrets
- No hardcodear private keys
- Rotar relayer key periódicamente
- Monitorear balance del relayer

### 3. HTTPS

- Siempre usar HTTPS en producción
- Configurar certificados SSL
- Forzar HTTPS redirects

### 4. Monitoreo

```javascript
// Agregar logging y alertas
import { captureException } from '@sentry/nextjs';

try {
  // ... código
} catch (error) {
  captureException(error);
  // Enviar alerta si relayer tiene poco balance
  if (await checkRelayerBalance() < threshold) {
    await sendAlert('Relayer balance bajo');
  }
}
```

## 📊 Monitoreo Post-Deployment

### Métricas a Monitorear

1. **Balance del Relayer**
   ```bash
   cast balance $RELAYER_ADDRESS --rpc-url $RPC_URL
   ```

2. **Estado de Propuestas**
   ```bash
   cast call $DAO_ADDRESS "getProposalCount()" --rpc-url $RPC_URL
   ```

3. **Logs del Daemon**
   - Revisar logs de ejecuciones
   - Confirmar propuestas ejecutadas

4. **Errores en Relayer**
   - Monitorear logs de `/api/relay`
   - Alertar si tasa de error >5%

### Herramientas Recomendadas

- **Sentry**: Error tracking
- **Tenderly**: Smart contract monitoring
- **The Graph**: Indexar eventos
- **Datadog**: Infrastructure monitoring

## 🚀 Checklist de Deployment

### Pre-deployment
- [ ] Contratos auditados (si es producción real)
- [ ] Tests pasan con 100% coverage
- [ ] Variables de entorno configuradas
- [ ] Relayer fondeado con suficiente ETH
- [ ] Frontend testeado localmente con contratos de Sepolia

### Deployment
- [ ] Contratos desplegados en Sepolia
- [ ] Contratos verificados en Etherscan
- [ ] Frontend desplegado
- [ ] Variables de entorno configuradas en plataforma
- [ ] Daemon configurado y funcionando

### Post-deployment
- [ ] Verificar frontend carga correctamente
- [ ] Probar conexión de wallet
- [ ] Probar financiación del DAO
- [ ] Probar creación de propuesta
- [ ] Probar votación gasless
- [ ] Verificar daemon ejecuta propuestas
- [ ] Configurar monitoreo y alertas
- [ ] Documentar direcciones de contratos
- [ ] Compartir enlaces públicos

## 🔄 Actualización de Contratos

⚠️ **Nota**: Los contratos actuales NO son upgradeable. Para actualizar:

1. Desplegar nuevos contratos
2. Migrar fondos (si necesario)
3. Actualizar frontend con nuevas direcciones
4. Deprecar contratos antiguos

**Para contratos upgradeable** (opcional), investigar:
- OpenZeppelin Upgradeable Contracts
- UUPS Proxy Pattern
- Transparent Proxy Pattern

## 📝 URLs de Referencia

### Sepolia
- **Block Explorer**: https://sepolia.etherscan.io/
- **Faucet**: https://sepoliafaucet.com/
- **Chain ID**: 11155111
- **RPC**: https://rpc.sepolia.org/

### Mainnet (SOLO si es producción real)
- **Block Explorer**: https://etherscan.io/
- **Chain ID**: 1
- **Considerar auditoría profesional**
- **Seguro para contratos**

## 🆘 Troubleshooting

### Error: "Insufficient funds for gas"
- Verificar balance del relayer
- Enviar más ETH a relayer address

### Error: "Nonce too high"
- Reset nonce en MetaMask
- O esperar a que se sincronice

### Frontend no conecta a contratos
- Verificar direcciones en `.env.local`
- Verificar Chain ID correcto
- Verificar RPC URL funciona

### Daemon no ejecuta propuestas
- Verificar cron está configurado
- Verificar relayer tiene fondos
- Revisar logs de errores
- Verificar timing de safety period

---

**¡Deployment exitoso!** 🎉 Tu DAO está listo para producción.
