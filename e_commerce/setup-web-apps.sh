#!/bin/bash

# Script para generar las aplicaciones web faltantes
# web-admin y web-customer siguen estructura similar a las apps anteriores

echo "Creando estructura de web-admin..."

mkdir -p web-admin/src/{app,components,hooks,lib}
mkdir -p web-admin/src/app/{companies,api}

# package.json para web-admin
cat > web-admin/package.json << 'EOF'
{
  "name": "web-admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 6003",
    "build": "next build",
    "start": "next start -p 6003",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "ethers": "^6.9.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  }
}
EOF

echo "Creando estructura de web-customer..."

mkdir -p web-customer/src/{app,components,hooks,lib}
mkdir -p web-customer/src/app/{cart,orders,api}

# package.json para web-customer
cat > web-customer/package.json << 'EOF'
{
  "name": "web-customer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 6004",
    "build": "next build",
    "start": "next start -p 6004",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "ethers": "^6.9.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  }
}
EOF

echo "✅ Estructura básica creada"
echo ""
echo "📝 Las aplicaciones web siguen la misma estructura que compra-stableboin y pasarela-de-pago"
echo ""
echo "Para completar las aplicaciones:"
echo "1. cd web-admin && npm install"
echo "2. cd web-customer && npm install"
echo "3. Copiar archivos de configuración (tailwind.config.js, tsconfig.json, etc)"
echo "4. Implementar componentes según especificación del proyecto"
