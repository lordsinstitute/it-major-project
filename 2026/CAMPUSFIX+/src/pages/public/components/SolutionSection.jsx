import React from 'react';
import { Database, ShieldCheck, CheckCheck, Clock, MapPin, Bell } from 'lucide-react';

const SOLUTIONS = [
  {
    icon: Database,
    title: 'Centralized Digital Registry',
    remedy: 'Replaces Paper Registers & Informal Channels',
    description:
      'Every issue submitted is assigned an immutable alphanumeric identifier, precise spatial coordinates (Building → Floor → Room), photographic evidence, and category classification.',
    highlights: ['Single source of truth', 'Categorized triage queues', 'Zero duplicate lost slips'],
  },
  {
    icon: Clock,
    title: 'Explicit Ownership & SLA Governance',
    remedy: 'Eliminates Ambiguity & Idle Tickets',
    description:
      'Admin triage maps complaints directly to certified department technicians with SLA countdown targets (CRITICAL: 4h, HIGH: 12h, MEDIUM: 24h, LOW: 72h). Overdue tasks flag supervisor attention.',
    highlights: ['Strict role-based assignment', 'Priority-indexed target hours', 'Full staff accountability'],
  },
  {
    icon: CheckCheck,
    title: 'Closed-Loop Student Verification',
    remedy: 'Guarantees True Issue Resolution',
    description:
      'Technicians mark an issue as RESOLVED with field completion notes, but status only moves to VERIFIED once the reporting student inspects the fix and approves sign-off — or reopens the ticket with feedback.',
    highlights: ['Student has final sign-off power', 'Reopen dispute workflow', 'Transparent historical logs'],
  },
];

export default function SolutionSection() {
  return (
    <section className="bg-white py-16 sm:py-20 border-y border-slate-200/70" aria-labelledby="solution-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">The CampusFix+ Architecture</p>
          <h2 id="solution-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            A structured paradigm shift for smart campus maintenance
          </h2>
          <p className="mt-4 text-base text-slate-600">
            By digitizing the entire maintenance lifecycle into strict state machines and role boundaries, CampusFix+ brings enterprise-grade accountability to university infrastructure.
          </p>
        </div>

        {/* 3 Solution Columns */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {SOLUTIONS.map((sol) => {
            const Icon = sol.icon;
            return (
              <div
                key={sol.title}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/50 to-white p-6 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
              >
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-200">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{sol.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-primary-700">{sol.remedy}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{sol.description}</p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {sol.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
