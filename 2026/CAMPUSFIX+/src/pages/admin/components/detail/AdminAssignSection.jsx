/**
 * AdminAssignSection — Department and technician selector with live filtering.
 */
import { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { ALL_DEPARTMENTS, DEPARTMENT_META } from '../../../../constants/departments';
import { getStaffByDepartment } from '../../../../services/userService';
import { assignComplaint } from '../../../../services/complaintService';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../hooks/useToast';

export default function AdminAssignSection({ complaint, onUpdated }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDept, setSelectedDept] = useState(complaint.department || '');
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(complaint.assignedTo || '');
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    setSelectedDept(complaint.department || '');
    setSelectedStaff(complaint.assignedTo || '');
  }, [complaint]);

  useEffect(() => {
    if (!selectedDept) {
      setStaffList([]);
      return;
    }
    const loadStaff = async () => {
      try {
        setLoadingStaff(true);
        const list = await getStaffByDepartment(selectedDept);
        setStaffList(list);
      } finally {
        setLoadingStaff(false);
      }
    };
    loadStaff();
  }, [selectedDept]);

  const handleAssign = async () => {
    if (!selectedDept) {
      toast.error('Please choose a department to assign.');
      return;
    }
    try {
      setAssigning(true);
      await assignComplaint(complaint.id, {
        department: selectedDept,
        assignedTo: selectedStaff || null,
        note: `Dispatched to ${DEPARTMENT_META[selectedDept]?.label || selectedDept}${
          selectedStaff ? ` (Technician: ${selectedStaff})` : ''
        }`,
        by: user?.name || 'Administrator',
        role: user?.role,
      });
      toast.success('Department and staff successfully assigned!');
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Failed to assign complaint.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-slate-100">
      <span className="text-xs font-semibold text-slate-700">Assign Maintenance Unit</span>
      <div className="space-y-2">
        <select
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setSelectedStaff('');
          }}
          className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- Select Department --</option>
          {ALL_DEPARTMENTS.map((deptKey) => (
            <option key={deptKey} value={deptKey}>
              {DEPARTMENT_META[deptKey]?.label}
            </option>
          ))}
        </select>

        <select
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          disabled={!selectedDept || loadingStaff}
          className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">Unassigned (Queue only)</option>
          {staffList.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name} — {st.designation || 'Technician'}
            </option>
          ))}
        </select>

        <Button
          variant="primary"
          size="sm"
          iconLeft={UserCheck}
          loading={assigning}
          onClick={handleAssign}
          className="w-full"
        >
          {complaint.assignedTo ? 'Reassign Dispatch' : 'Confirm Assignment'}
        </Button>
      </div>
    </div>
  );
}
