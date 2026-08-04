/* Counter appointments, across every case.

   These carry the values from the Government Visits design. They are held here
   rather than derived from CASE_DETAILS because the two Figma frames disagree —
   the case screen shows APP-2024-00425 visiting BBMP on 04 Jul, this screen
   shows 02 Jul — and each screen is built to match its own design.

   `state` drives the tile, the pin and the pill:
     completed — done, green
     upcoming  — next up, blue
     scheduled — booked but further out, blue tile with a neutral pill */
export const GOVERNMENT_VISITS = [
  {
    id: 'visit-00425',
    office: 'BBMP Head Office',
    state: 'completed',
    label: 'Completed',
    date: '02 Jul 2024',
    time: '10:30 AM',
    officer: 'D.K. Rao',
    caseId: 'APP-2024-00425',
    customer: 'Suresh Iyer',
    purpose: 'Building Plan Submission',
  },
  {
    id: 'visit-00440',
    office: 'Revenue Sub-Division',
    state: 'upcoming',
    label: 'Upcoming',
    date: '04 Jul 2024',
    time: '03:00 PM',
    officer: 'R. Sharma',
    caseId: 'APP-2024-00440',
    customer: 'Ramesh Babu',
    purpose: 'Land Records Mutation',
  },
  {
    id: 'visit-00441',
    office: 'HMDA Office',
    state: 'scheduled',
    label: 'Scheduled',
    date: '05 Jul 2024',
    time: '11:00 AM',
    officer: 'P. Nair',
    caseId: 'APP-2024-00441',
    customer: 'Kavya Reddy',
    purpose: 'Zone Certificate Issuance',
  },
  {
    id: 'visit-00442',
    office: 'Sub-Registrar Office',
    state: 'scheduled',
    label: 'Scheduled',
    date: '06 Jul 2024',
    time: '02:30 PM',
    officer: 'A. Gupta',
    caseId: 'APP-2024-00442',
    customer: 'Nandan Joshi',
    purpose: 'Sale Deed Registration',
  },
];

/** Anything not yet done is still ahead of the agent, however far out. */
export const isVisitDone = (visit) => visit.state === 'completed';
