const salesService = require('../services/salesService');
const logger = require('../utils/logger');

// Crear una nueva venta
exports.createSale = async (req, res) => {
  try {
    const { products, ...transactionData } = req.body;
    
    const result = await salesService.createSale(transactionData, products);
    
    logger.info(`Venta creada con ID: ${result.id}`);
    return res.status(201).json(result);
  } catch (error) {
    logger.error(`Error al crear la venta: ${error.message}`);
    
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

// Obtener todas las ventas con paginación y filtrado
exports.getAllSales = async (req, res) => {
  try {
    const { page, limit, startDate, endDate, rut, paymentMethod } = req.query;
    
    const filters = { startDate, endDate, rut, paymentMethod };
    const pagination = { page, limit };
    
    const result = await salesService.getAllSales(filters, pagination);
    
    logger.info(`Se recuperaron ${result.sales.length} ventas`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar ventas: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Obtener una venta por ID
exports.getSaleById = async (req, res) => {
  try {
    const result = await salesService.getSaleById(req.params.id);
    
    logger.info(`Venta recuperada con ID: ${req.params.id}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar la venta: ${error.message}`);
    
    if (error.message === 'SALE_NOT_FOUND') {
      logger.warn(`Venta no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Actualizar una venta
exports.updateSale = async (req, res) => {
  try {
    const { products, ...transactionData } = req.body;
    
    const result = await salesService.updateSale(req.params.id, transactionData, products);
    
    logger.info(`Venta actualizada con ID: ${req.params.id}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al actualizar la venta: ${error.message}`);
    
    if (error.message === 'SALE_NOT_FOUND') {
      logger.warn(`Venta no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Venta no encontrada' });
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

// Eliminar una venta
exports.deleteSale = async (req, res) => {
  try {
    await salesService.deleteSale(req.params.id);
    
    logger.info(`Venta eliminada con ID: ${req.params.id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error(`Error al eliminar la venta: ${error.message}`);
    
    if (error.message === 'SALE_NOT_FOUND') {
      logger.warn(`Venta no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Obtener ventas por RUT
exports.getSalesByRut = async (req, res) => {
  try {
    const result = await salesService.getSalesByRut(req.params.rut);
    
    logger.info(`Se recuperaron ${result.totalSales} ventas para el RUT: ${req.params.rut}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar ventas por RUT: ${error.message}`);
    
    if (error.message === 'PERSON_NOT_FOUND') {
      logger.warn(`Persona con RUT ${req.params.rut} no encontrada`);
      return res.status(404).json({ message: 'Persona no encontrada' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Obtener ventas por rango de fechas
exports.getSalesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, page, limit } = req.query;
    
    const filters = { startDate, endDate };
    const pagination = { page, limit };
    
    const result = await salesService.getSalesByDateRange(filters, pagination);
    
    logger.info(`Se recuperaron ${result.sales.length} ventas por rango de fechas`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar ventas por rango de fechas: ${error.message}`);
    
    if (error.message === 'DATE_REQUIRED') {
      return res.status(400).json({ message: 'Se requiere al menos un parámetro de fecha (startDate o endDate)' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Obtener ventas por rango de fechas y RUT
exports.getSalesByDateRangeAndRut = async (req, res) => {
  try {
    const { startDate, endDate, rut, page, limit } = req.query;
    
    const filters = { startDate, endDate, rut };
    const pagination = { page, limit };
    
    const result = await salesService.getSalesByDateRangeAndRut(filters, pagination);
    
    logger.info(`Se recuperaron ${result.sales.length} ventas para el RUT: ${rut} en el rango de fechas especificado`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error al recuperar ventas por rango de fechas y RUT: ${error.message}`);
    
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
