import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import RoadmapSection from './components/RoadmapSection';
import Card from '../../components/ui/Card';
import { Sparkles, CheckCircle2, Clock } from 'lucide-react';

export default function Roadmap() {
  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Implementation & Research Roadmap"
          subtitle="Detailed phasing strategy from client prototype to enterprise backend and academic evaluation."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Roadmap' },
          ]}
        />

        {/* Phased Roadmap Timeline */}
        <div className="mt-8">
          <RoadmapSection />
        </div>

        {/* Methodology Notes */}
        <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">Research Engineering Methodology</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Our progressive development strategy prioritizes operational usability and client verification before introducing high-complexity AI models. This prevents the common pitfall of building machine learning layers on top of broken organizational workflows.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <span className="text-xs font-bold text-slate-900">Step 1: Protocol Rigor</span>
              <p className="mt-1 text-xs text-slate-600">Strict state progression definitions before automation.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <span className="text-xs font-bold text-slate-900">Step 2: Service Decoupling</span>
              <p className="mt-1 text-xs text-slate-600">Mock services match REST signatures exactly.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <span className="text-xs font-bold text-slate-900">Step 3: Verification Sign-Off</span>
              <p className="mt-1 text-xs text-slate-600">Human consensus loop precedes automated closure.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
