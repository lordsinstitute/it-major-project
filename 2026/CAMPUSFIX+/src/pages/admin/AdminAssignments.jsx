/**
 * AdminAssignments — Dedicated portal for department routing and technician dispatching.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, RefreshCw, UserCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import StaffWorkloadCard from './components/StaffWorkloadCard';
import AdminBulkAssignModal from './components/AdminBulkAssignModal';
import { getAllComplaintsRaw } from '../../services/complaintService';
import { getStaffList } from '../../services/userService';
import { STATUSES } from '../../constants/statuses';

export default function AdminAssignments() {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const [allComplaints, allStaff] = await Promise.all([
        getAllComplaintsRaw(),
        getStaffList(),
      ]);
      setComplaints(allComplaints);
      setStaff(allStaff);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter complaints needing assignment
  const unassignedList = complaints.filter(
    (c) =>
      !c.assignedTo ||
      [STATUSES.SUBMITTED, STATUSES.UNDER_REVIEW, STATUSES.REOPENED].includes(c.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Department Assignment Queue</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
              {unassignedList.length} Pending Dispatch
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Evaluate pending campus tickets and allocate skilled technicians to prevent bottlenecks.
          </p>
        </div>

        <Button variant="outline" size="sm" iconLeft={RefreshCw} loading={loading} onClick={loadData}>
          Refresh Queue
        </Button>
      </div>

      <PrototypeBanner />

      {/* Staff Capacity Overview */}
      <StaffWorkloadCard staff={staff} complaints={complaints} />

      {/* Unassigned Work Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800">Unassigned Tickets</h3>
          </div>
          <span className="text-xs text-slate-500">Showing {unassignedList.length} tickets requiring staff allocation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Title & Location</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reported</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unassignedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    All complaints are currently assigned to maintenance units!
                  </td>
                </tr>
              ) : (
                unassignedList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600">{c.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {c.location?.buildingName || c.location?.building} • Room {c.location?.room || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.category}</td>
                    <td className="py-3 px-4"><PriorityBadge priority={c.priority} /></td>
                    <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3 px-4 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="primary"
                        size="xs"
                        iconLeft={UserCheck}
                        onClick={() => setSelectedId(c.id)}
                      >
                        Assign
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedId && (
        <AdminBulkAssignModal
          isOpen={Boolean(selectedId)}
          onClose={() => setSelectedId(null)}
          selectedIds={[selectedId]}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
