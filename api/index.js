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
    const path = url.replace('/api', '');

    // Handle auth routes
    if (path.startsWith('/auth')) {
      const authPath = path.replace('/auth', '');
      
      // Handle login
      if (method === 'POST' && authPath === '/login') {
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
      if (method === 'POST' && authPath === '/register') {
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

      return res.status(404).json({ error: 'Auth route not found' });
    }

    // Handle sellers routes
    if (path.startsWith('/sellers')) {
      if (method === 'GET') {
        // Return mock data for now
        const mockSellers = [
          {
            id: 1,
            business_name: 'GST Invoice Generator',
            business_address: '123 Main Street, City, State',
            gstin: '123456789012345',
            contact_number: '1234567890',
            email: 'admin@example.com',
            bank_name: 'Sample Bank',
            bank_account_number: '1234567890',
            bank_ifsc_code: 'SBIN0001234',
            state: 'Default State',
            state_code: '01'
          }
        ];
        
        return res.status(200).json({ sellers: mockSellers });
      }

      if (method === 'POST') {
        const sellerData = req.body;
        
        return res.status(201).json({
          message: 'Business created successfully',
          seller: { id: Date.now(), ...sellerData }
        });
      }

      if (method === 'PUT') {
        const sellerData = req.body;
        
        return res.status(200).json({
          message: 'Business updated successfully',
          seller: { id: req.query.id || Date.now(), ...sellerData }
        });
      }
    }

    // Handle buyers routes
    if (path.startsWith('/buyers')) {
      if (method === 'GET') {
        // Return mock data for now
        const mockBuyers = [
          {
            id: 1,
            buyer_name: 'Sample Customer',
            buyer_address: '456 Customer Street, City, State',
            buyer_gstin: '987654321098765',
            buyer_contact: '9876543210',
            buyer_email: 'customer@example.com',
            buyer_state: 'Customer State',
            buyer_state_code: '02'
          },
          {
            id: 2,
            buyer_name: 'Another Customer',
            buyer_address: '789 Another Street, City, State',
            buyer_gstin: '111111111111111',
            buyer_contact: '1111111111',
            buyer_email: 'another@example.com',
            buyer_state: 'Another State',
            buyer_state_code: '03'
          }
        ];
        
        return res.status(200).json({ buyers: mockBuyers });
      }

      if (method === 'POST') {
        const buyerData = req.body;
        
        return res.status(201).json({
          message: 'Buyer created successfully',
          buyer: { id: Date.now(), ...buyerData }
        });
      }

      if (method === 'PUT') {
        const buyerData = req.body;
        
        return res.status(200).json({
          message: 'Buyer updated successfully',
          buyer: { id: req.query.id || Date.now(), ...buyerData }
        });
      }
    }

    // Handle invoices routes
    if (path.startsWith('/invoices')) {
      if (method === 'GET') {
        // Return mock data for now
        const mockInvoices = [
          {
            id: 1,
            invoice_number: 'INV-001',
            date: '2024-01-15',
            buyer_name: 'Sample Customer',
            buyer_address: '456 Customer Street, City, State',
            buyer_gstin: '987654321098765',
            items: [
              {
                description: 'Product 1',
                quantity: 2,
                rate: 100,
                amount: 200,
                cgst_rate: 9,
                sgst_rate: 9,
                cgst_amount: 18,
                sgst_amount: 18,
                total: 236
              }
            ],
            subtotal: 200,
            cgst_total: 18,
            sgst_total: 18,
            total_amount: 236,
            status: 'paid'
          },
          {
            id: 2,
            invoice_number: 'INV-002',
            date: '2024-01-16',
            buyer_name: 'Another Customer',
            buyer_address: '789 Another Street, City, State',
            buyer_gstin: '111111111111111',
            items: [
              {
                description: 'Product 2',
                quantity: 1,
                rate: 500,
                amount: 500,
                cgst_rate: 9,
                sgst_rate: 9,
                cgst_amount: 45,
                sgst_amount: 45,
                total: 590
              }
            ],
            subtotal: 500,
            cgst_total: 45,
            sgst_total: 45,
            total_amount: 590,
            status: 'pending'
          }
        ];
        
        return res.status(200).json({ invoices: mockInvoices });
      }

      if (method === 'POST') {
        const invoiceData = req.body;
        
        return res.status(201).json({
          message: 'Invoice created successfully',
          invoice: { id: Date.now(), ...invoiceData }
        });
      }

      if (method === 'PUT') {
        const invoiceData = req.body;
        
        return res.status(200).json({
          message: 'Invoice updated successfully',
          invoice: { id: req.query.id || Date.now(), ...invoiceData }
        });
      }
    }

    return res.status(404).json({ error: 'Route not found' });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}