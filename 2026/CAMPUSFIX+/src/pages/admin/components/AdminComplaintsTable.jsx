/**
 * AdminComplaintsTable — Paginated data table with multi-select checkboxes and sorting.
 */
import { ArrowUpDown, Eye, CheckSquare, Square } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import PriorityBadge from '../../../components/ui/PriorityBadge';
import Button from '../../../components/ui/Button';
import { DEPARTMENT_META } from '../../../constants/departments';

export default function AdminComplaintsTable({
  complaints = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onSort,
  currentSort = 'createdAt',
  currentOrder = 'desc',
  page = 0,
  totalPages = 1,
  totalElements = 0,
  onPageChange,
  onOpenDetail,
}) {
  const allSelected = complaints.length > 0 && complaints.every((c) => selectedIds.includes(c.id));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 w-10">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="text-slate-500 hover:text-slate-800 focus:outline-none"
                  aria-label="Select all complaints"
                >
                  {allSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="py-3 px-3 cursor-pointer" onClick={() => onSort('id')}>
                <div className="flex items-center gap-1">ID <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-3 px-3 cursor-pointer" onClick={() => onSort('title')}>
                <div className="flex items-center gap-1">Issue & Spatial Details <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-3 px-3 cursor-pointer" onClick={() => onSort('priority')}>
                <div className="flex items-center gap-1">Priority <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-3 px-3 cursor-pointer" onClick={() => onSort('status')}>
                <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-3 px-3">Department</th>
              <th className="py-3 px-3">Assignee</th>
              <th className="py-3 px-3 cursor-pointer" onClick={() => onSort('createdAt')}>
                <div className="flex items-center gap-1">Reported <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  No complaints match the specified filters.
                </td>
              </tr>
            ) : (
              complaints.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleSelect(c.id)}
                        className="text-slate-500 hover:text-slate-800 focus:outline-none"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-indigo-600 whitespace-nowrap">
                      {c.id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 line-clamp-1">{c.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {c.location?.buildingName || c.location?.building} • Room {c.location?.room || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {DEPARTMENT_META[c.department]?.shortLabel || c.department || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {c.assignedTo ? (
                        <span className="font-medium text-slate-800">{c.assignedTo}</span>
                      ) : (
                        <span className="text-amber-600 font-medium">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="xs"
                        iconLeft={Eye}
                        onClick={() => onOpenDetail(c.id)}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {complaints.length > 0 ? page * 10 + 1 : 0} to{' '}
          {Math.min((page + 1) * 10, totalElements)} of {totalElements} complaints
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
          <Button
            variant="outline"
            size="xs"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
