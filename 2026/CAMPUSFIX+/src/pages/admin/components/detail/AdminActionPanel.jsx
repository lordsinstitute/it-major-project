/**
 * AdminActionPanel — Administrator actions: review triage and priority SLA calibration.
 */
import { useState, useEffect } from 'react';
import { Check, XCircle, ShieldAlert, Clock } from 'lucide-react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import AdminRejectModal from './AdminRejectModal';
import AdminAssignSection from './AdminAssignSection';
import { STATUSES } from '../../../../constants/statuses';
import { ALL_PRIORITIES, PRIORITY_META } from '../../../../constants/priorities';
import { updateStatus, setPriority } from '../../../../services/complaintService';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../hooks/useToast';

export default function AdminActionPanel({ complaint, onUpdated }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedPriority, setSelectedPriority] = useState(complaint.priority);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  useEffect(() => {
    setSelectedPriority(complaint.priority);
  }, [complaint.priority]);

  const handleAcceptReview = async () => {
    try {
      setActionLoading(true);
      await updateStatus(complaint.id, {
        status: STATUSES.UNDER_REVIEW,
        note: 'Complaint accepted for administrative triage and inspection.',
        by: user?.name || 'Administrator',
        role: user?.role,
      });
      toast.success('Complaint accepted into review queue.');
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Failed to update review status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (reason) => {
    try {
      setActionLoading(true);
      await updateStatus(complaint.id, {
        status: STATUSES.REJECTED,
        note: `Dismissed by Admin: ${reason}`,
        by: user?.name || 'Administrator',
        role: user?.role,
      });
      toast.info('Complaint rejected.');
      setIsRejectModalOpen(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Failed to reject complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPriority = async () => {
    try {
      setActionLoading(true);
      await setPriority(complaint.id, {
        priority: selectedPriority,
        note: `Admin set priority to ${selectedPriority} (SLA: ${PRIORITY_META[selectedPriority]?.resolutionHours}h)`,
        by: user?.name || 'Administrator',
      });
      toast.success(`Priority updated to ${selectedPriority}.`);
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Failed to update priority.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <ShieldAlert className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Admin Action Console
        </h3>
      </div>

      {/* Review Section */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-700">Initial Review & Triage</span>
        <div className="flex items-center gap-2">
          {complaint.status === STATUSES.SUBMITTED && (
            <Button
              variant="outline"
              size="sm"
              iconLeft={Check}
              loading={actionLoading}
              onClick={handleAcceptReview}
            >
              Accept (Under Review)
            </Button>
          )}
          {complaint.status !== STATUSES.REJECTED && complaint.status !== STATUSES.VERIFIED && (
            <Button
              variant="danger"
              size="sm"
              iconLeft={XCircle}
              disabled={actionLoading}
              onClick={() => setIsRejectModalOpen(true)}
            >
              Reject Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Priority & SLA Calibration */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Calibrate SLA Priority</span>
          <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> Target: {PRIORITY_META[selectedPriority]?.resolutionHours}h
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="flex-1 text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ALL_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p]?.label} ({PRIORITY_META[p]?.resolutionHours}h)
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            disabled={selectedPriority === complaint.priority || actionLoading}
            onClick={handleSetPriority}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Department & Staff Assignment Sub-component */}
      <AdminAssignSection complaint={complaint} onUpdated={onUpdated} />

      <AdminRejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        loading={actionLoading}
      />
    </Card>
  );
}
