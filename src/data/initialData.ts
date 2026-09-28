import { Product, Order, AdminNotification, StoreSettings } from '../types';
import { MATCHA_AVENUE_LOGO } from '../assets/logo';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Matcha Avenue Cafe',
  tagline: 'Artisan Matcha, Specialty Coffee & Gourmet Bakery',
  logoUrl: MATCHA_AVENUE_LOGO,
  heroBadgeText: 'Matcha Avenue Cafe Flagship • BGC High Street, Taguig City',
  heroHeadline: 'Ceremonial Matcha & Artisan Coffee',
  heroHeadlineHighlight: 'Delivered Fresh to Your Door',
  heroSubtitle: 'Savor authentic ceremonial Uji matcha, specialty espresso blends, slow-steeped cold brew, and fresh artisan French pastries with instant order dispatch.',
  heroAvgMinsText: '10-15',
  heroRatingText: '4.9 ★',
  heroQualityText: '100% Fresh',
  announcementActive: true,
  announcementBadge: 'SPECIAL MENU',
  announcementText: '🍵 Welcome to Matcha Avenue Cafe! Enjoy 20% OFF all Matcha & Cold Brew specials! Free delivery for orders ₱500+',
  announcementLinkText: 'Order Now',
  operatingHours: '7:00 AM – 10:00 PM Daily',
  storeAddress: '7th Ave & 28th St, Bonifacio High Street, BGC, Taguig City',
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
    'Ceremonial Matcha',
    'Espresso & Coffee',
    'Cold Brew & Frappes',
    'Artisan Teas',
    'Pastries & Bakery',
    'Gourmet Paninis',
    'Desserts'
  ],
  showFeaturedSection: true,
  showSaleSection: true,
  facebookUrl: 'https://www.facebook.com/profile.php?id=61592982062259',
  instagramUrl: 'https://instagram.com'
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Avenue Spanish Latte',
    category: 'Espresso & Coffee',
    price: 165.00,
    salePrice: 145.00,
    isOnSale: true,
    isFeatured: true,
    badge: 'Best Seller',
    description: 'Double shot espresso blend with velvety steamed milk and sweet condensed milk swirl.',
    image: '',
    available: true,
    isPopular: true,
    calories: 280,
    preparationTimeMinutes: 4
  },
  {
    id: 'prod-2',
    name: 'Vanilla Bean Cold Brew',
    category: 'Cold Brew & Frappes',
    price: 175.00,
    salePrice: 140.00,
    isOnSale: true,
    isFeatured: true,
    badge: '20% OFF',
    description: '18-hour steep dark roast cold brew topped with house-made vanilla bean cold foam.',
    image: '',
    available: true,
    isPopular: true,
    calories: 190,
    preparationTimeMinutes: 3
  },
  {
    id: 'prod-3',
    name: 'Iced Uji Cream Matcha',
    category: 'Artisan Teas',
    price: 185.00,
    isFeatured: true,
    badge: "Chef's Special",
    description: 'Ceremonial grade Uji matcha whisked with oat milk and sweet cream cold foam.',
    image: '',
    available: true,
    isPopular: true,
    calories: 220,
    preparationTimeMinutes: 5
  },
  {
    id: 'prod-4',
    name: 'Artisan Butter Croissant',
    category: 'Pastries & Bakery',
    price: 120.00,
    salePrice: 99.00,
    isOnSale: true,
    isFeatured: true,
    badge: 'Fresh Baked',
    description: 'Flaky, multi-layered French butter croissant freshly baked every morning.',
    image: '',
    available: true,
    isPopular: true,
    calories: 320,
    preparationTimeMinutes: 2
  },
  {
    id: 'prod-5',
    name: 'Smoked Turkey & Pesto Panini',
    category: 'Gourmet Paninis',
    price: 260.00,
    isFeatured: false,
    badge: 'Warm & Toasted',
    description: 'Smoked turkey breast, melted provolone, basil pesto, and sun-dried tomatoes on toasted sourdough.',
    image: '',
    available: true,
    isPopular: true,
    calories: 560,
    preparationTimeMinutes: 8
  },
  {
    id: 'prod-6',
    name: 'Basque Burnt Cheesecake',
    category: 'Desserts',
    price: 195.00,
    salePrice: 175.00,
    isOnSale: true,
    isFeatured: false,
    badge: 'Popular',
    description: 'Caramelized top cheesecake with a silky, molten cream center.',
    image: '',
    available: true,
    isPopular: false,
    calories: 410,
    preparationTimeMinutes: 2
  },
  {
    id: 'prod-7',
    name: 'Hazelnut Caramel Frappe',
    category: 'Cold Brew & Frappes',
    price: 190.00,
    salePrice: 155.00,
    isOnSale: true,
    isFeatured: false,
    badge: 'Special',
    description: 'Blended espresso with dark roasted hazelnut syrup, whipped cream, and caramel drizzle.',
    image: '',
    available: true,
    isPopular: false,
    calories: 420,
    preparationTimeMinutes: 5
  },
  {
    id: 'prod-8',
    name: 'Pain au Chocolat',
    category: 'Pastries & Bakery',
    price: 135.00,
    isFeatured: false,
    description: 'Warm French pastry stuffed with double dark Belgian chocolate batons.',
    image: '',
    available: true,
    isPopular: false,
    calories: 380,
    preparationTimeMinutes: 2
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-1001',
    customer: {
      name: 'Elena Rostova',
      phone: '09175550192',
      address: '742 Evergreen Terrace, Unit 4B, Makati City',
      notes: 'Please ring doorbell upon arrival.',
      ewalletNumber: '09175550192',
      referenceNumber: '10293847561'
    },
    items: [
      {
        productId: 'prod-1',
        productName: 'Avenue Spanish Latte',
        unitPrice: 165.00,
        quantity: 2,
        subtotal: 330.00,
        notes: 'Less sweet'
      },
      {
        productId: 'prod-4',
        productName: 'Artisan Butter Croissant',
        unitPrice: 120.00,
        quantity: 2,
        subtotal: 240.00,
        notes: 'Warmed'
      }
    ],
    deliveryType: 'delivery',
    paymentMethod: 'gcash',
    subtotal: 570.00,
    tax: 45.60,
    deliveryFee: 50.00,
    total: 665.60,
    status: 'preparing',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60000).toISOString()
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-1002',
    customer: {
      name: 'Alexander Wright',
      phone: '09201234567',
      address: '321 Ocean Avenue, BGC Taguig',
      notes: 'Pickup at counter',
      ewalletNumber: '09201234567',
      referenceNumber: '99887766554'
    },
    items: [
      {
        productId: 'prod-5',
        productName: 'Smoked Turkey & Pesto Panini',
        unitPrice: 260.00,
        quantity: 1,
        subtotal: 260.00
      },
      {
        productId: 'prod-2',
        productName: 'Vanilla Bean Cold Brew',
        unitPrice: 175.00,
        quantity: 1,
        subtotal: 175.00
      }
    ],
    deliveryType: 'pickup',
    paymentMethod: 'maya',
    subtotal: 435.00,
    tax: 34.80,
    deliveryFee: 0,
    total: 469.80,
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString()
  }
];

