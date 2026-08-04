/* Case detail, keyed by application reference.

   The dashboard's Active Cases list links straight into these, so every row in
   ACTIVE_CASES (constants/dashboard.js) has a record here and the ids must stay
   in step. APP-2024-00425 carries the values from the design; the rest follow
   the same shape with their own applicant, service and dates.

   Placeholder data standing in for the API — the page reads shape, not values. */

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

/** "08 Jul 2024 (6 days left)" -> 6. The label is the only place it is held. */
export const deadlineDaysLeft = (record) => {
  const match = /\((\d+)\s+days?\s+left\)/.exec(record?.deadlineLabel ?? '');

  return match ? Number(match[1]) : null;
};

/** Rupees as the design writes them — grouped, always two decimals. */
export const formatRupees = (amount) =>
  `₹ ${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Placeholder on the final remarks field — an example of the detail expected. */
export const REMARKS_EXAMPLE =
  '"Documents submitted at BBMP Head Office. Officer confirmed verification within five working days."';

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

/** Shown as the input's placeholder so the expected format is unmistakable. */
export const REFERENCE_EXAMPLE = 'e.g. GOV-2024-8821';

/* What has to be handed across the counter. The first two travel with every
   application; the rest depend on the service, which is why they start
   unticked. */
const submissionChecklist = () => [
  { id: 'application-form', label: 'Original Application Form', done: true },
  { id: 'identity-proof', label: 'Identity Proof (Aadhaar + PAN)', done: true },
  { id: 'property-documents', label: 'Property Documents', done: false },
  { id: 'payment-receipt', label: 'Payment Receipt', done: false },
];

/* Every case arrives from Agent 1 with the same verified bundle, so the
   document list is shared rather than repeated per record. */
const FORWARDED_DOCUMENTS = [
  { name: 'Aadhaar Card', size: '1.2 MB' },
  { name: 'PAN Card', size: '0.8 MB' },
  { name: 'Property Plan', size: '3.4 MB' },
  { name: 'Property Tax Receipt', size: '0.5 MB' },
  { name: 'Site Map', size: '2.1 MB' },
  { name: 'Encumbrance Certificate', size: '1.7 MB' },
];

/**
 * `state` drives the dot colour: done is green, pending grey, deadline amber.
 * The last entry is the deadline itself rather than an event, which is why it
 * is amber even though nothing has happened yet.
 */
const timelineFor = ({ submitted, verified, forwarded, visit, deadline }) => [
  { id: 'submitted', label: 'Submitted by Citizen', date: submitted, state: 'done' },
  { id: 'verified', label: 'Agent 1 Verified', date: verified, state: 'done' },
  { id: 'forwarded', label: 'Forwarded to Agent 2', date: forwarded, state: 'done' },
  { id: 'visit', label: 'Gov. Office Visit', date: visit, state: 'pending' },
  { id: 'decision', label: 'Gov. Decision', date: '—', state: 'pending' },
  { id: 'deadline', label: 'Deadline', date: deadline, state: 'deadline' },
];

export const CASE_DETAILS = {
  'APP-2024-00425': {
    id: 'APP-2024-00425',
    initials: 'SI',
    name: 'Suresh Iyer',
    priority: 'High',
    department: 'Urban Dev',
    service: 'Building Plan',
    deadline: '08 Jul 2024',
    stage: 'Pending Submission',
    paidAmount: 5000,
    remark: {
      text: 'All documents verified. Site map resubmitted and approved. Forwarding for government registration.',
      forwardedOn: '02 Jul 2024',
    },
    documents: FORWARDED_DOCUMENTS,
    // Share of the window already spent, so the bar and the day count agree.
    deadlineLabel: '08 Jul 2024 (6 days left)',
    deadlineProgress: 43,
    timeline: timelineFor({
      submitted: '28 Jun',
      verified: '02 Jul 2024',
      forwarded: '02 Jul 2024',
      visit: '04 Jul',
      deadline: '08 Jul 2024',
    }),
    activeStep: 1,
    visit: {
      office: 'BBMP Head Office',
      officer: 'D.K. Rao',
      date: '04 Jul 2024',
      time: '10:30 AM',
      purpose: 'Property Tax Submission',
    },
    submission: {
      checklist: submissionChecklist(),
      date: '04 Jul 2024',
      desk: 'Counter 3 — Ground Floor',
    },
  },

  'APP-2024-00430': {
    id: 'APP-2024-00430',
    initials: 'MD',
    name: 'Mohan Das',
    priority: 'Medium',
    department: 'Revenue',
    service: 'Property Tax',
    deadline: '10 Jul 2024',
    stage: 'Pending Submission',
    paidAmount: 3500,
    remark: {
      text: 'Assessment records verified against the revenue register. Ready for counter submission.',
      forwardedOn: '03 Jul 2024',
    },
    documents: FORWARDED_DOCUMENTS,
    deadlineLabel: '10 Jul 2024 (9 days left)',
    deadlineProgress: 25,
    timeline: timelineFor({
      submitted: '30 Jun',
      verified: '03 Jul 2024',
      forwarded: '03 Jul 2024',
      visit: '08 Jul',
      deadline: '11 Jul 2024',
    }),
    activeStep: 1,
    visit: {
      office: 'Revenue Sub-Division',
      officer: 'R. Sharma',
      date: '08 Jul 2024',
      time: '11:00 AM',
      purpose: 'Property Tax Submission',
    },
    submission: {
      checklist: submissionChecklist(),
      date: '08 Jul 2024',
      desk: 'Counter 1 — Revenue Wing',
    },
  },

  'APP-2024-00440': {
    id: 'APP-2024-00440',
    initials: 'RB',
    name: 'Ramesh Babu',
    priority: 'High',
    department: 'Revenue',
    service: 'Land Records',
    deadline: '07 Jul 2024',
    stage: 'Pending Submission',
    paidAmount: 4200,
    remark: {
      text: 'Mutation entries checked and encumbrance certificate attached. Awaiting sub-division counter.',
      forwardedOn: '02 Jul 2024',
    },
    documents: FORWARDED_DOCUMENTS,
    deadlineLabel: '07 Jul 2024 (4 days left)',
    deadlineProgress: 38,
    timeline: timelineFor({
      submitted: '27 Jun',
      verified: '02 Jul 2024',
      forwarded: '02 Jul 2024',
      visit: '04 Jul',
      deadline: '09 Jul 2024',
    }),
    activeStep: 1,
    // Matches today's 3 PM slot on the dashboard's visit list.
    visit: {
      office: 'Revenue Sub-Division',
      officer: 'R. Sharma',
      date: '04 Jul 2024',
      time: '03:00 PM',
      purpose: 'Land Records Submission',
    },
    submission: {
      checklist: submissionChecklist(),
      date: '04 Jul 2024',
      desk: 'Counter 2 — Records Section',
    },
  },

  'APP-2024-00441': {
    id: 'APP-2024-00441',
    initials: 'KR',
    name: 'Kavya Reddy',
    priority: 'High',
    department: 'Urban Dev',
    service: 'Zone Certificate',
    deadline: '06 Jul 2024',
    stage: 'Pending Submission',
    paidAmount: 2800,
    remark: {
      text: 'Zoning plan and site map verified. Needs planning-section endorsement before submission.',
      forwardedOn: '03 Jul 2024',
    },
    documents: FORWARDED_DOCUMENTS,
    deadlineLabel: '06 Jul 2024 (2 days left)',
    deadlineProgress: 31,
    timeline: timelineFor({
      submitted: '29 Jun',
      verified: '03 Jul 2024',
      forwarded: '03 Jul 2024',
      visit: '05 Jul',
      deadline: '10 Jul 2024',
    }),
    activeStep: 1,
    visit: {
      office: 'BBMP Planning Section',
      officer: 'S. Ananth',
      date: '05 Jul 2024',
      time: '09:45 AM',
      purpose: 'Zone Certificate Submission',
    },
    submission: {
      checklist: submissionChecklist(),
      date: '05 Jul 2024',
      desk: 'Counter 5 — Planning Section',
    },
  },

  'APP-2024-00442': {
    id: 'APP-2024-00442',
    initials: 'NJ',
    name: 'Nandan Joshi',
    priority: 'Medium',
    department: 'Registration',
    service: 'Sale Deed',
    deadline: '09 Jul 2024',
    stage: 'Pending Submission',
    paidAmount: 7500,
    remark: {
      text: 'Stamp duty paid and both parties verified. Slot to be booked at the sub-registrar office.',
      forwardedOn: '04 Jul 2024',
    },
    documents: FORWARDED_DOCUMENTS,
    deadlineLabel: '09 Jul 2024 (7 days left)',
    deadlineProgress: 18,
    timeline: timelineFor({
      submitted: '01 Jul',
      verified: '04 Jul 2024',
      forwarded: '04 Jul 2024',
      visit: '09 Jul',
      deadline: '12 Jul 2024',
    }),
    activeStep: 1,
    visit: {
      office: 'Sub-Registrar Office, Jayanagar',
      officer: 'M. Prasad',
      date: '09 Jul 2024',
      time: '12:15 PM',
      purpose: 'Sale Deed Registration',
    },
    submission: {
      checklist: submissionChecklist(),
      date: '09 Jul 2024',
      desk: 'Counter 4 — Registration Hall',
    },
  },
};

export const findCase = (id) => CASE_DETAILS[id] ?? null;
