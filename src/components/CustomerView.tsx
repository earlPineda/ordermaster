import React, { useState } from 'react';
import { Search, Flame, Clock, Plus, Minus, Check, Star, Info, Coffee } from 'lucide-react';
import { Category, Product, CartItem } from '../types';
import { formatPeso } from '../utils/format';

interface CustomerViewProps {
  products: Product[];
  categories: Category[];
  selectedCategory: Category;
  setSelectedCategory: (cat: Category) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onAddToCart: (product: Product, quantity: number, notes?: string) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  products,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onAddToCart
}) => {
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [modalNotes, setModalNotes] = useState<string>('');
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularProducts = products.filter((p) => p.isPopular);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setAddedAnimationId(product.id);
    setTimeout(() => setAddedAnimationId(null), 1000);
  };

  const handleModalAdd = () => {
    if (!selectedProductModal) return;
    onAddToCart(selectedProductModal, modalQuantity, modalNotes);
    setSelectedProductModal(null);
    setModalQuantity(1);
    setModalNotes('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border-b border-slate-800 py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>Avenue Café • Handcrafted Coffee & Fresh Artisan Bakery</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              Crafted Coffee & Fresh Pastries <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Delivered Fresh to Your Door
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Savor freshly brewed specialty lattes, 18-hour cold brew, flaky French pastries, and toasted gourmet paninis. Live order tracking included!
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-3 gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-sm w-full md:w-auto">
            <div className="text-center px-2">
              <span className="block text-xl sm:text-2xl font-black text-amber-400">10-15</span>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Avg Mins</span>
            </div>
            <div className="text-center px-2 border-x border-slate-800">
              <span className="block text-xl sm:text-2xl font-black text-emerald-400">4.9 ★</span>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Rating</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-xl sm:text-2xl font-black text-indigo-400">100%</span>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Fresh</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Mobile Search Input */}
        <div className="md:hidden mb-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search lattes, matcha, croissants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-sm text-slate-200 placeholder-slate-400 pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Popular Spotlight Bar */}
        {popularProducts.length > 0 && !searchQuery && selectedCategory === 'All' && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500 animate-bounce" />
              <h2 className="text-lg font-bold text-white tracking-wide">Avenue Café Bestsellers</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularProducts.map((product) => (
                <div
                  key={`popular-${product.id}`}
                  onClick={() => {
                    setSelectedProductModal(product);
                    setModalQuantity(1);
                  }}
                  className="group bg-gradient-to-b from-slate-900 to-slate-900/90 rounded-2xl border border-slate-800 hover:border-amber-500/50 p-3 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 cursor-pointer flex gap-3 items-center"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-20 rounded-xl object-cover group-hover:scale-105 transition-transform duration-300 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md mb-1">
                      BESTSELLER
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-amber-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{formatPeso(product.price)}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {product.preparationTimeMinutes} min
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8 border-b border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold scale-105'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{cat}</span>
              {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{selectedCategory} Menu</span>
              <span className="text-xs font-normal text-slate-400">({filteredProducts.length} items)</span>
            </h2>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
            <Coffee className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No items match your filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try searching for a different cafe item or category.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl border border-slate-700"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProductModal(product);
                  setModalQuantity(1);
                }}
                className="group bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col cursor-pointer relative"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                  
                  {/* Popular Tag */}
                  {product.isPopular && (
                    <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-slate-950" /> Bestseller
                    </span>
                  )}

                  {/* Price Tag */}
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700/60 font-bold text-amber-400 text-sm">
                    {formatPeso(product.price)}
                  </div>

                  {/* Prep Time */}
                  <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {product.preparationTimeMinutes} min
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {product.category}
                      </span>
                      {product.calories && (
                        <span className="text-[10px] text-slate-500">{product.calories} kcal</span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-100 text-base group-hover:text-amber-400 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Add Button */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={(e) => handleQuickAdd(e, product)}
                      disabled={!product.available}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        addedAnimationId === product.id
                          ? 'bg-emerald-500 text-slate-950'
                          : product.available
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {addedAnimationId === product.id ? (
                        <>
                          <Check className="w-4 h-4" /> Added to Order!
                        </>
                      ) : product.available ? (
                        <>
                          <Plus className="w-4 h-4" /> Add to Order
                        </>
                      ) : (
                        'Sold Out'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="relative aspect-video">
              <img
                src={selectedProductModal.image}
                alt={selectedProductModal.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-3 right-3 bg-slate-950/80 text-slate-300 hover:text-white p-2 rounded-full border border-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md uppercase">
                  {selectedProductModal.category}
                </span>
                <span className="text-lg font-black text-amber-400">
                  {formatPeso(selectedProductModal.price)}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">{selectedProductModal.name}</h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{selectedProductModal.description}</p>

              {/* Custom Instructions */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Special Barista / Kitchen Notes
                </label>
                <textarea
                  placeholder="e.g., Oat milk, extra shot, less sweet, warm pastry..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  rows={2}
                />
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-sm text-white px-2">{modalQuantity}</span>
                  <button
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleModalAdd}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <span>Add to Order</span>
                  <span>•</span>
                  <span>{formatPeso(selectedProductModal.price * modalQuantity)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

