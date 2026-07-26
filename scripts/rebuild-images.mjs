#!/usr/bin/env node
/**
 * Re-composite every post's hero + pin from its cached master photo, using the
 * title / pinTitle / heroCrop recorded in the post's own frontmatter.
 *
 *   node scripts/rebuild-images.mjs
 *
 * No image generation, no Higgsfield credits — this only redoes the local crop
 * and text compositing. Run it after changing the pin design, the brand fonts,
 * or the JPEG quality in make-images.mjs, so all posts stay consistent.
 *
 * Masters live in $TMPDIR/gpp-masters/<slug>.png, written by gen-post-image.mjs.
 * A post whose master has been cleaned up is skipped with a warning; regenerate
 * it with gen-post-image.mjs if you need it back.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const BLOG = join(ROOT, 'src/content/blog');
const MASTERS = join(tmpdir(), 'gpp-masters');

/** Pull one scalar out of the frontmatter block. */
function field(src, name) {
  const m = src.match(new RegExp(`^${name}:\\s*"?(.*?)"?\\s*$`, 'm'));
  return m ? m[1] : undefined;
}

let done = 0;
let skipped = 0;

for (const file of readdirSync(BLOG).filter((f) => f.endsWith('.md'))) {
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
  const crop = field(src, 'heroCrop') ?? 'attention';

  execFileSync('node', [join(HERE, 'make-images.mjs'), master, slug, title, crop], {
    stdio: 'inherit',
    cwd: ROOT,
  });
  done++;
}

console.log(`\n${done} rebuilt, ${skipped} skipped.`);
