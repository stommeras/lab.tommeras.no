---
title: En sirkel som teller seg selv
date: 2026-10-28
status: ferdig
language: CSS
tags: [Layout, Animasjon]
summary: Prikker som fordeler seg i en sirkel med ren CSS, ved hjelp av `sibling-index()` og `sibling-count()`.
---

Eksperimentet bruker tre nye CSS-funksjoner. Datoen viser når Chrome, Firefox og Safari alle støttet funksjonen.

- `sibling-index()` gir posisjonen til et element blant sine siblings, med 1 som første (august 2026)
  - Hver prikk regner ut vinkel og farge fra sin egen index.
- `sibling-count()` gir antall siblings, med elementet selv (august 2026)
  - CSS deler 360 grader på antall prikker, så vinklene blir like store.
- `@starting-style` setter stilen et element har før første render, så det kan få en transition inn (august 2024)
  - En ny prikk starter med størrelse null og vokser frem.

Den eneste JavaScript-koden legger til og fjerner prikker. Når antallet endrer seg, regner CSS ut nye plasseringer, og prikkene glir dit.
