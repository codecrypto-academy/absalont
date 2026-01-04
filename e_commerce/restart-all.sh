#!/bin/bash

# Script para usar EcommerceV2 con todas las extensiones bonus

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}========================================${NC}"
echo -e "${PURPLE}   E-Commerce V2 + Extensiones Bonus${NC}"
echo -e "${PURPLE}========================================${NC}"
echo ""

PROJECT_ROOT=$(pwd)

# 1. Detener procesos anteriores
echo -e "${YELLOW}[1/8] Deteniendo procesos anteriores...${NC}"
pkill -f "anvil" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "PORT=600" 2>/dev/null
pkill -f "node src/index.js" 2>/dev/null
sleep 2

# 2. Iniciar Anvil
echo -e "${YELLOW}[2/8] Iniciando blockchain local (Anvil)...${NC}"
anvil > anvil.log 2>&1 &
ANVIL_PID=$!
echo "Anvil PID: $ANVIL_PID"
sleep 3

# 3. Deploy EuroToken
echo -e "${YELLOW}[3/8] Desplegando EuroToken...${NC}"
cd "$PROJECT_ROOT/stablecoin/sc"

if [ ! -f .env ]; then
    echo "PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" > .env
fi

if [ ! -d "lib/openzeppelin-contracts" ]; then
    echo "Instalando dependencias de Foundry..."
    forge install OpenZeppelin/openzeppelin-contracts --no-commit
fi

forge script script/DeployEuroToken.s.sol --rpc-url http://localhost:8545 --broadcast > deploy_token.log 2>&1

EUROTOKEN_ADDRESS=$(grep "EuroToken deployed at:" deploy_token.log | awk '{print $NF}')
echo -e "${GREEN}✓ EuroToken: $EUROTOKEN_ADDRESS${NC}"

# 4. Deploy EcommerceV2 + LoyaltyNFT
echo -e "${YELLOW}[4/8] Desplegando EcommerceV2 + LoyaltyNFT...${NC}"
cd "$PROJECT_ROOT/sc-ecommerce"

if [ ! -d "lib/openzeppelin-contracts" ]; then
    forge install OpenZeppelin/openzeppelin-contracts --no-commit
fi

echo "PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" > .env
echo "EUROTOKEN_ADDRESS=$EUROTOKEN_ADDRESS" >> .env

forge script script/DeployEcommerceV2.s.sol --rpc-url http://localhost:8545 --broadcast > deploy_v2.log 2>&1

LOYALTY_NFT_ADDRESS=$(grep "LoyaltyNFT deployed at:" deploy_v2.log | awk '{print $NF}')
ECOMMERCE_ADDRESS=$(grep "EcommerceV2 deployed at:" deploy_v2.log | awk '{print $NF}')
echo -e "${GREEN}✓ LoyaltyNFT: $LOYALTY_NFT_ADDRESS${NC}"
echo -e "${GREEN}✓ EcommerceV2: $ECOMMERCE_ADDRESS${NC}"

# 5. Agregar stablecoins adicionales
echo -e "${YELLOW}[5/8] Configurando multi-moneda (opcional)...${NC}"
echo -e "${BLUE}Nota: Agregue manualmente tokens adicionales después${NC}"

# 6. Actualizar variables de entorno
echo -e "${YELLOW}[6/8] Configurando variables de entorno...${NC}"

# Compra stablecoin
ENV_FILE="$PROJECT_ROOT/stablecoin/compra-stableboin/.env"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << EOF
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://localhost:8545
EOF
else
    sed -i "s|NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS|" "$ENV_FILE"
    # Solo actualizar Stripe si siguen siendo placeholders
    if grep -q "pk_test_your_key_here" "$ENV_FILE" && [ ! -z "$STRIPE_PK" ]; then
        sed -i "s|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PK|" "$ENV_FILE"
    fi
    if grep -q "sk_test_your_key_here" "$ENV_FILE" && [ ! -z "$STRIPE_SK" ]; then
        sed -i "s|STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=$STRIPE_SK|" "$ENV_FILE"
    fi
fi

# Pasarela de pago
ENV_FILE="$PROJECT_ROOT/stablecoin/pasarela-de-pago/.env"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << EOF
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
RPC_URL=http://localhost:8545
EOF
else
    sed -i "s|NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS|" "$ENV_FILE"
    sed -i "s|NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS|" "$ENV_FILE"
fi

# Notification service
ENV_FILE="$PROJECT_ROOT/notification-service/.env"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << EOF
PORT=6005
RPC_URL=http://localhost:8545
ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF
else
    sed -i "s|ECOMMERCE_CONTRACT_ADDRESS=.*|ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS|" "$ENV_FILE"
fi

# Web admin (si existe)
if [ -d "$PROJECT_ROOT/web-admin" ]; then
    cat > "$PROJECT_ROOT/web-admin/.env" << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_LOYALTY_NFT_ADDRESS=$LOYALTY_NFT_ADDRESS
RPC_URL=http://localhost:8545
EOF
fi

# Web customer (si existe)
if [ -d "$PROJECT_ROOT/web-customer" ]; then
    cat > "$PROJECT_ROOT/web-customer/.env" << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_LOYALTY_NFT_ADDRESS=$LOYALTY_NFT_ADDRESS
RPC_URL=http://localhost:8545
EOF
fi

