const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../lib/database');
const { authenticate, authorize } = require('../lib/auth');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get all buyers
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    
    let query = db('users')
      .select('id', 'username', 'business_name', 'email', 'contact_number', 'business_address', 'gstin', 'state', 'state_code')
      .where({ role: 'buyer', is_active: 1 });
    
    // Search functionality
    if (search) {
      query = query.where(function() {
        this.where('business_name', 'like', `%${search}%`)
          .orWhere('username', 'like', `%${search}%`)
          .orWhere('gstin', 'like', `%${search}%`);
      });
    }
    
    // Get total count
    const countResult = await query.clone().count('* as count').first();
    const total = countResult.count;
    
    // Get paginated results
    const buyers = await query
      .orderBy('business_name', 'asc')
      .limit(limit)
      .offset(offset);
    
    res.json({
      buyers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List buyers error:', error);
    res.status(500).json({ error: 'Failed to fetch buyers' });
  }
});

// Get single buyer
router.get('/:id', authenticate, async (req, res) => {
  try {
    const buyer = await db('users')
      .select('id', 'username', 'business_name', 'email', 'contact_number', 'business_address', 'gstin', 'state', 'state_code')
      .where({ id: req.params.id, role: 'buyer', is_active: 1 })
      .first();
    
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    
    res.json({ buyer });
  } catch (error) {
    console.error('Get buyer error:', error);
    res.status(500).json({ error: 'Failed to fetch buyer' });
  }
});

// Create new buyer (admin only)
router.post('/', authenticate, authorize('admin'), [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('business_name').trim().notEmpty().withMessage('Business name is required'),
  body('contact_number').optional().trim(),
  body('business_address').optional().trim(),
  body('gstin').optional().trim().isLength({ min: 15, max: 15 }).withMessage('GSTIN must be 15 characters'),
  body('state').optional().trim(),
  body('state_code').optional().trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { username, email, password, ...businessDetails } = req.body;
    
    // Check if user already exists
    const existingUser = await db('users')
      .where('username', username)
      .orWhere('email', email)
      .first();
    
    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.username === username 
          ? 'Username already exists' 
          : 'Email already registered' 
      });
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create buyer
    const [userId] = await db('users').insert({
      username,
      email,
      password: hashedPassword,
      role: 'buyer',
      ...businessDetails,
      is_active: 1
    });
    
    // Get the created buyer
    const buyer = await db('users')
      .select('id', 'username', 'business_name', 'email', 'contact_number', 'business_address', 'gstin', 'state', 'state_code')
      .where({ id: userId })
      .first();
    
    res.status(201).json({
      message: 'Buyer created successfully',
      buyer
    });
  } catch (error) {
    console.error('Create buyer error:', error);
    res.status(500).json({ error: 'Failed to create buyer' });
  }
});

// Update buyer (admin only)
router.put('/:id', authenticate, authorize('admin'), [
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('business_name').optional().trim().notEmpty().withMessage('Business name cannot be empty'),
  body('contact_number').optional().trim(),
  body('business_address').optional().trim(),
  body('gstin').optional().trim().isLength({ min: 15, max: 15 }).withMessage('GSTIN must be 15 characters'),
  body('state').optional().trim(),
  body('state_code').optional().trim(),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
  handleValidationErrors
], async (req, res) => {
  try {
    const buyerId = req.params.id;
    
    // Check if buyer exists
    const buyer = await db('users')
      .where({ id: buyerId, role: 'buyer' })
      .first();
    
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    
    const allowedFields = [
      'email', 'business_name', 'business_address', 'gstin', 
      'contact_number', 'state', 'state_code', 'is_active'
    ];
    
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    if (updates.email) {
      // Check if email is already taken by another user
      const existingUser = await db('users')
        .where('email', updates.email)
        .whereNot('id', buyerId)
        .first();
      
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }
    
    await db('users')
      .where({ id: buyerId })
      .update(updates);
    
    const updatedBuyer = await db('users')
      .select('id', 'username', 'business_name', 'email', 'contact_number', 'business_address', 'gstin', 'state', 'state_code')
      .where({ id: buyerId })
      .first();
    
    res.json({
      message: 'Buyer updated successfully',
      buyer: updatedBuyer
    });
  } catch (error) {
    console.error('Update buyer error:', error);
    res.status(500).json({ error: 'Failed to update buyer' });
  }
});

// Delete buyer (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const buyerId = req.params.id;
    
    // Check if buyer exists
    const buyer = await db('users')
      .where({ id: buyerId, role: 'buyer' })
      .first();
    
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    
    // Soft delete by setting is_active to 0
    await db('users')
      .where({ id: buyerId })
      .update({ is_active: 0 });
    
    res.json({ message: 'Buyer deleted successfully' });
  } catch (error) {
    console.error('Delete buyer error:', error);
    res.status(500).json({ error: 'Failed to delete buyer' });
  }
});

module.exports = router;
