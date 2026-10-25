<div align="center">

# Adw Lite

**Steam in GNOME / libadwaita style — the client *and* the web pages.**

A [Millennium](https://steambrew.app) theme that brings the Adwaita design system
to the whole app: library, friends, settings and dialogs, but also the store,
community, market, inventory, Workshop and forums.

[![Millennium](https://img.shields.io/badge/Millennium-theme-6b5cff?style=flat-square)](https://steambrew.app)
[![GNOME](https://img.shields.io/badge/GNOME-libadwaita-4a86cf?style=flat-square&logo=gnome&logoColor=white)](https://gnome.pages.gitlab.gnome.org/libadwaita/)
[![License: MIT](https://img.shields.io/badge/license-MIT-2ec27e?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/version-4.4--lite.3-lightgrey?style=flat-square)](skin.json)

![Library](docs/screenshots/library.png)

</div>

## Preview

| Store | Discussions |
|:-:|:-:|
| ![Store](docs/screenshots/store.png) | ![Discussions](docs/screenshots/discussions.png) |

## Highlights

- 🎨 **Adwaita everywhere**: libadwaita colors, radii, buttons, entries, tabs, cards,
  spinner and carousel arrows, in the client as well as on the web pages.
- 🌗 **Light, dark or system** color scheme, GNOME 48+ or neutral gray palette, and
  GNOME's **9 accent colors**, which replace Steam blue everywhere.
- 🧩 **Single, reusable components**: one button, one card, one pagination, one
  "recommended" thumb… each one adjusted through CSS variables.
- 🖼️ **Square avatars** with their profile frames; custom profile backgrounds are
  kept and stay readable.
- 📚 **Redesigned library**: large rounded hero image, translucent panel holding the
  Play button, compact bar that stays visible while scrolling.
- ⚡ **Fast**: no `:has()` in the main window (converted at build time), system fonts,
  no downloaded fonts or images. A game page settles in ~0.6 s, versus ~3.8 s with
  the original stylesheet.

## Installation

### 1. Install Millennium

The theme requires **[Millennium](https://steambrew.app)**, the theme and plugin
manager for Steam. Follow the installation instructions on its website for your
system (Windows or Linux), then start Steam once.

### 2. Add the theme

**With Git (recommended, easy updates)**

Clone the repository into Millennium's themes folder:

```sh
# Linux
cd ~/.local/share/Steam/millennium/themes
git clone https://github.com/leoyd/steam-gnome-adwaita-millenium-theme.git
```

```powershell
# Windows (PowerShell)
cd "C:\Program Files (x86)\Steam\millennium\themes"
git clone https://github.com/leoyd/steam-gnome-adwaita-millenium-theme.git
```

**Without Git**

1. Download the archive: **Code → Download ZIP** on this page.
2. Extract it into the `millennium/themes` folder of your Steam directory.

> [!NOTE]
> The themes folder lives in your Steam installation directory:
> `millennium/themes`. On Linux this is usually
> `~/.local/share/Steam/millennium/themes` (or `~/.steam/steam/millennium/themes`).
> The compiled files are included: there is nothing to build.

### 3. Enable the theme

1. Open Steam, then the **Millennium** menu (☰ menu at the top right → *Millennium*).
2. Under **Themes**, select **Adw Lite**.
3. Restart Steam when Millennium asks you to.

### Updating

```sh
cd ~/.local/share/Steam/millennium/themes/steam-gnome-adwaita-millenium-theme
git pull
```

Then restart Steam (web pages pick up changes on the next navigation, the client
after a restart).

## Options

All options are set in **Millennium → Themes → Adw Lite**.

| Option | Choices (default in bold) |
|---|---|
| Color scheme | **Dark**, Light, System |
| Palette | **GNOME 48+**, Neutral gray (before GNOME 48) |
| Accent color | **Blue**, Teal, Green, Yellow, Orange, Red, Pink, Purple, Slate |
| Window buttons | **GNOME (close only)**, Minimize / maximize / close, Left side (macOS), Pantheon |
| What's New shelf | **Show**, Hide |
| Game list | **Always visible**, On hover |
| Square icons | **Yes**, No |
| Lists limited to 6 | **Yes** (friends, activity and community content by 6 + "Show more" button), No |
| Background artwork | **Hidden**, Shown (game page backgrounds; profile backgrounds are always shown) |
| Page address | **Hidden**, Shown |
| Micro-trailers | **Disabled** (not downloaded: lighter), Enabled |
| Login QR code | **Show**, On hover, Hide |

## Performance tips

- Keep **Micro-trailers** *disabled* and **Lists limited to 6** set to *Yes*: fewer
  videos and elements to load in the store and library.
- In **Steam → Settings → Library**, *Low bandwidth mode* and *Low performance mode*
  lighten the display even more.

## Known limitations

- Drop-down menus stay rectangular: on some systems (Linux / Wayland), Steam's menu
  windows are not transparent, so rounded corners would show up black. Menu items
  themselves are rounded.
- Steam sometimes renames its CSS classes in updates: an element may lose its style
  until the theme is updated.

## Development

The theme is written as modular CSS in `src/`, then bundled and minified by
`build.py`:

```sh
npm install        # once: tooling that converts :has() selectors
python3 build.py   # regenerates millennium/*.css, millennium/has.js and webkit/webkit.min.css
```

Architecture, components, performance notes and maintenance after a Steam update:
see **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)**.

## Credits

- [Adwaita-for-Steam](https://github.com/tkashkin/Adwaita-for-Steam) by **tkashkin**
  — base of the client theme (MIT).
- [libadwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/) and the
  [GNOME Human Interface Guidelines](https://developer.gnome.org/hig/) — design system.
- [Millennium](https://steambrew.app) — theme loading in Steam.

## License

[MIT](LICENSE). This theme is not affiliated with Valve or the GNOME project.
