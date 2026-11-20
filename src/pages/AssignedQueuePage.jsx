import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import searchIcon from '../assets/icons/dashboard/search.svg';
import refreshIcon from '../assets/icons/agent2/list/refresh.svg';
import exportIcon from '../assets/icons/agent2/list/export.svg';
import * as queueApi from '../api/queue.js';
import { getErrorMessage } from '../api/client.js';
import { downloadCsv, todayStamp } from '../utils/exportCsv.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';

/* The API's four priorities into the three pills this stylesheet has — `urgent`
   and `high` share the red one, because both mean "before the others" and a
   fourth shade nobody can rank at a glance would say less than three. */
const PRIORITY_PILL = {
  urgent: { label: 'Urgent', tone: 'high' },
  high: { label: 'High', tone: 'high' },
  normal: { label: 'Normal', tone: 'medium' },
  low: { label: 'Low', tone: 'low' },
};

const PRIORITY_TONE = { High: 'high', Medium: 'medium', Low: 'low' };

/* Every case on this panel is waiting to be carried to a counter, so the one
   stage in play reads as pending. */
const STAGE_TONE = {
  'Pending Submission': 'pending',
  'Gov. Processing': 'started',
  'Awaiting Decision': 'waiting',
};

/* Where a case has got to, as this panel's Status column words it. Agent 1
   forwards it at `pending_submission`; the rest are Agent 2's own workflow,
   which is not built yet but whose statuses the API already models. */
const STAGE_OF = {
  pending_submission: 'Pending Submission',
  submitted_to_department: 'Gov. Processing',
  in_progress: 'Gov. Processing',
  escalated: 'Awaiting Decision',
  on_hold: 'Awaiting Decision',
};

/** One row of the exported CSV — reads straight off the same row objects the
    table renders from, so a column here can carry anything the API already
    returned, not only what the table shows (see api/queue.js's listMyCases). */
const EXPORT_COLUMNS = [
  { label: 'Application Number', value: (row) => row.applicationNumber },
  { label: 'Reference Number', value: (row) => row.referenceNumber },
  { label: 'Citizen Name', value: (row) => row.citizen?.fullName ?? '' },
  { label: 'Citizen Mobile', value: (row) => row.citizen?.mobile ?? '' },
  { label: 'Service', value: (row) => row.service?.name ?? '' },
  { label: 'Department', value: (row) => row.department?.name ?? '' },
  { label: 'Priority', value: (row) => row.effectivePriority ?? row.priority },
  { label: 'Status', value: (row) => STAGE_OF[row.status] ?? row.status },
  { label: 'SLA Remaining', value: (row) => row.sla?.remainingLabel ?? '' },
  { label: 'Assigned At', value: (row) => row.assignedAt ?? '' },
  { label: 'Submitted At', value: (row) => row.submittedAt ?? '' },
];

/** "KR" — the avatar beside a customer's name. */
const initialsOf = (name, fallback = '—') => {
  const trimmed = name?.trim();

  if (!trimmed) return fallback;

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
};

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

function AssignedQueuePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

  // A live refetch keeps the rows on screen and stays quiet if it fails.
  const silentRef = useRef(false);
  useLiveRefresh(() => {
    silentRef.current = true;
    reload();
  }, ['applications', 'wallet']);

  const [exporting, setExporting] = useState(false);

  /* Each keystroke would otherwise be a round trip, and the answer to "raj" is
     thrown away the moment "rajesh" is typed. */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const silent = silentRef.current;
    silentRef.current = false;

    // The spinner has to appear when the request starts, not when it finishes.
    if (!silent) {
      setLoading(true);
      setLoadError(null);
    }

    queueApi
      .listMyCases({ limit: PAGE_SIZE, search: debouncedQuery })
      .then((data) => {
        if (cancelled) return;

        setRows(data.applications);
        setCounts(data.summary);
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled || silent) return;

        setLoadError(getErrorMessage(error));
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    /* Guards against a slower earlier request landing after a newer one — an
       agent typing quickly would otherwise see results for a search they had
       already moved on from. */
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, reloadToken]);

  /* From the counts the API sends rather than the rows on screen: the table is
     paged and searchable, and a tile counted from it would drop every time a
     search narrowed the list. */
  const summary = [
    {
      id: 'total',
      tone: 'blue',
      title: 'Total Assigned',
      value: counts?.totalAssigned ?? 0,
      note: 'All queued',
    },
    {
      id: 'high-priority',
      tone: 'red',
      title: 'High Priority',
      value: rows.filter((row) => ['high', 'urgent'].includes(row.effectivePriority ?? row.priority))
        .length,
      note: 'Urgent action needed',
    },
    {
      id: 'pending-submission',
      tone: 'amber',
      title: 'Pending Submission',
      value: counts?.awaitingSubmission ?? 0,
      note: 'Not yet at a counter',
    },
  ];

  const openCase = (id) => navigate(`/assigned-queue/${id}`);

  /* The table only ever shows one page of PAGE_SIZE rows, so exporting `rows`
     as loaded would silently cut off anyone with more assigned than that. A
     fresh fetch at the backend's own cap (100 — see MAX_LIMIT,
     utils/pagination.js) with whatever search is active is what "export this
     list" actually has to mean. */
  async function handleExport() {
    setExporting(true);
    setLoadError(null);

    try {
      const data = await queueApi.listMyCases({ limit: 100, search: debouncedQuery });
      downloadCsv(`assigned-queue-${todayStamp()}.csv`, EXPORT_COLUMNS, data.applications);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  return (
    <DashboardLayout>
      <main className="queue-page">
        <section className="queue-page__header">
          <div>
            <h1 className="queue-page__title">Assigned Queue</h1>
            <p className="queue-page__subtitle">
              {loading && !counts
                ? 'Loading your cases…'
                : `${counts?.totalAssigned ?? 0} ${
                    (counts?.totalAssigned ?? 0) === 1 ? 'case' : 'cases'
                  } pending your action`}
            </p>
          </div>

          <button className="queue-page__filter" type="button">
            <span className="queue-page__filter-icon" aria-hidden="true">
              ☰
            </span>
            Filter
          </button>
        </section>

        <section className="queue-stats" aria-label="Queue summary">
          {summary.map((card) => (
            <article key={card.id} className={`queue-stat queue-stat--${card.tone}`}>
              <div className="queue-stat__top">
                <p className="queue-stat__label">{card.title}</p>
                <span className="queue-stat__icon" aria-hidden="true">
                  •
                </span>
              </div>
              <p className="queue-stat__value">{card.value}</p>
              <p className="queue-stat__foot">{card.note}</p>
            </article>
          ))}
        </section>

        <section className="queue-toolbar" aria-label="Queue controls">
          <label className="queue-search" htmlFor="queue-search">
            <img src={searchIcon} alt="" width="13.12" height="13.12" />
            <input
              id="queue-search"
              type="search"
              placeholder="Search by case ID or citizen name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <button
            className="queue-toolbar__button"
            type="button"
            disabled={exporting}
            onClick={handleExport}
          >
            <img src={exportIcon} alt="" width="13.12" height="13.12" />
            {exporting ? 'Exporting…' : 'Export'}
          </button>

          <button
            className="queue-toolbar__button queue-toolbar__button--muted"
            type="button"
            disabled={loading}
            onClick={reload}
          >
            <img src={refreshIcon} alt="" width="13.12" height="13.12" />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </section>

        <section className="table-shell" aria-label="Assigned queue table">
          <div className="queue-table__overflow">
            <div className="queue-table" role="table">
              <div className="queue-table__header" role="row">
                <div role="columnheader">Application ID</div>
                <div role="columnheader">Customer</div>
                <div role="columnheader">Department</div>
                <div role="columnheader">Service</div>
                <div role="columnheader">Priority</div>
                <div role="columnheader">Status</div>
                <div role="columnheader">Deadline</div>
                <div role="columnheader">Action</div>
              </div>

              {rows.map((row) => {
                const effectivePriority = row.effectivePriority ?? row.priority;
                const priority = PRIORITY_PILL[effectivePriority] ?? {
                  label: effectivePriority,
                  tone: 'low',
                };
                const stage = STAGE_OF[row.status] ?? 'Pending Submission';
                /* A customer who has not filled in their profile has no name
                   anywhere, and their mobile is who they are — a blank cell
                   would read as missing data rather than an unfinished
                   profile. */
                const name = row.citizen?.fullName ?? row.citizen?.mobile ?? 'Unknown';

                return (
                <div
                  className="queue-table__row cursor-pointer"
                  role="row"
                  key={row.id}
                  onClick={() => openCase(row.id)}
                >
                  <div className="queue-table__cell queue-table__id" role="cell">
                    {row.applicationNumber}
                  </div>

                  <div className="queue-table__cell" role="cell">
                    <div className="queue-table__customer">
                      <span className="avatar" aria-hidden="true">
                        {initialsOf(row.citizen?.fullName)}
                      </span>
                      <span className="queue-table__name">{name}</span>
                    </div>
                  </div>

                  <div className="queue-table__cell queue-meta" role="cell">
                    {row.department?.name ?? '—'}
                  </div>

                  <div className="queue-table__cell queue-table__service" role="cell">
                    {row.service?.name ?? '—'}
                  </div>

                  <div className="queue-table__cell" role="cell">
                    <span className={`queue-pill queue-pill--${priority.tone}`}>
                      {priority.label}
                    </span>
                  </div>

                  <div className="queue-table__cell" role="cell">
                    <span className={`queue-pill queue-pill--${STAGE_TONE[stage] ?? 'pending'}`}>
                      <span className="queue-pill__dot" aria-hidden="true" />
                      {stage}
                    </span>
                  </div>

                  <div className="queue-table__cell queue-table__time" role="cell">
                    {row.sla?.remainingLabel ?? '—'}
                  </div>

                  <div className="queue-table__cell" role="cell">
                    <button
                      className="queue-action"
                      type="button"
                      onClick={(event) => {
                        // The row already opens the case; without this the click
                        // would run the row handler a second time.
                        event.stopPropagation();
                        openCase(row.id);
                      }}
                    >
                      Review
                    </button>
                  </div>
                </div>
                );
              })}

              {/* Still loading, the request failed, and a genuinely empty desk
                  say three different things. */}
              {loading && rows.length === 0 && (
                <p className="queue-empty">Loading your cases…</p>
              )}

              {!loading && loadError && (
                <p className="queue-empty queue-empty--error" role="alert">
                  {loadError}
                  <button className="queue-action" type="button" onClick={reload}>
                    Try again
                  </button>
                </p>
              )}

              {!loading && !loadError && rows.length === 0 && (
                <p className="queue-empty">
                  {debouncedQuery
                    ? 'No case on your desk matches that search.'
                    : 'Nothing assigned to you yet. Cases arrive here once Agent 1 has verified them.'}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

export default AssignedQueuePage;
