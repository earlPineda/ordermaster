import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import net from 'net';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_NOTIFICATIONS, DEFAULT_STORE_SETTINGS } from './src/data/initialData.js';
import { generateSupabaseDump } from './src/data/supabaseSchema.js';
import { Product, Order, AdminNotification, OrderStatus, DashboardStats, CustomerProfile, StoreSettings, SalesReportSnapshot, OrderItemRecord } from './src/types.js';

const app = express();
const DEFAULT_PORT = 3000;
// Hosting platforms (e.g. Render) inject PORT - honour it so the service binds
// the port the platform proxies to. HOST is overridable for local testing.
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const HOST = process.env.HOST || '0.0.0.0';

/** Resolves to true when the given port can be bound on HOST. */
function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => tester.close(() => resolve(true)));
    tester.listen(port, HOST);
  });
}

/**
 * Uses the preferred port, or the next free one when it is already taken.
 * An explicitly provided PORT (production platforms) is always respected
 * exactly, because those platforms proxy traffic to that specific port.
 */
async function resolvePort(preferred: number): Promise<number> {
  if (process.env.PORT) return preferred;
  if (await isPortFree(preferred)) return preferred;
  for (let port = preferred + 1; port <= preferred + 20; port++) {
    if (await isPortFree(port)) {
      console.warn(`[server] Port ${preferred} is already in use - using ${port} instead.`);
      return port;
    }
  }
  return preferred;
}

app.use(express.json());

// Lazy-initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// ==========================================
// META AI & FACEBOOK MESSENGER STORE
// ==========================================
export interface MetaAiWebhookLog {
  id: string;
  timestamp: string;
  senderId: string;
  senderName?: string;
  messageText: string;
  replyText: string;
  status: 'replied' | 'delivered' | 'pending';
  orderCreated?: boolean;
  orderNumber?: string;
  orderTotal?: number;
  receiptText?: string;
}

export interface MessengerCartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  modifiersDescription?: string;
  notes?: string;
}

export interface MessengerSession {
  senderId: string;
  senderName: string;
  cart: MessengerCartItem[];
  customerInfo: {
    name?: string;
    phone?: string;
    address?: string;
    landmark?: string;
    deliveryType?: 'delivery' | 'pickup';
    paymentMethod?: 'cash' | 'gcash' | 'maya' | 'card';
    notes?: string;
  };
  state: 'browsing' | 'ordering' | 'ready_to_confirm' | 'confirmed';
  lastOrder?: Order;
  lastActive: number;
}

const messengerSessions = new Map<string, MessengerSession>();

const metaAiConfig = {
  pageId: '61592982062259',
  assetId: '61592982062259',
  selectedItemId: '61592982062259',
  businessSuiteInboxUrl: 'https://business.facebook.com/latest/inbox/all?asset_id=61592982062259&thread_type=FB_MESSAGE&mailbox_id=61592982062259',
  pageUrl: 'https://www.facebook.com/profile.php?id=61592982062259',
  messengerUrl: 'https://m.me/61592982062259',
  verifyToken: process.env.FB_VERIFY_TOKEN || 'matcha_avenue_meta_ai_secret_verify_token',
  autoReplyEnabled: true,
  autoOrderEnabled: true,
  sendAutomatedReceipt: true,
  aiModel: 'gemini-3.8-flash' as 'meta-llama-3-8b' | 'gemini-3.8-flash',
  customGreeting: "Hi! Welcome to Matcha Avenue Cafe via Meta AI & Facebook Messenger. How can I brew your day today? If you want to order, say 'menu' or tell me your order directly for automated delivery with instant receipt!"
};

let metaAiWebhookLogs: MetaAiWebhookLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    senderId: 'fb-user-99124',
    senderName: 'Maria Santos',
    messageText: 'Hello! Do you have oat milk for your iced Spanish latte?',
    replyText: 'Yes, Maria! We offer premium Barista-grade Oat Milk (+₱20) for our Iced Spanish Latte. Would you like to order one for delivery or store pickup?',
    status: 'replied'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    senderId: 'fb-user-88310',
    senderName: 'Carlo Mendoza',
    messageText: 'What are your store hours today?',
    replyText: 'Our Flagship Store is open daily from 7:00 AM – 10:00 PM! You can also order directly via our storefront link.',
    status: 'replied'
  }
];

// ==========================================
// IN-MEMORY DATABASE & REPORTING STORES
// ==========================================
let productsStore: Product[] = [...INITIAL_PRODUCTS];
let ordersStore: Order[] = [...INITIAL_ORDERS];
let notificationsStore: AdminNotification[] = [...INITIAL_NOTIFICATIONS];
let storeSettings: StoreSettings = { ...DEFAULT_STORE_SETTINGS };
let reportingSnapshotsStore: SalesReportSnapshot[] = [];
let orderSequence = 1003;

// User Account Model
export interface UserAccount {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  password?: string;
  avatar?: string;
  role: 'customer' | 'admin';
  gender?: string;
  birthDate?: string;
  address?: string;
  unitFloor?: string;
  landmark?: string;
  coordinates?: { lat: number; lng: number; label?: string };
  memberTier?: 'Standard' | 'Silver Barista Club' | 'Gold VIP';
  provider: 'local' | 'facebook' | 'google';
  createdAt: string;
}

// User Account Store (Starts clean, users register dynamically)
let usersStore: UserAccount[] = [
  {
    id: 'user-admin-01',
    name: 'Store Manager',
    firstName: 'Store',
    lastName: 'Manager',
    email: 'admin@avenuecafe.com',
    phone: '09190001111',
    password: 'avenuecafe2025',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&h=200&q=80',
    role: 'admin',
    provider: 'local',
    createdAt: new Date().toISOString()
  }
];

// Helper to generate next order number
const getNextOrderNumber = () => {
  const num = orderSequence++;
  return `ORD-${num}`;
};

// ==========================================
// AUTHENTICATION API ROUTES (Facebook-Style)
// ==========================================

