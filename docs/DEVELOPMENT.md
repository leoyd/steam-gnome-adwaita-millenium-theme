# Development — Adw Lite

Technical notes for modifying the theme. To install it, see the [README](../README.md).

- Client base: [Adwaita-for-Steam](https://github.com/tkashkin/Adwaita-for-Steam) 4.4 (MIT), in `src/adwaita/`.
- Web pages and overlay: `src/webkit/` and `src/lite/`.
- System fonts only (Adwaita Sans / Mono, Cantarell as fallback).
- Small scripts: `millennium/library.js` (sticky bar on a game's page), `millennium/has.js` (`:has()` replacement, generated), and optionally `millennium/limits.js` (lists of 6 + "Show more") and `millennium/no-microtrailers.js` (micro-trailers not downloaded).

## Structure

```
skin.json                  Millennium options (colors, accent, buttons, extras)
build.py                   assembles and minifies the stylesheets
millennium/main.min.css    generated: main window, without :has() (see below)
millennium/has.js          generated: sets the attributes that replace the :has()
millennium/adwaita.min.css generated: friends, dialogs, fullscreen windows
millennium/menu.min.css    generated: menus (reduced stylesheet)
webkit/webkit.min.css      generated: store / community pages
options/                   small files injected depending on the chosen options
millennium/library.js      sticky bar on a game's page (always active)
millennium/limits.js       "Lists limited to 6" option + "Show more" button
millennium/no-microtrailers.js  "Micro-trailers: disabled" option
src/client.css             client entry point
src/lite/                  Adw Lite client overlay (library header, spinner, avatars)
src/webkit/components/     one file per component (button, entry, card, tabs,
                           pagination, badge, vote, metadata, media, carousel,
                           progress/spinner, performance)
src/webkit/pages/          layout specific to each screen (headers, store, community)
tools/check-classes.py     finds Steam classes that disappeared after an update
tools/has2attr.mjs         converts :has() into attributes (Node + postcss)
src/lite/has-runtime.js    template for millennium/has.js
```

Options whose `affects` is `.*` also apply to web pages: light/dark mode, the
palette and the accent color are therefore shared between the client and the
store, since both stylesheets use the same `--adw-*` variables.

## Modifying the theme

Edit the files in `src/`, then:

```sh
python3 build.py
```

Web pages reload on the next navigation; the client needs a Steam restart.

The first time, install the conversion tools: `npm install`. Without Node,
`build.py` copies the stylesheet as is (with its `:has()`): the theme still
renders correctly, but the library is noticeably slower.

## Performance: no :has() in the main window

In the library, React modifies the DOM constantly and every `:has()` forces
Chromium to re-evaluate selectors on each change: with the Adwaita-for-Steam
stylesheet, opening a game's page went from 0.2 s (Steam without a theme) to
nearly 4 s. For the main window, `build.py` therefore rewrites each
`subject:has(argument)` as `subject[data-adw-hN]`, and `has.js` sets these
attributes once per frame after a DOM change. To stay cheap, it never walks
the whole document: it starts from the elements that carry the subject's class
(or, for `:has(> Y)` / `:has(+ Y)`, from the Ys) and skips rules for which no
element is displayed.

Rule to follow when writing CSS: a `:has()` must target a subject that has a
class (`div.Class:has(…)`), never a bare `div` or `div.Panel`.

## After a Steam update

Steam and its store use hashed classes (`_16jZ3HEbtaJTl80pQINN2Y`) that change
with some updates. A rule targeting a class that no longer exists produces no
error: it simply stops applying. Every hashed class in the sources is followed
by its original name in a comment (`/* StoreMenu */`) so it can be found again.

```sh
python3 tools/check-classes.py   # client classes not found in steamui
```

For the client part, the simplest approach is to take `src/adwaita/` again from
the latest Adwaita-for-Steam release (the repository's `adwaita/`), then rerun `build.py`.

## Web page components

Each UI element is defined only once in `src/webkit/components/` and is
customized through CSS variables, without rewriting the component:

| Component | Variables |
|-----------|-----------|
| button    | `--btn-bg`, `--btn-bg-hover`, `--btn-fg`, `--btn-radius`, `--btn-height`, `--btn-pad` |
| card      | `--card-bg`, `--card-pad`, `--card-radius` |
| entry     | `--entry-bg`, `--entry-pad`, `--entry-radius` |
| badge     | `--badge-bg`, `--badge-fg`, `--badge-radius` |
| tab       | `--tab-height`, `--tab-pad` |
| OSD button (arrows) | `--osd-size` |
| spinner   | `--spinner-size` |
| progress  | `--progress-color`, `--progress-height` |

Component selectors are wrapped in `:where()` (zero specificity): a page can
always adjust a component. A documented exception in `button.css`: Steam forces
its button color with `!important`, so the color is reapplied there with the
same specificity.
