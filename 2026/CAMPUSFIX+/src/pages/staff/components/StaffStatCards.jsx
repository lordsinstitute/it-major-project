/**
 * StaffStatCards — 5 operational KPIs for the field maintenance technician.
 */
import { Wrench, Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { STATUSES } from '../../../constants/statuses';
import { isComplaintOverdue, getRemainingHours } from '../../../utils/sla';

export default function StaffStatCards({ tasks = [], onSelectFilter }) {
  const activeTasks = tasks.filter((t) =>
    [STATUSES.ASSIGNED, STATUSES.IN_PROGRESS, STATUSES.REOPENED].includes(t.status)
  );
  const inProgress = tasks.filter((t) => t.status === STATUSES.IN_PROGRESS).length;
  const overdue = activeTasks.filter((t) => isComplaintOverdue(t)).length;
  const dueToday = activeTasks.filter((t) => {
    const rem = getRemainingHours(t);
    return rem >= 0 && rem <= 24;
  }).length;

  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const completedThisWeek = tasks.filter((t) => {
    if (![STATUSES.RESOLVED, STATUSES.VERIFIED].includes(t.status)) return false;
    const date = new Date(t.resolvedAt || t.verifiedAt || t.updatedAt).getTime();
    return date >= sevenDaysAgo;
  }).length;

  const cards = [
    {
      id: 'assigned',
      title: 'Assigned',
      value: tasks.filter((t) => [STATUSES.ASSIGNED, STATUSES.REOPENED].includes(t.status)).length,
      subtitle: 'Awaiting start',
      icon: Wrench,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      onClick: () => onSelectFilter?.({ status: STATUSES.ASSIGNED }),
    },
    {
      id: 'inProgress',
      title: 'In Progress',
      value: inProgress,
      subtitle: 'Active repair',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      onClick: () => onSelectFilter?.({ status: STATUSES.IN_PROGRESS }),
    },
    {
      id: 'dueToday',
      title: 'Due Today',
      value: dueToday,
      subtitle: 'Within 24 hours',
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      onClick: () => onSelectFilter?.({ dueToday: true }),
    },
    {
      id: 'overdue',
      title: 'Overdue SLA',
      value: overdue,
      subtitle: 'Exceeded target',
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      pulse: overdue > 0,
      onClick: () => onSelectFilter?.({ overdueOnly: true }),
    },
    {
      id: 'completed',
      title: 'Closed This Week',
      value: completedThisWeek,
      subtitle: 'Resolved / verified',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      onClick: () => onSelectFilter?.({ status: STATUSES.RESOLVED }),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.id}
            hoverable
            onClick={c.onClick}
            className={`p-3.5 transition-all cursor-pointer min-h-[88px] flex flex-col justify-between ${
              c.pulse ? 'ring-2 ring-rose-500/50 shadow-rose-100' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-lg ${c.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${c.color}`} />
              </div>
            </div>
            <div className="mt-1">
              <div className="text-2xl font-bold text-slate-900 leading-tight">{c.value}</div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.subtitle}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
