import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { Settings } from 'lucide-react';

export default function StudentSettingsPlaceholder() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        subtitle="Notification preferences, UI theme preferences, and security options."
      />
      <Card className="p-6">
        <div className="flex items-center gap-3 text-primary-700">
          <Settings className="h-6 w-6" />
          <h2 className="text-lg font-bold text-slate-900">Student Preferences</h2>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
          Settings configuration for notifications, alert digests, and prototype data preferences.
        </p>
      </Card>
    </div>
  );
}