// GET Recent / Saved Accounts (Empty by default until user creates one)
app.get('/api/auth/recent-users', (req: Request, res: Response) => {
  const customerUsers = usersStore
    .filter((u) => u.role === 'customer')
    .map((u) => ({
      id: u.id,
      name: u.name,
      firstName: u.firstName || u.name.split(' ')[0],
      email: u.email,
      phone: u.phone,
      avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=f59e0b&color=0f172a`,
      role: u.role,
      memberTier: u.memberTier || 'Standard',
      address: u.address || ''
    }));
  res.json({ success: true, users: customerUsers });
});

// POST Login (Email / Phone / Username + Password)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { emailOrPhone, username, password, role } = req.body;
  const identifier = (emailOrPhone || username || '').trim().toLowerCase();
  const pass = (password || '').trim();

  if (!identifier || !pass) {
    res.status(400).json({ success: false, message: 'Please enter your email/phone and password.' });
    return;
  }

  // Admin shortcut check
  if ((identifier === 'admin' || identifier === 'admin@matchaavenue.com' || identifier === 'admin@avenuecafe.com') && (pass === 'matcha2025' || pass === 'avenuecafe2025' || pass === 'admin')) {
    const adminUser = usersStore.find((u) => u.role === 'admin') || {
      id: 'admin-01',
      name: 'Matcha Avenue Cafe Manager',
      email: 'admin@matchaavenue.com',
      phone: '09190001111',
      role: 'admin' as const,
      provider: 'local' as const,
      createdAt: new Date().toISOString()
    };
    res.json({
      success: true,
      message: 'Admin authentication successful.',
      role: 'admin',
      token: `token-${Date.now()}`,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: 'admin',
        avatar: adminUser.avatar
      }
    });
    return;
  }

  // Find User by email or phone (ignoring spaces/dashes)
  const cleanPhone = identifier.replace(/\D/g, '');
  const user = usersStore.find((u) => {
    const uEmail = u.email.toLowerCase();
    const uPhone = u.phone.replace(/\D/g, '');
    return uEmail === identifier || (cleanPhone.length > 5 && uPhone.includes(cleanPhone)) || u.id === identifier;
  });

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'The email address or mobile number that you entered does not match an account. Create a new account below.'
    });
    return;
  }

  // Check Password
  const isValidPassword = user.password === pass;

  if (!isValidPassword) {
    res.status(401).json({
      success: false,
      message: 'The password that you have entered is incorrect. Forgotten password?'
    });
    return;
  }

  // Convert to clean CustomerProfile
  const profile: CustomerProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address || '7th Ave & 28th St, BGC High Street, Taguig',
    unitFloor: user.unitFloor,
    landmark: user.landmark,
    coordinates: user.coordinates || { lat: 14.5515, lng: 121.0510, label: user.address || 'Metro Manila' },
    avatar: user.avatar,
    memberTier: user.memberTier || 'Standard'
  };

  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    role: user.role,
    token: `session-${Date.now()}`,
    user: profile
  });
});

// POST Register (Create New Account - Facebook Style)
app.post('/api/auth/register', (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    name,
    emailOrPhone,
    email,
    phone,
    password,
    birthDate,
    gender,
    address,
    unitFloor,
    landmark,
    coordinates
  } = req.body;

  const fullName = (name || `${firstName || ''} ${lastName || ''}`).trim();
  const inputEmail = (email || (emailOrPhone?.includes('@') ? emailOrPhone : '')).trim();
  const inputPhone = (phone || (!emailOrPhone?.includes('@') ? emailOrPhone : '09170000000')).trim();

  if (!fullName) {
    res.status(400).json({ success: false, message: "What's your name? Please enter your first and last name." });
    return;
  }

  if (!inputEmail && !inputPhone) {
    res.status(400).json({ success: false, message: 'You must provide a valid email or mobile number.' });
    return;
  }

  if (!password || password.length < 4) {
    res.status(400).json({ success: false, message: 'Please choose a password with at least 4 characters.' });
    return;
  }

  // Check if user already exists
  const existing = usersStore.find(
    (u) =>
      (inputEmail && u.email.toLowerCase() === inputEmail.toLowerCase()) ||
      (inputPhone && u.phone.replace(/\D/g, '') === inputPhone.replace(/\D/g, ''))
  );

  if (existing) {
    res.status(409).json({
      success: false,
      message: 'An account already exists with this email or mobile number. Please log in instead.'
    });
    return;
  }

  const newId = `user-${Date.now()}`;
  const newUser: UserAccount = {
    id: newId,
    name: fullName,
    firstName: firstName || fullName.split(' ')[0],
    lastName: lastName || fullName.split(' ').slice(1).join(' '),
    email: inputEmail || `${newId}@avenuecafe.com`,
    phone: inputPhone || '+63 900 000 0000',
    password: password.trim(),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=f59e0b&color=0f172a&bold=true`,
    role: 'customer',
    gender: gender || 'Custom',
    birthDate: birthDate || '2000-01-01',
    address: address || 'Metro Manila, Philippines',
    unitFloor: unitFloor || '',
    landmark: landmark || '',
    coordinates: coordinates || { lat: 14.5515, lng: 121.0510, label: address || 'Metro Manila' },
    memberTier: 'Standard',
    provider: 'local',
    createdAt: new Date().toISOString()
  };

  usersStore.unshift(newUser);

  const profile: CustomerProfile = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    address: newUser.address,
    unitFloor: newUser.unitFloor,
    landmark: newUser.landmark,
    coordinates: newUser.coordinates,
    avatar: newUser.avatar,
    memberTier: newUser.memberTier
  };

  res.status(201).json({
    success: true,
    message: 'Account created successfully! Welcome to Avenue Café.',
    role: 'customer',
    token: `session-${Date.now()}`,
    user: profile
  });
});

// POST Social Auth (Continue with Facebook / Continue with Google)
app.post('/api/auth/social', (req: Request, res: Response) => {
  const { provider, name, email, avatar, socialId } = req.body;

  const socialProvider = provider === 'google' ? 'google' : 'facebook';
  const userEmail = (email || `${socialProvider}_${socialId || Date.now()}@social.avenuecafe.com`).toLowerCase();
  const userName = name || (socialProvider === 'facebook' ? 'Facebook User' : 'Google User');

  // Check if exists
  let user = usersStore.find((u) => u.email.toLowerCase() === userEmail);
  if (!user) {
    user = {
      id: `user-social-${Date.now()}`,
      name: userName,
      firstName: userName.split(' ')[0],
      lastName: userName.split(' ').slice(1).join(' '),
      email: userEmail,
      phone: '+63 917 555 8888',
      avatar: avatar || (socialProvider === 'facebook'
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80'
        : 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80'),
      role: 'customer',
      address: '7th Ave & 28th St, BGC, Taguig City',
      coordinates: { lat: 14.5515, lng: 121.0510, label: 'BGC Taguig' },
      memberTier: 'Gold VIP',
      provider: socialProvider,
      createdAt: new Date().toISOString()
    };
    usersStore.unshift(user);
  }

  const profile: CustomerProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    unitFloor: user.unitFloor,
    landmark: user.landmark,
    coordinates: user.coordinates,
    avatar: user.avatar,
    memberTier: user.memberTier || 'Gold VIP'
  };

  res.json({
    success: true,
    message: `Signed in with ${socialProvider === 'facebook' ? 'Facebook' : 'Google'}. Welcome, ${userName}!`,
    role: 'customer',
    token: `social-session-${Date.now()}`,
    user: profile
  });
});

// POST Forgot Password Reset
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { emailOrPhone, newPassword } = req.body;
  const identifier = (emailOrPhone || '').trim().toLowerCase();

  if (!identifier) {
    res.status(400).json({ success: false, message: 'Please enter your account email address or mobile number.' });
    return;
  }

  const cleanPhone = identifier.replace(/\D/g, '');
  const user = usersStore.find((u) => {
    const uEmail = u.email.toLowerCase();
    const uPhone = u.phone.replace(/\D/g, '');
    return uEmail === identifier || (cleanPhone.length > 5 && uPhone.includes(cleanPhone));
  });

  if (!user) {
    res.status(404).json({
      success: false,
      message: "No account found matching that identifier. Please check for spelling mistakes or create a new account."
    });
    return;
  }

  if (newPassword) {
    user.password = newPassword.trim();
    res.json({
      success: true,
      message: `Password has been reset successfully for ${user.name}! You may now log in with your new password.`
    });
    return;
  }

  // Generate security code preview
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  res.json({
    success: true,
    message: `We found your account (${user.name}). A 6-digit security code (${resetCode}) has been generated.`,
    userPreview: {
      name: user.name,
      maskedContact: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      resetCode
    }
  });
});

// ==========================================
// CORE CAFE REST API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET Menu / Products
app.get('/api/menu', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: productsStore
  });
});

// POST Add Menu Product (Admin)
app.post('/api/menu', (req: Request, res: Response) => {
  const {
    name,
    category,
    price,
    salePrice,
    isOnSale,
    isFeatured,
    badge,
    description,
    image,
    available,
    isPopular,
    calories,
    preparationTimeMinutes
  } = req.body;

  if (!name || !price || !category) {
    res.status(400).json({ success: false, message: 'Name, category, and price are required.' });
    return;
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: name.trim(),
    category: category.trim(),
    price: Number(price),
    salePrice: salePrice !== undefined && salePrice !== '' ? Number(salePrice) : undefined,
    isOnSale: Boolean(isOnSale),
    isFeatured: Boolean(isFeatured),
    badge: badge ? badge.trim() : undefined,
    description: description ? description.trim() : '',
    image: image ? image.trim() : '',
    available: available !== undefined ? Boolean(available) : true,
    isPopular: Boolean(isPopular),
    calories: calories ? Number(calories) : 250,
    preparationTimeMinutes: preparationTimeMinutes ? Number(preparationTimeMinutes) : 5
  };

  productsStore.unshift(newProduct);
  res.status(201).json({ success: true, data: newProduct });
});

// PUT Edit Menu Product (Admin)
app.put('/api/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = productsStore.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  const prev = productsStore[index];
  const isOnSale = req.body.isOnSale !== undefined ? Boolean(req.body.isOnSale) : prev.isOnSale;
  const salePrice = isOnSale && req.body.salePrice !== undefined && req.body.salePrice !== null && req.body.salePrice !== ''
    ? Number(req.body.salePrice)
    : undefined;

  let badge = req.body.badge !== undefined ? req.body.badge : prev.badge;
  if (!isOnSale && badge && (badge === 'ON SALE' || badge.includes('% OFF'))) {
    badge = undefined;
  }

  productsStore[index] = {
    ...prev,
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : prev.price,
    salePrice: salePrice,
    isOnSale: isOnSale,
    badge: badge && typeof badge === 'string' && badge.trim().length > 0 ? badge.trim() : undefined,
    isFeatured: req.body.isFeatured !== undefined ? Boolean(req.body.isFeatured) : prev.isFeatured,
    available: req.body.available !== undefined ? Boolean(req.body.available) : prev.available,
    isPopular: req.body.isPopular !== undefined ? Boolean(req.body.isPopular) : prev.isPopular,
    calories: req.body.calories !== undefined ? Number(req.body.calories) : prev.calories,
    preparationTimeMinutes: req.body.preparationTimeMinutes !== undefined ? Number(req.body.preparationTimeMinutes) : prev.preparationTimeMinutes
  };

  res.json({ success: true, data: productsStore[index] });
});

// POST Reset Discounts (All, by Category, or by Product ID)
app.post('/api/menu/reset-discounts', (req: Request, res: Response) => {
  const { category, productId, productIds } = req.body;

  let count = 0;
  productsStore = productsStore.map((p) => {
    let matches = false;
    if (productId && p.id === productId) matches = true;
    else if (Array.isArray(productIds) && productIds.includes(p.id)) matches = true;
    else if (category && category !== 'All' && p.category === category) matches = true;
    else if (!category || category === 'All') matches = true;

    if (matches && (p.isOnSale || p.salePrice)) {
      count++;
      return {
        ...p,
        isOnSale: false,
        salePrice: undefined,
        badge: p.badge === 'ON SALE' || p.badge?.includes('% OFF') ? undefined : p.badge
      };
    }
    return p;
  });

  res.json({ success: true, message: `Reset discounts on ${count} items.`, data: productsStore });
});

// POST Batch Apply Discount Percentage
app.post('/api/menu/apply-batch-discount', (req: Request, res: Response) => {
  const { category = 'All', discountPercent = 15, productIds } = req.body;
  const pct = Math.max(1, Math.min(99, Number(discountPercent) || 15));

  let count = 0;
  productsStore = productsStore.map((p) => {
    let matches = false;
    if (Array.isArray(productIds) && productIds.includes(p.id)) matches = true;
    else if (category && category !== 'All' && p.category === category) matches = true;
    else if (!category || category === 'All') matches = true;

    if (matches) {
      count++;
      const discounted = Math.round(p.price * (1 - pct / 100));
      return {
        ...p,
        isOnSale: true,
        salePrice: discounted,
        badge: `${pct}% OFF`
      };
    }
    return p;
  });

  res.json({ success: true, message: `Applied ${pct}% discount to ${count} items.`, data: productsStore });
});

// DELETE Menu Product (Admin)
app.delete('/api/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = productsStore.length;
  productsStore = productsStore.filter((p) => p.id !== id);

  if (productsStore.length === initialLen) {
    res.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  res.json({ success: true, message: 'Product deleted successfully.' });
});

// ==========================================
// STORE SETTINGS & UI CUSTOMIZATION API
// ==========================================

// GET Store Settings (Public & Admin)
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: storeSettings
  });
});

// PUT Update Store Settings (Admin)
app.put('/api/settings', (req: Request, res: Response) => {
  storeSettings = {
    ...storeSettings,
    ...req.body
  };
  res.json({
    success: true,
    message: 'Storefront and Customer UI settings updated successfully!',
    data: storeSettings
  });
});

