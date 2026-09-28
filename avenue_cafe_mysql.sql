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
('Espresso & Coffee'),
('Cold Brew & Frappes'),
('Artisan Teas'),
('Pastries & Bakery'),
('Gourmet Paninis'),
('Desserts');

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
('prod-1', 'Avenue Spanish Latte', 'Espresso & Coffee', 165.00, 'Double shot espresso blend with sweet condensed milk swirl.', 'https://images.unsplash.com/photo-1541167760496-1628856ab772', 1, 1, 280, 4),
('prod-2', 'Vanilla Bean Cold Brew', 'Cold Brew & Frappes', 175.00, '18-hour steep dark roast topped with vanilla cold foam.', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c', 1, 1, 190, 3),
('prod-3', 'Iced Uji Cream Matcha', 'Artisan Teas', 185.00, 'Ceremonial grade Uji matcha whisked with oat milk.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a', 1, 1, 220, 5),
('prod-4', 'Artisan Butter Croissant', 'Pastries & Bakery', 120.00, 'Flaky French butter croissant freshly baked daily.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a', 1, 1, 320, 2),
('prod-5', 'Smoked Turkey & Pesto Panini', 'Gourmet Paninis', 260.00, 'Smoked turkey, provolone, and basil pesto on sourdough.', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af', 1, 1, 560, 8),
('prod-6', 'Basque Burnt Cheesecake', 'Desserts', 195.00, 'Caramelized top cheesecake with molten cream center.', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad', 1, 0, 410, 2);

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

-- Seed Sample Orders
INSERT INTO orders (id, order_number, customer_name, customer_phone, customer_address, customer_notes, ewallet_number, reference_number, delivery_type, payment_method, subtotal, tax, delivery_fee, total, status) VALUES
('ord-101', 'ORD-1001', 'Maria Santos', '09175550192', '742 Evergreen Terrace, Unit 4B', 'Ring bell upon arrival', '09175550192', '10293847561', 'delivery', 'gcash', 570.00, 45.60, 50.00, 665.60, 'preparing'),
('ord-102', 'ORD-1002', 'Juan Dela Cruz', '09201234567', '321 Ocean Avenue, BGC Taguig', 'Pickup at counter', '09201234567', '99887766554', 'pickup', 'maya', 435.00, 34.80, 0.00, 469.80, 'pending');

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal, notes) VALUES
('ord-101', 'prod-1', 'Avenue Spanish Latte', 165.00, 2, 330.00, 'Less sweet'),
('ord-101', 'prod-4', 'Artisan Butter Croissant', 120.00, 2, 240.00, 'Warmed'),
('ord-102', 'prod-5', 'Smoked Turkey & Pesto Panini', 260.00, 1, 260.00, NULL),
('ord-102', 'prod-2', 'Vanilla Bean Cold Brew', 175.00, 1, 175.00, NULL);

INSERT INTO admin_notifications (id, order_id, order_number, customer_name, total_amount, message, is_read) VALUES
('notif-1', 'ord-101', 'ORD-1001', 'Maria Santos', 665.60, 'New order #ORD-1001 received (₱665.60 via GCash)', 1),
('notif-2', 'ord-102', 'ORD-1002', 'Juan Dela Cruz', 469.80, 'New order #ORD-1002 received (₱469.80 via Maya)', 0);

-- ===================================================
-- End of Avenue Café MySQL Database Schema
-- Ready for XAMPP / phpMyAdmin SQL import
-- ===================================================
