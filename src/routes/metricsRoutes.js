const express = require('express');
const promClient = require('prom-client');

const router = express.Router();

// Crear un registro para almacenar las métricas
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Métricas personalizadas
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duración de las solicitudes HTTP en ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 200, 500, 1000, 2000, 5000]
});

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Número total de solicitudes HTTP',
  labelNames: ['method', 'route', 'status_code']
});

// Métricas de transacciones
const salesTransactionsCounter = new promClient.Counter({
  name: 'sales_transactions_total',
  help: 'Número total de transacciones de ventas creadas',
});

const purchaseTransactionsCounter = new promClient.Counter({
  name: 'purchase_transactions_total',
  help: 'Número total de transacciones de compras creadas',
});

// Registrar métricas personalizadas
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(salesTransactionsCounter);
register.registerMetric(purchaseTransactionsCounter);

// Ruta de métricas
router.get('/', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Exportar el registro para usar en otros archivos
module.exports = {
  router,
  metrics: {
    httpRequestDurationMicroseconds,
    httpRequestCounter,
    salesTransactionsCounter,
    purchaseTransactionsCounter
  }
};