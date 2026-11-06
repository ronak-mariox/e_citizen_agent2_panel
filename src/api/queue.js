import { client } from './client.js';

/**
 * The signed-in Agent 2's own cases — backend src/routes/agent2Queue.routes.js.
 *
 * `/agent2/applications` and not `/agent/applications`: the second belongs to
 * Agent 1 and is scoped by `assignedAgent`, this one by `assignedAgent2`. The
 * same collection, read by the two levels through the columns that say whose
 * desk a record is on — nothing here passes an agent id, because a client that
 * could name one could read somebody else's queue.
 *
 * Returns `{ applications, summary, pagination }`.
 *
 * @param {boolean} [acknowledged] Narrows to cases with (`true`) or without
 *   (`false`) a department receipt on file — how Gov. Processing and
 *   Acknowledgements split the same desk. Omit for the unfiltered list.
 */
export async function listMyCases({ page, limit, search, status, priority, acknowledged } = {}) {
  const response = await client.get('/agent2/applications', {
    // Undefined values are dropped by axios, so an unfiltered call sends no
    // query string rather than `?status=undefined`.
    params: {
      page,
      limit,
      search: search || undefined,
      status: status === 'all' ? undefined : status,
      priority: priority === 'all' ? undefined : priority,
      acknowledged,
    },
  });

  return response.data.data;
}
