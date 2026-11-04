---
title: En dag i CSS
date: 2026-10-30T14:00:00
status: skisse
language: CSS
tags: [Animasjon]
summary: Et landskap ved fjorden der scroll er klokka, bygd med ren CSS. Sola går over himmelen og vinduene lyser opp om kvelden.
---

Ideen er én scene, en fjord med fjell, en hytte og noen trær, der hele dagen ligger i scrollen. Åpner du scenen i fullskjerm og scroller nedover, går dagen fra morgen til natt.

Alt styres av ett tall. En scroll-driven animation flytter en `@property --time` fra 6 til 24, altså fra klokka seks om morgenen til midnatt, og resten av scenen regner seg ut fra den:

- Sola og månen går i en bue over himmelen med `sin()` og `cos()`.
- Fjellsidene som vender mot sola lyser opp, og lyset flytter seg fra den ene siden til den andre utover dagen.
- Skyggene fra hytta og trærne snur seg og blir lengre når sola står lavt.
- Himmelen går fra morgengry via dagslys og solnedgang til natt.
- Stjernene kommer frem, og vinduene i hytta lyser opp ett og ett, med forsinkelse fra `sibling-index()`.

Under scenen er det en slider, så du kan styre tiden uten å åpne fullskjerm. Med redusert bevegelse er det bare slideren som styrer tiden. JavaScript brukes bare til slideren og til å åpne og lukke fullskjermen.
