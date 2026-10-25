/* Adw Lite — remplaçant de :has() pour la fenêtre principale.
 * Fichier généré par build.py à partir de src/lite/has-runtime.js : la liste
 * RULES vient de tools/has2attr.mjs. Chaque règle { q, t } : les éléments
 * trouvés par q qui vérifient t reçoivent l'attribut data-adw-h<index>.
 * Réévaluation au plus une fois par image, avant le rendu, après toute
 * modification du DOM ou changement de focus.
 *
 * Pour rester bon marché, chaque règle a une « classe témoin » (la dernière
 * classe de son sujet) : tant qu'aucun élément ne porte cette classe, la règle
 * est sautée sans requête (collection live, test en temps constant). */
(function () {
  if (window.__adwHas) return;
  window.__adwHas = true;
  var RULES = /*RULES*/[];
  var pending = false, cost = 0, runs = 0;

  // Découpe s au niveau 0 des parenthèses / crochets sur les caractères de sep
  function split(s, sep) {
    var out = [], cur = '', depth = 0;
    for (var c = 0; c < s.length; c++) {
      var ch = s[c];
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      if (!depth && sep.indexOf(ch) >= 0) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out;
  }

  // Classes dont l'une au moins est portée par tout élément qui vérifie sel
  // (self) ou par l'un de ses ancêtres requis ; null si on ne sait pas le
  // garantir. Pour chaque alternative, on prend le compound le plus à droite
  // qui a une classe de premier niveau, ou un :is()/:where() qui en fournit.
  function compoundWitness(part) {
    var top = '', sub = null, start = 0, depth = 0;
    for (var c = 0; c < part.length; c++) {
      var ch = part[c];
      if (ch === '[') { depth++; continue; }
      if (ch === ']') { depth--; continue; }
      if (ch === '(') { if (!depth++) start = /:(is|where)$/.test(top) ? c + 1 : -1; continue; }
      if (ch === ')') { if (!--depth && start > 0 && !sub) sub = witnesses(part.slice(start, c)); continue; }
      if (!depth) top += ch;
    }
    var cls = top.match(/\.-?[_a-zA-Z][\w-]*/g);
    return cls ? { c: [cls[cls.length - 1].slice(1)], self: true } : sub;
  }

  function witnesses(sel) {
    var out = { c: [], self: true }, alts = split(sel, ',');
    for (var a = 0; a < alts.length; a++) {
      var parts = split(alts[a].trim(), ' >+~').filter(Boolean), w = null, p;
      for (p = parts.length - 1; p >= 0 && !w; p--) w = compoundWitness(parts[p]);
      if (!w) return null;
      out.c = out.c.concat(w.c);
      out.self = out.self && w.self && p === parts.length - 2;
    }
    return out;
  }

  function live(w) {
    return w.c.map(function (c) { return document.getElementsByClassName(c); });
  }

  var rules = RULES.map(function (r, i) {
    var at = r.t.lastIndexOf(':has('), w = witnesses(r.t.slice(0, at)) || witnesses(r.q);
    var rule = { q: r.q, t: r.t, name: 'data-adw-h' + i, marked: [], ms: 0,
                 self: !!w && w.self, live: w && live(w) };
    // « X:has(> Y) » / « X:has(+ Y) » avec Y simple et témoin : on part des Y
    // et on remonte au parent / au frère précédent.
    var m = /^([>+])\s*(.*)\)$/.exec(r.t.slice(at + 5));
    if (!rule.self && m && split(m[2], ', >+~').length === 1) {
      var wy = witnesses(m[2]);
      if (wy && wy.self) { rule.via = m[1]; rule.live = live(wy); }
    }
    return rule;
  });

  function test(r, el) {
    try { return el.matches(r.q) && el.matches(r.t); } catch (e) { return false; }
  }

  // Candidats : les porteurs de la classe témoin du sujet si on la connaît
  // (pas de parcours du document) ou leurs parents / frères pour « via »,
  // sinon querySelectorAll(q) quand un ancêtre témoin est présent.
  function candidates(r) {
    var out = [], i, j, el;
    if (r.via) {
      for (i = 0; i < r.live.length; i++)
        for (j = 0; j < r.live[i].length; j++) {
          el = r.via === '>' ? r.live[i][j].parentElement : r.live[i][j].previousElementSibling;
          if (el && out.indexOf(el) < 0 && test(r, el)) out.push(el);
        }
      return out;
    }
    if (r.self) {
      for (i = 0; i < r.live.length; i++)
        for (j = 0; j < r.live[i].length; j++)
          if (out.indexOf(r.live[i][j]) < 0 && test(r, r.live[i][j])) out.push(r.live[i][j]);
      return out;
    }
    if (r.live) {
      for (i = 0; i < r.live.length && !r.live[i].length; i++);
      if (i === r.live.length) return out;
    }
    var list;
    try { list = document.querySelectorAll(r.q); } catch (e) { return out; }
    for (j = 0; j < list.length; j++) {
      var ok; try { ok = list[j].matches(r.t); } catch (e) { ok = false; }
      if (ok) out.push(list[j]);
    }
    return out;
  }

  function run() {
    pending = false;
    var t0 = performance.now();
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i], t1 = performance.now(), next = candidates(r);
      // retire l'attribut des éléments qui ne correspondent plus, pose les nouveaux
      for (var k = 0; k < r.marked.length; k++)
        if (next.indexOf(r.marked[k]) < 0) r.marked[k].removeAttribute(r.name);
      for (var m = 0; m < next.length; m++)
        if (!next[m].hasAttribute(r.name)) next[m].setAttribute(r.name, '');
      r.marked = next;
      r.ms += performance.now() - t1;
    }
    cost += performance.now() - t0; runs++;
    window.__adwHasCost = { ms: Math.round(cost), runs: runs };
    window.__adwHasRules = rules;
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(run);
  }

  // nos propres attributs ne déclenchent rien : ils ne sont pas dans attributeFilter
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true, subtree: true,
    attributes: true, attributeFilter: ['class', 'value', 'aria-label', 'style']
  });
  document.addEventListener('focusin', schedule, true);
  document.addEventListener('focusout', schedule, true);
  run();
})();
