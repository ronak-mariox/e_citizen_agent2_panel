import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { PRIORITY_MODIFIER } from '../constants/dashboard.js';
import * as queueApi from '../api/queue.js';
import { getErrorMessage } from '../api/client.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';
import { downloadCsv, todayStamp } from '../utils/exportCsv.js';
import exportIcon from '../assets/icons/agent2/list/export.svg';
import completedCheck from '../assets/icons/agent2/list/completed-check.svg';
import emptyCases from '../assets/icons/agent2/list/empty-cases.svg';

import '../styles/cases-list.css';

/* Cases the department approved and the agent has closed — the same desk as
   Assigned Cases, narrowed to `status=completed` (backend
   src/services/application.service.js's listAgent2Queue: a caller-supplied
   status replaces the active-work default entirely, which is what lets this
   screen and Rejected Cases read the same endpoint for the other outcome). */

/* The API's four priorities into the three this badge has — see
   AssignedQueuePage's own note on the same fold. */
const PRIORITY_LABEL = { urgent: 'High', high: 'High', normal: 'Medium', low: 'Low' };

// The backend's own cap (MAX_LIMIT, utils/pagination.js) — this screen has no
// pagination UI of its own, so whatever it fetches is the whole list an agent
// sees, and Export has to read the same rows rather than a separate fetch.
const PAGE_SIZE = 100;

/** One row of the exported CSV — reads straight off the same row objects the
    list renders from (see api/queue.js's listMyCases). */
const EXPORT_COLUMNS = [
  { label: 'Application Number', value: (row) => row.applicationNumber },
  { label: 'Reference Number', value: (row) => row.referenceNumber },
  { label: 'Citizen Name', value: (row) => row.citizen?.fullName ?? '' },
  { label: 'Citizen Mobile', value: (row) => row.citizen?.mobile ?? '' },
  { label: 'Service', value: (row) => row.service?.name ?? '' },
  { label: 'Department', value: (row) => row.department?.name ?? '' },
  { label: 'Priority', value: (row) => PRIORITY_LABEL[row.priority] ?? row.priority },
  { label: 'Total Amount', value: (row) => (row.totalAmount ?? 0) / 100 },
  { label: 'Paid', value: (row) => (row.isPaid ? 'Yes' : 'No') },
  { label: 'Completed At', value: (row) => row.completedAt ?? '' },
];

export function CompletedCasesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Bumped by live updates; such a refetch keeps the list and stays quiet if it fails.
  const [reloadToken, setReloadToken] = useState(0);
  const silentRef = useRef(false);
  useLiveRefresh(() => {
    silentRef.current = true;
    setReloadToken((token) => token + 1);
  }, ['applications', 'wallet']);

  useEffect(() => {
    let cancelled = false;
    const silent = silentRef.current;
    silentRef.current = false;

    queueApi
      .listMyCases({ status: 'completed', limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setRows(data.applications);
        setLoadError(null);
      })
      .catch((error) => {
        if (!cancelled && !silent) {
          setLoadError(getErrorMessage(error));
          setRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  function handleExport() {
    downloadCsv(`completed-cases-${todayStamp()}.csv`, EXPORT_COLUMNS, rows);
  }

  return (
    <DashboardLayout>
      <main className="cases-page">
        <div className="cases-page__head">
          <div>
            <h1 className="cases-page__title">Completed Cases</h1>
            <p className="cases-page__count">
              {loading ? 'Loading…' : `${rows.length} case${rows.length === 1 ? '' : 's'}`}
            </p>
          </div>

          <button className="cases-page__export" type="button" onClick={handleExport}>
            <img src={exportIcon} alt="" width="13.12" height="13.12" />
            Export
          </button>
        </div>

        {loadError && (
          <p className="notice notice--error" role="alert">
            {loadError}
          </p>
        )}

        {!loading && rows.length === 0 ? (
          <div className="cases-blank">
            <img src={emptyCases} alt="" width="44.999" height="44.999" />
            <p className="cases-blank__caption">No completed cases yet</p>
          </div>
        ) : (
          <ul className="cases-list">
            {rows.map((row) => {
              const name = row.citizen?.fullName ?? row.citizen?.mobile ?? 'Unknown';
              const priority = PRIORITY_LABEL[row.priority] ?? 'Medium';

              return (
                <li key={row.id}>
                  <Link className="case-row" to={`/assigned-queue/${row.id}`}>
                    <span className="case-row__mark">
                      <img src={completedCheck} alt="" width="18.749" height="18.749" />
                    </span>

                    <span className="case-row__body">
                      <span className="case-row__title">
                        <span className="case-row__name">{name}</span>
                        <span className={`priority-badge priority-badge--${PRIORITY_MODIFIER[priority]}`}>
                          {priority}
                        </span>
                      </span>
                      <span className="case-row__meta">
                        {row.applicationNumber} · {row.service?.name ?? '—'} · {row.department?.name ?? '—'}
                      </span>
                    </span>

                    <span className="status-badge status-badge--completed">Completed</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </DashboardLayout>
  );
}

export default CompletedCasesPage;
