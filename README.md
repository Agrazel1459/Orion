# Orion

Orion is a small collection of single-purpose scripts that check a Windows
or Linux machine for common signs of compromise, log what they find, and
send you one notification per scan cycle. It is a defensive audit toolkit,
not a guarantee of anything and not a replacement for a real incident
response process if you actually suspect you're compromised. It doesn't
delete files, doesn't phone home, and doesn't run anything you haven't
explicitly installed and scheduled yourself.

## Quick start

**Linux:**
```
git clone <this-repo-url> orion && cd orion
chmod +x install.sh && ./install.sh
```

**Windows (PowerShell, as Administrator):**
```
git clone <this-repo-url> orion; cd orion
.\install.ps1
```

Both installers are idempotent — safe to run more than once.

## What each script does

| Script | What it does |
|---|---|
| win-process-scan.ps1 | Flags Windows processes running from temp dirs or with a missing executable file |
| win-network-scan.ps1 | Flags TCP listeners bound to all interfaces, not in a small allowlist |
| win-startup-check.ps1 | Flags startup entries not in a small allowlist; cross-checks Autoruns if present |
| win-audio-device-audit.ps1 | Flags apps with active mic/webcam consent, not in a small allowlist |
| win-remote-access-check.ps1 | Reports RDP/WinRM status and any running remote-access tools |
| linux-process-scan.sh | Flags Linux processes in writable temp dirs or with a deleted backing binary |
| linux-network-scan.sh | Flags TCP listeners bound to all interfaces, not in a small allowlist |
| linux-startup-check.sh | Flags enabled systemd services, cron entries, init.d scripts not in a small allowlist |
| linux-audio-device-audit.sh | Flags processes holding open audio/video device handles, not in a small allowlist |
| mobile-connect-listener.py | Watches for a phone connecting over USB, asks before inspecting it |
| android-inspect.py | Read-only Android check over ADB: third-party packages, device admin, accessibility services |
| ios-inspect.py | Read-only iOS check over libimobiledevice: installed apps, config profiles |
| orchestrator.py | Runs the platform-appropriate script set once, aggregates, fires one notification |
| notify.py | Cross-platform notification helper |
| state_store.py | Reads/writes orion_state.json |
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
