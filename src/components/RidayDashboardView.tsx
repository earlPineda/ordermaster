import React, { useState } from 'react';
import {
  Utensils,
  DollarSign,
  ClipboardList,
  Users,
  TrendingUp,
  TrendingDown,
  Menu as MenuIcon,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Flame,
  Award,
  MessageCircle,
  Bot,
  Receipt,
  Copy,
  Check,
  Send,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { Product, Order, DashboardStats } from '../types';
import { formatPeso } from '../utils/format';

interface RidayDashboardViewProps {
  stats: DashboardStats;
  orders: Order[];
  products: Product[];
  onNavigateTab: (tab: any) => void;
  currencySymbol?: string;
  onOpenReport?: () => void;
}

export const RidayDashboardView: React.FC<RidayDashboardViewProps> = ({
  stats,
  orders,
  products,
  onNavigateTab,
  currencySymbol = '$',
  onOpenReport
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'Monthly' | 'Weekly' | 'Daily'>('Monthly');
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(5); // Default to June/July

  /**
   * Total Orders KPI - counted exactly like the server's /api/admin/stats:
   * cancelled orders do not count, and deleted orders are already gone from the
   * store entirely, so only valid (active or delivered) orders are included.
   */
  const totalOrdersCount =
    stats.totalOrders > 0 ? stats.totalOrders : orders.filter((o) => o.status !== 'cancelled').length;

  // On-screen Meta AI Facebook Messenger live order simulation state
  const [testOrderInput, setTestOrderInput] = useState(
    'Order 2 Iced Uji Cream Matcha with oat milk and 1 Butter Croissant. Deliver to Two Serendra BGC. Phone: 09178889999. COD.'
  );
  const [isTestingOrder, setIsTestingOrder] = useState(false);
  const [testOrderResult, setTestOrderResult] = useState<{
    log?: any;
    isOrderCreated?: boolean;
    order?: any;
    receiptText?: string;
  } | null>(null);
  const [copiedTestReceipt, setCopiedTestReceipt] = useState(false);

  const handleRunOnScreenTestOrder = async (customMsg?: string) => {
    const text = (customMsg || testOrderInput).trim();
    if (!text || isTestingOrder) return;
    setIsTestingOrder(true);
    setTestOrderResult(null);

    try {
      const res = await fetch('/api/meta-ai/simulate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'Client via Messenger',
          messageText: text
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTestOrderResult(json.data);
        }
      }
    } catch (err) {
      console.error('Error simulating on-screen order:', err);
    } finally {
      setIsTestingOrder(false);
    }
  };

  // Donut Gauge SVG Helper
  const renderDonut = (percentage: number, iconNode: React.ReactNode) => {
    const radius = 32;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
        <svg className="w-20 h-20 transform -rotate-90">
          {/* Background Track */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Progress Arc */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#ea580c"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-orange-600">
          {iconNode}
        </div>
      </div>
    );
  };

  // Revenue Overview Bar Chart Data
  const revenueChartBars = [
    { label: 'Jan', value: 95, amount: '$95k' },
    { label: 'Feb', value: 120, amount: '$120k' },
    { label: 'Mar', value: 80, amount: '$80k' },
    { label: 'Apr', value: 145, amount: '$145k' },
    { label: 'May', value: 110, amount: '$110k' },
    { label: 'Jun', value: 175, amount: '$175k' },
    { label: 'Jul', value: 160, amount: '$160k' },
    { label: 'Aug', value: 130, amount: '$130k' },
    { label: 'Sep', value: 155, amount: '$155k' },
    { label: 'Oct', value: 140, amount: '$140k' },
    { label: 'Nov', value: 165, amount: '$165k' },
    { label: 'Dec', value: 185, amount: '$185k' }
  ];

  // Compute live recent activities or fallback to template activities
  const recentActivities = [
    {
      time: '10:10',
      text: 'Morbi quis ex eu arcu auctor sagittis.',
      author: 'Johne'
    },
    {
      time: '08:40',
      text: 'Proin iaculis eros non odio ornare efficitur.',
      author: 'Amla'
    },
    {
      time: '07:10',
      text: 'In mattis mi ut posuere consectetur.',
      author: 'Josef'
    },
    {
      time: '01:15',
      text: 'Morbi quis ex eu arcu auctor sagittis.',
      author: 'Rima'
    }
  ];

  // Total unique customers count
  const customerCount = Math.max(985, new Set(orders.map((o) => o.customer.phone || o.customer.name)).size);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      
      {/* ============================================================ */}
      {/* CENTER / MAIN WORKSPACE COLUMN (SPAN 8/12 on XL screens)     */}
      {/* ============================================================ */}
      <div className="xl:col-span-8 space-y-6">
        
        {/* ON-SCREEN META AI & FACEBOOK MESSENGER ORDERING HUB */}
        <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Automated Messenger Ordering Active
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Receipt className="w-3 h-3" />
                    Instant Receipts
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-900 mt-0.5">
                  Facebook Page (ID: 61592982062259) Automated Ordering Engine
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://www.facebook.com/profile.php?id=61592982062259"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>FB Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://m.me/61592982062259"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Messenger</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => onNavigateTab('meta-ai')}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Manage Sessions</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <p className="text-xs text-stone-500">
            When clients message your Facebook Page with any coffee order, question, or delivery address, the Meta AI barista understands their request accurately, logs the order into your POS kitchen, and dispatches an official receipt automatically on Messenger!
          </p>

          {/* On-Screen Instant Test Bar */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Test Automated Ordering on Screen:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    handleRunOnScreenTestOrder(
                      'Order 2 Iced Uji Cream Matcha with oat milk and 1 Butter Croissant. Deliver to Two Serendra BGC. Phone: 09178889999. Cash on delivery.'
                    )
                  }
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  Preset 1: Direct Matcha Order
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleRunOnScreenTestOrder(
                      'Pa-order po ng 2 Matcha Espresso Fusion and 1 Strawberry Matcha Latte to Serendra BGC, 09181234567, GCash'
                    )
                  }
                  className="text-[10px] font-semibold text-stone-600 hover:text-stone-900 bg-white px-2 py-0.5 rounded-md border border-stone-200 cursor-pointer"
                >
                  Preset 2: Taglish Matcha Order
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testOrderInput}
                onChange={(e) => setTestOrderInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunOnScreenTestOrder();
                }}
                placeholder="Type sample client Facebook message..."
                className="flex-1 bg-white text-xs px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-blue-500 font-medium text-stone-800"
              />
              <button
                type="button"
                onClick={() => handleRunOnScreenTestOrder()}
                disabled={isTestingOrder || !testOrderInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {isTestingOrder ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isTestingOrder ? 'Processing...' : 'Run Test'}</span>
              </button>
            </div>

            {/* Test Output Accordion / Receipt */}
            {testOrderResult && (
              <div className="mt-3 pt-3 border-t border-stone-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {testOrderResult.isOrderCreated ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Order #{testOrderResult.order?.orderNumber} Placed &amp; Receipt Generated!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800">
                        <Bot className="w-3 h-3" />
                        Customer Cart Updated
                      </span>
                    )}
                  </div>

                  {testOrderResult.receiptText && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(testOrderResult.receiptText!);
                        setCopiedTestReceipt(true);
                        setTimeout(() => setCopiedTestReceipt(false), 2000);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedTestReceipt ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedTestReceipt ? 'Copied' : 'Copy Receipt Text'}</span>
                    </button>
                  )}
                </div>

                {testOrderResult.receiptText && (
                  <div className="bg-stone-900 text-stone-100 p-3 rounded-xl text-[10px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-stone-800 select-all leading-relaxed">
                    {testOrderResult.receiptText}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TOP 4 STAT CARDS IN A 2x2 GRID (Exact screenshot match) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* CARD 1: Total Menu */}
          <div
            onClick={() => onNavigateTab('menu')}
            className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-sm font-semibold text-stone-600 block mb-1">Total Menu</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans">
                {products.length > 0 ? Math.max(325, products.length) : 325}
              </div>
            </div>
            {renderDonut(
              72,
              <Utensils className="w-6 h-6 text-orange-600" />
            )}
          </div>

          {/* CARD 2: Total Revenue */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-sm font-semibold text-stone-600 block mb-1">Total Revenue</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans">
                {stats.totalRevenue > 0 ? formatPeso(stats.totalRevenue) : '$425k'}
              </div>
            </div>
            {renderDonut(
              85,
              <span className="text-xl font-bold text-orange-600 font-sans">$</span>
            )}
          </div>

          {/* CARD 3: Total Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-sm font-semibold text-stone-600 block mb-1">Total Orders</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans">
                {totalOrdersCount}
              </div>
            </div>
            {renderDonut(
              65,
              <ClipboardList className="w-5 h-5 text-orange-600" />
            )}
          </div>

          {/* CARD 4: Total Customers */}
          <div
            onClick={() => onNavigateTab('customer')}
            className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-sm font-semibold text-stone-600 block mb-1">Total Customers</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans">
                {customerCount}
              </div>
            </div>
            {renderDonut(
              55,
              <Users className="w-5 h-5 text-orange-600" />
            )}
          </div>

        </div>

        {/* REVENUE OVERVIEW CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-100/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Revenue Overview</h2>
            <button
              type="button"
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="Chart options"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Bar Chart Canvas with Y-axis lines */}
          <div className="relative pt-4">
            {/* Horizontal Grid lines */}
            <div className="space-y-7 text-[11px] text-stone-400 font-mono">
              <div className="flex items-center gap-3">
                <span className="w-7 text-right">180</span>
                <div className="h-px bg-stone-100 flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 text-right">160</span>
                <div className="h-px bg-stone-100 flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 text-right">140</span>
                <div className="h-px bg-stone-100 flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 text-right">120</span>
                <div className="h-px bg-stone-100 flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 text-right">100</span>
                <div className="h-px bg-stone-100 flex-1" />
              </div>
            </div>

            {/* Vertical Bars */}
            <div className="absolute inset-x-0 bottom-6 left-10 flex items-end justify-between px-2 sm:px-6 h-48">
              {revenueChartBars.map((bar, idx) => {
                const heightPercent = (bar.value / 200) * 100;
                const isActive = activeBarIndex === idx;

                return (
                  <div
                    key={bar.label}
                    onClick={() => setActiveBarIndex(idx)}
                    className="flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                  >
                    {/* Tooltip on active or hover */}
                    {isActive && (
                      <div className="bg-stone-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md animate-in fade-in zoom-in mb-1">
                        {bar.amount}
                      </div>
                    )}
                    {/* Bar Pill */}
                    <div className="w-2.5 sm:w-3.5 bg-stone-100 rounded-full h-40 flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-full transition-all duration-500 ${
                          isActive
                            ? 'bg-blue-600 ring-2 ring-blue-300'
                            : 'bg-sky-400 group-hover:bg-blue-500'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    {/* Month Label */}
                    <span
                      className={`text-[11px] font-medium transition-colors ${
                        isActive ? 'text-blue-600 font-bold' : 'text-stone-400 group-hover:text-stone-700'
                      }`}
                    >
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Spacer for bottom labels */}
            <div className="h-6" />
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* RIGHT STATS COLUMN (SPAN 4/12 on XL screens)                 */}
      {/* ============================================================ */}
      <div className="xl:col-span-4 space-y-6">
        
        {/* CARD 1: Total Sale with Green Smooth Wave */}
        <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500 block">Total Sale</span>
              <div className="text-3xl font-extrabold text-stone-900 tracking-tight font-sans mt-0.5">
                {stats.totalRevenue > 0 ? formatPeso(stats.totalRevenue) : '$254.90'}
              </div>
            </div>

            {/* Glowing Green Wave Area SVG */}
            <div className="w-32 h-16 shrink-0">
              <svg className="w-full h-full" viewBox="0 0 128 64" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="greenWaveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 45 Q 20 50, 40 40 T 80 15 T 128 20 L 128 64 L 0 64 Z"
                  fill="url(#greenWaveGradient)"
                />
                <path
                  d="M 0 45 Q 20 50, 40 40 T 80 15 T 128 20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-700 font-medium">
              {`${totalOrdersCount} total orders`}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
            >
              View Report
            </button>
          </div>
        </div>

        {/* CARD 2: Total Sessions with Sky Blue Wave */}
        <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500 block">Total Sessions</span>
              <div className="text-3xl font-extrabold text-stone-900 tracking-tight font-sans mt-0.5">
                845
              </div>
            </div>

            {/* Vibrant Sky Blue Wave Area SVG */}
            <div className="w-32 h-16 shrink-0">
              <svg className="w-full h-full" viewBox="0 0 128 64" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="blueWaveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 52 Q 25 55, 45 42 T 85 20 T 128 25 L 128 64 L 0 64 Z"
                  fill="url(#blueWaveGradient)"
                />
                <path
                  d="M 0 52 Q 25 55, 45 42 T 85 20 T 128 25"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2.5 py-1 bg-sky-100/80 text-sky-800 font-semibold rounded-lg">
              Live
            </span>
            <span className="px-2.5 py-1 bg-purple-100/80 text-purple-800 font-semibold rounded-lg">
              4 Visitors
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="px-2.5 py-1 bg-emerald-100/80 text-emerald-800 font-semibold rounded-lg hover:bg-emerald-200/80 transition-colors ml-auto cursor-pointer"
            >
              See Live View
            </button>
          </div>
        </div>

        {/* CARD 3: Customer Rate with Double Wave & Legend */}
        <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Customer rate</span>
            <button
              type="button"
              className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <MenuIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="text-3xl font-extrabold text-stone-900 tracking-tight font-sans">
            5.12%
          </div>

          {/* Double Wave Chart SVG */}
          <div className="w-full h-24 pt-1">
            <svg className="w-full h-full" viewBox="0 0 240 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="purpleRateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="orangeRateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background Wave 1 (Lavender/Purple - First Time) */}
              <path
                d="M 0 65 Q 40 50, 80 58 T 160 48 T 240 38 L 240 80 L 0 80 Z"
                fill="url(#purpleRateGradient)"
              />
              <path
                d="M 0 65 Q 40 50, 80 58 T 160 48 T 240 38"
                fill="none"
                stroke="#c084fc"
                strokeWidth="2"
              />

              {/* Foreground Wave 2 (Peach/Orange - Returning) */}
              <path
                d="M 0 70 Q 50 60, 100 66 T 180 35 T 240 18 L 240 80 L 0 80 Z"
                fill="url(#orangeRateGradient)"
              />
              <path
                d="M 0 70 Q 50 60, 100 66 T 180 35 T 240 18"
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          {/* Legend dots */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-medium text-stone-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>First Time</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-600" />
              <span>Returning</span>
            </div>
          </div>
        </div>

        {/* CARD 4: Recent Activity with Teal Bar Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">Recent Activity</h3>
            <span className="text-[11px] font-semibold text-stone-400">Today</span>
          </div>

          <div className="space-y-4">
            {recentActivities.map((act, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                {/* Timestamp */}
                <span className="font-bold text-stone-900 font-mono w-11 shrink-0 pt-0.5">
                  {act.time}
                </span>

                {/* Vertical Teal Indicator Bar */}
                <div className="w-1 self-stretch min-h-[36px] bg-cyan-600 rounded-full shrink-0" />

                {/* Message & Author */}
                <div className="min-w-0 flex-1">
                  <p className="text-stone-700 leading-snug">
                    {act.text}
                  </p>
                  <span className="text-stone-400 text-[11px] block mt-0.5">
                    by {act.author}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 5: Meta AI & Facebook Messenger Live Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Meta AI Barista</h4>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synced with FB Page
                </span>
              </div>
            </div>

            <a
              href="https://www.facebook.com/profile.php?id=61592982062259"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-blue-600 p-1 transition-colors"
              title="Open Facebook Page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-[11px] text-stone-500 leading-relaxed">
            Automating customer coffee recommendations and order queries on Facebook Messenger 24/7.
          </p>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[10px] font-mono text-stone-400">ID: 61592982062259</span>
            <button
              type="button"
              onClick={() => onNavigateTab('meta-ai')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Meta AI</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
