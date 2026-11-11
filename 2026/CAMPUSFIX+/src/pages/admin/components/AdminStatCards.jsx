/**
 * AdminStatCards — 6 key metrics for the administrator control room.
 */
import { FilePlus, UserX, Clock, AlertOctagon, CheckCircle2, RotateCcw } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { STATUSES } from '../../../constants/statuses';
import { isComplaintOverdue } from '../../../utils/sla';

export default function AdminStatCards({ complaints = [], onSelectFilter }) {
  const oneDayAgo = Date.now() - 24 * 3600 * 1000;
  const newToday = complaints.filter((c) => new Date(c.createdAt).getTime() >= oneDayAgo).length;
  const unassigned = complaints.filter(
    (c) => !c.assignedTo && [STATUSES.SUBMITTED, STATUSES.UNDER_REVIEW].includes(c.status)
  ).length;
  const inProgress = complaints.filter((c) => c.status === STATUSES.IN_PROGRESS).length;
  const overdue = complaints.filter((c) => isComplaintOverdue(c)).length;
  const awaitingVerification = complaints.filter((c) => c.status === STATUSES.RESOLVED).length;
  const reopened = complaints.filter((c) => c.status === STATUSES.REOPENED).length;

  const cards = [
    {
      id: 'newToday',
      title: 'New Today',
      value: newToday,
      subtitle: 'Reported in last 24h',
      icon: FilePlus,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      onClick: () => onSelectFilter?.({ sort: 'createdAt', order: 'desc' }),
    },
    {
      id: 'unassigned',
      title: 'Unassigned',
      value: unassigned,
      subtitle: 'Awaiting dept assignment',
      icon: UserX,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      onClick: () => onSelectFilter?.({ status: 'SUBMITTED' }),
    },
    {
      id: 'inProgress',
      title: 'In Progress',
      value: inProgress,
      subtitle: 'Under active repair',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      onClick: () => onSelectFilter?.({ status: 'IN_PROGRESS' }),
    },
    {
      id: 'overdue',
      title: 'Overdue SLA',
      value: overdue,
      subtitle: 'Exceeded resolution target',
      icon: AlertOctagon,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      pulse: overdue > 0,
      onClick: () => onSelectFilter?.({ overdueOnly: true }),
    },
    {
      id: 'awaitingVerification',
      title: 'Awaiting Verify',
      value: awaitingVerification,
      subtitle: 'Resolved by staff',
      icon: CheckCircle2,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      onClick: () => onSelectFilter?.({ status: 'RESOLVED' }),
    },
    {
      id: 'reopened',
      title: 'Reopened',
      value: reopened,
      subtitle: 'Student disputes',
      icon: RotateCcw,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      onClick: () => onSelectFilter?.({ status: 'REOPENED' }),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.id}
            hoverable
            onClick={c.onClick}
            className={`p-4 transition-all cursor-pointer relative ${
              c.pulse ? 'ring-2 ring-rose-500/50 shadow-rose-100' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-lg ${c.bg}`}>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{c.value}</div>
            <p className="text-xs text-slate-500 mt-1 truncate">{c.subtitle}</p>
          </Card>
        );
      })}
    </div>
  );
}
