import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import LogoutDialog from '../LogoutDialog.jsx';
import navLogo from '../../assets/icons/agent2/brand.svg';
import navLogout from '../../assets/icons/agent2/nav-logout.svg';
import { NAV_ITEMS } from '../../constants/dashboard.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCases } from '../../context/CasesContext.jsx';

export function Sidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { assigned } = useCases();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  // Only the assigned count is badged today; a nav item names the list it counts.
  const badgeCounts = { assigned: assigned.length };

  // Revokes the refresh token server-side and clears the cookie, so the
  // session is gone rather than just hidden.
  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__head">
        <div className="sidebar__mark">
          <img src={navLogo} alt="" width="14.992" height="14.992" />
        </div>
        <div>
          <p className="sidebar__name">eCitizen</p>
          <p className="sidebar__portal">Agent 2 · Senior Portal</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const count = badgeCounts[item.badge];

          return (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            {/* Masked rather than an <img>: the exported icons carry the
                inactive grey baked in, and the active row needs them green.

                The url() must be quoted. Vite inlines these SVGs under the
                4 KB limit as data URIs whose attributes are single-quoted, and
                an unquoted url() token cannot hold a quote — the whole
                declaration is dropped and the row loses its icon. */}
            <span
              className="sidebar__icon"
              style={{ maskImage: `url("${item.icon}")`, WebkitMaskImage: `url("${item.icon}")` }}
            />
            {item.label}
            {count > 0 && <span className="sidebar__badge">{count}</span>}
          </NavLink>
          );
        })}
      </nav>

      <div className="sidebar__foot">
        <button
          className="sidebar__logout"
          type="button"
          onClick={() => setConfirmingLogout(true)}
        >
          <img src={navLogout} alt="" width="14.992" height="14.992" />
          Logout
        </button>
      </div>

      {confirmingLogout && (
        <LogoutDialog onCancel={() => setConfirmingLogout(false)} onConfirm={handleLogout} />
      )}
    </aside>
  );
}

export default Sidebar;
