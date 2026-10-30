# Plan: En sprengskisse i CSS

First thoughts, not a decided design.

## The object

- Pick something with clear flat layers, since CSS 3D is good at stacked planes and bad at curved volumes. A mechanical keyboard fits well: keycaps, switches, plate, PCB, case. A camera or a burger are the alternatives.
- Each layer is a `div` (or an SVG inside one) in a container with `transform-style: preserve-3d` and a `perspective` on the parent. Layer thickness can be faked with an edge face or a `box-shadow` stack.
- Keycaps could be a grid of children with `sibling-index()` for small offsets, so they lift off in a wave instead of as one slab.

## Scroll

- Tall section in `Demo.astro` with a `position: sticky` stage, same pattern as `dag-og-natt`.
- Three phases on one timeline, split with `animation-range` or keyframe percentages: tilt the object from flat to an isometric angle, spread the layers along Z, then reverse to assemble at the bottom.
- Each layer's spread distance comes from a custom property (`--layer: 0..4`), so one keyframe rule handles all layers: `translateZ(calc(var(--layer) * var(--spread)))` where `--spread` is a registered `@property` animated by scroll.

## Labels

- Each layer gets `anchor-name: --keycaps` etc. Labels sit outside the 3D context with `position-anchor` and `top: anchor(center)` / `left: anchor(right)`.
- Big unknown: does anchor positioning track an anchor through 3D transforms and track it every frame while a scroll-driven animation runs? Test this first with a single box before building anything else. If it doesn't, fall back to labels inside the 3D context that move with their layer, or position them from the same `--spread` math.
- Leader lines: a pseudo-element on the label stretched toward the anchor, or an SVG line. Start simple.
- Labels fade in only once the layers are apart, keyed off the same timeline.

## Fallbacks

- `@supports not (animation-timeline: scroll())`: show the object exploded and static, labels in place.
- `prefers-reduced-motion`: same static exploded view. Maybe a button to toggle assembled/exploded with a plain transition, which counts as visitor-started.

## Open questions

- Anchor positioning + 3D transforms + scroll timelines together is the risky combination. Prototype it before choosing the object.
- How much detail per layer before it looks fiddly at phone width? Probably "fungerer best på desktop".
- Draw the layers in SVG, or build them from CSS boxes? CSS boxes keep it honest as a CSS experiment, SVG looks better.
