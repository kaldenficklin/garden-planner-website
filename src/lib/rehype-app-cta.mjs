/**
 * Drops one app CTA into the middle of every blog post, at reading depth.
 *
 * WHY THIS EXISTS
 * Posts already ended with a CTA block, and that block converts close to
 * nothing, because almost nobody reaches the end of a 1,200-word article they
 * arrived at from a search for "why is my zucchini not fruiting". They read
 * until their question is answered and they leave. The only place a CTA can
 * catch them is *inside* the answer.
 *
 * WHY A REHYPE PLUGIN
 * The post body is Markdown rendered by Astro's `<Content />`, so there is no
 * server-side seam to splice at — the page component can put things before and
 * after the article, never inside it. Injecting at the HAST stage puts the CTA
 * in the static HTML, which means it is in the crawled page, needs no
 * JavaScript, and cannot shift layout when it arrives.
 *
 * WHERE IT LANDS
 * Immediately before the *third* `<h2>`. That is far enough in that the reader
 * has been paid for the click — their actual question is usually answered under
 * the first or second heading — and early enough that most readers are still on
 * the page. Short posts with fewer than three `<h2>`s fall back to roughly 55%
 * of the way down, snapped to the next block boundary so the CTA never lands
 * between a heading and the paragraph it introduces.
 *
 * WHAT IT SAYS
 * `ctaHook` in a post's frontmatter, when the post has one — a single sentence
 * tying *this* post's subject to the app. A generic "get the app" earns nothing
 * mid-article; "your last frost date is the whole game here" earns the tap.
 * Posts without one get the default below, which leads with timing and savings
 * because those are the two things this audience buys on.
 *
 * Infographic entries are skipped: they are a caption around one image, and a
 * CTA wedged into three paragraphs is the whole page.
 *
 * IT ALSO TAGS IN-BODY STORE LINKS
 * A post body that links the App Store in prose is plain Markdown, so there is
 * nowhere to hang the `data-store-link` attribute that BaseLayout's script looks
 * for when it swaps a CTA to Google Play on Android. Those links used to be
 * hardcoded to Apple and sent every Android reader to a store they cannot buy
 * from. Since this plugin already walks the tree for every post, it stamps the
 * attribute on as it goes — which fixes the existing ones and every future one
 * without anybody having to remember.
 */
import { APP_STORE } from './store-urls.mjs';

const DEFAULT_HOOK =
  'Garden Planner Pro works your sowing, planting and harvest dates out from ' +
  'your own local frost dates — then logs each harvest and totals up what it saved you.';

/** Blocks a CTA must never be inserted directly after. */
const INTRODUCES_NEXT = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

const el = (tagName, properties, children = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const text = (value) => ({ type: 'text', value });

function ctaNode(hook) {
  return el('aside', { className: ['inline-cta'], 'data-inline-cta': '' }, [
    el('div', { className: ['inline-cta-body'] }, [
      el('p', { className: ['inline-cta-hook'] }, [text(hook)]),
      el(
        'a',
        {
          className: ['btn', 'inline-cta-btn'],
          href: APP_STORE,
          'data-store-link': '',
          'data-cta': 'post-inline',
        },
        [text('Get the free app')]
      ),
    ]),
    el('p', { className: ['inline-cta-foot'] }, [
      text('Free on iPhone, iPad and Android · 440+ plants · no account needed to start'),
    ]),
  ]);
}

/**
 * Index to splice at: before the 3rd h2, else ~55% down, snapped forward past
 * any heading so the CTA cannot separate a heading from its own paragraph.
 */
function insertionPoint(children) {
  let seen = 0;
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.type !== 'element' || node.tagName !== 'h2') continue;
    if (++seen === 3) return i;
  }

  let i = Math.floor(children.length * 0.55);
  while (i < children.length && !(children[i].type === 'element')) i++;
  while (i > 0 && children[i - 1]?.type === 'element' && INTRODUCES_NEXT.has(children[i - 1].tagName)) i++;
  return Math.min(i, children.length);
}

/**
 * Mark every prose link to the App Store as OS-swappable, so BaseLayout's
 * Android script rewrites it to Play like any other single-destination CTA.
 * Walks the whole tree rather than the top level: these links live inside
 * paragraphs and list items.
 */
function tagStoreLinks(node) {
  if (node.type === 'element' && node.tagName === 'a') {
    const href = node.properties?.href;
    // Literal attribute keys, as in ctaNode above — the camelCase hast forms do
    // not survive serialisation here.
    if (href === APP_STORE && !('data-store-link' in node.properties)) {
      node.properties['data-store-link'] = '';
      // Without a data-cta these would report as 'unspecified' and blur into
      // every other untagged link in the numbers.
      node.properties['data-cta'] = node.properties['data-cta'] || 'post-body';
    }
  }
  for (const child of node.children ?? []) tagStoreLinks(child);
}

export function rehypeAppCta() {
  return (tree, file) => {
    const frontmatter = file?.data?.astro?.frontmatter ?? {};

    // Runs for infographics too — they are short, but a prose store link in one
    // is just as broken on Android as anywhere else.
    tagStoreLinks(tree);

    if (frontmatter.type === 'infographic') return;

    const children = tree.children ?? [];
    // A stub with nothing to read has no "middle" worth interrupting; the CTA
    // at the foot of the page is already right there.
    const blocks = children.filter((n) => n.type === 'element').length;
    if (blocks < 4) return;

    children.splice(insertionPoint(children), 0, ctaNode(frontmatter.ctaHook || DEFAULT_HOOK));
  };
}

export default rehypeAppCta;
