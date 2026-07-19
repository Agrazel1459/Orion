# Lists TCP listeners bound to all interfaces (0.0.0.0) and flags any owned
# by a process not in a small allowlist. Read-only audit, not a firewall.
$ErrorActionPreference = "SilentlyContinue"

$allowlist = @("svchost", "System", "lsass", "wininit", "services", "MsMpEng")

Get-NetTCPConnection -State Listen | Where-Object { $_.LocalAddress -eq "0.0.0.0" } | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    $pname = if ($proc) { $proc.ProcessName } else { "unknown" }

    if ($allowlist -contains $pname) { return }

    $finding = [ordered]@{
        target = "port=$($_.LocalPort) proc=$pname pid=$($_.OwningProcess)"
        notes  = "listening on all interfaces, not in allowlist"
    }
    $finding | ConvertTo-Json -Compress
}
