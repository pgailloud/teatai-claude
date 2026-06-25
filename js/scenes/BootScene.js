/* ------------------------------------------------------------------ *
 *  BootScene
 *  Génère TOUS les sprites du jeu "à la main" via l'API Graphics de
 *  Phaser, puis les transforme en textures réutilisables.
 *  Aucun asset n'est téléchargé depuis Internet.
 * ------------------------------------------------------------------ */

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.makePaddle();
        this.makeBall();
        this.makeBricks();
        this.makePowerUps();
        this.makeParticle();
        this.makeStarfield();
        this.makeHeart();

        this.scene.start('MenuScene');
    }

    /* -- Utilitaire : crée une texture à partir d'un Graphics ------- */
    bake(key, width, height, drawFn) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        drawFn(g);
        g.generateTexture(key, width, height);
        g.destroy();
    }

    /* -- Raquette : capsule métallique bleue avec reflet ------------ */
    makePaddle() {
        const w = 96, h = 20, r = 10;
        this.bake('paddle', w, h, (g) => {
            // corps dégradé simulé par bandes
            g.fillStyle(0x2f3bd6, 1);
            g.fillRoundedRect(0, 0, w, h, r);
            g.fillStyle(0x5a6bff, 1);
            g.fillRoundedRect(0, 0, w, h - 6, r);
            // reflet haut
            g.fillStyle(0xb9c2ff, 0.9);
            g.fillRoundedRect(6, 3, w - 12, 4, 2);
            // embouts lumineux
            g.fillStyle(0x9fd0ff, 1);
            g.fillCircle(r, h / 2, 3);
            g.fillCircle(w - r, h / 2, 3);
            // contour
            g.lineStyle(2, 0x0c1450, 0.8);
            g.strokeRoundedRect(1, 1, w - 2, h - 2, r);
        });
    }

    /* -- Balle : sphère blanche avec halo et point de lumière ------- */
    makeBall() {
        const s = 18, c = s / 2;
        this.bake('ball', s, s, (g) => {
            g.fillStyle(0x6f7bff, 0.35);
            g.fillCircle(c, c, c);                 // halo
            g.fillStyle(0xffffff, 1);
            g.fillCircle(c, c, c - 3);             // corps
            g.fillStyle(0xc9d2ff, 1);
            g.fillCircle(c + 1.5, c + 1.5, c - 5); // ombre interne
            g.fillStyle(0xffffff, 1);
            g.fillCircle(c - 2, c - 2, 2);         // point de lumière
        });
    }

    /* -- Briques : une texture par couleur, avec biseau ------------- */
    makeBricks() {
        const w = 56, h = 24;
        const palette = {
            'brick_blue':   [0x5a6bff, 0x2f3bd6, 0x9fb0ff],
            'brick_green':  [0x33d17a, 0x1e8a4f, 0x9bffce],
            'brick_yellow': [0xffd23f, 0xc79a14, 0xfff0b0],
            'brick_orange': [0xff8c42, 0xc75a1a, 0xffc79f],
            'brick_red':    [0xff4d6d, 0xc71f3e, 0xffb0bf],
            'brick_purple': [0xb35aff, 0x7a1ed1, 0xe0b0ff],
            'brick_steel':  [0x9aa3b8, 0x5b6275, 0xdfe5f5]  // brique solide
        };

        Object.keys(palette).forEach((key) => {
            const [base, dark, light] = palette[key];
            this.bake(key, w, h, (g) => {
                g.fillStyle(dark, 1);
                g.fillRect(0, 0, w, h);
                g.fillStyle(base, 1);
                g.fillRect(2, 2, w - 4, h - 4);
                // biseau clair haut/gauche
                g.fillStyle(light, 0.85);
                g.fillRect(2, 2, w - 4, 3);
                g.fillRect(2, 2, 3, h - 4);
                // ombre bas/droite
                g.fillStyle(dark, 0.9);
                g.fillRect(2, h - 4, w - 4, 2);
                g.fillRect(w - 4, 2, 2, h - 4);
            });
        });
    }

    /* -- Power-ups : capsules colorées avec un symbole dessiné ------ */
    makePowerUps() {
        const w = 28, h = 16;
        const defs = {
            'pu_expand':   0x33d17a,  // agrandit la raquette
            'pu_shrink':   0xff4d6d,  // rétrécit la raquette
            'pu_multi':    0xffd23f,  // multi-balles
            'pu_slow':     0x5a6bff,  // ralentit la balle
            'pu_life':     0xff8c42   // vie supplémentaire
        };
        Object.keys(defs).forEach((key) => {
            const color = defs[key];
            this.bake(key, w, h, (g) => {
                // capsule
                g.fillStyle(0x0c1450, 1);
                g.fillRoundedRect(0, 0, w, h, 7);
                g.fillStyle(color, 1);
                g.fillRoundedRect(1, 1, w - 2, h - 2, 6);
                g.fillStyle(0xffffff, 0.55);
                g.fillRoundedRect(3, 2, w - 6, 3, 2);
                // symbole, dessiné dans la même passe
                this.drawGlyph(g, key, w / 2, h / 2);
            });
        });
    }

    // Symbole simple au centre d'une capsule (formes géométriques).
    drawGlyph(g, key, cx, cy) {
        g.fillStyle(0x0c1450, 1);
        switch (key) {
            case 'pu_expand': // double flèche <->
                g.fillTriangle(cx - 8, cy, cx - 4, cy - 3, cx - 4, cy + 3);
                g.fillTriangle(cx + 8, cy, cx + 4, cy - 3, cx + 4, cy + 3);
                g.fillRect(cx - 4, cy - 1, 8, 2);
                break;
            case 'pu_shrink': // flèches >|<
                g.fillTriangle(cx - 2, cy, cx - 6, cy - 3, cx - 6, cy + 3);
                g.fillTriangle(cx + 2, cy, cx + 6, cy - 3, cx + 6, cy + 3);
                break;
            case 'pu_multi':  // trois points
                g.fillCircle(cx - 5, cy, 2.2);
                g.fillCircle(cx, cy, 2.2);
                g.fillCircle(cx + 5, cy, 2.2);
                break;
            case 'pu_slow':   // tortue stylisée (coque + tête)
                g.fillEllipse(cx, cy + 1, 12, 7);
                g.fillCircle(cx + 8, cy, 2);
                break;
            case 'pu_life':   // petite croix
                g.fillRect(cx - 1.5, cy - 5, 3, 10);
                g.fillRect(cx - 5, cy - 1.5, 10, 3);
                break;
        }
    }

    /* -- Particule générique (impacts, traînée) -------------------- */
    makeParticle() {
        this.bake('spark', 8, 8, (g) => {
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4, 4, 3);
        });
    }

    /* -- Étoile pour le fond ---------------------------------------- */
    makeStarfield() {
        this.bake('star', 4, 4, (g) => {
            g.fillStyle(0xffffff, 1);
            g.fillCircle(2, 2, 1.4);
        });
    }

    /* -- Cœur pour l'affichage des vies ----------------------------- */
    makeHeart() {
        const s = 18;
        this.bake('heart', s, s, (g) => {
            g.fillStyle(0xff4d6d, 1);
            g.fillCircle(5.5, 6, 4.5);
            g.fillCircle(12.5, 6, 4.5);
            g.fillTriangle(1.5, 7.5, 16.5, 7.5, 9, 16.5);
            g.fillStyle(0xffb0bf, 0.7);
            g.fillCircle(5, 5, 1.6);
        });
    }
}
