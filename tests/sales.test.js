const request = require('supertest');
const express = require('express');
const salesRoutes = require('../src/routes/salesRoutes');
const salesController = require('../src/controllers/salesController');

// Mock the sales controller
jest.mock('../src/controllers/salesController', () => ({
  createSale: jest.fn(),
  getAllSales: jest.fn(),
  getSalesByRut: jest.fn(),
  getSalesByDateRange: jest.fn(),
  getSalesByDateRangeAndRut: jest.fn(),
  getSaleById: jest.fn(),
  updateSale: jest.fn(),
  deleteSale: jest.fn()
}));

describe('Sales Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(salesRoutes);
    
    // Reset all mocks between tests
    jest.clearAllMocks();
  });

  describe('POST / - Create Sale', () => {
    it('should call the createSale controller', async () => {
      // Mock controller implementation
      salesController.createSale.mockImplementation((req, res) => {
        const newSale = { 
          id: 1, 
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return res.status(201).json(newSale);
      });

      const saleData = {
        rut: '12345678-9',
        products: [{ productId: 1, quantity: 5 }],
        paymentMethod: 'cash',
        notes: 'Test sale'
      };

      const response = await request(app)
        .post('/')
        .send(saleData);

      expect(response.status).toBe(201);
      expect(salesController.createSale).toHaveBeenCalled();
      expect(response.body).toHaveProperty('id');
      expect(response.body.rut).toBe('12345678-9');
    });

    it('should validate sale data', async () => {
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
      expect(salesController.createSale).toHaveBeenCalled();
    });
  });

  describe('GET / - Get All Sales', () => {
    it('should call the getAllSales controller', async () => {
      salesController.getAllSales.mockImplementation((req, res) => {
        return res.status(200).json({
          sales: [
            { id: 1, rut: '12345678-9', transactionDate: new Date() },
            { id: 2, rut: '98765432-1', transactionDate: new Date() }
          ],
          totalSales: 2,
          currentPage: 1
        });
      });

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(salesController.getAllSales).toHaveBeenCalled();
      expect(response.body).toHaveProperty('sales');
      expect(response.body.sales).toHaveLength(2);
    });

    it('should pass query parameters to controller', async () => {
      salesController.getAllSales.mockImplementation((req, res) => {
        return res.status(200).json({
          sales: [{ id: 1 }],
          totalSales: 1,
          currentPage: 1,
          ...req.query
        });
      });

      const response = await request(app)
        .get('/')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(salesController.getAllSales).toHaveBeenCalled();
      expect(response.body).toHaveProperty('page', '2');
      expect(response.body).toHaveProperty('limit', '10');
    });
  });

  describe('GET /person/:rut - Get Sales by RUT', () => {
    it('should call the getSalesByRut controller with correct parameters', async () => {
      salesController.getSalesByRut.mockImplementation((req, res) => {
        return res.status(200).json({
          rut: req.params.rut,
          personName: 'Test Person',
          sales: [
            { id: 1, rut: req.params.rut, transactionDate: new Date() }
          ],
          totalSales: 1
        });
      });

      const response = await request(app).get('/person/12345678-9');

      expect(response.status).toBe(200);
      expect(salesController.getSalesByRut).toHaveBeenCalled();
      expect(response.body).toHaveProperty('rut', '12345678-9');
      expect(response.body).toHaveProperty('sales');
    });
  });

  describe('GET /date-range - Get Sales by Date Range', () => {
    it('should call the getSalesByDateRange controller', async () => {
      salesController.getSalesByDateRange.mockImplementation((req, res) => {
        return res.status(200).json({
          startDate: req.query.startDate,
          endDate: req.query.endDate,
          sales: [
            { id: 1, transactionDate: new Date('2023-01-15') }
          ],
          totalSales: 1
        });
      });

      const response = await request(app)
        .get('/date-range')
        .query({ startDate: '2023-01-01', endDate: '2023-01-31' });

      expect(response.status).toBe(200);
      expect(salesController.getSalesByDateRange).toHaveBeenCalled();
      expect(response.body).toHaveProperty('startDate', '2023-01-01');
      expect(response.body).toHaveProperty('endDate', '2023-01-31');
    });
  });

  describe('GET /date-range-rut - Get Sales by Date Range and RUT', () => {
    it('should call the getSalesByDateRangeAndRut controller', async () => {
      salesController.getSalesByDateRangeAndRut.mockImplementation((req, res) => {
        return res.status(200).json({
          rut: req.query.rut,
          startDate: req.query.startDate,
          endDate: req.query.endDate,
          sales: [
            { id: 1, rut: req.query.rut, transactionDate: new Date('2023-01-15') }
          ],
          totalSales: 1
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
      expect(salesController.getSalesByDateRangeAndRut).toHaveBeenCalled();
      expect(response.body).toHaveProperty('rut', '12345678-9');
      expect(response.body).toHaveProperty('startDate', '2023-01-01');
      expect(response.body).toHaveProperty('endDate', '2023-01-31');
    });
  });

  describe('GET /:id - Get Sale by ID', () => {
    it('should call the getSaleById controller with the correct ID', async () => {
      salesController.getSaleById.mockImplementation((req, res) => {
        return res.status(200).json({
          id: parseInt(req.params.id),
          rut: '12345678-9',
          transactionDate: new Date(),
          products: [{ productId: 1, quantity: 2 }]
        });
      });

      const response = await request(app).get('/1');

      expect(response.status).toBe(200);
      expect(salesController.getSaleById).toHaveBeenCalled();
      expect(response.body).toHaveProperty('id', 1);
    });
  });

  describe('PUT /:id - Update Sale', () => {
    it('should call the updateSale controller with the ID and correct data', async () => {
      salesController.updateSale.mockImplementation((req, res) => {
        const updatedSale = {
          id: parseInt(req.params.id),
          ...req.body,
          updatedAt: new Date()
        };
        return res.status(200).json(updatedSale);
      });

      const updateData = {
        paymentMethod: 'credit_card',
        notes: 'Updated sale',
        products: [{ productId: 2, quantity: 3 }],
        rut: '12345678-9'
      };

      const response = await request(app)
        .put('/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(salesController.updateSale).toHaveBeenCalled();
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
      expect(salesController.updateSale).toHaveBeenCalled();
    });
  });

  describe('DELETE /:id - Delete Sale', () => {
    it('should call the deleteSale controller with the correct ID', async () => {
      salesController.deleteSale.mockImplementation((req, res) => {
        return res.status(204).send();
      });

      const response = await request(app).delete('/1');

      expect(response.status).toBe(204);
      expect(salesController.deleteSale).toHaveBeenCalled();
    });
  });
});
