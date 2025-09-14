const bcrypt = require('bcryptjs');
const db = require('./lib/database');
const { generateToken } = require('./lib/auth');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, url } = req;
    const path = url.replace('/api/auth', '');

    // Handle login
    if (method === 'POST' && path === '/login') {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

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

      return res.status(200).json({
        message: 'Login successful',
        user,
        token
      });
    }

    // Handle register
    if (method === 'POST' && path === '/register') {
      const { username, email, password, role, ...businessDetails } = req.body;

      if (!username || !email || !password || !role || !businessDetails.business_name) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

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

      return res.status(201).json({
        message: 'User registered successfully',
        user,
        token
      });
    }

    // Handle profile
    if (method === 'GET' && path === '/me') {
      // This would need authentication middleware
      return res.status(200).json({ message: 'Profile endpoint - authentication needed' });
    }

    return res.status(404).json({ error: 'Route not found' });

  } catch (error) {
    console.error('Auth API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
