import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { NOTIFICATION_TYPES } from '../constants/notifications.js';
import * as notificationsApi from '../api/notifications.js';
import { getErrorMessage } from '../api/client.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';
import typeAssignment from '../assets/icons/agent2/notifications/type-assignment.svg';
import typeVerification from '../assets/icons/agent2/notifications/type-verification.svg';
import typeCustomer from '../assets/icons/agent2/notifications/type-customer.svg';
import typeSla from '../assets/icons/agent2/notifications/type-sla.svg';
import typeSystem from '../assets/icons/agent2/notifications/type-system.svg';
import '../styles/notifications.css';

/* The notification centre — backend `GET /notifications`, shared by every
   account type (src/routes/notification.routes.js). This panel's own filter
   chips (constants/notifications.js NOTIFICATION_TYPES) are the five types an
   Agent 2 actually receives; anything else still renders, under a plain
   System-styled badge rather than a hole. */

const TYPE_ICON = {
  assignment: typeAssignment,
  verification: typeVerification,
  customer: typeCustomer,
  sla: typeSla,
  system: typeSystem,
};

const TYPE_BY_ID = Object.fromEntries(NOTIFICATION_TYPES.map((type) => [type.id, type]));
const FALLBACK_TYPE = { label: 'Notification', tone: 'system' };

/** "5m ago" — the API sends the raw timestamp; the panel is what turns it
    into a relative age, since that age keeps moving while the page is open. */
function timeAgo(value) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const PAGE_SIZE = 100;

export function NotificationsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [unread, setUnread] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Bumped by live updates; a failed refetch keeps the list without an error.
  const [reloadToken, setReloadToken] = useState(0);
  const silentRef = useRef(false);
  useLiveRefresh(() => {
    silentRef.current = true;
    setReloadToken((token) => token + 1);
  }, ['notifications']);

  useEffect(() => {
    let cancelled = false;
    const silent = silentRef.current;
    silentRef.current = false;

    notificationsApi
      .listNotifications({ limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;

        setRows(data.notifications);
        setUnread(data.unread);
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

  const visible = filter === 'all' ? rows : rows.filter((row) => row.type === filter);

  async function markAllRead() {
    try {
      const counts = await notificationsApi.markAllRead();
      setUnread(counts);
      setRows((current) => current.map((row) => ({ ...row, unread: false })));
    } catch (error) {
      setLoadError(getErrorMessage(error));
    }
  }

  async function openRow(row) {
    if (row.unread) {
      try {
        const counts = await notificationsApi.markRead(row.id);
        setUnread(counts);
        setRows((current) =>
          current.map((one) => (one.id === row.id ? { ...one, unread: false } : one))
        );
      } catch (error) {
        setLoadError(getErrorMessage(error));
      }
    }

    if (row.link) navigate(row.link);
  }

  return (
    <DashboardLayout>
      <main className="ntf-page">
        <div className="ntf-page__head">
          <div>
            <h1 className="ntf-page__title">Notification Center</h1>
            <p className="ntf-page__lead">
              {loading ? 'Loading…' : `${unread.total ?? 0} unread notifications`}
            </p>
          </div>

          <button className="ntf-mark-all" type="button" onClick={markAllRead}>
            Mark all read
          </button>
        </div>

        {loadError && (
          <p className="notice notice--error" role="alert">
            {loadError}
          </p>
        )}

        <div className="ntf-filters" role="group" aria-label="Filter notifications">
          <button
            className={`ntf-filter ${filter === 'all' ? 'ntf-filter--active' : ''}`}
            type="button"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All
            {unread.total > 0 && <span className="ntf-filter__count">{unread.total}</span>}
          </button>

          {NOTIFICATION_TYPES.map((type) => {
            const count = unread[type.id] ?? 0;

            return (
              <button
                className={`ntf-filter ${filter === type.id ? 'ntf-filter--active' : ''}`}
                type="button"
                key={type.id}
                aria-pressed={filter === type.id}
                onClick={() => setFilter(type.id)}
              >
                {type.label}
                {count > 0 && <span className="ntf-filter__count">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="ntf-list">
          {!loading && visible.length === 0 && (
            <p className="field-empty">Nothing here yet.</p>
          )}

          {visible.map((row) => {
            const type = TYPE_BY_ID[row.type] ?? FALLBACK_TYPE;

            return (
              <article className={`ntf-card ${row.unread ? 'ntf-card--unread' : ''}`} key={row.id}>
                <span className={`ntf-card__badge ntf-card__badge--${type.tone}`}>
                  <img src={TYPE_ICON[type.tone]} alt="" width="14.992" height="14.992" />
                </span>

                <div className="ntf-card__body">
                  <div className="ntf-card__top">
                    <div className="ntf-card__copy">
                      <h2 className="ntf-card__title">{row.title}</h2>
                      <p className="ntf-card__text">{row.body}</p>
                    </div>

                    <div className="ntf-card__meta">
                      <span className="ntf-card__time">{timeAgo(row.at)}</span>
                      {row.unread && <span className="ntf-card__dot" aria-label="Unread" />}
                    </div>
                  </div>

                  <div className="ntf-card__foot">
                    <span className="ntf-card__chip">{type.label}</span>
                    <button className="ntf-card__link" type="button" onClick={() => openRow(row)}>
                      View details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </DashboardLayout>
  );
}

export default NotificationsPage;
