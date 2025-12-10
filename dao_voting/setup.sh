#!/bin/bash

# Script de setup completo para el proyecto DAO Voting

echo "🚀 Configurando proyecto DAO Voting..."

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_step() {
    echo -e "${BLUE}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Verificar prerrequisitos
print_step "Verificando prerrequisitos..."

if ! command -v forge &> /dev/null; then
    print_error "Foundry no está instalado. Instálalo desde https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi
print_success "Foundry instalado"

if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi
print_success "Node.js instalado"

# Setup Smart Contracts
print_step "Configurando Smart Contracts..."
cd sc

if [ ! -d "lib/openzeppelin-contracts" ]; then
    print_step "Instalando dependencias de Foundry..."
    forge install OpenZeppelin/openzeppelin-contracts
    forge install foundry-rs/forge-std
fi

print_step "Compilando contratos..."
forge build
if [ $? -eq 0 ]; then
    print_success "Contratos compilados"
else
    print_error "Error compilando contratos"
    exit 1
fi

print_step "Ejecutando tests..."
forge test
if [ $? -eq 0 ]; then
    print_success "Tests pasados"
else
    print_error "Algunos tests fallaron"
fi

cd ..

# Setup Frontend
print_step "Configurando Frontend..."
cd web

print_step "Instalando dependencias de npm..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencias instaladas"
else
    print_error "Error instalando dependencias"
    exit 1
fi

# Crear .env.local si no existe
if [ ! -f ".env.local" ]; then
    print_step "Creando archivo .env.local..."
    cp .env.example .env.local
    print_success ".env.local creado (necesitas actualizarlo con las direcciones desplegadas)"
fi

cd ..

# Imprimir instrucciones finales
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✓ Setup completado exitosamente!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Iniciar blockchain local (terminal 1):"
echo "   $ anvil"
echo ""
echo "2. Desplegar contratos (terminal 2):"
echo "   $ cd sc"
echo "   $ forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast"
echo ""
echo "3. Actualizar web/.env.local con las direcciones desplegadas"
echo ""
echo "4. Iniciar frontend (terminal 3):"
echo "   $ cd web"
echo "   $ npm run dev"
echo ""
echo "5. Abrir http://localhost:3000 en tu navegador"
echo ""
echo "═══════════════════════════════════════════════════════════════"
