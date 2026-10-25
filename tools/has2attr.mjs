// Adw Lite — replaces the :has() in a stylesheet with attributes set from JS.
//
// :has() forces Chromium to re-evaluate selectors on every DOM mutation;
// in the library (React, highly dynamic) this multiplied load times by 5
// to 15. Each "subject:has(argument)" becomes "subject[data-adw-hN]" and
// entry N is written to a JSON array:
//   q: selector used to find candidates (context without :has, without dynamic pseudos)
//   t: exact test applied to each candidate (subject:has(argument))
// millennium/has.js reads this array and sets/removes the attributes.
//
//   node tools/has2attr.mjs input.css output.css output.json
import fs from 'node:fs';
import postcss from 'postcss';
import parser from 'postcss-selector-parser';

const [, , input, outCss, outJson] = process.argv;
const root = postcss.parse(fs.readFileSync(input, 'utf8'));
const entries = new Map(); // key t|q -> index
const DYNAMIC = /^:(hover|active|focus|focus-visible|focus-within|visited|checked|target)$/;
const PSEUDO_ELEMENT = /^::?(before|after|first-letter|first-line|placeholder|selection|marker|backdrop|-webkit-[\w-]+)$/;

// Nodes of the "compound" (between two combinators) containing node n
function compoundOf(n) {
	const sel = n.parent, nodes = sel.nodes, i = nodes.indexOf(n);
	let a = i, b = i;
	while (a > 0 && nodes[a - 1].type !== 'combinator') a--;
	while (b < nodes.length - 1 && nodes[b + 1].type !== 'combinator') b++;
	return { sel, from: a, to: b };
}

// Text of a sequence of nodes without :has() or dynamic pseudo-classes / pseudo-elements
function stripped(nodes) {
	return nodes.map(n => {
		if (n.type === 'pseudo' && (n.value === ':has' || DYNAMIC.test(n.value) || PSEUDO_ELEMENT.test(n.value))) return '';
		if (n.type === 'pseudo' && n.value === ':not' && n.toString().includes(':has(')) return '';
		return n.toString();
	}).join('').trim();
}

// Full selector (nesting resolved) of a rule's parent
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
		// deepest :has first does not occur in practice; each :has found is processed
		const hasNodes = [];
		selRoot.walkPseudos(p => { if (p.value === ':has') hasNodes.push(p); });
		for (const h of hasNodes) {
			let anchor = h; // node carrying the :has in the subject's compound
			// :not(:has(X)) / :is(:has(X)): the subject is the compound containing the enclosing pseudo
			const inner = h.parent; // inner selector
			if (inner.parent && inner.parent.type === 'pseudo' && inner.nodes.length === 1) anchor = inner.parent;
			const { sel, from, to } = compoundOf(anchor);
			const outer = sel.nodes;
			// context: everything before the compound + the compound itself, stripped of :has/dynamic pseudos
			const prefix = stripped(outer.slice(0, from)).replace(/\s+/g, ' ');
			let compound = stripped(outer.slice(from, to + 1));
			if (!compound || /^[>+~]/.test(compound)) compound = '*';
			const arg = h.nodes.map(s => s.toString().trim()).join(', ');
			// resolve nesting for the selectors used in JS
			const amp = parentSel ? ':is(' + parentSel + ')' : '';
			let qs = (prefix ? prefix + ' ' : '') + compound, ts = compound;
			if (parentSel) {
				// & before/in the subject: explicit context; & only after the
				// subject ("X:has(Y) &"): the subject is an ancestor, no context;
				// no &: implicit descendant of the parent.
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
console.log(`${count} rules, ${list.length} :has() conditions converted`);