// POST Reset Store Settings to Defaults (Admin)
app.post('/api/settings/reset', (req: Request, res: Response) => {
  storeSettings = { ...DEFAULT_STORE_SETTINGS };
  res.json({
    success: true,
    message: 'Store settings reset to factory defaults.',
    data: storeSettings
  });
});

// GET All Orders
app.get('/api/orders', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: ordersStore
  });
});

// GET Single Order Details (for order tracking)
app.get('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = ordersStore.find((o) => o.id === id || o.orderNumber.toUpperCase() === id.toUpperCase());

  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }

  res.json({ success: true, data: order });
});

// POST Create Order (Customer Ordering)
app.post('/api/orders', (req: Request, res: Response) => {
  const { customer, items, deliveryType, pickupTime, paymentMethod, subtotal, tax, deliveryFee, total } = req.body;

  if (!customer || !customer.name || !customer.phone || !items || items.length === 0) {
    res.status(400).json({ success: false, message: 'Invalid order details. Customer name, phone, and items are required.' });
    return;
  }

  const orderId = `ord-${Date.now()}`;
  const orderNum = getNextOrderNumber();
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: orderId,
    orderNumber: orderNum,
    customer,
    items,
    deliveryType: deliveryType || 'delivery',
    pickupTime: deliveryType === 'pickup' ? (pickupTime || 'ASAP (~15-20 mins)') : undefined,
    pickupStatus: deliveryType === 'pickup' ? 'scheduled' : undefined,
    pickupHistory: [],
    paymentMethod: paymentMethod || 'cash',
    subtotal: Number(subtotal),
    tax: Number(tax),
    deliveryFee: Number(deliveryFee),
    total: Number(total),
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };

  ordersStore.unshift(newOrder);

  // Trigger Admin Notification
  const notifMsg = deliveryType === 'pickup'
    ? `☕ New Store Pick-up #${orderNum} (${pickupTime || 'ASAP'}) by ${customer.name} (₱${Number(total).toFixed(2)})`
    : `🛵 New Delivery #${orderNum} by ${customer.name} (₱${Number(total).toFixed(2)})`;

  const notification: AdminNotification = {
    id: `notif-${Date.now()}`,
    orderId,
    orderNumber: orderNum,
    customerName: customer.name,
    totalAmount: Number(total),
    message: notifMsg,
    createdAt: now,
    read: false
  };

  notificationsStore.unshift(notification);

  res.status(201).json({
    success: true,
    data: newOrder,
    notification
  });
});

// PATCH Reschedule Pick-up Time (When customer missed or needs later pickup)
app.patch('/api/orders/:id/reschedule-pickup', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPickupTime, reason } = req.body;

  if (!newPickupTime) {
    res.status(400).json({ success: false, message: 'New pickup time is required.' });
    return;
  }

  const order = ordersStore.find((o) => o.id === id || o.id.toLowerCase() === id.toLowerCase() || o.orderNumber.toUpperCase() === id.toUpperCase());
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }

  const previousTime = order.pickupTime || 'Previous Slot';
  const now = new Date().toISOString();

  if (!order.pickupHistory) {
    order.pickupHistory = [];
  }

  order.pickupHistory.push({
    previousTime,
    newTime: newPickupTime,
    reason: reason || 'Customer requested later pickup time',
    requestedAt: now
  });

  order.pickupTime = newPickupTime;
  order.pickupStatus = 'rescheduled';
  order.updatedAt = now;

  // Notify Kitchen / Admin
  const notification: AdminNotification = {
    id: `notif-${Date.now()}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    totalAmount: order.total,
    message: `⏰ Pick-up Rescheduled: Order #${order.orderNumber} updated to ${newPickupTime} (${order.customer.name})`,
    createdAt: now,
    read: false
  };

  notificationsStore.unshift(notification);

  res.json({
    success: true,
    message: `Pick-up time updated to ${newPickupTime}! The kitchen has been notified.`,
    data: order,
    notification
  });
});

// PATCH Customer Cancel Order ("Cancel My Order")
app.post('/api/orders/:id/cancel-by-customer', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = ordersStore.find((o) => o.id === id || o.id.toLowerCase() === id.toLowerCase() || o.orderNumber.toUpperCase() === id.toUpperCase());
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }

  if (order.status === 'delivered') {
    res.status(400).json({ success: false, message: 'Delivered orders cannot be cancelled.' });
    return;
  }

  const now = new Date().toISOString();
  order.status = 'cancelled';
  order.cancelledBy = 'customer';
  order.cancellationReason = reason || 'Cancelled by customer via Live Order Tracker';
  order.cancelledAt = now;
  order.updatedAt = now;

  // Mark all pending notifications for this order as resolved and read
  notificationsStore.forEach((n) => {
    if (n.orderId === order.id || n.orderNumber === order.orderNumber) {
      n.resolved = true;
      n.read = true;
      n.resolvedReason = 'Cancelled by Customer';
    }
  });

  // Create real-time Admin Notice of cancellation
  const notification: AdminNotification = {
    id: `notif-${Date.now()}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    totalAmount: order.total,
    message: `❌ Order Cancelled: ${order.customer.name} cancelled #${order.orderNumber} (${order.cancellationReason})`,
    createdAt: now,
    read: false,
    resolved: true,
    resolvedReason: 'Order Cancelled',
    orderStatus: 'cancelled'
  };

  notificationsStore.unshift(notification);

  res.json({
    success: true,
    message: `Order #${order.orderNumber} has been successfully cancelled.`,
    data: order,
    notification
  });
});

// PATCH Update Order Status (Admin Dashboard)
app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: OrderStatus };

  const order = ordersStore.find((o) => o.id === id || o.id.toLowerCase() === id.toLowerCase() || o.orderNumber.toUpperCase() === id.toUpperCase());
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  if (status === 'cancelled') {
    order.cancelledBy = 'admin';
    order.cancellationReason = 'Cancelled by store manager';
    order.cancelledAt = new Date().toISOString();

    // Mark previous notifications for this order as resolved
    notificationsStore.forEach((n) => {
      if (n.orderId === order.id || n.orderNumber === order.orderNumber) {
        n.resolved = true;
        n.read = true;
      }
    });
  } else if (status === 'delivered') {
    order.customerReceived = true;
    order.customerReceivedAt = new Date().toISOString();
    notificationsStore.forEach((n) => {
      if (n.orderId === order.id || n.orderNumber === order.orderNumber) {
        n.resolved = true;
        n.read = true;
      }
    });
  }

  res.json({ success: true, data: order });
});

// PATCH Customer Confirm Order Received ("I already received my order")
app.patch('/api/orders/:id/confirm-receipt', (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;

  const order = ordersStore.find((o) => o.id === id || o.id.toLowerCase() === id.toLowerCase() || o.orderNumber.toUpperCase() === id.toUpperCase());
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }

  const now = new Date().toISOString();
  order.customerReceived = true;
  order.customerReceivedAt = now;
  order.status = 'delivered';
  if (order.deliveryType === 'pickup') {
    order.pickupStatus = 'picked_up';
  }
  if (rating !== undefined) {
    order.customerRating = Number(rating);
  }
  if (feedback) {
    order.customerFeedback = String(feedback);
  }
  order.updatedAt = now;

  // Resolve pending alerts for this order
  notificationsStore.forEach((n) => {
    if (n.orderId === order.id || n.orderNumber === order.orderNumber) {
      n.resolved = true;
      n.read = true;
      n.resolvedReason = 'Customer Confirmed Received';
    }
  });

  // Create real-time Admin Notification
  const isPickup = order.deliveryType === 'pickup';
  const notification: AdminNotification = {
    id: `notif-${Date.now()}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    totalAmount: order.total,
    message: isPickup
      ? `🛍️ Order Claimed & Received: ${order.customer.name} picked up #${order.orderNumber}!`
      : `✅ Order Delivered & Received: ${order.customer.name} confirmed receipt of #${order.orderNumber}!`,
    createdAt: now,
    read: false,
    resolved: true,
    resolvedReason: 'Order Delivered & Received',
    orderStatus: 'delivered'
  };

  notificationsStore.unshift(notification);

  res.json({
    success: true,
    message: 'Thank you! Your order receipt has been confirmed.',
    data: order,
    notification
  });
});

// DELETE Order (Admin action to delete delivered, received, or cancelled order record)
app.delete('/api/orders/:id', (req: Request, res: Response) => {
  const rawId = req.params.id || '';
  const decodedId = decodeURIComponent(rawId).trim();
  const idLower = decodedId.toLowerCase();
  const idUpper = decodedId.toUpperCase();

  const targetOrder = ordersStore.find(
    (o) => o.id === decodedId || o.id.toLowerCase() === idLower || o.orderNumber.toUpperCase() === idUpper || o.orderNumber === decodedId
  );

  ordersStore = ordersStore.filter(
    (o) => o.id !== decodedId && o.id.toLowerCase() !== idLower && o.orderNumber.toUpperCase() !== idUpper && o.orderNumber !== decodedId
  );

  if (targetOrder) {
    // Also remove notifications related to this deleted order
    notificationsStore = notificationsStore.filter(
      (n) => n.orderId !== targetOrder.id && n.orderNumber !== targetOrder.orderNumber
    );
  }

  res.json({ success: true, message: 'Order record deleted successfully.', data: ordersStore });
});

// POST Bulk Delete Orders
app.post('/api/orders/bulk-delete', (req: Request, res: Response) => {
  const { ids } = req.body;
  if (Array.isArray(ids) && ids.length > 0) {
    const idSet = new Set(ids.map((i: string) => String(i).toLowerCase()));
    ordersStore = ordersStore.filter((o) => !idSet.has(o.id.toLowerCase()) && !idSet.has(o.orderNumber.toLowerCase()));
    notificationsStore = notificationsStore.filter((n) => !idSet.has(n.orderId?.toLowerCase() || '') && !idSet.has(n.orderNumber?.toLowerCase() || ''));
  }
  res.json({ success: true, message: 'Orders deleted successfully.', data: ordersStore });
});

