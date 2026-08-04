import { GOV_VISITS } from '../../constants/dashboard.js';

/* Today's counter appointments. An Agent 2 plans their day around these, so a
   finished visit stays on the list — tinted green — rather than disappearing. */
export function GovVisits() {
  // TODO: opens the scheduling flow once the visits screen exists.
  function handleSchedule() {
    console.info('schedule visit requested');
  }

  return (
    <section className="dash-card">
      <h2 className="dash-card__title">Today&apos;s Government Visits</h2>

      <div className="visit-list">
        {GOV_VISITS.map((visit) => (
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

      <button className="visit-schedule" type="button" onClick={handleSchedule}>
        + Schedule New Visit
      </button>
    </section>
  );
}

export default GovVisits;
