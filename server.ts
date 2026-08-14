import express, { Request, Response } from 'express';
import path from 'path';
import net from 'net';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_NOTIFICATIONS, generateMySQLDump } from './src/data/initialData.js';
import { Product, Order, AdminNotification, OrderStatus, DashboardStats } from './src/types.js';

const app = express();
const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json());

// In-Memory Data Store (simulating MySQL Database for Phase 4 API integration)
let productsStore: Product[] = [...INITIAL_PRODUCTS];
let ordersStore: Order[] = [...INITIAL_ORDERS];
let notificationsStore: AdminNotification[] = [...INITIAL_NOTIFICATIONS];
let orderSequence = 1003;

// Helper to generate next order number
const getNextOrderNumber = () => {
  const num = orderSequence++;
  return `ORD-${num}`;
};

// ==========================================
// API ROUTES (Backend / API - Phase 4)
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
  const { name, category, price, description, image, available, isPopular, calories, preparationTimeMinutes } = req.body;
  if (!name || !price || !category) {
    res.status(400).json({ success: false, message: 'Name, category, and price are required.' });
    return;
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    category,
    price: Number(price),
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    available: available !== undefined ? Boolean(available) : true,
    isPopular: Boolean(isPopular),
    calories: calories ? Number(calories) : 500,
    preparationTimeMinutes: preparationTimeMinutes ? Number(preparationTimeMinutes) : 15
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

  productsStore[index] = {
    ...productsStore[index],
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : productsStore[index].price
  };

  res.json({ success: true, data: productsStore[index] });
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

// GET All Orders (excluding soft-deleted)
app.get('/api/orders', (req: Request, res: Response) => {
  const visibleOrders = ordersStore.filter((o) => !o.deleted);
  res.json({
    success: true,
    data: visibleOrders
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

// POST Create Order (Customer Ordering - Phase 5)
app.post('/api/orders', (req: Request, res: Response) => {
  const { customer, items, deliveryType, paymentMethod, subtotal, tax, deliveryFee, total } = req.body;

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
    paymentMethod: paymentMethod || 'cash',
    subtotal: Number(subtotal),
    tax: Number(tax),
    deliveryFee: Number(deliveryFee),
    total: Number(total),
    status: 'pending',
    deleted: false,
    createdAt: now,
    updatedAt: now
  };

  ordersStore.unshift(newOrder);

  // Trigger Admin Notification (Phase 6)
  const notification: AdminNotification = {
    id: `notif-${Date.now()}`,
    orderId,
    orderNumber: orderNum,
    customerName: customer.name,
    totalAmount: Number(total),
    message: `⚡ New Order #${orderNum} placed by ${customer.name} ($${Number(total).toFixed(2)})`,
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

// PATCH Update Order Status (Admin Dashboard - Phase 3 & 6)
app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, cancelledBy } = req.body as { status: OrderStatus; cancelledBy?: 'customer' | 'admin' };

  const order = ordersStore.find((o) => o.id === id || o.orderNumber === id);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }

  order.status = status;
  if (status === 'cancelled' && cancelledBy) {
    order.cancelledBy = cancelledBy;
  }
  order.updatedAt = new Date().toISOString();

  res.json({ success: true, data: order });
});

// DELETE Order (Admin) — soft delete: hide from live view but keep for stats & customer tracking
app.delete('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = ordersStore.find((o) => o.id === id || o.orderNumber === id);

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

  order.deleted = true;
  order.updatedAt = new Date().toISOString();

  res.json({ success: true, message: `Order ${order.orderNumber} deleted successfully.` });
});

// GET Admin Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  // Exclude notifications for cancelled or soft-deleted orders
  const excludedOrderIds = new Set(
    ordersStore
      .filter((o) => o.status === 'cancelled' || o.deleted)
      .map((o) => o.id)
  );

  const filteredNotifications = notificationsStore.filter(
    (n) => !excludedOrderIds.has(n.orderId)
  );
  const unreadCount = filteredNotifications.filter((n) => !n.read).length;
  res.json({
    success: true,
    data: filteredNotifications,
    unreadCount
  });
});

// DELETE Single Notification (Admin)
app.delete('/api/notifications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = notificationsStore.findIndex((n) => n.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Notification not found.' });
    return;
  }

  notificationsStore.splice(index, 1);
  res.json({ success: true, message: 'Notification deleted successfully.' });
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

// GET Admin Dashboard Analytics
app.get('/api/admin/stats', (req: Request, res: Response) => {
  // Exclude only cancelled orders from totals — deleted & delivered still count
  const nonCancelledOrders = ordersStore.filter((o) => o.status !== 'cancelled');

  const totalRevenue = ordersStore
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const totalOrders = nonCancelledOrders.length;
  const pendingOrders = ordersStore.filter((o) => o.status === 'pending' || o.status === 'preparing').length;
  const completedOrders = ordersStore.filter((o) => o.status === 'delivered').length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Aggregate product sales
  const productSalesMap: { [name: string]: { count: number; totalSales: number } } = {};
  ordersStore.forEach((o) => {
    if (o.status !== 'cancelled') {
      o.items.forEach((item) => {
        if (!productSalesMap[item.productName]) {
          productSalesMap[item.productName] = { count: 0, totalSales: 0 };
        }
        productSalesMap[item.productName].count += item.quantity;
        productSalesMap[item.productName].totalSales += item.subtotal;
      });
    }
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
    averageOrderValue,
    topProducts
  };

  res.json({ success: true, data: stats });
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

  // If the preferred port (3000) is occupied (e.g. another tool on 0.0.0.0:3000),
  // fall back to the next available port so the system always starts.
  const port = await getFreePort(PORT);

  app.listen(port, '0.0.0.0', () => {
    console.log(`Avenue Café server running on http://localhost:${port}`);
    console.log(`  Customer view : http://localhost:${port}/`);
    console.log(`  Admin dashboard: http://localhost:${port}/admin`);
    console.log(`  Health check  : http://localhost:${port}/api/health`);
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

startServer();
