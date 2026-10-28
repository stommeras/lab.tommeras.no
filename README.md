# lab.tommeras.no

Eksperimenter av Steffen Tømmerås: skisser, demoer og ting som kanskje ikke virker ennå. Hovedsiden er [tommeras.no](https://tommeras.no).

Laget med [Astro](https://astro.build). Vercel bygger og publiserer `main`.

## Kom i gang

```console
$ bun install
$ bun dev        # http://localhost:4321
$ bun run build  # astro check og statisk bygg til dist/
$ bun run format # Prettier
```

## Nytt eksperiment

Lag en mappe i `src/experiments/` med navnet du vil ha i URL-en:

```console
$ ls src/experiments/mitt-eksperiment/
index.md     tittel, dato, status, sammendrag og et kort notat
Demo.astro   selve eksperimentet
```

Se [AGENTS.md](AGENTS.md) for reglene og [docs/adr/](docs/adr/) for hvorfor siden er satt opp slik.
