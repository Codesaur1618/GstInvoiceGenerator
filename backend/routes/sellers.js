const express = require('express');
const router = express.Router();
const knex = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get all sellers
router.get('/', authenticate, async (req, res) => {
  try {
    const sellers = await knex('sellers').select('*').orderBy('business_name');
    res.json({ sellers });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// Get seller by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const seller = await knex('sellers').where('id', req.params.id).first();
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    res.json({ seller });
  } catch (error) {
    console.error('Error fetching seller:', error);
    res.status(500).json({ error: 'Failed to fetch seller' });
  }
});

// Create new seller
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      business_name,
      business_address,
      gstin,
      contact_number,
      email,
      bank_name,
      bank_account_number,
      bank_ifsc_code,
      state,
      state_code
    } = req.body;

    if (!business_name) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    const [seller] = await knex('sellers').insert({
      business_name,
      business_address,
      gstin,
      contact_number,
      email,
      bank_name,
      bank_account_number,
      bank_ifsc_code,
      state,
      state_code,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    res.status(201).json({ seller });
  } catch (error) {
    console.error('Error creating seller:', error);
    res.status(500).json({ error: 'Failed to create seller' });
  }
});

// Update seller
router.put('/', authenticate, async (req, res) => {
  try {
    const {
      id,
      business_name,
      business_address,
      gstin,
      contact_number,
      email,
      bank_name,
      bank_account_number,
      bank_ifsc_code,
      state,
      state_code
    } = req.body;

    if (!id || !business_name) {
      return res.status(400).json({ error: 'ID and business name are required' });
    }

    const [seller] = await knex('sellers')
      .where('id', id)
      .update({
        business_name,
        business_address,
        gstin,
        contact_number,
        email,
        bank_name,
        bank_account_number,
        bank_ifsc_code,
        state,
        state_code,
        updated_at: new Date()
      })
      .returning('*');

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.json({ seller });
  } catch (error) {
    console.error('Error updating seller:', error);
    res.status(500).json({ error: 'Failed to update seller' });
  }
});

// Delete seller
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await knex('sellers').where('id', req.params.id).del();
    if (deleted === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    res.json({ message: 'Seller deleted successfully' });
  } catch (error) {
    console.error('Error deleting seller:', error);
    res.status(500).json({ error: 'Failed to delete seller' });
  }
});

module.exports = router;
