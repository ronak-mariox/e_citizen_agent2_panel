import { useNavigate } from 'react-router-dom';

/* Today's counter appointments. An Agent 2 plans their day around these, so a
   finished visit stays on the list — tinted green — rather than disappearing.

   `visits` comes from the dashboard's own fetch (backend `GET
   /agent2/dashboard`) rather than being read here, so the tiles above it and
   this list are always answering from the same request. */
export function GovVisits({ visits = [] }) {
  const navigate = useNavigate();

  return (
    <section className="dash-card">
      <h2 className="dash-card__title">Today&apos;s Government Visits</h2>

      <div className="visit-list">
        {visits.length === 0 && <p className="field-empty">No visits booked for today.</p>}

        {visits.map((visit) => (
          <article className={`visit visit--${visit.state}`} key={visit.id}>
            <span className="visit__dot" aria-hidden="true" />

            <div className="visit__body">
              <p className="visit__title">
                {visit.time} — {visit.office}
              </p>
              <p className="visit__meta">{visit.meta}</p>
            </div>

            <span className={`visit__pill visit__pill--${visit.state}`}>{visit.label}</span>
          </article>
        ))}
      </div>

      <button
        className="visit-schedule"
        type="button"
        onClick={() => navigate('/government-visits')}
      >
        + Schedule New Visit
      </button>
    </section>
  );
}

export default GovVisits;
