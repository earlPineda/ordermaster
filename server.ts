import express, { Request, Response } from 'express';
import path from 'path';
import net from 'net';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_NOTIFICATIONS, generateMySQLDump } from './src/data/initialData.js';
import { Product, Order, AdminNotification, OrderStatus, DashboardStats, Category, OrderItemRecord } from './src/types.js';

const app = express();
const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json());

// ==========================================
// MySQL Database Connection (avenue_cafe)
// ==========================================
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'matcha database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

let pool: mysql.Pool | null = null;
let dbConnected = false;

/** In-memory fallback store (used only if MySQL is unreachable) */
let productsStore: Product[] = [...INITIAL_PRODUCTS];
let ordersStore: Order[] = [...INITIAL_ORDERS];
let notificationsStore: AdminNotification[] = [...INITIAL_NOTIFICATIONS];
let orderSequence = 1003;

const getNextOrderNumberFallback = () => `ORD-${orderSequence++}`;

/** Attempts to connect to MySQL and verify the schema is ready. */
async function initDb(): Promise<boolean> {
  try {
    const testPool = mysql.createPool(DB_CONFIG);
    const conn = await testPool.getConnection();
    await conn.ping();
    await conn.query('SELECT 1');
    conn.release();
    pool = testPool;
    dbConnected = true;
    await ensureColumns();
    console.log(`[db] Connected to MySQL database '${DB_CONFIG.database}' @ ${DB_CONFIG.host}:${DB_CONFIG.port}.`);
    return true;
  } catch (err) {
    console.warn(`[db] MySQL connection failed: ${(err as Error).message}`);
    console.warn('[db] Falling back to the in-memory data store.');
    pool = null;
    dbConnected = false;
    return false;
  }
}

/** Adds optional app columns if the imported schema lacks them. */
async function ensureColumns(): Promise<void> {
  const cols: { table: string; name: string; def: string }[] = [
    { table: 'orders', name: 'email', def: 'VARCHAR(100) DEFAULT NULL' },
    { table: 'orders', name: 'deleted', def: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { table: 'orders', name: 'cancelled_by', def: 'VARCHAR(20) DEFAULT NULL' }
  ];
  for (const c of cols) {
    try {
      const [rows] = await pool!.query(
        'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [c.table, c.name]
      );
      const exists = (rows as any[])[0].c > 0;
      if (!exists) {
        await pool!.query(`ALTER TABLE \`${c.table}\` ADD COLUMN \`${c.name}\` ${c.def}`);
        console.log(`[db] Added column ${c.table}.${c.name}.`);
      }
    } catch (e) {
      console.warn(`[db] Could not ensure column ${c.table}.${c.name}: ${(e as Error).message}`);
    }
  }
}

/** Returns the set of columns currently present on the `orders` table. */
async function getOrderColumns(): Promise<Set<string>> {
  if (!pool) return new Set(['id', 'email', 'deleted', 'cancelled_by']);
  try {
    const [rows] = await pool.query(
      'SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
      ['orders']
    );
    return new Set((rows as any[]).map((r) => r.name));
  } catch (e) {
    // If we cannot introspect, assume all app columns exist (best effort).
    return new Set(['id', 'email', 'deleted', 'cancelled_by']);
  }
}

// Helper: pick the next order number sequence (from DB, or fallback sequence)
async function getNextOrderNumber(): Promise<string> {
  if (!pool) return getNextOrderNumberFallback();
  const [rows] = await pool.query(
    "SELECT COALESCE(MAX(CAST(SUBSTRING(order_number, 5) AS UNSIGNED)), 1002) + 1 AS next FROM orders WHERE order_number LIKE 'ORD-%'"
  );
  const next = Number((rows as any[])[0].next);
  return `ORD-${next}`;
}

const toISO = (v: any): string =>
  v instanceof Date ? v.toISOString() : v ? new Date(v).toISOString() : new Date().toISOString();
const num = (v: any): number => Number(v ?? 0);

/** Map a MySQL `products` row to the app's Product type. */
function mapProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category_name as Category,
    price: num(row.price),
    description: row.description || '',
    image: row.image || '',
    available: Boolean(row.available),
    isPopular: Boolean(row.is_popular),
    calories: row.calories != null ? row.calories : 0,
    preparationTimeMinutes: row.prep_time_mins != null ? row.prep_time_mins : 5
  };
}

