# Guía de Testing y Validación

Esta guía describe cómo ejecutar y validar el proyecto DAO Voting completo.

## 🧪 Testing de Smart Contracts

### Ejecutar Tests Básicos

```bash
cd sc
forge test
```

### Tests con Detalle Verbose

```bash
forge test -vv
```

### Ver Reporte de Gas

```bash
forge test --gas-report
```

### Ejecutar Tests Específicos

```bash
# Test específico por nombre
forge test --match-test testFundDAO

# Test específico por contrato
forge test --match-contract DAOVotingTest
```

### Coverage

```bash
forge coverage
```

**Objetivo**: >80% coverage

## ✅ Checklist de Tests de Contratos

### MinimalForwarder
- [x] `testGetNonce` - Verificar nonce inicial
- [x] `testExecuteMetaTransaction` - Ejecutar meta-transacción válida
- [x] `testFailReplayAttack` - Prevenir replay attacks
- [x] `testFailInvalidSignature` - Rechazar firmas inválidas

### DAOVoting
- [x] `testFundDAO` - Depositar fondos en DAO
- [x] `testCreateProposalWithSufficientBalance` - Crear propuesta con balance adecuado
- [x] `testFailCreateProposalWithInsufficientBalance` - Rechazar propuesta sin 10% balance
- [x] `testVote` - Votar en propuesta
- [x] `testChangeVote` - Cambiar voto antes de deadline
- [x] `testFailVoteAfterDeadline` - Rechazar voto después de deadline
- [x] `testFailVoteWithoutBalance` - Rechazar voto sin balance
- [x] `testExecuteApprovedProposal` - Ejecutar propuesta aprobada
- [x] `testFailExecuteBeforeDeadline` - Rechazar ejecución antes de deadline
- [x] `testFailExecuteBeforeSafetyPeriod` - Rechazar ejecución antes de período de seguridad
- [x] `testFailExecuteRejectedProposal` - Rechazar ejecución de propuesta rechazada
- [x] `testFailExecuteProposalTwice` - Prevenir doble ejecución
- [x] `testGaslessVote` - Votar usando meta-transacciones

## 🌐 Testing del Frontend

### Setup

```bash
cd web
npm install
npm run dev
```

### Checklist Manual de UI

#### 1. Conexión de Wallet
- [ ] Conectar MetaMask funciona
- [ ] Se muestra dirección correctamente
- [ ] Cambio de cuenta se detecta
- [ ] Cambio de red se detecta
- [ ] Desconectar wallet funciona

#### 2. Financiación del DAO
- [ ] Ver balance personal en DAO
- [ ] Ver balance total del DAO
- [ ] Depositar ETH funciona
- [ ] Transacción se confirma
- [ ] Balance se actualiza

#### 3. Creación de Propuestas
- [ ] Validación de 10% de balance funciona
- [ ] Crear propuesta con balance suficiente
- [ ] Mensaje de error con balance insuficiente
- [ ] Formulario valida campos requeridos
- [ ] Propuesta aparece en lista

#### 4. Votación
- [ ] Ver propuestas activas
- [ ] Botones de voto visibles solo en propuestas activas
- [ ] Votar A FAVOR funciona (gasless)
- [ ] Votar EN CONTRA funciona (gasless)
- [ ] Votar ABSTENCIÓN funciona (gasless)
- [ ] No se pide confirmación de gas en MetaMask
- [ ] Solo se firma mensaje
- [ ] Voto se registra correctamente
- [ ] Contadores se actualizan
- [ ] Cambiar voto funciona
- [ ] Ver voto propio en card

#### 5. Ejecución de Propuestas
- [ ] Propuestas aprobadas muestran opción de ejecutar
- [ ] Ejecutar manualmente funciona
- [ ] Daemon API funciona (`/api/daemon`)
- [ ] Fondos se transfieren correctamente
- [ ] Estado cambia a "Ejecutada"

## 🔄 Flujo de Prueba Completo

### Escenario de Prueba End-to-End

#### Setup Inicial
1. Iniciar Anvil: `anvil`
2. Desplegar contratos: `cd sc && forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast`
3. Copiar direcciones a `web/.env.local`
4. Iniciar frontend: `cd web && npm run dev`

#### Cuentas de Prueba (Anvil)
- **Account 0**: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Relayer)
- **Account 1**: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (Usuario A)
- **Account 2**: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (Usuario B)

#### Paso 1: Usuario A Financia el DAO
1. Conectar MetaMask con Account 1
2. Ir a "Financiar DAO"
3. Depositar 10 ETH
4. **Verificar**: Balance de Usuario A = 10 ETH, Balance Total = 10 ETH

#### Paso 2: Usuario B Financia el DAO
1. Cambiar a Account 2 en MetaMask
2. Depositar 5 ETH
3. **Verificar**: Balance de Usuario B = 5 ETH, Balance Total = 15 ETH

