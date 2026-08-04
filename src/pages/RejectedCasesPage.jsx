import { Link } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { PRIORITY_MODIFIER } from '../constants/dashboard.js';
import { findCase } from '../constants/caseDetail.js';
import { useCases } from '../context/CasesContext.jsx';
import exportIcon from '../assets/icons/agent2/list/export.svg';
import rejectedMark from '../assets/icons/application/decision-reject.svg';
import emptyCases from '../assets/icons/agent2/list/empty-cases.svg';

import '../styles/cases-list.css';

/* Cases the department turned down.

   The same screen as Completed Cases with the other outcome — see
   CompletedCasesPage.jsx. A rejected case closes the moment the agent records
   the ruling: there is no certificate to attach and nothing to complete. */
export function RejectedCasesPage() {
  const { rejected } = useCases();

  // TODO: generates the CSV once the reports endpoint exists.
  function handleExport() {
    console.info('export rejected cases', rejected.length);
  }

  const metaFor = (item) => {
    const record = findCase(item.id);
    if (!record) return item.meta;

    return `${record.id} · ${record.service} · ${record.department}`;
  };

  return (
    <DashboardLayout>
      <main className="cases-page">
        <div className="cases-page__head">
          <div>
            <h1 className="cases-page__title">Rejected Cases</h1>
            <p className="cases-page__count">{rejected.length} cases</p>
          </div>

          <button className="cases-page__export" type="button" onClick={handleExport}>
            <img src={exportIcon} alt="" width="13.12" height="13.12" />
            Export
          </button>
        </div>

        {rejected.length === 0 ? (
          <div className="cases-blank">
            <img src={emptyCases} alt="" width="44.999" height="44.999" />
            <p className="cases-blank__caption">No rejected cases yet</p>
          </div>
        ) : (
          <ul className="cases-list">
            {rejected.map((item) => (
              <li key={item.id}>
                <Link className="case-row" to={`/assigned-queue/${item.id}`}>
                  <span className="case-row__mark case-row__mark--rejected">
                    <img src={rejectedMark} alt="" width="18.749" height="18.749" />
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

                  <span className="status-badge status-badge--rejected">Rejected</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </DashboardLayout>
  );
}

export default RejectedCasesPage;
