#!/bin/bash

# Script para avanzar el tiempo en Anvil (blockchain local)

if [ -z "$1" ]; then
  echo "Usage: ./advance-time.sh <seconds>"
  echo ""
  echo "Examples:"
  echo "  ./advance-time.sh 86400        # Avanzar 1 día"
  echo "  ./advance-time.sh 604800       # Avanzar 7 días"
  echo "  ./advance-time.sh 691200       # Avanzar 8 días (7 días votación + 1 día execution delay)"
  echo ""
  echo "Useful time values:"
  echo "  1 hour   = 3600 seconds"
  echo "  1 day    = 86400 seconds"
  echo "  7 days   = 604800 seconds"
  echo "  8 days   = 691200 seconds"
  exit 1
fi

SECONDS=$1

echo "⏰ Advancing blockchain time by $SECONDS seconds..."

# Avanzar el tiempo
cast rpc evm_increaseTime $SECONDS --rpc-url http://127.0.0.1:8545

# Minar un bloque para que el cambio tome efecto
cast rpc evm_mine --rpc-url http://127.0.0.1:8545

echo "✅ Time advanced successfully!"
echo ""
echo "Current block timestamp:"
cast block latest --rpc-url http://127.0.0.1:8545 | grep timestamp