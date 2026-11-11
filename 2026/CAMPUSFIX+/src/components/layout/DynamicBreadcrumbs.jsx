import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  student: 'Student Portal',
  admin: 'Administrator',
  staff: 'Maintenance Staff',
  dashboard: 'Dashboard',
  report: 'Report Issue',
  complaints: 'Complaints',
  assignments: 'Assignments',
  priorities: 'Priorities',
  users: 'Users',
  history: 'History',
  analytics: 'Analytics',
  notifications: 'Notifications',
  profile: 'Profile',
  settings: 'Settings',
  tasks: 'Assigned Tasks',
  modules: 'Research Modules',
};

export default function DynamicBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, idx) => {
    const url = `/${segments.slice(0, idx + 1).join('/')}`;
    const label = ROUTE_LABELS[seg.toLowerCase()] || seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = idx === segments.length - 1;
    return { url, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500">
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-600 rounded"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.url} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" aria-hidden="true" />
            {crumb.isLast ? (
              <span className="font-semibold text-slate-900" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.url}
                className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-600 rounded"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
