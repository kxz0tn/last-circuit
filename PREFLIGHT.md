# PREFLIGHT — LAST//CIRCUIT

Date: 2026-09-26. Result: **PASS**.

Account checked before any repo was created: GitHub user `kxz0tn`. `kxz0tn/last-circuit` returned 404, so the name is free on this account. No other remote is in use. `gh` on this machine is not logged in; the authenticated GitHub connection used for the account check is the one already available to this session.

## Stop conditions

| Check | Result |
| --- | --- |
| Photos, audio samples, icon packs, UI kits, or unlicensed font files | None. Extensions on disk: md, html, webmanifest, js, svg, css, json |
| NASA / ISRO / ESA / company seals | None in SVG or copy |
| API keys, .env, tokens, passwords | None. `solarToken` in `js/app.js` is a navigation counter, not a credential |
| Copied encyclopedia pages or another app’s HUD kit | Not found. Prior review is in `docs/AUDIT.md` |
| APOD or photographer-copyright image | No image files |
| Tree is the Last Circuit web app | Yes. `index.html` title is LAST CIRCUIT // PUBLIC TERMINAL |

## Inventory

| Path | Role |
| --- | --- |
| `index.html` | App shell. Google Fonts CSS for Orbitron and Share Tech Mono only |
| `css/app.css` | Original stylesheet. System mono fallback |
| `js/app.js` `search.js` `audio.js` `graphs.js` | Original. Audio is oscillators |
| `js/solar3d.js` `viz-host.js` and the other `viz-*.js` | Original scenes. Three.js r170 pinned at `cdn.jsdelivr.net` |
| `js/file-fallback.js` | Generated mirror of `data/` |
| `js/sw.js` | Network-first cache of this app |
| `data/bodies.json` `topics.json` `copy.json` | Original prose and classroom figures |
| `assets/svg/icon.svg` `wordmark.svg` `icons.svg` | Original geometry |
| `manifest.webmanifest` | Points at `icon.svg` |
| `README.md` `LICENSE` `CREDITS.md` `DESIGN.md` `.gitignore` | Publish files. MIT covers original source and prose only |
| `docs/AUDIT.md` `docs/AUDIT-SHORT.md` | Internal review, not legal advice |
| `PREFLIGHT.md` | This note |

## Product checks

- Pluto class is `DWARF`.
- A light-year is described as a distance.
- Black-hole topic has `illustration: true`.
- Moon light time 1.28 s, displayed 1.3 s. Sun 499 s, about 8.3 min. Mars 750 s, about 12.5 min. Earth equatorial diameter 12,756 km. Jupiter `mass_earth` 318 and diameter about 11.2 Earths.
- `CREDITS.md` names Orbitron, Share Tech Mono, and Three.js r170, and says the project MIT grant does not cover them.

Uranus cadet text no longer says the drawing is “white line only.” README no longer calls the core a wireframe.
