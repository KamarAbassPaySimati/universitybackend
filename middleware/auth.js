const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'university-management-secret-key';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Verify JWT token middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or user inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Department-based data filtering
const filterByDepartment = (req, res, next) => {
  if (req.user.role === 'super-admin') {
    // Super admin can see all data
    req.dataFilter = {};
  } else if (req.user.role === 'admin') {
    // Admin can see organization data
    req.dataFilter = { organization: req.user.organization };
  } else if (req.user.role === 'faculty') {
    // Faculty can see department data
    req.dataFilter = { 
      organization: req.user.organization,
      department: req.user.department 
    };
  } else {
    // Students can only see their own data
    req.dataFilter = { 
      organization: req.user.organization,
      department: req.user.department,
      userId: req.user._id 
    };
  }
  next();
};

module.exports = {
  generateToken,
  authenticate,
  authorize,
  filterByDepartment
};