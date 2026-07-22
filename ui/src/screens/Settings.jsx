import { useEffect, useState } from 'react';
import { Card } from '../components/Card.jsx';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.orion.settings.load().then(setSettings);
  }, []);

  async function update(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    setSaved(false);
    try {
      await window.orion.settings.save(patch);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <p style={{ color: 'var(--text-dim)' }}>Loading…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>Settings</h1>

      <Card title="Background scanning">
        <label style={rowStyle}>
          <input
            type="checkbox"
            checked={settings.background_scanning_enabled}
            onChange={(e) => update({ background_scanning_enabled: e.target.checked })}
          />
          Run scans automatically in the background
        </label>

        {settings.background_scanning_enabled && (
          <div style={{ ...rowStyle, marginTop: 12 }}>
            <label style={{ fontSize: 13 }}>Scan interval (minutes)</label>
            <input
              type="number"
              min="1"
              value={settings.interval_minutes}
              onChange={(e) => update({ interval_minutes: Math.max(1, parseInt(e.target.value, 10) || 15) })}
              style={{ width: 80 }}
            />
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 10 }}>
          Default is 15 minutes. Changing this re-registers the scheduled task with the new
          value — the old entry is replaced, not duplicated. On Linux, run the printed cron/systemd
          command yourself to apply the change (Orion doesn't edit your crontab automatically).
        </p>
      </Card>

      <Card title="Notifications">
        <label style={rowStyle}>
          <input
            type="checkbox"
            checked={settings.notifications_enabled}
            onChange={(e) => update({ notifications_enabled: e.target.checked })}
          />
          Show a notification after each scan cycle
        </label>
      </Card>

      {saving && <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Saving…</p>}
      {saved && !saving && <p style={{ fontSize: 12, color: 'var(--accent)' }}>Saved.</p>}
    </div>
  );
}

const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 };
