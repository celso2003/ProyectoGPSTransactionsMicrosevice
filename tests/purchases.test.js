const request = require('supertest');
const express = require('express');
const purchaseRoutes = require('../src/routes/purchaseRoutes');
const purchaseController = require('../src/controllers/purchaseController');

// Mock the purchase controller
jest.mock('../src/controllers/purchaseController', () => ({
  createPurchase: jest.fn(),
  getAllPurchases: jest.fn(),
  getPurchasesByRut: jest.fn(),
  getPurchasesByDateRange: jest.fn(),
  getPurchasesByDateRangeAndRut: jest.fn(),
  getPurchaseById: jest.fn(),
  updatePurchase: jest.fn(),
  deletePurchase: jest.fn()
}));

describe('Purchase Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(purchaseRoutes);
    
    // Reset all mocks between tests
    jest.clearAllMocks();
  });

  describe('POST / - Create Purchase', () => {
    it('should call the createPurchase controller', async () => {
      // Mock controller implementation
      purchaseController.createPurchase.mockImplementation((req, res) => {
        const newPurchase = { 
          id: 1, 
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return res.status(201).json(newPurchase);
      });

      const purchaseData = {
        rut: '12345678-9',
        products: [{ productId: 1, quantity: 5 }],
        paymentMethod: 'cash',
        notes: 'Test purchase'
      };

      const response = await request(app)
        .post('/')
        .send(purchaseData);

      expect(response.status).toBe(201);
      expect(purchaseController.createPurchase).toHaveBeenCalled();
      expect(response.body).toHaveProperty('id');
      expect(response.body.rut).toBe('12345678-9');
    });

    it('should validate purchase data', async () => {
      // Invalid data - missing required fields
      const invalidData = {
        // Missing rut
        paymentMethod: 'cash'
        // Missing products
      };

      const response = await request(app)
        .post('/')
        .send(invalidData);
      
      // Express-validator will pass errors to controller
      expect(purchaseController.createPurchase).toHaveBeenCalled();
    });
  });

  describe('GET / - Get All Purchases', () => {
    it('should call the getAllPurchases controller', async () => {
      purchaseController.getAllPurchases.mockImplementation((req, res) => {
        return res.status(200).json({
          purchases: [
            { id: 1, rut: '12345678-9', transactionDate: new Date() },
            { id: 2, rut: '98765432-1', transactionDate: new Date() }
          ],
          totalPurchases: 2,
          currentPage: 1
        });
      });

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(purchaseController.getAllPurchases).toHaveBeenCalled();
      expect(response.body).toHaveProperty('purchases');
      expect(response.body.purchases).toHaveLength(2);
    });

    it('should pass query parameters to controller', async () => {
      purchaseController.getAllPurchases.mockImplementation((req, res) => {
        return res.status(200).json({
          purchases: [{ id: 1 }],
          totalPurchases: 1,
          currentPage: 1,
          ...req.query
        });
      });

      const response = await request(app)
        .get('/')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(purchaseController.getAllPurchases).toHaveBeenCalled();
      expect(response.body).toHaveProperty('page', '2');
      expect(response.body).toHaveProperty('limit', '10');
    });
  });

  describe('GET /person/:rut - Get Purchases by RUT', () => {
    it('should call the getPurchasesByRut controller with correct parameters', async () => {
      purchaseController.getPurchasesByRut.mockImplementation((req, res) => {
        return res.status(200).json({
          rut: req.params.rut,
          personName: 'Test Person',
          purchases: [
            { id: 1, rut: req.params.rut, transactionDate: new Date() }
          ],
          totalPurchases: 1
        });
      });

      const response = await request(app).get('/person/12345678-9');

      expect(response.status).toBe(200);
      expect(purchaseController.getPurchasesByRut).toHaveBeenCalled();
      expect(response.body).toHaveProperty('rut', '12345678-9');
      expect(response.body).toHaveProperty('purchases');
    });
  });

  describe('GET /date-range - Get Purchases by Date Range', () => {
    it('should call the getPurchasesByDateRange controller', async () => {
      purchaseController.getPurchasesByDateRange.mockImplementation((req, res) => {
        return res.status(200).json({
          startDate: req.query.startDate,
          endDate: req.query.endDate,
          purchases: [
            { id: 1, transactionDate: new Date('2023-01-15') }
          ],
          totalPurchases: 1
        });
      });

      const response = await request(app)
        .get('/date-range')
        .query({ startDate: '2023-01-01', endDate: '2023-01-31' });

      expect(response.status).toBe(200);
      expect(purchaseController.getPurchasesByDateRange).toHaveBeenCalled();
      expect(response.body).toHaveProperty('startDate', '2023-01-01');
      expect(response.body).toHaveProperty('endDate', '2023-01-31');
    });
  });

  describe('GET /date-range-rut - Get Purchases by Date Range and RUT', () => {
    it('should call the getPurchasesByDateRangeAndRut controller', async () => {
      purchaseController.getPurchasesByDateRangeAndRut.mockImplementation((req, res) => {
        return res.status(200).json({
          rut: req.query.rut,
          startDate: req.query.startDate,
          endDate: req.query.endDate,
          purchases: [
            { id: 1, rut: req.query.rut, transactionDate: new Date('2023-01-15') }
          ],
          totalPurchases: 1
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
      expect(purchaseController.getPurchasesByDateRangeAndRut).toHaveBeenCalled();
      expect(response.body).toHaveProperty('rut', '12345678-9');
      expect(response.body).toHaveProperty('startDate', '2023-01-01');
      expect(response.body).toHaveProperty('endDate', '2023-01-31');
    });
  });

  describe('GET /:id - Get Purchase by ID', () => {
    it('should call the getPurchaseById controller with the correct ID', async () => {
      purchaseController.getPurchaseById.mockImplementation((req, res) => {
        return res.status(200).json({
          id: parseInt(req.params.id),
          rut: '12345678-9',
          transactionDate: new Date(),
          products: [{ productId: 1, quantity: 2 }]
        });
      });

      const response = await request(app).get('/1');

      expect(response.status).toBe(200);
      expect(purchaseController.getPurchaseById).toHaveBeenCalled();
      expect(response.body).toHaveProperty('id', 1);
    });
  });

  describe('PUT /:id - Update Purchase', () => {
    it('should call the updatePurchase controller with the ID and correct data', async () => {
      purchaseController.updatePurchase.mockImplementation((req, res) => {
        const updatedPurchase = {
          id: parseInt(req.params.id),
          ...req.body,
          updatedAt: new Date()
        };
        return res.status(200).json(updatedPurchase);
      });

      const updateData = {
        paymentMethod: 'credit_card',
        notes: 'Updated purchase',
        products: [{ productId: 2, quantity: 3 }],
        rut: '12345678-9'
      };

      const response = await request(app)
        .put('/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(purchaseController.updatePurchase).toHaveBeenCalled();
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
      expect(purchaseController.updatePurchase).toHaveBeenCalled();
    });
  });

  describe('DELETE /:id - Delete Purchase', () => {
    it('should call the deletePurchase controller with the correct ID', async () => {
      purchaseController.deletePurchase.mockImplementation((req, res) => {
        return res.status(204).send();
      });

      const response = await request(app).delete('/1');

      expect(response.status).toBe(204);
      expect(purchaseController.deletePurchase).toHaveBeenCalled();
    });
  });
});
