import { useState } from 'react';
import { Link } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { ACKNOWLEDGEMENTS, ACK_STATES, isAckPending } from '../constants/acknowledgements.js';
import statUploaded from '../assets/icons/agent2/ack/stat-uploaded.svg';
import statPending from '../assets/icons/agent2/ack/stat-pending.svg';
import statReview from '../assets/icons/agent2/ack/stat-review.svg';
import uploadIcon from '../assets/icons/agent2/ack/upload.svg';
import viewIcon from '../assets/icons/agent2/case/doc-view.svg';

import '../styles/acknowledgements.css';

/* Every submission receipt the agent is holding, or still owes.

   The case screen collects one acknowledgement at a time as step 4 of a single
   case; this is the same receipt seen across every case at once, which is why
   the row's only action is to attach the file rather than to work the case. */
export function AcknowledgementsPage() {
  // Receipts attached this session, { [applicationId]: fileName }. In memory
  // only, the same as a closed case — see context/CasesContext.jsx.
  const [receipts, setReceipts] = useState({});

  const rows = ACKNOWLEDGEMENTS.map((item) =>
    receipts[item.id] ? { ...item, state: 'uploaded' } : item,
  );

  const count = (state) => rows.filter((row) => row.state === state).length;

  // Counted from the rows, so a tile can never claim a number the table denies.
  const stats = [
    { id: 'uploaded', tone: 'green', icon: statUploaded, label: 'Uploaded', value: count('uploaded') },
    { id: 'pending', tone: 'amber', icon: statPending, label: 'Pending Upload', value: count('pending') },
    { id: 'review', tone: 'blue', icon: statReview, label: 'Under Review', value: count('review') },
  ];

  // TODO: posts the receipt once the agent API exists; the row updates either way.
  function handleUpload(id, file) {
    if (!file) return;

    console.info('upload acknowledgement', id, file.name);
    setReceipts((current) => ({ ...current, [id]: file.name }));
  }

  return (
    <DashboardLayout>
      <main className="ack-page">
        <div className="ack-page__head">
          <h1 className="ack-page__title">Acknowledgements</h1>
          <p className="ack-page__lead">Government-issued submission receipts</p>
        </div>

        <div className="ack-stats">
          {stats.map((stat) => (
            <div className={`ack-stat ack-stat--${stat.tone}`} key={stat.id}>
              <div className="ack-stat__head">
                <span className="ack-stat__label">{stat.label}</span>
                <img src={stat.icon} alt="" width="14.992" height="14.992" />
              </div>
              <p className="ack-stat__value">{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="ack-table" aria-label="Acknowledgements">
          <div className="ack-table__head" role="row">
            <span role="columnheader">Application</span>
            <span role="columnheader">Customer</span>
            <span role="columnheader">Service</span>
            <span role="columnheader">Ref. Number</span>
            <span role="columnheader">Upload Status</span>
            <span role="columnheader">Action</span>
          </div>

          {rows.map((row) => {
            const status = ACK_STATES[row.state];

            return (
              <div className="ack-table__row" role="row" key={row.id}>
                <Link className="ack-cell ack-cell--id" to={`/assigned-queue/${row.id}`}>
                  {row.id}
                </Link>

                <span className="ack-cell ack-cell--customer">
                  <span className="avatar avatar--green">{row.initials}</span>
                  {row.customer}
                </span>

                <span className="ack-cell">{row.service}</span>

                <span className="ack-cell ack-cell--ref">{row.ref ?? '—'}</span>

                <span className="ack-cell">
                  <span className={`ack-pill ack-pill--${status.tone}`}>{status.label}</span>
                </span>

                <span className="ack-cell">
                  {/* A label rather than a button: the file picker is the action,
                      so there is nothing to click through to. */}
                  {isAckPending(row) ? (
                    <label className="ack-action ack-action--upload">
                      <input
                        className="ack-action__input"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(event) => handleUpload(row.id, event.target.files?.[0])}
                      />
                      <img src={uploadIcon} alt="" width="11.247" height="11.247" />
                      Upload
                    </label>
                  ) : (
                    // TODO: opens the stored receipt once the documents API exists.
                    <button
                      className="ack-action"
                      type="button"
                      onClick={() => console.info('view acknowledgement', row.id)}
                    >
                      <img src={viewIcon} alt="" width="11.247" height="11.247" />
                      View
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </section>
      </main>
    </DashboardLayout>
  );
}

export default AcknowledgementsPage;
