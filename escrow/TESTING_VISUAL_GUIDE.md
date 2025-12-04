# 📸 Guía Visual de Testing del Escrow DApp

## Escenarios de Prueba Detallados con Ejemplos

---

## 1️⃣ **Escenario 1: Crear Operación (Cuenta #0)**

### Visual del Flujo:

```
┌─────────────────────────────────────────────────────────┐
│ Pantalla Principal - Escrow DApp                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Header: 🔐 Escrow DApp                  [Conectar]      │
│                                                          │
├─ Columna 1: Crear Operación ──────────────────────────┐ │
│                                                        │ │
│ 📝 Crear Operación                                    │ │
│                                                        │ │
│ 🔄 Token A (Enviarás):                                │ │
│ [Token A ▼]                                           │ │
│ [100] cantidad                                        │ │
│                                                        │ │
│ 🔄 Token B (Recibirás):                               │ │
│ [Token B ▼]                                           │ │
│ [50] cantidad                                         │ │
│                                                        │ │
│ 👤 Dirección del Destinatario:                         │ │
│ [0x7099...]                                           │ │
│                                                        │ │
│ [✅ Crear Operación] (botón)                          │ │
│                                                        │ │
└────────────────────────────────────────────────────────┘ │
│
├─ Columna 2: Operaciones Activas ──────────────────────┐ │
│                                                        │ │
│ (Lista vacía inicialmente)                            │ │
│                                                        │ │
└────────────────────────────────────────────────────────┘ │
│
├─ Columna 3: BalanceDebug ─────────────────────────────┐ │
│                                                        │ │
│ 🔍 Debug Panel - Ver Balances          [Listo]        │ │
│                                                        │ │
│ 💼 Contrato Escrow (DESTACADO)                        │ │
│ ETH: 0.0 ether                                        │ │
│ Token A: 1000                                         │ │
│ Token B: 1000                                         │ │
│                                                        │ │
│ Account #0 (Admin):                    [ADMIN]        │ │
│ ETH: 10000 ETH                                        │ │
│ Token A: 1000                                         │ │
│ Token B: 1000                                         │ │
│                                                        │ │
└────────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Pasos a Realizar:

```
1. Ingresa Token A: Token A (del dropdown)
2. Ingresa Cantidad A: 100
3. Ingresa Token B: Token B (del dropdown)
4. Ingresa Cantidad B: 50
5. Ingresa Destinatario: 0x70997970C51812e339d9B73b0245Ad39965e02F7
6. Haz clic en "✅ Crear Operación"
```

### MetaMask Confirmaciones (2):

**Confirmación 1: Aprobar Token A**
```
┌──────────────────────────────────────┐
│ ⏳ Aprobando Token A...               │
│ Tx: 0x5f8e...                        │
└──────────────────────────────────────┘
        ↓ (1 segundo de espera)
┌──────────────────────────────────────┐
│ ✅ Token A aprobado correctamente     │
└──────────────────────────────────────┘
```

**Confirmación 2: Crear Operación**
```
┌──────────────────────────────────────┐
│ ⏳ Creando operación...               │
│ Tx: 0x2a3b...                        │
└──────────────────────────────────────┘
        ↓ (confirmación)
┌──────────────────────────────────────┐
│ ✅ ¡Operación creada exitosamente!    │
│ Tx: 0x2a3b...                        │
│                                      │
│ (Página recarga en 2s)               │
└──────────────────────────────────────┘
```

### Resultado Esperado:

```
┌─────────────────────────────────────────────────────────┐
│ 📋 Operaciones Activas                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Operación #0                               ⏳ PENDING   │
│                                                          │
│ Creador: 0xf39F...                                      │
│ Destinatario: 0x7099...                                 │
│                                                          │
│ 🔄 Token A                │  🔄 Token B                 │
│ 100.0                     │  50.0                       │
│ 0xe7f1...                 │  0xa852...                  │
│                                                          │
│ [❌ Cancelar Operación]  [ℹ️ Eres el creador]           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2️⃣ **Escenario 2: Cambiar a Cuenta #1 en MetaMask**

