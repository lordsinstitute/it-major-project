import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Wifi, Eye, LineChart, Cpu, Sparkles, ArrowRight } from 'lucide-react';
import ComingSoonBadge from '../../../components/ui/ComingSoonBadge';
import Button from '../../../components/ui/Button';

const RESEARCH_MODULES = [
  {
    id: 'ai-triage',
    slug: 'duplicate-detection',
    icon: Bot,
    title: 'AI Automated Triage & Duplicate Detection',
    description: 'NLP embedding similarity (BERT/SentenceTransformers) to detect duplicate reports across blocks and auto-recommend urgency.',
    paperSection: 'Section IV-A',
  },
  {
    id: 'iot-sensors',
    slug: 'smart-iot-monitoring',
    icon: Wifi,
    title: 'IoT Environmental & Leak Telemetry',
    description: 'ESP32/LoRaWAN node integration for automated water pipe burst detection and smart waste bin capacity monitoring.',
    paperSection: 'Section IV-B',
  },
  {
    id: 'cv-damage',
    slug: 'computer-vision',
    icon: Eye,
    title: 'Computer Vision Damage Severity Analysis',
    description: 'Convolutional neural network for classifying structural cracks, water seepage, and furniture breakage from uploaded photos.',
    paperSection: 'Section IV-C',
  },
  {
    id: 'predictive-maint',
    slug: 'predictive-maintenance',
    icon: LineChart,
    title: 'Predictive Infrastructure Degradation',
    description: 'Time-series forecasting models predicting component failure intervals based on historical repair logs and weather patterns.',
    paperSection: 'Section IV-D',
  },
];

export default function ModulesPreviewSection() {
  return (
    <section className="bg-white py-16 sm:py-20 border-b border-slate-200" aria-labelledby="modules-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>Academic Research Roadmap</span>
          </div>
          <h2 id="modules-heading" className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Advanced AI & IoT Research Ecosystem
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Beyond the core workflow engine, CampusFix+ outlines four applied research modules undergoing academic paper development.
          </p>
        </div>

        {/* 4 Research Module Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RESEARCH_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className="relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm transition-all hover:border-slate-300 hover:bg-white"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-200">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <ComingSoonBadge />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900">{mod.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{mod.description}</p>
                </div>

                <div className="mt-5 border-t border-slate-200/60 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono font-medium text-slate-700">{mod.paperSection}</span>
                  <Link to={`/modules/${mod.slug}`} className="font-semibold text-primary-600 hover:text-primary-700">
                    Read Spec →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link to="/modules">
            <Button variant="outline" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
              View Comprehensive Research Module Breakdown
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
