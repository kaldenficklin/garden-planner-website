/**
 * Quality gate for the daily infographic routine.
 *
 * Nothing here is a matter of taste — every check is something that has
 * actually gone wrong in this pipeline or would be visibly broken on a
 * published pin. The routine treats any failure as fatal and publishes
 * nothing, on the principle that a missing day is invisible and a broken pin
 * is not.
 *
 * Three layers:
 *  1. `checkTopic`   — the copy, before anything is rendered.
 *  2. layout warnings — emitted by buildGuideInfographic when text had to be
 *     clipped to fit; passed in by the caller.
 *  3. `checkRender`  — the finished PNG: right size, not blank, not a wall of
 *     one colour because an icon or the background failed to composite.
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const ICONS_DIR = join(ROOT, 'public/assets/icons');

/**
 * Words STYLE.md bans outright. Descriptions and pin text go out unreviewed,
 * so the guide's vocabulary rules are enforced rather than trusted.
 */
const BANNED = [
  'delve', 'tapestry', 'testament', 'underscore', 'boasts', 'vibrant', 'robust',
  'crucial', 'pivotal', 'meticulous', 'seamless', 'leverage', 'foster', 'showcase',
  'elevate', 'unlock', 'myriad', 'plethora', 'embark', 'realm', 'game-changer',
  'game changer', 'experts say', 'studies show', 'research suggests',
  'when it comes to', 'worth noting', 'bottom line', 'in summary', 'takeaway',
];

const WORDS = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

/** Copy-level checks against one language's half of a topic. */
export function checkTopic(topic, lang) {
  const errors = [];
  const warnings = [];
  const t = topic[lang];
  const where = `${topic.key}/${lang}`;

  if (!t) return { errors: [`${where}: missing language block`], warnings };

  for (const field of ['slug', 'title', 'chartTitle', 'description', 'cta']) {
    if (!t[field]) errors.push(`${where}: missing ${field}`);
  }
  if (t.slug && !/^[a-z0-9-]+$/.test(t.slug)) errors.push(`${where}: slug "${t.slug}" is not url-safe`);

  // The guide layout draws exactly eight cards; anything else leaves a hole.
  if (!Array.isArray(t.steps) || t.steps.length !== 8) {
    errors.push(`${where}: needs exactly 8 steps, has ${t.steps?.length ?? 0}`);
  }

  (t.steps ?? []).forEach((s, i) => {
    if (!s.label) errors.push(`${where}: step ${i + 1} has no label`);
    if (WORDS(s.label) > 4) warnings.push(`${where}: step ${i + 1} label is ${WORDS(s.label)} words, prefer 1-3`);
    if (!Array.isArray(s.bullets) || s.bullets.length === 0) errors.push(`${where}: step ${i + 1} has no bullets`);
    if ((s.bullets ?? []).length > 2) errors.push(`${where}: step ${i + 1} has ${s.bullets.length} bullets, max 2`);
    (s.bullets ?? []).forEach((b) => {
      // The card is sized for roughly six words. Beyond eight, the layout
      // clamps and the pin ships an ellipsis.
      if (WORDS(b) > 8) warnings.push(`${where}: bullet is ${WORDS(b)} words: "${b}"`);
    });
  });

  // SEO fields: Pinterest truncates long descriptions in the feed, and Google
  // rewrites meta descriptions that run past roughly 160 characters.
  if (t.description && t.description.length > 200) {
    warnings.push(`${where}: description is ${t.description.length} chars, aim under 160`);
  }
  if (t.pinDescription && t.pinDescription.length > 480) {
    warnings.push(`${where}: pinDescription is ${t.pinDescription.length} chars, Pinterest shows ~500`);
  }

  // English only, and on word boundaries. STYLE.md's list catalogues English
  // AI-writing tells, so it says nothing about Spanish copy — and a substring
  // match flags Spanish words that merely contain an English one ("realmente"
  // contains "realm", "foster" hides inside nothing useful either way).
  if (lang === 'en') {
    const haystack = [t.title, t.description, t.pinDescription, t.proTip?.text].filter(Boolean).join(' ').toLowerCase();
    for (const word of BANNED) {
      const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      if (pattern.test(haystack)) errors.push(`${where}: STYLE.md bans "${word}"`);
    }
  }

  // STYLE.md allows straight quotes only. A curly apostrophe reaches the card
  // as a glyph the brand font may not carry, and reaches the markdown as a
  // character that differs from every other apostrophe on the site.
  const curly = [t.title, t.description, t.pinDescription, t.proTip?.text,
    ...(t.steps ?? []).flatMap((s) => [s.label, ...(s.bullets ?? [])])]
    .filter(Boolean).filter((v) => /[\u2018\u2019\u201c\u201d]/.test(v));
  for (const v of curly) errors.push(`${where}: curly quote in "${v}" — STYLE.md wants straight quotes`);

  const article = checkArticle(t, lang, where);
  errors.push(...article.errors);
  warnings.push(...article.warnings);

  return { errors, warnings };
}

