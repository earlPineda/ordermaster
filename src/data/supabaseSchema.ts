/**
 * Supabase Database Schema & DDL Generator
 * Platform: Supabase (PostgreSQL 15+)
 * Includes full RLS Policies, Indexes, Relational Schema & Reporting Data Storage
 */

export const generateSupabaseDump = (): string => {
  return `-- ==============================================================================
-- Avenue Café - Supabase PostgreSQL Database & Reporting Data Storage Schema
-- Platform: Supabase (PostgreSQL 15+)
-- Currency: Philippine Peso (PHP - ₱)
-- ==============================================================================

-- 1. Enable UUID extension for modern distributed IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if rebuilding (in reverse dependency order)
DROP TABLE IF EXISTS reporting_data_store CASCADE;
DROP TABLE IF EXISTS sales_reports CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Categories
INSERT INTO categories (name, display_order) VALUES
  ('Espresso & Coffee', 1),
  ('Cold Brew & Frappes', 2),
  ('Artisan Teas', 3),
  ('Pastries & Bakery', 4),
  ('Gourmet Paninis', 5),
  ('Desserts', 6)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. PRODUCTS MENU CATALOG TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  sale_price NUMERIC(10,2),
  is_on_sale BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  badge VARCHAR(100),
  description TEXT,
  image TEXT,
  available BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  calories INT DEFAULT 250,
  prep_time_mins INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Products
INSERT INTO products (id, name, category_name, price, sale_price, is_on_sale, is_featured, badge, description, image, available, is_popular, calories, prep_time_mins)
VALUES
  ('prod-1', 'Avenue Spanish Latte', 'Espresso & Coffee', 165.00, 145.00, true, true, 'Best Seller', 'Double shot espresso blend with velvety steamed milk and sweet condensed milk swirl.', NULL, true, true, 280, 4),
  ('prod-2', 'Vanilla Bean Cold Brew', 'Cold Brew & Frappes', 175.00, 140.00, true, true, '20% OFF', '18-hour steep dark roast cold brew topped with house-made vanilla bean cold foam.', NULL, true, true, 190, 3),
  ('prod-3', 'Iced Uji Cream Matcha', 'Artisan Teas', 185.00, NULL, false, true, 'Chef''s Special', 'Ceremonial grade Uji matcha whisked with oat milk and sweet cream cold foam.', NULL, true, true, 220, 5),
  ('prod-4', 'Artisan Butter Croissant', 'Pastries & Bakery', 120.00, 99.00, true, true, 'Fresh Baked', 'Flaky, multi-layered French butter croissant freshly baked every morning.', NULL, true, true, 320, 2),
  ('prod-5', 'Smoked Turkey & Pesto Panini', 'Gourmet Paninis', 260.00, NULL, false, false, 'Warm & Toasted', 'Smoked turkey breast, melted provolone, basil pesto, and sun-dried tomatoes on toasted sourdough.', NULL, true, true, 560, 8),
  ('prod-6', 'Basque Burnt Cheesecake', 'Desserts', 195.00, 175.00, true, false, 'Popular', 'Caramelized top cheesecake with a silky, molten cream center.', NULL, true, false, 410, 2);

-- ------------------------------------------------------------------------------
-- 5. ORDERS TABLE (Live Orders & Status Lifecycle)
-- ------------------------------------------------------------------------------
CREATE TABLE orders (
  id VARCHAR(100) PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  customer_address TEXT,
  customer_unit_floor VARCHAR(100),
  customer_landmark VARCHAR(255),
  customer_lat NUMERIC(10, 6),
  customer_lng NUMERIC(10, 6),
  customer_notes TEXT,
  ewallet_number VARCHAR(50),
  reference_number VARCHAR(100),
  delivery_type VARCHAR(20) DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'pickup')),
  pickup_time VARCHAR(100),
  pickup_status VARCHAR(50),
  pickup_history JSONB DEFAULT '[]'::jsonb,
  customer_received BOOLEAN DEFAULT FALSE,
  customer_received_at TIMESTAMPTZ,
  customer_rating INT CHECK (customer_rating BETWEEN 1 AND 5),
  customer_feedback TEXT,
  cancelled_by VARCHAR(50),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'gcash', 'maya', 'card')),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy queries on active queue and reporting
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);

-- ------------------------------------------------------------------------------
-- 6. ORDER ITEMS TABLE (Line Items)
-- ------------------------------------------------------------------------------
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON UPDATE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ------------------------------------------------------------------------------
-- 7. ADMIN NOTIFICATIONS & ORDER ALERTS
-- ------------------------------------------------------------------------------
CREATE TABLE admin_notifications (
  id VARCHAR(100) PRIMARY KEY,
  order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_reason VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_notifications_read ON admin_notifications(is_read, is_resolved);

-- ------------------------------------------------------------------------------
-- 8. SALES REPORTING & DATA STORAGE FOR AUDITING & ANALYTICS
-- ------------------------------------------------------------------------------
CREATE TABLE sales_reports (
  id VARCHAR(100) PRIMARY KEY,
  report_name VARCHAR(255) NOT NULL,
  period VARCHAR(50) NOT NULL,
  total_gross_sales NUMERIC(12,2) NOT NULL,
  net_sales NUMERIC(12,2) NOT NULL,
  valid_orders_count INT NOT NULL DEFAULT 0,
  cancelled_orders_count INT NOT NULL DEFAULT 0,
  cancelled_loss_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  average_order_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_orders_count INT NOT NULL DEFAULT 0,
  pickup_orders_count INT NOT NULL DEFAULT 0,
  payment_breakdown JSONB DEFAULT '{}'::jsonb,
  top_items JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reporting_data_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_key VARCHAR(100) NOT NULL,
  metric_date DATE DEFAULT CURRENT_DATE,
  data_payload JSONB NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reporting_date ON reporting_data_store(metric_date);

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- ------------------------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporting_data_store ENABLE ROW LEVEL SECURITY;

-- Allow public read of menu categories and products
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);

-- Allow public read & insert for customer orders
CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Own Orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public Update Own Orders" ON orders FOR UPDATE USING (true);

CREATE POLICY "Public Insert Order Items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Order Items" ON order_items FOR SELECT USING (true);

-- Admin full access on notifications and reporting
CREATE POLICY "Allow All for Authenticated & Anon" ON admin_notifications FOR ALL USING (true);
CREATE POLICY "Allow All for Reports" ON sales_reports FOR ALL USING (true);
CREATE POLICY "Allow All for Data Store" ON reporting_data_store FOR ALL USING (true);

-- ==============================================================================
-- End of Supabase Database & Reporting Data Storage Script
-- Ready to run in Supabase SQL Editor!
-- ==============================================================================
`;
};