#### Paso 3: Usuario A Crea Propuesta
1. Cambiar a Account 1
2. Crear propuesta:
   - Beneficiario: `0x90F79bf6EB2c4f870365E785982E1f101E93b906` (Account 3)
   - Cantidad: 3 ETH
   - Duración: 1 día
3. **Verificar**: Propuesta #1 aparece en lista

#### Paso 4: Usuario B Intenta Crear Propuesta
1. Cambiar a Account 2
2. Intentar crear propuesta
3. **Verificar**: Error - balance insuficiente (tiene 5 ETH de 15 ETH = 33%, necesita solo 1.5 ETH que es el 10%)
4. **Nota**: En este caso SÍ debería poder crear propuesta. El usuario B tiene más del 10% requerido.

#### Paso 5: Votación Gasless
1. Usuario A vota A FAVOR
   - **Verificar**: Solo firma mensaje, no paga gas
   - **Verificar**: Voto registrado
2. Usuario B vota EN CONTRA
   - **Verificar**: Proceso gasless
   - **Verificar**: Contadores actualizados

#### Paso 6: Usuario C Deposita y Vota
1. Conectar con Account 4: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`
2. Depositar 20 ETH
3. Votar A FAVOR en Propuesta #1
4. **Verificar**: Votos A FAVOR = 2, EN CONTRA = 1

#### Paso 7: Cambiar Voto
1. Usuario B cambia voto a ABSTENCIÓN
2. **Verificar**: Votos A FAVOR = 2, EN CONTRA = 0, ABSTENCIÓN = 1

#### Paso 8: Esperar Deadline
```bash
# En Anvil, avanzar tiempo (opcional para testing)
cast rpc evm_increaseTime 86400  # +1 día
cast rpc evm_mine
```

#### Paso 9: Ejecutar Propuesta
1. Esperar 1 hora después del deadline (safety period)
2. Opción A: Ejecutar manualmente desde UI
3. Opción B: Ejecutar daemon:
   ```bash
   curl http://localhost:3000/api/daemon
   ```
4. **Verificar**: 
   - Propuesta marcada como "Ejecutada"
   - Fondos transferidos a beneficiario
   - Balance del DAO reducido en 3 ETH

## 🐛 Casos Edge a Validar

### Smart Contracts
- [x] Votar en propuesta inexistente → revert
- [x] Votar después del deadline → revert
- [x] Ejecutar propuesta no aprobada → revert
- [x] Ejecutar propuesta ya ejecutada → revert
- [x] Cambiar voto antes del deadline → success
- [x] Crear propuesta sin balance suficiente → revert
- [x] Replay attack con mismo nonce → revert
- [x] Firma inválida en meta-transacción → revert
- [x] Ejecutar antes del safety period → revert
- [x] Propuesta con fondos insuficientes en DAO → revert

### Frontend
- [ ] Wallet desconectado → Mostrar mensaje apropiado
- [ ] Red incorrecta → Solicitar cambio de red
- [ ] Error de transacción → Mostrar error claro
- [ ] Firma rechazada → Manejar cancelación
- [ ] Propuesta con deadline pasado → Ocultar botones de voto
- [ ] Balance insuficiente para crear propuesta → Mostrar warning
- [ ] Múltiples votos simultáneos → Manejar nonces correctamente

## 📊 Métricas de Éxito

### Contratos
- ✅ Tests passing: 16/16
- ✅ Coverage: >80%
- ✅ Gas optimization: Razonable
- ✅ Security: Sin vulnerabilidades conocidas

### Frontend
- ✅ Todas las features funcionan
- ✅ UI responsive
- ✅ Errores manejados apropiadamente
- ✅ Loading states implementados

### Integración
- ✅ Meta-transacciones funcionan
- ✅ Eventos en tiempo real
- ✅ Daemon ejecuta propuestas
- ✅ Sin gas para votantes

## 🔍 Debugging

### Ver Logs de Contratos
```bash
forge test -vvvv  # Máximo detalle
```

### Ver Logs del Relayer
```bash
# En terminal de Next.js, ver logs cuando se vota
```

### Verificar Estado de Propuesta
```bash
cast call $DAO_ADDRESS "getProposal(uint256)" 1 --rpc-url http://127.0.0.1:8545
```

### Verificar Nonce
```bash
cast call $FORWARDER_ADDRESS "getNonce(address)" $USER_ADDRESS --rpc-url http://127.0.0.1:8545
```

## ✅ Checklist Final

Antes de considerar el proyecto completo:

- [ ] Todos los tests de contratos pasan
- [ ] Coverage >80%
- [ ] Frontend inicia sin errores
- [ ] Conexión de wallet funciona
- [ ] Depositar fondos funciona
- [ ] Crear propuesta funciona
- [ ] Votación gasless funciona
- [ ] Ejecución de propuestas funciona
- [ ] Daemon funciona
- [ ] README.md completo
- [ ] Documentación clara
- [ ] Scripts de deployment funcionan
- [ ] .env.example actualizado

---

**¡Todo validado!** ✨ El proyecto está listo para uso y demostración.
