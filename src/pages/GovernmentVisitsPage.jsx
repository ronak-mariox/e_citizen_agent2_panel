import { useState } from 'react';
import { Link } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { GOVERNMENT_VISITS, isVisitDone } from '../constants/visits.js';
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

import '../styles/visits.css';

/* Every counter appointment the agent has, in date order.

   A visit is the one part of an Agent 2's day that happens away from the desk,
   so this screen leads with when and where rather than with the case. */
export function GovernmentVisitsPage() {
  // Which card is expanded; the design shows every row collapsed.
  const [open, setOpen] = useState(null);
  /* null when the dialog is shut, a visit when editing one, and `{}` when
     scheduling a new one — the same form serves both. */
  const [editing, setEditing] = useState(null);

  const visits = GOVERNMENT_VISITS;
  const completed = visits.filter(isVisitDone).length;

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

  return (
    <DashboardLayout>
      <main className="visits-page">
        <div className="visits-page__head">
          <div>
            <h1 className="visits-page__title">Government Visits</h1>
            <p className="visits-page__lead">{visits.length} visits — this week</p>
          </div>

          <button
            className="visits-page__schedule"
            type="button"
            onClick={() => setEditing({})}
          >
            <img src={schedulePin} alt="" width="13.12" height="13.12" />+ Schedule Visit
          </button>
        </div>

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
                      src={isVisitDone(visit) ? pinGreen : pinBlue}
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
                      {visit.date} at {visit.time} · Officer: {visit.officer}
                    </span>
                    <span className="visit-card__case">
                      {visit.caseId} · {visit.customer} · {visit.purpose}
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
                        <dd className="visit-detail__value">{visit.caseId}</dd>
                      </div>
                      <div>
                        <dt className="visit-detail__label">Customer</dt>
                        <dd className="visit-detail__value">{visit.customer}</dd>
                      </div>
                      <div>
                        <dt className="visit-detail__label">Purpose</dt>
                        <dd className="visit-detail__value">{visit.purpose}</dd>
                      </div>
                      <div>
                        <dt className="visit-detail__label">Office</dt>
                        <dd className="visit-detail__value">{visit.office}</dd>
                      </div>
                      <div>
                        <dt className="visit-detail__label">Officer</dt>
                        <dd className="visit-detail__value">{visit.officer}</dd>
                      </div>
                      <div>
                        <dt className="visit-detail__label">Date &amp; Time</dt>
                        <dd className="visit-detail__value">
                          {visit.date}, {visit.time}
                        </dd>
                      </div>
                    </dl>

                    <div className="visit-detail__actions">
                      <Link className="visit-action visit-action--view" to={`/assigned-queue/${visit.caseId}`}>
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
            onCancel={() => setEditing(null)}
            onSave={(entry) => {
              // TODO: books or amends the visit once the agent API exists.
              console.info(editing.id ? 'edit visit' : 'schedule visit', entry);
              setEditing(null);
            }}
          />
        )}
      </main>
    </DashboardLayout>
  );
}

export default GovernmentVisitsPage;
