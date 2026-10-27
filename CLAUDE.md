# Irie Bay — notes pour Claude

Jeu de ferme 3D cel-shading (Three.js 0.160, sans framework ni dépendance npm), inspiré de Stardew Valley, thème reggae/rasta. Tout le texte du jeu est en **français**, ton fun et décalé. Le propriétaire (Doktom) parle français : réponds-lui en français.

## Démarrer

```bash
node build.mjs          # assemble src/ → index.html (+ artifact.html, ignoré par git)
node tools/serve.mjs    # sert le dossier sur http://127.0.0.1:18439
```

Ouvre `http://127.0.0.1:18439/index.html?v=1#debug`. Le `#debug` expose `window.IB` (état `S`, joueur `P`, `testAction`, `sleepNow`, `openShop`, `placeAllNPCs`, etc.) pour tester en console. **Change le `?v=` à chaque rechargement** : naviguer vers la même URL avec seulement un `#` ne recharge pas la page.

Vérification minimale après chaque modification : `node build.mjs && node --check .check.mjs` (`.check.mjs` est le script assemblé, ignoré par git).

## Architecture

`build.mjs` concatène `src/head.html` (titre, polices, CSS), `src/body.html` (HUD, écran titre) et tous les `src/js/*.js` **dans l'ordre alphabétique** en un seul `<script type="module">`. Conséquences :

