/* The receipt the counter stamps when an application is filed.

   An acknowledgement belongs to the application rather than to the visit that
   produced it, so the list is keyed on the case id. The five live cases are the
   ones in constants/dashboard.js; APP-2024-00431 is an older filing that only
   ever appears here, which is why it has no case screen of its own.

   `state` drives the pill, the counter it lands in and the row's action:
     uploaded — receipt on file, nothing left to do
     review   — with the department, waiting for them to acknowledge it
     pending  — the agent still has to attach it

   The reference number is the department's, not ours, so it stays empty until
   they issue one. */
export const ACKNOWLEDGEMENTS = [
  {
    id: 'APP-2024-00425',
    initials: 'SI',
    customer: 'Suresh Iyer',
    service: 'Building Plan',
    state: 'uploaded',
    ref: 'BBMP/BP/2024/1187',
  },
  {
    id: 'APP-2024-00430',
    initials: 'MD',
    customer: 'Mohan Das',
    service: 'Property Tax',
    state: 'pending',
    ref: null,
  },
  {
    id: 'APP-2024-00431',
    initials: 'LM',
    customer: 'Lalitha Menon',
    service: 'Encumbrance Cert',
    state: 'uploaded',
    ref: 'SRO/EC/2024/0442',
  },
  {
    id: 'APP-2024-00440',
    initials: 'RB',
    customer: 'Ramesh Babu',
    service: 'Land Records',
    state: 'pending',
    ref: null,
  },
  {
    id: 'APP-2024-00441',
    initials: 'KR',
    customer: 'Kavya Reddy',
    service: 'Zone Certificate',
    state: 'review',
    ref: 'HMDA/ZC/2024/0813',
  },
  {
    id: 'APP-2024-00442',
    initials: 'NJ',
    customer: 'Nandan Joshi',
    service: 'Sale Deed',
    state: 'pending',
    ref: null,
  },
];

/** The word and the tint for each state, so the pill and the tile agree. */
export const ACK_STATES = {
  uploaded: { label: 'Uploaded', tone: 'green' },
  review: { label: 'Under Review', tone: 'blue' },
  pending: { label: 'Pending', tone: 'amber' },
};

/** Nothing to do on a row once the receipt is in. */
export const isAckPending = (item) => item.state === 'pending';
