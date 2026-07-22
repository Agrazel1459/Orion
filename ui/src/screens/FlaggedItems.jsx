import { useMemo, useState } from 'react';
import { useOrionState } from '../hooks/useOrionState.js';
import { Card, Badge } from '../components/Card.jsx';

export default function FlaggedItems() {
  const { entries, loading, refresh } = useOrionState();
  const [sourceFilter, setSourceFilter] = useState('all');
  const [confirmId, setConfirmId] = useState(null);
  const [busy, setBusy] = useState(false);

  const sources = useMemo(() => ['all', ...new Set(entries.map((e) => e.source_script))], [entries]);
  const filtered = sourceFilter === 'all' ? entries : entries.filter((e) => e.source_script === sourceFilter);

  async function confirmDelete(id) {
    setBusy(true);
    try {
      await window.orion.state.deleteEntry(id);
      await refresh();
    } finally {
      setBusy(false);
      setConfirmId(null);
    }
  }

  async function markReviewed(id) {
    await window.orion.state.setFlag(id, 'false_positive_reviewed', true);
    refresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>Flagged Items</h1>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>Filter by source:</label>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: 'var(--text-dim)' }}>Loading…</p>}
      {!loading && filtered.length === 0 && (
        <Card><Badge tone="safe">Clean</Badge></Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((e) => (
          <Card key={e.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-h)', wordBreak: 'break-all' }}>
                  {e.target}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{e.notes}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                  {e.source_script} · {new Date(e.detected_at).toLocaleString()}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {Object.entries(e.flags).filter(([, v]) => v).map(([k]) => (
                    <Badge key={k} tone="neutral">{k.replace(/_/g, ' ')}</Badge>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                {!e.flags.false_positive_reviewed && (
                  <button onClick={() => markReviewed(e.id)}>Mark reviewed</button>
                )}
                <button onClick={() => setConfirmId(e.id)} style={{ color: 'var(--danger)' }}>Delete</button>
              </div>
            </div>

            {confirmId === e.id && (
              <div style={confirmStyle}>
                <p style={{ fontSize: 13, marginBottom: 10 }}>
                  Remove this from Orion's records? This only deletes Orion's log entry — it does not
                  touch, fix, or remove the underlying process, file, or connection that was originally
                  flagged.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => confirmDelete(e.id)} disabled={busy} style={{ color: 'var(--danger)' }}>
                    {busy ? 'Removing…' : 'Yes, remove record'}
                  </button>
                  <button onClick={() => setConfirmId(null)} disabled={busy}>Cancel</button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

const confirmStyle = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: '1px solid var(--border)',
};
