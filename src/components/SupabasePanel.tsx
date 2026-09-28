import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  FileJson,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  ShieldCheck,
  RefreshCw,
  Trash2,
  PackageCheck,
  Bike,
  Store,
  AlertCircle
} from 'lucide-react';
import { Product, Order, SupabaseConfig, SalesReportSnapshot } from '../types';
import { formatPeso } from '../utils/format';
import { generateSupabaseDump } from '../data/supabaseSchema';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  testSupabaseConnection,
  syncAllToSupabase
} from '../utils/supabaseClient';
import {
  getStoredReportSnapshots,
  saveReportSnapshot,
  deleteReportSnapshot,
  generateReportFromOrders,
  downloadReportCSV,
  downloadReportJSON
} from '../utils/reportingStorage';

interface SupabasePanelProps {
  products: Product[];
  orders: Order[];
}

export const SupabasePanel: React.FC<SupabasePanelProps> = ({ products, orders }) => {
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reporting State
  const [reportPeriod, setReportPeriod] = useState<'today' | 'last_7_days' | 'last_30_days' | 'all_time'>('today');
  const [currentReport, setCurrentReport] = useState<SalesReportSnapshot>(() =>
    generateReportFromOrders(orders, 'today')
  );
  const [savedSnapshots, setSavedSnapshots] = useState<SalesReportSnapshot[]>(getStoredReportSnapshots());
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'reporting' | 'cloud_sync' | 'sql_schema'>('reporting');

  // Recalculate live report whenever orders or selected period changes
  useEffect(() => {
    setCurrentReport(generateReportFromOrders(orders, reportPeriod));
  }, [orders, reportPeriod]);

  const handleSaveConfig = () => {
    saveStoredSupabaseConfig(supabaseConfig);
    setTestResult({ success: true, message: 'Supabase credentials saved locally.' });
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey);
      setTestResult(res);
      if (res.success) {
        const updated = { ...supabaseConfig, isConnected: true };
        setSupabaseConfig(updated);
        saveStoredSupabaseConfig(updated);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncAllToSupabase(products, orders, savedSnapshots);
      setSyncResult(res);
      if (res.success) {
        const updated = { ...supabaseConfig, lastSyncedAt: new Date().toISOString(), isConnected: true };
        setSupabaseConfig(updated);
        saveStoredSupabaseConfig(updated);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveCurrentSnapshot = () => {
    const newSnapshot = generateReportFromOrders(orders, reportPeriod);
    const updated = saveReportSnapshot(newSnapshot);
    setSavedSnapshots(updated);
    setSyncResult({
      success: true,
      message: `Saved snapshot "${newSnapshot.reportName}" to Data Storage for Reporting!`
    });
    setTimeout(() => setSyncResult(null), 4000);
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = deleteReportSnapshot(id);
    setSavedSnapshots(updated);
  };

  const handleCopySql = () => {
    const sql = generateSupabaseDump();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadSql = () => {
    window.open('/api/supabase/export-sql', '_blank');
  };

  return (
    <div className="space-y-6 text-stone-900">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" /> Supabase &amp; Sales Reporting Engine
              </span>
              <span className="text-xs text-stone-400">PostgreSQL Layer</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mt-1.5 flex items-center gap-2">
              Supabase Cloud Database &amp; Sales Reporting Engine
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl leading-relaxed">
              Real-time audit reporting data store, relational PostgreSQL schemas for Avenue Café, automated sales metrics snapshots, and Supabase cloud persistence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleSaveCurrentSnapshot}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Save Snapshot
            </button>

            <button
              onClick={() => downloadReportCSV(currentReport)}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download CSV report"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> Export CSV
            </button>

            <button
              onClick={() => downloadReportJSON(currentReport)}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export JSON report"
            >
              <FileJson className="w-4 h-4 text-amber-700" /> Export JSON
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-stone-200 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('reporting')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'reporting'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Reporting Data &amp; Metrics
          </button>

          <button
            onClick={() => setActiveSubTab('cloud_sync')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'cloud_sync'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" /> Supabase Connection &amp; Live Sync
          </button>

          <button
            onClick={() => setActiveSubTab('sql_schema')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'sql_schema'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> PostgreSQL / SQL Schema
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: DATA STORAGE FOR REPORTING & AUDIT METRICS */}
      {/* ======================================================== */}
      {activeSubTab === 'reporting' && (
        <div className="space-y-6">
          
          {/* Period Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-stone-500 font-semibold uppercase mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" /> Period:
              </span>
              {(['today', 'last_7_days', 'last_30_days', 'all_time'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setReportPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                    reportPeriod === p
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {p === 'today' ? 'Today' : p === 'last_7_days' ? 'Last 7 Days' : p === 'last_30_days' ? 'Last 30 Days' : 'All-Time'}
                </button>
              ))}
            </div>

            <span className="text-xs text-stone-400 font-mono">
              Audit As Of: {new Date(currentReport.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Gross Revenue */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium">Valid Gross Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-emerald-700">{formatPeso(currentReport.totalGrossSales)}</span>
              <p className="text-[11px] text-stone-400 mt-1">
                Net Menu: {formatPeso(currentReport.netSales)}
              </p>
            </div>

            {/* Valid Orders Count */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium">Valid Completed Orders</span>
                <ShoppingBag className="w-4 h-4 text-stone-600" />
              </div>
              <span className="text-2xl font-bold text-stone-900">{currentReport.validOrdersCount}</span>
              <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                Excludes cancelled orders
              </p>
            </div>

            {/* Cancelled / Voided Orders */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium">Cancelled Orders</span>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-2xl font-bold text-red-600">{currentReport.cancelledOrdersCount}</span>
              <p className="text-[11px] text-stone-400 mt-1">
                Loss: {formatPeso(currentReport.cancelledLossAmount)} (Voided)
              </p>
            </div>

            {/* Average Order Value */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium">Average Order Value (AOV)</span>
                <TrendingUp className="w-4 h-4 text-amber-700" />
              </div>
              <span className="text-2xl font-bold text-amber-800">{formatPeso(currentReport.averageOrderValue)}</span>
              <p className="text-[11px] text-stone-400 mt-1">
                Per valid transaction
              </p>
            </div>

          </div>

          {/* Detailed Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Fulfillment Channel Distribution */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Bike className="w-4 h-4 text-stone-600" /> Fulfillment Channels
              </h3>

              <div className="space-y-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-stone-600" />
                    <div>
                      <span className="text-xs font-semibold text-stone-900 block">Door Delivery</span>
                      <span className="text-[10px] text-stone-400">Rider dispatch</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-stone-900">{currentReport.deliveryOrdersCount} orders</span>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-700" />
                    <div>
                      <span className="text-xs font-semibold text-stone-900 block">Store Pick-Up</span>
                      <span className="text-[10px] text-stone-400">Claim at barista counter</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-amber-800">{currentReport.pickupOrdersCount} orders</span>
                </div>
              </div>
            </div>

            {/* Payment Method Volume */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-stone-600" /> Payment Breakdown
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-sky-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-600" /> GCash
                  </span>
                  <span className="font-mono font-bold text-stone-900">{formatPeso(currentReport.paymentBreakdown.gcash)}</span>
                </div>

                <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" /> Maya
                  </span>
                  <span className="font-mono font-bold text-stone-900">{formatPeso(currentReport.paymentBreakdown.maya)}</span>
                </div>

                <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600" /> Cash (COD / Counter)
                  </span>
                  <span className="font-mono font-bold text-stone-900">{formatPeso(currentReport.paymentBreakdown.cash)}</span>
                </div>

                <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-stone-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-stone-500" /> Credit / Debit Card
                  </span>
                  <span className="font-mono font-bold text-stone-900">{formatPeso(currentReport.paymentBreakdown.card)}</span>
                </div>
              </div>
            </div>

            {/* Top Velocity Items */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-700" /> Top Velocity Items
              </h3>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {currentReport.topItems.length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">No item sales in this period.</p>
                ) : (
                  currentReport.topItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-stone-50 p-2 rounded-xl border border-stone-200">
                      <span className="text-stone-800 font-medium truncate max-w-[150px]">
                        {idx + 1}. {item.productName}
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-amber-800">{formatPeso(item.revenue)}</span>
                        <span className="text-[10px] text-stone-400 block font-mono">({item.quantity} sold)</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Archive List */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-700" /> Saved Reporting Snapshots ({savedSnapshots.length})
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Saved audit snapshots stored in persistent local and cloud storage.
                </p>
              </div>

              <button
                onClick={handleSaveCurrentSnapshot}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> Save Current Snapshot
              </button>
            </div>

            {savedSnapshots.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-xl border border-stone-200 text-stone-400 text-xs">
                No reporting snapshots saved yet. Click "Save Snapshot" above to preserve an audit record.
              </div>
            ) : (
              <div className="divide-y divide-stone-100 overflow-x-auto">
                {savedSnapshots.map((snap) => (
                  <div key={snap.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="font-semibold text-stone-900 block">{snap.reportName}</span>
                      <p className="text-[11px] text-stone-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-amber-800 font-mono font-bold">{formatPeso(snap.totalGrossSales)}</span>
                        <span>•</span>
                        <span>{snap.validOrdersCount} valid orders</span>
                        <span>•</span>
                        <span>{snap.cancelledOrdersCount} cancelled</span>
                        <span>•</span>
                        <span className="text-stone-400">{new Date(snap.generatedAt).toLocaleString()}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => downloadReportCSV(snap)}
                        title="Download CSV"
                        className="p-2 bg-stone-50 hover:bg-stone-100 text-emerald-700 rounded-lg border border-stone-200 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => downloadReportJSON(snap)}
                        title="Download JSON"
                        className="p-2 bg-stone-50 hover:bg-stone-100 text-amber-700 rounded-lg border border-stone-200 transition-colors cursor-pointer"
                      >
                        <FileJson className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSnapshot(snap.id)}
                        title="Remove snapshot"
                        className="p-2 bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg border border-stone-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: SUPABASE CLOUD CONNECTION & SYNC */}
      {/* ======================================================== */}
      {activeSubTab === 'cloud_sync' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-emerald-700" /> Supabase Project Configuration
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Connect your live Supabase PostgreSQL database project to enable real-time cloud sync.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${supabaseConfig.isConnected ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                <span className="text-xs font-mono text-stone-600">
                  {supabaseConfig.isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase font-semibold text-stone-700 mb-1">
                  Supabase Project URL:
                </label>
                <input
                  type="text"
                  placeholder="https://xyzprojectid.supabase.co"
                  value={supabaseConfig.supabaseUrl}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, supabaseUrl: e.target.value })}
                  className="w-full bg-stone-50 text-stone-900 px-3.5 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-stone-700 mb-1">
                  Supabase Anon / Public API Key:
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseConfig.supabaseAnonKey}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, supabaseAnonKey: e.target.value })}
                  className="w-full bg-stone-50 text-stone-900 px-3.5 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white font-mono text-xs"
                />
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {testResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {syncResult && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  syncResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {syncResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span>{syncResult.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg border border-stone-200 transition-colors cursor-pointer"
              >
                Save Settings
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={isSyncing}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing...' : 'Sync All Data to Supabase'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: SUPABASE SQL SCHEMA & TABLES */}
      {/* ======================================================== */}
      {activeSubTab === 'sql_schema' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-700" /> Supabase SQL Schema
              </h3>
              <p className="text-xs text-stone-500">
                Copy and run this PostgreSQL script in your Supabase SQL Editor to create all required tables &amp; policies.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg border border-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL'}</span>
              </button>

              <button
                onClick={handleDownloadSql}
                className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" /> Download .sql
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> categories &amp; products
              </h4>
              <ul className="text-[11px] text-stone-500 space-y-1 font-mono">
                <li>• id (VARCHAR, PK)</li>
                <li>• name, category_name</li>
                <li>• price, sale_price</li>
                <li>• is_on_sale, available</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> orders &amp; order_items
              </h4>
              <ul className="text-[11px] text-stone-500 space-y-1 font-mono">
                <li>• id, order_number (UNIQUE)</li>
                <li>• customer_name, phone, lat/lng</li>
                <li>• status, total, subtotal</li>
                <li>• customer_received, cancelled_by</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> sales_reports
              </h4>
              <ul className="text-[11px] text-stone-500 space-y-1 font-mono">
                <li>• id (VARCHAR, PK)</li>
                <li>• report_name, period</li>
                <li>• total_gross_sales, net_sales</li>
                <li>• payment_breakdown (JSONB)</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <h4 className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> reporting_data_store
              </h4>
              <ul className="text-[11px] text-stone-500 space-y-1 font-mono">
                <li>• id (UUID, PK)</li>
                <li>• metric_key, metric_date</li>
                <li>• data_payload (JSONB)</li>
                <li>• logged_at (TIMESTAMPTZ)</li>
              </ul>
            </div>
          </div>

          <div className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-stone-100 border-b border-stone-200 text-xs text-stone-600 font-mono flex items-center justify-between">
              <span>avenue_cafe_supabase_schema.sql</span>
              <span>PostgreSQL 15+ / Supabase RLS</span>
            </div>
            <pre className="p-4 text-xs font-mono text-stone-800 overflow-x-auto max-h-96 leading-relaxed">
              {generateSupabaseDump()}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};
