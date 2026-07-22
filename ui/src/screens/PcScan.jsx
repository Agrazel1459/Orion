import { useOrionState } from '../hooks/useOrionState.js';
import FindingsList from '../components/FindingsList.jsx';

const SOURCES = [
  'win-process-scan.ps1', 'win-startup-check.ps1', 'win-audio-device-audit.ps1',
  'linux-process-scan.sh', 'linux-startup-check.sh', 'linux-audio-device-audit.sh',
];

export default function PcScan() {
  const { entries, loading } = useOrionState();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>PC Scan</h1>
      <p style={{ color: 'var(--text-dim)' }}>
        Process, startup, and audio/video device findings from the process, startup, and audio-device-audit scripts.
      </p>
      <FindingsList
        entries={entries}
        loading={loading}
        matchSource={(s) => SOURCES.includes(s)}
        emptyLabel="No process, startup, or device findings."
      />
    </div>
  );
}
