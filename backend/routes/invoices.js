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

// Helper function to calculate taxes
const calculateTaxes = (items, sellerStateCode, buyerStateCode, taxType = null) => {
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  
  // Use taxType if provided, otherwise determine based on state codes
  let useCgstSgst = false;
  if (taxType) {
    useCgstSgst = taxType === 'cgst_sgst';
  } else {
    useCgstSgst = sellerStateCode === buyerStateCode;
  }
  
  items.forEach(item => {
    subtotal += item.amount;
    const taxAmount = item.amount * (item.gst_rate / 100);
    
    if (useCgstSgst) {
      // CGST + SGST (split equally)
      item.cgst_amount = taxAmount / 2;
      item.sgst_amount = taxAmount / 2;
      item.igst_amount = 0;
      totalCgst += item.cgst_amount;
      totalSgst += item.sgst_amount;
    } else {
      // IGST only
      item.cgst_amount = 0;
      item.sgst_amount = 0;
      item.igst_amount = taxAmount;
      totalIgst += taxAmount;
    }
  });
  
  const totalBeforeRoundOff = subtotal + totalCgst + totalSgst + totalIgst;
  const roundOff = Math.ceil(totalBeforeRoundOff) - totalBeforeRoundOff;
  const total = totalBeforeRoundOff + roundOff;
  
  return { 
    subtotal, 
    cgst: totalCgst, 
    sgst: totalSgst, 
    igst: totalIgst,
    roundOff,
    total
  };
};

// Helper function to convert number to words
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  if (num === 0) return 'Zero Rupees Only';
  
  const convertHundreds = (n) => {
    let result = '';
    if (n > 99) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n > 9) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  };
  
  let result = '';
  if (num >= 10000000) {
    result += convertHundreds(Math.floor(num / 10000000)) + 'Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    result += convertHundreds(Math.floor(num / 100000)) + 'Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }
  if (num > 0) {
    result += convertHundreds(num);
  }
  
  return result.trim() + ' Rupees Only';
};

// Generate invoice number
const generateInvoiceNumber = async (sellerId, customNumber = null) => {
  // If custom number is provided, use it directly
  if (customNumber) {
    // Check if the custom number already exists for this seller
    const existingInvoice = await db('invoices')
      .where('seller_id', sellerId)
      .where('invoice_number', customNumber)
      .first();
    
    if (existingInvoice) {
      throw new Error('Invoice number already exists');
    }
    
    return customNumber;
  }
  
  // Auto-generate if no custom number provided
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `${year}${month}`;
  
  // Find the highest sequence number for this seller and month
  const invoices = await db('invoices')
    .where('seller_id', sellerId)
    .where('invoice_number', 'like', `${prefix}%`)
    .orderBy('invoice_number', 'desc');
  
  let sequence = 1;
  if (invoices.length > 0) {
    // Extract the sequence number from the last invoice
    const lastInvoiceNumber = invoices[0].invoice_number;
    const lastSequence = parseInt(lastInvoiceNumber.replace(prefix, ''));
    sequence = lastSequence + 1;
  }
  
  // Ensure the generated number is unique by checking if it exists
  let invoiceNumber = `${prefix}${String(sequence).padStart(4, '0')}`;
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loop
  
  while (attempts < maxAttempts) {
    const existing = await db('invoices')
      .where('invoice_number', invoiceNumber)
      .first();
    
    if (!existing) {
      break; // Number is unique
    }
    
    sequence++;
    invoiceNumber = `${prefix}${String(sequence).padStart(4, '0')}`;
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate unique invoice number');
  }
  
  return invoiceNumber;
};

