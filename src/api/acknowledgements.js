import { client } from './client.js';

/**
 * Every case's department acknowledgement, across this Agent 2's whole desk —
 * backend `GET /agent2/acknowledgements`.
 *
 * Returns `{ acknowledgements, summary, pagination }`. Uploading one is done
 * from the case it belongs to (see api/case.js's `uploadAcknowledgement`) —
 * this file only reads the tracker across all of them.
 */
export async function listAcknowledgements({ page, limit } = {}) {
  const response = await client.get('/agent2/acknowledgements', {
    params: { page, limit },
  });

  return response.data.data;
}

export default { listAcknowledgements };
