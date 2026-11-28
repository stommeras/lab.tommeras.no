---
title: Nordlys
date: 2026-11-28
status: ferdig
language: GLSL
tags: [Shader, Animasjon]
summary: Nordlys over en fjord, tegnet av én fragment shader i WebGL 2. Flytt musa for å snu vinden.
---

Hele bildet er én fragment shader, uten modeller eller teksturer. Hver piksel sender en stråle ut fra kameraet og regner ut hva den treffer: himmel, fjell eller vann.

**Nordlyset** er 44 vannrette lag mellom 3 og 34 enheter over kameraet. Strålen krysser hvert lag, og i krysningspunktet slår shaderen opp hvor langt unna en bølgete linje på bakken punktet er. Nær linja lyser det. Linja er noise, så forhenget folder seg. Stripene i lyset er noise som bare avhenger av x, så de går rett opp gjennom alle lagene og blir til stråler. Fargen går fra grønt nederst til fiolett øverst, med en rosa kant helt nederst, som i ekte nordlys der oksygen lyser grønt og nitrogen rosa.

**Vannet** speiler himmelen. En stråle som går nedover snus oppover igjen, og bølger av noise bøyer den litt, mest opp og ned, så speilbildet strekker seg i striper mot deg.

**Stjernene** står i et rutenett på himmelkula, der noen få ruter får en stjerne. Himmelen dreier sakte rundt en pol omtrent 60 grader opp i nord, som den gjør her i landet.

Det tyngste er nordlyset, som kjører noise flere hundre ganger per piksel. Derfor tegnes bildet i lavere oppløsning, og nettleseren skalerer det opp. Nordlyset er mykt uansett, så det synes nesten ikke.

Musa styrer vinden. Flytter du den mot høyre, driver forhenget den veien, og kameraet snur seg litt etter.
