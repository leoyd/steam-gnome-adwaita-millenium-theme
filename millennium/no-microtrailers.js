/* Adw Lite — "Micro-trailers: disabled" option.
 * On the store, capsule preview videos are no longer downloaded: their
 * source is removed as soon as they are inserted. The main player of a
 * game page (trailers started on purpose) is left untouched. */
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
  // Only added nodes that are (or contain) a video are examined
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
