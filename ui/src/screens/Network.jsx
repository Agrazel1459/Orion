import { useOrionState } from '../hooks/useOrionState.js';
import FindingsList from '../components/FindingsList.jsx';

const SOURCES = [
  'win-network-scan.ps1', 'win-remote-access-check.ps1', 'linux-network-scan.sh',
];

export default function Network() {
  const { entries, loading } = useOrionState();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>Network</h1>
      <p style={{ color: 'var(--text-dim)' }}>
        Listening ports and remote-access findings from the network and remote-access-check scripts.
      </p>
      <FindingsList
        entries={entries}
        loading={loading}
        matchSource={(s) => SOURCES.includes(s)}
        emptyLabel="No network or remote-access findings."
      />
    </div>
  );
}
