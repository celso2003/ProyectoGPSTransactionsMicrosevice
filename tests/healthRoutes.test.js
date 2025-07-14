const request = require('supertest');
const express = require('express');
const healthRoutes = require('../src/routes/healthRoutes');

const app = express();
app.use('/health', healthRoutes);

describe('Endpoints de salud', () => {
  it('GET /health debe responder con estado 200 o 503 y propiedades correctas', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('version');
  });
});
