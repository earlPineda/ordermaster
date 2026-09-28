import React, { useState, useRef } from 'react';
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
  Layers,
  LogOut,
  UserCheck,
  FileSpreadsheet,
  Cloud,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Eye,
  Star,
  Palette,
  Flame,
  Upload,
  Image as ImageIcon,
  FolderOpen,
  RotateCcw,
  Sparkles,
  Percent,
  Menu as MenuIcon,
  X,
  QrCode,
  SlidersHorizontal,
  ChevronRight,
  Filter,
  Coffee,
  Maximize2,
  Minimize2,
  Users,
  Home,
  ChevronDown,
  Settings,
  Camera,
  MessageCircle,
  Layout,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { Product, Order, OrderStatus, AdminNotification, DashboardStats, Category, GoogleSheetsSyncConfig, StoreSettings } from '../types';
import { generateMySQLDump, DEFAULT_STORE_SETTINGS } from '../data/initialData';
import { soundManager } from '../utils/audio';
import { formatPeso } from '../utils/format';
import { GoogleSheetsPanel } from './GoogleSheetsPanel';
import { CustomerDetailModal } from './CustomerDetailModal';
import { StoreCustomizerPanel } from './StoreCustomizerPanel';
import { PromotionsPanel } from './PromotionsPanel';
import { SupabasePanel } from './SupabasePanel';
import { QrCodeStandModal } from './QrCodeStandModal';
import { RidayDashboardView } from './RidayDashboardView';
import { CustomerManagementView } from './CustomerManagementView';
import { MetaAiMessengerPanel } from './MetaAiMessengerPanel';
import { IMAGE_PRESETS } from '../utils/imagePresets';
import { MATCHA_AVENUE_LOGO } from '../assets/logo';

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
  onDeleteOrder?: (orderId: string) => Promise<void> | void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onMarkNotificationsRead: () => void;
  onResetDiscounts?: (category?: string, productId?: string) => Promise<void> | void;
  onApplyBatchDiscount?: (category: string, discountPercent: number) => Promise<void> | void;
  adminUser?: string;
  onLogout?: () => void;
  onViewStore?: () => void;
  // Storefront & UI Customization props
  storeSettings?: StoreSettings;
  onSaveStoreSettings?: (updated: StoreSettings) => Promise<void> | void;
  onResetStoreSettings?: () => Promise<void> | void;
  onCategoriesUpdate?: (categories: string[]) => void;
  // Google Sheets props
  googleUser?: User | null;
  googleAccessToken?: string | null;
  sheetConfig?: GoogleSheetsSyncConfig;
  isGoogleSigningIn?: boolean;
  onGoogleSignIn?: () => Promise<void>;
  onGoogleSignOut?: () => Promise<void>;
  onConnectSpreadsheet?: () => Promise<void>;
  onSyncAllOrders?: () => Promise<void>;
  onSyncMenuCatalog?: () => Promise<void>;
  onToggleAutoSync?: () => void;
  syncLogs?: string[];
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
  onDeleteOrder,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onMarkNotificationsRead,
  onResetDiscounts,
  onApplyBatchDiscount,
  adminUser = 'Default Admin',
  onLogout,
  onViewStore,
  storeSettings = DEFAULT_STORE_SETTINGS,
  onSaveStoreSettings = () => {},
  onResetStoreSettings = () => {},
  onCategoriesUpdate = () => {},
  googleUser = null,
  googleAccessToken = null,
  sheetConfig = {
    spreadsheetId: null,
    spreadsheetUrl: null,
    spreadsheetTitle: 'Matcha Avenue Cafe - Live Orders & Cloud Database',
    autoSyncOrders: true,
    lastSyncedAt: null
  },
  isGoogleSigningIn = false,
  onGoogleSignIn = async () => {},
  onGoogleSignOut = async () => {},
  onConnectSpreadsheet = async () => {},
  onSyncAllOrders = async () => {},
  onSyncMenuCatalog = async () => {},
  onToggleAutoSync = () => {},
  syncLogs = []
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'customer' | 'analytics' | 'customizer' | 'promotions' | 'sheets' | 'database' | 'notifications' | 'meta-ai'>('dashboard');
  const [activeDashboardSub, setActiveDashboardSub] = useState<'1' | '2' | '3'>('1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  // Menu Manager Search & Filter
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('All');

  // Product Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageUploadTab, setImageUploadTab] = useState<'file' | 'url' | 'presets'>('file');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Espresso & Coffee' as Category,
    price: 160.00,
    salePrice: 135.00,
    isOnSale: false,
    isFeatured: false,
    badge: '',
    description: '',
    image: '',
    available: true,
    isPopular: false,
    calories: 250,
    preparationTimeMinutes: 5
  });

  const [copiedSql, setCopiedSql] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [isConfirmingClearAllDelivered, setIsConfirmingClearAllDelivered] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Filter orders with Active Queue and Received filters
  const filteredOrders = orders.filter((o) => {
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = o.status !== 'cancelled' && !o.customerReceived && o.status !== 'delivered';
    } else if (statusFilter === 'received') {
      matchesStatus = Boolean(o.customerReceived || o.status === 'delivered');
    } else if (statusFilter === 'all') {
      matchesStatus = true;
    } else {
      matchesStatus = o.status === statusFilter;
    }

    const matchesSearch =
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer.phone.includes(orderSearch);
    return matchesStatus && matchesSearch;
  });

  // Filter products for Menu Manager tab
  const filteredProducts = products.filter((p) => {
    const matchesCat = menuCategoryFilter === 'All' || p.category === menuCategoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setImageUploadTab('file');
    setProductForm({
      name: '',
      category: (categories.find((c) => c !== 'All') || 'Espresso & Coffee') as Category,
      price: 165.00,
      salePrice: 140.00,
      isOnSale: false,
      isFeatured: false,
      badge: '',
      description: '',
      image: '',
      available: true,
      isPopular: false,
      calories: 250,
      preparationTimeMinutes: 5
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setImageUploadTab('file');
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      salePrice: product.salePrice || Math.round(product.price * 0.85),
      isOnSale: Boolean(product.isOnSale),
      isFeatured: Boolean(product.isFeatured),
      badge: product.badge || '',
      description: product.description,
      image: product.image,
      available: product.available,
      isPopular: Boolean(product.isPopular),
      calories: product.calories || 250,
      preparationTimeMinutes: product.preparationTimeMinutes || 5
    });
    setIsProductModalOpen(true);
  };

  const handleImageFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP, GIF, SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setProductForm((prev) => ({ ...prev, image: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFileUpload(file);
    }
  };

  const handleRemoveProductDiscount = async (product: Product) => {
    if (onResetDiscounts) {
      await onResetDiscounts(undefined, product.id);
    } else {
      onUpdateProduct({
        ...product,
        isOnSale: false,
        salePrice: undefined,
        badge: product.badge === 'ON SALE' || product.badge?.includes('% OFF') ? '' : product.badge
      });
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const isSale = Boolean(productForm.isOnSale);
    const saleP = isSale && productForm.salePrice ? Number(productForm.salePrice) : undefined;
    const badgeVal = !isSale && (productForm.badge === 'ON SALE' || productForm.badge?.includes('% OFF')) ? '' : productForm.badge;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...productForm,
        isOnSale: isSale,
        salePrice: saleP,
        badge: badgeVal
      });
    } else {
      onAddProduct({
        ...productForm,
        isOnSale: isSale,
        salePrice: saleP,
        badge: badgeVal
      });
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
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-md">Pending Approval</span>;
      case 'preparing':
        return <span className="bg-stone-100 text-stone-800 border border-stone-300 text-xs font-semibold px-2.5 py-0.5 rounded-md">In Kitchen</span>;
      case 'ready':
        return <span className="bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold px-2.5 py-0.5 rounded-md">Dispatched</span>;
      case 'delivered':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-md">Delivered</span>;
      case 'cancelled':
        return <span className="bg-red-50 text-red-800 border border-red-200 text-xs font-semibold px-2.5 py-0.5 rounded-md">Cancelled</span>;
      default:
        return null;
    }
  };

  const onSaleCount = products.filter((p) => p.isOnSale).length;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleGlobalSearch = (val: string) => {
    setGlobalSearch(val);
    setOrderSearch(val);
    setMenuSearch(val);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-stone-800 flex flex-col md:flex-row relative selection:bg-blue-600 selection:text-white antialiased">
      
      {/* LEFT SIDEBAR - ALWAYS VISIBLE ON SCREEN (DESKTOP/TABLET LANDSCAPE) */}
      <aside className="hidden md:flex md:w-64 xl:w-72 shrink-0 bg-white border-r border-stone-200/80 flex-col justify-between sticky top-0 h-screen overflow-y-auto p-4 z-30">
        <div className="space-y-6">
          
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            {/* Matcha Avenue Cafe Logo */}
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-xs border border-emerald-300 shrink-0 bg-emerald-50 ring-2 ring-emerald-500/20">
              <img
                src={storeSettings?.logoUrl || MATCHA_AVENUE_LOGO}
                alt="Matcha Avenue Cafe"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Brand Typography */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-base lg:text-lg font-sans text-stone-900 tracking-tight leading-none">
                  Matcha Avenue
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 leading-none">
                  Cafe
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-stone-500 font-semibold tracking-wide uppercase">Admin Console</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            
            {/* Dashboard (Active Pill with Subtree) */}
            <div>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#2563eb] text-white shadow-sm font-semibold'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                }`}
                title="Dashboard Overview"
              >
                <div className="flex items-center gap-3">
                  <Home className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-stone-500'}`} />
                  <span className="text-xs">Dashboard</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeTab === 'dashboard' ? 'rotate-180' : ''}`} />
              </button>

              {/* Sub-tree links (Dashboard 1, 2, 3) */}
              {activeTab === 'dashboard' && (
                <div className="ml-6 pl-3 border-l-2 border-blue-200 mt-2 space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveDashboardSub('1')}
                    className={`block w-full text-left py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      activeDashboardSub === '1'
                        ? 'text-blue-600 bg-blue-50 font-bold'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Dashboard 1 (Main)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDashboardSub('2');
                      setActiveTab('orders');
                    }}
                    className={`block w-full text-left py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      activeDashboardSub === '2'
                        ? 'text-blue-600 bg-blue-50 font-bold'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Dashboard 2 (Orders)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDashboardSub('3');
                      setActiveTab('analytics');
                    }}
                    className={`block w-full text-left py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      activeDashboardSub === '3'
                        ? 'text-blue-600 bg-blue-50 font-bold'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Dashboard 3 (Analytics)
                  </button>
                </div>
              )}
            </div>

            {/* Order */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
              }`}
              title="Live Orders Queue"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-stone-500" />
                <span className="text-xs">Order</span>
              </div>
              <div className="flex items-center gap-1.5">
                {stats.pendingOrders > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {stats.pendingOrders}
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </div>
            </button>

            {/* Menus */}
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
              }`}
              title="Menu Catalog"
            >
              <div className="flex items-center gap-3">
                <Utensils className="w-4 h-4 text-stone-500" />
                <span className="text-xs">Menus</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-400 font-mono">{products.length}</span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </div>
            </button>

            {/* Customer */}
            <button
              type="button"
              onClick={() => setActiveTab('customer')}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
              }`}
              title="Customer Directory & CRM"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-stone-500" />
                <span className="text-xs">Customer</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {/* Analysis */}
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
              }`}
              title="Sales & Operations Analysis"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-stone-500" />
                <span className="text-xs">Analysis</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {/* Meta AI & Facebook Messenger */}
            <button
              type="button"
              onClick={() => setActiveTab('meta-ai')}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'meta-ai'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
              }`}
              title="Meta AI Barista & Facebook Messenger Integration"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                <span className="text-xs">Meta AI &amp; FB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </div>
            </button>

            {/* Online Store (Customer View) */}
            {onViewStore && (
              <button
                type="button"
                onClick={onViewStore}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium"
                title="View Customer Storefront"
              >
                <div className="flex items-center gap-3">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <span className="text-xs">Online Store</span>
                </div>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </button>
            )}

            {/* Section Divider */}
            <div className="pt-4 pb-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2.5">
                UI &amp; Pages
              </span>
            </div>

            {/* Collections (Promotions) */}
            <button
              type="button"
              onClick={() => setActiveTab('promotions')}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'promotions'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
              }`}
              title="Promotions & On Sale"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-stone-500" />
                <span className="text-xs">Collections</span>
              </div>
              {onSaleCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {onSaleCount}
                </span>
              )}
            </button>

            {/* UI & Components (Store Customizer) */}
            <button
              type="button"
              onClick={() => setActiveTab('customizer')}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'customizer'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
              }`}
              title="Storefront Design Customizer"
            >
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-stone-500" />
                <span className="text-xs">UI &amp; Components</span>
              </div>
            </button>

            {/* Forms & Tables (Google Sheets & Supabase) */}
            <button
              type="button"
              onClick={() => setActiveTab('sheets')}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'sheets'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
              }`}
              title="Google Sheets Sync"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 text-stone-500" />
                <span className="text-xs">Forms &amp; Tables</span>
              </div>
            </button>

            {/* Charts & Maps (QR Stands) */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium"
              title="Generate QR Table Tent Stands"
            >
              <div className="flex items-center gap-3">
                <QrCode className="w-4 h-4 text-stone-500" />
                <span className="text-xs">Charts &amp; Maps</span>
              </div>
            </button>

            {/* Authentication & Logs */}
            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
              }`}
              title="Database & SQL Backups"
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-stone-500" />
                <span className="text-xs">Authentication</span>
              </div>
            </button>

            {/* Miscellaneous (Notifications & Chime) */}
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
              }`}
              title="Notifications & Alerts"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-stone-500" />
                <span className="text-xs">Miscellaneous</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

          </nav>
        </div>

        {/* Bottom Mascot Card */}
        <div className="relative mt-8 pt-8">
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-4 text-white text-center shadow-md pt-10 overflow-visible">
            {/* Chef Mascot Illustration popping out */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                <path d="M30 38 C25 22, 38 12, 50 12 C62 12, 75 22, 70 38 Z" fill="#ffffff" />
                <path d="M24 38 C18 30, 25 20, 35 22" fill="#f8fafc" />
                <path d="M76 38 C82 30, 75 20, 65 22" fill="#f8fafc" />
                <rect x="32" y="36" width="36" height="7" rx="3" fill="#e2e8f0" />
                <circle cx="50" cy="54" r="15" fill="#fed7aa" />
                <circle cx="41" cy="55" r="2.5" fill="#fca5a5" opacity="0.6" />
                <circle cx="59" cy="55" r="2.5" fill="#fca5a5" opacity="0.6" />
                <path d="M42 50 Q45 47, 48 50" stroke="#451a03" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M52 50 Q55 47, 58 50" stroke="#451a03" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M42 59 Q46 56, 50 58 Q54 56, 58 59" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M46 62 Q50 65, 54 62" stroke="#991b1b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <path d="M36 68 L50 64 L64 68 L60 82 L40 82 Z" fill="#ffffff" />
                <path d="M45 66 L50 70 L55 66" fill="#dc2626" />
              </svg>
            </div>

            <h4 className="font-bold text-xs text-white">Live Kitchen Ready</h4>
            <p className="text-[10px] text-blue-100 mt-0.5 leading-snug">
              Orders &amp; bar queue synced.
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-xs rounded-full text-[10px] font-semibold text-white transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span>Store Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT CONTENT WRAPPER */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#f4f6f9]">
        
        {/* TOP HEADER BAR */}
        <header className="bg-white/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 sm:gap-4 sticky top-0 z-30 border-b border-stone-200/80 shadow-2xs">
          
          {/* Brand/Indicator & Search input */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-2xl">
            {/* Mobile Brand indicator (visible when sidebar is hidden on small mobile) */}
            <div className="md:hidden flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs border border-emerald-200 bg-emerald-50">
                <img
                  src={storeSettings?.logoUrl || MATCHA_AVENUE_LOGO}
                  alt="Matcha Avenue Cafe"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-extrabold text-sm font-sans text-stone-900">Matcha Avenue Cafe</span>
            </div>

            {/* Current Section Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-stone-100/90 text-stone-800 rounded-xl text-xs font-semibold shrink-0 border border-stone-200/60">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>
                {activeTab === 'dashboard' ? 'Overview Dashboard' :
                 activeTab === 'orders' ? 'Live Orders Queue' :
                 activeTab === 'menu' ? 'Menu Catalog' :
                 activeTab === 'customer' ? 'Customer Directory' :
                 activeTab === 'analytics' ? 'Sales Analysis' :
                 activeTab === 'meta-ai' ? 'Meta AI Barista' :
                 activeTab === 'customizer' ? 'Storefront Customizer' :
                 activeTab === 'promotions' ? 'Promotions & Discounts' :
                 activeTab === 'sheets' ? 'Google Sheets' :
                 activeTab === 'database' ? 'PostgreSQL Database' :
                 activeTab === 'notifications' ? 'Notifications Center' : activeTab}
              </span>
            </div>

            {/* Pill Search Input */}
            <div className="relative w-full min-w-[140px] max-w-md">
              <input
                type="text"
                placeholder="Search orders, items, customers..."
                value={globalSearch}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="w-full bg-stone-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-stone-800 rounded-full pl-4 sm:pl-5 pr-10 py-2 sm:py-2.5 border border-stone-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-stone-400"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-2.5 sm:top-3 pointer-events-none" />
            </div>
          </div>

          {/* Quick Nav Pills on Desktop (Always Visible on Screen) */}
          <div className="hidden lg:flex items-center gap-1 bg-stone-100/70 p-1 rounded-2xl border border-stone-200/60 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <span>Orders</span>
              {stats.pendingOrders > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {stats.pendingOrders}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              Menus
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('customer')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('meta-ai')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'meta-ai'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <span>Meta AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>

          {/* 4 Pastel Square Action Buttons + Profile Widget */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Pastel Button 1: Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#7c3aed] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Pastel Button 2: Bell (Notifications) */}
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0284c7] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {unreadCount > 0 ? unreadCount : 5}
              </span>
            </button>

            {/* Pastel Button 3: Mail / Orders */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#cffafe] hover:bg-[#a5f3fc] text-[#0891b2] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Orders Queue"
            >
              <Mail className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {stats.pendingOrders > 0 ? stats.pendingOrders : 5}
              </span>
            </button>

            {/* Pastel Button 4: Settings */}
            <button
              type="button"
              onClick={() => setActiveTab('customizer')}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#ffedd5] hover:bg-[#fed7aa] text-[#ea580c] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Settings & Customizer"
            >
              <Settings className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                5
              </span>
            </button>

            {/* Profile Greeting & Avatar with Dropdown: Default Admin */}
            <div className="relative pl-1 sm:pl-2">
              <div
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 cursor-pointer select-none p-1 sm:px-2 sm:py-1 rounded-full hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200"
              >
                <div className="hidden sm:block text-right">
                  <span className="text-[10px] text-stone-400 font-medium block leading-none">Logged in as</span>
                  <span className="text-xs font-bold text-stone-900 leading-tight">Default Admin</span>
                </div>
                <div className="w-9 h-9 rounded-full ring-2 ring-blue-500 overflow-hidden shrink-0 shadow-xs bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs tracking-wider">
                  DA
                </div>
              </div>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200/90 py-2 z-50 text-xs">
                  <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/70 rounded-t-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        DA
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 truncate">Default Admin</p>
                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Default Administrator
                        </p>
                      </div>
                    </div>
                  </div>

                  {onViewStore && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onViewStore();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-700 cursor-pointer"
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>View Storefront</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      if (next) soundManager.playOrderChime();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-700 cursor-pointer"
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
                    <span>Kitchen Chimes: {soundEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsQrModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-700 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>Print QR Stand</span>
                  </button>

                  {onLogout && (
                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </header>

        {/* ON-SCREEN NAVIGATION TABS FOR MOBILE / SMALL SCREENS (NO COLLAPSED MENU BAR) */}
        <div className="md:hidden bg-white border-b border-stone-200/80 px-3 py-2 sticky top-[57px] z-20 shadow-2xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders</span>
              {stats.pendingOrders > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {stats.pendingOrders}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Menus</span>
              <span className="text-[10px] opacity-75 font-mono">({products.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analysis</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('meta-ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'meta-ai'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Meta AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('promotions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'promotions'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Collections</span>
              {onSaleCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {onSaleCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('customizer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'customizer'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>UI</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sheets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'sheets'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sheets</span>
            </button>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Stands</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Database</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alerts</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            {onViewStore && (
              <button
                type="button"
                onClick={onViewStore}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60 transition-colors cursor-pointer"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                <span>Store</span>
                <ExternalLink className="w-3 h-3 text-amber-600" />
              </button>
            )}
          </div>
        </div>

        {/* WORKSPACE - ACTIVE FEATURE PANEL */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 space-y-6">

          {/* TAB: RIDAY DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <RidayDashboardView
              stats={stats}
              orders={orders}
              products={products}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* TAB: CUSTOMER DIRECTORY & CRM */}
          {activeTab === 'customer' && (
            <CustomerManagementView
              orders={orders}
              onSelectCustomerOrder={setSelectedOrderDetail}
            />
          )}

          {/* TAB: META AI & FACEBOOK MESSENGER */}
          {activeTab === 'meta-ai' && (
            <MetaAiMessengerPanel
              products={products}
              storeSettings={storeSettings}
            />
          )}

            {/* TAB: STOREFRONT & UI CUSTOMIZER */}
            {activeTab === 'customizer' && (
              <StoreCustomizerPanel
                settings={storeSettings}
                onSaveSettings={onSaveStoreSettings}
                onResetSettings={onResetStoreSettings}
                onCategoriesUpdate={onCategoriesUpdate}
              />
            )}

            {/* TAB: ON-SALE & PROMOTIONS */}
            {activeTab === 'promotions' && (
              <PromotionsPanel
                products={products}
                onUpdateProduct={onUpdateProduct}
                categories={categories}
              />
            )}

            {/* TAB: ORDERS MANAGEMENT */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                
                {/* Filter and Search Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  
                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('active')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                        statusFilter === 'active'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Active Queue ({orders.filter((o) => o.status !== 'cancelled' && !o.customerReceived && o.status !== 'delivered').length})</span>
                    </button>

                    {[
                      { key: 'all', label: `All (${orders.length})` },
                      { key: 'pending', label: `Pending (${orders.filter((o) => o.status === 'pending').length})` },
                      { key: 'preparing', label: `Preparing (${orders.filter((o) => o.status === 'preparing').length})` },
                      { key: 'ready', label: `Dispatched (${orders.filter((o) => o.status === 'ready').length})` },
                      { key: 'received', label: `Delivered (${orders.filter((o) => o.customerReceived || o.status === 'delivered').length})` },
                      { key: 'cancelled', label: `Cancelled (${orders.filter((o) => o.status === 'cancelled').length})` }
                    ].map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setStatusFilter(st.key)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          statusFilter === st.key
                            ? 'bg-stone-900 text-white shadow-xs'
                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64 shrink-0">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search order #, customer, phone..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Delivered Tab Admin Summary Banner */}
                {statusFilter === 'received' && filteredOrders.length > 0 && (
                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-900 block">
                          Delivered & Completed Orders Archive ({filteredOrders.length})
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          Review customer receipt confirmations and delete completed orders when processed.
                        </span>
                      </div>
                    </div>

                    {onDeleteOrder && (
                      <div className="flex items-center gap-2 shrink-0">
                        {isConfirmingClearAllDelivered ? (
                          <div className="flex items-center gap-1.5 bg-red-100/90 border border-red-300 p-1 rounded-xl shadow-2xs">
                            <span className="text-[11px] font-bold text-red-800 px-1.5">Delete all {filteredOrders.length}?</span>
                            <button
                              type="button"
                              onClick={() => {
                                soundManager.playClick();
                                filteredOrders.forEach((o) => onDeleteOrder(o.id));
                                setIsConfirmingClearAllDelivered(false);
                              }}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              Yes, Clear All
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsConfirmingClearAllDelivered(false)}
                              className="px-2 py-1 bg-white hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playClick();
                              setIsConfirmingClearAllDelivered(true);
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            <span>Clear All Delivered ({filteredOrders.length})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Orders Grid */}
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 text-stone-500 text-sm shadow-xs">
                    <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700">No orders match your filter criteria.</p>
                    <p className="text-xs text-stone-400 mt-1">Try choosing another filter or clearing your search term.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {filteredOrders.map((order) => {
                        const isCancelled = order.status === 'cancelled';
                        const isReceived = Boolean(order.customerReceived);
                        const isDelivered = order.status === 'delivered' || isReceived;

                        return (
                          <motion.div
                            key={order.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.88, y: -16, filter: 'blur(4px)', transition: { duration: 0.35, ease: 'easeOut' } }}
                            transition={{ duration: 0.25 }}
                            className={`rounded-2xl border p-4 sm:p-5 space-y-4 bg-white transition-all shadow-xs ${
                              isCancelled
                                ? 'border-red-200 bg-red-50/20 opacity-75'
                                : isReceived
                                ? 'border-emerald-200 hover:border-emerald-300'
                                : 'border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            {/* Order Header */}
                            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-bold text-base ${isCancelled ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                                    {order.orderNumber}
                                  </span>
                                  {getStatusBadge(order.status)}
                                </div>
                                <p className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-1.5">
                                  <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>•</span>
                                  <span className={order.deliveryType === 'pickup' ? 'text-amber-800 font-semibold' : 'text-stone-700'}>
                                    {order.deliveryType === 'delivery' ? '🚗 Door Delivery' : `🏪 Store Pick-up: ${order.pickupTime || 'ASAP'}`}
                                  </span>
                                  <span>•</span>
                                  <span className="uppercase font-medium text-stone-600">{order.paymentMethod}</span>
                                  {isReceived && (
                                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <PackageCheck className="w-3 h-3 text-emerald-600" /> Received by Customer
                                    </span>
                                  )}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <span className={`text-base font-bold ${isCancelled ? 'text-stone-400 line-through' : 'text-amber-800'}`}>
                                    {formatPeso(order.total)}
                                  </span>
                                </div>
                                {onDeleteOrder && (isDelivered || isCancelled) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      soundManager.playClick();
                                      onDeleteOrder(order.id);
                                    }}
                                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all cursor-pointer active:scale-95"
                                    title="Delete order record permanently"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Cancellation Alert */}
                            {isCancelled && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-0.5 text-red-800">
                                <div className="flex items-center gap-1.5 font-semibold">
                                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                                  <span>Cancelled by {order.cancelledBy === 'customer' ? 'Customer' : 'Store Admin'}</span>
                                </div>
                                {order.cancellationReason && (
                                  <p className="text-[11px] text-red-700 italic">
                                    Reason: "{order.cancellationReason}"
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Customer Contact Brief */}
                            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2 text-xs">
                              <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                                <span className="font-semibold text-stone-700 flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-amber-700" /> Customer Contact
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderDetail(order)}
                                  className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-md border border-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3 h-3 text-stone-500" />
                                  <span>Full Profile & Map</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-stone-400 uppercase font-medium block">Customer:</span>
                                  <span className="font-semibold text-stone-900">{order.customer.name}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-stone-400 uppercase font-medium block">Phone:</span>
                                  <a
                                    href={`tel:${order.customer.phone}`}
                                    className="font-mono text-amber-800 hover:underline flex items-center gap-1 font-semibold"
                                  >
                                    <Phone className="w-3 h-3 text-amber-700" /> {order.customer.phone}
                                  </a>
                                </div>
                              </div>

                              {order.customer.address && order.deliveryType === 'delivery' && (
                                <div>
                                  <span className="text-[10px] text-stone-400 uppercase font-medium block flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-amber-700" /> Delivery Address:
                                  </span>
                                  <p className="text-stone-700 text-xs mt-0.5 leading-relaxed bg-white p-2 rounded-lg border border-stone-200">
                                    {order.customer.unitFloor ? `${order.customer.unitFloor}, ` : ''}
                                    {order.customer.address}
                                    {order.customer.landmark ? ` (Landmark: ${order.customer.landmark})` : ''}
                                  </p>
                                </div>
                              )}

                              {order.customer.referenceNumber && (
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-[11px] font-mono text-stone-700 bg-white border border-stone-200 px-2 py-0.5 rounded">
                                    Ref: <strong className="text-stone-900">{order.customer.referenceNumber}</strong>
                                  </span>
                                </div>
                              )}

                              {order.customer.notes && (
                                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                                  <strong className="font-semibold">Note:</strong> {order.customer.notes}
                                </div>
                              )}
                            </div>

                            {/* Ordered Items List */}
                            <div className="space-y-1.5 text-xs">
                              <span className="font-semibold text-stone-500 text-[10px] uppercase tracking-wider">
                                Ordered Items ({order.items.length}):
                              </span>
                              <div className="space-y-1">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-start justify-between gap-2 text-stone-700 bg-stone-50/80 px-2.5 py-1.5 rounded-lg border border-stone-200/60">
                                    <div className="min-w-0 flex-1">
                                      <span className="font-semibold text-stone-900 break-words">{item.quantity}x {item.productName}</span>
                                      {item.notes && (
                                        <span className="text-[11px] text-amber-800 italic block mt-0.5 break-words">
                                          Note: {item.notes}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-bold text-stone-900 shrink-0 font-mono">{formatPeso(item.subtotal)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Action Buttons & Status Banners for Kitchen, Delivery & Received */}
                            {isCancelled ? (
                              onDeleteOrder && (
                                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                                  <span className="text-[11px] text-stone-400">Cancelled order record</span>
                                  {deletingOrderId === order.id ? (
                                    <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-lg border border-red-200">
                                      <span className="text-[11px] text-red-800 font-semibold px-1">Delete record?</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          soundManager.playClick();
                                          onDeleteOrder(order.id);
                                          setDeletingOrderId(null);
                                        }}
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold cursor-pointer"
                                      >
                                        Yes, Delete
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeletingOrderId(null)}
                                        className="px-1.5 py-1 text-stone-500 hover:text-stone-700 text-xs cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        soundManager.playClick();
                                        setDeletingOrderId(order.id);
                                      }}
                                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-600" /> Delete Order Record
                                    </button>
                                  )}
                                </div>
                              )
                            ) : isReceived || order.status === 'delivered' ? (
                              <div className="pt-3 border-t border-stone-100 space-y-2.5">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                                      <PackageCheck className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                      <span className="text-xs font-bold text-emerald-900 block">
                                        {order.deliveryType === 'pickup' ? 'Store Pick-up Claimed & Received' : 'Order Delivered & Confirmed by Customer'}
                                      </span>
                                      <span className="text-[10px] text-emerald-700">
                                        {order.customerReceivedAt
                                          ? `Confirmed at ${new Date(order.customerReceivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                          : 'Completed successfully'}
                                      </span>
                                    </div>
                                  </div>
                                  {order.customerRating && (
                                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                                      <div className="flex items-center text-amber-500">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`w-3 h-3 ${star <= (order.customerRating || 5) ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-xs font-bold text-stone-800 ml-1 font-mono">{order.customerRating}.0</span>
                                    </div>
                                  )}
                                </div>
                                {order.customerFeedback && (
                                  <p className="text-[11px] text-stone-600 italic px-1">
                                    Customer Review: "{order.customerFeedback}"
                                  </p>
                                )}

                                {/* Admin Delete Order Button in Delivered View */}
                                {onDeleteOrder && (
                                  <div className="flex items-center justify-end pt-1">
                                    {deletingOrderId === order.id ? (
                                      <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-lg border border-red-200">
                                        <span className="text-xs text-red-800 font-semibold px-1">Delete #{order.orderNumber}?</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            soundManager.playClick();
                                            onDeleteOrder(order.id);
                                            setDeletingOrderId(null);
                                          }}
                                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                                        >
                                          Yes, Delete
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setDeletingOrderId(null)}
                                          className="px-2 py-1 text-stone-500 hover:text-stone-700 text-xs font-medium cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          soundManager.playClick();
                                          setDeletingOrderId(order.id);
                                        }}
                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                        title="Delete delivered order record"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                        <span>Delete Delivered Order</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
                                {order.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                                    className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                  >
                                    <ChefHat className="w-3.5 h-3.5" /> Start Preparing
                                  </button>
                                )}

                                {order.status === 'preparing' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                                    className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                  >
                                    <Bike className="w-3.5 h-3.5" /> Dispatch / Mark Ready
                                  </button>
                                )}

                                {order.status === 'ready' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                  >
                                    <PackageCheck className="w-3.5 h-3.5" /> Mark Delivered
                                  </button>
                                )}

                                {order.status !== 'delivered' && !isReceived && (
                                  cancellingOrderId === order.id ? (
                                    <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 ml-auto">
                                      <span className="text-[11px] font-semibold text-red-800 px-1">Cancel order?</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          soundManager.playClick();
                                          onUpdateOrderStatus(order.id, 'cancelled');
                                          setCancellingOrderId(null);
                                        }}
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCancellingOrderId(null)}
                                        className="px-1.5 py-1 text-stone-500 text-[10px] cursor-pointer"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        soundManager.playClick();
                                        setCancellingOrderId(order.id);
                                      }}
                                      className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-stone-200 hover:border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ml-auto cursor-pointer"
                                    >
                                      <XCircle className="w-3.5 h-3.5" /> Cancel
                                    </button>
                                  )
                                )}
                              </div>
                            )}

                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* TAB: MENU MANAGER */}
            {activeTab === 'menu' && (
              <div className="space-y-4">
                
                {/* Header & Controls */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                  <div>
                    <h2 className="text-base font-bold text-stone-900">Food Menu & Catalog</h2>
                    <p className="text-xs text-stone-500">Manage dishes, prices, promotional sales, and item availability.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add New Dish
                  </button>
                </div>

                {/* Filter and Search */}
                <div className="bg-white p-3 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setMenuCategoryFilter('All')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        menuCategoryFilter === 'All'
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      All Items ({products.length})
                    </button>
                    {categories.filter((c) => c !== 'All').map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setMenuCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          menuCategoryFilter === cat
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search dish or drink..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 pl-9 pr-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => {
                    const discountPct = product.salePrice && product.salePrice < product.price
                      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
                      : 0;

                    return (
                      <div key={product.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex gap-3.5 hover:border-stone-300 transition-all shadow-xs">
                        <div className="relative shrink-0 w-20 h-20 rounded-xl bg-amber-50/50 border border-stone-200 flex items-center justify-center text-amber-800/70 overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-1 text-center">
                              <ImageIcon className="w-5 h-5 text-stone-400 stroke-[1.5]" />
                              <span className="text-[9px] text-stone-400 font-medium mt-0.5">No photo</span>
                            </div>
                          )}
                          {product.isOnSale && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              -{discountPct}%
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider truncate">
                                {product.category}
                              </span>
                              
                              <div className="text-right">
                                {product.isOnSale && product.salePrice ? (
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xs font-bold text-red-600">{formatPeso(product.salePrice)}</span>
                                    <span className="text-[10px] text-stone-400 line-through">{formatPeso(product.price)}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-stone-900">{formatPeso(product.price)}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 mt-0.5">
                              <h3 className="font-bold text-sm text-stone-900 truncate">{product.name}</h3>
                              {product.isFeatured && (
                                <span className="text-[10px] text-amber-500" title="Featured Item">⭐</span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{product.description}</p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-stone-100">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateProduct({
                                  ...product,
                                  available: !product.available
                                })
                              }
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                                product.available ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {product.available ? '● Available' : '○ Sold Out'}
                            </button>

                            <div className="flex items-center gap-1">
                              {product.isOnSale && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductDiscount(product)}
                                  className="px-2 py-1 text-[10px] font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 cursor-pointer transition-colors flex items-center gap-1"
                                  title="Reset discount to regular price"
                                >
                                  <RotateCcw className="w-3 h-3 text-red-500" />
                                  <span>Reset Sale</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(product)}
                                className="p-1.5 text-stone-500 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 cursor-pointer transition-colors"
                                title="Edit Dish Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {deletingProductId === product.id ? (
                                <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundManager.playClick();
                                      onDeleteProduct(product.id);
                                      setDeletingProductId(null);
                                    }}
                                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingProductId(null)}
                                    className="text-stone-400 hover:text-stone-600 text-[10px] px-1 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundManager.playClick();
                                    setDeletingProductId(product.id);
                                  }}
                                  className="p-1.5 text-stone-400 hover:text-red-600 bg-stone-50 hover:bg-red-50 rounded-lg border border-stone-200 cursor-pointer transition-colors"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: PROMOTIONS & DISCOUNTS */}
            {activeTab === 'promotions' && (
              <PromotionsPanel
                products={products}
                onUpdateProduct={onUpdateProduct}
                onResetDiscounts={onResetDiscounts}
                onApplyBatchDiscount={onApplyBatchDiscount}
                categories={categories}
              />
            )}

            {/* TAB: STORE SETTINGS & CUSTOMIZER */}
            {activeTab === 'store_settings' && (
              <StoreCustomizerPanel
                settings={storeSettings}
                onSaveSettings={onSaveStoreSettings}
                onResetSettings={onResetStoreSettings}
                onCategoriesUpdate={onCategoriesUpdate}
              />
            )}

            {/* TAB: SALES ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-4">
                
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 mb-1">
                      <span className="text-xs font-medium">Total Revenue</span>
                      <DollarSign className="w-4 h-4 text-amber-700" />
                    </div>
                    <span className="text-2xl font-bold text-stone-900">{formatPeso(stats.totalRevenue)}</span>
                    <p className="text-[10px] text-stone-400 mt-1">Calculated from valid completed orders</p>
                  </div>

                  <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 mb-1">
                      <span className="text-xs font-medium">Total Orders</span>
                      <ShoppingBag className="w-4 h-4 text-stone-600" />
                    </div>
                    <span className="text-2xl font-bold text-stone-900">{stats.totalOrders}</span>
                    <p className="text-[10px] text-stone-400 mt-1">{stats.completedOrders} completed transactions</p>
                  </div>

                  <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 mb-1">
                      <span className="text-xs font-medium">Average Order Value</span>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-2xl font-bold text-stone-900">{formatPeso(stats.averageOrderValue)}</span>
                    <p className="text-[10px] text-stone-400 mt-1">Per transaction average</p>
                  </div>

                  <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 mb-1">
                      <span className="text-xs font-medium">Pending Orders</span>
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-2xl font-bold text-amber-800">{stats.pendingOrders}</span>
                    <p className="text-[10px] text-stone-400 mt-1">Currently in kitchen / delivery</p>
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-700" /> Top Selling Menu Items
                  </h3>

                  <div className="space-y-3">
                    {stats.topProducts.length === 0 ? (
                      <p className="text-xs text-stone-500">No sales data recorded yet.</p>
                    ) : (
                      stats.topProducts.map((p, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs text-stone-700">
                            <span className="font-semibold">{p.name} ({p.count} sold)</span>
                            <span className="font-bold text-stone-900">{formatPeso(p.totalSales)}</span>
                          </div>
                          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-600 rounded-full"
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

            {/* TAB: GOOGLE SHEETS */}
            {activeTab === 'sheets' && (
              <GoogleSheetsPanel
                user={googleUser}
                accessToken={googleAccessToken}
                sheetConfig={sheetConfig}
                orders={orders}
                products={products}
                isSigningIn={isGoogleSigningIn}
                onGoogleSignIn={onGoogleSignIn}
                onGoogleSignOut={onGoogleSignOut}
                onConnectSpreadsheet={onConnectSpreadsheet}
                onSyncAllOrders={onSyncAllOrders}
                onSyncMenuCatalog={onSyncMenuCatalog}
                onToggleAutoSync={onToggleAutoSync}
                syncLogs={syncLogs}
              />
            )}

            {/* TAB: SUPABASE & SQL */}
            {activeTab === 'database' && (
              <div className="space-y-4">
                <SupabasePanel
                  orders={orders}
                  products={products}
                  categories={categories}
                />

                {/* Legacy MySQL & XAMPP Backup */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                        Offline Backup
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 mt-1">MySQL / XAMPP Database Export</h3>
                      <p className="text-xs text-stone-500">
                        Export an offline `.sql` dump compatible with local XAMPP phpMyAdmin servers.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg border border-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSql ? 'Copied SQL!' : 'Copy SQL'}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSql}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download .sql
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div>
                    <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 uppercase">
                      Real-Time Order Alerts
                    </span>
                    <h2 className="text-lg font-bold text-stone-900 mt-1">Audio &amp; Notification History</h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      New order chimes and notification event logs.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => soundManager.playOrderChime()}
                    className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-stone-200 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-amber-700" /> Test Alert Chime
                  </button>
                </div>

                <div className="space-y-2.5">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs shadow-xs">
                      No notifications recorded yet.
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isResolved = Boolean(notif.resolved);

                      return (
                        <div
                          key={notif.id}
                          className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 bg-white ${
                            isResolved
                              ? 'border-stone-200 opacity-60'
                              : notif.read
                              ? 'border-stone-200'
                              : 'border-amber-200 bg-amber-50/40 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-stone-200 bg-stone-50 text-amber-800">
                              <Bell className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-semibold text-xs text-stone-900 ${isResolved ? 'line-through text-stone-400' : ''}`}>
                                  {notif.message}
                                </h4>
                                {isResolved && (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200">
                                    {notif.resolvedReason === 'cancelled' ? '❌ Cancelled' : '✅ Received'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-400 mt-0.5">
                                {new Date(notif.createdAt).toLocaleTimeString()} • Customer: {notif.customerName}
                              </p>
                            </div>
                          </div>

                          <span className={`text-xs font-bold ${isResolved ? 'text-stone-400 line-through' : 'text-amber-800'}`}>
                            {formatPeso(notif.totalAmount)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </main>
        </div>

        {/* FLOATING ACTION TOOLBAR ON RIGHT EDGE (matching Riday screenshot) */}
        <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-stone-200/80">
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="w-9 h-9 rounded-xl hover:bg-stone-100 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Take / Upload Food Photo"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className="w-9 h-9 rounded-xl hover:bg-stone-100 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Menu Images Catalog"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customizer')}
            className="w-9 h-9 rounded-xl hover:bg-stone-100 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Store Layout Customizer"
          >
            <Layout className="w-4 h-4" />
          </button>
        </div>

        {/* FLOATING CHAT BUTTON (Bottom Right - matching Riday screenshot) */}
        <div className="fixed right-5 bottom-5 z-40">
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-900 flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Live Order Alerts & Messages"
          >
            <MessageCircle className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-700" />
                  {editingProduct ? `Edit "${editingProduct.name}"` : 'Add New Menu Item'}
                </h2>
                <p className="text-xs text-stone-500">Specify pricing, category, image photo, and discounts.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              {/* IMAGE SOURCE SECTION */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-stone-800 font-semibold flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-4 h-4 text-amber-700" /> Dish Photo Image
                  </label>
                  <span className="text-[10px] text-stone-500 font-medium">Optional</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-200 bg-white shrink-0 shadow-xs flex items-center justify-center">
                    {productForm.image ? (
                      <>
                        <img
                          src={productForm.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, image: '' })}
                          className="absolute top-1 right-1 bg-stone-900/80 hover:bg-red-600 text-white p-1 rounded-full cursor-pointer transition-colors shadow-xs"
                          title="Remove Image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-400 p-1 text-center">
                        <ImageIcon className="w-6 h-6 stroke-[1.4] text-stone-300" />
                        <span className="text-[9px] text-stone-400 font-medium mt-1">No photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste image URL (https://...)"
                        value={productForm.image}
                        onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                        className="flex-1 bg-white text-stone-900 border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-amber-600"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <p className="text-[11px] text-stone-500">
                      Upload photos directly from your device, or paste any image link. Leave blank for text-only menu cards.
                    </p>
                  </div>
                </div>
              </div>

              {/* NAME & CATEGORY */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Dish / Drink Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spanish Latte, Chocolate Croissant"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-stone-50 text-stone-900 border border-stone-200 rounded-lg p-2 font-medium text-xs focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as Category })}
                    className="w-full bg-stone-50 text-stone-900 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-amber-600 focus:bg-white cursor-pointer"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Regular Menu Price (₱)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-50 text-stone-900 border border-stone-200 rounded-lg p-2 font-mono font-semibold focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* PROMOTIONS / SALE TOGGLE */}
              <div className={`p-3.5 rounded-xl border transition-colors ${
                productForm.isOnSale ? 'bg-red-50/50 border-red-200' : 'bg-stone-50 border-stone-200'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-stone-800 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isOnSale}
                      onChange={(e) => {
                        const nextOnSale = e.target.checked;
                        setProductForm({
                          ...productForm,
                          isOnSale: nextOnSale,
                          salePrice: nextOnSale ? (productForm.salePrice || Math.round(productForm.price * 0.85)) : undefined
                        });
                      }}
                      className="accent-red-600 w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="flex items-center gap-1 text-red-700 font-semibold text-xs">
                      <Flame className="w-3.5 h-3.5" /> Put on Promotional Sale
                    </span>
                  </label>

                  {productForm.isOnSale && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductForm({
                          ...productForm,
                          isOnSale: false,
                          salePrice: undefined,
                          badge: productForm.badge === 'ON SALE' || productForm.badge?.includes('% OFF') ? '' : productForm.badge
                        });
                      }}
                      className="text-[11px] text-red-600 hover:underline cursor-pointer"
                    >
                      Remove Sale
                    </button>
                  )}
                </div>

                {productForm.isOnSale && (
                  <div className="space-y-2.5 pt-2.5 mt-2.5 border-t border-red-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1 font-medium">
                          Discount Promo Price (₱)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          max={productForm.price}
                          value={productForm.salePrice || Math.round(productForm.price * 0.85)}
                          onChange={(e) => setProductForm({ ...productForm, salePrice: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white text-red-700 border border-red-300 rounded-lg p-2 font-mono font-bold text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1 font-medium">Customer Savings</label>
                        <div className="p-2 bg-white rounded-lg border border-stone-200 text-emerald-700 font-semibold flex items-center justify-between text-xs">
                          <span>Save {formatPeso(Math.max(0, productForm.price - (productForm.salePrice || 0)))}</span>
                          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {productForm.price > 0 && productForm.salePrice
                              ? `${Math.round(((productForm.price - productForm.salePrice) / productForm.price) * 100)}% OFF`
                              : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick percentage buttons */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-stone-500 font-medium mr-1">Quick:</span>
                      {[10, 15, 20, 25, 30, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            const calculated = Math.round(productForm.price * (1 - pct / 100));
                            setProductForm({
                              ...productForm,
                              salePrice: calculated,
                              badge: `${pct}% OFF`
                            });
                          }}
                          className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Describe ingredients, taste profile, or special recipe..."
                  className="w-full bg-stone-50 text-stone-900 border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              {/* Calorie & Prep Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">Badge (Optional)</label>
                  <input
                    type="text"
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                    placeholder="e.g. Signature"
                    className="w-full bg-stone-50 text-stone-900 border border-stone-200 rounded-lg p-1.5 focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={productForm.calories}
                    onChange={(e) => setProductForm({ ...productForm, calories: parseInt(e.target.value) || 0 })}
                    className="w-full bg-stone-50 text-stone-900 border border-stone-200 rounded-lg p-1.5 font-mono focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    value={productForm.preparationTimeMinutes}
                    onChange={(e) => setProductForm({ ...productForm, preparationTimeMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full bg-stone-50 text-stone-900 border border-stone-200 rounded-lg p-1.5 font-mono focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-stone-200">
                <label className="flex items-center gap-1.5 text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.available}
                    onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })}
                    className="accent-amber-600 rounded"
                  />
                  <span>Available in Store</span>
                </label>

                <label className="flex items-center gap-1.5 text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="accent-amber-600 rounded"
                  />
                  <span>Featured ⭐</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white font-semibold rounded-lg hover:bg-stone-800 cursor-pointer shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        order={selectedOrderDetail}
        isOpen={Boolean(selectedOrderDetail)}
        onClose={() => setSelectedOrderDetail(null)}
        onUpdateStatus={onUpdateOrderStatus}
      />

      {/* QR Code Stand Modal */}
      <QrCodeStandModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        storeSettings={storeSettings}
      />

    </div>
  );
};
