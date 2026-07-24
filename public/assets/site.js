/*
 * Garden Pro Planner — small UI behaviours.
 * Currently just the mobile download bar, which slides up once the visitor has
 * scrolled past the hero so it never sits on top of the hero's own CTA.
 */
(function () {
  'use strict';

  var bar = document.querySelector('.mobile-cta');
  if (!bar) return;

  var REVEAL_AFTER = 360; // px — roughly the height of the hero copy on a phone
  var visible = false;
  var ticking = false;

  function update() {
    ticking = false;
    var shouldShow = window.scrollY > REVEAL_AFTER;
    if (shouldShow === visible) return;
    visible = shouldShow;
    bar.classList.toggle('is-visible', shouldShow);
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });

  update();
})();
