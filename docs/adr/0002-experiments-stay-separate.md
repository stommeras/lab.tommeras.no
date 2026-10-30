# Experiments stay separate, and copying code between them is fine

Date: 2026-10-30

## Decision

Each experiment keeps all its code in its own folder, even when another experiment has the same code. When sand-rust needs Game of Life's wasm loading or sand's pointer math, it copies them. `src/lib/` only holds small helpers that rarely change and that several experiments already use, like `lib/color.ts`. Something moves there after the third experiment copies it, not before.

## Why

- **Freezing.** A finished experiment should keep working as it was. A shared module can change under it, and `astro check` catches type errors but not a changed loop timing or pointer mapping. A copy can only break if someone edits that experiment.
- **One file tells the story.** `sand/Demo.astro` grew one step at a time, and the stepper on the page tells that history. Reading one file shows the whole experiment. Splitting the simulation into its own module would make it testable, but the experiment would stop reading as one piece.
- **Each copy can differ.** sand and Game of Life map the pointer and time the loop in different ways. Each one fits its own experiment, and neither needs to match the other.

## Consequences

- An architecture review will find the same loop, pointer mapping and wasm loading in several Demo scripts. That's on purpose. Don't suggest pulling them into a shared module unless a third experiment has copied them.
- A bug fixed in one copy isn't fixed in the others. Fix each experiment on its own, if it's worth it.
- The sand stepper (`sand/Steps.astro`) gets copied into sand-rust when Phase 3 needs it, the same way.
