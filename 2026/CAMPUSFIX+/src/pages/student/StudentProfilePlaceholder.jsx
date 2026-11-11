import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../hooks/useAuth';

export default function StudentProfilePlaceholder() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile"
        subtitle="Manage your personal academic identity and campus contact information."
      />
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name || 'Student User'} size="lg" />
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-slate-100 pt-5 text-xs text-slate-600">
          <div><span className="font-semibold text-slate-800">Roll Number:</span> {user?.rollNumber || '21CS101'}</div>
          <div><span className="font-semibold text-slate-800">Department:</span> {user?.department}</div>
          <div><span className="font-semibold text-slate-800">Role:</span> STUDENT</div>
        </div>
      </Card>
    </div>
  );
}
