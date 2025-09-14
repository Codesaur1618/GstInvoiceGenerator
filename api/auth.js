const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('./lib/database');
const { generateToken, authenticate } = require('./lib/auth');

const app = express();

// Middleware
app.use(express.json());

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register new user
app.post('/register', [
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
app.post('/login', [
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
app.get('/me', authenticate, async (req, res) => {
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

module.exports = app;
