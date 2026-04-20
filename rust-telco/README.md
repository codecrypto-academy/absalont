# Northwind Traders: E-Commerce & Dashboard Full-Stack

Esta es una plataforma integral de alto rendimiento que combina un **Panel Administrativo (Dashboard)** y una **Tienda Virtual (E-commerce)**. El sistema utiliza **Rust** para un backend ultrarrápido y **Next.js** para una interfaz de usuario moderna, profesional y altamente interactiva.

## 📊 Visión General del Sistema

El proyecto transforma la clásica base de datos Northwind en una aplicación moderna que permite no solo gestionar clientes, sino también monitorizar el rendimiento del negocio y procesar pedidos en tiempo real.

- **Dashboard Administrativo**: Visualización de métricas clave (Ingresos, Pedidos, Clientes) con gráficos dinámicos.
- **Tienda Virtual**: Catálogo completo de productos con sistema de carrito de compras.
- **Gestión CRM**: Control total sobre la base de clientes mediante operaciones CRUD avanzadas.

---

## 🏗️ Arquitectura y Estructura

El sistema implementa una arquitectura desacoplada diseñada para la escalabilidad y el máximo rendimiento.

```text
rust-web-main/
├── back/                # Backend en Rust (Rocket + SQLite)
│   ├── src/
│   │   ├── main.rs      # Punto de entrada y configuración
│   │   ├── models.rs    # Modelos de datos (DTOs)
│   │   ├── db.rs        # Capa de persistencia y transacciones
│   │   └── routes.rs    # Controladores de la API (Stats, Checkout, CRM)
│   ├── northwind.db     # Base de datos SQLite persistente
│   └── Dockerfile       # Virtualización optimizada para Rust
├── front/               # Frontend en Next.js (App Router)
│   ├── src/
│   │   ├── app/         # Dashboard, Tienda y CRM
│   │   ├── components/  # Componentes UI (Shadcn/UI)
│   │   └── lib/         # Cliente API y lógica de estado
│   └── Dockerfile       # Multi-stage build para Next.js
└── docker-compose.yml   # Orquestación completa del ecosistema
```

---

## 🎨 Características Destacadas

### Frontend (Next.js 14+)
- **Panel de Control (Dashboard)**: Métricas en tiempo real, tendencias de ventas y visualización de pedidos recientes.
- **Experiencia de Compra**: Flujo completo desde el catálogo de productos hasta el checkout.
- **Interfaz Premium**: Diseño basado en `glassmorphism`, animaciones sutiles y tipografía moderna (`Outfit/Inter`).
- **CRM Avanzado**: Paginación optimizada, búsqueda predictiva y gestión de integridad de datos.

### Backend (Rust / Rocket 0.5)
- **Motor de Transacciones**: Procesamiento seguro de pedidos utilizando transacciones de base de datos para garantizar la integridad.
- **Servicio de Analítica**: Endpoints especializados para el cálculo en tiempo real de estadísticas de negocio.
- **Alto Rendimiento**: Gestión de concurrencia segura mediante `Mutex` y serialización JSON ultrarrápida con `serde`.
- **Capa de Datos**: Abstracción completa de SQLite para consultas eficientes y desacopladas.

## 🚀 Ejecución del Proyecto

El sistema está diseñado para ser desplegado de forma sencilla mediante contenedores, garantizando que todas las dependencias estén preconfiguradas.

### 📋 Prerrequisitos

Asegúrate de tener instalados los siguientes componentes en tu sistema:
- **Docker**: [Instalar Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: [Instalar Docker Compose](https://docs.docker.com/compose/install/)

---

### 🐳 Despliegue con Docker (Recomendado)

Esta es la forma más rápida y segura de ejecutar todo el ecosistema (Backend + Frontend + DB).

#### 1. Construir e Iniciar
Desde la raíz del proyecto, ejecuta el siguiente comando para construir las imágenes y levantar los servicios:
```bash
docker-compose up --build
```

#### 2. Acceso a los Servicios
Una vez que los contenedores estén en ejecución, podrás acceder a ellos en las siguientes direcciones:

| Servicio | URL | Descripción |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Interfaz de usuario (Next.js) |
| **Backend** | [http://localhost:8001](http://localhost:8001) | API RESTful (Rust/Rocket) |
| **API Health** | [http://localhost:8001/customers](http://localhost:8001/customers) | Verificación de estado de la API |

#### 3. Comandos Útiles de Mantenimiento

- **Detener servicios**: `docker-compose down`
- **Ver logs en tiempo real**: `docker-compose logs -f`
- **Reiniciar un servicio específico**: `docker-compose restart frontend`

> [!TIP]
> La base de datos `northwind.db` se encuentra montada como un volumen persistente. Cualquier cambio realizado en los datos se mantendrá incluso si reinicias los contenedores.

---

### 💻 Ejecución en Modo Desarrollo (Local)

Si prefieres ejecutar los servicios manualmente sin Docker:

#### Backend (Rust)
1. Entra al directorio del servidor: `cd back`
2. Ejecuta la aplicación: `cargo run`
   - *El servidor iniciará en el puerto 8001 por defecto.*

#### Frontend (Next.js)
1. Entra al directorio de la interfaz: `cd front`
2. Instala las dependencias: `npm install`
3. Inicia el servidor de desarrollo: `npm run dev`
   - *La interfaz estará disponible en `http://localhost:3000`.*
