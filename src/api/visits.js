import { client } from './client.js';

/**
 * Every government-office visit across this Agent 2's whole desk, flattened
 * from the cases they belong to — backend `GET /agent2/visits`.
 *
 * Returns `{ visits, summary, pagination }`. Booking or amending one visit is
 * done from the case it belongs to (see api/case.js) — this file only reads
 * the calendar across all of them.
 */
export async function listVisits({ page, limit, status } = {}) {
  const response = await client.get('/agent2/visits', {
    params: {
      page,
      limit,
      status: status === 'all' ? undefined : status,
    },
  });

  return response.data.data;
}

export default { listVisits };
