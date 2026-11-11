/**
 * EmptyState — shown when a data view has no records.
 *
 * Props:
 *   icon    : ReactNode
 *   title   : string
 *   message : string
 *   action  : ReactNode (optional CTA)
 */
import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon, title = 'Nothing here yet', message, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <span className="mb-4 text-slate-300">
        {icon ?? <Inbox size={48} strokeWidth={1.5} />}
      </span>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-slate-500 max-w-xs">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
