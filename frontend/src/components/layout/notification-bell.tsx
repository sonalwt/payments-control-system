'use client';

import { useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import type { AppNotification } from '@/types/domain';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationItem({
  n,
  onRead,
}: {
  n: AppNotification;
  onRead: (id: string) => void;
}) {
  return (
    <button
      onClick={() => !n.isRead && onRead(n.id)}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
        n.isRead ? 'opacity-60' : 'bg-blue-50/40'
      }`}
    >
      <div className="flex items-start gap-2">
        {!n.isRead && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        )}
        {n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
          <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => { markAllRead(); }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    n={n}
                    onRead={(id) => { markRead(id); }}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
