# Changelog

## [Unreleased]
### Fixed
- ShellCheck warnings (SC2034) in `linux-audio-device-audit.sh` — unused
  `user`/`access` fields in the `fuser` output loop renamed to `_user`/`_access`.

## v1.1 — Desktop UI
### Added
- `ui/` — Electron + React desktop app: Dashboard, PC Scan, Network, Browser
  Scan, Downloads, Flagged Items, Settings screens; in-app notification
  center; IPC bridge to the existing Python backend (no scan logic
  duplicated in JS).
- `scripts/win/win-browser-extension-scan.ps1` and
  `scripts/linux/linux-browser-extension-scan.sh` — read-only browser
  extension permission audit (Chrome/Edge/Firefox), flags high-impact
  permissions only, no store-listing lookups.
- `core/settings.py` — persists background-scanning toggle, scan interval
  (UI default: 15 min), and notification preference.
- `core/state_store.py`: `delete_entry()` — manual, user-initiated removal
  of Orion's own record for a finding; never touches the underlying
  system. Also added a CLI wrapper (`get_all`/`add_finding`/`set_flag`/
  `delete_entry`) so Electron's main process can call it as a subprocess.
- Downloads screen: official-homepage links only (no hardcoded direct
  binary URLs, which go stale per release) plus a real local SHA256
  checksum verifier.
- `install.sh` / `install.ps1`: idempotent Node.js install + `ui/`
  dependency install.
- CI: `ui-build` job (npm ci, React build, Electron file syntax check).
- README: "Desktop App" section; script table updated with the two new
  scripts and `settings.py`.

### Changed
- `core/orchestrator.py`: added both new browser-extension-scan scripts to
  the per-OS run list; now skips the notification when the UI's
  `notifications_enabled` setting is off.
- `core/config.py`: added `USER_INTERVAL_FILE_NAME` and
  `DEFAULT_USER_INTERVAL_MINUTES` for the UI's persisted interval.

## v1.0 — Install tutorial + CI
### Added
- README: full step-by-step install instructions for all four paths —
  Windows with git, Windows without git (ZIP), Linux with git, Linux
  without git (ZIP/curl) — plus a CI badge.
- `.github/workflows/ci.yml`: Python compile + `state_store.py` self-test,
  ShellCheck on Linux scripts, PSScriptAnalyzer on Windows scripts (runs on
  `windows-latest`), and a manifest-drift check.

## v0.1 — Initial backend
### Added
- Repo scaffold: `scripts/win/`, `scripts/linux/`, `scripts/mobile/`, `core/`.
- `core/state_store.py` — JSON-backed finding log; findings are never
  deleted automatically, only flagged (`disabled`, `terminated`, `rejected`,
  `false_positive_reviewed`).
- `core/notify.py` — cross-platform notification helper (win10toast /
  notify-send / plyer).
- `core/config.py` — scan interval range, script timeout, paths.
- `core/orchestrator.py` — runs the platform-appropriate script set once
  per cycle, aggregates findings, fires one notification per cycle.
- Windows scripts: process, network, startup, audio-device-audit, and
  remote-access checks.
- Linux scripts: process, network, startup, and audio-device-audit checks.
- Mobile flow: `mobile-connect-listener.py` (USB device detection, PC-side
  only), `android-inspect.py` (ADB, read-only), `ios-inspect.py`
  (libimobiledevice, read-only). No background iOS monitoring — not
  possible on iOS by OS design.
- `install.sh` / `install.ps1` — idempotent dependency installers (git,
  Python, ClamAV, osquery, ADB, libimobiledevice).
- `orion-manifest.json` + `generate_manifest.py` — regenerated from the
  filesystem, never hand-edited.
- `README.md`, `LICENSE` (MIT).

### Design decisions carried through every phase
- Nothing is ever auto-deleted. Automated scripts only ever flag; the only
  delete capability is the UI's manual, confirmed, record-only
  `delete_entry` action added in v1.1.
- No remote/cloud reporting or telemetry — fully local.
- No silent privilege escalation — install scripts request elevation once,
  visibly, via standard OS prompts.
