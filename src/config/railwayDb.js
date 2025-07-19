const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Connection details for the Railway PostgreSQL database
const database = process.env.RAILWAY_DB_NAME || 'railway';
const username = process.env.RAILWAY_DB_USER || 'postgres';
const password = process.env.RAILWAY_DB_PASSWORD || 'password';
const host = process.env.RAILWAY_DB_HOST || 'containers-us-west-158.railway.app';
const port = process.env.RAILWAY_DB_PORT || 7574;

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

const connectRailwayDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Railway PostgreSQL Connected');
    return sequelize;
  } catch (error) {
    logger.error(`Error connecting to Railway PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectRailwayDB };
