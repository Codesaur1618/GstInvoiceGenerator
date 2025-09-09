const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get all products (buyers can browse all, sellers see only their own)
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('seller_id').optional().isInt().toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    
    let query = db('products')
      .join('users', 'products.seller_id', 'users.id')
      .select(
        'products.*',
        'users.username as seller_username',
        'users.business_name as seller_business_name'
      )
      .where('products.is_active', 1);
    
    // Sellers can only see their own products
    if (req.user.role === 'seller') {
      query = query.where('products.seller_id', req.user.id);
    } else if (req.query.seller_id) {
      // Buyers can filter by seller
      query = query.where('products.seller_id', req.query.seller_id);
    }
    
    // Search functionality
    if (search) {
      query = query.where(function() {
        this.where('products.name', 'like', `%${search}%`)
          .orWhere('products.description', 'like', `%${search}%`)
          .orWhere('products.hsn_code', 'like', `%${search}%`);
      });
    }
    
    // Get total count
    const countResult = await query.clone().count('* as count').first();
    const total = countResult.count;
    
    // Get paginated results
    const products = await query
      .orderBy('products.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = await db('products')
      .join('users', 'products.seller_id', 'users.id')
      .select(
        'products.*',
        'users.username as seller_username',
        'users.business_name as seller_business_name',
        'users.gstin as seller_gstin',
        'users.state as seller_state',
        'users.state_code as seller_state_code'
      )
      .where('products.id', req.params.id)
      .first();
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Sellers can only view their own products
    if (req.user.role === 'seller' && product.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product (sellers only)
router.post('/', authenticate, authorize('seller'), [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').optional().trim(),
  body('hsn_code').optional().trim(),
  body('unit').optional().trim().default('NOS'),
  body('rate').isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
  body('gst_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('GST rate must be between 0 and 100'),
  body('stock_quantity').optional().isFloat({ min: 0 }).withMessage('Stock quantity must be non-negative'),
  body('min_stock_level').optional().isFloat({ min: 0 }).withMessage('Minimum stock level must be non-negative'),
  handleValidationErrors
], async (req, res) => {
  try {
    const productData = {
      seller_id: req.user.id,
      name: req.body.name,
      description: req.body.description,
      hsn_code: req.body.hsn_code,
      unit: req.body.unit || 'NOS',
      rate: req.body.rate,
      gst_rate: req.body.gst_rate || 18.00,
      stock_quantity: req.body.stock_quantity || 0,
      min_stock_level: req.body.min_stock_level || 0,
      is_active: 1
    };
    
    const [productId] = await db('products').insert(productData);
    
    const product = await db('products')
      .where({ id: productId })
      .first();
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (sellers only, own products)
router.put('/:id', authenticate, authorize('seller'), [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional().trim(),
  body('hsn_code').optional().trim(),
  body('unit').optional().trim(),
  body('rate').optional().isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
  body('gst_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('GST rate must be between 0 and 100'),
  body('stock_quantity').optional().isFloat({ min: 0 }).withMessage('Stock quantity must be non-negative'),
  body('min_stock_level').optional().isFloat({ min: 0 }).withMessage('Minimum stock level must be non-negative'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
  handleValidationErrors
], async (req, res) => {
  try {
    // Check if product exists and belongs to seller
    const product = await db('products')
      .where({ id: req.params.id })
      .first();
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own products' });
    }
    
    // Prepare update data
    const allowedFields = [
      'name', 'description', 'hsn_code', 'unit', 
      'rate', 'gst_rate', 'stock_quantity', 
      'min_stock_level', 'is_active'
    ];
    
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    await db('products')
      .where({ id: req.params.id })
      .update(updates);
    
    const updatedProduct = await db('products')
      .where({ id: req.params.id })
      .first();
    
    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (sellers only, own products)
router.delete('/:id', authenticate, authorize('seller'), async (req, res) => {
  try {
    // Check if product exists and belongs to seller
    const product = await db('products')
      .where({ id: req.params.id })
      .first();
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own products' });
    }
    
    // Soft delete by setting is_active to 0
    await db('products')
      .where({ id: req.params.id })
      .update({ is_active: 0 });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Update stock quantity
router.patch('/:id/stock', authenticate, authorize('seller'), [
  body('quantity').isFloat().withMessage('Quantity must be a number'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    
    // Check if product exists and belongs to seller
    const product = await db('products')
      .where({ id: req.params.id })
      .first();
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update stock for your own products' });
    }
    
    let newQuantity;
    switch (operation) {
      case 'add':
        newQuantity = product.stock_quantity + quantity;
        break;
      case 'subtract':
        newQuantity = product.stock_quantity - quantity;
        if (newQuantity < 0) {
          return res.status(400).json({ error: 'Insufficient stock' });
        }
        break;
      case 'set':
        newQuantity = quantity;
        break;
    }
    
    await db('products')
      .where({ id: req.params.id })
      .update({ stock_quantity: newQuantity });
    
    const updatedProduct = await db('products')
      .where({ id: req.params.id })
      .first();
    
    res.json({
      message: 'Stock updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

module.exports = router;
