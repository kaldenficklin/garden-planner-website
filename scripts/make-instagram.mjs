#!/usr/bin/env node
/**
 * Render Instagram-shaped versions of every post's image, ready to AirDrop to
 * the phone and post by hand.
 *
 *   node scripts/make-instagram.mjs            # every post with a master
 *   node scripts/make-instagram.mjs <slug>...  # just these
 *
 * Writes to social-exports/ (gitignored — these are not served by the site):
 *
 *   <slug>-feed.jpg   1080x1350  4:5 portrait. The largest shape the feed will
 *                                show, so it takes the most vertical space in
 *                                someone's scroll.
 *   <slug>-story.jpg  1080x1920  9:16, title lifted clear of the bottom third
 *                                so the link sticker has somewhere to sit.
 *   captions.txt                 first-line hook + body + hashtags per post.
 *
 * Neither the 1200x800 hero nor the 1000x1500 pin fits Instagram, so both
 * shapes are re-cropped from the original master rather than resized from a
 * published image — no upscaling, no double compression.
 *
 * Masters live in $TMPDIR/gpp-masters/<slug>.png, written by gen-post-image.mjs.
 * They are temporary: if the OS has cleaned them up, regenerate before running.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import { buildOverlay } from './lib/overlay.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const BLOG = join(ROOT, 'src/content/blog');
const OUT = join(ROOT, 'social-exports');
const MASTERS = join(tmpdir(), 'gpp-masters');
const FONTS = [join(HERE, 'fonts/Fraunces.ttf'), join(HERE, 'fonts/Inter.ttf')];

const FEED = { w: 1080, h: 1350, suffix: 'feed' };
// Lift the story title clear of the bottom third, which is where the link
// sticker goes and where the UI chrome sits.
const STORY = { w: 1080, h: 1920, suffix: 'story', bottomOffset: 560, scrimStart: 0.3 };

/** Pull one scalar out of the frontmatter block. */
function field(src, name) {
  const m = src.match(new RegExp(`^${name}:\\s*"?(.*?)"?\\s*$`, 'm'));
  return m ? m[1] : undefined;
}

/** Pull a YAML inline array like tags: ["a", "b"]. */
function listField(src, name) {
  const m = src.match(new RegExp(`^${name}:\\s*\\[(.*)\\]\\s*$`, 'm'));
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

/** First paragraph of the body, which is written as the hook. */
function firstParagraph(src) {
  const body = src.replace(/^---[\s\S]*?\n---\n/, '').trim();
  return body.split(/\n\s*\n/)[0]?.replace(/\s+/g, ' ').trim() ?? '';
}

async function render(master, { w, h, suffix, bottomOffset = 0, scrimStart }, slug, title) {
  const base = await sharp(master)
    .resize(w, h, { fit: 'cover', position: sharp.strategy.attention })
    .toBuffer();

  const svg = buildOverlay({
    width: w,
    height: h,
    title,
    bottomOffset,
    ...(scrimStart !== undefined ? { scrimStart } : {}),
  });
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: w },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Inter' },
  });

  await sharp(base)
    .composite([{ input: resvg.render().asPng(), top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OUT, `${slug}-${suffix}.jpg`));
}

/**
 * Instagram shows only the first line before "more", so the hook goes there
 * alone. Hashtags are kept out of the caption body and listed separately —
 * they belong in the first comment.
 */
function caption(slug, { title, hook, description, tags }) {
  const hashtags = tags.map((t) => `#${t.replace(/[^a-z0-9]/gi, '')}`).join(' ');
  return [
    `━━━ ${slug} ━━━`,
    '',
    hook,
    '',
    description,
    '',
    'Full guide is linked in our bio 🌱',
    '',
    `[first comment] ${hashtags} #vegetablegarden #gardeningtips #growyourownfood`,
    '',
    `[link] https://thegardenplanner.app/blog/${slug}/`,
    '',
    '',
  ].join('\n');
}

async function main() {
  const only = process.argv.slice(2);
  mkdirSync(OUT, { recursive: true });

  const files = readdirSync(BLOG)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => only.length === 0 || only.includes(f.replace(/\.md$/, '')));

  const captions = [];
  let done = 0;
  let skipped = 0;

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const src = readFileSync(join(BLOG, file), 'utf8');
    if (!field(src, 'image')) continue; // post has no images yet

    const master = join(MASTERS, `${slug}.png`);
    if (!existsSync(master)) {
      console.warn(`skip (no master): ${slug}`);
      skipped++;
      continue;
    }

    const title = field(src, 'pinTitle') ?? field(src, 'title');
    const buf = readFileSync(master);
    await render(buf, FEED, slug, title);
    await render(buf, STORY, slug, title);

    captions.push(
      caption(slug, {
        title,
        hook: firstParagraph(src),
        description: field(src, 'description') ?? '',
        tags: listField(src, 'pinKeywords'),
      })
    );

    console.log(`${slug}: feed + story`);
    done++;
  }

  writeFileSync(join(OUT, 'captions.txt'), captions.join('\n'));
  console.log(`\n${done} posts exported to social-exports/, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
