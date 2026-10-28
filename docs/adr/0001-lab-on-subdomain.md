# The lab is its own Astro site on a subdomain

Date: 2026-10-28

## Decision

The lab lives in its own repo and its own Vercel project, served from `lab.tommeras.no`. It is an Astro site. Each experiment chooses its own tool inside it. The lab and tommeras.no are sibling sites: they share colors and font and link to each other, but they don't pretend to be one site.

## Why

- **Headers.** A threaded Godot build or anything else that uses `SharedArrayBuffer` needs `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`. Those headers block third-party embeds that don't opt in. On a separate origin they can't break tommeras.no.
- **Dependencies.** Three.js, Pyodide and wasm builds stay out of the main site, which remains one small static page. A broken experiment can't fail the main site's build.
- **Astro, not React.** The experiments range from plain CSS to Three.js, Python in the browser and Godot exports. Astro serves a CSS experiment as plain HTML and a React experiment as an island, so React is added when an experiment needs it instead of wrapping every page. Astro also matches tommeras.no.
- **Sibling sites, not seamless navigation.** A subdomain is a different origin, so cross-document View Transitions don't work between the two sites. Shared colors and a link back to tommeras.no make it clear the visitor is in the same place. The lab is allowed to look rougher than the main site.

## Consequences

- The color tokens and font setup are copied from tommeras.no instead of shared through a package. Changing them means editing both repos. A package isn't worth it for about 20 lines.
- A future theme toggle has to store its choice in a cookie on `.tommeras.no`, because `localStorage` isn't shared between the two origins.
- Experiment dependencies are pinned to exact versions, and experiments that rot get frozen as built files instead of kept working.
