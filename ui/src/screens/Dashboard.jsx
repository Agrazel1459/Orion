import { useState } from 'react';
import { Card, Badge } from '../components/Card.jsx';
import { useOrionState } from '../hooks/useOrionState.js';

export default function Dashboard({ onNotify }) {
  const { entries, loading, error, refresh } = useOrionState();
  const [scanning, setScanning] = useState(false);
  const [lastScanOutput, setLastScanOutput] = useState(null);

  const unreviewed = entries.filter((e) => !e.flags.false_positive_reviewed);
  const lastFinding = entries.length
    ? entries.reduce((a, b) => (a.detected_at > b.detected_at ? a : b))
    : null;

  async function scanNow() {
    setScanning(true);
    setLastScanOutput(null);
    try {
      const out = await window.orion.scan.runNow();
      setLastScanOutput(out);
      onNotify?.({ title: 'Orion scan complete', body: out.split('\n').pop() || 'Scan finished.' });
    } catch (e) {
      const msg = `Error: ${e.message || e}`;
      setLastScanOutput(msg);
      onNotify?.({ title: 'Orion scan failed', body: msg });
    } finally {
      setScanning(false);
      refresh();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card>
          <div style={statLabel}>Last finding logged</div>
          <div style={statValue}>
            {lastFinding ? new Date(lastFinding.detected_at).toLocaleString() : 'None yet'}
          </div>
        </Card>
        <Card>
          <div style={statLabel}>Flagged items (unreviewed)</div>
          <div style={statValue}>
            {loading ? '—' : unreviewed.length}
            {unreviewed.length > 0 && (
              <Badge tone="warn" style={{ marginLeft: 8 }}>
                Review
              </Badge>
            )}
            {unreviewed.length === 0 && !loading && <Badge tone="safe">Clean</Badge>}
          </div>
        </Card>
        <Card>
          <div style={statLabel}>Total records</div>
          <div style={statValue}>{loading ? '—' : entries.length}</div>
        </Card>
      </div>

      <Card>
        <button className="primary" onClick={scanNow} disabled={scanning} style={{ fontSize: 15, padding: '10px 20px' }}>
          {scanning ? 'Scanning…' : 'Scan Now'}
        </button>
        {lastScanOutput && (
          <pre style={outputStyle}>{lastScanOutput}</pre>
        )}
        {error && <p style={{ color: 'var(--danger)', marginTop: 10 }}>{error}</p>}
      </Card>
    </div>
  );
}

const statLabel = { fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 };
const statValue = { fontSize: 20, fontWeight: 700, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: 8 };
const outputStyle = {
  marginTop: 12,
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: 10,
  fontSize: 12,
  color: 'var(--text-dim)',
  whiteSpace: 'pre-wrap',
};
