# Orion

[![CI](https://github.com/Agrazel1459/Orion/actions/workflows/ci.yml/badge.svg)](https://github.com/Agrazel1459/Orion/actions/workflows/ci.yml)

Orion is a small collection of single-purpose scripts that check a Windows
or Linux machine for common signs of compromise, log what they find, and
send you one notification per scan cycle. It is a defensive audit toolkit,
not a guarantee of anything and not a replacement for a real incident
response process if you actually suspect you're compromised. It doesn't
delete files, doesn't phone home, and doesn't run anything you haven't
explicitly installed and scheduled yourself.

## Installation

Pick your OS and whether you have `git` installed. All four paths end up in
the same place: a folder called `orion` with `install.sh`/`install.ps1`
inside it.

### Windows — with git

1. Open **PowerShell as Administrator** (Start menu → search "PowerShell" →
   right-click → "Run as administrator").
2. Clone and enter the repo:
   ```powershell
   git clone https://github.com/Agrazel1459/Orion.git orion
   cd orion
   ```
3. Allow the installer to run for this session only (doesn't change your
   system-wide policy):
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```
4. Run the installer:
   ```powershell
   .\install.ps1
   ```

### Windows — without git (download ZIP)

1. On the repo's GitHub page, click the green **Code** button → **Download
   ZIP**.
2. Right-click the downloaded ZIP → **Extract All...** → pick a folder like
   `C:\Users\<you>\orion`.
   (Don't run scripts from inside the ZIP itself — extract first, or
   Windows will silently block them as coming from the internet.)
3. Open **PowerShell as Administrator**, then:
   ```powershell
   cd C:\Users\<you>\orion
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   Unblock-File -Path .\install.ps1, .\core\*.py, .\scripts\win\*.ps1
   .\install.ps1
   ```
   The `Unblock-File` step removes the "downloaded from the internet" flag
   Windows attaches to extracted files, which otherwise makes some of them
   refuse to run.

### Linux — with git

```bash
git clone https://github.com/Agrazel1459/Orion.git orion
cd orion
chmod +x install.sh
./install.sh
```

### Linux — without git (download ZIP)

1. Download the ZIP from the repo's GitHub page (**Code** → **Download
   ZIP**), or via `curl`:
   ```bash
   curl -L -o orion.zip https://github.com/Agrazel1459/Orion/archive/refs/heads/main.zip
   ```
2. Extract and enter it:
   ```bash
   unzip orion.zip
   cd Orion-main
   ```
3. Run the installer:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

Both installers are idempotent — safe to run more than once. Each checks
whether a tool is already present before installing it.

### After installing (both OSes)

Run one manual cycle to confirm everything works before scheduling it:

- **Windows:** `python core\orchestrator.py`
- **Linux:** `python3 core/orchestrator.py`

You should see a notification and a new `orion_state.json` file in the
`orion` folder. If ClamAV was freshly installed on Windows, add its `bin`
folder to your PATH and run `freshclam` once before this step — installers
don't always do this automatically.

Once the manual run works, schedule it so it runs unattended every 30
minutes:

- **Windows:**
  ```powershell
  schtasks /create /tn "Orion" /tr "python C:\path\to\orion\core\orchestrator.py" /sc minute /mo 30 /rl highest
  ```
- **Linux (cron):**
  ```bash
  (crontab -l 2>/dev/null; echo "*/30 * * * * /usr/bin/python3 /path/to/orion/core/orchestrator.py") | crontab -
  ```

## What each script does

| Script | What it does |
|---|---|
| win-process-scan.ps1 | Flags Windows processes running from temp dirs or with a missing executable file |
| win-network-scan.ps1 | Flags TCP listeners bound to all interfaces, not in a small allowlist |
| win-startup-check.ps1 | Flags startup entries not in a small allowlist; cross-checks Autoruns if present |
| win-audio-device-audit.ps1 | Flags apps with active mic/webcam consent, not in a small allowlist |
| win-remote-access-check.ps1 | Reports RDP/WinRM status and any running remote-access tools |
| win-browser-extension-scan.ps1 | Flags installed Chrome/Edge/Firefox extensions requesting broad, high-impact permissions |
| linux-process-scan.sh | Flags Linux processes in writable temp dirs or with a deleted backing binary |
| linux-network-scan.sh | Flags TCP listeners bound to all interfaces, not in a small allowlist |
| linux-startup-check.sh | Flags enabled systemd services, cron entries, init.d scripts not in a small allowlist |
| linux-audio-device-audit.sh | Flags processes holding open audio/video device handles, not in a small allowlist |
| linux-browser-extension-scan.sh | Flags installed Chrome/Chromium/Edge/Firefox extensions requesting broad, high-impact permissions |
| mobile-connect-listener.py | Watches for a phone connecting over USB, asks before inspecting it |
| android-inspect.py | Read-only Android check over ADB: third-party packages, device admin, accessibility services |
| ios-inspect.py | Read-only iOS check over libimobiledevice: installed apps, config profiles |
| orchestrator.py | Runs the platform-appropriate script set once, aggregates, fires one notification |
| notify.py | Cross-platform notification helper |
| state_store.py | Reads/writes/deletes entries in orion_state.json |
| settings.py | Persists user settings (background scanning toggle, interval, notification preference) |
| config.py | Constants (interval, timeout, paths) |

(Table generated from the same file list as `orion-manifest.json` — see
`generate_manifest.py`.)

## The flag system

Every finding gets written once to `orion_state.json` and is never deleted.
Each entry has a `flags` object (`false_positive_reviewed`, `disabled`,
`terminated`, `rejected`) that starts all-false. Taking action on a finding
only ever flips one of these booleans — the original record stays. `disabled`
means a startup entry was turned off through the OS's own tooling, not
removed. `terminated` means a process was ended for that session only.
`rejected` means a firewall rule was added to block a connection; the rule
itself is logged too, so it's reversible.

## Mobile checks — and their real limits

The mobile flow only runs on your PC, when a phone is plugged in by cable,
and only after you say yes to a prompt. It reads installed apps and (for
iOS) configuration profiles — nothing is installed on the phone, nothing is
written to it.

iOS has no background or continuous protection here, by design of the OS:
iOS doesn't allow third-party background monitoring. Every iOS check is a
one-time, cable-connected, user-approved read. If you want deeper forensic
analysis, look at [MVT](https://github.com/mvt-project/mvt) separately —
it's a heavier, manual toolkit that's intentionally not wired into Orion's
automated loop.

## Desktop App

A desktop UI (Electron + React) lives in `ui/`. It's a shell around the same
backend above — it reads/writes `orion_state.json` and runs `orchestrator.py`
through the existing scripts, it doesn't reimplement any scanning logic.

**Launch it in dev mode** (after `install.sh`/`install.ps1` has run, which
installs Node.js and `ui/`'s dependencies):

```bash
cd ui
npm run electron:dev
```

**Build a packaged app:**

```bash
cd ui
npm run electron:build
```

Sections: Dashboard (status + Scan Now), PC Scan, Network, Browser Scan
(installed extensions with risky permissions), Downloads (official links to
a curated set of security/privacy tools, plus a local SHA256 checksum
verifier — no direct binary URLs are hardcoded, since those go stale per
release), Flagged Items (browse/review/delete Orion's own records), and
Settings (background scanning toggle, scan interval, notification
preference).

Deleting an entry on the Flagged Items screen only removes Orion's record of
having flagged it — it never touches the underlying process, file, or
connection that triggered the flag. The automated scan scripts still never
delete anything on their own; this is a separate, manual, user-initiated
action.

Changing the scan interval in Settings re-registers the scheduled
task/timer with the new value on Windows automatically. On Linux, the app
persists your choice but doesn't edit your crontab for you — update the
cron line shown in the installation section above to match.

## Download & Install

Prebuilt installers are attached to [GitHub Releases](https://github.com/Agrazel1459/Orion/releases/latest).
If that page shows no release yet, one hasn't been tagged — see "Building from
source" below in the meantime, or check the
[Actions tab](https://github.com/Agrazel1459/Orion/actions/workflows/build.yml)
for an in-progress build.

**Windows:**
1. Download `Orion-Setup-<version>.exe` from the release.
2. Run it. Windows SmartScreen will likely warn "unrecognized publisher" —
   this is expected for an unsigned open-source build (see note below);
   click "More info" → "Run anyway".
3. Follow the installer — you can choose the install directory. It adds a
   Start Menu entry and a desktop shortcut.
4. Launch Orion from the desktop shortcut. On first run it still needs
   `install.ps1` to have set up Python/ClamAV/etc — see Installation above
   if you haven't run that yet.

**Linux — AppImage (no install step):**
1. Download the `.AppImage` file from the release.
2. `chmod +x Orion-<version>.AppImage`
3. `./Orion-<version>.AppImage`

**Linux — .deb (Debian/Ubuntu, adds a proper package + desktop entry):**
1. Download the `.deb` file from the release.
2. `sudo dpkg -i orion_<version>_amd64.deb`
3. Launch "Orion" from your applications menu, or run `orion` from a terminal.

None of these installers bundle Python, git, or Node — on first launch the
app still relies on `install.sh`/`install.ps1` (see Installation above) to
set those up. Installers aren't code-signed (that requires a paid
certificate, out of scope for an open-source project), so Windows
SmartScreen and some Linux distros may warn about an unrecognized
publisher on first run — that's expected for an unsigned open-source
build.

Building from source instead: see the "Desktop App" section above.

## Uninstalling

1. Remove the scheduled task/timer:
   - Windows: `schtasks /delete /tn "Orion" /f`
   - Linux (systemd timer): `systemctl --user disable --now orion.timer`
   - Linux (cron): remove the Orion line from `crontab -e`
2. Delete the `orion/` folder.
3. Uninstall packages `install.sh`/`install.ps1` added, if you don't want
   them anymore (ClamAV, osquery, adb, libimobiledevice) — the installers
   only add these if they weren't already on your system, and don't remove
   pre-existing installs on uninstall.

Nothing else is added anywhere else on the system — no services beyond the
one scheduled task/timer, no autostart entries of its own beyond that.

## License

MIT — see `LICENSE`.
