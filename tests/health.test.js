const request = require('supertest');
const express = require('express');
const healthRoutes = require('../src/routes/healthRoutes');

// Simular la conexión a la base de datos
jest.mock('../src/config/database', () => {
  return {
    sequelize: {
      authenticate: jest.fn()
    }
  };
});

// Simular package.json
jest.mock('../package.json', () => ({
  version: '1.0.0'
}), { virtual: true });

describe('Health Endpoints', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(healthRoutes);
  });

  it('should return 200 when database is up', async () => {
    // Simular conexión exitosa a la BD
    const { sequelize } = require('../src/config/database');
    sequelize.authenticate.mockResolvedValueOnce();

    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'up');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body.components).toEqual({
      database: { status: 'up' },
      server: { status: 'up' }
    });
  });

  it('should return 503 when database is down', async () => {
    // Simular fallo en la conexión a la BD
    const { sequelize } = require('../src/config/database');
    sequelize.authenticate.mockRejectedValueOnce(new Error('DB Connection failed'));

    const res = await request(app).get('/');
    expect(res.statusCode).toBe(503);
    expect(res.body).toHaveProperty('status', 'degraded');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body.components).toEqual({
      database: { status: 'down' },
      server: { status: 'up' }
    });
  });
});
