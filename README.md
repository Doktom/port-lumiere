# Irie Bay

Petit jeu de ferme en 3D **cel-shading**, inspiré de Stardew Valley, dans une île reggae : cocotiers, plage, sound system, torches tiki et bonnes ondes. Il se joue directement dans le navigateur (Three.js, aucun serveur nécessaire).

## Ce qu'on y fait

- **Cultiver** son yard : labourer, semer, arroser, récolter 7 cultures qui poussent selon la saison (gombo, patate douce, tomate, piment, giraumon, ananas, ganja).
- **Élever** des poules et des vaches (poulailler, étable), les nourrir, les caresser, vendre œufs et lait.
- **Pêcher** à la rivière ou au bout de la jetée (mini-jeu de barre), et suivre son catalogue de poissons.
- **Cueillir** des noix de coco en secouant les cocotiers et des coquillages sur la plage.
- **Vivre au village** : 6 villageois avec horaires, cœurs d'amitié, cadeaux, goûts et livraisons. Boutiques de graines, de poisson (et amélioration des outils), beach bar de Zion, boutique de vêtements.
- **Progresser** : 4 compétences, 20 quêtes, outils en 3 niveaux, garde-robe (tam rasta, bandana, lunettes…).
- **Saisons et météo** : 4 saisons de 28 jours, pluie, orage, arc-en-ciel, jour/nuit, lucioles, papillons, reflets et scintillement sur l'eau, halo du soleil.
- **Musique reggae** synthétisée (one-drop, skank, basse chaude) qui pulse dans les enceintes du village, plus ambiance sonore (vagues, rivière, pluie, oiseaux, grillons).

## Commandes

| Touche | Action |
| --- | --- |
| ZQSD / flèches | marcher (Maj pour courir) |
| Espace / clic | utiliser l'outil |
| E / clic droit | interagir (parler, boutiques, dormir, caresser, récolter) |
| 1…0 / molette | choisir un objet |
| B | sac à dos (30 cases) |
| C | carnet (quêtes, compétences, amis, poissons) |
| F | manger |
| M | couper le son |

Écran tactile : joystick et boutons à l'écran.

## Développement

Le jeu est écrit en modules dans `src/js/` (rendu, terrain, structures, nature, acteurs, mécaniques, interface, audio, boucle principale). Un petit script les assemble en un seul fichier :

```bash
node build.mjs
```

Il produit `index.html` (la version publiée par GitHub Pages) et `artifact.html` (la même page sans squelette HTML). Ajoute `#debug` à l'adresse pour exposer l'objet `window.IB` dans la console.
