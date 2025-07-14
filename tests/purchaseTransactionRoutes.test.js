const request = require('supertest');
const express = require('express');
const purchaseRoutes = require('../src/routes/purchaseTransactionRoutes');

const app = express();
app.use(express.json());
app.use('/purchase', purchaseRoutes);

describe('Purchase Transaction Endpoints', () => {
  it('GET /purchase debe responder con status 200', async () => {
    const res = await request(app).get('/purchase');
    expect(res.statusCode).toBe(200);
  });

  it('GET /purchase/1 debe responder con status 200 o 404', async () => {
    const res = await request(app).get('/purchase/1');
    expect([200, 404]).toContain(res.statusCode);
  });

  it('POST /purchase debe responder con status 400 si falta body', async () => {
    const res = await request(app).post('/purchase').send({});
    expect([400, 422]).toContain(res.statusCode);
  });
});
