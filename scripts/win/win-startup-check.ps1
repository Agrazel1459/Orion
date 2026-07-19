# Lists startup commands (Win32_StartupCommand) and, if Sysinternals
# Autoruns CLI (autorunsc.exe) is present on PATH, cross-checks against it
# for a fuller persistence view. Flags anything not in a small allowlist.
# Read-only — never disables anything itself.
$ErrorActionPreference = "SilentlyContinue"

$allowlist = @("OneDrive", "SecurityHealth", "Windows Security notification icon")

Get-CimInstance Win32_StartupCommand | ForEach-Object {
    if ($allowlist -contains $_.Name) { return }
    $finding = [ordered]@{
        target = "startup=$($_.Name) command=$($_.Command)"
        notes  = "startup entry not in allowlist | location: $($_.Location)"
    }
    $finding | ConvertTo-Json -Compress
}

if (Get-Command autorunsc.exe -ErrorAction SilentlyContinue) {
    $json = & autorunsc.exe -accepteula -a * -c -h -s 2>$null
    if ($json) {
        try {
            $entries = $json | ConvertFrom-Csv
            foreach ($e in $entries) {
                if ($allowlist -contains $e.Entry) { continue }
                $finding = [ordered]@{
                    target = "autoruns=$($e.Entry) location=$($e."Entry Location")"
                    notes  = "flagged by autorunsc, not in allowlist"
                }
                $finding | ConvertTo-Json -Compress
            }
        } catch {
            # autorunsc output format varies by version; skip cross-check
            # rather than fail the whole script.
        }
    }
} else {
    $finding = [ordered]@{
        target = "autorunsc.exe"
        notes  = "not found on PATH, skipping Autoruns cross-check (optional)"
    }
    $finding | ConvertTo-Json -Compress
}
