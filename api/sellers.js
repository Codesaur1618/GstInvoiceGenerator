const db = require('./lib/database');

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
    if (req.method === 'GET') {
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

    if (req.method === 'POST') {
      const sellerData = req.body;
      
      // Return success with the data
      return res.status(201).json({
        message: 'Business created successfully',
        seller: { id: Date.now(), ...sellerData }
      });
    }

    if (req.method === 'PUT') {
      const sellerData = req.body;
      
      // Return success with the data
      return res.status(200).json({
        message: 'Business updated successfully',
        seller: { id: req.query.id || Date.now(), ...sellerData }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Sellers API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
