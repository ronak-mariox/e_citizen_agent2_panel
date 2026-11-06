import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { PRIORITY_MODIFIER } from '../constants/dashboard.js';
import * as queueApi from '../api/queue.js';
import { getErrorMessage } from '../api/client.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';
import refreshIcon from '../assets/icons/agent2/list/refresh.svg';
import searchIcon from '../assets/icons/agent2/list/search.svg';
import statTotal from '../assets/icons/agent2/list/stat-total.svg';
import statPending from '../assets/icons/agent2/list/stat-pending.svg';
import statProgress from '../assets/icons/agent2/list/stat-progress.svg';
import statDeadline from '../assets/icons/agent2/list/stat-deadline.svg';
import processIcon from '../assets/icons/agent2/list/process.svg';

import '../styles/gov-processing.css';

/* Everything Agent 1 has handed over that has not yet reached the
   acknowledgement step — the same desk AssignedQueuePage reads (backend
   `GET /agent2/applications`), narrowed to `acknowledged=false` (really:
   no government reference number saved yet) so a case moves on to the
   Acknowledgements tab the moment step 3 is done, whether or not its
   receipt has actually been uploaded — that is Acknowledgements' own "Pending"
   row to show, not this screen's. Laid out as a table an agent works from
   rather than a dashboard summary, which is why every row ends in Process
   rather than a link to a detail page. */

const PRIORITY_LABEL = { urgent: 'High', high: 'High', normal: 'Medium', low: 'Low' };

/* This list endpoint (toAdminApplication) carries the internal SLA clock
   pre-computed — `row.sla.remainingLabel` in the same "2d 4h left" /
   "Overdue" shape every other panel reads, and `row.effectivePriority`
   already escalated off it (see computeSlaStatus, application.service.js).
   Nothing here recomputes either. */

/* A deadline reads louder the closer it is — tied to the same escalation the
   priority badge already shows, rather than an independently-chosen day
   count: urgent reads red, high reads amber, everything else plain. */
const deadlineTone = (effectivePriority) => {
  if (effectivePriority === 'urgent') return ' gov-cell--urgent';
  if (effectivePriority === 'high') return ' gov-cell--soon';

  return '';
};

const initialsOf = (name) => {
  const trimmed = name?.trim();
  if (!trimmed) return '—';

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
};

const PAGE_SIZE = 100;

