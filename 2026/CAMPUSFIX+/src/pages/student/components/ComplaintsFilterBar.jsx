import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { STATUSES } from '../../../constants/statuses';
import { CATEGORIES } from '../../../constants/categories';
import { PRIORITIES } from '../../../constants/priorities';

export default function ComplaintsFilterBar({
  search,
  status,
  category,
  priority,
  onUpdateFilter,
  onReset,
}) {
  const hasActiveFilters = Boolean(search || status || category || priority);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onUpdateFilter('search', e.target.value)}
            placeholder="Search by title or description..."
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => onUpdateFilter('status', e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-600"
            aria-label="Filter by Status"
          >
            <option value="">All Statuses</option>
            {Object.values(STATUSES).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => onUpdateFilter('category', e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-600"
            aria-label="Filter by Category"
          >
            <option value="">All Categories</option>
            {Object.values(CATEGORIES).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => onUpdateFilter('priority', e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-600"
            aria-label="Filter by Priority"
          >
            <option value="">All Priorities</option>
            {Object.values(PRIORITIES).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-2.5 text-xs text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
