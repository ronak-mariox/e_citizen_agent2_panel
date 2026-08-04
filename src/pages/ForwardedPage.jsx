import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { FORWARDED_ROWS, FORWARDED_STATS } from '../constants/queueData.js';
import statTotal from '../assets/icons/forwarded/stat-total.svg';
import statApproved from '../assets/icons/forwarded/stat-approved.svg';
import statPending from '../assets/icons/forwarded/stat-pending.svg';
import rowView from '../assets/icons/forwarded/row-view.svg';
import rowTrack from '../assets/icons/forwarded/row-track.svg';
import rowRecall from '../assets/icons/forwarded/row-recall.svg';
import '../styles/forwarded.css';

const STAT_ICON = {
  total: statTotal,
  approved: statApproved,
  pending: statPending,
};

function ForwardedPage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <main className="queue-page forwarded-page">
        <header>
          <h1 className="queue-page__title">Forwarded to Agent 2</h1>
          <p className="queue-page__subtitle">
            {FORWARDED_ROWS.length} applications handed over for final review
          </p>
        </header>

        <section className="fw-stats" aria-label="Hand-off summary">
          {FORWARDED_STATS.map((stat) => (
            <article className={`fw-stat fw-stat--${stat.tone}`} key={stat.id}>
              <div className="fw-stat__top">
                <p className="fw-stat__label">{stat.label}</p>
                <img src={STAT_ICON[stat.tone]} alt="" width="14.992" height="14.992" />
              </div>
              <p className="fw-stat__value">{stat.value}</p>
              <p className="fw-stat__note">{stat.note}</p>
            </article>
          ))}
        </section>

        <section className="fw-list" aria-label="Forwarded applications">
          {FORWARDED_ROWS.map((row) => (
            <article className="fw-card" key={row.id}>
              <span className="fw-card__avatar" aria-hidden="true">
                {row.initials}
              </span>

              <div className="fw-card__body">
                <div className="fw-card__identity">
                  <h2 className="fw-card__name">{row.name}</h2>
                  <span className={`fw-status fw-status--${row.statusTone}`}>
                    <span className="fw-status__dot" aria-hidden="true" />
                    {row.status}
                  </span>
                  <span className={`fw-priority fw-priority--${row.priorityTone}`}>
                    {row.priority}
                  </span>
                </div>

                <p className="fw-card__meta">
                  {row.id} · {row.service} · {row.department}
                </p>

                <div className="fw-card__stats">
                  <span>Applied: {row.appliedDate}</span>
                  <span className="fw-card__forwarded">Forwarded: {row.forwardedDate}</span>
                  <span className="fw-card__agent">→ {row.agent}</span>
                </div>
              </div>

              <div className="fw-card__actions">
                <button
                  className="fw-action fw-action--view"
                  type="button"
                  onClick={() => navigate(`/assigned-queue/${row.id}`)}
                >
                  <img src={rowView} alt="" width="11.247" height="11.247" />
                  View
                </button>
                <button className="fw-action fw-action--outline" type="button">
                  <img src={rowTrack} alt="" width="11.247" height="11.247" />
                  Track
                </button>
                <button className="fw-action fw-action--outline" type="button">
                  <img src={rowRecall} alt="" width="11.247" height="11.247" />
                  Recall
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </DashboardLayout>
  );
}

export default ForwardedPage;
