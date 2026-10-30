---
title: Livets spill i Zig
date: 2026-10-29T21:30:00
status: pågår
language: Zig
tags: [Simulering, WebAssembly]
summary: Conways Livets spill skrevet i Zig og kompilert til WebAssembly, uten glue-kode fra en generator.
---

Conways Livets spill skrevet i Zig og kompilert til WebAssembly. Rutenettet er 256 × 192 celler, og kantene henger sammen, så en glider som forsvinner ut til høyre kommer inn igjen fra venstre. Trykk Start for å kjøre, eller Steg for å gå én generasjon om gangen.

Zig eier rutenettet og skriver én piksel per celle rett inn i minnet. JavaScript får en peker til pikslene og tegner dem på canvas. Det er ingen glue-kode i mellom, bare noen få exports.

Celler som dør, forsvinner ikke med en gang. De falmer til bakgrunnsfargen over sju generasjoner, så du ser sporene etter det som har levd.

Neste steg er knapper for å tegne og plassere mønstre.
