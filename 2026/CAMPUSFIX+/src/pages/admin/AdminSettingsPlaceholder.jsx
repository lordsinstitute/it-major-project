import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { Settings } from 'lucide-react';

export default function AdminSettingsPlaceholder() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Settings"
        subtitle="Manage department mappings, automated escalation timers, and prototype data controls."
      />
      <Card className="p-6">
        <div className="flex items-center gap-3 text-amber-700">
          <Settings className="h-6 w-6" />
          <h2 className="text-lg font-bold text-slate-900">Estate System Settings</h2>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
          Campus configuration: buildings, floors, rooms, escalation rules, and maintenance department routing.
        </p>
      </Card>
    </div>
  );
}
