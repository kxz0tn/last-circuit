# LAST//CIRCUIT

A public-domain-safe industrial terminal for original space lessons.

Live: https://kxz0tn.github.io/last-circuit/

## Run locally

From this folder:

```bash
python -m http.server 8080
```

Open the URL the server prints. `http://localhost:8080` is the usual address. The page is static. There is no account and no backend.

Opening `index.html` as `file://` still shows the text. Three.js comes from a CDN, and many browsers block that from a file URL. The well then falls back to a 2D plate and the line: serve via http:// for 3D.

## Reading

CADET is the short reading. ANALYST is the denser one. Switch either from the command bar.

The status line shows the node, whether WebGL started, the one-way light delay when the file has one, the reading mode, and LOCAL.

## Legal

Original code and prose in this repository are MIT. See `LICENSE`.

Orbitron and Share Tech Mono remain under the SIL Open Font License and are loaded from Google Fonts. Three.js r170 remains under its own MIT license and is loaded from a pinned jsDelivr URL. This project's MIT license does not cover those fonts or that library.

Not affiliated with NASA or any space agency. No agency insignia, photographs, or live agency APIs.

See `CREDITS.md`.
