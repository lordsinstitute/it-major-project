import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Wrench, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNavForRole, COMING_SOON_MODULES_NAV } from '../../constants/navigation';
import NavIcon from '../common/NavIcon';
import ComingSoonBadge from '../ui/ComingSoonBadge';

export default function Sidebar({ collapsed }) {
  const { role, user } = useAuth();
  const [modulesExpanded, setModulesExpanded] = useState(false);
  const navItems = getNavForRole(role);

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-slate-200 bg-white transition-[width] duration-300 ease-in-out shrink-0 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-4">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white shadow-sm">
            <Wrench className="h-5 w-5" aria-hidden="true" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold tracking-tight text-slate-900 truncate">
              CampusFix<span className="text-primary-600">+</span>
            </span>
          )}
        </Link>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        
        {/* Role-Specific Primary Nav */}
        <div>
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {role} Workspace
            </p>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <NavIcon name={item.icon} className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Coming Soon Research Modules Group */}
        <div className="border-t border-slate-100 pt-4">
          {!collapsed ? (
            <div>
              <button
                type="button"
                onClick={() => setModulesExpanded(!modulesExpanded)}
                className="flex w-full items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                aria-expanded={modulesExpanded}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-teal-600" />
                  <span>Research Modules</span>
                </span>
                {modulesExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>

              {modulesExpanded && (
                <div className="mt-1 space-y-1">
                  {COMING_SOON_MODULES_NAV.map((mod) => (
                    <Link
                      key={mod.href}
                      to={mod.href}
                      className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                    >
                      <span className="truncate">{mod.label}</span>
                      <ComingSoonBadge />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center" title="Research Modules (Coming Soon)">
              <Link to="/modules" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-teal-600">
                <Sparkles className="h-4.5 w-4.5" />
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="border-t border-slate-100 p-3 bg-slate-50/50">
          <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-xs">
            <p className="font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.department || role}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
