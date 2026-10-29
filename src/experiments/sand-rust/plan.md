# Plan: Sand in Rust

A port of the falling-sand simulation ([../sand/](../sand/)) to Rust, compiled to WebAssembly, then extended with new elements. This is the second of two wasm experiments. Game of Life in Zig ([../livets-spill/plan.md](../livets-spill/plan.md)) comes first and sets up the JS glue this one reuses.

This is a new experiment, not a replacement for `sand/`. That one has the 7-step history and says "Bygget med ren TypeScript", which stays true. `sand-rust/index.md` already links to `/sand/`. The link back from `sand/index.md` comes when the port works, so the finished entry doesn't point at a plan.

## Why Rust for this one

- The sand port is the big, long-lived project, so it gets the stable language. Rust has been stable since 1.0. Code written now still compiles in five years. Zig breaks between releases, and that churn would hurt a lot more here than in Game of Life.
- New elements fit Rust well. A `#[repr(u8)] enum Material` with exhaustive `match` means the compiler shows every rule you forgot when you add oil or fire. The TS version has `switch (getCell(x, y))` with only `SAND` and `WATER` cases. That's exactly where a new element silently does nothing.

## Decisions shared with Game of Life

- **No glue generators.** wasm-pack was archived when the rustwasm org shut down in July 2025. wasm-bindgen still exists under a new org, but it isn't needed. Plain `#[unsafe(no_mangle)] pub extern "C" fn` exports plus a pointer into memory are enough for a grid. On Windows it also helps: with no proc-macro dependencies, the wasm target links with `rust-lld` and doesn't need the MSVC build tools.
- **Commit the built `.wasm`.** Vercel's build image has `rustup` but no toolchain. Installing one on every deploy is slow and can break. Keep `sand.wasm` next to the source in this folder and import it with `import wasmUrl from './sand.wasm?url'`, so Vite fingerprints it and it doesn't need `public/`. Add a `bun run build:wasm:sand` script that runs the compiler locally. Game of Life gets its own `build:wasm:life`, so rebuilding one doesn't need both compilers installed. A `.wasm` that is already committed also follows the freeze convention for free.
- **JS keeps the browser work.** Pointer input, buttons, the `requestAnimationFrame` loop, reading colors from swatches, and `putImageData` stay in TS. Wasm owns the grid and writes RGBA into a pixel buffer. JS wraps that buffer as `new Uint8ClampedArray(memory.buffer, ptr, w*h*4)` and draws it. Use fixed-size buffers so memory never grows. A growth would detach `memory.buffer` and break that view. Create the views after instantiating, never before.
- **No `Math.random` inside wasm.** Write a xorshift32 RNG (5 lines) and seed it from JS.
- **Load on the first click.** AGENTS.md says wasm loads only after the visitor clicks. The page shows an empty canvas and a start button. The first press fetches and instantiates `sand.wasm`. Nothing starts on its own, so `prefers-reduced-motion` needs no special case.

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
cargo build --release --target wasm32-unknown-unknown --target-dir ../../../node_modules/.cache/sand-rust
```

Then copy the `.wasm` out of the target dir. Cargo's default `target/` would land inside `src/`, where the dev server watches for changes. `node_modules/` is already ignored by both git and Vite, so the build output goes there instead.

## Phase 1: faithful port

- Copy the same constants, scan order, `moved_on` frame counter and velocity.
- Keep the struct-of-arrays layout from the TS version: `grid`, `shades`, `rough`, `velocity`, `moved_on`.
- Done when it looks the same as the TS version side by side.
- Then make the grid bigger, around 400×300, to show what wasm buys you. The grid size is a `const`, so the arrays have a fixed size.
- Keep the world in one `static mut WORLD: World` with fixed-size arrays, no heap. It lives in linear memory from the start, so memory never grows. Rust 2024 denies references to a `static mut`, so reach it with `unsafe { &mut *(&raw mut WORLD) }` inside each export. A `static UnsafeCell<World>` won't compile without a wrapper that implements `Sync`, and `Box::leak` allocates, which can grow memory.

## Phase 2: properties instead of special cases

- Give each material a row in a table: kind (solid, powder, liquid, gas), density, flammable, lifetime.
- Replace "sand sinks in water with chance 0.5" with "a heavier material swaps with a lighter one below it". Oil floating on water then comes free.

## Phase 3: new elements

One per step, so the stepper format from `sand/` carries over.

1. **Oil**, a liquid lighter than water. The first test of the density table.
2. **Wood**, a static solid that burns.
3. **Fire**, which has a lifetime, spreads to flammable neighbors and dies into smoke. This needs a per-cell `life: u8` field.
4. **Smoke and steam**, gases that rise and fade.
5. **Lava**, a slow liquid that turns water into steam and itself into stone. This is where interactions between elements get interesting.
6. Optionally **acid** or **plant**. Plant grows into water and burns.

## Setup

- `winget install Rustlang.Rustup`, then `rustup target add wasm32-unknown-unknown`
- Optionally [`wasm-opt`](https://github.com/WebAssembly/binaryen) to shrink the file. Not needed at the start.
