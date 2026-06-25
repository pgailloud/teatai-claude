/* ------------------------------------------------------------------ *
 *  HUDScene
 *  Affichage en surimpression : score, niveau et vies (cœurs).
 * ------------------------------------------------------------------ */

class HUDScene extends Phaser.Scene {
    constructor() {
        super('HUDScene');
    }

    create() {
        const { width } = this.scale;

        this.scoreText = this.add.text(14, 12, 'SCORE 0', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '18px', fontStyle: 'bold', color: '#cfd2ff'
        });

        this.levelText = this.add.text(width / 2, 12, 'NIVEAU 1', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '18px', fontStyle: 'bold', color: '#9aa3b8'
        }).setOrigin(0.5, 0);

        this.hearts = [];

        // Écoute les mises à jour envoyées par GameScene.
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('hud:update', this.refresh, this);

        // Nettoyage des écouteurs au shutdown.
        this.events.once('shutdown', () => {
            gameScene.events.off('hud:update', this.refresh, this);
        });
    }

    refresh(data) {
        this.scoreText.setText('SCORE ' + data.score);
        this.levelText.setText('NIVEAU ' + data.level);
        this.drawHearts(data.lives);
    }

    drawHearts(lives) {
        this.hearts.forEach(h => h.destroy());
        this.hearts = [];
        const { width } = this.scale;
        for (let i = 0; i < lives; i++) {
            const h = this.add.image(width - 18 - i * 24, 22, 'heart');
            this.hearts.push(h);
        }
    }
}
