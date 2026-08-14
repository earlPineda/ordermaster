import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Truck, Store, Receipt } from 'lucide-react';
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

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const freeDeliveryThreshold = 1000;
  const deliveryFee = deliveryType === 'delivery' ? (subtotal >= freeDeliveryThreshold ? 0 : 50) : 0;
  const total = subtotal + tax + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Your Food Order</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {cartItems.length} items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Delivery / Pickup Toggle */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setDeliveryType('delivery')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  deliveryType === 'delivery'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" /> Door Delivery
              </button>
              <button
                onClick={() => setDeliveryType('pickup')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  deliveryType === 'pickup'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" /> Store Pickup
              </button>
            </div>
            {deliveryType === 'delivery' && (
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                {subtotal >= freeDeliveryThreshold ? (
                  <span className="text-emerald-400 font-bold">🎉 Free Delivery Unlocked!</span>
                ) : (
                  <span>Add {formatPeso(freeDeliveryThreshold - subtotal)} more for FREE Delivery</span>
                )}
              </p>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <ShoppingBag className="w-16 h-16 text-slate-700 mb-4 stroke-1" />
                <p className="text-base font-bold text-slate-300">Your cart is empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Browse our menu and pick artisan coffee, pastries, or gourmet paninis to get started.
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex gap-3 relative group"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-bold text-white truncate">{item.product.name}</h3>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-amber-400 italic truncate mt-0.5">Note: "{item.notes}"</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900">
                      <span className="text-xs font-bold text-amber-400">
                        {formatPeso(item.product.price * item.quantity)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Price Breakdown */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-200">{formatPeso(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated VAT (8%)</span>
                  <span className="text-slate-200">{formatPeso(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                    {deliveryFee === 0 ? 'FREE' : formatPeso(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1">
                    <Receipt className="w-4 h-4 text-amber-400" /> Total Amount
                  </span>
                  <span className="text-amber-400 text-base">{formatPeso(total)}</span>
                </div>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 hover:brightness-110 flex items-center justify-center gap-2 mt-2"
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
