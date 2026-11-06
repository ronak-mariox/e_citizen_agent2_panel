import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import schedulePin from '../assets/icons/agent2/visits/schedule-pin.svg';
import statTotal from '../assets/icons/agent2/visits/stat-total.svg';
import statCompleted from '../assets/icons/agent2/visits/stat-completed.svg';
import statUpcoming from '../assets/icons/agent2/visits/stat-upcoming.svg';
import pinGreen from '../assets/icons/agent2/visits/pin-green.svg';
import pinBlue from '../assets/icons/agent2/visits/pin-blue.svg';
import chevron from '../assets/icons/agent2/visits/chevron.svg';
import viewCase from '../assets/icons/agent2/visits/view-case.svg';
import editVisit from '../assets/icons/agent2/visits/edit-visit.svg';
import VisitFormDialog from '../components/visits/VisitFormDialog.jsx';
import * as visitsApi from '../api/visits.js';
import * as caseApi from '../api/case.js';
import * as queueApi from '../api/queue.js';
import { getErrorMessage } from '../api/client.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';

import '../styles/visits.css';

/* Every counter appointment the agent has, across every case — backend `GET
   /agent2/visits`, which flattens each application's own governmentVisits
   array (see services/agent2.service.js) into one list.

   A visit is the one part of an Agent 2's day that happens away from the
   desk, so this screen leads with when and where rather than with the case. */

const DATE = { day: '2-digit', month: 'short', year: 'numeric' };
const TIME = { hour: 'numeric', minute: '2-digit' };

const fmtDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', DATE);
};
const fmtTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('en-IN', TIME);
};

/* The backend only stores scheduled/completed/cancelled — "next up" versus
   "further out" is a question of which scheduled visit is soonest, not a
   stored state, so it is worked out here rather than asked of the API. */
function withDisplayState(visits) {
  const soonest = visits
    .filter((visit) => visit.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0]?.id;

  return visits.map((visit) => {
    if (visit.status === 'completed') return { ...visit, state: 'completed', label: 'Completed' };
    if (visit.status === 'cancelled') return { ...visit, state: 'scheduled', label: 'Cancelled' };

    return visit.id === soonest
      ? { ...visit, state: 'upcoming', label: 'Upcoming' }
      : { ...visit, state: 'scheduled', label: 'Scheduled' };
  });
}

