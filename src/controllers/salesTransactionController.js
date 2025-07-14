const { SalesTransaction, SalesProduct } = require('../models/salesTransaction');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Create a new sales transaction
exports.createSalesTransaction = async (req, res) => {
  try {
    const { products, ...transactionData } = req.body;
    let totalAmount = transactionData.totalAmount;
    if (!totalAmount && Array.isArray(products)) {
      totalAmount = products.reduce((total, product) => total + (product.quantity * product.unitPrice), 0);
    }
    const salesTransaction = await SalesTransaction.create(
      { ...transactionData, totalAmount, products },
      { include: [{ model: SalesProduct, as: 'products' }] }
    );
    logger.info(`Created sales transaction with ID: ${salesTransaction.id}`);
    return res.status(201).json(salesTransaction);
  } catch (error) {
    logger.error(`Error creating sales transaction: ${error.message}`);
    return res.status(400).json({ message: error.message });
  }
};

// Get all sales transactions with pagination, sorting and filtering
exports.getAllSalesTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'transactionDate',
      orderBy = 'desc',
      startDate,
      endDate,
      customerId
    } = req.query;

    // Prepare filter object
    const where = {};
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = new Date(startDate);
      if (endDate) where.transactionDate[Op.lte] = new Date(endDate);
    }
    if (customerId) {
      where.customerId = customerId;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const order = [[sortBy, orderBy.toUpperCase()]];

    const { rows: salesTransactions, count: totalTransactions } = await SalesTransaction.findAndCountAll({
      where,
      include: [{ model: SalesProduct, as: 'products' }],
      order,
      offset,
      limit: parseInt(limit),
    });

    logger.info(`Retrieved ${salesTransactions.length} sales transactions`);
    return res.status(200).json({
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / parseInt(limit)),
      currentPage: parseInt(page),
      salesTransactions
    });
  } catch (error) {
    logger.error(`Error retrieving sales transactions: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Get a sales transaction by ID
exports.getSalesTransactionById = async (req, res) => {
  try {
    const salesTransaction = await SalesTransaction.findByPk(req.params.id, {
      include: [{ model: SalesProduct, as: 'products' }]
    });
    if (!salesTransaction) {
      logger.warn(`Sales transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Sales transaction not found' });
    }
    logger.info(`Retrieved sales transaction with ID: ${req.params.id}`);
    return res.status(200).json(salesTransaction);
  } catch (error) {
    logger.error(`Error retrieving sales transaction: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Update a sales transaction
exports.updateSalesTransaction = async (req, res) => {
  try {
    const { products, ...transactionData } = req.body;
    const salesTransaction = await SalesTransaction.findByPk(req.params.id, {
      include: [{ model: SalesProduct, as: 'products' }]
    });
    if (!salesTransaction) {
      logger.warn(`Sales transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Sales transaction not found' });
    }
    await salesTransaction.update(transactionData);
    if (products) {
      await SalesProduct.destroy({ where: { salesTransactionId: salesTransaction.id } });
      const productInstances = await SalesProduct.bulkCreate(
        products.map(p => ({ ...p, salesTransactionId: salesTransaction.id }))
      );
      salesTransaction.products = productInstances;
    }
    logger.info(`Updated sales transaction with ID: ${req.params.id}`);
    return res.status(200).json(salesTransaction);
  } catch (error) {
    logger.error(`Error updating sales transaction: ${error.message}`);
    if (error.name === 'SequelizeEmptyResultError' || 
        (error.name === 'SequelizeError' && error.message.includes('not found'))) {
      return res.status(404).json({ message: 'Sales transaction not found' });
    }
    return res.status(400).json({ message: error.message });
  }
};

// Delete a sales transaction
exports.deleteSalesTransaction = async (req, res) => {
  try {
    const salesTransaction = await SalesTransaction.findByPk(req.params.id);
    if (!salesTransaction) {
      logger.warn(`Sales transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Sales transaction not found' });
    }
    await salesTransaction.destroy();
    logger.info(`Deleted sales transaction with ID: ${req.params.id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting sales transaction: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
}; 