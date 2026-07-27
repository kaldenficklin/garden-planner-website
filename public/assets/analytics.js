/*
 * Garden Pro Planner — site analytics
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

  // "Garden Pro Planner Website" property (401448878 / 547196945), web stream
  // 15330067195. Deliberately its own property: the apps report into
  // "garden-planner-e91af" (545945963), and mixing site sessions into the app's
  // numbers would distort both.
  var GA_MEASUREMENT_ID = 'G-ZJYHEXNQBX';

  // Optional. App Store Connect → App Analytics → Campaigns issues a "provider
  // token". Set it and App Store product-page views get attributed to the same
  // campaign the visitor arrived on, so Apple's numbers line up with GA's.
  var APPLE_PROVIDER_TOKEN = '';

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

  /* ── App Store click = the conversion ───────────────────────────────── */

  var APP_STORE_HOST = 'apps.apple.com';

  // Apple only honours `ct` when it is paired with a provider token.
  function withAppleCampaign(url) {
    if (!APPLE_PROVIDER_TOKEN) return url;
    try {
      var parsed = new URL(url, window.location.origin);
      if (parsed.hostname.indexOf(APP_STORE_HOST) === -1) return url;
      parsed.searchParams.set('pt', APPLE_PROVIDER_TOKEN);
      parsed.searchParams.set('ct', (attribution.utm_campaign || 'reddit').slice(0, 40));
      parsed.searchParams.set('mt', '8');
      return parsed.href;
    } catch (e) {
      return url;
    }
  }

  function decorateAppStoreLinks() {
    if (!APPLE_PROVIDER_TOKEN) return;
    var links = document.querySelectorAll('a[href*="' + APP_STORE_HOST + '"]');
    for (var i = 0; i < links.length; i++) {
      links[i].href = withAppleCampaign(links[i].href);
    }
  }

  function trackAppStoreClick(link) {
    var payload = {
      link_url: link.href,
      // Which button did the work — hero, sticky bar, footer, a blog post…
      cta_location: link.getAttribute('data-cta') || 'unspecified',
      page_path: window.location.pathname
    };
    for (var key in attribution) {
      if (Object.prototype.hasOwnProperty.call(attribution, key)) payload[key] = attribution[key];
    }

    // gtag uses sendBeacon, so the hit survives the jump to the App Store.
    if (gaEnabled) gtag('event', 'app_store_click', payload);
    if (window.rdt) window.rdt('track', 'Lead');
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var link = target.closest('a[href*="' + APP_STORE_HOST + '"]');
    if (link) trackAppStoreClick(link);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorateAppStoreLinks);
  } else {
    decorateAppStoreLinks();
  }
})();
