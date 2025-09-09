const fs = require('fs');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');
    
    // Read and execute the schema
    const schemaPath = path.join(__dirname, '../../db/local-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute PRAGMA first
    await db.raw('PRAGMA foreign_keys = ON');
    console.log('✅ Enabled foreign key constraints');
    
    // Execute DROP TABLE statements
    const dropTables = ['invoice_items', 'invoices', 'sellers', 'buyers', 'users'];
    for (const table of dropTables) {
      await db.raw(`DROP TABLE IF EXISTS ${table}`);
      console.log(`✅ Dropped table if exists: ${table}`);
    }
    
    // Execute CREATE TABLE statements and indexes from the schema
    // For SQLite, we need to handle triggers separately
    const createStatements = [
      // Users table
      `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK(role IN ('seller', 'buyer', 'admin')),
        business_name VARCHAR(255),
        business_address TEXT,
        gstin VARCHAR(15),
        contact_number VARCHAR(20),
        bank_name VARCHAR(255),
        bank_account_number VARCHAR(50),
        bank_ifsc_code VARCHAR(20),
        state VARCHAR(100),
        state_code VARCHAR(10),
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Sellers table
      `CREATE TABLE sellers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_name VARCHAR(255) NOT NULL,
        business_address TEXT,
        gstin VARCHAR(15),
        contact_number VARCHAR(20),
        email VARCHAR(255),
        bank_name VARCHAR(255),
        bank_account_number VARCHAR(50),
        bank_ifsc_code VARCHAR(20),
        state VARCHAR(100),
        state_code VARCHAR(10),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Buyers table
      `CREATE TABLE buyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_name VARCHAR(255) NOT NULL,
        business_address TEXT,
        gstin VARCHAR(15),
        contact_number VARCHAR(20),
        email VARCHAR(255),
        state VARCHAR(100),
        state_code VARCHAR(10),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Invoices table
      `CREATE TABLE invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        date DATE NOT NULL,
        seller_id INTEGER NOT NULL,
        buyer_id INTEGER NOT NULL,
        seller_name VARCHAR(255) NOT NULL,
        seller_address TEXT,
        seller_gstin VARCHAR(15),
        seller_contact VARCHAR(20),
        seller_bank_name VARCHAR(255),
        seller_bank_account VARCHAR(50),
        seller_bank_ifsc VARCHAR(20),
        buyer_name VARCHAR(255) NOT NULL,
        buyer_address TEXT,
        buyer_state VARCHAR(100),
        buyer_state_code VARCHAR(10),
        buyer_gstin VARCHAR(15),
        subtotal DECIMAL(12,2) DEFAULT 0,
        cgst DECIMAL(12,2) DEFAULT 0,
        sgst DECIMAL(12,2) DEFAULT 0,
        igst DECIMAL(12,2) DEFAULT 0,
        round_off DECIMAL(12,2) DEFAULT 0,
        total DECIMAL(12,2) DEFAULT 0,
        total_in_words TEXT,
        status VARCHAR(20) DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'cancelled')),
        payment_method VARCHAR(50),
        payment_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers(id),
        FOREIGN KEY (buyer_id) REFERENCES buyers(id)
        
      )`,
      
      // Invoice items table
      `CREATE TABLE invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        serial_number INTEGER NOT NULL,
        description TEXT NOT NULL,
        hsn_code VARCHAR(10),
        qty DECIMAL(10,2) NOT NULL DEFAULT 0,
        unit VARCHAR(50) DEFAULT 'NOS',
        rate DECIMAL(12,2) NOT NULL DEFAULT 0,
        gst_rate DECIMAL(5,2) DEFAULT 18.00,
        cgst_amount DECIMAL(12,2) DEFAULT 0,
        sgst_amount DECIMAL(12,2) DEFAULT 0,
        igst_amount DECIMAL(12,2) DEFAULT 0,
        amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      )`
    ];
    
    // Execute CREATE TABLE statements
    for (const statement of createStatements) {
      await db.raw(statement);
      console.log('✅ Created table');
    }
    
    // Create indexes
    const indexStatements = [
      'CREATE INDEX idx_users_email ON users(email)',
      'CREATE INDEX idx_users_username ON users(username)',
      'CREATE INDEX idx_users_role ON users(role)',
      'CREATE INDEX idx_sellers_business_name ON sellers(business_name)',
      'CREATE INDEX idx_sellers_gstin ON sellers(gstin)',
      'CREATE INDEX idx_buyers_business_name ON buyers(business_name)',
      'CREATE INDEX idx_buyers_gstin ON buyers(gstin)',
      'CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number)',
      'CREATE INDEX idx_invoices_date ON invoices(date)',
      'CREATE INDEX idx_invoices_seller_id ON invoices(seller_id)',
      'CREATE INDEX idx_invoices_buyer_id ON invoices(buyer_id)',
      'CREATE INDEX idx_invoices_status ON invoices(status)',
      'CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id)'
    ];
    
    for (const statement of indexStatements) {
      await db.raw(statement);
      console.log('✅ Created index');
    }
    
    // Insert users with properly hashed passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const sellerPassword = await bcrypt.hash('seller123', 10);
    const buyerPassword = await bcrypt.hash('buyer123', 10);
    
    // Insert admin
    await db('users').insert({
      username: 'admin',
      email: 'admin@gstinvoice.local',
      password: adminPassword,
      role: 'admin',
      business_name: 'GST Invoice System',
      is_active: 1
    });
    console.log('✅ Admin user created');
    
    // Insert sample sellers
    await db('sellers').insert([
      {
        business_name: 'Sample Electronics Pvt Ltd',
        business_address: '123 Business Park, Mumbai, Maharashtra 400001',
        gstin: '27ABCDE1234F1Z5',
        contact_number: '+91-9876543210',
        email: 'info@sampleelectronics.com',
        bank_name: 'State Bank of India',
        bank_account_number: '12345678901234',
        bank_ifsc_code: 'SBIN0001234',
        state: 'Maharashtra',
        state_code: '27'
      },
      {
        business_name: 'Tech Solutions Ltd',
        business_address: '456 Tech Avenue, Bangalore, Karnataka 560001',
        gstin: '29XYZAB5678C1D2',
        contact_number: '+91-9876543211',
        email: 'info@techsolutions.com',
        bank_name: 'HDFC Bank',
        bank_account_number: '98765432109876',
        bank_ifsc_code: 'HDFC0001234',
        state: 'Karnataka',
        state_code: '29'
      }
    ]);
    console.log('✅ Sample sellers created');
    
    // Insert sample buyers
    await db('buyers').insert([
      {
        business_name: 'Corporate Client Ltd',
        business_address: '789 Corporate Plaza, Delhi, Delhi 110001',
        gstin: '07XYZAB5678C1D2',
        contact_number: '+91-9876543212',
        email: 'purchases@corporateclient.com',
        state: 'Delhi',
        state_code: '07'
      },
      {
        business_name: 'Retail Store Chain',
        business_address: '321 Retail Street, Chennai, Tamil Nadu 600001',
        gstin: '33ABCDE1234F1Z5',
        contact_number: '+91-9876543213',
        email: 'orders@retailstore.com',
        state: 'Tamil Nadu',
        state_code: '33'
      }
    ]);
    console.log('✅ Sample buyers created');
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📝 Default credentials:');
    console.log('   Admin: admin / admin123');
    console.log('\n📊 Sample data created:');
    console.log('   - 2 Sellers (companies)');
    console.log('   - 2 Buyers (clients)');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await db.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initializeDatabase };
