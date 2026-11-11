import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ClipboardList, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight 
} from 'lucide-react';

export default function StudentStatCards({ stats = {} }) {
  const {
    total = 0,
    open = 0,
    inProgress = 0,
    awaitingVerification = 0,
    verifiedClosed = 0,
  } = stats;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* 1. Total */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Total Reported</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <ClipboardList className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-black text-slate-900 font-mono">{total}</p>
        <p className="mt-1 text-[11px] text-slate-400">All historical issues</p>
      </div>

      {/* 2. Open */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Pending Review</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-black text-slate-900 font-mono">{open}</p>
        <p className="mt-1 text-[11px] text-amber-700">Triage & assigned</p>
      </div>

      {/* 3. In Progress */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">In Progress</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Wrench className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-black text-slate-900 font-mono">{inProgress}</p>
        <p className="mt-1 text-[11px] text-indigo-600">Technician on site</p>
      </div>

      {/* 4. Awaiting Verification (HIGHLIGHTED) */}
      <Link
        to="/student/complaints?status=RESOLVED"
        className="group relative rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 p-4 shadow-sm transition-all hover:bg-emerald-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-900">Needs Sign-Off</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-black text-emerald-950 font-mono">{awaitingVerification}</p>
          <ArrowRight className="h-4 w-4 text-emerald-700 transition-transform group-hover:translate-x-1" />
        </div>
        <p className="mt-1 text-[11px] font-semibold text-emerald-800">Awaiting your verification</p>
      </Link>

      {/* 5. Verified / Closed */}
      <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Resolved & Closed</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-black text-slate-900 font-mono">{verifiedClosed}</p>
        <p className="mt-1 text-[11px] text-teal-700">Verified complete</p>
      </div>
    </div>
  );
}
