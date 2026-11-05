# Plan: En dag i CSS

A fjord landscape where scroll is the clock. The SVG shapes are drawn by hand, and every effect on them is CSS. JavaScript only runs the slider and opens and closes the full-screen dialog.

## Status

- Phases 1 to 3 are done. The scene is in `Scene.astro` with flat colors (#18). Progress through the day drives `--time`, the sky and the `kl.` debug readout, and the sun and moon cross the sky on their arc.
- Phases 4 and 5 are done. The far range fades toward the sky's horizon color, and each mountain face lights up as the sun lines up with it. After dusk the rock darkens toward a night color and the moon lights the faces that point at it. Phase 6 comes next: the reflection, and the fjord and shore following the time of day. Right now they stay as bright at 22 as at noon, and that breaks the night more than anything else in the scene.
- Each face's `--face` angle sits in a `style` attribute on its `<path>`. See Face angles for the frame and how the values were chosen.
- The mid range is low in contrast around noon, since many of its faces point almost straight up and light up together. It reads, but it's flat.
- The build's CSS minifier folds `animation-timeline` into the `animation` shorthand, and Chromium drops the result. Write the animation as longhands.
- `Scene.astro` holds the only copy of the drawing in the repo. The Inkscape source is `~/Documents/hamnoy.svg` on Steffen's machine. After a redraw, convert the changed layers to the markup in `Scene.astro` by hand: class names instead of fills, windows in their own group, trees as `<use>`.
- The `viewBox` is `0 130 762 429`, 16:9 cut from the 762×635 drawing. It shows more sky than the plan below asks for, and the waterline sits about 83% down instead of 70%.
- The spruce variants in `<defs>` have their base at the origin, so a `<use>` transform is `translate(<base>) scale(<size>)`. A mirrored tree has a negative x scale and `class="flipped"`, which swaps `--tree-lit` and `--tree-shade`.

## Decisions

- The scroll version is a full-screen dialog that grows out of a preview in the page. See Preview and dialog.
- Low-poly art in a flat Bob Ross composition, drawn by hand in Inkscape and inlined as SVG.
- Time runs one way, from 6 (morning) to 24 (midnight). The preview starts at about 17:30, with the sun low over the ridge.
- Mountains get lit faces, and the cabin and trees get cast shadows on the shore.
- No 3D. Depth comes from color, see below. `sprengskisse` covers CSS 3D.
- No fallback for missing browser features. A browser without them gets a note instead of the demo, and the note says what the demo needs, like the other experiments.

## Preview and dialog

The first version put the scroll in the page, between the title and the note, and it locked the reader in on the way down. Now the page shows a 16:9 preview with a slider under it, and the scroll lives in a full-screen dialog.

- The keyframes run over the day's progress from 0 to 1. The preview holds a paused animation with `animation-delay: calc(var(--progress) * -1s)`, and the slider sets `--progress`. It starts at `0.44`, which is about 17:30.
- Clicking the preview opens a modal `<dialog>` with `showModal()` inside `document.startViewTransition()`. The preview and the dialog's stage share a `view-transition-name`, so the scene grows from the preview to the full screen. Only one of them carries the name at a time.
- The dialog is the scroll container, with a `200%` track under a sticky stage. The stage uses the anonymous `animation-timeline: scroll()`, because Firefox with scroll-driven animations turned on (Zen ships it that way) ignores a named `scroll-timeline` on the dialog. The dialog opens scrolled to the slider's progress, and on close it hands its progress back to the slider. Both ways, the scene keeps its time.
- Esc fires `cancel`, which the script turns into the same transition as the Lukk button.
- The dialog has its own slider at the bottom, and its scrollbar is hidden. Dragging that slider scrolls the dialog. A `scroll` listener on the dialog sets `--progress`, so both sliders always show the dialog's time.
- Stock Firefox has no scroll timelines yet. Without `@supports (animation-timeline: scroll())` the demo is hidden and a note says what's missing, like in `sirkel`.
- Pacing: give `--time` keyframe stops instead of one linear run, so dusk gets more scroll than midday, for example `0% { --time: 6 } 40% { --time: 17 } 75% { --time: 21 } 100% { --time: 24 }`. Tune by feel. Scroll-driven animations follow the scroll position directly, so a smoothing lag would need JavaScript. Leave that out.

## The scene

Back to front:

1. Sky gradient and stars.
2. Sun and moon on an arc. They come before the mountains in the markup, so the sun sets behind the ridge.
3. Far mountains, pale and close to the sky color. The hazy ranges in the gap in the middle of the photo, 5 to 10 triangles each.
4. Mid mountains, the range on the left and the snowy massif on the right. 15 to 25 triangles each, with most of the effort on the outline.
5. Near mountains, the needle and its shoulder. 30 to 50 low-poly faces lit by the sun. The needle's clean left and right faces carry the morning-to-evening light swap.
6. Fjord, with a mirrored `<use>` of the mountain groups as the reflection, `scaleY(-1)` and lower opacity. Its `clip-path` is in the `<use>` element's own coordinates, before the flip, so the clip rectangle sits just above the waterline, not below it.
7. Shore, a strip of dark low-poly rocks with one red cabin and some trees. Skip the boats, docks and the rest of the village.

The SVG is a wide landscape, roughly 16:9, with `preserveAspectRatio="xMidYMax slice"`. A phone in portrait keeps only about the middle third, so the needle and the cabin have to be in that band. The needle goes in the horizontal center of the page. The photo's shore with houses is far left, so put the cabin center-left instead.

## Drawing it

- Reference: [Hamnøy](https://commons.wikimedia.org/wiki/File:Hamn%C3%B8y.jpg) by Jon Olav Eikenes, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), from Wikimedia Commons. A 1600×512 panorama from 2009. The license allows committing it to the repo, for example as `reference.jpg` in this folder, and showing it in the note next to the drawing. Either way the note credits the photographer, links the license and says the drawing is traced from it.
- Inkscape. It saves SVG as its own format, and its node snapping makes neighboring triangles share corners exactly.
- Import the photo as a link, not embedded, so the drawing doesn't carry a copy. Put it on a locked bottom layer at about 40% opacity.
- The panorama is too wide and the mountains too low for 16:9. Start at 150% width and 200 to 250% height, with the needle at the page's horizontal center and the waterline about 70% down the 1920×1080 page. That keeps the middle gap and part of both side ranges in frame. Stretching the height makes the peaks steeper than they are, which is fine for a painting. Adjust by eye.
- Trace triangles over it, one `<path>` per face. Turn on snapping to nodes, or the triangles won't meet. Skip the clouds, the water, the boats and the power lines.
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
- Neighboring triangles show hairline seams from anti-aliasing. Fix with a thin stroke in the same color as the fill, `stroke: var(--fill); stroke-width: 1`. A width of 0.5 still leaves light seams at 1x.

## Light

Everything derives from one registered number, `@property --time { syntax: '<number>'; inherits: true; initial-value: 12; }`.

- Sun angle `calc(var(--time) / 24 * 360deg - 90deg)`. Position from `cos()` and `sin()` of that angle on an ellipse. The moon is the same angle plus 180deg.
- Sun height, the `sin()` of the angle, drives daylight, star opacity and window lights. Clamp it with `max(0, ...)` so night stays night.
- Lit faces: each face gets a `--face` angle in its `style` attribute, the direction the face points in the picture. Brightness is `max(0, cos(sun angle - var(--face)))` times daylight, and the fill is `color-mix(in oklch, var(--rock-lit) <brightness>, var(--rock-shade))`. Tested in Edge: `color-mix()` accepts a `calc()` percentage built from `cos()` and custom properties, and the faces in a `<use>` clone pick up `--time` and the class rules too. Setting `--face` by eye is fine, it doesn't need to be physically right.
- Moonlight: in the test, every face turned the same dark grey at night. Run the same face math against the moon angle at low strength, so the ridges still read after dark.
- Atmospheric depth: mix each layer toward the current sky color, more for far layers. `color-mix(in oklch, var(--sky-horizon) var(--haze), <face color>)` with `--haze` set per layer group. Far mountains then turn pink at dawn and blue at night without extra rules.
- Sky colors: a few keyframe stops (dawn, day, dusk, night) on registered `<color>` properties, on the same timeline as `--time`. Pure math won't give good sky colors. In the test, daylight from sun height alone went from day to full night within half an hour after sunset. The dawn and dusk stops are there to stretch that out.
- The scene has its own palette and ignores `light-dark()`. The page around it follows the tokens.
- Night rock: with only the face math, the mountains kept their daytime colors at night and stood out pale against a dark sky. `--day-tint` is the sun height scaled and offset, `clamp(0, sin(<sun angle>) * 2 + 0.6, 1)`. It mixes `--rock-lit` toward `--rock-moonlit` and `--rock-shade` toward `--rock-night`. The offset keeps most of the day colors through sunrise and sunset and lets them go a while after dusk.
- Haze per group ended up at 55% for far, 20% for mid and 10% for near. At 30% the mid range washed out to one flat grey at midday.

## Face angles

`--face` uses the sun's frame: 0deg points left toward the 06:00 sun, 90deg straight up toward the noon sun, 180deg right toward the 18:00 sun. Values outside 0 to 180 are allowed. A face at 30deg is brightest mid-morning and dark in the evening.

The Inkscape greys that were meant to show each face's direction didn't survive into `Scene.astro`, so the 61 angles were set from screenshots instead of by eye in Inkscape:

1. Three agents each proposed a full set with a different method. Geometry treated each mountain as a height field, with the ridgeline at the back, and projected each triangle's normal onto the picture. Ridges by eye split faces at the ridge lines into left-facing and right-facing. Painterly optimised for how the picture reads.
2. Each set was written into `Scene.astro` and screenshotted at ten points in the day with headless Edge and Playwright, by setting the preview slider.
3. A judge compared the sets at the same hours. Geometry won (7.5 of 10). It has one clear crease down the needle, so the left flank is lit in the morning and the right flank in the evening. Ridges by eye came close (7) and had the better mid range. Painterly scored 4: alternating neighbours across 90deg gave a checkerboard, and the mountain looked like crumpled paper.
4. The final set is geometry with 13 changes. The needle tip moved to 65deg and its steep right wall to 150deg. The mid range's angles were spread 1.5 times further from 90deg for more contrast, and four of its faces were taken from the ridges set, so it gets a real morning and evening side.

Lesson: physically plausible normals read better than angles picked for contrast. Neighbouring faces only need to differ where the shape has a crease.

To change the values, rewrite the `style="--face: ..."` attributes in `<path>` order within each group and leave `d` alone. The screenshot and apply scripts lived outside the repo. Rebuild them if this needs doing again. Playwright can drive the installed Edge with `channel: 'msedge'`, and the preview's slider sets the time.

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

The slider works the same. The dialog opens and closes without a view transition, doesn't scroll, and shows the slider's time.

## Phases

1. Skeleton: preview with a slider, full-screen dialog with a sticky stage, `--time` on the scroll timeline, sky color keyframes, and an hours-only readout through `counter()` on an integer `@property` for debugging the pacing.
2. Sun and moon on the arc, setting behind a placeholder ridge.
3. Draw the low-poly scene in Inkscape and inline it with flat colors. A five-triangle test of the lighting, reflection and shadow math passed before drawing started, so the markup above is safe to draw for.
4. Atmospheric depth with `color-mix()` toward the sky.
5. Lit faces from `--face`.
6. Fjord reflection. The fjord and the shore also follow the time of day here, darkening at night and taking the sky's color at dawn and dusk.
7. Cast shadows for the cabin and trees.
8. Windows and stars.
9. The note text, and the browser support line in the note.

## Later, maybe

- A real clock in the scene with minutes. Decide after phase 1 whether the debug readout looks good enough to keep.
- Northern lights at night: a few blurred gradient bands with `mix-blend-mode: screen`, fading in with darkness and swaying with the scroll.
- A looping version: the full 0 to 24 cycle in the scene's own scroll container, jumping the scroll position back at the end. Needs a few lines of JavaScript.
