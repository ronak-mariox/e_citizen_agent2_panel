/* Notification centre — Figma node 155:6311, carried onto the Agent 2 console.

   The screen is the same one Agent 1 gets; the categories are not. An Agent 2
   does not verify documents or answer citizen queries — they carry a verified
   case to the department and chase it — so the types below follow this panel's
   own stages, the same ones the sidebar lists.

   `type` drives three things at once: the tinted icon badge, the chip under the
   body, and which filter chip the row answers to, so a row can never be filed
   under one and badged as another. */
export const NOTIFICATION_TYPES = [
  { id: 'assignments', label: 'Assignments', tone: 'assignment' },
  { id: 'processing', label: 'Gov. Processing', tone: 'verification' },
  { id: 'visits', label: 'Visits', tone: 'customer' },
  { id: 'acknowledgements', label: 'Acknowledgements', tone: 'sla' },
  { id: 'system', label: 'System Alerts', tone: 'system' },
];

export const NOTIFICATIONS = [
  {
    id: 'ntf-1',
    type: 'assignments',
    title: 'New Case Handed Over',
    body: 'APP-2024-00425 (Suresh Iyer) forwarded by Ravi Kumar — Building Plan, Urban Dev.',
    time: '5m ago',
    unread: true,
    link: '/assigned-queue/APP-2024-00425',
  },
  {
    id: 'ntf-2',
    type: 'visits',
    title: 'Department Visit Tomorrow',
    body: 'Registration office visit scheduled 09:30 AM for APP-2024-00431.',
    time: '22m ago',
    unread: true,
    link: '/government-visits',
  },
  {
    id: 'ntf-3',
    type: 'acknowledgements',
    title: 'Acknowledgement Still Pending',
    body: 'APP-2024-00419 (Priya Sharma) was submitted 2 days ago with no receipt attached.',
    time: '1h ago',
    unread: true,
    link: '/acknowledgements',
  },
  {
    id: 'ntf-4',
    type: 'processing',
    title: 'Department Marked Case In Progress',
    body: 'Urban Dev has begun processing APP-2024-00420 (Anand Verma).',
    time: '2h ago',
    unread: false,
    link: '/gov-processing',
  },
  {
    id: 'ntf-5',
    type: 'system',
    title: 'System Maintenance Tonight',
    body: 'Scheduled maintenance on 09 Jul 2024, 11 PM – 1 AM IST. Save your work.',
    time: '3h ago',
    unread: false,
    link: null,
  },
  {
    id: 'ntf-6',
    type: 'assignments',
    title: 'Case Approved and Closed',
    body: 'APP-2024-00430 (Mohan Das) approved — Property Tax, Revenue Dept.',
    time: '4h ago',
    unread: false,
    link: '/completed-cases',
  },
  {
    id: 'ntf-7',
    type: 'visits',
    title: 'Visit Outcome Recorded',
    body: 'Revenue Dept visit for APP-2024-00428 logged as query raised at counter.',
    time: '5h ago',
    unread: false,
    link: '/government-visits',
  },
  {
    id: 'ntf-8',
    type: 'acknowledgements',
    title: 'Receipt Rejected by Department',
    body: 'The acknowledgement uploaded for APP-2024-00421 was unreadable. Re-upload needed.',
    time: '6h ago',
    unread: true,
    link: '/acknowledgements',
  },
  {
    id: 'ntf-9',
    type: 'processing',
    title: 'Case Rejected by Department',
    body: 'APP-2024-00433 (Geeta Pillai) rejected — fraudulent supporting documents.',
    time: 'Yesterday',
    unread: false,
    link: '/rejected-cases',
  },
  {
    id: 'ntf-10',
    type: 'assignments',
    title: 'Bulk Handover — 5 New Cases',
    body: '5 verified applications handed to your queue by Supervisor Anil M.',
    time: 'Yesterday',
    unread: false,
    link: '/assigned-queue',
  },
];
