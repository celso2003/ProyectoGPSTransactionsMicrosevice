const request = require('supertest');
const express = require('express');
const metricsRoutes = require('../src/routes/metricsRoutes').router;

const app = express();
app.use('/metrics', metricsRoutes);

describe('Metrics Endpoints', () => {
  it('GET /metrics debe responder con status 200', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
  });
});
