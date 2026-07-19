#!/usr/bin/env bash
# Lists processes with LISTENing TCP sockets bound to all interfaces (0.0.0.0
# or ::) and flags any whose owning binary is not present in a small
# allowlist of common legitimate services. Read-only audit, not a firewall.
set -euo pipefail

ALLOWLIST_REGEX='^(sshd|systemd|systemd-resolve|cupsd|dockerd|containerd|nginx|apache2|httpd)$'

command -v ss >/dev/null 2>&1 || { echo '{"target":"ss","notes":"ss not found, skipping network scan"}'; exit 0; }

ss -ltnp 2>/dev/null | tail -n +2 | while read -r line; do
    local_addr=$(awk '{print $4}' <<< "$line")
    [[ "$local_addr" == 0.0.0.0:* || "$local_addr" == \[::\]:* || "$local_addr" == :::* ]] || continue

    proc_field=$(awk '{print $NF}' <<< "$line")
    pname=$(sed -n 's/.*users:(("\([^"]*\)".*/\1/p' <<< "$proc_field")
    [ -n "$pname" ] || pname="unknown"

    if [[ "$pname" =~ $ALLOWLIST_REGEX ]]; then
        continue
    fi

    esc_addr=$(printf '%s' "$local_addr" | sed 's/\\/\\\\/g; s/"/\\"/g')
    esc_name=$(printf '%s' "$pname" | sed 's/\\/\\\\/g; s/"/\\"/g')
    printf '{"target":"listener=%s proc=%s","notes":"listening on all interfaces, not in allowlist"}\n' \
        "$esc_addr" "$esc_name"
done
