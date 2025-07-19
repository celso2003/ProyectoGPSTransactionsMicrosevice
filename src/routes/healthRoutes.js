const express = require('express');
const { sequelize } = require('../config/database');
const packageJson = require('../../package.json');

const router = express.Router();

// Endpoint de verificación de salud
router.get('/', async (req, res) => {
  let dbStatus = 'down';
  try {
    await sequelize.authenticate();
    dbStatus = 'up';
  } catch (e) {
    dbStatus = 'down';
  }

  const healthStatus = {
    status: dbStatus === 'up' ? 'up' : 'degraded',
    timestamp: new Date().toISOString(),
    version: packageJson.version,
    components: {
      database: {
        status: dbStatus
      },
      server: {
        status: 'up'
      }
    }
  };

  const statusCode = healthStatus.status === 'up' ? 200 : 503;

  return res.status(statusCode).json(healthStatus);
});

module.exports = router;