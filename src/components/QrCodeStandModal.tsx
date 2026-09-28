import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Printer,
  Download,
  X,
  Sparkles,
  Wifi,
  Coffee,
  Check,
  Share2,
  ExternalLink,
  Layers,
  UtensilsCrossed
} from 'lucide-react';
import { StoreSettings } from '../types';
import { DEFAULT_STORE_SETTINGS } from '../data/initialData';

interface QrCodeStandModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings?: StoreSettings;
}

export const QrCodeStandModal: React.FC<QrCodeStandModalProps> = ({
  isOpen,
  onClose,
  storeSettings = DEFAULT_STORE_SETTINGS
}) => {
  const [selectedTable, setSelectedTable] = useState<string>('Table 1');
  const [customTableName, setCustomTableName] = useState<string>('');
  const [cardTheme, setCardTheme] = useState<'dark' | 'light' | 'gold'>('dark');
  const [includeWifi, setIncludeWifi] = useState<boolean>(true);
  const [wifiSsid, setWifiSsid] = useState<string>(storeSettings.wifiSsid || 'AvenueCafe_Guest_5G');
  const [wifiPassword, setWifiPassword] = useState<string>(storeSettings.wifiPassword || 'AvenueCoffee2024');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const activeTableName = selectedTable === 'Custom' ? (customTableName || 'VIP Table') : selectedTable;

  // Build the target table ordering URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://avenuecafe.menue.io';
  const tableOrderUrl = `${currentOrigin}?table=${encodeURIComponent(activeTableName)}&mode=dine_in`;

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(tableOrderUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: cardTheme === 'light' ? '#1c1917' : '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code', err));
  }, [tableOrderUrl, cardTheme, isOpen]);

  if (!isOpen) return null;

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${storeSettings.storeName.replace(/\s+/g, '_')}_QR_${activeTableName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tableOrderUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const tablePresets = [
    'Table 1',
    'Table 2',
    'Table 3',
    'Table 4',
    'Table 5',
    'Table 6',
    'Table 7',
    'Table 8',
    'Bar Counter 1',
    'Bar Counter 2',
    'Alfresco Patio 1',
    'Takeaway Window',
    'Custom'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:bg-white print:p-0">
      <div
        id="qr-modal-container"
        className="bg-white border border-stone-200 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:w-full text-stone-900"
      >
        {/* Header - Screen Only */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">
                  QR Code & Table Tent Generator
                </h2>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  menue.io feature
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Generate contactless QR codes for dine-in tables, counter stands, and takeaway menus with zero app downloads.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:p-0 print:block">
          {/* Controls Column - Left */}
          <div className="lg:col-span-5 space-y-4 print:hidden">
            {/* Table Selector */}
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono block">
                1. Select Table / Location
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {tablePresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSelectedTable(preset)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                      selectedTable === preset
                        ? 'bg-amber-600 text-white font-bold shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {selectedTable === 'Custom' && (
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="e.g. VIP Lounge Room, Rooftop Deck"
                    value={customTableName}
                    onChange={(e) => setCustomTableName(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-600"
                  />
                </div>
              )}
            </div>

            {/* Stand Card Theme */}
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono block">
                2. Tent Card Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setCardTheme('light')}
                  className={`p-2 rounded-lg border text-xs font-bold text-center cursor-pointer transition-all ${
                    cardTheme === 'light'
                      ? 'bg-white border-amber-600 text-amber-800 shadow-xs ring-1 ring-amber-600'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  ☀️ Clean White
                </button>

                <button
                  onClick={() => setCardTheme('dark')}
                  className={`p-2 rounded-lg border text-xs font-bold text-center cursor-pointer transition-all ${
                    cardTheme === 'dark'
                      ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  🌙 Charcoal Dark
                </button>

                <button
                  onClick={() => setCardTheme('gold')}
                  className={`p-2 rounded-lg border text-xs font-bold text-center cursor-pointer transition-all ${
                    cardTheme === 'gold'
                      ? 'bg-amber-100 border-amber-600 text-amber-900 font-bold shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  ✨ Warm Honey
                </button>
              </div>
            </div>

            {/* Wi-Fi Details */}
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  3. Free Guest Wi-Fi on Tent Card
                </label>
                <input
                  type="checkbox"
                  checked={includeWifi}
                  onChange={(e) => setIncludeWifi(e.target.checked)}
                  className="rounded accent-amber-600 cursor-pointer"
                />
              </div>

              {includeWifi && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-stone-500 font-mono">Wi-Fi Network SSID</span>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-mono">Wi-Fi Password</span>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-amber-700" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Table Link'}</span>
              </button>

              <button
                onClick={handleDownloadQr}
                className="flex-1 py-2 px-3 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-700" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>

          {/* Printable Tent Card Preview - Right */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center print:block print:w-full">
            <div
              ref={printAreaRef}
              className={`w-full max-w-sm rounded-2xl p-6 sm:p-7 shadow-lg border transition-all text-center relative overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-[360px] print:mx-auto ${
                cardTheme === 'light'
                  ? 'bg-white text-stone-900 border-stone-200'
                  : cardTheme === 'gold'
                  ? 'bg-gradient-to-b from-amber-50 to-amber-100 text-amber-950 border-amber-200'
                  : 'bg-stone-900 text-white border-stone-800'
              }`}
            >
              {/* Top Branding */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs mb-2 ${
                    cardTheme === 'dark'
                      ? 'bg-stone-800 text-amber-400'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  <Coffee className="w-5 h-5" />
                </div>
                <h3
                  className={`text-base font-bold tracking-tight ${
                    cardTheme === 'dark' ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  {storeSettings.storeName}
                </h3>
                <p className="text-[11px] opacity-70 font-medium">
                  {storeSettings.tagline || 'Artisan Coffee & Kitchen'}
                </p>
              </div>

              {/* Table Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-mono font-bold text-xs tracking-wider uppercase mb-3.5">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>{activeTableName}</span>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-3 rounded-xl shadow-md inline-block mx-auto border border-stone-200">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${activeTableName}`}
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-md"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-stone-400 text-xs">
                    Generating QR...
                  </div>
                )}
              </div>

              {/* Call to Action */}
              <div className="mt-3.5 space-y-0.5">
                <h4
                  className={`text-xs font-bold uppercase tracking-wider ${
                    cardTheme === 'dark' ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  Scan to View Menu & Order
                </h4>
                <p className="text-[11px] opacity-75 max-w-[240px] mx-auto">
                  Open phone camera • Instant ordering
                </p>
              </div>

              {/* Guest WiFi Footer */}
              {includeWifi && (
                <div
                  className={`mt-3.5 pt-2.5 border-t text-[11px] flex items-center justify-center gap-2 font-mono ${
                    cardTheme === 'dark'
                      ? 'border-stone-800 text-stone-300 bg-stone-800/80 py-1.5 rounded-lg'
                      : 'border-stone-200 text-stone-700 bg-stone-50 py-1.5 rounded-lg'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <div>
                    <span>Wi-Fi: </span>
                    <strong className="text-amber-800">{wifiSsid}</strong>
                    <span className="mx-1">•</span>
                    <span>Pass: </span>
                    <strong className="text-amber-800">{wifiPassword}</strong>
                  </div>
                </div>
              )}

              {/* Powered by Menue.io Watermark */}
              <div className="mt-3 text-[9px] opacity-40 uppercase tracking-widest font-mono">
                Direct Contactless Ordering • Powered by menue.io
              </div>
            </div>

            {/* Print CTA Button */}
            <button
              onClick={handlePrint}
              className="mt-4 w-full max-w-sm py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>Print Table Tent Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
