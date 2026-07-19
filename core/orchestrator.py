"""
Ties together platform-appropriate scripts. Invoked BY the OS scheduler
(Task Scheduler / systemd timer / cron) each cycle — does one pass, exits.
Not a persistent Python loop.
"""
import json
import platform
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import SCRIPT_TIMEOUT_SECONDS, NOTIFY_TITLE_CLEAN, NOTIFY_MSG_CLEAN, NOTIFY_MSG_FLAGGED  # noqa: E402
from notify import notify  # noqa: E402
from state_store import add_finding  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent

WIN_SCRIPTS = [
    "win-process-scan.ps1",
    "win-network-scan.ps1",
    "win-startup-check.ps1",
    "win-audio-device-audit.ps1",
    "win-remote-access-check.ps1",
]

LINUX_SCRIPTS = [
    "linux-process-scan.sh",
    "linux-network-scan.sh",
    "linux-startup-check.sh",
    "linux-audio-device-audit.sh",
]


def run_script(path, invoker):
    try:
        result = subprocess.run(
            invoker + [str(path)],
            capture_output=True, text=True, timeout=SCRIPT_TIMEOUT_SECONDS
        )
        return result.stdout, result.returncode
    except subprocess.TimeoutExpired:
        return "", -1


def parse_and_record(stdout, source_name):
    count = 0
    for line in stdout.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            finding = json.loads(line)
        except json.JSONDecodeError:
            continue
        add_finding(source_name, finding.get("target", "unknown"), finding.get("notes", ""))
        count += 1
    return count


def run_cycle():
    system = platform.system()
    start = time.time()
    total_flagged = 0
    scripts_run = 0

    if system == "Windows":
        script_dir = ROOT / "scripts" / "win"
        for name in WIN_SCRIPTS:
            path = script_dir / name
            if not path.exists():
                continue
            stdout, code = run_script(path, ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File"])
            total_flagged += parse_and_record(stdout, name)
            scripts_run += 1

        mobile_listener = ROOT / "scripts" / "mobile" / "mobile-connect-listener.py"
        if mobile_listener.exists():
            run_script(mobile_listener, [sys.executable])
            scripts_run += 1

    elif system == "Linux":
        script_dir = ROOT / "scripts" / "linux"
        for name in LINUX_SCRIPTS:
            path = script_dir / name
            if not path.exists():
                continue
            stdout, code = run_script(path, ["bash"])
            total_flagged += parse_and_record(stdout, name)
            scripts_run += 1

        mobile_listener = ROOT / "scripts" / "mobile" / "mobile-connect-listener.py"
        if mobile_listener.exists():
            run_script(mobile_listener, [sys.executable])
            scripts_run += 1

    else:
        print(f"orchestrator: unsupported platform {system}", file=sys.stderr)
        return 1

    elapsed = time.time() - start

    if total_flagged == 0:
        notify(NOTIFY_TITLE_CLEAN, NOTIFY_MSG_CLEAN)
    else:
        notify(NOTIFY_TITLE_CLEAN, NOTIFY_MSG_FLAGGED.format(n=total_flagged))

    print(f"orchestrator: scripts_run={scripts_run} flagged={total_flagged} elapsed={elapsed:.2f}s")
    return 0


if __name__ == "__main__":
    sys.exit(run_cycle())
