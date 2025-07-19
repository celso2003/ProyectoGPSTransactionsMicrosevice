const request = require('supertest');
const express = require('express');
const transactionRoutes = require('../src/routes/transactionRoutes');

// Mock the models
jest.mock('../src/models/dbModels', () => {
  const mockPerson = {
    rut: '12345678-9',
    name: 'John',
    lastname: 'Doe'
  };

  const mockProduct = {
    productid: 1,
    name: 'Test Product',
    price: 1000,
    meassure: 'unit',
    type: 'test'
  };

  const mockProductTransactions = [
    { 
      id: 1, 
      TransactionId: 1, 
      productId: 1, 
      quantity: 2,
      Product: mockProduct 
    }
  ];

  const mockTransaction = {
    id: 1,
    transactionDate: '2025-07-10T12:00:00Z',
    rut: '12345678-9',
    paymentMethod: 'cash',
    totalAmount: 2000,
    notes: 'Test transaction',
    createdAt: '2025-07-10T12:00:00Z',
    updatedAt: '2025-07-10T12:00:00Z',
    ProductTransactions: mockProductTransactions,
    Person: mockPerson
  };

  return {
    Transaction: {
      findAndCountAll: jest.fn().mockResolvedValue({
        rows: [mockTransaction],
        count: 1
      }),
      findByPk: jest.fn().mockImplementation((id) => {
        if (id === '1') {
          return Promise.resolve({
            ...mockTransaction,
            update: jest.fn().mockResolvedValue(mockTransaction),
            destroy: jest.fn().mockResolvedValue(undefined)
          });
        } else {
          return Promise.resolve(null);
        }
      }),
      create: jest.fn().mockResolvedValue(mockTransaction)
    },
    ProductTransaction: {
      destroy: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(mockProductTransactions[0]),
      findAll: jest.fn().mockResolvedValue(mockProductTransactions)
    },
    Product: {
      findByPk: jest.fn().mockResolvedValue(mockProduct)
    },
    Person: {
      findByPk: jest.fn().mockResolvedValue(mockPerson)
    }
  };
});

// Mock sequelize transaction
jest.mock('../src/config/database', () => ({
  sequelize: {
    transaction: jest.fn().mockImplementation(() => ({
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue()
    }))
  }
}));

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Transaction Endpoints', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(transactionRoutes);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a new transaction', async () => {
      const transactionData = {
        rut: '12345678-9',
        paymentMethod: 'cash',
        products: [
          { productId: 1, quantity: 2 }
        ],
        notes: 'Test transaction'
      };

      const res = await request(app)
        .post('/')
        .send(transactionData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('rut', '12345678-9');
    });

    it('should return 400 on validation error', async () => {
      // Missing required field
      const transactionData = {
        paymentMethod: 'cash',
        products: [
          { productId: 1, quantity: 2 }
        ]
      };

      const res = await request(app)
        .post('/')
        .send(transactionData);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /', () => {
    it('should get all transactions with default pagination', async () => {
      const res = await request(app).get('/');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('totalTransactions', 1);
      expect(res.body).toHaveProperty('transactions');
      expect(res.body.transactions).toHaveLength(1);
      expect(res.body).toHaveProperty('currentPage', 1);
    });

    it('should apply filters when provided', async () => {
      const res = await request(app)
        .get('/?page=1&limit=10&startDate=2025-01-01&endDate=2025-12-31&rut=12345678-9');
      
      expect(res.statusCode).toBe(200);
      const { Transaction } = require('../src/models/dbModels');
      expect(Transaction.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rut: '12345678-9',
            transactionDate: expect.any(Object)
          })
        })
      );
    });
  });

  describe('GET /:id', () => {
    it('should get a transaction by ID', async () => {
      const res = await request(app).get('/1');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('rut', '12345678-9');
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app).get('/999');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Transaction not found');
    });
  });

  describe('PUT /:id', () => {
    it('should update an existing transaction', async () => {
      const updateData = {
        rut: '12345678-9',
        paymentMethod: 'credit_card',
        products: [
          { productId: 1, quantity: 3 }
        ]
      };

      const res = await request(app)
        .put('/1')
        .send(updateData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app)
        .put('/999')
        .send({
          rut: '12345678-9',
          paymentMethod: 'cash'
        });
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Transaction not found');
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a transaction', async () => {
      const res = await request(app).delete('/1');
      expect(res.statusCode).toBe(204);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app).delete('/999');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Transaction not found');
    });
  });
});
