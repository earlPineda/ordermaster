import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Lock,
  CheckCircle2,
  QrCode,
  AlertCircle,
  Copy,
  Check,
  Smartphone,
  Navigation,
  Store,
  Truck,
  UtensilsCrossed,
  Clock,
  Sparkles,
  LocateFixed
} from 'lucide-react';
import { CartItem, CustomerInfo, DeliveryType, PaymentMethod, Order, CustomerCoordinates } from '../types';
import { formatPeso, validatePHMobileNumber, validateEWalletRefNumber } from '../utils/format';
import { GoogleMapsLocationPicker } from './GoogleMapsLocationPicker';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  deliveryType: DeliveryType;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  deliveryType: initialDeliveryType,
  onOrderSuccess
}) => {
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<DeliveryType>(initialDeliveryType || 'dine_in');
  const [tableNumber, setTableNumber] = useState<string>('4');
  
  // Pick-up Time Slots
  const [pickupTime, setPickupTime] = useState<string>('ASAP (~15-20 mins)');
  const [isCustomPickupTime, setIsCustomPickupTime] = useState(false);
  const [customPickupTimeValue, setCustomPickupTimeValue] = useState('');

  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
    coordinates: { lat: 14.5515, lng: 121.0510, label: 'BGC Taguig' },
    notes: '',
    ewalletNumber: '',
    referenceNumber: '',
    tableNumber: '4'
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Sync initial delivery type and table number from query params if present
  useEffect(() => {
    if (initialDeliveryType) {
      setSelectedDeliveryType(initialDeliveryType);
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get('table');
      if (urlTable) {
        setTableNumber(urlTable);
        setSelectedDeliveryType('dine_in');
      }
    }
  }, [initialDeliveryType, isOpen]);

  if (!isOpen) return null;

  const getItemUnitPrice = (item: CartItem) => {
    if (item.unitFinalPrice) return item.unitFinalPrice;
    return item.product.isOnSale && item.product.salePrice ? item.product.salePrice : item.product.price;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% VAT
  const deliveryFee = selectedDeliveryType === 'delivery' ? (subtotal > 800 ? 0 : 50) : 0;
  const total = subtotal + tax + deliveryFee;

  const merchantEWalletNumber = '0917 888 2233';

  // Calculate dynamic pick-up time slot presets based on current clock
  const now = new Date();
  const formatTimeSlot = (minutesToAdd: number) => {
    const d = new Date(now.getTime() + minutesToAdd * 60000);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const pickupSlots = [
    { label: '⚡ ASAP (~15-20 mins)', value: 'ASAP (~15-20 mins)' },
    { label: `+30 mins (${formatTimeSlot(30)})`, value: `Today at ${formatTimeSlot(30)}` },
    { label: `+45 mins (${formatTimeSlot(45)})`, value: `Today at ${formatTimeSlot(45)}` },
    { label: `+1 Hour (${formatTimeSlot(60)})`, value: `Today at ${formatTimeSlot(60)}` },
    { label: `+1.5 Hours (${formatTimeSlot(90)})`, value: `Today at ${formatTimeSlot(90)}` }
  ];

  const copyMerchantNumber = () => {
    navigator.clipboard.writeText('09178882233');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleLocationChange = (coords: CustomerCoordinates, suggestedAddress?: string) => {
    setCustomer((prev) => ({
      ...prev,
      coordinates: coords,
      address: suggestedAddress ? suggestedAddress : prev.address
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Basic customer validations
    if (!customer.name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    const phoneValidation = validatePHMobileNumber(customer.phone);
    if (!phoneValidation.isValid) {
      setErrorMessage(`Contact Phone: ${phoneValidation.message}`);
      return;
    }

    if (selectedDeliveryType === 'delivery' && !customer.address?.trim()) {
      setErrorMessage('Please provide a complete delivery street address.');
      return;
    }

    if (selectedDeliveryType === 'dine_in' && !tableNumber.trim()) {
      setErrorMessage('Please specify your Table Number for table service.');
      return;
    }

    // 2. GCash / Maya Specific Validation
    if (paymentMethod === 'gcash' || paymentMethod === 'maya') {
      const ewalletPhone = customer.ewalletNumber?.trim() || customer.phone;
      const ewalletValidation = validatePHMobileNumber(ewalletPhone);

      if (!ewalletValidation.isValid) {
        setErrorMessage(`${paymentMethod.toUpperCase()} Account Number: ${ewalletValidation.message}`);
        return;
      }

      if (!customer.referenceNumber?.trim()) {
        setErrorMessage(`Please enter your ${paymentMethod.toUpperCase()} Transaction Reference Number.`);
        return;
      }

      const refValidation = validateEWalletRefNumber(customer.referenceNumber);
      if (!refValidation.isValid) {
        setErrorMessage(`${paymentMethod.toUpperCase()} Reference No: ${refValidation.message}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderItems = cartItems.map((item) => {
        const unitPrice = getItemUnitPrice(item);
        return {
          productId: item.product.id,
          productName: item.product.name,
          unitPrice,
          quantity: item.quantity,
          subtotal: unitPrice * item.quantity,
          notes: item.notes,
          selectedModifiers: item.selectedModifiers
        };
      });

      const finalPickupTime = isCustomPickupTime && customPickupTimeValue
        ? `Today at ${customPickupTimeValue}`
        : pickupTime;

      const payloadCustomer: CustomerInfo = {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email?.trim() || undefined,
        address: selectedDeliveryType === 'delivery' ? customer.address?.trim() : undefined,
        coordinates: selectedDeliveryType === 'delivery' ? customer.coordinates : undefined,
        notes: customer.notes?.trim() || undefined,
        tableNumber: selectedDeliveryType === 'dine_in' ? tableNumber.trim() : undefined,
        ewalletNumber:
          paymentMethod === 'gcash' || paymentMethod === 'maya'
            ? customer.ewalletNumber?.trim() || customer.phone.trim()
            : undefined,
        referenceNumber:
          paymentMethod === 'gcash' || paymentMethod === 'maya'
            ? customer.referenceNumber?.trim()
            : undefined
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: payloadCustomer,
          items: orderItems,
          deliveryType: selectedDeliveryType,
          pickupTime: selectedDeliveryType === 'pickup' ? finalPickupTime : undefined,
          tableNumber: selectedDeliveryType === 'dine_in' ? tableNumber.trim() : undefined,
          paymentMethod,
          subtotal,
          tax,
          deliveryFee,
          total
        })
      });

      const data = await res.json();

      if (data.success && data.data) {
        onOrderSuccess(data.data);
      } else {
        setErrorMessage(data.message || 'Failed to submit order. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage('Network error connecting to Express API server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200 text-stone-900">
        
        {/* Modal Header */}
        <div className="p-5 bg-white border-b border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
              Direct Ordering
            </span>
            <h2 className="font-display text-xl font-bold text-stone-900 mt-1">Complete Your Order</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dine-In / Store Pickup / Delivery Selector */}
          <div className="bg-stone-50 p-2 rounded-xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 px-2 pb-1.5 block">
              Order Type
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDeliveryType('dine_in')}
                className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedDeliveryType === 'dine_in'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Dine-In</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDeliveryType('pickup')}
                className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedDeliveryType === 'pickup'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Pick-up</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDeliveryType('delivery')}
                className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedDeliveryType === 'delivery'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Delivery</span>
              </button>
            </div>
          </div>

          {/* DINE-IN TABLE SELECTION */}
          {selectedDeliveryType === 'dine_in' && (
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" /> Dine-In Table Service
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  QR Table Ordering
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Select Table Number
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-2.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 18, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTableNumber(String(num))}
                      className={`p-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                        tableNumber === String(num)
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      T-{num}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">Custom Table:</span>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. Table 4 or Bar 2"
                    className="flex-1 bg-white text-xs text-stone-900 font-mono font-bold px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STORE PICK-UP OPTION & TIME PICKER */}
          {selectedDeliveryType === 'pickup' && (
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-600" /> Counter Pick-up
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  FREE Pickup
                </span>
              </div>

              {/* Branch details */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Matcha Avenue Cafe Flagship Branch</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    7th Ave & 28th St, Bonifacio High Street, BGC, Taguig City
                  </p>
                  <p className="text-[10px] text-stone-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" /> Open: 7:00 AM – 10:00 PM
                  </p>
                </div>
              </div>

              {/* Pick-Up Time Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Pick-Up Time
                  </span>
                  <span className="text-[10px] font-bold text-amber-700">
                    {isCustomPickupTime && customPickupTimeValue ? `Custom: ${customPickupTimeValue}` : pickupTime}
                  </span>
                </label>

                {/* Quick Slots */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {pickupSlots.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => {
                        setPickupTime(slot.value);
                        setIsCustomPickupTime(false);
                      }}
                      className={`p-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                        !isCustomPickupTime && pickupTime === slot.value
                          ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}

                  {/* Custom Time Option */}
                  <button
                    type="button"
                    onClick={() => setIsCustomPickupTime(true)}
                    className={`p-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                      isCustomPickupTime
                        ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    Custom Time...
                  </button>
                </div>

                {isCustomPickupTime && (
                  <div className="pt-1">
                    <label className="block text-[11px] text-stone-600 mb-1">Pick specific time for today:</label>
                    <input
                      type="time"
                      value={customPickupTimeValue}
                      onChange={(e) => setCustomPickupTimeValue(e.target.value)}
                      required={isCustomPickupTime}
                      className="w-full bg-white text-xs text-stone-900 p-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-600" /> Customer Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full bg-white text-xs text-stone-900 placeholder-stone-400 pl-8 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Mobile Phone (11 Digits) *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 09171234567"
                    value={customer.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomer({
                        ...customer,
                        phone: val,
                        ewalletNumber: customer.ewalletNumber ? customer.ewalletNumber : val
                      });
                    }}
                    className="w-full bg-white text-xs text-stone-900 placeholder-stone-400 pl-8 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-stone-400">
                    Optional
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="email"
                    placeholder="e.g. maria@example.com"
                    value={customer.email || ''}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full bg-white text-xs text-stone-900 placeholder-stone-400 pl-8 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address & Map (Only for Door Delivery) */}
            {selectedDeliveryType === 'delivery' && (
              <>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Delivery Street Address *</label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                      <input
                        type="text"
                        required
                        placeholder="House/Building No., Street Name, City"
                        value={customer.address || ''}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                        className="w-full bg-white text-xs text-stone-900 placeholder-stone-400 pl-8 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Google Maps Location Visualizer & Pin Drop */}
                <div className="pt-1">
                  <GoogleMapsLocationPicker
                    coordinates={customer.coordinates}
                    onChangeLocation={handleLocationChange}
                  />
                </div>
              </>
            )}

            {/* Kitchen Notes */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Special Instructions</label>
              <textarea
                rows={2}
                placeholder="e.g. Extra napkins, less sugar, serve beverage first..."
                value={customer.notes || ''}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                className="w-full bg-white text-xs text-stone-900 placeholder-stone-400 p-2.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 transition-colors"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2.5 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
              Payment Method
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('gcash')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'gcash'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500 shadow-xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center mx-auto mb-1">
                  G
                </div>
                <span className="block text-xs font-bold">GCash</span>
                <span className="text-[10px] text-stone-500">Direct QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('maya')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'maya'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center mx-auto mb-1">
                  M
                </div>
                <span className="block text-xs font-bold">Maya</span>
                <span className="text-[10px] text-stone-500">Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-50 border-amber-600 text-amber-900 ring-1 ring-amber-600 shadow-xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Banknote className="w-4 h-4 text-amber-700 mx-auto mb-1" />
                <span className="block text-xs font-bold">Cash</span>
                <span className="text-[10px] text-stone-500">At Counter</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-orange-50 border-orange-500 text-orange-900 ring-1 ring-orange-500 shadow-xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <CreditCard className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                <span className="block text-xs font-bold">Card</span>
                <span className="text-[10px] text-stone-500">Visa / MC</span>
              </button>
            </div>
          </div>

          {/* GCash or Maya Payment Details Box & Validation */}
          {(paymentMethod === 'gcash' || paymentMethod === 'maya') && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                paymentMethod === 'gcash'
                  ? 'bg-blue-50/50 border-blue-200 text-blue-950'
                  : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs ${
                      paymentMethod === 'gcash' ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}
                  >
                    {paymentMethod === 'gcash' ? 'G' : 'M'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold capitalize">
                      {paymentMethod} Direct Transfer
                    </h4>
                    <p className="text-[11px] text-stone-600">
                      Send <strong className="text-stone-900 font-mono">{formatPeso(total)}</strong> to merchant account:
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                  <QrCode className="w-3.5 h-3.5 text-stone-700" />
                  <span className="text-[10px] text-stone-700 font-bold">QR Ready</span>
                </div>
              </div>

              {/* Merchant Account info box */}
              <div className="bg-white p-3 rounded-lg border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 block">
                    Merchant Name: <strong className="text-stone-800">Matcha Avenue Cafe BGC</strong>
                  </span>
                  <span className="font-mono text-sm font-bold text-stone-900">{merchantEWalletNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={copyMerchantNumber}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                >
                  {copiedAccount ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Validation Inputs for GCash / Maya */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-800 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-stone-600" /> 1. Your {paymentMethod.toUpperCase()} Mobile Number *
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">(09XXXXXXXXX)</span>
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 09171234567"
                  value={customer.ewalletNumber || customer.phone}
                  onChange={(e) => setCustomer({ ...customer, ewalletNumber: e.target.value })}
                  className="w-full bg-white text-xs text-stone-900 placeholder-stone-400 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 font-mono"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-stone-800 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-stone-600" /> 2. {paymentMethod.toUpperCase()} Reference No. / Transaction ID *
                  </span>
                  <span className="text-[10px] text-amber-800 font-medium">(SMS Receipt ID)</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10293847561 (min. 8 digits)"
                  value={customer.referenceNumber || ''}
                  onChange={(e) => setCustomer({ ...customer, referenceNumber: e.target.value })}
                  className="w-full bg-white text-xs font-mono text-stone-900 placeholder-stone-400 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600"
                />
                <p className="text-[10px] text-stone-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-stone-400" />
                  Please verify your reference number from your {paymentMethod.toUpperCase()} app before confirming.
                </p>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-3 border-t border-stone-200 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-600 font-medium">Total to Pay</span>
              <span className="text-xl font-bold text-stone-900 font-mono">{formatPeso(total)}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {selectedDeliveryType === 'dine_in'
                      ? `Confirm Dine-In Order (Table ${tableNumber})`
                      : selectedDeliveryType === 'pickup'
                      ? 'Confirm Store Pick-Up Order'
                      : 'Confirm & Place Order'}{' '}
                    • {formatPeso(total)}
                  </span>
                </>
              )}
            </button>

            <p className="text-[10px] text-stone-400 text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3 text-stone-400" /> Matcha Avenue Cafe Direct Kitchen Dispatch
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
