import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import SettingsNav from '../components/settings/SettingsNav.jsx';
import ProfilePanel from '../components/settings/ProfilePanel.jsx';
import PasswordPanel from '../components/settings/PasswordPanel.jsx';
import SecurityPanel from '../components/settings/SecurityPanel.jsx';
import { DEFAULT_SETTINGS_TAB } from '../constants/settings.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/settings.css';

const PANELS = {
  profile: ProfilePanel,
  password: PasswordPanel,
  security: SecurityPanel,
};

export function SettingsPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(DEFAULT_SETTINGS_TAB);
  const Panel = PANELS[activeTab];

  // The same sign-out the sidebar does: revoke the refresh token server-side so
  // the session is gone rather than just navigated away from.
  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <DashboardLayout>
      <main className="dash-page">
        <h1 className="dash-page__title">Settings</h1>

        <div className="settings-body">
          <SettingsNav
            activeTab={activeTab}
            onSelect={setActiveTab}
            onLogout={handleLogout}
          />

          <Panel />
        </div>
      </main>
    </DashboardLayout>
  );
}

export default SettingsPage;
