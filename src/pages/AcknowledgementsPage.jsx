import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { ACK_STATES } from '../constants/acknowledgements.js';
import * as acknowledgementsApi from '../api/acknowledgements.js';
import * as caseApi from '../api/case.js';
import { getErrorMessage } from '../api/client.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';
import { assetUrl } from '../utils/format.js';
import statUploaded from '../assets/icons/agent2/ack/stat-uploaded.svg';
import statPending from '../assets/icons/agent2/ack/stat-pending.svg';
import statReview from '../assets/icons/agent2/ack/stat-review.svg';
import uploadIcon from '../assets/icons/agent2/ack/upload.svg';
import viewIcon from '../assets/icons/agent2/case/doc-view.svg';

import '../styles/acknowledgements.css';

/* Every case that has reached the acknowledgement step — backend `GET
   /agent2/acknowledgements`, which returns a case the moment its government
   reference number is saved (the end of step 3), whether or not the receipt
   itself has been uploaded yet. Before that, a case is still Gov.
   Processing's to show instead (see GovProcessingPage's own
   `acknowledged=false`).

   Uploading works from either place: this table's own "Upload" action for a
   Pending row, or the case screen's step 4 — both post to the same endpoint
   (api/case.js's uploadAcknowledgement), so either one moves the case on to
   step 5 identically. */

// The backend caps `limit` at 100 (utils/pagination.js MAX_LIMIT).
const PAGE_SIZE = 100;

export function AcknowledgementsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // A live refetch that fails keeps what is on screen without an error.
  const silentRef = useRef(false);
  useLiveRefresh(() => {
    silentRef.current = true;
    setReloadToken((token) => token + 1);
  }, ['applications', 'wallet']);

  useEffect(() => {
    let cancelled = false;
    const silent = silentRef.current;
    silentRef.current = false;

    acknowledgementsApi
      .listAcknowledgements({ limit: PAGE_SIZE })
      .then((data) => {
        if (!cancelled) setRows(data.acknowledgements);
      })
      .catch((error) => {
        if (!cancelled && !silent) setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const count = (state) => rows.filter((row) => row.state === state).length;

  // Counted from the rows, so a tile can never claim a number the table denies.
  const stats = [
    { id: 'uploaded', tone: 'green', icon: statUploaded, label: 'Uploaded', value: count('uploaded') },
    { id: 'pending', tone: 'amber', icon: statPending, label: 'Pending Upload', value: count('pending') },
    { id: 'review', tone: 'blue', icon: statReview, label: 'Under Review', value: count('review') },
  ];

  async function handleUpload(id, file) {
    if (!file) return;

    setUploadingId(id);
    setLoadError(null);

    try {
      await caseApi.uploadAcknowledgement(id, file);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <DashboardLayout>
      <main className="ack-page">
        <div className="ack-page__head">
          <h1 className="ack-page__title">Acknowledgements</h1>
          <p className="ack-page__lead">Government-issued submission receipts</p>
        </div>

        {loadError && (
          <p className="notice notice--error" role="alert">
            {loadError}
          </p>
        )}

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

          {loading && <p className="ack-empty">Loading…</p>}

          {!loading &&
            rows.map((row) => {
              const status = ACK_STATES[row.state];

              return (
                <div className="ack-table__row" role="row" key={row.id}>
                  <Link className="ack-cell ack-cell--id" to={`/assigned-queue/${row.id}`}>
                    {row.applicationNumber}
                  </Link>

                  <span className="ack-cell ack-cell--customer">
                    <span className="avatar avatar--green">
                      {(row.citizenName ?? '—').slice(0, 2).toUpperCase()}
                    </span>
                    {row.citizenName ?? 'Unknown'}
                  </span>

                  <span className="ack-cell">{row.service ?? '—'}</span>

                  <span className="ack-cell ack-cell--ref">{row.referenceNumber ?? '—'}</span>

                  <span className="ack-cell">
                    <span className={`ack-pill ack-pill--${status.tone}`}>{status.label}</span>
                  </span>

                  <span className="ack-cell">
                    {/* A label rather than a button: the file picker is the action,
                        so there is nothing to click through to. */}
                    {row.state === 'pending' ? (
                      <label className="ack-action ack-action--upload">
                        <input
                          className="ack-action__input"
                          type="file"
                          accept="image/*,.pdf"
                          disabled={uploadingId === row.id}
                          onChange={(event) => handleUpload(row.id, event.target.files?.[0])}
                        />
                        <img src={uploadIcon} alt="" width="11.247" height="11.247" />
                        {uploadingId === row.id ? 'Uploading…' : 'Upload'}
                      </label>
                    ) : (
                      <a
                        className="ack-action"
                        href={row.fileUrl ? assetUrl(row.fileUrl) : '#'}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img src={viewIcon} alt="" width="11.247" height="11.247" />
                        View
                      </a>
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
