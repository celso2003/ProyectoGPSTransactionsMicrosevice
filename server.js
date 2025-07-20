require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import custom modules
const { sequelize, connectDB } = require('./src/config/database');
const logger = require('./src/utils/logger');

// Create Express app
const app = express();



// Crear el directorio de logs si no existe
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Configurar middlewares
app.use(helmet()); // Agregar cabeceras de seguridad
app.use(cors()); // Habilitar CORS
app.use(express.json()); // Parsear cuerpos de solicitudes JSON
app.use(express.urlencoded({ extended: true })); // Parsear cuerpos de solicitudes URL-encoded

// Configurar registro de solicitudes
app.use(morgan('common', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Importar rutas
const transactionRoutes = require('./src/routes/transactionRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');


// Definir manejadores de rutas
app.use('/transactions', transactionRoutes); // Nuevo manejador de ruta
app.use('/health', healthRoutes);
app.use('/api/purchases', purchaseRoutes);



// Manejar errores 404
app.use((req, res) => {
  logger.warn(`Ruta no encontrada: ${req.originalUrl}`);
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejar errores del servidor
app.use((err, req, res, next) => {
  logger.error(`Error no controlado: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});



// Start the server
(async () => {
  await connectDB();
  // Start the server
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    logger.info(`Inventory Microservice running on port ${PORT}`);
  });
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  console.error(err);
});

// Export the app for testing purposes
module.exports = app;