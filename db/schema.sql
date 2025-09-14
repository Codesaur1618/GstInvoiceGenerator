-- GST Invoice Generator Database Schema
-- SQLite Database Schema for Local Development

-- Enable foreign key constraints in SQLite
PRAGMA foreign_keys = ON;

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS sellers;
DROP TABLE IF EXISTS buyers;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK(role IN ('seller', 'buyer', 'admin')),
    
    -- Business details (mainly for sellers)
    business_name VARCHAR(255),
    business_address TEXT,
    gstin VARCHAR(15),
    contact_number VARCHAR(20),
    
    -- Bank details (for sellers)
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    
    -- State information (for tax calculations)
    state VARCHAR(100),
    state_code VARCHAR(10),
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create sellers table
CREATE TABLE sellers (
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
);

-- Create buyers table
CREATE TABLE buyers (
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
);

-- Create products table
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    
    -- Product details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hsn_code VARCHAR(10),
    unit VARCHAR(50) DEFAULT 'NOS',
    
    -- Pricing
    rate DECIMAL(12,2) NOT NULL,
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    
    -- Stock management
    stock_quantity DECIMAL(10,2) DEFAULT 0,
    min_stock_level DECIMAL(10,2) DEFAULT 0,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

-- Create invoices table (enhanced version)
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    date DATE NOT NULL,
    
    -- User references
    seller_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    
    -- Seller details (denormalized for historical records)
    seller_name VARCHAR(255) NOT NULL,
    seller_address TEXT,
    seller_gstin VARCHAR(15),
    seller_contact VARCHAR(20),
    seller_bank_name VARCHAR(255),
    seller_bank_account VARCHAR(50),
    seller_bank_ifsc VARCHAR(20),
    
    -- Buyer details (denormalized for historical records)
    buyer_name VARCHAR(255) NOT NULL,
    buyer_address TEXT,
    buyer_state VARCHAR(100),
    buyer_state_code VARCHAR(10),
    buyer_gstin VARCHAR(15),
    
    -- Invoice calculations
    subtotal DECIMAL(12,2) DEFAULT 0,
    cgst DECIMAL(12,2) DEFAULT 0,
    sgst DECIMAL(12,2) DEFAULT 0,
    igst DECIMAL(12,2) DEFAULT 0,
    round_off DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    total_in_words TEXT,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'cancelled')),
    payment_method VARCHAR(50),
    payment_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seller_id) REFERENCES sellers(id),
    FOREIGN KEY (buyer_id) REFERENCES buyers(id)
);

-- Create invoice_items table
CREATE TABLE invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_id INTEGER,
    
    -- Item details
    serial_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    hsn_code VARCHAR(10),
    qty DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'NOS',
    rate DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Tax calculations
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    cgst_amount DECIMAL(12,2) DEFAULT 0,
    sgst_amount DECIMAL(12,2) DEFAULT 0,
    igst_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Total
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sellers_business_name ON sellers(business_name);
CREATE INDEX idx_sellers_gstin ON sellers(gstin);
CREATE INDEX idx_buyers_business_name ON buyers(business_name);
CREATE INDEX idx_buyers_gstin ON buyers(gstin);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_invoices_seller_id ON invoices(seller_id);
CREATE INDEX idx_invoices_buyer_id ON invoices(buyer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);

-- Create triggers for updated_at
CREATE TRIGGER update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_sellers_timestamp 
AFTER UPDATE ON sellers
BEGIN
    UPDATE sellers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_buyers_timestamp 
AFTER UPDATE ON buyers
BEGIN
    UPDATE buyers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_products_timestamp 
AFTER UPDATE ON products
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_invoices_timestamp 
AFTER UPDATE ON invoices
BEGIN
    UPDATE invoices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role, business_name, is_active) 
VALUES ('admin', 'admin@gstinvoice.local', '$2a$10$rBgI5TZxPvQQzLqz5Z5Z5eWzPWVVSZ5Z5Z5Z5Z5Z5Z', 'admin', 'GST Invoice System', 1);

-- Insert sample sellers
INSERT INTO sellers (business_name, business_address, gstin, contact_number, email, bank_name, bank_account_number, bank_ifsc_code, state, state_code) 
VALUES 
    ('Sample Electronics Pvt Ltd', '123 Business Park, Mumbai, Maharashtra 400001', '27ABCDE1234F1Z5', '+91-9876543210', 'info@sampleelectronics.com', 'State Bank of India', '12345678901234', 'SBIN0001234', 'Maharashtra', '27'),
    ('Tech Solutions Ltd', '456 Tech Avenue, Bangalore, Karnataka 560001', '29XYZAB5678C1D2', '+91-9876543211', 'info@techsolutions.com', 'HDFC Bank', '98765432109876', 'HDFC0001234', 'Karnataka', '29');

-- Insert sample buyers
INSERT INTO buyers (business_name, business_address, gstin, contact_number, email, state, state_code) 
VALUES 
    ('Corporate Client Ltd', '789 Corporate Plaza, Delhi, Delhi 110001', '07XYZAB5678C1D2', '+91-9876543212', 'purchases@corporateclient.com', 'Delhi', '07'),
    ('Retail Store Chain', '321 Retail Street, Chennai, Tamil Nadu 600001', '33ABCDE1234F1Z5', '+91-9876543213', 'orders@retailstore.com', 'Tamil Nadu', '33');

-- Insert sample products for the sellers
INSERT INTO products (seller_id, name, description, hsn_code, unit, rate, gst_rate, stock_quantity) 
VALUES 
    (1, 'Laptop Dell XPS 13', 'High-performance laptop with 16GB RAM', '8471', 'NOS', 75000.00, 18.00, 10),
    (1, 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', '8471', 'NOS', 1500.00, 18.00, 50),
    (2, 'USB-C Hub', 'Multi-port USB-C hub with HDMI', '8471', 'NOS', 3500.00, 18.00, 25),
    (2, 'Mechanical Keyboard', 'RGB mechanical keyboard', '8471', 'NOS', 8000.00, 18.00, 15);