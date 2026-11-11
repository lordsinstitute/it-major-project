import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../hooks/useAuth';

export default function StaffProfilePlaceholder() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Profile"
        subtitle="Technician trade certification and departmental allocation."
      />
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name || 'Staff User'} size="lg" />
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-slate-100 pt-5 text-xs text-slate-600">
          <div><span className="font-semibold text-slate-800">Employee ID:</span> {user?.employeeId || 'STF-001'}</div>
          <div><span className="font-semibold text-slate-800">Trade:</span> {user?.designation || 'Technician'}</div>
          <div><span className="font-semibold text-slate-800">Department:</span> {user?.department || 'Operations'}</div>
          <div><span className="font-semibold text-slate-800">Role:</span> STAFF</div>
        </div>
      </Card>
    </div>
  );
}
