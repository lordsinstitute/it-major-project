import React from 'react';
import { FileQuestion, AlertOctagon, EyeOff } from 'lucide-react';

const PAIN_POINTS = [
  {
    icon: FileQuestion,
    title: 'Untracked Complaints',
    subtitle: 'Paper registers and lost communications',
    description:
      'Physical maintenance registers in hostel lobbies and verbal reports to warden desks lack central indexing. Chits get misplaced, repeat reports create confusion, and work orders lack audit records.',
    impact: 'Recurring breakdowns remain undocumented, leaving facility managers unaware of systemic infrastructure wear.',
  },
  {
    icon: AlertOctagon,
    title: 'Absence of Ownership & SLAs',
    subtitle: 'No assigned accountability or escalation',
    description:
      'Without automated delegation, tickets sit in departmental queues without explicit staff assignment. Nobody is designated as the responsible resolver, and urgent failures trigger no escalation alert.',
    impact: 'Resolvers have no clear service-level agreements (SLAs), creating arbitrary resolution timelines.',
  },
  {
    icon: EyeOff,
    title: 'Zero Lifecycle Visibility',
    subtitle: 'The campus maintenance black box',
    description:
      'Students report an issue and receive no feedback on triage, parts procurement, or technician visits. The only way to verify progress is repeatedly visiting the physical administrative office in person.',
    impact: 'Erosion of student trust, repetitive duplicate submissions, and lack of satisfaction feedback mechanisms.',
  },
];

export default function ProblemSection() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20" aria-labelledby="problem-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600">The Problem Space</p>
          <h2 id="problem-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Why traditional campus maintenance systems fail
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Higher education campuses host thousands of residents across vast academic blocks, but facility workflows still rely on fragmented manual handoffs.
          </p>
        </div>

        {/* 3 Pain Points Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {PAIN_POINTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-rose-700">{item.subtitle}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 border-l-2 border-rose-500">
                  <span className="font-semibold text-slate-900">Operational Consequence: </span>
                  {item.impact}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
