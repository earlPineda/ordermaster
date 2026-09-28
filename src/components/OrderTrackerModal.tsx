import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Bike,
  Search,
  PackageCheck,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Store,
  RefreshCw,
  Sparkles,
  Calendar,
  AlertTriangle,
  Send,
  Star,
  Heart,
  ThumbsUp
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatPeso } from '../utils/format';
import { GoogleMapsLocationPicker } from './GoogleMapsLocationPicker';
import { soundManager } from '../utils/audio';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOrder: Order | null;
  onOrderUpdated?: (order: Order) => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  activeOrder: initialOrder,
  onOrderUpdated
}) => {
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(initialOrder);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reschedule pickup state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  const [rescheduleSuccessMsg, setRescheduleSuccessMsg] = useState('');

  // "I Already Received My Order" State
  const [isConfirmingReceived, setIsConfirmingReceived] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmittingReceived, setIsSubmittingReceived] = useState(false);
  const [receivedSuccessMsg, setReceivedSuccessMsg] = useState('');

  // Customer Cancellation State
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('Changed mind / Placed order by mistake');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

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
            if (onOrderUpdated) {
              onOrderUpdated(data.data);
            }
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
    setRescheduleSuccessMsg('');
    setReceivedSuccessMsg('');

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

  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return 0;
      default:
        return 1;
    }
  };

  // Generate available reschedule time slots
  const now = new Date();
  const formatTimeSlot = (minutesToAdd: number) => {
    const d = new Date(now.getTime() + minutesToAdd * 60000);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const availableRescheduleOptions = [
    { label: `⚡ Next Available (+15m: ${formatTimeSlot(15)})`, value: `Today at ${formatTimeSlot(15)}` },
    { label: `+30 mins (${formatTimeSlot(30)})`, value: `Today at ${formatTimeSlot(30)}` },
    { label: `+45 mins (${formatTimeSlot(45)})`, value: `Today at ${formatTimeSlot(45)}` },
    { label: `+1 Hour (${formatTimeSlot(60)})`, value: `Today at ${formatTimeSlot(60)}` },
    { label: `+2 Hours (${formatTimeSlot(120)})`, value: `Today at ${formatTimeSlot(120)}` }
  ];

  const handleConfirmReschedule = async () => {
    if (!currentOrder || !rescheduleSlot) return;

    setIsSubmittingReschedule(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/reschedule-pickup`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPickupTime: rescheduleSlot,
          reason: rescheduleReason || 'Customer requested next available pickup time slot'
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCurrentOrder(data.data);
        if (onOrderUpdated) onOrderUpdated(data.data);
        setIsRescheduling(false);
        setRescheduleSuccessMsg(`Pick-up time successfully updated to "${rescheduleSlot}"! Baristas have been notified.`);
      } else {
        setErrorMessage(data.message || 'Failed to reschedule pick-up time.');
      }
    } catch {
      setErrorMessage('Network error while rescheduling pick-up time.');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // Handle "I already received my order" confirmation
  const handleConfirmOrderReceived = async () => {
    if (!currentOrder) return;

    setIsSubmittingReceived(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/confirm-receipt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: selectedRating,
          feedback: feedbackText || 'Order received successfully! Delicious coffee & treats.'
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCurrentOrder(data.data);
        if (onOrderUpdated) onOrderUpdated(data.data);
        setIsConfirmingReceived(false);
        setReceivedSuccessMsg('🎉 Thank you! You have confirmed receipt of your order. We hope you enjoy your Matcha Avenue Cafe treats!');
        soundManager.playSuccess();
      } else {
        setErrorMessage(data.message || 'Failed to confirm order receipt.');
      }
    } catch {
      setErrorMessage('Network error while confirming order receipt.');
    } finally {
      setIsSubmittingReceived(false);
    }
  };

  // Handle Customer Cancellation of Order
  const handleCancelOrder = async () => {
    if (!currentOrder) return;

    setIsSubmittingCancel(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/cancel-by-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancellationReason
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCurrentOrder(data.data);
        if (onOrderUpdated) onOrderUpdated(data.data);
        setIsCancellingOrder(false);
        setCancelSuccessMsg(`Order #${data.data.orderNumber} was successfully cancelled.`);
      } else {
        setErrorMessage(data.message || 'Failed to cancel order.');
      }
    } catch {
      setErrorMessage('Network error while cancelling order.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  if (!isOpen) return null;

  const currentStep = currentOrder ? getStatusStep(currentOrder.status) : 0;
  const isPickup = currentOrder?.deliveryType === 'pickup';

  const ratingDescriptions: Record<number, string> = {
    1: 'Needs Improvement',
    2: 'Fair',
    3: 'Good & Satisfying',
    4: 'Great Experience!',
    5: 'Exceptional & Delicious! ★★★★★'
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl my-8 text-stone-900">
        
        {/* Header */}
        <div className="p-5 bg-white border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Live Order Tracker</h2>
              <p className="text-xs text-stone-500">Track kitchen preparation, delivery & pickup schedules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Order Search Form */}
          <form onSubmit={handleSearchOrder} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="Enter Order # (e.g. ORD-1001)"
                value={searchOrderNumber}
                onChange={(e) => setSearchOrderNumber(e.target.value)}
                className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Finding...' : 'Track'}
            </button>
          </form>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {rescheduleSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{rescheduleSuccessMsg}</span>
            </div>
          )}

          {cancelSuccessMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-red-900 text-sm">{cancelSuccessMsg}</p>
                <p className="text-[11px] text-red-700 mt-0.5">The order has been voided and kitchen has halted preparation.</p>
              </div>
            </div>
          )}

          {receivedSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-emerald-900 text-sm">{receivedSuccessMsg}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Order receipt recorded with the store team.</p>
              </div>
            </div>
          )}

          {currentOrder ? (
            <div className="space-y-5">
              
              {/* Order Info Summary Card */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                      {isPickup ? 'Store Pick-Up' : 'Door Delivery'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                      {currentOrder.paymentMethod.toUpperCase()}
                    </span>
                    {currentOrder.status === 'cancelled' ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                        Cancelled
                      </span>
                    ) : currentOrder.customerReceived ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Received
                      </span>
                    ) : currentOrder.pickupStatus === 'rescheduled' ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                        Rescheduled
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-base font-bold text-stone-900">{currentOrder.orderNumber}</h3>
                  <p className="text-xs text-stone-600">Customer: {currentOrder.customer.name}</p>

                  {currentOrder.customer.referenceNumber && (
                    <p className="text-[11px] font-mono text-emerald-700 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ref #: {currentOrder.customer.referenceNumber}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Total</span>
                  <span className="text-lg font-bold text-stone-900 font-mono">{formatPeso(currentOrder.total)}</span>
                </div>
              </div>

              {/* CANCELLED ORDER NOTICE BANNER */}
              {currentOrder.status === 'cancelled' && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-200 space-y-1">
                  <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> Order Cancelled
                  </div>
                  <p className="text-xs text-red-700">
                    This order was cancelled by {currentOrder.cancelledBy === 'customer' ? 'you (Customer)' : 'Store Management'}.
                  </p>
                  {currentOrder.cancellationReason && (
                    <p className="text-[11px] text-red-600 italic">
                      Reason: "{currentOrder.cancellationReason}"
                    </p>
                  )}
                </div>
              )}

              {/* "I ALREADY RECEIVED MY ORDER" ACTION SECTION */}
              {currentOrder.status !== 'cancelled' && (
                currentOrder.customerReceived ? (
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <PackageCheck className="w-4 h-4 text-emerald-600" /> Order Received & Confirmed
                      </span>
                      {currentOrder.customerReceivedAt && (
                        <span className="text-[10px] text-stone-500 font-mono">
                          {new Date(currentOrder.customerReceivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600">
                      You confirmed receiving this order. Thank you for choosing Matcha Avenue Cafe!
                    </p>
                    {currentOrder.customerRating && (
                      <div className="flex items-center gap-2 pt-1 border-t border-emerald-200">
                        <div className="flex items-center text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= (currentOrder.customerRating || 5)
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-stone-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-stone-600 italic">
                          "{currentOrder.customerFeedback || 'Delicious!'}"
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-stone-50 p-4 rounded-xl border border-emerald-300 space-y-3">
                    {!isConfirmingReceived ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
                            <PackageCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1">
                              <span>Received your order?</span>
                            </h4>
                            <p className="text-xs text-stone-500 mt-0.5">
                              Let us know once you've received your items.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsConfirmingReceived(true)}
                          className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>I Received My Order</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white p-3.5 rounded-lg border border-emerald-200 space-y-3">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                          <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" /> Confirm Receipt & Rate
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsConfirmingReceived(false)}
                            className="text-xs text-stone-400 hover:text-stone-700"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Star Rating Selection */}
                        <div>
                          <label className="block text-[11px] font-medium text-stone-700 mb-1">
                            How was your food & drink experience?
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-lg border border-stone-200">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setSelectedRating(star)}
                                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      star <= selectedRating
                                        ? 'fill-amber-500 text-amber-500'
                                        : 'text-stone-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                            <span className="text-xs font-medium text-amber-700">
                              {ratingDescriptions[selectedRating]}
                            </span>
                          </div>
                        </div>

                        {/* Optional Feedback */}
                        <div>
                          <label className="block text-[10px] text-stone-500 uppercase font-semibold mb-1">
                            Feedback (Optional):
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Loved the Spanish Latte!"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-600 focus:bg-white"
                          />
                        </div>

                        {/* Confirm Button */}
                        <button
                          type="button"
                          onClick={handleConfirmOrderReceived}
                          disabled={isSubmittingReceived}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingReceived ? (
                            <span>Confirming Receipt...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>Confirm Received</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* STORE PICKUP & RESCHEDULE SCHEDULE CARD */}
              {isPickup && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-600" /> Pick-Up Time
                    </span>
                    <span className="text-[11px] font-bold text-stone-900 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                      ⏰ {currentOrder.pickupTime || 'ASAP (~15-20 mins)'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-stone-200 space-y-0.5">
                    <p className="text-xs text-stone-900 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" /> Matcha Avenue Cafe Flagship Store
                    </p>
                    <p className="text-[11px] text-stone-500">
                      7th Ave & 28th St, Bonifacio High Street, BGC, Taguig City
                    </p>
                  </div>

                  {/* Missed / Reschedule Notice */}
                  {currentOrder.status !== 'delivered' && currentOrder.status !== 'cancelled' && (
                    <div className="pt-2 border-t border-stone-200">
                      {!isRescheduling ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-amber-900">
                                Running late for pickup?
                              </p>
                              <p className="text-[11px] text-amber-800">
                                Choose another time slot so your order stays fresh.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsRescheduling(true);
                              setRescheduleSlot(availableRescheduleOptions[0].value);
                            }}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Change Time</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-lg border border-amber-300 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" /> Next Available Slot:
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsRescheduling(false)}
                              className="text-xs text-stone-400 hover:text-stone-700"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {availableRescheduleOptions.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setRescheduleSlot(opt.value)}
                                className={`p-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                                  rescheduleSlot === opt.value
                                    ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs'
                                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          <div>
                            <label className="block text-[10px] text-stone-500 uppercase font-semibold mb-1">
                              Note (Optional):
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Stuck in traffic"
                              value={rescheduleReason}
                              onChange={(e) => setRescheduleReason(e.target.value)}
                              className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 px-2.5 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleConfirmReschedule}
                            disabled={isSubmittingReschedule || !rescheduleSlot}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                          >
                            {isSubmittingReschedule ? (
                              <span>Updating...</span>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>Confirm New Time ({rescheduleSlot})</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reschedule History */}
                  {currentOrder.pickupHistory && currentOrder.pickupHistory.length > 0 && (
                    <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-500 space-y-1">
                      <span className="font-semibold text-stone-700 block">Schedule History:</span>
                      {currentOrder.pickupHistory.map((hist, idx) => (
                        <div key={idx} className="bg-white p-2 rounded-lg border border-stone-200 flex justify-between">
                          <span>Changed to: <strong className="text-amber-800">{hist.newTime}</strong></span>
                          <span className="text-stone-400">{new Date(hist.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Status Timeline */}
              {currentOrder.status === 'cancelled' ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                  <span className="text-sm font-bold text-red-700 block">Order Cancelled</span>
                  <p className="text-xs text-red-600 mt-1">This order was cancelled by the store.</p>
                </div>
              ) : (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    
                    {/* Step 1: Pending */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                        currentStep >= 1 ? 'bg-amber-600 text-white shadow-xs' : 'bg-stone-200 text-stone-400'
                      }`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-stone-900">Received</span>
                      <span className="text-[9px] text-stone-500">Order Placed</span>
                    </div>

                    {/* Step 2: Preparing */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                        currentStep >= 2 ? 'bg-amber-600 text-white shadow-xs animate-pulse' : 'bg-stone-200 text-stone-400'
                      }`}>
                        <ChefHat className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-stone-900">Kitchen</span>
                      <span className="text-[9px] text-stone-500">Brewing & Baking</span>
                    </div>

                    {/* Step 3: Ready */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                        currentStep >= 3 ? 'bg-amber-600 text-white shadow-xs' : 'bg-stone-200 text-stone-400'
                      }`}>
                        {isPickup ? <Store className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                      </div>
                      <span className="text-[11px] font-bold text-stone-900">
                        {isPickup ? 'Ready' : 'On The Way'}
                      </span>
                      <span className="text-[9px] text-stone-500">
                        {isPickup ? 'At Counter' : 'Dispatched'}
                      </span>
                    </div>

                    {/* Step 4: Delivered / Completed */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                        currentStep >= 4 || currentOrder.customerReceived ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300' : 'bg-stone-200 text-stone-400'
                      }`}>
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-stone-900">
                        {isPickup ? 'Claimed' : 'Delivered'}
                      </span>
                      <span className="text-[9px] text-stone-500">
                        {currentOrder.customerReceived ? '✓ Done' : 'Complete'}
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* Customer & Delivery Info */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" /> Customer Information
                  </span>
                  <span className="text-[11px] text-stone-600 font-mono">
                    {currentOrder.customer.phone}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block font-semibold">Recipient:</span>
                    <span className="font-bold text-stone-900">{currentOrder.customer.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block font-semibold">Phone:</span>
                    <a href={`tel:${currentOrder.customer.phone}`} className="text-amber-800 font-mono font-bold hover:underline">
                      {currentOrder.customer.phone}
                    </a>
                  </div>
                </div>

                {/* Door Delivery Address and Map */}
                {!isPickup && currentOrder.customer.address && (
                  <div className="space-y-1.5 pt-1 border-t border-stone-200">
                    <span className="text-[10px] text-stone-500 uppercase font-semibold block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-600" /> Delivery Address:
                    </span>
                    <p className="text-xs text-stone-700 bg-white p-2 rounded-lg border border-stone-200 leading-relaxed">
                      {currentOrder.customer.unitFloor ? `${currentOrder.customer.unitFloor}, ` : ''}
                      {currentOrder.customer.address}
                      {currentOrder.customer.landmark ? ` (Landmark: ${currentOrder.customer.landmark})` : ''}
                    </p>

                    <div className="pt-1">
                      <GoogleMapsLocationPicker
                        coordinates={currentOrder.customer.coordinates || { lat: 14.5515, lng: 121.0510, label: currentOrder.customer.address }}
                        address={currentOrder.customer.address}
                        onChangeLocation={() => {}}
                        isReadOnly={true}
                        showRouteToStore={true}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items summary table */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Ordered Items ({currentOrder.items.length})
                  </span>
                  <span className="text-[11px] text-stone-500 font-mono">
                    {currentOrder.items.reduce((s, i) => s + i.quantity, 0)} total pcs
                  </span>
                </div>
                <div className="space-y-1.5">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-stone-900 block break-words">
                          {item.quantity}x {item.productName}
                        </span>
                        {item.notes && (
                          <span className="text-[11px] text-amber-800 italic block mt-0.5 break-words">
                            Note: {item.notes}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-stone-900 font-mono shrink-0">
                        {formatPeso(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CUSTOMER CANCEL ORDER SECTION */}
              {(currentOrder.status === 'pending' || currentOrder.status === 'preparing') && !currentOrder.customerReceived && (
                <div className="pt-2 border-t border-stone-200">
                  {!isCancellingOrder ? (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-stone-700 block">Need to cancel this order?</span>
                        <span className="text-[10px] text-stone-500">Available while order is pending or being prepared.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCancellingOrder(true)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        Cancel Order
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-red-200 pb-2">
                        <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-600" /> Cancel Order #{currentOrder.orderNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCancellingOrder(false)}
                          className="text-xs text-stone-400 hover:text-stone-700"
                        >
                          Dismiss
                        </button>
                      </div>

                      <p className="text-xs text-red-700">
                        Are you sure you want to cancel your order? The kitchen will stop preparation and the order will be voided.
                      </p>

                      <div>
                        <label className="block text-[10px] text-stone-600 uppercase font-semibold mb-1">
                          Reason for Cancellation:
                        </label>
                        <select
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          className="w-full bg-white text-xs text-stone-900 p-2 rounded-lg border border-red-200 focus:outline-none focus:border-red-500"
                        >
                          <option value="Changed mind / Placed order by mistake">Changed mind / Placed order by mistake</option>
                          <option value="Need to change delivery address or phone number">Need to change delivery address or phone number</option>
                          <option value="Want to change items or add more items">Want to change items or add more items</option>
                          <option value="Preparation time is taking longer than expected">Preparation time is taking longer than expected</option>
                          <option value="Other personal reasons">Other personal reasons</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsCancellingOrder(false)}
                          className="flex-1 py-1.5 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg border border-stone-200 transition-all cursor-pointer"
                        >
                          Keep Order
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelOrder}
                          disabled={isSubmittingCancel}
                          className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingCancel ? 'Cancelling...' : 'Yes, Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-8 text-stone-400 text-xs">
              Search an Order Number above or submit a new order to trace real-time updates!
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
