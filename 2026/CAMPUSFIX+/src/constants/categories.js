/**
 * Complaint categories.
 */
export const CATEGORIES = {
  ELECTRICAL: 'ELECTRICAL',
  PLUMBING: 'PLUMBING',
  CIVIL: 'CIVIL',
  HVAC: 'HVAC',
  IT_NETWORK: 'IT_NETWORK',
  FURNITURE: 'FURNITURE',
  CLEANLINESS: 'CLEANLINESS',
  SAFETY: 'SAFETY',
  OTHER: 'OTHER',
};

export const CATEGORY_META = {
  [CATEGORIES.ELECTRICAL]: { label: 'Electrical', icon: 'Zap', color: 'text-yellow-600' },
  [CATEGORIES.PLUMBING]: { label: 'Plumbing', icon: 'Droplets', color: 'text-blue-600' },
  [CATEGORIES.CIVIL]: { label: 'Civil / Structure', icon: 'Building2', color: 'text-stone-600' },
  [CATEGORIES.HVAC]: { label: 'HVAC / Air Quality', icon: 'Wind', color: 'text-cyan-600' },
  [CATEGORIES.IT_NETWORK]: { label: 'IT / Network', icon: 'Wifi', color: 'text-indigo-600' },
  [CATEGORIES.FURNITURE]: { label: 'Furniture', icon: 'Armchair', color: 'text-amber-600' },
  [CATEGORIES.CLEANLINESS]: { label: 'Cleanliness', icon: 'Sparkles', color: 'text-green-600' },
  [CATEGORIES.SAFETY]: { label: 'Safety', icon: 'ShieldAlert', color: 'text-red-600' },
  [CATEGORIES.OTHER]: { label: 'Other', icon: 'MoreHorizontal', color: 'text-slate-500' },
};

export const ALL_CATEGORIES = Object.values(CATEGORIES);
