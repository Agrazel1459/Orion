const { app, BrowserWindow, ipcMain, Tray, Menu, Notification } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CORE_DIR = path.join(REPO_ROOT, 'core');
const PYTHON = process.platform === 'win32' ? 'python' : 'python3';

let mainWindow;
let tray;

function runPython(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, [path.join(CORE_DIR, scriptName), ...args], { cwd: CORE_DIR });
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
  const settingsPath = path.join(REPO_ROOT, 'orion_settings.json');
  if (!fs.existsSync(settingsPath)) {
    return { background_scanning_enabled: true, interval_minutes: 15, notifications_enabled: true };
  }
  return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
});

ipcMain.handle('settings:save', async (_e, settings) => {
  const fs = require('node:fs');
  const settingsPath = path.join(REPO_ROOT, 'orion_settings.json');
  let current = { background_scanning_enabled: true, interval_minutes: 15, notifications_enabled: true };
  if (fs.existsSync(settingsPath)) {
    current = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  }
  const merged = { ...current, ...settings };
  fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2));

  // Re-register scheduler with new interval — replace, not add to, any
  // existing entry.
  await reregisterScheduler(merged);
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
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#010e1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
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
    tray = new Tray(path.join(__dirname, '..', 'public', 'favicon.svg'));
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
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