/**
 * The written body under the chart.
 *
 * Optional, because the pool predates it and falls back to restating the
 * bullets. But a topic that does carry one has to earn the space: the whole
 * point is that the page says more than the image, so a three-line article is
 * worse than none at all. It would read as padding under a chart that already
 * made the point.
 */
function checkArticle(t, lang, where) {
  const errors = [];
  const warnings = [];
  if (!t.article) {
    warnings.push(`${where}: no article — the body will fall back to restating the chart bullets`);
    return { errors, warnings };
  }

  const a = t.article;
  if (!a.intro) errors.push(`${where}: article has no intro`);
  if (!Array.isArray(a.sections) || a.sections.length < 3) {
    errors.push(`${where}: article needs at least 3 sections, has ${a.sections?.length ?? 0}`);
  }
  (a.sections ?? []).forEach((s, i) => {
    if (!s.heading) errors.push(`${where}: article section ${i + 1} has no heading`);
    if (!s.body) errors.push(`${where}: article section ${i + 1} has no body`);
  });

  const prose = [a.intro, ...(a.sections ?? []).flatMap((s) => [s.heading, s.body])].filter(Boolean).join(' ');
  const words = WORDS(prose);
  if (words < 250) errors.push(`${where}: article is ${words} words, needs 250+ to be worth the scroll`);
  else if (words < 350) warnings.push(`${where}: article is ${words} words, aim for 350+`);

  if (/[\u2018\u2019\u201c\u201d]/.test(prose)) errors.push(`${where}: article uses curly quotes, STYLE.md wants straight`);

  // STYLE.md: two em dashes per post, maximum.
  const dashes = (prose.match(/\u2014/g) ?? []).length;
  if (dashes > 2) errors.push(`${where}: article has ${dashes} em dashes, STYLE.md allows 2`);

  // STYLE.md bans these endings outright; they were the loudest tell on the site.
  const lastSection = (a.sections ?? [])[(a.sections ?? []).length - 1];
  if (lastSection?.body && /\b(the bottom line|in summary|to sum up|final thoughts|at the end of the day)\b/i.test(lastSection.body)) {
    errors.push(`${where}: article ends on a summary phrase STYLE.md bans`);
  }

  if (lang === 'en') {
    const haystack = prose.toLowerCase();
    for (const word of BANNED) {
      const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      if (pattern.test(haystack)) errors.push(`${where}: article uses "${word}", which STYLE.md bans`);
    }
  }

  return { errors, warnings };
}

/** Every icon the topic references must exist by the time we render. */
export function checkIcons(topic) {
  const errors = [];
  const slugs = [...(topic.icons ?? []).map((i) => i.slug)];
  if (topic.proTipIcon?.slug) slugs.push(topic.proTipIcon.slug);
  if ((topic.icons ?? []).length !== 8) errors.push(`${topic.key}: needs 8 step icons, has ${(topic.icons ?? []).length}`);
  for (const slug of slugs) {
    if (!existsSync(join(ICONS_DIR, `${slug}.png`))) errors.push(`${topic.key}: icon "${slug}" is missing from the library`);
  }
  return { errors, warnings: [] };
}

/**
 * Checks on the finished image.
 *
 * `spread` is the giveaway for the failure this pipeline actually produces: if
 * the icons or the background do not composite, the result is not a crash, it
 * is a flat near-uniform canvas that looks fine to a script and blank to a
 * human. A real infographic has dark type on pale paper and colour illustrations,
 * so its standard deviation is nowhere near zero.
 */
export async function checkRender(pngBuffer, { width = 1000, height = 1500 } = {}) {
  const errors = [];
  const warnings = [];
  const img = sharp(pngBuffer);
  const meta = await img.metadata();

  if (meta.width !== width || meta.height !== height) {
    errors.push(`rendered ${meta.width}x${meta.height}, expected ${width}x${height} (Pinterest wants 2:3)`);
  }

  const { channels } = await img.stats();
  const spread = Math.max(...channels.map((c) => c.stdev));
  if (spread < 12) errors.push(`image looks blank or flat (stdev ${spread.toFixed(1)})`);

  if (pngBuffer.length < 40_000) warnings.push(`png is only ${Math.round(pngBuffer.length / 1024)}KB — suspiciously small`);

  return { errors, warnings };
}

/** Merge result objects from the checks above. */
export const merge = (...results) => ({
  errors: results.flatMap((r) => r.errors ?? []),
  warnings: results.flatMap((r) => r.warnings ?? []),
});
