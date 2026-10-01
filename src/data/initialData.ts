import { Product, Order, AdminNotification, StoreSettings } from '../types';
import { MATCHA_AVENUE_LOGO } from '../assets/logo';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Matcha Avenue Cafe',
  tagline: 'Ceremonial Uji Matcha, Fresh Fruit Blends & Frozen Frappes',
  logoUrl: MATCHA_AVENUE_LOGO,
  heroBadgeText: 'Matcha Avenue Cafe Flagship • Crimson Street, Navarro, General Trias',
  heroHeadline: 'Ceremonial Matcha & Fresh Fruit Blends',
  heroHeadlineHighlight: 'Delivered Fresh to Your Door',
  heroSubtitle: 'Savor authentic ceremonial Uji matcha blended with fresh fruit purées — strawberry, mango, blueberry, avocado and more — plus frosty matcha frappes with instant order dispatch.',
  heroAvgMinsText: '10-15',
  heroRatingText: '4.9 ★',
  heroQualityText: '100% Fresh',
  announcementActive: true,
  announcementBadge: 'SPECIAL MENU',
  announcementText: '🍵 Welcome to Matcha Avenue Cafe! Enjoy 20% OFF all Matcha Fruit Blends & Matcha Frappes! Free delivery for orders ₱500+',
  announcementLinkText: 'Order Now',
  operatingHours: '7:00 AM – 10:00 PM Daily',
  storeAddress: 'Crimson Street, Navarro, General Trias',
  contactPhone: '+63 917 888 2233',
  contactEmail: 'contact@matchaavenue.com',
  standardDeliveryFee: 50.00,
  freeDeliveryThreshold: 500.00,
  merchantGcashNumber: '09178882233',
  merchantGcashName: 'MATCHA AVENUE CAFE BGC - MARIA S.',
  merchantMayaNumber: '09178882233',
  merchantMayaName: 'MATCHA AVENUE CAFE ENTERPRISES',
  customCategories: [
    'All',
    'Matcha Classics',
    'Matcha Fruit Series',
    'Matcha Frappes'
  ],
  showFeaturedSection: true,
  showSaleSection: true,
  facebookUrl: 'https://www.facebook.com/profile.php?id=61592982062259',
  instagramUrl: 'https://instagram.com'
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Classic Uji Matcha Latte',
    category: 'Matcha Classics',
    price: 165.00,
    isFeatured: true,
    badge: 'Best Seller',
    description: 'Ceremonial grade Uji matcha whisked with velvety steamed milk and a touch of sweetness.',
    image: '',
    available: true,
    isPopular: true,
    calories: 180,
    preparationTimeMinutes: 4
  },
  {
    id: 'prod-2',
    name: 'Ceremonial Matcha Cold Foam',
    category: 'Matcha Classics',
    price: 175.00,
    isFeatured: true,
    badge: 'House Special',
    description: 'Iced ceremonial matcha topped with barista sweet cream cold foam.',
    image: '',
    available: true,
    isPopular: true,
    calories: 160,
    preparationTimeMinutes: 5
  },
  {
    id: 'prod-3',
    name: 'Matcha Strawberry',
    category: 'Matcha Fruit Series',
    price: 185.00,
    salePrice: 160.00,
    isOnSale: true,
    isFeatured: true,
    badge: 'Best Seller',
    description: 'Ceremonial matcha blended with fresh strawberry purée and creamy milk.',
    image: '',
    available: true,
    isPopular: true,
    calories: 220,
    preparationTimeMinutes: 5
  },
  {
    id: 'prod-4',
    name: 'Matcha Mango',
    category: 'Matcha Fruit Series',
    price: 185.00,
    isFeatured: true,
    badge: "Chef's Special",
    description: 'Ripe mango purée swirled into smooth ceremonial matcha and milk.',
    image: '',
    available: true,
    isPopular: true,
    calories: 210,
    preparationTimeMinutes: 5
  },
  {
    id: 'prod-5',
    name: 'Matcha Blueberry',
    category: 'Matcha Fruit Series',
    price: 185.00,
    salePrice: 160.00,
    isOnSale: true,
    badge: 'Fresh Blend',
    description: 'Antioxidant-rich blueberry purée layered with ceremonial matcha.',
    image: '',
    available: true,
    isPopular: true,
    calories: 200,
    preparationTimeMinutes: 5
  },
  {
    id: 'prod-6',
    name: 'Matcha Avocado',
    category: 'Matcha Fruit Series',
    price: 195.00,
    isFeatured: true,
    badge: 'Creamy',
    description: 'Silky avocado blended with ceremonial matcha for a rich, creamy treat.',
    image: '',
    available: true,
    isPopular: true,
    calories: 260,
    preparationTimeMinutes: 6
  },
  {
    id: 'prod-7',
    name: 'Matcha Peach',
    category: 'Matcha Fruit Series',
    price: 185.00,
    salePrice: 155.00,
    isOnSale: true,
    badge: 'Seasonal',
    description: 'Sweet summer peach purée folded into ceremonial matcha and milk.',
    image: '',
    available: true,
    isPopular: false,
    calories: 200,
    preparationTimeMinutes: 5
  },
  {
    id: 'prod-8',
    name: 'Matcha Lychee',
    category: 'Matcha Fruit Series',
    price: 185.00,
    badge: 'Refreshing',
    description: 'Fragrant lychee blended with ceremonial matcha over ice.',
    image: '',
    available: true,
    isPopular: false,
    calories: 190,
    preparationTimeMinutes: 5
  },
  {
    id: 'prod-9',
    name: 'Matcha Strawberry Frappe',
    category: 'Matcha Frappes',
    price: 205.00,
    salePrice: 175.00,
    isOnSale: true,
    badge: 'Frozen',
    description: 'Frozen matcha-strawberry frappe topped with whipped cream.',
    image: '',
    available: true,
    isPopular: true,
    calories: 300,
    preparationTimeMinutes: 6
  },
  {
    id: 'prod-10',
    name: 'Matcha Oreo Frappe',
    category: 'Matcha Frappes',
    price: 205.00,
    salePrice: 175.00,
    isOnSale: true,
    badge: 'Frozen',
    description: 'Frozen ceremonial matcha blended with crushed cookies and cream.',
    image: '',
    available: true,
    isPopular: false,
    calories: 320,
    preparationTimeMinutes: 6
  }
];

