const express = require('express');
const promClient = require('prom-client');

const router = express.Router();

// Create a Registry to store metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 200, 500, 1000, 2000, 5000]
});

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Transaction metrics
const salesTransactionsCounter = new promClient.Counter({
  name: 'sales_transactions_total',
  help: 'Total number of sales transactions created',
});

const purchaseTransactionsCounter = new promClient.Counter({
  name: 'purchase_transactions_total',
  help: 'Total number of purchase transactions created',
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(salesTransactionsCounter);
register.registerMetric(purchaseTransactionsCounter);

// Metrics route
router.get('/', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Export the register to use in other files
module.exports = {
  router,
  metrics: {
    httpRequestDurationMicroseconds,
    httpRequestCounter,
    salesTransactionsCounter,
    purchaseTransactionsCounter
  }
}; 