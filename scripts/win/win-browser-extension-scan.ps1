# Reads installed browser extension manifests (Chrome, Edge, Firefox) and
# flags ones requesting a broad set of high-impact permissions. Read-only
# local file inspection only — no browser API calls, no network requests,
# no store-listing lookups. Flags are permission-based only.
$ErrorActionPreference = "SilentlyContinue"

$highImpactPerms = @("<all_urls>", "webRequest", "webRequestBlocking", "proxy", "debugger", "nativeMessaging", "management", "history", "tabs")

function Scan-ChromiumProfile {
    param([string]$ExtRoot, [string]$BrowserLabel)
    if (-not (Test-Path $ExtRoot)) { return }

    Get-ChildItem -Path $ExtRoot -Directory | ForEach-Object {
        $extId = $_.Name
        $manifest = Get-ChildItem -Path $_.FullName -Filter "manifest.json" -Recurse -Depth 2 | Select-Object -First 1
        if (-not $manifest) { return }

        try {
            $json = Get-Content $manifest.FullName -Raw | ConvertFrom-Json
        } catch {
            return
        }

        $name = if ($json.name) { $json.name } else { $extId }
        $perms = @()
        if ($json.permissions) { $perms += $json.permissions }
        if ($json.host_permissions) { $perms += $json.host_permissions }

        $hit = $perms | Where-Object { $highImpactPerms -contains $_ -or $_ -like "*://*/*" }
        if ($hit) {
            $finding = [ordered]@{
                target = "$BrowserLabel-extension=$extId ($name)"
                notes  = "requests high-impact permissions (broad host access, webRequest, tabs, or similar), review manually"
            }
            $finding | ConvertTo-Json -Compress
        }
    }
}

function Scan-FirefoxProfiles {
    param([string]$ProfilesRoot)
    if (-not (Test-Path $ProfilesRoot)) { return }

    Get-ChildItem -Path $ProfilesRoot -Directory | ForEach-Object {
        $extDir = Join-Path $_.FullName "extensions"
        if (-not (Test-Path $extDir)) { return }
        Get-ChildItem -Path $extDir | ForEach-Object {
            $finding = [ordered]@{
                target = "firefox-extension=$($_.Name)"
                notes  = "installed extension, manifest permission parsing not available for packaged .xpi, review manually"
            }
            $finding | ConvertTo-Json -Compress
        }
    }
}

Scan-ChromiumProfile -ExtRoot "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions" -BrowserLabel "chrome"
Scan-ChromiumProfile -ExtRoot "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Extensions" -BrowserLabel "edge"
Scan-FirefoxProfiles -ProfilesRoot "$env:APPDATA\Mozilla\Firefox\Profiles"