/** Map a MySQL `admin_notifications` row to the app's AdminNotification type. */
function mapNotifRow(row: any): AdminNotification {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    totalAmount: num(row.total_amount),
    message: row.message,
    createdAt: toISO(row.created_at),
    read: Boolean(row.is_read)
  };
}

/** Map a MySQL `orders` row to the app's Order type (items filled separately). */
function mapOrderRow(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customer: {
      name: row.customer_name,
      phone: row.customer_phone,
      email: row.email || undefined,
      address: row.customer_address || undefined,
      notes: row.customer_notes || undefined,
      ewalletNumber: row.ewallet_number || undefined,
      referenceNumber: row.reference_number || undefined
    },
    items: [],
    deliveryType: row.delivery_type,
    paymentMethod: row.payment_method,
    subtotal: num(row.subtotal),
    tax: num(row.tax),
    deliveryFee: num(row.delivery_fee),
    total: num(row.total),
    status: row.status,
    cancelledBy: row.cancelled_by || undefined,
    deleted: Boolean(row.deleted),
    createdAt: toISO(row.created_at),
    updatedAt: toISO(row.updated_at)
  };
}

/** Map a MySQL `order_items` row to the app's OrderItemRecord type. */
function mapOrderItemRow(row: any): OrderItemRecord {
  return {
    productId: row.product_id,
    productName: row.product_name,
    unitPrice: num(row.unit_price),
    quantity: row.quantity,
    subtotal: num(row.subtotal),
    notes: row.notes || undefined
  };
}

// ==========================================
// DATA ACCESS LAYER (MySQL with in-memory fallback)
// ==========================================

// ---- Products ----

async function getProducts(): Promise<Product[]> {
  if (!pool) return productsStore;
  const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC, id ASC');
  return (rows as any[]).map(mapProductRow);
}

async function addProduct(data: Omit<Product, 'id'>): Promise<Product> {
  const product: Product = {
    id: `prod-${Date.now()}`,
    name: data.name,
    category: data.category,
    price: Number(data.price),
    description: data.description || '',
    image:
      data.image ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    available: data.available !== undefined ? Boolean(data.available) : true,
    isPopular: Boolean(data.isPopular),
    calories: data.calories ? Number(data.calories) : 500,
    preparationTimeMinutes: data.preparationTimeMinutes ? Number(data.preparationTimeMinutes) : 15
  };
  if (!pool) {
    productsStore.unshift(product);
    return product;
  }
  await pool.query(
    'INSERT INTO products (id, name, category_name, price, description, image, available, is_popular, calories, prep_time_mins) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [
      product.id,
      product.name,
      product.category,
      product.price,
      product.description,
      product.image,
      product.available ? 1 : 0,
      product.isPopular ? 1 : 0,
      product.calories,
      product.preparationTimeMinutes
    ]
  );
  return product;
}

async function updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
  const products = await getProducts();
  const existing = products.find((p) => p.id === id);
  if (!existing) return null;
  const updated: Product = {
    ...existing,
    ...data,
    price: data.price !== undefined ? Number(data.price) : existing.price
  };
  if (!pool) {
    const idx = productsStore.findIndex((p) => p.id === id);
    if (idx > -1) productsStore[idx] = updated;
    return updated;
  }
  await pool.query(
    'UPDATE products SET name=?, category_name=?, price=?, description=?, image=?, available=?, is_popular=?, calories=?, prep_time_mins=? WHERE id=?',
    [
      updated.name,
      updated.category,
      updated.price,
      updated.description,
      updated.image,
      updated.available ? 1 : 0,
      updated.isPopular ? 1 : 0,
      updated.calories,
      updated.preparationTimeMinutes,
      id
    ]
  );
  return updated;
}

