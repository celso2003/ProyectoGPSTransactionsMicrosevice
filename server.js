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
const { router: metricsRouter, metrics } = require('./src/routes/metricsRoutes');

// Create Express app
const app = express();



// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Set up middleware
app.use(helmet()); // Add security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Set up request logging
app.use(morgan('common', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Set up metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // When response is finished, record metrics
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Record request count
    metrics.httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode
    });
    
    // Record request duration
    metrics.httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route: req.route ? req.route.path : req.path,
        status_code: res.statusCode
      },
      duration
    );
  });
  
  next();
});

// Import routes
const transactionRoutes = require('./src/routes/transactionRoutes'); // New route
const healthRoutes = require('./src/routes/healthRoutes');

// Define route handlers
app.use('/transactions', transactionRoutes); // New route handler
app.use('/health', healthRoutes);
app.use('/metrics', metricsRouter);


// Handle 404 errors
app.use((req, res) => {
  logger.warn(`Route not found: ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

// Handle server errors
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
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