const express = require('express');
const mongoose = require('mongoose');
const packageJson = require('../../package.json');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  // Check MongoDB connection
  const dbStatus = mongoose.connection.readyState === 1 ? 'up' : 'down';
  
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