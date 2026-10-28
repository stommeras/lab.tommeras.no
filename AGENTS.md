# lab.tommeras.no

Steffen Tømmerås' lab: a static Astro site of experiments, deployed by Vercel from `main`. The main site is [tommeras.no](https://tommeras.no) in its own repo. [docs/adr/0001-lab-on-subdomain.md](docs/adr/0001-lab-on-subdomain.md) explains why the lab is a separate site.

## Conventions

- Use Bun for every package and script command. A change is done when `bun run build` passes (it runs `astro check`).
- Write all visitor-facing text in Norwegian bokmål. Code, comments, commits and docs are in English.
- Colors come from the `light-dark()` tokens in `src/layouts/Layout.astro`. They are a copy of the tokens in tommeras.no, so change both repos together.
- Every animation honors `prefers-reduced-motion`. With reduced motion, nothing starts on its own and the visitor clicks to start it. A game the visitor has started is exempt.
- Work on a branch named `<type>/<short-description>` (for example `feat/godot-demo`) and merge to `main` through a pull request. Write commit messages as [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`), using the same types as the branch names.

## Experiments

Each experiment is a folder `src/experiments/<slug>/`. The folder name is the URL, `lab.tommeras.no/<slug>/`.

- `index.md` holds the frontmatter (`title`, `date`, `status`, `summary`) and a short note: what it is, why, and what you learned. `src/content.config.ts` has the schema. `status` is `skisse`, `pågår` or `ferdig`.
- `Demo.astro` is the experiment itself. `src/pages/[slug].astro` renders it above the note. Leave it out for a text-only entry.
- Pick the tool per experiment: plain HTML and CSS, a vanilla `<script>`, or a framework island. Add a framework integration (`bunx astro add react`) the first time an experiment needs it.
- Add experiment dependencies with exact versions (`bun add --exact`), so an upgrade elsewhere doesn't break an old experiment.
- Prebuilt exports, such as a Godot web build, go in `public/<slug>/` and load in an `<iframe>` from `Demo.astro`.
- Anything heavy (wasm, Pyodide, a 3D scene, a game) loads only after the visitor clicks a start button, never on page load.
- Mobile support is optional. Say "fungerer best på desktop" in the note when it doesn't work on a phone.
- An experiment that needs `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` (a threaded Godot build, `SharedArrayBuffer`) gets them for its own path only, in `vercel.json`.
- When an experiment breaks after an upgrade and isn't worth fixing, freeze it: commit its built output to `public/<slug>/`, remove its dependencies, and point `Demo.astro` at the frozen build.

## Development

Start the dev server in the background with `bun astro dev --background`. Manage it with `bun astro dev stop`, `bun astro dev status` and `bun astro dev logs`.
