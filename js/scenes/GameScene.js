/* ------------------------------------------------------------------ *
 *  GameScene
 *  Logique principale : raquette, balle(s), briques, power-ups,
 *  collisions, niveaux, vies et score.
 * ------------------------------------------------------------------ */

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.levelIndex = data.level || 0;
        this.score = data.score || 0;
        this.lives = data.lives != null ? data.lives : 3;
    }

    create() {
        const { width, height } = this.scale;
        this.W = width;
        this.H = height;

        this.gameOver = false;
        this.ballLaunched = false;

        this.createStarfield();

        // Bords du monde : on ouvre le bas pour laisser tomber la balle.
        this.physics.world.setBoundsCollision(true, true, true, false);

        this.createPaddle();
        this.createBalls();
        this.createBricks();

        this.powerUps = this.physics.add.group();

        // Émetteur de particules (impacts).
        this.sparks = this.add.particles(0, 0, 'spark', {
            speed: { min: 40, max: 160 },
            scale: { start: 0.9, end: 0 },
            lifespan: 350,
            quantity: 6,
            emitting: false,
            tint: [0x9fb0ff, 0xffffff]
        });

        this.setupInput();
        this.setupColliders();

        // HUD en surimpression.
        this.scene.launch('HUDScene');
        this.events.emit('hud:update', { score: this.score, lives: this.lives, level: this.levelIndex + 1 });

        // Petit message de niveau.
        this.showLevelBanner();
    }

    /* =============================================================== *
     *  CRÉATION DES OBJETS
     * =============================================================== */

    createPaddle() {
        this.paddle = this.physics.add.image(this.W / 2, this.H - 50, 'paddle');
        this.paddle.setImmovable(true);
        this.paddle.body.allowGravity = false;
        this.paddle.setCollideWorldBounds(true);
        this.basePaddleWidth = this.paddle.width;
    }

    createBalls() {
        this.balls = this.physics.add.group();
        this.spawnBall(this.paddle.x, this.paddle.y - 22, true);
        this.baseBallSpeed = 300;
    }

    spawnBall(x, y, attached) {
        const ball = this.balls.create(x, y, 'ball');
        ball.setCircle(9);
        ball.setBounce(1);
        ball.setCollideWorldBounds(true);
        ball.body.onWorldBounds = true;
        ball.setData('attached', !!attached);
        if (!attached) {
            const angle = Phaser.Math.FloatBetween(-Math.PI * 0.75, -Math.PI * 0.25);
            this.setBallVelocity(ball, angle);
        }
        return ball;
    }

    setBallVelocity(ball, angle, speed) {
        const v = speed || this.baseBallSpeed;
        ball.setVelocity(Math.cos(angle) * v, Math.sin(angle) * v);
    }

    createBricks() {
        this.bricks = this.physics.add.staticGroup();
        const layout = LEVELS[this.levelIndex % LEVELS.length];

        const cols = layout[0].length;
        const brickW = 56, brickH = 24, padX = 4, padY = 6;
        const totalW = cols * (brickW + padX) - padX;
        const offsetX = (this.W - totalW) / 2 + brickW / 2;
        const offsetY = 90;

        const map = {
            '1': { tex: 'brick_blue', hp: 1, pts: 50 },
            '2': { tex: 'brick_green', hp: 1, pts: 60 },
            '3': { tex: 'brick_yellow', hp: 1, pts: 70 },
            '4': { tex: 'brick_orange', hp: 1, pts: 80 },
            '5': { tex: 'brick_red', hp: 1, pts: 90 },
            '6': { tex: 'brick_purple', hp: 1, pts: 100 },
            'S': { tex: 'brick_steel', hp: 3, pts: 150 } // brique solide
        };

        layout.forEach((row, r) => {
            for (let c = 0; c < row.length; c++) {
                const ch = row[c];
                if (ch === '.' || ch === ' ') continue;
                const def = map[ch];
                if (!def) continue;
                const x = offsetX + c * (brickW + padX);
                const y = offsetY + r * (brickH + padY);
                const brick = this.bricks.create(x, y, def.tex);
                brick.setData('hp', def.hp);
                brick.setData('maxHp', def.hp);
                brick.setData('pts', def.pts);
                brick.refreshBody();
            }
        });

        this.remaining = this.bricks.countActive();
    }

    /* =============================================================== *
     *  ENTRÉES & COLLISIONS
     * =============================================================== */

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey('A');
        this.keyD = this.input.keyboard.addKey('D');
        this.spaceKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // Lancement de la balle.
        this.spaceKey.on('down', () => this.launchBalls());
        this.input.on('pointerdown', () => this.launchBalls());

        // Pause.
        this.input.keyboard.on('keydown-P', () => this.togglePause());
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    }

    setupColliders() {
        this.physics.add.collider(this.balls, this.paddle, this.hitPaddle, null, this);
        this.physics.add.collider(this.balls, this.bricks, this.hitBrick, null, this);
        this.physics.add.overlap(this.powerUps, this.paddle, this.collectPowerUp, null, this);

        // Son/particule quand la balle touche un bord.
        this.physics.world.on('worldbounds', (body) => {
            this.sparks.emitParticleAt(body.center.x, body.center.y, 3);
        });
    }

    /* =============================================================== *
     *  BOUCLE DE JEU
     * =============================================================== */

    update(time, delta) {
        if (this.gameOver) return;
        const dt = delta / 1000;

        this.updateStarfield(dt);
        this.handlePaddleMovement(dt);
        this.keepAttachedBalls();
        this.checkLostBalls();
    }

    handlePaddleMovement(dt) {
        const speed = 520;
        const pointer = this.input.activePointer;
        const usingPointer = pointer.isDown || pointer.justMoved;

        if (this.cursors.left.isDown || this.keyA.isDown) {
            this.paddle.x -= speed * dt;
        } else if (this.cursors.right.isDown || this.keyD.isDown) {
            this.paddle.x += speed * dt;
        } else if (pointer.x > 0 && (usingPointer || this.lastPointerX !== pointer.x)) {
            // Suivi souris doux.
            const targetX = Phaser.Math.Clamp(pointer.worldX, 0, this.W);
            this.paddle.x = Phaser.Math.Linear(this.paddle.x, targetX, 0.35);
        }
        this.lastPointerX = pointer.x;

        const half = this.paddle.displayWidth / 2;
        this.paddle.x = Phaser.Math.Clamp(this.paddle.x, half, this.W - half);
    }

    keepAttachedBalls() {
        this.balls.getChildren().forEach((ball) => {
            if (ball.getData('attached')) {
                ball.setVelocity(0, 0);
                ball.x = this.paddle.x;
                ball.y = this.paddle.y - this.paddle.displayHeight / 2 - 12;
            }
        });
    }

    launchBalls() {
        let launched = false;
        this.balls.getChildren().forEach((ball) => {
            if (ball.getData('attached')) {
                ball.setData('attached', false);
                const angle = Phaser.Math.FloatBetween(-Math.PI * 0.65, -Math.PI * 0.35);
                this.setBallVelocity(ball, angle);
                launched = true;
            }
        });
        if (launched) this.ballLaunched = true;
    }

    checkLostBalls() {
        const alive = [];
        this.balls.getChildren().forEach((ball) => {
            if (ball.active && ball.y > this.H + 30) {
                ball.destroy();
            } else if (ball.active) {
                alive.push(ball);
            }
        });

        if (alive.length === 0 && this.ballLaunched && !this.gameOver) {
            this.loseLife();
        }
    }

    /* =============================================================== *
     *  COLLISIONS
     * =============================================================== */

    hitPaddle(ball, paddle) {
        if (ball.getData('attached')) return;
        // L'angle de rebond dépend de l'endroit touché sur la raquette.
        const diff = (ball.x - paddle.x) / (paddle.displayWidth / 2);
        const clamped = Phaser.Math.Clamp(diff, -1, 1);
        const angle = (-Math.PI / 2) + clamped * (Math.PI / 3); // ±60°
        const speed = ball.body.velocity.length() || this.baseBallSpeed;
        this.setBallVelocity(ball, angle, speed);
        this.sparks.emitParticleAt(ball.x, ball.y, 4);
    }

    hitBrick(ball, brick) {
        let hp = brick.getData('hp') - 1;
        this.sparks.emitParticleAt(ball.x, ball.y, 8);

        if (hp <= 0) {
            this.score += brick.getData('pts');
            this.spawnPowerUpMaybe(brick.x, brick.y);
            this.popBrick(brick);
            brick.destroy();
            this.remaining--;
        } else {
            brick.setData('hp', hp);
            // Assombrit légèrement la brique abîmée.
            brick.setTint(0xbbbbbb);
            this.tweens.add({
                targets: brick, scaleX: 1.12, scaleY: 1.12,
                duration: 60, yoyo: true
            });
        }

        this.events.emit('hud:update', {
            score: this.score, lives: this.lives, level: this.levelIndex + 1
        });

        if (this.remaining <= 0) {
            this.levelComplete();
        }
    }

    popBrick(brick) {
        const fx = this.add.image(brick.x, brick.y, brick.texture.key);
        this.tweens.add({
            targets: fx,
            scaleX: 1.5, scaleY: 1.5, alpha: 0,
            angle: Phaser.Math.Between(-40, 40),
            duration: 220,
            onComplete: () => fx.destroy()
        });
    }

    /* =============================================================== *
     *  POWER-UPS
     * =============================================================== */

    spawnPowerUpMaybe(x, y) {
        if (Phaser.Math.FloatBetween(0, 1) > 0.22) return; // 22 % de chance
        const types = ['pu_expand', 'pu_shrink', 'pu_multi', 'pu_slow', 'pu_life'];
        // Les malus sont moins fréquents.
        const weighted = ['pu_expand', 'pu_expand', 'pu_multi', 'pu_multi',
                          'pu_slow', 'pu_life', 'pu_shrink'];
        const key = Phaser.Utils.Array.GetRandom(weighted);
        const pu = this.powerUps.create(x, y, key);
        pu.setData('type', key);
        pu.setVelocityY(140);
        pu.body.allowGravity = false;
        this.tweens.add({
            targets: pu, angle: 360, duration: 1500, repeat: -1
        });
    }

    collectPowerUp(paddle, pu) {
        const type = pu.getData('type');
        pu.destroy();
        this.sparks.emitParticleAt(paddle.x, paddle.y, 10);

        switch (type) {
            case 'pu_expand': this.resizePaddle(1.4); this.flashText('RAQUETTE +', 0x33d17a); break;
            case 'pu_shrink': this.resizePaddle(0.7); this.flashText('RAQUETTE -', 0xff4d6d); break;
            case 'pu_multi':  this.multiBall(); this.flashText('MULTI-BALLES', 0xffd23f); break;
            case 'pu_slow':   this.slowBalls(); this.flashText('RALENTI', 0x5a6bff); break;
            case 'pu_life':   this.addLife(); this.flashText('+1 VIE', 0xff8c42); break;
        }
    }

    resizePaddle(factor) {
        const newW = Phaser.Math.Clamp(
            this.paddle.displayWidth * factor, 48, 200
        );
        this.tweens.add({
            targets: this.paddle,
            displayWidth: newW,
            duration: 200
        });
    }

    multiBall() {
        const sources = this.balls.getChildren().filter(b => !b.getData('attached'));
        const base = sources[0];
        if (!base) return;
        for (let i = 0; i < 2; i++) {
            const nb = this.spawnBall(base.x, base.y, false);
            const angle = Phaser.Math.FloatBetween(-Math.PI * 0.8, -Math.PI * 0.2);
            this.setBallVelocity(nb, angle, base.body.velocity.length());
        }
    }

    slowBalls() {
        this.balls.getChildren().forEach((ball) => {
            if (ball.getData('attached')) return;
            const v = ball.body.velocity;
            ball.setVelocity(v.x * 0.6, v.y * 0.6);
        });
        // Effet temporaire : on remet une vitesse de base après 6 s.
        this.time.delayedCall(6000, () => {
            this.balls.getChildren().forEach((ball) => {
                if (ball.getData('attached')) return;
                const a = Math.atan2(ball.body.velocity.y, ball.body.velocity.x);
                this.setBallVelocity(ball, a, this.baseBallSpeed);
            });
        });
    }

    addLife() {
        this.lives++;
        this.events.emit('hud:update', {
            score: this.score, lives: this.lives, level: this.levelIndex + 1
        });
    }

    /* =============================================================== *
     *  ÉTATS DE PARTIE
     * =============================================================== */

    loseLife() {
        this.lives--;
        this.ballLaunched = false;
        this.events.emit('hud:update', {
            score: this.score, lives: this.lives, level: this.levelIndex + 1
        });

        this.cameras.main.shake(220, 0.012);

        if (this.lives <= 0) {
            this.endGame(false);
            return;
        }

        // Réinitialise la raquette et redonne une balle attachée.
        this.resetPaddleSize();
        this.spawnBall(this.paddle.x, this.paddle.y - 22, true);
        this.flashText('BALLE PERDUE', 0xff4d6d);
    }

    resetPaddleSize() {
        this.tweens.add({
            targets: this.paddle,
            displayWidth: this.basePaddleWidth,
            duration: 200
        });
    }

    levelComplete() {
        this.gameOver = true; // bloque la boucle le temps de la transition
        this.balls.getChildren().forEach(b => b.setVelocity(0, 0));

        const isLast = (this.levelIndex + 1) >= LEVELS.length;
        const msg = isLast ? 'TU AS GAGNÉ !' : 'NIVEAU TERMINÉ !';

        const t = this.add.text(this.W / 2, this.H / 2, msg, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '40px', fontStyle: 'bold', color: '#33d17a'
        }).setOrigin(0.5).setShadow(0, 0, '#0b0c1a', 8);

        this.tweens.add({ targets: t, scale: 1.2, duration: 400, yoyo: true });

        this.time.delayedCall(1600, () => {
            if (isLast) {
                this.endGame(true);
            } else {
                this.cameras.main.fade(350, 11, 12, 26);
                this.time.delayedCall(360, () => {
                    this.scene.stop('HUDScene');
                    this.scene.restart({
                        level: this.levelIndex + 1,
                        score: this.score,
                        lives: this.lives
                    });
                });
            }
        });
    }

    endGame(victory) {
        this.gameOver = true;
        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', {
            victory,
            score: this.score,
            level: this.levelIndex + 1
        });
    }

    togglePause() {
        if (this.gameOver) return;
        if (this.scene.isPaused('GameScene')) {
            this.scene.resume('GameScene');
            if (this.pauseText) this.pauseText.destroy();
        } else {
            this.pauseText = this.add.text(this.W / 2, this.H / 2, 'PAUSE', {
                fontFamily: 'Segoe UI, sans-serif',
                fontSize: '48px', fontStyle: 'bold', color: '#cfd2ff'
            }).setOrigin(0.5).setDepth(100);
            this.scene.pause('GameScene');
        }
    }

    /* =============================================================== *
     *  DÉCO / UTILITAIRES
     * =============================================================== */

    showLevelBanner() {
        const t = this.add.text(this.W / 2, this.H / 2, `NIVEAU ${this.levelIndex + 1}`, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '36px', fontStyle: 'bold', color: '#5a6bff'
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({
            targets: t, alpha: 1, duration: 300, yoyo: true, hold: 600,
            onComplete: () => t.destroy()
        });
    }

    flashText(label, color) {
        const t = this.add.text(this.W / 2, this.H - 120, label, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '20px', fontStyle: 'bold',
            color: '#' + color.toString(16).padStart(6, '0')
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({
            targets: t, y: t.y - 40, alpha: 0, duration: 900,
            onComplete: () => t.destroy()
        });
    }

    createStarfield() {
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            const s = this.add.image(
                Phaser.Math.Between(0, this.W),
                Phaser.Math.Between(0, this.H),
                'star'
            ).setAlpha(Phaser.Math.FloatBetween(0.15, 0.8)).setDepth(-10);
            s.speed = Phaser.Math.FloatBetween(6, 30);
            this.stars.push(s);
        }
    }

    updateStarfield(dt) {
        this.stars.forEach((s) => {
            s.y += s.speed * dt;
            if (s.y > this.H) { s.y = 0; s.x = Phaser.Math.Between(0, this.W); }
        });
    }
}

/* ------------------------------------------------------------------ *
 *  Définition des niveaux.
 *  Chiffres 1-6 = briques colorées (1 coup), S = brique acier (3 coups),
 *  '.' = case vide.
 * ------------------------------------------------------------------ */
const LEVELS = [
    // Niveau 1 — pyramide simple
    [
        '..1111..',
        '.222222.',
        '33333333',
        '44444444',
        '.555555.',
        '..6666..'
    ],
    // Niveau 2 — damier avec acier
    [
        '1.2.3.4.',
        '.S.S.S.S',
        '5.6.5.6.',
        '.S.S.S.S',
        '4.3.2.1.'
    ],
    // Niveau 3 — forteresse
    [
        'SSSSSSSS',
        'S666666S',
        'S5....5S',
        'S4.SS.4S',
        'S333333S',
        'SSSSSSSS'
    ],
    // Niveau 4 — vagues
    [
        '1......1',
        '22....22',
        '.333333.',
        '..4444..',
        '.555555.',
        '66....66',
        'S......S'
    ]
];
