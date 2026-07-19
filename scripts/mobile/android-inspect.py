"""
Read-only Android inspection over ADB (cable-connected, user-confirmed).
Lists installed packages and a small set of safe dumpsys checks. Writes
findings into orion_state.json on the PC. Never modifies the phone.
"""
import subprocess
import sys

sys.path.insert(0, "../..")
from core.state_store import add_finding  # noqa: E402

SOURCE = "android-inspect.py"

# Packages considered normal/expected; anything outside common known-good
# prefixes gets listed for user review, not accused of being malicious.
KNOWN_GOOD_PREFIXES = ("com.android.", "com.google.android.", "android")


def adb(serial, *args):
    cmd = ["adb", "-s", serial] + list(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.stdout
    except Exception as e:
        return f"ERROR: {e}"


def inspect(serial):
    packages_out = adb(serial, "shell", "pm", "list", "packages", "-3")  # third-party only
    for line in packages_out.strip().splitlines():
        pkg = line.replace("package:", "").strip()
        if not pkg:
            continue
        if pkg.startswith(KNOWN_GOOD_PREFIXES):
            continue
        add_finding(SOURCE, f"android-package={pkg}", "third-party installed package, for review")

    device_admin_out = adb(serial, "shell", "dumpsys", "device_policy")
    if "Active admins" in device_admin_out and "N/A" not in device_admin_out[:200]:
        add_finding(SOURCE, f"android-device={serial}", "device admin apps present, review dumpsys device_policy output")

    accessibility_out = adb(serial, "shell", "settings", "get", "secure", "enabled_accessibility_services")
    if accessibility_out.strip() not in ("", "null"):
        add_finding(SOURCE, f"android-device={serial}",
                    f"accessibility services enabled: {accessibility_out.strip()} (common abuse vector, review)")


def main():
    if len(sys.argv) < 2:
        print("usage: android-inspect.py <device-serial>", file=sys.stderr)
        return 1
    inspect(sys.argv[1])
    return 0


if __name__ == "__main__":
    sys.exit(main())
