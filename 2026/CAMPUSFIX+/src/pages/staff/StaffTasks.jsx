/**
 * StaffTasks — Responsive assigned task queue (card list on mobile, data table on desktop).
 */
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowUpDown, RefreshCw, Eye, AlertTriangle, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import StaffTaskCard from './components/StaffTaskCard';
import StaffTasksFilterBar from './components/StaffTasksFilterBar';
import { getAllComplaintsRaw } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { isComplaintOverdue, getRemainingHours } from '../../utils/sla';

export default function StaffTasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('asc'); // asc = urgent/overdue first
  const { user } = useAuth();
  const navigate = useNavigate();

  const filters = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'ALL',
    priority: searchParams.get('priority') || 'ALL',
    building: searchParams.get('building') || 'ALL',
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const all = await getAllComplaintsRaw();
      const myTasks = all.filter(
        (c) => c.assignedTo === user?.id || c.assignedTo === user?.name
      );
      setTasks(myTasks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  const handleFilterChange = (updates) => {
    const updated = { ...filters, ...updates };
    const p = new URLSearchParams();
    Object.entries(updated).forEach(([k, v]) => {
      if (v && v !== 'ALL') p.set(k, v);
    });
    setSearchParams(p);
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (filters.status !== 'ALL' && t.status !== filters.status) return false;
        if (filters.priority !== 'ALL' && t.priority !== filters.priority) return false;
        if (filters.building !== 'ALL' && t.location?.building !== filters.building && t.location?.buildingId !== filters.building) {
          return false;
        }
        if (filters.search) {
          const q = filters.search.toLowerCase();
          return t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        const aRem = getRemainingHours(a);
        const bRem = getRemainingHours(b);
        return sortOrder === 'asc' ? aRem - bRem : bRem - aRem;
      });
  }, [tasks, filters, sortOrder]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Assigned Maintenance Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse active repair orders, inspect campus locations, and advance task statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            iconLeft={ArrowUpDown}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="min-h-[44px] sm:min-h-0"
          >
            Due Window ({sortOrder === 'asc' ? 'Urgent First' : 'Latest First'})
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconLeft={RefreshCw}
            loading={loading}
            onClick={loadTasks}
            className="min-h-[44px] sm:min-h-0"
          >
            Refresh
          </Button>
        </div>
      </div>

      <PrototypeBanner />

      <StaffTasksFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={() => setSearchParams(new URLSearchParams())}
      />

      {/* Mobile Card List */}
      <div className="block md:hidden space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            No maintenance tasks match the selected criteria.
          </div>
        ) : (
          filteredTasks.map((t) => <StaffTaskCard key={t.id} task={t} />)
        )}
      </div>

      {/* Desktop Data Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Task ID</th>
              <th className="py-3 px-4">Issue & Spatial Coordinates</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">SLA Deadline Window</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No maintenance tasks match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredTasks.map((t) => {
                const overdue = isComplaintOverdue(t);
                const remaining = getRemainingHours(t);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600">{t.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{t.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {t.location?.buildingName || t.location?.building} • Room {t.location?.room || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.category}</td>
                    <td className="py-3 px-4"><PriorityBadge priority={t.priority} /></td>
                    <td className="py-3 px-4"><StatusBadge status={t.status} /></td>
                    <td className="py-3 px-4">
                      {overdue ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Overdue ({Math.abs(remaining)}h)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" /> ~{Math.max(0, remaining)}h remaining
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="primary"
                        size="xs"
                        iconLeft={Eye}
                        onClick={() => navigate(`/staff/tasks/${t.id}`)}
                      >
                        Action
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
