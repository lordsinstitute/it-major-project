/**
 * StaffTasksFilterBar — Filter toolbar tailored for maintenance technicians.
 */
import { Search, Filter, X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { STATUSES, STATUS_META } from '../../../constants/statuses';
import { ALL_PRIORITIES, PRIORITY_META } from '../../../constants/priorities';
import { CAMPUS } from '../../../constants/campus';

export default function StaffTasksFilterBar({ filters = {}, onFilterChange, onReset }) {
  const activeChips = Object.entries(filters).filter(
    ([k, v]) => v && v !== 'ALL' && !['page', 'size', 'sort', 'order'].includes(k)
  );

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search task title or ID..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] sm:min-h-0"
          />
        </div>

        <select
          value={filters.status || 'ALL'}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className="text-xs rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] sm:min-h-0"
        >
          <option value="ALL">All Statuses</option>
          {[STATUSES.ASSIGNED, STATUSES.IN_PROGRESS, STATUSES.REOPENED, STATUSES.RESOLVED, STATUSES.VERIFIED].map(
            (st) => (
              <option key={st} value={st}>
                {STATUS_META[st]?.label || st}
              </option>
            )
          )}
        </select>

        <select
          value={filters.priority || 'ALL'}
          onChange={(e) => onFilterChange({ priority: e.target.value })}
          className="text-xs rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] sm:min-h-0"
        >
          <option value="ALL">All Priorities</option>
          {ALL_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p]?.label || p}
            </option>
          ))}
        </select>

        <select
          value={filters.building || 'ALL'}
          onChange={(e) => onFilterChange({ building: e.target.value })}
          className="text-xs rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] sm:min-h-0"
        >
          <option value="ALL">All Buildings</option>
          {CAMPUS.buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name.split('—')[0].trim()}
            </option>
          ))}
        </select>
      </div>

      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>
          {activeChips.map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
            >
              <span className="font-semibold capitalize">{k}:</span> {v}
              <button
                type="button"
                onClick={() => onFilterChange({ [k]: '' })}
                className="hover:text-amber-950 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <Button variant="ghost" size="xs" onClick={onReset} className="text-xs text-rose-600">
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
