export type Category = string;

export interface ItemModifierOption {
  name: string;
  priceDelta: number;
}

export interface ItemModifierGroup {
  name: string;
  type: 'single' | 'multiple';
  required?: boolean;
  options: ItemModifierOption[];
}

export interface SelectedItemModifiers {
  size?: string;
  sizePriceDelta?: number;
  milk?: string;
  milkPriceDelta?: number;
  sweetness?: string;
  temperature?: string;
  toppings?: string[];
  toppingsPriceDelta?: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  salePrice?: number;
  isOnSale?: boolean;
  isFeatured?: boolean;
  badge?: string;
  description: string;
  image: string;
  available: boolean;
  isPopular?: boolean;
  calories?: number;
  preparationTimeMinutes?: number;
  modifierGroups?: ItemModifierGroup[];
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl?: string;
  heroImage?: string;
  heroOverlayOpacity?: number;
  heroBadgeText: string;
  heroHeadline: string;
  heroHeadlineHighlight: string;
  heroSubtitle: string;
  heroAvgMinsText: string;
  heroRatingText: string;
  heroQualityText: string;
  announcementActive: boolean;
  announcementBadge: string;
  announcementText: string;
  announcementLinkText?: string;
  operatingHours: string;
  storeAddress: string;
  contactPhone: string;
  contactEmail: string;
  standardDeliveryFee: number;
  freeDeliveryThreshold: number;
  merchantGcashNumber: string;
  merchantGcashName: string;
  merchantMayaNumber: string;
  merchantMayaName: string;
  customCategories: string[];
  showFeaturedSection: boolean;
  showSaleSection: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  wifiSsid?: string;
  wifiPassword?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  selectedModifiers?: SelectedItemModifiers;
  unitFinalPrice?: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export type PaymentMethod = 'cash' | 'gcash' | 'maya' | 'card';

export type DeliveryType = 'delivery' | 'pickup' | 'dine_in';

export interface CourierDispatchInfo {
  provider: 'Lalamove' | 'GrabExpress' | 'In-House Courier';
  trackingNumber: string;
  riderName: string;
  riderPhone: string;
  vehiclePlate: string;
  vehicleType: 'Motorcycle' | 'Sedan / MPV';
  status: 'assigned' | 'heading_to_store' | 'picked_up' | 'delivered';
  etaMinutes: number;
}

export interface CustomerCoordinates {
  lat: number;
  lng: number;
  label?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  landmark?: string;
  unitFloor?: string;
  coordinates?: CustomerCoordinates;
  notes?: string;
  ewalletNumber?: string;
  referenceNumber?: string;
  tableNumber?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  landmark?: string;
  unitFloor?: string;
  coordinates?: CustomerCoordinates;
  avatar?: string;
  memberTier?: 'Standard' | 'Silver Barista Club' | 'Gold VIP';
  ewalletNumber?: string;
  savedAddresses?: Array<{
    id: string;
    label: string; // 'Home', 'Office', 'Apartment'
    address: string;
    landmark?: string;
    coordinates?: CustomerCoordinates;
  }>;
}

export type UserRole = 'customer' | 'admin' | null;

export interface OrderItemRecord {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
  modifiersDescription?: string;
}

export interface PickupHistoryEntry {
  previousTime: string;
  newTime: string;
  reason?: string;
  requestedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: OrderItemRecord[];
  deliveryType: DeliveryType;
  tableNumber?: string;
  pickupTime?: string; // e.g. "11:30 AM" or "ASAP (~15-20 mins)"
  pickupStatus?: 'scheduled' | 'ready' | 'picked_up' | 'overdue' | 'rescheduled';
  pickupHistory?: PickupHistoryEntry[];
  courier?: CourierDispatchInfo;
  customerReceived?: boolean;
  customerReceivedAt?: string;
  customerRating?: number;
  customerFeedback?: string;
  cancelledBy?: 'customer' | 'admin';
  cancellationReason?: string;
  cancelledAt?: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  message: string;
  createdAt: string;
  read: boolean;
  resolved?: boolean;
  resolvedReason?: string;
  orderStatus?: OrderStatus;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders?: number;
  averageOrderValue: number;
  topProducts: { name: string; count: number; totalSales: number }[];
}

export interface GoogleSheetsSyncConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string;
  autoSyncOrders: boolean;
  lastSyncedAt: string | null;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
  autoSync: boolean;
}

export interface SalesReportSnapshot {
  id: string;
  reportName: string;
  period: 'today' | 'last_7_days' | 'last_30_days' | 'all_time' | 'custom';
  generatedAt: string;
  totalGrossSales: number;
  netSales: number;
  validOrdersCount: number;
  cancelledOrdersCount: number;
  cancelledLossAmount: number;
  averageOrderValue: number;
  deliveryOrdersCount: number;
  pickupOrdersCount: number;
  paymentBreakdown: {
    cash: number;
    gcash: number;
    maya: number;
    card: number;
  };
  topItems: Array<{
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  syncedToSupabase?: boolean;
  syncedAt?: string;
}

export interface MetaAiMessengerLogItem {
  id: string;
  timestamp: string;
  senderId: string;
  senderName?: string;
  messageText: string;
  replyText: string;
  status: 'replied' | 'delivered' | 'pending';
  orderCreated?: boolean;
  orderNumber?: string;
  orderTotal?: number;
  receiptText?: string;
}

export interface MetaAiMessengerSessionItem {
  senderId: string;
  senderName: string;
  cart: Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    modifiersDescription?: string;
  }>;
  customerInfo: {
    name?: string;
    phone?: string;
    address?: string;
    deliveryType?: 'delivery' | 'pickup';
    paymentMethod?: string;
    notes?: string;
  };
  state: 'browsing' | 'ordering' | 'ready_to_confirm' | 'confirmed';
  lastActive: string;
  lastOrderNumber?: string;
}
