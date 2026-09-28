import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  RotateCcw,
  Coffee,
  Megaphone,
  Palette,
  Truck,
  CreditCard,
  Layers,
  MapPin,
  Clock,
  Phone,
  Mail,
  Check,
  Tag,
  Eye,
  Plus,
  Trash2,
  Percent,
  Star,
  ExternalLink,
  Flame
} from 'lucide-react';
import { StoreSettings } from '../types';
import { formatPeso } from '../utils/format';

interface StoreCustomizerPanelProps {
  settings: StoreSettings;
  onSaveSettings: (updated: StoreSettings) => Promise<void> | void;
  onResetSettings: () => Promise<void> | void;
  onCategoriesUpdate?: (categories: string[]) => void;
}

export const StoreCustomizerPanel: React.FC<StoreCustomizerPanelProps> = ({
  settings,
  onSaveSettings,
  onResetSettings,
  onCategoriesUpdate
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [subTab, setSubTab] = useState<'branding' | 'announcements' | 'delivery_payment' | 'categories'>('branding');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all storefront text, banners, announcement, and pricing to default settings?')) {
      setIsSaving(true);
      try {
        await onResetSettings();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (formData.customCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('This category already exists!');
      return;
    }
    const updated = [...formData.customCategories, trimmed];
    setFormData({ ...formData, customCategories: updated });
    setNewCategoryInput('');
    if (onCategoriesUpdate) onCategoriesUpdate(updated);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (catToDelete === 'All') return;
    if (window.confirm(`Remove "${catToDelete}" from category list?`)) {
      const updated = formData.customCategories.filter((c) => c !== catToDelete);
      setFormData({ ...formData, customCategories: updated });
      if (onCategoriesUpdate) onCategoriesUpdate(updated);
    }
  };

  return (
    <div className="space-y-6 text-stone-900">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <span>Customer Interface &amp; Storefront Customizer</span>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                Live Sync
              </span>
            </h2>
            <p className="text-xs text-stone-500">
              Changes published here update the customer view, banners, and checkout instantly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
            title="Reset Storefront to Factory Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-70"
          >
            {isSaving ? (
              <span>Saving Changes...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved Live!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Publish to Customer View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-semibold shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Storefront changes published successfully! Customers will see the new content immediately.</span>
        </div>
      )}

      {/* Live Preview Box */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-700" /> Live Customer UI Preview:
          </span>
          <span className="text-[10px] text-stone-400">Simulation</span>
        </div>

        {/* Preview: Announcement Bar */}
        {formData.announcementActive && (
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {formData.announcementBadge || 'PROMO'}
              </span>
              <span className="text-stone-800 text-[11px] truncate font-medium">{formData.announcementText}</span>
            </div>
            {formData.announcementLinkText && (
              <span className="text-amber-800 text-[11px] font-semibold underline shrink-0 cursor-pointer">
                {formData.announcementLinkText} →
              </span>
            )}
          </div>
        )}

        {/* Preview: Hero Banner */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 relative overflow-hidden shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-[10px] font-semibold mb-2">
            <Coffee className="w-3 h-3 text-amber-700" />
            <span>{formData.heroBadgeText || `${formData.storeName} • ${formData.tagline}`}</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
            {formData.heroHeadline}{' '}
            <span className="text-amber-800">
              {formData.heroHeadlineHighlight}
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-1 line-clamp-2 max-w-xl">{formData.heroSubtitle}</p>

          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-stone-100 text-[11px]">
            <span className="text-stone-600">
              ⚡ <strong className="text-stone-900">{formData.heroAvgMinsText}</strong> Avg Mins
            </span>
            <span className="text-stone-600">
              ⭐ <strong className="text-stone-900">{formData.heroRatingText}</strong> Rating
            </span>
            <span className="text-stone-600">
              🌱 <strong className="text-stone-900">{formData.heroQualityText}</strong> Quality
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('branding')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            subTab === 'branding'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hero &amp; Branding</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('announcements')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            subTab === 'announcements'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Announcement &amp; Promos</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('delivery_payment')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            subTab === 'delivery_payment'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Delivery &amp; Payment Config</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('categories')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            subTab === 'categories'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Menu Categories ({formData.customCategories.length})</span>
        </button>
      </div>

      {/* TAB 1: HERO & BRANDING */}
      {subTab === 'branding' && (
        <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
          
          {/* Store Imagery */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" /> Store Imagery Sources
              </span>
              <span className="text-[10px] text-stone-400 font-mono">Image URLs</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-stone-700">
                  Store Logo Image Source (src):
                </label>
                <div className="flex gap-2.5 items-center">
                  <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Coffee className="w-6 h-6 text-amber-700" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.logoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://... or /logo.png"
                    className="flex-1 bg-white text-stone-900 px-3 py-2 rounded-lg border border-stone-200 text-xs font-mono focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-stone-700">
                  Hero Banner Background (src):
                </label>
                <div className="flex gap-2.5 items-center">
                  <div className="w-16 h-12 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0">
                    <img
                      src={formData.heroImage || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80'}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.heroImage || ''}
                    onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 bg-white text-stone-900 px-3 py-2 rounded-lg border border-stone-200 text-xs font-mono focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Store / Brand Name</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="e.g. Avenue Café"
                className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Artisan Coffee & Fresh Bakery"
                className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Hero Main Headline</label>
              <input
                type="text"
                value={formData.heroHeadline}
                onChange={(e) => setFormData({ ...formData, heroHeadline: e.target.value })}
                placeholder="e.g. Crafted Coffee & Fresh Pastries"
                className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Headline Highlight</label>
              <input
                type="text"
                value={formData.heroHeadlineHighlight}
                onChange={(e) => setFormData({ ...formData, heroHeadlineHighlight: e.target.value })}
                placeholder="e.g. Delivered Fresh to Your Door"
                className="w-full bg-stone-50 text-xs text-amber-800 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Hero Badge / Sub-Header</label>
            <input
              type="text"
              value={formData.heroBadgeText}
              onChange={(e) => setFormData({ ...formData, heroBadgeText: e.target.value })}
              placeholder="e.g. Avenue Café Flagship • BGC High Street, Taguig City"
              className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Hero Subtitle / Description Text</label>
            <textarea
              rows={3}
              value={formData.heroSubtitle}
              onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
              placeholder="Write a welcoming description of your café..."
              className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Average Delivery Time</label>
              <input
                type="text"
                value={formData.heroAvgMinsText}
                onChange={(e) => setFormData({ ...formData, heroAvgMinsText: e.target.value })}
                placeholder="e.g. 10-15"
                className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Store Rating Badge</label>
              <input
                type="text"
                value={formData.heroRatingText}
                onChange={(e) => setFormData({ ...formData, heroRatingText: e.target.value })}
                placeholder="e.g. 4.9 ★"
                className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Quality Badge Text</label>
              <input
                type="text"
                value={formData.heroQualityText}
                onChange={(e) => setFormData({ ...formData, heroQualityText: e.target.value })}
                placeholder="e.g. 100% Fresh"
                className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white font-semibold"
              />
            </div>
          </div>

          {/* Operating Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-stone-100">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-700" /> Operating Hours
              </label>
              <input
                type="text"
                value={formData.operatingHours}
                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                placeholder="7:00 AM – 10:00 PM Daily"
                className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-700" /> Physical Store Address
              </label>
              <input
                type="text"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                placeholder="BGC High Street, Taguig City"
                className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-700" /> Store Hotline
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+63 917 888 2233"
                className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-amber-700" /> Support Email
              </label>
              <input
                type="text"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@avenuecafe.com"
                className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Section Visibility */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showFeatured"
                checked={formData.showFeaturedSection}
                onChange={(e) => setFormData({ ...formData, showFeaturedSection: e.target.checked })}
                className="accent-amber-600 w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="showFeatured" className="cursor-pointer">
                <span className="text-xs font-bold text-stone-900 block">Show "Featured &amp; Chef's Picks" Showcase</span>
                <span className="text-[11px] text-stone-500 block">Displays highlighted products on customer homepage</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showSale"
                checked={formData.showSaleSection}
                onChange={(e) => setFormData({ ...formData, showSaleSection: e.target.checked })}
                className="accent-red-600 w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="showSale" className="cursor-pointer">
                <span className="text-xs font-bold text-stone-900 block">Show "On-Sale Specials" Showcase</span>
                <span className="text-[11px] text-stone-500 block">Displays discounted products with savings badges</span>
              </label>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: ANNOUNCEMENTS & PROMOS */}
      {subTab === 'announcements' && (
        <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-5 shadow-xs">
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="announceToggle"
                checked={formData.announcementActive}
                onChange={(e) => setFormData({ ...formData, announcementActive: e.target.checked })}
                className="accent-amber-600 w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="announceToggle" className="cursor-pointer">
                <span className="text-sm font-bold text-stone-900 block">Enable Top Announcement Bar</span>
                <span className="text-xs text-stone-500">Display promo announcements across the top of all customer screens</span>
              </label>
            </div>

            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                formData.announcementActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {formData.announcementActive ? 'ACTIVE LIVE' : 'DISABLED'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Promo Badge Text</label>
              <input
                type="text"
                value={formData.announcementBadge}
                onChange={(e) => setFormData({ ...formData, announcementBadge: e.target.value })}
                placeholder="e.g. FLASH SALE, WEEKEND PROMO"
                className="w-full bg-stone-50 text-xs text-amber-800 font-bold px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Announcement Message</label>
              <input
                type="text"
                value={formData.announcementText}
                onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                placeholder="e.g. 🔥 Midweek Special: Enjoy 20% OFF all Cold Brews & Frappes! Free delivery for orders ₱800+"
                className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Action Button / Link Text (Optional)</label>
            <input
              type="text"
              value={formData.announcementLinkText || ''}
              onChange={(e) => setFormData({ ...formData, announcementLinkText: e.target.value })}
              placeholder="e.g. Order Now, Claim Discount"
              className="w-full bg-stone-50 text-xs text-stone-900 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
            />
          </div>
        </form>
      )}

      {/* TAB 3: DELIVERY & PAYMENT CONFIG */}
      {subTab === 'delivery_payment' && (
        <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-6 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-700" /> Delivery Fee Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Standard Delivery Fee (₱)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400 font-semibold">₱</span>
                  <input
                    type="number"
                    step="5"
                    value={formData.standardDeliveryFee}
                    onChange={(e) => setFormData({ ...formData, standardDeliveryFee: Number(e.target.value) })}
                    className="w-full bg-stone-50 text-xs text-stone-900 pl-8 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Free Delivery Minimum Order (₱)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400 font-semibold">₱</span>
                  <input
                    type="number"
                    step="50"
                    value={formData.freeDeliveryThreshold}
                    onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: Number(e.target.value) })}
                    className="w-full bg-stone-50 text-xs text-emerald-700 pl-8 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white font-mono font-semibold"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">Orders at or above this amount automatically get free delivery.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-700" /> Merchant E-Wallet Information (GCash &amp; Maya)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* GCash */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <span className="text-xs font-bold text-sky-800 block uppercase font-mono">GCash Merchant Account</span>
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1 font-medium">GCash Registered Name</label>
                  <input
                    type="text"
                    value={formData.merchantGcashName}
                    onChange={(e) => setFormData({ ...formData, merchantGcashName: e.target.value })}
                    placeholder="AVENUE CAFE BGC"
                    className="w-full bg-white text-xs text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-sky-600 uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1 font-medium">GCash Mobile Number</label>
                  <input
                    type="text"
                    value={formData.merchantGcashNumber}
                    onChange={(e) => setFormData({ ...formData, merchantGcashNumber: e.target.value })}
                    placeholder="09178882233"
                    className="w-full bg-white text-xs text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-sky-600 font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Maya */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <span className="text-xs font-bold text-emerald-800 block uppercase font-mono">Maya Merchant Account</span>
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1 font-medium">Maya Registered Name</label>
                  <input
                    type="text"
                    value={formData.merchantMayaName}
                    onChange={(e) => setFormData({ ...formData, merchantMayaName: e.target.value })}
                    placeholder="AVENUE CAFE ENTERPRISES"
                    className="w-full bg-white text-xs text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-600 uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1 font-medium">Maya Mobile Number</label>
                  <input
                    type="text"
                    value={formData.merchantMayaNumber}
                    onChange={(e) => setFormData({ ...formData, merchantMayaNumber: e.target.value })}
                    placeholder="09178882233"
                    className="w-full bg-white text-xs text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-600 font-mono font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: CATEGORIES MANAGER */}
      {subTab === 'categories' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-5 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-1">Manage Food &amp; Beverage Categories</h3>
            <p className="text-xs text-stone-500">
              Add new categories or delete unused ones. These update customer category navigation pills immediately.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              placeholder="Enter new category name (e.g. Seasonal Specials, Gelato, Matcha)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
              className="flex-1 bg-stone-50 text-xs text-stone-900 px-3.5 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-3 border-t border-stone-100">
            {formData.customCategories.map((category) => (
              <div
                key={category}
                className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-xs font-semibold text-stone-800">{category}</span>
                </div>

                {category !== 'All' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category)}
                    className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
