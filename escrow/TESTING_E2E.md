# 🧪 Fase 12: Testing End-to-End

## Flujo de Prueba Completo del Escrow DApp

Documentación detallada para realizar pruebas end-to-end (E2E) en el Escrow DApp. Cubre todos los escenarios desde la inicialización hasta la verificación de operaciones.

---

## 📋 Prerrequisitos

Antes de comenzar las pruebas, asegúrate de tener:

- ✅ Node.js v18+ instalado
- ✅ MetaMask extensión en el navegador (o similar)
- ✅ Acceso a una terminal bash
- ✅ Proyecto `escrow` en la rama `4_proyectos`
- ✅ ~10 minutos para completar todas las pruebas

---

## 🚀 Guía de Pruebas Paso a Paso

### **Paso 1: Iniciar Anvil (Blockchain Local)**

**Objetivo:** Levantar una instancia local de Ethereum para desarrollo.

**Comandos:**
```bash
# Terminal 1: Iniciar Anvil
cd ~/Documentos/codecryto_academy/Ethereum\ Practice/proyectos_absalont/escrow
anvil
```

**Salida esperada:**
```
Starting the devnet with accounts...
⠙ Anvil is running on http://127.0.0.1:8545
...
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0x...
...
```

**✅ Validación:** Anvil debe mostrar 10 cuentas disponibles con ETH.

---

### **Paso 2: Ejecutar Deploy.sh (Desplegar Contratos)**

**Objetivo:** Compilar, desplegar los smart contracts y guardar direcciones.

**Comandos:**
```bash
# Terminal 2: Desplegar contratos
cd ~/Documentos/codecryto_academy/Ethereum\ Practice/proyectos_absalont/escrow
bash deploy.sh
```

**Salida esperada:**
```
╔══════════════════════════════════════════╗
║   Escrow DApp - Deployment Script        ║
╚══════════════════════════════════════════╝

Paso 1/6: Compilar contratos...
✓ Compilación exitosa

Paso 2/6: Obtener direcciones...
✓ Escrow: 0x5FbD...
✓ Token A: 0xe7f1...
✓ Token B: 0xa852...

Paso 3/6: Desplegar contratos...
✓ Escrow desplegado
✓ Tokens desplegados

...

Paso 6/6: Guardar configuración...
✓ Archivos de configuración actualizados

✅ ¡Deployment exitoso!
```

**✅ Validación:** Los contratos deben desplegarse sin errores y las direcciones deben guardarse en `web/src/lib/constants.ts`.

---

### **Paso 3: Iniciar Frontend (Next.js)**

**Objetivo:** Levantar el servidor de desarrollo de Next.js.

**Comandos:**
```bash
# Terminal 3: Iniciar frontend
cd ~/Documentos/codecryto_academy/Ethereum\ Practice/proyectos_absalont/escrow/web
npm run dev
```

**Salida esperada:**
```
> next dev
  
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.3s
```

**✅ Validación:** El servidor debe estar disponible en `http://localhost:3000`.

---

### **Paso 4: Importar Cuentas de Test en MetaMask**

**Objetivo:** Importar 2 cuentas de Anvil en MetaMask para simular dos usuarios.

**Procedimiento:**

1. **Abre MetaMask** en tu navegador
2. **Haz clic en el ícono de perfil** (arriba a la derecha)
3. **Selecciona "Importar cuenta"** (Import Account)
4. **Selecciona "Private Key"** como método de importación
5. **Copia la private key de Account #0 de Anvil:**
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad5d190140fef37723ee092
   ```
6. **Pega en MetaMask** y haz clic en "Importar"
7. **Repite el proceso con Account #1:**
   ```
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```

**✅ Validación:** Deberías tener 2 cuentas importadas en MetaMask:
- Account #0 (Admin) - 10000 ETH
- Account #1 - 10000 ETH

**Nota:** Asegúrate de que MetaMask está conectado a la red Anvil (http://localhost:8545)

---

### **Paso 5: Agregar Tokens Permitidos**

**Objetivo:** Registrar Token A y Token B en el contrato Escrow.

**Procedimiento:**

1. **Ve a `http://localhost:3000` en tu navegador**
2. **Haz clic en "Conectar Wallet"** (Connection Button)
3. **Selecciona "MetaMask"** y confirma la conexión con Account #0
4. **En la sección "Agregar Token"**, ingresa:
   - Token A (copia de `constants.ts`): `0xe7f1...`
   - Haz clic en **"Agregar Token"**
5. **Repite con Token B:**
   - Token B: `0xa852...`
   - Haz clic en **"Agregar Token"**

**✅ Validación:**
- No deben aparecer errores en la consola
- Los tokens deben estar disponibles en CreateOperation
- BalanceDebug debe mostrar balances de ambos tokens

---

### **Paso 6: Cambiar a Cuenta 2 en MetaMask**

**Objetivo:** Cambiar de usuario para simular una segunda parte.

**Procedimiento:**

1. **Haz clic en el selector de cuentas** en MetaMask (arriba del icono de perfil)
2. **Selecciona "Account #1"** (la segunda cuenta importada)
3. **Espera a que la página se recargue automáticamente**
4. **Verifica en la página que muestre la nueva dirección**

