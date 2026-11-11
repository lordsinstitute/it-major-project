/**
 * StaffHistory — Archive of tasks completed, resolved, and verified for the logged-in technician.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle2, RefreshCw, Eye } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import { getAllComplaintsRaw } from '../../services/complaintService';
import { STATUSES } from '../../constants/statuses';
import { useAuth } from '../../context/AuthContext';

export default function StaffHistory() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadHistory = async () => {
    try {
      setLoading(true);
      const all = await getAllComplaintsRaw();
      const myCompleted = all.filter(
        (c) =>
          (c.assignedTo === user?.id || c.assignedTo === user?.name) &&
          [STATUSES.RESOLVED, STATUSES.VERIFIED].includes(c.status)
      );
      setTasks(myCompleted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const filtered = tasks.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Completed Task History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Archived log of repairs resolved with documented diagnostics and visual proof.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          iconLeft={RefreshCw}
          loading={loading}
          onClick={loadHistory}
          className="min-h-[44px] sm:min-h-0"
        >
          Refresh
        </Button>
      </div>

      <PrototypeBanner />

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search completed tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] sm:min-h-0"
          />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            No completed tasks recorded in your archive.
          </div>
        ) : (
          filtered.map((t) => (
            <Card key={t.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600">{t.id}</span>
                <StatusBadge status={t.status} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-2">
                {t.resolutionDetails?.note || t.description}
              </p>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Closed: {new Date(t.resolvedAt || t.updatedAt).toLocaleDateString()}</span>
                <Link to={`/staff/tasks/${t.id}`}>
                  <Button variant="ghost" size="xs" iconRight={Eye} className="min-h-[36px]">
                    Dossier
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Task ID</th>
              <th className="py-3 px-4">Title & Location</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Cause Diagnosis</th>
              <th className="py-3 px-4">Resolved Date</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No completed tasks recorded in your archive.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-medium text-indigo-600">{t.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{t.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {t.location?.buildingName || t.location?.building} • Room {t.location?.room || 'N/A'}
                    </div>
                  </td>
                  <td className="py-3 px-4"><PriorityBadge priority={t.priority} /></td>
                  <td className="py-3 px-4"><StatusBadge status={t.status} /></td>
                  <td className="py-3 px-4 text-slate-600">
                    {t.resolutionDetails?.causeCategory || 'Wear & Tear'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(t.resolvedAt || t.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to={`/staff/tasks/${t.id}`}>
                      <Button variant="ghost" size="xs" iconLeft={Eye}>
                        Review
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
