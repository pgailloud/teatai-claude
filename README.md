# Arkanoid — Phaser 3

Un casse-briques (type *Arkanoid*) écrit en JavaScript avec
[Phaser 3](https://phaser.io/).

**Tous les sprites sont dessinés à la main, par code**, via l'API `Graphics`
de Phaser (voir [`js/scenes/BootScene.js`](js/scenes/BootScene.js)) puis
convertis en textures. Aucune image n'est téléchargée depuis Internet. Le
moteur Phaser est lui aussi embarqué localement (`vendor/phaser.min.js`), donc
le jeu fonctionne **entièrement hors-ligne**.

## Lancer le jeu

Sers le dossier avec un petit serveur local (recommandé pour éviter les
restrictions `file://` des navigateurs) :

```bash
# Python 3
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

Tu peux aussi ouvrir directement `index.html` dans un navigateur.

## Commandes

| Action | Touches |
| ------ | ------- |
| Déplacer la raquette | `←` `→` / `A` `D` / souris |
| Lancer la balle | `Espace` / clic |
| Pause | `P` / `Échap` |

## Contenu

- **4 niveaux** au tracé varié (pyramide, damier, forteresse, vagues).
- **Briques colorées** (1 coup) et **briques acier** (3 coups).
- **Power-ups** qui tombent et qu'il faut attraper avec la raquette :
  - 🟢 Raquette agrandie
  - 🔴 Raquette rétrécie (malus)
  - 🟡 Multi-balles
  - 🔵 Balle ralentie
  - 🟠 Vie supplémentaire
- Rebond dépendant du point d'impact sur la raquette, particules, secousses
  de caméra, fond étoilé animé.
- Score, vies (cœurs) et **meilleur score** sauvegardé localement.

## Structure

```
index.html              Page + chargement des scripts
js/main.js              Configuration Phaser
js/scenes/BootScene.js  Génération de TOUS les sprites (dessin à la main)
js/scenes/MenuScene.js  Écran titre
js/scenes/GameScene.js  Logique du jeu (raquette, balles, briques, niveaux)
js/scenes/HUDScene.js   Affichage score / vies / niveau
js/scenes/GameOverScene.js  Écran de fin
```
