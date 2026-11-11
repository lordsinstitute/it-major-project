import React from 'react';
import { Layers, Server, Database, ShieldCheck, Cpu, Code2 } from 'lucide-react';

const TECH_ITEMS = [
  {
    category: 'Client Architecture',
    techs: [
      { name: 'React', role: 'SPA Core' },
      { name: 'Vite', role: 'Fast Bundler' },
      { name: 'Tailwind CSS', role: 'Design Tokens' },
      { name: 'React Router', role: 'Stateful Routing' },
      { name: 'Recharts', role: 'Analytics' },
    ],
  },
  {
    category: 'Enterprise Backend (Target: Chunk 11)',
    techs: [
      { name: 'Java 21', role: 'LTS Runtime' },
      { name: 'Spring Boot 3', role: 'REST Services' },
      { name: 'Spring Security', role: 'JWT & RBAC' },
      { name: 'PostgreSQL', role: 'Relational Store' },
      { name: 'Flyway', role: 'Schema Migrations' },
    ],
  },
];

export default function TechStackSection() {
  return (
    <section className="bg-slate-900 py-16 text-slate-100" aria-labelledby="tech-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-400">Engineering Rigor</p>
          <h2 id="tech-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Modern, enterprise-grade technology stack
          </h2>
          <p className="mt-4 text-sm text-slate-400">
            Engineered with strict separation of concerns, transition-tested state machines, and a REST contract ready for backend integration.
          </p>
        </div>

        {/* Stack Groups */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {TECH_ITEMS.map((group) => (
            <div
              key={group.category}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-sm"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {group.category}
              </h3>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {group.techs.map((t) => (
                  <div
                    key={t.name}
                    className="flex flex-col rounded-xl border border-slate-800/80 bg-slate-900/80 p-3 transition-colors hover:border-slate-700"
                  >
                    <span className="text-sm font-bold text-white">{t.name}</span>
                    <span className="mt-0.5 text-[11px] text-slate-400">{t.role}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contract guarantee */}
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center text-xs text-slate-400">
          <span className="font-semibold text-primary-400">Architectural Rule: </span>
          Client service signatures match Spring Boot REST endpoints 1:1, allowing seamless backend swap in Phase 2.
        </div>

      </div>
    </section>
  );
}
