#!/usr/bin/env node
/**
 * Pull the app's device mockups into public/assets/screens/.
 *
 *   node scripts/sync-screens.mjs            # sibling checkout
 *   APP_REPO=../some/other/path node scripts/sync-screens.mjs
 *
 * The source is the 2.5.0 set in the app repo's store-assets/mockups/: iPhone
 * 15 Pro Max mockups, already framed, with transparency around the device. They
 * are the same eight screens the App Store previews are composed from
 * (store-assets/gen-previews.js), so the site and the store show one picture.
 *
 * Because the frame is in the image, the site no longer draws a phone bezel in
 * CSS — `.phone` only sizes the image and casts its shadow.
 *
 * Mockups are 1742x3609. The site never shows one wider than 330 CSS px, so
 * they get resized to 660 (2x) here — same picture, a fraction of the bytes.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const APP_REPO = resolve(ROOT, process.env.APP_REPO ?? '../garden-pro-planner');
const SRC = join(APP_REPO, 'store-assets/mockups');
const OUT = join(ROOT, 'public/assets/screens');

/** The mockup export names run `…Max.png`, `…Max-1.png`, … */
const mock = (n) => `iMockup - iPhone 15 Pro Max${n === 0 ? '' : `-${n}`}.png`;

/**
 * mockup number → the name the site links to. The numbers are the `mock:`
 * values in the app's gen-previews.js PANELS, which names what each one shows;
 * check there if the mockups are ever re-exported in a different order.
 */
const SCREENS = {
  6: 'calendar-timeline.png', // 01-timing: calendar, timeline tab
  7: 'yield.png', //             02-savings: expected yield and season savings
  2: 'blueprint.png', //         03-blueprint: watering plan and bed blueprint
  5: 'garden-log.png', //        04-log: the Garden Log tab
  1: 'garden-season.png', //     05-bed-season: a bed's season timeline
  3: 'plant-season.png', //      06-plant-season: season, rotation, varieties
  4: 'plant-requirements.png', //07-requirements: sun, water, pH, zone
  0: 'gardens.png', //           08-gardens: My Gardens
};

/** Display width the site uses at 1x. Everything is emitted at 2x. */
const WIDTH = 660;

if (!existsSync(SRC)) {
  console.error(`No mockups at ${SRC}\nSet APP_REPO to the app checkout.`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

for (const [n, to] of Object.entries(SCREENS)) {
  const from = mock(Number(n));
  const src = join(SRC, from);
  if (!existsSync(src)) {
    console.warn(`skip (missing): ${from}`);
    continue;
  }
  // No palette quantisation: the frame's anti-aliased edge against
  // transparency bands visibly when squeezed into 256 colours.
  const { height } = await sharp(src)
    .resize({ width: WIDTH })
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, to));
  console.log(`${from} → ${to}  ${WIDTH}x${height}`);
}
