/**
 * Campus departments responsible for resolving complaints.
 */
export const DEPARTMENTS = {
  ELECTRICAL_DEPT: 'ELECTRICAL_DEPT',
  CIVIL_MAINTENANCE: 'CIVIL_MAINTENANCE',
  IT_SERVICES: 'IT_SERVICES',
  HOUSEKEEPING: 'HOUSEKEEPING',
  SECURITY: 'SECURITY',
  ADMIN_OFFICE: 'ADMIN_OFFICE',
};

export const DEPARTMENT_META = {
  [DEPARTMENTS.ELECTRICAL_DEPT]: {
    label: 'Electrical Department',
    shortLabel: 'Electrical',
    head: 'Mr. Ramesh Kumar',
    email: 'electrical@campusfix.edu',
    phone: '+91-9800000001',
  },
  [DEPARTMENTS.CIVIL_MAINTENANCE]: {
    label: 'Civil & Maintenance',
    shortLabel: 'Civil',
    head: 'Mr. Suresh Yadav',
    email: 'civil@campusfix.edu',
    phone: '+91-9800000002',
  },
  [DEPARTMENTS.IT_SERVICES]: {
    label: 'IT Services & Networking',
    shortLabel: 'IT Services',
    head: 'Ms. Priya Nair',
    email: 'it@campusfix.edu',
    phone: '+91-9800000003',
  },
  [DEPARTMENTS.HOUSEKEEPING]: {
    label: 'Housekeeping & Cleanliness',
    shortLabel: 'Housekeeping',
    head: 'Mrs. Lakshmi Devi',
    email: 'housekeeping@campusfix.edu',
    phone: '+91-9800000004',
  },
  [DEPARTMENTS.SECURITY]: {
    label: 'Campus Security',
    shortLabel: 'Security',
    head: 'Mr. Ajay Singh',
    email: 'security@campusfix.edu',
    phone: '+91-9800000005',
  },
  [DEPARTMENTS.ADMIN_OFFICE]: {
    label: 'Administrative Office',
    shortLabel: 'Admin',
    head: 'Dr. Meena Sharma',
    email: 'admin@campusfix.edu',
    phone: '+91-9800000006',
  },
};

export const ALL_DEPARTMENTS = Object.values(DEPARTMENTS);
