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

    if (req.method === 'POST') {
      const invoiceData = req.body;
      
      // Return success with the data
      return res.status(201).json({
        message: 'Invoice created successfully',
        invoice: { id: Date.now(), ...invoiceData }
      });
    }

    if (req.method === 'PUT') {
      const invoiceData = req.body;
      
      // Return success with the data
      return res.status(200).json({
        message: 'Invoice updated successfully',
        invoice: { id: req.query.id || Date.now(), ...invoiceData }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Invoices API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