async function deleteProduct(id: string): Promise<boolean> {
  if (!pool) {
    const len = productsStore.length;
    productsStore = productsStore.filter((p) => p.id !== id);
    return productsStore.length !== len;
  }
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return (result as any).affectedRows > 0;
}

// ---- Orders ----

async function getOrders(includeDeleted = false): Promise<Order[]> {
  if (!pool) return ordersStore.filter((o) => includeDeleted || !o.deleted);
  const where = includeDeleted ? '' : 'WHERE o.deleted = 0';
  const [orderRows] = await pool.query(
    `SELECT o.* FROM orders o ${where} ORDER BY o.created_at DESC, o.id ASC`
  );
  const orders = (orderRows as any[]).map(mapOrderRow);
  if (orders.length === 0) return orders;
  const ids = orders.map((o) => o.id);
  const [itemRows] = await pool.query(
    `SELECT * FROM order_items WHERE order_id IN (${ids.map(() => '?').join(',')}) ORDER BY id ASC`,
    ids
  );
  const byOrder: { [oid: string]: OrderItemRecord[] } = {};
  for (const r of itemRows as any[]) {
    const oid = r.order_id;
    if (!byOrder[oid]) byOrder[oid] = [];
    byOrder[oid].push(mapOrderItemRow(r));
  }
  orders.forEach((o) => {
    o.items = byOrder[o.id] || [];
  });
  return orders;
}

async function getOrder(idOrNumber: string): Promise<Order | null> {
  if (!pool) {
    const o = ordersStore.find(
      (x) => x.id === idOrNumber || x.orderNumber.toUpperCase() === idOrNumber.toUpperCase()
    );
    return o || null;
  }
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE id = ? OR UPPER(order_number) = UPPER(?) LIMIT 1',
    [idOrNumber, idOrNumber]
  );
  if ((rows as any[]).length === 0) return null;
  const order = mapOrderRow((rows as any[])[0]);
  const [itemRows] = await pool.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [
    order.id
  ]);
  order.items = (itemRows as any[]).map(mapOrderItemRow);
  return order;
}

