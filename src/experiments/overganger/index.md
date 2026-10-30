---
title: Overganger mellom sider
date: 2026-10-30T15:30:00
status: ferdig
language: CSS
tags: [Animasjon]
summary: Tittelen på forsiden vokser til overskriften når du åpner et eksperiment, med cross-document view transitions.
---

Dette eksperimentet er hele siden. Gå tilbake til [forsiden](/) og klikk på et eksperiment. Tittelen i lista glir opp og blir til overskriften, og når du går tilbake, krymper den ned på plassen sin igjen.

Denne siden er en vanlig statisk side, og hver lenke laster en helt ny side. Sånne overganger krevde før en single-page app med en router i JavaScript. Nå holder det med én regel i CSS, som begge sidene må ha:

```css
@media (prefers-reduced-motion: no-preference) {
  @view-transition {
    navigation: auto;
  }
}
```

Den alene gir en crossfade av hele siden. For at tittelen skal vokse, får lenken på forsiden og overskriften på eksperimentet samme `view-transition-name`:

```astro
<a href={`/${id}/`} style={`view-transition-name: title-${id}; view-transition-class: shared-entry`}>{data.title}</a>

<h1 style={`view-transition-name: title-${entry.id}; view-transition-class: shared-entry`}>{entry.data.title}</h1>
```

Nettleseren tar et bilde av den gamle tittelen og den nye, og animerer plassering og størrelse fra den ene til den andre. Navnet må være unikt på siden, så slug er med i navnet. Linja med dato, status og tags under tittelen får sitt eget navn på samme måte og flytter seg sammen med tittelen.

Med standard crossfade dukket teksten på den nye siden opp mens tittelen fortsatt var på vei. Nå fades den gamle siden ut først, og den nye fades inn når tittelen nesten er framme:

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

Alle eksperimentene i lista har navn, men bare det du klikker på har noe å flytte seg til. De andre poppet inn før resten av lista når du gikk tilbake. Alle titlene og linjene under har `view-transition-class: shared-entry`, så én selector treffer dem. Et bilde uten partner er alene i sin `::view-transition-image-pair`, så `:only-child` finner dem, og de får samme fade som resten av siden.

Bildet strekkes til bredden av elementet. En `h1` er en block og fyller hele kolonnen, så den lille lenken ble dratt ut til 760 px midt i overgangen. `width: fit-content` på overskriften gjør den like bred som teksten, og da vokser tittelen jevnt.

Med redusert bevegelse er det ingen overgang, siden bytter bare. Det virker i Chrome og Edge fra versjon 126 og i Safari fra 18.2. Firefox har det bare i Nightly enda. I vanlig Firefox fra versjon 151 kan du skru det på selv ved å sette `dom.viewTransitions.cross-document.enabled` til `true` i `about:config`. Uten det bytter siden som før.
