#!/usr/bin/env node
/**
 * Scaffold a new blog post with valid frontmatter.
 *
 * Usage:
 *   npm run new-post -- "When to Start Tomato Seeds Indoors"
 *   npm run new-post -- "When to Start Tomato Seeds Indoors" "seed-starting,tomatoes"
 *
 * Creates src/content/blog/<slug>.md dated today. Fill in the body and build.
 * Designed so an AI agent only has to (1) run this, then (2) write the body.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, '..', 'src', 'content', 'blog');

const title = process.argv[2];
const tags = (process.argv[3] || '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

if (!title) {
  console.error('Usage: npm run new-post -- "Post Title" "tag1,tag2"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^\w\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const today = new Date().toISOString().slice(0, 10);
const file = join(BLOG_DIR, `${slug}.md`);

if (existsSync(file)) {
  console.error(`Post already exists: ${file}`);
  process.exit(1);
}

const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "TODO: one-sentence summary (~155 chars) — this is the Google/social snippet."
date: ${today}
tags: [${tags.map((t) => `"${t}"`).join(', ')}]
ctaHook: "TODO: one sentence tying THIS post's subject to the app — the line a reader would nod at having just read the section above it. Delete the field to fall back to the generic one."
draft: true
---

Write the post here in Markdown. Delete \`draft: true\` above when it's ready to publish.
`;

await mkdir(BLOG_DIR, { recursive: true });
await writeFile(file, frontmatter, 'utf8');
console.log(`Created ${file}`);
