import React, { useState } from 'react';
import {
  ShieldCheck,
  ShoppingBag,
  Utensils,
  BarChart3,
  Database,
  Bell,
  Plus,
  Trash2,
  Edit2,
  Check,
  Clock,
  ChefHat,
  Bike,
  PackageCheck,
  XCircle,
  Copy,
  Download,
  Volume2,
  VolumeX,
  Search,
  DollarSign,
  TrendingUp,
  Award,
  Layers
} from 'lucide-react';
import { Product, Order, OrderStatus, AdminNotification, DashboardStats, Category } from '../types';
import { generateMySQLDump } from '../data/initialData';
import { soundManager } from '../utils/audio';
import { formatPeso } from '../utils/format';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  notifications: AdminNotification[];
  stats: DashboardStats;
  unreadCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onDeleteNotification: (notifId: string) => void;
  onMarkNotificationsRead: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  products,
  categories,
  notifications,
  stats,
  unreadCount,
  soundEnabled,
  setSoundEnabled,
  onUpdateOrderStatus,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onDeleteOrder,
  onDeleteNotification,
  onMarkNotificationsRead
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'analytics' | 'database' | 'notifications'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  
  // Product Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Espresso & Coffee' as Category,
    price: 5.75,
    description: '',
    image: '',
    available: true,
    isPopular: false,
    calories: 250,
    preparationTimeMinutes: 5
  });

  const [copiedSql, setCopiedSql] = useState(false);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer.phone.includes(orderSearch);
    return matchesStatus && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Espresso & Coffee',
      price: 5.75,
      description: '',
      image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
      available: true,
      isPopular: false,
      calories: 250,
      preparationTimeMinutes: 5
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      image: product.image,
      available: product.available,
      isPopular: Boolean(product.isPopular),
      calories: product.calories || 500,
      preparationTimeMinutes: product.preparationTimeMinutes || 15
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...productForm
      });
    } else {
      onAddProduct(productForm);
    }
    setIsProductModalOpen(false);
  };

  const handleCopySql = () => {
    const sql = generateMySQLDump();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadSql = () => {
    window.open('/api/export-sql', '_blank');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg">Pending</span>;
      case 'preparing':
        return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg animate-pulse">Preparing</span>;
      case 'ready':
        return <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg">Out for Delivery</span>;
      case 'delivered':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg">Completed</span>;
      case 'cancelled':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                Phase 3 & 6 Dashboard
              </span>
              <span className="text-xs text-slate-400">Live API Connected</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" /> Store Management Console
            </h1>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Today Sales</span>
              <span className="font-bold text-amber-400 text-sm">{formatPeso(stats.totalRevenue)}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">Pending Orders</span>
              <span className="font-bold text-indigo-400 text-sm">{stats.pendingOrders}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">Total Orders</span>
              <span className="font-bold text-white text-sm">{stats.totalOrders}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Dashboard Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Live Orders
            {stats.pendingOrders > 0 && (
              <span className="bg-slate-950 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {stats.pendingOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Utensils className="w-4 h-4" /> Menu Manager ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Sales Analytics
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Database className="w-4 h-4" /> MySQL / phpMyAdmin (Phase 2)
          </button>

          <button
            onClick={() => {
              setActiveTab('notifications');
              onMarkNotificationsRead();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap relative ${
              activeTab === 'notifications'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" /> Order Alerts (Phase 6)
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                {['all', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search order #, customer..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-slate-200 placeholder-slate-500 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Orders Grid */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500 text-sm">
                No orders match your filter criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-white">{order.orderNumber}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                          {order.deliveryType === 'delivery' ? '🚗 Delivery' : '🏪 Pickup'} • {order.paymentMethod.toUpperCase()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-amber-400">{formatPeso(order.total)}</span>
                      </div>
                    </div>

                    {/* Customer details */}
                    <div className="text-xs text-slate-300 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                      <p><strong className="text-slate-400">Customer:</strong> {order.customer.name} ({order.customer.phone})</p>
                      {order.customer.address && <p><strong className="text-slate-400">Address:</strong> {order.customer.address}</p>}
                      {order.customer.ewalletNumber && (
                        <p className="text-sky-400 font-mono"><strong className="text-slate-400">E-Wallet #:</strong> {order.customer.ewalletNumber}</p>
                      )}
                      {order.customer.referenceNumber && (
                        <p className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                          Ref #: {order.customer.referenceNumber}
                        </p>
                      )}
                      {order.customer.notes && <p className="text-amber-400 italic"><strong className="text-slate-400">Notes:</strong> {order.customer.notes}</p>}
                    </div>

                    {/* Items */}
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">Ordered Items:</span>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-200">
                          <span>{item.quantity}x {item.productName} {item.notes ? `(${item.notes})` : ''}</span>
                          <span className="font-medium text-slate-400">{formatPeso(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status Action Buttons */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <ChefHat className="w-3.5 h-3.5" /> Start Preparing
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Bike className="w-3.5 h-3.5" /> Dispatch / Mark Ready
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <PackageCheck className="w-3.5 h-3.5" /> Mark Delivered
                        </button>
                      )}

                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ml-auto"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel Order
                        </button>
                      )}

                      {(order.status === 'cancelled' || order.status === 'delivered') && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Order
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MENU MANAGER (CRUD) */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Food Menu & Catalog</h2>
                <p className="text-xs text-slate-400">Add, edit, or toggle availability of dishes served in restaurant.</p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" /> Add New Dish
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex gap-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 uppercase">{product.category}</span>
                        <span className="text-xs font-black text-white">{formatPeso(product.price)}</span>
                      </div>
                      <h3 className="font-bold text-sm text-white truncate">{product.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{product.description}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                      <button
                        onClick={() =>
                          onUpdateProduct({
                            ...product,
                            available: !product.available
                          })
                        }
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          product.available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {product.available ? '● Available' : '○ Sold Out'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SALES ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Total Revenue</span>
                  <DollarSign className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-2xl font-black text-amber-400">{formatPeso(stats.totalRevenue)}</span>
                <p className="text-[10px] text-slate-500 mt-1">Calculated from completed orders</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Total Orders</span>
                  <ShoppingBag className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-2xl font-black text-white">{stats.totalOrders}</span>
                <p className="text-[10px] text-slate-500 mt-1">{stats.completedOrders} delivered</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Average Order Value</span>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-2xl font-black text-emerald-400">{formatPeso(stats.averageOrderValue)}</span>
                <p className="text-[10px] text-slate-500 mt-1">Per transaction average</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Pending Queue</span>
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-2xl font-black text-white">{stats.pendingOrders}</span>
                <p className="text-[10px] text-slate-500 mt-1">Requires kitchen dispatch</p>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Top Selling Menu Items
              </h3>

              <div className="space-y-3">
                {stats.topProducts.length === 0 ? (
                  <p className="text-xs text-slate-500">No sales data recorded yet.</p>
                ) : (
                  stats.topProducts.map((p, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span className="font-semibold">{p.name} ({p.count} sold)</span>
                        <span className="font-bold text-amber-400">{formatPeso(p.totalSales)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                          style={{
                            width: `${Math.min(100, (p.count / (stats.topProducts[0]?.count || 1)) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: MYSQL DATABASE & phpMyAdmin (PHASE 2) */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-indigo-500/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                    Phase 2 • MySQL Database Script
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1">XAMPP & phpMyAdmin Migration File</h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Generate and export complete relational SQL schema including <code className="text-amber-400">categories</code>, <code className="text-amber-400">products</code>, <code className="text-amber-400">orders</code>, <code className="text-amber-400">order_items</code>, and <code className="text-amber-400">admin_notifications</code> tables ready for import!
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}
                  </button>

                  <button
                    onClick={handleDownloadSql}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Download className="w-4 h-4" /> Download .sql File
                  </button>
                </div>
              </div>
            </div>

            {/* ER Diagram View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> categories
                </h4>
                <ul className="text-xs text-slate-400 space-y-1 font-mono">
                  <li>• id (INT, PK, AUTO_INCREMENT)</li>
                  <li>• name (VARCHAR 50, UNIQUE)</li>
                  <li>• created_at (TIMESTAMP)</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> products
                </h4>
                <ul className="text-xs text-slate-400 space-y-1 font-mono">
                  <li>• id (VARCHAR 50, PK)</li>
                  <li>• name (VARCHAR 100)</li>
                  <li>• category_name (FK -&gt; categories)</li>
                  <li>• price (DECIMAL 10,2)</li>
                  <li>• available (TINYINT 1)</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> orders &amp; order_items
                </h4>
                <ul className="text-xs text-slate-400 space-y-1 font-mono">
                  <li>• id (VARCHAR 50, PK)</li>
                  <li>• order_number (VARCHAR 20, UNIQUE)</li>
                  <li>• status (ENUM: pending, preparing...)</li>
                  <li>• total (DECIMAL 10,2)</li>
                  <li>• FK order_items.order_id -&gt; orders.id</li>
                </ul>
              </div>
            </div>

            {/* Code Block Preview */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>avenue_cafe_mysql.sql</span>
                <span>MySQL 5.7+ / 8.0 / MariaDB</span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
                {generateMySQLDump()}
              </pre>
            </div>

          </div>
        )}

        {/* TAB 5: ADMIN NOTIFICATIONS LOG & SOUND (PHASE 6) */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md uppercase">
                  Phase 6 • Order Notifications
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Real-Time Audio & Visual Alerts</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every order submitted by a customer automatically sounds a chime and registers in the admin log.
                </p>
              </div>

              <button
                onClick={() => soundManager.playOrderChime()}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all"
              >
                <Volume2 className="w-4 h-4" /> Test Alert Chime
              </button>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                  No notifications recorded yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      notif.read
                        ? 'bg-slate-900 border-slate-800 text-slate-300'
                        : 'bg-amber-500/10 border-amber-500/40 text-white shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-amber-400 border border-slate-800">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{notif.message}</h4>
                        <p className="text-xs text-slate-400">
                          {new Date(notif.createdAt).toLocaleTimeString()} • Customer: {notif.customerName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-amber-400">{formatPeso(notif.totalAmount)}</span>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this notification?')) {
                            onDeleteNotification(notif.id);
                          }
                        }}
                        title="Delete notification"
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Product Edit / Add Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingProduct ? 'Edit Dish' : 'Add New Menu Item'}
            </h2>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as Category })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.available}
                    onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Available</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isPopular}
                    onChange={(e) => setProductForm({ ...productForm, isPopular: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Featured Bestseller</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
