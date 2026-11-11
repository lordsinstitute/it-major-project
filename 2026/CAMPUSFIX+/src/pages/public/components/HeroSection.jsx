import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';
import Button from '../../../components/ui/Button';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 py-16 sm:py-24 lg:py-28" aria-label="CampusFix+ Introduction">
      {/* Subtle background ambient mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[1000px] rounded-full bg-gradient-to-tr from-primary-200/40 via-teal-100/30 to-transparent blur-3xl opacity-70" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Headline, Copy, CTAs */}
          <div className="text-center lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50/80 px-3 py-1 text-xs font-semibold text-primary-800 shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary-600" />
              <span>IEEE-Style Academic Research Platform</span>
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Report and resolve campus issues faster with a{' '}
              <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-teal-600 bg-clip-text text-transparent">
                transparent workflow
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              CampusFix+ replaces slow manual registers, misplaced maintenance chits, and untracked emails with a centralized, SLA-governed digital ecosystem featuring verified end-to-end accountability.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
              <Link to="/login">
                <Button variant="primary" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                  Report an Issue
                </Button>
              </Link>
              <Link to="/modules">
                <Button variant="outline" size="lg" icon={<ArrowUpRight className="h-4 w-4" />}>
                  Explore Research Modules
                </Button>
              </Link>
            </div>

            {/* Micro value badges */}
            <div className="mt-10 grid grid-cols-3 gap-3 border-t border-slate-200/80 pt-6 text-left sm:gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Governance</p>
                <p className="mt-1 text-sm font-bold text-slate-800">Closed-Loop SLA</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Verification</p>
                <p className="mt-1 text-sm font-bold text-slate-800">Student Sign-Off</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Architecture</p>
                <p className="mt-1 text-sm font-bold text-slate-800">Audit Trail Ready</p>
              </div>
            </div>
          </div>

          {/* Right Column: Pure CSS/SVG Complaint Lifecycle Illustration */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm sm:p-7">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Lifecycle Engine</span>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Pure SVG Schema</span>
              </div>

              {/* Lifecycle Step Flow */}
              <div className="space-y-3.5">
                {/* Step 1 */}
                <div className="flex items-start gap-3.5 rounded-xl border border-primary-100 bg-primary-50/50 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Issue Reported</p>
                      <span className="text-[10px] font-medium text-primary-700">Student</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Location, department, severity, & photo evidence submitted.</p>
                  </div>
                </div>

                {/* Connector SVG */}
                <div className="flex justify-center -my-1 text-slate-300">
                  <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
                    <path d="M6 0V14M6 14L2 10M6 14L10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5 rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Triage & Assignment</p>
                      <span className="text-[10px] font-medium text-amber-800">Admin</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Admin assigns department specialist with target SLA timer.</p>
                  </div>
                </div>

                {/* Connector SVG */}
                <div className="flex justify-center -my-1 text-slate-300">
                  <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
                    <path d="M6 0V14M6 14L2 10M6 14L10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Work & Resolution</p>
                      <span className="text-[10px] font-medium text-indigo-700">Staff</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Field work executed; resolution proof uploaded for review.</p>
                  </div>
                </div>

                {/* Connector SVG */}
                <div className="flex justify-center -my-1 text-slate-300">
                  <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
                    <path d="M6 0V14M6 14L2 10M6 14L10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Verification or Reopen</p>
                      <span className="text-[10px] font-medium text-emerald-800">Student</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Originating student confirms resolution or reopens with dispute remarks.</p>
                  </div>
                </div>
              </div>

              {/* Bottom tag */}
              <div className="mt-4 rounded-lg bg-slate-50 p-2 text-center text-[10px] text-slate-500">
                Guaranteed Closed-Loop Cycle: Staff cannot close without Student Verification
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
