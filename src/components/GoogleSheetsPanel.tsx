import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  LogOut,
  Layers,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  Coffee,
  ShoppingBag
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSheetsSyncConfig, Order, Product } from '../types';
import { formatPeso } from '../utils/format';

interface GoogleSheetsPanelProps {
  user: User | null;
  accessToken: string | null;
  sheetConfig: GoogleSheetsSyncConfig;
  orders: Order[];
  products: Product[];
  isSigningIn: boolean;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onConnectSpreadsheet: () => Promise<void>;
  onSyncAllOrders: () => Promise<void>;
  onSyncMenuCatalog: () => Promise<void>;
  onToggleAutoSync: () => void;
  syncLogs: string[];
}

export const GoogleSheetsPanel: React.FC<GoogleSheetsPanelProps> = ({
  user,
  accessToken,
  sheetConfig,
  orders,
  products,
  isSigningIn,
  onGoogleSignIn,
  onGoogleSignOut,
  onConnectSpreadsheet,
  onSyncAllOrders,
  onSyncMenuCatalog,
  onToggleAutoSync,
  syncLogs
}) => {
  const [isConnectingSheet, setIsConnectingSheet] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [isSyncingMenu, setIsSyncingMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'orders' | 'menu';
    title: string;
    description: string;
  } | null>(null);

  const handleCreateOrLinkSheet = async () => {
    setIsConnectingSheet(true);
    try {
      await onConnectSpreadsheet();
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnectingSheet(false);
    }
  };

  const executeConfirmedSync = async () => {
    if (!confirmAction) return;
    const actionType = confirmAction.type;
    setConfirmAction(null);

    if (actionType === 'orders') {
      setIsSyncingOrders(true);
      try {
        await onSyncAllOrders();
      } finally {
        setIsSyncingOrders(false);
      }
    } else if (actionType === 'menu') {
      setIsSyncingMenu(true);
      try {
        await onSyncMenuCatalog();
      } finally {
        setIsSyncingMenu(false);
      }
    }
  };

  return (
    <div className="space-y-6 text-stone-900">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" /> Cloud Storage &amp; Google Sheets
            </span>
            <span className="text-xs text-stone-400">Google Drive &amp; Workspace API</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900">
            Google Sheets Live Cloud Database
          </h2>
          <p className="text-xs text-stone-500 max-w-2xl">
            Save and manage all customer orders, GCash/Maya reference numbers, and menu items directly in your Google Drive spreadsheet in real-time.
          </p>
        </div>

        {/* Quick status badge */}
        <div className="flex items-center gap-3 shrink-0">
          {user && sheetConfig.spreadsheetId ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Cloud Synced
                </span>
                <span className="text-xs font-bold text-stone-900">Google Sheets Active</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3.5 py-2 rounded-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 block">
                  Setup Required
                </span>
                <span className="text-xs font-semibold text-stone-700">Sign In with Google</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account & Spreadsheet Connection */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Step 1: Google Account Authentication */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-stone-600" /> 1. Google Account
              </h3>
              {user && (
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Connected
                </span>
              )}
            </div>

            {!user ? (
              <div className="space-y-3">
                <p className="text-xs text-stone-500 leading-relaxed">
                  Sign in with your Google account to grant permission for Avenue Café to create and update your dedicated order spreadsheet on Google Drive.
                </p>

                <button
                  onClick={onGoogleSignIn}
                  disabled={isSigningIn}
                  className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2.5 transition-colors border border-stone-300 shadow-xs cursor-pointer"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 flex-shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-9 h-9 rounded-full border border-stone-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center font-bold text-white text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'A'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-stone-900 truncate">{user.displayName || 'Authorized Admin'}</h4>
                    <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={onGoogleSignOut}
                  className="w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                >
                  <LogOut className="w-3.5 h-3.5" /> Disconnect Google Account
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Spreadsheet Connection */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> 2. Google Sheet Database
            </h3>

            {!user ? (
              <p className="text-xs text-stone-400 italic">
                Please sign in with your Google Account above first.
              </p>
            ) : !sheetConfig.spreadsheetId ? (
              <div className="space-y-3">
                <p className="text-xs text-stone-600">
                  Click below to auto-create and format the official <strong className="text-stone-900">Avenue Café - Live Orders &amp; Cloud Database</strong> spreadsheet on your Google Drive.
                </p>

                <button
                  onClick={handleCreateOrLinkSheet}
                  disabled={isConnectingSheet}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isConnectingSheet ? 'Creating Spreadsheet...' : 'Auto-Create & Connect Sheet'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                        Active Database
                      </span>
                      <h4 className="text-xs font-bold text-stone-900">{sheetConfig.spreadsheetTitle}</h4>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  </div>

                  {sheetConfig.lastSyncedAt && (
                    <p className="text-[10px] text-stone-500">
                      Last Synced: {new Date(sheetConfig.lastSyncedAt).toLocaleTimeString()}
                    </p>
                  )}

                  {sheetConfig.spreadsheetUrl && (
                    <a
                      href={sheetConfig.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline pt-1"
                    >
                      <span>Open in Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Auto Sync Toggle */}
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-stone-900 block">Auto-Sync Orders</span>
                    <span className="text-[10px] text-stone-500 block">
                      Instantly append customer orders
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sheetConfig.autoSyncOrders}
                    onChange={onToggleAutoSync}
                    className="accent-emerald-600 w-4 h-4 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cloud Actions & Spreadsheet Structure */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cloud Sync Actions */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-emerald-700" /> Manual Cloud Sync Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Sync All Orders Card */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-amber-700" /> Sync All Orders ({orders.length})
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Syncs and updates customer transactions, delivery details, and payment statuses to the <code>Live Orders</code> sheet tab.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setConfirmAction({
                      type: 'orders',
                      title: 'Sync All Customer Orders to Google Sheet?',
                      description: `This will export and synchronize all ${orders.length} current customer orders and statuses into your Google Spreadsheet.`
                    })
                  }
                  disabled={!user || !sheetConfig.spreadsheetId || isSyncingOrders}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOrders ? 'animate-spin' : ''}`} />
                  <span>{isSyncingOrders ? 'Syncing Orders...' : `Export All ${orders.length} Orders`}</span>
                </button>
              </div>

              {/* Sync Menu Catalog Card */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Coffee className="w-4 h-4 text-stone-700" /> Sync Menu Catalog ({products.length})
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Exports coffee, bakery items, prices in PHP ({formatPeso(0).slice(0, 1)}), preparation times, and availability into the <code>Menu Catalog</code> sheet tab.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setConfirmAction({
                      type: 'menu',
                      title: 'Sync Menu Catalog to Google Sheet?',
                      description: `This will update the "Menu Catalog" sheet tab with all ${products.length} active menu items, prices in Philippine Pesos, and stock statuses.`
                    })
                  }
                  disabled={!user || !sheetConfig.spreadsheetId || isSyncingMenu}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Layers className={`w-3.5 h-3.5 ${isSyncingMenu ? 'animate-spin' : ''}`} />
                  <span>{isSyncingMenu ? 'Syncing Menu...' : `Export ${products.length} Menu Items`}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Spreadsheet Sheet Schema Preview */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-700" /> Cloud Spreadsheet Structure
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">Tab 1: 'Live Orders'</span>
                  <span className="text-[10px] text-stone-400">15 Columns</span>
                </div>
                <div className="text-[11px] text-stone-600 font-mono space-y-1 bg-white p-3 rounded-lg border border-stone-200">
                  <p>• Order #, Date &amp; Time, Customer Name</p>
                  <p>• Phone, Delivery Type, Delivery Address</p>
                  <p>• Payment Method, Reference #, Total (PHP)</p>
                  <p>• Status (Pending, Preparing, Ready, Delivered)</p>
                  <p>• Items Breakdown &amp; Special Instructions</p>
                </div>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">Tab 2: 'Menu Catalog'</span>
                  <span className="text-[10px] text-stone-400">8 Columns</span>
                </div>
                <div className="text-[11px] text-stone-600 font-mono space-y-1 bg-white p-3 rounded-lg border border-stone-200">
                  <p>• Product ID, Item Name, Category</p>
                  <p>• Price (PHP ₱), In Stock / Sold Out</p>
                  <p>• Preparation Time, Popular Badge, Description</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity / Sync Logs */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-500" /> Cloud Sync Event Logs
              </span>
              <span className="text-[10px] font-mono text-stone-400">Real-time</span>
            </h3>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 max-h-48 overflow-y-auto font-mono text-xs text-stone-700 space-y-1.5">
              {syncLogs.length === 0 ? (
                <p className="text-stone-400 text-xs italic">
                  No sync events logged yet. Connect your Google account or place a customer order to see live events.
                </p>
              ) : (
                syncLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 select-none">›</span>
                    <span className="text-stone-700 leading-tight">{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-stone-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <AlertCircle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">{confirmAction.title}</h3>
                <span className="text-xs text-stone-500">Google Workspace Confirmation</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">{confirmAction.description}</p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedSync}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Confirm &amp; Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
