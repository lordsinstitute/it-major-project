import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { Bell } from 'lucide-react';

export default function StudentNotificationsPlaceholder() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated on ticket assignments, admin notes, and resolution actions."
      />
      <Card className="p-6">
        <div className="flex items-center gap-3 text-primary-700">
          <Bell className="h-6 w-6" />
          <h2 className="text-lg font-bold text-slate-900">Student Notification Feed</h2>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
          Full-page in-app notifications inbox with filter toggles (Unread vs All) and one-click item navigation.
        </p>
      </Card>
    </div>
  );
}
