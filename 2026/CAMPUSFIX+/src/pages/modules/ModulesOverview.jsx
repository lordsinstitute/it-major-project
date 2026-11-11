/**
 * ModulesOverview — /modules hub page.
 * Displays all 16 research modules with category filter, search, and status legend.
 */
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { MODULES_REGISTRY, MODULE_CATEGORIES } from '../../data/modules';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import ComingSoonBadge from '../../components/ui/ComingSoonBadge';
import PrototypeBanner from '../../components/ui/PrototypeBanner';

const ALL_LABEL = 'All Modules';

const CATEGORY_META = {
  [MODULE_CATEGORIES.INTELLIGENCE]: {
    icon: 'Bot',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    ring: 'ring-violet-200',
    iconBg: 'bg-violet-100',
    activeBg: 'bg-violet-600',
    activeText: 'text-white',
    desc: 'NLP, computer vision, and ML-based complaint automation modules',
  },
  [MODULE_CATEGORIES.INFRASTRUCTURE]: {
    icon: 'Cpu',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    ring: 'ring-teal-200',
    iconBg: 'bg-teal-100',
    activeBg: 'bg-teal-600',
    activeText: 'text-white',
    desc: 'IoT sensor meshes, smart meters, indoor maps, and physical asset monitoring',
  },
  [MODULE_CATEGORIES.COMMUNITY]: {
    icon: 'Users',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    ring: 'ring-orange-200',
    iconBg: 'bg-orange-100',
    activeBg: 'bg-orange-500',
    activeText: 'text-white',
    desc: 'Student engagement, safety reporting, events, forums, and lost & found',
  },
  [MODULE_CATEGORIES.INSIGHTS]: {
    icon: 'LineChart',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    ring: 'ring-indigo-200',
    iconBg: 'bg-indigo-100',
    activeBg: 'bg-indigo-600',
    activeText: 'text-white',
    desc: 'Analytics, reporting, sustainability metrics, and the digital campus twin',
  },
};

function ModuleCard({ mod }) {
  const meta = CATEGORY_META[mod.category] || CATEGORY_META[MODULE_CATEGORIES.INTELLIGENCE];
  const IconComp = Icons[mod.icon] || Icons.Sparkles;

  return (
    <Link
      to={`/modules/${mod.slug}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.iconBg} ring-1 ${meta.ring}`}>
          <IconComp className={`h-5 w-5 ${meta.color}`} aria-hidden="true" />
        </div>
        <ComingSoonBadge />
      </div>
      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">{mod.name}</h3>
      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{mod.summary}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} ring-1 ${meta.ring}`}>
          {mod.category}
        </span>
        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{mod.researchPhase.split('—')[0].trim()}</span>
      </div>
    </Link>
  );
}

export default function ModulesOverview() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = MODULES_REGISTRY;
    if (activeCategory) list = list.filter((m) => m.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.summary.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, search]);

  const counts = useMemo(() => {
    const c = {};
    MODULES_REGISTRY.forEach((m) => {
      c[m.category] = (c[m.category] || 0) + 1;
    });
    return c;
  }, []);

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <PageHeader
          title="Research Modules"
          subtitle="Planned AI, IoT, and community features proposed as part of the CampusFix+ research initiative."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Modules' }]}
        />

        <div className="mt-6">
          <PrototypeBanner message="All modules on this page are planned research proposals. None are currently operational. This page supports the accompanying IEEE research paper." />
        </div>

        {/* ── Category filter tabs ─────────────────────────────── */}
        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            onClick={() => setActiveCategory(null)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              !activeCategory
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {ALL_LABEL}
            <span className={`rounded-full px-1.5 py-0 text-[10px] ${!activeCategory ? 'bg-white/20' : 'bg-slate-200'}`}>
              {MODULES_REGISTRY.length}
            </span>
          </button>
          {Object.entries(MODULE_CATEGORIES).map(([, cat]) => {
            const meta = CATEGORY_META[cat];
            const CatIcon = Icons[meta.icon] || Icons.Layers;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(isActive ? null : cat)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? `${meta.activeBg} ${meta.activeText} shadow-sm`
                    : `${meta.bg} ${meta.color} hover:ring-1 ${meta.ring}`
                }`}
              >
                <CatIcon className="h-3 w-3" aria-hidden="true" />
                {cat}
                <span className={`rounded-full px-1.5 py-0 text-[10px] ${isActive ? 'bg-white/20' : 'bg-white/60'}`}>
                  {counts[cat] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Search ─────────────────────────────────────────────── */}
        <div className="mt-4 relative max-w-sm">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search modules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-9 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-label="Search modules"
          />
        </div>

        {/* ── Category description strip ──────────────────────── */}
        {activeCategory && (
          <div className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-xs ${CATEGORY_META[activeCategory].bg} ${CATEGORY_META[activeCategory].color}`}>
            <Icons.Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{CATEGORY_META[activeCategory].desc}</span>
          </div>
        )}

        {/* ── Modules grid ───────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="mt-12 text-center py-16 text-slate-400">
            <Icons.SearchX className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No modules match your search.</p>
            <button onClick={() => { setSearch(''); setActiveCategory(null); }} className="mt-2 text-xs text-indigo-600 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((mod) => (
              <ModuleCard key={mod.slug} mod={mod} />
            ))}
          </div>
        )}

        {/* ── Status legend ────────────────────────────────────── */}
        <Card className="mt-10 p-5">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Status Legend</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <span className="coming-soon-badge shrink-0 mt-0.5"><Icons.Clock size={11} />Coming Soon</span>
              <span>Feature is planned and specified but not yet in development.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 px-2.5 py-0.5 font-semibold text-[11px] shrink-0">
                <Icons.FlaskConical size={11} />Phase 1
              </span>
              <span>Dataset collection, architecture design, and similarity metric selection.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 px-2.5 py-0.5 font-semibold text-[11px] shrink-0">
                <Icons.Layers size={11} />Phase 2
              </span>
              <span>Hardware procurement, data schema design, content architecture, and dashboard design.</span>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200 px-2.5 py-0.5 font-semibold text-[11px] shrink-0">
              <Icons.BookOpen size={11} />Phase 3
            </span>
            <span>Requirements gathering, UX design, scope definition, and feasibility study. Early planning only.</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <Icons.AlertCircle className="inline h-3.5 w-3.5 mr-1 text-amber-500" />
            <strong>Evaluation Integrity:</strong> In compliance with academic research standards, no simulated AI outputs or artificial sensor readings are presented as live data anywhere in this prototype.
          </div>
        </Card>

        {/* Research paper link */}
        <div className="mt-6 text-center">
          <Link
            to="/research"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <Icons.FileText className="h-4 w-4" />
            Read Research Paper Context & Architecture
            <Icons.ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
