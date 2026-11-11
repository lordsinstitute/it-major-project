import React from 'react';
import { User, ShieldAlert, Wrench, CheckCheck } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    role: 'Student',
    roleBadge: 'bg-primary-50 text-primary-700 border-primary-200',
    icon: User,
    title: 'Report with Spatial Precision',
    description:
      'Student identifies maintenance need, selects building, floor, room, category, and uploads photo evidence. Issue enters SUBMITTED status.',
  },
  {
    step: '02',
    role: 'Administrator',
    roleBadge: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: ShieldAlert,
    title: 'Triage & Department Assignment',
    description:
      'Estate Manager verifies legitimacy, assigns target SLA priority (e.g. Critical 4h), and delegates to a department technician. Issue moves to ASSIGNED.',
  },
  {
    step: '03',
    role: 'Maintenance Staff',
    roleBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Wrench,
    title: 'Field Execution & Resolution Notes',
    description:
      'Assigned technician inspects site, changes state to IN_PROGRESS, completes work order, and marks it RESOLVED with repair notes.',
  },
  {
    step: '04',
    role: 'Student Sign-Off',
    roleBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCheck,
    title: 'Verification or Dispute Reopen',
    description:
      'Originating student receives alert to inspect. If satisfied, student signs off into VERIFIED. If problem persists, student clicks REOPEN with dispute feedback.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-white py-16 sm:py-20 border-b border-slate-200" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Strict State Progression</p>
          <h2 id="how-it-works-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            How the 4-step verified workflow functions
          </h2>
          <p className="mt-4 text-base text-slate-600">
            A state machine governed by role authorization guarantees that issues cannot disappear or be marked completed prematurely without user consensus.
          </p>
        </div>

        {/* 4 Step Timeline */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition-all hover:bg-white hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-300 font-mono">{s.step}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.roleBadge}`}>
                      {s.role}
                    </span>
                  </div>

                  <div className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-800 shadow-sm ring-1 ring-slate-200">
                    <Icon className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{s.description}</p>
                </div>

                <div className="mt-6 border-t border-slate-200/60 pt-3 text-[11px] font-medium text-slate-500">
                  Step {s.step} in Audit Ledger
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
