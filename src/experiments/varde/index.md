---
title: Varde
date: 2026-11-18
status: pågår
language: GDScript
tags: [Spill, 3D]
summary: Et rolig utforskingsspill i Godot. Hver runde lager en ny øy, og du følger gamle varder opp til den ekte toppen mens kartet fyller seg ut.
---

Du går i land på en ukjent øy med et blankt kart. På den høyeste toppen står en gammel varde, og en sti av mindre varder viser veien opp. Hver varde har en lapp som peker mot den neste, skrevet ut fra det som faktisk finnes på øya, som en elv som deler seg eller et vann. Det fins ingen kamp og ingen måte å tape på. Det eneste som driver deg, er nysgjerrigheten på neste varde og landet du ikke har sett enda.

Sånn er planen, i alle fall. Spillet er langt fra ferdig. Så langt ligger øya i tåke til du har sett den, og du kan kartlegge toppene og bygge en varde på hver av dem. Kartet fyller seg ut med det du har sett, og landet du har kartlagt fra en topp får høydekurver. De gamle vardene, lappene og den ekte toppen kommer senere. Etter hvert skal flere topper være nesten like høye, så du ikke ser nedenfra hvilken som er den ekte.

Øya blir generert fra en seed: støy for høyden, elver som graver ut daler, og klipper langs dalsidene. Verden er 3D, men rendres i 960×540 og skaleres opp, så alt blir pikselgrafikk uten at noe er tegnet for hånd. Koden, spesifikasjonen og planen ligger i [stommeras/varde](https://github.com/stommeras/varde).

Trykk Start og så Ny øy. Frø-feltet kan stå tomt. Gå med WASD eller piltastene. Står du nær en topp, kartlegger du den med E. M åpner kartet, og musehjulet eller + og - zoomer. Escape pauser. Første gang laster nettleseren ned hele spillet, så det tar litt tid.

Bygget bruker tråder, og da trenger nettleseren `SharedArrayBuffer`. Den får siden bare når den er cross-origin isolated, altså når den sender `Cross-Origin-Opener-Policy` og `Cross-Origin-Embedder-Policy`. Spillet ligger i en iframe, så både spillet og siden rundt må sende dem.

Spillet styres med tastaturet, så det fungerer best på desktop.
