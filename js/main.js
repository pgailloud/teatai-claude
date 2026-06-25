/* ------------------------------------------------------------------ *
 *  Arkanoid — Phaser 3
 *  Configuration globale du jeu et démarrage.
 * ------------------------------------------------------------------ */

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0b0c1a',
    pixelArt: false,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, HUDScene, GameOverScene]
};

// eslint-disable-next-line no-unused-vars
const game = new Phaser.Game(config);

// Exposé pour le débogage dans la console.
window.game = game;