**✅ Validación:**
- El header debe mostrar "Connected: 0x7099..." (Account #1)
- Los balances en BalanceDebug deben ser los de Account #1
- La página debe funcionar con la nueva cuenta

---

### **Paso 7: Crear Operación con Cuenta 1**

**Objetivo:** La primera cuenta crea una operación de intercambio.

**Procedimiento:**

1. **Vuelve a Account #0** en MetaMask
2. **Ve a `http://localhost:3000`**
3. **En "Crear Operación", ingresa:**
   - Token A: (selecciona Token A del dropdown)
   - Cantidad A: `100`
   - Token B: (selecciona Token B del dropdown)
   - Cantidad B: `50`
   - Destinatario: (pega la dirección de Account #1)
   ```
   0x70997970C51812e339d9B73b0245Ad39965e02F7
   ```
4. **Haz clic en "✅ Crear Operación"**

**Flujo esperado:**
1. Se abre MetaMask pidiendo aprobar Token A
2. Confirmas la transacción
3. Se abre MetaMask pidiendo crear la operación
4. Confirmas la transacción
5. La página recarga automáticamente
6. Ves la operación en la lista con estado "⏳ Pendiente"

**✅ Validación:**
- La operación debe aparecer en "Operaciones Activas"
- Status debe ser "PENDING"
- Creador debe ser tu dirección (Account #0)
- Destinatario debe ser Account #1

---

### **Paso 8: Completar Operación con Cuenta 2**

**Objetivo:** La segunda cuenta completa la operación proporcionando Token B.

**Procedimiento:**

1. **Cambia a Account #1** en MetaMask
2. **Ve a `http://localhost:3000`**
3. **En la operación pendiente, haz clic en "✅ Completar"**

**Flujo esperado:**
1. Se abre MetaMask pidiendo aprobar Token B
2. Confirmas la transacción
3. Se abre MetaMask pidiendo completar la operación
4. Confirmas la transacción
5. La página recarga automáticamente
6. La operación ahora muestra status "✅ Completada"

**✅ Validación:**
- La operación debe estar marcada como "COMPLETED"
- Status badge debe ser verde
- Los botones de acción deben desaparecer
- El mensaje debe decir "✅ Esta operación ha sido completada"

---

### **Paso 9: Probar Cancelación de Operación**

**Objetivo:** Verificar que el creador puede cancelar operaciones pendientes.

**Procedimiento:**

1. **Vuelve a Account #0** en MetaMask
2. **Ve a `http://localhost:3000`**
3. **Crea una nueva operación:**
   - Token A: Token A
   - Cantidad A: `50`
   - Token B: Token B
   - Cantidad B: `25`
   - Destinatario: (Account #1)
4. **Espera a que aparezca en la lista**
5. **Haz clic en "❌ Cancelar Operación"**

**Flujo esperado:**
1. Se abre MetaMask pidiendo confirmar cancelación
2. Confirmas la transacción
3. La página recarga automáticamente
4. La operación ahora muestra status "❌ Cancelada"

**✅ Validación:**
- La operación debe estar marcada como "CANCELLED"
- Status badge debe ser rojo
- El mensaje debe decir "❌ Esta operación ha sido cancelada"
- Los botones de acción deben desaparecer

---

## ✅ Checklist de Validación

### **Después de cada paso, verifica:**

| Paso | Componente | Estado Esperado | Validación |
|------|-----------|------------------|-----------|
| 1 | Anvil | En ejecución | `http://127.0.0.1:8545` accesible |
| 2 | Deployment | Exitoso | Direcciones en `constants.ts` |
| 3 | Frontend | En ejecución | `http://localhost:3000` accesible |
| 4 | MetaMask | Cuentas importadas | 2 cuentas con 10000 ETH cada una |
| 5 | Tokens | Registrados | Ambos tokens en dropdown |
| 6 | Cambio de cuenta | Exitoso | Página muestra nueva dirección |
| 7 | Crear operación | Completada | Operación aparece en lista |
| 8 | Completar operación | Completada | Status cambio a "COMPLETED" |
| 9 | Cancelar operación | Completada | Status cambio a "CANCELLED" |

---

## 🧪 Casos de Prueba Adicionales

### **Caso 1: Validación de Monto Negativo**
```
1. En CreateOperation, intenta ingresar monto negativo (-100)
2. Espera a que el formulario muestre error
✓ Debe mostrar ErrorAlert rojo: "Monto debe ser positivo"
```

### **Caso 2: Dirección Inválida**
```
1. En CreateOperation, ingresa dirección inválida (xyz123)
2. Intenta crear operación
✓ Debe mostrar ErrorAlert: "Dirección inválida"
```

### **Caso 3: Tokens Iguales**
```
1. En CreateOperation, selecciona Token A en ambos campos
2. Intenta crear operación
✓ Debe mostrar ErrorAlert: "Los tokens deben ser diferentes"
```

### **Caso 4: Rechazo en MetaMask**
```
1. Intenta crear operación
2. En MetaMask, rechaza la transacción
✓ Debe mostrar ErrorAlert: "Usuario rechazó la transacción"
```

### **Caso 5: Saldo Insuficiente**
```
1. Intenta crear operación con monto muy alto (10000 tokens)
2. En MetaMask, confirma
✓ Debe mostrar ErrorAlert: "Saldo insuficiente"
```

---

## 📊 Puntos de Control (Checkpoints)

Durante el testing, verifica estos puntos:

### **Conexión de Wallet**
- [ ] ConnectionButton muestra dirección truncada
- [ ] Se puede cambiar de cuenta en MetaMask
- [ ] La página se actualiza automáticamente

### **Formulario de CreateOperation**
- [ ] Validación de campos vacíos
- [ ] Validación de montos negativos
- [ ] Validación de dirección
- [ ] Mensaje de error cuando tokens son iguales

### **Lista de Operaciones**
- [ ] Las operaciones aparecen en orden
- [ ] Los estados se actualizan correctamente
- [ ] Los botones se deshabilitan cuando es apropiado
- [ ] Auto-refresh funciona (cada 5 segundos)

### **BalanceDebug**
- [ ] Muestra balances correctos
- [ ] Se puede expandir/colapsar
- [ ] El botón Refresh actualiza balances
- [ ] Se muestra el balance del Escrow

### **Error Handling**
- [ ] ErrorAlert aparece en rojo para errores
- [ ] Mensajes son claros en español
- [ ] Se puede cerrar con botón ✕
- [ ] No hay crashes de la aplicación

---

## 🔍 Debugging

Si encuentras problemas durante las pruebas:

### **Problema: MetaMask no se conecta**
```
Solución:
1. Verifica que Anvil está corriendo en http://127.0.0.1:8545
2. En MetaMask, agrega la red manualmente:
   - URL RPC: http://127.0.0.1:8545
   - Chain ID: 31337
3. Recarga la página
```

### **Problema: Los tokens no aparecen**
```
Solución:
1. Verifica que el script deploy.sh corrió sin errores
2. Revisa que las direcciones en constants.ts son correctas
3. Intenta recargar la página (Ctrl + Shift + R)
4. Mira la consola del navegador por errores
```

### **Problema: La operación no aparece en la lista**
```
Solución:
1. Espera 5 segundos (auto-refresh)
2. Haz clic en "Refresh" en BalanceDebug
3. Recarga la página
4. Mira la consola por errores de contracto
```

### **Problema: Error "Wallet no conectada"**
```
Solución:
1. Haz clic en ConnectionButton
2. Selecciona MetaMask
3. Confirma la conexión
4. Espera a que la página recargue
```

---

## 📝 Reporte de Pruebas

Al completar todas las pruebas, genera un reporte:

```markdown
# Reporte de Pruebas - Escrow DApp

**Fecha:** 2 de diciembre de 2025
**Probador:** [Tu nombre]
**Navegador:** [Chrome/Firefox/Safari]

## Resumen
- Total de pasos: 9
- Exitosos: ✅ 9/9
- Fallidos: ❌ 0/9

## Detalles por Paso

### Paso 1: Iniciar Anvil
Status: ✅ Exitoso
Observaciones: Anvil inició sin problemas

### Paso 2: Deploy
Status: ✅ Exitoso
Observaciones: Todos los contratos desplegados

...

## Casos de Prueba Adicionales
- [ ] Validación de monto negativo: ✅
- [ ] Dirección inválida: ✅
- [ ] Tokens iguales: ✅
- [ ] Rechazo en MetaMask: ✅
- [ ] Saldo insuficiente: ✅

## Conclusión
El Escrow DApp está ✅ LISTO PARA PRODUCCIÓN

Todos los tests pasaron exitosamente. La aplicación es robusta
y está lista para deploy en testnet o mainnet.
```

---

## 🚀 Próximos Pasos Después de Testing

Una vez completadas todas las pruebas:

1. **✅ Verificar métricas:** 
   - Todos los 9 pasos completados
   - Todos los casos adicionales validados
   - Cero errores no manejados

2. **✅ Documentar resultados:**
   - Crear reporte de pruebas
   - Tomar screenshots
   - Anotar cualquier observación

3. **✅ Deploy en testnet (opcional):**
   - Cambiar RPC a testnet (Sepolia, Goerli, etc.)
   - Usar faucet para obtener testnet ETH
   - Repetir algunos pasos críticos

4. **✅ Deployment en producción (futuro):**
   - Deploy en mainnet si es necesario
   - Configurar alertas
   - Monitoreo continuo

---

## 📞 Contacto y Soporte

Si encuentras problemas durante el testing:

1. **Revisa los logs:**
   - Terminal de Anvil
   - Terminal del frontend (Next.js)
   - Consola del navegador (F12 → Console)

2. **Verifica la configuración:**
   - URLs correctas en constants.ts
   - MetaMask configurado para Anvil
   - Cuentas con suficiente ETH

3. **Documenta el problema:**
   - Error exacto
   - Pasos para reproducir
   - Información del navegador
   - Logs relevantes

---

**Estado:** ✅ Fase 12 - Testing E2E - Documentación Completa

Última actualización: 2 de diciembre de 2025
