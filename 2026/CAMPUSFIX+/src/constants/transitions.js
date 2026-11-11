/**
 * transitions.js — Allowed status transitions per role.
 * transitions[role][currentStatus] = [allowedNextStatuses]
 *
 * Rules:
 * - Admin can review, prioritize, assign, or reject invalid tickets.
 * - Staff can move assigned work to IN_PROGRESS and then RESOLVED.
 * - Students can verify or reopen only while RESOLVED.
 * - Students can cancel their own complaint only while in SUBMITTED status.
 */
import { ROLES } from './roles';
import { STATUSES } from './statuses';

const { STUDENT, ADMIN, STAFF } = ROLES;
const {
  SUBMITTED, UNDER_REVIEW, ASSIGNED, IN_PROGRESS,
  RESOLVED, VERIFIED, REOPENED, REJECTED,
} = STATUSES;

export const TRANSITIONS = {
  [ADMIN]: {
    [SUBMITTED]: [UNDER_REVIEW, ASSIGNED, REJECTED],
    [UNDER_REVIEW]: [ASSIGNED, REJECTED],
    [ASSIGNED]: [UNDER_REVIEW, ASSIGNED, REJECTED],
    [IN_PROGRESS]: [ASSIGNED],
    [RESOLVED]: [ASSIGNED],
    [REOPENED]: [UNDER_REVIEW, ASSIGNED, REJECTED],
    [VERIFIED]: [],
    [REJECTED]: [],
  },
  [STAFF]: {
    [ASSIGNED]: [IN_PROGRESS, UNDER_REVIEW],
    [IN_PROGRESS]: [RESOLVED, UNDER_REVIEW],
    [SUBMITTED]: [],
    [UNDER_REVIEW]: [],
    [RESOLVED]: [],
    [VERIFIED]: [],
    [REOPENED]: [IN_PROGRESS, UNDER_REVIEW],
    [REJECTED]: [],
  },
  [STUDENT]: {
    [SUBMITTED]: [REJECTED], // Student cancellation
    [RESOLVED]: [VERIFIED, REOPENED], // Sign-off or dispute
    [UNDER_REVIEW]: [],
    [ASSIGNED]: [],
    [IN_PROGRESS]: [],
    [VERIFIED]: [],
    [REOPENED]: [],
    [REJECTED]: [],
  },
};

/**
 * Returns the allowed next statuses for a given role and current status.
 * @param {string} role
 * @param {string} currentStatus
 * @returns {string[]}
 */
export function getAllowedTransitions(role, currentStatus) {
  if (!role || !currentStatus) return [];
  return TRANSITIONS[role]?.[currentStatus] ?? [];
}

/**
 * Validates whether a requested transition is legal for the given role.
 * @param {string} role
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {boolean}
 */
export function isTransitionAllowed(role, currentStatus, nextStatus) {
  const allowed = getAllowedTransitions(role, currentStatus);
  return allowed.includes(nextStatus);
}
