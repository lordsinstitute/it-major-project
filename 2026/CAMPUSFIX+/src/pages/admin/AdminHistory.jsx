/**
 * AdminHistory — Historical repository of resolved, verified, and rejected complaints with CSV export.
 */
import { useState, useEffect } from 'react';
import { Download, Search, History, Eye, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import StatusTimeline from '../student/components/detail/StatusTimeline';
import { getAllComplaintsRaw } from '../../services/complaintService';
import { STATUSES } from '../../constants/statuses';
import { exportToCsv } from '../../utils/exportCsv';
import { useToast } from '../../hooks/useToast';

export default function AdminHistory() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [selectedForAudit, setSelectedForAudit] = useState(null);
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

  const historyItems = complaints
    .filter((c) => [STATUSES.VERIFIED, STATUSES.RESOLVED, STATUSES.REJECTED].includes(c.status))
    .filter((c) => outcomeFilter === 'ALL' || c.status === outcomeFilter)
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    });

  const handleExportCsv = () => {
    if (historyItems.length === 0) {
      toast.warning('No complaints to export.');
      return;
    }
    const headers = [
      { label: 'Complaint ID', key: 'id' },
      { label: 'Title', key: 'title' },
      { label: 'Category', key: 'category' },
      { label: 'Priority', key: 'priority' },
      { label: 'Final Status', key: 'status' },
      { label: 'Department', key: 'department' },
      { label: 'Technician', key: 'assignedTo' },
      { label: 'Reported By', key: 'reportedBy' },
      { label: 'Created At', key: 'createdAt' },
      { label: 'Resolved At', key: 'resolvedAt' },
      { label: 'Verified At', key: 'verifiedAt' },
    ];
    const today = new Date().toISOString().split('T')[0];
    exportToCsv(`campusfix-complaints-history-${today}.csv`, headers, historyItems);
    toast.success(`Exported ${historyItems.length} records to CSV.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complaint Archive & Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete historical registry of resolved maintenance cases and administrative dispositions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" iconLeft={RefreshCw} loading={loading} onClick={loadData}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" iconLeft={Download} onClick={handleExportCsv}>
            Export Audit CSV
          </Button>
        </div>
      </div>

      <PrototypeBanner />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search archived complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {['ALL', STATUSES.VERIFIED, STATUSES.RESOLVED, STATUSES.REJECTED].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setOutcomeFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                outcomeFilter === st ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Archived Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Outcome Status</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Closed Date</th>
                <th className="py-3 px-4 text-right">Audit Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No closed complaints match the search query.
                  </td>
                </tr>
              ) : (
                historyItems.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600">{c.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{c.title}</td>
                    <td className="py-3 px-4"><PriorityBadge priority={c.priority} /></td>
                    <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3 px-4 text-slate-600">{c.department || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(c.verifiedAt || c.resolvedAt || c.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="xs" iconLeft={History} onClick={() => setSelectedForAudit(c)}>
                        Timeline
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Timeline Modal */}
      <Modal
        isOpen={Boolean(selectedForAudit)}
        onClose={() => setSelectedForAudit(null)}
        title={`Audit Trail: ${selectedForAudit?.id}`}
        description="Immutable chronological lifecycle events recorded for this complaint."
      >
        <div className="pt-2 max-h-96 overflow-y-auto">
          {selectedForAudit && <StatusTimeline timeline={selectedForAudit.timeline} />}
        </div>
      </Modal>
    </div>
  );
}
