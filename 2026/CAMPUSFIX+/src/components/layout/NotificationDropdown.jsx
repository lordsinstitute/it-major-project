import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import * as notificationService from '../../services/notificationService';

export default function NotificationDropdown() {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    async function load() {
      try {
        const notifs = await notificationService.getNotifications(user.id);
        if (isMounted) {
          setNotifications(notifs.slice(0, 5));
          setUnreadCount(notifs.filter((n) => !n.read).length);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [user]);

  // Click outside and Esc key listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleMarkAll() {
    if (!user) return;
    await notificationService.markAllRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  const rolePrefix = role ? role.toLowerCase() : 'student';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-800">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-[11px] font-medium text-primary-600 hover:text-primary-700"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No recent notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3.5 text-xs transition-colors ${n.read ? 'bg-white' : 'bg-primary-50/30'}`}>
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">{n.body}</p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 p-2 text-center">
            <Link
              to={`/${rolePrefix}/notifications`}
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              View All Notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
