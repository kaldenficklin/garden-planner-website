// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The marketing pages (index/privacy/support/etc.) live in public/ and pass
// through untouched. Astro only builds the /blog section on top of them.
export default defineConfig({
  site: 'https://thegardenplanner.app',
  integrations: [
    // Auto-generates a sitemap for the blog pages Astro builds. New posts are
    // picked up automatically on every build — no manual sitemap edits needed.
    sitemap({
      filter: (page) => page.includes('/blog'),
    }),
  ],
  build: {
    // Clean URLs: /blog/my-post/ instead of /blog/my-post.html
    format: 'directory',
  },
});
