import { useEffect, useRef, useState } from 'react';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import ActiveCases from '../components/dashboard/ActiveCases.jsx';
import GovVisits from '../components/dashboard/GovVisits.jsx';
import refreshIcon from '../assets/icons/agent2/refresh.svg';
import { AGENT, STAT_CARDS } from '../constants/dashboard.js';
import { useAuth } from '../context/AuthContext.jsx';
import * as dashboardApi from '../api/dashboard.js';
import { getErrorMessage } from '../api/client.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';

function greeting(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* STAT_CARDS' own key -> the field the API answers it with (backend
   services/agent2.service.js's getAgent2Dashboard). Icon, accent and title
   stay the design's; only the number is real. */
const STAT_FIELD = {
  'pending-submission': 'pendingSubmission',
  'gov-in-progress': 'governmentInProgress',
  'government-approved': 'governmentApproved',
  'deadline-near': 'dueSoon',
  'completed-today': 'completedToday',
  'gov-rejected': 'governmentRejected',
  'todays-visits': 'todaysVisits',
  'total-assigned': 'totalAssigned',
};

const TIME = { hour: 'numeric', minute: '2-digit' };
const VISIT_LABEL = { scheduled: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' };
const VISIT_STATE = { scheduled: 'upcoming', completed: 'done', cancelled: 'done' };

function toVisitRow(visit) {
  const time = new Date(visit.scheduledAt);

  return {
    id: visit.applicationId,
    time: Number.isNaN(time.getTime()) ? '—' : time.toLocaleTimeString('en-IN', TIME),
    office: visit.office,
    meta: visit.applicationNumber,
    state: VISIT_STATE[visit.status] ?? 'upcoming',
    label: VISIT_LABEL[visit.status] ?? 'Upcoming',
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.fullName || AGENT.name).split(' ')[0];

  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // A live refetch that fails keeps the numbers on screen without an error.
  const silentRef = useRef(false);
  useLiveRefresh(() => {
    silentRef.current = true;
    setReloadToken((token) => token + 1);
  }, ['applications', 'wallet']);

  useEffect(() => {
    let cancelled = false;
    const silent = silentRef.current;
    silentRef.current = false;

    dashboardApi
      .getDashboard()
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setLoadError(null);
      })
      .catch((error) => {
        if (!cancelled && !silent) setLoadError(getErrorMessage(error));
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const cards = STAT_CARDS.map((card) => ({
    ...card,
    value: data ? String(data.stats[STAT_FIELD[card.id]] ?? 0) : '—',
  }));

  return (
    <DashboardLayout>
      <main className="dash-page">
        <div className="dash-page__head">
          <div>
            <h1 className="dash-page__title">{`${greeting()}, ${firstName} 👋`}</h1>
            <p className="dash-page__subtitle">Agent 2 · Government Processing Overview</p>
          </div>
          <button
            className="dash-page__refresh"
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
          >
            <img src={refreshIcon} alt="" width="13.12" height="13.12" />
            Refresh
          </button>
        </div>

        {loadError && (
          <p className="notice notice--error" role="alert">
            {loadError}
          </p>
        )}

        <div className="stat-grid">
          {cards.map((card) => (
            <StatCard key={card.id} {...card} />
          ))}
        </div>

        <div className="split-row">
          <ActiveCases />
          <GovVisits visits={(data?.todaysVisits ?? []).map(toVisitRow)} />
        </div>
      </main>
    </DashboardLayout>
  );
}

export default DashboardPage;
