/* Case detail — the fixed shapes CaseDetailPage.jsx draws its stepper, forms
   and dialogs from. The actual case record comes from the API (api/case.js);
   nothing in this file is a stand-in for it. */

/** The five stages of a government submission. `Step 1` is the visit itself. */
export const WORKFLOW_STEPS = [
  'Gov. Office Visit',
  'Doc Submission',
  'Reference Number',
  'Acknowledgement',
  'Remarks & Status',
];

/**
 * The case's stage follows the step the agent has reached, so the pill in the
 * breadcrumb and the stepper can never disagree. `tone` keys into the
 * .status-badge--* modifiers in styles/dashboard.css.
 */
export const STAGE_BY_STEP = {
  1: { label: 'Pending Submission', tone: 'gov' },
  2: { label: 'Submitted', tone: 'assigned' },
  3: { label: 'Under Process', tone: 'started' },
  4: { label: 'Government Review', tone: 'pending' },
};

/**
 * Once the department has ruled, the case's stage is the ruling itself — it
 * overrides the step-derived stage above.
 */
export const STAGE_BY_DECISION = {
  approved: { label: 'Government Approved', tone: 'approved' },
  rejected: { label: 'Government Rejected', tone: 'rejected' },
};

/* ------------------------------------------- additional payment request -- */

/** Why a counter asked for more money. */
export const PAYMENT_REASONS = [
  'Government Fee Revised',
  'Additional Document Charges',
  'Penalty / Late Fee',
  'Service Charge Revision',
  'Other',
];

/** How soon Agent 1 should chase the citizen. `tone` colours the dot. */
export const PAYMENT_PRIORITIES = [
  { value: 'normal', label: 'Normal', tone: 'amber' },
  { value: 'high', label: 'High', tone: 'orange' },
  { value: 'urgent', label: 'Urgent', tone: 'red' },
];

/** The remarks field is counted against this, as the design shows "122/500". */
export const PAYMENT_REMARKS_LIMIT = 500;

/* How much longer an agent may ask for. The department grants extensions in
   whole blocks rather than by the day, so these are the choices rather than a
   number the agent types. */
export const EXTENSION_DAYS = [3, 7, 14, 30];

/* How a message to Agent 1 travels. A notification lands in their console, an
   email leaves the building — the same message, a different reach. The icons
   live with the dialog, since only it draws them. */
export const CONTACT_CHANNELS = [
  { id: 'notification', label: 'Notification' },
  { id: 'email', label: 'Email' },
];

/* Where an emailed message lands. Agent 1 is the same person across every case
   an Agent 2 holds, so the address sits here rather than on the record. */
export const AGENT_1_EMAIL = 'ravi.kumar@ecitizen.gov.in';

/** Rupees as the design writes them — grouped, always two decimals. */
export const formatRupees = (amount) =>
  `₹ ${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Placeholder on the final remarks field — asks for the detail expected. */
export const REMARKS_EXAMPLE =
  'Enter your closing remarks — where it was filed and what the officer confirmed';

/**
 * The two ways a case ends. `tone` keys into the .decision--* modifiers in
 * styles/case.css.
 */
export const DECISIONS = [
  { id: 'approved', label: '✓ Gov. Approved', tone: 'approved' },
  { id: 'rejected', label: '✗ Gov. Rejected', tone: 'rejected' },
];

/**
 * How the acknowledgement receipt can be captured. An Agent 2 is standing at a
 * counter when they do this, so the camera is offered alongside the file
 * pickers rather than buried behind one.
 *
 * `accept` and `capture` map onto the hidden file input each tile opens.
 */
export const UPLOAD_SOURCES = [
  { id: 'pdf', label: 'Upload PDF', tone: 'blue', accept: 'application/pdf' },
  { id: 'image', label: 'Upload Image', tone: 'violet', accept: 'image/*' },
  { id: 'camera', label: 'Camera', tone: 'green', accept: 'image/*', capture: 'environment' },
];

/** Shown as the input's placeholder so what is wanted is unmistakable. */
export const REFERENCE_EXAMPLE = 'Enter the government reference number';
