import React from 'react';
import StatusBadge from '../../../../components/ui/StatusBadge';
import { Clock, User } from 'lucide-react';

export default function StatusTimeline({ timeline = [] }) {
  if (timeline.length === 0) {
    return <p className="text-xs text-slate-400 italic">No timeline entries recorded.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-primary-600" />
        <span>Audit Trail Timeline</span>
      </h3>

      <div className="relative border-l-2 border-slate-200 ml-2 space-y-4 py-1">
        {timeline.map((step, idx) => {
          const isLatest = idx === timeline.length - 1;
          return (
            <div key={idx} className="relative pl-5 text-xs">
              {/* Dot */}
              <span
                className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${
                  isLatest ? 'bg-primary-600 ring-4 ring-primary-100' : 'bg-slate-400'
                }`}
              />

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={step.status} />
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(step.at).toLocaleString()}
                </span>
              </div>

              {step.note && (
                <p className="mt-1 text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] leading-relaxed">
                  {step.note}
                </p>
              )}

              {step.by && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                  <User className="h-3 w-3" />
                  <span>Logged by: {step.by}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
