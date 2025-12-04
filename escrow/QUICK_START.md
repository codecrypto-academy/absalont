# ⚡ Quick Start - Escrow DApp

> Guía rápida para poner en funcionamiento el proyecto en 5 minutos

## 📋 Prerrequisitos

- ✅ Foundry instalado ([instalar](https://book.getfoundry.sh/getting-started/installation))
- ✅ Node.js 18+ instalado
- ✅ MetaMask o wallet compatible
- ✅ Código descargado/clonado

## 🚀 Pasos de Ejecución

### Paso 1: Setup Inicial (Primera Vez)

```bash
cd escrow
bash setup.sh
```

**¿Qué hace?**
- ✅ Verifica herramientas (Foundry, Node, npm)
- ✅ Instala librerías Foundry
- ✅ Compila smart contracts
- ✅ Ejecuta tests (23 tests)
- ✅ Instala npm packages
- ✅ Crea `.env.local`

**Tiempo:** ~3-5 minutos

---

### Paso 2: Iniciar Blockchain Local

**Terminal 1:**
```bash
anvil
```

**Output esperado:**
```
Listening on 127.0.0.1:8545
Account #0: 0x...
Private Key: 0x...
...
```

**⚠️ Importante:** No cierres esta terminal

---

### Paso 3: Deploy de Contratos

**Terminal 2:**
```bash
cd escrow/sc
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

**Output esperado:**
```
Script ran successfully.
Deployed to: 0x...

Escrow: 0x5FbDB2315678...
TokenA: 0xe7f1725E7734...
TokenB: 0xa85233C63B69...
```

**📝 Copia estas direcciones**

---

### Paso 4: Actualizar .env.local

**Terminal actual o editor:**
```bash
cd escrow/web
```

Edita `.env.local`:

```env
# De los logs del step 3
NEXT_PUBLIC_ESCROW_ADDRESS=0x5FbDB2315678...
NEXT_PUBLIC_TOKEN_A_ADDRESS=0xe7f1725E7734...
NEXT_PUBLIC_TOKEN_B_ADDRESS=0xa85233C63B69...

# Estas están ya configuradas
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

---

### Paso 5: Iniciar Frontend

**Terminal 3:**
```bash
cd escrow/web
npm run dev
```

**Output esperado:**
```
▲ Next.js 14.0.0
- Ready in 1.2s
- Local: http://localhost:3000
```

**Abre http://localhost:3000** 🎉

---

## 🔌 Usar la DApp

### 1. Conectar Wallet

1. Haz clic en "Conectar Wallet" (arriba derecha)
2. Selecciona MetaMask
3. Confirma la conexión

### 2. Cambiar a Red Local (Anvil)

1. En MetaMask, haz clic en el selector de red
2. Agrega red personalizada:
   - **Nombre:** Anvil Local
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
3. Cambia a "Anvil Local"

### 3. Importar Tokens (Opcional)

En MetaMask, importa los tokens MockERC20:
- Token A: `0xe7f1725E7734...`
- Token B: `0xa85233C63B69...`

---

## 🧪 Flujo de Prueba

### Escenario: User1 intercambia 100 TokenA por 50 TokenB de User2

#### User 1 (Iniciar Swap)

1. **Conecta Wallet**
   - Click "Conectar Wallet"
   - Selecciona Account #0 (0x1234...)

2. **Ir a "Crear Operación"**
   - Token A: `0xe7f1725E7734...`
   - Cantidad A: `100`
   - Token B: `0xa85233C63B69...`
   - Cantidad B: `50`
   - Recipient: `0x70997970C51812e339d9B73b0245Ad39965e02F7` (Account #1)
   - Click "Crear Operación"

3. **Aprobar Token A**
   - MetaMask pide aprobación
   - Confirma en MetaMask

#### User 2 (Completar Swap)

1. **Cambiar Cuenta en MetaMask**
   - Selecciona Account #1

2. **Refrescar página** (F5)

3. **Ir a "Operaciones Activas"**
   - Verá la operación creada por User 1
   - Click "Completar"

4. **Aprobar Token B**
   - MetaMask pide aprobación de 50 TokenB
   - Confirma

5. **Confirmación**
   - La operación cambia a "COMPLETED"
   - User 1 recibió 50 TokenB ✅
   - User 2 recibió 100 TokenA ✅

---

## 🐛 Troubleshooting

### "Provider not available"
- ❌ MetaMask no está conectada
- ✅ Instala MetaMask extension

### "Wallet not connected"
- ❌ No has conectado wallet
- ✅ Click en "Conectar Wallet" arriba derecha

### "Token A not allowed"
- ❌ El token no está agregado al contrato
- ✅ Owner debe hacer: Admin → "Agregar Token"

### "Only recipient can complete"
- ❌ Estás intentando completar con cuenta incorrecta
- ✅ Cambia a Account #1 en MetaMask

### "Amount must match operation"
- ❌ Ingresaste cantidad diferente
- ✅ Ingresa exactamente la cantidad especificada

---

## 🧹 Limpiar / Reiniciar

### Detener todo
```bash
# Terminal 1 (Anvil): Ctrl+C
# Terminal 2: Ctrl+C
# Terminal 3: Ctrl+C
```

### Reiniciar desde cero
```bash
# Detén anvil (Terminal 1)
# Inicia nuevo anvil
anvil

# Nuevo deploy
cd escrow/sc
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# Actualiza .env.local con nuevas direcciones
# Reinicia frontend (Terminal 3)
```

---

## 📊 Estructura de Carpetas (Referencia)

```
escrow/
├── sc/                    # Smart Contracts
│   ├── src/Escrow.sol
│   ├── test/Escrow.t.sol
│   └── script/Deploy.s.sol
├── web/                   # Frontend Next.js
│   ├── src/components/
│   └── .env.local        # ← Edita esto
├── setup.sh              # Script inicial
└── dev-start.sh          # Helper para iniciar
```

---

## 📚 Documentación Completa

Para información detallada:
- `PROJECT_STATUS.md` - Estado completo del proyecto
- `ARCHITECTURE.md` - Arquitectura detallada
- `TESTING.md` - Guía de testing
- `DEPLOYMENT.md` - Deployment a testnet

---

## ✅ Checklist de Ejecución

- [ ] Foundry instalado
- [ ] Node.js 18+ instalado
- [ ] Ejecuté `bash setup.sh` exitosamente
- [ ] Blockchain local (anvil) corriendo en Terminal 1
- [ ] Contratos desplegados con direcciones copiadas
- [ ] `.env.local` actualizado
- [ ] Frontend corriendo en `http://localhost:3000`
- [ ] MetaMask instalado y conectado
- [ ] Red Anvil Local agregada en MetaMask
- [ ] Prueba exitosa de swap completada

---

**¡Listo para usar! 🚀**

Cualquier duda, revisa `PROJECT_STATUS.md` para info completa.
