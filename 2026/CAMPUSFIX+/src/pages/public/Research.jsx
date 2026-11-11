/**
 * Research — /research page for the IEEE paper context.
 * Presents problem statement, objectives, system architecture diagram,
 * methodology, evaluation plan, limitations, and future work.
 * All content is clearly labelled as planned/proposed; no fake results.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import Card from '../../components/ui/Card';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import { MODULES_REGISTRY, MODULE_CATEGORIES } from '../../data/modules';

/* ── Architecture Layer Diagram (inline SVG) ─────────────────────────── */
const ARCH_LAYERS = [
  {
    id: 'presentation',
    label: 'Presentation Layer',
    sublabel: 'React 18 + Vite SPA',
    items: ['Student Portal', 'Admin Console', 'Staff Workspace', 'Public Pages'],
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    id: 'api',
    label: 'API Gateway Layer',
    sublabel: 'Planned — Spring Boot / FastAPI',
    items: ['REST API', 'JWT Auth', 'Role Guard', 'Rate Limiting'],
    color: '#0d9488',
    bg: '#f0fdfa',
  },
  {
    id: 'services',
    label: 'Core Services Layer',
    sublabel: 'Planned — Microservices',
    items: ['Complaint Service', 'Notification Service', 'Assignment Engine', 'SLA Tracker'],
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    id: 'data',
    label: 'Data Layer',
    sublabel: 'Planned — PostgreSQL + Redis',
    items: ['Complaint DB', 'User Store', 'Timeline Log', 'Cache'],
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    id: 'ai',
    label: 'Planned AI / ML Layer',
    sublabel: 'Research Phase — Not Implemented',
    items: ['NLP Classifier', 'CV Damage Model', 'Duplicate Detector', 'Predictive Model'],
    color: '#d97706',
    bg: '#fffbeb',
    planned: true,
  },
  {
    id: 'iot',
    label: 'Planned IoT Layer',
    sublabel: 'Research Phase — Not Implemented',
    items: ['ESP32 Mesh', 'MQTT Broker', 'Flow Meters', 'Bin Sensors'],
    color: '#dc2626',
    bg: '#fef2f2',
    planned: true,
  },
];

const PHASES = [
  {
    phase: 1,
    title: 'Prototype Development',
    status: 'Complete',
    statusColor: 'bg-green-100 text-green-700 ring-green-200',
    items: [
      'Define complaint lifecycle state machine (8 states, role-enforced transitions)',
      'Build Student, Admin, and Staff portals with full CRUD complaint flow',
      'Implement SLA tracking by priority and admin action console',
      'Create mock data layer with 30+ realistic complaint records',
      'Build responsive UI with Recharts dashboards and timeline audit trail',
    ],
  },
  {
    phase: 2,
    title: 'Data Collection & Labelling',
    status: 'Planned',
    statusColor: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
    items: [
      'Deploy prototype at target institution and collect real complaint records',
      'Label complaint text with category and priority ground truth',
      'Digitise campus floor plans as SVG for indoor map module',
      'Procure ESP32 hardware for IoT sensor pilot in two buildings',
      'Conduct student and administrator usability survey (N≥30)',
    ],
  },
  {
    phase: 3,
    title: 'AI Module Development',
    status: 'Planned',
    statusColor: 'bg-blue-100 text-blue-700 ring-blue-200',
    items: [
      'Fine-tune BERT-based classifier on labelled complaint corpus',
      'Train MobileNetV3 damage classifier on campus evidence photo dataset',
      'Implement FAISS duplicate detection with cosine similarity threshold',
      'Integrate Weibull survival analysis for predictive maintenance forecasting',
      'Evaluate each module independently before system integration',
    ],
  },
  {
    phase: 4,
    title: 'Evaluation & Reporting',
    status: 'Planned',
    statusColor: 'bg-slate-100 text-slate-600 ring-slate-200',
    items: [
      'A/B evaluation: prototype-only group vs. prototype + AI modules group',
      'Measure resolution time reduction, reopen rate, and triage accuracy',
      'Administer post-deployment satisfaction survey (Likert scale)',
      'Compile findings for IEEE paper submission and peer review',
      'Document limitations and propose future work for subsequent research phases',
    ],
  },
];

