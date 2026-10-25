#!/usr/bin/env python3
"""Adw Lite — liste les classes hachées du CSS client qui n'existent plus dans Steam.

Steam régénère ses noms de classes à chaque grosse mise à jour : les règles qui
les ciblent cessent alors de s'appliquer sans aucune erreur. Ce script compare
millennium/adwaita.min.css aux fichiers du client (steamui) et affiche, pour
chaque classe disparue, son nom d'origine quand le commentaire du source le donne.

    python3 tools/check-classes.py [chemin/vers/Steam/steamui]
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

    # noms d'origine tirés des commentaires « div.hash /* Nom */ » des sources
    names = {}
    for path in glob.glob(os.path.join(ROOT, "src/**/*.css"), recursive=True):
        for h, n in re.findall(r"\.([\w-]{18,24})[^\n{,]*?/\*\s*\.?([\w.: -]+?)\s*\*/", open(path, encoding="utf-8").read()):
            names.setdefault(h, n)

    stale = sorted(c for c in used if c not in known)
    print(f"{len(used)} classes hachées utilisées, {len(stale)} introuvables dans {STEAMUI}")
    for c in stale:
        print(f"  {c}  {names.get(c, '')}")


if __name__ == "__main__":
    main()
