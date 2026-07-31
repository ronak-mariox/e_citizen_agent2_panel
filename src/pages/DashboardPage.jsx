import { useNavigate } from 'react-router-dom';

import ROUTES from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';

/**
 * Placeholder landing screen for a signed-in Agent 2.
 *
 * The Agent 2 dashboard has not been designed yet; this exists so the auth flow
 * has somewhere to land and so the session can be inspected and ended. Replace
 * the body when the real screens arrive — the guard and logout wiring stay.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <main className="session-card">
      <h1 className="session-card__title">Agent 2 — Senior Review Portal</h1>
      <p className="session-card__subtitle">You are signed in.</p>

      <dl className="session-card__list">
        <div className="session-card__row">
          <dt>Name</dt>
          <dd>{user?.fullName || '—'}</dd>
        </div>
        <div className="session-card__row">
          <dt>Employee ID</dt>
          <dd>{user?.employeeId ?? '—'}</dd>
        </div>
        <div className="session-card__row">
          <dt>Role</dt>
          <dd>{user?.role ?? '—'}</dd>
        </div>
        <div className="session-card__row">
          <dt>Status</dt>
          <dd>{user?.status ?? '—'}</dd>
        </div>
      </dl>

      <button className="session-card__logout" type="button" onClick={handleLogout}>
        Logout
      </button>
    </main>
  );
}

export default DashboardPage;
