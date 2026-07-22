import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import NotificationBell, { useNotificationHistory } from './components/NotificationBell.jsx';
import Dashboard from './screens/Dashboard.jsx';
import PcScan from './screens/PcScan.jsx';
import Network from './screens/Network.jsx';
import BrowserScan from './screens/BrowserScan.jsx';
import Downloads from './screens/Downloads.jsx';
import FlaggedItems from './screens/FlaggedItems.jsx';
import Settings from './screens/Settings.jsx';
import { useOrionState } from './hooks/useOrionState.js';

const SCREENS = {
  dashboard: Dashboard,
  pcscan: PcScan,
  network: Network,
  browser: BrowserScan,
  downloads: Downloads,
  flagged: FlaggedItems,
  settings: Settings,
};

export default function App() {
  const [active, setActive] = useState('dashboard');
  const { history, push } = useNotificationHistory();
  const { entries } = useOrionState();
  const unreviewedCount = entries.filter((e) => !e.flags.false_positive_reviewed).length;

  useEffect(() => {
    if (!window.orion?.notify?.onTrayScanNow) return;
    window.orion.notify.onTrayScanNow(() => setActive('dashboard'));
  }, []);

  const Screen = SCREENS[active] || Dashboard;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar active={active} onNavigate={setActive} flaggedCount={unreviewedCount} />
      <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <NotificationBell history={history} />
        </div>
        <Screen onNotify={push} />
      </main>
    </div>
  );
}
