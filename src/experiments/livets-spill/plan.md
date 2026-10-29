# Plan: Livets spill in Zig

Game of Life written in Zig, compiled to WebAssembly. This is the first of two wasm experiments. The second is the sand port in Rust ([../sand-rust/plan.md](../sand-rust/plan.md)), which reuses the JS glue from this one.

## Why Zig for this one

- Game of Life is small and gets finished. Zig is at 0.17 (October 2026) and breaks between releases. 0.17 moved files and clocks behind `std.Io`, for example. That churn costs little on a 200-line program, and a lot on a sand simulation that keeps growing. That one goes to Rust.
- The rules fit in 10 lines, so the learning goes into the wasm part: linear memory, exports, and drawing pixels from a pointer. Zig shows that with nothing in between.
- The stretch goals suit Zig well: grid size at `comptime`, bit-packed cells, `@Vector` SIMD.
- Doing this first teaches the bare wasm boundary. The Rust port then only has to learn Rust's half.

## Decisions shared with the sand port

- **No glue generators.** Plain exported functions plus a pointer into memory is enough for a grid. Both experiments follow the same pattern.
- **Commit the built `.wasm`.** Vercel's build image has no Zig. Installing it on every deploy is slow and can break. Keep `life.wasm` next to the source in this folder and import it with `import wasmUrl from './life.wasm?url'`, so Vite fingerprints it and it doesn't need `public/`. Add a `bun run build:wasm` script that runs the compiler locally. A `.wasm` that is already committed also follows the freeze convention for free.
- **JS keeps the browser work.** Pointer input, buttons, the `requestAnimationFrame` loop, reading colors from swatches, and `putImageData` stay in TS. Wasm owns the grid and writes RGBA into a pixel buffer. JS wraps that buffer as `new Uint8ClampedArray(memory.buffer, ptr, w*h*4)` and draws it. Use fixed-size buffers so memory never grows. A growth would detach `memory.buffer` and break that view.
- **No `Math.random` inside wasm.** Write a xorshift32 RNG (5 lines) and seed it from JS.
- **Reduced motion.** It runs on its own, so with `prefers-reduced-motion` it waits for the visitor to press play. It wants play/pause anyway.

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
- Exports: `seed(u32)`, `randomize(density)`, `step()`, `toggle(x, y)`, `stamp(pattern, x, y)`, `setPalette(alive, dying, dead)`, `pixelsPtr()`.
- Edges wrap with `@mod` (a torus), so gliders loop around.
- For a visual twist, store an age per cell instead of a bool. New cells get a bright color and dead ones fade over a few generations. The trails make it much nicer to watch than plain black and white.

## Page

- Pattern buttons that stamp a glider, a Gosper glider gun and an R-pentomino.
- Play/pause, single step, a speed slider and a generation counter.
- Click or drag on the canvas to toggle cells.

## Stretch goals

Each one is a good paragraph for the note.

1. Bit-pack the grid and count neighbours with bitwise adders.
2. Compare the run time of `step()` against a 20-line JS version on a 1024² grid.
3. Write `@Vector` SIMD for the neighbour count.

## Setup

- `winget install zig.zig`
- Optionally [`wasm-opt`](https://github.com/WebAssembly/binaryen) to shrink the file. Not needed at the start.
