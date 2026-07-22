export function Card({ title, children, style }) {
  return (
    <div style={{ ...cardStyle, ...style }}>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }) {
  const tones = {
    safe: { color: 'var(--accent)', background: 'var(--accent-bg)' },
    warn: { color: 'var(--warn)', background: 'var(--warn-bg)' },
    danger: { color: 'var(--danger)', background: 'var(--danger-bg)' },
    neutral: { color: 'var(--text-dim)', background: 'var(--bg-panel-hover)' },
  };
  return (
    <span
      style={{
        ...tones[tone],
        borderRadius: 4,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      }}
    >
      {children}
    </span>
  );
}

const cardStyle = {
  background: 'var(--bg-panel)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 18,
};
