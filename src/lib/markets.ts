/**
 * The two English landing markets, US and UK.
 *
 * One landing page rendered twice rather than two hand-maintained pages: the
 * structure, the estimator and the store links are identical, and everything a
 * market actually changes is in this file. When they were separate files the
 * copy drifted within a week.
 *
 * Why two pages at all, rather than one page that swaps words at runtime:
 * Google indexes what the crawler is served, so a runtime swap ranks the US
 * wording in the UK too. Two URLs with reciprocal hreflang is the only version
 * of this that shows a UK searcher UK words. `/` is x-default because the US is
 * the larger market and every other locale falls back to it.
 *
 * What actually differs, and why each one matters:
 *
 *   spelling      "organise"/"neighbours"/"colour". Cheap, and its absence is
 *                 the first thing a British reader notices.
 *   hardiness     USDA zones are a US construct with no UK equivalent. UK copy
 *                 talks about frost dates and winters, never "your zone".
 *   plot words    "yard"/"backyard" vs "garden"/"veg patch"/"allotment".
 *                 Allotment has no US analogue and is a real UK search term.
 *   money         $ per lb vs £ per kg, in the savings estimator.
 *   crops         the estimator leads with what each market actually grows.
 */

export type MarketId = 'us' | 'uk';

export interface Market {
  id: MarketId;
  /** Path this market's landing page is served at. */
  path: string;
  /** BCP-47 tag for hreflang and og:locale. */
  hreflang: string;
  ogLocale: string;
  label: string;
  /** The other market, for the switcher link. */
  otherLabel: string;
  otherPath: string;

  title: string;
  metaDescription: string;
  heroImage: string;
  heroImageAlt: string;

  /** Hero. `headline` is split so the accent span can wrap the last clause. */
  headlineLead: string;
  headlineAccent: string;
  lead: string;
  proof: string[];

  /** The two-question section under the hero. */
  timingBody: string;
  savingsBody: string;

  /** Savings estimator. */
  currency: string;
  /** Weight the estimator counts in, and the divisor from catalog pounds. */
  unit: 'lb' | 'kg';
  /** Catalog yields are in pounds; UK divides by this to get kilos. */
  unitFromLb: number;
  /** Typical shop price per unit, used as an editable starting figure. */
  crops: { name: string; lbPerPlant: number; price: number }[];

  featuresZone: string;
  faqs: { q: string; a: string }[];
}

/**
 * Per-plant yields are the app's own catalog figures (data/plants-current.json
 * in the app repo, `yieldNumber` in pounds), so the estimator and the app agree.
 * Prices are a *starting* figure the visitor edits — deliberately not presented
 * as a researched national average, because that is a number we would have to
 * keep true and cannot.
 */
const CROPS_US: Market['crops'] = [
  { name: 'Tomatoes', lbPerPlant: 12, price: 3.0 },
  { name: 'Zucchini', lbPerPlant: 6, price: 2.0 },
  { name: 'Cucumber', lbPerPlant: 5, price: 2.5 },
  { name: 'Potatoes', lbPerPlant: 6, price: 1.5 },
  { name: 'Lettuce', lbPerPlant: 1, price: 3.5 },
  { name: 'Kale', lbPerPlant: 1, price: 4.0 },
];
// Same catalog yields, renamed for the market and re-priced per kilo.
const CROPS_UK: Market['crops'] = [
  { name: 'Tomatoes', lbPerPlant: 12, price: 4.5 },
  { name: 'Courgettes', lbPerPlant: 6, price: 3.0 },
  { name: 'Cucumber', lbPerPlant: 5, price: 3.5 },
  { name: 'Potatoes', lbPerPlant: 6, price: 1.6 },
  { name: 'Lettuce', lbPerPlant: 1, price: 4.5 },
  { name: 'Kale', lbPerPlant: 1, price: 5.0 },
];

