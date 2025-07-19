const request = require('supertest');
const express = require('express');
const transactionRoutes = require('../src/routes/transactionRoutes');
const transactionController = require('../src/controllers/transactionController');

// Mock transaction controller
jest.mock('../src/controllers/transactionController', () => ({
  createTransaction: jest.fn(),
  getAllTransactions: jest.fn(),
  getTransactionsByRut: jest.fn(),
  getTransactionsByDateRange: jest.fn(),
  getTransactionsByDateRangeAndRut: jest.fn(),
  getTransactionById: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn()
}));

describe('Transaction Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(transactionRoutes);
    
    // Reset all mocks between tests
    jest.clearAllMocks();
  });

  describe('POST / - Create Transaction', () => {
    it('should call createTransaction controller', async () => {
      // Mock controller implementation
      transactionController.createTransaction.mockImplementation((req, res) => {
        const newTransaction = { 
          id: 1, 
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return res.status(201).json(newTransaction);
      });

      const transactionData = {
        rut: '12345678-9',
        products: [{ productId: 1, quantity: 5 }],
        paymentMethod: 'cash',
        notes: 'Test transaction'
      };

      const response = await request(app)
        .post('/')
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(transactionController.createTransaction).toHaveBeenCalled();
      expect(response.body).toHaveProperty('id');
      expect(response.body.rut).toBe('12345678-9');
    });

    it('should validate transaction data', async () => {
      // Invalid data - missing required fields
      const invalidData = {
        // Missing rut
        paymentMethod: 'cash'
        // Missing products
      };

      const response = await request(app)
        .post('/')
        .send(invalidData);
      
      // Express-validator will pass errors to the controller
      expect(transactionController.createTransaction).toHaveBeenCalled();
    });
  });

  describe('GET / - Get All Transactions', () => {
    it('should call getAllTransactions controller', async () => {
      transactionController.getAllTransactions.mockImplementation((req, res) => {
        return res.status(200).json({
          transactions: [
            { id: 1, rut: '12345678-9', transactionDate: new Date() },
            { id: 2, rut: '98765432-1', transactionDate: new Date() }
          ],
          totalTransactions: 2,
          totalPages: 1,
          currentPage: 1
        });
      });

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(transactionController.getAllTransactions).toHaveBeenCalled();
      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions).toHaveLength(2);
    });

    it('should pass query parameters to controller', async () => {
      transactionController.getAllTransactions.mockImplementation((req, res) => {
        return res.status(200).json({
          transactions: [{ id: 1 }],
          totalTransactions: 1,
          totalPages: 1,
          currentPage: 1,
          ...req.query
        });
      });

      const response = await request(app)
        .get('/')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(transactionController.getAllTransactions).toHaveBeenCalled();
      expect(response.body).toHaveProperty('page', '2');
      expect(response.body).toHaveProperty('limit', '10');
    });
  });

  describe('GET /person/:rut - Get Transactions by RUT', () => {
    it('should call getTransactionsByRut controller with correct parameters', async () => {
      transactionController.getTransactionsByRut.mockImplementation((req, res) => {
        return res.status(200).json({
          rut: req.params.rut,
          personName: 'Test Person',
          transactions: [
            { id: 1, rut: req.params.rut, transactionDate: new Date() }
          ]
        });
      });

      const response = await request(app).get('/person/12345678-9');

      expect(response.status).toBe(200);
      expect(transactionController.getTransactionsByRut).toHaveBeenCalled();
      expect(response.body).toHaveProperty('rut', '12345678-9');
      expect(response.body).toHaveProperty('transactions');
    });
  });

  describe('GET /date-range - Get Transactions by Date Range', () => {
    it('should call getTransactionsByDateRange controller', async () => {
      transactionController.getTransactionsByDateRange.mockImplementation((req, res) => {
        return res.status(200).json({
          startDate: req.query.startDate,
          endDate: req.query.endDate,
          transactions: [
            { id: 1, transactionDate: new Date('2023-01-15') }
          ],
          totalTransactions: 1
        });
      });

      const response = await request(app)
        .get('/date-range')
        .query({ startDate: '2023-01-01', endDate: '2023-01-31' });

      expect(response.status).toBe(200);
      expect(transactionController.getTransactionsByDateRange).toHaveBeenCalled();
      expect(response.body).toHaveProperty('startDate', '2023-01-01');
      expect(response.body).toHaveProperty('endDate', '2023-01-31');
    });
  });

  describe('GET /date-range-rut - Get Transactions by Date Range and RUT', () => {
    it('should call getTransactionsByDateRangeAndRut controller', async () => {
      transactionController.getTransactionsByDateRangeAndRut.mockImplementation((req, res) => {
        return res.status(200).json({
          rut: req.query.rut,
          startDate: req.query.startDate,
          endDate: req.query.endDate,
          transactions: [
            { id: 1, rut: req.query.rut, transactionDate: new Date('2023-01-15') }
          ]
        });
      });

      const response = await request(app)
        .get('/date-range-rut')
        .query({ 
          rut: '12345678-9',
          startDate: '2023-01-01', 
          endDate: '2023-01-31' 
        });

      expect(response.status).toBe(200);
      expect(transactionController.getTransactionsByDateRangeAndRut).toHaveBeenCalled();
      expect(response.body).toHaveProperty('rut', '12345678-9');
      expect(response.body).toHaveProperty('startDate', '2023-01-01');
      expect(response.body).toHaveProperty('endDate', '2023-01-31');
    });
  });

  describe('GET /:id - Get Transaction by ID', () => {
    it('should call getTransactionById controller with correct ID', async () => {
      transactionController.getTransactionById.mockImplementation((req, res) => {
        return res.status(200).json({
          id: parseInt(req.params.id),
          rut: '12345678-9',
          transactionDate: new Date(),
          products: [{ productId: 1, quantity: 2 }]
        });
      });

      const response = await request(app).get('/1');

      expect(response.status).toBe(200);
      expect(transactionController.getTransactionById).toHaveBeenCalled();
      expect(response.body).toHaveProperty('id', 1);
    });
  });

  describe('PUT /:id - Update Transaction', () => {
    it('should call updateTransaction controller with correct ID and data', async () => {
      transactionController.updateTransaction.mockImplementation((req, res) => {
        const updatedTransaction = {
          id: parseInt(req.params.id),
          ...req.body,
          updatedAt: new Date()
        };
        return res.status(200).json(updatedTransaction);
      });

      const updateData = {
        paymentMethod: 'credit_card',
        notes: 'Updated transaction',
        products: [{ productId: 2, quantity: 3 }]
      };

      const response = await request(app)
        .put('/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(transactionController.updateTransaction).toHaveBeenCalled();
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body.paymentMethod).toBe('credit_card');
    });

    it('should validate update data', async () => {
      const invalidData = {
        paymentMethod: 'invalid_method',  // Invalid payment method
        products: [{ productId: 'abc', quantity: -5 }]  // Invalid product format
      };

      const response = await request(app)
        .put('/1')
        .send(invalidData);

      // Express-validator will pass errors to controller
      expect(transactionController.updateTransaction).toHaveBeenCalled();
    });
  });

  describe('DELETE /:id - Delete Transaction', () => {
    it('should call deleteTransaction controller with correct ID', async () => {
      transactionController.deleteTransaction.mockImplementation((req, res) => {
        return res.status(204).send();
      });

      const response = await request(app).delete('/1');

      expect(response.status).toBe(204);
      expect(transactionController.deleteTransaction).toHaveBeenCalled();
    });
  });
});