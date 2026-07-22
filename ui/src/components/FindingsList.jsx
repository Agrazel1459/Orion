import { Card, Badge } from './Card.jsx';

export default function FindingsList({ entries, loading, matchSource, emptyLabel }) {
  const filtered = entries.filter((e) => matchSource(e.source_script));

  if (loading) return <p style={{ color: 'var(--text-dim)' }}>Loading…</p>;

  if (filtered.length === 0) {
    return (
      <Card>
        <Badge tone="safe">Clean</Badge>
        <p style={{ marginTop: 10, color: 'var(--text-dim)' }}>{emptyLabel}</p>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {filtered.map((e) => (
        <Card key={e.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-h)', wordBreak: 'break-all' }}>
                {e.target}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{e.notes}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                {e.source_script} · {new Date(e.detected_at).toLocaleString()}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              {e.flags.false_positive_reviewed ? (
                <Badge tone="neutral">Reviewed</Badge>
              ) : (
                <Badge tone="warn">New</Badge>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
