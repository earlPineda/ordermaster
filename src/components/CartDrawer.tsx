import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Truck, Store, UtensilsCrossed, Receipt, Sparkles, CheckCircle2, Coffee } from 'lucide-react';
import { CartItem, DeliveryType } from '../types';
import { formatPeso } from '../utils/format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  deliveryType: DeliveryType;
  setDeliveryType: (type: DeliveryType) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  deliveryType,
  setDeliveryType,
  onProceedToCheckout
}) => {
  if (!isOpen) return null;

  const getItemUnitPrice = (item: CartItem) => {
    if (item.unitFinalPrice) return item.unitFinalPrice;
    return item.product.isOnSale && item.product.salePrice ? item.product.salePrice : item.product.price;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0);
  const tax = subtotal * 0.08;
  const freeDeliveryThreshold = 800;
  const deliveryFee = deliveryType === 'delivery' ? (subtotal >= freeDeliveryThreshold ? 0 : 50) : 0;
  const total = subtotal + tax + deliveryFee;

  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6">
        <div className="w-screen max-w-md bg-white border-l border-stone-200 text-stone-900 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200 text-amber-700">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-stone-900">Your Basket</h2>
                <p className="text-xs text-stone-500 font-mono">
                  {cartItems.reduce((sum, i) => sum + i.quantity, 0)} items selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Dine-In / Pickup / Delivery Selector */}
          <div className="p-4 border-b border-stone-200 bg-stone-50 space-y-3">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-200/60 rounded-xl text-center">
              <button
                type="button"
                onClick={() => setDeliveryType('dine_in')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  deliveryType === 'dine_in'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" /> Dine-In
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('pickup')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  deliveryType === 'pickup'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" /> Pickup
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('delivery')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  deliveryType === 'delivery'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" /> Delivery
              </button>
            </div>

            {/* Free Delivery Meter for Delivery Orders */}
            {deliveryType === 'delivery' && (
              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-stone-600 font-medium">Free Delivery Goal</span>
                  <span className="font-mono text-amber-700 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5 flex items-center gap-1">
                  {subtotal >= freeDeliveryThreshold ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Free Door Delivery Applied!
                    </span>
                  ) : (
                    <span>Add <strong className="text-stone-800 font-mono">{formatPeso(freeDeliveryThreshold - subtotal)}</strong> more for Free Delivery</span>
                  )}
                </p>
              </div>
            )}

            {deliveryType === 'dine_in' && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>🍽️ Table ordering mode active</span>
                <span className="text-[10px] font-mono bg-amber-100 px-2 py-0.5 rounded font-bold">Contactless</span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center border border-stone-200 text-stone-400">
                  <ShoppingBag className="w-6 h-6 stroke-1" />
                </div>
                <p className="font-display text-base font-bold text-stone-800">Your basket is empty</p>
                <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                  Discover our freshly brewed espresso, iced drinks, and pastries.
                </p>
              </div>
            ) : (
              cartItems.map((item, idx) => {
                const unitPrice = getItemUnitPrice(item);
                return (
                  <div
                    key={`${item.product.id}-${idx}`}
                    className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex gap-3 relative group hover:border-amber-300 transition-all shadow-xs"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-amber-50/60 border border-stone-200 flex items-center justify-center">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Coffee className="w-6 h-6 text-amber-700/70 stroke-[1.5]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-xs sm:text-sm font-bold text-stone-900 truncate">{item.product.name}</h3>
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-stone-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-amber-800 italic truncate mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200">
                        <span className="text-xs font-bold text-stone-900 font-mono">
                          {formatPeso(unitPrice * item.quantity)}
                        </span>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg p-0.5 shadow-xs">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-stone-800 px-1 font-mono">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Checkout Breakdown Footer */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-3.5">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-stone-800 font-mono font-medium">{formatPeso(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="text-stone-800 font-mono font-medium">{formatPeso(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery / Table Fee</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-700 font-semibold' : 'text-stone-800 font-mono'}>
                    {deliveryFee === 0 ? 'FREE' : formatPeso(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span className="flex items-center gap-1.5 font-display">
                    <Receipt className="w-4 h-4 text-amber-600" /> Total
                  </span>
                  <span className="text-amber-800 text-base font-mono font-bold">{formatPeso(total)}</span>
                </div>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

