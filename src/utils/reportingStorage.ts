import { Order, SalesReportSnapshot } from '../types';

const REPORT_STORAGE_KEY = 'avenue_cafe_reporting_snapshots';

export const getStoredReportSnapshots = (): SalesReportSnapshot[] => {
  try {
    const saved = localStorage.getItem(REPORT_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // fallback
  }
  return [];
};

export const saveReportSnapshot = (snapshot: SalesReportSnapshot): SalesReportSnapshot[] => {
  const current = getStoredReportSnapshots();
  const updated = [snapshot, ...current.filter((s) => s.id !== snapshot.id)].slice(0, 50);
  try {
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save report snapshot:', err);
  }
  return updated;
};

export const deleteReportSnapshot = (id: string): SalesReportSnapshot[] => {
  const current = getStoredReportSnapshots();
  const updated = current.filter((s) => s.id !== id);
  try {
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete report snapshot:', err);
  }
  return updated;
};

/**
 * Computes a SalesReportSnapshot from a list of orders and period filter
 */
export const generateReportFromOrders = (
  orders: Order[],
  period: 'today' | 'last_7_days' | 'last_30_days' | 'all_time' = 'today',
  customTitle?: string
): SalesReportSnapshot => {
  const now = new Date();
  let startTime = 0;

  if (period === 'today') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    startTime = startOfToday.getTime();
  } else if (period === 'last_7_days') {
    startTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  } else if (period === 'last_30_days') {
    startTime = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  } else {
    startTime = 0; // all time
  }

  const periodOrders = orders.filter((o) => new Date(o.createdAt).getTime() >= startTime);

  // Exclude cancelled orders from valid sales metrics!
  const validOrders = periodOrders.filter((o) => o.status !== 'cancelled');
  const cancelledOrders = periodOrders.filter((o) => o.status === 'cancelled');

  const totalGrossSales = validOrders.reduce((sum, o) => sum + o.total, 0);
  const netSales = validOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const cancelledLossAmount = cancelledOrders.reduce((sum, o) => sum + o.total, 0);

  const validOrdersCount = validOrders.length;
  const cancelledOrdersCount = cancelledOrders.length;
  const averageOrderValue = validOrdersCount > 0 ? totalGrossSales / validOrdersCount : 0;

  const deliveryOrdersCount = validOrders.filter((o) => o.deliveryType === 'delivery').length;
  const pickupOrdersCount = validOrders.filter((o) => o.deliveryType === 'pickup').length;

  const paymentBreakdown = {
    cash: validOrders.filter((o) => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0),
    gcash: validOrders.filter((o) => o.paymentMethod === 'gcash').reduce((s, o) => s + o.total, 0),
    maya: validOrders.filter((o) => o.paymentMethod === 'maya').reduce((s, o) => s + o.total, 0),
    card: validOrders.filter((o) => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0)
  };

  // Top products
  const productMap: Record<string, { quantity: number; revenue: number }> = {};
  validOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!productMap[item.productName]) {
        productMap[item.productName] = { quantity: 0, revenue: 0 };
      }
      productMap[item.productName].quantity += item.quantity;
      productMap[item.productName].revenue += item.subtotal;
    });
  });

  const topItems = Object.entries(productMap)
    .map(([productName, stats]) => ({
      productName,
      quantity: stats.quantity,
      revenue: stats.revenue
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const reportNames: Record<string, string> = {
    today: `Daily Store Performance (${now.toLocaleDateString()})`,
    last_7_days: `Weekly Sales Audit (${new Date(startTime).toLocaleDateString()} - ${now.toLocaleDateString()})`,
    last_30_days: `Monthly Revenue Statement (${new Date(startTime).toLocaleDateString()} - ${now.toLocaleDateString()})`,
    all_time: `Comprehensive All-Time Executive Report`
  };

  return {
    id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    reportName: customTitle || reportNames[period],
    period,
    generatedAt: now.toISOString(),
    totalGrossSales,
    netSales,
    validOrdersCount,
    cancelledOrdersCount,
    cancelledLossAmount,
    averageOrderValue,
    deliveryOrdersCount,
    pickupOrdersCount,
    paymentBreakdown,
    topItems
  };
};

/**
 * Formats a SalesReportSnapshot into a standard CSV spreadsheet string
 */
export const convertReportToCSV = (report: SalesReportSnapshot): string => {
  const lines: string[] = [];

  lines.push(`"Avenue Café - Sales & Operations Report"`);
  lines.push(`"Report Name","${report.reportName}"`);
  lines.push(`"Period","${report.period.toUpperCase()}"`);
  lines.push(`"Generated At","${new Date(report.generatedAt).toLocaleString()}"`);
  lines.push(`""`);
  lines.push(`"--- EXECUTIVE SUMMARY ---"`);
  lines.push(`"Metric","Value (PHP / Count)"`);
  lines.push(`"Gross Revenue (PHP ₱)","${report.totalGrossSales.toFixed(2)}"`);
  lines.push(`"Net Menu Sales (PHP ₱)","${report.netSales.toFixed(2)}"`);
  lines.push(`"Valid Completed / Active Orders","${report.validOrdersCount}"`);
  lines.push(`"Cancelled / Voided Orders","${report.cancelledOrdersCount}"`);
  lines.push(`"Lost Revenue from Cancellations (PHP ₱)","${report.cancelledLossAmount.toFixed(2)}"`);
  lines.push(`"Average Order Value (AOV)","${report.averageOrderValue.toFixed(2)}"`);
  lines.push(`"Door Delivery Orders","${report.deliveryOrdersCount}"`);
  lines.push(`"Store Pick-up Orders","${report.pickupOrdersCount}"`);
  lines.push(`""`);
  lines.push(`"--- PAYMENT METHOD BREAKDOWN ---"`);
  lines.push(`"Payment Method","Volume (PHP ₱)"`);
  lines.push(`"GCash","${report.paymentBreakdown.gcash.toFixed(2)}"`);
  lines.push(`"Maya","${report.paymentBreakdown.maya.toFixed(2)}"`);
  lines.push(`"Cash on Delivery / Pickup","${report.paymentBreakdown.cash.toFixed(2)}"`);
  lines.push(`"Credit / Debit Card","${report.paymentBreakdown.card.toFixed(2)}"`);
  lines.push(`""`);
  lines.push(`"--- TOP SELLING ITEMS ---"`);
  lines.push(`"Product Name","Units Sold","Total Revenue (PHP ₱)"`);
  report.topItems.forEach((item) => {
    lines.push(`"${item.productName}","${item.quantity}","${item.revenue.toFixed(2)}"`);
  });

  return lines.join('\n');
};

/**
 * Triggers a browser download of the CSV report
 */
export const downloadReportCSV = (report: SalesReportSnapshot): void => {
  const csvContent = convertReportToCSV(report);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `avenue_cafe_report_${report.period}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Triggers a browser download of the JSON report
 */
export const downloadReportJSON = (report: SalesReportSnapshot): void => {
  const jsonContent = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `avenue_cafe_report_${report.period}_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
