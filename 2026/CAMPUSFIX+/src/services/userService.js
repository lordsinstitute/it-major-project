/**
 * userService — mock implementation (Prototype).
 * Manages user accounts, staff queries, and admin security boundaries.
 */
import { MOCK_USERS } from '../data/mockUsers';
import { ROLES } from '../constants/roles';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// Mutable in-memory store
let _usersStore = MOCK_USERS.map((u) => ({ ...u, isActive: u.isActive ?? true }));
let _nextStaffNum = 7;

/**
 * Fetch all users, with optional filtering.
 */
export async function getUsers(filters = {}) {
  await delay();
  let result = [..._usersStore];
  if (filters.role && filters.role !== 'ALL') {
    result = result.filter((u) => u.role === filters.role);
  }
  if (filters.status && filters.status !== 'ALL') {
    const isAct = filters.status === 'ACTIVE';
    result = result.filter((u) => u.isActive === isAct);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
        (u.rollNumber && u.rollNumber.toLowerCase().includes(q))
    );
  }
  return result;
}

/**
 * Fetch a single user by ID.
 */
export async function getUserByIdService(id) {
  await delay(150);
  const u = _usersStore.find((x) => x.id === id);
  if (!u) throw new Error(`User ${id} not found.`);
  return { ...u };
}

/**
 * Fetch all staff members.
 */
export async function getStaffList() {
  await delay(200);
  return _usersStore
    .filter((u) => u.role === ROLES.STAFF && u.isActive)
    .map((u) => ({ ...u }));
}

/**
 * Fetch staff members by assigned department.
 */
export async function getStaffByDepartment(department) {
  await delay(150);
  if (!department) return [];
  return _usersStore
    .filter(
      (u) =>
        u.role === ROLES.STAFF &&
        u.isActive &&
        u.assignedDepartment === department
    )
    .map((u) => ({ ...u }));
}

/**
 * Create a new staff account (Admin action).
 */
export async function createStaffUser(payload) {
  await delay(500);
  const newId = `usr-${String(100 + _usersStore.length + 1)}`;
  const empId = payload.employeeId || `STF-${String(_nextStaffNum++).padStart(3, '0')}`;
  const newUser = {
    id: newId,
    name: payload.name,
    email: payload.email,
    role: ROLES.STAFF,
    employeeId: empId,
    designation: payload.designation || 'Maintenance Specialist',
    assignedDepartment: payload.assignedDepartment,
    phone: payload.phone || '+91-9800000000',
    avatarInitials: payload.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    avatarColor: 'bg-teal-600',
    joinedAt: new Date().toISOString().split('T')[0],
    isActive: true,
  };
  _usersStore.push(newUser);
  return { ...newUser };
}

/**
 * Toggle active status of a user (Admin action with safety checks).
 */
export async function toggleUserStatus(id, currentAdminId) {
  await delay(400);
  if (id === currentAdminId) {
    throw new Error('Action blocked: You cannot deactivate your own account.');
  }
  const u = _usersStore.find((x) => x.id === id);
  if (!u) throw new Error(`User ${id} not found.`);

  if (u.role === ROLES.ADMIN && u.isActive) {
    const activeAdmins = _usersStore.filter(
      (x) => x.role === ROLES.ADMIN && x.isActive
    );
    if (activeAdmins.length <= 1) {
      throw new Error('Action blocked: Cannot deactivate the last active Administrator.');
    }
  }

  u.isActive = !u.isActive;
  return { ...u };
}

/**
 * Change role of a user (Admin action with safety checks).
 */
export async function changeUserRole(id, newRole, currentAdminId) {
  await delay(400);
  const u = _usersStore.find((x) => x.id === id);
  if (!u) throw new Error(`User ${id} not found.`);

  if (id === currentAdminId && newRole !== ROLES.ADMIN) {
    throw new Error('Action blocked: You cannot demote your own Administrator account.');
  }
  if (u.role === ROLES.ADMIN && newRole !== ROLES.ADMIN) {
    const activeAdmins = _usersStore.filter(
      (x) => x.role === ROLES.ADMIN && x.isActive
    );
    if (activeAdmins.length <= 1) {
      throw new Error('Action blocked: Cannot remove or demote the last Administrator.');
    }
  }

  u.role = newRole;
  return { ...u };
}

/**
 * Update general user fields.
 */
export async function updateUser(id, patch) {
  await delay(400);
  const idx = _usersStore.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error(`User ${id} not found.`);
  _usersStore[idx] = { ..._usersStore[idx], ...patch };
  return { ..._usersStore[idx] };
}
