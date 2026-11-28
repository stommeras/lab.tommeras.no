---
title: En stærflokk i WebGPU
date: 2026-11-28
status: pågår
language: WGSL
tags: [Simulering, Animasjon, WebGPU]
summary: Opptil 100 000 stær som flyr som en flokk, regnet ut i compute shaders med WebGPU. Musepekeren er en hauk.
---

Om høsten kan du se stær samle seg i store flokker før de slår seg ned for natten. Flokken bølger og bretter seg som én ting, og når en hauk kommer, går det mørke bølger gjennom den. Jeg ville se om nettleseren klarer å regne ut sånn flokk med titusenvis av fugler.

Hver fugl følger tre regler fra boids, en modell Craig Reynolds laget i 1986. Den holder avstand til de nærmeste, flyr i samme retning som dem og drar seg mot midten av dem. I tillegg trekkes hele flokken svakt mot et punkt som vandrer rundt midt på skjermen, så den holder seg i bildet. Fugler nær musepekeren svinger unna og til siden, i den retningen de allerede flyr, så flokken deler seg og lukker seg rundt hauken.

Alt skjer på skjermkortet i fem compute passes per bilde. Det første tømmer et rutenett, det andre teller fuglene i hver rute, og det tredje regner ut hvor hver rute begynner med en prefix sum. Det fjerde sorterer fuglene etter rute, og det siste oppdaterer hver fugl fra naboene i de ni rutene rundt den. Uten rutenettet måtte hver fugl ha sjekket alle de andre, og med 100 000 fugler er det 10 milliarder par per bilde.

De mørke bølgene kom ikke av seg selv. En fugl tegnes som en liten trekant, og en tett klump ble bare en jevn mørk flekk. Ekte stær ser mørkere ut når de svinger, fordi du ser mer av vingene. Derfor husker hver fugl hvor fort den svinger, og en fugl som svinger tegnes bredere og mørkere. Når hauken presser fuglene til å svinge, sprer svingen seg gjennom flokken med retningsregelen, og det er den du ser som en bølge.

Først var midten av flokken en svart klump likevel. Fuglene der skalv, fordi naboene er et tilfeldig utvalg som endrer seg hvert bilde, og all skjelvingen så ut som svinger. Det hjalp å sette en grense for hvor hardt en fugl kan styre. Da glatter treghet ut støyen, og bare ekte svinger blir mørke. Trekket mot midten var også en fjær først, og den klemte flokken til en ball. Nå trekker det bare når flokken er langt unna punktet.

En tett klump kan ha hundrevis av fugler i samme rute. Da leser hver fugl bare 16 av dem, og lar hver av dem telle for flere. Det holder farten jevn uansett hvor tett flokken flyr.

Demoen trenger WebGPU, som Chrome, Edge og Safari har. Med en finger på skjermen er fingeren hauken.
