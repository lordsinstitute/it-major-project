/**
 * StaffTaskCard — Mobile-optimized card representation of a maintenance task (min 44px touch targets).
 */
import { Link } from 'react-router-dom';
import { MapPin, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import Card from '../../../components/ui/Card';
import PriorityBadge from '../../../components/ui/PriorityBadge';
import StatusBadge from '../../../components/ui/StatusBadge';
import Button from '../../../components/ui/Button';
import { isComplaintOverdue, getRemainingHours } from '../../../utils/sla';

export default function StaffTaskCard({ task }) {
  const overdue = isComplaintOverdue(task);
  const remaining = getRemainingHours(task);

  return (
    <Card className="p-4 space-y-3 border-slate-200">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-mono text-xs font-bold text-indigo-600">{task.id}</span>
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 leading-snug">{task.title}</h3>
        <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
          {task.category}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-800 truncate">
            {task.location?.buildingName || task.location?.building} • Room {task.location?.room || 'N/A'}
          </span>
        </div>
        {task.location?.landmark && (
          <div className="text-[11px] text-slate-500 italic pl-5">
            Near: &quot;{task.location.landmark}&quot;
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 text-xs">
        {overdue ? (
          <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[11px]">
            <AlertTriangle className="w-3 h-3" /> Overdue by {Math.abs(remaining)}h
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" /> ~{Math.max(0, remaining)}h target window
          </span>
        )}
        <span className="text-[11px] text-slate-400">
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>

      <Link to={`/staff/tasks/${task.id}`} className="block pt-1">
        <Button variant="primary" size="sm" iconRight={ArrowRight} className="w-full min-h-[44px]">
          Manage & Update Task
        </Button>
      </Link>
    </Card>
  );
}
