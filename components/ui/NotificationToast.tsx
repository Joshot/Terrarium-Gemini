'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { Info, X } from 'lucide-react';

export default function NotificationToast() {
  const notification = useGameStore((state) => state.notification);
  const dismissNotification = useGameStore((state) => state.dismissNotification);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      dismissNotification();
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification, dismissNotification]);

  if (!notification) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 pointer-events-none select-none">
      <div className="pointer-events-auto bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 truncate">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate font-medium">{notification}</span>
        </div>
        <button
          onClick={dismissNotification}
          className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
          title="Dismiss"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
