/**
 * AdminPriorities — Priority management and SLA target calibration queue.
 */
import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck, RefreshCw, Edit3 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import PriorityBadge from '../../components/ui/PriorityBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import { ALL_PRIORITIES, PRIORITY_META } from '../../constants/priorities';
import { getAllComplaintsRaw, setPriority } from '../../services/complaintService';
import { isComplaintOverdue, getRemainingHours } from '../../utils/sla';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function AdminPriorities() {
  const [complaints, setComplaints] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [newPriority, setNewPriority] = useState('');
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllComplaintsRaw();
      setComplaints(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (c) => {
    setActiveComplaint(c);
    setNewPriority(c.priority);
  };

  const handleSavePriority = async (e) => {
    e.preventDefault();
    if (!activeComplaint || !newPriority) return;
    try {
      setUpdating(true);
      await setPriority(activeComplaint.id, {
        priority: newPriority,
        note: `Priority recalibrated to ${newPriority} by Admin (SLA: ${PRIORITY_META[newPriority]?.resolutionHours}h)`,
        by: user?.name || 'Administrator',
      });
      toast.success(`Priority updated for ${activeComplaint.id}.`);
      setActiveComplaint(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update priority.');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = complaints.filter(
    (c) => selectedFilter === 'ALL' || c.priority === selectedFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Priority & SLA Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enforce institutional Service Level Agreements and escalate urgent campus hazards.
          </p>
        </div>
        <Button variant="outline" size="sm" iconLeft={RefreshCw} loading={loading} onClick={loadData}>
          Refresh Queue
        </Button>
      </div>

      <PrototypeBanner />

      {/* Priority Level Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ALL_PRIORITIES.map((p) => {
          const meta = PRIORITY_META[p];
          const count = complaints.filter((c) => c.priority === p).length;
          return (
            <Card
              key={p}
              hoverable
              onClick={() => setSelectedFilter(selectedFilter === p ? 'ALL' : p)}
              className={`p-4 cursor-pointer transition-all ${
                selectedFilter === p ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">{meta.label}</span>
                <span className="text-xs font-semibold text-slate-500">{meta.resolutionHours}h SLA</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{count}</div>
              <p className="text-xs text-slate-500 mt-1">Total active tickets</p>
            </Card>
          );
        })}
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Title & Location</th>
                <th className="py-3 px-4">Priority & SLA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Remaining Window</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const overdue = isComplaintOverdue(c);
                const remaining = getRemainingHours(c);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600">{c.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {c.location?.buildingName || c.location?.building} • Room {c.location?.room || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4"><PriorityBadge priority={c.priority} /></td>
                    <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3 px-4">
                      {overdue ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Overdue ({Math.abs(remaining)}h)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" /> ~{Math.max(0, remaining)}h remaining
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="xs" iconLeft={Edit3} onClick={() => handleOpenEdit(c)}>
                        Calibrate
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recalibration Modal */}
      <Modal
        isOpen={Boolean(activeComplaint)}
        onClose={() => setActiveComplaint(null)}
        title={`Recalibrate Priority (${activeComplaint?.id})`}
        description="Select new urgency tier. This recalculates the target resolution deadline and appends an audit record."
      >
        <form onSubmit={handleSavePriority} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Priority Level
            </label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ALL_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p]?.label} — {PRIORITY_META[p]?.resolutionHours} Hours SLA
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setActiveComplaint(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={updating}>
              Confirm Recalibration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
