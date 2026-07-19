# Flags running processes whose executable lives in a commonly-abused
# writable temp directory, or whose executable path no longer exists on
# disk. Read-only. Emits one JSON line per finding to stdout.
$ErrorActionPreference = "SilentlyContinue"

$suspiciousDirs = @(
    "$env:TEMP",
    "$env:LOCALAPPDATA\Temp",
    "C:\Windows\Temp"
) | Where-Object { $_ } | ForEach-Object { $_.ToLower() }

Get-CimInstance Win32_Process | ForEach-Object {
    $path = $_.ExecutablePath
    if (-not $path) { return }

    $reason = $null
    if (-not (Test-Path -LiteralPath $path)) {
        $reason = "executable path no longer exists on disk"
    } else {
        $lowerPath = $path.ToLower()
        foreach ($dir in $suspiciousDirs) {
            if ($lowerPath.StartsWith($dir)) {
                $reason = "executing from writable temp directory"
                break
            }
        }
    }

    if ($reason) {
        $finding = [ordered]@{
            target = "pid=$($_.ProcessId) exe=$path"
            notes  = "$reason | name: $($_.Name)"
        }
        $finding | ConvertTo-Json -Compress
    }
}
