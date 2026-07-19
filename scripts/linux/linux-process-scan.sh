#!/usr/bin/env bash
# Flags running processes executing from suspicious writable locations
# (/tmp, /dev/shm, /var/tmp) or whose backing binary has been deleted.
# Read-only. Outputs one JSON object per line to stdout for each finding.
# No findings = no output.
set -euo pipefail

SUSPICIOUS_DIRS='^(/tmp|/dev/shm|/var/tmp)/'

for pid_dir in /proc/[0-9]*; do
    pid="${pid_dir#/proc/}"
    exe_link="$pid_dir/exe"
    [ -L "$exe_link" ] || continue
    target=$(readlink "$exe_link" 2>/dev/null) || continue
    [ -n "$target" ] || continue

    reason=""
    if [[ "$target" == *" (deleted)" ]]; then
        reason="binary deleted from disk while running"
        target="${target% (deleted)}"
    elif [[ "$target" =~ $SUSPICIOUS_DIRS ]]; then
        reason="executing from world-writable temp directory"
    else
        continue
    fi

    cmd=$(tr '\0' ' ' < "$pid_dir/cmdline" 2>/dev/null || echo "unknown")
    esc_target=$(printf '%s' "$target" | sed 's/\\/\\\\/g; s/"/\\"/g')
    esc_cmd=$(printf '%s' "$cmd" | sed 's/\\/\\\\/g; s/"/\\"/g')
    printf '{"target":"pid=%s exe=%s","notes":"%s | cmdline: %s"}\n' \
        "$pid" "$esc_target" "$reason" "$esc_cmd"
done
