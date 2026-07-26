#!/usr/bin/env node
/**
 * Generate the hero + Pinterest images for one blog post.
 *
 *   node scripts/gen-post-image.mjs \
 *     --slug how-to-plant-garlic-in-fall \
 *     --title "How to Plant Garlic in Fall" \
 *     --subject "a gardener's hands pressing garlic cloves into dark soil in a raised bed, papery garlic bulbs and a trowel beside them, autumn light"
 *
 * Writes public/assets/blog/<slug>-hero.jpg and <slug>-pin.jpg, then prints the
 * frontmatter lines to paste into the post.
 *
 * --subject should describe only WHAT is in the shot. The house photographic
 * style is appended automatically so every post on the blog matches.
 *
 * Requires the `higgsfield` CLI, authenticated (`higgsfield auth login`).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

/**
 * The house style. Do not change this casually — it is what keeps every hero
 * on the blog looking like it came from the same photographer.
 */
const STYLE =
  'Realistic documentary garden photography, natural diffused daylight, ' +
  'shallow depth of field, muted natural green and earth palette, crisp fine detail, ' +
  '50mm lens look. Vertical composition, the main subject centered in the frame ' +
  'with clear space above and below it. Photorealistic. ' +
  'Absolutely no text, no lettering, no numbers, no signage, no watermark, no logos.';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const slug = arg('slug');
const title = arg('title');
const subject = arg('subject');

if (!slug || !title || !subject) {
  console.error('usage: gen-post-image.mjs --slug <slug> --title "<title>" --subject "<what is in the shot>"');
  process.exit(1);
}

const prompt = `${subject}. ${STYLE}`;

console.log(`[${slug}] generating master image…`);
const out = execFileSync(
  'higgsfield',
  [
    'generate', 'create', 'gpt_image_2',
    '--aspect_ratio', '2:3',
    '--resolution', '2k',
    '--quality', 'high',
    '--wait', '--wait-timeout', '15m',
    '--prompt', prompt,
  ],
  { encoding: 'utf8', maxBuffer: 1024 * 1024 }
);

const url = out.trim().split(/\s+/).filter((t) => t.startsWith('http')).pop();
if (!url) {
  console.error('no image URL in CLI output:\n' + out);
  process.exit(1);
}

const masterDir = join(tmpdir(), 'gpp-masters');
mkdirSync(masterDir, { recursive: true });
const master = join(masterDir, `${slug}.png`);

console.log(`[${slug}] downloading…`);
const res = await fetch(url);
if (!res.ok) {
  console.error(`download failed: ${res.status}`);
  process.exit(1);
}
writeFileSync(master, Buffer.from(await res.arrayBuffer()));

console.log(`[${slug}] compositing hero + pin…`);
execFileSync('node', [join(HERE, 'make-images.mjs'), master, slug, title, arg('crop') ?? 'attention'], {
  stdio: 'inherit',
  cwd: ROOT,
});

console.log(`
Add to the post frontmatter:

image: "/assets/blog/${slug}-hero.jpg"
imageAlt: "<one line describing the photo>"
pinImage: "/assets/blog/${slug}-pin.jpg"
`);
