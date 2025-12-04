# 🚀 DEPLOYMENT AUTOMÁTICO - ESCROW DAPP

## Script: `deploy.sh`

El script `deploy.sh` automatiza completamente el deployment del proyecto. Ejecuta todos estos pasos:

### ✅ Pasos Automatizados

```
1. ✅ Desplegar el contrato Escrow
2. ✅ Desplegar dos tokens ERC20 de prueba (TokenA y TokenB)
3. ✅ Agregar ambos tokens al contrato Escrow
4. ✅ Mint 1000 tokens de cada tipo a cuentas de test de Anvil
5. ✅ Actualizar automáticamente web/.env.local con direcciones
6. ✅ Generar deployment-info.txt con toda la información
```

---

## 🎯 Cómo Usar

### Prerrequisitos

✅ Anvil corriendo en `http://localhost:8545`

```bash
# Terminal 1 - Blockchain local
anvil
```

### Ejecución

```bash
# Terminal 2 - Desde carpeta escrow/
cd escrow
bash deploy.sh
```

### Salida Esperada

```
╔════════════════════════════════════════════════════════╗
║ DEPLOY AUTOMÁTICO - ESCROW DAPP                       ║
╚════════════════════════════════════════════════════════╝

>>> Verificando que Anvil está corriendo...
✓ Anvil está disponible

╔════════════════════════════════════════════════════════╗
║ PASO 1: DESPLEGANDO CONTRATO ESCROW                   ║
╚════════════════════════════════════════════════════════╝

>>> Compilando contratos...
✓ Contratos compilados

>>> Desplegando contrato Escrow...
✓ Contrato Escrow desplegado

✓ Escrow Address: 0x5FbDB2315678afecb367f032d93F482f4a56a025
✓ TokenA Address: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✓ TokenB Address: 0xa85233C63B69bCcDA77070f8c2ce8032bEF88Bc9

[... más output ...]

✨ DEPLOYMENT COMPLETADO ✨

Escrow:        0x5FbDB2315678afecb367f032d93F482f4a56a025
TokenA:        0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
TokenB:        0xa85233C63B69bCcDA77070f8c2ce8032bEF88Bc9

CUENTAS DE PRUEBA:
Account #0 (Admin):  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account #1 (User):   0x70997970C51812e339d9B73b0245Ad39965e02F7
Account #2 (User):   0x3C44CdDdB6a900c6B318C5d4Eb0Efc0b4e6B41
```

---

## 📋 Qué Hace Cada Paso

### PASO 1: Desplegar Contrato Escrow
- Compila los contratos
- Ejecuta Deploy.s.sol
- Obtiene la dirección del contrato desplegado

### PASO 2: Desplegar Tokens ERC20
- El script Deploy.s.sol crea 2 tokens MockERC20
- TokenA y TokenB están listos para usar

### PASO 3: Agregar Tokens al Escrow
- Llama a `addToken()` para TokenA
- Llama a `addToken()` para TokenB
- Ambos tokens ahora están permitidos en el contrato

### PASO 4: Mint Tokens a Cuentas de Test
- Crea 1000 TokenA en cada cuenta de Anvil
- Crea 1000 TokenB en cada cuenta de Anvil
- Las cuentas ya tienen ETH de Anvil

### PASO 5: Actualizar .env.local
- Escribe automáticamente `web/.env.local` con:
  - `NEXT_PUBLIC_ESCROW_ADDRESS`
  - `NEXT_PUBLIC_TOKEN_A_ADDRESS`
  - `NEXT_PUBLIC_TOKEN_B_ADDRESS`
  - `NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545`
  - `NEXT_PUBLIC_CHAIN_ID=31337`

### PASO 6: Generar deployment-info.txt
- Archivo con toda la información del deployment
- Guía rápida de próximos pasos
- Fácil de compartir con otros desarrolladores

---

## 📝 Archivo deployment-info.txt

Después de ejecutar el script, se crea `deployment-info.txt`:

```
═══════════════════════════════════════════════════════════════
        DEPLOYMENT INFO - ESCROW DAPP
═══════════════════════════════════════════════════════════════

CONTRATO ESCROW:
  Dirección: 0x5FbDB2315678afecb367f032d93F482f4a56a025

TOKENS ERC20:
  TokenA: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  TokenB: 0xa85233C63B69bCcDA77070f8c2ce8032bEF88Bc9

CUENTAS DE PRUEBA (Anvil):
  Account #0 (Owner/Admin): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Account #1 (User):        0x70997970C51812e339d9B73b0245Ad39965e02F7
  Account #2 (User):        0x3C44CdDdB6a900c6B318C5d4Eb0Efc0b4e6B41

CONFIGURACIÓN:
  RPC URL:  http://127.0.0.1:8545
  Chain ID: 31337 (Anvil)

ARCHIVO ACTUALIZADO:
  ✓ web/.env.local

═══════════════════════════════════════════════════════════════
```

