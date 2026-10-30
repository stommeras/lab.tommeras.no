# Plan: Livets spill in Zig

Game of Life written in Zig, compiled to WebAssembly. This is the first of two wasm experiments. The second is the sand port in Rust ([../sand-rust/plan.md](../sand-rust/plan.md)), which reuses the JS glue from this one.

## Why Zig for this one

- Game of Life is small and gets finished. Zig is at 0.17 (October 2026) and breaks between releases. 0.17 moved files and clocks behind `std.Io`, for example. That churn costs little on a 200-line program, and a lot on a sand simulation that keeps growing. That one goes to Rust.
- The rules fit in 10 lines, so the learning goes into the wasm part: linear memory, exports, and drawing pixels from a pointer. Zig shows that with nothing in between.
- The stretch goals suit Zig well: grid size at `comptime`, bit-packed cells, `@Vector` SIMD.
- Doing this first teaches the bare wasm boundary. The Rust port then only has to learn Rust's half.

## Decisions shared with the sand port

- **No glue generators.** Plain exported functions plus a pointer into memory is enough for a grid. Both experiments follow the same pattern.
- **Commit the built `.wasm`.** Vercel's build image has no Zig. Installing it on every deploy is slow and can break. Keep `life.wasm` next to the source in this folder and import it with `import wasmUrl from './life.wasm?url'`, so Vite fingerprints it and it doesn't need `public/`. Add a `bun run build:wasm:life` script that runs the compiler locally. The sand port gets its own `build:wasm:sand`, so rebuilding one doesn't need both compilers installed. A `.wasm` that is already committed also follows the freeze convention for free.
- **JS keeps the browser work.** Pointer input, buttons, the `requestAnimationFrame` loop, reading colors from swatches, and `putImageData` stay in TS. Wasm owns the grid and writes RGBA into a pixel buffer. JS wraps that buffer as `new Uint8ClampedArray(memory.buffer, ptr, w*h*4)` and draws it. Use fixed-size buffers so memory never grows. A growth would detach `memory.buffer` and break that view. Create the views after instantiating, never before.
- **No `Math.random` inside wasm.** Write a xorshift32 RNG (5 lines) and seed it from JS.
- **Load on the first click.** AGENTS.md says wasm loads only after the visitor clicks. The page shows a still canvas and a play button. The first press fetches and instantiates `life.wasm`, then starts the loop. Nothing starts on its own, so `prefers-reduced-motion` needs no special case.

## Layout

```
livets-spill/
  index.md
  plan.md
  Demo.astro        canvas, buttons, JS glue
  life.zig
  life.wasm         committed build output
```

Build command:

```sh
zig build-exe life.zig -target wasm32-freestanding -O ReleaseSmall -fno-entry -rdynamic
```

Use `-rdynamic` or one `--export=name` per function. The Zig guide I found used `--export`.

## Zig side

- `const W = 256; const H = 192;` at comptime, with `var cells: [2][W*H]u8` for double buffering and `var pixels: [W*H]u32`. Globals live in linear memory, so you need no allocator.
- Wasm is little-endian, so a `u32` pixel reads as bytes in reverse order. Pack colors as `a << 24 | b << 16 | g << 8 | r` to get RGBA in the `Uint8ClampedArray`. `setPalette` takes colors in that form, and JS packs them from the computed swatch colors.
- Exports: `seed(u32)`, `randomize(density)`, `step()`, `paint()`, `generation()`, `population()`, `width()`, `height()`, `set(x, y, alive)`, `toggle(x, y)`, `stamp(pattern, x, y)`, `clear()`, `setPalette(alive, dying, dead)`, `pixelsPtr()`. `paint()` is exported so JS can repaint after a theme change without stepping. Every export that changes cells also repaints the pixels it changed, so JS only has to draw. `population()` counts the live cells on each call, which is cheap next to a step and needs no running count.
- Edges wrap with `@mod` (a torus), so gliders loop around.
- Each cell stores an age instead of a bool. A live cell is `ALIVE` (255), and a dead one loses `FADE = 40` per step, so its trail fades out over 7 generations. A fading cell never counts as a neighbor. `paint()` uses the alive color for live cells and blends fading ones from the dying color to the dead color.
- The palette comes from the theme tokens through hidden swatches: alive is `--pink`, like the canvas border, dying is `--lavender` mixed 55% toward `--surface`, so a cell that just died is lighter or darker than a live one and not only another hue, and dead is `--surface`. A theme change calls `setPalette` and `paint()` again.
- Patterns are drawn as text pictures and parsed at comptime. `stamp` clears the pattern's bounding box plus a 1-cell margin first, and wraps around the edges.

## Page

- A Start button over the still canvas loads the wasm, fills the grid at random and starts the loop.
- Start/Pause, Steg, and a Fart slider for 1 to 60 generations per second, 20 by default. The `requestAnimationFrame` loop keeps a time accumulator and steps while it holds a whole step, give or take 1 ms for rounded frame timestamps, so the speed doesn't depend on the refresh rate. It runs at most 4 steps per frame and clamps the accumulator to that, so a tab coming back from the background doesn't run a burst of generations. It draws once per frame, after the steps.
- Counters for Generasjon and Levende (the population), updated after every step and edit.
- Pattern buttons that stamp a glider, a Gosper glider gun and an R-pentomino where the visitor last clicked, or in the middle. Tilfeldig fills the grid at random, and Tøm empties it.
- Click or drag on the canvas to toggle cells. A drag that starts on a live cell erases.

## Stretch goals

Each one is a good paragraph for the note.

1. Bit-pack the grid and count neighbors with bitwise adders. One bit per cell has no room for the age the fading trails need, so the age moves to its own `[W*H]u8` array, updated only for cells that change.
2. Compare the run time of `step()` against a 20-line JS version on a 1024² grid. W and H are fixed at comptime, so this needs a second build with 1024 × 1024, for example through a `build.zig` option.
3. Write `@Vector` SIMD for the neighbor count.

## Setup

- `winget install zig.zig`
- Optionally [`wasm-opt`](https://github.com/WebAssembly/binaryen) to shrink the file. Not needed at the start.
