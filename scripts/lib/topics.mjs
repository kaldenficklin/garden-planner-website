/**
 * Topic pool and duplicate prevention for the daily infographic routine.
 *
 * The dedupe key is the topic's `key`, written into both language files as
 * `translationKey`. That field already has to exist to pair the en/es versions
 * for hreflang, so it doubles as the ledger and there is no separate state file
 * to drift out of sync with what is actually published. If a post is deleted
 * from the repo, its topic becomes available again, which is the behaviour you
 * want.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const CONTENT = join(ROOT, 'src/content/blog');
const TOPICS = join(ROOT, 'scripts/data/topics.json');

export function loadTopics() {
  const { topics } = JSON.parse(readFileSync(TOPICS, 'utf8'));
  return topics;
}

/** Every markdown file in the collection, both languages. */
function contentFiles() {
  const out = [];
  const walk = (dir, prefix = '') => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      if (name.isDirectory()) walk(join(dir, name.name), `${prefix}${name.name}/`);
      else if (name.name.endsWith('.md')) out.push({ path: join(dir, name.name), id: prefix + name.name.replace(/\.md$/, '') });
    }
  };
  walk(CONTENT);
  return out;
}

/** Topic keys already published, read straight from the content files. */
export function usedKeys() {
  const keys = new Set();
  for (const f of contentFiles()) {
    const m = readFileSync(f.path, 'utf8').match(/^translationKey:\s*["']?([^"'\n]+)["']?\s*$/m);
    if (m) keys.add(m[1].trim());
  }
  return keys;
}

/** Slugs already taken, so a new topic can never collide with an existing URL. */
export function usedSlugs() {
  return new Set(contentFiles().map((f) => f.id.replace(/^es\//, '')));
}

/**
 * The next `count` unused topics.
 *
 * Returns fewer than asked for when the pool is running out rather than
 * repeating a topic — publishing a duplicate is worse than publishing one
 * infographic instead of two, and the caller warns loudly on a short return.
 */
export function nextTopics(count) {
  const used = usedKeys();
  const available = loadTopics().filter((t) => !used.has(t.key));
  return { picked: available.slice(0, count), remaining: available.length };
}
