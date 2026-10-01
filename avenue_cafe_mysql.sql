-- ===================================================
-- Avenue Café Database Export Script
-- Target Platform: MySQL 5.7+ / 8.0+ / XAMPP / phpMyAdmin
-- Currency: Philippine Peso (PHP - ₱)
-- ===================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS admin_notifications;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------
-- 1. Table structure for 'categories'
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed categories
INSERT INTO categories (name) VALUES
('Matcha Classics'),
('Matcha Fruit Series'),
('Matcha Frappes');

-- ---------------------------------------------------
-- 2. Table structure for 'products'
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_name VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  available TINYINT(1) DEFAULT 1,
  is_popular TINYINT(1) DEFAULT 0,
  calories INT DEFAULT 0,
  prep_time_mins INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_name) REFERENCES categories(name) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed products (Prices in PHP ₱)
INSERT INTO products (id, name, category_name, price, description, image, available, is_popular, calories, prep_time_mins) VALUES
('prod-1', 'Classic Uji Matcha Latte', 'Matcha Classics', 165.00, 'Ceremonial grade Uji matcha whisked with velvety steamed milk.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a', 1, 1, 180, 4),
('prod-2', 'Ceremonial Matcha Cold Foam', 'Matcha Classics', 175.00, 'Iced ceremonial matcha topped with barista sweet cream cold foam.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a', 1, 1, 160, 5),
('prod-3', 'Matcha Strawberry', 'Matcha Fruit Series', 185.00, 'Ceremonial matcha blended with fresh strawberry puree and creamy milk.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a', 1, 1, 220, 5),
('prod-4', 'Matcha Mango', 'Matcha Fruit Series', 185.00, 'Ripe mango puree swirled into smooth ceremonial matcha and milk.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a', 1, 1, 210, 5),
('prod-5', 'Matcha Blueberry', 'Matcha Fruit Series', 185.00, 'Antioxidant-rich blueberry puree layered with ceremonial matcha.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a', 1, 1, 200, 5),
('prod-6', 'Matcha Avocado', 'Matcha Fruit Series', 195.00, 'Silky avocado blended with ceremonial matcha for a rich, creamy treat.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a', 1, 1, 260, 6),
('prod-7', 'Matcha Peach', 'Matcha Fruit Series', 185.00, 'Sweet summer peach puree folded into ceremonial matcha and milk.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a', 1, 0, 200, 5),
('prod-8', 'Matcha Lychee', 'Matcha Fruit Series', 185.00, 'Fragrant lychee blended with ceremonial matcha over ice.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a', 1, 0, 190, 5),
('prod-9', 'Matcha Strawberry Frappe', 'Matcha Frappes', 205.00, 'Frozen matcha-strawberry frappe topped with whipped cream.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a', 1, 1, 300, 6),
('prod-10', 'Matcha Oreo Frappe', 'Matcha Frappes', 205.00, 'Frozen ceremonial matcha blended with crushed cookies and cream.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a', 1, 0, 320, 6);

-- ---------------------------------------------------
-- 3. Table structure for 'orders'
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  customer_address TEXT,
  customer_notes TEXT,
  email VARCHAR(100),
  ewallet_number VARCHAR(30),
  reference_number VARCHAR(50),
  delivery_type ENUM('delivery', 'pickup') DEFAULT 'delivery',
  payment_method ENUM('cash', 'gcash', 'maya', 'card') DEFAULT 'cash',
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
    cancelled_by VARCHAR(20),
  pickup_time VARCHAR(30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------
-- 4. Table structure for 'order_items'
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------
-- 5. Table structure for 'admin_notifications'
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_notifications (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  order_number VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- No sample/demo orders are seeded — the orders table starts empty.

-- ===================================================
-- End of Avenue Café MySQL Database Schema
-- Ready for XAMPP / phpMyAdmin SQL import
-- ===================================================
