# LAST//CIRCUIT — clearance audit

Internal review, not legal advice. It is not a warranty and it is not a trademark clearance.

Date: 2026-09-25. Scope: the files in `last-circuit/` as they sit on disk. This is a rights and honesty review, not a redesign and not a trademark-office search.

A reasonable rights holder would not have a real copyright, trademark-asset, or license-fee claim on the files bundled in this folder today. Two remote loads are permissive and named in `CREDITS.md`. That is not a promise that nobody can ever email, and it is not a promise about later edits.

## A. Verdict

**CLEAR**

No bundled file failed the “who made this, and could they bill us” test. Residual items in D and E are real, and they are not takedown-grade defects in the current tree. Do not publish until the owner says YES. Do not add a `LICENSE` file that sweeps the fonts or Three.js into “we own this.”

## B. Inventory

Nothing in the folder is a png, jpg, webp, gif, mp3, wav, ogg, woff, or glb. No `package.json`, no `node_modules`, no API key, no analytics script. The only network loads in `index.html` and the viz modules are the two rows at the bottom.

| File or URL | Type | Origin | License | Result |
| --- | --- | --- | --- | --- |
| `index.html` | Shell | Written for this project | Unpublished original. MIT only if the owner later says so | PASS |
| `css/app.css` | Style | Written for this project | Same | PASS |
| `js/app.js` | App | Written for this project | Same | PASS |
| `js/search.js` | App | Written for this project | Same | PASS |
| `js/audio.js` | Web Audio oscillators only | Written for this project | Same. No sample files | PASS |
| `js/graphs.js` | SVG plates drawn in code | Written for this project | Same | PASS |
| `js/solar3d.js` | Three.js scene | Written for this project. Imports pinned Three.js | Original code. Three.js itself is the CDN row | PASS |
| `js/viz-host.js` | WebGL host, procedural canvases | Written for this project | Same. Maps are generated noise, not image files | PASS |
| `js/viz-planet.js` | Scene | Written for this project | Same | PASS |
| `js/viz-hole.js` | Scene, captioned illustration | Written for this project | Same | PASS |
| `js/viz-scale.js` | Scene | Written for this project | Same | PASS |
| `js/viz-galaxy.js` | Point plot | Written for this project | Same | PASS |
| `js/viz-delay.js` | Scene | Written for this project | Same | PASS |
| `js/file-fallback.js` | Embedded copy of the local JSON | Generated from this project’s data | Same prose as `data/` | PASS |
| `js/sw.js` | Cache of this folder’s own URLs | Written for this project | Same. Does not vendor Three.js or the fonts into the repo | PASS |
| `data/bodies.json` | Figures and lesson prose | Written for this project. Figures are round public values | Prose original. Facts are not copyrightable | PASS |
| `data/topics.json` | Lesson prose | Written for this project | Same | PASS |
| `data/copy.json` | UI strings | Written for this project | Same | PASS |
| `assets/svg/icon.svg` | LC monogram, rectangles | Drawn for this project | Original | PASS |
| `assets/svg/wordmark.svg` | Wordmark plus the same monogram | Drawn for this project | Original. It names OFL faces; it does not embed font files | PASS |
| `assets/svg/icons.svg` | Six geometric symbols (home, orbits, scale, ring, page, mute) | Drawn for this project | Original simple paths, not an icon pack | PASS |
| `manifest.webmanifest` | PWA manifest | Written for this project | Same. Points at `icon.svg` only | PASS |
| `README.md` | Run notes | Written for this project | License statements match the tree. Two product sentences are stale (see D) | PASS |
| `CREDITS.md` | Credit file | Written for this project | Names Orbitron, Share Tech Mono, Three.js r170, and “no imagery” | PASS |
| `DESIGN.md` | Visual decisions | Written for this project | Describes procedural maps and refuses insignia and photographs | PASS |
| `https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600&family=Share+Tech+Mono` | Remote font CSS | Orbitron © 2009 Matt McInerney, reserved name Orbitron. Share Tech Mono by Ralph Oliver du Carrois / Carrois, reserved name “Share” | SIL OFL 1.1 for both. Not bundled in the repo. CSS falls back to `ui-monospace`, Cascadia Mono, Segoe UI Mono | PASS |
| `https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js` | Library, pinned | three.js authors and contributors | MIT. Loaded only when the page is served and WebGL starts. Not copied into the folder | PASS |

System font names in the CSS stack are fallbacks. They are not files in this project.

## C. Failures

None.

No UI kit, icon pack, stock photo, NASA or JPL bitmap, agency seal, sampled sound, paid font, GPL library, minified third-party blob, or secret.

## D. Risks that are not failures

- **Name.** This review did not search the trademark office and does not clear “Last Circuit” or “LAST//CIRCUIT.” An exact title exists on a 2024 instrumental single, “Last Circuit,” by Veilspire. That is a music title, not an agency mark, and it is not a legal opinion. A dead USPTO record for a different phrase, “LC LAST CHAOS,” is not this name. A later search can still find a conflict.
- **OFL stays OFL.** A future MIT `LICENSE` may cover original code and prose only. It must not claim the font files. If the fonts are later copied into the repo, ship the OFL text and the designers’ copyright lines with them. Reserved names (Orbitron, Share) cannot be reused on a modified font.
- **Three.js stays MIT.** Vendoring the file later requires keeping the MIT copyright notice. The pin is r170 on jsDelivr. A different URL would be a new review.
- **CDN and privacy.** Google Fonts and jsDelivr see the request IP. That is not an analytics SDK and not a license fee. Either host can go down; the page still shows text, and a failed font load uses the system mono stack. WebGL then needs the local note “serve via http:// for 3D” only when the Three.js URL is blocked.
- **Service worker.** `sw.js` is network-first and can cache whatever GET this origin already requested, including a successful CDN response, in the browser. The repo still does not contain those bytes.
- **README drift.** `README.md` still says body files use a “wireframe core” and that the status line shows AU and light-years. The live status line is node, WebGL, delay, reading mode, and LOCAL. The legal paragraphs in that file match the tree. Stale how-to text is not a rights claim.
- **Someone can paste Wikipedia later.** This audit does not survive that edit.
- **Zero trouble forever is not on offer.** A person can still send a baseless email.

