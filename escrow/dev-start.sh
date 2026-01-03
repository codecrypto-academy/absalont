#!/bin/bash

# Script para iniciar el proyecto completo en desarrollo

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_step "Iniciando Escrow DApp..."
echo ""
echo "Abre estas terminales en este orden:"
echo ""
echo "Terminal 1: Blockchain local"
echo "  $ anvil"
echo ""
echo "Terminal 2: Deploy contratos"
echo "  $ cd escrow/sc"
echo "  $ forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo ""
echo "Terminal 3: Frontend"
echo "  $ cd escrow/web"
echo "  $ npm run dev"
echo ""
echo "Luego abre http://localhost:3000 en tu navegador"
echo ""

read -p "¿Deseas iniciar anvil ahora? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Iniciando anvil..."
    anvil
fi
