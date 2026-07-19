# Checks the status of common remote-access vectors: RDP enabled, PSRemoting
# enabled, and any known remote-access tools (TeamViewer, AnyDesk, VNC)
# currently installed or running. Read-only, flags for user review only.
$ErrorActionPreference = "SilentlyContinue"

$rdp = Get-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server" -Name "fDenyTSConnections" -ErrorAction SilentlyContinue
if ($rdp -and $rdp.fDenyTSConnections -eq 0) {
    $finding = [ordered]@{
        target = "RDP"
        notes  = "Remote Desktop is enabled on this machine"
    }
    $finding | ConvertTo-Json -Compress
}

$psRemoting = Get-Service -Name WinRM -ErrorAction SilentlyContinue
if ($psRemoting -and $psRemoting.Status -eq "Running") {
    $finding = [ordered]@{
        target = "WinRM"
        notes  = "PowerShell Remoting service (WinRM) is running"
    }
    $finding | ConvertTo-Json -Compress
}

$remoteTools = @("TeamViewer", "AnyDesk", "vncserver", "vncviewer", "UltraVNC", "RustDesk")
foreach ($name in $remoteTools) {
    $proc = Get-Process -Name $name -ErrorAction SilentlyContinue
    if ($proc) {
        $finding = [ordered]@{
            target = "remote-tool=$name"
            notes  = "remote access tool currently running"
        }
        $finding | ConvertTo-Json -Compress
    }
}
