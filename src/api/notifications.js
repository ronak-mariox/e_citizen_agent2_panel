import { client } from './client.js';

/**
 * The signed-in agent's own notification centre — backend
 * src/routes/notification.routes.js. Not role-scoped on the backend (every
 * account type has one); this file is just this panel's own thin wrapper
 * around it.
 *
 * Returns `{ notifications, unread, pagination }`. `unread` carries a count
 * per type plus a `total`, worked out over everything rather than the current
 * filter — which is what lets the filter chips keep their badges while one
 * of them is selected.
 */
export async function listNotifications({ page, limit, type } = {}) {
  const response = await client.get('/notifications', {
    params: { page, limit, type: type === 'all' ? undefined : type },
  });

  return response.data.data;
}

/** One row, opened. Returns the fresh unread counts, the same shape as
    `listNotifications`'s own `unread`. */
export async function markRead(notificationId) {
  const response = await client.patch(`/notifications/${notificationId}/read`);

  return response.data.data.unread;
}

/** Everything still unread, marked read at once. */
export async function markAllRead() {
  const response = await client.patch('/notifications/read');

  return response.data.data.unread;
}

export default { listNotifications, markRead, markAllRead };
