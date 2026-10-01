import React from 'react';
import { MATCHA_AVENUE_LOGO } from '../assets/logo';
import {
  X,
  Coffee,
  ShoppingBag,
  Flame,
  Star,
  Clock,
  MapPin,
  Phone,
  Volume2,
  VolumeX,
  ChevronRight,
  Sparkles,
  Utensils,
  Store,
  Compass,
  Tag,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Category, Product, CartItem, Order, StoreSettings } from '../types';
import { formatPeso } from '../utils/format';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: Category;
  setSelectedCategory: (cat: Category) => void;
  products: Product[];
  activeView: 'customer' | 'admin' | 'tracker';
  setActiveView: (view: 'customer' | 'admin' | 'tracker') => void;
  cartItems: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  activeOrder?: Order | null;
  onOpenTracker: () => void;
  isAdminAuth: boolean;
  storeSettings?: StoreSettings;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  unreadCount?: number;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  setSelectedCategory,
  products,
  activeView,
  setActiveView,
  cartItems,
  setIsCartOpen,
  activeOrder,
  onOpenTracker,
  isAdminAuth,
  storeSettings,
  soundEnabled,
  setSoundEnabled,
  unreadCount = 0
}) => {
  if (!isOpen) return null;

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const onSaleCount = products.filter((p) => p.isOnSale && p.available).length;
  const storeName = storeSettings?.storeName || 'Matcha Avenue Cafe';
  const tagline = storeSettings?.tagline || 'Artisan Matcha, Coffee & Gourmet Bakery';
  const currentLogo = storeSettings?.logoUrl || MATCHA_AVENUE_LOGO;

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setActiveView('customer');
    onClose();
    // Smooth scroll to menu section
    setTimeout(() => {
      const menuEl = document.getElementById('menu-section');
      if (menuEl) {
        menuEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleNavClick = (view: 'customer' | 'admin' | 'tracker') => {
    setActiveView(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="side-menu-modal">
      {/* Light Blur Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Slide-out Sidebar Panel from Left */}
      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        <aside className="w-screen max-w-sm bg-white border-r border-stone-200 text-stone-900 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
          
          {/* Top Brand Header */}
          <div className="p-5 border-b border-stone-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentLogo}
                alt={storeName}
                className="w-9 h-9 rounded-xl object-cover border border-emerald-200 shadow-xs bg-emerald-50"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm text-stone-900">
                    {storeName}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Open
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-normal truncate max-w-[180px]">
                  {tagline}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
              title="Close Side Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Navigation Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
            
            {/* Quick Primary Actions */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 px-3 block mb-1">
                Main Menu
              </span>

              {/* Explore Menu */}
              <button
                onClick={() => handleNavClick('customer')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'customer'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Coffee className="w-4 h-4 shrink-0" />
                  <span>Browse Menu</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  activeView === 'customer' ? 'bg-amber-800 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {products.length}
                </span>
              </button>

              {/* My Food Cart */}
              <button
                onClick={() => {
                  onClose();
                  setIsCartOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>My Basket</span>
                </div>
                {totalCartCount > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-stone-900 font-bold">{formatPeso(cartSubtotal)}</span>
                    <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {totalCartCount}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-stone-400 font-mono">0 items</span>
                )}
              </button>

              {/* Live Order Tracker */}
              <button
                onClick={() => {
                  onClose();
                  onOpenTracker();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>Track Order</span>
                </div>
                {activeOrder ? (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    {activeOrder.orderNumber}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                )}
              </button>
            </div>

            {/* Menu Categories Quick Jump */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between px-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Categories
                </span>
                {onSaleCount > 0 && (
                  <span className="text-[9px] bg-red-50 text-red-700 font-mono px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1 font-bold">
                    <Flame className="w-2.5 h-2.5 text-red-600" /> {onSaleCount} on sale
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-1">
                {categories.map((cat) => {
                  const count = cat === 'All' ? products.length : products.filter((p) => p.category === cat).length;
                  const isSelected = selectedCategory === cat && activeView === 'customer';

                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-600' : 'bg-stone-300'}`} />
                        <span>{cat}</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Store Information & Operations */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs text-stone-600">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Café Details
              </span>

              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-tight text-[11px] text-stone-700">
                  {storeSettings?.storeAddress || 'Crimson Street, Navarro, General Trias'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-[11px] text-stone-700">
                  {storeSettings?.operatingHours || 'Mon - Sun: 7:00 AM - 10:00 PM'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-[11px] text-stone-700">
                  {storeSettings?.storePhone || '+63 (02) 8888-CAFE'}
                </span>
              </div>
            </div>

            {/* Facebook Page & Meta AI Messenger */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                  Official Facebook Page
                </span>
                <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                  ID: 61592982062259
                </span>
              </div>
              <p className="text-[11px] text-blue-800 leading-snug">
                Follow our official Facebook Page for daily barista specials or chat directly with our Meta AI Barista.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="https://www.facebook.com/profile.php?id=61592982062259"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] text-center transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  <span>Facebook Page</span>
                </a>
                <a
                  href="https://m.me/61592982062259"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-2 bg-white hover:bg-stone-100 text-blue-700 border border-blue-200 rounded-lg font-semibold text-[11px] text-center transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  <span>Messenger</span>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Settings & Audio Bar */}
          <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex-1 flex items-center justify-between p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-medium transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2">
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
                <span>Notification Sounds</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${soundEnabled ? 'text-emerald-700' : 'text-stone-400'}`}>
                {soundEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
};
