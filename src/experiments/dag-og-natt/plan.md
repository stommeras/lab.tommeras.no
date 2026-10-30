# Plan: En dag i CSS

First thoughts, not a decided design.

## Structure

- A tall scroll section (say `300vh`) in `Demo.astro` with a `position: sticky` stage inside, so the scene stays put while the page scrolls. The note sits below the section.
- Name the timeline on the section with `view-timeline` or `scroll-timeline`, and drive one animation on the stage with `animation-timeline` and `animation-range`.
- The scene is inline SVG layers (sky, back mountains, front mountains, fjord, cabin, trees) styled from CSS, so the colors can come from custom properties.

## The one number

- `@property --time { syntax: '<number>'; inherits: true; initial-value: 12; }`, animated from 6 (morning) to 24 (midnight) with `linear` timing. The sun angle math below still uses the full 24-hour circle.
- Derive everything else in CSS. Sun angle `calc(var(--time) / 24 * 360deg - 90deg)`, position from `cos()`/`sin()` of that angle on an ellipse. The moon is the same angle plus 180deg.
- Sun height (`sin()` of the angle) drives sky brightness, shadow length and star opacity. Clamp with `clamp()` or `max(0, ...)` so night stays night.
- Shadows. Either a skewed and scaled copy of each shape, or `drop-shadow` with offsets from `cos()`. Try the skewed copy first, since `drop-shadow` can't stretch.

## Colors

- The sky probably needs a few keyframed color stops (dawn, day, dusk, night) rather than pure math. Keyframes on registered `<color>` properties interpolate fine. Maybe a second animation on the same timeline for the sky, separate from `--time`.
- Check how this sits with the `light-dark()` tokens. The scene likely has its own palette and ignores the color scheme, but the page frame around it should follow the tokens.

## Windows and stars

- Each window gets a light-on time from `sibling-index()`, for example `18 + sibling-index() * 0.4`, and toggles with something like `clamp(0, (var(--time) - var(--on)) * 10, 1)`. Turn them off again late at night the same way.
- Stars: a handful of positioned dots, opacity from sun height, a little twinkle offset by `sibling-index()`.

## Fallbacks

- `@supports not (animation-timeline: scroll())`: show a fixed time (golden hour looks best) and the slider.
- `prefers-reduced-motion`: no scroll linkage. A range input sets `--time` through a few lines of script. This is the only JavaScript.
- Check Firefox support for scroll-driven animations when building, and mention the gap in the note if it's still there.

## Open questions

- Infinite variant: run the full 0 to 24 cycle in the scene's own scroll container inside the demo, and jump the scroll position back at the end. The state at 24 equals the state at 0, so the jump is invisible, and the page around it scrolls as usual. Needs a few lines of JavaScript. Build the linear version first.
- Pure CSS math vs. keyframes. How much can stay derived from `--time` before it gets unreadable?
- Does the time display (`14:00`) work through `counter()` on an integer `@property`, or does it need a separate trick for minutes?
- Mobile: the sticky stage should work, but SVG scaling and the `100vh` vs. `100svh` question need a look.
