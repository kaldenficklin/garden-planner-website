/**
 * Composes the standalone infographic image used by 'infographic'-type posts
 * (src/content.config.ts). Unlike scripts/lib/overlay.mjs, which lays text
 * over a photo, this builds the ENTIRE image from scratch: background, header,
 * numbered rows, icons, footer CTA. It doubles as both the on-page image and
 * the Pinterest pin — no separate hero/pin pair needed for this post type.
 *
 * Every word on the canvas is code-generated text, never asked of the image
 * model — the model only ever produces the reusable icon illustrations (see
 * scripts/gen-icon.mjs), so a stat or label is never garbled or invented by
 * an image generator. Content accuracy is still on whoever writes the post's
 * frontmatter; this file only guarantees the text renders exactly as typed.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(HERE, '../../public/assets/icons');
const FONTS = [join(HERE, '../fonts/Fraunces.ttf'), join(HERE, '../fonts/Inter.ttf')];

export const W = 1000;
export const H = 1500;

// Brand + infographic palette
export const INK = '#1c2620';
export const INK_SOFT = '#5b6660';
export const PAPER = '#fffdf8';
export const RED = '#d6503f';
export const RED_SOFT = '#fbe9e6';
export const GREEN = '#1f9d5c';
export const GREEN_DARK = '#123a26';
export const GREEN_SOFT = '#e7f5ec';
export const BORDER = '#e7e2d6';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const iconCache = new Map();

/**
 * Downscale and cache an icon as a base64 data URI, ONE TIME per process.
 * The library's source PNGs are 1024x1024 (~1-2MB each) but every icon in
 * this file renders at well under 100px, so embedding them full-size would
 * bloat the SVG string 10x for zero visible gain. Call this for every icon
 * slug a spec references before calling buildMistakesInfographic /
 * buildRankedInfographic — they read the cache synchronously and throw if an
 * icon wasn't warmed first.
 */
export async function warmIconCache(slugs) {
  for (const slug of slugs) {
    if (iconCache.has(slug)) continue;
    const buf = readFileSync(join(ICONS_DIR, `${slug}.png`));
    // JPEG, not PNG: these icons are opaque on a plain white background (see
    // scripts/gen-icon.mjs), so there's no alpha channel to lose, and JPEG
    // compresses the pencil-texture detail far smaller at this size.
    const small = await sharp(buf).resize(320, 320).jpeg({ quality: 82 }).toBuffer();
    iconCache.set(slug, `data:image/jpeg;base64,${small.toString('base64')}`);
  }
}

/** Base64 data URI for an already-warmed icon. */
function iconDataUri(slug) {
  const hit = iconCache.get(slug);
  if (!hit) throw new Error(`icon "${slug}" not in cache — call warmIconCache([...]) first`);
  return hit;
}

const widthCache = new Map();
function measure(text, size, weight = 700, family = 'Inter') {
  const key = `${family}|${weight}|${size}|${text}`;
  const hit = widthCache.get(key);
  if (hit !== undefined) return hit;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10000" height="${size * 3}"><text font-family="${family}" font-size="${size}" font-weight="${weight}" x="0" y="${size * 1.5}">${esc(text)}</text></svg>`;
  const bbox = new Resvg(svg, {
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Inter' },
  }).getBBox();
  const width = bbox?.width ?? 0;
  widthCache.set(key, width);
  return width;
}

function wrap(text, size, maxWidth, weight = 500, family = 'Inter') {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate, size, weight, family) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Fit text on a single line, shrinking from maxSize down to minSize before
 * ever falling back to ellipsis. Row labels are short but not length-limited
 * by the content author, so a fixed font size either clips a slightly-long
 * label or wastes space on a short one — shrinking first keeps the label
 * fully readable in the common case.
 */
function fitOneLine(text, maxWidth, { maxSize, minSize = 14, weight = 800, family = 'Inter' }) {
  for (let size = maxSize; size >= minSize; size -= 1) {
    if (measure(text, size, weight, family) <= maxWidth) return { size, line: text };
  }
  // Still too long even at minSize — ellipsize rather than overflow the card.
  let line = text;
  while (measure(`${line}…`, minSize, weight, family) > maxWidth && line.length > 1) {
    line = line.slice(0, -1);
  }
  return { size: minSize, line: `${line}…` };
}

