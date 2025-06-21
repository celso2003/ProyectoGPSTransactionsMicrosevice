const request = require('supertest');
const express = require('express');
const holaMundoRouter = require('../src/routes/holaMundo');

const app = express();
app.use(holaMundoRouter);

describe('hola grupo ricardo', () => {
  it('debería responder con el mensaje correcto', async () => {
    const res = await request(app).get('/hola');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ mensaje: 'Hola richard' });
  });
});
