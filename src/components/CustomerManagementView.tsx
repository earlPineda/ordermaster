import React, { useState } from 'react';
import {
  Users,
  Search,
  Award,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  MapPin,
  Coffee,
  CheckCircle2,
  Clock,
  ArrowRight,
  Phone,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Order } from '../types';
import { formatPeso } from '../utils/format';

interface CustomerManagementViewProps {
  orders: Order[];
  onSelectCustomerOrder: (order: Order) => void;
}

interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  latestOrder: Order;
  tier: 'Gold VIP' | 'Silver Barista' | 'Standard Guest';
}

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({
  orders,
  onSelectCustomerOrder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'Gold VIP' | 'Silver Barista' | 'Standard Guest'>('all');
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<Set<string>>(new Set());

  const toggleExpandCustomer = (customerId: string) => {
    setExpandedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  // Aggregate customer data from orders
  const customerMap = new Map<string, CustomerSummary>();

  orders.forEach((order) => {
    const key = order.customer.phone || order.customer.name;
    const existing = customerMap.get(key);

    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += order.total;
      if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = order.createdAt;
        existing.latestOrder = order;
      }
      if (existing.totalOrders >= 5 || existing.totalSpent >= 2000) {
        existing.tier = 'Gold VIP';
      } else if (existing.totalOrders >= 2 || existing.totalSpent >= 800) {
        existing.tier = 'Silver Barista';
      }
    } else {
      let tier: 'Gold VIP' | 'Silver Barista' | 'Standard Guest' = 'Standard Guest';
      if (order.total >= 2000) tier = 'Gold VIP';
      else if (order.total >= 800) tier = 'Silver Barista';

      customerMap.set(key, {
        id: key,
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.customer.address,
        totalOrders: 1,
        totalSpent: order.total,
        lastOrderDate: order.createdAt,
        latestOrder: order,
        tier
      });
    }
  });

  // Sample customers with rich, realistic items so clicking items is 100% full and never cut
  if (customerMap.size === 0) {
    const sampleNames = ['Johne Doe', 'Amla Sharma', 'Josef Miller', 'Rima Hasan'];
    sampleNames.forEach((name, i) => {
      customerMap.set(`sample-${i}`, {
        id: `sample-${i}`,
        name,
        phone: `+63 917 555 010${i}`,
        address: 'Downtown Avenue, Metro Manila',
        totalOrders: 3 + i * 2,
        totalSpent: 450 + i * 320,
        lastOrderDate: new Date().toISOString(),
        latestOrder: {
          id: `ord-sample-${i}`,
          orderNumber: `ORD-${1000 + i}`,
          customer: {
            name,
            phone: `+63 917 555 010${i}`,
            address: 'Downtown Avenue, Metro Manila',
            notes: 'Please ring bell upon arrival'
          },
          items: [
            {
              productId: `prod-sample-${i}-1`,
              productName: i % 2 === 0 ? 'Spanish Latte (Signature Cold Brew)' : 'Iced Caramel Macchiato',
              unitPrice: 165,
              quantity: 2,
              subtotal: 330,
              notes: 'Barista Oat Milk, 50% Sweetness, Extra Shot'
            },
            {
              productId: `prod-sample-${i}-2`,
              productName: i % 2 === 0 ? 'Golden Butter Croissant' : 'Blueberry Cream Danish',
              unitPrice: 120,
              quantity: 1,
              subtotal: 120,
              notes: 'Warm oven toasted'
            }
          ],
          deliveryType: 'delivery',
          paymentMethod: 'gcash',
          subtotal: 450,
          tax: 0,
          deliveryFee: 50,
          total: 500,
          status: 'delivered',
          createdAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
          updatedAt: new Date(Date.now() - i * 3600000).toISOString()
        },
        tier: i === 0 ? 'Gold VIP' : i === 1 ? 'Silver Barista' : 'Standard Guest'
      });
    });
  }

  const customerList = Array.from(customerMap.values());

  const filteredCustomers = customerList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-5">
      
      {/* Header & Filter Bar */}
      <div className="bg-white rounded-3xl p-6 border border-stone-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-stone-900">Customer Directory &amp; CRM</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Click any row or ordered items badge to expand full itemized breakdown without clipping.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 text-xs rounded-xl pl-9 pr-3 py-2 border border-stone-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Tier filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="bg-stone-50 text-xs rounded-xl px-3 py-2 border border-stone-200 focus:outline-none focus:border-blue-500 text-stone-700 cursor-pointer"
          >
            <option value="all">All Tiers ({customerList.length})</option>
            <option value="Gold VIP">Gold VIP</option>
            <option value="Silver Barista">Silver Barista</option>
            <option value="Standard Guest">Standard Guest</option>
          </select>
        </div>
      </div>

      {/* Customer Table with Expandable Full Item Breakdown */}
      <div className="bg-white rounded-3xl border border-stone-100/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-stone-50/80 border-b border-stone-100 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5 w-10 text-center">#</th>
                <th className="py-3.5 px-5">Customer &amp; Location</th>
                <th className="py-3.5 px-5">Contact</th>
                <th className="py-3.5 px-5">Tier</th>
                <th className="py-3.5 px-5">Latest Ordered Items</th>
                <th className="py-3.5 px-5 text-center">Orders</th>
                <th className="py-3.5 px-5 text-right">Total Spent</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isExpanded = expandedCustomerIds.has(cust.id);
                  const itemsCount = cust.latestOrder.items.length;

                  return (
                    <React.Fragment key={cust.id}>
                      <tr
                        onClick={() => toggleExpandCustomer(cust.id)}
                        className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* Expand Toggle */}
                        <td className="py-4 px-5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandCustomer(cust.id);
                            }}
                            className="p-1 rounded-lg hover:bg-stone-200/60 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                            title={isExpanded ? 'Collapse items' : 'Expand full items'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-sm border border-orange-200 shrink-0">
                              {cust.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-stone-900 block">{cust.name}</span>
                              {cust.address && (
                                <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                  <span>{cust.address}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-4 px-5 font-mono text-stone-600 whitespace-nowrap">
                          {cust.phone}
                        </td>

                        {/* Tier */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                              cust.tier === 'Gold VIP'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : cust.tier === 'Silver Barista'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            <Award className="w-3 h-3" />
                            {cust.tier}
                          </span>
                        </td>

                        {/* Clickable Ordered Items Column (Full Visibility) */}
                        <td className="py-4 px-5">
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {cust.latestOrder.items.slice(0, 2).map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-stone-200/80 transition-colors"
                              >
                                <Coffee className="w-3 h-3 text-amber-600" />
                                <span>{item.quantity}x {item.productName}</span>
                              </span>
                            ))}
                            {itemsCount > 2 && (
                              <span className="inline-flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                +{itemsCount - 2} more items
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Orders count */}
                        <td className="py-4 px-5 text-center font-bold text-stone-900">
                          {cust.totalOrders}
                        </td>

                        {/* Total Spent */}
                        <td className="py-4 px-5 text-right font-bold text-stone-900 font-mono whitespace-nowrap">
                          {formatPeso(cust.totalSpent)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCustomerOrder(cust.latestOrder);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-[11px] transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full Modal</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Sub-Row: FULL ITEM DETAILS NEVER CUT OFF */}
                      {isExpanded && (
                        <tr className="bg-stone-50/70 border-b border-stone-200/80">
                          <td colSpan={8} className="p-4 sm:p-5">
                            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                                    <span>Latest Order: {cust.latestOrder.orderNumber}</span>
                                  </span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                                    {cust.latestOrder.deliveryType === 'delivery' ? '🚗 Door Delivery' : '🏪 Pickup'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-stone-500">
                                    Date: <span className="font-semibold text-stone-800">{new Date(cust.latestOrder.createdAt).toLocaleString()}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onSelectCustomerOrder(cust.latestOrder)}
                                    className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 text-[11px] cursor-pointer"
                                  >
                                    <span>Open Complete Customer &amp; Map Modal</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Full Itemized Table Inside Expanded Row */}
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                                  Itemized Dishes &amp; Customizations:
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                  {cust.latestOrder.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 flex items-start justify-between gap-3 text-xs"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 font-bold text-stone-900">
                                          <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                                            {item.quantity}x
                                          </span>
                                          <span className="break-words">{item.productName}</span>
                                        </div>
                                        {item.notes && (
                                          <span className="text-[11px] text-amber-800 font-medium block mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                                            Notes: {item.notes}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="font-mono font-bold text-stone-900 block">
                                          {formatPeso(item.subtotal)}
                                        </span>
                                        <span className="text-[10px] text-stone-400 font-mono">
                                          {formatPeso(item.unitPrice)} each
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Total summary footer */}
                              <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs gap-3 font-semibold">
                                <div className="flex items-center gap-4 text-stone-600">
                                  <span>Subtotal: <strong className="text-stone-900">{formatPeso(cust.latestOrder.subtotal)}</strong></span>
                                  <span>Delivery: <strong className="text-stone-900">{formatPeso(cust.latestOrder.deliveryFee)}</strong></span>
                                  <span>Payment: <strong className="uppercase text-stone-900">{cust.latestOrder.paymentMethod}</strong></span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-stone-500 mr-2">Grand Total:</span>
                                  <span className="text-base font-bold text-amber-700 font-mono">
                                    {formatPeso(cust.latestOrder.total)}
                                  </span>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