### Visual del Cambio:

```
ANTES:
┌──────────────────────┐
│ MetaMask             │
│ Account #0 (Admin)   │ ← Seleccionada
│ 0xf39F...            │
│ 10000.00 ETH         │
├──────────────────────┤
│ Account #1           │
│ 0x7099...            │
│ 10000.00 ETH         │
└──────────────────────┘

                ↓ (Haz clic en Account #1)

DESPUÉS:
┌──────────────────────┐
│ MetaMask             │
│ Account #0 (Admin)   │
│ 0xf39F...            │
│ 10000.00 ETH         │
├──────────────────────┤
│ Account #1           │ ← Seleccionada
│ 0x7099...            │
│ 10000.00 ETH         │
└──────────────────────┘
```

### En la Página:

```
ANTES:
┌─────────────────────────────────────┐
│ 🔐 Escrow DApp        [0xf39F...]   │
│                                     │
│ (Columnas: CreateOp | Operations)   │
│                                     │
│ Balance de Account #0: 1000 Token A │
│                                     │
└─────────────────────────────────────┘

        ↓ (Página recarga automáticamente)

DESPUÉS:
┌─────────────────────────────────────┐
│ 🔐 Escrow DApp        [0x7099...]   │
│                                     │
│ (Columnas: CreateOp | Operations)   │
│                                     │
│ Balance de Account #1: 1000 Token A │
│                                     │
│ ℹ️ Eres el destinatario de Op #0    │
│ Puedes completarla                  │
│                                     │
└─────────────────────────────────────┘
```

---

## 3️⃣ **Escenario 3: Completar Operación (Cuenta #1)**

### Visual de Operación Pendiente:

```
┌─────────────────────────────────────────────────────────┐
│ 📋 Operaciones Activas                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Operación #0                          ⏳ PENDING (Amarillo)
│                                                          │
│ Creador: 0xf39F... (Account #0)                         │
│ Destinatario: 0x7099... (TÚ - Account #1)               │
│                                                          │
│ 🔄 Token A (Depositado)   │  🔄 Token B (Requerido)    │
│ 100.0                     │  50.0                       │
│ 0xe7f1...                 │  0xa852...                  │
│                                                          │
│ [✅ Completar Operación]  [ℹ️ Aprobar + Completar]      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### MetaMask Confirmaciones (2):

**Confirmación 1: Aprobar Token B**
```
┌──────────────────────────────────────┐
│ ⏳ Aprobando Token B...               │
│ Cantidad: 50.0                       │
│ Tx: 0x1a2b...                        │
└──────────────────────────────────────┘
        ↓ (1 segundo)
┌──────────────────────────────────────┐
│ ✅ Token B aprobado correctamente     │
└──────────────────────────────────────┘
```

**Confirmación 2: Completar Operación**
```
┌──────────────────────────────────────┐
│ ⏳ Completando operación...           │
│ Tx: 0x3c4d...                        │
└──────────────────────────────────────┘
        ↓ (confirmación)
┌──────────────────────────────────────┐
│ ✅ Operación completada exitosamente! │
│ Tx: 0x3c4d...                        │
│                                      │
│ (Página recarga en 2s)               │
└──────────────────────────────────────┘
```

### Resultado Esperado:

```
┌─────────────────────────────────────────────────────────┐
│ 📋 Operaciones Activas                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Operación #0                         ✅ COMPLETED (Verde)
│                                                          │
│ Creador: 0xf39F...                                      │
│ Destinatario: 0x7099...                                 │
│                                                          │
│ 🔄 Token A                │  🔄 Token B                 │
│ 100.0                     │  50.0                       │
│ 0xe7f1...                 │  0xa852...                  │
│                                                          │
│ ✅ Esta operación ha sido completada                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 4️⃣ **Escenario 4: Cancelar Operación**

### Crear Segunda Operación:

