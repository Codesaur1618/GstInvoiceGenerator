-- GST Invoice Generator Database Schema
-- Run this SQL in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    
    -- Seller details
    seller_name VARCHAR(255) NOT NULL,
    seller_address TEXT,
    seller_gstin VARCHAR(15),
    seller_contact VARCHAR(20),
    seller_bank_name VARCHAR(255),
    seller_bank_account VARCHAR(50),
    seller_bank_ifsc VARCHAR(20),
    
    -- Buyer details
    buyer_name VARCHAR(255) NOT NULL,
    buyer_address TEXT,
    buyer_state VARCHAR(100),
    buyer_state_code VARCHAR(10),
    buyer_gstin VARCHAR(15),
    
    -- Invoice calculations
    subtotal NUMERIC(12,2) DEFAULT 0,
    cgst NUMERIC(12,2) DEFAULT 0,
    sgst NUMERIC(12,2) DEFAULT 0,
    igst NUMERIC(12,2) DEFAULT 0,
    round_off NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0,
    total_in_words TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    serial_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    hsn_code VARCHAR(10),
    qty NUMERIC(10,2) NOT NULL DEFAULT 0,
    rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for invoices table
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO invoices (
    invoice_number, 
    date, 
    seller_name, 
    seller_address, 
    seller_gstin,
    buyer_name, 
    buyer_address, 
    buyer_state, 
    buyer_state_code,
    subtotal, 
    cgst, 
    sgst, 
    total, 
    total_in_words
) VALUES (
    'INV-001', 
    CURRENT_DATE, 
    'Sample Company Pvt Ltd', 
    '123 Business Street, Mumbai, Maharashtra 400001', 
    '27ABCDE1234F1Z5',
    'Test Customer', 
    '456 Customer Avenue, Delhi, Delhi 110001', 
    'Delhi', 
    '07',
    1000.00, 
    60.00, 
    60.00, 
    1120.00, 
    'One Thousand One Hundred Twenty Rupees Only'
);

-- Insert sample invoice items
INSERT INTO invoice_items (
    invoice_id, 
    serial_number, 
    description, 
    hsn_code, 
    qty, 
    rate, 
    amount
) VALUES (
    (SELECT id FROM invoices WHERE invoice_number = 'INV-001'), 
    1, 
    'Sample Product', 
    '1234', 
    2.00, 
    500.00, 
    1000.00
);