export const US: Market = {
  id: 'us',
  path: '/',
  hreflang: 'en-US',
  ogLocale: 'en_US',
  label: 'United States',
  otherLabel: 'United Kingdom',
  otherPath: '/uk/',

  title: 'Garden Pro Planner — Know when to plant, and what it saved you',
  metaDescription:
    'A garden planner that builds your season around your own local frost dates, lays out every raised bed square by square, then logs each harvest and adds up what you saved on groceries. Free on iPhone, iPad and Android.',
  heroImage: '/assets/marketing/hero-us.jpg',
  heroImageAlt:
    'Two cedar raised beds in a backyard vegetable garden in early summer, staked tomatoes behind lettuce and basil',

  headlineLead: 'Know what to plant, when to plant it,',
  headlineAccent: 'and what it saved you.',
  lead: 'Garden Pro Planner builds your whole season around your own local frost dates — then tracks every harvest and adds up what you did not have to buy at the store.',
  proof: ['Free to start', '265+ plant library', 'iPhone, iPad & Android'],

  timingBody:
    'Seed packets print one date for the whole country. Your calendar is built from the last and first frost at your location, so you know when to start seeds indoors, when to transplant, and roughly when each crop comes in.',
  savingsBody:
    'Log what you pick and the app keeps a running total of what that harvest would have cost at the store. By August you stop guessing whether the garden is worth it, because the number is right there.',

  currency: '$',
  unit: 'lb',
  unitFromLb: 1,
  crops: CROPS_US,

  featuresZone:
    'Narrow the library to plants hardy in your USDA zone, or to what is commonly grown in your region.',
  faqs: [
    {
      q: 'How does the planting calendar know my dates?',
      a: 'It is built from the frost dates at your location. Set your location once and the app works out when to start seeds indoors, when to transplant outdoors, and when to expect a harvest from each plant — rather than the single generic date printed on a seed packet.',
    },
    {
      q: 'How does the savings tracker work?',
      a: 'Every plant in the library carries an expected yield. As you log what you actually harvest, the app totals what that produce would have cost you at the store and keeps a running estimate for the season. Plant counts follow your bed layout, so the estimate updates as you plant.',
    },
    {
      q: 'Can I lay out my raised beds in the app?',
      a: 'Yes. Every bed gets a square-foot grid you plant square by square. Each square is scored for the plant in your hand — good neighbors, room to grow, and what will shade what — or you can tap "Plan it for me" and let the app arrange the whole bed.',
    },
    {
      q: 'Does it work for containers and small spaces?',
      a: 'Yes. A bed can be any size you set, down to a single container or a balcony rail, and the square-foot scoring works the same way at that scale.',
    },
    {
      q: 'What devices does it run on?',
      a: 'iPhone and iPad on the App Store, and Android phones and tablets on Google Play.',
    },
    {
      q: 'How big is the plant library?',
      a: "265+ plants, each with sunlight, soil, pH, watering needs, spacing, expected yield, pests, and whether it's safe around pets.",
    },
  ],
};

export const UK: Market = {
  id: 'uk',
  path: '/uk/',
  hreflang: 'en-GB',
  ogLocale: 'en_GB',
  label: 'United Kingdom',
  otherLabel: 'United States',
  otherPath: '/',

  title: 'Garden Pro Planner UK — Know when to sow, and what it saved you',
  metaDescription:
    'A garden planner built around your own local frost dates, for raised beds, a veg patch or a full allotment. Plan beds square by square, then log every harvest and watch the shopping savings add up. Free on iPhone, iPad and Android.',
  heroImage: '/assets/marketing/hero-uk.jpg',
  heroImageAlt:
    'A British allotment plot in early summer, runner beans up hazel canes with rows of lettuce and onions in dark soil',

  headlineLead: 'Know what to sow, when to sow it,',
  headlineAccent: 'and what it saved you.',
  lead: 'Garden Pro Planner builds your whole season around your own local frost dates — whether that is two raised beds, a veg patch or a full allotment — then tracks every harvest and adds up what you did not have to buy.',
  proof: ['Free to start', '265+ plant library', 'iPhone, iPad & Android'],

  timingBody:
    'A seed packet prints one sowing window for the whole country, and the country runs from Cornwall to Aberdeen. Your calendar is built from the last and first frost where you actually garden, so you know when to sow under cover, when to plant out, and roughly when each crop is ready.',
  savingsBody:
    'Log what you pick and the app keeps a running total of what that harvest would have cost you at the shops. By August you are not guessing whether the plot paid for itself — the number is right there.',

  currency: '£',
  unit: 'kg',
  unitFromLb: 2.20462,
  crops: CROPS_UK,

  featuresZone:
    'Narrow the library to plants that will take your winters, or to what is commonly grown in your region.',
  faqs: [
    {
      q: 'Does it work with UK frost dates?',
      a: 'Yes. The calendar is built from the last and first frost at your own location rather than from a hardiness zone, so it works the same in Devon as it does in the Highlands. Set your location once and every sowing, planting-out and harvest date follows from it.',
    },
    {
      q: 'How does the savings tracker work?',
      a: 'Every plant in the library carries an expected yield. As you log what you actually harvest, the app totals what that produce would have cost at the shops and keeps a running estimate for the season. Plant counts follow your bed layout, so the estimate updates as you plant.',
    },
    {
      q: 'Is it any use for an allotment rather than a garden?',
      a: 'That is close to the ideal use for it. Each plot becomes an area with its own soil, pH and aspect, every bed gets its own square-foot layout and crop rotation, and the watering plan and harvest log run across the whole site.',
    },
    {
      q: 'Does it handle raised beds and containers?',
      a: 'Yes. A bed can be any size you set, from a full allotment bed down to a single container or a windowsill trough, and the square-foot scoring works the same way at that scale.',
    },
    {
      q: 'What devices does it run on?',
      a: 'iPhone and iPad on the App Store, and Android phones and tablets on Google Play.',
    },
    {
      q: 'How big is the plant library?',
      a: "265+ plants, each with sunlight, soil, pH, watering needs, spacing, expected yield, pests, and whether it's safe around pets.",
    },
  ],
};

export const MARKETS: Market[] = [US, UK];

/** Every landing page lists every landing page, plus an x-default on the US one. */
export function landingAlternates() {
  return [
    ...MARKETS.map((m) => ({
      lang: m.hreflang,
      href: new URL(m.path, 'https://thegardenplanner.app').href,
    })),
    { lang: 'x-default', href: 'https://thegardenplanner.app/' },
  ];
}
