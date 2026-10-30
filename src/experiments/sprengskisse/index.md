---
title: En sprengskisse i CSS
date: 2026-10-30T14:00:01
status: skisse
language: CSS
tags: [Animasjon, 3D, Layout]
summary: En gjenstand som deler seg i lag når du scroller, med merkelapper som følger hver del.
---

En sprengskisse er tegningen i en bruksanvisning der alle delene svever litt fra hverandre, så du ser hvordan ting henger sammen. Ideen er å gjøre den til noe du scroller gjennom.

Gjenstanden, kanskje et mekanisk tastatur eller et kamera, starter hel. Når du scroller, vipper den over i 3D og lagene glir fra hverandre: tastene, platen, kretskortet, kassen. Hver del har en merkelapp med en strek til delen, og merkelappene følger med mens delene beveger seg. Nederst på siden klikker den sammen igjen.

Lagene er vanlige elementer i CSS 3D med `transform-style: preserve-3d`. Merkelappene bruker anchor positioning, så de henger fast på sin del uten at JavaScript regner ut noen posisjoner.

Med redusert bevegelse står gjenstanden ferdig delt opp, uten animasjon.
