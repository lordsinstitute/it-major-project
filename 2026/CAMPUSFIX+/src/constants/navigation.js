/**
 * navigation.js — Single source of truth for portal navigation.
 * Each role defines its dedicated links; a shared "Coming Soon Modules"
 * group is accessible to all authenticated users.
 */
import { ROLES } from './roles';

export const STUDENT_NAV = [
  { label: 'Dashboard', href: '/student/dashboard', icon: 'LayoutDashboard' },
  { label: 'Report an Issue', href: '/student/report', icon: 'PlusCircle' },
  { label: 'My Complaints', href: '/student/complaints', icon: 'ClipboardList' },
  { label: 'Notifications', href: '/student/notifications', icon: 'Bell' },
  { label: 'Profile', href: '/student/profile', icon: 'User' },
  { label: 'Settings', href: '/student/settings', icon: 'Settings' },
];

export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Complaint Management', href: '/admin/complaints', icon: 'ClipboardList' },
  { label: 'Department Assignment', href: '/admin/assignments', icon: 'UserCheck' },
  { label: 'Priority Management', href: '/admin/priorities', icon: 'Sliders' },
  { label: 'User Management', href: '/admin/users', icon: 'Users' },
  { label: 'Complaint History', href: '/admin/history', icon: 'History' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'BarChart3' },
  { label: 'Notifications', href: '/admin/notifications', icon: 'Bell' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
];

export const STAFF_NAV = [
  { label: 'Dashboard', href: '/staff/dashboard', icon: 'LayoutDashboard' },
  { label: 'Assigned Tasks', href: '/staff/tasks', icon: 'CheckSquare' },
  { label: 'Task History', href: '/staff/history', icon: 'History' },
  { label: 'Notifications', href: '/staff/notifications', icon: 'Bell' },
  { label: 'Profile', href: '/staff/profile', icon: 'User' },
];

export const COMING_SOON_MODULES_NAV = [
  { label: 'AI Duplicate Triage', href: '/modules/duplicate-detection', icon: 'Bot' },
  { label: 'IoT Leak Telemetry', href: '/modules/smart-iot-monitoring', icon: 'Wifi' },
  { label: 'CV Damage Classifier', href: '/modules/computer-vision', icon: 'Eye' },
  { label: 'Predictive Maintenance', href: '/modules/predictive-maintenance', icon: 'LineChart' },
];

/**
 * Returns the navigation list matching the specified user role.
 * @param {string} role
 * @returns {Array}
 */
export function getNavForRole(role) {
  if (role === ROLES.ADMIN) return ADMIN_NAV;
  if (role === ROLES.STAFF) return STAFF_NAV;
  if (role === ROLES.STUDENT) return STUDENT_NAV;
  return [];
}
