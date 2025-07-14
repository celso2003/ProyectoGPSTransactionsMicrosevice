const request = require('supertest');
const express = require('express');
const holaMundoRoutes = require('../src/routes/holaMundo');

const app = express();
app.use(holaMundoRoutes);

describe('Hola Mundo Endpoints', () => {
  it('GET /hola debe responder con el mensaje correcto', async () => {
    const res = await request(app).get('/hola');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ mensaje: 'Hola mundito' });
  });
});
