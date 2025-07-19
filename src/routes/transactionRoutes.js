const express = require('express');
const { body } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Validation rules for creating/updating transactions
const transactionValidationRules = [
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Transaction date must be a valid date'),
  
  body('rut')
    .notEmpty()
    .withMessage('RUT is required')
    .isString()
    .withMessage('RUT must be a string'),
  
  body('products')
    .isArray({ min: 1 })
    .withMessage('At least one product is required'),
  
  body('products.*.productId')
    .isInt()
    .withMessage('Product ID must be an integer'),
  
  body('products.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('paymentMethod')
    .isIn(['cash', 'credit_card', 'bank_transfer', 'check', 'credit_line'])
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

// Create a new transaction
router.post(
  '/',
  transactionValidationRules,
  validateRequest,
  transactionController.createTransaction
);

// Get all transactions
router.get('/', transactionController.getAllTransactions);

// Get all transactions by RUT
router.get('/person/:rut', transactionController.getTransactionsByRut);

// Get transactions by date range
router.get('/date-range', transactionController.getTransactionsByDateRange);

// Get transactions by date range and RUT
router.get('/date-range-rut', transactionController.getTransactionsByDateRangeAndRut);

// Get a transaction by ID
router.get('/:id', transactionController.getTransactionById);

// Update a transaction
router.put(
  '/:id',
  transactionValidationRules,
  validateRequest,
  transactionController.updateTransaction
);

// Delete a transaction
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
