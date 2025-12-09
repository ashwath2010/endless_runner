import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Preload assets if needed
  }

  create() {
    // Game variables
    this.gameWidth = this.cameras.main.width;
    this.gameHeight = this.cameras.main.height;
    
    // Set background
    this.cameras.main.setBackgroundColor('#0a0e27');
    this.createStarfield();
    
    this.score = 0;
    this.gameActive = true;
    this.difficultyMultiplier = 1;
    
    // Initialize starting coins
    this.initializeStartingCoins();
    
    // Get unlocked ships
    this.unlockedShips = this.getUnlockedShips();
    this.currentShipDesign = 0;
    
    // Player setup
    this.playerSize = 40;
    this.playerLane = 1;
    this.player = this.createAdvancedSpaceship(this.getLaneX(1), this.gameHeight - 100, this.currentShipDesign);
    this.player.setDepth(10);
    
    // Powerup system
    this.powerups = {
      shield: false,
      shieldDuration: 0,
      guns: false,
      gunsDuration: 0,
      gunCooldown: 0
    };
    this.bullets = [];
    
    // Obstacles
    this.obstacles = [];
    this.obstacleSpeed = 300;
    this.spawnRate = 1500;
    this.spawnTimer = 0;
    
    // Enemies
    this.enemies = [];
    this.enemySpawnRate = 8000;
    this.enemySpawnTimer = 0;
    
    // Collectibles
    this.collectibles = [];
    this.collectibleSpawnRate = 4000;
    this.collectibleSpawnTimer = 0;
    
    // Powerups
    this.powerupItems = [];
    this.powerupSpawnRate = 6000;
    this.powerupSpawnTimer = 0;
    
    // Input handling
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-UP', () => this.moveUp());
    this.input.keyboard.on('keydown-DOWN', () => this.moveDown());
    this.input.keyboard.on('keydown-LEFT', () => this.moveLeft());
    this.input.keyboard.on('keydown-RIGHT', () => this.moveRight());
    
    // Double-click/tap to use shield
    let lastSpaceTime = 0;
    let lastTapTime = 0;
    
    this.input.keyboard.on('keydown-SPACE', () => {
      const now = this.time.now;
      if (now - lastSpaceTime < 300) {
        this.activateStoredShield();
      }
      lastSpaceTime = now;
    });
    
    // Touch input
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchCount = 0;
    
    this.input.on('pointerdown', (pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
      
      // Detect double tap for shield
      const now = this.time.now;
      if (now - lastTapTime < 300) {
        this.activateStoredShield();
      }
      lastTapTime = now;
    });
    
    this.input.on('pointerup', (pointer) => {
      const deltaX = pointer.x - this.touchStartX;
      const deltaY = pointer.y - this.touchStartY;
      const minSwipeDist = 30;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > minSwipeDist) this.moveRight();
        else if (deltaX < -minSwipeDist) this.moveLeft();
      } else {
        if (deltaY > minSwipeDist) this.moveDown();
        else if (deltaY < -minSwipeDist) this.moveUp();
      }
    });
    
    // Stored shields
    this.storedShields = this.getPlayerShields();
    
    // UI
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '32px',
      fill: '#00ff88',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.scoreText.setDepth(20);
    
    this.shieldsText = this.add.text(20, 55, `Shields: ${this.storedShields}`, {
      fontSize: '16px',
      fill: '#00ff88',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.shieldsText.setDepth(20);
    
    this.powerupText = this.add.text(20, 80, '', {
      fontSize: '16px',
      fill: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.powerupText.setDepth(20);
    
    this.shieldGraphic = this.make.graphics({ x: 0, y: 0, add: true });
    this.shieldGraphic.setDepth(9);
    this.shieldGraphic.setVisible(false);
    
    this.gameOverText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 80, '', {
      fontSize: '64px',
      fill: '#ff0000',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setDepth(30);
    this.gameOverText.setVisible(false);
    
    this.restartText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 30, '', {
      fontSize: '24px',
      fill: '#ffff00',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.restartText.setOrigin(0.5);
    this.restartText.setDepth(30);
    this.restartText.setVisible(false);
  }

  update(time, delta) {
    if (!this.gameActive) return;

    this.updatePowerups(delta);
    this.updateShieldVisual();
    
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnRate) {
      this.spawnObstacle();
      this.spawnTimer = 0;
      if (this.score % 500 === 0 && this.score > 0) {
        this.obstacleSpeed = Math.min(this.obstacleSpeed + 30, 600);
        this.spawnRate = Math.max(this.spawnRate - 50, 800);
      }
    }
    
    this.enemySpawnTimer += delta;
    if (this.enemySpawnTimer >= this.enemySpawnRate) {
      if (Phaser.Math.Between(0, 100) > 40) {
        this.spawnEnemySpaceship();
      }
      this.enemySpawnTimer = 0;
    }
    
    this.collectibleSpawnTimer += delta;
    if (this.collectibleSpawnTimer >= this.collectibleSpawnRate) {
      this.spawnCollectible();
      this.collectibleSpawnTimer = 0;
    }
    
    this.powerupSpawnTimer += delta;
    if (this.powerupSpawnTimer >= this.powerupSpawnRate) {
      this.spawnPowerup();
      this.powerupSpawnTimer = 0;
    }
    
    if (this.powerups.guns) {
      this.powerups.gunCooldown -= delta;
      if (this.powerups.gunCooldown <= 0) {
        this.fireGun();
        this.powerups.gunCooldown = 200;
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.y -= 400 * delta / 1000;
      if (bullet.y < 0) {
        bullet.destroy();
        this.bullets.splice(i, 1);
      }
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.y += (this.obstacleSpeed * this.difficultyMultiplier) * delta / 1000;

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j];
        if (this.checkCollision(bullet, obstacle, 20)) {
          this.destroyWithEffect(obstacle);
          this.obstacles.splice(i, 1);
          bullet.destroy();
          this.bullets.splice(j, 1);
          this.score += 15;
          this.scoreText.setText('Score: ' + this.score);
          break;
        }
      }

      if (this.checkCollision(this.player, obstacle, 30)) {
        if (this.powerups.shield) {
          this.destroyWithEffect(obstacle);
          this.obstacles.splice(i, 1);
          this.powerups.shield = false;
        } else {
          this.endGame();
          return;
        }
      }

      if (obstacle.y > this.gameHeight) {
        obstacle.destroy();
        this.obstacles.splice(i, 1);
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
      }
    }
    
    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += (this.obstacleSpeed * this.difficultyMultiplier) * delta / 1000;
      
      if (Phaser.Math.Between(0, 100) > 94) {
        this.enemyShoot(enemy);
      }

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j];
        if (this.checkCollision(bullet, enemy, 25)) {
          this.destroyWithEffect(enemy);
          this.enemies.splice(i, 1);
          bullet.destroy();
          this.bullets.splice(j, 1);
          this.score += 100;
          this.scoreText.setText('Score: ' + this.score);
          this.showPowerupMessage('ENEMY DESTROYED!', '#ff00ff');
          break;
        }
      }

      if (this.checkCollision(this.player, enemy, 35)) {
        if (this.powerups.shield) {
          this.destroyWithEffect(enemy);
          this.enemies.splice(i, 1);
          this.powerups.shield = false;
        } else {
          this.endGame();
          return;
        }
      }

      if (enemy.y > this.gameHeight) {
        enemy.destroy();
        this.enemies.splice(i, 1);
        this.score += 50;
        this.scoreText.setText('Score: ' + this.score);
      }
    }
    
    // Update collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.collectibles[i];
      collectible.y += (this.obstacleSpeed * this.difficultyMultiplier) * delta / 1000;
      collectible.rotation += 0.05;

      if (this.checkCollision(this.player, collectible, 20)) {
        this.score += 50;
        this.scoreText.setText('Score: ' + this.score);
        collectible.destroy();
        this.collectibles.splice(i, 1);
      }

      if (collectible.y > this.gameHeight) {
        collectible.destroy();
        this.collectibles.splice(i, 1);
      }
    }
    
    // Update powerups
    for (let i = this.powerupItems.length - 1; i >= 0; i--) {
      const powerupItem = this.powerupItems[i];
      powerupItem.y += (this.obstacleSpeed * this.difficultyMultiplier) * delta / 1000;
      powerupItem.scale = 1 + Math.sin(time / 200) * 0.2;

      if (this.checkCollision(this.player, powerupItem, 25)) {
        this.activatePowerup(powerupItem.powerupType);
        powerupItem.destroy();
        this.powerupItems.splice(i, 1);
      }

      if (powerupItem.y > this.gameHeight) {
        powerupItem.destroy();
        this.powerupItems.splice(i, 1);
      }
    }
  }

  moveLeft() {
    if (this.playerLane > 0) {
      this.playerLane--;
      this.updatePlayerPosition();
    }
  }

  moveRight() {
    if (this.playerLane < 2) {
      this.playerLane++;
      this.updatePlayerPosition();
    }
  }

  moveUp() {
    if (this.player.y > 100) {
      this.player.y -= 40;
      this.tweens.add({
        targets: this.player,
        y: this.gameHeight - 100,
        duration: 300,
        ease: 'Linear'
      });
    }
  }

  moveDown() {
    if (this.player.y < this.gameHeight - 40) {
      this.player.y += 20;
    }
  }

  updatePlayerPosition() {
    const laneX = this.getLanePositions();
    this.tweens.add({
      targets: this.player,
      x: laneX[this.playerLane],
      duration: 150,
      ease: 'Linear'
    });
  }
  
  getLaneX(lane) {
    return [this.gameWidth / 4, this.gameWidth / 2, (this.gameWidth * 3) / 4][lane];
  }
  
  getLanePositions() {
    return [this.gameWidth / 4, this.gameWidth / 2, (this.gameWidth * 3) / 4];
  }

  spawnObstacle() {
    const lanePositions = this.getLanePositions();
    const lane = Phaser.Math.Between(0, 2);
    const obstacle = this.createAdvancedRock(lanePositions[lane], -40);
    this.obstacles.push(obstacle);
  }
  
  spawnCollectible() {
    const lanePositions = this.getLanePositions();
    const lane = Phaser.Math.Between(0, 2);
    const collectible = this.createAdvancedStar(lanePositions[lane], -30);
    this.collectibles.push(collectible);
  }
  
  spawnPowerup() {
    const lanePositions = this.getLanePositions();
    const lane = Phaser.Math.Between(0, 2);
    const powerupType = Phaser.Math.RND.pick(['shield', 'guns']);
    const powerup = this.createAdvancedPowerupItem(lanePositions[lane], -30, powerupType);
    this.powerupItems.push(powerup);
  }
  
  createAdvancedSpaceship(x, y, designIndex = 0) {
    const ship = this.add.container(x, y);
    
    if (designIndex === 0) {
      this.drawClassicFighter(ship, 0x00d4ff, 0x00ffff);
    } else if (designIndex === 1) {
      this.drawPhantomRacer(ship, 0xff00ff, 0xff88ff);
    } else if (designIndex === 2) {
      this.drawHeavyBomber(ship, 0xffaa00, 0xffdd00);
    } else if (designIndex === 3) {
      this.drawQuantumShip(ship, 0x00ff88, 0x00ffaa);
    }
    
    ship.setDepth(10);
    ship.designIndex = designIndex;
    return ship;
  }
  
  drawClassicFighter(ship, primaryColor, secondaryColor) {
    // Main fuselage
    const body = this.add.polygon(0, 0, [-15, -18, 0, -28, 15, -18, 18, 12, 0, 20, -18, 12], 0x00d4ff);
    body.setStrokeStyle(2, 0x00ffff);
    
    // Wings
    const leftWing = this.add.polygon(-15, -8, [-28, -2, -22, 2], 0x0099ff);
    leftWing.setStrokeStyle(1, 0x0099ff);
    const rightWing = this.add.polygon(15, -8, [28, -2, 22, 2], 0x0099ff);
    rightWing.setStrokeStyle(1, 0x0099ff);
    
    // Cockpit
    const cockpit = this.add.circle(0, -16, 5, 0xffff00);
    cockpit.setStrokeStyle(2, 0xffaa00);
    const cockpitGlow = this.add.circle(0, -16, 2, 0xffffff);
    cockpitGlow.setAlpha(0.8);
    
    // Engines with properly aligned gas tubes
    const leftEngine = this.add.rectangle(-8, 16, 3, 6, 0xff6600);
    const rightEngine = this.add.rectangle(8, 16, 3, 6, 0xff6600);
    const engineGlow1 = this.add.circle(-8, 24, 3.5, 0xff9933);
    engineGlow1.setAlpha(0.7);
    const engineGlow2 = this.add.circle(8, 24, 3.5, 0xff9933);
    engineGlow2.setAlpha(0.7);
    
    ship.add([body, leftWing, rightWing, cockpit, cockpitGlow, leftEngine, rightEngine, engineGlow1, engineGlow2]);
  }
  
  drawPhantomRacer(ship, primaryColor, secondaryColor) {
    // Sleek body
    const body = this.add.polygon(0, 0, [-12, -20, 0, -28, 12, -20, 16, 8, 0, 18, -16, 8], 0xff00ff);
    body.setStrokeStyle(2, 0xff88ff);
    
    // Central stripe
    const stripe = this.add.line(0, -28, 0, 18, 0xff88ff);
    stripe.setLineWidth(3);
    
    // Side intakes
    const leftIntake = this.add.polygon(-12, -8, [-22, 0, -16, 2], 0x00ffff);
    const rightIntake = this.add.polygon(12, -8, [22, 0, 16, 2], 0x00ffff);
    
    // Cockpit
    const cockpit = this.add.circle(0, -14, 4, 0x00ffff);
    cockpit.setStrokeStyle(2, 0x00ffff);
    
    // Thruster
    const thruster = this.add.polygon(0, 18, [-8, 18, -5, 24, 5, 24, 8, 18], 0xff6600);
    
    ship.add([body, stripe, leftIntake, rightIntake, cockpit, thruster]);
  }
  
  drawHeavyBomber(ship, primaryColor, secondaryColor) {
    // Heavy body
    const body = this.add.polygon(0, 0, [-18, -15, 0, -26, 18, -15, 20, 14, 0, 22, -20, 14], 0xffaa00);
    body.setStrokeStyle(2, 0xffdd00);
    
    // Armor plating
    const armor1 = this.add.line(-12, -8, -12, 12, 0xffdd00);
    armor1.setLineWidth(1);
    armor1.setAlpha(0.6);
    const armor2 = this.add.line(12, -8, 12, 12, 0xffdd00);
    armor2.setLineWidth(1);
    armor2.setAlpha(0.6);
    
    // Cockpit
    const cockpit = this.add.circle(0, -12, 5, 0xffff00);
    cockpit.setStrokeStyle(2, 0xffdd00);
    
    // Weapon pods
    const weapon1 = this.add.rectangle(-10, 8, 4, 8, 0xff3333);
    const weapon2 = this.add.rectangle(6, 8, 4, 8, 0xff3333);
    
    // Triple engines
    const engine1 = this.add.rectangle(-7, 17, 3, 7, 0xff6600);
    const engine2 = this.add.rectangle(0, 17, 3, 7, 0xff6600);
    const engine3 = this.add.rectangle(4, 17, 3, 7, 0xff6600);
    const engineGlow1 = this.add.circle(-5.5, 24, 3, 0xff9933);
    engineGlow1.setAlpha(0.7);
    const engineGlow2 = this.add.circle(1.5, 24, 3, 0xff9933);
    engineGlow2.setAlpha(0.7);
    const engineGlow3 = this.add.circle(5.5, 24, 3, 0xff9933);
    engineGlow3.setAlpha(0.7);
    
    ship.add([body, armor1, armor2, cockpit, weapon1, weapon2, engine1, engine2, engine3, engineGlow1, engineGlow2, engineGlow3]);
  }
  
  drawQuantumShip(ship, primaryColor, secondaryColor) {
    // Main body
    const body = this.add.polygon(0, 0, [-14, -18, 0, -26, 14, -18, 17, 10, 0, 20, -17, 10], 0x00ff88);
    body.setStrokeStyle(2, 0x00ffaa);
    
    // Energy rings
    const ring1 = this.add.circle(0, 0, 18, undefined, 0);
    ring1.setStrokeStyle(2, 0x00ffaa);
    ring1.setAlpha(0.6);
    const ring2 = this.add.circle(0, 0, 12, undefined, 0);
    ring2.setStrokeStyle(2, 0x00ffaa);
    ring2.setAlpha(0.4);
    
    // Quantum core
    const core = this.add.circle(0, -12, 4, 0x00ffff);
    core.setStrokeStyle(2, 0xffffff);
    const coreGlow = this.add.circle(0, -12, 2, 0xffffff);
    coreGlow.setAlpha(0.7);
    
    // Main engine
    const engine = this.add.polygon(0, 18, [-7, 18, -5, 24, 5, 24, 7, 18], 0x00ff88);
    const engineGlow = this.add.circle(0, 24, 2, 0x00ffaa);
    engineGlow.setAlpha(0.8);
    
    ship.add([body, ring1, ring2, core, coreGlow, engine, engineGlow]);
  }
  
  createAdvancedRock(x, y) {
    const rock = this.add.container(x, y);
    
    const rockBody = this.add.polygon(0, 0, [
      -16, -12, -10, -20, 10, -18, 20, -8, 20, 10, 12, 20, -10, 22, -18, 12
    ], 0x8b6f47);
    rockBody.setStrokeStyle(2, 0x5c4c33);
    
    const highlight1 = this.add.polygon(-6, -10, [-2, -16, 6, -14, 2, -6], 0xc9a876);
    highlight1.setAlpha(0.8);
    
    const highlight2 = this.add.polygon(10, 5, [10, 2, 18, 8, 14, 12], 0xb8956a);
    highlight2.setAlpha(0.6);
    
    const shadow = this.add.polygon(-2, 15, [-2, 15, 8, 18, 2, 22], 0x4a3928);
    shadow.setAlpha(0.5);
    
    rock.add([shadow, rockBody, highlight1, highlight2]);
    rock.setDepth(5);
    rock.rotation = Phaser.Math.Between(0, Math.PI * 2);
    return rock;
  }
  
  createAdvancedStar(x, y) {
    const star = this.add.container(x, y);
    
    const outerGlow = this.add.circle(0, 0, 18, 0xffff88);
    outerGlow.setAlpha(0.3);
    
    const points = [];
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? 13 : 7;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      points.push(radius * Math.cos(angle), radius * Math.sin(angle));
    }
    
    const starShape = this.add.polygon(0, 0, points, 0xffff00);
    starShape.setStrokeStyle(2, 0xffaa00);
    
    const innerGlow = this.add.circle(0, 0, 9, 0xffffff);
    innerGlow.setAlpha(0.4);
    
    star.add([outerGlow, starShape, innerGlow]);
    star.setDepth(5);
    return star;
  }
  
  createAdvancedPowerupItem(x, y, type) {
    const powerupItem = this.add.container(x, y);
    powerupItem.powerupType = type;
    
    if (type === 'shield') {
      const outerRing = this.add.circle(0, 0, 20, undefined, 0);
      outerRing.setStrokeStyle(3, 0x00ff00);
      
      const middleRing = this.add.circle(0, 0, 14, undefined, 0);
      middleRing.setStrokeStyle(2, 0x00ff00);
      middleRing.setAlpha(0.7);
      
      const innerRing = this.add.circle(0, 0, 8, undefined, 0);
      innerRing.setStrokeStyle(2, 0x00ff00);
      innerRing.setAlpha(0.5);
      
      const core = this.add.circle(0, 0, 4, 0x00ff00);
      core.setAlpha(0.9);
      
      const text = this.add.text(0, 2, 'S', { fontSize: '12px', fill: '#ffffff', fontStyle: 'bold' });
      text.setOrigin(0.5);
      
      powerupItem.add([outerRing, middleRing, innerRing, core, text]);
    } else if (type === 'guns') {
      const outerBox = this.add.rectangle(0, 0, 26, 26, undefined, 0);
      outerBox.setStrokeStyle(3, 0xff0000);
      
      const innerBox = this.add.rectangle(0, 0, 18, 18, 0xff0000);
      innerBox.setAlpha(0.5);
      
      const barrel1 = this.add.rectangle(-6, -8, 3, 8, 0xffaa00);
      const barrel2 = this.add.rectangle(6, -8, 3, 8, 0xffaa00);
      
      const text = this.add.text(0, 3, 'G', { fontSize: '12px', fill: '#ffffff', fontStyle: 'bold' });
      text.setOrigin(0.5);
      
      powerupItem.add([outerBox, innerBox, barrel1, barrel2, text]);
    }
    
    powerupItem.setDepth(5);
    return powerupItem;
  }
  
  activatePowerup(type) {
    if (type === 'shield') {
      this.powerups.shield = true;
      this.powerups.shieldDuration = 10000;
      this.showPowerupMessage('SHIELD ACTIVATED!', '#00ff00');
    } else if (type === 'guns') {
      this.powerups.guns = true;
      this.powerups.gunsDuration = 8000;
      this.showPowerupMessage('GUNS ACTIVATED!', '#ff0000');
    }
  }
  
  updatePowerups(delta) {
    if (this.powerups.shield) {
      this.powerups.shieldDuration -= delta;
      if (this.powerups.shieldDuration <= 0) {
        this.powerups.shield = false;
      }
    }
    
    if (this.powerups.guns) {
      this.powerups.gunsDuration -= delta;
      if (this.powerups.gunsDuration <= 0) {
        this.powerups.guns = false;
      }
    }
    
    let powerupDisplay = '';
    if (this.powerups.shield) {
      powerupDisplay += 'Shield: ' + Math.ceil(this.powerups.shieldDuration / 1000) + 's ';
    }
    if (this.powerups.guns) {
      powerupDisplay += 'Guns: ' + Math.ceil(this.powerups.gunsDuration / 1000) + 's';
    }
    this.powerupText.setText(powerupDisplay);
  }
  
  showPowerupMessage(text, color) {
    const msg = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 100, text, {
      fontSize: '32px',
      fill: color,
      fontStyle: 'bold'
    });
    msg.setOrigin(0.5);
    msg.setDepth(25);
    
    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 1500,
      ease: 'Linear',
      onComplete: () => msg.destroy()
    });
  }
  
  fireGun() {
    const bulletX = this.player.x;
    const bulletY = this.player.y - 35;
    
    const bullet = this.add.rectangle(bulletX, bulletY, 4, 12, 0xffff00);
    bullet.setStrokeStyle(1, 0xffaa00);
    bullet.setDepth(8);
    this.bullets.push(bullet);
  }

  checkCollision(obj1, obj2, customDistance = null) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = customDistance || 35;
    return distance < minDistance;
  }

  endGame() {
    this.gameActive = false;
    this.gameOverText.setText(`GAME OVER`);
    this.restartText.setText(`Score: ${this.score}`);
    this.gameOverText.setVisible(true);
    this.restartText.setVisible(true);
    
    this.saveScore(this.score);
    this.cameras.main.setAlpha(0.7);
    
    // Add coins based on score (1 coin per 100 points)
    const coinsEarned = Math.floor(this.score / 100);
    this.addCoins(coinsEarned);
    
    // Create menu button
    const menuBtn = this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2 + 80, 200, 50, 0x00ff88);
    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.setDepth(35);

    const menuText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 80, 'BACK TO MENU', {
      fontSize: '20px',
      fill: '#000000',
      fontStyle: 'bold'
    });
    menuText.setOrigin(0.5);
    menuText.setDepth(35);
    menuText.setInteractive({ useHandCursor: true });

    const handleMenuClick = () => {
      this.cameras.main.setAlpha(1);
      this.scene.stop();
      this.scene.start('MenuScene');
    };

    menuBtn.on('pointerdown', handleMenuClick);
    menuText.on('pointerdown', handleMenuClick);
    
    // Also allow SPACE key
    this.input.keyboard.once('keydown-SPACE', handleMenuClick);
  }

  createStarfield() {
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, this.gameWidth);
      const y = Phaser.Math.Between(0, this.gameHeight);
      const size = Phaser.Math.Between(1, 2);
      const star = this.add.circle(x, y, size, 0xffffff);
      star.setDepth(0);
      star.setAlpha(0.6 + Math.random() * 0.4);
    }
  }
  
  updateShieldVisual() {
    this.shieldGraphic.clear();
    if (this.powerups.shield) {
      this.shieldGraphic.setVisible(true);
      const shieldRadius = 50;
      const shieldAlpha = 0.6 + Math.sin(this.game.getTime() / 200) * 0.3;
      
      this.shieldGraphic.fillStyle(0x00ff00, shieldAlpha * 0.3);
      this.shieldGraphic.fillCircle(this.player.x, this.player.y, shieldRadius);
      
      this.shieldGraphic.lineStyle(3, 0x00ff00, shieldAlpha);
      this.shieldGraphic.strokeCircle(this.player.x, this.player.y, shieldRadius);
      
      const rings = 3;
      for (let i = 1; i <= rings; i++) {
        const ringRadius = shieldRadius * (i / rings);
        const ringAlpha = shieldAlpha * (1 - i / rings);
        this.shieldGraphic.lineStyle(2, 0x00ff00, ringAlpha);
        this.shieldGraphic.strokeCircle(this.player.x, this.player.y, ringRadius);
      }
    } else {
      this.shieldGraphic.setVisible(false);
    }
  }
  
  spawnEnemySpaceship() {
    const lanePositions = this.getLanePositions();
    const lane = Phaser.Math.Between(0, 2);
    const designIndex = Phaser.Math.Between(0, 2);
    const enemy = this.createEnemySpaceship(lanePositions[lane], -50, designIndex);
    this.enemies.push(enemy);
  }
  
  createEnemySpaceship(x, y, designIndex = 0) {
    const enemy = this.add.container(x, y);
    
    if (designIndex === 0) {
      const body = this.add.polygon(0, 0, [0, -20, 18, 10, 12, 20, -12, 20, -18, 10], 0xff3333);
      body.setStrokeStyle(2, 0xff0000);
      
      const cockpit = this.add.circle(0, -10, 5, 0xff6666);
      cockpit.setStrokeStyle(2, 0xff0000);
      
      const leftWing = this.add.polygon(-14, 5, [-22, 5, -18, 8, -16, 6], 0xcc0000);
      const rightWing = this.add.polygon(14, 5, [22, 5, 18, 8, 16, 6], 0xcc0000);
      
      enemy.add([body, leftWing, rightWing, cockpit]);
    } else if (designIndex === 1) {
      const body = this.add.polygon(0, 0, [0, -22, 16, -5, 14, 20, -14, 20, -16, -5], 0xff4444);
      body.setStrokeStyle(2, 0xff2222);
      
      const cockpit = this.add.circle(0, -12, 4, 0xff6666);
      const weapon = this.add.polygon(0, 18, [-4, 20, 0, 22, 4, 20], 0xff0000);
      
      enemy.add([body, cockpit, weapon]);
    } else {
      const body = this.add.polygon(0, 0, [0, -24, 15, -8, 16, 18, -16, 18, -15, -8], 0xff5555);
      body.setStrokeStyle(2, 0xff1111);
      
      const cockpit = this.add.circle(0, -14, 4, 0xff8888);
      const stripe = this.add.rectangle(0, 0, 4, 24, undefined, 0);
      stripe.setStrokeStyle(1, 0xff2222);
      
      enemy.add([body, stripe, cockpit]);
    }
    
    enemy.setDepth(8);
    return enemy;
  }
  
  enemyShoot(enemy) {
    const bulletX = enemy.x;
    const bulletY = enemy.y + 20;
    
    const bullet = this.add.rectangle(bulletX, bulletY, 4, 12, 0xff3333);
    bullet.setStrokeStyle(1, 0xff0000);
    bullet.setDepth(8);
  }
  
  destroyWithEffect(obj) {
    for (let i = 0; i < 6; i++) {
      const particle = this.add.circle(obj.x, obj.y, 3, 0xffaa00);
      particle.setDepth(8);
      
      const angle = (i / 6) * Math.PI * 2;
      const velocityX = Math.cos(angle) * 150;
      const velocityY = Math.sin(angle) * 150;
      
      this.tweens.add({
        targets: particle,
        x: obj.x + velocityX,
        y: obj.y + velocityY,
        alpha: 0,
        duration: 600,
        ease: 'Linear',
        onComplete: () => particle.destroy()
      });
    }
    // Destroy the actual object
    if (obj && obj.destroy) {
      obj.destroy();
    }
  }
  
  saveScore(score) {
    const scores = JSON.parse(localStorage.getItem('cosmicRunnerHighScores')) || [];
    scores.push(score);
    localStorage.setItem('cosmicRunnerHighScores', JSON.stringify(scores));
  }
  
  getUnlockedShips() {
    const stored = localStorage.getItem('cosmicRunnerUnlockedShips');
    return stored ? JSON.parse(stored) : [true, false, false, false];
  }
  
  addCoins(amount) {
    const currentCoins = this.getPlayerCoins();
    const newCoins = currentCoins + amount;
    localStorage.setItem('cosmicRunnerCoins', newCoins.toString());
  }
  
  getPlayerCoins() {
    return parseInt(localStorage.getItem('cosmicRunnerCoins')) || 0;
  }
  
  getPlayerShields() {
    return parseInt(localStorage.getItem('cosmicRunnerPlayerShields')) || 0;
  }
  
  initializeStartingCoins() {
    const hasVisitedBefore = localStorage.getItem('cosmicRunnerVisited') === 'true';
    if (!hasVisitedBefore) {
      // First time player - give 500 starting coins
      localStorage.setItem('cosmicRunnerCoins', '500');
      localStorage.setItem('cosmicRunnerVisited', 'true');
    }
  }
  
  activateStoredShield() {
    if (this.storedShields > 0 && !this.powerups.shield) {
      this.storedShields -= 1;
      this.powerups.shield = true;
      this.powerups.shieldDuration = 10000;
      localStorage.setItem('cosmicRunnerPlayerShields', this.storedShields.toString());
      this.shieldsText.setText(`Shields: ${this.storedShields}`);
      this.showPowerupMessage('SHIELD ACTIVATED!', '#00ff00');
    }
  }
}
