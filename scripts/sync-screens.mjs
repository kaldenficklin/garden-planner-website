#!/usr/bin/env node
/**
 * Pull the app's plain screen captures into public/assets/screens/.
 *
 *   node scripts/sync-screens.mjs            # sibling checkout
 *   APP_REPO=../some/other/path node scripts/sync-screens.mjs
 *
 * The source is the app repo's *uncomposed* iPhone 6.9" captures — the ones the
 * store pipeline later frames with marketing copy. The site wants them bare,
 * because it draws its own phone bezel around them in CSS.
 *
 * Refresh them by re-running the app's capture script first:
 *
 *   cd ../garden-pro-planner && npm run screenshots:capture
 *
 * Captures are 1320x2868. The site never shows one wider than 320 CSS px, so
 * they get resized to 660 (2x) here — same picture, a twentieth of the bytes.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const APP_REPO = resolve(ROOT, process.env.APP_REPO ?? '../garden-pro-planner');
const SRC = join(APP_REPO, 'store-assets/screenshots/iphone-6.9');
const OUT = join(ROOT, 'public/assets/screens');

/** capture file → the name the site links to. */
const SCREENS = {
  '01-gardens.png': 'gardens.png',
  '02-garden-detail.png': 'garden-detail.png',
  '03-blueprint.png': 'blueprint.png',
  '04-plants.png': 'plants.png',
  '05-calendar.png': 'calendar.png',
  '06-yield.png': 'yield.png',
  '07-settings.png': 'settings.png',
};

/** Display width the site uses at 1x. Everything is emitted at 2x. */
const WIDTH = 660;

if (!existsSync(SRC)) {
  console.error(`No captures at ${SRC}\nSet APP_REPO, or run the app's screenshots:capture first.`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

for (const [from, to] of Object.entries(SCREENS)) {
  const src = join(SRC, from);
  if (!existsSync(src)) {
    console.warn(`skip (missing): ${from}`);
    continue;
  }
  const { height } = await sharp(src)
    .resize({ width: WIDTH })
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(OUT, to));
  console.log(`${from} → ${to}  ${WIDTH}x${height}`);
}
