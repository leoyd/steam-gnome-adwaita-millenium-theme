/* Adw Lite — library, game page: limited lists + "Show more".
 *
 * Friends who play: at most 6 per group (played, wishlist…).
 * Activity and community content: 6 at first, then +6 per click on
 * "Show more". As long as already loaded items remain hidden, Steam's
 * automatic loading is suspended (see limits.css), which removes the
 * endless loading loop while scrolling.
 *
 * The script only sets data-adw-overflow on what exceeds the limit and adds
 * the button; hiding is done in CSS. Marking happens in the same turn as
 * Steam's insertion (microtask): nothing appears and then disappears. */
(function () {
  var STEP = 6, scheduled = false, caps = new WeakMap();

  // section, items, groups to hide when empty, "Show more" button?
  var LISTS = [
    // FriendsSection > Friends > AvatarAndLabel, or NoMask > row (depending on the group:
    // "played", "wishlist"…), without Steam's "+N" entries; 6 per
    // group (group: Subsection)
    { section: 'div.qGJMO0uQwngYsOvMwgGWa',
      item: 'div._1umjft7ymqKrhhjDroeBUO :is(div._1GCZAht_W2I3Elndk5cU0-, div._3gj9A13VQyuW_6wr_Io8Xz > div):not(._34gmVq6C3FNtdHqDLa3-XR, ._2svsyHbl5BVVIsPeW8HLpN, ._2EspjUGvVbAC5UqXtS_G8F)',
      group: 'div._39bm0CkBxBjJsnPpAzoZlv', perGroup: true, more: false },
    // ActivityFeedContainer > AppActivityDay > Event (group: AppActivityDay)
    { section: 'div._3yTl3RiWfo-Itg-xp967wP', item: 'div.UVeN0kaD3zv1feMj_mMw5', group: 'div.S2Fu9HxHCA5MaCLGrN2ib', more: true },
    // CommunityContentContainer > AppOverviewRow > CommunityItem (group: AppOverviewRow)
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
      btn.textContent = 'Show more';
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
          // a partner news item itself contains an "Event": only the outer one is counted
          var outer = item.parentElement && item.parentElement.closest(l.item);
          if (outer && section.contains(outer)) return;
          // counter shared by the section, or per group (perGroup)
          var group = item.closest(l.group), key = l.perGroup ? group : section, n = shown.get(key) || 0;
          var hide = n >= cap;
          setAttr(item, hide);
          if (hide) hidden++; else { shown.set(key, n + 1); visibleGroups.add(group); last.push(item); }
        });
        // last visible item of its list: keeps the rounded bottom (see limits.css)
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

  // Steam mutates the DOM constantly: marking is only rerun when a
  // mutation touches a game page (AppDetails), and once per task.
  var ROOT = 'div._2iE-78WxX2Pj4GHbq7YJiA'; // appdetails Container
  new MutationObserver(function (records) {
    if (scheduled) return;
    for (var i = 0; i < records.length; i++) {
      var t = records[i].target;
      if (t.nodeType === 1 && t.closest(ROOT)) { schedule(); return; }
      var added = records[i].addedNodes; // arriving on a game page
      for (var j = 0; j < added.length; j++) {
        var n = added[j];
        if (n.nodeType === 1 && (n.matches(ROOT) || n.querySelector(ROOT))) { schedule(); return; }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
  run();
})();
