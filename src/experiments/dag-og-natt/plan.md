# Plan: En dag i CSS

A fjord landscape where scroll is the clock. The SVG shapes are drawn by hand, and every effect on them is CSS. The only JavaScript is the slider for reduced motion.

## Decisions

- The stage is full-bleed, edge to edge and one viewport tall. It breaks out of the 792px `main` column.
- Low-poly art in a flat Bob Ross composition, drawn by hand in Inkscape and inlined as SVG.
- Time runs one way, from 6 (morning) to 24 (midnight). The scene sits at morning before the section reaches the top of the viewport and stays at night after it has passed.
- Mountains get lit faces, and the cabin and trees get cast shadows on the shore.
- No 3D. Depth comes from color, see below. `sprengskisse` covers CSS 3D.
- No fallback for missing browser features. The note says what the demo needs, like the other experiments.

## Stage and scroll

- A section about `300vh` tall in `Demo.astro`, with a `position: sticky` stage inside it, `100svh` tall. The note sits below the section.
- Full-bleed breakout: `width: 100vw` includes the scrollbar on Windows and causes horizontal overflow. Use `margin-inline: calc(50% - 50vw)` together with `overflow-x: clip` on a wrapper, or something equivalent. Check the mobile padding on `body` too.
- `view-timeline` on the section, `animation-range: contain` on the stage animation, so time only moves while the section covers the viewport.
- Pacing: give `--time` keyframe stops instead of one linear run, so dusk gets more scroll than midday, for example `0% { --time: 6 } 40% { --time: 17 } 75% { --time: 21 } 100% { --time: 24 }`. Tune by feel. Scroll-driven animations follow the scroll position directly, so a smoothing lag would need JavaScript. Leave that out.

## The scene

Back to front:

1. Sky gradient and stars.
2. Sun and moon on an arc. They come before the mountains in the markup, so the sun sets behind the ridge.
3. Far mountains, pale and close to the sky color. The blue range on the right horizon, 5 to 10 triangles.
4. Mid mountains, the massif on the left and the jagged ridge behind the main peak. 15 to 25 triangles each, with most of the effort on the outline.
5. Near mountains, the main peak and the green slope at its foot. 30 to 50 low-poly faces lit by the sun.
6. Fjord, with a mirrored `<use>` of the mountain groups as the reflection, `scaleY(-1)` and lower opacity. Its `clip-path` is in the `<use>` element's own coordinates, before the flip, so the clip rectangle sits just above the waterline, not below it.
7. Shore, the rocky point as a few dark low-poly rocks, with one or two cabins and some trees.

The SVG is a wide landscape, roughly 16:9, with `preserveAspectRatio="xMidYMax slice"`. A phone in portrait keeps only about the middle third, so the main peak and the cabin have to be in that band. In the photo the cabins sit further right, so move the cabin left toward the foot of the peak.

## Drawing it

