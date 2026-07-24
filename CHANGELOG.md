# Changelog

All notable changes to this project are documented here, newest first.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

> **For future changes:** any change made to this repo — by a person or an
> LLM working from one of the `orion-*-instructions.md` files — should end
> by appending its own entry here under Added/Changed/Fixed/Removed,
> describing only what was actually built or fixed, not what was planned.

## [Unreleased]

## v1.2.2 — Release workflow permission fix
### Fixed
- `.github/workflows/build.yml`: the `release` job's default `GITHUB_TOKEN`
  had no write access on this repo, so `softprops/action-gh-release`
  failed to create the release (test suite, Linux build, and Windows NSIS
  build all passed — only the final attach-to-release step failed). Added
  `permissions: contents: write` on that job. Confirmed by re-tagging
  `v1.0.0` on the fixed commit and re-running end to end.

## v1.2.1 — Release readiness fixes
### Added
- README "Download & Install": step-by-step run instructions per OS/format
  (Windows exe, Linux AppImage, Linux deb), not just a link — matches the
  actual installer filenames now produced by the build.
- GitHub repo "About" description set (was empty).

### Fixed
- `ui/package.json` version bumped from placeholder `0.0.0` to `1.0.0` —
  needed for a real tagged release to exist at all.
- `ui/electron-builder.yml`: added explicit `artifactName` for all three
  installer targets so output filenames are predictable
  (`Orion-Setup-<version>.exe`, `Orion-<version>.AppImage`,
  `orion_<version>_amd64.deb`) and match what the README tells the user to
  look for — previously left to electron-builder's defaults, which don't
  match. Verified by rebuilding both Linux targets and confirming the
  output filenames exactly.

## v1.2 — Installer packaging + autostart
### Added
- `ui/electron-builder.yml` — packaging config: NSIS installer for Windows
  (desktop + Start Menu shortcuts, user-choosable install directory),
  AppImage + `.deb` for Linux. Built and verified locally: both Linux
  targets produce real, valid installers (AppImage confirmed as a working
  ELF executable; `.deb` confirmed via `dpkg-deb -I`/`-c` to carry correct
  maintainer/homepage/description metadata and install a proper
  `.desktop` entry). The NSIS/Windows target could not be built or run in
  this environment (no Windows/Wine available) — structurally valid against
  electron-builder's schema, but unverified beyond that.
- `ui/build/icon.svg` + rendered `icon.png` — simple orbit-mark icon in the
  existing theme colors (`#010e1a` / `#29e000`), used for the app icon and
  tray icon.
- Autostart: background-scanning toggle (already existed in Settings) now
  also registers/removes an OS-level autostart entry — Windows via
  `app.setLoginItemSettings`, Linux via `~/.config/autostart/orion.desktop`.
  Synced on every launch (covers fresh installs where the toggle defaults
  on but nothing is registered yet) and on every Settings save (replaces,
  never duplicates). Launching via autostart starts minimized to tray
  (`--hidden` flag); closing the window hides to tray instead of quitting
  once a tray icon exists.
- `.github/workflows/build.yml` — runs the existing test suite on every
  push, then builds Linux (AppImage + deb) and Windows (NSIS) installers;
  on a `v*` tag, attaches them to a draft GitHub Release.
- `package.json`: added `description`, `author.email`, `homepage`,
  `desktopName` — electron-builder requires these to produce a valid
  `.deb` (build failed without them; fixed and reverified with a real
  build, not just config review).

### Fixed
- `ui/electron/main.cjs` resolved `core/`/`scripts/` paths and wrote
  `orion_state.json`/`orion_settings.json` relative to the dev repo
  checkout. In a packaged install this pointed at the app's installed
  location (`Program Files` on Windows), which isn't writable without
  admin rights. Fixed via a new `ORION_DATA_DIR` environment variable
  (read by `state_store.py` and `settings.py`, both changed minimally to
  check it first) that Electron sets to `app.getPath('userData')` only
  when packaged; dev/CLI behavior is unchanged. Verified with a real
  write-and-read test through the override before considering it fixed.
- `ui/electron-builder.yml`: two invalid config fields caught only by
  attempting a real build, not by config review — `synopsis`/`maintainer`
  were nested under `linux:` instead of the `deb:`-specific block, and
  `desktopName` isn't a valid `linux:` field in electron-builder 26.x
  (belongs in `package.json`, paired with `linux.syncDesktopName: true`).

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

### Fixed
- ShellCheck warning (SC2034) in `linux-audio-device-audit.sh` — unused
  `user`/`access` fields in the `fuser` output loop renamed to
  `_user`/`_access`.

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
- No code-signing/notarization (requires paid certificates, out of scope
  for an open-source portfolio project) — noted in README rather than
  worked around.