// GET Admin Notifications (Order Alerts)
app.get('/api/notifications', (req: Request, res: Response) => {
  // Only count unread and unresolved notifications towards active badge alerts
  const unreadCount = notificationsStore.filter((n) => !n.read && !n.resolved).length;
  res.json({
    success: true,
    data: notificationsStore,
    unreadCount
  });
});

// POST Mark Notifications as Read
app.post('/api/notifications/read', (req: Request, res: Response) => {
  const { id } = req.body;
  if (id) {
    const notif = notificationsStore.find((n) => n.id === id);
    if (notif) notif.read = true;
  } else {
    notificationsStore.forEach((n) => (n.read = true));
  }
  res.json({ success: true, message: 'Notifications updated.' });
});

// GET Admin Dashboard Analytics & Reporting Metrics
app.get('/api/admin/stats', (req: Request, res: Response) => {
  // Exclude cancelled orders from valid sales revenue and total valid orders count!
  const validOrders = ordersStore.filter((o) => o.status !== 'cancelled');
  const cancelledOrders = ordersStore.filter((o) => o.status === 'cancelled');

  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = validOrders.length; // strictly excludes cancelled orders
  const pendingOrders = ordersStore.filter(
    (o) => (o.status === 'pending' || o.status === 'preparing') && !o.customerReceived
  ).length;
  const completedOrders = ordersStore.filter((o) => o.status === 'delivered' || o.customerReceived).length;
  const cancelledCount = cancelledOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Aggregate product sales only from valid orders
  const productSalesMap: { [name: string]: { count: number; totalSales: number } } = {};
  validOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!productSalesMap[item.productName]) {
        productSalesMap[item.productName] = { count: 0, totalSales: 0 };
      }
      productSalesMap[item.productName].count += item.quantity;
      productSalesMap[item.productName].totalSales += item.subtotal;
    });
  });

  const topProducts = Object.keys(productSalesMap)
    .map((name) => ({
      name,
      count: productSalesMap[name].count,
      totalSales: productSalesMap[name].totalSales
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const stats: DashboardStats = {
    totalRevenue,
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders: cancelledCount,
    averageOrderValue,
    topProducts
  };

  res.json({ success: true, data: stats });
});

// ==========================================
// DATA STORAGE FOR REPORTING API
// ==========================================

// GET Reporting Snapshots
app.get('/api/reporting/snapshots', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: reportingSnapshotsStore
  });
});

// POST Save New Reporting Snapshot
app.post('/api/reporting/snapshots', (req: Request, res: Response) => {
  const snapshot: SalesReportSnapshot = req.body;
  if (!snapshot || !snapshot.id) {
    res.status(400).json({ success: false, message: 'Invalid snapshot payload.' });
    return;
  }
  reportingSnapshotsStore.unshift(snapshot);
  if (reportingSnapshotsStore.length > 50) {
    reportingSnapshotsStore = reportingSnapshotsStore.slice(0, 50);
  }
  res.status(201).json({ success: true, data: snapshot });
});

// DELETE Reporting Snapshot
app.delete('/api/reporting/snapshots/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  reportingSnapshotsStore = reportingSnapshotsStore.filter((s) => s.id !== id);
  res.json({ success: true, message: 'Snapshot removed.' });
});

// ==========================================
// SUPABASE DATABASE EXPORT & SCHEMA DUMP
// ==========================================

// GET Supabase PostgreSQL SQL DDL Dump
app.get('/api/supabase/export-sql', (req: Request, res: Response) => {
  const sqlDump = generateSupabaseDump();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="avenue_cafe_supabase_schema.sql"');
  res.send(sqlDump);
});

// Backward compatibility for /api/export-sql
app.get('/api/export-sql', (req: Request, res: Response) => {
  const sqlDump = generateSupabaseDump();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="avenue_cafe_supabase_schema.sql"');
  res.send(sqlDump);
});

// ==========================================
// META AI & FACEBOOK MESSENGER API ROUTES
// Facebook Page: https://www.facebook.com/profile.php?id=61592982062259
// ==========================================

