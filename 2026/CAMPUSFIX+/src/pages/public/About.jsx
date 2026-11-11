import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { BookOpen, Target, Compass, Users, Sparkles } from 'lucide-react';

const OBJECTIVES = [
  'Digitize campus maintenance into an SLA-governed, role-based workflow.',
  'Empower students with direct tracking and final verification authority.',
  'Eliminate paper registers and unindexed telephone maintenance logs.',
  'Provide facility administrators with actionable real-time bottleneck insights.',
  'Lay an empirical foundation for AI duplicate triage and IoT edge telemetry.',
];

const TEAM_MEMBERS = [
  {
    name: 'Lead Student Researcher',
    role: 'Full-Stack Architecture & Paper Author',
    dept: 'Dept. of Computer Science & Engineering',
    tag: 'Prototype Data / Student Investigator',
  },
  {
    name: 'Co-Investigator (IoT Focus)',
    role: 'Sensor Node & Embedded Systems',
    dept: 'Dept. of Electronics & Communication',
    tag: 'Prototype Data / Student Investigator',
  },
  {
    name: 'Project Faculty Advisor',
    role: 'Research Guide & Systems Reviewer',
    dept: 'School of Computing Sciences',
    tag: 'Prototype Data / Faculty Mentor',
  },
];

export default function About() {
  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="About the Research Project"
          subtitle="Academic motivation, institutional scope, and methodology behind CampusFix+."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'About' },
          ]}
        />

        {/* Motivation & Background */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 sm:p-8">
              <div className="flex items-center gap-3 text-primary-700">
                <BookOpen className="h-6 w-6" />
                <h2 className="text-xl font-bold text-slate-900">Research Motivation</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Modern university campuses operate as small municipalities, housing hundreds of classrooms, research laboratories, and student residences. However, campus facility management frequently relies on antiquated paper logs, informal messaging groups, or unindexed phone calls to warden desks.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                This project investigates how a closed-loop digital workflow engine—combining hierarchical spatial taxonomy, strict role-based state machines, and mandatory end-user verification—alleviates administrative overhead, enforces accountability, and restores student trust.
              </p>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="flex items-center gap-3 text-primary-700">
                <Target className="h-6 w-6" />
                <h2 className="text-xl font-bold text-slate-900">Core Project Objectives</h2>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                {OBJECTIVES.map((obj) => (
                  <li key={obj} className="flex items-start gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-600" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Scope and Paper Information */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 text-teal-700">
                <Compass className="h-5 w-5" />
                <h2 className="text-base font-bold text-slate-900">Institutional Scope</h2>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Designed for tertiary academic institutions featuring multiple residential hostels, central administrative complexes, library zones, and engineering workshops.
              </p>
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">
                <strong>Publication Target:</strong> Major undergraduate engineering capstone paper following standard IEEE manuscript structure.
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 text-primary-700">
                <Users className="h-5 w-5" />
                <h2 className="text-base font-bold text-slate-900">Project Investigators</h2>
              </div>
              <div className="mt-4 space-y-3.5">
                {TEAM_MEMBERS.map((m) => (
                  <div key={m.name} className="border-b border-slate-100 pb-3 last:border-none last:pb-0">
                    <p className="text-xs font-bold text-slate-900">{m.name}</p>
                    <p className="text-[11px] text-slate-600">{m.role}</p>
                    <p className="text-[10px] text-slate-400">{m.dept}</p>
                    <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 border border-amber-200">
                      {m.tag}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