export function GovProcessingPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [reloadToken, setReloadToken] = useState(0);

  // A live refetch keeps the rows on screen and stays quiet if it fails.
  const silentRef = useRef(false);
  useLiveRefresh(() => {
    silentRef.current = true;
    setReloadToken((token) => token + 1);
  }, ['applications', 'wallet']);

  useEffect(() => {
    let cancelled = false;
    const silent = silentRef.current;
    silentRef.current = false;

    if (!silent) {
      setLoading(true);
      setLoadError(null);
    }

    queueApi
      .listMyCases({ limit: PAGE_SIZE, acknowledged: false })
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

  const enriched = rows.map((row) => ({
    ...row,
    name: row.citizen?.fullName ?? row.citizen?.mobile ?? 'Unknown',
  }));

  const departments = [...new Set(enriched.map((row) => row.department?.name).filter(Boolean))];

  const visible = enriched.filter((row) => {
    if (department !== 'all' && row.department?.name !== department) return false;

    const term = query.trim().toLowerCase();
    if (!term) return true;

    return [row.applicationNumber, row.name, row.service?.name, row.department?.name]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(term));
  });

  const stats = [
    { id: 'total', tone: 'slate', icon: statTotal, label: 'Total Assigned', value: enriched.length },
    {
      id: 'pending',
      tone: 'amber',
      icon: statPending,
      label: 'Pending',
      value: enriched.filter((row) => row.status === 'pending_submission').length,
    },
    {
      id: 'progress',
      tone: 'indigo',
      icon: statProgress,
      label: 'In Progress',
      value: enriched.filter((row) =>
        ['submitted_to_department', 'in_progress'].includes(row.status)
      ).length,
    },
    {
      id: 'deadline',
      tone: 'red',
      icon: statDeadline,
      label: 'SLA At Risk',
      value: enriched.filter((row) => ['high', 'urgent'].includes(row.effectivePriority)).length,
    },
  ];

  return (
    <DashboardLayout>
      <main className="gov-page">
        <div className="gov-page__head">
          <div>
            <h1 className="gov-page__title">Assigned Cases</h1>
            <p className="gov-page__lead">{enriched.length} applications from Agent 1</p>
          </div>

          <div className="gov-page__actions">
            <button
              className="gov-button"
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
            >
              <img src={refreshIcon} alt="" width="13.12" height="13.12" />
              Refresh
            </button>
          </div>
        </div>

        {loadError && (
          <p className="notice notice--error" role="alert">
            {loadError}
          </p>
        )}

        <div className="gov-stats">
          {stats.map((stat) => (
            <div className={`gov-stat gov-stat--${stat.tone}`} key={stat.id}>
              <div className="gov-stat__head">
                <span className="gov-stat__label">{stat.label}</span>
                <img src={stat.icon} alt="" width="14.992" height="14.992" />
              </div>
              <p className="gov-stat__value">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="gov-toolbar">
          <span className="gov-search">
            <img src={searchIcon} alt="" width="13.12" height="13.12" />
            <input
              type="search"
              value={query}
              placeholder="Search by case ID or citizen name"
              aria-label="Search cases"
              onChange={(event) => setQuery(event.target.value)}
            />
          </span>

          <select
            className="gov-filter"
            value={department}
            aria-label="Filter by department"
            onChange={(event) => setDepartment(event.target.value)}
          >
            <option value="all">All departments</option>
            {departments.map((name) => (
              <option value={name} key={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <section className="gov-table" aria-label="Assigned cases">
          <div className="gov-table__head" role="row">
            <span role="columnheader">Application ID</span>
            <span role="columnheader">Customer</span>
            <span role="columnheader">Department</span>
            <span role="columnheader">Service</span>
            <span role="columnheader">Priority</span>
            <span role="columnheader">Deadline</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Action</span>
          </div>

          {loading && <p className="gov-empty">Loading…</p>}

          {!loading &&
            visible.map((row) => {
              const priority = PRIORITY_LABEL[row.effectivePriority ?? row.priority] ?? 'Medium';

              return (
                <div className="gov-table__row" role="row" key={row.id}>
                  <span className="gov-cell gov-cell--id">{row.applicationNumber}</span>

                  <span className="gov-cell gov-cell--customer">
                    <span className="avatar avatar--green">{initialsOf(row.name)}</span>
                    {row.name}
                  </span>

                  <span className="gov-cell gov-cell--muted">{row.department?.name ?? '—'}</span>
                  <span className="gov-cell">{row.service?.name ?? '—'}</span>

                  <span className="gov-cell">
                    <span className={`priority-badge priority-badge--${PRIORITY_MODIFIER[priority]}`}>
                      {priority}
                    </span>
                  </span>

                  <span className={`gov-cell gov-cell--muted${deadlineTone(row.effectivePriority)}`}>
                    {row.sla?.remainingLabel ?? '—'}
                  </span>

                  <span className="gov-cell">
                    <span className="status-badge status-badge--gov">
                      {row.status?.replace(/_/g, ' ') ?? '—'}
                    </span>
                  </span>

                  <span className="gov-cell">
                    <Link className="gov-process" to={`/assigned-queue/${row.id}`}>
                      <img src={processIcon} alt="" width="11.247" height="11.247" />
                      Process
                    </Link>
                  </span>
                </div>
              );
            })}

          {!loading && visible.length === 0 && (
            <p className="gov-empty">
              {enriched.length === 0
                ? 'Nothing left to process — every case is closed.'
                : 'No case matches that search.'}
            </p>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}

export default GovProcessingPage;
