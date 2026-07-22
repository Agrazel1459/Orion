import { useOrionState } from '../hooks/useOrionState.js';
import FindingsList from '../components/FindingsList.jsx';

const SOURCES = ['win-browser-extension-scan.ps1', 'linux-browser-extension-scan.sh'];

export default function BrowserScan() {
  const { entries, loading } = useOrionState();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>Browser Scan</h1>
      <p style={{ color: 'var(--text-dim)' }}>
        Installed browser extensions flagged for requesting broad, high-impact permissions.
        Read-only local inspection — no store-listing lookups are performed.
      </p>
      <FindingsList
        entries={entries}
        loading={loading}
        matchSource={(s) => SOURCES.includes(s)}
        emptyLabel="No high-permission extensions found."
      />
    </div>
  );
}
