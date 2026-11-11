/**
 * Complaint lifecycle statuses.
 * label    — human-readable string shown in UI
 * color    — Tailwind colour name (maps to design tokens)
 * icon     — Lucide icon name (string; resolved in StatusBadge)
 * bg       — badge background class
 * text     — badge text class
 * ring     — badge ring class
 */
export const STATUSES = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  VERIFIED: 'VERIFIED',
  REOPENED: 'REOPENED',
  REJECTED: 'REJECTED',
};

export const STATUS_META = {
  [STATUSES.SUBMITTED]: {
    label: 'Submitted',
    icon: 'FileText',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    ring: 'ring-slate-300',
    dot: 'bg-slate-400',
  },
  [STATUSES.UNDER_REVIEW]: {
    label: 'Under Review',
    icon: 'Search',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    ring: 'ring-blue-200',
    dot: 'bg-blue-500',
  },
  [STATUSES.ASSIGNED]: {
    label: 'Assigned',
    icon: 'UserCheck',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    ring: 'ring-indigo-200',
    dot: 'bg-indigo-500',
  },
  [STATUSES.IN_PROGRESS]: {
    label: 'In Progress',
    icon: 'Wrench',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
    dot: 'bg-amber-500',
  },
  [STATUSES.RESOLVED]: {
    label: 'Resolved',
    icon: 'CheckCircle',
    bg: 'bg-green-50',
    text: 'text-green-700',
    ring: 'ring-green-200',
    dot: 'bg-green-500',
  },
  [STATUSES.VERIFIED]: {
    label: 'Verified',
    icon: 'BadgeCheck',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    ring: 'ring-teal-200',
    dot: 'bg-teal-500',
  },
  [STATUSES.REOPENED]: {
    label: 'Reopened',
    icon: 'RefreshCw',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    ring: 'ring-orange-200',
    dot: 'bg-orange-500',
  },
  [STATUSES.REJECTED]: {
    label: 'Rejected',
    icon: 'XCircle',
    bg: 'bg-red-50',
    text: 'text-red-700',
    ring: 'ring-red-200',
    dot: 'bg-red-500',
  },
};

export const ALL_STATUSES = Object.values(STATUSES);
