#!/usr/bin/env bash
# Linux installer for Orion. Idempotent — safe to re-run.
set -euo pipefail

echo "Orion installer (Linux)"

detect_pkg_mgr() {
    if command -v apt-get >/dev/null 2>&1; then echo "apt"; return; fi
    if command -v dnf >/dev/null 2>&1; then echo "dnf"; return; fi
    if command -v pacman >/dev/null 2>&1; then echo "pacman"; return; fi
    echo ""
}

PKG_MGR=$(detect_pkg_mgr)
if [ -z "$PKG_MGR" ]; then
    echo "No supported package manager found (apt/dnf/pacman). Install dependencies manually." >&2
    exit 1
fi

install_pkg() {
    local pkg="$1"
    case "$PKG_MGR" in
        apt)    dpkg -s "$pkg" >/dev/null 2>&1 || sudo apt-get install -y "$pkg" ;;
        dnf)    rpm -q "$pkg" >/dev/null 2>&1 || sudo dnf install -y "$pkg" ;;
        pacman) pacman -Qi "$pkg" >/dev/null 2>&1 || sudo pacman -S --noconfirm "$pkg" ;;
    esac
}

command -v git >/dev/null 2>&1 || install_pkg git
command -v python3 >/dev/null 2>&1 || install_pkg python3
command -v node >/dev/null 2>&1 || install_pkg nodejs
command -v clamscan >/dev/null 2>&1 || install_pkg clamav
command -v osqueryi >/dev/null 2>&1 || echo "osquery not found — install from https://osquery.io/downloads (not in default repos on most distros)"
command -v adb >/dev/null 2>&1 || install_pkg android-tools-adb 2>/dev/null || install_pkg android-tools 2>/dev/null || echo "adb not found — install your distro's android-tools package manually"
command -v ideviceinstaller >/dev/null 2>&1 || install_pkg libimobiledevice-utils 2>/dev/null || install_pkg libimobiledevice 2>/dev/null || echo "libimobiledevice not found — install manually"
command -v notify-send >/dev/null 2>&1 || install_pkg libnotify-bin 2>/dev/null || install_pkg libnotify 2>/dev/null || true

python3 -m pip show plyer >/dev/null 2>&1 || python3 -m pip install --user plyer

if [ -d "$(dirname "$0")/ui" ] && command -v npm >/dev/null 2>&1; then
    (cd "$(dirname "$0")/ui" && npm install)
fi

chmod +x "$(dirname "$0")"/scripts/linux/*.sh 2>/dev/null || true

echo "Orion install complete."
echo "Next: set up scheduling, e.g. a systemd timer or cron entry running"
echo "  python3 $(dirname "$0")/core/orchestrator.py"
