import React, { useState } from 'react';
import {
  Tag,
  Sparkles,
  Percent,
  Flame,
  Check,
  Zap,
  ArrowRight,
  TrendingDown,
  ShoppingBag,
  Star,
  Sliders,
  DollarSign,
  Trash2,
  XCircle,
  RotateCcw,
  RefreshCw,
  Coffee
} from 'lucide-react';
import { Product } from '../types';
import { formatPeso } from '../utils/format';

interface PromotionsPanelProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onResetDiscounts?: (category?: string, productId?: string) => Promise<void> | void;
  onApplyBatchDiscount?: (category: string, discountPercent: number) => Promise<void> | void;
  categories: string[];
}

export const PromotionsPanel: React.FC<PromotionsPanelProps> = ({
  products,
  onUpdateProduct,
  onResetDiscounts,
  onApplyBatchDiscount,
  categories
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [batchDiscountPercent, setBatchDiscountPercent] = useState<number>(15);
  const [filterMode, setFilterMode] = useState<'all' | 'on_sale' | 'featured'>('all');
  const [appliedToast, setAppliedToast] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const showNotification = (msg: string) => {
    setAppliedToast(msg);
    setTimeout(() => setAppliedToast(null), 3500);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    if (filterMode === 'on_sale') return matchesCat && p.isOnSale;
    if (filterMode === 'featured') return matchesCat && p.isFeatured;
    return matchesCat;
  });

  const onSaleCount = products.filter((p) => p.isOnSale).length;
  const featuredCount = products.filter((p) => p.isFeatured).length;

  const handleToggleOnSale = async (product: Product) => {
    const nextOnSale = !product.isOnSale;
    const defaultSalePrice = nextOnSale
      ? product.salePrice || Math.round(product.price * 0.85)
      : undefined;

    if (!nextOnSale && onResetDiscounts) {
      await onResetDiscounts(undefined, product.id);
      showNotification(`Reset discount on "${product.name}". Regular price ${formatPeso(product.price)} restored.`);
      return;
    }

    onUpdateProduct({
      ...product,
      isOnSale: nextOnSale,
      salePrice: defaultSalePrice,
      badge: nextOnSale && !product.badge ? 'ON SALE' : (!nextOnSale && (product.badge === 'ON SALE' || product.badge?.includes('% OFF')) ? '' : product.badge)
    });

    showNotification(
      nextOnSale
        ? `Marked "${product.name}" as ON SALE at ${formatPeso(defaultSalePrice || product.price)}!`
        : `Removed discount from "${product.name}". Reverted to regular price ${formatPeso(product.price)}.`
    );
  };

  const handleRemoveDiscount = async (product: Product) => {
    if (onResetDiscounts) {
      await onResetDiscounts(undefined, product.id);
    } else {
      onUpdateProduct({
        ...product,
        isOnSale: false,
        salePrice: undefined,
        badge: product.badge === 'ON SALE' || product.badge?.includes('% OFF') ? '' : product.badge
      });
    }

    showNotification(`Discount removed from "${product.name}". Price reset to ${formatPeso(product.price)}.`);
  };

  const handleToggleFeatured = (product: Product) => {
    const nextFeatured = !product.isFeatured;
    onUpdateProduct({
      ...product,
      isFeatured: nextFeatured
    });
    showNotification(
      nextFeatured
        ? `Added "${product.name}" to Featured Highlights!`
        : `Removed "${product.name}" from Featured.`
    );
  };

  const handleUpdateSalePrice = (product: Product, newPrice: number) => {
    if (newPrice <= 0 || newPrice >= product.price) {
      handleRemoveDiscount(product);
      return;
    }
    onUpdateProduct({
      ...product,
      salePrice: newPrice,
      isOnSale: true
    });
  };

  const handleApplyBatchPromo = async () => {
    setIsResetting(true);
    try {
      if (onApplyBatchDiscount) {
        await onApplyBatchDiscount(selectedCategory, batchDiscountPercent);
      } else {
        const targetProducts = products.filter(
          (p) => selectedCategory === 'All' || p.category === selectedCategory
        );

        targetProducts.forEach((p) => {
          const discounted = Math.round(p.price * (1 - batchDiscountPercent / 100));
          onUpdateProduct({
            ...p,
            isOnSale: true,
            salePrice: discounted,
            badge: `${batchDiscountPercent}% OFF`
          });
        });
      }

      showNotification(
        `Applied ${batchDiscountPercent}% OFF discount to items in ${selectedCategory === 'All' ? 'all categories' : selectedCategory}!`
      );
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearAllDiscounts = async (scope: 'category' | 'storewide' = 'category') => {
    const targetCategory = scope === 'storewide' ? 'All' : selectedCategory;
    const targetProducts = products.filter(
      (p) => (targetCategory === 'All' || p.category === targetCategory) && (p.isOnSale || p.salePrice)
    );

    if (targetProducts.length === 0) {
      showNotification(`No active discounts found in "${targetCategory}".`);
      return;
    }

    setIsResetting(true);
    try {
      if (onResetDiscounts) {
        await onResetDiscounts(targetCategory);
      } else {
        targetProducts.forEach((p) => {
          onUpdateProduct({
            ...p,
            isOnSale: false,
            salePrice: undefined,
            badge: p.badge === 'ON SALE' || p.badge?.includes('% OFF') ? '' : p.badge
          });
        });
      }

      showNotification(
        scope === 'storewide'
          ? `Successfully reset all discounts across the entire café menu!`
          : `Removed discounts from all items in "${selectedCategory}". Prices reset to normal.`
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 text-stone-900">
      
      {/* Toast Notification */}
      {appliedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-semibold shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{appliedToast}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-200">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Currently On Sale</span>
            <span className="text-xl font-bold text-stone-900">{onSaleCount} Items</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Featured in Showcase</span>
            <span className="text-xl font-bold text-amber-800">{featuredCount} Items</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="p-3 bg-stone-100 text-stone-700 rounded-xl border border-stone-200">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Total Menu Items</span>
            <span className="text-xl font-bold text-stone-900">{products.length} Items</span>
          </div>
        </div>
      </div>

      {/* Batch Promo Wizard Card */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-700" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">Batch Discount &amp; Sale Wizard</h3>
              <p className="text-xs text-stone-500">Apply or remove percentage discounts across entire menu categories with one click.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <span className="text-xs text-stone-500 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs text-stone-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Menu Categories</option>
              {categories.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <span className="text-xs text-stone-500 font-medium">Discount:</span>
            {[10, 15, 20, 25, 30].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setBatchDiscountPercent(pct)}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold font-mono transition-colors cursor-pointer ${
                  batchDiscountPercent === pct
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={isResetting}
            onClick={handleApplyBatchPromo}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isResetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Apply {batchDiscountPercent}% Discount</span>
          </button>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              type="button"
              disabled={isResetting}
              onClick={() => handleClearAllDiscounts('category')}
              className="px-3.5 py-2 bg-white hover:bg-red-50 border border-stone-200 hover:border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              title={`Reset discounts in ${selectedCategory}`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset {selectedCategory === 'All' ? 'All' : selectedCategory} Discounts</span>
            </button>

            {selectedCategory !== 'All' && (
              <button
                type="button"
                disabled={isResetting}
                onClick={() => handleClearAllDiscounts('storewide')}
                className="px-3.5 py-2 bg-stone-100 hover:bg-red-100 text-stone-700 hover:text-red-700 border border-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                title="Reset all discounts across the whole menu"
              >
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                <span>Reset Storewide</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterMode === 'all'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            All Items ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('on_sale')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
              filterMode === 'on_sale'
                ? 'bg-red-600 text-white'
                : 'text-stone-600 hover:text-red-700 hover:bg-red-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> On Sale ({onSaleCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('featured')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
              filterMode === 'featured'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 hover:text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Featured ({featuredCount})
          </button>
        </div>

        <span className="text-xs text-stone-500">Showing {filteredProducts.length} items</span>
      </div>

      {/* Interactive Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const discountPct = product.salePrice && product.salePrice < product.price
            ? Math.round(((product.price - product.salePrice) / product.price) * 100)
            : 0;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all shadow-xs ${
                product.isOnSale
                  ? 'border-red-200 bg-red-50/10'
                  : product.isFeatured
                  ? 'border-amber-200'
                  : 'border-stone-200'
              }`}
            >
              <div className="flex gap-3">
                <div className="relative shrink-0 w-18 h-18 rounded-xl bg-amber-50/60 border border-stone-200 flex items-center justify-center text-amber-800/70 overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Coffee className="w-6 h-6 text-amber-700/70 stroke-[1.5]" />
                  )}
                  {product.isOnSale && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md font-mono">
                      -{discountPct}%
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-semibold text-amber-800 uppercase truncate">
                      {product.category}
                    </span>
                    {product.badge && (
                      <span className="text-[9px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-mono font-medium">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-stone-900 truncate mt-0.5">{product.name}</h4>

                  {/* Price display */}
                  <div className="flex items-baseline gap-2 mt-1">
                    {product.isOnSale && product.salePrice ? (
                      <>
                        <span className="text-sm font-bold text-red-600 font-mono">
                          {formatPeso(product.salePrice)}
                        </span>
                        <span className="text-xs text-stone-400 line-through font-mono">
                          {formatPeso(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-stone-900 font-mono">
                        {formatPeso(product.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Promo Controls */}
              <div className="space-y-2 pt-3 border-t border-stone-100 text-xs">
                
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleOnSale(product)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                        product.isOnSale
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{product.isOnSale ? 'On Sale (Active)' : 'Put On Sale'}</span>
                    </button>

                    {product.isOnSale && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDiscount(product)}
                        className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                        title="Remove discount"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(product)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                      product.isFeatured
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>{product.isFeatured ? 'Featured ⭐' : 'Feature'}</span>
                  </button>
                </div>

                {/* Direct Sale Price Editor if active */}
                {product.isOnSale && (
                  <div className="space-y-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-600 font-medium">Sale Price: ₱</span>
                      <input
                        type="number"
                        step="5"
                        value={product.salePrice || Math.round(product.price * 0.85)}
                        onChange={(e) => handleUpdateSalePrice(product, Number(e.target.value))}
                        className="w-20 bg-white text-red-700 font-bold font-mono text-xs px-2 py-0.5 rounded border border-stone-300 focus:outline-none focus:border-red-500"
                      />
                      <span className="text-[10px] text-emerald-700 font-semibold font-mono ml-auto">
                        Save {formatPeso(product.price - (product.salePrice || 0))} ({discountPct}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-stone-200 text-[10px]">
                      <span className="text-stone-500 font-medium">Quick %:</span>
                      <div className="flex items-center gap-1">
                        {[10, 15, 20, 25, 30].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              const calculated = Math.round(product.price * (1 - pct / 100));
                              onUpdateProduct({
                                ...product,
                                isOnSale: true,
                                salePrice: calculated,
                                badge: `${pct}% OFF`
                              });
                            }}
                            className={`px-1.5 py-0.5 rounded font-mono font-semibold cursor-pointer transition-colors ${
                              discountPct === pct
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
