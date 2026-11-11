/**
 * AdminNeedsAction — Prioritized queue of overdue and unassigned complaints requiring immediate attention.
 */
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, UserPlus, Clock } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import StatusBadge from '../../../components/ui/StatusBadge';
import PriorityBadge from '../../../components/ui/PriorityBadge';
import { STATUSES } from '../../../constants/statuses';
import { isComplaintOverdue, getRemainingHours } from '../../../utils/sla';

export default function AdminNeedsAction({ complaints = [] }) {
  // Sort prioritized: overdue items first, then unassigned SUBMITTED / REOPENED items
  const actionItems = complaints
    .filter((c) => {
      const isOverdue = isComplaintOverdue(c);
      const isUnassigned = !c.assignedTo && [STATUSES.SUBMITTED, STATUSES.UNDER_REVIEW, STATUSES.REOPENED].includes(c.status);
      return isOverdue || isUnassigned;
    })
    .sort((a, b) => {
      const aOverdue = isComplaintOverdue(a);
      const bOverdue = isComplaintOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .slice(0, 5);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Needs Action</h3>
            <p className="text-xs text-slate-500">Unassigned complaints and SLA overdue emergencies</p>
          </div>
        </div>
        <Link to="/admin/complaints">
          <Button variant="ghost" size="sm" iconRight={ArrowRight}>
            View All ({complaints.length})
          </Button>
        </Link>
      </div>

      {actionItems.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          No urgent items! All complaints are assigned and within SLA targets.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {actionItems.map((c) => {
            const overdue = isComplaintOverdue(c);
            const remaining = getRemainingHours(c);
            return (
              <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-indigo-600">{c.id}</span>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                    {overdue ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full ring-1 ring-rose-200">
                        <Clock className="w-3 h-3" /> Overdue by {Math.abs(remaining)}h
                      </span>
                    ) : !c.assignedTo ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full ring-1 ring-amber-200">
                        <UserPlus className="w-3 h-3" /> Needs Assignee
                      </span>
                    ) : null}
                  </div>
                  <h4 className="text-sm font-medium text-slate-900">{c.title}</h4>
                  <p className="text-xs text-slate-500">
                    {c.location?.buildingName || c.location?.building} • Room {c.location?.room || 'N/A'} • Reported {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:self-center">
                  <Link to={`/admin/complaints/${c.id}`}>
                    <Button variant="outline" size="sm">
                      Manage & Assign
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
