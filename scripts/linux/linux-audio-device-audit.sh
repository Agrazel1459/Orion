#!/usr/bin/env bash
# Audits which processes currently hold open handles to audio/video capture
# devices (/dev/snd/*, /dev/video*) and flags any not in the allowlist.
# This is an audit + revoke-pointer tool, not a real-time "hacker blocker":
# it tells you who has mic/cam access right now so you can revoke it via
# your OS's privacy settings or `fuser -k`.
set -euo pipefail

ALLOWLIST_REGEX='^(pulseaudio|pipewire|pipewire-pulse|wireplumber|alsactl)$'

command -v fuser >/dev/null 2>&1 || { echo '{"target":"fuser","notes":"fuser not found, skipping audio device audit"}'; exit 0; }

shopt -s nullglob
devices=(/dev/snd/* /dev/video*)
shopt -u nullglob

for dev in "${devices[@]}"; do
    [ -e "$dev" ] || continue
    out=$(fuser -v "$dev" 2>/dev/null || true)
    [ -n "$out" ] || continue
    echo "$out" | tail -n +2 | while read -r _user pid _access cmd; do
        [ -n "$pid" ] || continue
        [[ "$cmd" =~ $ALLOWLIST_REGEX ]] && continue
        esc_dev=$(printf '%s' "$dev" | sed 's/\\/\\\\/g; s/"/\\"/g')
        esc_cmd=$(printf '%s' "$cmd" | sed 's/\\/\\\\/g; s/"/\\"/g')
        printf '{"target":"device=%s pid=%s proc=%s","notes":"holds audio/video device, not in allowlist"}\n' \
            "$esc_dev" "$pid" "$esc_cmd"
    done
done
