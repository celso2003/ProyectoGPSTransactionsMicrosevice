const request = require('supertest');
const express = require('express');
const salesRoutes = require('../src/routes/salesTransactionRoutes');

const app = express();
app.use(express.json());
app.use('/sales', salesRoutes);

describe('Sales Transaction Endpoints', () => {
  it('GET /sales debe responder con status 200', async () => {
    const res = await request(app).get('/sales');
    expect(res.statusCode).toBe(200);
  });

  it('GET /sales/1 debe responder con status 200 o 404', async () => {
    const res = await request(app).get('/sales/1');
    expect([200, 404]).toContain(res.statusCode);
  });

  it('POST /sales debe responder con status 400 si falta body', async () => {
    const res = await request(app).post('/sales').send({});
    expect([400, 422]).toContain(res.statusCode);
  });
});