export const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'notif-1',
    orderId: 'ord-102',
    orderNumber: 'ORD-1002',
    customerName: 'Alexander Wright',
    totalAmount: 469.80,
    message: 'New order #ORD-1002 placed (₱469.80 via Maya)',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    read: false
  }
];

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
('prod-1', 'Avenue Spanish Latte', 'Espresso & Coffee', 165.00, 'Double shot espresso blend with sweet condensed milk swirl.', NULL, 1, 1, 280, 4),
('prod-2', 'Vanilla Bean Cold Brew', 'Cold Brew & Frappes', 175.00, '18-hour steep dark roast topped with vanilla cold foam.', NULL, 1, 1, 190, 3),
('prod-3', 'Iced Uji Cream Matcha', 'Artisan Teas', 185.00, 'Ceremonial grade Uji matcha whisked with oat milk.', NULL, 1, 1, 220, 5),
('prod-4', 'Artisan Butter Croissant', 'Pastries & Bakery', 120.00, 'Flaky French butter croissant freshly baked daily.', NULL, 1, 1, 320, 2),
('prod-5', 'Smoked Turkey & Pesto Panini', 'Gourmet Paninis', 260.00, 'Smoked turkey, provolone, and basil pesto on sourdough.', NULL, 1, 1, 560, 8),
('prod-6', 'Basque Burnt Cheesecake', 'Desserts', 195.00, 'Caramelized top cheesecake with molten cream center.', NULL, 1, 0, 410, 2);

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
`;
};
