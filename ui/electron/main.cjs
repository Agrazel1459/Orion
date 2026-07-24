const { app, BrowserWindow, ipcMain, Tray, Menu, Notification } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');

// Dev: ui/electron/../.. = repo root, core/ and scripts/ live there directly.
// Packaged: electron-builder copies core/ and scripts/ into
// process.resourcesPath via extraResources (see electron-builder.yml).
const REPO_ROOT = app.isPackaged
  ? process.resourcesPath
  : path.resolve(__dirname, '..', '..');
const CORE_DIR = path.join(REPO_ROOT, 'core');
const PYTHON = process.platform === 'win32' ? 'python' : 'python3';
const DATA_DIR = app.isPackaged ? app.getPath('userData') : REPO_ROOT;

let mainWindow;
let tray;

function runPython(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, [path.join(CORE_DIR, scriptName), ...args], {
      cwd: CORE_DIR,
      env: { ...process.env, ORION_DATA_DIR: DATA_DIR },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `${scriptName} exited with code ${code}`));
      } else {
        resolve(stdout.trim());
      }
    });
    child.on('error', reject);
  });
}

// --- IPC: state_store.py CLI wrapper ---
ipcMain.handle('state:getAll', async () => {
  const out = await runPython('state_store.py', ['get_all']);
  return JSON.parse(out || '[]');
});

ipcMain.handle('state:setFlag', async (_e, { id, flag, value }) => {
  const out = await runPython('state_store.py', ['set_flag', id, flag, String(value)]);
  return JSON.parse(out);
});

ipcMain.handle('state:deleteEntry', async (_e, { id }) => {
  const out = await runPython('state_store.py', ['delete_entry', id]);
  return JSON.parse(out);
});

// --- IPC: orchestrator (Scan Now) ---
ipcMain.handle('scan:runNow', async () => {
  const out = await runPython('orchestrator.py');
  return out;
});

// --- IPC: settings.py ---
ipcMain.handle('settings:load', async () => {
  // Read the settings JSON file directly rather than invoking settings.py
  // as a subprocess — settings.py's __main__ block always runs its
  // self-test (which deletes the file), so it must never be spawned here.
  const fs = require('node:fs');
  const settingsPath = path.join(DATA_DIR, 'orion_settings.json');
  if (!fs.existsSync(settingsPath)) {
    return { background_scanning_enabled: true, interval_minutes: 15, notifications_enabled: true };
  }
  return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
});

function autostartPathLinux() {
  const os = require('node:os');
  return path.join(os.homedir(), '.config', 'autostart', 'orion.desktop');
}

function setAutostart(enabled) {
  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      args: ['--hidden'],
    });
    return;
  }
  if (process.platform === 'linux') {
    const fs = require('node:fs');
    const target = autostartPathLinux();
    if (enabled) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const execPath = process.env.APPIMAGE || process.execPath;
      const entry = [
        '[Desktop Entry]',
        'Type=Application',
        'Name=Orion',
        `Exec=${execPath} --hidden`,
        'X-GNOME-Autostart-enabled=true',
        'Terminal=false',
      ].join('\n');
      fs.writeFileSync(target, entry);
    } else if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
    return;
  }
  // macOS not a packaging target for this project; no-op.
}

ipcMain.handle('settings:save', async (_e, settings) => {
  const fs = require('node:fs');
  const settingsPath = path.join(DATA_DIR, 'orion_settings.json');
  let current = { background_scanning_enabled: true, interval_minutes: 15, notifications_enabled: true };
  if (fs.existsSync(settingsPath)) {
    current = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  }
  const merged = { ...current, ...settings };
  fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2));

  // Re-register scheduler with new interval — replace, not add to, any
  // existing entry. Also register/remove OS autostart entry to match the
  // toggle, tray-minimized on launch (see AUTOSTART section).
  await reregisterScheduler(merged);
  setAutostart(merged.background_scanning_enabled);
  return merged;
});

function reregisterScheduler(settings) {
  return new Promise((resolve) => {
    const orchestratorPath = path.join(CORE_DIR, 'orchestrator.py');
    if (process.platform === 'win32') {
      // Remove any existing task, then recreate if enabled — avoids a
      // stale duplicate scheduled entry.
      const del = spawn('schtasks', ['/delete', '/tn', 'Orion', '/f']);
      del.on('close', () => {
        if (!settings.background_scanning_enabled) return resolve();
        const create = spawn('schtasks', [
          '/create', '/tn', 'Orion', '/tr', `python "${orchestratorPath}"`,
          '/sc', 'minute', '/mo', String(settings.interval_minutes), '/rl', 'highest', '/f',
        ]);
        create.on('close', () => resolve());
      });
    } else {
      // Linux: not executing crontab mutation here to avoid clobbering
      // unrelated user cron entries without a safer merge; surface the
      // command for the user instead (see Settings screen copy).
      resolve();
    }
  });
}

function createWindow() {
  const startHidden = process.argv.includes('--hidden');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: !startHidden,
    backgroundColor: '#010e1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('close', (e) => {
    if (tray && !app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

function createTray() {
  try {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'build', 'icon.png')
      : path.join(__dirname, '..', 'build', 'icon.png');
    tray = new Tray(iconPath);
    tray.setToolTip('Orion');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Open Orion', click: () => mainWindow?.show() },
      { label: 'Scan Now', click: () => mainWindow?.webContents.send('tray:scanNow') },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ]));
  } catch {
    // Tray icon is best-effort; app still functions without it.
  }
}

ipcMain.handle('downloads:sha256', async (_e, filePath) => {
  const fs = require('node:fs');
  const crypto = require('node:crypto');
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
});

ipcMain.handle('notify:show', async (_e, { title, body }) => {
  new Notification({ title, body }).show();
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Sync OS autostart registration with the persisted setting on every
  // launch — covers first install (default ON, nothing registered yet)
  // and keeps it correct if the setting file was edited outside the app.
  const fs = require('node:fs');
  const settingsPath = path.join(DATA_DIR, 'orion_settings.json');
  let bgEnabled = true; // matches settings.py's DEFAULTS
  if (fs.existsSync(settingsPath)) {
    try {
      bgEnabled = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')).background_scanning_enabled ?? true;
    } catch {
      // malformed settings file; fall back to default rather than crash
    }
  }
  setAutostart(bgEnabled);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !tray) app.quit();
});