- Reference: the view from Hamnøy bridge in Lofoten, [Street View, September 2022](https://www.google.com/maps/@67.9453534,13.1304688,24a,75y,2.02h,98.09t/data=!3m7!1e1!3m5!1sMbV6AOCtotyrJ1ZpRivwYQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.clients6.google.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-8.09132355247128%26panoid%3DMbV6AOCtotyrJ1ZpRivwYQ%26yaw%3D2.017964767070359!7i16384!8i8192). Keep the screenshot and the Inkscape working file with the reference layer out of the repo, since the image is Google's. Commit only the clean SVG.
- Inkscape. It saves SVG as its own format, and its node snapping makes neighboring triangles share corners exactly.
- Put the screenshot on a locked bottom layer at about 40% opacity, scaled so the waterline lands about 70% down the 1920×1080 page. Trace triangles over it, one `<path>` per face. Turn on snapping to nodes, or the triangles won't meet. Skip the bridge railing, the lamp post, the clouds and the water.
- One Inkscape layer per scene layer, named so the export gets usable group ids: `reference`, `far-mountains`, `mid-mountains`, `near-mountains`, `shore`, `cabin`, `trees`.
- Shortcuts: `Ctrl+Shift+D` for the page size, `Ctrl+Shift+L` for layers, `%` toggles snapping, `B` is the pen tool, `Alt+D` makes a clone.

Mountains:

- Pen tool, click three points, then click the first one again to close the face.
- Start with the ridgeline, a zigzag along the outline. Then put points inside wherever the photo has a ridge, a crease or a change in light, and connect them into triangles.
- Bigger triangles on far layers, smaller ones up close. Avoid long thin slivers, they look like glitches.
- Give each face a rough grey from the photo, lighter or darker. CSS replaces the color, but the grey shows which way the face points when setting `--face` later.
- Let the bottom of each mountain dip below the waterline, so there's no gap where it meets the water.

Cabin and trees:

- Draw the cabin freehand: a wall, two roof faces for a lit and a shaded side, a door, and windows as separate rectangles in their own group so `sibling-index()` can count them.
- A low-poly spruce is a few stacked tiers, each split into a left and a right triangle. Draw two or three variants and place the rest with `Alt+D`. Inkscape saves clones as `<use>`, which the shadows need anyway.

Cleanup:
- Export as Plain SVG. If SVGO runs on it, turn off `mergePaths` and `cleanupIds`, since the defaults merge the faces into one path and strip the ids.
- After export: remove every `fill`, give each face a class and a `--face` value (see Light), and paste it inline in `Demo.astro`.
- Neighboring triangles show hairline seams from anti-aliasing. Fix with a thin stroke in the same color as the fill, `stroke: var(--fill); stroke-width: 0.5`.

## Light

Everything derives from one registered number, `@property --time { syntax: '<number>'; inherits: true; initial-value: 12; }`.

- Sun angle `calc(var(--time) / 24 * 360deg - 90deg)`. Position from `cos()` and `sin()` of that angle on an ellipse. The moon is the same angle plus 180deg.
- Sun height, the `sin()` of the angle, drives daylight, star opacity and window lights. Clamp it with `max(0, ...)` so night stays night.
- Lit faces: each face gets a `--face` angle in its `style` attribute, the direction the face points in the picture. Brightness is `max(0, cos(sun angle - var(--face)))` times daylight, and the fill is `color-mix(in oklch, var(--rock-lit) <brightness>, var(--rock-shade))`. Tested in Edge: `color-mix()` accepts a `calc()` percentage built from `cos()` and custom properties, and the faces in a `<use>` clone pick up `--time` and the class rules too. Setting `--face` by eye is fine, it doesn't need to be physically right.
- Moonlight: in the test, every face turned the same dark grey at night. Run the same face math against the moon angle at low strength, so the ridges still read after dark.
- Atmospheric depth: mix each layer toward the current sky color, more for far layers. `color-mix(in oklch, var(--sky) var(--haze), <face color>)` with `--haze` set per layer group. Far mountains then turn pink at dawn and blue at night without extra rules.
- Sky colors: a few keyframe stops (dawn, day, dusk, night) on registered `<color>` properties, on the same timeline as `--time`. Pure math won't give good sky colors. In the test, daylight from sun height alone went from day to full night within half an hour after sunset. The dawn and dusk stops are there to stretch that out.
- The scene has its own palette and ignores `light-dark()`. The page around it follows the tokens.

## Shadows

The mountains get lit faces instead of cast shadows, since in a side view they'd have nowhere visible to fall. The cabin and trees stand on the shore, which is ground seen from slightly above, so their shadows show there.

- The sun is in the sky behind the scene, so shadows fall toward the viewer. On screen that's downward from each object's base, leaning away from the sun.
- Each shadow is a `<use>` of the cabin or tree, with `transform-origin` at its base, flipped down with `scaleY(calc(-1 * var(--shadow-length)))`. This reuses the same setup as the fjord reflection.
- `--shadow-length` grows as the sun gets lower, roughly `1 / tan(elevation)`. Cap it with `min()`, since it goes to infinity at sunrise and sunset.
- `skewX(calc(cos(<sun angle>) * 60deg))`, so the shadow swings from one side to the other over the day. Mind the sign: with the sun on the left, the shadow leans right.
- A dark semi-transparent fill, with opacity from daylight, so the shadows fade at dusk and are gone at night.

## Windows and stars

- Each window gets a light-on time from `sibling-index()`, for example `18 + sibling-index() * 0.4`, and turns on with `clamp(0, (var(--time) - var(--on)) * 10, 1)`. Turn them off late at night the same way.
- Stars: a handful of positioned dots, opacity from sun height, a small twinkle offset by `sibling-index()`.
- `sibling-index()` is Chromium-only so far. Mention it in the note, no fallback.

## Reduced motion

No scroll linkage. A range input sets `--time` through a few lines of script. The stage is still full-bleed but not sticky, and the section is one viewport tall.

## Phases

1. Skeleton: full-bleed sticky stage, `--time` on the scroll timeline, sky color keyframes, and an hours-only readout through `counter()` on an integer `@property` for debugging the pacing.
2. Sun and moon on the arc, setting behind a placeholder ridge.
3. Draw the low-poly scene in Inkscape and inline it with flat colors. A five-triangle test of the lighting, reflection and shadow math passed before drawing started, so the markup above is safe to draw for.
4. Atmospheric depth with `color-mix()` toward the sky.
5. Lit faces from `--face`.
6. Fjord reflection.
7. Cast shadows for the cabin and trees.
8. Windows and stars.
9. Reduced-motion slider, the note text, and the browser support line in the note.

## Later, maybe

- A real clock in the scene with minutes. Decide after phase 1 whether the debug readout looks good enough to keep.
- Northern lights at night: a few blurred gradient bands with `mix-blend-mode: screen`, fading in with darkness and swaying with the scroll.
- A looping version: the full 0 to 24 cycle in the scene's own scroll container, jumping the scroll position back at the end. Needs a few lines of JavaScript.
