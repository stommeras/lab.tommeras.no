---
title: Punkter på en kule
date: 2026-10-28T12:00:00
status: ferdig
language: TypeScript
tags: [Layout, 3D]
summary: Den gylne vinkelen sprer punkter jevnt over en kule. Et rutenett av lengde- og breddegrader samler dem ved polene.
---

**Fibonacci:** Hvert punkt får sin egen høyde, og vinkelen rundt kulen øker med cirka 137,5 grader fra ett punkt til det neste. Da blir avstanden mellom punktene omtrent lik over hele kulen. 137,5 grader er den gylne vinkelen, og punktene legger seg i spiraler som frøene i en solsikke. Antallet spiraler er Fibonacci-tall, og det er derfor metoden heter Fibonacci.

```js
const golden = Math.PI * (3 - Math.sqrt(5));
const y = 1 - (2 * (i + 0.5)) / n;
const r = Math.sqrt(1 - y * y);
const x = Math.cos(golden * i) * r;
const z = Math.sin(golden * i) * r;
```

**Rutenett:** Hver breddegrad får like mange punkter. Breddegradene blir kortere mot polene. Med 600 punkter står de omtrent elleve ganger tettere på breddegraden nærmest polen enn ved ekvator. Slå på Rutenett under kulen for å se det.

Kulen er tegnet med three.js. Alle punktene er én InstancedMesh, så selv 1000 punkter er bare én draw call.

Dra for å rotere.
