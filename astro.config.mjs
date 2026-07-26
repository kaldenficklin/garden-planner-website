// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The secondary marketing pages (privacy/support/terms/delete-account) live in
// public/ and pass through untouched. Astro builds the landing page and /blog.
export default defineConfig({
  site: 'https://thegardenplanner.app',
  integrations: [
    // One sitemap for the whole site. Everything Astro builds — the landing
    // page, posts, blog pages, tag hubs — is picked up automatically, so a new
    // post never needs a manual sitemap edit. The pages that are plain HTML in
    // public/ are invisible to the integration, so they're listed by hand.
    sitemap({
      customPages: [
        'https://thegardenplanner.app/privacy',
        'https://thegardenplanner.app/support',
        'https://thegardenplanner.app/terms',
        'https://thegardenplanner.app/delete-account',
      ],
    }),
  ],
  build: {
    // Clean URLs: /blog/my-post/ instead of /blog/my-post.html
    format: 'directory',
  },
});
