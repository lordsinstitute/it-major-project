import React from 'react';
import { CheckCircle2, Clock, Calendar, Sparkles } from 'lucide-react';

const PHASES = [
  {
    phase: 'Phase 1',
    title: 'Website UI & Design System',
    status: 'Active Prototype',
    statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    deliverables: [
      'Tailwind CSS design token system & accessible UI kit',
      'Full student, admin, and staff dashboard mockups',
      'Strict role-based complaint state machine (8 states)',
      'Living style guide and responsive mobile navigation',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Spring Boot REST API & JWT Integration',
    status: 'Chunk 11 Planned',
    statusBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Clock,
    deliverables: [
      'Spring Boot 3 + Spring Security JWT authentication',
      'PostgreSQL schema migrations with Flyway',
      'Axios service layer swap from mock data to real REST APIs',
      'Role-based endpoint authorization & audit log persistence',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Review Readiness & Pilot Evaluation',
    status: 'Upcoming',
    statusBadge: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Calendar,
    deliverables: [
      'Controlled hostel block trial deployment',
      'SLA performance benchmark data collection',
      'Examiner and user evaluation feedback surveys',
      'Final thesis documentation and reproducible code packaging',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Applied AI & IoT Edge Telemetry',
    status: 'Research Track',
    statusBadge: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Sparkles,
    deliverables: [
      'NLP ticket deduplication & category recommendation',
      'ESP32 wireless environmental leak detection nodes',
      'Computer vision automated photo damage classification',
      'Time-series predictive maintenance degradation analysis',
    ],
  },
];

export default function RoadmapSection() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20" aria-labelledby="roadmap-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Strategic Trajectory</p>
          <h2 id="roadmap-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Project engineering & research roadmap
          </h2>
          <p className="mt-4 text-base text-slate-600">
            A milestone-driven implementation sequence prioritizing core operational integrity before layering advanced automated research capabilities.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.phase}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                      {p.phase}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${p.statusBadge}`}>
                      {p.status}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900">{p.title}</h3>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    {p.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-400">
                  Documented in Research Paper
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
