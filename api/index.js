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
        try {
          const sellers = await db('sellers').select('*').orderBy('created_at', 'desc');
          return res.status(200).json({ sellers });
        } catch (error) {
          console.error('Error fetching sellers:', error);
          return res.status(500).json({ error: 'Failed to fetch sellers' });
        }
      }

      if (method === 'POST') {
        try {
          const sellerData = req.body;
          const [sellerId] = await db('sellers').insert(sellerData);
          const newSeller = await db('sellers').where({ id: sellerId }).first();
          
          return res.status(201).json({
            message: 'Business created successfully',
            seller: newSeller
          });
        } catch (error) {
          console.error('Error creating seller:', error);
          return res.status(500).json({ error: 'Failed to create business' });
        }
      }

      if (method === 'PUT') {
        try {
          const sellerId = req.query.id;
          const sellerData = req.body;
          
          if (!sellerId) {
            return res.status(400).json({ error: 'Seller ID is required' });
          }
          
          await db('sellers').where({ id: sellerId }).update(sellerData);
          const updatedSeller = await db('sellers').where({ id: sellerId }).first();
          
          return res.status(200).json({
            message: 'Business updated successfully',
            seller: updatedSeller
          });
        } catch (error) {
          console.error('Error updating seller:', error);
          return res.status(500).json({ error: 'Failed to update business' });
        }
      }
    }

    // Handle buyers routes
    if (path.startsWith('/buyers')) {
      if (method === 'GET') {
        try {
          const buyers = await db('buyers').select('*').orderBy('created_at', 'desc');
          return res.status(200).json({ buyers });
        } catch (error) {
          console.error('Error fetching buyers:', error);
          return res.status(500).json({ error: 'Failed to fetch buyers' });
        }
      }

      if (method === 'POST') {
        try {
          const buyerData = req.body;
          const [buyerId] = await db('buyers').insert(buyerData);
          const newBuyer = await db('buyers').where({ id: buyerId }).first();
          
          return res.status(201).json({
            message: 'Buyer created successfully',
            buyer: newBuyer
          });
        } catch (error) {
          console.error('Error creating buyer:', error);
          return res.status(500).json({ error: 'Failed to create buyer' });
        }
      }

      if (method === 'PUT') {
        try {
          const buyerId = req.query.id;
          const buyerData = req.body;
          
          if (!buyerId) {
            return res.status(400).json({ error: 'Buyer ID is required' });
          }
          
          await db('buyers').where({ id: buyerId }).update(buyerData);
          const updatedBuyer = await db('buyers').where({ id: buyerId }).first();
          
          return res.status(200).json({
            message: 'Buyer updated successfully',
            buyer: updatedBuyer
          });
        } catch (error) {
          console.error('Error updating buyer:', error);
          return res.status(500).json({ error: 'Failed to update buyer' });
        }
      }
    }

    // Handle invoices routes
    if (path.startsWith('/invoices')) {
      if (method === 'GET') {
        try {
          const invoices = await db('invoices')
            .select('*')
            .orderBy('created_at', 'desc');
          return res.status(200).json({ invoices });
        } catch (error) {
          console.error('Error fetching invoices:', error);
          return res.status(500).json({ error: 'Failed to fetch invoices' });
        }
      }

      if (method === 'POST') {
        try {
          const invoiceData = req.body;
          
          // Generate invoice number if not provided
          if (!invoiceData.invoice_number) {
            const count = await db('invoices').count('* as count').first();
            invoiceData.invoice_number = `INV-${String(count.count + 1).padStart(3, '0')}`;
          }
          
          const [invoiceId] = await db('invoices').insert(invoiceData);
          const newInvoice = await db('invoices').where({ id: invoiceId }).first();
          
          return res.status(201).json({
            message: 'Invoice created successfully',
            invoice: newInvoice
          });
        } catch (error) {
          console.error('Error creating invoice:', error);
          return res.status(500).json({ error: 'Failed to create invoice' });
        }
      }

      if (method === 'PUT') {
        try {
          const invoiceId = req.query.id;
          const invoiceData = req.body;
          
          if (!invoiceId) {
            return res.status(400).json({ error: 'Invoice ID is required' });
          }
          
          await db('invoices').where({ id: invoiceId }).update(invoiceData);
          const updatedInvoice = await db('invoices').where({ id: invoiceId }).first();
          
          return res.status(200).json({
            message: 'Invoice updated successfully',
            invoice: updatedInvoice
          });
        } catch (error) {
          console.error('Error updating invoice:', error);
          return res.status(500).json({ error: 'Failed to update invoice' });
        }
      }
    }

    return res.status(404).json({ error: 'Route not found' });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}