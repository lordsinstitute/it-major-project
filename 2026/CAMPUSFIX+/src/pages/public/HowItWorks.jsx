import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import HowItWorksSection from './components/HowItWorksSection';
import { STATUSES, STATUS_META } from '../../constants/statuses';
import { PRIORITIES, PRIORITY_META } from '../../constants/priorities';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Card from '../../components/ui/Card';

const STATUS_DESCRIPTIONS = {
  SUBMITTED: 'Issue recorded with location, category, and evidence; pending initial triage.',
  UNDER_REVIEW: 'Administrator is evaluating validity, duplication, and required materials.',
  ASSIGNED: 'Technician has been allocated and SLA resolution countdown is active.',
  IN_PROGRESS: 'Technician is physically at the site carrying out repair operations.',
  RESOLVED: 'Maintenance work completed; technician submitted repair notes.',
  VERIFIED: 'Originating student has inspected the work and signed off on completion.',
  REOPENED: 'Student rejected resolution due to recurring fault; reset to urgent triage.',
  REJECTED: 'Ticket closed by administrator with justification (out of scope or duplicate).',
};

export default function HowItWorks() {
  const statusKeys = Object.values(STATUSES);
  const priorityKeys = Object.values(PRIORITIES);

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Workflow Engine & State Transitions"
          subtitle="How CampusFix+ manages complaint lifecycles with strict role-based state progressions."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'How It Works' },
          ]}
        />

        {/* 4-Step Flow */}
        <div className="mt-8">
          <HowItWorksSection />
        </div>

        {/* 2 Grids: State Machine States & SLA Target Standards */}
        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
          
          {/* Status Lifecycle Glossary */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Complaint Status State Machine
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Only authorized roles can trigger valid transitions according to strict state diagrams.
            </p>

            <div className="mt-5 space-y-3">
              {statusKeys.map((key) => (
                <div key={key} className="flex items-start gap-3 rounded-lg border border-slate-100 p-2.5">
                  <StatusBadge status={key} />
                  <p className="text-xs leading-relaxed text-slate-600">
                    {STATUS_DESCRIPTIONS[key]}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Priority & SLA Thresholds */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Service-Level Agreement (SLA) Targets
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Target resolution windows assigned during admin triage based on safety and operational severity.
            </p>

            <div className="mt-5 space-y-3">
              {priorityKeys.map((key) => {
                const meta = PRIORITY_META[key];
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center gap-3">
                      <PriorityBadge priority={key} />
                      <span className="text-xs text-slate-600 font-medium">Standard SLA Window</span>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800">
                      {meta.resolutionHours}h target
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg bg-primary-50 p-3.5 text-xs text-primary-800 border border-primary-100">
              <strong>The Student Verification Guarantee:</strong> A ticket can never be archived as complete until the student confirms it. If work is unsatisfactory, reopening resets the assignment with dispute feedback.
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
