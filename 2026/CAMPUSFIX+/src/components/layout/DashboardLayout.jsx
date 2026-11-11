import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import Topbar from './Topbar';
import DynamicBreadcrumbs from './DynamicBreadcrumbs';
import { ShieldAlert } from 'lucide-react';

const SIDEBAR_STORAGE_KEY = 'campusfix_sidebar_collapsed';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Persist sidebar collapsed preference in localStorage (UI preference only)
  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Safe fallback
      }
      return next;
    });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 antialiased">
      {/* Accessible Skip Link */}
      <a
        href="#main-dashboard-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Desktop Collapsible Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Mobile Slide-Over Drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Right Column: Topbar + Scrollable Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        
        {/* Slim Prototype Banner Strip */}
        <div className="flex h-7 items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-3 text-[11px] font-semibold text-amber-900 shrink-0">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          <span>Prototype build: sample data · Evaluating role workflows</span>
        </div>

        {/* Sticky Topbar */}
        <Topbar
          onToggleMobile={() => setMobileOpen(true)}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Scrollable Viewport Container */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-4">
            {/* Route-driven Dynamic Breadcrumbs */}
            <DynamicBreadcrumbs />

            {/* Injected Portal Route View */}
            <main id="main-dashboard-content" tabIndex={-1} className="focus:outline-none">
              <Outlet />
            </main>
          </div>
        </div>

      </div>
    </div>
  );
}
