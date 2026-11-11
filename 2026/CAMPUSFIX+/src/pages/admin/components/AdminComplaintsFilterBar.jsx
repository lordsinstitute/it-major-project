/**
 * AdminComplaintsFilterBar — Multi-criteria filtering toolbar with interactive filter chips.
 */
import { Search, X, Filter } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { ALL_STATUSES, STATUS_META } from '../../../constants/statuses';
import { ALL_PRIORITIES, PRIORITY_META } from '../../../constants/priorities';
import { CATEGORIES } from '../../../constants/categories';
import { ALL_DEPARTMENTS, DEPARTMENT_META } from '../../../constants/departments';
import { CAMPUS } from '../../../constants/campus';

export default function AdminComplaintsFilterBar({ filters = {}, onFilterChange, onReset }) {
  const activeChips = Object.entries(filters).filter(
    ([k, v]) => v && v !== 'ALL' && !['page', 'size', 'sort', 'order'].includes(k)
  );

  return (
    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search ID, title, keyword..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 0 })}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status */}
        <select
          value={filters.status || 'ALL'}
          onChange={(e) => onFilterChange({ status: e.target.value, page: 0 })}
          className="text-xs rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">Status: All</option>
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>{STATUS_META[st]?.label || st}</option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={filters.priority || 'ALL'}
          onChange={(e) => onFilterChange({ priority: e.target.value, page: 0 })}
          className="text-xs rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">Priority: All</option>
          {ALL_PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_META[p]?.label || p}</option>
          ))}
        </select>

        {/* Department */}
        <select
          value={filters.department || 'ALL'}
          onChange={(e) => onFilterChange({ department: e.target.value, page: 0 })}
          className="text-xs rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">Dept: All</option>
          {ALL_DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{DEPARTMENT_META[d]?.shortLabel || d}</option>
          ))}
        </select>

        {/* Building */}
        <select
          value={filters.building || 'ALL'}
          onChange={(e) => onFilterChange({ building: e.target.value, page: 0 })}
          className="text-xs rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">Building: All</option>
          {CAMPUS.buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name.split('—')[0].trim()}</option>
          ))}
        </select>
      </div>

      {/* Filter Chips Bar */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>
          {activeChips.map(([key, val]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
            >
              <span className="font-semibold capitalize">{key}:</span> {val}
              <button
                type="button"
                onClick={() => onFilterChange({ [key]: '', page: 0 })}
                className="hover:text-indigo-900 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <Button variant="ghost" size="xs" onClick={onReset} className="text-xs text-rose-600 hover:text-rose-700">
            Reset All
          </Button>
        </div>
      )}
    </div>
  );
}
