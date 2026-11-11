import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, ShieldCheck } from 'lucide-react';
import Button from '../../../components/ui/Button';

export default function CallToActionSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-indigo-950 to-slate-950 py-16 text-white sm:py-20" aria-label="Evaluate Prototype">
      {/* Subtle decorative glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-primary-600/20 blur-3xl" />
        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-700/60 bg-primary-800/40 px-3 py-1 text-xs font-semibold text-primary-200">
          <ShieldCheck className="h-3.5 w-3.5 text-primary-300" />
          <span>Interactive Prototype Evaluation Ready</span>
        </div>

        <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Evaluate the CampusFix+ Digital Ecosystem
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Experience the closed-loop complaint lifecycle firsthand. Log in using pre-configured student, administrator, or maintenance staff prototype accounts.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link to="/login">
            <Button variant="primary" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
              Open Prototype Portals
            </Button>
          </Link>
          <Link to="/technology">
            <Button variant="outline" size="lg" className="border-slate-700 bg-slate-900/60 text-white hover:bg-slate-800">
              Technical Architecture
            </Button>
          </Link>
          <Link to="/design-system">
            <Button variant="ghost" size="lg" className="text-slate-300 hover:bg-white/10 hover:text-white" icon={<Code className="h-4 w-4" />}>
              Living Style Guide
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Academic Research Prototype · Zero setup required · Pre-seeded with 30 realistic campus complaints
        </p>
      </div>
    </section>
  );
}
