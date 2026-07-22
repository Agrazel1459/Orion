"""
Persists user-configurable settings (Settings screen) to a small JSON file
alongside orion_state.json. New capability — does not modify state_store.py's
finding schema or logic.
"""
import json
import os

from config import USER_INTERVAL_FILE_NAME, DEFAULT_USER_INTERVAL_MINUTES

SETTINGS_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), USER_INTERVAL_FILE_NAME
)

DEFAULTS = {
    "background_scanning_enabled": True,
    "interval_minutes": DEFAULT_USER_INTERVAL_MINUTES,
    "notifications_enabled": True,
}


def load_settings():
    if not os.path.exists(SETTINGS_FILE):
        return dict(DEFAULTS)
    with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
        content = f.read().strip()
        if not content:
            return dict(DEFAULTS)
        data = json.loads(content)
        merged = dict(DEFAULTS)
        merged.update(data)
        return merged


def save_settings(settings):
    merged = load_settings()
    merged.update(settings)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2)
    return merged


def _self_test():
    real_exists = os.path.exists(SETTINGS_FILE)
    backup = None
    if real_exists:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            backup = f.read()
        os.remove(SETTINGS_FILE)

    s = load_settings()
    assert s["interval_minutes"] == DEFAULT_USER_INTERVAL_MINUTES, "default interval wrong"
    save_settings({"interval_minutes": 30})
    s2 = load_settings()
    assert s2["interval_minutes"] == 30, "interval not persisted"
    assert s2["background_scanning_enabled"] is True, "other field lost on partial save"
    os.remove(SETTINGS_FILE)

    if backup is not None:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            f.write(backup)

    print("settings.py self-test: PASS")


if __name__ == "__main__":
    _self_test()
