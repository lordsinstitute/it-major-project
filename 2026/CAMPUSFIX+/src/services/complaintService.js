/**
 * complaintService — mock implementation (Prototype).
 * REST signatures matching backend API for Chunk 11.
 */
import { MOCK_COMPLAINTS } from '../data/mockComplaints';
import { STATUSES } from '../constants/statuses';
import { PRIORITIES } from '../constants/priorities';
import { isTransitionAllowed } from '../constants/transitions';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

let _store = MOCK_COMPLAINTS.map((c) => ({
  ...c,
  timeline: [...c.timeline],
  comments: [...c.comments],
  internalNotes: c.internalNotes ? [...c.internalNotes] : [],
  evidence: c.evidence || [],
}));
let _nextId = 31;

export async function getAllComplaintsRaw() {
  await delay(150);
  return _store.map((c) => ({ ...c }));
}

export async function getComplaints(filters = {}) {
  await delay();
  const {
    status, priority, category, department, building,
    reportedBy, assignedTo, search,
    page = 0, size = 10, sort = 'createdAt', order = 'desc',
  } = filters;

  let res = [..._store];
  if (status && status !== 'ALL') res = res.filter((c) => c.status === status);
  if (priority && priority !== 'ALL') res = res.filter((c) => c.priority === priority);
  if (category && category !== 'ALL') res = res.filter((c) => c.category === category);
  if (department && department !== 'ALL') res = res.filter((c) => c.department === department);
  if (building && building !== 'ALL') {
    res = res.filter((c) => c.location?.building === building || c.location?.buildingId === building);
  }
  if (reportedBy) res = res.filter((c) => c.reportedBy === reportedBy);
  if (assignedTo && assignedTo !== 'ALL') {
    res = assignedTo === 'UNASSIGNED' ? res.filter((c) => !c.assignedTo) : res.filter((c) => c.assignedTo === assignedTo);
  }
  if (search) {
    const q = search.toLowerCase();
    res = res.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }

  res.sort((a, b) => {
    const va = a[sort] ?? '';
    const vb = b[sort] ?? '';
    return order === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  return {
    content: res.slice(page * size, page * size + size),
    totalElements: res.length,
    totalPages: Math.ceil(res.length / size),
    page,
    size,
  };
}

export async function getComplaintById(id) {
  await delay(200);
  const c = _store.find((x) => x.id === id);
  if (!c) throw new Error(`Complaint ${id} not found.`);
  return { ...c };
}

export async function createComplaint(payload) {
  await delay(500);
  const now = new Date().toISOString();
  const complaintId = `CF-2026-${String(_nextId++).padStart(4, '0')}`;
  const complaint = {
    id: complaintId,
    ...payload,
    priority: payload.priority || PRIORITIES.MEDIUM,
    status: STATUSES.SUBMITTED,
    assignedTo: null,
    department: null,
    resolvedAt: null,
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
    evidence: payload.evidence || [],
    internalNotes: [],
    timeline: [{ status: STATUSES.SUBMITTED, at: now, by: payload.reportedBy, note: 'Issue reported by student resident.' }],
    comments: [],
  };
  _store.unshift(complaint);
  return { ...complaint };
}

export async function updateStatus(id, payload) {
  await delay(400);
  const idx = _store.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error(`Complaint ${id} not found.`);

  const cur = _store[idx];
  const { status, note, by, role, assignedTo, department, priority, ...extra } = payload;

  if (role && status && status !== cur.status && !isTransitionAllowed(role, cur.status, status)) {
    throw new Error(`Illegal status transition from ${cur.status} to ${status} for role ${role}.`);
  }

  const now = new Date().toISOString();
  const nextStatus = status || cur.status;

  _store[idx] = {
    ...cur,
    ...extra,
    status: nextStatus,
    updatedAt: now,
    ...(assignedTo !== undefined && { assignedTo }),
    ...(department !== undefined && { department }),
    ...(priority !== undefined && { priority }),
    ...(nextStatus === STATUSES.RESOLVED && { resolvedAt: now }),
    ...(nextStatus === STATUSES.VERIFIED && { verifiedAt: now }),
    timeline: [
      ...cur.timeline,
      { status: nextStatus, at: now, by, note: note ?? '' },
    ],
  };
  return { ..._store[idx] };
}

export async function assignComplaint(id, { department, assignedTo, note, by, role }) {
  return updateStatus(id, {
    status: STATUSES.ASSIGNED,
    department,
    assignedTo,
    note: note || `Assigned to ${department}`,
    by,
    role,
  });
}

export async function setPriority(id, { priority, note, by }) {
  await delay(300);
  const idx = _store.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error(`Complaint ${id} not found.`);
  const now = new Date().toISOString();
  _store[idx] = {
    ..._store[idx],
    priority,
    updatedAt: now,
    timeline: [
      ..._store[idx].timeline,
      { status: _store[idx].status, at: now, by, note: note || `Priority adjusted to ${priority}` },
    ],
  };
  return { ..._store[idx] };
}

export async function bulkAssign(ids, { department, assignedTo, by, role }) {
  await delay(600);
  const now = new Date().toISOString();
  let count = 0;
  for (const id of ids) {
    const idx = _store.findIndex((x) => x.id === id);
    if (idx !== -1) {
      _store[idx] = {
        ..._store[idx],
        status: STATUSES.ASSIGNED,
        department,
        assignedTo,
        updatedAt: now,
        timeline: [
          ..._store[idx].timeline,
          { status: STATUSES.ASSIGNED, at: now, by, note: `Bulk assignment to ${department}` },
        ],
      };
      count++;
    }
  }
  return { success: true, count };
}

export async function addComment(id, payload) {
  await delay(250);
  const idx = _store.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error(`Complaint ${id} not found.`);
  const comment = { id: `c-${id}-${Date.now().toString(36)}`, by: payload.by, at: new Date().toISOString(), text: payload.text };
  _store[idx].comments = [..._store[idx].comments, comment];
  return comment;
}

export async function addInternalNote(id, payload) {
  await delay(250);
  const idx = _store.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error(`Complaint ${id} not found.`);
  const note = { id: `in-${id}-${Date.now().toString(36)}`, by: payload.by, at: new Date().toISOString(), text: payload.text };
  _store[idx].internalNotes = [...(_store[idx].internalNotes || []), note];
  return note;
}
