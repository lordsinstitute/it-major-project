/**
 * StaffWorkloadChart — Compact visual status breakdown of assigned maintenance jobs.
 */
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { STATUSES, STATUS_META } from '../../../constants/statuses';

const STATUS_FILLS = {
  ASSIGNED: '#6366f1',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#10b981',
  VERIFIED: '#14b8a6',
  REOPENED: '#f97316',
};

export default function StaffWorkloadChart({ tasks = [] }) {
  const chartData = [STATUSES.ASSIGNED, STATUSES.IN_PROGRESS, STATUSES.REOPENED, STATUSES.RESOLVED, STATUSES.VERIFIED].map((st) => ({
    name: STATUS_META[st]?.label || st,
    count: tasks.filter((t) => t.status === st).length,
    fill: STATUS_FILLS[st] || '#6366f1',
  }));

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Task Allocation by Status</h3>
          <p className="text-xs text-slate-500">Your historical and current workload distribution</p>
        </div>
        <Badge variant="neutral" size="sm">Prototype data</Badge>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={11} interval={0} />
            <YAxis fontSize={11} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
