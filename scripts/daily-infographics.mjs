#!/usr/bin/env node
/**
 * The daily infographic routine.
 *
 *   node scripts/daily-infographics.mjs            # 2 pairs, commit and push
 *   node scripts/daily-infographics.mjs --count 1 --no-push
 *   node scripts/daily-infographics.mjs --dry-run  # render and check, write nothing
 *
 * One run publishes `count` topics, each as an English and a Spanish
 * infographic sharing a translationKey. It generates any icons the topic needs
 * that the shared library does not already have, composites both images, runs
 * the QA gate, writes the posts, rebuilds the site to prove the content still
 * compiles, and commits.
 *
 * Nothing is written unless every check passes. A missing day is invisible; a
 * broken pin sits on Pinterest indefinitely and links to a broken page.
 *
 * The image API is on the LAN, so this has to run on a machine at home — it is
 * a launchd job on the Mac, not a cloud task. If the PC that hosts the API is
 * off, the run waits for it rather than failing (see scripts/lib/image-api.mjs).
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import sharp from 'sharp';

import { waitForApi, isUp, apiBase } from './lib/image-api.mjs';
import { makeIcon } from './gen-icon.mjs';
import { nextTopics } from './lib/topics.mjs';
import { checkTopic, checkIcons, checkRender, merge } from './lib/qa.mjs';
import { buildGuideInfographic, warmGuideIcons, renderPng } from './lib/infographic.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const ICONS_DIR = join(ROOT, 'public/assets/icons');
const IMG_DIR = join(ROOT, 'public/assets/blog');
const CONTENT_DIR = join(ROOT, 'src/content/blog');
const DOMAIN = 'thegardenplanner.app';

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i > -1 ? argv[i + 1] : fallback;
};

const COUNT = Number(opt('count', 2));
const DRY = flag('dry-run');
const PUSH = !flag('no-push') && !DRY;

const log = (...a) => console.log(...a);

/**
 * Every file this run created, as repo-relative paths.
 *
 * The commit stages exactly these and nothing else. Staging whole directories
 * instead swept in the output of an earlier run that had written its files and
 * then failed before committing — so unreviewed work got published under a
 * commit message that did not mention it.
 */
const written = [];
const rel = (abs) => abs.slice(ROOT.length + 1);

/** YAML for frontmatter. Deliberately tiny — only the shapes this file emits. */
function yaml(value, indent = 0) {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) return ' []';
    return '\n' + value.map((v) => {
      if (v && typeof v === 'object') {
        const inner = yaml(v, indent + 4).replace(/^\n/, '');
        return `${pad}  - ${inner.trimStart()}`;
      }
      return `${pad}  - ${scalar(v)}`;
    }).join('\n');
  }
  if (value && typeof value === 'object') {
    return '\n' + Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => {
        const rendered = v && typeof v === 'object' ? yaml(v, indent + 2) : ` ${scalar(v)}`;
        return `${pad}${k}:${rendered}`;
      })
      .join('\n');
  }
  return ` ${scalar(value)}`;
}

// Always double-quote strings. STYLE.md requires straight quotes in body copy,
// and a title containing a colon is otherwise invalid YAML.
const scalar = (v) =>
  typeof v === 'string' ? `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : String(v);

/**
 * The page body under the chart.
 *
 * The steps are repeated as real text on purpose. A page whose only content is
 * one image is thin content to Google no matter how good the image is, and the
 * pin traffic arrives on a page that should still be worth indexing.
 */
function body(t, lang) {
  const heading = lang === 'es' ? 'Los pasos' : 'The steps';
  const steps = t.steps.map((s, i) => `${i + 1}. **${s.label}.** ${s.bullets.join('. ')}.`).join('\n');
  const tip = t.proTip ? `\n\n**${t.proTip.label}.** ${t.proTip.text}\n` : '\n';
  return `${t.description}\n\n## ${heading}\n\n${steps}\n${tip}`;
}

