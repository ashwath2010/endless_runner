import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    // No preloading needed
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

    // ===== HEADER SECTION =====
    const headerBg = this.add.rectangle(this.gameWidth / 2, 40, this.gameWidth, 80, 0x00ff88);
    headerBg.setAlpha(0.1);
    headerBg.setDepth(5);

    const title = this.add.text(this.gameWidth / 2, 40, 'COSMIC RUNNER', {
      fontSize: '44px',
      fill: '#00ff88',
      fontStyle: 'bold',
      stroke: '#00aa44',
      strokeThickness: 3
    });
    title.setOrigin(0.5);
    title.setDepth(10);

    // Coins display
    const coinsBg = this.add.rectangle(this.gameWidth - 70, 40, 120, 45, 0xffff00);
    coinsBg.setAlpha(0.1);
    coinsBg.setStrokeStyle(2, 0xffff00);
    coinsBg.setDepth(5);

    const coinsText = this.add.text(this.gameWidth - 70, 40, `💰 ${this.playerCoins}`, {
      fontSize: '22px',
      fill: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    coinsText.setOrigin(0.5);
    coinsText.setDepth(10);

    // ===== CONTENT AREA - TWO COLUMNS =====
    const contentY = 130;
    const contentHeight = this.gameHeight - 220;

    // LEFT COLUMN: HIGH SCORES
    const scoresBg = this.add.rectangle(80, contentY + contentHeight / 2, 150, contentHeight, 0xff00ff);
    scoresBg.setAlpha(0.05);
    scoresBg.setStrokeStyle(2, 0xff00ff);
    scoresBg.setDepth(5);

    const scoresTitle = this.add.text(80, contentY + 15, '🏆 HIGH SCORES', {
      fontSize: '16px',
      fill: '#ff00ff',
      fontStyle: 'bold'
    });
    scoresTitle.setOrigin(0.5);
    scoresTitle.setDepth(10);

    let scoreY = contentY + 45;
    if (this.highScores.length === 0) {
      const noScoreText = this.add.text(80, scoreY, 'Play\nto\nearn!', {
        fontSize: '12px',
        fill: '#00ffff',
        align: 'center'
      });
      noScoreText.setOrigin(0.5);
      noScoreText.setDepth(10);
    } else {
      for (let i = 0; i < Math.min(3, this.highScores.length); i++) {
        const scoreText = this.add.text(80, scoreY, `${i + 1}. ${this.highScores[i]}`, {
          fontSize: '11px',
          fill: i === 0 ? '#ffff00' : i === 1 ? '#ff8888' : '#00ffff',
          fontStyle: 'bold'
        });
        scoreText.setOrigin(0.5);
        scoreY += 28;
      }
    }

    // CENTER/RIGHT COLUMN: SHOP
    const shopTitle = this.add.text(this.gameWidth / 2, contentY + 10, '⭐ SPACESHIP SHOP', {
      fontSize: '18px',
      fill: '#00ff88',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    shopTitle.setOrigin(0.5);
    shopTitle.setDepth(10);

    // ===== SPACESHIP DESIGNS (4 CARDS IN 2x2 GRID) =====
    const shipDesigns = [
      { name: 'CLASSIC', cost: 0, index: 0 },
      { name: 'PHANTOM', cost: 500, index: 1 },
      { name: 'INFERNO', cost: 1000, index: 2 },
      { name: 'QUANTUM', cost: 2000, index: 3 }
    ];

    const gridStartX = 280;
    const gridStartY = contentY + 50;
    const cardWidth = 130;
    const cardHeight = 160;
    const spacingX = 145;
    const spacingY = 180;

    for (let i = 0; i < shipDesigns.length; i++) {
      const design = shipDesigns[i];
      const row = Math.floor(i / 2);
      const col = i % 2;
      
      const shipX = gridStartX + col * spacingX;
      const shipY = gridStartY + row * spacingY;
      const isUnlocked = this.unlockedShips[i];

      // Card background
      const cardBg = this.add.rectangle(shipX, shipY, cardWidth, cardHeight, 0x1a1a2e);
      cardBg.setStrokeStyle(2, isUnlocked ? 0x00ff88 : 0xff6666);
      cardBg.setDepth(6);

      // Draw modern spaceship
      this.drawModernSpaceship(shipX, shipY - 35, i, isUnlocked);

      // Ship name
      const nameText = this.add.text(shipX, shipY + 25, design.name, {
        fontSize: '12px',
        fill: isUnlocked ? '#00ff88' : '#ffffff',
        fontStyle: 'bold'
      });
      nameText.setOrigin(0.5);
      nameText.setDepth(10);

      // Purchase section
      if (!isUnlocked) {
        const canAfford = this.playerCoins >= design.cost;
        
        const buyBtn = this.add.rectangle(shipX, shipY + 55, 110, 30, canAfford ? 0x00ff88 : 0xff3333);
        buyBtn.setInteractive({ useHandCursor: true });
        buyBtn.setDepth(9);

        const buyText = this.add.text(shipX, shipY + 55, `${design.cost}`, {
          fontSize: '12px',
          fill: '#000000',
          fontStyle: 'bold'
        });
        buyText.setOrigin(0.5);
        buyText.setDepth(10);

        const menuScene = this;
        const handlePurchase = () => {
          menuScene.purchaseShip(i, design.cost, design.name);
        };

        buyBtn.on('pointerdown', handlePurchase);
        buyBtn.on('pointerover', () => {
          buyBtn.setScale(1.05);
        });
        buyBtn.on('pointerout', () => {
          buyBtn.setScale(1);
        });
      } else {
        const ownedBg = this.add.rectangle(shipX, shipY + 55, 110, 30, 0x00aa00);
        ownedBg.setDepth(9);

        const ownedText = this.add.text(shipX, shipY + 55, '✓ OWNED', {
          fontSize: '11px',
          fill: '#ffffff',
          fontStyle: 'bold'
        });
        ownedText.setOrigin(0.5);
        ownedText.setDepth(10);
      }
    }

    // ===== FOOTER: PLAY BUTTON =====
    const playBtn = this.add.rectangle(this.gameWidth / 2, this.gameHeight - 40, 180, 50, 0x00ff88);
    playBtn.setInteractive({ useHandCursor: true });
    playBtn.setDepth(9);

    const playText = this.add.text(this.gameWidth / 2, this.gameHeight - 40, '▶ PLAY', {
      fontSize: '24px',
      fill: '#000000',
      fontStyle: 'bold'
    });
    playText.setOrigin(0.5);
    playText.setDepth(10);

    const handlePlay = () => {
      this.scene.stop();
      this.scene.start('GameScene');
    };

    playBtn.on('pointerdown', handlePlay);
    playBtn.on('pointerover', () => {
      playBtn.setScale(1.08);
      playBtn.setFillStyle(0x00ffaa);
    });
    playBtn.on('pointerout', () => {
      playBtn.setScale(1);
      playBtn.setFillStyle(0x00ff88);
    });
  }

  drawModernSpaceship(x, y, designIndex, isUnlocked) {
    const graphics = this.make.graphics({ x, y, add: true });
    graphics.setDepth(8);
    graphics.setAlpha(isUnlocked ? 1 : 0.6);

    if (designIndex === 0) {
      // CLASSIC FIGHTER - Cyan
      this.drawClassicFighter(graphics);
    } else if (designIndex === 1) {
      // PHANTOM RACER - Magenta
      this.drawPhantomRacer(graphics);
    } else if (designIndex === 2) {
      // INFERNO BOMBER - Orange
      this.drawInfernoBomber(graphics);
    } else if (designIndex === 3) {
      // QUANTUM SHIP - Green
      this.drawQuantumShip(graphics);
    }
  }

  drawClassicFighter(g) {
    // Main fuselage
    g.fillStyle(0x00d4ff, 1);
    g.beginPath();
    g.moveTo(-15, -18);
    g.lineTo(0, -28);
    g.lineTo(15, -18);
    g.lineTo(18, 12);
    g.lineTo(0, 20);
    g.lineTo(-18, 12);
    g.closePath();
    g.fillPath();

    // Outline
    g.lineStyle(2, 0x00ffff, 1);
    g.strokePath();

    // Wings
    g.fillStyle(0x0099ff, 0.8);
    g.beginPath();
    g.moveTo(-15, -8);
    g.lineTo(-28, -2);
    g.lineTo(-22, 2);
    g.closePath();
    g.fillPath();

    g.beginPath();
    g.moveTo(15, -8);
    g.lineTo(28, -2);
    g.lineTo(22, 2);
    g.closePath();
    g.fillPath();

    // Cockpit with glow
    g.fillStyle(0xffff00, 1);
    g.fillCircle(0, -16, 5);
    g.lineStyle(2, 0xffaa00, 1);
    g.strokeCircle(0, -16, 5);

    // Engines
    g.fillStyle(0xff6600, 1);
    g.fillRect(-7, 15, 3, 8);
    g.fillRect(4, 15, 3, 8);

    g.fillStyle(0xff9933, 0.7);
    g.fillCircle(-5.5, 23, 3.5);
    g.fillCircle(5.5, 23, 3.5);
  }

  drawPhantomRacer(g) {
    // Sleek body
    g.fillStyle(0xff00ff, 1);
    g.beginPath();
    g.moveTo(-12, -20);
    g.lineTo(0, -28);
    g.lineTo(12, -20);
    g.lineTo(16, 8);
    g.lineTo(0, 18);
    g.lineTo(-16, 8);
    g.closePath();
    g.fillPath();

    // Outline
    g.lineStyle(2, 0xff88ff, 1);
    g.strokePath();

    // Central stripe
    g.lineStyle(3, 0xff88ff, 0.8);
    g.lineBetween(0, -28, 0, 18);

    // Side intakes
    g.fillStyle(0x00ffff, 0.9);
    g.fillTriangleShape(new Phaser.Geom.Triangle(-12, -8, -22, 0, -16, 2));
    g.fillTriangleShape(new Phaser.Geom.Triangle(12, -8, 22, 0, 16, 2));

    // Cockpit
    g.fillStyle(0x00ffff, 1);
    g.fillCircle(0, -14, 4);

    // Thruster
    g.fillStyle(0xff6600, 1);
    g.beginPath();
    g.moveTo(-8, 18);
    g.lineTo(8, 18);
    g.lineTo(5, 24);
    g.lineTo(-5, 24);
    g.closePath();
    g.fillPath();
  }

  drawInfernoBomber(g) {
    // Heavy body
    g.fillStyle(0xffaa00, 1);
    g.beginPath();
    g.moveTo(-18, -15);
    g.lineTo(0, -26);
    g.lineTo(18, -15);
    g.lineTo(20, 14);
    g.lineTo(0, 22);
    g.lineTo(-20, 14);
    g.closePath();
    g.fillPath();

    // Outline
    g.lineStyle(2, 0xffdd00, 1);
    g.strokePath();

    // Armor plating
    g.lineStyle(1, 0xffdd00, 0.6);
    g.lineBetween(-12, -8, -12, 12);
    g.lineBetween(12, -8, 12, 12);

    // Cockpit
    g.fillStyle(0xffff00, 1);
    g.fillCircle(0, -12, 5);

    // Weapon pods
    g.fillStyle(0xff3333, 1);
    g.fillRect(-10, 8, 4, 8);
    g.fillRect(6, 8, 4, 8);

    // Triple engines
    g.fillStyle(0xff6600, 1);
    g.fillRect(-7, 17, 3, 7);
    g.fillRect(0, 17, 3, 7);
    g.fillRect(4, 17, 3, 7);

    g.fillStyle(0xff9933, 0.7);
    g.fillCircle(-5.5, 24, 3);
    g.fillCircle(1.5, 24, 3);
    g.fillCircle(5.5, 24, 3);
  }

  drawQuantumShip(g) {
    // Main body
    g.fillStyle(0x00ff88, 1);
    g.beginPath();
    g.moveTo(-14, -18);
    g.lineTo(0, -26);
    g.lineTo(14, -18);
    g.lineTo(17, 10);
    g.lineTo(0, 20);
    g.lineTo(-17, 10);
    g.closePath();
    g.fillPath();

    // Outline
    g.lineStyle(2, 0x00ffaa, 1);
    g.strokePath();

    // Energy rings
    g.lineStyle(2, 0x00ffaa, 0.6);
    g.strokeCircle(0, 0, 18);
    g.strokeCircle(0, 0, 12);

    // Quantum core
    g.fillStyle(0x00ffff, 1);
    g.fillCircle(0, -12, 4);
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeCircle(0, -12, 4);

    // Cockpit
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(0, -12, 2);

    // Main engine with quantum effect
    g.fillStyle(0x00ff88, 1);
    g.beginPath();
    g.moveTo(-7, 18);
    g.lineTo(7, 18);
    g.lineTo(5, 24);
    g.lineTo(-5, 24);
    g.closePath();
    g.fillPath();

    g.fillStyle(0x00ffaa, 0.8);
    g.fillCircle(0, 24, 2);
  }

  purchaseShip(shipIndex, cost, shipName) {
    if (this.playerCoins >= cost) {
      this.playerCoins -= cost;
      this.unlockedShips[shipIndex] = true;

      localStorage.setItem('cosmicRunnerCoins', this.playerCoins.toString());
      localStorage.setItem('cosmicRunnerUnlockedShips', JSON.stringify(this.unlockedShips));

      // Success message
      const msg = this.add.text(this.gameWidth / 2, 100, `✓ ${shipName} Unlocked!`, {
        fontSize: '28px',
        fill: '#00ff88',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      });
      msg.setOrigin(0.5);
      msg.setDepth(30);
      msg.setAlpha(0);

      this.tweens.add({
        targets: msg,
        alpha: 1,
        duration: 200,
        ease: 'Linear'
      });

      this.time.delayedCall(800, () => {
        this.scene.restart();
      });
    } else {
      const msg = this.add.text(this.gameWidth / 2, 100, '✗ Not Enough Coins!', {
        fontSize: '28px',
        fill: '#ff3333',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      });
      msg.setOrigin(0.5);
      msg.setDepth(30);
      msg.setAlpha(0);

      this.tweens.add({
        targets: msg,
        alpha: 1,
        duration: 200,
        ease: 'Linear',
        onComplete: () => {
          this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 200,
            delay: 1500,
            ease: 'Linear',
            onComplete: () => msg.destroy()
          });
        }
      });
    }
  }

  createStarfield() {
    for (let i = 0; i < 80; i++) {
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
