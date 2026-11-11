import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ClipboardList, CheckCircle, Bell, ArrowRight } from 'lucide-react';

const ACTIONS = [
  {
    title: 'Report an Issue',
    description: 'Log a new maintenance request with location and photo evidence.',
    href: '/student/report',
    icon: PlusCircle,
    color: 'bg-primary-50 text-primary-700 border-primary-200',
  },
  {
    title: 'View My Complaints',
    description: 'Review your full ticket history, status updates, and timeline remarks.',
    href: '/student/complaints',
    icon: ClipboardList,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    title: 'Verify Resolved Work',
    description: 'Review fixes completed by technicians and sign off on verified tickets.',
    href: '/student/complaints?status=RESOLVED',
    icon: CheckCircle,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    title: 'Open Notifications',
    description: 'View in-app alerts on status transitions, assignments, and notes.',
    href: '/student/notifications',
    icon: Bell,
    color: 'bg-amber-50 text-amber-800 border-amber-200',
  },
];

export default function StudentQuickActions() {
  return (
    <div>
      <h2 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              to={act.href}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-primary-400 hover:shadow-sm"
            >
              <div>
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${act.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-3 text-xs font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                  {act.title}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{act.description}</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-primary-600">
                <span>Open</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
