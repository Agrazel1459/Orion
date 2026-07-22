import json
import os
import uuid
from datetime import datetime, timezone

STATE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "orion_state.json")

DEFAULT_FLAGS = {
    "false_positive_reviewed": False,
    "disabled": False,
    "terminated": False,
    "rejected": False,
}


def _load():
    if not os.path.exists(STATE_FILE):
        return []
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        content = f.read().strip()
        return json.loads(content) if content else []


def _save(entries):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2)


def add_finding(source_script, target, notes=""):
    entries = _load()
    entry = {
        "id": str(uuid.uuid4()),
        "detected_at": datetime.now(timezone.utc).isoformat(),
        "source_script": source_script,
        "target": target,
        "flags": dict(DEFAULT_FLAGS),
        "notes": notes,
    }
    entries.append(entry)
    _save(entries)
    return entry["id"]


def set_flag(entry_id, flag_name, value=True):
    if flag_name not in DEFAULT_FLAGS:
        raise ValueError(f"unknown flag: {flag_name}")
    entries = _load()
    for e in entries:
        if e["id"] == entry_id:
            e["flags"][flag_name] = value
            _save(entries)
            return True
    return False


def get_all():
    return _load()


def get_unreviewed():
    return [e for e in _load() if not e["flags"]["false_positive_reviewed"]]


def delete_entry(entry_id):
    """Removes Orion's record of a finding only. Does not touch the
    underlying process/file/entry that was originally flagged — UI-only,
    user-initiated action, distinct from the backend's own never-delete
    scripts."""
    entries = _load()
    filtered = [e for e in entries if e["id"] != entry_id]
    if len(filtered) == len(entries):
        return False
    _save(filtered)
    return True


def _run_cli(argv):
    """Thin CLI wrapper so Electron's main process can call this file as a
    subprocess (IPC bridge) instead of duplicating state logic in JS."""
    cmd = argv[0]
    if cmd == "get_all":
        print(json.dumps(get_all()))
    elif cmd == "add_finding" and len(argv) >= 3:
        print(add_finding(argv[1], argv[2], argv[3] if len(argv) > 3 else ""))
    elif cmd == "set_flag" and len(argv) >= 3:
        val = argv[3].lower() != "false" if len(argv) > 3 else True
        print(json.dumps(set_flag(argv[1], argv[2], val)))
    elif cmd == "delete_entry" and len(argv) >= 2:
        print(json.dumps(delete_entry(argv[1])))
    else:
        print(f"unknown command: {argv}", file=__import__("sys").stderr)
        return 1
    return 0


def _self_test():
    if os.path.exists(STATE_FILE):
        os.remove(STATE_FILE)
    eid = add_finding("self-test", "dummy-target", "self-test entry")
    assert any(e["id"] == eid for e in get_all()), "write failed"
    assert set_flag(eid, "disabled", True), "flag flip failed"
    entries = get_all()
    match = [e for e in entries if e["id"] == eid][0]
    assert match["flags"]["disabled"] is True, "flag not persisted"
    assert match["flags"]["terminated"] is False, "other flags mutated"

    eid2 = add_finding("self-test", "second-target", "kept entry")
    assert delete_entry(eid), "delete failed"
    remaining = get_all()
    assert len(remaining) == 1 and remaining[0]["id"] == eid2, "delete removed wrong entry(ies)"
    assert delete_entry("nonexistent-id") is False, "delete of missing id should return False"

    os.remove(STATE_FILE)
    print("state_store.py self-test: PASS")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        sys.exit(_run_cli(sys.argv[1:]))
    else:
        _self_test()
