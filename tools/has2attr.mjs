// Adw Lite — remplace les :has() d'une feuille par des attributs posés en JS.
//
// :has() oblige Chromium à réévaluer des sélecteurs à chaque modification du
// DOM ; dans la bibliothèque (React, très dynamique) cela multipliait par 5
// à 15 les temps de chargement. Chaque « sujet:has(argument) » devient
// « sujet[data-adw-hN] » et l'entrée N est écrite dans un tableau JSON :
//   q : sélecteur de recherche des candidats (contexte sans :has, sans pseudo dynamique)
//   t : test exact appliqué à chaque candidat (sujet:has(argument))
// millennium/has.js lit ce tableau et pose/retire les attributs.
//
//   node tools/has2attr.mjs entrée.css sortie.css sortie.json
import fs from 'node:fs';
import postcss from 'postcss';
import parser from 'postcss-selector-parser';

const [, , input, outCss, outJson] = process.argv;
const root = postcss.parse(fs.readFileSync(input, 'utf8'));
const entries = new Map(); // clé t|q -> index
const DYNAMIC = /^:(hover|active|focus|focus-visible|focus-within|visited|checked|target)$/;
const PSEUDO_ELEMENT = /^::?(before|after|first-letter|first-line|placeholder|selection|marker|backdrop|-webkit-[\w-]+)$/;

// Nœuds d'un « compound » (entre deux combinateurs) contenant le nœud n
function compoundOf(n) {
	const sel = n.parent, nodes = sel.nodes, i = nodes.indexOf(n);
	let a = i, b = i;
	while (a > 0 && nodes[a - 1].type !== 'combinator') a--;
	while (b < nodes.length - 1 && nodes[b + 1].type !== 'combinator') b++;
	return { sel, from: a, to: b };
}

// Texte d'une suite de nœuds sans les :has() ni les pseudo dynamiques / éléments
function stripped(nodes) {
	return nodes.map(n => {
		if (n.type === 'pseudo' && (n.value === ':has' || DYNAMIC.test(n.value) || PSEUDO_ELEMENT.test(n.value))) return '';
		if (n.type === 'pseudo' && n.value === ':not' && n.toString().includes(':has(')) return '';
		return n.toString();
	}).join('').trim();
}

// Sélecteur complet (imbrication résolue) du parent d'une règle
function resolvedParent(rule) {
	let p = rule.parent;
	while (p && p.type !== 'rule') p = p.type === 'root' ? null : p.parent;
	if (!p) return '';
	return resolve(p.selector, resolvedParent(p));
}

function resolve(sel, parentSel) {
	if (!parentSel) return sel;
	return parser(r => {
		r.each(s => {
			let hasAmp = false;
			s.walkNesting(n => { hasAmp = true; n.replaceWith(parser.string({ value: ':is(' + parentSel + ')' })); });
			if (!hasAmp) {
				s.prepend(parser.combinator({ value: ' ' }));
				s.prepend(parser.string({ value: ':is(' + parentSel + ')' }));
			}
		});
	}).processSync(sel);
}

function transformSelector(selectorStr, parentSel) {
	return parser(selRoot => {
		let selectorHasAmp = false;
		selRoot.walkNesting(() => { selectorHasAmp = true; });
		// les :has les plus profonds d'abord n'existent pas en pratique ; on traite chaque :has trouvé
		const hasNodes = [];
		selRoot.walkPseudos(p => { if (p.value === ':has') hasNodes.push(p); });
		for (const h of hasNodes) {
			let anchor = h; // nœud qui porte le :has dans le compound du sujet
			// :not(:has(X)) / :is(:has(X)) : le sujet est le compound qui contient la pseudo englobante
			const inner = h.parent; // sélecteur intérieur
			if (inner.parent && inner.parent.type === 'pseudo' && inner.nodes.length === 1) anchor = inner.parent;
			const { sel, from, to } = compoundOf(anchor);
			const outer = sel.nodes;
			// contexte : tout ce qui précède le compound + le compound lui-même, débarrassé des :has/dynamiques
			const prefix = stripped(outer.slice(0, from)).replace(/\s+/g, ' ');
			let compound = stripped(outer.slice(from, to + 1));
			if (!compound || /^[>+~]/.test(compound)) compound = '*';
			const arg = h.nodes.map(s => s.toString().trim()).join(', ');
			// résolution de l'imbrication pour les sélecteurs utilisés en JS
			const amp = parentSel ? ':is(' + parentSel + ')' : '';
			let qs = (prefix ? prefix + ' ' : '') + compound, ts = compound;
			if (parentSel) {
				// & avant/dans le sujet : contexte explicite ; & seulement après le
				// sujet (« X:has(Y) & ») : le sujet est un ancêtre, pas de contexte ;
				// aucun & : descendant implicite du parent.
				if (qs.includes('&')) { qs = qs.split('&').join(amp); ts = ts.split('&').join(amp); }
				else if (!selectorHasAmp) qs = amp + ' ' + qs;
			}
			if (ts === '*' || ts === '') ts = '*';
			const q = qs, t = ts + ':has(' + arg.split('&').join(amp || '&') + ')';
			const key = t + '\u0000' + q;
			if (!entries.has(key)) entries.set(key, entries.size);
			const attr = parser.attribute({ attribute: 'data-adw-h' + entries.get(key) });
			h.replaceWith(attr);
		}
	}).processSync(selectorStr);
}

let count = 0;
root.walkRules(rule => {
	if (!rule.selector.includes(':has(')) return;
	rule.selector = transformSelector(rule.selector, resolvedParent(rule));
	count++;
});

fs.writeFileSync(outCss, root.toString());
const list = [];
for (const [key, i] of entries) { const [t, q] = key.split('\u0000'); list[i] = { q, t }; }
fs.writeFileSync(outJson, JSON.stringify(list));
console.log(`${count} règles, ${list.length} conditions :has() converties`);
