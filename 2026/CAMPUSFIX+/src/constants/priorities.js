/**
 * Complaint priorities.
 * resolutionHours — target time to resolve from assignment
 */
export const PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const PRIORITY_META = {
  [PRIORITIES.LOW]: {
    label: 'Low',
    resolutionHours: 120,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    ring: 'ring-slate-300',
    dot: 'bg-slate-400',
    icon: 'ArrowDown',
  },
  [PRIORITIES.MEDIUM]: {
    label: 'Medium',
    resolutionHours: 48,
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    ring: 'ring-yellow-200',
    dot: 'bg-yellow-500',
    icon: 'ArrowRight',
  },
  [PRIORITIES.HIGH]: {
    label: 'High',
    resolutionHours: 24,
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    ring: 'ring-orange-200',
    dot: 'bg-orange-500',
    icon: 'ArrowUp',
  },
  [PRIORITIES.CRITICAL]: {
    label: 'Critical',
    resolutionHours: 4,
    bg: 'bg-red-50',
    text: 'text-red-700',
    ring: 'ring-red-200',
    dot: 'bg-red-600',
    icon: 'AlertTriangle',
  },
};

export const ALL_PRIORITIES = Object.values(PRIORITIES);
