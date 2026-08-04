import { Link } from 'react-router-dom';

import arrowRight from '../../assets/icons/agent2/arrow-right.svg';
import { PRIORITY_MODIFIER } from '../../constants/dashboard.js';
import { useCases } from '../../context/CasesContext.jsx';

/** The cases this agent is carrying, with the department-side stage on the right. */
export function ActiveCases() {
  // Closed cases leave this list for their outcome tab.
  const { assigned } = useCases();

  return (
    <section className="dash-card">
      <div className="activity__head">
        <h2 className="dash-card__title">Active Cases</h2>
        <Link className="activity__view-all" to="/assigned-queue">
          View all
          <img src={arrowRight} alt="" width="11.247" height="11.247" />
        </Link>
      </div>

      <div className="activity__list">
        {assigned.length === 0 && <p className="field-empty">No cases open — every one is closed.</p>}

        {assigned.map((item) => (
          <Link className="activity__row" to={`/assigned-queue/${item.id}`} key={item.id}>
            <span className="avatar avatar--green">{item.initials}</span>

            <span className="activity__body">
              <span className="activity__name-row">
                <span className="activity__name">{item.name}</span>
                <span
                  className={`priority-badge priority-badge--${PRIORITY_MODIFIER[item.priority]}`}
                >
                  {item.priority}
                </span>
              </span>
              <span className="activity__meta">{item.meta}</span>
            </span>

            <span className="status-badge status-badge--gov">{item.stage}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ActiveCases;
