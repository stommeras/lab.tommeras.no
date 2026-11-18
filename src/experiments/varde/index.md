---
title: Varde
date: 2026-11-18
status: pågår
language: GDScript
tags: [Spill, 3D]
summary: Et rolig utforskingsspill i Godot. Hver runde lager en ny øy, og du følger gamle varder opp til den ekte toppen mens kartet fyller seg ut.
---

Du går i land på en ukjent øy med et blankt kart. På den høyeste toppen står en gammel varde, og en sti av mindre varder viser veien opp. Hver varde har en lapp som peker mot den neste, skrevet ut fra det som faktisk finnes på øya, som en elv som deler seg eller et vann. Det fins ingen kamp og ingen måte å tape på. Det eneste som driver deg, er nysgjerrigheten på neste varde og landet du ikke har sett enda.

Sånn er planen, i alle fall. Spillet er langt fra ferdig, og så langt kan du bare gå rundt på øya. Synsfeltet, kartet, toppene du kartlegger og stien av varder kommer senere. Etter hvert skal du se lenger jo høyere du står, og flere topper skal være nesten like høye, så du ikke ser nedenfra hvilken som er den ekte.

Øya blir generert fra en seed: støy for høyden, elver som graver ut daler, og klipper langs dalsidene. Verden er 3D, men rendres i 960×540 og skaleres opp, så alt blir pikselgrafikk uten at noe er tegnet for hånd. Koden, spesifikasjonen og planen ligger i [stommeras/varde](https://github.com/stommeras/varde).

Trykk Start og så Ny øy. Frø-feltet kan stå tomt. Gå med WASD eller piltastene, og Escape pauser. Første gang laster nettleseren ned hele spillet, så det tar litt tid.

Bygget bruker tråder, og da trenger nettleseren `SharedArrayBuffer`. Den får siden bare når den er cross-origin isolated, altså når den sender `Cross-Origin-Opener-Policy` og `Cross-Origin-Embedder-Policy`. Spillet ligger i en iframe, så både spillet og siden rundt må sende dem.

Spillet styres med tastaturet, så det fungerer best på desktop. Vinduet må også være minst 1000 piksler bredt, ellers blir spillet beskåret.
