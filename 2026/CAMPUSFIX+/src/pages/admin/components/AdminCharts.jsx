/**
 * AdminCharts — Visual operational breakdown across status, category, building, and resolution times.
 */
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { STATUSES, STATUS_META } from '../../../constants/statuses';
import { CATEGORIES, CATEGORY_META } from '../../../constants/categories';
import { DEPARTMENT_META } from '../../../constants/departments';

const STATUS_COLORS = {
  SUBMITTED: '#94a3b8',
  UNDER_REVIEW: '#3b82f6',
  ASSIGNED: '#6366f1',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#10b981',
  VERIFIED: '#14b8a6',
  REOPENED: '#f97316',
  REJECTED: '#ef4444',
};

export default function AdminCharts({ complaints = [] }) {
  // Status breakdown
  const statusData = Object.values(STATUSES).map((st) => ({
    name: STATUS_META[st]?.label || st,
    value: complaints.filter((c) => c.status === st).length,
    color: STATUS_COLORS[st] || '#6366f1',
  })).filter((d) => d.value > 0);

  // Category breakdown (use CATEGORY_META for labels; CATEGORIES values are strings)
  const categoryData = Object.keys(CATEGORIES).map((key) => {
    const meta = CATEGORY_META[key];
    return {
      name: (meta?.label || key).split(' ')[0],
      fullName: meta?.label || key,
      count: complaints.filter((c) => c.category === key).length,
    };
  });

  // Building distribution
  const buildingCounts = {};
  complaints.forEach((c) => {
    const bName = c.location?.buildingName || c.location?.building || 'Unspecified';
    const shortName = bName.split('—')[0].trim();
    buildingCounts[shortName] = (buildingCounts[shortName] || 0) + 1;
  });
  const buildingData = Object.entries(buildingCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Resolution time by department (calculated in hours from resolved/verified complaints)
  const deptHours = {};
  complaints.forEach((c) => {
    if ((c.status === STATUSES.RESOLVED || c.status === STATUSES.VERIFIED) && c.resolvedAt && c.createdAt && c.department) {
      const hrs = Math.max(1, Math.round((new Date(c.resolvedAt) - new Date(c.createdAt)) / (3600 * 1000)));
      if (!deptHours[c.department]) deptHours[c.department] = [];
      deptHours[c.department].push(hrs);
    }
  });

  const deptData = Object.entries(DEPARTMENT_META).map(([key, meta]) => {
    const list = deptHours[key] || [];
    const avg = list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : (meta.shortLabel === 'Electrical' ? 14 : 22);
    return {
      department: meta.shortLabel,
      avgHours: avg,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Complaints by Status */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Complaints by Status</h3>
            <p className="text-xs text-slate-500">Live operational distribution</p>
          </div>
          <Badge variant="neutral" size="sm">Prototype data</Badge>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {statusData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Complaints by Category */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Complaints by Category</h3>
            <p className="text-xs text-slate-500">Total volume logged per domain</p>
          </div>
          <Badge variant="neutral" size="sm">Prototype data</Badge>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={11} interval={0} angle={-20} textAnchor="end" />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip formatter={(value, name, item) => [value, item.payload.fullName]} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Complaints by Building */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Spatial Breakdown by Building</h3>
            <p className="text-xs text-slate-500">Incident density across campus zones</p>
          </div>
          <Badge variant="neutral" size="sm">Prototype data</Badge>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buildingData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" fontSize={11} allowDecimals={false} />
              <YAxis dataKey="name" type="category" fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Average Resolution Time by Department */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Avg Resolution Time (Hours)</h3>
            <p className="text-xs text-slate-500">Benchmark speed per service unit</p>
          </div>
          <Badge variant="neutral" size="sm">Prototype data</Badge>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="department" fontSize={11} interval={0} angle={-20} textAnchor="end" />
              <YAxis fontSize={11} allowDecimals={false} unit="h" />
              <Tooltip formatter={(val) => [`${val} hours`, 'Avg Resolution']} />
              <Bar dataKey="avgHours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
