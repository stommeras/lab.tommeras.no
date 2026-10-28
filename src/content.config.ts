import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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
    date: z.coerce.date(),
    status: z.enum(['skisse', 'pågår', 'ferdig']),
    summary: z.string(),
  }),
});

export const collections = { experiments };
