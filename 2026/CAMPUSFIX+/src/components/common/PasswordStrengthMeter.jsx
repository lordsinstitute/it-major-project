import React from 'react';

export function getStrength(p) {
  if (!p) return { score: 0, label: 'None', color: 'bg-slate-200' };
  let s = 0;
  if (p.length >= 6) s += 1;
  if (p.length >= 10) s += 1;
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s += 1;
  if (/[^A-Za-z0-9]/.test(p)) s += 1;

  if (s <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
  if (s === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
  if (s === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
}

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const strength = getStrength(password);

  return (
    <div className="space-y-1 text-xs" aria-live="polite">
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>Password Strength: <strong className="text-slate-800">{strength.label}</strong></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full ${strength.color} transition-all duration-300`}
          style={{ width: `${(strength.score / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}
