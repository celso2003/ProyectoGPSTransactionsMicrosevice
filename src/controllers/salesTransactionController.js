const SalesTransaction = require('../models/salesTransaction');
const logger = require('../utils/logger');

// Create a new sales transaction
exports.createSalesTransaction = async (req, res) => {
  try {
    const salesTransaction = new SalesTransaction(req.body);
    await salesTransaction.save();
    
    logger.info(`Created sales transaction with ID: ${salesTransaction._id}`);
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
    const filter = {};
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.transactionDate = {};
      
      if (startDate) {
        filter.transactionDate.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.transactionDate.$lte = new Date(endDate);
      }
    }
    
    // Add customer filter if provided
    if (customerId) {
      filter.customerId = customerId;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Prepare sort object
    const sort = {};
    sort[sortBy] = orderBy === 'asc' ? 1 : -1;
    
    // Execute query with pagination and sorting
    const salesTransactions = await SalesTransaction.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination info
    const totalTransactions = await SalesTransaction.countDocuments(filter);
    
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
    const salesTransaction = await SalesTransaction.findById(req.params.id);
    
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
    const salesTransaction = await SalesTransaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!salesTransaction) {
      logger.warn(`Sales transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Sales transaction not found' });
    }
    
    logger.info(`Updated sales transaction with ID: ${req.params.id}`);
    return res.status(200).json(salesTransaction);
  } catch (error) {
    logger.error(`Error updating sales transaction: ${error.message}`);
    return res.status(400).json({ message: error.message });
  }
};

// Delete a sales transaction
exports.deleteSalesTransaction = async (req, res) => {
  try {
    const salesTransaction = await SalesTransaction.findByIdAndDelete(req.params.id);
    
    if (!salesTransaction) {
      logger.warn(`Sales transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Sales transaction not found' });
    }
    
    logger.info(`Deleted sales transaction with ID: ${req.params.id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting sales transaction: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
}; 