import React from 'react';
import { ShoppingBag, ShieldCheck, Search, Volume2, VolumeX, Coffee, Clock, LogOut, Sparkles, Menu } from 'lucide-react';
import { CartItem, AdminNotification, StoreSettings } from '../types';
import { MATCHA_AVENUE_LOGO } from '../assets/logo';

interface HeaderProps {
  activeView: 'customer' | 'admin' | 'tracker';
  setActiveView: (view: 'customer' | 'admin' | 'tracker') => void;
  cartItems: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  notifications: AdminNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onOpenTracker: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  // Auth Props (Admin Only)
  isAdminAuth: boolean;
  onLogoutAdmin: () => void;
  storeSettings?: StoreSettings;
  onOpenSideMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  cartItems,
  setIsCartOpen,
  unreadCount,
  soundEnabled,
  setSoundEnabled,
  onOpenTracker,
  searchQuery,
  setSearchQuery,
  isAdminAuth,
  onLogoutAdmin,
  storeSettings,
  onOpenSideMenu
}) => {
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const storeName = storeSettings?.storeName || 'Matcha Avenue Cafe';
  const tagline = storeSettings?.tagline || 'Artisan Matcha, Specialty Coffee & Gourmet Bakery';
  const currentLogo = storeSettings?.logoUrl || MATCHA_AVENUE_LOGO;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 text-stone-900 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-4">
          
          {/* Left: Hamburger Side Menu Trigger & Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {onOpenSideMenu && activeView === 'customer' && (
              <button
                onClick={onOpenSideMenu}
                className="p-2 sm:p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-amber-700 border border-stone-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 text-amber-700" />
                <span className="hidden xl:inline text-xs font-bold text-stone-700">Menu</span>
              </button>
            )}

            <div
              className={`flex items-center gap-3 shrink-0 select-none ${activeView === 'customer' ? 'cursor-pointer group' : ''}`}
              onClick={() => {
                if (activeView === 'customer') {
                  setActiveView('customer');
                }
              }}
            >
              <div className="relative">
                <img
                  src={currentLogo}
                  alt={storeName}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border border-emerald-300 shadow-xs group-hover:border-emerald-500 transition-all duration-300 group-hover:scale-105 bg-emerald-50"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-stone-900 group-hover:text-emerald-800 transition-colors">
                    {storeName}
                  </span>
                  {activeView === 'admin' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <ShieldCheck className="w-2.5 h-2.5" /> Admin Console
                    </span>
                  ) : (
                    <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Artisan Cafe
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 font-normal hidden md:block tracking-wide -mt-0.5">
                  {tagline}
                </p>
              </div>
            </div>
          </div>

          {/* Search Input Bar (Visible on Customer View) */}
          {activeView === 'customer' && (
            <div className="hidden md:flex items-center flex-1 max-w-md relative mx-2">
              <Search className="w-4 h-4 absolute left-3.5 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search coffee, pastries, dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-100/80 text-xs sm:text-sm text-stone-900 placeholder-stone-400 pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 shadow-inner transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-stone-400 hover:text-stone-700 text-xs font-bold p-1"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Action Buttons & Portal Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {activeView === 'admin' ? (
              /* ADMIN VIEW ACTIONS: Purely administrative controls */
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Switch back to customer menu */}
                <button
                  onClick={() => setActiveView('customer')}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 cursor-pointer shadow-xs active:scale-95"
                  title="Switch to Public Customer Storefront Menu"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline">View Store</span>
                </button>

                {/* Kitchen Audio Alert Chime Toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Kitchen Audio Chimes Active' : 'Kitchen Audio Chimes Muted'}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all border cursor-pointer ${
                    soundEnabled
                      ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                      : 'bg-stone-100 text-stone-400 border-stone-200 hover:text-stone-600'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
                </button>

                {/* Admin Logout button */}
                {isAdminAuth && (
                  <button
                    onClick={onLogoutAdmin}
                    title="Log out from Admin Account"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                )}
              </div>
            ) : (
              /* CUSTOMER VIEW ACTIONS */
              <>
                {/* Segmented View Switcher: Menu vs Admin Login */}
                <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 border border-stone-200">
                  <button
                    onClick={() => setActiveView('customer')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeView === 'customer'
                        ? 'bg-white text-stone-900 shadow-xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                    title="Explore Artisan Menu"
                  >
                    <Coffee className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">Menu</span>
                  </button>

                  <button
                    onClick={() => setActiveView('admin')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer text-stone-600 hover:text-stone-900"
                    title={isAdminAuth ? 'Admin Management Dashboard' : 'Staff & Admin Login'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
                    <span className="hidden sm:inline">
                      {isAdminAuth ? 'Admin' : 'Admin'}
                    </span>
                    {unreadCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ring-2 ring-white" />
                    )}
                  </button>
                </div>

                {/* Track Active Order Button */}
                <button
                  onClick={onOpenTracker}
                  title="Track Order Status"
                  className="p-2 sm:px-3 sm:py-2 rounded-xl text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="hidden md:inline">Track</span>
                </button>

                {/* Audio Alert Chime Toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Kitchen Audio Chimes Active' : 'Kitchen Audio Chimes Muted'}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all border cursor-pointer ${
                    soundEnabled
                      ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                      : 'bg-stone-100 text-stone-400 border-stone-200 hover:text-stone-600'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Shopping Cart Trigger Button */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2.5 sm:px-4 sm:py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                  title="Open Food Cart"
                >
                  <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white stroke-[2.2]" />
                  <span className="hidden sm:inline text-xs font-bold tracking-wide">Cart</span>
                  {totalCartCount > 0 && (
                    <span className="bg-white text-amber-800 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                      {totalCartCount}
                    </span>
                  )}
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
