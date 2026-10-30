---
title: Overganger mellom sider
date: 2026-10-30T15:30:00
status: ferdig
language: CSS
tags: [Animasjon]
summary: Tittelen på forsiden vokser til overskriften når du åpner et eksperiment, med cross-document view transitions.
---

Dette eksperimentet er over hele siden. Gå til [forsiden](/) og klikk på et eksperiment. Tittelen glir opp og blir til overskriften, og krymper tilbake når du går tilbake.

Hver lenke laster en helt ny side. Før måtte du ha en single-page app for sånt. Nå holder det med én regel i CSS på begge sidene:

```css
@media (prefers-reduced-motion: no-preference) {
  @view-transition {
    navigation: auto;
  }
}
```

Den gir en crossfade av hele siden. For at tittelen skal vokse, får lenken og overskriften samme `view-transition-name`, med slug i navnet så det blir unikt. Linja med dato, status og tags får sitt eget navn og følger med.

```astro
<a href={`/${id}/`} style={`view-transition-name: title-${id}; view-transition-class: shared-entry`}>
  {data.title}
</a>

<h1 style={`view-transition-name: title-${entry.id}; view-transition-class: shared-entry`}>{entry.data.title}</h1>
```

Med standard crossfade dukket den nye teksten opp mens tittelen enda var på vei, og det så rotete ut. Nå toner den gamle siden ut først, og den nye toner inn når tittelen nesten er framme:

```css
::view-transition-old(root),
::view-transition-old(.shared-entry):only-child {
  animation: 0.15s ease-in both vt-fade-out;
}

::view-transition-new(root),
::view-transition-new(.shared-entry):only-child {
  animation: 0.25s ease-out 0.25s both vt-fade-in;
}
```

`:only-child` er for de andre titlene i lista. De har ingen partner på den andre siden, så de poppet inn før resten. Nå får de samme fade som siden.

En `h1` er en block og fyller hele kolonnen, og nettleseren strekker bildet til den bredden. Den lille lenken ble dratt ut til 760 px midt i overgangen. `width: fit-content` på overskriften fikset det.

Med redusert bevegelse bytter siden bare. Det virker i Chrome og Edge fra 126 og Safari fra 18.2. Firefox har det bare i Nightly, og å skru på `dom.viewTransitions.cross-document.enabled` hjelper ikke før versjon 160.
