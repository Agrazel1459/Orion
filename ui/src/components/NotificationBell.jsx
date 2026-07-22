import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'orion-notification-history';
const MAX_HISTORY = 50;

export function useNotificationHistory() {
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  function push(entry) {
    setHistory((prev) => {
      const next = [{ ...entry, at: new Date().toISOString() }, ...prev].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage best-effort; history still works for this session
      }
      return next;
    });
  }

  return { history, push };
}

export default function NotificationBell({ history }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = history.length > 0 && !history[0].seen;

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button onClick={() => setOpen((o) => !o)} style={{ position: 'relative' }}>
        🔔
        {unread && <span style={dotStyle} />}
      </button>
      {open && (
        <div style={panelStyle}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>
            Notifications
          </div>
          {history.length === 0 && (
            <div style={{ padding: 14, fontSize: 12, color: 'var(--text-dim)' }}>No notifications yet.</div>
          )}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {history.map((h, i) => (
              <div key={i} style={itemStyle}>
                <div style={{ fontSize: 13, color: 'var(--text-h)', fontWeight: 600 }}>{h.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{h.body}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                  {new Date(h.at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const dotStyle = {
  position: 'absolute',
  top: 4,
  right: 4,
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: 'var(--warn)',
};

const panelStyle = {
  position: 'absolute',
  right: 0,
  top: '110%',
  width: 300,
  background: 'var(--bg-panel)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  zIndex: 10,
};

const itemStyle = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
};
