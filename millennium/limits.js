/* Adw Lite — bibliothèque, page d'un jeu : listes limitées + « Voir plus ».
 *
 * Amis qui jouent : 6 au maximum par groupe (a joué, liste de souhaits…).
 * Activité et contenu de la communauté : 6 au départ, puis +6 par clic sur
 * « Voir plus ». Tant que des éléments déjà chargés restent masqués, le
 * chargement automatique de Steam est suspendu (voir limits.css), ce qui
 * supprime le chargement en boucle au défilement.
 *
 * Le script pose seulement data-adw-overflow sur ce qui dépasse et ajoute le
 * bouton ; le masquage est fait en CSS. Le marquage a lieu dans le même tour
 * que l'insertion par Steam (microtâche) : rien ne s'affiche puis disparaît. */
(function () {
  var STEP = 6, scheduled = false, caps = new WeakMap();

  // section, éléments, groupes à masquer s'ils sont vides, bouton « Voir plus » ?
  var LISTS = [
    // FriendsSection > Friends > AvatarAndLabel, ou NoMask > ligne (selon le groupe :
    // « a joué », « liste de souhaits »…), sans les « +N » de Steam ; 6 par
    // groupe (groupe : Subsection)
    { section: 'div.qGJMO0uQwngYsOvMwgGWa',
      item: 'div._1umjft7ymqKrhhjDroeBUO :is(div._1GCZAht_W2I3Elndk5cU0-, div._3gj9A13VQyuW_6wr_Io8Xz > div):not(._34gmVq6C3FNtdHqDLa3-XR, ._2svsyHbl5BVVIsPeW8HLpN, ._2EspjUGvVbAC5UqXtS_G8F)',
      group: 'div._39bm0CkBxBjJsnPpAzoZlv', perGroup: true, more: false },
    // ActivityFeedContainer > AppActivityDay > Event (groupe : AppActivityDay)
    { section: 'div._3yTl3RiWfo-Itg-xp967wP', item: 'div.UVeN0kaD3zv1feMj_mMw5', group: 'div.S2Fu9HxHCA5MaCLGrN2ib', more: true },
    // CommunityContentContainer > AppOverviewRow > CommunityItem (groupe : AppOverviewRow)
    { section: 'div.A6G1leLXs7Vqw45hoXg-l', item: 'div._3QS6OBHpvI5bXsSQA2zQuW', group: 'div._1I55h8ejmOddwvE4LFbSEq', more: true }
  ];

  function setAttr(el, on) {
    if (on) { if (!el.hasAttribute('data-adw-overflow')) el.setAttribute('data-adw-overflow', ''); }
    else if (el.hasAttribute('data-adw-overflow')) el.removeAttribute('data-adw-overflow');
  }

  function moreButton(section) {
    var btn = section.querySelector(':scope > .adw-more');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'adw-more DialogButton';
      btn.type = 'button';
      btn.textContent = 'Voir plus';
      btn.addEventListener('click', function () {
        caps.set(section, (caps.get(section) || STEP) + STEP);
        run();
      });
      section.appendChild(btn);
    }
    return btn;
  }

  function run() {
    scheduled = false;
    LISTS.forEach(function (l) {
      document.querySelectorAll(l.section).forEach(function (section) {
        var cap = caps.get(section) || STEP, shown = new Map(), hidden = 0, visibleGroups = new Set(), last = [];
        section.querySelectorAll(l.item).forEach(function (item) {
          // une actualité partenaire contient elle-même un « Event » : on ne compte que l'extérieur
          var outer = item.parentElement && item.parentElement.closest(l.item);
          if (outer && section.contains(outer)) return;
          // compteur commun à la section, ou propre à chaque groupe (perGroup)
          var group = item.closest(l.group), key = l.perGroup ? group : section, n = shown.get(key) || 0;
          var hide = n >= cap;
          setAttr(item, hide);
          if (hide) hidden++; else { shown.set(key, n + 1); visibleGroups.add(group); last.push(item); }
        });
        // dernier visible de sa liste : garde l'arrondi du bas (voir limits.css)
        last.forEach(function (item) {
          var next = item.nextElementSibling, on = !!next && next.hasAttribute('data-adw-overflow');
          if (on !== item.hasAttribute('data-adw-last')) item.toggleAttribute('data-adw-last', on);
        });
        section.querySelectorAll(l.group).forEach(function (g) { setAttr(g, !visibleGroups.has(g)); });
        if (l.more) {
          var btn = moreButton(section);
          btn.hidden = hidden === 0;
          section.toggleAttribute('data-adw-has-more', hidden > 0);
        }
      });
    });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(run);
  }

  // Steam modifie le DOM en permanence : on ne relance le marquage que si
  // une mutation touche la page d'un jeu (AppDetails), et une fois par tâche.
  var ROOT = 'div._2iE-78WxX2Pj4GHbq7YJiA'; // appdetails Container
  new MutationObserver(function (records) {
    if (scheduled) return;
    for (var i = 0; i < records.length; i++) {
      var t = records[i].target;
      if (t.nodeType === 1 && t.closest(ROOT)) { schedule(); return; }
      var added = records[i].addedNodes; // arrivée sur la page d'un jeu
      for (var j = 0; j < added.length; j++) {
        var n = added[j];
        if (n.nodeType === 1 && (n.matches(ROOT) || n.querySelector(ROOT))) { schedule(); return; }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
  run();
})();
