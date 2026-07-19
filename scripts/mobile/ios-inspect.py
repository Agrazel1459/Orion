"""
Read-only iOS inspection via libimobiledevice (cable-connected,
user-confirmed). Lists installed apps and configuration profiles only.
No background/continuous monitoring is possible on iOS by OS design;
this script performs a single point-in-time check.
"""
import subprocess
import sys

sys.path.insert(0, "../..")
from core.state_store import add_finding  # noqa: E402

SOURCE = "ios-inspect.py"


def run(cmd):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.stdout
    except Exception as e:
        return f"ERROR: {e}"


def inspect(udid):
    apps_out = run(["ideviceinstaller", "-u", udid, "-l"])
    for line in apps_out.strip().splitlines():
        if " - " not in line:
            continue
        bundle_id = line.split(",")[0].strip()
        add_finding(SOURCE, f"ios-app={bundle_id}", "installed app, for review")

    profiles_out = run(["ideviceprovision", "-u", udid, "list"])
    if profiles_out.strip() and not profiles_out.startswith("ERROR"):
        for line in profiles_out.strip().splitlines():
            if line.strip():
                add_finding(SOURCE, f"ios-profile={line.strip()}", "configuration profile installed, for review")


def main():
    if len(sys.argv) < 2:
        print("usage: ios-inspect.py <device-udid>", file=sys.stderr)
        return 1
    inspect(sys.argv[1])
    return 0


if __name__ == "__main__":
    sys.exit(main())
