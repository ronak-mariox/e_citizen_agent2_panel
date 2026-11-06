import { client } from './client.js';

/**
 * The Agent 2 dashboard's own figures — backend `GET /agent2/dashboard`.
 *
 * Returns `{ stats, activeCases, todaysVisits }`, one read over the whole
 * desk rather than a request per tile.
 */
export async function getDashboard() {
  const response = await client.get('/agent2/dashboard');

  return response.data.data;
}

export default { getDashboard };
