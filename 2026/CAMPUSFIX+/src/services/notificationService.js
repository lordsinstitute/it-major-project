/**
 * notificationService — mock implementation (Prototype).
 * Generates in-app notifications based on complaint events.
 */
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const _notifications = [
  {
    id: 'notif-001',
    userId: 'usr-001',
    type: 'STATUS_CHANGE',
    title: 'CMP-003 assigned to technician',
    body: 'Your complaint about the Wi-Fi dead zone in the Library has been assigned to a technician.',
    read: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    link: '/complaints/CMP-003',
  },
  {
    id: 'notif-002',
    userId: 'usr-001',
    type: 'COMMENT',
    title: 'New comment on CMP-017',
    body: 'Admin left a note on your "Hot water not available" complaint.',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    link: '/complaints/CMP-017',
  },
  {
    id: 'notif-003',
    userId: 'usr-001',
    type: 'STATUS_CHANGE',
    title: 'CMP-017 Reopened',
    body: 'Your complaint about the hot water geyser has been reopened.',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    link: '/complaints/CMP-017',
  },
  {
    id: 'notif-004',
    userId: 'usr-003',
    type: 'NEW_COMPLAINT',
    title: 'New complaint submitted: CMP-022',
    body: 'A new complaint about a treadmill safety hazard in the Sports Complex requires review.',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    link: '/admin/complaints/CMP-022',
  },
  {
    id: 'notif-005',
    userId: 'usr-004',
    type: 'ASSIGNMENT',
    title: 'CMP-026 assigned to you',
    body: 'You have been assigned the hostel toilet flush repair in Girls Hostel, Room H-G-201.',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    link: '/staff/complaints/CMP-026',
  },
];

/**
 * Fetch notifications for a user.
 * @param {string} userId
 * @param {{unreadOnly?: boolean}} options
 * @returns {Promise<object[]>}
 */
export async function getNotifications(userId, options = {}) {
  await delay();
  let result = _notifications.filter((n) => n.userId === userId);
  if (options.unreadOnly) result = result.filter((n) => !n.read);
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Mark a notification as read.
 * @param {string} notifId
 * @returns {Promise<void>}
 */
export async function markRead(notifId) {
  await delay(200);
  const n = _notifications.find((x) => x.id === notifId);
  if (n) n.read = true;
}

/**
 * Mark all notifications for a user as read.
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function markAllRead(userId) {
  await delay(300);
  _notifications.filter((n) => n.userId === userId).forEach((n) => { n.read = true; });
}

/**
 * Get unread notification count for a user.
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUnreadCount(userId) {
  await delay(150);
  return _notifications.filter((n) => n.userId === userId && !n.read).length;
}
