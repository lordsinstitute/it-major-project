import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Sparkles } from 'lucide-react';
import Button from '../../../components/ui/Button';

export default function StudentGreetingHeader({ user }) {
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-r from-primary-900 via-indigo-900 to-slate-900 p-6 text-white shadow-sm">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary-200 backdrop-blur-xs">
          <Sparkles className="h-3 w-3 text-teal-400" />
          <span>Student Resident Portal</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
          Welcome back, {firstName}!
        </h1>
        <p className="mt-1 text-xs text-slate-300">
          {user?.department || 'Engineering Student'} · Roll No: {user?.rollNumber || '21CS101'}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Link to="/student/report">
          <Button
            variant="primary"
            size="md"
            className="bg-primary-500 hover:bg-primary-400 text-white shadow-md shadow-primary-900/50"
            icon={<PlusCircle className="h-4 w-4" />}
          >
            Report an Issue
          </Button>
        </Link>
      </div>
    </div>
  );
}
