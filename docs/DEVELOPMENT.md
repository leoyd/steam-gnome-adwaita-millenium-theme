# Développement — Adw Lite

Notes techniques pour modifier le thème. Pour l'installer, voir le [README](../README.md).

- Base client : [Adwaita-for-Steam](https://github.com/tkashkin/Adwaita-for-Steam) 4.4 (MIT), dans `src/adwaita/`.
- Pages web et surcouche : `src/webkit/` et `src/lite/`.
- Polices système uniquement (Adwaita Sans / Mono, repli Cantarell).
- Petits scripts : `millennium/library.js` (barre collante de la page d'un jeu), `millennium/has.js` (remplaçant de `:has()`, généré), et en option `millennium/limits.js` (listes par 6 + « Voir plus ») et `millennium/no-microtrailers.js` (mini-bandes-annonces non téléchargées).

## Structure

```
skin.json                  options Millennium (couleurs, accent, boutons, extras)
build.py                   assemble et minifie les feuilles
millennium/main.min.css    généré : fenêtre principale, sans :has() (voir plus bas)
millennium/has.js          généré : pose les attributs qui remplacent les :has()
millennium/adwaita.min.css généré : amis, dialogues, fenêtres plein écran
millennium/menu.min.css    généré : menus (feuille réduite)
webkit/webkit.min.css      généré : pages magasin / communauté
options/                   petits fichiers injectés selon les options choisies
millennium/library.js      barre collante de la page d'un jeu (toujours actif)
millennium/limits.js       option « Listes limitées à 6 » + bouton « Voir plus »
millennium/no-microtrailers.js  option « Mini-bandes-annonces : désactivées »
src/client.css             point d'entrée client
src/lite/                  surcouche Adw Lite du client (en-tête bibliothèque, spinner, avatars)
src/webkit/components/     un fichier par composant (bouton, champ, carte, onglets,
                           pagination, badge, vote, méta-données, média, carrousel,
                           progression/spinner, performance)
src/webkit/pages/          mise en page propre à chaque écran (en-têtes, magasin, communauté)
tools/check-classes.py     repère les classes Steam disparues après une mise à jour
tools/has2attr.mjs         convertit les :has() en attributs (Node + postcss)
src/lite/has-runtime.js    modèle de millennium/has.js
```

Les options dont `affects` vaut `.*` s'appliquent aussi aux pages web : le mode
clair/sombre, la palette et la couleur d'accent sont donc communs au client et au
magasin, car les deux feuilles utilisent les mêmes variables `--adw-*`.

## Modifier le thème

Éditer les fichiers de `src/`, puis :

```sh
python3 build.py
```

Les pages web se rechargent à la prochaine navigation ; le client a besoin d'un
redémarrage de Steam.

La première fois, installer les outils de conversion : `npm install`. Sans Node,
`build.py` copie la feuille telle quelle (avec ses `:has()`) : le thème reste
correct, mais la bibliothèque est nettement plus lente.

## Performances : pas de :has() dans la fenêtre principale

Dans la bibliothèque, React modifie le DOM en permanence et chaque `:has()`
oblige Chromium à réévaluer des sélecteurs à chaque modification : avec la
feuille d'Adwaita-for-Steam, l'ouverture de la page d'un jeu passait de 0,2 s
(Steam sans thème) à près de 4 s. Pour la fenêtre principale, `build.py` réécrit
donc chaque `sujet:has(argument)` en `sujet[data-adw-hN]`, et `has.js` pose ces
attributs une fois par image après une modification du DOM. Pour rester bon
marché, il ne parcourt jamais tout le document : il part des éléments qui
portent la classe du sujet (ou, pour `:has(> Y)` / `:has(+ Y)`, des Y) et saute
les règles dont aucun élément n'est affiché.

Règle à garder en écrivant du CSS : un `:has()` doit viser un sujet qui porte une
classe (`div.Classe:has(…)`), jamais un `div` nu ou `div.Panel`.

## Après une mise à jour de Steam

Steam et son magasin utilisent des classes hachées (`_16jZ3HEbtaJTl80pQINN2Y`) qui
changent lors de certaines mises à jour. Une règle qui vise une classe disparue
ne produit aucune erreur : elle cesse simplement de s'appliquer. Chaque classe
hachée des sources est suivie de son nom d'origine en commentaire
(`/* StoreMenu */`) pour pouvoir la retrouver.

```sh
python3 tools/check-classes.py   # classes du client introuvables dans steamui
```

Pour la partie client, le plus simple reste de reprendre `src/adwaita/` depuis la
dernière version d'Adwaita-for-Steam (`adwaita/` du dépôt), puis de relancer `build.py`.

## Composants des pages web

Chaque élément d'interface est défini une seule fois dans `src/webkit/components/`
et se décline par variables CSS, sans réécrire le composant :

| Composant | Variables |
|-----------|-----------|
| bouton    | `--btn-bg`, `--btn-bg-hover`, `--btn-fg`, `--btn-radius`, `--btn-height`, `--btn-pad` |
| carte     | `--card-bg`, `--card-pad`, `--card-radius` |
| champ     | `--entry-bg`, `--entry-pad`, `--entry-radius` |
| badge     | `--badge-bg`, `--badge-fg`, `--badge-radius` |
| onglet    | `--tab-height`, `--tab-pad` |
| bouton OSD (flèches) | `--osd-size` |
| spinner   | `--spinner-size` |
| progression | `--progress-color`, `--progress-height` |

Les sélecteurs des composants sont dans `:where()` (spécificité nulle) : une
page peut toujours ajuster un composant. Exception documentée dans
`button.css` : Steam force la couleur de ses boutons avec `!important`, la
couleur y est donc rejouée avec la même spécificité.
