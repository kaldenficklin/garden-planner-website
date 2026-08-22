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
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const APP_REPO = resolve(ROOT, process.env.APP_REPO ?? '../garden-pro-planner');
const SRC = join(APP_REPO, 'store-assets/screenshots/iphone-6.9');
/** The app-preview recording, at full capture resolution — see FRAMES below. */
const REEL = join(APP_REPO, 'store-assets/previews/raw-iphone69.mov');
const OUT = join(ROOT, 'public/assets/screens');

/**
 * capture file → the name the site links to.
 *
 * Only the stops whose capture actually landed on the screen its name claims.
 * The walk shoots on a timer, and in the current set 02, 08 and 09 slid onto
 * the neighbouring screen (02-garden-season is a shot of the gardens list,
 * 09-calendar is the plant guide) — so 09 is what feeds `plants.png`, and the
 * two screens those misses cost us come out of the reel instead. Re-check this
 * map against the images after any recapture; the names alone will lie.
 */
const SCREENS = {
  '01-gardens.png': 'gardens.png',
  '04-garden-plants.png': 'garden-detail.png',
  '05-blueprint.png': 'blueprint.png',
  '06-plant-detail.png': 'plant-detail.png',
  '09-calendar.png': 'plants.png',
};

/**
 * Screens pulled out of the app-preview recording rather than the stills.
 *
 * Both Gantt views — the bed's season on the garden page and the calendar's
 * timeline tab — are missing from the still set (the walk slid off one and
 * never reached the other). The preview reel is the same SCREENSHOT_MODE build
 * on the same demo garden at the same 1320x2868, so a frame off it is the same
 * picture the stills would have been. Times are seconds into raw-iphone69.mov,
 * picked on settled frames well clear of the push transitions either side.
 */
const FRAMES = {
  'garden-season.png': 28.0,
  'calendar-timeline.png': 50.1,
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

if (!existsSync(REEL)) {
  console.warn(`skip (no reel): ${REEL}`);
} else {
  for (const [to, at] of Object.entries(FRAMES)) {
    // -ss before -i seeks by keyframe and decodes one frame — fast, and exact
    // enough here because every one of these sits mid-dwell on a still screen.
    const png = execFileSync(
      'ffmpeg',
      ['-v', 'error', '-ss', String(at), '-i', REEL, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-'],
      { maxBuffer: 64 * 1024 * 1024 },
    );
    const { height } = await sharp(png)
      .resize({ width: WIDTH })
      .png({ compressionLevel: 9, palette: true })
      .toFile(join(OUT, to));
    console.log(`raw-iphone69.mov @${at}s → ${to}  ${WIDTH}x${height}`);
  }
}
