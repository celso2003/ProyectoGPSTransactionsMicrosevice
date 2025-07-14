const request = require('supertest');
const express = require('express');
const healthRoutes = require('../src/routes/healthRoutes');

// Mock the database connection
jest.mock('../src/config/database', () => {
  return {
    sequelize: {
      authenticate: jest.fn()
    }
  };
});

// Mock package.json
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
    // Mock successful DB connection
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
    // Mock failed DB connection
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
