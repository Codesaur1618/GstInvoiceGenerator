const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Authenticate middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Authorize middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    if (Array.isArray(roles) && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    
    if (typeof roles === 'string' && req.user.role !== roles) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    
    next();
  };
};

module.exports = {
  generateToken,
  authenticate,
  authorize
};
