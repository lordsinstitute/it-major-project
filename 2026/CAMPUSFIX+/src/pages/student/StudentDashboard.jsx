import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import * as complaintService from '../../services/complaintService';
import { STATUSES } from '../../constants/statuses';
import StudentGreetingHeader from './components/StudentGreetingHeader';
import StudentStatCards from './components/StudentStatCards';
import StudentAttentionPanel from './components/StudentAttentionPanel';
import StudentCharts from './components/StudentCharts';
import StudentQuickActions from './components/StudentQuickActions';
import ComplaintsTable from './components/ComplaintsTable';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await complaintService.getComplaints({ reportedBy: user.id, size: 100 });
      setComplaints(res.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load student dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute stat metrics
  const total = complaints.length;
  const openCount = complaints.filter((c) =>
    [STATUSES.SUBMITTED, STATUSES.UNDER_REVIEW, STATUSES.ASSIGNED, STATUSES.REOPENED].includes(c.status)
  ).length;
  const inProgressCount = complaints.filter((c) => c.status === STATUSES.IN_PROGRESS).length;
  const awaitingVerification = complaints.filter((c) => c.status === STATUSES.RESOLVED).length;
  const verifiedClosed = complaints.filter((c) =>
    [STATUSES.VERIFIED, STATUSES.REJECTED].includes(c.status)
  ).length;

  const resolvedComplaints = complaints.filter((c) => c.status === STATUSES.RESOLVED);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Skeleton className="h-24 rounded-2xl" count={5} />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Greeting Header */}
      <StudentGreetingHeader user={user} />

      {/* 2. Stat Cards */}
      <StudentStatCards
        stats={{
          total,
          open: openCount,
          inProgress: inProgressCount,
          awaitingVerification,
          verifiedClosed,
        }}
      />

      {/* 3. Needs Your Attention (Resolved Tickets) */}
      <StudentAttentionPanel
        resolvedComplaints={resolvedComplaints}
        onRefresh={loadData}
        userId={user.id}
      />

      {/* 4. Activity Visualizations */}
      <StudentCharts complaints={complaints} />

      {/* 5. Quick Actions */}
      <StudentQuickActions />

      {/* 6. Recent Complaints Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Recent Complaints</h2>
        <ComplaintsTable userId={user.id} pageSize={5} />
      </div>
    </div>
  );
}
