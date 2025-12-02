#!/bin/bash

# Script para ejecutar todo el stack de desarrollo

echo "🚀 Iniciando stack de desarrollo DAO Voting..."

# Verificar que tmux esté instalado
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux no está instalado. Instálalo con: sudo apt install tmux"
    exit 1
fi

# Crear sesión tmux
SESSION="dao-voting"

# Matar sesión existente si existe
tmux has-session -t $SESSION 2>/dev/null
if [ $? -eq 0 ]; then
    echo "Cerrando sesión anterior..."
    tmux kill-session -t $SESSION
fi

# Crear nueva sesión
tmux new-session -d -s $SESSION -n "anvil"

# Panel 1: Anvil
tmux send-keys -t $SESSION:0 "echo '🔗 Iniciando Anvil...'" C-m
tmux send-keys -t $SESSION:0 "anvil" C-m

# Esperar a que anvil inicie
sleep 3

# Dividir ventana horizontalmente
tmux split-window -h -t $SESSION:0

# Panel 2: Smart Contracts (deployment)
tmux send-keys -t $SESSION:0.1 "echo '📝 Desplegando contratos...'" C-m
tmux send-keys -t $SESSION:0.1 "cd sc" C-m
tmux send-keys -t $SESSION:0.1 "sleep 2 && forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast" C-m

# Esperar deployment
sleep 5

# Dividir panel 2 verticalmente
tmux split-window -v -t $SESSION:0.1

# Panel 3: Frontend
tmux send-keys -t $SESSION:0.2 "echo '🌐 Iniciando frontend...'" C-m
tmux send-keys -t $SESSION:0.2 "cd web" C-m
tmux send-keys -t $SESSION:0.2 "npm run dev" C-m

# Ajustar tamaños
tmux select-layout -t $SESSION:0 main-vertical

# Attach a la sesión
echo ""
echo "✓ Stack iniciado en sesión tmux '$SESSION'"
echo ""
echo "Para ver los logs:"
echo "  tmux attach -t $SESSION"
echo ""
echo "Para navegar entre paneles: Ctrl+B + flechas"
echo "Para cerrar: tmux kill-session -t $SESSION"
echo ""
echo "Frontend disponible en: http://localhost:3000"
echo ""

# Opcionalmente, attach automáticamente
tmux attach -t $SESSION
