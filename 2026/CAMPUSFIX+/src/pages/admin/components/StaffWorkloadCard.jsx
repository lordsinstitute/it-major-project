/**
 * StaffWorkloadCard — Visual indicator of staff technician workload and ticket allocation.
 */
import { UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { DEPARTMENT_META } from '../../../constants/departments';
import { STATUSES } from '../../../constants/statuses';

export default function StaffWorkloadCard({ staff = [], complaints = [] }) {
  // Count active complaints (ASSIGNED, IN_PROGRESS) per staff member
  const getStaffActiveCount = (staffId) => {
    return complaints.filter(
      (c) =>
        c.assignedTo === staffId &&
        [STATUSES.ASSIGNED, STATUSES.IN_PROGRESS].includes(c.status)
    ).length;
  };

  const getCapacityBadge = (count) => {
    if (count >= 4) {
      return <Badge variant="danger" size="sm">Heavy ({count})</Badge>;
    }
    if (count >= 2) {
      return <Badge variant="warning" size="sm">Moderate ({count})</Badge>;
    }
    return <Badge variant="success" size="sm">Optimal ({count})</Badge>;
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Technician Dispatch Workload</h3>
          <p className="text-xs text-slate-500">Live active ticket distribution across field personnel</p>
        </div>
        <Badge variant="neutral" size="sm">Prototype data</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {staff.map((st) => {
          const activeCount = getStaffActiveCount(st.id);
          const deptMeta = DEPARTMENT_META[st.assignedDepartment];
          return (
            <div
              key={st.id}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-semibold text-slate-900 truncate">{st.name}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {deptMeta?.shortLabel || 'General'} • {st.designation || 'Staff'}
                </div>
              </div>
              <div>{getCapacityBadge(activeCount)}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
