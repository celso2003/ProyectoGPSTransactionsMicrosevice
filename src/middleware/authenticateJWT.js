const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateJWT = (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    logger.warn('Authentication failed: No token provided');
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }
  
  // Check if the header follows the Bearer scheme
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn('Authentication failed: Invalid token format');
    return res.status(401).json({ message: 'Authentication failed. Invalid token format.' });
  }
  
  const token = parts[1];
  
  // Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Authentication failed: Token expired');
      return res.status(401).json({ message: 'Authentication failed. Token expired.' });
    }
    
    logger.warn(`Authentication failed: ${error.message}`);
    return res.status(403).json({ message: 'Authentication failed. Invalid token.' });
  }
};

module.exports = authenticateJWT; 