/** Wrap to at most maxLines, ellipsizing the last line if it overflows. */
function wrapClamped(text, size, maxWidth, maxLines, weight = 500, family = 'Inter') {
  const lines = wrap(text, size, maxWidth, weight, family);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (measure(`${last}…`, size, weight, family) > maxWidth && last.length > 1) {
    last = last.slice(0, -1);
  }
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

function textBlock(lines, x, startY, lineHeight, size, weight, family, fill, letterSpacing = 0) {
  return lines
    .map(
      (l, i) =>
        `<text x="${x}" y="${startY + i * lineHeight}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${letterSpacing}" fill="${fill}">${esc(l)}</text>`
    )
    .join('\n');
}

function icon(slug, x, y, size) {
  return `<image href="${iconDataUri(slug)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"/>`;
}

function header({ eyebrow, title }) {
  const maxWidth = W - 160;
  let size = 58;
  let lines = wrap(title.toUpperCase(), size, maxWidth, 900, 'Inter');
  while (lines.length > 2 && size > 38) {
    size -= 4;
    lines = wrap(title.toUpperCase(), size, maxWidth, 900, 'Inter');
  }
  const lineHeight = Math.round(size * 1.08);
  let y = 56;
  let out = '';
  if (eyebrow) {
    const ew = measure(eyebrow.toUpperCase(), 22, 800, 'Inter');
    out += `<text x="${W / 2 - ew / 2}" y="${y}" font-family="Inter" font-size="22" font-weight="800" letter-spacing="2" fill="${GREEN}">${esc(eyebrow.toUpperCase())}</text>`;
    y += 44;
  }
  y += size * 0.85;
  for (const l of lines) {
    const lw = measure(l, size, 900, 'Inter');
    out += `<text x="${W / 2 - lw / 2}" y="${y}" font-family="Inter" font-size="${size}" font-weight="900" letter-spacing="-0.5" fill="${GREEN_DARK}">${esc(l)}</text>`;
    y += lineHeight;
  }
  return { svg: out, bottom: y - lineHeight + size * 0.4 };
}

function footerCta({ text }) {
  const barH = 84;
  const y = H - barH;
  const fontSize = 24;
  const maxWidth = W - 140;
  const lines = wrapClamped(text.toUpperCase(), fontSize, maxWidth, 2, 800, 'Inter');
  const lineHeight = fontSize * 1.2;
  const blockH = lines.length * lineHeight;
  let ty = y + barH / 2 - blockH / 2 + fontSize * 0.8;
  let out = `<rect x="0" y="${y}" width="${W}" height="${barH}" fill="${GREEN_DARK}"/>`;
  for (const l of lines) {
    const lw = measure(l, fontSize, 800, 'Inter');
    out += `<text x="${W / 2 - lw / 2}" y="${ty}" font-family="Inter" font-size="${fontSize}" font-weight="800" letter-spacing="0.5" fill="#ffffff">${esc(l)}</text>`;
    ty += lineHeight;
  }
  return out;
}

/**
 * "Mistakes" layout: numbered two-column rows, "the mistake" vs "the better
 * habit", one icon per row (shown once, in the mistake cell — the fix cell
 * uses a shared checkmark icon so the library doesn't need a second icon per
 * row).
 *
 * @param {object} opts
 * @param {string} opts.eyebrow
 * @param {string} opts.title
 * @param {Array<{icon:string, number:number, label:string, labelBody:string, fix:string, fixBody:string}>} opts.items
 * @param {string} opts.ctaText
 */
export function buildMistakesInfographic({ eyebrow, title, items, ctaText }) {
  const { svg: headerSvg, bottom: headerBottom } = header({ eyebrow, title });

  const subheadY = headerBottom + 40;
  const pad = 48;
  const colGap = 56;
  const colW = (W - pad * 2 - colGap) / 2;
  const leftX = pad;
  const rightX = leftX + colW + colGap;

  const pillH = 40;
  const subhead = `
    <rect x="${leftX}" y="${subheadY}" width="${colW}" height="${pillH}" rx="20" fill="${RED_SOFT}"/>
    <text x="${leftX + colW / 2 - measure('THE MISTAKE', 18, 800) / 2}" y="${subheadY + 26}" font-family="Inter" font-size="18" font-weight="800" letter-spacing="1" fill="${RED}">THE MISTAKE</text>
    <rect x="${rightX}" y="${subheadY}" width="${colW}" height="${pillH}" rx="20" fill="${GREEN_SOFT}"/>
    <text x="${rightX + colW / 2 - measure('THE BETTER HABIT', 18, 800) / 2}" y="${subheadY + 26}" font-family="Inter" font-size="18" font-weight="800" letter-spacing="1" fill="${GREEN}">THE BETTER HABIT</text>
  `;

  const rowsTop = subheadY + pillH + 24;
  const footerTop = H - 84 - 16;
  const rowGap = 14;
  const n = items.length;
  const rowH = (footerTop - rowsTop - rowGap * (n - 1)) / n;
  const cardPad = 16;
  const iconSize = 58;
  const numR = 17;

  let rows = '';
  items.forEach((item, i) => {
    const rowTop = rowsTop + i * (rowH + rowGap);
    const cy = rowTop + rowH / 2;

    const textX = leftX + cardPad + numR * 2 + 8 + iconSize + 14;
    const textMaxW = colW - (cardPad + numR * 2 + 8 + iconSize + 14) - cardPad;
    const label = fitOneLine(item.label, textMaxW, { maxSize: 20, minSize: 15 });
    const bodyLines = wrapClamped(item.labelBody ?? '', 15, textMaxW, 3, 500, 'Inter');
    const labelLH = Math.round(label.size * 1.1) + 4;
    const leftTextTop = cy - (labelLH + bodyLines.length * 19) / 2 + 14;

    const fixTextX = rightX + cardPad + iconSize + 14;
    const fixTextMaxW = colW - (cardPad + iconSize + 14) - cardPad;
    const fix = fitOneLine(item.fix, fixTextMaxW, { maxSize: 20, minSize: 15 });
    const fixBodyLines = wrapClamped(item.fixBody ?? '', 15, fixTextMaxW, 3, 500, 'Inter');
    const fixLH = Math.round(fix.size * 1.1) + 4;
    const fixTextTop = cy - (fixLH + fixBodyLines.length * 19) / 2 + 14;

    rows += `
      <!-- row ${i + 1}: mistake card -->
      <rect x="${leftX}" y="${rowTop}" width="${colW}" height="${rowH}" rx="14" fill="${PAPER}" stroke="${BORDER}"/>
      <rect x="${leftX}" y="${rowTop}" width="6" height="${rowH}" rx="3" fill="${RED}"/>
      <circle cx="${leftX + cardPad + numR}" cy="${cy}" r="${numR}" fill="${RED}"/>
      <text x="${leftX + cardPad + numR - measure(String(item.number), 17, 800) / 2}" y="${cy + 6}" font-family="Inter" font-size="17" font-weight="800" fill="#ffffff">${item.number}</text>
      ${icon(item.icon, leftX + cardPad + numR * 2 + 8, cy - iconSize / 2, iconSize)}
      ${textBlock([label.line], textX, leftTextTop, labelLH, label.size, 800, 'Inter', INK)}
      ${textBlock(bodyLines, textX, leftTextTop + labelLH, 19, 15, 500, 'Inter', INK_SOFT)}

      <!-- row ${i + 1}: fix card -->
      <rect x="${rightX}" y="${rowTop}" width="${colW}" height="${rowH}" rx="14" fill="${PAPER}" stroke="${BORDER}"/>
      <rect x="${rightX}" y="${rowTop}" width="6" height="${rowH}" rx="3" fill="${GREEN}"/>
      ${icon('checkmark', rightX + cardPad, cy - iconSize / 2, iconSize)}
      ${textBlock([fix.line], fixTextX, fixTextTop, fixLH, fix.size, 800, 'Inter', INK)}
      ${textBlock(fixBodyLines, fixTextX, fixTextTop + fixLH, 19, 15, 500, 'Inter', INK_SOFT)}

      <!-- arrow -->
      <text x="${leftX + colW + colGap / 2 - 16}" y="${cy + 10}" font-family="Inter" font-size="34" font-weight="800" fill="${RED}">&#8594;</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect x="0" y="0" width="${W}" height="${H}" fill="${PAPER}"/>
    ${headerSvg}
    ${subhead}
    ${rows}
    ${footerCta({ text: ctaText })}
  </svg>`;
}

/**
 * "Ranked" layout: single-column numbered rows, an icon, a name, a stat pill,
 * and a one-line tip.
 *
 * @param {object} opts
 * @param {string} opts.eyebrow
 * @param {string} opts.title
 * @param {Array<{icon:string, number:number, label:string, stat:string, tip:string}>} opts.items
 * @param {string} opts.ctaText
 */
export function buildRankedInfographic({ eyebrow, title, items, ctaText }) {
  const { svg: headerSvg, bottom: headerBottom } = header({ eyebrow, title });

  const pad = 48;
  const rowsTop = headerBottom + 36;
  const footerTop = H - 84 - 16;
  const rowGap = 10;
  const n = items.length;
  const rowH = (footerTop - rowsTop - rowGap * (n - 1)) / n;
  const cardPad = 14;
  const iconSize = Math.min(64, rowH - cardPad * 2);
  const numR = 16;

  let rows = '';
  items.forEach((item, i) => {
    const rowTop = rowsTop + i * (rowH + rowGap);
    const cy = rowTop + rowH / 2;
    const iconX = pad + cardPad + numR * 2 + 6;
    const textX = iconX + iconSize + 16;

    const statW = measure(item.stat.toUpperCase(), 16, 800) + 28;
    const statX = W - pad - cardPad - statW;
    const textMaxW = statX - textX - 14;

    const name = fitOneLine(item.label, textMaxW, { maxSize: 21, minSize: 16 });
    const tipLines = wrapClamped(item.tip ?? '', 14.5, textMaxW, 2, 500, 'Inter');
    const nameLH = Math.round(name.size * 1.1) + 3;
    const textTop = cy - (nameLH + tipLines.length * 18) / 2 + 12;

    rows += `
      <rect x="${pad}" y="${rowTop}" width="${W - pad * 2}" height="${rowH}" rx="14" fill="${PAPER}" stroke="${BORDER}"/>
      <circle cx="${pad + cardPad + numR}" cy="${cy}" r="${numR}" fill="${GREEN}"/>
      <text x="${pad + cardPad + numR - measure(String(item.number), 16, 800) / 2}" y="${cy + 5.5}" font-family="Inter" font-size="16" font-weight="800" fill="#ffffff">${item.number}</text>
      ${icon(item.icon, iconX, cy - iconSize / 2, iconSize)}
      ${textBlock([name.line], textX, textTop, nameLH, name.size, 800, 'Inter', INK)}
      ${textBlock(tipLines, textX, textTop + nameLH, 18, 14.5, 500, 'Inter', INK_SOFT)}
      <rect x="${statX}" y="${cy - 16}" width="${statW}" height="32" rx="16" fill="${GREEN_SOFT}"/>
      <text x="${statX + statW / 2 - measure(item.stat.toUpperCase(), 16, 800) / 2}" y="${cy + 5.5}" font-family="Inter" font-size="16" font-weight="800" fill="${GREEN_DARK}">${esc(item.stat.toUpperCase())}</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect x="0" y="0" width="${W}" height="${H}" fill="${PAPER}"/>
    ${headerSvg}
    ${rows}
    ${footerCta({ text: ctaText })}
  </svg>`;
}

/** Render an SVG string to a PNG buffer. */
export function renderPng(svg) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Inter' },
  });
  return resvg.render().asPng();
}