const METRICS = [
  { label: 'Mean Complaint Resolution Time', unit: 'hours', description: 'From SUBMITTED to VERIFIED, by priority tier', icon: 'Clock' },
  { label: 'Complaint Reopen Rate', unit: '%', description: 'Complaints reopened by students after RESOLVED status', icon: 'RotateCcw' },
  { label: 'Classification Accuracy', unit: '%', description: 'Admin-confirmed category matches NLP suggestion (planned)', icon: 'Target' },
  { label: 'Duplicate Detection Precision', unit: '%', description: 'Fraction of flagged duplicates confirmed by admin (planned)', icon: 'Copy' },
  { label: 'User Satisfaction Score', unit: '/ 5', description: 'Student and staff Likert-scale post-survey mean', icon: 'Star' },
  { label: 'SLA Compliance Rate', unit: '%', description: 'Complaints resolved within priority target window', icon: 'CheckCircle2' },
];

function ArchDiagram() {
  return (
    <div className="overflow-x-auto" aria-label="Planned system architecture layers" role="img">
      <div className="min-w-[480px] space-y-2">
        {ARCH_LAYERS.map((layer) => (
          <div
            key={layer.id}
            className="flex items-stretch rounded-xl border overflow-hidden"
            style={{ borderColor: layer.color + '40' }}
          >
            {/* Left label */}
            <div
              className="flex flex-col items-center justify-center px-3 py-3 min-w-[140px] text-center"
              style={{ backgroundColor: layer.bg, borderRight: `2px solid ${layer.color}30` }}
            >
              <p className="text-[11px] font-bold leading-tight" style={{ color: layer.color }}>{layer.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{layer.sublabel}</p>
              {layer.planned && (
                <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Planned
                </span>
              )}
            </div>
            {/* Right items */}
            <div className="flex-1 flex flex-wrap items-center gap-2 px-4 py-3" style={{ backgroundColor: layer.bg + '60' }}>
              {layer.items.map((item) => (
                <span
                  key={item}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg border"
                  style={{
                    color: layer.color,
                    borderColor: layer.color + '30',
                    backgroundColor: layer.planned ? layer.bg : 'white',
                    opacity: layer.planned ? 0.85 : 1,
                  }}
                >
                  {layer.planned ? '⋯ ' : ''}{item}
                </span>
              ))}
            </div>
          </div>
        ))}
        <p className="text-[10px] text-slate-400 text-center pt-1">
          Layers marked "Planned" are research objectives — not present in the current prototype build.
        </p>
      </div>
    </div>
  );
}

export default function Research() {
  const [expandedPhase, setExpandedPhase] = useState(1);
  const moduleCount = MODULES_REGISTRY.length;
  const catCounts = {};
  MODULES_REGISTRY.forEach((m) => { catCounts[m.category] = (catCounts[m.category] || 0) + 1; });

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-slate-900">Home</Link>
          <Icons.ChevronRight className="h-3 w-3" />
          <span className="text-slate-900 font-medium">Research</span>
        </nav>

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Icons.FileText className="h-5 w-5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">IEEE Research Paper Context</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
            CampusFix+: A Role-Based Campus Complaint Management System
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Integrating State-Machine Workflows, SLA Enforcement, and Planned AI/IoT Extensions for Institutional Facilities Management
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <Icons.Users className="h-3 w-3" /> Multi-role prototype (Student · Admin · Staff)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <Icons.Layers className="h-3 w-3" /> {moduleCount} planned research modules
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 px-3 py-1">
              <Icons.Clock className="h-3 w-3" /> [Abstract to be added]
            </span>
          </div>
        </div>

        <PrototypeBanner message="This page presents the research context and planned system vision. All sections marked with [Planned] describe future work. The current prototype implements the core complaint workflow only — no AI or IoT features are operational." />

        {/* ── Problem Statement ────────────────────────────────── */}
        <section aria-labelledby="problem-heading">
          <h2 id="problem-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Icons.AlertCircle className="h-5 w-5 text-rose-500" />
            Problem Statement
          </h2>
          <Card className="p-6">
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              Campus facilities management in higher education institutions relies heavily on informal, unstructured reporting channels — verbal complaints, email threads, and WhatsApp messages — that are neither trackable, accountable, nor auditable. This results in:
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                'Duplicate staff dispatches for the same fault reported by multiple students',
                'Absence of formal SLA tracking, making resolution accountability impossible',
                'No structured handover between students, administrators, and maintenance staff',
                'Lack of data for facilities planning, budgeting, and institutional reporting',
                'Students unable to track complaint status, leading to repeated follow-ups',
              ].map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Icons.X className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <p className="text-xs text-indigo-800 font-medium">
                CampusFix+ addresses these gaps through a formalised state-machine complaint lifecycle, role-enforced workflows, SLA tracking by priority, and a research roadmap for AI/IoT extensions.
              </p>
            </div>
          </Card>
        </section>

        {/* ── Research Objectives ──────────────────────────────── */}
        <section aria-labelledby="objectives-heading">
          <h2 id="objectives-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Icons.Target className="h-5 w-5 text-indigo-500" />
            Research Objectives
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { obj: 'Design and implement a formalised complaint lifecycle state machine with role-enforced transitions', icon: 'GitBranch', color: 'text-violet-600 bg-violet-50 ring-violet-200' },
              { obj: 'Develop a multi-role web portal supporting Student, Administrator, and Maintenance Staff workflows', icon: 'Users', color: 'text-blue-600 bg-blue-50 ring-blue-200' },
              { obj: 'Implement priority-based SLA tracking and automated overdue detection', icon: 'Clock', color: 'text-amber-600 bg-amber-50 ring-amber-200' },
              { obj: 'Propose and specify an NLP complaint classification module with planned evaluation metrics', icon: 'Bot', color: 'text-teal-600 bg-teal-50 ring-teal-200' },
              { obj: 'Design a computer vision damage severity classifier for student-submitted evidence photos', icon: 'Eye', color: 'text-rose-600 bg-rose-50 ring-rose-200' },
              { obj: 'Specify an IoT sensor integration architecture for proactive infrastructure monitoring', icon: 'Wifi', color: 'text-orange-600 bg-orange-50 ring-orange-200' },
              { obj: 'Define a comprehensive evaluation plan with measurable metrics for resolution time, reopen rate, and classification accuracy', icon: 'BarChart3', color: 'text-indigo-600 bg-indigo-50 ring-indigo-200' },
              { obj: 'Produce an extensible prototype codebase supporting future module integration without architectural changes', icon: 'Code2', color: 'text-slate-600 bg-slate-50 ring-slate-200' },
            ].map((item, i) => {
              const Icon = Icons[item.icon] || Icons.Check;
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ${item.color}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{item.obj}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── System Architecture ──────────────────────────────── */}
        <section aria-labelledby="architecture-heading">
          <h2 id="architecture-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
            <Icons.Layers className="h-5 w-5 text-teal-500" />
            Proposed System Architecture
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Layered architecture diagram. Layers marked "Planned" are research objectives — not present in the current prototype.
          </p>
          <Card className="p-6">
            <ArchDiagram />
          </Card>
        </section>

        {/* ── Research Phases ──────────────────────────────────── */}
        <section aria-labelledby="methodology-heading">
          <h2 id="methodology-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Icons.BookOpen className="h-5 w-5 text-violet-500" />
            Methodology Phases
          </h2>
          <div className="space-y-3">
            {PHASES.map((p) => (
              <div key={p.phase} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  onClick={() => setExpandedPhase(expandedPhase === p.phase ? null : p.phase)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                  aria-expanded={expandedPhase === p.phase}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">
                      {p.phase}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ${p.statusColor}`}>
                      {p.status}
                    </span>
                  </div>
                  <Icons.ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${expandedPhase === p.phase ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedPhase === p.phase && (
                  <div className="px-5 pb-4 border-t border-slate-100">
                    <ul className="mt-3 space-y-2">
                      {p.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <Icons.ArrowRight className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Evaluation Plan ───────────────────────────────────── */}
        <section aria-labelledby="evaluation-heading">
          <h2 id="evaluation-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Icons.BarChart3 className="h-5 w-5 text-green-500" />
            Planned Evaluation Plan
            <span className="text-xs font-normal text-slate-400">(To be conducted after Phase 2 deployment)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {METRICS.map((m, i) => {
              const Icon = Icons[m.icon] || Icons.Activity;
              return (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                    <span className="text-xs font-bold text-slate-900">{m.label}</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-300 mb-1">
                    — {m.unit}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{m.description}</p>
                  <p className="text-[10px] text-amber-600 font-medium mt-2">[Data to be collected after deployment]</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── Module Summary ────────────────────────────────────── */}
        <section aria-labelledby="modules-summary-heading">
          <h2 id="modules-summary-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Icons.Layers className="h-5 w-5 text-orange-500" />
            Planned Module Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {Object.entries(catCounts).map(([cat, count]) => (
              <Card key={cat} className="p-4 text-center">
                <div className="text-2xl font-extrabold text-slate-900">{count}</div>
                <p className="text-xs text-slate-500 mt-1">{cat} modules</p>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/modules"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Icons.Layers className="h-4 w-4" />
              Browse All {moduleCount} Modules
            </Link>
          </div>
        </section>

        {/* ── Limitations ──────────────────────────────────────── */}
        <section aria-labelledby="limitations-heading">
          <h2 id="limitations-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Icons.AlertTriangle className="h-5 w-5 text-amber-500" />
            Acknowledged Limitations
          </h2>
          <Card className="p-6">
            <ul className="space-y-3 text-sm text-slate-600">
              {[
                'The current prototype uses in-memory mock data only. No production database, server, or authentication infrastructure has been deployed.',
                'All AI/ML capabilities (NLP classifier, CV model, duplicate detector, predictive model) are planned modules — none have been trained, evaluated, or integrated.',
                'The IoT sensor layer (ESP32 mesh, MQTT broker, flow meters) is a hardware design specification only — no physical sensors have been procured or deployed.',
                'Usability and resolution-time evaluation data does not yet exist. All metrics in the evaluation plan are targets to be measured post-deployment.',
                'The prototype evaluation involves a small student population at a single institution. Findings may not generalise across different campus types or administrative cultures.',
                'The state machine enforces the planned 8-state lifecycle but may require adjustment after observing real usage patterns in production.',
              ].map((lim, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Icons.Minus className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  {lim}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* ── Future Work ───────────────────────────────────────── */}
        <section aria-labelledby="future-heading">
          <h2 id="future-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Icons.Rocket className="h-5 w-5 text-violet-500" />
            Future Work
          </h2>
          <Card className="p-6">
            <ul className="space-y-3 text-sm text-slate-600">
              {[
                'Deploy the complaint management core on a production Spring Boot backend with PostgreSQL and conduct a real-institution pilot study.',
                'Collect sufficient labelled complaint records (target: N≥500) to train and evaluate the NLP classification module.',
                'Acquire and pilot ESP32 IoT hardware in two campus buildings for water leak and bin overflow detection.',
                'Extend the state machine to support multi-building complaint aggregation for systemic fault detection.',
                'Conduct a controlled experiment comparing resolution times before and after AI triage assistance.',
                'Explore federated deployment: multiple institutions sharing a common platform with institution-scoped data isolation.',
                'Investigate student-facing mobile application for complaint submission and real-time status push notifications.',
              ].map((fw, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Icons.ArrowRight className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                  {fw}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* ── Abstract placeholder ─────────────────────────────── */}
        <Card className="p-6 border-dashed border-2 border-slate-300">
          <div className="flex items-center gap-2 mb-3">
            <Icons.FileText className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-500">Paper Abstract</h2>
          </div>
          <p className="text-sm text-slate-400 italic">[Abstract to be added — pending IEEE paper submission]</p>
          <p className="text-xs text-slate-400 mt-2">[Authors, institution, keywords, and DOI to be added upon submission]</p>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
            <Icons.ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
          <Link to="/modules" className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            Browse All Modules <Icons.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
