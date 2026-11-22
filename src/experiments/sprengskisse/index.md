---
title: En sprengskisse i CSS
date: 2026-10-30T14:00:01
status: pågår
language: CSS
tags: [Animasjon, 3D, Layout]
summary: En gjenstand som deler seg i lag når du scroller, med merkelapper som følger hver del.
---

En sprengskisse er tegningen i en bruksanvisning der alle delene svever litt fra hverandre, så du ser hvordan ting henger sammen. Ideen er å gjøre den til noe du scroller gjennom.

Gjenstanden er et mekanisk tastatur med norsk oppsett. Når du scroller, vipper det over i 3D og lagene glir fra hverandre: tastene, bryterne, stabilisatorene under de lange tastene, platen, kretskortet og kassen. Tastene løsner i en bølge, fra øverste venstre hjørne. Hver del har en merkelapp med en strek bort til delen, og merkelappene følger med mens delene beveger seg. Lenger ned klikker tastaturet sammen igjen.

Lagene er vanlige elementer i CSS 3D med `transform-style: preserve-3d`, og hver tast er en egen `div`. Merkelappene bruker anchor positioning, så de henger fast på sin del uten at JavaScript regner ut noen posisjoner.

Det jeg ikke visste: Chrome følger et anchor gjennom 3D-transforms, men tar ikke med `perspective`. Med perspektiv drev merkelappene opptil 15 piksler bort fra delen sin når lagene gled fra hverandre. Uten perspektiv sitter de helt presist, så tastaturet er tegnet ortografisk, sånn som en sprengskisse i en bruksanvisning uansett pleier å være.

Med redusert bevegelse står tastaturet ferdig delt opp, og du klikker på Sett sammen for å se det samlet. Firefox 157 har anchor positioning, men plasserer et anchor etter boksen før transformen, så alle merkelappene havner på samme sted. Der, og i nettlesere uten anchor positioning, blir merkelappene en forklaring under tastaturet.