---

## 🎯 Flujo Completo (3 Terminales)

### Terminal 1: Blockchain Local
```bash
anvil
# Escucha en 127.0.0.1:8545
# Mantener abierto durante toda la sesión
```

### Terminal 2: Deploy Automático
```bash
cd escrow
bash deploy.sh
# Espera a que termine
# Te mostrará las direcciones
```

### Terminal 3: Frontend
```bash
cd escrow/web
npm run dev
# Frontend iniciado en http://localhost:3000
```

---

## ✅ Verificación Post-Deployment

### 1. Verificar que .env.local fue actualizado
```bash
cat web/.env.local
# Deberá mostrar:
# NEXT_PUBLIC_ESCROW_ADDRESS=0x...
# NEXT_PUBLIC_TOKEN_A_ADDRESS=0x...
# NEXT_PUBLIC_TOKEN_B_ADDRESS=0x...
```

### 2. Verificar que deployment-info.txt existe
```bash
cat deployment-info.txt
# Deberá mostrar toda la información del deployment
```

### 3. Acceder a Frontend
- Abre http://localhost:3000 en navegador
- Deberá conectarse a los contratos automáticamente

### 4. Verificar Balances en MetaMask
- Conecta Account #0
- Importa TokenA: copia la dirección de deployment-info.txt
- Importa TokenB: copia la dirección de deployment-info.txt
- Deberías ver 1000 tokens de cada tipo

---

## 🔧 Configuración MetaMask

### Agregar Red Anvil Local
1. Abre MetaMask
2. Click en selector de red (arriba)
3. Click en "Agregar red"
4. Ingresa:
   - Nombre: Anvil Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Símbolo: ETH
5. Click "Guardar"

### Importar Cuentas de Test
1. En MetaMask, Click en "Importar cuenta"
2. Copia la clave privada de Anvil (de Terminal 1)
3. Click "Importar"

**Cuentas de Anvil (precargadas):**
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d60549aab20b3d3055d2

Account #1: 0x70997970C51812e339d9B73b0245Ad39965e02F7
  Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900c6B318C5d4Eb0Efc0b4e6B41
  Private Key: 0x5de4111afa1a4b94908f83103db1fb1da28dfc6ae482220fb2e2361babe56e78
```

---

## 🧪 Prueba Rápida

Después de deployment, prueba esto:

1. **Conecta Wallet** (Account #0)
2. **Agrega Token** (AdminPanel)
   - Ya está agregado automáticamente
3. **Crea Operación**
   - Token A: [TokenA address]
   - Cantidad: 100
   - Token B: [TokenB address]
   - Cantidad: 50
   - Recipient: [Account #1 address]
4. **Cambiar a Account #1 en MetaMask**
5. **Completar Operación**
   - Click "Completar" en operación

**Resultado esperado:**
- Account #0: -100 TokenA, +50 TokenB
- Account #1: +100 TokenA, -50 TokenB

---

## 🆘 Troubleshooting

### "Anvil no está corriendo"
```bash
# Terminal 1 (nueva)
anvil
```

### "Error compilando contratos"
```bash
cd sc
forge clean
forge build
```

### "No se pudieron extraer las direcciones"
- Copia manualmente las direcciones del output
- Edita `web/.env.local` manualmente
- Copia la estructura de `web/.env.example`

### ".env.local no se actualiza en frontend"
- Reinicia: `npm run dev`
- Limpia cache: `rm -rf .next`
- Vuelve a ejecutar: `npm run dev`

---

## 📚 Scripts Disponibles

```bash
# Setup inicial (primera vez)
bash setup.sh

# Deploy automático (cada vez que quieras resetear)
bash deploy.sh

# Iniciar frontend
cd web && npm run dev

# Ejecutar tests
cd sc && forge test

# Compilar contratos
cd sc && forge build
```

---

## ✨ Ventajas de deploy.sh

✅ **Automatización completa** - Un comando hace todo  
✅ **Sin errores manuales** - Extrae direcciones automáticamente  
✅ **Configuración auto** - Actualiza .env.local solo  
✅ **Información guardada** - deployment-info.txt para referencia  
✅ **Idempotente** - Puedes ejecutarlo varias veces  
✅ **Rápido** - Todo en 30 segundos  

---

## 🎯 Resumen

| Acción | Comando | Tiempo |
|--------|---------|--------|
| Setup inicial | `bash setup.sh` | 3-5 min |
| Deploy automático | `bash deploy.sh` | ~30 seg |
| Iniciar frontend | `npm run dev` | ~5 seg |
| Prueba completa | Todos arriba | ~8 min |

---

**¡Deployment completamente automatizado! 🚀**
