const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import route handlers
const authRoutes = require('./auth');
const productRoutes = require('./products');
const invoiceRoutes = require('./invoices');
const sellerRoutes = require('./sellers');
const buyerRoutes = require('./buyers');
const { errorHandler } = require('./lib/errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom JSON error handler
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('JSON parsing error:', error.message);
    console.error('Raw body:', error.body);
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      details: error.message 
    });
  }
  next(error);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/sellers', sellerRoutes);
app.use('/buyers', buyerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
