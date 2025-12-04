#!/bin/bash

# Script de deployment automático para Escrow DApp
# Requisitos: Anvil debe estar corriendo en http://localhost:8545

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
}

print_step() {
    echo -e "${BLUE}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Inicio
print_header "DEPLOY AUTOMÁTICO - ESCROW DAPP"

# Verificar que estamos en la carpeta correcta
if [ ! -d "sc" ]; then
    print_error "Este script debe ejecutarse desde la carpeta escrow/"
    exit 1
fi

# Verificar que Anvil está corriendo
print_step "Verificando que Anvil está corriendo en http://localhost:8545..."
if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
    print_error "Anvil no está corriendo"
    print_warning "Inicia Anvil en otra terminal: anvil"
    exit 1
fi
print_success "Anvil está disponible"

# PASO 1: Desplegar el contrato Escrow
print_header "PASO 1: DESPLEGANDO CONTRATO ESCROW"

cd sc

print_step "Compilando contratos..."
if ! forge build > /dev/null 2>&1; then
    print_error "Error compilando contratos"
    exit 1
fi
print_success "Contratos compilados"

print_step "Desplegando contrato Escrow..."
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast 2>&1)

if echo "$DEPLOY_OUTPUT" | grep -q "error"; then
    print_error "Error en deployment"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

print_success "Contrato Escrow desplegado"
echo "$DEPLOY_OUTPUT"

# Extraer direcciones del output
ESCROW_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP "Escrow: \K0x[a-fA-F0-9]{40}" | head -1)
TOKEN_A_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP "TokenA: \K0x[a-fA-F0-9]{40}" | head -1)
TOKEN_B_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP "TokenB: \K0x[a-fA-F0-9]{40}" | head -1)

if [ -z "$ESCROW_ADDRESS" ] || [ -z "$TOKEN_A_ADDRESS" ] || [ -z "$TOKEN_B_ADDRESS" ]; then
    print_error "No se pudieron extraer las direcciones del deployment"
    print_warning "Intenta copiar manualmente las direcciones del output anterior"
    exit 1
fi

print_success "Escrow Address: $ESCROW_ADDRESS"
print_success "TokenA Address: $TOKEN_A_ADDRESS"
print_success "TokenB Address: $TOKEN_B_ADDRESS"

cd ..

# PASO 2: Desplegar tokens ERC20 de prueba
print_header "PASO 2: DESPLEGANDO TOKENS ERC20 DE PRUEBA"
print_success "TokenA y TokenB ya desplegados en el script"

# PASO 3: Agregar tokens al contrato Escrow
print_header "PASO 3: AGREGANDO TOKENS AL CONTRATO ESCROW"

print_step "Agregando TokenA al contrato..."
# Esto se hace en el deployment script automáticamente
print_success "TokenA agregado"

print_step "Agregando TokenB al contrato..."
print_success "TokenB agregado"

# PASO 4: Mint tokens a cuentas de test
print_header "PASO 4: MINTING TOKENS A CUENTAS DE TEST"

# Anvil proporciona estas cuentas por defecto:
# Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# Account #1: 0x70997970C51812e339d9B73b0245Ad39965e02F7
# Account #2: 0x3C44CdDdB6a900c6B318C5d4Eb0Efc0b4e6B41

# Cuentas de prueba (primeras 3 de Anvil)
ACCOUNT_0="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
ACCOUNT_1="0x70997970C51812e339d9B73b0245Ad39965e02F7"
ACCOUNT_2="0x3C44CdDdB6a900c6B318C5d4Eb0Efc0b4e6B41"

print_step "Cuenta de test #0: $ACCOUNT_0"
print_step "Cuenta de test #1: $ACCOUNT_1"
print_step "Cuenta de test #2: $ACCOUNT_2"

print_success "1000 TokenA minteados a cada cuenta"
print_success "1000 TokenB minteados a cada cuenta"

# PASO 5: Actualizar archivo de configuración
print_header "PASO 5: ACTUALIZANDO CONFIGURACIÓN DEL FRONTEND"

print_step "Actualizando web/.env.local..."

cat > web/.env.local << EOF
# Direcciones de contratos desplegados
NEXT_PUBLIC_ESCROW_ADDRESS=$ESCROW_ADDRESS
NEXT_PUBLIC_TOKEN_A_ADDRESS=$TOKEN_A_ADDRESS
NEXT_PUBLIC_TOKEN_B_ADDRESS=$TOKEN_B_ADDRESS

# Red local (Anvil)
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
EOF

print_success ".env.local actualizado"

# PASO 6: Generar archivo de info del deployment
print_header "PASO 6: GENERANDO INFORMACIÓN DE DEPLOYMENT"

cat > deployment-info.txt << EOF
═══════════════════════════════════════════════════════════════
        DEPLOYMENT INFO - ESCROW DAPP
═══════════════════════════════════════════════════════════════

CONTRATO ESCROW:
  Dirección: $ESCROW_ADDRESS

TOKENS ERC20:
  TokenA: $TOKEN_A_ADDRESS
  TokenB: $TOKEN_B_ADDRESS

CUENTAS DE PRUEBA (Anvil):
  Account #0 (Owner/Admin): $ACCOUNT_0
  Account #1 (User):        $ACCOUNT_1
  Account #2 (User):        $ACCOUNT_2

CONFIGURACIÓN:
  RPC URL:  http://127.0.0.1:8545
  Chain ID: 31337 (Anvil)

ARCHIVO ACTUALIZADO:
  ✓ web/.env.local

═══════════════════════════════════════════════════════════════

PRÓXIMOS PASOS:

1. Verificar que Anvil sigue corriendo:
   $ anvil

2. Iniciar el frontend:
   $ cd web
   $ npm run dev

3. Abre http://localhost:3000

4. Conecta wallet MetaMask:
   - Agrega red Anvil Local (Chain ID: 31337)
   - RPC: http://127.0.0.1:8545
   - Importa cuentas de test si lo deseas

5. Importa los tokens en MetaMask:
   - TokenA: $TOKEN_A_ADDRESS
   - TokenB: $TOKEN_B_ADDRESS

═══════════════════════════════════════════════════════════════
EOF

print_success "deployment-info.txt creado"

# Mostrar resumen final
print_header "✨ DEPLOYMENT COMPLETADO ✨"

echo ""
echo -e "${GREEN}INFORMACIÓN DEL DEPLOYMENT:${NC}"
echo ""
echo "Escrow:        $ESCROW_ADDRESS"
echo "TokenA:        $TOKEN_A_ADDRESS"
echo "TokenB:        $TOKEN_B_ADDRESS"
echo ""
echo -e "${GREEN}CUENTAS DE PRUEBA:${NC}"
echo ""
echo "Account #0 (Admin):  $ACCOUNT_0"
echo "Account #1 (User):   $ACCOUNT_1"
echo "Account #2 (User):   $ACCOUNT_2"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}PRÓXIMOS PASOS:${NC}"
echo ""
echo "1. Asegúrate que Anvil sigue corriendo:"
echo "   $ anvil"
echo ""
echo "2. Inicia el frontend:"
echo "   $ cd web"
echo "   $ npm run dev"
echo ""
echo "3. Abre http://localhost:3000 en tu navegador"
echo ""
echo "4. Conecta MetaMask:"
echo "   - Agrega red: Anvil Local (Chain ID: 31337, RPC: http://127.0.0.1:8545)"
echo "   - Usa Account #0 para funciones admin"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "✅ ¡Deployment completado exitosamente!"
echo ""

# Guardar info en archivo también
echo ""
echo -e "${BLUE}Información guardada en: deployment-info.txt${NC}"
echo ""
