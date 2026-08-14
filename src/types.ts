export type Category = 'All' | 'Espresso & Coffee' | 'Cold Brew & Frappes' | 'Artisan Teas' | 'Pastries & Bakery' | 'Gourmet Paninis' | 'Desserts';

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  image: string;
  available: boolean;
  isPopular?: boolean;
  calories?: number;
  preparationTimeMinutes?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export type PaymentMethod = 'cash' | 'gcash' | 'maya' | 'card';

export type DeliveryType = 'delivery' | 'pickup';

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  ewalletNumber?: string;
  referenceNumber?: string;
}

export interface OrderItemRecord {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: OrderItemRecord[];
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  cancelledBy?: 'customer' | 'admin';
  deleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  topProducts: { name: string; count: number; totalSales: number }[];
}

// --- Authentication Types ---

export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Store credentials (in production, use a backend API)
export const CUSTOMER_CREDENTIALS = {
  username: 'customer',
  password: 'customer123',
};

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};
