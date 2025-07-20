const express = require('express');
const { body } = require('express-validator');
const purchaseController = require('../controllers/purchaseController');

const router = express.Router();

// Reglas de validación para crear/actualizar compras
const purchaseValidationRules = [
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

// Crear una nueva compra
router.post(
  '/',
  purchaseValidationRules,
  purchaseController.createPurchase
);

// Obtener todas las compras
router.get('/', purchaseController.getAllPurchases);

// Obtener todas las compras por RUT
router.get('/person/:rut', purchaseController.getPurchasesByRut);

// Obtener compras por rango de fechas
router.get('/date-range', purchaseController.getPurchasesByDateRange);

// Obtener compras por rango de fechas y RUT
router.get('/date-range-rut', purchaseController.getPurchasesByDateRangeAndRut);

// Obtener una compra por ID
router.get('/:id', purchaseController.getPurchaseById);

// Actualizar una compra
router.put(
  '/:id',
  purchaseValidationRules,
  purchaseController.updatePurchase
);

// Eliminar una compra
router.delete('/:id', purchaseController.deletePurchase);

module.exports = router;
