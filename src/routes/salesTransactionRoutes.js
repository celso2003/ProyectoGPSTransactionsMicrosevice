const express = require('express');
const { body } = require('express-validator');
const salesTransactionController = require('../controllers/salesTransactionController');
const validateRequest = require('../middleware/validateRequest');
const authenticateJWT = require('../middleware/authenticateJWT');

const router = express.Router();

// Apply JWT authentication middleware for all routes
router.use(authenticateJWT);

// Validation rules for creating/updating sales transactions
const salesTransactionValidationRules = [
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Transaction date must be a valid date'),
  
  body('customerId')
    .notEmpty()
    .withMessage('Customer ID is required'),
  
  body('products')
    .isArray({ min: 1 })
    .withMessage('At least one product is required'),
  
  body('products.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each product'),
  
  body('products.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('products.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  
  body('paymentMethod')
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'])
    .withMessage('Payment method must be valid'),
  
  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Notes must be a string with maximum 1000 characters')
];

// Create a new sales transaction
router.post(
  '/',
  salesTransactionValidationRules,
  validateRequest,
  salesTransactionController.createSalesTransaction
);

// Get all sales transactions
router.get('/', salesTransactionController.getAllSalesTransactions);

// Get a sales transaction by ID
router.get('/:id', salesTransactionController.getSalesTransactionById);

// Update a sales transaction
router.put(
  '/:id',
  salesTransactionValidationRules,
  validateRequest,
  salesTransactionController.updateSalesTransaction
);

// Delete a sales transaction
router.delete('/:id', salesTransactionController.deleteSalesTransaction);

module.exports = router; 