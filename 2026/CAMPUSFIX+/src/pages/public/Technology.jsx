import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import TechStackSection from './components/TechStackSection';
import Card from '../../components/ui/Card';
import { ShieldCheck, Code2, Layers, Database } from 'lucide-react';

export default function Technology() {
  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="System Architecture & Technology"
          subtitle="Engineering specifications, client-server contract, and security boundaries."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Technology' },
          ]}
        />

        {/* Stack Strip Component */}
        <div className="mt-8">
          <TechStackSection />
        </div>

        {/* Deep Dive Pillars */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
          
          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-2.5 text-primary-700">
              <Layers className="h-5 w-5" />
              <h2 className="text-lg font-bold text-slate-900">Client Service Abstraction</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              All UI components interface exclusively with asynchronous service adapters in <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-800">src/services/</code>. Components never directly access mock data arrays.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              This guarantees that during Chunk 11, the frontend code remains unmodified while the internal service implementations swap to real Axios REST endpoints.
            </p>
          </Card>

          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-2.5 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-lg font-bold text-slate-900">Security Architecture & RBAC</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Security is enforced strictly on the backend: UI button hiding is never treated as access control. No passwords, tokens, or private secrets are retained in unencrypted client storage.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Every sensitive status transition requires authenticated role validation against the server-side state machine.
            </p>
          </Card>

          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-2.5 text-teal-700">
              <Database className="h-5 w-5" />
              <h2 className="text-lg font-bold text-slate-900">Relational Relational Store (PostgreSQL)</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Target database schema utilizes strict foreign-key integrity linking complaints, user identities, categories, departments, and append-only audit trail logs.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Database schema migrations will be managed deterministically using Flyway in Chunk 11.
            </p>
          </Card>

          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-2.5 text-indigo-700">
              <Code2 className="h-5 w-5" />
              <h2 className="text-lg font-bold text-slate-900">Design System & Accessibility</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Tailwind CSS tokens manage typography, spacing, and semantic color palettes. Components enforce ARIA markup, keyboard navigation, focus management, and WCAG AA contrast.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Accessible across viewport sizes from 360px smartphones to 1920px multi-monitor workstations.
            </p>
          </Card>

        </div>
      </div>
    </div>
  );
}
