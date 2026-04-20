# API de Gestión de Clientes Northwind (Rust)

Esta es una API RESTful de alto rendimiento construida con **Rust** y el framework **Rocket**. Proporciona una interfaz robusta para gestionar los registros de clientes de la base de datos Northwind, utilizando SQLite para la persistencia.

## Características

- **Arquitectura Modular**: Código organizado en capas (Modelos, DB, Rutas) para mayor escalabilidad.
- **Operaciones CRUD**: Soporte completo para Crear, Leer, Actualizar y Eliminar clientes.
- **Paginación y Filtrado**: Endpoints optimizados con soporte para paginación y búsqueda por nombre.
- **Seguridad de Hilos**: Gestión de estado mediante `Mutex` para un acceso seguro a la base de datos en entornos concurrentes.
- **CORS**: Configurado para permitir peticiones desde el frontend de Next.js.

## Estructura Modular

El backend ha sido refactorizado para seguir las mejores prácticas de Rust:

- `src/main.rs`: Punto de entrada, configuración del servidor Rocket y montaje de rutas.
- `src/models.rs`: Definición de estructuras de datos y lógica de serialización JSON.
- `src/db.rs`: Capa de persistencia que desacopla las consultas SQL de la lógica de negocio.
- `src/routes.rs`: Manejadores de rutas que gestionan las peticiones HTTP y las respuestas.

## Endpoints de la API

### 1. Obtener Clientes
**GET** `/customers`
- **Parámetros de consulta (opcionales)**:
  - `page`: Número de página (por defecto: 1)
  - `per_page`: Registros por página (por defecto: 10)
  - `name_filter`: Filtrar por nombre de empresa.
  - `order_by`: Campo para ordenar (por defecto: CompanyName).
  - `order_direction`: Dirección (ASC/DESC).

### 2. Obtener Cliente Único
**GET** `/customers/{id}`
- Devuelve los detalles de un cliente específico mediante su ID.

### 3. Crear Cliente
**POST** `/customers`
- **Body**: JSON con los datos del cliente.

### 4. Actualizar Cliente
**PUT** `/customers/{id}`
- **Body**: JSON con los datos actualizados.

### 5. Eliminar Cliente
**DELETE** `/customers/{id}`
- Elimina el registro del cliente especificado.

## Ejecución Local

### Requisitos Previos
- Rust (edición 2021) y Cargo instalados.
- Archivo `northwind.db` en la raíz del directorio `back/`.

### Pasos
1. Navega al directorio:
   ```bash
   cd back
   ```
2. Ejecuta la aplicación:
   ```bash
   cargo run
   ```
3. El servidor estará disponible en [http://localhost:8001](http://localhost:8001).

## Docker
Para ejecutar solo el backend mediante Docker:
```bash
docker build -t backend-rust .
docker run -p 8001:8001 backend-rust
```
