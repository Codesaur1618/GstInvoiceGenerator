const express = require('express');
const router = express.Router();
const knex = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get all buyers
router.get('/', authenticate, async (req, res) => {
  try {
    const buyers = await knex('buyers').select('*').orderBy('business_name');
    res.json({ buyers });
  } catch (error) {
    console.error('Error fetching buyers:', error);
    res.status(500).json({ error: 'Failed to fetch buyers' });
  }
});

// Get buyer by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const buyer = await knex('buyers').where('id', req.params.id).first();
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    res.json({ buyer });
  } catch (error) {
    console.error('Error fetching buyer:', error);
    res.status(500).json({ error: 'Failed to fetch buyer' });
  }
});

// Create new buyer
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      business_name,
      business_address,
      gstin,
      contact_number,
      email,
      state,
      state_code
    } = req.body;

    if (!business_name) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    const [buyer] = await knex('buyers').insert({
      business_name,
      business_address,
      gstin,
      contact_number,
      email,
      state,
      state_code,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    res.status(201).json({ buyer });
  } catch (error) {
    console.error('Error creating buyer:', error);
    res.status(500).json({ error: 'Failed to create buyer' });
  }
});

// Update buyer
router.put('/', authenticate, async (req, res) => {
  try {
    const {
      id,
      business_name,
      business_address,
      gstin,
      contact_number,
      email,
      state,
      state_code
    } = req.body;

    if (!id || !business_name) {
      return res.status(400).json({ error: 'ID and business name are required' });
    }

    const [buyer] = await knex('buyers')
      .where('id', id)
      .update({
        business_name,
        business_address,
        gstin,
        contact_number,
        email,
        state,
        state_code,
        updated_at: new Date()
      })
      .returning('*');

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    res.json({ buyer });
  } catch (error) {
    console.error('Error updating buyer:', error);
    res.status(500).json({ error: 'Failed to update buyer' });
  }
});

// Delete buyer
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await knex('buyers').where('id', req.params.id).del();
    if (deleted === 0) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    res.json({ message: 'Buyer deleted successfully' });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    res.status(500).json({ error: 'Failed to delete buyer' });
  }
});

module.exports = router;
