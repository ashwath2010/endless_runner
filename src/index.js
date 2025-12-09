import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
    fullscreenTarget: 'game-container',
    min: {
      width: 320,
      height: 240
    },
    max: {
      width: 1600,
      height: 1200
    }
  }
};

const game = new Phaser.Game(config);
