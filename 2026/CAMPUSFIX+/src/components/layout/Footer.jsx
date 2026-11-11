import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ShieldAlert, Code2, BookOpen, ExternalLink } from 'lucide-react';

const SITEMAP_COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Overview', href: '/' },
      { label: 'Core Features', href: '/features' },
      { label: 'Lifecycle & Workflow', href: '/how-it-works' },
      { label: 'Research Modules', href: '/modules' },
      { label: 'Platform Roadmap', href: '/roadmap' },
    ],
  },
  {
    title: 'Architecture & Tech',
    links: [
      { label: 'Technical Stack', href: '/technology' },
      { label: 'Design System', href: '/design-system' },
      { label: 'API Specification', href: '/technology#api-spec' },
      { label: 'Security Model', href: '/technology#security' },
    ],
  },
  {
    title: 'Research Context',
    links: [
      { label: 'IEEE Paper & Arch', href: '/research' },
      { label: 'Project Background', href: '/about' },
      { label: 'Objectives & Scope', href: '/about#objectives' },
      { label: 'Problem Statement', href: '/about#problem-statement' },
      { label: 'Academic References', href: '/about#references' },
    ],
  },
  {
    title: 'Portals',
    links: [
      { label: 'Student Portal', href: '/login' },
      { label: 'Admin Dashboard', href: '/login' },
      { label: 'Maintenance Staff', href: '/login' },
      { label: 'Prototype Credentials', href: '/login#credentials' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      
      {/* Top Banner Notice */}
      <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-3 text-center text-xs font-medium text-amber-300">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>Academic Research Prototype:</strong> Built for evaluation accompanying an IEEE-style paper. All records and metrics are prototype data.
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand info */}
          <div className="space-y-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 text-white" aria-label="CampusFix+ Home">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Wrench className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                CampusFix<span className="text-primary-400">+</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              AI-IoT Powered Smart Campus Digital Ecosystem for transparent, SLA-governed facility maintenance.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Code2 className="h-4 w-4 text-primary-400" aria-hidden="true" />
              <span>Vite · React · Tailwind CSS · Spring Boot</span>
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-1 lg:col-span-4">
            {SITEMAP_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  {col.title}
                </h3>
                <ul className="mt-3 space-y-2 text-xs">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-400"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row text-xs text-slate-400">
          <p>© {new Date().getFullYear()} CampusFix+ Research Project. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-slate-300">Methodology</Link>
            <span className="text-slate-700">·</span>
            <Link to="/technology" className="hover:text-slate-300">Architecture</Link>
            <span className="text-slate-700">·</span>
            <Link to="/design-system" className="hover:text-slate-300">Style Guide</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
