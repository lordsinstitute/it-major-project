/**
 * sla.js — Service Level Agreement (SLA) calculations based on priority target hours.
 */
import { PRIORITY_META, PRIORITIES } from '../constants/priorities';
import { STATUSES } from '../constants/statuses';

export function getResolutionTargetHours(priority) {
  return PRIORITY_META[priority]?.resolutionHours ?? 48;
}

export function isComplaintOverdue(complaint) {
  if (!complaint || !complaint.createdAt) return false;
  // If already resolved or verified, it's not currently overdue
  if ([STATUSES.RESOLVED, STATUSES.VERIFIED, STATUSES.REJECTED].includes(complaint.status)) {
    return false;
  }
  const createdMs = new Date(complaint.createdAt).getTime();
  const targetMs = getResolutionTargetHours(complaint.priority) * 3600 * 1000;
  return Date.now() - createdMs > targetMs;
}

export function getRemainingHours(complaint) {
  if (!complaint || !complaint.createdAt) return 0;
  const createdMs = new Date(complaint.createdAt).getTime();
  const targetMs = getResolutionTargetHours(complaint.priority) * 3600 * 1000;
  const deadline = createdMs + targetMs;
  const remaining = Math.round((deadline - Date.now()) / (3600 * 1000));
  return remaining;
}
