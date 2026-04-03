# 🛡️ Solana Auction DApp (Subastas)

Este es un **Marketplace de Subastas Descentralizado** de alto rendimiento construido sobre la blockchain de Solana. Utiliza **Anchor** para la lógica de contratos inteligentes y **Next.js** para una experiencia de usuario fluida y profesional.

---

## 💎 Características de Élite

### 🎨 Diseño Premium 2.0
- **Glassmorphism:** Interfaz translúcida con efectos de desenfoque dinámicos.
- **Tipografía Moderna:** Uso de `Outfit` para encabezados y `Inter` para legibilidad.
- **Micro-interacciones:** Animaciones suaves en hover y estados de carga optimizados.
- **Reporte Técnico Blockchain:** Visualización en tiempo real de PDAs, authorities y estados de escrow directamente en la interfaz.

### ⛓️ Lógica de Negocio en Blockchain
- **Estrategia "Bidder Pocket" 2.0:** Innovador sistema de reembolsos directos entre pujadores con **Buffer de Seguridad (SOL)** para cubrir "Rent" y comisiones, garantizando transacciones 100% exitosas.
- **Sincronización Síncrona (Zero-Delay):** Arquitectura de estado basada en `useMemo` que garantiza que la wallet y el contrato estén siempre en perfecto equilibrio durante cambios de cuenta instantáneos.
- **Read-Only Mode:** Soporte nativo para navegación sin wallet. Los usuarios pueden explorar el mercado y ver detalles técnicos sin necesidad de conexión.
- **Escrow Automatizado:** Los fondos de las pujas ganadoras permanecen seguros en la blockchain hasta la finalización.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Smart Contract** | Rust + Anchor Framework (v0.32.1) |
| **Frontend** | Next.js 16 (Turbopack) |
| **Styles** | Tailwind CSS v4 + Vanilla CSS |
| **Wallet** | Solana Wallet Adapter (Phantom, Solflare) |
| **Protocol Icons** | Lucide React |

---

## ⚙️ Configuración Local de Solana

Para probar la DApp en tu entorno local, sigue estos pasos esenciales:

### 1. Iniciar el Validador Local
Abre una terminal separada y ejecuta:
```bash
solana-test-validator
```

### 2. Configurar el CLI de Solana
Asegúrate de que tu CLI esté apuntando a localhost:
```bash
solana config set --url localhost
```

### 3. Crear una Wallet de Desarrollo e Inyectar Fondos (Airdrop)
Si no tienes una wallet local creada:
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```
Solicita SOL para poder desplegar e interactuar:
```bash
solana airdrop 2
```

---

## 🚀 Despliegue del Sistema

### Program (Blockchain)
```bash
cd subastas_program
anchor build
anchor deploy
```

### App (Interfaz)
```bash
cd subastas_app
npm install
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🧪 Guía de Uso Rápido

1. **Conexión:** Conecta tu Phantom Wallet y asegúrate de cambiar la red a **Localhost 8899**.
2. **Exploración:** Navega por las subastas existentes incluso sin conectar tu wallet.
3. **Pujar:** Realiza una oferta superior al precio base. El sistema gestionará el reembolso al pujador anterior automáticamente desde tu wallet.
4. **Reporte:** Consulta el "Reporte de Protocolo Blockchain" en la vista de detalle para ver la transparencia absoluta de la subasta.
5. **Cierre:** Una vez finalizado el tiempo, el creador liquida la subasta y recibe el fondo acumulado.

---

## 📁 Estructura del Código
- `/subastas_program`: Contiene la lógica en Rust dividida por instrucciones y estado.
- `/subastas_app/src/context/GlobalContext.tsx`: Manejo robusto del estado global y conexión read-only.
- `/subastas_app/src/app/subasta/[id]/page.tsx`: Módulo principal de visualización y "Reporte Técnico".

---

Desarrollado con ❤️ para la comunidad de Blockchain Technology Rust.
