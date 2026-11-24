import { existsSync, readdirSync } from 'node:fs';
import { chromium, type Locator, type Page } from 'playwright-core';

const base = process.argv[2] ?? 'http://localhost:4322';
const only = process.argv.slice(3);
const slugs = readdirSync('src/experiments').filter(
  (slug) => existsSync(`src/experiments/${slug}/Demo.astro`) && (!only.length || only.includes(slug)),
);

type ShareOfTarget = [x: number, y: number];

async function drag(page: Page, target: Locator, from: ShareOfTarget, to: ShareOfTarget) {
  const box = (await target.boundingBox())!;
  const at = ([x, y]: ShareOfTarget) => [box.x + box.width * x, box.y + box.height * y] as const;
  await page.mouse.move(...at(from));
  await page.mouse.down();
  await page.mouse.move(...at(to), { steps: 30 });
  await page.mouse.up();
}

type ShotTarget = Locator | void;
const GAME_OF_LIFE_RUN_MS = 12000;
const GODOT_LOAD_MS = 15000;
const PREVIEW_ASPECT = 10 / 16;

const prepare: Record<string, (page: Page, demo: Locator) => Promise<ShotTarget>> = {
  // The emulator runs in an iframe. The third select picks a game, and the first one in the list is fine
  chip8: async (page, demo) => {
    await demo.locator('.start-button').click();
    const game = demo.frameLocator('iframe').locator('select').nth(2);
    await game.selectOption({ index: 1 });
    await page.waitForTimeout(4000);
  },
  'livets-spill': async (page, demo) => {
    await demo.locator('.start-button').click();
    await page.waitForTimeout(500);
    await demo.locator('.randomize-button').click();
    await page.waitForTimeout(GAME_OF_LIFE_RUN_MS);
  },
  // Needs the cross-origin isolation headers from vercel.json, so run it against the deployed site:
  // bun run previews https://lab.tommeras.no varde
  varde: async (page, demo) => {
    await demo.locator('.start-button').click();
    await page.waitForTimeout(GODOT_LOAD_MS);
  },
  sand: async (page, demo) => {
    const canvas = demo.locator('canvas');
    await demo.locator('[data-material="stone"]').click();
    await drag(page, canvas, [0.2, 0.7], [0.5, 0.8]);
    await drag(page, canvas, [0.6, 0.5], [0.85, 0.55]);
    await demo.locator('[data-material="sand"]').click();
    for (const x of [0.15, 0.25, 0.3, 0.35, 0.45, 0.65, 0.7, 0.75])
      await drag(page, canvas, [x, 0.02], [x + 0.08, 0.45]);
    await demo.locator('[data-material="water"]').click();
    await drag(page, canvas, [0.6, 0.05], [0.8, 0.15]);
    await page.waitForTimeout(6000);
  },
  sprengskisse: async (page, demo) => {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(1500);
    return demo.locator('.stage');
  },
};

// playwright-core downloads no browser, so this uses the installed Chrome
const browser = await chromium.launch({ channel: 'chrome' });
for (const colorScheme of ['light', 'dark'] as const) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, colorScheme });
  for (const slug of slugs) {
    await page.goto(`${base}/${slug}/`, { waitUntil: 'networkidle' });
    const demo = page.locator('main > .byline + :not(.note)').first();
    await demo.evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(1000);
    const target = (await prepare[slug]?.(page, demo)) ?? demo;
    const box = (await target.boundingBox())!;
    await page.screenshot({
      path: `src/experiments/${slug}/preview-${colorScheme}.png`,
      clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, box.width * PREVIEW_ASPECT) },
    });
    console.log(`${slug} ${colorScheme}`);
  }
  await page.close();
}
await browser.close();
