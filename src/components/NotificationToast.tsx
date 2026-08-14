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
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-slate-900 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow-md shadow-amber-500/30 animate-bounce">
          <Bell className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">
              New Order Received!
            </span>
            <button onClick={onDismiss} className="text-slate-500 hover:text-white text-xs">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <h4 className="text-xs font-bold text-white mt-0.5">{notification.message}</h4>
          
          <p className="text-[11px] text-slate-400 mt-1">
            Customer: {notification.customerName} • Total: {formatPeso(notification.totalAmount)}
          </p>

          <button
            onClick={() => {
              onViewOrders();
              onDismiss();
            }}
            className="mt-2 text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            Open Admin Orders <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
