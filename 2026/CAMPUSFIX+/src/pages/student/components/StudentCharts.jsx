import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import Card from '../../../components/ui/Card';

const STATUS_COLORS = {
  SUBMITTED: '#94a3b8',
  UNDER_REVIEW: '#60a5fa',
  ASSIGNED: '#818cf8',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#10b981',
  VERIFIED: '#0d9488',
  REOPENED: '#f97316',
  REJECTED: '#ef4444',
};

export default function StudentCharts({ complaints = [] }) {
  if (complaints.length === 0) {
    return (
      <Card className="p-6 text-center text-xs text-slate-500">
        <p>No complaints recorded yet to generate analytics charts.</p>
        <span className="text-[10px] text-slate-400">Based on prototype data</span>
      </Card>
    );
  }

  // 1. Data by Status (Donut)
  const statusCounts = {};
  complaints.forEach((c) => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    rawStatus: status,
    value: count,
  }));

  // 2. Data by Category (Bar)
  const categoryCounts = {};
  complaints.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCounts).map(([category, count]) => ({
    name: category,
    count,
  }));

  // 3. Data over Last 6 Months (Timeline)
  const monthMap = {};
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  months.forEach((m) => { monthMap[m] = 0; });
  complaints.forEach((c) => {
    const d = new Date(c.createdAt);
    const mName = d.toLocaleString('en-US', { month: 'short' });
    if (monthMap[mName] !== undefined) monthMap[mName] += 1;
    else monthMap['Oct'] = (monthMap['Oct'] || 0) + 1;
  });
  const timelineData = months.map((m) => ({ month: m, complaints: monthMap[m] }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Your Activity Breakdown</h2>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          Based on prototype data
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Status Donut */}
        <Card className="p-4">
          <p className="text-xs font-bold text-slate-800">Status Distribution</p>
          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.rawStatus] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px] text-slate-600">
            {statusData.map((s) => (
              <span key={s.name} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.rawStatus] || '#6366f1' }} />
                <span>{s.name} ({s.value})</span>
              </span>
            ))}
          </div>
        </Card>

        {/* Category Bar */}
        <Card className="p-4">
          <p className="text-xs font-bold text-slate-800">Complaints by Category</p>
          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 6-Month Timeline Area */}
        <Card className="p-4">
          <p className="text-xs font-bold text-slate-800">Submission Trend (6 Mos)</p>
          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="complaints" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#studentGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