function frontmatter(topic, lang, imagePath) {
  const t = topic[lang];
  return {
    title: t.title,
    description: t.description,
    date: new Date().toISOString().slice(0, 10),
    tags: topic.tags,
    type: 'infographic',
    lang,
    translationKey: topic.key,
    infographicLayout: 'guide',
    infographicTitle: t.chartTitle,
    infographicImage: imagePath,
    imageAlt: t.chartTitle,
    guideSteps: t.steps.map((s, i) => ({ icon: topic.icons[i].slug, label: s.label, bullets: s.bullets })),
    guideProTip: t.proTip ? { ...t.proTip, icon: topic.proTipIcon?.slug } : undefined,
    guideCta: t.cta,
    pinDescription: t.pinDescription,
    pinBoard: topic.pinBoard,
    pinKeywords: topic.pinKeywords,
    draft: false,
  };
}

/** Generate any icons this topic needs that the library does not already have. */
async function ensureIcons(topic) {
  const wanted = [...(topic.icons ?? [])];
  if (topic.proTipIcon) wanted.push(topic.proTipIcon);

  for (const icon of wanted) {
    const dest = join(ICONS_DIR, `${icon.slug}.png`);
    if (existsSync(dest)) continue;
    if (!icon.subject) {
      throw new Error(`icon "${icon.slug}" is not in the library and topics.json gives no subject to draw it from`);
    }
    log(`  · generating icon ${icon.slug}`);
    const buf = await makeIcon({ slug: icon.slug, subject: icon.subject, log: () => {} });
    // A dry run still writes the icon: without it the render below has nothing
    // to composite and every check downstream is meaningless. Icons are shared
    // library assets, not per-run output, so keeping one is not a side effect
    // worth avoiding.
    mkdirSync(ICONS_DIR, { recursive: true });
    writeFileSync(dest, buf);
    written.push(rel(dest));
  }
}

/** Render one language's image. Returns the JPEG buffer and any layout warnings. */
async function renderOne(topic, lang) {
  const t = topic[lang];
  const steps = t.steps.map((s, i) => ({ icon: topic.icons[i].slug, label: s.label, bullets: s.bullets }));
  const proTip = t.proTip ? { ...t.proTip, icon: topic.proTipIcon?.slug } : undefined;

  await warmGuideIcons({ steps, proTip });
  const { svg, warnings } = buildGuideInfographic({
    eyebrow: t.eyebrow,
    title: t.chartTitle,
    steps,
    proTip,
    ctaText: t.cta,
    domain: DOMAIN,
  });

  const png = renderPng(svg);
  const render = await checkRender(png);
  const jpeg = await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  return { jpeg, warnings, render };
}

async function publishTopic(topic) {
  log(`\n▶ ${topic.key}`);
  await ensureIcons(topic);

  const copy = merge(checkTopic(topic, 'en'), checkTopic(topic, 'es'), checkIcons(topic));
  const outputs = [];
  let layoutWarnings = [];
  let renderErrors = [];

  for (const lang of ['en', 'es']) {
    const t = topic[lang];
    const { jpeg, warnings, render } = await renderOne(topic, lang);
    layoutWarnings = layoutWarnings.concat(warnings.map((w) => `${topic.key}/${lang}: ${w}`));
    renderErrors = renderErrors.concat(render.errors.map((e) => `${topic.key}/${lang}: ${e}`));

    const imageName = `${t.slug}-infographic.jpg`;
    outputs.push({
      lang,
      jpeg,
      imageFile: join(IMG_DIR, imageName),
      imagePath: `/assets/blog/${imageName}`,
      contentFile: lang === 'es' ? join(CONTENT_DIR, 'es', `${t.slug}.md`) : join(CONTENT_DIR, `${t.slug}.md`),
    });
  }

  // Layout warnings are fatal here even though the layout tolerates them: a
  // clipped bullet means the copy is wrong for the format, and this pin would
  // publish with an ellipsis in it.
  const errors = [...copy.errors, ...renderErrors, ...layoutWarnings];
  const warnings = [...copy.warnings];

  for (const w of warnings) log(`  ! ${w}`);
  if (errors.length) {
    for (const e of errors) log(`  ✗ ${e}`);
    throw new Error(`${topic.key} failed QA with ${errors.length} error(s) — nothing written`);
  }

  if (DRY) {
    log(`  ✓ passed QA (dry run, nothing written)`);
    return;
  }

  mkdirSync(IMG_DIR, { recursive: true });
  mkdirSync(join(CONTENT_DIR, 'es'), { recursive: true });
  for (const out of outputs) {
    writeFileSync(out.imageFile, out.jpeg);
    const fm = frontmatter(topic, out.lang, out.imagePath);
    const md = `---${yaml(fm)}\n---\n\n${body(topic[out.lang], out.lang)}`;
    writeFileSync(out.contentFile, md);
    written.push(rel(out.imageFile), rel(out.contentFile));
    log(`  ✓ ${out.lang}: ${out.imagePath}`);
  }
}

