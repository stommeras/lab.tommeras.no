---
title: Overganger mellom sider
date: 2026-10-30T15:30:00
status: ferdig
language: CSS
tags: [Animasjon]
summary: Tittelen på forsiden vokser til overskriften når du åpner et eksperiment, med cross-document view transitions.
---

Dette eksperimentet er hele siden. Gå tilbake til [forsiden](/) og klikk på et eksperiment. Tittelen i lista glir opp og blir til overskriften, og når du går tilbake, krymper den ned på plassen sin igjen.

Lab-en er en vanlig statisk side, og hver lenke laster en helt ny side. Sånne overganger krevde før en single-page app med en router i JavaScript. Nå holder det med én regel i CSS, som begge sidene må ha:

```css
@media (prefers-reduced-motion: no-preference) {
  @view-transition {
    navigation: auto;
  }
}
```

Den alene gir en crossfade av hele siden. For at tittelen skal vokse, får lenken på forsiden og overskriften på eksperimentet samme `view-transition-name`:

```astro
<a href={`/${id}/`} style={`view-transition-name: title-${id}`}>{data.title}</a>

<h1 style={`view-transition-name: title-${entry.id}`}>{entry.data.title}</h1>
```

Nettleseren tar et bilde av den gamle tittelen og den nye, og animerer plassering og størrelse fra den ene til den andre. Navnet må være unikt på siden, så slugen er med i det.

Bildet strekkes til bredden av elementet. En `h1` er en block og fyller hele kolonnen, så den lille lenken ble dratt ut til 760 px midt i overgangen. `width: fit-content` på overskriften gjør den like bred som teksten, og da vokser tittelen jevnt.

Med redusert bevegelse er det ingen overgang, siden bytter bare. Det virker i Chrome og Edge fra versjon 126 og i Safari fra 18.2. Firefox har det bare i Nightly enda. I vanlig Firefox fra versjon 151 kan du skru det på selv ved å sette `dom.viewTransitions.cross-document.enabled` til `true` i `about:config`. Uten det bytter siden som før.
