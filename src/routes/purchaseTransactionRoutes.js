const express = require('express');
const { body } = require('express-validator');
const purchaseTransactionController = require('../controllers/purchaseTransactionController');
const validateRequest = require('../middleware/validateRequest');
const authenticateJWT = require('../middleware/authenticateJWT');

const router = express.Router();

// Apply JWT authentication middleware for all routes
router.use(authenticateJWT);

// Validation rules for creating/updating purchase transactions
const purchaseTransactionValidationRules = [
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Transaction date must be a valid date'),
  
  body('supplierId')
    .notEmpty()
    .withMessage('Supplier ID is required'),
  
  body('products')
    .isArray({ min: 1 })
    .withMessage('At least one product is required'),
  
  body('products.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each product'),
  
  body('products.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('products.*.unitCost')
    .isFloat({ min: 0 })
    .withMessage('Unit cost must be a positive number'),
  
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

// Create a new purchase transaction
router.post(
  '/',
  purchaseTransactionValidationRules,
  validateRequest,
  purchaseTransactionController.createPurchaseTransaction
);

// Get all purchase transactions
router.get('/', purchaseTransactionController.getAllPurchaseTransactions);

// Get a purchase transaction by ID
router.get('/:id', purchaseTransactionController.getPurchaseTransactionById);

// Update a purchase transaction
router.put(
  '/:id',
  purchaseTransactionValidationRules,
  validateRequest,
  purchaseTransactionController.updatePurchaseTransaction
);

// Delete a purchase transaction
router.delete('/:id', purchaseTransactionController.deletePurchaseTransaction);

module.exports = router; 