import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  MessageCircle,
  ExternalLink,
  X,
  Send,
  Plus,
  Check,
  Bot,
  Coffee,
  Flame,
  ArrowRight,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { formatPeso } from '../utils/format';

interface AiOrderingAssistantProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number, notes?: string) => void;
  storeSettings?: StoreSettings;
  onOpenCart?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  recommendedProducts?: Product[];
  source?: string;
}

const FB_PAGE_URL = 'https://www.facebook.com/profile.php?id=61592982062259';
const FB_MESSENGER_URL = 'https://m.me/61592982062259';
const FB_PAGE_ID = '61592982062259';

export const AiOrderingAssistant: React.FC<AiOrderingAssistantProps> = ({
  products,
  onAddToCart,
  storeSettings,
  onOpenCart
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Hello! 👋 I'm your **Meta AI Barista** for **${storeSettings?.storeName || 'Matcha Avenue Cafe'}**.\n\nI'm integrated with our official **Facebook Page** and smart menu knowledge base. Ask me for recommendations, custom dietary options (Oat milk, sugar-free), or click below to order or chat on Facebook Messenger!`,
      timestamp: 'Just now',
      recommendedProducts: products.filter((p) => p.isPopular || p.isFeatured).slice(0, 3),
      source: 'meta-ai'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Call Meta AI API backend
    try {
      // Pass recent conversation history context
      const historyContext = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('/api/meta-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyContext
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: json.data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            recommendedProducts: json.data.recommendedProducts || [],
            source: json.data.source || 'meta-ai'
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
          return;
        }
      }
      throw new Error('Fallback to heuristic barista');
    } catch (err) {
      // Heuristic Barista Fallback
      setTimeout(() => {
        const lower = query.toLowerCase();
        let matchedProducts: Product[] = [];
        let responseText = '';

        if (lower.includes('iced') || lower.includes('cold') || lower.includes('refreshing')) {
          matchedProducts = products.filter(
            (p) =>
              p.category.toLowerCase().includes('cold') ||
              p.name.toLowerCase().includes('iced') ||
              p.name.toLowerCase().includes('cold brew') ||
              p.name.toLowerCase().includes('frappe')
          );
          responseText = `Here are our most refreshing iced handcrafted brews and cold specialties! ❄️ Upgrade to Barista Oat Milk for a rich, silky texture.`;
        } else if (lower.includes('pastry') || lower.includes('croissant') || lower.includes('bread') || lower.includes('bakery') || lower.includes('food')) {
          matchedProducts = products.filter((p) => p.category.toLowerCase().includes('pastr') || p.category.toLowerCase().includes('panini'));
          responseText = `Freshly baked and toasted warm from our bakery station! 🥐 Toasted to golden perfection:`;
        } else if (lower.includes('vegan') || lower.includes('oat') || lower.includes('dairy') || lower.includes('healthy')) {
          matchedProducts = products.filter(
            (p) =>
              p.name.toLowerCase().includes('matcha') ||
              p.name.toLowerCase().includes('cold brew') ||
              p.description.toLowerCase().includes('oat')
          );
          responseText = `Great choice! These artisan picks can all be crafted with creamy Oat or Almond milk and plant-based ingredients: 🌱`;
        } else if (lower.includes('sale') || lower.includes('discount') || lower.includes('promo') || lower.includes('deal') || lower.includes('cheap')) {
          matchedProducts = products.filter((p) => p.isOnSale);
          responseText = `🔥 Here are our active **On-Sale Specials**! Save today with direct ordering:`;
        } else if (lower.includes('sweet') || lower.includes('dessert') || lower.includes('caramel') || lower.includes('chocolate')) {
          matchedProducts = products.filter(
            (p) =>
              p.category.toLowerCase().includes('dessert') ||
              p.name.toLowerCase().includes('spanish') ||
              p.name.toLowerCase().includes('vanilla') ||
              p.description.toLowerCase().includes('sweet')
          );
          responseText = `Satisfy your sweet tooth with our signature handcrafted sweet treats & rich coffees: 🍫✨`;
        } else if (lower.includes('facebook') || lower.includes('page') || lower.includes('messenger')) {
          matchedProducts = products.filter((p) => p.isPopular).slice(0, 2);
          responseText = `You can connect with us directly on our official Facebook Page (ID: ${FB_PAGE_ID}) at ${FB_PAGE_URL} or message our Meta AI Barista directly at ${FB_MESSENGER_URL}! ☕💙`;
        } else {
          matchedProducts = products.filter(
            (p) =>
              p.name.toLowerCase().includes(lower) ||
              p.category.toLowerCase().includes(lower) ||
              p.description.toLowerCase().includes(lower)
          );

          if (matchedProducts.length > 0) {
            responseText = `I found ${matchedProducts.length} delicious item(s) matching "${query}":`;
          } else {
            matchedProducts = products.filter((p) => p.isPopular || p.isFeatured).slice(0, 3);
            responseText = `I couldn't find an exact match for that, but here are our top-rated customer favorites you might love! ☕✨`;
          }
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recommendedProducts: matchedProducts.slice(0, 4),
          source: 'meta-ai-fallback'
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      }, 500);
    }
  };

  const handleQuickAdd = (product: Product) => {
    onAddToCart(product, 1);
    setAddedItemIds((prev) => [...prev, product.id]);
    setTimeout(() => {
      setAddedItemIds((prev) => prev.filter((id) => id !== product.id));
    }, 1500);
  };

  const suggestedPrompts = [
    '✨ Best Sellers',
    '❄️ Iced Drinks',
    '🥐 Fresh Pastries',
    '🔥 Flash Deals',
    '🌱 Dairy-Free',
    '💬 Facebook Page'
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 p-3 sm:px-4 sm:py-2.5 rounded-full shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
          title="Open Meta AI Barista"
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-amber-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white absolute -top-0.5 -right-0.5 animate-pulse" />
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-xs font-bold text-stone-800">
              Meta AI Barista
            </span>
            <span className="text-[9px] text-blue-600 font-medium">
              FB Page 61592982062259
            </span>
          </div>
          <span className="bg-blue-100 text-blue-800 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">
            24/7
          </span>
        </button>
      )}

      {/* Floating Chat Drawer / Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:right-6 z-50 w-[94vw] sm:w-[400px] h-[580px] max-h-[88vh] bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 text-stone-900">
          
          {/* Top Bar with Meta AI Branding & Facebook Link */}
          <div className="p-3.5 bg-white border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-stone-900">
                    Meta AI Barista
                  </h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-1 rounded border border-blue-200">
                    Meta AI
                  </span>
                </div>
                <a
                  href={FB_PAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <span>Facebook Page #{FB_PAGE_ID}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMessages([
                    {
                      id: 'msg-welcome-reset',
                      sender: 'ai',
                      text: `Conversation refreshed! How can I brew your day today? ☕ Ask about our drinks, bakery, or tap Messenger to chat on Facebook!`,
                      timestamp: 'Just now',
                      recommendedProducts: products.filter((p) => p.isPopular).slice(0, 2),
                      source: 'meta-ai'
                    }
                  ]);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                title="Reset Chat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Facebook Messenger & Page Direct Action Ribbon */}
          <div className="px-3 py-1.5 bg-blue-50/90 border-b border-blue-100 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-blue-900 font-medium truncate">
              <MessageCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Official Facebook Page Assistant</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={FB_MESSENGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-[10px] text-white bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded-md transition-colors shadow-2xs"
                title="Chat with Meta AI on Facebook Messenger"
              >
                <span>Messenger</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href={FB_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded-md transition-colors"
                title="View Facebook Page"
              >
                <span>Page</span>
              </a>
            </div>
          </div>

          {/* Quick Filter Pill Presets */}
          <div className="px-3 py-2 bg-stone-50 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt.replace(/^[^\w\s]+/, '').trim())}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 hover:text-amber-900 text-stone-700 border border-stone-200 whitespace-nowrap transition-all cursor-pointer shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-stone-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-amber-600 text-white font-medium rounded-tr-none shadow-xs'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Recommended Product Cards inside AI response */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="w-full mt-2 space-y-1.5">
                    {msg.recommendedProducts.map((product) => {
                      const isAdded = addedItemIds.includes(product.id);
                      return (
                        <div
                          key={product.id}
                          className="bg-white border border-stone-200 hover:border-amber-400 rounded-xl p-2 flex items-center gap-2.5 transition-all shadow-xs"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-amber-50/60 border border-stone-200 flex items-center justify-center">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Coffee className="w-5 h-5 text-amber-700/70 stroke-[1.5]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <h4 className="text-xs font-bold text-stone-900 truncate">
                                {product.name}
                              </h4>
                              {product.isOnSale && (
                                <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1 rounded">
                                  SALE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-bold text-amber-800 font-mono">
                                {formatPeso(product.salePrice || product.price)}
                              </span>
                              {product.salePrice && (
                                <span className="text-[10px] text-stone-400 line-through font-mono">
                                  {formatPeso(product.price)}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleQuickAdd(product)}
                            className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                              isAdded
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }`}
                            title="Add to Basket"
                          >
                            {isAdded ? <Check className="w-3 h-3 stroke-[2.6]" /> : <Plus className="w-3 h-3 stroke-[2.6]" />}
                            <span className="text-[10px]">{isAdded ? 'Added' : 'Add'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[9px] text-stone-400 font-mono">
                    {msg.timestamp}
                  </span>
                  {msg.sender === 'ai' && (
                    <span className="text-[8px] font-mono text-stone-400">
                      • Meta AI
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2.5 bg-white rounded-xl rounded-tl-none w-16 border border-stone-200 shadow-xs">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-2.5 bg-white border-t border-stone-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask Meta AI Barista or order..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-600"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="p-2 bg-gradient-to-r from-blue-600 to-amber-600 hover:opacity-95 disabled:opacity-40 text-white font-bold rounded-lg transition-all cursor-pointer shadow-xs disabled:cursor-not-allowed"
                title="Send query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
