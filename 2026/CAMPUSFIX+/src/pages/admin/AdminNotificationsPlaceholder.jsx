import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { Bell } from 'lucide-react';

export default function AdminNotificationsPlaceholder() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Notifications"
        subtitle="Critical escalation alerts, overdue SLA notices, and new complaint triage triggers."
      />
      <Card className="p-6">
        <div className="flex items-center gap-3 text-amber-700">
          <Bell className="h-6 w-6" />
          <h2 className="text-lg font-bold text-slate-900">Administrator Alert Center</h2>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
          Facility notifications feed displaying urgent ticket triage requests and overdue tasks.
        </p>
      </Card>
    </div>
  );
}