echo -e "${GREEN}✓ Variables configuradas${NC}"

# 7. Instalar dependencias
echo -e "${YELLOW}[7/8] Instalando dependencias...${NC}"

# Verificar si las llaves de Stripe siguen siendo placeholders
STABLECOIN_ENV="$PROJECT_ROOT/stablecoin/compra-stableboin/.env"
if grep -q "your_key_here" "$STABLECOIN_ENV"; then
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${YELLOW}⚠️  ADVERTENCIA: Claves de Stripe no configuradas${NC}"
    echo -e "${YELLOW}   Por favor, edita $STABLECOIN_ENV${NC}"
    echo -e "${YELLOW}   y coloca tus claves reales de Stripe.${NC}"
    echo -e "${PURPLE}========================================${NC}"
fi

cd "$PROJECT_ROOT/stablecoin/compra-stableboin"
if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi

cd "$PROJECT_ROOT/stablecoin/pasarela-de-pago"
if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi

cd "$PROJECT_ROOT/notification-service"
if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi

if [ -d "$PROJECT_ROOT/web-admin" ]; then
    cd "$PROJECT_ROOT/web-admin"
    if [ ! -d "node_modules" ]; then
        echo "Instalando dependencias de web-admin..."
        npm install > /dev/null 2>&1
    fi
fi

if [ -d "$PROJECT_ROOT/web-customer" ]; then
    cd "$PROJECT_ROOT/web-customer"
    if [ ! -d "node_modules" ]; then
        echo "Instalando dependencias de web-customer..."
        npm install > /dev/null 2>&1
    fi
fi

# 8. Iniciar aplicaciones
echo -e "${YELLOW}[8/8] Iniciando aplicaciones...${NC}"

cd "$PROJECT_ROOT/stablecoin/compra-stableboin"
npm run dev > "$PROJECT_ROOT/compra-stableboin.log" 2>&1 &
echo "✓ Compra Stablecoin → http://localhost:6001"

cd "$PROJECT_ROOT/stablecoin/pasarela-de-pago"
npm run dev > "$PROJECT_ROOT/pasarela-de-pago.log" 2>&1 &
echo "✓ Pasarela de Pago → http://localhost:6002"

cd "$PROJECT_ROOT/notification-service"
npm run dev > "$PROJECT_ROOT/notification-service.log" 2>&1 &
echo "✓ Notification Service → http://localhost:6005"

if [ -d "$PROJECT_ROOT/web-admin" ] && [ -d "$PROJECT_ROOT/web-admin/node_modules" ]; then
    cd "$PROJECT_ROOT/web-admin"
    npm run dev > "$PROJECT_ROOT/web-admin.log" 2>&1 &
    echo "✓ Web Admin → http://localhost:6003"
fi

if [ -d "$PROJECT_ROOT/web-customer" ] && [ -d "$PROJECT_ROOT/web-customer/node_modules" ]; then
    cd "$PROJECT_ROOT/web-customer"
    npm run dev > "$PROJECT_ROOT/web-customer.log" 2>&1 &
    echo "✓ Web Customer → http://localhost:6004"
fi

cd "$PROJECT_ROOT"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Sistema V2 iniciado! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📦 Contratos Desplegados:${NC}"
echo -e "EuroToken:  ${GREEN}$EUROTOKEN_ADDRESS${NC}"
echo -e "LoyaltyNFT: ${GREEN}$LOYALTY_NFT_ADDRESS${NC}"
echo -e "EcommerceV2: ${GREEN}$ECOMMERCE_ADDRESS${NC}"
echo ""
echo -e "${BLUE}🌐 Aplicaciones:${NC}"
echo -e "Blockchain:         ${GREEN}http://localhost:8545${NC}"
echo -e "Compra Tokens:      ${GREEN}http://localhost:6001${NC}"
echo -e "Pasarela de Pago:   ${GREEN}http://localhost:6002${NC}"
echo -e "Web Admin:          ${GREEN}http://localhost:6003${NC}"
echo -e "Web Customer:       ${GREEN}http://localhost:6004${NC}"
echo -e "Notifications:      ${GREEN}http://localhost:6005${NC}"
echo ""
echo -e "${PURPLE}🎁 Extensiones Bonus Activas:${NC}"
echo "✅ Sistema de Reviews"
echo "✅ Programa de Fidelidad NFT"
echo "✅ Multi-moneda (EUR base)"
echo "✅ Analytics Dashboard"
echo "✅ Marketplace Multi-vendor (comisión 2%)"
echo "✅ Sistema de Notificaciones"
echo ""
echo -e "${YELLOW}📋 Próximos Pasos:${NC}"
echo "1. Agregar más stablecoins:"
echo "   cast send $ECOMMERCE_ADDRESS 'addSupportedToken(address,string,uint8,uint256)' ..."
echo ""
echo "2. Configurar SMTP en notification-service/.env para emails"
echo ""
echo "3. Suscribir empresas a notificaciones:"
echo "   curl -X POST http://localhost:6005/api/subscribe/company \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"companyId\":1,\"email\":\"empresa@example.com\"}'"
echo ""
echo -e "${YELLOW}🛑 Para detener todo:${NC}"
echo "pkill -f anvil && pkill -f 'next dev' && pkill -f 'node src/index.js'"
echo ""
echo -e "${BLUE}Ver documentación: BONUS_EXTENSIONS.md${NC}"
echo ""
