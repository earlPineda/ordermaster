import React from 'react';
import { ShoppingBag, ShieldCheck, Search, Bell, Volume2, VolumeX, Coffee, Clock, LogOut } from 'lucide-react';
import { CartItem, AdminNotification } from '../types';

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
  onLogout: () => void;
  user: { id: string; name: string; email: string; role: UserRole } | null;
  role: UserRole | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  cartItems,
  setIsCartOpen,
  notifications,
  unreadCount,
  soundEnabled,
  setSoundEnabled,
  onOpenTracker,
  onLogout,
  user,
  role,
  searchQuery,
  setSearchQuery
}) => {
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeView === 'admin' ? (
          /* ================= ADMIN HEADER (own localhost: /admin) ================= */
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">Avenue <span className="text-amber-400">Café</span></span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Dashboard & Order Management</p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Unread Notification Badge */}
              <button
                onClick={() => setActiveView('admin')}
                title="Notifications"
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50 transition-all"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full px-1 flex items-center justify-center border border-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Audio Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Order Alert Audio On' : 'Order Alert Audio Muted'}
                className={`p-2 rounded-xl transition-all border ${
                  soundEnabled
                    ? 'bg-slate-800 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800/50 text-slate-500 border-slate-800'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Logout */}
              <button
                onClick={onLogout}
                title="Logout of Admin Dashboard"
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600/20 hover:text-red-300 border border-slate-700/50 transition-all flex items-center gap-1.5 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
                <Coffee className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">Avenue <span className="text-amber-400">Café</span></span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Artisan Coffee • Bakery • Paninis</p>
              </div>
            </div>

            {/* Search bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search lattes, cold brew, croissants, paninis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/80 text-sm text-slate-200 placeholder-slate-400 pl-9 pr-4 py-2 rounded-xl border border-slate-700/60 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Live Order Tracker Trigger */}
              <button
                onClick={onOpenTracker}
                title="Track Active Order"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50 transition-all flex items-center gap-1.5 text-xs font-medium"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Track Order</span>
              </button>

              {/* Audio Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Order Alert Audio On' : 'Order Alert Audio Muted'}
                className={`p-2 rounded-xl transition-all border ${
                  soundEnabled
                    ? 'bg-slate-800 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800/50 text-slate-500 border-slate-800'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* User Display & Logout */}
              {role === 'admin' ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <span className="text-slate-300 text-sm">Admin</span>
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="ml-2 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/30 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Customer display */
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                    {user?.name?.charAt(0) || 'C'}
                  </div>
                  <span className="text-slate-300 text-sm">Customer</span>
                </div>
              )}

              {/* Shopping Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 font-bold transition-all shadow-md shadow-orange-500/20 flex items-center justify-center"
              >
                <ShoppingBag className="w-5 h-5 text-slate-950" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-slate-950 text-amber-400 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-amber-500 animate-bounce">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
