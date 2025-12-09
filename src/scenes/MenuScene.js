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

    // Initialize starting coins for first-time players
    this.initializeStartingCoins();

    // Load game data
    this.highScores = this.getHighScores();
    this.playerCoins = this.getPlayerCoins();
    this.playerShields = this.getPlayerShields();
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
    const coinsBg = this.add.rectangle(100, 40, 100, 45, 0xffff00);
    coinsBg.setAlpha(0.1);
    coinsBg.setStrokeStyle(2, 0xffff00);
    coinsBg.setDepth(5);

    const coinsText = this.add.text(100, 40, `💰 ${this.playerCoins}`, {
      fontSize: '18px',
      fill: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    coinsText.setOrigin(0.5);
    coinsText.setDepth(10);

    // Shields display
    const shieldsBg = this.add.rectangle(this.gameWidth - 100, 40, 100, 45, 0x00ff88);
    shieldsBg.setAlpha(0.1);
    shieldsBg.setStrokeStyle(2, 0x00ff88);
    shieldsBg.setDepth(5);

    const shieldsText = this.add.text(this.gameWidth - 100, 40, `🛡️ ${this.playerShields}`, {
      fontSize: '18px',
      fill: '#00ff88',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    shieldsText.setOrigin(0.5);
    shieldsText.setDepth(10);

    // ===== CONTENT AREA =====
    const contentY = 130;

    // HIGH SCORES (Left column)
    const scoresBg = this.add.rectangle(80, contentY + 120, 150, 200, 0xff00ff);
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

    let scoreY = contentY + 50;
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
        scoreY += 30;
      }
    }

    // ===== SHOP SECTION (Center) - COLLAPSIBLE =====
    let shopExpanded = false;
    const shopItems = [];

    const shopBtnBg = this.add.rectangle(this.gameWidth / 2, contentY + 20, 200, 50, 0x00ff88);
    shopBtnBg.setInteractive({ useHandCursor: true });
    shopBtnBg.setDepth(9);

    const shopBtnText = this.add.text(this.gameWidth / 2, contentY + 20, '⭐ SHOP ⭐', {
      fontSize: '20px',
      fill: '#000000',
      fontStyle: 'bold'
    });
    shopBtnText.setOrigin(0.5);
    shopBtnText.setDepth(10);
    shopBtnText.setInteractive({ useHandCursor: true });

    const toggleShop = () => {
      shopExpanded = !shopExpanded;
      shopItems.forEach(item => {
        item.setVisible(shopExpanded);
      });
      shopBtnBg.setFillStyle(shopExpanded ? 0x00ffaa : 0x00ff88);
    };

    shopBtnBg.on('pointerdown', toggleShop);
    shopBtnText.on('pointerdown', toggleShop);

    shopBtnBg.on('pointerover', () => {
      shopBtnBg.setScale(1.05);
    });
    shopBtnBg.on('pointerout', () => {
      shopBtnBg.setScale(1);
    });

    // SPACESHIP DESIGNS (hidden by default)
    const shipDesigns = [
      { name: 'CLASSIC', cost: 0, index: 0 },
      { name: 'PHANTOM', cost: 500, index: 1 },
      { name: 'INFERNO', cost: 1000, index: 2 },
      { name: 'QUANTUM', cost: 2000, index: 3 }
    ];

    const shipGridStartX = this.gameWidth / 2;
    const shipGridStartY = contentY + 90;
    const shipCardWidth = 100;
    const shipCardHeight = 170;
    const shipSpacingX = 130;
    const totalWidth = (shipSpacingX * 4) - 30;

    for (let i = 0; i < shipDesigns.length; i++) {
      const design = shipDesigns[i];
      const shipX = shipGridStartX - totalWidth / 2 + shipSpacingX * 0.5 + i * shipSpacingX;
      const shipY = shipGridStartY;
      const isUnlocked = this.unlockedShips[i];

      // Card background
      const cardBg = this.add.rectangle(shipX, shipY, shipCardWidth, shipCardHeight, 0x1a1a2e);
      cardBg.setStrokeStyle(2, isUnlocked ? 0x00ff88 : 0xff6666);
      cardBg.setDepth(6);
      cardBg.setVisible(false);

      // Draw modern spaceship
      this.drawModernSpaceship(shipX, shipY - 30, i, isUnlocked, cardBg.setVisible(false));
      const shipGraphic = this.add.graphics();
      shipGraphic.setVisible(false);

      // Ship name
      const nameText = this.add.text(shipX, shipY + 18, design.name, {
        fontSize: '10px',
        fill: isUnlocked ? '#00ff88' : '#ffffff',
        fontStyle: 'bold'
      });
      nameText.setOrigin(0.5);
      nameText.setDepth(10);
      nameText.setVisible(false);

      // Purchase section
      if (!isUnlocked) {
        const canAfford = this.playerCoins >= design.cost;
        
        const buyBtn = this.add.rectangle(shipX, shipY + 48, 90, 25, canAfford ? 0x00ff88 : 0xff3333);
        buyBtn.setInteractive({ useHandCursor: true });
        buyBtn.setDepth(9);
        buyBtn.setVisible(false);

        const buyText = this.add.text(shipX, shipY + 48, `${design.cost}`, {
          fontSize: '10px',
          fill: '#000000',
          fontStyle: 'bold'
        });
        buyText.setOrigin(0.5);
        buyText.setDepth(10);
        buyText.setVisible(false);

        const menuScene = this;
        const handlePurchase = () => {
          menuScene.purchaseShip(i, design.cost, design.name);
        };

        buyBtn.on('pointerdown', handlePurchase);
        buyBtn.on('pointerover', () => buyBtn.setScale(1.05));
        buyBtn.on('pointerout', () => buyBtn.setScale(1));

        shopItems.push(cardBg, nameText, buyBtn, buyText);
      } else {
        const ownedBg = this.add.rectangle(shipX, shipY + 48, 90, 25, 0x00aa00);
        ownedBg.setInteractive({ useHandCursor: true });
        ownedBg.setDepth(9);
        ownedBg.setVisible(false);

        const ownedText = this.add.text(shipX, shipY + 48, '✓ SELECT', {
          fontSize: '9px',
          fill: '#ffffff',
          fontStyle: 'bold'
        });
        ownedText.setOrigin(0.5);
        ownedText.setDepth(10);
        ownedText.setVisible(false);

        const menuScene = this;
        const handleSelect = () => {
          menuScene.selectShip(i, design.name);
        };

        ownedBg.on('pointerdown', handleSelect);
        ownedBg.on('pointerover', () => ownedBg.setScale(1.05));
        ownedBg.on('pointerout', () => ownedBg.setScale(1));

        shopItems.push(cardBg, nameText, ownedBg, ownedText);
      }
    }

    // SHIELDS (hidden by default)
    const shieldCost = 100;
    const shieldX = this.gameWidth / 2;
    const shieldY = contentY + 330;

    const shieldCardBg = this.add.rectangle(shieldX, shieldY, 110, 140, 0x1a1a2e);
    shieldCardBg.setStrokeStyle(2, 0x00ff88);
    shieldCardBg.setDepth(6);
    shieldCardBg.setVisible(false);

    // Draw shield graphic
    this.drawShieldGraphic(shieldX, shieldY - 30, shieldCardBg.setVisible(false));

    const shieldNameText = this.add.text(shieldX, shieldY + 18, 'SHIELD', {
      fontSize: '10px',
      fill: '#00ff88',
      fontStyle: 'bold'
    });
    shieldNameText.setOrigin(0.5);
    shieldNameText.setDepth(10);
    shieldNameText.setVisible(false);

    const canAffordShield = this.playerCoins >= shieldCost;
    const buyShieldBtn = this.add.rectangle(shieldX, shieldY + 48, 90, 25, canAffordShield ? 0x00ff88 : 0xff3333);
    buyShieldBtn.setInteractive({ useHandCursor: true });
    buyShieldBtn.setDepth(9);
    buyShieldBtn.setVisible(false);

    const buyShieldText = this.add.text(shieldX, shieldY + 48, `${shieldCost}`, {
      fontSize: '10px',
      fill: '#000000',
      fontStyle: 'bold'
    });
    buyShieldText.setOrigin(0.5);
    buyShieldText.setDepth(10);
    buyShieldText.setVisible(false);

    const handleShieldPurchase = () => {
      this.purchaseShield(shieldCost);
    };

    buyShieldBtn.on('pointerdown', handleShieldPurchase);
    buyShieldBtn.on('pointerover', () => buyShieldBtn.setScale(1.05));
    buyShieldBtn.on('pointerout', () => buyShieldBtn.setScale(1));

    shopItems.push(shieldCardBg, shieldNameText, buyShieldBtn, buyShieldText);

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

  drawModernSpaceship(x, y, designIndex, isUnlocked, visibility) {
    const graphics = this.make.graphics({ x, y, add: true });
    graphics.setDepth(8);
    graphics.setAlpha(isUnlocked ? 1 : 0.6);
    graphics.setScale(0.7);

    if (designIndex === 0) {
      this.drawClassicFighterShop(graphics);
    } else if (designIndex === 1) {
      this.drawPhantomRacerShop(graphics);
    } else if (designIndex === 2) {
      this.drawInfernoBomberShop(graphics);
    } else if (designIndex === 3) {
      this.drawQuantumShipShop(graphics);
    }
  }

  drawClassicFighterShop(g) {
    g.fillStyle(0x00d4ff, 1);
    g.beginPath();
    g.moveTo(-15, -12);
    g.lineTo(0, -20);
    g.lineTo(15, -12);
    g.lineTo(18, 8);
    g.lineTo(0, 14);
    g.lineTo(-18, 8);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0x00ffff, 1);
    g.strokePath();

    g.fillStyle(0xffff00, 1);
    g.fillCircle(0, -14, 4);
    g.fillStyle(0xff6600, 1);
    g.fillRect(-5, 10, 2, 6);
    g.fillRect(3, 10, 2, 6);
  }

  drawPhantomRacerShop(g) {
    g.fillStyle(0xff00ff, 1);
    g.beginPath();
    g.moveTo(-12, -14);
    g.lineTo(0, -20);
    g.lineTo(12, -14);
    g.lineTo(16, 6);
    g.lineTo(0, 12);
    g.lineTo(-16, 6);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0xff88ff, 1);
    g.strokePath();

    g.fillStyle(0x00ffff, 1);
    g.fillCircle(0, -12, 3);
    g.fillStyle(0xff6600, 1);
    g.beginPath();
    g.moveTo(-6, 12);
    g.lineTo(6, 12);
    g.lineTo(3, 16);
    g.lineTo(-3, 16);
    g.closePath();
    g.fillPath();
  }

  drawInfernoBomberShop(g) {
    g.fillStyle(0xffaa00, 1);
    g.beginPath();
    g.moveTo(-14, -12);
    g.lineTo(0, -20);
    g.lineTo(14, -12);
    g.lineTo(16, 8);
    g.lineTo(0, 14);
    g.lineTo(-16, 8);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0xffdd00, 1);
    g.strokePath();

    g.fillStyle(0xffff00, 1);
    g.fillCircle(0, -12, 4);
    g.fillStyle(0xff3333, 1);
    g.fillRect(-8, 4, 3, 6);
    g.fillRect(5, 4, 3, 6);
    g.fillStyle(0xff6600, 1);
    g.fillRect(-5, 10, 2, 5);
    g.fillRect(0, 10, 2, 5);
    g.fillRect(3, 10, 2, 5);
  }

  drawQuantumShipShop(g) {
    g.fillStyle(0x00ff88, 1);
    g.beginPath();
    g.moveTo(-12, -14);
    g.lineTo(0, -20);
    g.lineTo(12, -14);
    g.lineTo(14, 6);
    g.lineTo(0, 12);
    g.lineTo(-14, 6);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0x00ffaa, 1);
    g.strokePath();

    g.lineStyle(1, 0x00ffaa, 0.4);
    g.strokeCircle(0, 0, 14);
    g.fillStyle(0x00ffff, 1);
    g.fillCircle(0, -10, 3);
    g.fillStyle(0xff6600, 1);
    g.beginPath();
    g.moveTo(-5, 12);
    g.lineTo(5, 12);
    g.lineTo(3, 16);
    g.lineTo(-3, 16);
    g.closePath();
    g.fillPath();
  }

  drawShieldGraphic(x, y, visibility) {
    const graphics = this.make.graphics({ x, y, add: true });
    graphics.setDepth(8);
    graphics.setScale(0.7);

    // Shield rings
    graphics.lineStyle(3, 0x00ff88, 1);
    graphics.strokeCircle(0, 0, 18);
    graphics.lineStyle(2, 0x00ff88, 0.7);
    graphics.strokeCircle(0, 0, 12);
    graphics.lineStyle(1, 0x00ff88, 0.4);
    graphics.strokeCircle(0, 0, 6);

    // Center glow
    graphics.fillStyle(0x00ffff, 0.6);
    graphics.fillCircle(0, 0, 4);
  }

  purchaseShip(shipIndex, cost, shipName) {
    if (this.playerCoins >= cost) {
      this.playerCoins -= cost;
      this.unlockedShips[shipIndex] = true;

      localStorage.setItem('cosmicRunnerCoins', this.playerCoins.toString());
      localStorage.setItem('cosmicRunnerUnlockedShips', JSON.stringify(this.unlockedShips));

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
        duration: 200
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
        onComplete: () => {
          this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 200,
            delay: 1500,
            onComplete: () => msg.destroy()
          });
        }
      });
    }
  }

  purchaseShield(cost) {
    if (this.playerCoins >= cost) {
      this.playerCoins -= cost;
      this.playerShields += 1;

      localStorage.setItem('cosmicRunnerCoins', this.playerCoins.toString());
      localStorage.setItem('cosmicRunnerPlayerShields', this.playerShields.toString());

      const msg = this.add.text(this.gameWidth / 2, 100, `✓ Shield Purchased!`, {
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
        duration: 200
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
        onComplete: () => {
          this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 200,
            delay: 1500,
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

  getPlayerShields() {
    const stored = localStorage.getItem('cosmicRunnerPlayerShields');
    return stored ? parseInt(stored) : 0;
  }

  initializeStartingCoins() {
    const hasVisitedBefore = localStorage.getItem('cosmicRunnerVisited') === 'true';
    if (!hasVisitedBefore) {
      // First time player - give 500 starting coins
      localStorage.setItem('cosmicRunnerCoins', '500');
      localStorage.setItem('cosmicRunnerVisited', 'true');
    }
  }

  selectShip(shipIndex, shipName) {
    localStorage.setItem('cosmicRunnerSelectedShip', shipIndex.toString());
    
    const msg = this.add.text(this.gameWidth / 2, 100, `✓ ${shipName} Selected!`, {
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
      duration: 200
    });

    this.time.delayedCall(800, () => {
      this.scene.restart();
    });
  }
}
