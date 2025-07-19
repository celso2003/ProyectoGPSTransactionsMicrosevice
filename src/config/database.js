const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const database = process.env.POSTGRES_DB || 'inventory';
const username = process.env.POSTGRES_USER || 'user';
const password = process.env.POSTGRES_PASSWORD || 'password';
const host = process.env.POSTGRES_HOST || 'localhost';
const port = process.env.POSTGRES_PORT || 5432;

const sequelize = new Sequelize({
  database,
  username,
  password,
  host,
  port,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: msg => logger.info(msg),
});

// Función para conectar a la base de datos
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL Conectado');
    await sequelize.sync(); // Crear tablas automáticamente
    logger.info('Tablas de la base de datos sincronizadas');
    return sequelize;
  } catch (error) {
    logger.error(`Error al conectar a PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };