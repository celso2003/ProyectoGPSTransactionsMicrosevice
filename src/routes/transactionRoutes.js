const express = require('express');
const { body } = require('express-validator');
const transactionController = require('../controllers/transactionController');

const router = express.Router();

// Reglas de validación para crear/actualizar transacciones
const transactionValidationRules = [
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de transacción debe ser una fecha válida'),
  
  body('rut')
    .notEmpty()
    .withMessage('El RUT es obligatorio')
    .isString()
    .withMessage('El RUT debe ser una cadena de caracteres'),
  
  body('products')
    .isArray({ min: 1 })
    .withMessage('Se requiere al menos un producto'),
  
  body('products.*.productId')
    .isInt()
    .withMessage('El ID del producto debe ser un número entero'),
  
  body('products.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero positivo'),
  
  body('paymentMethod')
    .isIn(['cash', 'credit_card', 'bank_transfer', 'check', 'credit_line'])
    .withMessage('El método de pago debe ser válido'),
  
  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto total debe ser un número positivo'),
  
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Las notas deben ser una cadena de caracteres con un máximo de 1000 caracteres')
];

// Crear una nueva transacción
router.post(
  '/',
  transactionValidationRules,
  transactionController.createTransaction
);

// Obtener todas las transacciones
router.get('/', transactionController.getAllTransactions);

// Obtener todas las transacciones por RUT
router.get('/person/:rut', transactionController.getTransactionsByRut);

// Obtener transacciones por rango de fechas
router.get('/date-range', transactionController.getTransactionsByDateRange);

// Obtener transacciones por rango de fechas y RUT
router.get('/date-range-rut', transactionController.getTransactionsByDateRangeAndRut);

// Obtener una transacción por ID
router.get('/:id', transactionController.getTransactionById);

// Actualizar una transacción
router.put(
  '/:id',
  transactionValidationRules,
  transactionController.updateTransaction
);

// Eliminar una transacción
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
