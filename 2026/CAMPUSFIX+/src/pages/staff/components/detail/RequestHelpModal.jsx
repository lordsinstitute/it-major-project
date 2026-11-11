/**
 * RequestHelpModal — Escalation dialog for returning a task to admin supervision.
 */
import { useState } from 'react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
import { STATUSES } from '../../../../constants/statuses';
import { updateStatus } from '../../../../services/complaintService';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../hooks/useToast';

export default function RequestHelpModal({ isOpen, onClose, task, onSuccess }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please describe why assistance or escalation is needed.');
      return;
    }

    try {
      setSubmitting(true);
      await updateStatus(task.id, {
        status: STATUSES.UNDER_REVIEW,
        note: `Technician escalated to Admin: ${reason.trim()}`,
        by: user?.name || 'Technician',
        role: user?.role,
      });

      toast.warning('Task returned to administrator triage queue for assistance.');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to return task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Help / Cannot Complete"
      description="Return this task to the Facilities Administrator for reassignment, specialized vendor requisition, or material procurement."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Escalation / Assistance *
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Requires high-voltage certified contractor, replacement transformer unavailable in local inventory..."
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" loading={submitting}>
            Return to Administrator
          </Button>
        </div>
      </form>
    </Modal>
  );
}
