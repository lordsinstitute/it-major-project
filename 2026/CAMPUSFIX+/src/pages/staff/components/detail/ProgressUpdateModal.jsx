/**
 * ProgressUpdateModal — Dialog for posting intermediate progress notes and completion percentages.
 */
import { useState } from 'react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
import { updateStatus } from '../../../../services/complaintService';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../hooks/useToast';

export default function ProgressUpdateModal({ isOpen, onClose, task, onSuccess }) {
  const [note, setNote] = useState('');
  const [percentage, setPercentage] = useState('50');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      toast.error('Please enter a progress description.');
      return;
    }
    try {
      setSubmitting(true);
      const updateText = `Progress Update (${percentage}%): ${note.trim()}`;
      await updateStatus(task.id, {
        status: task.status, // maintains current status (IN_PROGRESS)
        note: updateText,
        by: user?.name || 'Technician',
        role: user?.role,
      });
      toast.success('Progress update logged to task timeline.');
      setNote('');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to post progress update.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Work Progress"
      description="Record an interim milestone or parts inspection status on the complaint audit trail."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Estimated Completion Percentage
          </label>
          <div className="flex items-center gap-2">
            {['25', '50', '75', '90'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setPercentage(val)}
                className={`flex-1 text-xs py-2 rounded-lg font-semibold border transition-all ${
                  percentage === val
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Progress Remarks *
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Disassembled motor assembly, replaced worn drive belt, testing voltage load..."
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={submitting}>
            Record Milestone
          </Button>
        </div>
      </form>
    </Modal>
  );
}
