import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import searchIcon from '../assets/icons/dashboard/search.svg';
import refreshIcon from '../assets/icons/dashboard/refresh.svg';
import { findCase } from '../constants/caseDetail.js';
import { useCases } from '../context/CasesContext.jsx';

const PRIORITY_TONE = { High: 'high', Medium: 'medium', Low: 'low' };

/* Every case on this panel is waiting to be carried to a counter, so the one
   stage in play reads as pending. */
const STAGE_TONE = {
  'Pending Submission': 'pending',
  'Gov. Processing': 'started',
  'Awaiting Decision': 'waiting',
};

function AssignedQueuePage() {
  const navigate = useNavigate();
  const { assigned } = useCases();
  const [query, setQuery] = useState('');

  /* Rows are the cases this agent still holds, joined to the record the case
     screen opens — so a row can never point at a case that has no page, and a
     case closed on that screen leaves the queue with it. */
  const cases = assigned
    .map((item) => ({ ...item, ...findCase(item.id) }))
    .filter((item) => item.department);

  const term = query.trim().toLowerCase();
  const rows = term
    ? cases.filter((row) =>
        [row.id, row.name, row.department, row.service].some((field) =>
          field.toLowerCase().includes(term)
        )
      )
    : cases;

  // Counted from the cases, so a tile can never claim a number the table denies.
  const summary = [
    { id: 'total', tone: 'blue', title: 'Total Assigned', value: cases.length, note: 'All queued' },
    {
      id: 'high-priority',
      tone: 'red',
      title: 'High Priority',
      value: cases.filter((row) => row.priority === 'High').length,
      note: 'Urgent action needed',
    },
    {
      id: 'pending-submission',
      tone: 'amber',
      title: 'Pending Submission',
      value: cases.filter((row) => row.stage === 'Pending Submission').length,
      note: 'Not yet at a counter',
    },
  ];

  const openCase = (id) => navigate(`/assigned-queue/${id}`);

  return (
    <DashboardLayout>
      <main className="queue-page">
        <section className="queue-page__header">
          <div>
            <h1 className="queue-page__title">Assigned Queue</h1>
            <p className="queue-page__subtitle">
              {cases.length} {cases.length === 1 ? 'case' : 'cases'} pending your action
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

          <button className="queue-toolbar__button" type="button">
            Export
          </button>

          <button className="queue-toolbar__button queue-toolbar__button--muted" type="button">
            <img src={refreshIcon} alt="" width="13.12" height="13.12" />
            Refresh
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

              {rows.map((row) => (
                <div
                  className="queue-table__row cursor-pointer"
                  role="row"
                  key={row.id}
                  onClick={() => openCase(row.id)}
                >
                  <div className="queue-table__cell queue-table__id" role="cell">
                    {row.id}
                  </div>

                  <div className="queue-table__cell" role="cell">
                    <div className="queue-table__customer">
                      <span className="avatar" aria-hidden="true">
                        {row.initials}
                      </span>
                      <span className="queue-table__name">{row.name}</span>
                    </div>
                  </div>

                  <div className="queue-table__cell queue-meta" role="cell">
                    {row.department}
                  </div>

                  <div className="queue-table__cell queue-table__service" role="cell">
                    {row.service}
                  </div>

                  <div className="queue-table__cell" role="cell">
                    <span className={`queue-pill queue-pill--${PRIORITY_TONE[row.priority]}`}>
                      {row.priority}
                    </span>
                  </div>

                  <div className="queue-table__cell" role="cell">
                    <span className={`queue-pill queue-pill--${STAGE_TONE[row.stage] ?? 'pending'}`}>
                      <span className="queue-pill__dot" aria-hidden="true" />
                      {row.stage}
                    </span>
                  </div>

                  <div className="queue-table__cell queue-table__time" role="cell">
                    {row.deadline}
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
              ))}
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

export default AssignedQueuePage;