// ---------------------------------------------------------------------------

const { picked, remaining } = nextTopics(COUNT);

if (!picked.length) {
  log('No unused topics left in scripts/data/topics.json. Add more entries — nothing published today.');
  process.exit(1);
}
if (remaining <= COUNT * 5) {
  log(`⚠ topic pool is running low: ${remaining} unused, ${Math.floor(remaining / COUNT)} day(s) left. Add entries to scripts/data/topics.json.`);
}
if (picked.length < COUNT) {
  log(`⚠ only ${picked.length} unused topic(s) available, wanted ${COUNT}`);
}

if (!(await isUp())) {
  log(`[image-api] ${apiBase()} not reachable — waiting for the PC.`);
  if (!(await waitForApi())) process.exit(1);
}

for (const topic of picked) {
  await publishTopic(topic);
}

if (DRY) {
  log('\nDry run complete.');
  process.exit(0);
}

// A build is the last QA step: it is the only thing that proves the frontmatter
// validates against the content schema and every route still renders.
log('\n▶ building the site');
try {
  execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'pipe' });
  log('  ✓ build passed');
} catch (e) {
  log(String(e.stdout ?? e));
  throw new Error('site build failed — the posts were written but are NOT committed. Fix and rerun.');
}

const slugs = picked.map((t) => t.en.slug).join(', ');
// Icons are shared library assets rather than per-run output: additive, reused
// across topics, and already vetted by inspectIcon when they were generated.
// A dry run legitimately leaves new ones behind, so sweep those in.
const looseIcons = execFileSync('git', ['status', '--porcelain', '--', 'public/assets/icons'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .map((l) => l.slice(3).trim())
  .filter(Boolean);

// A post is the risky thing to publish, so content and images are staged only
// if THIS run produced them. Anything else under those paths came from a run
// that wrote its files and then failed before committing — it was never
// verified here, and folding it in silently is how it reaches the site
// unnoticed under a commit message that does not mention it.
const stray = execFileSync('git', ['status', '--porcelain', '--', 'src/content/blog', 'public/assets/blog'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .map((l) => l.slice(3).trim())
  .filter((f) => f && !written.includes(f));
if (stray.length) {
  log(`\n⚠ ${stray.length} file(s) from an earlier incomplete run are NOT being committed:`);
  for (const f of stray.slice(0, 10)) log(`    ${f}`);
  log('  Review them, then commit by hand or delete them.');
}

execFileSync('git', ['add', '--', ...written, ...looseIcons], { cwd: ROOT });

const staged = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: ROOT, encoding: 'utf8' }).trim();
if (!staged) {
  log('nothing staged — no changes to commit');
  process.exit(0);
}

execFileSync('git', ['commit', '-m', `Publish infographics: ${slugs}`], { cwd: ROOT, stdio: 'pipe' });
log(`\n✓ committed: ${slugs}`);

if (PUSH) {
  execFileSync('git', ['push'], { cwd: ROOT, stdio: 'pipe' });
  log('✓ pushed — Netlify will build and publish');
} else {
  log('(not pushed — --no-push)');
}

// Pins are created by hand, so the run ends by listing exactly what to pin and
// where. Each page carries a Save button that pre-fills the right description,
// so opening these four URLs is the whole job.
log('\nTo pin (open each and hit "Save this pin"):');
for (const t of picked) {
  log(`  EN  https://${DOMAIN}/infographics/${t.en.slug}/`);
  log(`      → board: ${t.pinBoard ?? 'Garden Infographics'}`);
  log(`  ES  https://${DOMAIN}/es/infographics/${t.es.slug}/`);
  log(`      → board: Infografías de Jardinería`);
}
log('\nNetlify takes about a minute to publish, so give it a moment before opening these.');
