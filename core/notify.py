import platform
import shutil
import subprocess
import sys


def notify(title, message):
    system = platform.system()
    if system == "Windows":
        try:
            from win10toast import ToastNotifier
            ToastNotifier().show_toast(title, message, duration=15, threaded=True)
            return True
        except Exception as e:
            print(f"notify: win10toast failed: {e}", file=sys.stderr)
            return False
    elif system == "Linux":
        if shutil.which("notify-send"):
            try:
                subprocess.run(["notify-send", title, message], check=True)
                return True
            except Exception as e:
                print(f"notify: notify-send failed: {e}", file=sys.stderr)
        try:
            from plyer import notification
            notification.notify(title=title, message=message, timeout=15)
            return True
        except Exception as e:
            print(f"notify: plyer failed: {e}", file=sys.stderr)
            return False
    else:
        print(f"notify: unsupported platform {system}", file=sys.stderr)
        return False


if __name__ == "__main__":
    ok = notify("Orion self-test", "notify.py test notification")
    print(f"notify.py self-test: {'PASS' if ok else 'FAIL (no backend available in this environment)'}")
