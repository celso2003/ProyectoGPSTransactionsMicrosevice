const purchaseService = require('../services/purchaseService');
const logger = require('../utils/logger');

// Crear una nueva compra
exports.createPurchase = async (req, res) => {
  try {
    const { products, ...transactionData } = req.body;
    
    const result = await purchaseService.createPurchase(transactionData, products);
    
    logger.info(`Compra creada con ID: ${result.id}`);
    return res.status(201).json(result);
  } catch (error) {
    logger.error(`Error al crear la compra: ${error.message}`);
    
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

// Obtener todas las compras con paginación y filtrado
exports.getAllPurchases = async (req, res) => {
  try {
    const { page, limit, startDate, endDate, rut, paymentMethod } = req.query;
    
    const filters = { startDate, endDate, rut, paymentMethod };
    const pagination = { page, limit };
    
    const result = await purchaseService.getAllPurchases(filters, pagination);
    
    logger.info(`Se recuperaron ${result.purchases.length} compras`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar compras: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Obtener una compra por ID
exports.getPurchaseById = async (req, res) => {
  try {
    const result = await purchaseService.getPurchaseById(req.params.id);
    
    logger.info(`Compra recuperada con ID: ${req.params.id}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar la compra: ${error.message}`);
    
    if (error.message === 'PURCHASE_NOT_FOUND') {
      logger.warn(`Compra no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Compra no encontrada' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Actualizar una compra
exports.updatePurchase = async (req, res) => {
  try {
    const { products, ...transactionData } = req.body;
    
    const result = await purchaseService.updatePurchase(req.params.id, transactionData, products);
    
    logger.info(`Compra actualizada con ID: ${req.params.id}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al actualizar la compra: ${error.message}`);
    
    if (error.message === 'PURCHASE_NOT_FOUND') {
      logger.warn(`Compra no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Compra no encontrada' });
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

// Eliminar una compra
exports.deletePurchase = async (req, res) => {
  try {
    await purchaseService.deletePurchase(req.params.id);
    
    logger.info(`Compra eliminada con ID: ${req.params.id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error(`Error al eliminar la compra: ${error.message}`);
    
    if (error.message === 'PURCHASE_NOT_FOUND') {
      logger.warn(`Compra no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Compra no encontrada' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Obtener compras por RUT
exports.getPurchasesByRut = async (req, res) => {
  try {
    const result = await purchaseService.getPurchasesByRut(req.params.rut);
    
    logger.info(`Se recuperaron ${result.totalPurchases} compras para el RUT: ${req.params.rut}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar compras por RUT: ${error.message}`);
    
    if (error.message === 'PERSON_NOT_FOUND') {
      logger.warn(`Persona con RUT ${req.params.rut} no encontrada`);
      return res.status(404).json({ message: 'Persona no encontrada' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Obtener compras por rango de fechas
exports.getPurchasesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, page, limit } = req.query;
    
    const filters = { startDate, endDate };
    const pagination = { page, limit };
    
    const result = await purchaseService.getPurchasesByDateRange(filters, pagination);
    
    logger.info(`Se recuperaron ${result.purchases.length} compras por rango de fechas`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar compras por rango de fechas: ${error.message}`);
    
    if (error.message === 'DATE_REQUIRED') {
      return res.status(400).json({ message: 'Se requiere al menos un parámetro de fecha (startDate o endDate)' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Obtener compras por rango de fechas y RUT
exports.getPurchasesByDateRangeAndRut = async (req, res) => {
  try {
    const { startDate, endDate, rut, page, limit } = req.query;
    
    const filters = { startDate, endDate, rut };
    const pagination = { page, limit };
    
    const result = await purchaseService.getPurchasesByDateRangeAndRut(filters, pagination);
    
    logger.info(`Se recuperaron ${result.purchases.length} compras para el RUT: ${rut} en el rango de fechas especificado`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar compras por rango de fechas y RUT: ${error.message}`);
    
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
