import DashboardLayout from '../layouts/DashboardLayout.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import ActiveCases from '../components/dashboard/ActiveCases.jsx';
import GovVisits from '../components/dashboard/GovVisits.jsx';
import refreshIcon from '../assets/icons/agent2/refresh.svg';
import { AGENT, STAT_CARDS } from '../constants/dashboard.js';
import { useAuth } from '../context/AuthContext.jsx';

function greeting(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.fullName || AGENT.name).split(' ')[0];

  // TODO: refetch the dashboard payload once the agent API is available.
  function handleRefresh() {
    console.info('dashboard refresh requested');
  }

  return (
    <DashboardLayout>
      <main className="dash-page">
        <div className="dash-page__head">
          <div>
            <h1 className="dash-page__title">{`${greeting()}, ${firstName} 👋`}</h1>
            <p className="dash-page__subtitle">Agent 2 · Government Processing Overview</p>
          </div>
          <button className="dash-page__refresh" type="button" onClick={handleRefresh}>
            <img src={refreshIcon} alt="" width="13.12" height="13.12" />
            Refresh
          </button>
        </div>

        <div className="stat-grid">
          {STAT_CARDS.map((card) => (
            <StatCard key={card.id} {...card} />
          ))}
        </div>

        <div className="split-row">
          <ActiveCases />
          <GovVisits />
        </div>
      </main>
    </DashboardLayout>
  );
}

export default DashboardPage;
