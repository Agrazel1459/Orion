# Windows installer for Orion. Idempotent — safe to re-run.
$ErrorActionPreference = "Stop"

Write-Host "Orion installer (Windows)"

function Test-Cmd($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-Cmd "winget")) {
    Write-Warning "winget not found. Install App Installer from the Microsoft Store, then re-run."
    exit 1
}

if (-not (Test-Cmd "git")) {
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
} else {
    Write-Host "git: already present, skip"
}

if (-not (Test-Cmd "python")) {
    winget install --id Python.Python.3.12 -e --source winget --accept-package-agreements --accept-source-agreements
} else {
    Write-Host "python: already present, skip"
}

if (-not (Test-Cmd "node")) {
    winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
} else {
    Write-Host "node: already present, skip"
}

if (-not (Test-Cmd "clamscan")) {
    winget install --id ClamAV.ClamAV -e --source winget --accept-package-agreements --accept-source-agreements
    Write-Warning "After install, add ClamAV's bin folder to PATH and run freshclam."
} else {
    Write-Host "clamscan: already present, skip"
}

if (-not (Test-Cmd "osqueryi")) {
    winget install --id osquery.osquery -e --source winget --accept-package-agreements --accept-source-agreements
} else {
    Write-Host "osqueryi: already present, skip"
}

if (-not (Test-Cmd "adb")) {
    winget install --id Google.PlatformTools -e --source winget --accept-package-agreements --accept-source-agreements
} else {
    Write-Host "adb: already present, skip"
}

if (-not (Test-Cmd "ideviceinstaller")) {
    Write-Warning "libimobiledevice has no winget package; install manually from https://github.com/libimobiledevice/libimobiledevice and add to PATH."
} else {
    Write-Host "ideviceinstaller: already present, skip"
}

$pipShow = pip show win10toast 2>$null
if (-not $pipShow) {
    pip install win10toast
} else {
    Write-Host "win10toast: already present, skip"
}

Write-Host "Orion install complete."

$uiDir = Join-Path $PSScriptRoot "ui"
if ((Test-Path $uiDir) -and (Test-Cmd "npm")) {
    Push-Location $uiDir
    npm install
    Pop-Location
}

Write-Host "Next: set up scheduling, e.g.:"
Write-Host '  schtasks /create /tn "Orion" /tr "python core\orchestrator.py" /sc minute /mo 30 /rl highest'
