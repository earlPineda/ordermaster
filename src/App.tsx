import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { CustomerView } from './components/CustomerView';
import { SideMenuDrawer } from './components/SideMenuDrawer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { NotificationToast } from './components/NotificationToast';
import {
  Category,
  Product,
  CartItem,
  Order,
  OrderStatus,
  AdminNotification,
  DashboardStats,
  DeliveryType,
  GoogleSheetsSyncConfig,
  StoreSettings
} from './types';
import { DEFAULT_STORE_SETTINGS } from './data/initialData';
import { soundManager } from './utils/audio';
import { initAuth, googleSignIn, logoutGoogle, getAccessToken } from './services/googleAuth';
import {
  getOrCreateCafeSpreadsheet,
  logOrderToGoogleSheet,
  syncAllOrdersToGoogleSheet,
  syncMenuCatalogToGoogleSheet,
  updateOrderStatusInGoogleSheet
} from './services/googleSheets';

export default function App() {
  // Main view state: defaults directly to 'customer' view!
  const [activeView, setActiveViewInternal] = useState<'customer' | 'admin' | 'tracker'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/admin')) {
        return 'admin';
      }
    }
    // Default initial page is the Customer View!
    return 'customer';
  });

  const setActiveView = (view: 'customer' | 'admin' | 'tracker') => {
    setActiveViewInternal(view);
    if (typeof window !== 'undefined') {
      let targetPath = '/';
      if (view === 'admin') targetPath = '/admin';
      else if (view === 'customer') targetPath = '/';

      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        setActiveViewInternal('admin');
      } else {
        setActiveViewInternal('customer');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Admin Account Authentication State (Admin is the only login account)
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(() => {
    return localStorage.getItem('avenue_admin_authenticated') === 'true';
  });
  const [adminUser, setAdminUser] = useState<string>('Default Admin');

  const handleAdminLoginSuccess = (userName: string) => {
    setIsAdminAuth(true);
    setAdminUser(userName);
    localStorage.setItem('avenue_admin_authenticated', 'true');
    setActiveView('admin');
    soundManager.playClick();
  };

  const handleLogoutAdmin = () => {
    setIsAdminAuth(false);
    localStorage.removeItem('avenue_admin_authenticated');
    setActiveView('customer');
  };

  // Google Sheets & Drive Cloud Storage State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetsSyncConfig>(() => {
    const saved = localStorage.getItem('avenue_google_sheet_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      spreadsheetId: null,
      spreadsheetUrl: null,
      spreadsheetTitle: 'Avenue Café - Live Orders & Cloud Database',
      autoSyncOrders: true,
      lastSyncedAt: null
    };
  });

  const saveSheetConfig = (updater: (prev: GoogleSheetsSyncConfig) => GoogleSheetsSyncConfig) => {
    setSheetConfig((prev) => {
      const next = updater(prev);
      localStorage.setItem('avenue_google_sheet_config', JSON.stringify(next));
      return next;
    });
  };

  const addSyncLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSyncLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Listen to Google Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
        addSyncLog(`Google account session active: ${user.email}`);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
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

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [activeTrackOrder, setActiveTrackOrder] = useState<Order | null>(null);

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

  // Store Customization Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    soundManager.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Initial Fetch Data
  const fetchAllData = async () => {
    try {
      const [menuRes, ordersRes, notifRes, statsRes, settingsRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/orders'),
        fetch('/api/notifications'),
        fetch('/api/admin/stats'),
        fetch('/api/settings')
      ]);

      if (menuRes.ok) {
        const m = await menuRes.json();
        if (m.success) setProducts(m.data);
      }

      if (ordersRes.ok) {
        const o = await ordersRes.json();
        if (o.success) setOrders(o.data);
      }

      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.success && s.data) setStoreSettings(s.data);
      }

      if (notifRes.ok) {
        const n = await notifRes.json();
        if (n.success) {
          setNotifications(n.data);
          setUnreadCount(n.unreadCount);

          // Check if new notification arrived for Audio Chiming
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

  // Google Sheets Action Handlers
  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleAccessToken(result.accessToken);
        addSyncLog(`Google Sign-In successful: ${result.user.email}`);

        // Automatically connect or create the Avenue Café Spreadsheet
        try {
          const info = await getOrCreateCafeSpreadsheet(result.accessToken);
          saveSheetConfig((prev) => ({
            ...prev,
            spreadsheetId: info.id,
            spreadsheetUrl: info.url,
            spreadsheetTitle: info.name,
            lastSyncedAt: new Date().toISOString()
          }));
          addSyncLog(
            info.createdNew
              ? `Created brand new Google Sheet: "${info.name}"`
              : `Connected existing Google Sheet: "${info.name}"`
          );
        } catch (sheetErr: any) {
          addSyncLog(`Error linking Google Sheet: ${sheetErr.message || 'Unknown error'}`);
        }
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      addSyncLog(`Google Sign-In error: ${err.message || 'Authorization failed'}`);
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleAccessToken(null);
      addSyncLog('Google account disconnected.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectSpreadsheet = async () => {
    let token = googleAccessToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      await handleGoogleSignIn();
      return;
    }

    try {
      const info = await getOrCreateCafeSpreadsheet(token);
      saveSheetConfig((prev) => ({
        ...prev,
        spreadsheetId: info.id,
        spreadsheetUrl: info.url,
        spreadsheetTitle: info.name,
        lastSyncedAt: new Date().toISOString()
      }));
      addSyncLog(
        info.createdNew
          ? `Created brand new Google Sheet on Drive: "${info.name}"`
          : `Linked existing Google Sheet from Drive: "${info.name}"`
      );
    } catch (err: any) {
      console.error(err);
      addSyncLog(`Spreadsheet connection error: ${err.message}`);
    }
  };

  const handleSyncAllOrders = async () => {
    let token = googleAccessToken;
    if (!token) token = await getAccessToken();
    if (!token) {
      await handleGoogleSignIn();
      return;
    }
    if (!sheetConfig.spreadsheetId) {
      await handleConnectSpreadsheet();
      return;
    }

    try {
      addSyncLog('Exporting all store orders to Google Sheet...');
      const count = await syncAllOrdersToGoogleSheet(token, sheetConfig.spreadsheetId, orders);
      saveSheetConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      addSyncLog(`Successfully uploaded ${count} order rows to Google Sheets!`);
    } catch (err: any) {
      console.error(err);
      addSyncLog(`Failed to sync orders: ${err.message}`);
    }
  };

  const handleSyncMenuCatalog = async () => {
    let token = googleAccessToken;
    if (!token) token = await getAccessToken();
    if (!token) {
      await handleGoogleSignIn();
      return;
    }
    if (!sheetConfig.spreadsheetId) {
      await handleConnectSpreadsheet();
      return;
    }

    try {
      addSyncLog('Syncing menu dishes catalog to Google Sheets...');
      const count = await syncMenuCatalogToGoogleSheet(token, sheetConfig.spreadsheetId, products);
      saveSheetConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      addSyncLog(`Exported ${count} menu dishes to "Menu & Pricing" tab in Google Sheets!`);
    } catch (err: any) {
      console.error(err);
      addSyncLog(`Failed to sync menu: ${err.message}`);
    }
  };

  const handleToggleAutoSync = () => {
    saveSheetConfig((prev) => {
      const nextVal = !prev.autoSyncOrders;
      addSyncLog(`Auto-sync orders turned ${nextVal ? 'ON' : 'OFF'}`);
      return { ...prev, autoSyncOrders: nextVal };
    });
  };

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

  // Order Success Handler + Google Sheets Auto-Sync
  const handleOrderSuccess = async (newOrder: Order) => {
    soundManager.playOrderChime();
    setCartItems([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setActiveTrackOrder(newOrder);
    setIsTrackerOpen(true);
    fetchAllData();

    // Live Google Sheets Cloud Sync
    if (sheetConfig.spreadsheetId && sheetConfig.autoSyncOrders) {
      try {
        let token = googleAccessToken;
        if (!token) token = await getAccessToken();
        if (token) {
          const success = await logOrderToGoogleSheet(token, sheetConfig.spreadsheetId, newOrder);
          if (success) {
            addSyncLog(`Live synced new order ${newOrder.orderNumber} to Google Sheets!`);
            saveSheetConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
          }
        }
      } catch (err: any) {
        console.warn('Google Sheets live append failed:', err);
      }
    }
  };

  // Admin Actions
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    soundManager.playClick();
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAllData();

        // Update Google Sheets row status if connected
        const targetOrder = orders.find((o) => o.id === orderId);
        if (targetOrder && sheetConfig.spreadsheetId && sheetConfig.autoSyncOrders) {
          try {
            let token = googleAccessToken;
            if (!token) token = await getAccessToken();
            if (token) {
              await updateOrderStatusInGoogleSheet(
                token,
                sheetConfig.spreadsheetId,
                targetOrder.orderNumber,
                status
              );
              addSyncLog(`Updated status of order ${targetOrder.orderNumber} to "${status.toUpperCase()}" in Google Sheets.`);
            }
          } catch (sheetErr) {
            console.warn('Sheet status update error:', sheetErr);
          }
        }
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    soundManager.playClick();
    // Optimistic UI removal
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (activeTrackOrder?.id === orderId) {
      setActiveTrackOrder(null);
    }
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Delete order error:', err);
      fetchAllData();
    }
  };

  const handleDismissActiveOrder = () => {
    setActiveTrackOrder(null);
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
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...product } : p))
    );

    try {
      const res = await fetch(`/api/menu/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? json.data : p))
          );
        }
      }
    } catch (err) {
      console.error('Update product error:', err);
      fetchAllData();
    }
  };

  const handleResetDiscounts = async (category?: string, productId?: string) => {
    // Optimistic UI reset
    setProducts((prev) =>
      prev.map((p) => {
        let matches = false;
        if (productId && p.id === productId) matches = true;
        else if (category && category !== 'All' && p.category === category) matches = true;
        else if (!category || category === 'All') matches = true;

        if (matches) {
          return {
            ...p,
            isOnSale: false,
            salePrice: undefined,
            badge: p.badge === 'ON SALE' || p.badge?.includes('% OFF') ? undefined : p.badge
          };
        }
        return p;
      })
    );

    try {
      const res = await fetch('/api/menu/reset-discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, productId })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setProducts(json.data);
        }
      }
    } catch (err) {
      console.error('Reset discounts error:', err);
      fetchAllData();
    }
  };

  const handleApplyBatchDiscount = async (category: string, discountPercent: number) => {
    const pct = Math.max(1, Math.min(99, Number(discountPercent) || 15));
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => {
        let matches = false;
        if (category && category !== 'All' && p.category === category) matches = true;
        else if (!category || category === 'All') matches = true;

        if (matches) {
          const discounted = Math.round(p.price * (1 - pct / 100));
          return {
            ...p,
            isOnSale: true,
            salePrice: discounted,
            badge: `${pct}% OFF`
          };
        }
        return p;
      })
    );

    try {
      const res = await fetch('/api/menu/apply-batch-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, discountPercent: pct })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setProducts(json.data);
        }
      }
    } catch (err) {
      console.error('Batch discount error:', err);
      fetchAllData();
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

  const handleMarkNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read', { method: 'POST' });
      setUnreadCount(0);
      fetchAllData();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleSaveStoreSettings = async (updated: StoreSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setStoreSettings(result.data);
        }
      }
    } catch (err) {
      console.error('Save store settings error:', err);
    }
  };

  const handleResetStoreSettings = async () => {
    try {
      const res = await fetch('/api/settings/reset', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setStoreSettings(result.data);
        }
      }
    } catch (err) {
      console.error('Reset store settings error:', err);
    }
  };

  const handleTrackerOrderUpdate = (updatedOrder: Order) => {
    setActiveTrackOrder(updatedOrder);
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    fetchAllData();
  };

  return (
    <div className="min-h-screen bg-[#0e0c0a] text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      
      {/* Top Application Header (Visible on Customer & Login views) */}
      {!(activeView === 'admin' && isAdminAuth) && (
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          cartItems={cartItems}
          setIsCartOpen={setIsCartOpen}
          notifications={notifications}
          unreadCount={unreadCount}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          onOpenTracker={() => setIsTrackerOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isAdminAuth={isAdminAuth}
          onLogoutAdmin={handleLogoutAdmin}
          storeSettings={storeSettings}
          onOpenSideMenu={() => setIsSideMenuOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main>
        {activeView === 'customer' && (
          <CustomerView
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddToCart={handleAddToCart}
            onGoToAdmin={() => setActiveView('admin')}
            activeOrder={activeTrackOrder}
            onOpenTracker={() => setIsTrackerOpen(true)}
            onDismissActiveOrder={handleDismissActiveOrder}
            storeSettings={storeSettings}
            cartItems={cartItems}
            setIsCartOpen={setIsCartOpen}
            onOpenSideMenu={() => setIsSideMenuOpen(true)}
          />
        )}

        {activeView === 'admin' && (
          !isAdminAuth ? (
            <AdminLogin
              onLoginSuccess={handleAdminLoginSuccess}
              onBackToCustomer={() => setActiveView('customer')}
            />
          ) : (
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
              onDeleteOrder={handleDeleteOrder}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onMarkNotificationsRead={handleMarkNotificationsRead}
              onResetDiscounts={handleResetDiscounts}
              onApplyBatchDiscount={handleApplyBatchDiscount}
              adminUser={adminUser}
              onLogout={handleLogoutAdmin}
              onViewStore={() => setActiveView('customer')}
              storeSettings={storeSettings}
              onSaveStoreSettings={handleSaveStoreSettings}
              onResetStoreSettings={handleResetStoreSettings}
              googleUser={googleUser}
              googleAccessToken={googleAccessToken}
              sheetConfig={sheetConfig}
              isGoogleSigningIn={isGoogleSigningIn}
              onGoogleSignIn={handleGoogleSignIn}
              onGoogleSignOut={handleGoogleSignOut}
              onConnectSpreadsheet={handleConnectSpreadsheet}
              onSyncAllOrders={handleSyncAllOrders}
              onSyncMenuCatalog={handleSyncMenuCatalog}
              onToggleAutoSync={handleToggleAutoSync}
              syncLogs={syncLogs}
            />
          )
        )}
      </main>

      {/* Slide-out Side Menu Drawer */}
      <SideMenuDrawer
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        products={products}
        activeView={activeView}
        setActiveView={setActiveView}
        cartItems={cartItems}
        setIsCartOpen={setIsCartOpen}
        activeOrder={activeTrackOrder}
        onOpenTracker={() => setIsTrackerOpen(true)}
        isAdminAuth={isAdminAuth}
        storeSettings={storeSettings}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        unreadCount={unreadCount}
      />

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

      {/* Checkout Modal with Google Maps Location Picker */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        deliveryType={deliveryType}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Live Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        activeOrder={activeTrackOrder}
        onOrderUpdated={handleTrackerOrderUpdate}
      />

      {/* Real-time Order Arrival Toast Alert */}
      <NotificationToast
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
        onViewOrders={() => setActiveView('admin')}
      />

    </div>
  );
}
