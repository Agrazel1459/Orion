# Audits which apps currently have microphone/camera consent per Windows
# privacy settings (registry-based consent store) and flags unrecognized
# ones. This is audit + one-command revoke-pointer, NOT a real-time
# "block hacker from speaking through speakers" guarantee — no such
# real-time guarantee is technically honest to make.
$ErrorActionPreference = "SilentlyContinue"

$allowlist = @("Microsoft.WindowsCamera", "Microsoft.Windows.Cortana", "Teams", "Zoom")

$paths = @(
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam"
)

foreach ($base in $paths) {
    $device = if ($base -like "*microphone") { "microphone" } else { "webcam" }
    Get-ChildItem -Path $base -ErrorAction SilentlyContinue | ForEach-Object {
        $appName = Split-Path $_.PSPath -Leaf
        $props = Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue
        if ($props.Value -ne "Allow") { return }
        if ($allowlist -contains $appName) { return }

        $finding = [ordered]@{
            target = "device=$device app=$appName"
            notes  = "has active consent, not in allowlist | revoke via Settings > Privacy > $device"
        }
        $finding | ConvertTo-Json -Compress
    }
}
