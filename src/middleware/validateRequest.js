const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));
    
    logger.warn(`Validation error: ${JSON.stringify(errorMessages)}`);
    return res.status(400).json({ errors: errorMessages });
  }
  
  next();
};

module.exports = validateRequest; 