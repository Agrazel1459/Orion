#!/usr/bin/env python3
"""Regenerates orion-manifest.json from the actual files in scripts/ + core/.
Run this after adding/removing/renaming any script. Do not hand-edit the
manifest.
"""
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))


def main():
    files = []
    for sub in ("win", "linux", "mobile"):
        d = os.path.join(ROOT, "scripts", sub)
        for f in sorted(os.listdir(d)):
            if f.endswith((".ps1", ".sh", ".py")):
                files.append(f)

    core_dir = os.path.join(ROOT, "core")
    for f in sorted(os.listdir(core_dir)):
        if f.endswith(".py"):
            files.append(f)

    out_path = os.path.join(ROOT, "orion-manifest.json")
    with open(out_path, "w") as out:
        json.dump(files, out, indent=2)
        out.write("\n")
    print(f"wrote {out_path} ({len(files)} entries)")


if __name__ == "__main__":
    main()
