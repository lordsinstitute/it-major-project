import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, AlertTriangle, Check, ShieldCheck } from 'lucide-react';
import { STATUSES } from '../../../constants/statuses';
import * as complaintService from '../../../services/complaintService';
import { useToast } from '../../../hooks/useToast';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Textarea from '../../../components/ui/Textarea';

export default function StudentAttentionPanel({ resolvedComplaints = [], onRefresh, userId }) {
  const { toast } = useToast();
  const [reopenTarget, setReopenTarget] = useState(null);
  const [disputeNotes, setDisputeNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function handleConfirm(complaint) {
    setActionLoading(true);
    try {
      await complaintService.updateStatus(complaint.id, {
        status: STATUSES.VERIFIED,
        note: 'Resolution verified and signed off by student.',
        by: userId,
      });
      toast.success(`Complaint ${complaint.id} marked as Verified!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to verify complaint.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReopenSubmit(e) {
    e.preventDefault();
    if (!disputeNotes.trim()) {
      toast.error('Please specify why the issue remains unresolved.');
      return;
    }
    setActionLoading(true);
    try {
      await complaintService.updateStatus(reopenTarget.id, {
        status: STATUSES.REOPENED,
        note: disputeNotes.trim(),
        by: userId,
      });
      toast.warning(`Complaint ${reopenTarget.id} reopened with dispute remarks.`);
      setReopenTarget(null);
      setDisputeNotes('');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to reopen complaint.');
    } finally {
      setActionLoading(false);
    }
  }

  if (resolvedComplaints.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-xs">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="mt-2 text-xs font-bold text-slate-800">No Pending Confirmations</p>
        <p className="mt-1 text-[11px] text-slate-500">
          All your complaints currently have up-to-date verification sign-offs.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-emerald-200/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <h2 className="text-sm font-bold text-emerald-950">Needs Your Attention ({resolvedComplaints.length})</h2>
        </div>
        <span className="text-[11px] font-medium text-emerald-800">Technician Marked Resolved</span>
      </div>

      <div className="mt-3.5 space-y-3">
        {resolvedComplaints.map((item) => {
          const lastLog = item.timeline?.[item.timeline.length - 1];
          return (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary-700">{item.id}</span>
                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Location: {item.location?.building}, {item.location?.room}
                </p>
                {lastLog?.note && (
                  <p className="text-[11px] text-emerald-900 font-medium bg-emerald-50 px-2 py-0.5 rounded inline-block">
                    Technician note: "{lastLog.note}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  icon={<Check className="h-3.5 w-3.5" />}
                  loading={actionLoading}
                  onClick={() => handleConfirm(item)}
                >
                  Confirm Fix
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs"
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  disabled={actionLoading}
                  onClick={() => {
                    setReopenTarget(item);
                    setDisputeNotes('');
                  }}
                >
                  Reopen
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reopen Dispute Modal */}
      {reopenTarget && (
        <Modal
          isOpen={Boolean(reopenTarget)}
          onClose={() => setReopenTarget(null)}
          title={`Reopen Ticket ${reopenTarget.id}`}
        >
          <form onSubmit={handleReopenSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Please explain why the maintenance work for <strong>{reopenTarget.title}</strong> is incomplete or unsatisfactory:
            </p>
            <Textarea
              rows={4}
              value={disputeNotes}
              onChange={(e) => setDisputeNotes(e.target.value)}
              placeholder="e.g. The ceiling fan rotates now, but speed regulator is broken and makes loud grinding noises."
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setReopenTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" loading={actionLoading}>
                Confirm Reopen
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
