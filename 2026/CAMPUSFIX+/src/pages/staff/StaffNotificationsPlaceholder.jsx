import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { Bell } from 'lucide-react';

export default function StaffNotificationsPlaceholder() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Notifications"
        subtitle="Work order assignments, priority escalations, and student reopen dispute alerts."
      />
      <Card className="p-6">
        <div className="flex items-center gap-3 text-teal-700">
          <Bell className="h-6 w-6" />
          <h2 className="text-lg font-bold text-slate-900">Field Maintenance Alerts</h2>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
          Real-time notification stream for new job dispatches and urgent priority re-assignments.
        </p>
      </Card>
    </div>
  );
}
