/**
 * ModulePage — reusable template rendered at /modules/:slug.
 * All content is driven by the MODULES_REGISTRY in src/data/modules.js.
 * PrototypeBanner and ComingSoonBadge are always visible per spec.
 */
import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { getModuleBySlug } from '../../data/modules';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import ComingSoonBadge from '../../components/ui/ComingSoonBadge';
import Card from '../../components/ui/Card';

const CATEGORY_COLORS = {
  Intelligence: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200', icon: 'bg-violet-100', accent: '#7c3aed' },
  Infrastructure: { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200', icon: 'bg-teal-100', accent: '#0d9488' },
  Community: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', icon: 'bg-orange-100', accent: '#ea580c' },
  Insights: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200', icon: 'bg-indigo-100', accent: '#4f46e5' },
};

const PHASE_COLORS = {
  'Phase 1': 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  'Phase 2': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'Phase 3': 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

function getPhaseColor(phase) {
  if (phase.startsWith('Phase 1')) return PHASE_COLORS['Phase 1'];
  if (phase.startsWith('Phase 2')) return PHASE_COLORS['Phase 2'];
  return PHASE_COLORS['Phase 3'];
}

/** Simple SVG workflow integration diagram */
function WorkflowDiagram({ module: mod }) {
  const colors = CATEGORY_COLORS[mod.category] || CATEGORY_COLORS.Intelligence;
  const nodes = [
    { id: 'student', label: 'Student', sub: 'Submits complaint', x: 60, color: '#6366f1' },
    { id: 'system', label: 'CampusFix+', sub: 'Core platform', x: 220, color: '#0f172a' },
    { id: 'module', label: mod.name.split(' ').slice(0, 2).join(' '), sub: '(Planned module)', x: 380, color: colors.accent },
    { id: 'admin', label: 'Administrator', sub: 'Reviews result', x: 540, color: '#0d9488' },
  ];

  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 640 120" className="w-full max-w-2xl" aria-label={`Planned integration flow for ${mod.name}`} role="img">
        {/* Connector lines */}
        {nodes.slice(0, -1).map((n, i) => (
          <g key={`line-${i}`}>
            <line x1={n.x + 55} y1={60} x2={nodes[i + 1].x - 5} y2={60} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 3" />
            <polygon points={`${nodes[i + 1].x - 5},56 ${nodes[i + 1].x + 4},60 ${nodes[i + 1].x - 5},64`} fill="#94a3b8" />
          </g>
        ))}
        {/* Nodes */}
        {nodes.map((n) => (
          <g key={n.id}>
            <rect x={n.x} y={40} width={110} height={40} rx={8} fill="white" stroke={n.color} strokeWidth={1.5} />
            <text x={n.x + 55} y={57} textAnchor="middle" fontSize={10} fontWeight="600" fill={n.color}>{n.label}</text>
            <text x={n.x + 55} y={71} textAnchor="middle" fontSize={8.5} fill="#64748b">{n.sub}</text>
          </g>
        ))}
        {/* "Planned" label on module node */}
        <rect x={374} y={28} width={122} height={14} rx={4} fill={colors.accent} opacity={0.12} />
        <text x={435} y={39} textAnchor="middle" fontSize={8} fontWeight="700" fill={colors.accent} letterSpacing="0.05em">PLANNED MODULE</text>
      </svg>
    </div>
  );
}

export default function ModulePage() {
  const { slug } = useParams();
  const mod = getModuleBySlug(slug);

  if (!mod) return <Navigate to="/not-found" replace />;

  const colors = CATEGORY_COLORS[mod.category] || CATEGORY_COLORS.Intelligence;
  const IconComp = Icons[mod.icon] || Icons.Sparkles;

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-slate-900">Home</Link>
          <Icons.ChevronRight className="h-3 w-3" />
          <Link to="/modules" className="hover:text-slate-900">Modules</Link>
          <Icons.ChevronRight className="h-3 w-3" />
          <span className="text-slate-900 font-medium truncate">{mod.name}</span>
        </nav>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <div className={`rounded-2xl border ${colors.ring} ${colors.bg} p-6 sm:p-8`}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${colors.icon} ring-1 ${colors.ring}`}>
              <IconComp className={`h-7 w-7 ${colors.text}`} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
                  {mod.category}
                </span>
                <ComingSoonBadge />
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${getPhaseColor(mod.researchPhase)}`}>
                  {mod.researchPhase}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">{mod.name}</h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{mod.summary}</p>
            </div>
          </div>
        </div>

        {/* Always-visible prototype banner */}
        <PrototypeBanner message="This module has not been implemented. All capabilities described below are planned research objectives — no AI, IoT, or automation is currently operational." />

        {/* ── Problem Statement ─────────────────────────────────── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Icons.AlertCircle className="h-4 w-4 text-rose-500" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Problem Being Addressed</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{mod.problem}</p>
        </Card>

        {/* ── Planned Capabilities ──────────────────────────────── */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Icons.Sparkles className="h-4 w-4 text-violet-500" aria-hidden="true" />
            What It Will Do <span className="text-xs font-normal text-slate-400 ml-1">(Planned)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mod.capabilities.map((cap, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${colors.bg} ${colors.text}`}>
                  {i + 1}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{cap}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Workflow Integration Diagram ──────────────────────── */}
        <Card className="p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Icons.GitBranch className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            How It Will Connect to CampusFix+ <span className="text-xs font-normal text-slate-400 ml-1">(Planned integration)</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">{mod.workflowIntegration}</p>
          <WorkflowDiagram module={mod} />
        </Card>

        {/* ── Planned Data & Approach ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Icons.Database className="h-4 w-4 text-teal-500" aria-hidden="true" />
              Planned Data Inputs
            </h2>
            <ul className="space-y-2">
              {mod.plannedInputs.map((input, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <Icons.ArrowRight className="h-3 w-3 text-teal-400 shrink-0 mt-0.5" aria-hidden="true" />
                  {input}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Icons.FlaskConical className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Planned Technique & Approach
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">{mod.plannedApproach}</p>
          </Card>
        </div>

        {/* ── Success Metrics ───────────────────────────────────── */}
        <Card className="p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Icons.Target className="h-4 w-4 text-green-500" aria-hidden="true" />
            How Success Will Be Measured
            <span className="text-xs font-normal text-slate-400">(To be evaluated after deployment)</span>
          </h2>
          <div className="space-y-2">
            {mod.successMetrics.map((metric, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Icons.CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-slate-700">{metric}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Current Status Panel ──────────────────────────────── */}
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <Icons.Clock className="h-8 w-8 text-slate-400 mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-700">Current Status: Not Implemented</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            This module is in <strong>{mod.researchPhase}</strong>. No code, model, sensor, or API for this module exists in the current prototype build.
            It is described here to present the full research vision alongside the IEEE paper.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <ComingSoonBadge label={mod.researchPhase} />
          </div>
        </div>

        {/* ── Back navigation ──────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Link
            to="/modules"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Icons.ArrowLeft className="h-3.5 w-3.5" />
            Back to All Modules
          </Link>
          <Link
            to="/research"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Read Research Paper Context
            <Icons.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
