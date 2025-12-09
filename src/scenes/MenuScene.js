import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    // No need to preload - PNG files are loaded as sprites dynamically
  }

  create() {
    this.gameWidth = this.cameras.main.width;
    this.gameHeight = this.cameras.main.height;

    // Background
    this.cameras.main.setBackgroundColor('#0a0e27');
    this.createStarfield();

    // Load game data
    this.highScores = this.getHighScores();
    this.playerCoins = this.getPlayerCoins();
    this.unlockedShips = JSON.parse(localStorage.getItem('cosmicRunnerUnlockedShips')) || [true, false, false, false];

    // Main title with glow effect
    const titleBg = this.add.rectangle(this.gameWidth / 2, 50, 400, 80, 0x00ff88);
    titleBg.setAlpha(0.1);
    titleBg.setDepth(5);

    const title = this.add.text(this.gameWidth / 2, 50, 'COSMIC RUNNER', {
      fontSize: '56px',
      fill: '#00ff88',
      fontStyle: 'bold',
      stroke: '#00aa44',
      strokeThickness: 4
    });
    title.setOrigin(0.5);
    title.setDepth(10);

    // Coins display with styled background
    const coinsBg = this.add.rectangle(this.gameWidth - 80, 30, 140, 50, 0xffff00);
    coinsBg.setAlpha(0.1);
    coinsBg.setStrokeStyle(2, 0xffff00);
    coinsBg.setDepth(5);

    const coinsText = this.add.text(this.gameWidth - 80, 30, `💰 ${this.playerCoins}`, {
      fontSize: '26px',
      fill: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    coinsText.setOrigin(0.5);
    coinsText.setDepth(10);

    // High Scores Section with styled container
    const scoresContainer = this.add.rectangle(50, 160, 200, 200, 0xff00ff);
    scoresContainer.setAlpha(0.05);
    scoresContainer.setStrokeStyle(2, 0xff00ff);
    scoresContainer.setDepth(5);

    const scoresTitle = this.add.text(50, 90, 'HIGH SCORES', {
      fontSize: '22px',
      fill: '#ff00ff',
      fontStyle: 'bold'
    });
    scoresTitle.setOrigin(0.5);
    scoresTitle.setDepth(10);

    let scoreY = 125;
    if (this.highScores.length === 0) {
      const noScoreText = this.add.text(50, scoreY, 'No scores yet\nPlay to earn!', {
        fontSize: '14px',
        fill: '#00ffff',
        align: 'center'
      });
      noScoreText.setOrigin(0.5);
      noScoreText.setDepth(10);
    } else {
      for (let i = 0; i < Math.min(3, this.highScores.length); i++) {
        const scoreText = this.add.text(50, scoreY, `${i + 1}. ${this.highScores[i]}`, {
          fontSize: '16px',
          fill: i === 0 ? '#ffff00' : i === 1 ? '#ff8888' : '#00ffff',
          fontStyle: 'bold'
        });
        scoreText.setOrigin(0.5);
        scoreY += 40;
      }
    }

    // Shop Section Title with better styling
    const shopBg = this.add.rectangle(this.gameWidth / 2, 260, this.gameWidth - 40, 50, 0x00ff88);
    shopBg.setAlpha(0.08);
    shopBg.setStrokeStyle(2, 0x00ff88);
    shopBg.setDepth(5);

    const shopTitle = this.add.text(this.gameWidth / 2, 260, '⭐ SPACESHIP SHOP ⭐', {
      fontSize: '26px',
      fill: '#00ff88',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    shopTitle.setOrigin(0.5);
    shopTitle.setDepth(10);

    // Spaceship designs with generated graphics
    const shipDesigns = [
      { name: 'Classic', cost: 0, index: 0, colors: { primary: 0x00d4ff, secondary: 0x00ffff } },
      { name: 'Phantom', cost: 500, index: 1, colors: { primary: 0xff00ff, secondary: 0xff88ff } },
      { name: 'Inferno', cost: 1000, index: 2, colors: { primary: 0xffaa00, secondary: 0xffdd00 } },
      { name: 'Quantum', cost: 2000, index: 3, colors: { primary: 0x00ff88, secondary: 0x00ffaa } }
    ];

    const startX = 120;
    const shipY = 420;
    const spacing = 220;

    for (let i = 0; i < shipDesigns.length; i++) {
      const design = shipDesigns[i];
      const shipX = startX + i * spacing;
      const isUnlocked = this.unlockedShips[i];

      // Ship card background
      const cardBg = this.add.rectangle(shipX, shipY - 20, 180, 240, 0x1a1a2e);
      cardBg.setStrokeStyle(2, isUnlocked ? 0x00ff88 : 0xff0000);
      cardBg.setDepth(6);

      // Draw advanced spaceship graphic
      this.drawAdvancedShip(shipX, shipY - 60, design.colors.primary, design.colors.secondary, isUnlocked);

      // Ship name
      const nameText = this.add.text(shipX, shipY + 20, design.name, {
        fontSize: '18px',
        fill: isUnlocked ? '#00ff88' : '#ffffff',
        fontStyle: 'bold'
      });
      nameText.setOrigin(0.5);
      nameText.setDepth(10);

      // Purchase button or status
      if (!isUnlocked) {
        // Cost display
        const costBg = this.add.rectangle(shipX, shipY + 65, 140, 40, 0xff8800);
        costBg.setInteractive({ useHandCursor: true });
        costBg.setDepth(9);

        const canAfford = this.playerCoins >= design.cost;
        costBg.setFillStyle(canAfford ? 0x00ff88 : 0xff3333, 0.8);

        const costText = this.add.text(shipX, shipY + 65, `Buy: ${design.cost}`, {
          fontSize: '14px',
          fill: '#000000',
          fontStyle: 'bold'
        });
        costText.setOrigin(0.5);
        costText.setDepth(10);
        costText.setInteractive({ useHandCursor: true });

        // Store reference for callback
        const menuScene = this;

        // Click handlers - using proper binding
        const handlePurchase = () => {
          menuScene.purchaseShip(i, design.cost, design.name);
        };

        costBg.on('pointerdown', handlePurchase);
        costText.on('pointerdown', handlePurchase);

        costBg.on('pointerover', () => {
          costBg.setScale(1.05);
        });
        costBg.on('pointerout', () => {
          costBg.setScale(1);
        });
      } else {
        const ownedBg = this.add.rectangle(shipX, shipY + 65, 140, 40, 0x00aa00);
        ownedBg.setDepth(9);

        const ownedText = this.add.text(shipX, shipY + 65, '✓ OWNED', {
          fontSize: '14px',
          fill: '#ffffff',
          fontStyle: 'bold'
        });
        ownedText.setOrigin(0.5);
        ownedText.setDepth(10);
      }
    }

    // Play Button with enhanced styling
    const playButtonBg = this.add.rectangle(this.gameWidth / 2, this.gameHeight - 80, 220, 70, 0x00ff88);
    playButtonBg.setInteractive({ useHandCursor: true });
    playButtonBg.setDepth(9);

    const playText = this.add.text(this.gameWidth / 2, this.gameHeight - 80, '▶ PLAY GAME', {
      fontSize: '28px',
      fill: '#000000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1
    });
    playText.setOrigin(0.5);
    playText.setDepth(10);
    playText.setInteractive({ useHandCursor: true });

    // Play button interactions
    const handlePlay = () => {
      this.scene.stop();
      this.scene.start('GameScene');
    };

    playButtonBg.on('pointerdown', handlePlay);
    playText.on('pointerdown', handlePlay);

    playButtonBg.on('pointerover', () => {
      playButtonBg.setScale(1.08);
      playButtonBg.setFillStyle(0x00ffaa);
    });
    playButtonBg.on('pointerout', () => {
      playButtonBg.setScale(1);
      playButtonBg.setFillStyle(0x00ff88);
    });
  }

  drawAdvancedShip(x, y, primaryColor, secondaryColor, isUnlocked) {
    const container = this.add.container(x, y);
    container.setDepth(8);
    container.setAlpha(isUnlocked ? 1 : 0.6);

    // Draw advanced spaceship
    const graphics = this.make.graphics({ x, y, add: false });

    // Main body
    graphics.fillStyle(primaryColor, 1);
    graphics.beginPath();
    graphics.moveTo(-20, -15);
    graphics.lineTo(0, -30);
    graphics.lineTo(20, -15);
    graphics.lineTo(25, 15);
    graphics.lineTo(0, 25);
    graphics.lineTo(-25, 15);
    graphics.closePath();
    graphics.fillPath();

    // Body outline
    graphics.lineStyle(2, secondaryColor, 1);
    graphics.beginPath();
    graphics.moveTo(-20, -15);
    graphics.lineTo(0, -30);
    graphics.lineTo(20, -15);
    graphics.lineTo(25, 15);
    graphics.lineTo(0, 25);
    graphics.lineTo(-25, 15);
    graphics.closePath();
    graphics.strokePath();

    // Cockpit
    graphics.fillStyle(0xffff00, 0.9);
    graphics.beginPath();
    graphics.arc(0, -18, 6, 0, Math.PI * 2);
    graphics.closePath();
    graphics.fillPath();

    graphics.lineStyle(2, 0xffaa00, 1);
    graphics.strokeCircleShape(new Phaser.Geom.Circle(0, -18, 6));

    // Engines
    graphics.fillStyle(0xff6600, 1);
    graphics.fillRect(-8, 18, 4, 10);
    graphics.fillRect(4, 18, 4, 10);

    graphics.fillStyle(0xff9933, 0.7);
    graphics.fillRect(-10, 26, 8, 4);
    graphics.fillRect(2, 26, 8, 4);

    graphics.add(graphics);
  }

  purchaseShip(shipIndex, cost, shipName) {
    if (this.playerCoins >= cost) {
      this.playerCoins -= cost;
      this.unlockedShips[shipIndex] = true;

      localStorage.setItem('cosmicRunnerCoins', this.playerCoins.toString());
      localStorage.setItem('cosmicRunnerUnlockedShips', JSON.stringify(this.unlockedShips));

      // Show success message
      const successMsg = this.add.text(this.gameWidth / 2, 150, `✓ ${shipName} Unlocked!`, {
        fontSize: '32px',
        fill: '#00ff88',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2
      });
      successMsg.setOrigin(0.5);
      successMsg.setDepth(30);
      successMsg.setAlpha(0);

      this.tweens.add({
        targets: successMsg,
        alpha: 1,
        duration: 300,
        ease: 'Linear'
      });

      // Restart scene to refresh UI
      this.time.delayedCall(800, () => {
        this.scene.restart();
      });
    } else {
      // Show not enough coins message
      const errorMsg = this.add.text(this.gameWidth / 2, 150, '✗ Not Enough Coins!', {
        fontSize: '32px',
        fill: '#ff3333',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2
      });
      errorMsg.setOrigin(0.5);
      errorMsg.setDepth(30);
      errorMsg.setAlpha(0);

      this.tweens.add({
        targets: errorMsg,
        alpha: 1,
        duration: 300,
        ease: 'Linear',
        onComplete: () => {
          this.tweens.add({
            targets: errorMsg,
            alpha: 0,
            duration: 300,
            delay: 1500,
            ease: 'Linear',
            onComplete: () => errorMsg.destroy()
          });
        }
      });
    }
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

  getHighScores() {
    const stored = localStorage.getItem('cosmicRunnerHighScores');
    if (stored) {
      return JSON.parse(stored).sort((a, b) => b - a).slice(0, 3);
    }
    return [];
  }

  getPlayerCoins() {
    const stored = localStorage.getItem('cosmicRunnerCoins');
    return stored ? parseInt(stored) : 0;
  }
}
