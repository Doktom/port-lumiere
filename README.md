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

## La légende de RastaBabylone

Tonton Dub t'a laissé son yard, envahi de broussailles, et une lettre : la tortue géante RastaBabylone dort au fond de la baie depuis que le Ministère des Formulaires a brisé le Vinyle d'Or en sept éclats. Cinq chapitres, sept éclats à retrouver (terre, mer, comptoir, nid, jetée, poche d'un gamin, phare), l'Inspecteur Babylone et ses formulaires absurdes, et un grand réveil sur la place, une nuit.

## Progression

- **Niveau de joueur** (énergie max qui augmente) et **5 compétences** : agriculture, pêche, cueillette, élevage, artisanat. Chaque niveau de compétence donne un point de **talent** (15 talents, 3 rangs).
- **Qualité** des récoltes et des poissons (argent, or) qui augmente le prix de vente.
- **Ferme à agrandir** en 4 paliers (60 à 840 cases), à dégager à la machette et à la pioche.
- **Poulailler et étable à construire** (bois, pierre, corde, or), terminés pendant la nuit.
- **Zones à débloquer** : portillon de la plage, bout de la jetée (marlin), porte du phare.
- **Artisanat** : planches, cordes, engrais, appâts, arroseurs, kit de jetée, et une cuisine (dans la case).

## Menu et paramètres

`Échap` ou le bouton Menu : sauvegarde, 3 emplacements (charger, supprimer, exporter et importer un code), volumes musique, bruitages et ambiance, qualité graphique, compteur d'images, et un **mode Test** (argent, matériaux, saisons, météo, déblocages, téléportation, vitesse du temps).

## Commandes

| Touche | Action |
| --- | --- |
| ZQSD / flèches | marcher (Maj pour courir) |
| Espace / clic | utiliser l'outil |
| E / clic droit | interagir (parler, boutiques, dormir, caresser, récolter) |
| 1…0 / molette | choisir un objet |
| B | sac à dos (30 cases) |
| C | carnet (légende, quêtes, compétences, talents, amis, poissons) |
| K | artisanat (atelier et cuisine) |
| Échap | menu, sauvegardes, paramètres |
| F | manger |
| M | couper le son |

Écran tactile : joystick et boutons à l'écran.

## Développement

Le jeu est écrit en modules dans `src/js/` (rendu, terrain, structures, nature, acteurs, mécaniques, interface, audio, boucle principale). Un petit script les assemble en un seul fichier :

```bash
node build.mjs
```

Il produit `index.html` (la version publiée par GitHub Pages) et `artifact.html` (la même page sans squelette HTML). Ajoute `#debug` à l'adresse pour exposer l'objet `window.IB` dans la console.
