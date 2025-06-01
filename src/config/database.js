const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const connectionString = process.env.POSTGRES_URI || 'postgres://user:password@localhost:5432/inventory';

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
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