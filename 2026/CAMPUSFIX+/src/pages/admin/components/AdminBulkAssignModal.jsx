/**
 * AdminBulkAssignModal — Dialog to batch assign selected complaints to a department and technician.
 */
import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { ALL_DEPARTMENTS, DEPARTMENT_META } from '../../../constants/departments';
import { getStaffByDepartment } from '../../../services/userService';
import { useAuth } from '../../../context/AuthContext';
import { bulkAssign } from '../../../services/complaintService';
import { useToast } from '../../../hooks/useToast';

export default function AdminBulkAssignModal({ isOpen, onClose, selectedIds = [], onSuccess }) {
  const [department, setDepartment] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!department) {
      setStaffList([]);
      setAssignedTo('');
      return;
    }
    const fetchStaff = async () => {
      try {
        setLoadingStaff(true);
        const list = await getStaffByDepartment(department);
        setStaffList(list);
        setAssignedTo(list[0]?.id || '');
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchStaff();
  }, [department]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!department) {
      toast.error('Please select a target department.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await bulkAssign(selectedIds, {
        department,
        assignedTo: assignedTo || null,
        by: user?.name || 'Administrator',
        role: user?.role,
      });
      toast.success(`Successfully batch assigned ${res.count} complaint(s)!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to bulk assign complaints.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Assign Complaints (${selectedIds.length} Selected)`}
      description="Assign multiple pending tickets to a maintenance unit and assign a dedicated staff technician."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Target Department *
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">-- Choose Department --</option>
            {ALL_DEPARTMENTS.map((deptKey) => (
              <option key={deptKey} value={deptKey}>
                {DEPARTMENT_META[deptKey]?.label || deptKey}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Assign Technician (Filtered to Dept)
          </label>
          {loadingStaff ? (
            <div className="text-xs text-slate-500 py-2">Loading available staff...</div>
          ) : (
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={!department || staffList.length === 0}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Unassigned (Queue Only)</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.designation || 'Technician'})
                </option>
              ))}
            </select>
          )}
          {department && staffList.length === 0 && !loadingStaff && (
            <p className="text-xs text-amber-600 mt-1">No active staff currently listed in this department.</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={submitting}>
            Confirm Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
