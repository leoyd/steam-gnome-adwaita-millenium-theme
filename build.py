#!/usr/bin/env python3
"""Adw Lite — construit les deux fichiers chargés par Millennium.

    src/client.css        -> millennium/adwaita.min.css   (fenêtres du client Steam)
    src/menu.css          -> millennium/menu.min.css      (menus : feuille légère)
    src/webkit/webkit.css -> webkit/webkit.min.css        (pages magasin / communauté)

Les @import sont inlinés récursivement, puis les commentaires et espaces
superflus sont retirés. Aucune dépendance : python3 build.py
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
TARGETS = {
    "src/client.css": "millennium/adwaita.min.css",
    "src/menu.css": "millennium/menu.min.css",
    "src/webkit/webkit.css": "webkit/webkit.min.css",
}
IMPORT = re.compile(r'@import\s+(?:url\()?\s*["\']?([^"\')\s;]+)["\']?\s*\)?\s*;')


def inline(path, seen):
    path = os.path.normpath(path)
    if path in seen:
        return ""
    seen.add(path)
    with open(path, encoding="utf-8") as f:
        css = f.read()
    base = os.path.dirname(path)

    def repl(m):
        target = os.path.join(base, m.group(1))
        if not os.path.exists(target):
            sys.exit(f"import introuvable : {m.group(1)} (dans {os.path.relpath(path, ROOT)})")
        return inline(target, seen)

    return IMPORT.sub(repl, css)


def minify(css):
    out, i, n = [], 0, len(css)
    while i < n:
        c = css[i]
        if c in "\"'":  # chaîne : copiée telle quelle
            j = i + 1
            while j < n and css[j] != c:
                j += 2 if css[j] == "\\" else 1
            out.append(css[i:j + 1])
            i = j + 1
        elif css.startswith("/*", i):
            j = css.find("*/", i + 2)
            i = n if j < 0 else j + 2
        elif c.isspace():
            while i < n and css[i].isspace():
                i += 1
            out.append(" ")
        else:
            out.append(c)
            i += 1
    css = "".join(out)
    # espaces autour des ponctuations sûres (pas autour de + - > ~ ni « : » à cause
    # des sélecteurs imbriqués et des pseudo-classes)
    css = re.sub(r"\s*([{};,])\s*", r"\1", css)
    css = re.sub(r";}", "}", css)
    css = re.sub(r"\s*!important", "!important", css)
    return css.strip()


def check(css, name):
    depth = 0
    for ch in re.sub(r'"[^"]*"|\'[^\']*\'', "", css):
        depth += ch == "{"
        depth -= ch == "}"
        if depth < 0:
            break
    if depth:
        sys.exit(f"{name} : accolades déséquilibrées ({depth:+d})")
    if re.search(r";\s*!important", css):
        sys.exit(f"{name} : « ;!important » invalide")


def build_main_window():
    """Fenêtre principale : même feuille, mais sans :has() (voir tools/has2attr.mjs).

    Demande Node.js et les dépendances de package.json (npm install). Sans eux,
    la fenêtre principale garde la feuille native, plus lente."""
    native = os.path.join(ROOT, "millennium/adwaita.min.css")
    out_css = os.path.join(ROOT, "millennium/main.min.css")
    out_js = os.path.join(ROOT, "millennium/has.js")
    node_ok = shutil.which("node") and os.path.isdir(os.path.join(ROOT, "node_modules/postcss-selector-parser"))
    if not node_ok:
        print("main.min.css : Node.js ou node_modules absent (npm install) -> feuille native copiée")
        shutil.copy(native, out_css)
        return
    with tempfile.TemporaryDirectory() as tmp:
        conv, rules = (os.path.join(tmp, n) for n in ("conv.css", "rules.json"))
        subprocess.run(["node", os.path.join(ROOT, "tools/has2attr.mjs"), native, conv, rules], check=True)
        with open(conv, encoding="utf-8") as f:
            css = minify(f.read())
        check(css, "main.min.css")
        with open(out_css, "w", encoding="utf-8") as f:
            f.write(css + "\n")
        with open(os.path.join(ROOT, "src/lite/has-runtime.js"), encoding="utf-8") as f:
            runtime = f.read()
        with open(rules, encoding="utf-8") as f:
            data = json.dumps(json.load(f), ensure_ascii=False)
        with open(out_js, "w", encoding="utf-8") as f:
            f.write(runtime.replace("/*RULES*/[]", data))
    print(f"millennium/main.min.css: {len(css) / 1024:.1f} Ko (+ millennium/has.js)")


def main():
    for src, dst in TARGETS.items():
        css = minify(inline(os.path.join(ROOT, src), set()))
        check(css, src)
        with open(os.path.join(ROOT, dst), "w", encoding="utf-8") as f:
            f.write(css + "\n")
        print(f"{dst}: {len(css) / 1024:.1f} Ko")
    build_main_window()


if __name__ == "__main__":
    main()
