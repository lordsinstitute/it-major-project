/**
 * Application roles.
 * Single source of truth — import from here everywhere.
 */
export const ROLES = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.STAFF]: 'Staff',
};

export const ROLE_COLORS = {
  [ROLES.STUDENT]: 'indigo',
  [ROLES.ADMIN]: 'teal',
  [ROLES.STAFF]: 'amber',
};

export const ALL_ROLES = Object.values(ROLES);
