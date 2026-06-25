/* ------------------------------------------------------------------ *
 *  MenuScene
 *  Écran titre avec fond étoilé animé et instructions.
 * ------------------------------------------------------------------ */

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;

        this.createStarfield();

        // Titre
        this.add.text(width / 2, 150, 'ARKANOID', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#5a6bff'
        }).setOrigin(0.5).setShadow(0, 0, '#9fb0ff', 18, true, true);

        this.add.text(width / 2, 210, 'PHASER 3 EDITION', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '16px',
            color: '#9aa3b8'
        }).setOrigin(0.5);

        // Aperçu d'une balle qui rebondit pour la déco
        const ball = this.physics.add.image(width / 2, 300, 'ball');
        ball.setCircle(9).setBounce(1).setVelocity(120, -90).setCollideWorldBounds(true);
        this.demoBall = ball;

        // Instructions
        const help = [
            '← →  ou  SOURIS  pour déplacer la raquette',
            'ESPACE / CLIC  pour lancer la balle',
            'Attrape les capsules colorées (bonus & malus)',
            '',
            'Détruis toutes les briques pour passer au niveau suivant'
        ];
        this.add.text(width / 2, 430, help, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '14px',
            color: '#cfd2ff',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        // Bouton "Jouer" clignotant
        const start = this.add.text(width / 2, 560, '▶  APPUIE SUR ESPACE POUR JOUER', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#33d17a'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: start,
            alpha: 0.25,
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        // Entrées
        this.input.keyboard.once('keydown-SPACE', () => this.startGame());
        this.input.once('pointerdown', () => this.startGame());
    }

    startGame() {
        this.cameras.main.fade(350, 11, 12, 26);
        this.time.delayedCall(360, () => {
            this.scene.start('GameScene', { level: 0, score: 0, lives: 3 });
        });
    }

    createStarfield() {
        const { width, height } = this.scale;
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            const s = this.add.image(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                'star'
            ).setAlpha(Phaser.Math.FloatBetween(0.2, 1));
            s.speed = Phaser.Math.FloatBetween(8, 40);
            this.stars.push(s);
        }
    }

    update(time, delta) {
        const { height } = this.scale;
        const dt = delta / 1000;
        this.stars.forEach((s) => {
            s.y += s.speed * dt;
            if (s.y > height) {
                s.y = 0;
                s.x = Phaser.Math.Between(0, this.scale.width);
            }
        });
    }
}
