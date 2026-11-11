import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Wrench, ArrowRight } from 'lucide-react';
import Button from '../../../components/ui/Button';

const ROLES = [
  {
    role: 'Student & Campus Resident',
    icon: GraduationCap,
    theme: 'border-primary-200 bg-primary-50/30',
    iconBg: 'bg-primary-600 text-white',
    summary: 'Direct empowerment to report faults instantly, track progress without visiting offices, and confirm resolution quality.',
    capabilities: [
      'Report issues with building, room, and category',
      'Track live status timeline and admin comments',
      'Receive instant status change notifications',
      'Sign off on verified fix or reopen with feedback',
    ],
    cta: 'Explore Student View',
    link: '/login?role=STUDENT',
  },
  {
    role: 'Estate Administrator',
    icon: ShieldCheck,
    theme: 'border-amber-200 bg-amber-50/30',
    iconBg: 'bg-amber-600 text-white',
    summary: 'Total operational overview of campus health, automated queue triage, priority enforcement, and resource allocation.',
    capabilities: [
      'Review pending complaints across all departments',
      'Assign technician staff and set SLA urgency',
      'Detect bottlenecks, overdue tickets, and repeat faults',
      'Filter complaints by building, category, and date',
    ],
    cta: 'Explore Admin View',
    link: '/login?role=ADMIN',
  },
  {
    role: 'Maintenance Technician',
    icon: Wrench,
    theme: 'border-teal-200 bg-teal-50/30',
    iconBg: 'bg-teal-600 text-white',
    summary: 'Clear, uncluttered work order list prioritized by urgency with exact location details and field execution notes.',
    capabilities: [
      'View assigned tickets prioritized by SLA deadline',
      'Access exact campus location coordinates',
      'Acknowledge task receipt (IN_PROGRESS)',
      'Submit resolution summary upon job completion',
    ],
    cta: 'Explore Staff View',
    link: '/login?role=STAFF',
  },
];

export default function AudienceSection() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20" aria-labelledby="audience-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Stakeholder Alignment</p>
          <h2 id="audience-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Tailored interfaces for every campus stakeholder
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Each role interacts with a dedicated portal stripped of unnecessary noise, providing exactly the controls needed for rapid execution.
          </p>
        </div>

        {/* 3 Role Cards */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.role}
                className={`flex flex-col justify-between rounded-2xl border ${r.theme} bg-white p-7 shadow-sm transition-all hover:shadow-md`}
              >
                <div>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${r.iconBg} shadow-sm`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{r.role}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{r.summary}</p>

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Core Capabilities</p>
                    <ul className="mt-3 space-y-2 text-xs text-slate-700">
                      {r.capabilities.map((cap) => (
                        <li key={cap} className="flex items-start gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <Link to={r.link} className="block w-full">
                    <Button variant="outline" size="sm" className="w-full justify-center" icon={<ArrowRight className="h-4 w-4" />}>
                      {r.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