- Une seule portée module : **deux déclarations de même nom au niveau racine = erreur de syntaxe** (déjà arrivé avec `QUALITY`, d'où `QUAL` pour la qualité des objets).
- Les fonctions sont hissées, mais les `const`/`let` d'un fichier ne sont utilisables qu'après son exécution : le code exécuté au chargement (construction du monde) est appelé à la fin, dans `12-main.js`.
- Un nouveau fichier doit être nommé pour tomber au bon endroit (`09b`, `10c`…).

| Fichier | Rôle |
| --- | --- |
| `01-core.js` | import Three.js, utilitaires, données de base (ITEMS, CROPS, SHOPS, NPC_DEFS, QUESTS, SKILLS), état `S`/`P`, `resetState()` |
| `01b-data.js` | données de progression : outils machette/pioche, ressources, RECIPES, TALENTS, QUAL, FARM_RECTS/FARM_UPG, BUILDS, LOCKS, DEBRIS |
| `02-icons.js` | icônes des objets dessinées en canvas (`icon(id, tier)`), pictos météo, cœurs |
| `03-map.js` | carte 96×64 tuiles (x = est, z = sud, mer au sud), collisions (`boxes`, `blocked`), lieux des PNJ (`SPOTS`), A* (`findPath`) |
| `04-render.js` | renderer, lumières, matériaux toon, `batch()` (InstancedMesh), post-traitement contours + halo, reflets planaires, `render()` |
| `05-terrain.js` | sol (couleurs par tuile), eau (shader : écume, reflets, scintillement) |
| `06-structures.js` | bâtiments, case du joueur, boutiques, café, scène, poulailler/étable, guirlandes, torches, `buildWorld()` |
| `07-nature.js` | palmiers, bananiers, herbes, coquillages, papillons, lucioles, nuages, pluie, arc-en-ciel, crabes |
| `08-actors.js` | `makeCharacter`, tenues du joueur, PNJ (horaires, trajets), animaux |
| `09-game.js` | inventaire, cultures, actions, pêche, élevage, amitiés, quêtes, sauvegarde, `sleepNow()` |
| `09b-progress.js` | niveau de joueur, talents, qualité, débris, arroseurs, artisanat, agrandissement du champ, chantiers, verrous de zones |
| `09c-story.js` | légende de RastaBabylone : LORE, CHAPTERS, FRAGS, CUTS, Inspecteur Babylone, `checkStory()`, tortue, final |
| `10-ui.js` | HUD, barre d'objets, toasts, fenêtres (boutiques, carnet, sac, coffre, jour) |
| `10c-ui2.js` | scènes de dialogue, atelier, chantier, verrous, agrandissement, talents, journal |
| `10d-menu.js` | menu pause, 3 emplacements de sauvegarde, paramètres (`SET`), mode Test |
| `11-audio.js` | musique reggae synthétisée (WebAudio), ambiance, bruitages |
| `12-main.js` | lumière jour/nuit/saisons/météo, entrées, boucle, démarrage, `startGame()`, `boot()` |

### Ajouter du contenu

- **Objet** : `ITEMS` (+ icône dans `02-icons.js`, sinon rond gris). Champ `kind` : tool, seed, crop, fish, product, forage, food, feed, res, fert, bait, place, herb.
- **Culture** : `CROPS` (+ `buildCrop()` dans `09-game.js`, + graine dans le stock de `graines`).
- **Recette** : `RECIPES` (onglet `atelier` ou `cuisine`, niveau d'artisanat requis).
- **Quête** : `QUESTS` (`stat` + `n`, ou `fn`, ou `deliver: [pnj, objet, n]`, `req` pour l'ordre).
- **PNJ** : `NPC_DEFS` (look, `sched` = [minute, lieu], goûts, répliques) + lieux dans `SPOTS`. Vérifier les trajets avec `IB.findPath`.
- **Histoire** : `CHAPTERS`, `FRAGS`, `CUTS` et `checkStory()` dans `09c-story.js`.
- Les interactions avec la touche E sont dans `interactables` (`09-game.js`).

### Sauvegarde

`localStorage` : `irie-bay-s1..3` (emplacements), `irie-last` (dernier utilisé), `irie-settings`. Format `v: 3` produit par `serialize()`, relu par `applySave()` qui fusionne avec les valeurs par défaut : **tout nouveau champ d'état doit avoir une valeur par défaut dans `resetState()`** et être ajouté à `serialize()`/`applySave()` pour que les anciennes parties restent lisibles. L'ancienne clé `irie-bay-v2` est migrée vers l'emplacement 1.

## Publication

Deux sites GitHub Pages, tous deux servis depuis `main` :

1. **Ce dépôt** `Doktom/port-lumiere` → https://doktom.github.io/port-lumiere/ (sert `index.html`). Travailler sur une branche, puis fusionner dans `main` quand l'utilisateur valide.
2. **La salle d'arcade** `Doktom/mes-jeux` → https://doktom.github.io/mes-jeux/. Le jeu y est **copié** : après chaque mise à jour, copier `index.html` vers `jeux/irie-bay/index.html` de ce dépôt-là, et ajuster la carte dans `jeux.js` (et l'aperçu `apercus/irie-bay.jpg`, 800×500) si besoin. L'utilisateur veut que cette copie reste à jour.

Après un push, vérifier la mise en ligne avec `curl` (quelques minutes de délai ; le navigateur peut aussi garder l'ancienne version en cache : `Ctrl + F5`).

## Pièges connus (Windows)

- Fins de ligne : le dépôt est en **LF** (`.gitattributes`, `core.autocrlf false`). Les éditions par remplacement exact échouent sur du CRLF.
- Le Python du Microsoft Store ne voit pas certains dossiers (`AppData`) : utiliser Node pour servir les fichiers (`tools/serve.mjs`).
- Chemins trop longs : cloner les dépôts annexes dans un dossier court (`mktemp -d`), pas dans le scratchpad.
- Dans les tests automatisés, l'outil du navigateur n'envoie pas toujours la touche E au jeu : déclencher `window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e' }))`.
- Three.js 0.160 : `MeshToonMaterial` n'a pas `flatShading` (filtré dans `toon()`), et les toits utilisent une géométrie à normales plates (`prismGeo`).

## Rendu

Toon à 3 paliers (`gradTex`), contours par détection de profondeur + normales dans le post-traitement, reflets planaires (caméra miroir sous l'eau, `QUALITY.reflect`), halo de soleil et étalonnage dans le shader de post. La qualité s'adapte seule (`SET.quality = 'auto'`) : reflets coupés puis résolution baissée si l'image rame.
