"""
Runs on the PC as part of the normal orchestrator cycle. Detects a newly
connected phone (Android via adb, iOS via libimobiledevice), and if found,
asks the user (terminal prompt + notification) whether to run a read-only
security check. Never installs anything on the phone, never writes to it.
"""
import platform
import shutil
import subprocess
import sys

sys.path.insert(0, "..")
from core.notify import notify  # noqa: E402


def list_android_devices():
    if not shutil.which("adb"):
        return []
    try:
        out = subprocess.run(["adb", "devices"], capture_output=True, text=True, timeout=10)
        lines = out.stdout.strip().splitlines()[1:]
        return [line.split("\t")[0] for line in lines if line.strip() and "device" in line]
    except Exception:
        return []


def list_ios_devices():
    if not shutil.which("idevice_id"):
        return []
    try:
        out = subprocess.run(["idevice_id", "-l"], capture_output=True, text=True, timeout=10)
        return [d for d in out.stdout.strip().splitlines() if d.strip()]
    except Exception:
        return []


def prompt_yes_no(message):
    notify("Phone detected", message)
    try:
        ans = input(f"{message} [y/n]: ").strip().lower()
    except EOFError:
        return False
    return ans == "y"


def main():
    android = list_android_devices()
    ios = list_ios_devices()

    if not android and not ios:
        return 0

    for serial in android:
        if prompt_yes_no(f"Android device {serial} detected. Run read-only security check?"):
            subprocess.run([sys.executable, "android-inspect.py", serial])

    for udid in ios:
        if prompt_yes_no(f"iOS device {udid} detected. Run read-only security check?"):
            subprocess.run([sys.executable, "ios-inspect.py", udid])

    return 0


if __name__ == "__main__":
    sys.exit(main())
