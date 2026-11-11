import React from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen, Search, Command } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import NotificationDropdown from './NotificationDropdown';
import UserMenu from './UserMenu';

export default function Topbar({ onToggleMobile, onToggleSidebar, sidebarCollapsed }) {
  const { role } = useAuth();

  const roleBadgeColors = {
    [ROLES.STUDENT]: 'bg-primary-50 text-primary-700 border-primary-200',
    [ROLES.ADMIN]: 'bg-amber-50 text-amber-800 border-amber-200',
    [ROLES.STAFF]: 'bg-teal-50 text-teal-800 border-teal-200',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      
      {/* Left Area: Toggle controls & search */}
      <div className="flex items-center gap-3">
        {/* Mobile drawer trigger */}
        <button
          type="button"
          onClick={onToggleMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          aria-label="Open mobile navigation drawer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar collapse trigger */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {/* Global Search Input (UI placeholder for Chunk 10) */}
        <div className="relative hidden w-64 sm:block lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search tickets, rooms, staff..."
            aria-label="Global search (Available in Chunk 10)"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-14 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>
      </div>

      {/* Right Area: Role chip, notifications, user menu */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Role Chip */}
        <span
          className={`hidden rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider sm:inline-block ${
            roleBadgeColors[role] || 'bg-slate-100 text-slate-700'
          }`}
        >
          {role}
        </span>

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Account Menu */}
        <UserMenu />
      </div>

    </header>
  );
}
