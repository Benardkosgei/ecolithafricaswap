const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await db('users')
      .select('id', 'email', 'role', 'is_active')
      .where({ id: decoded.userId })
      .first();

    if (!user) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'User not found' 
      });
    }

    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Account has been deactivated' 
      });
    }

    // Add user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired', 
        message: 'Please refresh your token' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token', 
        message: 'Token is malformed' 
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed', 
      message: 'Internal server error' 
    });
  }
};

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied', 
      message: 'Admin privileges required' 
    });
  }
  next();
};

// Middleware to check if user has admin or station manager role
const requireAdminOrManager = (req, res, next) => {
  if (!['admin', 'station_manager'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied', 
      message: 'Admin or station manager privileges required' 
    });
  }
  next();
};

// Middleware to check if user owns resource or is admin
const requireOwnershipOrAdmin = (userIdField = 'user_id') => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (req.user.role === 'admin' || req.user.userId === resourceUserId) {
      next();
    } else {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'You can only access your own resources' 
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminOrManager,
  requireOwnershipOrAdmin
};
