const { Transaction, ProductTransaction, Product, Person } = require('../models/dbModels');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Create a new transaction
exports.createTransaction = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { products, ...transactionData } = req.body;

    // Check if person exists
    const personExists = await Person.findByPk(transactionData.rut);
    if (!personExists) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Person with provided RUT not found' });
    }

    // Create transaction record
    const newTransaction = await Transaction.create({
      ...transactionData,
      transactionDate: transactionData.transactionDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }, { transaction });

    // Calculate total amount and create product transactions
    let totalAmount = 0;

    // Create product transaction records
    if (Array.isArray(products) && products.length > 0) {
      for (const item of products) {
        // Check if product exists
        const product = await Product.findByPk(item.productId);
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
        }

        // Add to total amount
        totalAmount += product.price * item.quantity;

        // Create product transaction record
        await ProductTransaction.create({
          TransactionId: newTransaction.id,
          productId: item.productId,
          quantity: item.quantity
        }, { transaction });
      }
    }

    // Update total amount if not provided
    if (!transactionData.totalAmount) {
      await newTransaction.update({ totalAmount }, { transaction });
    }

    await transaction.commit();

    // Fetch the complete transaction with products
    const completeTransaction = await Transaction.findByPk(newTransaction.id, {
      include: [
        {
          model: ProductTransaction,
          include: [Product]
        },
        {
          model: Person
        }
      ]
    });

    logger.info(`Created transaction with ID: ${newTransaction.id}`);
    return res.status(201).json(completeTransaction);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error creating transaction: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Get all transactions with pagination and filtering
exports.getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      rut,
      paymentMethod
    } = req.query;

    // Prepare filter object
    const where = {};
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = new Date(startDate);
      if (endDate) where.transactionDate[Op.lte] = new Date(endDate);
    }

    if (rut) {
      where.rut = rut;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: transactions, count: totalTransactions } = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: ProductTransaction,
          include: [Product]
        },
        {
          model: Person
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['transactionDate', 'DESC']]
    });

    logger.info(`Retrieved ${transactions.length} transactions`);
    return res.status(200).json({
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / parseInt(limit)),
      currentPage: parseInt(page),
      transactions
    });
  } catch (error) {
    logger.error(`Error retrieving transactions: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Get a transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        {
          model: ProductTransaction,
          include: [Product]
        },
        {
          model: Person
        }
      ]
    });

    if (!transaction) {
      logger.warn(`Transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    logger.info(`Retrieved transaction with ID: ${req.params.id}`);
    return res.status(200).json(transaction);
  } catch (error) {
    logger.error(`Error retrieving transaction: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Update a transaction
exports.updateTransaction = async (req, res) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const { products, ...transactionData } = req.body;
    const transaction = await Transaction.findByPk(req.params.id);
    
    if (!transaction) {
      await dbTransaction.rollback();
      logger.warn(`Transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if person exists if rut is being updated
    if (transactionData.rut && transactionData.rut !== transaction.rut) {
      const personExists = await Person.findByPk(transactionData.rut);
      if (!personExists) {
        await dbTransaction.rollback();
        return res.status(404).json({ message: 'Person with provided RUT not found' });
      }
    }

    // Update transaction
    await transaction.update(transactionData, { transaction: dbTransaction });

    // Update products if provided
    if (products && Array.isArray(products)) {
      // Delete existing product transactions
      await ProductTransaction.destroy({
        where: { TransactionId: transaction.id },
        transaction: dbTransaction
      });

      // Calculate new total
      let totalAmount = 0;

      // Create new product transactions
      for (const item of products) {
        // Check if product exists
        const product = await Product.findByPk(item.productId);
        if (!product) {
          await dbTransaction.rollback();
          return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
        }

        // Add to total amount
        totalAmount += product.price * item.quantity;

        // Create product transaction record
        await ProductTransaction.create({
          TransactionId: transaction.id,
          productId: item.productId,
          quantity: item.quantity
        }, { transaction: dbTransaction });
      }

      // Update total amount if not explicitly provided
      if (!transactionData.totalAmount) {
        await transaction.update({ totalAmount }, { transaction: dbTransaction });
      }
    }

    await dbTransaction.commit();

    // Fetch the updated transaction with products
    const updatedTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: ProductTransaction,
          include: [Product]
        },
        {
          model: Person
        }
      ]
    });

    logger.info(`Updated transaction with ID: ${req.params.id}`);
    return res.status(200).json(updatedTransaction);
  } catch (error) {
    await dbTransaction.rollback();
    logger.error(`Error updating transaction: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    
    if (!transaction) {
      await dbTransaction.rollback();
      logger.warn(`Transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Delete associated product transactions first
    await ProductTransaction.destroy({
      where: { TransactionId: transaction.id },
      transaction: dbTransaction
    });

    // Then delete the transaction
    await transaction.destroy({ transaction: dbTransaction });

    await dbTransaction.commit();
    logger.info(`Deleted transaction with ID: ${req.params.id}`);
    return res.status(204).send();
  } catch (error) {
    await dbTransaction.rollback();
    logger.error(`Error deleting transaction: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};
