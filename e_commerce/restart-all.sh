#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Iniciando Sistema E-Commerce${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Guardar directorio actual
PROJECT_ROOT=$(pwd)

# 1. Detener procesos anteriores
echo -e "${YELLOW}[1/7] Deteniendo procesos anteriores...${NC}"
pkill -f "anvil" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "PORT=600" 2>/dev/null
sleep 2

# 2. Iniciar Anvil
echo -e "${YELLOW}[2/7] Iniciando blockchain local (Anvil)...${NC}"
anvil > anvil.log 2>&1 &
ANVIL_PID=$!
echo "Anvil PID: $ANVIL_PID"
sleep 3

# 3. Deploy EuroToken
echo -e "${YELLOW}[3/7] Desplegando EuroToken...${NC}"
cd "$PROJECT_ROOT/stablecoin/sc"

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" > .env
fi

# Install dependencies if needed
if [ ! -d "lib/openzeppelin-contracts" ]; then
    echo "Instalando dependencias de Foundry..."
    forge install OpenZeppelin/openzeppelin-contracts --no-commit
fi

# Deploy
forge script script/DeployEuroToken.s.sol --rpc-url http://localhost:8545 --broadcast > deploy_token.log 2>&1

# Extraer dirección del token
EUROTOKEN_ADDRESS=$(grep "EuroToken deployed at:" deploy_token.log | awk '{print $NF}')
echo -e "${GREEN}✓ EuroToken deployed at: $EUROTOKEN_ADDRESS${NC}"

# 4. Deploy Ecommerce
echo -e "${YELLOW}[4/7] Desplegando Ecommerce contract...${NC}"
cd "$PROJECT_ROOT/sc-ecommerce"

# Install dependencies if needed
if [ ! -d "lib/openzeppelin-contracts" ]; then
    echo "Instalando dependencias de Foundry..."
    forge install OpenZeppelin/openzeppelin-contracts --no-commit
fi

# Crear archivo .env
echo "PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" > .env
echo "EUROTOKEN_ADDRESS=$EUROTOKEN_ADDRESS" >> .env

forge script script/DeployEcommerce.s.sol --rpc-url http://localhost:8545 --broadcast > deploy_ecommerce.log 2>&1

ECOMMERCE_ADDRESS=$(grep "Ecommerce deployed at:" deploy_ecommerce.log | awk '{print $NF}')
echo -e "${GREEN}✓ Ecommerce deployed at: $ECOMMERCE_ADDRESS${NC}"

# 5. Actualizar variables de entorno en aplicaciones
echo -e "${YELLOW}[5/7] Configurando variables de entorno...${NC}"

# Compra stablecoin
cat > "$PROJECT_ROOT/stablecoin/compra-stableboin/.env" << EOF
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://localhost:8545
EOF

# Pasarela de pago
cat > "$PROJECT_ROOT/stablecoin/pasarela-de-pago/.env" << EOF
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
RPC_URL=http://localhost:8545
EOF

# Web admin (si existe)
if [ -d "$PROJECT_ROOT/web-admin" ]; then
    cat > "$PROJECT_ROOT/web-admin/.env" << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
RPC_URL=http://localhost:8545
EOF
fi

# Web customer (si existe)
if [ -d "$PROJECT_ROOT/web-customer" ]; then
    cat > "$PROJECT_ROOT/web-customer/.env" << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
RPC_URL=http://localhost:8545
EOF
fi

echo -e "${GREEN}✓ Variables de entorno configuradas${NC}"

# 6. Instalar dependencias de las aplicaciones Next.js
echo -e "${YELLOW}[6/7] Instalando dependencias de aplicaciones...${NC}"

cd "$PROJECT_ROOT/stablecoin/compra-stableboin"
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias de compra-stableboin..."
    npm install > /dev/null 2>&1
fi

cd "$PROJECT_ROOT/stablecoin/pasarela-de-pago"
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias de pasarela-de-pago..."
    npm install > /dev/null 2>&1
fi

# 7. Iniciar aplicaciones
echo -e "${YELLOW}[7/7] Iniciando aplicaciones...${NC}"

cd "$PROJECT_ROOT/stablecoin/compra-stableboin"
npm run dev > "$PROJECT_ROOT/compra-stableboin.log" 2>&1 &
echo "✓ Compra Stablecoin iniciada en http://localhost:6001"

cd "$PROJECT_ROOT/stablecoin/pasarela-de-pago"
npm run dev > "$PROJECT_ROOT/pasarela-de-pago.log" 2>&1 &
echo "✓ Pasarela de Pago iniciada en http://localhost:6002"

if [ -d "$PROJECT_ROOT/web-admin" ] && [ -d "$PROJECT_ROOT/web-admin/node_modules" ]; then
    cd "$PROJECT_ROOT/web-admin"
    npm run dev > "$PROJECT_ROOT/web-admin.log" 2>&1 &
    echo "✓ Web Admin iniciada en http://localhost:6003"
fi

if [ -d "$PROJECT_ROOT/web-customer" ] && [ -d "$PROJECT_ROOT/web-customer/node_modules" ]; then
    cd "$PROJECT_ROOT/web-customer"
    npm run dev > "$PROJECT_ROOT/web-customer.log" 2>&1 &
    echo "✓ Web Customer iniciada en http://localhost:6004"
fi

cd "$PROJECT_ROOT"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Sistema iniciado correctamente!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Direcciones de Contratos:${NC}"
echo -e "EuroToken:  ${GREEN}$EUROTOKEN_ADDRESS${NC}"
echo -e "Ecommerce:  ${GREEN}$ECOMMERCE_ADDRESS${NC}"
echo ""
echo -e "${BLUE}Aplicaciones:${NC}"
echo -e "Anvil (Blockchain):     ${GREEN}http://localhost:8545${NC}"
echo -e "Compra Stablecoin:      ${GREEN}http://localhost:6001${NC}"
echo -e "Pasarela de Pago:       ${GREEN}http://localhost:6002${NC}"
echo -e "Web Admin:              ${GREEN}http://localhost:6003${NC}"
echo -e "Web Customer:           ${GREEN}http://localhost:6004${NC}"
echo ""
echo -e "${YELLOW}Cuentas de prueba Anvil:${NC}"
echo "Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
echo "Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
echo ""
echo -e "${YELLOW}Para detener todo:${NC}"
echo "pkill -f anvil && pkill -f 'next dev'"
echo ""
