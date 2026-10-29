# Plan: Sand in Rust

A port of the falling-sand simulation ([../sand/](../sand/)) to Rust, compiled to WebAssembly, then extended with new elements. This is the second of two wasm experiments. Game of Life in Zig ([../livets-spill/plan.md](../livets-spill/plan.md)) comes first and sets up the JS glue this one reuses.

This is a new experiment, not a replacement for `sand/`. That one has the 7-step history and says "Bygget med ren TypeScript", which stays true. Link the two notes to each other.

## Why Rust for this one

- The sand port is the big, long-lived project, so it gets the stable language. Rust has been stable since 1.0. Code written now still compiles in five years. Zig breaks between releases, and that churn would hurt a lot more here than in Game of Life.
- New elements fit Rust well. A `#[repr(u8)] enum Material` with exhaustive `match` means the compiler shows every rule you forgot when you add oil or fire. The TS version has `switch (getCell(x, y))` with only `SAND` and `WATER` cases. That's exactly where a new element silently does nothing.

## Decisions shared with Game of Life

- **No glue generators.** wasm-pack was archived when the rustwasm org shut down in July 2025. wasm-bindgen still exists under a new org, but it isn't needed. Plain `extern "C"` exports plus a pointer into memory are enough for a grid. On Windows it also helps: with no proc-macro dependencies, the wasm target links with `rust-lld` and doesn't need the MSVC build tools.
- **Commit the built `.wasm`.** Vercel's build image has `rustup` but no toolchain. Installing one on every deploy is slow and can break. Keep `sand.wasm` next to the source in this folder and import it with `import wasmUrl from './sand.wasm?url'`, so Vite fingerprints it and it doesn't need `public/`. Add a `bun run build:wasm` script that runs the compiler locally. A `.wasm` that is already committed also follows the freeze convention for free.
- **JS keeps the browser work.** Pointer input, buttons, the `requestAnimationFrame` loop, reading colors from swatches, and `putImageData` stay in TS. Wasm owns the grid and writes RGBA into a pixel buffer. JS wraps that buffer as `new Uint8ClampedArray(memory.buffer, ptr, w*h*4)` and draws it. Use fixed-size buffers so memory never grows. A growth would detach `memory.buffer` and break that view.
- **No `Math.random` inside wasm.** Write a xorshift32 RNG (5 lines) and seed it from JS.
- **Reduced motion.** With `prefers-reduced-motion`, nothing moves until the visitor starts it.

## Layout

```
sand-rust/
  index.md
  plan.md
  Demo.astro
  Cargo.toml        crate-type = ["cdylib"], opt-level = "s", lto = true
  src/lib.rs
  sand.wasm         committed build output
```

Build:

```sh
cargo build --release --target wasm32-unknown-unknown
```

Then copy the `.wasm` from `target/`. Add `target/` to `.gitignore`.

## Phase 1: faithful port

- Copy the same constants, scan order, `moved_on` frame counter and velocity.
- Keep the struct-of-arrays layout from the TS version: `grid`, `shades`, `rough`, `velocity`, `moved_on`.
- Done when it looks the same as the TS version side by side.
- Then make the grid bigger, around 400×300, to show what wasm buys you.
- Rust 2024 gotcha: `static mut` references are denied. Keep the world in one struct and either `Box::leak` it or wrap it in `UnsafeCell`.

## Phase 2: properties instead of special cases

- Give each material a row in a table: kind (solid, powder, liquid, gas), density, flammable, lifetime.
- Replace "sand sinks in water with chance 0.5" with "a heavier material swaps with a lighter one below it". Oil floating on water then comes free.

## Phase 3: new elements

One per step, so the stepper format from `sand/` carries over.

1. **Oil**, a liquid lighter than water. The first test of the density table.
2. **Wood**, a static solid that burns.
3. **Fire**, which has a lifetime, spreads to flammable neighbours and dies into smoke. This needs a per-cell `life: u8` field.
4. **Smoke and steam**, gases that rise and fade.
5. **Lava**, a slow liquid that turns water into steam and itself into stone. This is where interactions between elements get interesting.
6. Optionally **acid** or **plant**. Plant grows into water and burns.

## Setup

- `winget install Rustlang.Rustup`, then `rustup target add wasm32-unknown-unknown`
- Optionally [`wasm-opt`](https://github.com/WebAssembly/binaryen) to shrink the file. Not needed at the start.
