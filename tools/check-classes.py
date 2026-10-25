#!/usr/bin/env python3
"""Adw Lite — lists the hashed classes of the client CSS that no longer exist in Steam.

Steam regenerates its class names with every major update: rules that target
them then silently stop applying, without any error. This script compares
millennium/adwaita.min.css with the client files (steamui) and prints, for
each missing class, its original name when the source comment provides it.

    python3 tools/check-classes.py [path/to/Steam/steamui]
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STEAMUI = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/.local/share/Steam/steamui")
HASHED = re.compile(r"\.(-?_?[A-Za-z0-9_-]{18,24})(?![\w-])")


def is_hash(name):
    return re.search(r"[A-Z]", name) and re.search(r"[a-z]", name) and re.search(r"\d|_", name)


def main():
    css = open(os.path.join(ROOT, "millennium/adwaita.min.css"), encoding="utf-8").read()
    css = re.sub(r"url\([^)]*\)", "", css)
    used = {c for c in HASHED.findall(css) if is_hash(c)}

    known = set()
    for path in glob.glob(os.path.join(STEAMUI, "**/*.*"), recursive=True):
        if path.endswith((".js", ".css")):
            known |= set(re.findall(r"[A-Za-z0-9_-]{18,24}", open(path, errors="ignore").read()))

    # original names taken from the "div.hash /* Name */" comments in the sources
    names = {}
    for path in glob.glob(os.path.join(ROOT, "src/**/*.css"), recursive=True):
        for h, n in re.findall(r"\.([\w-]{18,24})[^\n{,]*?/\*\s*\.?([\w.: -]+?)\s*\*/", open(path, encoding="utf-8").read()):
            names.setdefault(h, n)

    stale = sorted(c for c in used if c not in known)
    print(f"{len(used)} hashed classes used, {len(stale)} not found in {STEAMUI}")
    for c in stale:
        print(f"  {c}  {names.get(c, '')}")


if __name__ == "__main__":
    main()
