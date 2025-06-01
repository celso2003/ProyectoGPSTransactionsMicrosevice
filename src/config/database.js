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

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL Connected');
    await sequelize.sync(); // Automatically create tables
    logger.info('Database tables synchronized');
    return sequelize;
  } catch (error) {
    logger.error(`Error connecting to PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB }; 