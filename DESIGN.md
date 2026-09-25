# LAST//CIRCUIT — design decisions

The previous front end looked like a wireframe tutorial: chicken-wire spheres, bolt graphics, scanlines, and too many competing plates. This pass rebuilds the shell and the pictures. The product, the local JSON, and the legal limits stay.

## Feel

A 2032 spacecraft glass cockpit drawn as a semiconductor HMI. Black metal, one lamp of ice-white, hard rectangles, almost no motion. If a control does not earn its pixel, it is gone. Window toys (CUT / MAX / MIN), cartoon bolts, and the scanline veil are gone.

## Type

- Display: Orbitron, titles only. Tracking 0.12em. Desktop title 32–40px. Phone title 22–26px.
- Everything else: Share Tech Mono. Both faces are SIL Open Font License. Fallback is system mono.
- Body: 17px desktop, 16px phone. Line height 1.5.
- CADET stays the larger reading. ANALYST is 15px.
- Status and echo: 12px, color #8d8d8d.
- Hierarchy on a file: TITLE, then CLASS, then FACT figures, then BODY.

## Color

| Token | Value | Use |
| --- | --- | --- |
| Background | #050505 | Page and wells |
| Panel | #0b0b0b | Inset wells |
| Hairline | #2a2a2a | Structure |
| Edge | #c8c8c8 | Frames that must read |
| Text | #ececec | Body |
| Dim | #8d8d8d | Meta |
| Signal | #f3f3f3 | Caret, active pin mark, one key highlight |

No second accent. Signal is a lamp, not a fill. Active pins are brighter type plus a 1px underline, not a white slab.

## Grid

Desktop, 1100px and up:

1. Chrome, 48px: monogram, name, clock.
2. Command, 48px: `lc://`, CADET, ANALYST, MUTE.
3. Echo, one line, ellipsis if long.
4. Pins, 44px, horizontal.
5. Body: 200px index and one primary well.
6. Status, 32px: NODE, WEBGL, DELAY, MODE, LOCAL.

The well is one 3D instrument, or one graph family, or a text file with a single inset. Never two live WebGL canvases.

Breakpoints:

- Under 1100px the index is a drawer. INDEX opens it.
- Under 900px the bottom dock is HOME, SOLAR, SCALE, DEEP, GRAPH. Pins scroll. Targets stay at least 44px.
- Under 700px the 3D well is 40vh (never a stamp, never full-bleed). Graphs stack. Echo stays one truncated line.

Corners are clipped by 2px at most. Frames are 1px.

## Motion

Panel mount is a 200ms opacity. The caret blinks. The light-delay pulse is the only looping motion, and it is labeled illustrative. Nothing auto-rotates. `prefers-reduced-motion` freezes the pulse, skips boot theater, and holds the camera still.

## 3D material rules

One renderer for the whole app. It is destroyed, with its geometries, materials, and frame loop, on every route change.

- Camera: perspective, 42 degrees, exposure about 1.1, ACES tone map.
- Light: one key at the Sun (point light, gentle falloff) and a dim hemisphere fill so the night side is not a hole.
- Fog: linear grey, far only, so distance reads without hiding the inner system.
- Materials: `MeshStandardMaterial`. Roughness carries the surface. Metalness stays near zero.
- Maps: greyscale canvases generated in the page (value noise and banded gas). No downloaded images.
- Sun: emissive core plus a soft halo drawn in a canvas.
- Saturn: a thin ring with radial alpha, not a solid hoop.
- Black hole: dark mass, thin disk, one bright ring. Caption: ILLUSTRATION.
- Scale: nested rings and ticks. The plate still says 12,756 km at Earth.
- Galaxy: a sparse two-arm plot and one here-pip. Points are a fixed pixel size so the arms stay a plot.
- On a phone the body-file well sits under the title, before the prose. Command buttons do not shrink; the address field clips.
- Pixel ratio capped at 2. Sphere detail is 48/32 on desktop and 24/16 on a phone.
- The render loop stops while the tab is hidden.
- If WebGL fails, a measured 2D SVG plan replaces the well, with the line: serve via http:// for 3D.

## Graphs

Same margins as the well. Hairline axes, units, a FACT line, and one CADET sentence. Numbers come from `data/bodies.json`, including `mass_earth`. Fills stay under a 12% white if a mark needs weight. No candy bars.

## What this document refuses

Neon, scanlines, matrix rain, glitch spam, stock HUD kits, agency insignia, and any photograph.
