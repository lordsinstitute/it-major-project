import React from 'react';

const DEMO_ACCOUNTS = [
  {
    role: 'Student',
    label: 'Student (Arjun Mehta)',
    email: 'arjun.mehta@student.campusfix.edu',
    badge: 'bg-primary-50 text-primary-700 border-primary-200',
  },
  {
    role: 'Admin',
    label: 'Admin (Dr. Vikram Anand)',
    email: 'vikram.anand@admin.campusfix.edu',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    role: 'Staff',
    label: 'Staff (Ravi Shankar - Electrician)',
    email: 'ravi.shankar@staff.campusfix.edu',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
  },
];

export default function DemoAccountsPanel({ onFillDemo }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
        One-Click Demo Roles (Prototype)
      </p>
      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        {DEMO_ACCOUNTS.map((acc) => (
          <button
            key={acc.role}
            type="button"
            onClick={() => onFillDemo(acc.email)}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-2xs hover:border-primary-400 hover:bg-primary-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 transition-colors"
          >
            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold border ${acc.badge}`}>
              {acc.role}
            </span>
            <p className="mt-1 text-xs font-semibold text-slate-800 truncate">{acc.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export { DEMO_ACCOUNTS };
