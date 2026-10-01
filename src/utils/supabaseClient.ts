import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Order, AdminNotification, SalesReportSnapshot, SupabaseConfig } from '../types';

const STORAGE_KEY = 'avenue_cafe_supabase_config';

// ---------------------------------------------------------------------------
// Supabase project connection (project ref: swpodakdlkeardfqvnrs)
// The Project URL is public; the Anon/Public API key is supplied through the
// VITE_SUPABASE_ANON_KEY environment variable (.env) or the admin "Supabase"
// panel, which persists it to localStorage.
// ---------------------------------------------------------------------------
const ENV_SUPABASE_URL: string =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://swpodakdlkeardfqvnrs.supabase.co';
const ENV_SUPABASE_ANON_KEY: string = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholderUrl = (url?: string): boolean =>
  !url || url.includes('xyzcompanyproject') || url.includes('xyzprojectid');
const isPlaceholderKey = (key?: string): boolean =>
  !key || key.trim() === '' || key.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  let saved: Partial<SupabaseConfig> | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      saved = JSON.parse(raw) as Partial<SupabaseConfig>;
    }
  } catch {
    // fall back to the environment defaults below
  }

  const storedUrl = saved?.supabaseUrl;
  const storedKey = saved?.supabaseAnonKey;

  return {
    // Use a real value saved from the admin panel, otherwise fall back to env.
    supabaseUrl: !isPlaceholderUrl(storedUrl) ? (storedUrl as string) : ENV_SUPABASE_URL,
    supabaseAnonKey: !isPlaceholderKey(storedKey) ? (storedKey as string) : ENV_SUPABASE_ANON_KEY,
    isConnected: saved?.isConnected ?? false,
    lastSyncedAt: saved?.lastSyncedAt ?? null,
    autoSync: saved?.autoSync ?? true
  };
};

export const saveStoredSupabaseConfig = (config: SupabaseConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to persist Supabase config:', err);
  }
};

let cachedClient: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

export const getSupabaseClient = (url?: string, anonKey?: string): SupabaseClient | null => {
  const cfg = getStoredSupabaseConfig();
  const targetUrl = url || cfg.supabaseUrl;
  const targetKey = anonKey || cfg.supabaseAnonKey;

  if (!targetUrl || !targetKey || isPlaceholderUrl(targetUrl) || isPlaceholderKey(targetKey)) {
    return null;
  }

  if (cachedClient && currentUrl === targetUrl && currentKey === targetKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(targetUrl, targetKey);
    currentUrl = targetUrl;
    currentKey = targetKey;
    return cachedClient;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
};

/**
 * Tests connection to the provided Supabase URL and Key
 */
export const testSupabaseConnection = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
  if (!url || !anonKey) {
    return { success: false, message: 'Please provide both Supabase Project URL and Anon API Key.' };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { success: false, message: 'Supabase URL must start with https://' };
  }

  try {
    const client = createClient(url, anonKey);
    // Ping categories or health check query
    const { error } = await client.from('categories').select('name').limit(1);

    if (error) {
      // If table doesn't exist yet, it's still reachable as a Supabase endpoint
      if (error.code === '42P01' || error.message.includes('relation "categories" does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase! (Database tables need initialization via the SQL Script tab).'
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }

    return { success: true, message: 'Successfully connected to Supabase Database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error connecting to Supabase.' };
  }
};

/**
 * Syncs menu catalog, orders, and sales reports to Supabase
 */
export const syncAllToSupabase = async (
  products: Product[],
  orders: Order[],
  reports: SalesReportSnapshot[]
): Promise<{ success: boolean; syncedCount: number; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      syncedCount: 0,
      message: 'Supabase client not initialized. Please enter your valid Supabase credentials first.'
    };
  }

  try {
    // 1. Sync Products
    const productPayload = products.map((p) => ({
      id: p.id,
      name: p.name,
      category_name: p.category,
      price: p.price,
      sale_price: p.salePrice || null,
      is_on_sale: Boolean(p.isOnSale),
      is_featured: Boolean(p.isFeatured),
      badge: p.badge || null,
      description: p.description || '',
      image: p.image,
      available: p.available !== undefined ? p.available : true,
      is_popular: Boolean(p.isPopular),
      calories: p.calories || 250,
      prep_time_mins: p.preparationTimeMinutes || 5,
      updated_at: new Date().toISOString()
    }));

    await client.from('products').upsert(productPayload, { onConflict: 'id' });

    // 2. Sync Orders
    const orderPayload = orders.map((o) => ({
      id: o.id,
      order_number: o.orderNumber,
      customer_name: o.customer.name,
      customer_phone: o.customer.phone,
      customer_email: o.customer.email || null,
      customer_address: o.customer.address || null,
      customer_unit_floor: o.customer.unitFloor || null,
      customer_landmark: o.customer.landmark || null,
      customer_lat: o.customer.coordinates?.lat || null,
      customer_lng: o.customer.coordinates?.lng || null,
      customer_notes: o.customer.notes || null,
      ewallet_number: o.customer.ewalletNumber || null,
      reference_number: o.customer.referenceNumber || null,
      delivery_type: o.deliveryType,
      pickup_time: o.pickupTime || null,
      pickup_status: o.pickupStatus || null,
      pickup_history: o.pickupHistory || [],
      customer_received: Boolean(o.customerReceived),
      customer_received_at: o.customerReceivedAt || null,
      customer_rating: o.customerRating || null,
      customer_feedback: o.customerFeedback || null,
      cancelled_by: o.cancelledBy || null,
      cancellation_reason: o.cancellationReason || null,
      cancelled_at: o.cancelledAt || null,
      payment_method: o.paymentMethod,
      subtotal: o.subtotal,
      tax: o.tax,
      delivery_fee: o.deliveryFee,
      total: o.total,
      status: o.status,
      created_at: o.createdAt,
      updated_at: o.updatedAt
    }));

    await client.from('orders').upsert(orderPayload, { onConflict: 'id' });

    // 3. Sync Sales Reports if any
    if (reports.length > 0) {
      const reportsPayload = reports.map((r) => ({
        id: r.id,
        report_name: r.reportName,
        period: r.period,
        total_gross_sales: r.totalGrossSales,
        net_sales: r.netSales,
        valid_orders_count: r.validOrdersCount,
        cancelled_orders_count: r.cancelledOrdersCount,
        cancelled_loss_amount: r.cancelledLossAmount,
        average_order_value: r.averageOrderValue,
        delivery_orders_count: r.deliveryOrdersCount,
        pickup_orders_count: r.pickupOrdersCount,
        payment_breakdown: r.paymentBreakdown,
        top_items: r.topItems,
        generated_at: r.generatedAt
      }));

      await client.from('sales_reports').upsert(reportsPayload, { onConflict: 'id' });
    }

    return {
      success: true,
      syncedCount: products.length + orders.length + reports.length,
      message: `Successfully synchronized ${products.length} menu items, ${orders.length} orders, and ${reports.length} reporting snapshots to Supabase Cloud Database!`
    };
  } catch (err: any) {
    console.error('Supabase sync error:', err);
    return {
      success: false,
      syncedCount: 0,
      message: `Sync failed: ${err.message || 'Unknown database error'}`
    };
  }
};
