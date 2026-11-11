import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import FeaturesSection from './components/FeaturesSection';
import { Check, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

const COMPARISON_ROWS = [
  {
    criterion: 'Issue Registration',
    traditional: 'Physical notebook or phone call to hostel warden',
    campusfix: 'Location-aware digital form with photo evidence',
  },
  {
    criterion: 'Location Accuracy',
    traditional: 'Vague verbal descriptions causing lost technician time',
    campusfix: 'Hierarchical campus tree (Building → Floor → Room)',
  },
  {
    criterion: 'Accountability & Ownership',
    traditional: 'No assigned individual; tickets bounce between depts',
    campusfix: 'Admin triage assigns specific technician with SLA timer',
  },
  {
    criterion: 'Lifecycle Visibility',
    traditional: 'Complete black box; student repeatedly checks office',
    campusfix: 'Real-time status tracking & in-app notifications',
  },
  {
    criterion: 'Resolution Verification',
    traditional: 'Technician self-marks complete; no confirmation',
    campusfix: 'Originating student must inspect & sign off or reopen',
  },
  {
    criterion: 'Historical Audit Trail',
    traditional: 'Lost with old paper registers at end of term',
    campusfix: 'Persistent relational audit history with timestamps',
  },
];

export default function Features() {
  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Platform Features & Capabilities"
          subtitle="A comprehensive overview of the modules driving automated campus maintenance operations."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Features' },
          ]}
        />

        {/* Core 8 Feature Grid */}
        <div className="mt-8">
          <FeaturesSection />
        </div>

        {/* Architectural Comparison Table */}
        <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900">
              Comparative Analysis: Traditional vs. CampusFix+
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Evaluating the systemic improvements introduced by our closed-loop state machine over legacy paper procedures.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-3 font-semibold">Operational Dimension</th>
                  <th className="p-3 font-semibold text-rose-700">Traditional Campus Practice</th>
                  <th className="p-3 font-semibold text-primary-700">CampusFix+ Digital Ecosystem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.criterion} className="hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-900">{row.criterion}</td>
                    <td className="p-3 text-slate-600">
                      <div className="flex items-start gap-2">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
                        <span>{row.traditional}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-900 font-medium bg-primary-50/20">
                      <div className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                        <span>{row.campusfix}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-center">
            <Link to="/login">
              <Button variant="primary" icon={<ArrowRight className="h-4 w-4" />}>
                Test Working Prototype Features
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
