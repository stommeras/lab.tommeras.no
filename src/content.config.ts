import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// The allowed frontmatter values live here, not in their own module. The dev server reloads the schema only when this
// file changes, so a list in an imported file goes stale until a restart.

export const STATUSES = ['skisse', 'pågår', 'ferdig'] as const;
export type Status = (typeof STATUSES)[number];

// A status added above without a color fails astro check
export const STATUS_COLORS = {
  skisse: 'var(--pink)',
  pågår: 'var(--peach)',
  ferdig: 'var(--mint)',
} satisfies Record<Status, string>;

// What the experiment is about. Add a value when a new kind of experiment shows up.
export const TAGS = ['Animasjon', 'Layout', 'Simulering', 'WebAssembly'] as const;
export type Tag = (typeof TAGS)[number];

// The main language the experiment is written in, one per experiment
export const LANGUAGES = ['CSS', 'TypeScript', 'Zig', 'Rust'] as const;
export type Language = (typeof LANGUAGES)[number];

// Each experiment is a folder in src/experiments: index.md holds the metadata and the note, Demo.astro the experiment
const experiments = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './src/experiments',
    // The folder name is the slug and the URL
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    title: z.string(),
    // A YAML date, optionally with a time (2026-10-29T21:30:00) to order entries from the same day. YAML reads a time
    // without an offset as UTC, so the shown date never shifts. Without seconds it's a string, which z.date() rejects.
    date: z.date(),
    status: z.enum(STATUSES),
    summary: z.string(),
    language: z.enum(LANGUAGES),
    tags: z
      .array(z.enum(TAGS))
      .min(1)
      .refine((tags) => new Set(tags).size === tags.length, 'A tag is listed twice'),
  }),
});

export const collections = { experiments };
