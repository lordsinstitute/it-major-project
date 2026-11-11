import React, { useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { X, Wrench, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNavForRole, COMING_SOON_MODULES_NAV } from '../../constants/navigation';
import NavIcon from '../common/NavIcon';
import ComingSoonBadge from '../ui/ComingSoonBadge';
import Button from '../ui/Button';

export default function MobileDrawer({ open, onClose }) {
  const { role, user, logout } = useAuth();
  const drawerRef = useRef(null);
  const navigate = useNavigate();
  const navItems = getNavForRole(role);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) onClose();
    }
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      drawerRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleLogout() {
    onClose();
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Navigation drawer">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-2xl focus:outline-none"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Wrench className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-slate-900">
              CampusFix<span className="text-primary-600">+</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info Strip */}
        <div className="border-b border-slate-100 bg-slate-50/70 p-4 text-xs">
          <p className="font-bold text-slate-900">{user?.name}</p>
          <p className="text-slate-500">{user?.email}</p>
          <span className="mt-1.5 inline-block rounded bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 border border-primary-200">
            {role} PORTAL
          </span>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <NavIcon name={item.icon} className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Coming Soon Research Modules */}
          <div className="border-t border-slate-100 pt-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Research Modules
            </p>
            <div className="space-y-1">
              {COMING_SOON_MODULES_NAV.map((mod) => (
                <Link
                  key={mod.href}
                  to={mod.href}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-100"
                >
                  <span className="truncate">{mod.label}</span>
                  <ComingSoonBadge />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="border-t border-slate-100 p-4">
          <Button
            variant="outline"
            className="w-full justify-center text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-slate-200"
            icon={<LogOut className="h-4 w-4" />}
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
