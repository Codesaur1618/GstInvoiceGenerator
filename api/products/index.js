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
    const { method, url } = req;
    const path = url.replace('/api/products', '');

    // Handle GET /api/products
    if (method === 'GET') {
      try {
        const sellerId = req.query.seller_id;
        let query = db('products').select('*').orderBy('created_at', 'desc');
        
        if (sellerId) {
          query = query.where('seller_id', sellerId);
        }
        
        const products = await query;
        return res.status(200).json({ products });
      } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ error: 'Failed to fetch products' });
      }
    }

    // Handle POST /api/products
    if (method === 'POST') {
      try {
        const productData = req.body;
        const [productId] = await db('products').insert(productData);
        const newProduct = await db('products').where({ id: productId }).first();
        
        return res.status(201).json({
          message: 'Product created successfully',
          product: newProduct
        });
      } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ error: 'Failed to create product' });
      }
    }

    // Handle PUT /api/products?id=123
    if (method === 'PUT') {
      try {
        const productId = req.query.id;
        const productData = req.body;
        
        if (!productId) {
          return res.status(400).json({ error: 'Product ID is required' });
        }
        
        await db('products').where({ id: productId }).update(productData);
        const updatedProduct = await db('products').where({ id: productId }).first();
        
        return res.status(200).json({
          message: 'Product updated successfully',
          product: updatedProduct
        });
      } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ error: 'Failed to update product' });
      }
    }

    // Handle DELETE /api/products?id=123
    if (method === 'DELETE') {
      try {
        const productId = req.query.id;
        
        if (!productId) {
          return res.status(400).json({ error: 'Product ID is required' });
        }
        
        await db('products').where({ id: productId }).del();
        
        return res.status(200).json({
          message: 'Product deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ error: 'Failed to delete product' });
      }
    }

    return res.status(404).json({ error: 'Route not found' });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}