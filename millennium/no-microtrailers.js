/* Adw Lite — option « Mini-bandes-annonces : désactivées ».
 * Sur le magasin, les vidéos d'aperçu des capsules ne sont plus téléchargées :
 * leur source est retirée dès leur insertion. Le lecteur principal d'une
 * fiche de jeu (bandes-annonces lancées volontairement) n'est pas touché. */
(function () {
  if (!/store\.steampowered\.com$/.test(location.hostname)) return;
  var SEL = '.store_main_capsule video, .capsule video, video.sale_capsule_video, ' +
            'video.tab_preview_video, video.microtrailer_video, .microtrailer video';
  function strip(root) {
    (root.querySelectorAll ? root.querySelectorAll(SEL) : []).forEach(function (v) {
      if (v.dataset.adwStripped) return;
      v.dataset.adwStripped = '1';
      v.pause();
      v.removeAttribute('autoplay');
      v.preload = 'none';
      v.querySelectorAll('source').forEach(function (s) { s.remove(); });
      v.removeAttribute('src');
      v.load();
    });
  }
  // Seuls les nœuds ajoutés qui sont (ou contiennent) une vidéo sont examinés
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var added = records[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var n = added[j];
        if (n.nodeType === 1 && (n.tagName === 'VIDEO' || n.getElementsByTagName('video').length)) strip(n.parentNode || n);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  strip(document);
})();
