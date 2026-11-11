import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ClipboardList, PlusCircle } from 'lucide-react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';

export default function ReportSuccess({ complaintId, onReset }) {
  return (
    <div className="py-6 sm:py-10">
      <Card className="mx-auto max-w-lg p-6 sm:p-8 text-center shadow-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">
          Complaint Successfully Logged
        </p>

        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
          Ticket {complaintId}
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-600">
          Your issue has entered the <strong>SUBMITTED</strong> state and is queued for administrative review. You will receive live status updates as technicians are assigned.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link to={`/student/complaints/${complaintId}`}>
            <Button variant="primary" className="w-full justify-center" icon={<ArrowRight className="h-4 w-4" />}>
              Track Ticket Timeline
            </Button>
          </Link>
          <Link to="/student/complaints">
            <Button variant="outline" className="w-full justify-center" icon={<ClipboardList className="h-4 w-4" />}>
              My Complaints Directory
            </Button>
          </Link>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Submit another maintenance report</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
