/* ------------------------------------------------------------------ *
 *  GameOverScene
 *  Écran de fin (victoire ou défaite) avec score et meilleur score.
 * ------------------------------------------------------------------ */

class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.victory = data.victory;
        this.finalScore = data.score || 0;
        this.level = data.level || 1;
    }

    create() {
        const { width, height } = this.scale;

        // Meilleur score (localStorage).
        let best = 0;
        try {
            best = parseInt(localStorage.getItem('arkanoid_best') || '0', 10);
            if (this.finalScore > best) {
                best = this.finalScore;
                localStorage.setItem('arkanoid_best', String(best));
            }
        } catch (e) { /* localStorage indisponible : on ignore */ }

        const title = this.victory ? 'VICTOIRE !' : 'GAME OVER';
        const color = this.victory ? '#33d17a' : '#ff4d6d';

        this.add.text(width / 2, 200, title, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '56px', fontStyle: 'bold', color
        }).setOrigin(0.5).setShadow(0, 0, color, 16, true, true);

        this.add.text(width / 2, 290, 'Score : ' + this.finalScore, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '26px', color: '#cfd2ff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 330, 'Meilleur : ' + best, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '18px', color: '#9aa3b8'
        }).setOrigin(0.5);

        const replay = this.add.text(width / 2, 440, '▶  REJOUER (ESPACE)', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '22px', fontStyle: 'bold', color: '#5a6bff'
        }).setOrigin(0.5);
        this.tweens.add({ targets: replay, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

        this.add.text(width / 2, 490, 'Menu (M)', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '16px', color: '#9aa3b8'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene', { level: 0, score: 0, lives: 3 });
        });
        this.input.keyboard.once('keydown-M', () => {
            this.scene.start('MenuScene');
        });
        this.input.once('pointerdown', () => {
            this.scene.start('GameScene', { level: 0, score: 0, lives: 3 });
        });
    }
}
