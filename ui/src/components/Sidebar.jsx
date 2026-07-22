const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pcscan', label: 'PC Scan' },
  { id: 'network', label: 'Network' },
  { id: 'browser', label: 'Browser Scan' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'flagged', label: 'Flagged Items' },
  { id: 'settings', label: 'Settings' },
];

export default function Sidebar({ active, onNavigate, flaggedCount }) {
  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <span style={styles.dot} />
        Orion
      </div>
      <div style={styles.items}>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onNavigate(s.id)}
            style={{
              ...styles.item,
              ...(active === s.id ? styles.itemActive : {}),
            }}
          >
            {s.label}
            {s.id === 'flagged' && flaggedCount > 0 && (
              <span style={styles.badge}>{flaggedCount}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    width: 200,
    minWidth: 200,
    borderRight: '1px solid var(--border)',
    background: 'var(--bg-panel)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 10px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-h)',
    padding: '4px 10px 20px',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'var(--accent)',
    boxShadow: '0 0 8px var(--accent)',
  },
  items: { display: 'flex', flexDirection: 'column', gap: 2 },
  item: {
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    borderRadius: 6,
    padding: '9px 10px',
    color: 'var(--text)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemActive: {
    background: 'var(--accent-bg)',
    color: 'var(--accent)',
    fontWeight: 600,
  },
  badge: {
    background: 'var(--danger)',
    color: '#2a0000',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 700,
    padding: '1px 7px',
  },
};
