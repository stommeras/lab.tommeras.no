# lab.tommeras.no

Steffen Tømmerås' lab: a static Astro site of experiments, deployed by Vercel from `main`. The main site is [tommeras.no](https://tommeras.no) in its own repo. [docs/adr/0001-lab-on-subdomain.md](docs/adr/0001-lab-on-subdomain.md) explains why the lab is a separate site.

## Conventions

- Use Bun for every package and script command. A change is done when `bun run build` passes (it runs `astro check`).
- Write all visitor-facing text in Norwegian bokmål, in an informal tone close to spoken language (`enda`, not `ennå`). Code, comments, commits and docs are in English.
- In bokmål text, keep technical terms in English when they are the name in the code or the word developers say: sibling, element, index, render, transition, hover, fallback, DOM. Use Norwegian for everyday words with an established form: nettleser, sirkel, vinkel, farge, knapp. Don't add Norwegian endings to English terms ("siblings", not "siblingene"), and don't italicize or quote them.
- Colors come from the `light-dark()` tokens in `src/layouts/Layout.astro`. They are a copy of the tokens in tommeras.no, so change both repos together.
- Every animation honors `prefers-reduced-motion`. With reduced motion, nothing starts on its own and the visitor clicks to start it. A game the visitor has started is exempt.
- Work on a branch named `<type>/<short-description>` (for example `feat/godot-demo`) and merge to `main` through a pull request. Write commit messages as [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`), using the same types as the branch names.

## Experiments

Each experiment is a folder `src/experiments/<slug>/`. The folder name is the URL, `lab.tommeras.no/<slug>/`.

- `index.md` holds the frontmatter (`title`, `date`, `status`, `summary`, `language`, `tags`) and a short note: what it is, why, and what you learned. `src/content.config.ts` has the schema and the allowed values for `status`, `language` and `tags`. `date` is `2026-10-29`, or `2026-10-29T21:30:00` with seconds and no offset when another entry has the same day, so the newest sorts first. `status` is `skisse`, `pågår` or `ferdig`. `summary` is plain text, but backticks mark code the same way as in Markdown. `language` is the main language the experiment is written in, one per experiment. `tags` says what the experiment is about, like `Layout` or `Simulering`, with each tag once. Add a new status, language or tag to its list in `src/content.config.ts`, not in a separate module, because the dev server only reloads the schema when that file changes. A new status also needs a color in `STATUS_COLORS`, and `astro check` fails without one.
- `Demo.astro` is the experiment itself. `src/pages/[slug].astro` renders it above the note. Leave it out for a text-only entry.
- `bench.ts` is the experiment's object on the workbench on the front page: cuboids of voxels built with the helpers in `src/lib/bench.ts`. An experiment without one gets a crate. `src/lib/workbench.ts` places the objects in rows on the cutting mat, tallest at the back. Every `skisse` is drawn as white lines on one shared sheet of blueprint paper. The newest experiments that fit go on the table, and the older ones are listed under it. Phones, touch screens and narrow windows get the whole list instead, with each object drawn beside its title.
- `preview-light.png` and `preview-dark.png` are screenshots of the demo for the front page cards. Take them with `bun run previews` while the dev server runs. An experiment that needs setup first, like starting a game, gets an entry in `prepare` in `scripts/previews.ts`.
- Pick the tool per experiment: plain HTML and CSS, a vanilla `<script>`, or a framework island. Add a framework integration (`bunx astro add react`) the first time an experiment needs it.
- Add experiment dependencies with exact versions (`bun add --exact`), so an upgrade elsewhere doesn't break an old experiment.
- Prebuilt exports, such as a Godot web build, go in `public/<slug>/` and load in an `<iframe>` from `Demo.astro`.
- Anything heavy loads after the page, never in its initial bundle. A 3D scene loads with a dynamic `import()` when it scrolls into view. Wasm, Pyodide and games wait for the visitor to click a start button.
- Mobile support is optional. Say "fungerer best på desktop" in the note when it doesn't work on a phone.
- `security.csp` in `astro.config.mjs` sets the Content Security Policy as a `<meta>` with hashes. Everything loads from the same origin. An experiment that needs another origin, a `blob:` worker or an `is:inline` script needs a matching change there first. `vercel.json` sends `frame-ancestors` and the other directives a `<meta>` can't carry, plus `default-src`, `script-src` and `style-src` with `'unsafe-inline'` for scanners and for responses without the `<meta>`, like 404 pages and files in `public/`. Browsers enforce the header and the `<meta>` together, so the header doesn't loosen pages that have the `<meta>`. A source added to the `<meta>` must also go in the header, or the header blocks it.
- An experiment that needs `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` (a threaded Godot build, `SharedArrayBuffer`) gets them for its own path only, in `vercel.json`.
- When an experiment breaks after an upgrade and isn't worth fixing, freeze it: commit its built output to `public/<slug>/`, remove its dependencies, and point `Demo.astro` at the frozen build.

## Development

Start the dev server in the background with `bun astro dev --background`. Manage it with `bun astro dev stop`, `bun astro dev status` and `bun astro dev logs`.
