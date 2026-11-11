import React from 'react';
import { 
  FilePlus2, 
  MapPin, 
  Activity, 
  UserCheck, 
  Wrench, 
  CheckCircle, 
  BellRing, 
  Shield 
} from 'lucide-react';

const FEATURES = [
  {
    icon: FilePlus2,
    title: 'Complaint Submission',
    desc: 'Structured issue reporting with title, description, category selection, and urgency flags for rapid triage.',
  },
  {
    icon: MapPin,
    title: 'Location-Aware Reporting',
    desc: 'Precise hierarchical campus mapping by Building, Floor, and Room number to guide field technicians directly.',
  },
  {
    icon: Activity,
    title: 'Status & Timeline Tracking',
    desc: 'Real-time visibility into complaint progress from submission to review, assignment, resolution, and closure.',
  },
  {
    icon: UserCheck,
    title: 'Admin Assignment Engine',
    desc: 'Centralized queue for facility administrators to evaluate priority, reject invalid tickets, and assign staff.',
  },
  {
    icon: Wrench,
    title: 'Staff Progress Updates',
    desc: 'Dedicated task list for maintenance staff to accept work orders, update notes, and mark work completed.',
  },
  {
    icon: CheckCircle,
    title: 'Resolution Verification',
    desc: 'Student sign-off step ensuring work was performed satisfactorily, with ability to reopen if unresolved.',
  },
  {
    icon: BellRing,
    title: 'In-App Notifications',
    desc: 'Contextual alert feed keeping users informed of assignments, status transitions, and pending actions.',
  },
  {
    icon: Shield,
    title: 'Role-Based Portals',
    desc: 'Tailored interfaces and permission boundaries for Students, Estate Administrators, and Maintenance Staff.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Working Prototype Capabilities</p>
          <h2 id="features-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Engineered for complete operational control
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Eight foundational modules currently active in the client prototype, establishing end-to-end auditability across the institution.
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
              >
                <div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-primary-100 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{feat.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{feat.desc}</p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Interactive in Prototype</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
