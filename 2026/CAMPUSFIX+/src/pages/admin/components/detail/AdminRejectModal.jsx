/**
 * AdminRejectModal — Justification dialog for rejecting complaints with mandatory reason.
 */
import { useState } from 'react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

export default function AdminRejectModal({ isOpen, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Complaint"
      description="Dismissing a complaint marks it as REJECTED in the audit trail. A valid justification is required."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Rejection Reason *
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Duplicate report, invalid coordinates, or outside campus maintenance jurisdiction..."
            className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
            required
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" loading={loading}>
            Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
