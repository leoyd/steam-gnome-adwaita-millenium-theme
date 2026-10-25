/* Adw Lite — library, game page: sticky bar.
 * When the panel (Play, status, playtime…) scrolls off screen, data-adw-sticky
 * is set on AppDetailsMain; the CSS then shows the game bar that Steam
 * already keeps in the page (real buttons, nothing is recreated).
 * Steam normally triggers it with a marker that the theme's layout
 * no longer crosses. */
(function () {
  var SCROLL = 'div._2l416KfEtI4CL0mCUEmOBw',  // appdetails ScrollContainer
      MAIN = 'div._2Nq6ov7A1hGcHXVOXNt_OE',     // AppDetailsMain
      PANEL = 'div._1U7LKpx70kEsz3jJwAFOi-',    // in-page game bar (InPage)
      pending = null;

  function update(scroller) {
    pending = null;
    var main = scroller.closest(MAIN), panel = scroller.querySelector(PANEL);
    if (!main || !panel) return;
    var gone = panel.getBoundingClientRect().bottom < scroller.getBoundingClientRect().top + 24;
    if (gone !== main.hasAttribute('data-adw-sticky')) main.toggleAttribute('data-adw-sticky', gone);
  }

  document.addEventListener('scroll', function (e) {
    var t = e.target;
    if (pending || !(t instanceof Element) || !t.matches(SCROLL)) return;
    pending = requestAnimationFrame(function () { update(t); });
  }, { capture: true, passive: true });
})();
