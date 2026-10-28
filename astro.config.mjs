import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://lab.tommeras.no',
  // Same font as tommeras.no, so the two sites read as one family
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      weights: [400, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
  ],
});
