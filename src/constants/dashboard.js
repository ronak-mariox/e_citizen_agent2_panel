import navDashboard from '../assets/icons/agent2/nav-dashboard.svg';
import navAssigned from '../assets/icons/agent2/nav-assigned.svg';
import navProcessing from '../assets/icons/agent2/nav-processing.svg';
import navVisits from '../assets/icons/agent2/nav-visits.svg';
import navAcknowledgements from '../assets/icons/agent2/nav-acknowledgements.svg';
import navCompleted from '../assets/icons/agent2/nav-completed.svg';
import navRejected from '../assets/icons/agent2/nav-rejected.svg';
import navNotifications from '../assets/icons/agent2/nav-notifications.svg';
import navSettings from '../assets/icons/agent2/nav-settings.svg';

import statPendingSubmission from '../assets/icons/agent2/stat-pending-submission.svg';
import statInProgress from '../assets/icons/agent2/stat-in-progress.svg';
import statApproved from '../assets/icons/agent2/stat-approved.svg';
import statDeadline from '../assets/icons/agent2/stat-deadline.svg';
import statCompletedToday from '../assets/icons/agent2/stat-completed-today.svg';
import statRejected from '../assets/icons/agent2/stat-rejected.svg';
import statVisits from '../assets/icons/agent2/stat-visits.svg';
import statTotal from '../assets/icons/agent2/stat-total.svg';

/* The Agent 2 console — an Agent 2 does not verify documents, they carry a
   verified application to the department and chase it, so every section here is
   a stage of that journey rather than a verification queue.

   Sections without a screen of their own resolve to the placeholder page; see
   routes/AppRoutes.jsx, which derives that list from NAV_ITEMS. */
export const NAV_ITEMS = [
  { label: 'Dashboard', icon: navDashboard, to: '/dashboard' },
  // The badge counts the cases still open — see context/CasesContext.jsx.
  { label: 'Assigned Cases', icon: navAssigned, to: '/assigned-queue', badge: 'assigned' },
  { label: 'Gov. Processing', icon: navProcessing, to: '/gov-processing' },
  { label: 'Government Visits', icon: navVisits, to: '/government-visits' },
  { label: 'Acknowledgements', icon: navAcknowledgements, to: '/acknowledgements' },
  { label: 'Completed Cases', icon: navCompleted, to: '/completed-cases' },
  { label: 'Rejected Cases', icon: navRejected, to: '/rejected-cases' },
  { label: 'Notifications', icon: navNotifications, to: '/notifications' },
  { label: 'Settings', icon: navSettings, to: '/settings' },
];

export const AGENT = {
  name: 'Kavitha R.',
  role: 'Agent 2',
  initials: 'KR',
};

/* Two rows of four. The accent is the tile colour behind the icon, and it lives
   with the data because each tile owns its own hue.

   `muted` is the second row: the first four are today's work and read in full
   black, the rest are context and are dimmed. */
export const STAT_CARDS = [
  {
    id: 'pending-submission',
    icon: statPendingSubmission,
    accent: '#45556c',
    value: '5',
    title: 'Pending Submission',
  },
  {
    id: 'gov-in-progress',
    icon: statInProgress,
    accent: '#4f39f6',
    value: '0',
    title: 'Gov. In Progress',
  },
  {
    id: 'government-approved',
    icon: statApproved,
    accent: '#00a63e',
    value: '0',
    title: 'Government Approved',
  },
  {
    id: 'deadline-near',
    icon: statDeadline,
    accent: '#fb2c36',
    value: '1',
    title: 'Deadline ≤ 3 Days',
  },
  {
    id: 'completed-today',
    icon: statCompletedToday,
    accent: '#009966',
    value: '0',
    title: 'Completed Today',
    muted: true,
  },
  {
    id: 'gov-rejected',
    icon: statRejected,
    accent: '#e7000b',
    value: '1',
    title: 'Gov. Rejected',
    muted: true,
  },
  {
    id: 'todays-visits',
    icon: statVisits,
    accent: '#155dfc',
    value: '2',
    title: "Today's Visits",
    muted: true,
  },
  {
    id: 'total-assigned',
    icon: statTotal,
    accent: '#7f22fe',
    value: '6',
    title: 'Total Assigned',
    muted: true,
  },
];

/** The cases in flight, newest first. `stage` is the department-side status. */
export const ACTIVE_CASES = [
  {
    id: 'APP-2024-00425',
    initials: 'SI',
    name: 'Suresh Iyer',
    priority: 'High',
    meta: 'APP-2024-00425 · Building Plan',
    stage: 'Pending Submission',
  },
  {
    id: 'APP-2024-00430',
    initials: 'MD',
    name: 'Mohan Das',
    priority: 'Medium',
    meta: 'APP-2024-00430 · Property Tax',
    stage: 'Pending Submission',
  },
  {
    id: 'APP-2024-00440',
    initials: 'RB',
    name: 'Ramesh Babu',
    priority: 'High',
    meta: 'APP-2024-00440 · Land Records',
    stage: 'Pending Submission',
  },
  {
    id: 'APP-2024-00441',
    initials: 'KR',
    name: 'Kavya Reddy',
    priority: 'High',
    meta: 'APP-2024-00441 · Zone Certificate',
    stage: 'Pending Submission',
  },
  {
    id: 'APP-2024-00442',
    initials: 'NJ',
    name: 'Nandan Joshi',
    priority: 'Medium',
    meta: 'APP-2024-00442 · Sale Deed',
    stage: 'Pending Submission',
  },
];

/** Counter appointments for today. `state` drives the row tint and the pill. */
export const GOV_VISITS = [
  {
    id: 'visit-bbmp',
    time: '10:30 AM',
    office: 'BBMP Head Office',
    meta: 'APP-2024-00425 · Officer: D.K. Rao',
    state: 'done',
    label: 'Done',
  },
  {
    id: 'visit-revenue',
    time: '03:00 PM',
    office: 'Revenue Sub-Division',
    meta: 'APP-2024-00440 · Officer: R. Sharma',
    state: 'upcoming',
    label: 'Upcoming',
  },
];

export const PRIORITY_MODIFIER = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
};
