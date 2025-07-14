const request = require('supertest');
const express = require('express');
const { router: metricsRouter } = require('../src/routes/metricsRoutes');

describe('Metrics Endpoints', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(metricsRouter);
  });

  it('should return metrics in prometheus format', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    
    // Check for the presence of key metrics in the response text
    expect(res.text).toContain('http_request_duration_ms');
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('sales_transactions_total');
    expect(res.text).toContain('purchase_transactions_total');
    
    // Check that the metrics format is proper Prometheus format (starts with # HELP)
    expect(res.text).toMatch(/^# HELP/);
  });
});
