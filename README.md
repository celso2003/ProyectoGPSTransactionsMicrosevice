# Microservicio de Inventario GPS Inventor

Un microservicio robusto para la gestión de operaciones de inventario, incluyendo transacciones de ventas y compras, desarrollado con Node.js, Express y PostgreSQL.

## 🚀 Características

- **Gestión de Transacciones**: Crear, leer, actualizar y eliminar transacciones de ventas y compras
- **Búsquedas Avanzadas**: Filtrado por RUT, rangos de fechas y combinaciones
- **Validación de Datos**: Validación robusta de entrada con express-validator
- **Logging**: Sistema de logging completo con Winston
- **Monitoreo de Salud**: Endpoints de health check para monitoreo
- **Seguridad**: Implementación de Helmet para headers de seguridad
- **CORS**: Soporte completo para Cross-Origin Resource Sharing
- **Base de Datos**: PostgreSQL con Sequelize ORM
- **Docker**: Containerización completa con Docker

## 📋 Prerrequisitos

- Node.js >= 16.0.0
- PostgreSQL
- Docker (opcional)

## 🛠️ Instalación

### Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd ProyectoGPSInventorMicroservice
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crear un archivo `.env` en la raíz del proyecto:
   ```env
   POSTGRES_DB=inventory
   POSTGRES_USER=user
   POSTGRES_PASSWORD=password
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   PORT=3001
   ```

4. **Ejecutar el servidor**
   ```bash
   npm start
   ```

### Instalación con Docker

1. **Construir la imagen**
   ```bash
   docker build -t inventory-microservice .
   ```

2. **Ejecutar el contenedor**
   ```bash
   docker run -p 3001:3001 --env-file .env inventory-microservice
   ```

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **`persons`**: Información de personas/clientes
- **`product`**: Catálogo de productos
- **`transacction`**: Transacciones (ventas y compras)
- **`product_transaccion`**: Relación entre productos y transacciones

### Modelo de Transacción

