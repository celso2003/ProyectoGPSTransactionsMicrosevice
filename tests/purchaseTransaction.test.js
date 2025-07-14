const request = require('supertest');
const express = require('express');
const purchaseTransactionRoutes = require('../src/routes/purchaseTransactionRoutes');

// Mock the models
jest.mock('../src/models/purchaseTransaction', () => {
  const mockPurchaseProducts = [
    { id: 1, productId: 'prod-1', quantity: 10, unitCost: 5.99 },
    { id: 2, productId: 'prod-2', quantity: 20, unitCost: 8.50 }
  ];

  const mockTransaction = {
    id: 1,
    transactionDate: '2025-07-10T12:00:00Z',
    supplierId: 'supp-123',
    paymentMethod: 'credit_card',
    totalAmount: 229.90,
    notes: 'Bulk purchase',
    products: mockPurchaseProducts,
    createdAt: '2025-07-10T12:00:00Z',
    updatedAt: '2025-07-10T12:00:00Z'
  };

  const mockProducts = jest.fn().mockReturnValue(mockPurchaseProducts);

  return {
    PurchaseTransaction: {
      create: jest.fn().mockResolvedValue(mockTransaction),
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
      })
    },
    PurchaseProduct: {
      destroy: jest.fn().mockResolvedValue(1),
      bulkCreate: jest.fn().mockResolvedValue(mockPurchaseProducts)
    }
  };
});

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Purchase Transaction Endpoints', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(purchaseTransactionRoutes);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a new purchase transaction', async () => {
      const transactionData = {
        supplierId: 'supp-123',
        paymentMethod: 'credit_card',
        products: [
          { productId: 'prod-1', quantity: 10, unitCost: 5.99 },
          { productId: 'prod-2', quantity: 20, unitCost: 8.50 }
        ],
        notes: 'Bulk purchase'
      };

      const res = await request(app)
        .post('/')
        .send(transactionData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('supplierId', 'supp-123');
      expect(res.body).toHaveProperty('products');
      expect(res.body.products).toHaveLength(2);
    });

    it('should return 400 on validation error', async () => {
      // Missing required field
      const transactionData = {
        paymentMethod: 'credit_card',
        products: [
          { productId: 'prod-1', quantity: 10, unitCost: 5.99 }
        ]
      };

      const res = await request(app)
        .post('/')
        .send(transactionData);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /', () => {
    it('should get all purchase transactions with default pagination', async () => {
      const res = await request(app).get('/');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('totalTransactions', 1);
      expect(res.body).toHaveProperty('purchaseTransactions');
      expect(res.body.purchaseTransactions).toHaveLength(1);
      expect(res.body).toHaveProperty('currentPage', 1);
    });

    it('should apply filters when provided', async () => {
      const res = await request(app)
        .get('/?page=1&limit=10&startDate=2025-01-01&endDate=2025-12-31&supplierId=supp-123');
      
      expect(res.statusCode).toBe(200);
      const { PurchaseTransaction } = require('../src/models/purchaseTransaction');
      expect(PurchaseTransaction.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            supplierId: 'supp-123',
            transactionDate: expect.any(Object)
          })
        })
      );
    });
  });

  describe('GET /:id', () => {
    it('should get a purchase transaction by ID', async () => {
      const res = await request(app).get('/1');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('supplierId', 'supp-123');
      expect(res.body).toHaveProperty('products');
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app).get('/999');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Purchase transaction not found');
    });
  });

  describe('PUT /:id', () => {
    it('should update an existing purchase transaction', async () => {
      const updateData = {
        supplierId: 'supp-456',
        paymentMethod: 'cash',
        products: [
          { productId: 'prod-3', quantity: 15, unitCost: 4.99 }
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
          supplierId: 'supp-456',
          paymentMethod: 'cash'
        });
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Purchase transaction not found');
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a purchase transaction', async () => {
      const res = await request(app).delete('/1');
      expect(res.statusCode).toBe(204);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app).delete('/999');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Purchase transaction not found');
    });
  });
});