export function GovernmentVisitsPage() {
  const [visits, setVisits] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // A live refetch that fails keeps what is on screen without an error.
  const silentRef = useRef(false);
  useLiveRefresh(() => {
    silentRef.current = true;
    setReloadToken((token) => token + 1);
  }, ['applications', 'wallet']);

  // Which card is expanded; the design shows every row collapsed.
  const [open, setOpen] = useState(null);
  /* null when the dialog is shut, a visit when editing one, and `{}` when
     scheduling a new one — the same form serves both. */
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const silent = silentRef.current;
    silentRef.current = false;

    // The backend caps `limit` at 100 (utils/pagination.js MAX_LIMIT).
    Promise.all([visitsApi.listVisits({ limit: 100 }), queueApi.listMyCases({ limit: 100 })])
      .then(([visitData, caseData]) => {
        if (cancelled) return;

        setVisits(withDisplayState(visitData.visits));
        setCases(
          caseData.applications.map((application) => ({
            id: application.id,
            applicationNumber: application.applicationNumber,
            citizenName: application.citizen?.fullName ?? application.citizen?.mobile ?? null,
          }))
        );
      })
      .catch((error) => {
        if (!cancelled && !silent) setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const completed = visits.filter((visit) => visit.status === 'completed').length;
  const offices = [...new Set(visits.map((visit) => visit.office))];

  const stats = [
    { id: 'total', tone: 'blue', icon: statTotal, label: 'Total Visits', value: visits.length },
    { id: 'completed', tone: 'green', icon: statCompleted, label: 'Completed', value: completed },
    {
      id: 'upcoming',
      tone: 'amber',
      icon: statUpcoming,
      label: 'Upcoming',
      value: visits.length - completed,
    },
  ];

  async function handleSave(entry) {
    try {
      if (editing?.id) {
        await caseApi.updateVisit(entry.applicationId, editing.id, entry);
      } else {
        await caseApi.recordVisit(entry.applicationId, entry);
      }

      setEditing(null);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    }
  }

  return (
    <DashboardLayout>
      <main className="visits-page">
        <div className="visits-page__head">
          <div>
            <h1 className="visits-page__title">Government Visits</h1>
            <p className="visits-page__lead">
              {loading ? 'Loading…' : `${visits.length} visits`}
            </p>
          </div>

          <button
            className="visits-page__schedule"
            type="button"
            onClick={() => setEditing({})}
          >
            <img src={schedulePin} alt="" width="13.12" height="13.12" />+ Schedule Visit
          </button>
        </div>

        {loadError && (
          <p className="notice notice--error" role="alert">
            {loadError}
          </p>
        )}

        <div className="visits-stats">
          {stats.map((stat) => (
            <div className={`visits-stat visits-stat--${stat.tone}`} key={stat.id}>
              <div className="visits-stat__head">
                <span className="visits-stat__label">{stat.label}</span>
                <img src={stat.icon} alt="" width="14.992" height="14.992" />
              </div>
              <p className="visits-stat__value">{stat.value}</p>
            </div>
          ))}
        </div>

        <ul className="visit-list">
          {!loading && visits.length === 0 && (
            <p className="field-empty">No visits booked yet.</p>
          )}

          {visits.map((visit) => {
            const expanded = open === visit.id;

            return (
              <li className="visit-card" key={visit.id}>
                <button
                  className="visit-card__main"
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : visit.id)}
                >
                  <span className={`visit-card__pin visit-card__pin--${visit.state}`}>
                    <img
                      src={visit.status === 'completed' ? pinGreen : pinBlue}
                      alt=""
                      width="18.749"
                      height="18.749"
                    />
                  </span>

                  <span className="visit-card__body">
                    <span className="visit-card__title">
                      <span className="visit-card__office">{visit.office}</span>
                      <span className={`visit-pill visit-pill--${visit.state}`}>{visit.label}</span>
                    </span>

                    <span className="visit-card__when">
                      {fmtDate(visit.scheduledAt)} at {fmtTime(visit.scheduledAt)}
                      {visit.officer ? ` · Officer: ${visit.officer}` : ''}
                    </span>
                    <span className="visit-card__case">
                      {visit.applicationNumber} · {visit.citizenName ?? 'Unknown'} ·{' '}
                      {visit.purpose ?? '—'}
                    </span>
                  </span>

                  <img
                    className={expanded ? 'visit-card__chevron visit-card__chevron--open' : 'visit-card__chevron'}
                    src={chevron}
                    alt=""
                    width="14.992"
                    height="14.992"
                  />
                </button>

                {expanded && (
                  <div className="visit-detail">
                    <dl className="visit-detail__grid">
                      <div>
                        <dt className="visit-detail__label">Application</dt>
                        <dd className="visit-detail__value">{visit.applicationNumber}</dd>
                      </div>
                      <div>
                        <dt className="visit-detail__label">Customer</dt>
                        <dd className="visit-detail__value">{visit.citizenName ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="visit-detail__label">Purpose</dt>
                        <dd className="visit-detail__value">{visit.purpose ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="visit-detail__label">Office</dt>
                        <dd className="visit-detail__value">{visit.office}</dd>
                      </div>
                      <div>
                        <dt className="visit-detail__label">Officer</dt>
                        <dd className="visit-detail__value">{visit.officer ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="visit-detail__label">Date &amp; Time</dt>
                        <dd className="visit-detail__value">
                          {fmtDate(visit.scheduledAt)}, {fmtTime(visit.scheduledAt)}
                        </dd>
                      </div>
                    </dl>

                    <div className="visit-detail__actions">
                      <Link
                        className="visit-action visit-action--view"
                        to={`/assigned-queue/${visit.applicationId}`}
                      >
                        <img src={viewCase} alt="" width="11.247" height="11.247" />
                        View Case
                      </Link>

                      <button
                        className="visit-action"
                        type="button"
                        onClick={() => setEditing(visit)}
                      >
                        <img src={editVisit} alt="" width="11.247" height="11.247" />
                        Edit Visit
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {editing && (
          <VisitFormDialog
            visit={editing.id ? editing : null}
            offices={offices}
            cases={cases}
            onCancel={() => setEditing(null)}
            onSave={handleSave}
          />
        )}
      </main>
    </DashboardLayout>
  );
}

export default GovernmentVisitsPage;