```json
{
  "id": "integer (auto-increment)",
  "transactionDate": "datetime",
  "rut": "string (referencia a persons.rut)",
  "paymentMethod": "enum (cash, credit_card, bank_transfer, check, credit_line)",
  "totalAmount": "double",
  "notes": "string (máximo 1000 caracteres)",
  "isasale": "boolean (false=compra, true=venta)",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## 📡 Endpoints de la API

### Base URL
```
http://localhost:3001
```

### 1. Health Check

#### GET `/health`
Verifica el estado de salud del microservicio y la base de datos.

**Respuesta:**
```json
{
  "status": "up|degraded",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "components": {
    "database": {
      "status": "up|down"
    },
    "server": {
      "status": "up"
    }
  }
}
```

**Códigos de Estado:**
- `200`: Servicio funcionando correctamente
- `503`: Servicio degradado (base de datos no disponible)

---

### 2. Transacciones Generales

#### POST `/transactions`
Crea una nueva transacción (compra o venta).

**Cuerpo de la Petición:**
```json
{
  "transactionDate": "2024-01-01T10:00:00.000Z",
  "rut": "12345678-9",
  "products": [
    {
      "productId": 1,
      "quantity": 5
    }
  ],
  "paymentMethod": "cash",
  "totalAmount": 15000,
  "notes": "Transacción de ejemplo"
}
```

**Validaciones:**
- `transactionDate`: Fecha válida en formato ISO8601 (opcional)
- `rut`: Obligatorio, debe ser una cadena
- `products`: Array con al menos un producto
- `products.*.productId`: Entero positivo
- `products.*.quantity`: Entero positivo mayor a 0
- `paymentMethod`: Uno de: `cash`, `credit_card`, `bank_transfer`, `check`, `credit_line`
- `totalAmount`: Número positivo (opcional)
- `notes`: Máximo 1000 caracteres (opcional)

#### GET `/transactions`
Obtiene todas las transacciones.

#### GET `/transactions/person/:rut`
Obtiene todas las transacciones de una persona específica por RUT.

**Parámetros:**
- `rut`: RUT de la persona

#### GET `/transactions/date-range`
Obtiene transacciones por rango de fechas.

**Query Parameters:**
- `startDate`: Fecha de inicio (ISO8601)
- `endDate`: Fecha de fin (ISO8601)

#### GET `/transactions/date-range-rut`
Obtiene transacciones por rango de fechas y RUT específico.

**Query Parameters:**
- `startDate`: Fecha de inicio (ISO8601)
- `endDate`: Fecha de fin (ISO8601)
- `rut`: RUT de la persona

#### GET `/transactions/:id`
Obtiene una transacción específica por ID.

**Parámetros:**
- `id`: ID de la transacción

#### PUT `/transactions/:id`
Actualiza una transacción existente.

**Parámetros:**
- `id`: ID de la transacción

**Cuerpo de la Petición:** Mismo formato que POST

#### DELETE `/transactions/:id`
Elimina una transacción.

**Parámetros:**
- `id`: ID de la transacción

---

### 3. Compras

#### POST `/api/purchases`
Crea una nueva compra.

**Cuerpo de la Petición:** Mismo formato que transacciones generales

#### GET `/api/purchases`
Obtiene todas las compras.

#### GET `/api/purchases/person/:rut`
Obtiene todas las compras de una persona específica por RUT.

#### GET `/api/purchases/date-range`
Obtiene compras por rango de fechas.

#### GET `/api/purchases/date-range-rut`
Obtiene compras por rango de fechas y RUT específico.

#### GET `/api/purchases/:id`
Obtiene una compra específica por ID.

#### PUT `/api/purchases/:id`
Actualiza una compra existente.

#### DELETE `/api/purchases/:id`
Elimina una compra.

---

### 4. Ventas

#### POST `/api/sales`
Crea una nueva venta.

**Cuerpo de la Petición:** Mismo formato que transacciones generales

#### GET `/api/sales`
Obtiene todas las ventas.

#### GET `/api/sales/person/:rut`
Obtiene todas las ventas de una persona específica por RUT.

#### GET `/api/sales/date-range`
Obtiene ventas por rango de fechas.

#### GET `/api/sales/date-range-rut`
Obtiene ventas por rango de fechas y RUT específico.

#### GET `/api/sales/:id`
Obtiene una venta específica por ID.

#### PUT `/api/sales/:id`
Actualiza una venta existente.

#### DELETE `/api/sales/:id`
Elimina una venta.

---

## 🔧 Scripts Disponibles

```bash
# Iniciar el servidor
npm start

# Iniciar en modo desarrollo (con nodemon)
npm run dev

# Ejecutar tests
npm test

# Ejecutar tests de integración
npm run test:integration

# Ejecutar seed de datos
npm run seed
```

## 🧪 Testing

El proyecto incluye tests unitarios y de integración usando Jest y Supertest.

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests de integración
npm run test:integration
```

## 📊 Logging

El sistema utiliza Winston para el logging con los siguientes niveles:
- `info`: Información general
- `warn`: Advertencias
- `error`: Errores

Los logs se guardan en el directorio `logs/`.

## 🔒 Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configuración de Cross-Origin Resource Sharing
- **Validación**: Validación robusta de entrada con express-validator
- **Sanitización**: Sanitización automática de datos de entrada

## 🚀 Despliegue

### Railway
El proyecto incluye configuración para despliegue en Railway con el archivo `railway.json`.

### Docker
```bash
# Construir imagen
docker build -t inventory-microservice .

# Ejecutar contenedor
docker run -p 3001:3001 --env-file .env inventory-microservice
```

## 📝 Notas Importantes

1. **Base de Datos**: El microservicio requiere PostgreSQL configurado correctamente
2. **Variables de Entorno**: Asegúrate de configurar todas las variables de entorno necesarias
3. **SSL**: La configuración de base de datos incluye SSL por defecto
4. **Puerto**: El puerto por defecto es 3001, pero puede ser configurado con la variable `PORT`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 