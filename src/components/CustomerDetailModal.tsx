import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  User,
  CreditCard,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  Navigation,
  Star,
  PackageCheck,
  AlertCircle,
  Clock,
  ChefHat,
  Bike,
  XCircle,
  Coffee,
  Printer,
  FileText
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatPeso } from '../utils/format';
import { GoogleMapsLocationPicker, AVENUE_CAFE_COORDINATES } from './GoogleMapsLocationPicker';

interface CustomerDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'profile' | 'map' | 'all'>('items');
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  if (!isOpen || !order) return null;

  const copyToClipboard = (text: string, type: 'ref' | 'phone' | 'address') => {
    navigator.clipboard.writeText(text);
    if (type === 'ref') {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } else if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-md">Pending Kitchen Approval</span>;
      case 'preparing':
        return <span className="bg-stone-100 text-stone-800 border border-stone-300 text-xs font-semibold px-2.5 py-0.5 rounded-md">Currently in Kitchen</span>;
      case 'ready':
        return <span className="bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold px-2.5 py-0.5 rounded-md">Rider Dispatched</span>;
      case 'delivered':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-md">Delivered &amp; Complete</span>;
      case 'cancelled':
        return <span className="bg-red-50 text-red-800 border border-red-200 text-xs font-semibold px-2.5 py-0.5 rounded-md">Cancelled</span>;
      default:
        return null;
    }
  };

  const coords = order.customer.coordinates || { lat: 14.5515, lng: 121.0510, label: order.customer.address || 'Delivery Point' };
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${AVENUE_CAFE_COORDINATES.lat},${AVENUE_CAFE_COORDINATES.lng}&destination=${coords.lat},${coords.lng}`;

  const hasItems = order.items && order.items.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl my-auto max-h-[94vh] flex flex-col text-stone-900">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full">
                Order &amp; Customer Details
              </span>
              <span className="text-xs text-stone-500">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <span>{order.orderNumber}</span>
              {getStatusBadge(order.status)}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5 text-stone-700" />
              <span>Rider Directions</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 bg-white rounded-xl border border-stone-200 transition-colors cursor-pointer w-8 h-8 flex items-center justify-center font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation for Instant Full Item Visibility */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 pb-1 bg-stone-50/50 border-b border-stone-200 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'items'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ordered Items ({order.items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Customer Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Delivery Map</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>All Sections</span>
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">

          {/* Customer Confirmation Badge */}
          {order.customerReceived && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900">Customer Confirmed Order Received</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                      ✓ Received
                    </span>
                  </div>
                  {order.customerReceivedAt && (
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Confirmed on: {new Date(order.customerReceivedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {order.customerRating && (
                <div className="bg-white px-2.5 py-1 rounded-lg border border-stone-200 flex items-center gap-1.5">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= (order.customerRating || 5)
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-stone-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-stone-800">{order.customerRating}/5</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: ORDERED ITEMS (FULL TABLE - NEVER CUT OFF) */}
          {(activeTab === 'items' || activeTab === 'all') && (
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-amber-700" />
                  <h3 className="text-sm font-bold text-stone-900">
                    Itemized Order Breakdown ({order.items.length} items)
                  </h3>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-lg">
                  {order.deliveryType === 'delivery' ? '🚗 Door Delivery' : '🏪 In-Store Pickup'}
                </span>
              </div>

              {!hasItems ? (
                <div className="bg-white p-8 rounded-xl border border-stone-200 text-center text-stone-500 space-y-1">
                  <p className="font-semibold text-xs text-stone-700">No items specified on this record.</p>
                  <p className="text-[11px] text-stone-400">Total charge: {formatPeso(order.total)} via {order.paymentMethod.toUpperCase()}</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Menu Item &amp; Customizations</th>
                        <th className="py-3 px-4 text-center w-20">Qty</th>
                        <th className="py-3 px-4 text-right w-28">Unit Price</th>
                        <th className="py-3 px-4 text-right w-28">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/50">
                          <td className="py-3 px-4">
                            <span className="font-bold text-stone-900 block text-sm">
                              {item.productName}
                            </span>
                            {item.notes && (
                              <span className="inline-block mt-1 text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                                Notes: {item.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-stone-100 text-stone-800 text-xs font-extrabold px-2 py-1 rounded-md">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-stone-600">
                            {formatPeso(item.unitPrice)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                            {formatPeso(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Financial calculation breakdown */}
                  <div className="bg-stone-50/70 p-4 border-t border-stone-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-stone-600">
                      <span>Items Subtotal</span>
                      <span className="font-mono font-semibold">{formatPeso(order.subtotal)}</span>
                    </div>

                    {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
                      <div className="flex justify-between items-center text-stone-600">
                        <span>Courier Delivery Fee</span>
                        <span className="font-mono font-semibold">{formatPeso(order.deliveryFee)}</span>
                      </div>
                    )}

                    {order.tax !== undefined && order.tax > 0 && (
                      <div className="flex justify-between items-center text-stone-600">
                        <span>Value Added Tax (12% VAT)</span>
                        <span className="font-mono font-semibold">{formatPeso(order.tax)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-bold">
                      <span className="text-stone-900">Total Order Amount</span>
                      <span className="text-lg font-bold text-amber-700 font-mono">
                        {formatPeso(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Special instructions / notes if present */}
              {order.customer.notes && (
                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                    Customer Order Instructions:
                  </span>
                  <p className="text-amber-950 italic">&ldquo;{order.customer.notes}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOMER CONTACT PROFILE */}
          {(activeTab === 'profile' || activeTab === 'all') && (
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" /> Customer Contact &amp; Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Full Name */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] font-semibold text-stone-400 block uppercase">Customer Name</span>
                  <span className="text-sm font-bold text-stone-900 block mt-0.5">{order.customer.name}</span>
                </div>

                {/* Mobile Phone */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] font-semibold text-stone-400 block uppercase">Mobile Contact</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 font-mono"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{order.customer.phone}</span>
                    </a>
                    <button
                      onClick={() => copyToClipboard(order.customer.phone, 'phone')}
                      className="text-[10px] text-stone-400 hover:text-stone-700 p-1 rounded bg-stone-100 cursor-pointer"
                      title="Copy phone"
                    >
                      {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Delivery Type */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] font-semibold text-stone-400 block uppercase">Fulfillment Method</span>
                  <span className="text-sm font-bold text-stone-900 block mt-0.5">
                    {order.deliveryType === 'delivery' ? '🚗 Door Delivery' : '🏪 In-Store Pickup'}
                  </span>
                </div>

                {/* Street Address */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200 sm:col-span-2">
                  <span className="text-[10px] font-semibold text-stone-400 block uppercase">Complete Address</span>
                  <div className="flex items-start justify-between gap-2 mt-0.5">
                    <p className="text-xs text-stone-800 leading-relaxed font-medium">
                      {order.customer.address || 'No street address specified'}
                    </p>
                    {order.customer.address && (
                      <button
                        onClick={() => copyToClipboard(order.customer.address!, 'address')}
                        className="text-[10px] text-stone-400 hover:text-stone-700 p-1 rounded bg-stone-100 shrink-0 cursor-pointer"
                        title="Copy address"
                      >
                        {copiedAddress ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Landmark */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] font-semibold text-stone-400 block uppercase">Landmark / Notes</span>
                  <p className="text-xs text-stone-700 font-medium mt-0.5">
                    {order.customer.landmark || 'None provided'}
                  </p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-stone-500" />
                    Payment Method: <span className="uppercase font-mono text-blue-600">{order.paymentMethod}</span>
                  </span>
                  <span className="font-bold text-amber-700 font-mono text-sm">
                    {formatPeso(order.total)}
                  </span>
                </div>

                {order.paymentReference && (
                  <div className="flex items-center justify-between bg-stone-50 px-3 py-2 rounded-lg border border-stone-200 text-xs">
                    <span className="text-stone-500">Transaction Reference:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">{order.paymentReference}</span>
                      <button
                        onClick={() => copyToClipboard(order.paymentReference!, 'ref')}
                        className="p-1 hover:bg-stone-200 rounded cursor-pointer text-stone-500"
                        title="Copy reference"
                      >
                        {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LOCATION MAP */}
          {(activeTab === 'map' || activeTab === 'all') && (
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-600" /> Delivery Map &amp; Navigation
                </h3>
                <span className="text-[10px] text-stone-500 font-mono">
                  GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-stone-200 bg-white shadow-xs">
                <GoogleMapsLocationPicker
                  coordinates={coords}
                  isReadOnly={true}
                  defaultZoom={15}
                  height="280px"
                />
              </div>
            </div>
          )}

          {/* STATUS CONTROLS */}
          {onUpdateStatus && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Update Order Kitchen &amp; Dispatch Status:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, 'pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    order.status === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Pending
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, 'preparing')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    order.status === 'preparing'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" /> In Kitchen
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, 'ready')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    order.status === 'ready'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" /> Dispatched / On The Way
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, 'delivered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    order.status === 'delivered'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5" /> Completed / Delivered
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, 'cancelled')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto cursor-pointer ${
                    order.status === 'cancelled'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white text-red-600 hover:bg-red-50 border border-red-200'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel Order
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
