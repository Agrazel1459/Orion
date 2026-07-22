#!/usr/bin/env bash
# Reads installed browser extension manifests (Chrome/Chromium/Firefox) and
# flags ones requesting a broad set of high-impact permissions. Read-only
# local file inspection only — no browser API calls, no network requests,
# no store-listing lookups (that would require network access this script
# intentionally doesn't take). "Not in the store" claims are NOT made here
# for that reason; flags are permission-based only.
set -uo pipefail

HIGH_IMPACT_PERMS_REGEX='"(<all_urls>|webRequest|webRequestBlocking|proxy|debugger|nativeMessaging|management|history|tabs)"'

scan_chromium_profile() {
    local ext_root="$1"
    local browser_label="$2"
    [ -d "$ext_root" ] || return 0
    find "$ext_root" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | while read -r ext_dir; do
        ext_id=$(basename "$ext_dir")
        manifest=$(find "$ext_dir" -maxdepth 2 -name manifest.json 2>/dev/null | head -n1)
        [ -n "$manifest" ] || continue
        name=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$manifest" 2>/dev/null | head -n1 | sed 's/.*: *"//; s/"$//')
        [ -n "$name" ] || name="$ext_id"

        perms_blob=$(grep -A20 '"permissions"' "$manifest" 2>/dev/null | head -25)
        if echo "$perms_blob" | grep -qE "$HIGH_IMPACT_PERMS_REGEX"; then
            esc_name=$(printf '%s' "$name" | sed 's/\\/\\\\/g; s/"/\\"/g')
            printf '{"target":"%s-extension=%s (%s)","notes":"requests high-impact permissions (broad host access, webRequest, tabs, or similar), review manually"}\n' \
                "$browser_label" "$ext_id" "$esc_name"
        fi
    done
}

scan_firefox_profile() {
    local profiles_root="$1"
    [ -d "$profiles_root" ] || return 0
    find "$profiles_root" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | while read -r profile_dir; do
        ext_dir="$profile_dir/extensions"
        [ -d "$ext_dir" ] || continue
        find "$ext_dir" -mindepth 1 -maxdepth 1 \( -type d -o -name "*.xpi" \) 2>/dev/null | while read -r ext_path; do
            base=$(basename "$ext_path")
            printf '{"target":"firefox-extension=%s","notes":"installed extension, manifest permission parsing not available for .xpi packages, review manually"}\n' \
                "$base"
        done
    done
}

scan_chromium_profile "$HOME/.config/google-chrome/Default/Extensions" "chrome"
scan_chromium_profile "$HOME/.config/chromium/Default/Extensions" "chromium"
scan_chromium_profile "$HOME/.config/microsoft-edge/Default/Extensions" "edge"
scan_firefox_profile "$HOME/.mozilla/firefox"

exit 0
