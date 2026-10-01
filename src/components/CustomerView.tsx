import React, { useState, useEffect } from 'react';
import { Search, Flame, Clock, Plus, Minus, Check, Star, Info, Coffee, Sparkles, ChevronRight, Megaphone, MapPin, ShoppingBag, ArrowRight, Heart, X, PackageCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Product, CartItem, Order, StoreSettings } from '../types';
import { formatPeso } from '../utils/format';
import { DEFAULT_STORE_SETTINGS } from '../data/initialData';
import { AiOrderingAssistant } from './AiOrderingAssistant';

interface CustomerViewProps {
  products: Product[];
  categories: Category[];
  selectedCategory: Category;
  setSelectedCategory: (cat: Category) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onAddToCart: (product: Product, quantity: number, notes?: string) => void;
  onGoToAdmin?: () => void;
  activeOrder?: Order | null;
  onOpenTracker?: () => void;
  onDismissActiveOrder?: () => void;
  storeSettings?: StoreSettings;
  cartItems?: CartItem[];
  setIsCartOpen?: (open: boolean) => void;
  onOpenSideMenu?: () => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  products,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onAddToCart,
  onGoToAdmin,
  activeOrder,
  onOpenTracker,
  onDismissActiveOrder,
  storeSettings = DEFAULT_STORE_SETTINGS,
  cartItems = [],
  setIsCartOpen,
  onOpenSideMenu
}) => {
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [modalNotes, setModalNotes] = useState<string>('');
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Auto-dismiss received order banner after 8 seconds
  useEffect(() => {
    if (activeOrder?.customerReceived && onDismissActiveOrder) {
      const timer = setTimeout(() => {
        onDismissActiveOrder();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [activeOrder?.customerReceived, onDismissActiveOrder]);

  // Quick preset barista customization tags
  const baristaPresets = [
    'Oat Milk (+₱20)',
    'Extra Espresso Shot (+₱30)',
    'Less Sweet (50%)',
    'Extra Hot',
    'Warm Pastry',
    'No Sugar',
    'Almond Milk'
  ];

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.badge && product.badge.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const onSaleProducts = products.filter((p) => p.isOnSale && p.available);
  const featuredProducts = products.filter((p) => (p.isFeatured || p.isPopular) && p.available);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setAddedAnimationId(product.id);
    setTimeout(() => setAddedAnimationId(null), 1200);
  };

  const handlePresetClick = (tag: string) => {
    if (modalNotes.includes(tag)) {
      setModalNotes(modalNotes.replace(tag, '').replace(/,\s*,/g, ',').trim());
    } else {
      setModalNotes(modalNotes ? `${modalNotes}, ${tag}` : tag);
    }
  };

  const handleModalAdd = () => {
    if (!selectedProductModal) return;
    onAddToCart(selectedProductModal, modalQuantity, modalNotes);
    setSelectedProductModal(null);
    setModalQuantity(1);
    setModalNotes('');
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 pb-28 relative selection:bg-amber-200 selection:text-amber-900">
      
      {/* Top Announcement Ribbon */}
      {storeSettings.announcementActive && storeSettings.announcementText && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs font-bold text-center shadow-xs flex items-center justify-center gap-2 tracking-wide">
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          {storeSettings.announcementBadge && (
            <span className="bg-amber-700 text-white text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
              {storeSettings.announcementBadge}
            </span>
          )}
          <span>{storeSettings.announcementText}</span>
        </div>
      )}

      {/* Active Order Banner Notification with Smooth Animated Fade */}
      <AnimatePresence>
        {activeOrder && onOpenTracker && (
          <motion.div
            key={activeOrder.id + (activeOrder.customerReceived ? '-received' : '-active')}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`border-b px-4 py-2.5 backdrop-blur-md sticky top-16 z-30 shadow-xs transition-colors overflow-hidden ${
              activeOrder.customerReceived
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/95 border-amber-200 text-amber-950'
            }`}
          >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                {activeOrder.customerReceived ? (
                  <span className="flex h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                ) : (
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
                  </span>
                )}
                
                <span className="font-bold text-stone-900 font-mono">{activeOrder.orderNumber}</span>
                <span className="text-stone-300">•</span>
                
                {activeOrder.customerReceived ? (
                  <span className="text-emerald-900 font-semibold flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Order Delivered & Received! Thank you for dining with us.</span>
                  </span>
                ) : (
                  <span className="text-stone-700">
                    Status: <strong className="text-amber-800 uppercase font-bold">{activeOrder.status}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onOpenTracker}
                  className={`px-3.5 py-1.5 font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs text-xs justify-center ${
                    activeOrder.customerReceived
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  <span>{activeOrder.customerReceived ? 'View Receipt & Details' : 'Track Order Live'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {activeOrder.customerReceived && onDismissActiveOrder && (
                  <button
                    type="button"
                    onClick={onDismissActiveOrder}
                    className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/80 transition-colors cursor-pointer"
                    title="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="relative bg-white border-b border-stone-200 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Custom hero banner image (admin -> Store Customizer -> Hero Banner Background) */}
        {storeSettings.heroImage ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("${storeSettings.heroImage}")` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/50 pointer-events-none" />
          </>
        ) : (
          /* Ambient warm gradient background */
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 via-white to-white pointer-events-none" />
        )}
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3.5">
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              <span>{storeSettings.heroBadgeText || `${storeSettings.storeName} • Fresh Daily`}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight leading-[1.2] mb-3">
              {storeSettings.heroHeadline}{' '}
              {storeSettings.heroHeadlineHighlight && (
                <span className="text-amber-700">
                  {storeSettings.heroHeadlineHighlight}
                </span>
              )}
            </h1>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
              {storeSettings.heroSubtitle}
            </p>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-5">
              <a
                href="#menu-section"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Browse Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <div className="flex items-center gap-1.5 text-xs text-stone-600 px-3 py-2 rounded-xl bg-stone-100 border border-stone-200">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span className="truncate max-w-xs">{storeSettings.storeAddress}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge Card */}
          <div className="grid grid-cols-3 gap-3 bg-stone-50 border border-stone-200 p-4 rounded-2xl shadow-xs w-full sm:w-auto shrink-0">
            <div className="text-center px-3 py-1">
              <span className="block text-2xl font-bold text-amber-800 font-display">{storeSettings.heroAvgMinsText || '10-15'}</span>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-0.5 block">Avg Prep (min)</span>
            </div>
            <div className="text-center px-3 py-1 border-x border-stone-200">
              <span className="block text-2xl font-bold text-amber-800 font-display">{storeSettings.heroRatingText || '4.9 ★'}</span>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-0.5 block">Rating</span>
            </div>
            <div className="text-center px-3 py-1">
              <span className="block text-2xl font-bold text-emerald-700 font-display">{storeSettings.heroQualityText || '100%'}</span>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-0.5 block">Fresh</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8" id="menu-section">

        {/* Mobile Search Bar */}
        <div className="md:hidden mb-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search coffee, pastries, dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-sm text-stone-900 placeholder-stone-400 pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 shadow-xs"
            />
          </div>
        </div>

        {/* ON-SALE & PROMOTIONS SECTION */}
        {onSaleProducts.length > 0 && !searchQuery && selectedCategory === 'All' && (
          <div className="mb-10 p-5 sm:p-6 bg-red-50/70 border border-red-200 rounded-2xl shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200">
                  <Flame className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                    <span>Special Deals &amp; Promos</span>
                    <span className="bg-red-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      Save Up to 25%
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500">Delicious café items at special promotional rates</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {onSaleProducts.map((product) => {
                const discountPct = product.salePrice && product.salePrice < product.price
                  ? Math.round(((product.price - product.salePrice) / product.price) * 100)
                  : 0;

                return (
                  <div
                    key={`sale-${product.id}`}
                    onClick={() => {
                      setSelectedProductModal(product);
                      setModalQuantity(1);
                    }}
                    className="group bg-white rounded-xl border border-red-200 hover:border-red-400 p-3 transition-all duration-200 hover:shadow-sm cursor-pointer flex gap-3 items-center"
                  >
                    <div className="relative shrink-0 w-18 h-18 rounded-lg overflow-hidden bg-stone-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {discountPct > 0 && (
                        <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                          -{discountPct}%
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded mb-0.5 uppercase">
                        ON SALE
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-stone-900 truncate group-hover:text-amber-800 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xs sm:text-sm font-bold text-red-600 font-mono">
                          {formatPeso(product.salePrice || product.price)}
                        </span>
                        <span className="text-[11px] text-stone-400 line-through font-mono">
                          {formatPeso(product.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FEATURED FAVORITES SHOWCASE */}
        {featuredProducts.length > 0 && !searchQuery && selectedCategory === 'All' && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200">
                <Star className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-stone-900">
                  Signature Favorites
                </h2>
                <p className="text-xs text-stone-500">Popular items ordered most frequently</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {featuredProducts.slice(0, 4).map((product) => {
                const effectivePrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;

                return (
                  <div
                    key={`popular-${product.id}`}
                    onClick={() => {
                      setSelectedProductModal(product);
                      setModalQuantity(1);
                    }}
                    className="group bg-white hover:bg-stone-50/80 rounded-xl border border-stone-200 hover:border-amber-300 p-3 transition-all duration-200 hover:shadow-sm cursor-pointer flex gap-3 items-center"
                  >
                    <div className="w-18 h-18 rounded-lg overflow-hidden bg-amber-50/60 border border-stone-200 shrink-0 flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Coffee className="w-7 h-7 text-amber-700/70 stroke-[1.6]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-[9px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mb-0.5">
                        {product.badge || 'POPULAR'}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-stone-900 truncate group-hover:text-amber-800 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-stone-900 font-mono">{formatPeso(effectivePrice)}</span>
                        {product.isOnSale && (
                          <span className="text-[10px] text-stone-400 line-through font-mono">{formatPeso(product.price)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-stone-500">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{product.preparationTimeMinutes || 5} min</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STICKY CATEGORIES FILTER BAR (MOBILE / TABLET QUICK SCROLL) */}
        <div className="lg:hidden sticky top-16 z-20 bg-[#faf9f6]/95 backdrop-blur-md py-2.5 border-b border-stone-200 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const catCount = cat === 'All' ? products.length : products.filter((p) => p.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCategory === cat ? 'bg-amber-800 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {catCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT: SIDE MENU (LEFT) + PRODUCTS GRID (RIGHT) */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          
          {/* DESKTOP CATEGORY SIDE MENU */}
          <aside className="hidden lg:block w-60 shrink-0 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-3.5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-stone-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  Categories
                </span>
                <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-mono">
                  {products.length} items
                </span>
              </div>

              <div className="space-y-1 pt-1">
                {categories.map((cat) => {
                  const count = cat === 'All' ? products.length : products.filter((p) => p.category === cat).length;
                  const isSelected = selectedCategory === cat;

                  return (
                    <button
                      key={`side-${cat}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                          : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-600'}`} />
                        <span>{cat}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected ? 'bg-amber-800 text-white' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Filter: On Sale / Signature */}
              {onSaleProducts.length > 0 && (
                <div className="pt-2 border-t border-stone-100">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('sale');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-red-600" />
                      <span>Promos &amp; Deals</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-red-200 text-red-800 px-1.5 py-0.5 rounded-full">
                      {onSaleProducts.length}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Food Basket Side Card */}
            {cartItems.length > 0 && setIsCartOpen && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-stone-900">Current Cart</span>
                  </div>
                  <span className="text-xs font-bold text-amber-800 font-mono">
                    {totalCartCount} items
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200">
                  <span className="text-stone-600">Subtotal:</span>
                  <span className="text-sm font-bold text-stone-900 font-mono">{formatPeso(cartSubtotal)}</span>
                </div>

                <button
                  onClick={() => setIsCartOpen(true)}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>View Cart</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Store Info Side Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-3.5 space-y-2 text-xs text-stone-600 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Café Hours &amp; Location
              </span>
              <div className="flex items-center gap-2 text-[11px] text-stone-700">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{storeSettings.operatingHours || '7:00 AM - 10:00 PM Daily'}</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-stone-700">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-tight">{storeSettings.storeAddress}</span>
              </div>
            </div>
          </aside>

          {/* MAIN PRODUCTS DISPLAY */}
          <div className="flex-1 min-w-0 w-full space-y-5">

            {/* Menu Section Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
                  <span>{selectedCategory} Items</span>
                  <span className="text-xs font-normal text-stone-500">({filteredProducts.length} items)</span>
                </h2>
              </div>
            </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 shadow-xs">
            <Coffee className="w-12 h-12 text-stone-400 mx-auto mb-2 stroke-[1.5]" />
            <h3 className="font-display text-base font-bold text-stone-800">No café items match your search</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              We couldn't find items matching "{searchQuery}". Try searching for espresso, latte, or croissant.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredProducts.map((product) => {
              const effectivePrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;
              const discountPct = product.salePrice && product.salePrice < product.price
                ? Math.round(((product.price - product.salePrice) / product.price) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    setSelectedProductModal(product);
                    setModalQuantity(1);
                  }}
                  className="group bg-white rounded-2xl border border-stone-200 hover:border-amber-400 overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col cursor-pointer relative"
                >
                  {/* Product Image Stage */}
                  <div className="relative aspect-[16/11] overflow-hidden bg-gradient-to-br from-stone-100 to-amber-50/40 flex items-center justify-center border-b border-stone-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-400 group-hover:text-amber-700 transition-colors py-6">
                        <Coffee className="w-10 h-10 stroke-[1.4] text-stone-300 group-hover:text-amber-600 transition-colors" />
                        <span className="text-[10px] font-medium tracking-wider uppercase mt-1.5 text-stone-400 font-mono">
                          {product.category}
                        </span>
                      </div>
                    )}
                    
                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                      {product.isOnSale && (
                        <span className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs font-mono flex items-center gap-1">
                          <Flame className="w-3 h-3" /> SALE -{discountPct}%
                        </span>
                      )}
                      {product.badge && (
                        <span className="bg-stone-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
                          {product.badge}
                        </span>
                      )}
                      {product.isPopular && !product.isOnSale && (
                        <span className="bg-amber-500 text-stone-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Star className="w-3 h-3 fill-stone-950" /> Bestseller
                        </span>
                      )}
                    </div>

                    {/* Prep Time Pill */}
                    <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-stone-200 text-[11px] font-medium text-stone-700 flex items-center gap-1 shadow-xs">
                      <Clock className="w-3 h-3 text-stone-500" />
                      <span>{product.preparationTimeMinutes || 5}m</span>
                    </div>
                  </div>

                  {/* Card Content & Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                          {product.category}
                        </span>
                        {product.calories && (
                          <span className="text-[10px] text-stone-400 font-mono">{product.calories} kcal</span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-stone-900 text-sm sm:text-base group-hover:text-amber-800 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                        {product.description}
                      </p>
                    </div>

                    {/* Price and Add Action */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm sm:text-base font-bold text-stone-900 font-mono">
                          {formatPeso(effectivePrice)}
                        </span>
                        {product.isOnSale && (
                          <span className="text-xs text-stone-400 line-through font-mono">
                            {formatPeso(product.price)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        disabled={!product.available}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                          addedAnimationId === product.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : product.available
                            ? 'bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-200 active:scale-95'
                            : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        {addedAnimationId === product.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Added
                          </>
                        ) : product.available ? (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Add
                          </>
                        ) : (
                          'Sold Out'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </div>
        </div>
      </div>

      {/* PRODUCT DETAIL & BARISTA CUSTOMIZATION MODAL */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 my-auto max-h-[92vh] flex flex-col">
            
            {/* Header Image Stage */}
            <div className="relative aspect-video sm:aspect-[16/9] max-h-56 shrink-0 bg-gradient-to-br from-stone-100 to-amber-50/60 flex items-center justify-center border-b border-stone-100 overflow-hidden">
              {selectedProductModal.image ? (
                <img
                  src={selectedProductModal.image}
                  alt={selectedProductModal.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-400">
                  <Coffee className="w-12 h-12 stroke-[1.4] text-amber-700/60" />
                  <span className="text-xs font-bold tracking-wider uppercase mt-2 text-stone-500 font-mono">
                    {selectedProductModal.category}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-3 right-3 bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 p-1.5 rounded-full border border-stone-200 cursor-pointer transition-colors shadow-xs z-10"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Body - Fully visible without truncation */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg uppercase">
                    {selectedProductModal.category}
                  </span>
                  {selectedProductModal.calories && (
                    <span className="text-xs text-stone-500 font-mono bg-stone-100 px-2 py-0.5 rounded-md">
                      {selectedProductModal.calories} kcal
                    </span>
                  )}
                  {selectedProductModal.preparationTimeMinutes && (
                    <span className="text-xs text-stone-500 font-mono bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" /> {selectedProductModal.preparationTimeMinutes}m
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-stone-900 font-mono">
                    {formatPeso(
                      selectedProductModal.isOnSale && selectedProductModal.salePrice
                        ? selectedProductModal.salePrice
                        : selectedProductModal.price
                    )}
                  </span>
                  {selectedProductModal.isOnSale && (
                    <span className="text-xs text-stone-400 line-through font-mono">
                      {formatPeso(selectedProductModal.price)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-stone-900 break-words">{selectedProductModal.name}</h2>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mt-1.5 break-words">{selectedProductModal.description}</p>
              </div>

              {/* Quick Barista Presets */}
              <div className="pt-2 border-t border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                  Optional Barista Customizations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {baristaPresets.map((preset) => {
                    const isSelected = modalNotes.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 font-semibold shadow-xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-amber-400 hover:bg-stone-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Barista / Kitchen Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-600" /> Special Requests & Instructions
                </label>
                <textarea
                  placeholder="e.g. Extra hot, decaf, less ice, warm pastry, oat milk..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors"
                  rows={2}
                />
              </div>
            </div>

            {/* Footer with Quantity Stepper & Final Add Button */}
            <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-stone-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="p-2 rounded-lg bg-stone-50 text-stone-700 hover:bg-stone-200 cursor-pointer transition-colors"
                  title="Decrease"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm text-stone-900 px-3 font-mono">{modalQuantity}</span>
                <button
                  type="button"
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="p-2 rounded-lg bg-stone-50 text-stone-700 hover:bg-stone-200 cursor-pointer transition-colors"
                  title="Increase"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleModalAdd}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Add to Order</span>
                <span>•</span>
                <span className="font-mono">
                  {formatPeso(
                    (selectedProductModal.isOnSale && selectedProductModal.salePrice
                      ? selectedProductModal.salePrice
                      : selectedProductModal.price) * modalQuantity
                  )}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING MOBILE CART BAR */}
      {totalCartCount > 0 && setIsCartOpen && (
        <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-amber-600 text-white p-3 rounded-xl shadow-lg flex items-center justify-between font-bold active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-800 text-white flex items-center justify-center text-xs font-mono font-bold">
                {totalCartCount}
              </div>
              <span className="text-xs uppercase tracking-wider">View Cart</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold">{formatPeso(cartSubtotal)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Footer / Store Information */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-stone-200 text-stone-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display text-xs sm:text-sm font-bold text-stone-900">{storeSettings.storeName} Flagship</span>
              <p className="text-[11px] text-stone-500">{storeSettings.storeAddress}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-500 font-mono">{storeSettings.operatingHours}</span>
          </div>
        </div>
      </footer>
      {/* AI Assistant for Conversational Ordering (menue.io style) */}
      <AiOrderingAssistant
        products={products}
        onAddToCart={onAddToCart}
        storeSettings={storeSettings}
        onOpenCart={() => setIsCartOpen && setIsCartOpen(true)}
      />
    </div>
  );
};