// Helper: Dispatch Real Reply via Meta Facebook Graph Send API
async function sendFacebookMessengerReply(recipientId: string, text: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) {
    console.log(`[Meta AI Messenger] FB_PAGE_ACCESS_TOKEN not configured; simulated reply logged for recipient ${recipientId}`);
    return { success: false, error: 'FB_PAGE_ACCESS_TOKEN not configured in environment' };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { text }
      })
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`[Meta AI Messenger] Graph API reply sent successfully to ${recipientId}:`, data);
      return { success: true, data };
    } else {
      console.error(`[Meta AI Messenger] Graph API error sending to ${recipientId}:`, data);
      return { success: false, error: data?.error?.message || 'Meta Graph API error' };
    }
  } catch (err: any) {
    console.error(`[Meta AI Messenger] Network error sending to ${recipientId}:`, err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

// Helper: Generate Full Categorized Shop Menu for Messenger
function generateFullShopMenuText(): string {
  const categoriesMap = new Map<string, Product[]>();
  for (const prod of productsStore) {
    if (!categoriesMap.has(prod.category)) {
      categoriesMap.set(prod.category, []);
    }
    categoriesMap.get(prod.category)!.push(prod);
  }

  let text = `☕ ━━━━━━━━━━━━━━━━━━━━━━
    AVENUE CAFÉ & ROASTERY
      Official Store Menu
━━━━━━━━━━━━━━━━━━━━━━\n`;

  for (const [category, items] of categoriesMap.entries()) {
    text += `\n【 ${category.toUpperCase()} 】\n`;
    for (const item of items) {
      const priceText = item.isOnSale && item.salePrice
        ? `₱${item.salePrice.toFixed(2)} (Promo, was ₱${item.price.toFixed(2)})`
        : `₱${item.price.toFixed(2)}`;
      const badgeText = item.badge ? ` ★ ${item.badge}` : '';
      text += `• ${item.name} — ${priceText}${badgeText}\n  └ ${item.description}\n`;
    }
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━
✨ CUSTOMIZATIONS AVAILABLE:
• Milk Options: Barista Oat Milk (+₱20), Almond Milk (+₱20), Whole Dairy
• Sweetness: 100% Regular, 50% Less Sweet, 0% Unsweetened
• Temp: Refreshing Iced with Cold Foam or Steamed Hot

🛵 DELIVERY & PAYMENT:
• Metro Manila Courier Delivery: ₱50 (FREE for orders ₱500+)
• Store Pickup: Ready in 10-15 mins at BGC High Street
• Payment Options: Cash on Delivery (COD), GCash, Maya E-Wallet

👉 HOW TO ORDER DIRECTLY:
Simply reply with your order right here in one message!
For example:
"Order 2 Avenue Spanish Latte with oat milk and 1 Artisan Butter Croissant. Deliver to Unit 12B Two Serendra BGC. Phone: 09171234567. COD."

Our automated engine will immediately log your ticket to the barista kitchen and send your official automated receipt right here on Messenger! 🧾☕`;

  return text;
}

// Helper: Format Official Automated Messenger Receipt
function generateAutomatedMessengerReceipt(order: Order, baseUrl = ''): string {
  const dateFormatted = new Date(order.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const paymentLabel = order.paymentMethod === 'cash'
    ? 'Cash on Delivery (COD)'
    : order.paymentMethod === 'gcash'
    ? 'GCash E-Wallet'
    : order.paymentMethod === 'maya'
    ? 'Maya E-Wallet'
    : order.paymentMethod === 'card'
    ? 'Credit / Debit Card'
    : 'Cash on Delivery (COD)';

  const trackingUrl = baseUrl ? `${baseUrl}/?track=${order.id}` : `${metaAiConfig.messengerUrl}?ref=order_${order.orderNumber}`;

  const itemsList = order.items.map((it) => {
    let line = `• ${it.quantity}x ${it.productName} @ ₱${it.unitPrice.toFixed(2)} = ₱${it.subtotal.toFixed(2)}`;
    if (it.modifiersDescription) {
      line += `\n    └ ${it.modifiersDescription}`;
    }
    if (it.notes) {
      line += `\n    └ Note: ${it.notes}`;
    }
    return line;
  }).join('\n');

  let gcashNotes = '';
  if (order.paymentMethod === 'gcash') {
    gcashNotes = `\n💳 GCASH PAYMENT DETAILS:\n• Account Number: ${storeSettings.merchantGcashNumber}\n• Account Name: ${storeSettings.merchantGcashName}\n• Please reply here on Messenger with your GCash payment reference/screenshot!\n`;
  }

  return `🧾 ━━━━━━━━━━━━━━━━━━━━━━
    MATCHA AVENUE CAFE
  Official Facebook Messenger Receipt
━━━━━━━━━━━━━━━━━━━━━━
Order Reference: #${order.orderNumber}
Date & Time: ${dateFormatted}
Channel: Facebook Page Messenger Auto-Order

👤 CUSTOMER INFORMATION:
• Name: ${order.customer.name}
• Contact: ${order.customer.phone}
• Order Type: ${order.deliveryType === 'pickup' ? '🏪 Store Pick-up' : '🛵 Doorstep Delivery'}
${order.deliveryType === 'delivery' && order.customer.address ? `• Delivery Address: ${order.customer.address}\n` : ''}${order.customer.landmark ? `• Landmark: ${order.customer.landmark}\n` : ''}${order.pickupTime ? `• Scheduled Pick-up: ${order.pickupTime}\n` : ''}
🍵 ORDERED ITEMS:
----------------------------------------
${itemsList}
----------------------------------------
Subtotal: ₱${order.subtotal.toFixed(2)}
${order.deliveryType === 'delivery' ? `Delivery Fee: ₱${order.deliveryFee.toFixed(2)} (${order.deliveryFee === 0 ? 'FREE Promo' : 'Standard Courier'})\n` : ''}TOTAL AMOUNT PAYABLE: ₱${order.total.toFixed(2)}

💳 Payment Method: ${paymentLabel}${gcashNotes}
⏱️ Est. Preparation & Delivery: ${order.deliveryType === 'pickup' ? '10-15 mins' : '20-30 mins'}
📍 Live Order Tracking:
${trackingUrl}

✨ Your order has been automatically received by our kitchen! You will receive live status updates right here on Messenger. Thank you for choosing Matcha Avenue Cafe! 🍵
━━━━━━━━━━━━━━━━━━━━━━`;
}

// Interface for Messenger Processing Result
export interface MessengerProcessingResult {
  reply: string;
  matchedProducts: Product[];
  source: string;
  isOrderCreated: boolean;
  order?: Order;
  receiptText?: string;
  sessionCart?: MessengerCartItem[];
  orderStatus?: 'browsing' | 'ordering' | 'ready_to_confirm' | 'confirmed';
  log?: MetaAiWebhookLog;
}

// Helper: Master Automated Barista & Messenger Order Engine
async function processMessengerMessage(params: {
  senderId: string;
  senderName?: string;
  userQuery: string;
  history?: Array<{ sender: string; text: string }>;
  modelPreference?: string;
  baseUrl?: string;
}): Promise<MessengerProcessingResult> {
  const {
    senderId,
    senderName = 'Facebook Guest',
    userQuery,
    history = [],
    modelPreference,
    baseUrl = ''
  } = params;

  const query = (userQuery || '').trim();
  const lower = query.toLowerCase();

  // Retrieve or initialize session
  let session = messengerSessions.get(senderId);
  if (!session) {
    session = {
      senderId,
      senderName,
      cart: [],
      customerInfo: {
        name: senderName !== 'Facebook Guest' ? senderName : undefined,
        deliveryType: 'delivery',
        paymentMethod: 'cash'
      },
      state: 'browsing',
      lastActive: Date.now()
    };
    messengerSessions.set(senderId, session);
  }
  session.lastActive = Date.now();
  if (senderName && senderName !== 'Facebook Guest' && !session.customerInfo.name) {
    session.customerInfo.name = senderName;
  }

  // 1. Check for Reset / Cancel commands
  if (lower === 'cancel' || lower === 'clear' || lower === 'reset' || lower === 'clear cart' || lower === 'start over') {
    session.cart = [];
    session.state = 'browsing';
    return {
      reply: `Your ordering cart has been cleared. 🛒 Welcome back! Feel free to ask about our specialty drinks, artisan bakery, or tell me what you'd like to order!`,
      matchedProducts: productsStore.filter((p) => p.isPopular).slice(0, 2),
      source: 'meta-ai-system',
      isOrderCreated: false,
      sessionCart: []
    };
  }

  // 2. Check for Receipt Inquiry on Previous Order
  if ((lower.includes('receipt') || lower.includes('resibo') || lower.includes('my order') || lower.includes('track')) && !lower.includes('order 2') && !lower.includes('order 1')) {
    if (session.lastOrder) {
      const receipt = generateAutomatedMessengerReceipt(session.lastOrder, baseUrl);
      return {
        reply: `Here is your official automated Messenger receipt for Order #${session.lastOrder.orderNumber}:\n\n${receipt}`,
        matchedProducts: [],
        source: 'meta-ai-receipt',
        isOrderCreated: false,
        order: session.lastOrder,
        receiptText: receipt
      };
    }
  }

  // Prepare Menu Catalog String for AI Engine
  const menuCatalog = productsStore
    .map((p) => `- ${p.name} (Price: ₱${p.isOnSale && p.salePrice ? p.salePrice : p.price}, Category: ${p.category}${p.badge ? `, Badge: ${p.badge}` : ''}): ${p.description}`)
    .join('\n');

  const isAskingForMenu =
    lower.includes('menu') ||
    lower.includes('patingin') ||
    lower.includes('ano menu') ||
    lower.includes('anong menu') ||
    lower.includes('what do you have') ||
    lower.includes('what do you sell') ||
    lower.includes('anong tinda') ||
    lower.includes('anong meron') ||
    lower.includes('list of') ||
    lower.includes('drinks list') ||
    lower.includes('coffee list') ||
    lower.includes('catalog') ||
    lower.includes('available drinks') ||
    lower.includes('available food');

  const isExpressingOrderIntent =
    lower.includes('want to order') ||
    lower.includes('gusto ko umorder') ||
    lower.includes('gusto kong umorder') ||
    lower.includes('order po') ||
    lower.includes('pa-order') ||
    lower.includes('pa order') ||
    lower.includes('can i order') ||
    lower.includes('how to order') ||
    lower.includes('order please') ||
    lower.includes('order here') ||
    lower.includes('pwede ba umorder') ||
    lower.includes('mag-order') ||
    lower.trim() === 'order' ||
    lower.trim() === 'order now';

  let detectedItems: Array<{ productName: string; quantity: number; modifiers?: string; priceDelta?: number }> = [];
  let detectedCustomer: { name?: string; phone?: string; address?: string; deliveryType?: 'delivery' | 'pickup'; paymentMethod?: 'cash' | 'gcash' | 'maya'; notes?: string } = {};
  let shouldFinalize = false;
  let aiMessage = '';
  let usedSource = 'meta-ai-llama';

  // Try Gemini 3.8 Flash if key is present
  const ai = getGeminiClient();
  if (ai && modelPreference !== 'meta-llama-3-8b') {
    try {
      const historyContext = history.slice(-4).map((h) => `${h.sender === 'user' ? 'Customer' : 'Barista'}: ${h.text}`).join('\n');
      const currentCartSummary = session.cart.length > 0
        ? session.cart.map((c) => `${c.quantity}x ${c.productName} (₱${c.subtotal})`).join(', ')
        : 'Empty';

      const prompt = `You are the official Meta AI Barista & Automated Ordering Assistant for Matcha Avenue Cafe's Facebook Page (ID: ${metaAiConfig.pageId}, Page: ${metaAiConfig.pageUrl}).
Store hours: 7:00 AM – 10:00 PM daily.
Location: 7th Ave & 28th St, BGC High Street, Taguig.
Currency: Philippine Pesos (₱).
Standard Delivery Fee: ₱50 (FREE for orders ₱500 and above across Metro Manila).
Payment Methods: Cash on Delivery (COD), GCash (0917-888-2233), Maya.
Dietary/Allergens: Ceremonial Grade Uji Matcha, Barista-grade Oat Milk (+₱20), Almond Milk (+₱20), Whole Milk, Sweetness choices (100% regular, 50% less sweet, 0% unsweetened), Decaf options available.
WiFi: Free guest WiFi for dine-in guests (Network: MatchaAvenueGuest).

Menu Catalog:
${menuCatalog}

Customer Session Context:
Sender Name: "${session.senderName}"
Current Cart: ${currentCartSummary}
Customer Details Recorded So Far: Name=${session.customerInfo.name || 'Not set'}, Phone=${session.customerInfo.phone || 'Not set'}, Address=${session.customerInfo.address || 'Not set'}, DeliveryType=${session.customerInfo.deliveryType || 'delivery'}, Payment=${session.customerInfo.paymentMethod || 'cash'}

${historyContext ? `Recent conversation:\n${historyContext}\n` : ''}
Incoming message: "${query}"

CRITICAL INSTRUCTIONS:
1. Understand and accurately answer ANYTHING the customer says, in English, Filipino/Tagalog, or Taglish.
2. If the customer expresses intent to order without naming specific items yet (e.g., "I want to order", "order po", "how to order", "can I order", "pa-order") OR explicitly asks for the menu (e.g., "menu", "patingin ng menu", "what do you have", "what do you sell"):
   Set intent to "show_menu". The system will directly show the complete shop menu and prices!
3. If they mention specific items to order (e.g., "Spanish Latte", "Butter Croissant", "Cold Brew", "Dalawang Spanish latte"), extract the matching menu item name, quantity, and customizations (oat milk, less sweet, hot, iced, etc.).
4. If they provide customer details (name, contact phone, delivery address or pickup request, payment method), extract them into detectedCustomer.
5. Determine if the customer is confirming or completing their order (e.g. provided items + address/phone, or said "confirm", "place order", "order na", "yes", "proceed").
6. Write a warm, polite barista response:
   - If general inquiry: answer accurately with factual details and suggest relevant menu items.
   - If ordering items: state what was added, show the subtotal, and if missing delivery address or phone, warmly ask for them.
   - If confirming: thank them and state their automated receipt is being issued immediately!

You MUST reply with STRICT JSON in this exact structure:
{
  "intent": "inquiry" | "show_menu" | "order" | "provide_info" | "confirm" | "cancel",
  "detectedItems": [
    {
      "productName": "Avenue Spanish Latte",
      "quantity": 2,
      "modifiers": "Barista Oat Milk (+₱20), 50% Sweet"
    }
  ],
  "detectedCustomer": {
    "name": "Customer Name or null",
    "phone": "09171234567 or null",
    "address": "Delivery Address or null",
    "deliveryType": "delivery" | "pickup" | null,
    "paymentMethod": "cash" | "gcash" | "maya" | null
  },
  "shouldFinalize": true or false,
  "baristaMessage": "Warm, polite barista response..."
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = res.text || '';
      const parsed = JSON.parse(responseText);

      if (parsed) {
        if (Array.isArray(parsed.detectedItems)) detectedItems = parsed.detectedItems;
        if (parsed.detectedCustomer) detectedCustomer = parsed.detectedCustomer;
        if (typeof parsed.shouldFinalize === 'boolean') shouldFinalize = parsed.shouldFinalize;
        if (parsed.baristaMessage) aiMessage = parsed.baristaMessage;
        usedSource = 'meta-ai-gemini';
      }
    } catch (err) {
      console.warn('Gemini ordering parser error, falling back to heuristic engine:', err);
    }
  }

  // 3. Heuristic Rule-Based Fallback Parser (Robust & Fast)
  if (!aiMessage) {
    // A. Detect Products from Menu
    for (const prod of productsStore) {
      const prodLower = prod.name.toLowerCase();
      // Match keywords e.g. "spanish latte", "cold brew", "croissant"
      const shortName = prodLower.replace('avenue ', '').replace('iced ', '').replace('dark roast ', '');
      if (lower.includes(prodLower) || lower.includes(shortName)) {
        // Find quantity in proximity
        let qty = 1;
        const qtyMatch = query.match(new RegExp(`(\\d+)\\s*(?:x|pcs|cups|orders|order)?\\s*${shortName}`, 'i')) ||
                         query.match(new RegExp(`${shortName}\\s*(\\d+)`, 'i')) ||
                         query.match(/(\d+)\s*(?:x\s*)?(?:spanish|latte|cold brew|matcha|croissant|panini|frappe)/i);
        if (qtyMatch && qtyMatch[1]) {
          qty = Math.max(1, parseInt(qtyMatch[1], 10));
        } else if (lower.includes('dalawa') || lower.includes('dalawang')) {
          qty = 2;
        } else if (lower.includes('tatlo') || lower.includes('tatlong')) {
          qty = 3;
        }

        let mods = '';
        if (lower.includes('oat milk') || lower.includes('oat')) mods += 'Barista Oat Milk (+₱20), ';
        if (lower.includes('less sweet') || lower.includes('50%')) mods += '50% Sweet, ';
        if (lower.includes('no sugar') || lower.includes('0%')) mods += 'Unsweetened 0%, ';
        if (lower.includes('warm') || lower.includes('toasted')) mods += 'Toasted Warm, ';
        mods = mods.replace(/,\s*$/, '');

        detectedItems.push({
          productName: prod.name,
          quantity: qty,
          modifiers: mods || undefined
        });
      }
    }

    // B. Detect Customer Phone Number
    const phoneMatch = query.match(/(?:09\d{9}|\+639\d{9}|09\d{2}[-\s]?\d{3}[-\s]?\d{4})/);
    if (phoneMatch) {
      detectedCustomer.phone = phoneMatch[0].replace(/[-\s]/g, '');
    }

    // C. Detect Delivery Address
    const addressMatch = query.match(/(?:deliver(?:y)?\s*(?:to|at)?|address\s*(?:is|:)?|location\s*(?:is|:)?|sa)\s+([A-Za-z0-9\s#.,/-]{4,80})/i);
    if (addressMatch && addressMatch[1]) {
      let rawAddr = addressMatch[1].trim();
      rawAddr = rawAddr.replace(/[,.]?\s*(?:phone|contact|mobile|cell|name|payment|cod|gcash|maya)[\s:].*$/i, '').trim();
      detectedCustomer.address = rawAddr;
    } else if (lower.includes('bgc') || lower.includes('taguig') || lower.includes('makati') || lower.includes('serendra') || lower.includes('pasig') || lower.includes('quezon')) {
      let rawAddr = query.split(/phone|contact|mobile|name|gcash|cod|pay/i)[0].trim();
      rawAddr = rawAddr.replace(/^(?:deliver\s*(?:to|at)?|order|pa-order\s*po|please)\s*/i, '').trim();
      if (rawAddr.length >= 5) detectedCustomer.address = rawAddr;
    }

    // D. Detect Name
    const nameMatch = query.match(/(?:name\s*(?:is|:)?|ako\s*si|i\s*am)\s+([A-Za-z\s]{3,30})/i);
    if (nameMatch && nameMatch[1]) {
      detectedCustomer.name = nameMatch[1].trim();
    }

    // E. Detect Payment Method
    if (lower.includes('gcash')) detectedCustomer.paymentMethod = 'gcash';
    else if (lower.includes('maya')) detectedCustomer.paymentMethod = 'maya';
    else if (lower.includes('cod') || lower.includes('cash on delivery') || lower.includes('cash')) detectedCustomer.paymentMethod = 'cash';

    // F. Detect Delivery vs Pickup
    if (lower.includes('pickup') || lower.includes('pick up') || lower.includes('takeout') || lower.includes('take out') || lower.includes('dine in')) {
      detectedCustomer.deliveryType = 'pickup';
    } else if (lower.includes('deliver') || lower.includes('delivery')) {
      detectedCustomer.deliveryType = 'delivery';
    }

    // G. Confirmation Trigger
    if (lower.includes('confirm') || lower.includes('place order') || lower.includes('order na') || lower.includes('proceed') || lower === 'yes' || lower === 'sige') {
      shouldFinalize = true;
    }
  }

  // Update Customer Info in Session
  if (detectedCustomer.name) session.customerInfo.name = detectedCustomer.name;
  if (detectedCustomer.phone) session.customerInfo.phone = detectedCustomer.phone;
  if (detectedCustomer.address) session.customerInfo.address = detectedCustomer.address;
  if (detectedCustomer.deliveryType) session.customerInfo.deliveryType = detectedCustomer.deliveryType;
  if (detectedCustomer.paymentMethod) session.customerInfo.paymentMethod = detectedCustomer.paymentMethod;

  // Add Detected Items to Session Cart
  if (detectedItems.length > 0) {
    session.state = 'ordering';
    for (const dItem of detectedItems) {
      const prod = productsStore.find((p) => p.name.toLowerCase() === dItem.productName.toLowerCase()) ||
                   productsStore.find((p) => p.name.toLowerCase().includes(dItem.productName.toLowerCase()));
      if (prod) {
        let unitPrice = prod.isOnSale && prod.salePrice ? prod.salePrice : prod.price;
        if (dItem.modifiers && dItem.modifiers.includes('Oat Milk')) unitPrice += 20;

        const existing = session.cart.find((c) => c.productId === prod.id && c.modifiersDescription === dItem.modifiers);
        if (existing) {
          existing.quantity += dItem.quantity;
          existing.subtotal = existing.quantity * existing.unitPrice;
        } else {
          session.cart.push({
            productId: prod.id,
            productName: prod.name,
            unitPrice,
            quantity: dItem.quantity,
            subtotal: unitPrice * dItem.quantity,
            modifiersDescription: dItem.modifiers
          });
        }
      }
    }
  }

  // Calculate Order Totals
  const subtotal = session.cart.reduce((sum, item) => sum + item.subtotal, 0);
  const isPickup = session.customerInfo.deliveryType === 'pickup';
  const deliveryFee = isPickup ? 0 : (subtotal >= storeSettings.freeDeliveryThreshold ? 0 : storeSettings.standardDeliveryFee);
  const total = subtotal + deliveryFee;

  // Evaluate if ready to finalize
  const hasItems = session.cart.length > 0;
  const hasName = Boolean(session.customerInfo.name && session.customerInfo.name !== 'Facebook Guest');
  const hasPhone = Boolean(session.customerInfo.phone && session.customerInfo.phone.length >= 7);
  const hasDestination = isPickup || Boolean(session.customerInfo.address && session.customerInfo.address.length >= 4);

  // If user provided items AND address/phone in the same shot, auto-finalize!
  if (hasItems && hasPhone && hasDestination) {
    shouldFinalize = true;
  }

  // ==========================================
  // FINALIZING ORDER & EMITTING RECEIPT
  // ==========================================
  if (hasItems && shouldFinalize && metaAiConfig.autoOrderEnabled) {
    const orderId = `ord-${Date.now()}`;
    const orderNumber = getNextOrderNumber();
    const now = new Date().toISOString();

    const orderItems: OrderItemRecord[] = session.cart.map((c) => ({
      productId: c.productId,
      productName: c.productName,
      unitPrice: c.unitPrice,
      quantity: c.quantity,
      subtotal: c.subtotal,
      modifiersDescription: c.modifiersDescription
    }));

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customer: {
        name: session.customerInfo.name || session.senderName || 'Valued Facebook Guest',
        phone: session.customerInfo.phone || '0917-888-0000',
        address: session.customerInfo.address || (isPickup ? 'Store Pick-up' : 'Metro Manila Delivery'),
        landmark: session.customerInfo.landmark,
        notes: `Automated Facebook Messenger Order (Sender ID: ${senderId})`
      },
      items: orderItems,
      deliveryType: session.customerInfo.deliveryType || 'delivery',
      pickupTime: isPickup ? 'ASAP (~15 mins)' : undefined,
      pickupStatus: isPickup ? 'scheduled' : undefined,
      paymentMethod: session.customerInfo.paymentMethod || 'cash',
      subtotal,
      tax: 0,
      deliveryFee,
      total,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    // Insert Order into real Café Database
    ordersStore.unshift(newOrder);

    // Trigger Admin Alert in Dashboard
    notificationsStore.unshift({
      id: `notif-fb-ord-${Date.now()}`,
      orderId,
      orderNumber,
      customerName: newOrder.customer.name,
      totalAmount: total,
      message: `🧾 Facebook Messenger Order #${orderNumber} placed by ${newOrder.customer.name} (₱${total.toFixed(2)})`,
      createdAt: now,
      read: false
    });

    // Store in session and clear cart
    session.lastOrder = newOrder;
    session.cart = [];
    session.state = 'confirmed';

    // Generate Official Automated Receipt
    const receiptText = generateAutomatedMessengerReceipt(newOrder, baseUrl);
    const greeting = `Thank you, ${newOrder.customer.name}! 🎉 Your order #${newOrder.orderNumber} has been automatically placed and sent straight to our barista kitchen.\n\nHere is your official automated receipt:\n\n${receiptText}`;

    // Disptach to Facebook Messenger if Send API is active
    if (metaAiConfig.autoReplyEnabled && process.env.FB_PAGE_ACCESS_TOKEN) {
      await sendFacebookMessengerReply(senderId, greeting);
    }

    // Record Webhook Log
    const newLog: MetaAiWebhookLog = {
      id: `order-log-${Date.now()}`,
      timestamp: now,
      senderId,
      senderName: newOrder.customer.name,
      messageText: query,
      replyText: greeting,
      status: 'replied',
      orderCreated: true,
      orderNumber: newOrder.orderNumber,
      orderTotal: total,
      receiptText
    };
    metaAiWebhookLogs.unshift(newLog);

    return {
      reply: greeting,
      matchedProducts: [],
      source: usedSource,
      isOrderCreated: true,
      order: newOrder,
      receiptText,
      sessionCart: [],
      orderStatus: 'confirmed',
      log: newLog
    };
  }

  // ============================================================
  // DIRECT RESPONSE: SHOW ALL SHOP MENU WHEN CLIENT WANTS TO ORDER OR ASKS FOR MENU
  // ============================================================
  if (!hasItems && (isAskingForMenu || isExpressingOrderIntent)) {
    const fullMenu = generateFullShopMenuText();
    const reply = `Hi! Welcome to Matcha Avenue Cafe! 🍵\n\nHere is our complete shop menu with all available ceremonial matcha, specialty coffees, teas, cold brews, and bakery items:\n\n${fullMenu}`;

    if (metaAiConfig.autoReplyEnabled && process.env.FB_PAGE_ACCESS_TOKEN) {
      await sendFacebookMessengerReply(senderId, reply);
    }

    const newLog: MetaAiWebhookLog = {
      id: `menu-log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      senderId,
      senderName: session.customerInfo.name || session.senderName,
      messageText: query,
      replyText: reply,
      status: 'replied',
      orderCreated: false
    };
    metaAiWebhookLogs.unshift(newLog);

    return {
      reply,
      matchedProducts: productsStore.filter((p) => p.isPopular || p.isFeatured),
      source: 'meta-ai-menu',
      isOrderCreated: false,
      sessionCart: session.cart,
      orderStatus: 'browsing',
      log: newLog
    };
  }

  // ==========================================
  // INCOMPLETE ORDER - GIVE FULL DETAILS OF THEIR ORDER
  // ==========================================
  if (hasItems) {
    const itemsSummary = session.cart.map((c) => {
      let line = `• ${c.quantity}x ${c.productName} @ ₱${c.unitPrice.toFixed(2)} = ₱${c.subtotal.toFixed(2)}`;
      if (c.modifiersDescription) {
        line += `\n    └ ${c.modifiersDescription}`;
      }
      return line;
    }).join('\n');
    
    let missingPrompt = '';
    const missing: string[] = [];
    if (!hasDestination) missing.push('Delivery Address (or reply "Store Pick-up")');
    if (!hasPhone) missing.push('Mobile Contact Number (e.g. 0917-xxx-xxxx)');
    if (!session.customerInfo.name || session.customerInfo.name === 'Facebook Guest') missing.push('Your Full Name');
    if (!session.customerInfo.paymentMethod) missing.push('Payment Method (Cash on Delivery, GCash, or Maya)');

    let reply = `☕ FULL DETAILS OF YOUR ORDER:\n━━━━━━━━━━━━━━━━━━━━━━\n${itemsSummary}\n━━━━━━━━━━━━━━━━━━━━━━\nSubtotal: ₱${subtotal.toFixed(2)}\nDelivery Fee: ₱${deliveryFee.toFixed(2)} (${deliveryFee === 0 ? 'FREE Promo for orders ₱500+' : 'Standard Courier'})\nTOTAL AMOUNT PAYABLE: ₱${total.toFixed(2)}\n\n📋 Recorded Information:\n• Customer: ${session.customerInfo.name || session.senderName || 'Valued Customer'}\n• Order Type: ${isPickup ? '🏪 Store Pick-up (BGC High Street)' : '🛵 Doorstep Delivery'}\n• Delivery Address: ${session.customerInfo.address || '⚠️ Please provide address'}\n• Mobile Number: ${session.customerInfo.phone || '⚠️ Please provide mobile number'}\n• Payment Option: ${session.customerInfo.paymentMethod === 'gcash' ? 'GCash E-Wallet' : session.customerInfo.paymentMethod === 'maya' ? 'Maya' : 'Cash on Delivery (COD)'}`;

    if (missing.length > 0) {
      reply += `\n\n📍 To finalize your order and automatically generate your official Messenger receipt, please provide:\n${missing.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\nYou can reply with all details in one message! ☕✨`;
    } else {
      reply += `\n\n👉 Everything looks ready! Reply "CONFIRM" or "YES" to send this ticket to our barista kitchen and receive your official automated receipt! 🧾`;
    }

    if (metaAiConfig.autoReplyEnabled && process.env.FB_PAGE_ACCESS_TOKEN) {
      await sendFacebookMessengerReply(senderId, reply);
    }

    const newLog: MetaAiWebhookLog = {
      id: `cart-log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      senderId,
      senderName: session.customerInfo.name || session.senderName,
      messageText: query,
      replyText: reply,
      status: 'replied',
      orderCreated: false
    };
    metaAiWebhookLogs.unshift(newLog);

    return {
      reply,
      matchedProducts: productsStore.filter((p) => session.cart.some((c) => c.productId === p.id)),
      source: usedSource,
      isOrderCreated: false,
      sessionCart: session.cart,
      orderStatus: 'ordering',
      log: newLog
    };
  }

  // ==========================================
  // GENERAL INQUIRY / ACCURATE CONVERSATIONAL RESPONSE
  // ==========================================
  let matched: Product[] = [];
  let reply = aiMessage;

  if (!reply) {
    if (lower.includes('iced') || lower.includes('cold') || lower.includes('refreshing') || lower.includes('malamig')) {
      matched = productsStore.filter((p) => p.category.toLowerCase().includes('cold') || p.name.toLowerCase().includes('iced'));
      reply = `Here are our refreshing iced favorites! ❄️ You can customize with Barista Oat Milk (+₱20) or choose sweetness levels (100% regular, 50% less sweet, or 0% unsweetened). To order, reply with your drink anytime (e.g. "Order 2 Spanish Latte and 1 Croissant")!`;
    } else if (lower.includes('latte') || lower.includes('spanish') || lower.includes('kape') || lower.includes('coffee')) {
      matched = productsStore.filter((p) => p.name.toLowerCase().includes('latte') || p.category.toLowerCase().includes('espresso'));
      reply = `Our specialty coffees are crafted with freshly roasted Arabica beans and double espresso! ☕ The Avenue Spanish Latte with condensed milk (₱145) is our #1 bestseller. Would you like to order one for doorstep delivery or store pickup?`;
    } else if (lower.includes('pastry') || lower.includes('croissant') || lower.includes('bread') || lower.includes('food') || lower.includes('eat') || lower.includes('tinapay') || lower.includes('pagkain')) {
      matched = productsStore.filter((p) => p.category.toLowerCase().includes('pastr') || p.category.toLowerCase().includes('panini'));
      reply = `Our artisan bakery items are freshly baked each morning! 🥐 Try our Butter Croissant (₱99 on promo) or Truffle Mushroom Panini (₱240). Tell me what you'd like to order anytime!`;
    } else if (lower.includes('hour') || lower.includes('open') || lower.includes('time') || lower.includes('oras') || lower.includes('bukas')) {
      reply = `Matcha Avenue Cafe is open daily from 7:00 AM – 10:00 PM! 🏪 You can order on Facebook Messenger for express courier delivery or store pickup anytime during store hours.`;
      matched = productsStore.filter((p) => p.isPopular).slice(0, 2);
    } else if (lower.includes('where') || lower.includes('location') || lower.includes('address') || lower.includes('saan') || lower.includes('lugar')) {
      reply = `Our flagship store is located at 7th Ave & 28th St, BGC High Street, Taguig! 📍 We deliver across Metro Manila for a flat ₱50 courier fee (FREE on orders ₱500+).`;
      matched = productsStore.filter((p) => p.isPopular).slice(0, 2);
    } else if (lower.includes('delivery') || lower.includes('deliver') || lower.includes('fee') || lower.includes('shipping') || lower.includes('magkano delivery')) {
      reply = `🛵 Delivery Fee: Flat ₱50 across Metro Manila, and FREE for orders ₱500 and above! We deliver straight to your doorstep with live tracking and automated receipt updates.`;
      matched = productsStore.filter((p) => p.isPopular).slice(0, 2);
    } else if (lower.includes('payment') || lower.includes('pay') || lower.includes('gcash') || lower.includes('maya') || lower.includes('cod') || lower.includes('bayad')) {
      reply = `💳 Payment Methods: We accept Cash on Delivery (COD), GCash (${storeSettings.merchantGcashNumber}), and Maya E-Wallet! You can choose your payment method when placing your order.`;
      matched = productsStore.filter((p) => p.isPopular).slice(0, 2);
    } else if (lower.includes('vegan') || lower.includes('oat') || lower.includes('almond') || lower.includes('milk') || lower.includes('gatas')) {
      matched = productsStore.filter((p) => p.description.toLowerCase().includes('oat') || p.name.toLowerCase().includes('matcha'));
      reply = `Yes! We offer premium Barista-grade Oat Milk (+₱20) and Almond Milk (+₱20) as dairy-free substitutes for all hot and iced beverages! 🌿`;
    } else if (lower.includes('wifi') || lower.includes('internet') || lower.includes('password')) {
      reply = `Yes, we offer complimentary high-speed WiFi for all guests visiting our BGC High Street café! Connect to 'MatchaAvenueGuest' with no password required. 📶`;
      matched = productsStore.filter((p) => p.isPopular).slice(0, 2);
    } else if (lower.includes('facebook') || lower.includes('page') || lower.includes('link') || lower.includes('contact')) {
      reply = `You're connected to Matcha Avenue Cafe's official Facebook Page (ID: ${metaAiConfig.pageId})! 📱\n• Facebook Page: ${metaAiConfig.pageUrl}\n• Business Suite Inbox: ${metaAiConfig.businessSuiteInboxUrl}\n• Messenger: ${metaAiConfig.messengerUrl}\n\nFeel free to ask for our menu or order directly anytime! 🍵`;
      matched = productsStore.filter((p) => p.isPopular).slice(0, 2);
    } else {
      matched = productsStore.filter((p) => p.isPopular || p.isFeatured).slice(0, 3);
      reply = `Welcome to Matcha Avenue Cafe! 🍵 I am your automated AI Barista for our official Facebook Page. If you want to order, say "menu" to see our full selection, or tell me your order directly (e.g. "Order 2 Uji Matcha and 1 Croissant to Serendra BGC. 09171234567. COD") to receive an instant automated receipt! How can I brew your day today?`;
    }
  } else {
    // If Gemini provided a response, find matched products mentioned in query or reply
    matched = productsStore.filter((p) =>
      reply.toLowerCase().includes(p.name.toLowerCase()) ||
      lower.includes(p.name.toLowerCase())
    ).slice(0, 3);
    if (matched.length === 0) {
      matched = productsStore.filter((p) => p.isPopular).slice(0, 2);
    }
  }

  if (metaAiConfig.autoReplyEnabled && process.env.FB_PAGE_ACCESS_TOKEN) {
    await sendFacebookMessengerReply(senderId, reply);
  }

  const newLog: MetaAiWebhookLog = {
    id: `inquiry-log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    senderId,
    senderName: session.customerInfo.name || session.senderName,
    messageText: query,
    replyText: reply,
    status: 'replied',
    orderCreated: false
  };
  metaAiWebhookLogs.unshift(newLog);

  return {
    reply,
    matchedProducts: matched,
    source: usedSource,
    isOrderCreated: false,
    sessionCart: session.cart,
    orderStatus: 'browsing',
    log: newLog
  };
}

// Backward-compatible generateBaristaResponse wrapper
async function generateBaristaResponse(
  userQuery: string,
  history?: Array<{ sender: string; text: string }>,
  modelPreference?: string
): Promise<{ reply: string; matchedProducts: Product[]; source: string }> {
  const result = await processMessengerMessage({
    senderId: 'fb-guest-preview',
    senderName: 'Facebook Visitor',
    userQuery,
    history,
    modelPreference
  });
  return {
    reply: result.reply,
    matchedProducts: result.matchedProducts,
    source: result.source
  };
}

// GET Meta AI Config & Webhook Status
app.get('/api/meta-ai/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      ...metaAiConfig,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasPageAccessToken: Boolean(process.env.FB_PAGE_ACCESS_TOKEN),
      recentLogs: metaAiWebhookLogs.slice(0, 20),
      totalLogsCount: metaAiWebhookLogs.length
    }
  });
});

// POST Update Meta AI Config
app.post('/api/meta-ai/config', (req: Request, res: Response) => {
  const { autoReplyEnabled, autoOrderEnabled, sendAutomatedReceipt, customGreeting, aiModel, verifyToken, pageId, pageUrl, messengerUrl } = req.body;
  if (typeof autoReplyEnabled === 'boolean') metaAiConfig.autoReplyEnabled = autoReplyEnabled;
  if (typeof autoOrderEnabled === 'boolean') metaAiConfig.autoOrderEnabled = autoOrderEnabled;
  if (typeof sendAutomatedReceipt === 'boolean') metaAiConfig.sendAutomatedReceipt = sendAutomatedReceipt;
  if (typeof customGreeting === 'string') metaAiConfig.customGreeting = customGreeting;
  if (aiModel) metaAiConfig.aiModel = aiModel;
  if (verifyToken) metaAiConfig.verifyToken = verifyToken;
  if (pageId) metaAiConfig.pageId = pageId;
  if (pageUrl) metaAiConfig.pageUrl = pageUrl;
  if (messengerUrl) metaAiConfig.messengerUrl = messengerUrl;

  res.json({ success: true, data: metaAiConfig });
});

// GET Active Messenger Sessions (Admin Monitor)
app.get('/api/meta-ai/sessions', (req: Request, res: Response) => {
  const sessions = Array.from(messengerSessions.values()).map((s) => ({
    senderId: s.senderId,
    senderName: s.senderName,
    cart: s.cart,
    customerInfo: s.customerInfo,
    state: s.state,
    lastActive: new Date(s.lastActive).toISOString(),
    lastOrderNumber: s.lastOrder?.orderNumber
  }));

  res.json({
    success: true,
    data: sessions
  });
});

// POST Reset Messenger Session
app.post('/api/meta-ai/reset-session', (req: Request, res: Response) => {
  const { senderId } = req.body;
  if (senderId) {
    messengerSessions.delete(senderId);
  } else {
    messengerSessions.clear();
  }
  res.json({ success: true, message: 'Session reset successfully.' });
});

// GET Formatted Messenger Receipt for an Order
app.get('/api/meta-ai/receipt/:orderId', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = ordersStore.find((o) => o.id === orderId || o.orderNumber.toUpperCase() === orderId.toUpperCase());
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }

  const receiptText = generateAutomatedMessengerReceipt(order);
  res.json({
    success: true,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      receiptText,
      order
    }
  });
});

// GET Meta Graph API / Messenger Webhook Verification
// Meta sends hub.mode, hub.verify_token, hub.challenge
app.get('/api/meta-ai/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === metaAiConfig.verifyToken) {
    console.log('[Meta AI Webhook] Verified successfully for Facebook Page:', metaAiConfig.pageId);
    res.status(200).send(challenge);
  } else {
    console.warn('[Meta AI Webhook] Verification failed. Invalid verify token.');
    res.status(403).send('Forbidden: Verification token mismatch');
  }
});

// POST Meta Graph API / Messenger Incoming Message Webhook
app.post('/api/meta-ai/webhook', async (req: Request, res: Response) => {
  const body = req.body;

  // Confirm this is an event from a page subscription
  if (body.object === 'page') {
    for (const entry of body.entry || []) {
      const webhookEvent = entry.messaging?.[0];
      if (webhookEvent && webhookEvent.message && webhookEvent.message.text) {
        const senderId = webhookEvent.sender.id;
        const messageText = webhookEvent.message.text;

        console.log(`[Meta AI Webhook] Received message from FB sender ${senderId}: "${messageText}"`);

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        // Process message through full barista & automated ordering engine
        await processMessengerMessage({
          senderId,
          senderName: `Facebook Guest (${senderId.slice(-4)})`,
          userQuery: messageText,
          modelPreference: metaAiConfig.aiModel,
          baseUrl
        });
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// POST Chat with Meta AI Barista (Used by Storefront Assistant & Admin Playground)
app.post('/api/meta-ai/chat', async (req: Request, res: Response) => {
  const { message, history, engine, senderId, senderName } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ success: false, message: 'Message string is required.' });
    return;
  }

  try {
    const selectedEngine = engine || metaAiConfig.aiModel;
    const resolvedSenderId = senderId || 'web-chat-user';
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const result = await processMessengerMessage({
      senderId: resolvedSenderId,
      senderName: senderName || 'Storefront Visitor',
      userQuery: message,
      history,
      modelPreference: selectedEngine,
      baseUrl
    });

    res.json({
      success: true,
      data: {
        reply: result.reply,
        recommendedProducts: result.matchedProducts,
        facebookPageUrl: metaAiConfig.pageUrl,
        facebookMessengerUrl: metaAiConfig.messengerUrl,
        pageId: metaAiConfig.pageId,
        source: result.source,
        isOrderCreated: result.isOrderCreated,
        order: result.order,
        receiptText: result.receiptText,
        sessionCart: result.sessionCart,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Meta AI Chat error:', err);
    res.status(500).json({ success: false, message: 'Meta AI failed to process query.' });
  }
});

// POST Send Direct Facebook Messenger Reply (Admin Action)
app.post('/api/meta-ai/send-messenger', async (req: Request, res: Response) => {
  const { recipientId, messageText } = req.body;
  if (!recipientId || !messageText) {
    res.status(400).json({ success: false, message: 'recipientId and messageText are required.' });
    return;
  }

  const result = await sendFacebookMessengerReply(recipientId, messageText);
  if (result.success) {
    res.json({ success: true, message: 'Message dispatched to Facebook Messenger recipient.', data: result.data });
  } else {
    res.json({
      success: false,
      message: result.error || 'Failed to dispatch via Facebook Graph API.',
      simulated: !process.env.FB_PAGE_ACCESS_TOKEN
    });
  }
});

// POST Simulate Incoming Facebook Page Message (Admin Testing Tool)
app.post('/api/meta-ai/simulate-message', async (req: Request, res: Response) => {
  const { senderName, senderId, messageText, engine } = req.body;
  const name = (senderName || 'Maria Santos').trim();
  const text = (messageText || 'Order 2 Spanish Latte with oat milk, deliver to Two Serendra BGC, phone 09178889999, COD').trim();
  const id = senderId || `fb-sim-${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}`;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const result = await processMessengerMessage({
    senderId: id,
    senderName: name,
    userQuery: text,
    modelPreference: engine,
    baseUrl
  });

  res.json({
    success: true,
    data: {
      log: result.log,
      matchedProducts: result.matchedProducts,
      source: result.source,
      facebookPageUrl: metaAiConfig.pageUrl,
      isOrderCreated: result.isOrderCreated,
      order: result.order,
      receiptText: result.receiptText,
      sessionCart: result.sessionCart
    }
  });
});

// ==========================================
// VITE MIDDLEWARE / STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = await resolvePort(PORT);

  const server = app.listen(port, HOST, () => {
    console.log(`Matcha Avenue Cafe server running on http://${HOST}:${port}`);
    console.log(`  Customer view : http://localhost:${port}/`);
    console.log(`  Admin console : http://localhost:${port}/admin`);
    console.log(`  Health check  : http://localhost:${port}/api/health`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[server] Port ${port} is already in use. Set PORT to a free port and retry.`);
    } else {
      console.error('[server] Server error:', err.message);
    }
    process.exit(1);
  });
}

startServer();
