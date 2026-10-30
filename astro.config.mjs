import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://lab.tommeras.no',
  // A light and a dark theme, joined with light-dark() so code blocks follow the color scheme like the tokens do
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: 'light-dark()',
    },
  },
  // One after tommeras.no's default 4321, so both dev servers can run at once
  server: { port: 4322 },
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
