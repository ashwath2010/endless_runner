import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    // Preload assets if needed
  }

  create() {
    this.gameWidth = this.cameras.main.width;
    this.gameHeight = this.cameras.main.height;

    // Background
    this.cameras.main.setBackgroundColor('#0a0e27');
    this.createStarfield();

    // Load high scores from localStorage
    this.highScores = this.getHighScores();
    this.playerCoins = this.getPlayerCoins();

    // Title
    const title = this.add.text(this.gameWidth / 2, 40, 'COSMIC RUNNER', {
      fontSize: '48px',
      fill: '#00ff88',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    title.setOrigin(0.5);
    title.setDepth(10);

    // Current coins display
    const coinsText = this.add.text(20, 20, `Coins: ${this.playerCoins}`, {
      fontSize: '24px',
      fill: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    coinsText.setDepth(10);

    // High Scores Section
    const scoresTitle = this.add.text(this.gameWidth / 2, 100, 'HIGH SCORES', {
      fontSize: '28px',
      fill: '#ff00ff',
      fontStyle: 'bold'
    });
    scoresTitle.setOrigin(0.5);
    scoresTitle.setDepth(10);

    let scoreY = 140;
    for (let i = 0; i < Math.min(3, this.highScores.length); i++) {
      const scoreText = this.add.text(this.gameWidth / 2, scoreY, `${i + 1}. ${this.highScores[i]} pts`, {
        fontSize: '20px',
        fill: '#00ffff',
        fontStyle: 'bold'
      });
      scoreText.setOrigin(0.5);
      scoreY += 35;
    }

    // Shop Section
    const shopTitle = this.add.text(this.gameWidth / 2, 270, 'SPACESHIP SHOP', {
      fontSize: '28px',
      fill: '#ff00ff',
      fontStyle: 'bold'
    });
    shopTitle.setOrigin(0.5);
    shopTitle.setDepth(10);

    // Load unlocked ships from localStorage
    const unlockedShips = JSON.parse(localStorage.getItem('cosmicRunnerUnlockedShips')) || [true, false, false, false];

    // Spaceship designs with purchase button
    this.spaceshipDesigns = [
      { name: 'Starter', cost: 0, color: 0x00d4ff, unlocked: unlockedShips[0] },
      { name: 'Phantom', cost: 500, color: 0xff00ff, unlocked: unlockedShips[1] },
      { name: 'Inferno', cost: 1000, color: 0xffaa00, unlocked: unlockedShips[2] },
      { name: 'Quantum', cost: 2000, color: 0x00ff88, unlocked: unlockedShips[3] }
    ];

    let shipX = 80;
    const shipY = 350;
    
    for (let i = 0; i < this.spaceshipDesigns.length; i++) {
      const design = this.spaceshipDesigns[i];
      
      // Ship preview
      this.createShipPreview(shipX, shipY, design.color);
      
      // Ship name and cost
      const nameText = this.add.text(shipX, shipY + 60, design.name, {
        fontSize: '14px',
        fill: design.unlocked ? '#00ff88' : '#ff8888',
        fontStyle: 'bold',
        align: 'center'
      });
      nameText.setOrigin(0.5);
      nameText.setDepth(10);

      // Buy button
      if (!design.unlocked) {
        const buttonText = this.add.text(shipX, shipY + 85, `${design.cost}`, {
          fontSize: '12px',
          fill: this.playerCoins >= design.cost ? '#ffff00' : '#ff0000',
          fontStyle: 'bold',
          align: 'center'
        });
        buttonText.setOrigin(0.5);
        buttonText.setInteractive({ useHandCursor: true });
        buttonText.once('pointerdown', () => {
          if (this.playerCoins >= design.cost) {
            this.playerCoins -= design.cost;
            unlockedShips[i] = true;
            localStorage.setItem('cosmicRunnerUnlockedShips', JSON.stringify(unlockedShips));
            this.savePlayerCoins(this.playerCoins);
            this.scene.restart();
          }
        });
      } else {
        const unlockedText = this.add.text(shipX, shipY + 85, 'Owned', {
          fontSize: '12px',
          fill: '#00ff88',
          fontStyle: 'bold'
        });
        unlockedText.setOrigin(0.5);
      }

      shipX += 180;
    }

    // Play Button
    const playButton = this.add.rectangle(this.gameWidth / 2, this.gameHeight - 80, 200, 60, 0x00ff88);
    playButton.setInteractive({ useHandCursor: true });
     playButton.once('pointerdown', () => {
      this.scene.stop();
      this.scene.start('GameScene');
    });
    playButton.on('pointerover', () => {
      playButton.setFillStyle(0x00ffaa);
    });
    playButton.on('pointerout', () => {
      playButton.setFillStyle(0x00ff88);
    });

    const playText = this.add.text(this.gameWidth / 2, this.gameHeight - 80, 'PLAY GAME', {
      fontSize: '24px',
      fill: '#000000',
      fontStyle: 'bold'
    });
    playText.setOrigin(0.5);
    playText.setDepth(11);
  }

  createStarfield() {
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, this.gameWidth);
      const y = Phaser.Math.Between(0, this.gameHeight);
      const size = Phaser.Math.Between(1, 2);
      const star = this.add.circle(x, y, size, 0xffffff);
      star.setDepth(0);
      star.setAlpha(0.6 + Math.random() * 0.4);
    }
  }

  createShipPreview(x, y, color) {
    const ship = this.add.container(x, y);
    
    // Simplified preview ship
    const body = this.add.polygon(0, 0, [0, -12, 12, 8, 8, 12, -8, 12, -12, 8], color);
    body.setStrokeStyle(2, 0xffffff);
    
    const cockpit = this.add.circle(0, -5, 3, 0xffff00);
    cockpit.setStrokeStyle(1, 0xffaa00);
    
    ship.add([body, cockpit]);
    ship.setDepth(10);
  }

  getHighScores() {
    const stored = localStorage.getItem('cosmicRunnerHighScores');
    if (stored) {
      return JSON.parse(stored).sort((a, b) => b - a).slice(0, 10);
    }
    return [];
  }

  getPlayerCoins() {
    const stored = localStorage.getItem('cosmicRunnerCoins');
    return stored ? parseInt(stored) : 0;
  }

  savePlayerCoins(coins) {
    localStorage.setItem('cosmicRunnerCoins', coins.toString());
  }
}
