/* Adw Lite — bibliothèque, page d'un jeu : barre collante.
 * Quand le panneau (Jouer, statut, temps de jeu…) sort de l'écran, on pose
 * data-adw-sticky sur AppDetailsMain ; le CSS affiche alors la barre de jeu
 * que Steam garde déjà dans la page (vrais boutons, rien n'est recréé).
 * Steam la déclenche normalement par un repère que la mise en page du thème
 * ne franchit plus. */
(function () {
  var SCROLL = 'div._2l416KfEtI4CL0mCUEmOBw',  // appdetails ScrollContainer
      MAIN = 'div._2Nq6ov7A1hGcHXVOXNt_OE',     // AppDetailsMain
      PANEL = 'div._1U7LKpx70kEsz3jJwAFOi-',    // barre de jeu dans la page (InPage)
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