async function createOrder(input: {
  customer: Order['customer'];
  items: OrderItemRecord[];
  deliveryType: Order['deliveryType'];
  paymentMethod: Order['paymentMethod'];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
}): Promise<{ order: Order; notification: AdminNotification }> {
  const { customer, items, deliveryType, paymentMethod, subtotal, tax, deliveryFee, total } = input;
  const orderId = `ord-${Date.now()}`;
  const orderNum = await getNextOrderNumber();
  const iso = new Date().toISOString();

  const newOrder: Order = {
    id: orderId,
    orderNumber: orderNum,
    customer,
    items,
    deliveryType: deliveryType || 'delivery',
    paymentMethod: paymentMethod || 'cash',
    subtotal: Number(subtotal),
    tax: Number(tax),
    deliveryFee: Number(deliveryFee),
    total: Number(total),
    status: 'pending',
    deleted: false,
    createdAt: iso,
    updatedAt: iso
  };

  const notification: AdminNotification = {
    id: `notif-${Date.now()}`,
    orderId,
    orderNumber: orderNum,
    customerName: customer.name,
    totalAmount: Number(total),
    message: `⚡ New Order #${orderNum} placed by ${customer.name} (₱${Number(total).toFixed(2)})`,
    createdAt: iso,
    read: false
  };

  if (!pool) {
    ordersStore.unshift(newOrder);
    notificationsStore.unshift(notification);
    return { order: newOrder, notification };
  }

  const conn = await pool.getConnection();
  try {
    // Best-effort: add any missing optional columns before inserting.
    await ensureColumns();

    const cols = await getOrderColumns();

    const insertCols: string[] = [
      'id', 'order_number', 'customer_name', 'customer_phone',
      'customer_address', 'customer_notes',
      'ewallet_number', 'reference_number',
      'delivery_type', 'payment_method', 'subtotal', 'tax', 'delivery_fee', 'total', 'status'
    ];
    const insertVals: any[] = [
      orderId,
      orderNum,
      customer.name,
      customer.phone,
      customer.address || null,
      customer.notes || null,
      customer.ewalletNumber || null,
      customer.referenceNumber || null,
      newOrder.deliveryType,
      newOrder.paymentMethod,
      newOrder.subtotal,
      newOrder.tax,
      newOrder.deliveryFee,
      newOrder.total,
      'pending'
    ];
    if (cols.has('email')) {
      insertCols.push('email');
      insertVals.push(customer.email || null);
    }
    if (cols.has('deleted')) {
      insertCols.push('deleted');
      insertVals.push(0);
    }
    if (cols.has('cancelled_by')) {
      insertCols.push('cancelled_by');
      insertVals.push(null);
    }

    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO orders (${insertCols.join(',')}) VALUES (${insertVals.map(() => '?').join(',')})`,
      insertVals
    );
    for (const it of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal, notes) VALUES (?,?,?,?,?,?,?)',
        [orderId, it.productId, it.productName, it.unitPrice, it.quantity, it.subtotal, it.notes || null]
      );
    }
    await conn.query(
      'INSERT INTO admin_notifications (id, order_id, order_number, customer_name, total_amount, message, is_read) VALUES (?,?,?,?,?,?,?)',
      [notification.id, notification.orderId, notification.orderNumber, notification.customerName, notification.totalAmount, notification.message, 0]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return { order: newOrder, notification };
}

async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  cancelledBy?: 'customer' | 'admin'
): Promise<Order | null> {
  if (!pool) {
    const order = ordersStore.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;
    order.status = status;
    if (status === 'cancelled' && cancelledBy) order.cancelledBy = cancelledBy;
    order.updatedAt = new Date().toISOString();
    // Customer cancellations are removed from the store entirely.
    if (status === 'cancelled' && cancelledBy === 'customer') {
      ordersStore = ordersStore.filter((o) => o.id !== order.id);
      notificationsStore = notificationsStore.filter((n) => n.orderId !== order.id);
    }
    return order;
  }
  const cur = await getOrder(id);
  if (!cur) return null;
  // Customer cancellation removes the order from the database entirely
  // (cascades to order_items and admin_notifications via foreign keys).
  if (status === 'cancelled' && cancelledBy === 'customer') {
    await pool.query('DELETE FROM orders WHERE id = ?', [cur.id]);
    return cur;
  }
  await pool.query('UPDATE orders SET status = ?, cancelled_by = ?, updated_at = NOW() WHERE id = ?', [
    status,
    status === 'cancelled' && cancelledBy ? cancelledBy : null,
    cur.id
  ]);
  return getOrder(cur.id);
}

async function deleteOrder(id: string): Promise<boolean> {
  const cur = await getOrder(id);
  if (!cur) return false;
  if (!pool) {
    const o = ordersStore.find((x) => x.id === cur.id);
    if (o) {
      o.deleted = true;
      o.updatedAt = new Date().toISOString();
    }
    return true;
  }
  await pool.query('UPDATE orders SET deleted = 1, updated_at = NOW() WHERE id = ?', [cur.id]);
  return true;
}

// ---- Notifications ----

async function getNotifications(): Promise<{ data: AdminNotification[]; unreadCount: number }> {
  if (!pool) {
    const excludedOrderIds = new Set(
      ordersStore.filter((o) => o.status === 'cancelled' || o.deleted).map((o) => o.id)
    );
    const filtered = notificationsStore.filter((n) => !excludedOrderIds.has(n.orderId));
    return { data: filtered, unreadCount: filtered.filter((n) => !n.read).length };
  }
  const [rows] = await pool.query(
    `SELECT n.* FROM admin_notifications n
     INNER JOIN orders o ON o.id = n.order_id
     WHERE o.status <> 'cancelled' AND o.deleted = 0
     ORDER BY n.created_at DESC, n.id DESC`
  );
  const data = (rows as any[]).map(mapNotifRow);
  return { data, unreadCount: data.filter((n) => !n.read).length };
}

async function deleteNotification(id: string): Promise<boolean> {
  if (!pool) {
    const idx = notificationsStore.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    notificationsStore.splice(idx, 1);
    return true;
  }
  const [result] = await pool.query('DELETE FROM admin_notifications WHERE id = ?', [id]);
  return (result as any).affectedRows > 0;
}

async function markNotificationsRead(id?: string): Promise<void> {
  if (!pool) {
    if (id) {
      const n = notificationsStore.find((x) => x.id === id);
      if (n) n.read = true;
    } else {
      notificationsStore.forEach((n) => (n.read = true));
    }
    return;
  }
  if (id) {
    await pool.query('UPDATE admin_notifications SET is_read = 1 WHERE id = ?', [id]);
  } else {
    await pool.query('UPDATE admin_notifications SET is_read = 1');
  }
}

// ---- Admin Stats ----

async function getStats(): Promise<DashboardStats> {
  if (!pool) {
    const nonCancelled = ordersStore.filter((o) => o.status !== 'cancelled');
    const totalRevenue = nonCancelled.reduce((s, o) => s + o.total, 0);
    const totalOrders = nonCancelled.length;
    const pendingOrders = ordersStore.filter(
      (o) => o.status === 'pending' || o.status === 'preparing'
    ).length;
    const completedOrders = ordersStore.filter((o) => o.status === 'delivered').length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const map: { [name: string]: { count: number; totalSales: number } } = {};
    ordersStore.forEach((o) => {
      if (o.status !== 'cancelled') {
        o.items.forEach((it) => {
          if (!map[it.productName]) map[it.productName] = { count: 0, totalSales: 0 };
          map[it.productName].count += it.quantity;
          map[it.productName].totalSales += it.subtotal;
        });
      }
    });
    const topProducts = Object.keys(map)
      .map((name) => ({ name, count: map[name].count, totalSales: map[name].totalSales }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { totalRevenue, totalOrders, pendingOrders, completedOrders, averageOrderValue, topProducts };
  }

  const [revRows] = await pool.query(
    "SELECT COALESCE(SUM(total),0) AS rev, COUNT(*) AS cnt FROM orders WHERE status <> 'cancelled'"
  );
  const revRow = (revRows as any[])[0];
  const totalRevenue = num(revRow.rev);
  const totalOrders = Number(revRow.cnt);
  const [pendRows] = await pool.query(
    "SELECT COUNT(*) AS c FROM orders WHERE status IN ('pending','preparing')"
  );
  const pendingOrders = Number((pendRows as any[])[0].c);
  const [compRows] = await pool.query("SELECT COUNT(*) AS c FROM orders WHERE status = 'delivered'");
  const completedOrders = Number((compRows as any[])[0].c);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const [tpRows] = await pool.query(
    `SELECT oi.product_name AS name, SUM(oi.quantity) AS count, SUM(oi.subtotal) AS totalSales
     FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id
     WHERE o.status <> 'cancelled'
     GROUP BY oi.product_name ORDER BY count DESC LIMIT 5`
  );
  const topProducts = (tpRows as any[]).map((r: any) => ({
    name: r.name,
    count: Number(r.count),
    totalSales: num(r.totalSales)
  }));

  return { totalRevenue, totalOrders, pendingOrders, completedOrders, averageOrderValue, topProducts };
}

// ==========================================
// API ROUTES (Backend / API - Phase 4)
// ==========================================

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET Menu / Products
app.get('/api/menu', async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await getProducts() });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// POST Add Menu Product (Admin)
app.post('/api/menu', async (req: Request, res: Response) => {
  const { name, category, price, description, image, available, isPopular, calories, preparationTimeMinutes } = req.body;
  if (!name || !price || !category) {
    res.status(400).json({ success: false, message: 'Name, category, and price are required.' });
    return;
  }
  try {
    const product = await addProduct({
      name,
      category,
      price,
      description,
      image,
      available,
      isPopular,
      calories,
      preparationTimeMinutes
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// PUT Edit Menu Product (Admin)
app.put('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateProduct(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// DELETE Menu Product (Admin)
app.delete('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const ok = await deleteProduct(req.params.id);
    if (!ok) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// GET All Orders (excluding soft-deleted)
app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await getOrders() });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// GET Single Order Details (for order tracking)
app.get('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await getOrder(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// POST Create Order (Customer Ordering - Phase 5)
app.post('/api/orders', async (req: Request, res: Response) => {
  const { customer, items } = req.body;
  if (!customer || !customer.name || !customer.phone || !items || items.length === 0) {
    res.status(400).json({ success: false, message: 'Invalid order details. Customer name, phone, and items are required.' });
    return;
  }
  try {
    const { order, notification } = await createOrder(req.body);
    res.status(201).json({ success: true, data: order, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// PATCH Update Order Status (Admin Dashboard - Phase 3 & 6)
app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
  const { status, cancelledBy } = req.body as { status: OrderStatus; cancelledBy?: 'customer' | 'admin' };
  try {
    const order = await updateOrderStatus(req.params.id, status, cancelledBy);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// DELETE Order (Admin) — soft delete: hide from live view but keep for stats & customer tracking
app.delete('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await getOrder(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }
    if (order.status !== 'cancelled' && order.status !== 'delivered') {
      res.status(400).json({
        success: false,
        message: 'Only cancelled or delivered orders can be deleted.'
      });
      return;
    }
    await deleteOrder(order.id);
    res.json({ success: true, message: `Order ${order.orderNumber} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// GET Admin Notifications
app.get('/api/notifications', async (req: Request, res: Response) => {
  try {
    const { data, unreadCount } = await getNotifications();
    res.json({ success: true, data, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// DELETE Single Notification (Admin)
app.delete('/api/notifications/:id', async (req: Request, res: Response) => {
  try {
    const ok = await deleteNotification(req.params.id);
    if (!ok) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }
    res.json({ success: true, message: 'Notification deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// POST Mark Notifications as Read
app.post('/api/notifications/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await markNotificationsRead(id || undefined);
    res.json({ success: true, message: 'Notifications updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// GET Admin Dashboard Analytics
app.get('/api/admin/stats', async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await getStats() });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// GET MySQL SQL Script Dump (Phase 2 - XAMPP / phpMyAdmin Export)
app.get('/api/export-sql', (req: Request, res: Response) => {
  const sqlDump = generateMySQLDump();
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="avenue_cafe_mysql.sql"');
  res.send(sqlDump);
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

  // If the preferred port (3000) is occupied, fall back to the next available port.
  const port = await getFreePort(PORT);

  app.listen(port, '0.0.0.0', () => {
    console.log(`Avenue Café server running on http://localhost:${port}`);
    console.log(`  Customer view : http://localhost:${port}/`);
    console.log(`  Admin dashboard: http://localhost:${port}/admin`);
    console.log(`  Health check  : http://localhost:${port}/api/health`);
    console.log(`  Database      : ${dbConnected ? 'MySQL (' + DB_CONFIG.database + ')' : 'In-memory (fallback)'}`);
  });
}

/** Returns `preferred` if free, otherwise the next free port (preferred+1, +2, …). */
function getFreePort(preferred: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryPort = (port: number) => {
      const probe = net.createServer();
      probe.unref();
      probe.once('error', () => {
        if (port >= 65535) {
          reject(new Error(`No available port found starting at ${preferred}.`));
        } else {
          tryPort(port + 1);
        }
      });
      probe.listen(port, '0.0.0.0', () => {
        probe.close(() => resolve(port));
      });
    };
    tryPort(preferred);
  });
}

async function bootstrap() {
  await initDb();
  await startServer();
}

bootstrap();
