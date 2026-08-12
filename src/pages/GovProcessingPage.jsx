import { useState } from 'react';
import { Link } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { PRIORITY_MODIFIER } from '../constants/dashboard.js';
import { findCase } from '../constants/caseDetail.js';
import { useCases } from '../context/CasesContext.jsx';
import refreshIcon from '../assets/icons/agent2/list/refresh.svg';
import searchIcon from '../assets/icons/agent2/list/search.svg';
import statTotal from '../assets/icons/agent2/list/stat-total.svg';
import statPending from '../assets/icons/agent2/list/stat-pending.svg';
import statProgress from '../assets/icons/agent2/list/stat-progress.svg';
import statDeadline from '../assets/icons/agent2/list/stat-deadline.svg';
import processIcon from '../assets/icons/agent2/list/process.svg';

import '../styles/gov-processing.css';

/* Everything Agent 1 has handed over, as one worklist.

   The dashboard shows the same cases as a summary; this is the screen an agent
   actually works from, which is why every row ends in Process rather than in a
   link to a detail page. */

/** "08 Jul 2024 (6 days left)" -> 6. The label is the only place it is held. */
const daysLeft = (record) => {
  const match = /\((\d+)\s+days?\s+left\)/.exec(record?.deadlineLabel ?? '');
  return match ? Number(match[1]) : null;
};

/* A deadline reads louder the closer it is: red inside three days, amber inside
   five, plain otherwise. */
const deadlineTone = (days) => {
  if (days == null) return '';
  if (days <= 3) return ' gov-cell--urgent';
  if (days <= 5) return ' gov-cell--soon';

  return '';
};

export function GovProcessingPage() {
  const { assigned } = useCases();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');

  const rows = assigned.map((item) => {
    const record = findCase(item.id);

    return { ...item, record, days: daysLeft(record) };
  });

  const departments = [...new Set(rows.map((row) => row.record?.department).filter(Boolean))];

  const visible = rows.filter((row) => {
    if (department !== 'all' && row.record?.department !== department) return false;

    const term = query.trim().toLowerCase();
    if (!term) return true;

    return [row.id, row.name, row.record?.service, row.record?.department]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(term));
  });

  // Counted from the rows, so a tile can never claim a number the table denies.
  const stats = [
    { id: 'total', tone: 'slate', icon: statTotal, label: 'Total Assigned', value: rows.length },
    { id: 'pending', tone: 'amber', icon: statPending, label: 'Pending', value: rows.length },
    { id: 'progress', tone: 'indigo', icon: statProgress, label: 'In Progress', value: 0 },
    {
      id: 'deadline',
      tone: 'red',
      icon: statDeadline,
      label: 'Deadline ≤ 3 Days',
      value: rows.filter((row) => row.days != null && row.days <= 3).length,
    },
  ];

  return (
    <DashboardLayout>
      <main className="gov-page">
        <div className="gov-page__head">
          <div>
            <h1 className="gov-page__title">Assigned Cases</h1>
            <p className="gov-page__lead">{rows.length} applications from Agent 1</p>
          </div>

          <div className="gov-page__actions">
            <button className="gov-button" type="button" onClick={() => console.info('refresh')}>
              <img src={refreshIcon} alt="" width="13.12" height="13.12" />
              Refresh
            </button>
          </div>
        </div>

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

          {visible.map((row) => (
            <div className="gov-table__row" role="row" key={row.id}>
              <span className="gov-cell gov-cell--id">{row.id}</span>

              <span className="gov-cell gov-cell--customer">
                <span className="avatar avatar--green">{row.initials}</span>
                {row.name}
              </span>

              <span className="gov-cell gov-cell--muted">{row.record?.department}</span>
              <span className="gov-cell">{row.record?.service}</span>

              <span className="gov-cell">
                <span className={`priority-badge priority-badge--${PRIORITY_MODIFIER[row.priority]}`}>
                  {row.priority}
                </span>
              </span>

              <span className={`gov-cell gov-cell--muted${deadlineTone(row.days)}`}>
                {row.record?.deadline}
                {row.days != null && ` (${row.days}d)`}
              </span>

              <span className="gov-cell">
                <span className="status-badge status-badge--gov">{row.stage}</span>
              </span>

              <span className="gov-cell">
                <Link className="gov-process" to={`/assigned-queue/${row.id}`}>
                  <img src={processIcon} alt="" width="11.247" height="11.247" />
                  Process
                </Link>
              </span>
            </div>
          ))}

          {visible.length === 0 && (
            <p className="gov-empty">
              {rows.length === 0
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
