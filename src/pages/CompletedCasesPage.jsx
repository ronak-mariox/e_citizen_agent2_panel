import { Link } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { PRIORITY_MODIFIER } from '../constants/dashboard.js';
import { findCase } from '../constants/caseDetail.js';
import { useCases } from '../context/CasesContext.jsx';
import exportIcon from '../assets/icons/agent2/list/export.svg';
import completedCheck from '../assets/icons/agent2/list/completed-check.svg';
import emptyCases from '../assets/icons/agent2/list/empty-cases.svg';

import '../styles/cases-list.css';

/* Cases the department approved and the agent has closed.

   A case lands here the moment Complete Case is confirmed on the case screen;
   until then it is still in the assigned queue. Rejected ones are held too —
   see context/CasesContext.jsx — for the Rejected Cases tab. */
export function CompletedCasesPage() {
  const { completed } = useCases();

  // The row carries the department as well as the service, which the dashboard
  // summary line leaves off — so it is rebuilt from the case record.
  const metaFor = (item) => {
    const record = findCase(item.id);
    if (!record) return item.meta;

    return `${record.id} · ${record.service} · ${record.department}`;
  };

  // TODO: generates the CSV once the reports endpoint exists.
  function handleExport() {
    console.info('export completed cases', completed.length);
  }

  return (
    <DashboardLayout>
      <main className="cases-page">
        <div className="cases-page__head">
          <div>
            <h1 className="cases-page__title">Completed Cases</h1>
            <p className="cases-page__count">{completed.length} cases</p>
          </div>

          <button className="cases-page__export" type="button" onClick={handleExport}>
            <img src={exportIcon} alt="" width="13.12" height="13.12" />
            Export
          </button>
        </div>

        {completed.length === 0 ? (
          <div className="cases-blank">
            <img src={emptyCases} alt="" width="44.999" height="44.999" />
            <p className="cases-blank__caption">No completed cases yet</p>
          </div>
        ) : (
          <ul className="cases-list">
            {completed.map((item) => (
              <li key={item.id}>
                <Link className="case-row" to={`/assigned-queue/${item.id}`}>
                  <span className="case-row__mark">
                    <img src={completedCheck} alt="" width="18.749" height="18.749" />
                  </span>

                  <span className="case-row__body">
                    <span className="case-row__title">
                      <span className="case-row__name">{item.name}</span>
                      <span
                        className={`priority-badge priority-badge--${PRIORITY_MODIFIER[item.priority]}`}
                      >
                        {item.priority}
                      </span>
                    </span>
                    <span className="case-row__meta">{metaFor(item)}</span>
                  </span>

                  <span className="status-badge status-badge--completed">Completed</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </DashboardLayout>
  );
}

export default CompletedCasesPage;
