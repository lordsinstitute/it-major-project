import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle, AlertTriangle } from 'lucide-react';
import { STATUSES } from '../../../../constants/statuses';
import { ROLES } from '../../../../constants/roles';
import * as complaintService from '../../../../services/complaintService';
import { useToast } from '../../../../hooks/useToast';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/ui/Modal';
import Textarea from '../../../../components/ui/Textarea';

export default function VerificationCard({ complaint, onStatusUpdated, user }) {
  const { toast } = useToast();
  const [reopenModal, setReopenModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!complaint) return null;

  async function handleConfirm() {
    setLoading(true);
    try {
      const updated = await complaintService.updateStatus(complaint.id, {
        status: STATUSES.VERIFIED,
        note: 'Resolution inspected and approved by student.',
        by: user.id,
        role: ROLES.STUDENT,
      });
      toast.success('Complaint verified and closed.');
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err) {
      toast.error(err.message || 'Failed to verify complaint.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReopenSubmit(e) {
    e.preventDefault();
    if (!reopenReason.trim()) {
      toast.error('Please specify why the issue remains unresolved.');
      return;
    }
    setLoading(true);
    try {
      const updated = await complaintService.updateStatus(complaint.id, {
        status: STATUSES.REOPENED,
        note: `Reopened by student: ${reopenReason.trim()}`,
        by: user.id,
        role: ROLES.STUDENT,
      });
      toast.warning('Complaint reopened for further review.');
      setReopenModal(false);
      setReopenReason('');
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err) {
      toast.error(err.message || 'Failed to reopen complaint.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await complaintService.updateStatus(complaint.id, {
        status: STATUSES.REJECTED,
        note: `Cancelled by student: ${cancelReason.trim() || 'No longer needed.'}`,
        by: user.id,
        role: ROLES.STUDENT,
      });
      toast.info('Complaint cancelled.');
      setCancelModal(false);
      setCancelReason('');
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel complaint.');
    } finally {
      setLoading(false);
    }
  }

  // Shown when RESOLVED
  if (complaint.status === STATUSES.RESOLVED) {
    return (
      <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
            Student Sign-Off Required
          </h3>
        </div>
        <p className="text-xs text-emerald-900 leading-relaxed">
          The assigned technician has marked this issue as resolved. Please inspect the work and confirm closure or reopen with dispute remarks.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="primary"
            className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            loading={loading}
            onClick={handleConfirm}
          >
            Confirm Fixed
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs"
            disabled={loading}
            onClick={() => setReopenModal(true)}
          >
            Reopen
          </Button>
        </div>

        {reopenModal && (
          <Modal isOpen={reopenModal} onClose={() => setReopenModal(false)} title="Dispute & Reopen Complaint">
            <form onSubmit={handleReopenSubmit} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Please explain why this repair is unsatisfactory or incomplete:
              </p>
              <Textarea
                rows={4}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. The leak was patched but water is still seeping through the wall joint."
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setReopenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" size="sm" loading={loading}>
                  Confirm Reopen
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  // Shown when SUBMITTED (allows student cancellation)
  if (complaint.status === STATUSES.SUBMITTED) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
        <p className="text-xs font-bold text-slate-800">Pending Initial Review</p>
        <p className="text-[11px] text-slate-500">
          This ticket has not yet been assigned. You may cancel it if it was reported by mistake.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
          icon={<XCircle className="h-3.5 w-3.5" />}
          onClick={() => setCancelModal(true)}
        >
          Cancel Complaint
        </Button>

        {cancelModal && (
          <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Complaint">
            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
              <p className="text-slate-600">Are you sure you want to cancel ticket <strong>{complaint.id}</strong>?</p>
              <Textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Optional cancellation note..."
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCancelModal(false)}>
                  Keep Open
                </Button>
                <Button type="submit" variant="danger" size="sm" loading={loading}>
                  Yes, Cancel Ticket
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  return null;
}
