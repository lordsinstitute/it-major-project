/**
 * authService.js — Authentication Service Adapter (Prototype).
 *
 * REST API Contract for Chunk 11:
 * - POST /api/v1/auth/login     -> { user: UserDTO }
 * - POST /api/v1/auth/register  -> { user: UserDTO }
 * - POST /api/v1/auth/logout    -> 204 No Content
 * - GET  /api/v1/auth/me        -> { user: UserDTO }
 *
 * SECURITY NOTE:
 * Chunk 11 will use HttpOnly session cookies or in-memory JWT tokens.
 * NEVER write passwords, tokens, or private secrets to localStorage or sessionStorage.
 * In this prototype, only a non-sensitive user ID session marker is kept in
 * sessionStorage so that browser refreshes continue to recognize the active session.
 */
import { MOCK_USERS, getUserByEmail, getUserById } from '../data/mockUsers';
import { ROLES } from '../constants/roles';

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const SESSION_KEY = 'campusfix_session_uid';

// In-memory active user reference
let _currentUser = null;

// Client-side rate-limiting tracker for demo protection
let _failedAttempts = 0;
let _lockoutUntil = 0;

/**
 * Checks client-side rate limit.
 * @throws {Error} if temporarily locked out.
 */
function checkRateLimit() {
  const now = Date.now();
  if (_lockoutUntil > now) {
    const remainingSeconds = Math.ceil((_lockoutUntil - now) / 1000);
    throw new Error(
      `[Client-Side Rate Limit]: Too many failed login attempts. Please wait ${remainingSeconds}s before retrying.`
    );
  }
}

/**
 * Authenticate with email and password.
 * Prototype rule: Any password with >= 6 chars is accepted for valid demo emails.
 *
 * @param {object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<object>} non-sensitive user profile
 */
export async function login({ email, password }) {
  await delay(500);
  checkRateLimit();

  if (!email || !password) {
    throw new Error('Please enter both your institutional email and password.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = getUserByEmail(normalizedEmail);

  if (!user) {
    _failedAttempts += 1;
    if (_failedAttempts >= 5) {
      _lockoutUntil = Date.now() + 30000; // 30s lockout
      _failedAttempts = 0;
      throw new Error(
        '[Client-Side Rate Limit]: 5 failed attempts detected. Authentication temporarily locked for 30s.'
      );
    }
    throw new Error('Invalid credentials. No campus account matches this email.');
  }

  // Password validation: must be at least 6 characters in prototype
  if (password.length < 6) {
    _failedAttempts += 1;
    throw new Error('Password must be at least 6 characters long.');
  }

  // Successful authentication: reset rate limiter
  _failedAttempts = 0;
  _lockoutUntil = 0;

  // Sanitize non-sensitive user object for memory
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || user.assignedDepartment,
    rollNumber: user.rollNumber || null,
    employeeId: user.employeeId || null,
    designation: user.designation || null,
    avatarInitials: user.avatarInitials,
    avatarColor: user.avatarColor,
  };

  _currentUser = safeUser;

  // Store ONLY non-sensitive user ID marker in sessionStorage for refresh persistence
  try {
    sessionStorage.setItem(SESSION_KEY, safeUser.id);
  } catch {
    // Graceful fallback if storage is disabled in private browsing
  }

  return safeUser;
}

/**
 * Self-registration for students only.
 * Staff and Admin accounts are provisioned exclusively by Campus Estate Admin.
 *
 * @param {object} payload
 * @returns {Promise<object>} newly created non-sensitive user profile
 */
export async function register(payload) {
  await delay(600);

  const { name, email, rollNumber, department, password } = payload;

  if (!name || !email || !rollNumber || !department || !password) {
    throw new Error('All registration fields are mandatory.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = getUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('An account with this institutional email already exists.');
  }

  // Create new student prototype entity
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const newStudent = {
    id: `usr-${Date.now().toString(36)}`,
    name: name.trim(),
    email: normalizedEmail,
    role: ROLES.STUDENT,
    rollNumber: rollNumber.trim().toUpperCase(),
    department,
    avatarInitials: initials || 'ST',
    avatarColor: 'bg-indigo-600',
    joinedAt: new Date().toISOString().split('T')[0],
  };

  // Add to in-memory mock set
  MOCK_USERS.push(newStudent);

  _currentUser = newStudent;
  try {
    sessionStorage.setItem(SESSION_KEY, newStudent.id);
  } catch {
    // Ignore storage issues
  }

  return newStudent;
}

/**
 * Terminate active session.
 * @returns {Promise<void>}
 */
export async function logout() {
  await delay(200);
  _currentUser = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Bootstrap session from non-sensitive sessionStorage marker.
 * @returns {Promise<object|null>}
 */
export async function getMe() {
  await delay(150);

  if (_currentUser) {
    return _currentUser;
  }

  try {
    const savedUserId = sessionStorage.getItem(SESSION_KEY);
    if (savedUserId) {
      const user = getUserById(savedUserId);
      if (user) {
        _currentUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department || user.assignedDepartment,
          rollNumber: user.rollNumber || null,
          employeeId: user.employeeId || null,
          designation: user.designation || null,
          avatarInitials: user.avatarInitials,
          avatarColor: user.avatarColor,
        };
        return _currentUser;
      }
    }
  } catch {
    // Fallback if sessionStorage is not accessible
  }

  return null;
}

/**
 * Simulated password reset request (no actual email sent in prototype).
 * @param {string} email
 * @returns {Promise<{message: string}>}
 */
export async function requestPasswordReset(email) {
  await delay(500);
  if (!email) {
    throw new Error('Please enter your institutional email address.');
  }
  return {
    message: `[Prototype Simulation]: A simulated password recovery token has been generated for ${email}. No real email was dispatched.`,
  };
}

/**
 * Simulated password reset completion.
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<{success: boolean}>}
 */
export async function resetPassword(token, newPassword) {
  await delay(500);
  if (!token || !newPassword) {
    throw new Error('Invalid token or missing new password.');
  }
  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  return { success: true };
}
