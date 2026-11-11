/**
 * PrototypeBanner — clearly labels a page or section as prototype data.
 *
 * Props:
 *   message : string (optional override)
 *   compact : boolean — smaller inline variant
 */
import React from 'react';
import { FlaskConical } from 'lucide-react';

export default function PrototypeBanner({
  message = 'Prototype data — all records, users, and statistics are sample data for demonstration purposes only.',
  compact = false,
}) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-0.5 text-xs font-medium">
        <FlaskConical size={11} aria-hidden="true" />
        Prototype data
      </span>
    );
  }

  return (
    <div className="prototype-banner" role="status" aria-live="polite">
      <FlaskConical size={16} className="shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
