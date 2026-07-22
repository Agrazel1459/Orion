import { useState } from 'react';
import { Card, Badge } from '../components/Card.jsx';

// Official project homepages only — stable URLs. Direct binary links are
// intentionally NOT hardcoded here: they change per release and a stale or
// wrong direct link is worse than sending the user to the official site.
const CATALOG = [
  { id: 'tor', name: 'Tor Browser', url: 'https://www.torproject.org/download/', note: 'Signed releases; verify via the project\'s PGP signature instructions on the download page.' },
  { id: 'autoruns', name: 'Autoruns (Sysinternals)', url: 'https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns', note: 'Microsoft does not publish a separate checksum file for this tool.' },
  { id: 'clamav-gui', name: 'ClamAV', url: 'https://www.clamav.net/downloads', note: 'SHA256 hashes are listed per-file on the official downloads page.' },
  { id: 'wireshark', name: 'Wireshark', url: 'https://www.wireshark.org/download.html', note: 'Signed installers; see the download page for verification instructions.' },
  { id: 'keepassxc', name: 'KeePassXC', url: 'https://keepassxc.org/download/', note: 'GitHub releases include a DIGESTS file with SHA256 hashes.' },
];

export default function Downloads() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>Downloads</h1>
      <p style={{ color: 'var(--text-dim)' }}>
        Official links only — no mirrors, no third-party hosts. Orion doesn't auto-run anything you download;
        installers are yours to run yourself. Direct binary URLs aren't hardcoded here since they change per
        release — clicking below takes you to the official download page for the current version.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {CATALOG.map((item) => (
          <Card key={item.id}>
            <h3>{item.name}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '6px 0 10px' }}>{item.note}</p>
            <button onClick={() => window.open(item.url, '_blank')}>Open official download page</button>
          </Card>
        ))}
      </div>

      <VerifyTool />
    </div>
  );
}

function VerifyTool() {
  const [file, setFile] = useState(null);
  const [expected, setExpected] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function verify() {
    if (!file || !expected.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const actual = await window.orion.downloads.sha256(file.path);
      const match = actual.toLowerCase() === expected.trim().toLowerCase();
      setResult({ match, actual });
    } catch (e) {
      setResult({ error: e.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Verify a downloaded file">
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
        Pick the file you downloaded and paste the SHA256 checksum from the project's official page.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <input
          type="text"
          placeholder="expected sha256 checksum"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          style={{ flex: 1, minWidth: 260, fontFamily: 'var(--mono)' }}
        />
        <button className="primary" onClick={verify} disabled={busy || !file || !expected.trim()}>
          {busy ? 'Verifying…' : 'Verify'}
        </button>
      </div>
      {result?.error && <p style={{ color: 'var(--danger)', marginTop: 10 }}>{result.error}</p>}
      {result && !result.error && (
        <div style={{ marginTop: 10 }}>
          {result.match ? <Badge tone="safe">Checksum matches</Badge> : <Badge tone="danger">Checksum mismatch</Badge>}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 6, wordBreak: 'break-all' }}>
            {result.actual}
          </div>
        </div>
      )}
    </Card>
  );
}
