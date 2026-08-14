import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, ChefHat, Bike, Search, PackageCheck, AlertCircle, Wallet, Smartphone } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatPeso } from '../utils/format';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOrder: Order | null;
  onCancelOrder?: (orderId: string) => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  activeOrder: initialOrder,
  onCancelOrder
}) => {
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(initialOrder);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialOrder) {
      setCurrentOrder(initialOrder);
      setSearchOrderNumber(initialOrder.orderNumber);
    }
  }, [initialOrder]);

  // Poll order status live from Express API
  useEffect(() => {
    if (!isOpen || !currentOrder) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${currentOrder.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setCurrentOrder(data.data);
          }
        }
      } catch (e) {
        console.warn('Status poll error', e);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [isOpen, currentOrder?.id]);

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchOrderNumber.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/orders/${searchOrderNumber.trim().toUpperCase()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentOrder(data.data);
      } else {
        setErrorMessage(`No active order found with ID or Number "${searchOrderNumber}".`);
        setCurrentOrder(null);
      }
    } catch {
      setErrorMessage('Failed to connect to API server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'delivered': return 4;
      case 'cancelled': return 0;
      default: return 1;
    }
  };

  const currentStep = currentOrder ? getStatusStep(currentOrder.status) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Live Order Tracker</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Order Search Form */}
          <form onSubmit={handleSearchOrder} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Enter Order # (e.g. ORD-1001 or ORD-1002)"
                value={searchOrderNumber}
                onChange={(e) => setSearchOrderNumber(e.target.value)}
                className="w-full bg-slate-950 text-xs text-slate-200 placeholder-slate-500 pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
            >
              {isLoading ? 'Finding...' : 'Track'}
            </button>
          </form>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              {errorMessage}
            </div>
          )}

          {currentOrder ? (
            <div className="space-y-6">
              
              {/* Order Info Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded">
                      {currentOrder.deliveryType === 'delivery' ? '🚗 Door Delivery' : '🏪 Store Pickup'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {currentOrder.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">{currentOrder.orderNumber}</h3>
                  <p className="text-xs text-slate-400">Customer: {currentOrder.customer.name}</p>

                  {(currentOrder.customer.referenceNumber) && (
                    <p className="text-[11px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Ref #: {currentOrder.customer.referenceNumber}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Paid</span>
                  <span className="text-lg font-black text-amber-400">{formatPeso(currentOrder.total)}</span>
                </div>
              </div>

              {/* Status Timeline */}
              {currentOrder.status === 'cancelled' ? (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
                  <span className="text-sm font-bold text-red-400 block">Order Cancelled</span>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentOrder.cancelledBy === 'customer'
                      ? 'You cancelled this order.'
                      : 'This order was cancelled by the store.'}
                  </p>
                </div>
              ) : (
                <div className="relative pt-4 pb-2">
                  <div className="grid grid-cols-4 gap-2 text-center relative z-10">
                    
                    {/* Step 1: Pending */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                        currentStep >= 1 ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">Received</span>
                      <span className="text-[9px] text-slate-500">Order Placed</span>
                    </div>

                    {/* Step 2: Preparing */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                        currentStep >= 2 ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 animate-pulse' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <ChefHat className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">Kitchen</span>
                      <span className="text-[9px] text-slate-500">Preparing Order</span>
                    </div>

                    {/* Step 3: Ready */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                        currentStep >= 3 ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <Bike className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">On The Way</span>
                      <span className="text-[9px] text-slate-500">Out for Delivery</span>
                    </div>

                    {/* Step 4: Delivered */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                        currentStep >= 4 ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <PackageCheck className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">Delivered</span>
                      <span className="text-[9px] text-slate-500">Enjoy Your Meal</span>
                    </div>

                  </div>
                </div>
              )}

              {/* Items summary */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 block">Ordered Items</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-300 bg-slate-950 p-2 rounded-xl">
                      <span>{item.quantity}x {item.productName}</span>
                      <span className="font-bold text-amber-400">{formatPeso(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Cancel Button */}
              {currentOrder.status !== 'cancelled' && currentOrder.status !== 'delivered' && onCancelOrder && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this order?')) {
                      onCancelOrder(currentOrder.id);
                    }
                  }}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Cancel Order
                </button>
              )}

            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              Search an Order Number above or submit a new order to trace real-time updates!
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
