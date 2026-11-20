import { client } from './client.js';

/**
 * One case, and everything Agent 2 does with it — backend
 * src/routes/agent2Queue.routes.js, src/services/agent2.service.js.
 *
 * Mirrors the case screen's own five steps: a government-office visit, the
 * department submission and its reference number, the acknowledgement they
 * hand back, and the government's own decision through to closing the case.
 * Every mutation returns the case exactly as `getCase` would, so a screen
 * never has to guess whether its own copy is now stale.
 */

/** The case-detail screen's own record. */
export async function getCase(applicationId) {
  const response = await client.get(`/agent2/applications/${applicationId}`);

  return response.data.data.application;
}

/** Step 1 — book a trip to a government office. */
export async function recordVisit(applicationId, { office, officer, purpose, scheduledAt, status }) {
  const response = await client.post(`/agent2/applications/${applicationId}/visits`, {
    office,
    officer: officer || undefined,
    purpose: purpose || undefined,
    scheduledAt,
    status: status || undefined,
  });

  return response.data.data.application;
}

/** Reschedule, annotate, or mark a booked visit done or cancelled. */
export async function updateVisit(applicationId, visitId, payload) {
  const response = await client.patch(
    `/agent2/applications/${applicationId}/visits/${visitId}`,
    payload
  );

  return response.data.data.application;
}

/**
 * Steps 2 and 3 — one endpoint, called twice.
 *
 * The checklist and the desk are usually saved together at the counter; the
 * reference number often arrives on its own, later. Sending only what
 * changed each time is what lets the same call serve both steps without
 * either one clobbering what the other already saved.
 */
export async function updateSubmission(applicationId, payload) {
  const response = await client.patch(`/agent2/applications/${applicationId}/submission`, payload);

  return response.data.data.application;
}

/** Step 4 — the department's own receipt for the filing. */
export async function uploadAcknowledgement(applicationId, file) {
  const body = new FormData();
  body.append('file', file);

  const response = await client.post(
    `/agent2/applications/${applicationId}/acknowledgement`,
    body
  );

  return response.data.data.application;
}

/** Step 5, part one — what the government decided. */
export async function recordDecision(applicationId, { outcome, remarks }) {
  const response = await client.post(`/agent2/applications/${applicationId}/decision`, {
    outcome,
    remarks: remarks || undefined,
  });

  return response.data.data.application;
}

/** Step 5, part two — close an approved case, with an optional certificate. */
export async function completeCase(applicationId, certificate) {
  const body = new FormData();
  if (certificate) body.append('certificate', certificate);

  const response = await client.post(`/agent2/applications/${applicationId}/complete`, body);

  return response.data.data.application;
}

/** The case header's "Request Extension". */
export async function requestExtension(applicationId, { days, reason }) {
  const response = await client.post(
    `/agent2/applications/${applicationId}/extension-requests`,
    { days, reason: reason || undefined }
  );

  return response.data.data.application;
}

/** Step 2's "Request Additional Payment". `amount` arrives from the dialog in
    rupees, the way an agent types it; the backend stores every amount in
    paise, like every other fee in this codebase. */
const PRIORITY_TO_API = { normal: 'medium', high: 'high', urgent: 'high' };

export async function requestPayment(applicationId, { amount, reason, remarks, priority, notify }) {
  const response = await client.post(`/agent2/applications/${applicationId}/payment-requests`, {
    amount: Math.round(amount * 100),
    reason: reason || undefined,
    remarks: remarks || undefined,
    // The dialog offers normal/high/urgent; the backend stores low/medium/high.
    priority: PRIORITY_TO_API[priority] ?? undefined,
    notifyCitizen: notify,
  });

  return response.data.data.application;
}

/** Closing out one additional payment request — paid, waived, or cancelled.
    All three resume the SLA clock the request paused; only `paid` carries a
    `method`. */
export async function resolvePaymentRequest(applicationId, paymentRequestId, { outcome, method, reference }) {
  const response = await client.patch(
    `/agent2/applications/${applicationId}/payment-requests/${paymentRequestId}`,
    {
      outcome,
      method: outcome === 'paid' ? method : undefined,
      reference: reference || undefined,
    }
  );

  return response.data.data.application;
}

/** The case header's "Contact A1". `channel` has nowhere to go yet — there is
    one delivery channel, the notification centre — so only the message is
    sent. */
export async function contactAgent1(applicationId, { subject, message }) {
  const response = await client.post(`/agent2/applications/${applicationId}/contact-agent1`, {
    subject: subject || undefined,
    message,
  });

  return response.data.data;
}

export default {
  getCase,
  recordVisit,
  updateVisit,
  updateSubmission,
  uploadAcknowledgement,
  recordDecision,
  completeCase,
  requestExtension,
  requestPayment,
  resolvePaymentRequest,
  contactAgent1,
};
