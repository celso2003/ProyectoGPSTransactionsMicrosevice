const { PurchaseTransaction, PurchaseProduct } = require('../models/purchaseTransaction');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Create a new purchase transaction
exports.createPurchaseTransaction = async (req, res) => {
  try {
    const { products, ...transactionData } = req.body;
    let totalAmount = transactionData.totalAmount;
    if (!totalAmount && Array.isArray(products)) {
      totalAmount = products.reduce((total, product) => total + (product.quantity * product.unitCost), 0);
    }
    const purchaseTransaction = await PurchaseTransaction.create(
      { ...transactionData, totalAmount, products },
      { include: [{ model: PurchaseProduct, as: 'products' }] }
    );
    logger.info(`Created purchase transaction with ID: ${purchaseTransaction.id}`);
    return res.status(201).json(purchaseTransaction);
  } catch (error) {
    logger.error(`Error creating purchase transaction: ${error.message}`);
    return res.status(400).json({ message: error.message });
  }
};

// Get all purchase transactions with pagination, sorting and filtering
exports.getAllPurchaseTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'transactionDate',
      orderBy = 'desc',
      startDate,
      endDate,
      supplierId
    } = req.query;

    // Prepare filter object
    const where = {};
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = new Date(startDate);
      if (endDate) where.transactionDate[Op.lte] = new Date(endDate);
    }
    if (supplierId) {
      where.supplierId = supplierId;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const order = [[sortBy, orderBy.toUpperCase()]];

    const { rows: purchaseTransactions, count: totalTransactions } = await PurchaseTransaction.findAndCountAll({
      where,
      include: [{ model: PurchaseProduct, as: 'products' }],
      order,
      offset,
      limit: parseInt(limit),
    });

    logger.info(`Retrieved ${purchaseTransactions.length} purchase transactions`);
    return res.status(200).json({
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / parseInt(limit)),
      currentPage: parseInt(page),
      purchaseTransactions
    });
  } catch (error) {
    logger.error(`Error retrieving purchase transactions: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Get a purchase transaction by ID
exports.getPurchaseTransactionById = async (req, res) => {
  try {
    const purchaseTransaction = await PurchaseTransaction.findByPk(req.params.id, {
      include: [{ model: PurchaseProduct, as: 'products' }]
    });
    if (!purchaseTransaction) {
      logger.warn(`Purchase transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Purchase transaction not found' });
    }
    logger.info(`Retrieved purchase transaction with ID: ${req.params.id}`);
    return res.status(200).json(purchaseTransaction);
  } catch (error) {
    logger.error(`Error retrieving purchase transaction: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Update a purchase transaction
exports.updatePurchaseTransaction = async (req, res) => {
  try {
    const { products, ...transactionData } = req.body;
    const purchaseTransaction = await PurchaseTransaction.findByPk(req.params.id, {
      include: [{ model: PurchaseProduct, as: 'products' }]
    });
    if (!purchaseTransaction) {
      logger.warn(`Purchase transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Purchase transaction not found' });
    }
    await purchaseTransaction.update(transactionData);
    if (products) {
      await PurchaseProduct.destroy({ where: { purchaseTransactionId: purchaseTransaction.id } });
      const productInstances = await PurchaseProduct.bulkCreate(
        products.map(p => ({ ...p, purchaseTransactionId: purchaseTransaction.id }))
      );
      purchaseTransaction.products = productInstances;
    }
    logger.info(`Updated purchase transaction with ID: ${req.params.id}`);
    return res.status(200).json(purchaseTransaction);
  } catch (error) {
    logger.error(`Error updating purchase transaction: ${error.message}`);
    return res.status(400).json({ message: error.message });
  }
};

// Delete a purchase transaction
exports.deletePurchaseTransaction = async (req, res) => {
  try {
    const purchaseTransaction = await PurchaseTransaction.findByPk(req.params.id);
    if (!purchaseTransaction) {
      logger.warn(`Purchase transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Purchase transaction not found' });
    }
    await purchaseTransaction.destroy();
    logger.info(`Deleted purchase transaction with ID: ${req.params.id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting purchase transaction: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
}; 