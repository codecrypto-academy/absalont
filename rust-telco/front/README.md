# Frontend de Gestión Northwind

Esta es la interfaz de usuario moderna construida con **Next.js** para el sistema de gestión Northwind. Proporciona una experiencia profesional e intuitiva para administrar la base de datos de clientes, conectándose a un backend de alto rendimiento en Rust.

## Características

- **Dashboard Visual**: Inicio profesional con iconografía estándar y accesos rápidos.
- **Gestión de Clientes**: Lista detallada con paginación, búsqueda en tiempo real y filtros.
- **Formularios Profesionales**: Interfaz de creación y edición organizada en cuadrículas con validación visual.
- **Vista de Detalles**: Panel informativo detallado con separación clara de datos de contacto y ubicación.
- **Diseño Adaptativo**: Optimizado para todos los tamaños de pantalla.

## Stack Tecnológico

- **Framework**: Next.js 14+ (App Router).
- **Lenguaje**: TypeScript para seguridad de tipos.
- **Componentes de UI**: Shadcn/UI basado en Radix UI.
- **Estilos**: Tailwind CSS.
- **Iconografía**: Lucide Icons para una visualización consistente.
- **Cliente API**: Fetch API con Server Actions para una comunicación eficiente.

## Configuración y Ejecución

### Requisitos Previos
- Node.js 18+ instalado.
- Backend en Rust ejecutándose (ver README principal).

### Pasos de Instalación
1. Navega al directorio del frontend:
   ```bash
   cd front
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Integración con la API

El frontend se comunica con la API de Rust (por defecto en `http://localhost:8001`) mediante los siguientes endpoints gestionados en `lib/api.ts`:

- `GET /customers`: Lista de clientes con paginación y filtros.
- `GET /customers/{id}`: Obtener detalles de un cliente específico.
- `POST /customers`: Crear un nuevo registro.
- `PUT /customers/{id}`: Actualizar datos existentes.
- `DELETE /customers/{id}`: Eliminar un cliente.
