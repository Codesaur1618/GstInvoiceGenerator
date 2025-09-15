const knex = require('knex');
const fs = require('fs');
const path = require('path');

// Database configuration for Vercel
// Use /tmp directory for persistent storage in Vercel serverless functions
const dbPath = process.env.DATABASE_URL || '/tmp/gst_invoice.db';

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true,
  pool: {
    min: 1,
    max: 10
  }
});

// Initialize database tables if they don't exist
async function initializeDatabase() {
  try {
    // Check if database file exists and has tables
    const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    
    if (tables.length === 0) {
      console.log('Initializing database tables...');
      
      // Create users table
      await db.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('username', 50).unique().notNullable();
        table.string('email', 255).unique().notNullable();
        table.string('password', 255).notNullable();
        table.string('role', 20).notNullable().checkIn(['seller', 'buyer', 'admin']);
        table.string('business_name', 255);
        table.text('business_address');
        table.string('gstin', 15);
        table.string('contact_number', 20);
        table.string('bank_name', 255);
        table.string('bank_account_number', 50);
        table.string('bank_ifsc_code', 20);
        table.string('state', 100);
        table.string('state_code', 10);
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
      });

      // Create sellers table
      await db.schema.createTable('sellers', (table) => {
        table.increments('id').primary();
        table.string('business_name', 255).notNullable();
        table.text('business_address');
        table.string('gstin', 15);
        table.string('contact_number', 20);
        table.string('email', 255);
        table.string('bank_name', 255);
        table.string('bank_account_number', 50);
        table.string('bank_ifsc_code', 20);
        table.string('state', 100);
        table.string('state_code', 10);
        table.timestamps(true, true);
      });

      // Create buyers table
      await db.schema.createTable('buyers', (table) => {
        table.increments('id').primary();
        table.string('business_name', 255).notNullable();
        table.text('business_address');
        table.string('gstin', 15);
        table.string('contact_number', 20);
        table.string('email', 255);
        table.string('state', 100);
        table.string('state_code', 10);
        table.timestamps(true, true);
      });

      // Create products table
      await db.schema.createTable('products', (table) => {
        table.increments('id').primary();
        table.integer('seller_id').notNullable();
        table.string('name', 255).notNullable();
        table.text('description');
        table.string('hsn_code', 10);
        table.string('unit', 50).defaultTo('NOS');
        table.decimal('rate', 12, 2).notNullable();
        table.decimal('gst_rate', 5, 2).defaultTo(18.00);
        table.decimal('stock_quantity', 10, 2).defaultTo(0);
        table.decimal('min_stock_level', 10, 2).defaultTo(0);
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
        table.foreign('seller_id').references('id').inTable('sellers').onDelete('CASCADE');
      });

      // Create invoices table
      await db.schema.createTable('invoices', (table) => {
        table.increments('id').primary();
        table.string('invoice_number', 50).unique().notNullable();
        table.date('date').notNullable();
        table.integer('seller_id').notNullable();
        table.integer('buyer_id').notNullable();
        table.string('seller_name', 255).notNullable();
        table.text('seller_address');
        table.string('seller_gstin', 15);
        table.string('seller_contact', 20);
        table.string('seller_bank_name', 255);
        table.string('seller_bank_account', 50);
        table.string('seller_bank_ifsc', 20);
        table.string('buyer_name', 255).notNullable();
        table.text('buyer_address');
        table.string('buyer_state', 100);
        table.string('buyer_state_code', 10);
        table.string('buyer_gstin', 15);
        table.decimal('subtotal', 12, 2).defaultTo(0);
        table.decimal('cgst', 12, 2).defaultTo(0);
        table.decimal('sgst', 12, 2).defaultTo(0);
        table.decimal('igst', 12, 2).defaultTo(0);
        table.decimal('round_off', 12, 2).defaultTo(0);
        table.decimal('total', 12, 2).defaultTo(0);
        table.text('total_in_words');
        table.string('status', 20).defaultTo('draft').checkIn(['draft', 'sent', 'paid', 'cancelled']);
        table.string('payment_method', 50);
        table.date('payment_date');
        table.text('notes');
        table.timestamps(true, true);
        table.foreign('seller_id').references('id').inTable('sellers');
        table.foreign('buyer_id').references('id').inTable('buyers');
      });

      // Create invoice_items table
      await db.schema.createTable('invoice_items', (table) => {
        table.increments('id').primary();
        table.integer('invoice_id').notNullable();
        table.integer('product_id');
        table.integer('serial_number').notNullable();
        table.text('description').notNullable();
        table.string('hsn_code', 10);
        table.decimal('qty', 10, 2).notNullable().defaultTo(0);
        table.string('unit', 50).defaultTo('NOS');
        table.decimal('rate', 12, 2).notNullable().defaultTo(0);
        table.decimal('gst_rate', 5, 2).defaultTo(18.00);
        table.decimal('cgst_amount', 12, 2).defaultTo(0);
        table.decimal('sgst_amount', 12, 2).defaultTo(0);
        table.decimal('igst_amount', 12, 2).defaultTo(0);
        table.decimal('amount', 12, 2).notNullable().defaultTo(0);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.foreign('invoice_id').references('id').inTable('invoices').onDelete('CASCADE');
        table.foreign('product_id').references('id').inTable('products').onDelete('SET NULL');
      });

      // Create indexes for better performance
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_sellers_business_name ON sellers(business_name)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_sellers_gstin ON sellers(gstin)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_buyers_business_name ON buyers(business_name)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_buyers_gstin ON buyers(gstin)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_invoices_seller_id ON invoices(seller_id)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_invoices_buyer_id ON invoices(buyer_id)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id)');
      await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id)');

      // Create default admin user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db('users').insert({
        username: 'admin',
        email: 'admin@gstinvoice.com',
        password: hashedPassword,
        role: 'admin',
        business_name: 'GST Invoice System Admin',
        is_active: true
      });

      console.log('✅ Database initialized successfully with default admin user');
    } else {
      console.log('✅ Database tables already exist');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Initialize database on module load
initializeDatabase().catch(console.error);

// Test the connection
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
  });

module.exports = db;
