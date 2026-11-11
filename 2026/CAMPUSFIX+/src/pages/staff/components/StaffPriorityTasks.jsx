/**
 * StaffPriorityTasks — Priority-ordered actionable task list for mobile technicians.
 */
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, MapPin, ArrowRight, Wrench } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import PriorityBadge from '../../../components/ui/PriorityBadge';
import StatusBadge from '../../../components/ui/StatusBadge';
import { STATUSES } from '../../../constants/statuses';
import { PRIORITIES } from '../../../constants/priorities';
import { isComplaintOverdue, getRemainingHours } from '../../../utils/sla';

const PRIORITY_WEIGHTS = {
  [PRIORITIES.CRITICAL]: 4,
  [PRIORITIES.HIGH]: 3,
  [PRIORITIES.MEDIUM]: 2,
  [PRIORITIES.LOW]: 1,
};

export default function StaffPriorityTasks({ tasks = [] }) {
  // Filter active tasks only
  const activeTasks = tasks.filter((t) =>
    [STATUSES.ASSIGNED, STATUSES.IN_PROGRESS, STATUSES.REOPENED].includes(t.status)
  );

  // Sort: Overdue first, then by priority weight desc, then by createdAt desc
  const sorted = [...activeTasks].sort((a, b) => {
    const aOverdue = isComplaintOverdue(a);
    const bOverdue = isComplaintOverdue(b);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    const pwDiff = (PRIORITY_WEIGHTS[b.priority] || 0) - (PRIORITY_WEIGHTS[a.priority] || 0);
    if (pwDiff !== 0) return pwDiff;

    return new Date(b.createdAt) - new Date(a.createdAt);
  }).slice(0, 5);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Today&apos;s Active Priorities</h3>
            <p className="text-xs text-slate-500">Ordered by SLA urgency and hazard severity</p>
          </div>
        </div>
        <Link to="/staff/tasks">
          <Button variant="ghost" size="xs" iconRight={ArrowRight}>
            All Tasks ({activeTasks.length})
          </Button>
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">
          No urgent tasks in your dispatch queue! Great job staying on top of repairs.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {sorted.map((task) => {
            const overdue = isComplaintOverdue(task);
            const remaining = getRemainingHours(task);
            return (
              <div
                key={task.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-indigo-600">{task.id}</span>
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    {overdue ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" /> Overdue ({Math.abs(remaining)}h)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-slate-400" /> ~{Math.max(0, remaining)}h window
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{task.title}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {task.location?.buildingName || task.location?.building} • Room {task.location?.room || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/staff/tasks/${task.id}`} className="w-full sm:w-auto">
                    <Button variant="primary" size="sm" className="w-full min-h-[44px] sm:min-h-0 sm:w-auto">
                      Action Task
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