```
1. Vuelve a Account #0
2. Crea otra operación:
   - Token A: 50
   - Token B: 25
   - Destinatario: 0x7099...
3. Espera a que aparezca en la lista
```

### Visual de Operación a Cancelar:

```
┌─────────────────────────────────────────────────────────┐
│ 📋 Operaciones Activas                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Operación #0                         ✅ COMPLETED (Verde)
│ [Detalles previamente completados]                      │
│                                                          │
│ Operación #1                          ⏳ PENDING (Amarillo)
│                                                          │
│ Creador: 0xf39F... (TÚ - Account #0)                    │
│ Destinatario: 0x7099... (Account #1)                    │
│                                                          │
│ 🔄 Token A                │  🔄 Token B                 │
│ 50.0                      │  25.0                       │
│ 0xe7f1...                 │  0xa852...                  │
│                                                          │
│ [❌ Cancelar Operación]  [ℹ️ Eres el creador]           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Haz clic en "❌ Cancelar Operación":

**MetaMask Confirmación:**
```
┌──────────────────────────────────────┐
│ ⏳ Cancelando operación...            │
│ Operación #1                         │
│ Tx: 0x5e6f...                        │
└──────────────────────────────────────┘
        ↓ (confirmación)
┌──────────────────────────────────────┐
│ ✅ Operación cancelada exitosamente!  │
│ Tx: 0x5e6f...                        │
│                                      │
│ (Página recarga en 2s)               │
└──────────────────────────────────────┘
```

### Resultado Esperado:

```
┌─────────────────────────────────────────────────────────┐
│ 📋 Operaciones Activas                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Operación #0                         ✅ COMPLETED (Verde)
│ [Detalles previamente completados]                      │
│                                                          │
│ Operación #1                        ❌ CANCELLED (Rojo)
│                                                          │
│ Creador: 0xf39F... (TÚ - Account #0)                    │
│ Destinatario: 0x7099... (Account #1)                    │
│                                                          │
│ 🔄 Token A                │  🔄 Token B                 │
│ 50.0                      │  25.0                       │
│ 0xe7f1...                 │  0xa852...                  │
│                                                          │
│ ❌ Esta operación ha sido cancelada                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ❌ **Escenario 5: Manejo de Error - Dirección Inválida**

### Intentar crear operación con dirección inválida:

```
1. En CreateOperation, ingresa:
   - Token A: 100
   - Token B: 50
   - Destinatario: xyz123 (INVÁLIDO)
2. Haz clic en "✅ Crear Operación"
```

### Resultado - ErrorAlert Rojo:

```
┌─────────────────────────────────────────────────────────┐
│ ❌ Dirección Inválida                              ✕    │
│ La dirección debe ser válida (0x + 40 caracteres hex)   │
└─────────────────────────────────────────────────────────┘

(Por encima del formulario, en rojo)

El formulario NO se envía
La operación NO se crea
```

---

## ❌ **Escenario 6: Manejo de Error - Tokens Iguales**

### Intentar crear operación con tokens iguales:

```
1. En CreateOperation, ingresa:
   - Token A: Token A (del dropdown)
   - Token B: Token A (MISMO - INVÁLIDO)
   - Destinatario: 0x7099...
2. Haz clic en "✅ Crear Operación"
```

### Resultado - ErrorAlert Rojo:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Formulario Inválido                             ✕    │
│ Los tokens deben ser diferentes                         │
└─────────────────────────────────────────────────────────┘

(Por encima del formulario, en amarillo)

El formulario NO se envía
```

---

## ❌ **Escenario 7: Manejo de Error - Monto Negativo**

### Intentar crear operación con monto negativo:

```
1. En CreateOperation, ingresa:
   - Token A: -100 (NEGATIVO - INVÁLIDO)
   - Token B: 50
   - Destinatario: 0x7099...
2. Haz clic en "✅ Crear Operación"
```

### Resultado - ErrorAlert Rojo:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Formulario Inválido                             ✕    │
│ Monto de Token A debe ser un número positivo            │
└─────────────────────────────────────────────────────────┘

(Por encima del formulario, en amarillo)

El formulario NO se envía
```

---

## 🔍 **BalanceDebug Panel Expandido**

### Estado Colapsado:

```
┌─────────────────────────────────────────────────────────┐
│ ▶ 🔍 Debug Panel - Ver Balances              Listo      │
└─────────────────────────────────────────────────────────┘
```

### Estado Expandido:

```
┌─────────────────────────────────────────────────────────┐
│ ▼ 🔍 Debug Panel - Ver Balances              Listo      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🔄 Refresh - Actualizar Balances                        │
│                                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 💼 Contrato Escrow                      DESTACADO      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│ Balance ETH: 0.0 ETH                                    │
│ Dirección: 0x5fbD...                                    │
│                                                          │
│ Balance Token A: 1000                                   │
│ Dirección: 0xe7f1...                                    │
│                                                          │
│ Balance Token B: 1000                                   │
│ Dirección: 0xa852...                                    │
│                                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 👥 Cuentas de Anvil                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│ Account #0 (Admin)                        [ADMIN]       │
│ 0xf39Fd6e51aad88F6F4ce6aB8827...                        │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ETH        │  Token A  │  Token B              │    │
│ │ 10000 ETH  │  1000     │  950 (gastó 50)       │    │
│ └─────────────────────────────────────────────────┘    │
│                                                          │
│ Account #1                                              │
│ 0x70997970C51812e339d9B73b0245Ad...                     │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ETH        │  Token A  │  Token B              │    │
│ │ 10000 ETH  │  1100     │  950 (recibió 100)    │    │
│ └─────────────────────────────────────────────────┘    │
│                                                          │
│ Account #2                                              │
│ 0x3C44CdDdB6a900c6B318C5d4Eb0Efc...                     │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ETH        │  Token A  │  Token B              │    │
│ │ 10000 ETH  │  1000     │  1000                 │    │
│ └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Resumen de Estados

### Estados de ErrorAlert:

```
ERROR (Rojo - ❌)
┌─────────────────────────────────────────┐
│ ❌ Transacción Rechazada           ✕    │
│ Rechazaste la transacción.               │
└─────────────────────────────────────────┘

WARNING (Amarillo - ⚠️)
┌─────────────────────────────────────────┐
│ ⚠️ Saldo Insuficiente              ✕    │
│ Necesitas más tokens.                   │
└─────────────────────────────────────────┘

INFO (Azul - ℹ️)
┌─────────────────────────────────────────┐
│ ℹ️ Información                     ✕    │
│ Auto-actualización cada 5 segundos.     │
└─────────────────────────────────────────┘

SUCCESS (Verde - ✅)
┌─────────────────────────────────────────┐
│ ✅ Éxito                           ✕    │
│ Operación completada exitosamente.      │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist Visual

```
Paso 1: Anvil corriendo
[ ] http://127.0.0.1:8545 accesible
[ ] 10 cuentas con 10000 ETH cada una

Paso 2: Deploy
[ ] Transacciones exitosas
[ ] Direcciones guardadas en constants.ts

Paso 3: Frontend
[ ] http://localhost:3000 accesible
[ ] Estilos cargados correctamente

Paso 4: MetaMask
[ ] Account #0 importada
[ ] Account #1 importada
[ ] Ambas con 10000 ETH

Paso 5: Tokens Registrados
[ ] Token A en dropdown
[ ] Token B en dropdown

Paso 6: Cambio de Cuenta
[ ] Página muestra Account #1
[ ] Balances actualizados

Paso 7: Operación Creada
[ ] Aparece en lista
[ ] Status es "PENDING"
[ ] Botones funcionales

Paso 8: Operación Completada
[ ] Status cambia a "COMPLETED"
[ ] Badge es verde
[ ] Botones desaparecen

Paso 9: Operación Cancelada
[ ] Status cambia a "CANCELLED"
[ ] Badge es rojo
[ ] Botones desaparecen
```

---

**Generado:** 2 de diciembre de 2025

**Última actualización:** Fase 12 - Testing E2E