// No demo/sample orders are seeded — the app starts with an empty order list.
export const INITIAL_ORDERS: Order[] = [];

// No demo notifications are seeded — the app starts with an empty notification list.
export const INITIAL_NOTIFICATIONS: AdminNotification[] = [];

export const generateMySQLDump = (): string => {
  return `-- ===================================================
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
('prod-1', 'Classic Uji Matcha Latte', 'Matcha Classics', 165.00, 'Ceremonial grade Uji matcha whisked with velvety steamed milk.', NULL, 1, 1, 180, 4),
('prod-2', 'Ceremonial Matcha Cold Foam', 'Matcha Classics', 175.00, 'Iced ceremonial matcha topped with barista sweet cream cold foam.', NULL, 1, 1, 160, 5),
('prod-3', 'Matcha Strawberry', 'Matcha Fruit Series', 185.00, 'Ceremonial matcha blended with fresh strawberry puree and creamy milk.', NULL, 1, 1, 220, 5),
('prod-4', 'Matcha Mango', 'Matcha Fruit Series', 185.00, 'Ripe mango puree swirled into smooth ceremonial matcha and milk.', NULL, 1, 1, 210, 5),
('prod-5', 'Matcha Blueberry', 'Matcha Fruit Series', 185.00, 'Antioxidant-rich blueberry puree layered with ceremonial matcha.', NULL, 1, 1, 200, 5),
('prod-6', 'Matcha Avocado', 'Matcha Fruit Series', 195.00, 'Silky avocado blended with ceremonial matcha for a rich, creamy treat.', NULL, 1, 1, 260, 6),
('prod-7', 'Matcha Peach', 'Matcha Fruit Series', 185.00, 'Sweet summer peach puree folded into ceremonial matcha and milk.', NULL, 1, 0, 200, 5),
('prod-8', 'Matcha Lychee', 'Matcha Fruit Series', 185.00, 'Fragrant lychee blended with ceremonial matcha over ice.', NULL, 1, 0, 190, 5),
('prod-9', 'Matcha Strawberry Frappe', 'Matcha Frappes', 205.00, 'Frozen matcha-strawberry frappe topped with whipped cream.', NULL, 1, 1, 300, 6),
('prod-10', 'Matcha Oreo Frappe', 'Matcha Frappes', 205.00, 'Frozen ceremonial matcha blended with crushed cookies and cream.', NULL, 1, 0, 320, 6);

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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
`;
};
