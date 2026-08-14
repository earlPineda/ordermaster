import React, { useState } from 'react';
import { CreditCard, Wallet, Banknote, User, Phone, MapPin, FileText, Lock, CheckCircle2, QrCode, AlertCircle, Copy, Check, Smartphone, ShoppingBag } from 'lucide-react';
import { CartItem, CustomerInfo, DeliveryType, PaymentMethod, Order } from '../types';
import { formatPeso, validatePHMobileNumber, validateEWalletRefNumber } from '../utils/format';
import { MapLocationPicker } from './MapLocationPicker';

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
  deliveryType,
  onOrderSuccess
}) => {
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
    notes: '',
    ewalletNumber: '',
    referenceNumber: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% VAT
  const deliveryFee = deliveryType === 'delivery' ? (subtotal > 1000 ? 0 : 50) : 0;
  const total = subtotal + tax + deliveryFee;

  const merchantEWalletNumber = '0917 888 2233';

  const copyMerchantNumber = () => {
    navigator.clipboard.writeText('09178882233');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Basic customer field validations
    if (!customer.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const phoneValidation = validatePHMobileNumber(customer.phone);
    if (!phoneValidation.isValid) {
      setErrorMessage(`Customer Phone: ${phoneValidation.message}`);
      return;
    }

    if (deliveryType === 'delivery' && !customer.address?.trim()) {
      setErrorMessage('Please provide a complete delivery street address.');
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
      const orderItems = cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        unitPrice: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        notes: item.notes
      }));

      const payloadCustomer = {
        ...customer,
        ewalletNumber: (paymentMethod === 'gcash' || paymentMethod === 'maya') 
          ? (customer.ewalletNumber?.trim() || customer.phone) 
          : undefined,
        referenceNumber: (paymentMethod === 'gcash' || paymentMethod === 'maya') 
          ? customer.referenceNumber?.trim() 
          : undefined
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: payloadCustomer,
          items: orderItems,
          deliveryType,
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md uppercase">
              Secure Checkout • Express API
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Complete Your Order</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Order Summary Table */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" /> Order Summary
            </h3>
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="bg-slate-900 text-slate-400">
                    <th className="text-left px-3 py-2 font-medium">Item</th>
                    <th className="text-center px-2 py-2 font-medium">Qty</th>
                    <th className="text-right px-3 py-2 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cartItems.map((item, idx) => (
                    <tr key={idx} className="text-slate-300">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-200">{item.product.name}</div>
                        {item.notes && <div className="text-[10px] text-slate-500 mt-0.5">{item.notes}</div>}
                      </td>
                      <td className="text-center px-2 py-2 font-mono">{item.quantity}</td>
                      <td className="text-right px-3 py-2 font-mono text-amber-400">{formatPeso(item.product.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" /> Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full bg-slate-950 text-xs text-slate-200 placeholder-slate-500 pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Contact Phone (11 Digits) *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
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
                    className="w-full bg-slate-950 text-xs text-slate-200 placeholder-slate-500 pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Pin Delivery Location on Google Maps
                </label>
                <MapLocationPicker
                  onSelectLocation={(location) => setCustomer({ ...customer, address: location })}
                />

                <label className="block text-xs text-slate-400 mt-3 mb-1">Delivery Address *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <textarea
                    required
                    rows={2}
                    placeholder="House/Apt No., Street, Subdivision, City"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className="w-full bg-slate-950 text-xs text-slate-200 placeholder-slate-500 pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Rider / Kitchen Notes (Optional)</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Gate password, don't ring bell, extra napkins..."
                  value={customer.notes}
                  onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  className="w-full bg-slate-950 text-xs text-slate-200 placeholder-slate-500 pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Select Payment Method
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* GCash Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('gcash')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'gcash'
                    ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    Popular
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">GCash</span>
                  <span className="text-[10px] text-slate-400">Scan QR or Send</span>
                </div>
              </button>

              {/* Maya Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('maya')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'maya'
                    ? 'bg-emerald-600/15 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Instant
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">Maya</span>
                  <span className="text-[10px] text-slate-400">E-Wallet Pay</span>
                </div>
              </button>

              {/* Cash Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-400 mb-2" />
                <div>
                  <span className="block text-xs font-bold text-white">Cash</span>
                  <span className="text-[10px] text-slate-400">Pay on Delivery</span>
                </div>
              </button>

              {/* Credit Card Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'card'
                    ? 'bg-indigo-500/15 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-5 h-5 text-indigo-400 mb-2" />
                <div>
                  <span className="block text-xs font-bold text-white">Card</span>
                  <span className="text-[10px] text-slate-400">Visa / MC</span>
                </div>
              </button>
            </div>
          </div>

          {/* GCash or Maya Payment Details Box & Validation */}
          {(paymentMethod === 'gcash' || paymentMethod === 'maya') && (
            <div className={`p-4 rounded-2xl border space-y-4 ${
              paymentMethod === 'gcash' 
                ? 'bg-blue-950/30 border-blue-500/30' 
                : 'bg-emerald-950/30 border-emerald-500/30'
            }`}>
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs ${
                    paymentMethod === 'gcash' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}>
                    {paymentMethod === 'gcash' ? 'G' : 'M'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white capitalize">
                      {paymentMethod} Direct Transfer
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Send <strong className="text-amber-400">{formatPeso(total)}</strong> to our official store account:
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-xl">
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] text-slate-300 font-bold">QR Ready</span>
                </div>
              </div>

              {/* Merchant Account info box */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                    Merchant Name: <strong className="text-slate-200">Avenue Café</strong>
                  </span>
                  <span className="font-mono text-sm font-bold text-amber-400">
                    {merchantEWalletNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyMerchantNumber}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                >
                  {copiedAccount ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy No.</span>
                    </>
                  )}
                </button>
              </div>

              {/* Validation Inputs for GCash / Maya */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" /> 
                    1. Your {paymentMethod.toUpperCase()} Mobile Number *
                  </span>
                  <span className="text-[10px] text-slate-400">(09XXXXXXXXX)</span>
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 09171234567"
                  value={customer.ewalletNumber || customer.phone}
                  onChange={(e) => setCustomer({ ...customer, ewalletNumber: e.target.value })}
                  className="w-full bg-slate-950 text-xs text-slate-200 placeholder-slate-500 px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" /> 
                    2. {paymentMethod.toUpperCase()} Reference No. / Transaction ID *
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold">(Required validation)</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10293847561 (min. 8 digits)"
                  value={customer.referenceNumber || ''}
                  onChange={(e) => setCustomer({ ...customer, referenceNumber: e.target.value })}
                  className="w-full bg-slate-950 text-xs font-mono text-amber-300 placeholder-slate-500 px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  Please verify your reference number from your {paymentMethod.toUpperCase()} SMS receipt before placing order.
                </p>
              </div>

            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Final Payment Total</span>
              <span className="text-2xl font-black text-amber-400">{formatPeso(total)}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-orange-500/20 hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Order to Express API...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirm & Place Order ({formatPeso(total)})</span>
                </>
              )}
            </button>
            
            <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" /> Express REST API • Real-time notification dispatched to Admin Console
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};