// Get all invoices (filtered by user role)
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['draft', 'sent', 'paid', 'cancelled']),
  query('from_date').optional().isISO8601(),
  query('to_date').optional().isISO8601(),
  query('sortBy').optional().isIn(['date', 'invoice_number', 'total', 'buyer_name', 'created_at']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  handleValidationErrors
], async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const offset = (page - 1) * limit;
    
    let query = db('invoices')
      .join('sellers', 'invoices.seller_id', 'sellers.id')
      .join('buyers', 'invoices.buyer_id', 'buyers.id')
      .select(
        'invoices.*',
        'sellers.business_name as seller_username',
        'buyers.business_name as buyer_username'
      );
    
    // Filter by user role
    if (req.user.role === 'seller') {
      query = query.where('invoices.seller_id', req.user.id);
    } else if (req.user.role === 'buyer') {
      query = query.where('invoices.buyer_id', req.user.id);
    }
    
    // Apply filters
    if (req.query.status) {
      query = query.where('invoices.status', req.query.status);
    }
    
    if (req.query.from_date) {
      query = query.where('invoices.date', '>=', req.query.from_date);
    }
    
    if (req.query.to_date) {
      query = query.where('invoices.date', '<=', req.query.to_date);
    }
    
    // Apply sorting
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder || 'desc';
    
    // Map frontend sort fields to database fields
    const sortFieldMap = {
      'date': 'invoices.date',
      'invoice_number': 'invoices.invoice_number',
      'total': 'invoices.total',
      'buyer_name': 'buyers.business_name',
      'created_at': 'invoices.created_at'
    };
    
    const sortField = sortFieldMap[sortBy] || 'invoices.date';
    query = query.orderBy(sortField, sortOrder);
    
    // Get total count
    const countResult = await query.clone().count('* as count').first();
    const total = countResult.count;
    
    // Get paginated results
    const invoices = await query
      .limit(limit)
      .offset(offset);
    
    res.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get single invoice with items
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await db('invoices')
      .join('sellers', 'invoices.seller_id', 'sellers.id')
      .join('buyers', 'invoices.buyer_id', 'buyers.id')
      .select(
        'invoices.*',
        'sellers.business_name as seller_username',
        'buyers.business_name as buyer_username'
      )
      .where('invoices.id', req.params.id)
      .first();
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Check access permissions
    if (req.user.role === 'seller' && invoice.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.role === 'buyer' && invoice.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get invoice items
    const items = await db('invoice_items')
      .leftJoin('products', 'invoice_items.product_id', 'products.id')
      .select(
        'invoice_items.*',
        'products.name as product_name'
      )
      .where('invoice_items.invoice_id', invoice.id)
      .orderBy('invoice_items.serial_number');
    
    invoice.items = items;
    
    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create new invoice
router.post('/', authenticate, [
  body('seller_id').optional().isInt().withMessage('Valid seller ID is required'),
  body('buyer_id').isInt().withMessage('Valid buyer ID is required'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.description').notEmpty().withMessage('Item description is required'),
  body('items.*.qty').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.rate').isFloat({ min: 0 }).withMessage('Rate must be non-negative'),
  body('items.*.gst_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('GST rate must be between 0 and 100'),
  body('notes').optional().trim(),
  handleValidationErrors
], async (req, res) => {
  const trx = await db.transaction();
  
  try {
    // Get seller details - use selected business if provided, otherwise use logged-in user
    const seller = req.body.seller_id ? 
      await trx('sellers').where({ id: req.body.seller_id }).first() : 
      req.user;
    
    if (!seller) {
      await trx.rollback();
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    // Get buyer details
    const buyer = await trx('buyers')
      .where({ id: req.body.buyer_id })
      .first();
    
    if (!buyer) {
      await trx.rollback();
      return res.status(404).json({ error: 'Buyer not found' });
    }
    
    // Calculate items and taxes
    const items = req.body.items.map((item, index) => ({
      ...item,
          serial_number: index + 1,
          amount: item.qty * item.rate,
      gst_rate: item.gst_rate || 18.00
    }));
    
    const taxCalculation = calculateTaxes(items, seller.state_code, buyer.state_code, req.body.tax_type);
    
    // Generate invoice number
    let invoiceNumber;
    try {
      invoiceNumber = await generateInvoiceNumber(seller.id, req.body.invoice_number);
    } catch (error) {
      await trx.rollback();
      console.error('Invoice number generation error:', error);
      return res.status(500).json({ error: 'Failed to generate invoice number' });
    }
    
    // Create invoice
    const invoiceData = {
      invoice_number: invoiceNumber,
      date: req.body.date || new Date().toISOString().split('T')[0],
      
      // User references
      seller_id: seller.id,
      buyer_id: buyer.id,
      
      // Seller details (use provided data from frontend)
      seller_name: req.body.seller_name || seller.business_name,
      seller_address: req.body.seller_address || seller.business_address,
      seller_gstin: req.body.seller_gstin || seller.gstin,
      seller_contact: req.body.seller_contact || seller.contact_number,
      seller_bank_name: req.body.seller_bank_name || seller.bank_name,
      seller_bank_account: req.body.seller_bank_account || seller.bank_account_number,
      seller_bank_ifsc: req.body.seller_bank_ifsc || seller.bank_ifsc_code,
      
      // Buyer details (use provided data from frontend)
      buyer_name: req.body.buyer_name || buyer.business_name,
      buyer_address: req.body.buyer_address || buyer.business_address,
      buyer_state: req.body.buyer_state || buyer.state,
      buyer_state_code: req.body.buyer_state_code || buyer.state_code,
      buyer_gstin: req.body.buyer_gstin || buyer.gstin,
      
      // Calculations
      subtotal: taxCalculation.subtotal,
      cgst: taxCalculation.cgst,
      sgst: taxCalculation.sgst,
      igst: taxCalculation.igst,
      round_off: taxCalculation.roundOff,
      total: taxCalculation.total,
      total_in_words: numberToWords(taxCalculation.total),
      
      // Metadata
      status: 'draft',
      notes: req.body.notes
    };
    
    // Check if invoice number already exists (double-check)
    const existingInvoice = await trx('invoices')
      .where('invoice_number', invoiceNumber)
      .first();
    
    if (existingInvoice) {
      await trx.rollback();
      return res.status(400).json({ error: 'Invoice number already exists. Please try again.' });
    }
    
    const [invoiceId] = await trx('invoices').insert(invoiceData);
    
    // Insert invoice items
    const invoiceItems = items.map(item => ({
      invoice_id: invoiceId,
      product_id: item.product_id || null,
      serial_number: item.serial_number,
      description: item.description,
      hsn_code: item.hsn_code,
      qty: item.qty,
      unit: item.unit || 'NOS',
      rate: item.rate,
      gst_rate: item.gst_rate,
      cgst_amount: item.cgst_amount,
      sgst_amount: item.sgst_amount,
      igst_amount: item.igst_amount,
      amount: item.amount
    }));
    
    await trx('invoice_items').insert(invoiceItems);
    
    // Update product stock if product_id is provided
    for (const item of items) {
      if (item.product_id && req.user.role === 'seller') {
        await trx('products')
          .where({ id: item.product_id, seller_id: seller.id })
          .decrement('stock_quantity', item.qty);
      }
    }
    
    await trx.commit();
    
    // Fetch the created invoice
    const invoice = await db('invoices')
      .where({ id: invoiceId })
      .first();
    
    invoice.items = await db('invoice_items')
      .where({ invoice_id: invoiceId })
      .orderBy('serial_number');
    
    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    await trx.rollback();
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update invoice status
router.patch('/:id/status', authenticate, [
  body('status').isIn(['draft', 'sent', 'paid', 'cancelled']).withMessage('Invalid status'),
  body('payment_method').optional().trim(),
  body('payment_date').optional().isISO8601(),
  handleValidationErrors
], async (req, res) => {
  try {
    const invoice = await db('invoices')
      .where({ id: req.params.id })
      .first();
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Check permissions
    if (req.user.role === 'seller' && invoice.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.role === 'buyer' && invoice.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updates = {
      status: req.body.status
    };
    
    if (req.body.status === 'paid') {
      updates.payment_method = req.body.payment_method;
      updates.payment_date = req.body.payment_date || new Date().toISOString().split('T')[0];
    }
    
    await db('invoices')
      .where({ id: req.params.id })
      .update(updates);
    
    const updatedInvoice = await db('invoices')
      .where({ id: req.params.id })
      .first();
    
    res.json({
      message: 'Invoice status updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// Delete invoice (only draft invoices)
router.delete('/:id', authenticate, async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const invoice = await trx('invoices')
      .where({ id: req.params.id })
      .first();
    
    if (!invoice) {
      await trx.rollback();
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Check permissions
    if (req.user.role === 'seller' && invoice.seller_id !== req.user.id) {
      await trx.rollback();
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (invoice.status !== 'draft') {
      await trx.rollback();
      return res.status(400).json({ error: 'Only draft invoices can be deleted' });
    }
    
    // Restore product stock if applicable
    if (req.user.role === 'seller') {
      const items = await trx('invoice_items')
        .where({ invoice_id: invoice.id })
        .whereNotNull('product_id');
      
      for (const item of items) {
        await trx('products')
          .where({ id: item.product_id, seller_id: invoice.seller_id })
          .increment('stock_quantity', item.qty);
      }
    }
    
    // Delete invoice (cascade will delete items)
    await trx('invoices')
      .where({ id: req.params.id })
      .delete();
    
    await trx.commit();
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    await trx.rollback();
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;