const knex = require('knex');
const fs = require('fs');
const path = require('path');

// Database configuration for Vercel
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: process.env.DATABASE_URL || ':memory:'
  },
  useNullAsDefault: true,
  pool: {
    min: 1,
    max: 10
  }
});

// Read the schema file
const schemaPath = path.join(__dirname, '../db/schema.sql');
let schemaSQL = '';

try {
  schemaSQL = fs.readFileSync(schemaPath, 'utf8');
} catch (error) {
  console.error('Error reading schema file:', error);
  // Fallback schema for basic functionality
  schemaSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('seller', 'buyer', 'admin')),
      business_name TEXT NOT NULL,
      business_address TEXT,
      gstin TEXT,
      contact_number TEXT,
      bank_name TEXT,
      bank_account_number TEXT,
      bank_ifsc_code TEXT,
      state TEXT,
      state_code TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      hsn_code TEXT,
      unit TEXT DEFAULT 'NOS',
      rate REAL NOT NULL,
      gst_rate REAL DEFAULT 18.00,
      stock_quantity REAL DEFAULT 0,
      min_stock_level REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      date DATE NOT NULL,
      seller_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      seller_name TEXT NOT NULL,
      seller_address TEXT,
      seller_gstin TEXT,
      seller_contact TEXT,
      seller_bank_name TEXT,
      seller_bank_account TEXT,
      seller_bank_ifsc TEXT,
      buyer_name TEXT NOT NULL,
      buyer_address TEXT,
      buyer_state TEXT,
      buyer_state_code TEXT,
      buyer_gstin TEXT,
      subtotal REAL NOT NULL,
      cgst REAL DEFAULT 0,
      sgst REAL DEFAULT 0,
      igst REAL DEFAULT 0,
      round_off REAL DEFAULT 0,
      total REAL NOT NULL,
      total_in_words TEXT,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
      payment_method TEXT,
      payment_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users (id),
      FOREIGN KEY (buyer_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER,
      serial_number INTEGER NOT NULL,
      description TEXT NOT NULL,
      hsn_code TEXT,
      qty REAL NOT NULL,
      unit TEXT DEFAULT 'NOS',
      rate REAL NOT NULL,
      gst_rate REAL DEFAULT 18.00,
      cgst_amount REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      amount REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_seller_id ON invoices(seller_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_buyer_id ON invoices(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
  `;
}

// Initialize database
async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Split SQL into individual statements and execute them
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.raw(statement);
      }
    }
    
    console.log('✅ Database initialized successfully');
    
    // Create default admin user if it doesn't exist
    const adminExists = await db('users').where({ role: 'admin' }).first();
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db('users').insert({
        username: 'admin',
        email: 'admin@gstinvoice.com',
        password: hashedPassword,
        role: 'admin',
        business_name: 'GST Invoice System Admin',
        is_active: 1
      });
      
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = { initDatabase, db };
