import React, { useEffect } from 'react';
import { Bell, ArrowRight, X } from 'lucide-react';
import { AdminNotification } from '../types';
import { formatPeso } from '../utils/format';

interface NotificationToastProps {
  notification: AdminNotification | null;
  onDismiss: () => void;
  onViewOrders: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onViewOrders
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-white border border-amber-300 rounded-xl p-4 shadow-xl text-stone-900 animate-in slide-in-from-top-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center font-bold flex-shrink-0">
          <Bell className="w-4 h-4 text-amber-700" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">
              New Order Received
            </span>
            <button onClick={onDismiss} className="text-stone-400 hover:text-stone-700 text-xs">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <h4 className="text-xs font-bold text-stone-900 mt-0.5">{notification.message}</h4>
          
          <p className="text-[11px] text-stone-600 mt-1">
            Customer: {notification.customerName} • Total: {formatPeso(notification.totalAmount)}
          </p>

          <button
            onClick={() => {
              onViewOrders();
              onDismiss();
            }}
            className="mt-2 text-xs font-bold text-amber-800 hover:underline flex items-center gap-1"
          >
            Open Admin Orders <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
