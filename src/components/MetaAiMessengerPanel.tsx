import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Settings,
  Flame,
  ShieldCheck,
  Clock,
  User,
  Coffee,
  ShoppingBag,
  Sliders,
  Play,
  Receipt,
  FileText,
  RotateCcw,
  Printer,
  ChevronRight,
  Phone,
  MapPin,
  CreditCard,
  CheckCheck
} from 'lucide-react';
import { Product, StoreSettings, MetaAiMessengerLogItem, MetaAiMessengerSessionItem } from '../types';
import { formatPeso } from '../utils/format';

interface MetaAiMessengerPanelProps {
  products: Product[];
  storeSettings?: StoreSettings;
}

export const MetaAiMessengerPanel: React.FC<MetaAiMessengerPanelProps> = ({
  products,
  storeSettings
}) => {
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState<'meta-llama-3-8b' | 'gemini-3.8-flash'>('meta-llama-3-8b');
  const [customGreeting, setCustomGreeting] = useState(
    "Hi! Welcome to Matcha Avenue Cafe via Meta AI & Facebook Messenger. How can I brew your day today? Ask about our ceremonial matcha, specialty coffees, artisan bakery, or place your order directly for delivery or pick-up!"
  );

  // Active Messenger Sessions State
  const [sessions, setSessions] = useState<MetaAiMessengerSessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Playground Chat State
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    sender: 'user' | 'meta-ai';
    text: string;
    timestamp: string;
    products?: Product[];
    source?: string;
  }>>([
    {
      sender: 'meta-ai',
      text: "Hello! I am your Meta AI Barista connected to Matcha Avenue Cafe's official Facebook Page (ID: 61592982062259). If a client wants to order, I directly show all menu items, provide full order details with subtotal and delivery breakdown, and issue official automated receipts directly via Messenger!",
      timestamp: 'Just now',
      source: 'meta-ai'
    }
  ]);

  // Webhook Logs State
  const [webhookLogs, setWebhookLogs] = useState<MetaAiMessengerLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'orders'>('all');

  // Simulated Test Message Modal / Fields
  const [simGuestName, setSimGuestName] = useState('Maria Santos');
  const [simSenderId, setSimSenderId] = useState('fb-user-maria');
  const [simMessage, setSimMessage] = useState(
    'Order 2 Iced Uji Cream Matcha with oat milk and 1 Butter Croissant. Deliver to Unit 12B Two Serendra BGC Taguig. Phone: 09178889999. Cash on delivery.'
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    log?: MetaAiMessengerLogItem;
    isOrderCreated?: boolean;
    order?: any;
    receiptText?: string;
  } | null>(null);

  // Receipt Modal State
  const [activeReceiptModal, setActiveReceiptModal] = useState<{
    orderNumber?: string;
    receiptText: string;
  } | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const fbPageUrl = 'https://www.facebook.com/profile.php?id=61592982062259';
  const fbMessengerUrl = 'https://m.me/61592982062259';
  const fbBusinessSuiteUrl = 'https://business.facebook.com/latest/inbox/all?asset_id=61592982062259&thread_type=FB_MESSAGE&mailbox_id=61592982062259';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://matchaavenue.menue.io';
  const webhookCallbackUrl = `${currentOrigin}/api/meta-ai/webhook`;
  const verifyToken = 'matcha_avenue_meta_ai_secret_verify_token';

  // Fetch initial config, logs, and active sessions
  const fetchConfigAndLogs = async () => {
    setIsLoadingLogs(true);
    setIsLoadingSessions(true);
    try {
      // 1. Fetch Config & Logs
      const res = await fetch('/api/meta-ai/config');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAutoReplyEnabled(json.data.autoReplyEnabled ?? true);
          if (json.data.customGreeting) setCustomGreeting(json.data.customGreeting);
          if (json.data.recentLogs) setWebhookLogs(json.data.recentLogs);
        }
      }

      // 2. Fetch Active Messenger Sessions
      const sessRes = await fetch('/api/meta-ai/sessions');
      if (sessRes.ok) {
        const sessJson = await sessRes.json();
        const sessionList = sessJson.data || sessJson.sessions;
        if (sessJson.success && Array.isArray(sessionList)) {
          setSessions(sessionList);
        }
      }
    } catch (err) {
      console.warn('Could not fetch Meta AI data:', err);
    } finally {
      setIsLoadingLogs(false);
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchConfigAndLogs();
  }, []);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookCallbackUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(verifyToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyReceiptText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handleResetSession = async (senderId: string) => {
    try {
      const res = await fetch('/api/meta-ai/reset-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId })
      });
      if (res.ok) {
        fetchConfigAndLogs();
      }
    } catch (err) {
      console.error('Failed to reset session:', err);
    }
  };

  const handleSendPlaygroundMessage = async (overrideText?: string) => {
    const text = (overrideText || chatInput).trim();
    if (!text || isSending) return;

    const userEntry = {
      sender: 'user' as const,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userEntry]);
    setChatInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/meta-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, engine: selectedModel })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setChatMessages((prev) => [
            ...prev,
            {
              sender: 'meta-ai',
              text: data.data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              products: data.data.recommendedProducts,
              source: data.data.source
            }
          ]);
        }
      } else {
        throw new Error('API failed');
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'meta-ai',
          text: "I'm having trouble reaching the barista engine right now. However, you can message our Facebook Page directly at https://www.facebook.com/profile.php?id=61592982062259!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'offline'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSimulateIncomingMessage = async () => {
    if (!simMessage.trim() || isSimulating) return;
    setIsSimulating(true);
    setSimulationResult(null);

    try {
      const res = await fetch('/api/meta-ai/simulate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: simGuestName,
          senderId: simSenderId,
          messageText: simMessage,
          engine: selectedModel
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setSimulationResult(data.data);
          if (data.data.log) {
            setWebhookLogs((prev) => [data.data.log, ...prev]);
          }
          // Refresh sessions
          fetchConfigAndLogs();
        }
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Preset quick order scenarios for instant testing
  const simScenarios = [
    {
      title: 'Show Full Shop Menu',
      tag: 'Direct Menu Response',
      sender: 'Carlos Tan',
      id: 'fb-carlos-menu',
      msg: 'I want to order, please show me the menu'
    },
    {
      title: 'Complete 1-Shot Order',
      tag: 'Full Order + Instant Receipt',
      sender: 'Maria Santos',
      id: 'fb-maria-direct',
      msg: 'Order 2 Spanish Latte with oat milk and 1 Butter Croissant. Deliver to Unit 12B Two Serendra BGC Taguig. Phone: 09178889999. Cash on delivery.'
    },
    {
      title: 'Step 1: Order Items Only',
      tag: 'Full Order Details Returned',
      sender: 'Juan Carlos',
      id: 'fb-juan-stepped',
      msg: 'Pa-order po ng dalawang spanish latte and 1 artisan butter croissant'
    },
    {
      title: 'Step 2: Deliver & Confirm',
      tag: 'Receipt Trigger',
      sender: 'Juan Carlos',
      id: 'fb-juan-stepped',
      msg: 'Deliver to Unit 402 Tower 1 High Street South BGC, Phone: 09181234567, GCash payment please'
    },
    {
      title: 'Barista Q&A: Store Hours & Vegan Milk',
      tag: 'Accurate Information',
      sender: 'Camille Reyes',
      id: 'fb-camille-q',
      msg: 'What are your store hours, where are you located, and do you offer barista oat milk?'
    }
  ];

  const filteredLogs = webhookLogs.filter((log) => {
    if (logFilter === 'orders') return log.orderCreated;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Connected Facebook Page with Live Automated Ordering Highlight */}
      <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <MessageCircle className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Meta AI Automated Ordering Active
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Receipt className="w-3 h-3" />
                Instant Messenger Receipt Engine
              </span>
              <span className="text-[11px] font-mono text-stone-400">Page ID: 1171899632682651</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mt-1">
              Facebook Page &amp; Meta AI Automated Ordering Hub
            </h2>
            <p className="text-xs text-stone-500 mt-0.5 max-w-2xl">
              Clients can chat naturally on your Facebook Page to browse menus, specify item customizations, input delivery addresses, and instantly receive official automated receipts right inside Messenger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={fbBusinessSuiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Meta Business Suite Inbox</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={fbPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Facebook Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={fbMessengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Messenger</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-100/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-400 font-medium block">Natural Ordering</span>
            <span className="text-sm font-bold text-stone-900">Conversational NLP</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-100/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-400 font-medium block">Automated Receipt</span>
            <span className="text-sm font-bold text-stone-900">Sent via Messenger</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-100/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-400 font-medium block">Kitchen Dispatch</span>
            <span className="text-sm font-bold text-stone-900">Live POS Synchronization</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Simulator & Settings | Sessions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Automated Order Simulator & API Config (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">

          {/* Facebook Messenger Automated Order Simulator Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900">Automated Messenger Order Simulator</h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Receipt Generator Ready
              </span>
            </div>

            <p className="text-xs text-stone-500">
              Test full conversational client orders directly as if sent to your Facebook Page. Watch the AI auto-detect items, calculate totals, book the kitchen order, and return the official text receipt!
            </p>

            {/* Quick Scenario Buttons */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Quick Test Scenarios:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {simScenarios.map((sc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSimGuestName(sc.sender);
                      setSimSenderId(sc.id);
                      setSimMessage(sc.msg);
                    }}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100 hover:border-blue-300 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-900 group-hover:text-blue-600 transition-colors">
                        {sc.title}
                      </span>
                      <span className="text-[9px] font-semibold bg-white px-1.5 py-0.5 rounded text-stone-500 border border-stone-200">
                        {sc.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 truncate mt-1">{sc.msg}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={simGuestName}
                  onChange={(e) => setSimGuestName(e.target.value)}
                  className="w-full bg-stone-50 text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:bg-white"
                  placeholder="e.g. Maria Santos"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">Sender ID (Facebook User Key)</label>
                <input
                  type="text"
                  value={simSenderId}
                  onChange={(e) => setSimSenderId(e.target.value)}
                  className="w-full bg-stone-50 text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:bg-white font-mono"
                  placeholder="e.g. fb-user-12345"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                Customer Message (Request, Items, Address, Contact)
              </label>
              <textarea
                rows={3}
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                className="w-full bg-stone-50 text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:bg-white resize-none"
                placeholder="Type customer request e.g. Order 2 Spanish Latte with oat milk, deliver to BGC, phone 09171234567, COD"
              />
            </div>

            <button
              type="button"
              onClick={handleSimulateIncomingMessage}
              disabled={isSimulating || !simMessage.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Meta AI Auto-Order &amp; Receipt...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>Dispatch Simulated Messenger Order</span>
                </>
              )}
            </button>

            {/* Simulation Result Alert / Receipt Preview */}
            {simulationResult && (
              <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    {simulationResult.isOrderCreated ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCheck className="w-3.5 h-3.5" />
                        Order #{simulationResult.order?.orderNumber || 'CONFIRMED'} Created!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                        <Bot className="w-3.5 h-3.5" />
                        Conversational Response Formatted
                      </span>
                    )}
                  </span>

                  {simulationResult.receiptText && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveReceiptModal({
                          orderNumber: simulationResult.order?.orderNumber,
                          receiptText: simulationResult.receiptText!
                        })
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                  )}
                </div>

                {simulationResult.receiptText && (
                  <div className="bg-stone-900 text-stone-100 p-3.5 rounded-xl text-[11px] font-mono whitespace-pre-wrap max-h-52 overflow-y-auto border border-stone-800 leading-relaxed select-all">
                    {simulationResult.receiptText}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Webhook Configuration & Verification Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-stone-900">Meta Graph API &amp; Webhook Credentials</h3>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md">
                Graph v21.0
              </span>
            </div>

            {/* Callback URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-600 flex items-center justify-between">
                <span>Webhook Callback URL</span>
                <span className="text-[10px] text-stone-400">Route: /api/meta-ai/webhook</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookCallbackUrl}
                  className="w-full bg-stone-50 text-[11px] font-mono text-stone-700 px-3 py-2 rounded-xl border border-stone-200 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  title="Copy URL"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Verify Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-600 flex items-center justify-between">
                <span>Verification Token</span>
                <span className="text-[10px] text-emerald-600 font-medium">Auto-Secured</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={verifyToken}
                  className="w-full bg-stone-50 text-[11px] font-mono text-stone-700 px-3 py-2 rounded-xl border border-stone-200 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  title="Copy Token"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Engine Selection */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <label className="text-xs font-semibold text-stone-600 block">
                Barista Intelligence Engine
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedModel('meta-llama-3-8b')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedModel === 'meta-llama-3-8b'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Meta Llama 3</span>
                  </div>
                  <span className="text-[10px] text-stone-500 block mt-0.5">Automated Ordering Agent</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedModel('gemini-3.8-flash')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedModel === 'gemini-3.8-flash'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Bot className="w-3.5 h-3.5 text-amber-600" />
                    <span>Gemini 3.8 Flash</span>
                  </div>
                  <span className="text-[10px] text-stone-500 block mt-0.5">Hybrid GenAI Parser</span>
                </button>
              </div>
            </div>

            {/* Auto-reply switch */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <div>
                <span className="text-xs font-bold text-stone-900 block">Messenger Auto-Reply &amp; Auto-Order</span>
                <span className="text-[11px] text-stone-500">Replies and prints receipts immediately when user messages page</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  autoReplyEnabled ? 'bg-blue-600 justify-end' : 'bg-stone-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-xs" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Active Messenger Sessions & Live Activity Logs (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">

          {/* Active Messenger Sessions (Ordering State Monitor) */}
          <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">Active Messenger Customer Sessions</h3>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                {sessions.length} Active {sessions.length === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                No active Messenger ordering sessions. Simulate an order on the left to start a customer session!
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {sessions.map((sess) => (
                  <div
                    key={sess.senderId}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {sess.senderName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-stone-900 block">{sess.senderName}</span>
                          <span className="text-[10px] font-mono text-stone-400">{sess.senderId}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sess.state === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sess.state === 'ready_to_confirm'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sess.state.toUpperCase().replace('_', ' ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleResetSession(sess.senderId)}
                          className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Clear Cart & Reset Session"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Cart Items in Session */}
                    {sess.cart && sess.cart.length > 0 ? (
                      <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                          Cart Items:
                        </span>
                        {sess.cart.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-700">
                              {item.quantity}x {item.productName}
                              {item.modifiersDescription && (
                                <span className="text-stone-400 text-[10px] ml-1">({item.modifiersDescription})</span>
                              )}
                            </span>
                            <span className="font-semibold text-stone-900 font-mono">
                              {formatPeso(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-stone-400 italic block">Cart is empty or order completed</span>
                    )}

                    {/* Customer Details extracted */}
                    {(sess.customerInfo.address || sess.customerInfo.phone) && (
                      <div className="flex items-center gap-3 text-[10px] text-stone-500 pt-1">
                        {sess.customerInfo.address && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]" title={sess.customerInfo.address}>
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="truncate">{sess.customerInfo.address}</span>
                          </span>
                        )}
                        {sess.customerInfo.phone && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{sess.customerInfo.phone}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Facebook Messenger Activity & Automated Receipts Feed */}
          <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-500" />
                <h3 className="text-sm font-bold text-stone-900">Facebook Messenger Activity Feed</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setLogFilter('all')}
                    className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                      logFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                    }`}
                  >
                    All Messages
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('orders')}
                    className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                      logFilter === 'orders' ? 'bg-white text-blue-700 shadow-2xs' : 'text-stone-500'
                    }`}
                  >
                    Orders Only
                  </button>
                </div>

                <button
                  type="button"
                  onClick={fetchConfigAndLogs}
                  disabled={isLoadingLogs}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                No Facebook Messenger activity yet. Use the simulator to send test client orders!
              </div>
            ) : (
              <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto pr-1">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span>{log.senderName || log.senderId}</span>
                        {log.orderCreated && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            #{log.orderNumber || 'ORDER'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-stone-700 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-100 font-medium">
                      &ldquo;{log.messageText}&rdquo;
                    </p>

                    <div className="text-[11px] text-blue-700 font-medium pl-2.5 border-l-2 border-blue-400 space-y-1">
                      <div>
                        <span className="font-bold text-blue-900">Meta AI Barista:</span> {log.replyText}
                      </div>

                      {log.receiptText && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReceiptModal({
                                orderNumber: log.orderNumber,
                                receiptText: log.receiptText!
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[10px] font-semibold cursor-pointer shadow-2xs"
                          >
                            <Receipt className="w-3 h-3 text-amber-400" />
                            <span>View Official Automated Receipt</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Automated Receipt Inspector Modal */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-stone-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Official Facebook Messenger Receipt
                  </h3>
                  <p className="text-xs text-stone-400">
                    {activeReceiptModal.orderNumber ? `Order #${activeReceiptModal.orderNumber}` : 'Automated Generation'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-900 text-stone-100 p-4 rounded-2xl text-[11px] font-mono whitespace-pre-wrap max-h-[60vh] overflow-y-auto border border-stone-800 leading-relaxed select-all">
              {activeReceiptModal.receiptText}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="text-[11px] text-stone-500">
                Dispatched automatically to customer on Messenger
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyReceiptText(activeReceiptModal.receiptText)}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReceipt ? 'Copied Receipt' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
