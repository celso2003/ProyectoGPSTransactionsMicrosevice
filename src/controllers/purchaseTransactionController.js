const PurchaseTransaction = require('../models/purchaseTransaction');
const logger = require('../utils/logger');

// Create a new purchase transaction
exports.createPurchaseTransaction = async (req, res) => {
  try {
    const purchaseTransaction = new PurchaseTransaction(req.body);
    await purchaseTransaction.save();
    
    logger.info(`Created purchase transaction with ID: ${purchaseTransaction._id}`);
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
    
    // Add supplier filter if provided
    if (supplierId) {
      filter.supplierId = supplierId;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Prepare sort object
    const sort = {};
    sort[sortBy] = orderBy === 'asc' ? 1 : -1;
    
    // Execute query with pagination and sorting
    const purchaseTransactions = await PurchaseTransaction.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination info
    const totalTransactions = await PurchaseTransaction.countDocuments(filter);
    
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
    const purchaseTransaction = await PurchaseTransaction.findById(req.params.id);
    
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
    const purchaseTransaction = await PurchaseTransaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!purchaseTransaction) {
      logger.warn(`Purchase transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Purchase transaction not found' });
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
    const purchaseTransaction = await PurchaseTransaction.findByIdAndDelete(req.params.id);
    
    if (!purchaseTransaction) {
      logger.warn(`Purchase transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Purchase transaction not found' });
    }
    
    logger.info(`Deleted purchase transaction with ID: ${req.params.id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting purchase transaction: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
}; 