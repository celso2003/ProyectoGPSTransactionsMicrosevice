const transactionService = require('../services/transactionService');
const logger = require('../utils/logger');

// Crear una nueva transacción
exports.createTransaction = async (req, res) => {
  try {
    const { products, ...transactionData } = req.body;
    
    const result = await transactionService.createTransaction(transactionData, products);
    
    logger.info(`Transacción creada con ID: ${result.id}`);
    return res.status(201).json(result);
  } catch (error) {
    logger.error(`Error al crear la transacción: ${error.message}`);
    
    if (error.message === 'PERSON_NOT_FOUND') {
      return res.status(404).json({ message: 'Persona con el RUT proporcionado no encontrada' });
    }
    
    if (error.message.startsWith('PRODUCT_NOT_FOUND:')) {
      const productId = error.message.split(':')[1];
      return res.status(404).json({ message: `Producto con ID ${productId} no encontrado` });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Obtener todas las transacciones con paginación y filtrado
exports.getAllTransactions = async (req, res) => {
  try {
    const { page, limit, startDate, endDate, rut, paymentMethod } = req.query;
    
    const filters = { startDate, endDate, rut, paymentMethod };
    const pagination = { page, limit };
    
    const result = await transactionService.getAllTransactions(filters, pagination);
    
    logger.info(`Se recuperaron ${result.transactions.length} transacciones`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar transacciones: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Obtener una transacción por ID
exports.getTransactionById = async (req, res) => {
  try {
    const result = await transactionService.getTransactionById(req.params.id);
    
    logger.info(`Transacción recuperada con ID: ${req.params.id}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar la transacción: ${error.message}`);
    
    if (error.message === 'TRANSACTION_NOT_FOUND') {
      logger.warn(`Transacción no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Actualizar una transacción
exports.updateTransaction = async (req, res) => {
  try {
    const { products, ...transactionData } = req.body;
    
    const result = await transactionService.updateTransaction(req.params.id, transactionData, products);
    
    logger.info(`Transacción actualizada con ID: ${req.params.id}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al actualizar la transacción: ${error.message}`);
    
    if (error.message === 'TRANSACTION_NOT_FOUND') {
      logger.warn(`Transacción no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }
    
    if (error.message === 'PERSON_NOT_FOUND') {
      return res.status(404).json({ message: 'Persona con el RUT proporcionado no encontrada' });
    }
    
    if (error.message.startsWith('PRODUCT_NOT_FOUND:')) {
      const productId = error.message.split(':')[1];
      return res.status(404).json({ message: `Producto con ID ${productId} no encontrado` });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Eliminar una transacción
exports.deleteTransaction = async (req, res) => {
  try {
    await transactionService.deleteTransaction(req.params.id);
    
    logger.info(`Transacción eliminada con ID: ${req.params.id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error(`Error al eliminar la transacción: ${error.message}`);
    
    if (error.message === 'TRANSACTION_NOT_FOUND') {
      logger.warn(`Transacción no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Obtener transacciones por RUT
exports.getTransactionsByRut = async (req, res) => {
  try {
    const result = await transactionService.getTransactionsByRut(req.params.rut);
    
    logger.info(`Se recuperaron ${result.totalTransactions} transacciones para el RUT: ${req.params.rut}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar transacciones por RUT: ${error.message}`);
    
    if (error.message === 'PERSON_NOT_FOUND') {
      logger.warn(`Persona con RUT ${req.params.rut} no encontrada`);
      return res.status(404).json({ message: 'Persona no encontrada' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Obtener transacciones por rango de fechas
exports.getTransactionsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, page, limit } = req.query;
    
    const filters = { startDate, endDate };
    const pagination = { page, limit };
    
    const result = await transactionService.getTransactionsByDateRange(filters, pagination);
    
    logger.info(`Se recuperaron ${result.transactions.length} transacciones por rango de fechas`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar transacciones por rango de fechas: ${error.message}`);
    
    if (error.message === 'DATE_REQUIRED') {
      return res.status(400).json({ message: 'Se requiere al menos un parámetro de fecha (startDate o endDate)' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Obtener transacciones por rango de fechas y RUT
exports.getTransactionsByDateRangeAndRut = async (req, res) => {
  try {
    const { startDate, endDate, rut, page, limit } = req.query;
    
    const filters = { startDate, endDate, rut };
    const pagination = { page, limit };
    
    const result = await transactionService.getTransactionsByDateRangeAndRut(filters, pagination);
    
    logger.info(`Se recuperaron ${result.transactions.length} transacciones para el RUT: ${rut} en el rango de fechas especificado`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar transacciones por rango de fechas y RUT: ${error.message}`);
    
    if (error.message === 'RUT_REQUIRED') {
      return res.status(400).json({ message: 'El parámetro RUT es requerido' });
    }
    
    if (error.message === 'PERSON_NOT_FOUND') {
      logger.warn(`Persona con RUT ${req.query.rut} no encontrada`);
      return res.status(404).json({ message: 'Persona no encontrada' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};
