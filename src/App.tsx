import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CustomerView } from './components/CustomerView';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationToast } from './components/NotificationToast';
import { Category, Product, CartItem, Order, OrderStatus, AdminNotification, DashboardStats, DeliveryType, UserRole } from './types';
import { soundManager } from './utils/audio';
import { useAuth } from './utils/auth';

type View = 'landing' | 'customer' | 'admin' | 'tracker';

// Map the URL path to a view:
// "/admin" -> admin, "/customer" -> customer, everything else -> customer
const getViewFromPath = (): View => {
  if (window.location.pathname.startsWith('/admin')) return 'admin';
  if (window.location.pathname.startsWith('/customer')) return 'customer';
  return 'customer';
};

export default function App() {
  const { user, isAuthenticated, login, logout, role } = useAuth();

  // Current view state (customer or admin)
  const [activeView, setActiveView] = useState<View>(getViewFromPath());

  const [categories] = useState<Category[]>([
    'All',
    'Espresso & Coffee',
    'Cold Brew & Frappes',
    'Artisan Teas',
    'Pastries & Bakery',
    'Gourmet Paninis',
    'Desserts'
  ]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  // Admin login panel (embedded in the customer view, right side)
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [activeTrackOrder, setActiveTrackOrder] = useState<Order | null>(null);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);

  // Admin Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    topProducts: []
  });

  // Sound and Toast alert state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeToast, setActiveToast] = useState<AdminNotification | null>(null);
  const prevNotifIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    soundManager.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Navigate between landing ("/"), customer ("/customer") and admin ("/admin")
  const navigate = (view: View) => {
    const path =
      view === 'admin' ? '/admin' : view === 'customer' ? '/customer' : '/';
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setActiveView(view);
  };

  // Keep the view in sync when the user uses the browser back/forward buttons
  useEffect(() => {
    const onPopState = () => setActiveView(getViewFromPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Admin login / logout (via AuthProvider)
  const handleAdminLogin = (success: boolean) => {
    if (success) {
      login('admin', 'admin123');
      navigate('admin');
    }
  };

  const handleAdminLogout = () => {
    logout();
    setIsAdminLoginOpen(false);
    navigate('customer');
  };

  // Initial Fetch Data
  const fetchAllData = async () => {
    try {
      const [menuRes, ordersRes, notifRes, statsRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/orders'),
        fetch('/api/notifications'),
        fetch('/api/admin/stats')
      ]);

      if (menuRes.ok) {
        const m = await menuRes.json();
        if (m.success) setProducts(m.data);
      }

      if (ordersRes.ok) {
        const o = await ordersRes.json();
        if (o.success) setOrders(o.data);
      }

      if (notifRes.ok) {
        const n = await notifRes.json();
        if (n.success) {
          setNotifications(n.data);
          setUnreadCount(n.unreadCount);

          // Check if new notification arrived for Audio Chiming (Phase 6)
          const newIds = new Set<string>(n.data.map((item: AdminNotification) => item.id));
          if (prevNotifIdsRef.current.size > 0) {
            const newlyAdded = n.data.filter((item: AdminNotification) => !prevNotifIdsRef.current.has(item.id));
            if (newlyAdded.length > 0) {
              soundManager.playOrderChime();
              setActiveToast(newlyAdded[0]);
            }
          }
          prevNotifIdsRef.current = newIds;
        }
      }

      if (statsRes.ok) {
        const s = await statsRes.json();
        if (s.success) setStats(s.data);
      }
    } catch (err) {
      console.warn('API sync error:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Poll API every 3.5 seconds for real-time customer ↔ admin sync & notifications
    const interval = setInterval(fetchAllData, 3500);
    return () => clearInterval(interval);
  }, []);

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number, notes?: string) => {
    soundManager.playClick();
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id && item.notes === notes);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity, notes }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    soundManager.playClick();
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    soundManager.playClick();
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Order Success Handler (Phase 5 & 6)
  const handleOrderSuccess = (newOrder: Order) => {
    soundManager.playOrderChime();
    setCartItems([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setActiveTrackOrder(newOrder);
    setIsTrackerOpen(true);
    fetchAllData();
  };

  // Admin Actions
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    soundManager.playClick();
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cancelledBy: status === 'cancelled' ? 'admin' : undefined })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleCustomerCancelOrder = async (orderId: string) => {
    soundManager.playClick();
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancelledBy: 'customer' })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Cancel order error:', err);
    }
  };

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error('Add product error:', err);
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      const res = await fetch(`/api/menu/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error('Update product error:', err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/menu/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error('Delete order error:', err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read', { method: 'POST' });
      setUnreadCount(0);
      fetchAllData();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notifId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* Header Navigation (hidden on the landing page) */}
      {activeView !== 'landing' && (
      <Header
        activeView={activeView}
        setActiveView={navigate}
        cartItems={cartItems}
        setIsCartOpen={setIsCartOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogout={handleAdminLogout}
        user={user}
        role={role}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      )}

      {/* Main Content Area */}
      <main>
        {activeView === 'admin' && isAuthenticated && role === 'admin' ? (
          <AdminDashboard
            orders={orders}
            products={products}
            categories={categories}
            notifications={notifications}
            stats={stats}
            unreadCount={unreadCount}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onDeleteOrder={handleDeleteOrder}
            onDeleteNotification={handleDeleteNotification}
            onMarkNotificationsRead={handleMarkNotificationsRead}
          />
        ) : (
          <CustomerView
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddToCart={handleAddToCart}
            adminLoginOpen={activeView === 'admin' || isAdminLoginOpen}
            setAdminLoginOpen={setIsAdminLoginOpen}
            onAdminLogin={handleAdminLogin}
          />
        )}
      </main>

      {/* Cart Side Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        deliveryType={deliveryType}
        setDeliveryType={setDeliveryType}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        deliveryType={deliveryType}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Live Order Tracker Modal */}
      <OrderTrackerModal
        key={activeTrackOrder?.id || 'tracker-empty'}
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        activeOrder={activeTrackOrder}
        onCancelOrder={handleCustomerCancelOrder}
      />

      {/* Real-time Order Arrival Toast Alert (Phase 6) */}
      <NotificationToast
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
        onViewOrders={() => navigate('admin')}
      />

    </div>
  );
}
