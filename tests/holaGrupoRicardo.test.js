const request = require('supertest');
const express = require('express');
const testRoutes = require('../src/routes/testRoutes');

const app = express();
app.use(testRoutes);

describe('hola grupo ricardo', () => {
  it('debería responder con el mensaje correcto', async () => {
    const res = await request(app).get('/hola');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ mensaje: 'Hola ricardo' });
  });
});
