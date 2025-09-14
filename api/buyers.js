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

    if (req.method === 'POST') {
      const buyerData = req.body;
      
      // Return success with the data
      return res.status(201).json({
        message: 'Buyer created successfully',
        buyer: { id: Date.now(), ...buyerData }
      });
    }

    if (req.method === 'PUT') {
      const buyerData = req.body;
      
      // Return success with the data
      return res.status(200).json({
        message: 'Buyer updated successfully',
        buyer: { id: req.query.id || Date.now(), ...buyerData }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Buyers API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
