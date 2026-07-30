import brandShieldIcon from '@/assets/icons/brand-shield.svg';
import statBuildingIcon from '@/assets/icons/stat-building.svg';
import statCheckIcon from '@/assets/icons/stat-check.svg';
import statClockIcon from '@/assets/icons/stat-clock.svg';
import statFileIcon from '@/assets/icons/stat-file.svg';

const STATS = [
  { icon: statFileIcon, value: '12,400+', label: 'Applications Processed' },
  { icon: statClockIcon, value: '3.2 days', label: 'Avg Resolution Time' },
  { icon: statCheckIcon, value: '87%', label: 'Approval Rate' },
  { icon: statBuildingIcon, value: '14', label: 'Departments Covered' },
];

/** Navy marketing panel shared by every screen in the auth flow. */
export function BrandPanel() {
  return (
    <aside className="brand-panel">
      <span className="brand-panel__orb brand-panel__orb--top" aria-hidden="true" />
      <span className="brand-panel__orb brand-panel__orb--mid" aria-hidden="true" />
      <span className="brand-panel__orb brand-panel__orb--bottom" aria-hidden="true" />

      <header className="brand-panel__header">
        <span className="brand-panel__logo">
          <img src={brandShieldIcon} alt="" width="20" height="20" />
        </span>
        <span className="brand-panel__names">
          <span className="brand-panel__title">eCitizen Portal</span>
          <span className="brand-panel__subtitle">
            Government of India · Agent 2 — Senior Review
          </span>
        </span>
      </header>

      <h2 className="brand-panel__headline">Final approval, your authority.</h2>
      <p className="brand-panel__blurb">
        Verify documents, manage applications, and ensure timely resolution for
        every citizen request — all in one secure workspace.
      </p>

      <ul className="brand-panel__stats">
        {STATS.map((stat) => (
          <li className="brand-panel__stat" key={stat.label}>
            <img src={stat.icon} alt="" width="16" height="16" />
            <span className="brand-panel__stat-value">{stat.value}</span>
            <span className="brand-panel__stat-label">{stat.label}</span>
          </li>
        ))}
      </ul>

      <footer className="brand-panel__footer">
        <p className="brand-panel__ministry">
          Ministry of Electronics &amp; Information Technology
        </p>
        <p className="brand-panel__assurance">
          Secure · Authenticated · Government Use Only
        </p>
      </footer>
    </aside>
  );
}

export default BrandPanel;
