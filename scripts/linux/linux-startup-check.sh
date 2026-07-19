#!/usr/bin/env bash
# Lists enabled systemd services, user crontab entries, and /etc/init.d
# scripts, flagging anything not in a small allowlist. Read-only — never
# disables anything itself; disabling is a separate user-invoked action
# recorded via state_store.py's "disabled" flag.
set -euo pipefail

ALLOWLIST_REGEX='^(ssh|cron|systemd-|dbus|network|NetworkManager|rsyslog|cups|docker|containerd|snapd|unattended-upgrades)'

if command -v systemctl >/dev/null 2>&1; then
    systemctl list-unit-files --type=service --state=enabled --no-legend 2>/dev/null | while read -r unit _; do
        name="${unit%.service}"
        [[ "$name" =~ $ALLOWLIST_REGEX ]] && continue
        esc=$(printf '%s' "$unit" | sed 's/\\/\\\\/g; s/"/\\"/g')
        printf '{"target":"systemd-unit=%s","notes":"enabled service not in allowlist"}\n' "$esc"
    done
fi

if command -v crontab >/dev/null 2>&1; then
    crontab -l 2>/dev/null | grep -Ev '^\s*(#|$)' | while read -r line; do
        esc=$(printf '%s' "$line" | sed 's/\\/\\\\/g; s/"/\\"/g')
        printf '{"target":"crontab-entry","notes":"%s"}\n' "$esc"
    done
fi

if [ -d /etc/init.d ]; then
    find /etc/init.d -maxdepth 1 -type f -executable 2>/dev/null | while read -r f; do
        base=$(basename "$f")
        [[ "$base" =~ $ALLOWLIST_REGEX ]] && continue
        esc=$(printf '%s' "$base" | sed 's/\\/\\\\/g; s/"/\\"/g')
        printf '{"target":"init.d=%s","notes":"init.d script not in allowlist"}\n' "$esc"
    done
fi