## E. Science / honesty flags

Checked, not copyright:

- Pluto’s class in `data/bodies.json` is `DWARF`. The cadet line says it is not one of the eight, and that 2006 is a naming rule.
- A light-year is described as a distance. Proxima is given as about 4.24 light-years.
- Black Hole, why the sky is dark, the light-year, the early universe, and the observable universe are `illustration: true`. The black-hole page says the drawing is not a photograph and not a gravity solver. The bezel says ILLUSTRATION.
- Moon one-way time is stored as 1.28 s and shown as 1.3 s (`formatSeconds` rounds to tenths). Sun 499 s displays as 8.3 min. Mars 750 s displays as 12.5 min and the analyst line says that is a mid-range figure. The delay animation is labeled illustrative. The graph’s Moon tick is the classroom label “1.3 s.”
- Observable width is “about 93 billion light-years” and both cadet and analyst call it model-dependent, not a wall.
- Earth equatorial diameter on the scale plate is 12,756 km. Jupiter’s file diameter is 142,984 km, about 11.2 Earth diameters. The compare bench uses that ratio. The Jupiter analyst sentence says “about 11 Earth diameters,” which is coarser than the bench and not a contradiction.
- No line found that says the terminal is an official NASA, ISRO, or ESA product. No alien or UFO claim found. Uranus cadet text mentions a pale cyan observation and then says the terminal does not paint that color.
- **Stale sentence, worth a later edit, not a rights fail:** Uranus cadet text says “This terminal draws it in white line only.” The current core is a shaded greyscale sphere. A reader can think the picture is still a wire drawing. Do not “fix” that by pasting an encyclopedia paragraph.
- Moon counts for Jupiter, Saturn, and Uranus are written as dated, changeable catalogue talk (“more than 100,” “on the order of 300,” “29”). This pass did not re-check those integers against a primary catalogue. The prose already says they move.
- The Earth–Moon delay helper in `js/search.js` uses 1.28 seconds in code, matching the JSON. If the JSON changes and that helper does not, the switchboard can drift. They match today.

Spot-check against well-known encyclopedia leads (Sun, Mars, black hole, Olbers, Big Bang, observable universe):

- Sun cadet opens with “The Sun is the star at the center of this system. It is a huge sphere of hot gas…” The ordinary definition shares “star at the center” and “sphere of hot” with countless textbooks. The rest (seeing the planets, the eight-minute wait) is not the encyclopedia lead, which goes on to plasma and fusion. Not treated as a lifted paragraph.
- Mars cadet (“cold desert world… sols… Phobos and Deimos… no life has been confirmed”) does not follow the usual “fourth planet / red because of iron oxide” lead.
- Black-hole cadet uses escape speed and then says the drawing is an illustration. It does not copy the “region of spacetime… electromagnetic waves” lead, and it does not teach a vacuum-cleaner hole.
- Olbers (why the sky is dark) states the infinite eternal picture, finite age, expansion, and that dust would heat and shine. Analyst names Olbers and says the diagram is a counting argument. Not a pasted article.
- Early-universe cadet says it was not a bomb in an empty room and has no center like a city. Analyst says about 13.8 billion years is a fit that can shift.
- Observable-universe text keeps the 93 billion light-year classroom figure and says it is model-dependent.

No paragraph was clearly lifted. Short definitions can still resemble other short definitions. That is not a file you can invoice.

## F. What the owner must never add later

- Paid UI kits, cyberpunk HUD packs, ThemeForest or Envato panels, Font Awesome Pro, Flaticon or Noun Pro packs.
- Agency seals: NASA meatball or worm, ISRO, ESA, SpaceX, or any other company logo.
- Copyrighted astronomy pictures, including APOD frames that name a photographer, Hubble composites with a third-party credit, Unsplash or Pexels drops with no license file, game screenshots, movie stills.
- Music beds, sampled sound effects, movie dialogue.
- Scraped Wikipedia, NASA.gov articles, or textbook paragraphs. Public numbers may stay. Prose has to stay rewritten.
- A `LICENSE` that says the OFL fonts or a NASA map are MIT work owned by this project.
- Live agency APIs, keys, or analytics SDKs, unless a later pass discloses them and reviews each response for copyright fields.
- Any claim of official agency status, or lore presented as a measurement, or aliens stated as fact.

## G. Hosting note

GitHub Pages is acceptable for these files only after the owner explicitly says YES. Section C is empty, so there is no rights failure left to delete first. Hosting still does not clear the name, and it does not put MIT on work the owner has not released. Until that YES, do not init a remote, do not push, and do not deploy.

If the fonts or Three.js are copied into the site later, add their license notices before the push. The current CDN use is already described in `CREDITS.md`.

## H. What you changed in this pass

**NOTHING** in the app. No file was deleted. No science text was rewritten. This audit added only `AUDIT.md` and `AUDIT-SHORT.md`.
