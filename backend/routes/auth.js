const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register new user
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['seller', 'buyer']).withMessage('Role must be either seller or buyer'),
  body('business_name').trim().notEmpty().withMessage('Business name is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { username, email, password, role, ...businessDetails } = req.body;
    
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
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [userId] = await db('users').insert({
      username,
      email,
      password: hashedPassword,
      role,
      ...businessDetails,
      is_active: 1
    });
    
    // Get the created user
    const user = await db('users').where({ id: userId }).first();
    delete user.password;
    
    // Generate token
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username or email
    const user = await db('users')
      .where('username', username)
      .orWhere('email', username)
      .first();
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Remove password from response
    delete user.password;
    
    // Generate token
    const token = generateToken(user);
    
    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await db('users')
      .where({ id: req.user.id })
      .first();
    
    delete user.password;
    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/me', authenticate, [
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('business_name').optional().trim().notEmpty().withMessage('Business name cannot be empty'),
  body('contact_number').optional().trim(),
  body('business_address').optional().trim(),
  body('gstin').optional().trim().isLength({ min: 15, max: 15 }).withMessage('GSTIN must be 15 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const allowedFields = [
      'email', 'business_name', 'business_address', 'gstin', 
      'contact_number', 'bank_name', 'bank_account_number', 
      'bank_ifsc_code', 'state', 'state_code'
    ];
    
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    if (updates.email) {
      // Check if email is already taken
      const existingUser = await db('users')
        .where('email', updates.email)
        .whereNot('id', req.user.id)
        .first();
      
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }
    
    await db('users')
      .where({ id: req.user.id })
      .update(updates);
    
    const updatedUser = await db('users')
      .where({ id: req.user.id })
      .first();
    
    delete updatedUser.password;
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.post('/change-password', authenticate, [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    // Get user with password
    const user = await db('users')
      .where({ id: req.user.id })
      .first();
    
    // Verify current password
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update password
    await db('users')
      .where({ id: req.user.id })
      .update({ password: hashedPassword });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// List all users (admin only)
router.get('/users', authenticate, async (req, res) => {
  try {
    // Only admin can list all users
    if (req.user.role !== 'admin') {
      // Non-admin users can only see basic info of active users
      const users = await db('users')
        .select('id', 'username', 'business_name', 'role', 'state', 'state_code')
        .where({ is_active: 1 })
        .whereNot('role', 'admin');
      
      return res.json({ users });
    }
    
    // Admin can see all users with full details
    const users = await db('users')
      .select('*')
      .orderBy('created_at', 'desc');
    
    // Remove passwords
    users.forEach(user => delete user.password);
    
    res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Update user by ID (admin only)
router.put('/users/:id', authenticate, [
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('business_name').optional().trim().notEmpty().withMessage('Business name cannot be empty'),
  body('contact_number').optional().trim(),
  body('business_address').optional().trim(),
  body('gstin').optional().trim().isLength({ min: 15, max: 15 }).withMessage('GSTIN must be 15 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    // Only admin can update other users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    const userId = req.params.id;
    const allowedFields = [
      'email', 'business_name', 'business_address', 'gstin', 
      'contact_number', 'bank_name', 'bank_account_number', 
      'bank_ifsc_code', 'state', 'state_code', 'role', 'is_active'
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
        .whereNot('id', userId)
        .first();
      
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }
    
    await db('users')
      .where({ id: userId })
      .update(updates);
    
    const updatedUser = await db('users')
      .where({ id: userId })
      .first();
    
    delete updatedUser.password;
    res.json({ 
      message: 'User updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;
