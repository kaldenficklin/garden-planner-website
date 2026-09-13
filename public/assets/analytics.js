/*
 * Garden Planner Pro — site analytics
 *
 * Loads Google Analytics 4, remembers the campaign a visitor arrived on, and
 * fires an `app_store_click` event whenever someone taps through to the App
 * Store. That event is the conversion to watch for paid traffic.
 *
 * Nothing loads until GA_MEASUREMENT_ID below is filled in.
 */
(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────────────────── */

  // "Garden Planner Pro Website" property (401448878 / 547196945), web stream
  // 15330067195. Deliberately its own property: the apps report into
  // "garden-planner-e91af" (545945963), and mixing site sessions into the app's
  // numbers would distort both.
  var GA_MEASUREMENT_ID = 'G-ZJYHEXNQBX';

  // Optional. App Store Connect → App Analytics → Campaigns issues a "provider
  // token". Set it and App Store product-page views get attributed to the same
  // campaign the visitor arrived on, so Apple's numbers line up with GA's.
  var APPLE_PROVIDER_TOKEN = '10675356';

  // Optional. Reddit Ads → Events Manager → Reddit Pixel (looks like
  // "a2_abc123def"). Set it to let Reddit optimize delivery toward clickers.
  var REDDIT_ADVERTISER_ID = '';

  /* ── Campaign attribution ───────────────────────────────────────────── */

  // Query params worth carrying through the visit. The utm_* ones are what GA4
  // reads natively; the rest are Reddit's macros, useful for splitting results
  // by ad rather than by campaign.
  var TRACKED_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'campaign_id', 'adgroup_id', 'ad_id', 'rdt_cid'
  ];
  var STORE_KEY = 'gpp_campaign';

  // A visitor may land on an ad URL, read a blog post, then convert. Stash the
  // campaign on arrival so the click event still knows where they came from.
  function campaign() {
    var params = new URLSearchParams(window.location.search);
    var landed = {};
    var found = false;

    TRACKED_PARAMS.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        landed[key] = value.slice(0, 100);
        found = true;
      }
    });

    if (found) {
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(landed)); } catch (e) { /* private mode */ }
      return landed;
    }

    try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }

  var attribution = campaign();

  /* ── Google Analytics 4 ─────────────────────────────────────────────── */

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var gaEnabled = /^G-[A-Z0-9]{6,}$/.test(GA_MEASUREMENT_ID);

  if (gaEnabled) {
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(ga);

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      // Sent with every event on the page, so campaign detail survives even
      // when the visitor converts several pages deep.
      campaign_id: attribution.campaign_id || undefined,
      reddit_ad_id: attribution.ad_id || undefined
    });
  }

  /* ── Reddit pixel (optional) ────────────────────────────────────────── */

  if (REDDIT_ADVERTISER_ID) {
    (function (w, d) {
      if (w.rdt) return;
      var p = w.rdt = function () {
        p.sendEvent ? p.sendEvent.apply(p, arguments) : p.callQueue.push(arguments);
      };
      p.callQueue = [];
      var t = d.createElement('script');
      t.src = 'https://www.redditstatic.com/ads/pixel.js';
      t.async = true;
      d.head.appendChild(t);
    })(window, document);

    window.rdt('init', REDDIT_ADVERTISER_ID);
    window.rdt('track', 'PageVisit');
  }

  /* ── Store click = the conversion ───────────────────────────────────── */

  var APP_STORE_HOST = 'apps.apple.com';
  var PLAY_STORE_HOST = 'play.google.com';

  // Both stores count. On Android the inline script in BaseLayout rewrites every
  // [data-store-link] href to Play *before* any click happens, so a listener
  // bound to Apple alone sees nothing at all from an Android visitor — which is
  // exactly how every Android conversion went unrecorded until this was widened.
  // `:not([href*="/account/"])` keeps Apple's subscription-management deep link
  // on the support page out of the conversion count — it is somewhere an
  // existing customer goes to cancel, which is the opposite of an install.
  var STORE_LINK_SELECTOR =
    'a[href*="' + APP_STORE_HOST + '"]:not([href*="/account/"]), ' +
    'a[href*="' + PLAY_STORE_HOST + '"]';

  // Which store a click is headed for. Kept as its own event param rather than
  // baked into cta_location, so placement stays one clean dimension ('hero',
  // 'sticky-bar', 'post-inline') and store is another.
  function storeFor(url) {
    return url.indexOf(PLAY_STORE_HOST) !== -1 ? 'android' : 'ios';
  }

  /* ── Store-side attribution ─────────────────────────────────────────────
   * GA4 can follow a visitor as far as the store button and no further. These
   * tags ride the store URL itself, so the stores can say which installs came
   * from which source and which button:
   *
   *   Apple  pt + ct  → App Store Connect → Analytics → Campaigns
   *   Play   referrer → Play Console → Store performance, by UTM campaign
   *
   * Both are labelled the same way — `<source>-<placement>`, e.g.
   * `pinterest-post-inline` — so a row in either store console joins straight
   * to GA4's utm_source and cta_location. Apple caps `ct` at 40 characters,
   * which is why the post slug is not part of the label.
   */

  function slug(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // Where this visitor came from. A UTM tag wins; otherwise the external site
  // that referred them (google, pinterest, facebook…), remembered for the visit
  // so page two still knows. `l.facebook.com` and `ca.pinterest.com` both
  // reduce to their second-level name.
  var REF_KEY = 'gpp_ref_source';
  function visitSource() {
    if (attribution.utm_source) return slug(attribution.utm_source);
    try {
      var stored = sessionStorage.getItem(REF_KEY);
      if (stored) return stored;
    } catch (e) { /* private mode */ }
    var source = 'direct';
    try {
      var host = new URL(document.referrer).hostname;
      if (host && host !== window.location.hostname) {
        var parts = host.split('.');
        source = slug(parts.length > 1 ? parts[parts.length - 2] : host) || 'direct';
      }
    } catch (e) { /* no referrer */ }
    try { sessionStorage.setItem(REF_KEY, source); } catch (e) { /* private mode */ }
    return source;
  }

  function storeLabel(link) {
    var placement = slug(link.getAttribute('data-cta') || 'unspecified');
    return (visitSource() + '-' + placement).slice(0, 40);
  }

  // Apple only honours `ct` when it is paired with a provider token.
  function withAppleCampaign(url, label) {
    if (!APPLE_PROVIDER_TOKEN) return url;
    var parsed = new URL(url, window.location.origin);
    parsed.searchParams.set('pt', APPLE_PROVIDER_TOKEN);
    parsed.searchParams.set('ct', label);
    parsed.searchParams.set('mt', '8');
    return parsed.href;
  }

  // Play reads UTM tags from a single URL-encoded `referrer` parameter. It needs
  // utm_source and utm_campaign at minimum to show a campaign row.
  function withPlayReferrer(url, label, link) {
    var parsed = new URL(url, window.location.origin);
    var referrer = new URLSearchParams({
      utm_source: visitSource(),
      utm_medium: slug(attribution.utm_medium) || 'web',
      utm_campaign: label,
      utm_content: slug(link.getAttribute('data-cta') || 'unspecified')
    });
    parsed.searchParams.set('referrer', referrer.toString());
    return parsed.href;
  }

  // Runs after BaseLayout's inline script has already moved single-destination
  // CTAs to Play on Android, so it decorates whichever store each link now
  // points at. A link that fails to parse is left exactly as it was.
  function decorateStoreLinks() {
    var links = document.querySelectorAll(STORE_LINK_SELECTOR);
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      try {
        var label = storeLabel(link);
        if (link.href.indexOf(APP_STORE_HOST) !== -1) {
          link.href = withAppleCampaign(link.href, label);
        } else if (link.href.indexOf(PLAY_STORE_HOST) !== -1) {
          link.href = withPlayReferrer(link.href, label, link);
        }
      } catch (e) { /* leave the link untouched */ }
    }
  }

  function trackAppStoreClick(link) {
    var payload = {
      link_url: link.href,
      // Which button did the work — hero, sticky bar, footer, a blog post…
      cta_location: link.getAttribute('data-cta') || 'unspecified',
      store: storeFor(link.href),
      // Which topic-matched store page the visitor is being sent to — a post
      // about slugs points every CTA on it at the pest page. BaseLayout stamps
      // the key on <html>; pages without one are the default listing. Registered
      // as the GA4 custom dimension `store_page`, so the same split exists on
      // both sides of the store button.
      store_page: document.documentElement.getAttribute('data-store-page') || 'default',
      page_path: window.location.pathname
    };
    for (var key in attribution) {
      if (Object.prototype.hasOwnProperty.call(attribution, key)) payload[key] = attribution[key];
    }

    // gtag uses sendBeacon, so the hit survives the jump to the store.
    if (gaEnabled) gtag('event', 'app_store_click', payload);
    if (window.rdt) window.rdt('track', 'Lead');
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var link = target.closest(STORE_LINK_SELECTOR);
    if (link) trackAppStoreClick(link);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorateStoreLinks);
  } else {
    decorateStoreLinks();
  }
})();
