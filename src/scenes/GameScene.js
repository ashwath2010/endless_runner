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
    
    // Set background with gradient effect
    this.cameras.main.setBackgroundColor('#0a0e27');
    
    // Add starfield background
    this.createStarfield();
    
    this.score = 0;
    this.gameActive = true;
    this.difficultyMultiplier = 1;
    
    // Player setup - Spaceship
    this.playerSize = 40;
    this.playerLane = 1; // 0: left, 1: center, 2: right
    this.player = this.createSpaceship(this.getLaneX(1), this.gameHeight - 100);
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
    
    // Obstacles array (rocks)
    this.obstacles = [];
    this.obstacleSpeed = 300;
    this.spawnRate = 1500; // ms between spawns
    this.spawnTimer = 0;
    
    // Collectibles (bonus items)
    this.collectibles = [];
    this.collectibleSpawnRate = 4000; // ms between spawns
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
    
    // Touch input (swipe detection)
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    this.input.on('pointerdown', (pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
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
    
    // UI setup
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '32px',
      fill: '#00ff88',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.scoreText.setDepth(20);
    
    this.powerupText = this.add.text(20, 60, '', {
      fontSize: '16px',
      fill: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.powerupText.setDepth(20);
    
    // Shield visual indicator (proper sphere around spaceship)
    this.shieldGraphic = this.make.graphics({ x: 0, y: 0, add: true });
    this.shieldGraphic.setDepth(9);
    this.shieldGraphic.setVisible(false);
    
    this.gameOverText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 50, '', {
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
    
    this.restartText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 50, '', {
      fontSize: '24px',
      fill: '#ffff00',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.restartText.setOrigin(0.5);
    this.restartText.setDepth(30);
    this.restartText.setVisible(false);
    
    this.instructionText = this.add.text(this.gameWidth / 2, this.gameHeight - 30, 'Use Arrow Keys or Swipe to Move | Collect Stars & Powerups', {
      fontSize: '14px',
      fill: '#888888',
      align: 'center'
    });
    this.instructionText.setOrigin(0.5);
    this.instructionText.setDepth(10);
  }

  update(time, delta) {
    if (!this.gameActive) {
      return;
    }

    // Update powerups and shield visual
    this.updatePowerups(delta);
    this.updateShieldVisual();
    
    // Spawn obstacles
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnRate) {
      this.spawnObstacle();
      this.spawnTimer = 0;
      
      // Increase difficulty over time
      if (this.score % 500 === 0 && this.score > 0) {
        this.obstacleSpeed = Math.min(this.obstacleSpeed + 30, 600);
        this.spawnRate = Math.max(this.spawnRate - 50, 800);
      }
    }
    
    // Spawn collectibles
    this.collectibleSpawnTimer += delta;
    if (this.collectibleSpawnTimer >= this.collectibleSpawnRate) {
      this.spawnCollectible();
      this.collectibleSpawnTimer = 0;
    }
    
    // Spawn powerups
    this.powerupSpawnTimer += delta;
    if (this.powerupSpawnTimer >= this.powerupSpawnRate) {
      this.spawnPowerup();
      this.powerupSpawnTimer = 0;
    }
    
    // Fire bullets automatically when guns active
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

      // Check if bullets hit obstacle
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j];
        if (this.checkCollision(bullet, obstacle, 20)) {
          obstacle.destroy();
          this.obstacles.splice(i, 1);
          bullet.destroy();
          this.bullets.splice(j, 1);
          this.score += 15;
          this.scoreText.setText('Score: ' + this.score);
          break;
        }
      }

      // Check collision with player
      if (this.checkCollision(this.player, obstacle, 30)) {
        if (this.powerups.shield) {
          obstacle.destroy();
          this.obstacles.splice(i, 1);
          this.powerups.shield = false;
          this.shieldIndicator.setVisible(false);
        } else {
          this.endGame();
          return;
        }
      }

      // Remove obstacle if off-screen
      if (obstacle.y > this.gameHeight) {
        obstacle.destroy();
        this.obstacles.splice(i, 1);
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
      }
    }
    
    // Update collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.collectibles[i];
      collectible.y += (this.obstacleSpeed * this.difficultyMultiplier) * delta / 1000;
      
      // Spinning animation
      collectible.rotation += 0.05;

      // Check collision with player
      if (this.checkCollision(this.player, collectible, 20)) {
        this.score += 50;
        this.scoreText.setText('Score: ' + this.score);
        collectible.destroy();
        this.collectibles.splice(i, 1);
      }

      // Remove if off-screen
      if (collectible.y > this.gameHeight) {
        collectible.destroy();
        this.collectibles.splice(i, 1);
      }
    }
    
    // Update powerup items
    for (let i = this.powerupItems.length - 1; i >= 0; i--) {
      const powerupItem = this.powerupItems[i];
      powerupItem.y += (this.obstacleSpeed * this.difficultyMultiplier) * delta / 1000;
      
      // Pulsing animation
      powerupItem.scale = 1 + Math.sin(time / 200) * 0.2;

      // Check collision with player
      if (this.checkCollision(this.player, powerupItem, 25)) {
        this.activatePowerup(powerupItem.powerupType);
        powerupItem.destroy();
        this.powerupItems.splice(i, 1);
      }

      // Remove if off-screen
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
    // Bonus: move up for more score or temporary invincibility
    if (this.player.y > 100) {
      this.player.y -= 40;
      this.tweens.add({
        targets: this.player,
        y: this.gameHeight - 80,
        duration: 300,
        ease: 'Linear'
      });
    }
  }

  moveDown() {
    // Move down slightly for evasion
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
    const obstacle = this.createRock(lanePositions[lane], -40);
    this.obstacles.push(obstacle);
  }
  
  spawnCollectible() {
    const lanePositions = this.getLanePositions();
    const lane = Phaser.Math.Between(0, 2);
    const collectible = this.createStar(lanePositions[lane], -30);
    this.collectibles.push(collectible);
  }
  
  spawnPowerup() {
    const lanePositions = this.getLanePositions();
    const lane = Phaser.Math.Between(0, 2);
    const powerupType = Phaser.Math.RND.pick(['shield', 'guns']);
    const powerup = this.createPowerupItem(lanePositions[lane], -30, powerupType);
    this.powerupItems.push(powerup);
  }
  
  createSpaceship(x, y) {
    const ship = this.add.container(x, y);
    
    // Main body - sleek design
    const bodyPoints = [0, -20, 18, 10, 12, 18, -12, 18, -18, 10];
    const body = this.add.polygon(0, 0, bodyPoints, 0x00d4ff);
    body.setStrokeStyle(2, 0x00ffff);
    
    // Cockpit - advanced design
    const cockpit = this.add.circle(0, -8, 5, 0xffff00);
    cockpit.setStrokeStyle(2, 0xffaa00);
    
    // Inner cockpit glow
    const cockpitGlow = this.add.circle(0, -8, 3, 0xffff88);
    
    // Side wings with gradient effect
    const leftWing = this.add.triangle(-12, 8, -18, 8, -15, 12, -12, 8, 0x0099ff);
    const rightWing = this.add.triangle(12, 8, 18, 8, 15, 12, 12, 8, 0x0099ff);
    leftWing.setStrokeStyle(1, 0x00ffff);
    rightWing.setStrokeStyle(1, 0x00ffff);
    
    // Engine flame
    const flame = this.createFlame();
    flame.name = 'flame';
    
    // Shield holder (for when shield is active)
    ship.add([body, leftWing, rightWing, cockpitGlow, cockpit, flame]);
    ship.setDepth(10);
    return ship;
  }
  
  createFlame() {
    const flame = this.add.container(0, 15);
    
    // Main flame
    const flameBody = this.add.polygon(0, 0, [0, -8, 6, 8, 0, 12, -6, 8], 0xff6600);
    flameBody.setStrokeStyle(1, 0xffaa00);
    
    // Glow effect
    const flameGlow = this.add.circle(0, 4, 5, 0xffaa00);
    flameGlow.setAlpha(0.6);
    
    flame.add([flameGlow, flameBody]);
    return flame;
  }
  
  createRock(x, y) {
    const rock = this.add.container(x, y);
    
    // Multiple layers for 3D effect
    const rockBody = this.add.polygon(0, 0, [
      -15, -10, -10, -18, 8, -15, 18, -8, 18, 8, 10, 18, -8, 18, -15, 10
    ], 0x8b7355);
    rockBody.setStrokeStyle(2, 0x654321);
    
    // Add highlights for dimension
    const highlight1 = this.add.polygon(-5, -8, [-3, -12, 5, -10, 2, -5], 0xb8956a);
    highlight1.setAlpha(0.7);
    
    const highlight2 = this.add.polygon(8, 5, [8, 2, 15, 5, 12, 10], 0x9d7e5d);
    highlight2.setAlpha(0.6);
    
    // Shadow
    const shadow = this.add.polygon(2, 10, [2, 10, 12, 12, 5, 16], 0x5c4033);
    shadow.setAlpha(0.5);
    
    rock.add([shadow, rockBody, highlight1, highlight2]);
    rock.setDepth(5);
    rock.rotation = Phaser.Math.Between(0, Math.PI * 2);
    return rock;
  }
  
  createStar(x, y) {
    const star = this.add.container(x, y);
    
    // Outer glow
    const glow = this.add.circle(0, 0, 16, 0xffff88);
    glow.setAlpha(0.4);
    
    // Draw star
    const points = [];
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? 12 : 6;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      points.push(radius * Math.cos(angle), radius * Math.sin(angle));
    }
    
    const starShape = this.add.polygon(0, 0, points, 0xffff00);
    starShape.setStrokeStyle(2, 0xffaa00);
    
    // Inner glow
    const innerGlow = this.add.circle(0, 0, 8, 0xffff88);
    innerGlow.setAlpha(0.5);
    
    star.add([glow, starShape, innerGlow]);
    
    star.setDepth(5);
    return star;
  }
  
  createPowerupItem(x, y, type) {
    const powerupItem = this.add.container(x, y);
    powerupItem.powerupType = type;
    
    if (type === 'shield') {
      // Shield powerup - sophisticated design
      const outerRing = this.add.circle(0, 0, 18, 0x00ff00);
      outerRing.setFillStyle(undefined, 0);
      outerRing.setStrokeStyle(3, 0x00ff00);
      
      const innerRing = this.add.circle(0, 0, 12, 0x00ff00);
      innerRing.setFillStyle(undefined, 0);
      innerRing.setStrokeStyle(2, 0x00ff00);
      innerRing.setAlpha(0.7);
      
      const core = this.add.circle(0, 0, 6, 0x00ff00);
      core.setAlpha(0.8);
      
      const text = this.add.text(0, 0, 'S', { fontSize: '14px', fill: '#ffffff', fontStyle: 'bold' });
      text.setOrigin(0.5);
      
      powerupItem.add([outerRing, innerRing, core, text]);
    } else if (type === 'guns') {
      // Guns powerup - aggressive design
      const outerBox = this.add.rectangle(0, 0, 24, 24, 0xff0000);
      outerBox.setFillStyle(undefined, 0);
      outerBox.setStrokeStyle(3, 0xff0000);
      
      const innerBox = this.add.rectangle(0, 0, 16, 16, 0xff0000);
      innerBox.setAlpha(0.6);
      
      const topPoint = this.add.triangle(0, -10, -4, -14, 4, -14, 0, -10, 0xffaa00);
      const bottomPoint = this.add.triangle(0, 10, -4, 14, 4, 14, 0, 10, 0xffaa00);
      
      const text = this.add.text(0, 0, 'G', { fontSize: '14px', fill: '#ffffff', fontStyle: 'bold' });
      text.setOrigin(0.5);
      
      powerupItem.add([outerBox, innerBox, topPoint, bottomPoint, text]);
    }
    
    powerupItem.setDepth(5);
    return powerupItem;
  }
  
  activatePowerup(type) {
    if (type === 'shield') {
      this.powerups.shield = true;
      this.powerups.shieldDuration = 10000; // 10 seconds
      this.shieldIndicator.setVisible(true);
      this.showPowerupMessage('SHIELD ACTIVATED!', '#00ff00');
    } else if (type === 'guns') {
      this.powerups.guns = true;
      this.powerups.gunsDuration = 8000; // 8 seconds
      this.showPowerupMessage('GUNS ACTIVATED!', '#ff0000');
    }
  }
  
  updatePowerups(delta) {
    if (this.powerups.shield) {
      this.powerups.shieldDuration -= delta;
      if (this.powerups.shieldDuration <= 0) {
        this.powerups.shield = false;
        this.shieldIndicator.setVisible(false);
      }
    }
    
    if (this.powerups.guns) {
      this.powerups.gunsDuration -= delta;
      if (this.powerups.gunsDuration <= 0) {
        this.powerups.guns = false;
      }
    }
    
    // Update powerup text
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
    const bulletY = this.player.y - 30;
    
    const bullet = this.add.rectangle(bulletX, bulletY, 4, 12, 0xffff00);
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
    this.restartText.setText(`Score: ${this.score}\nPress SPACE to Restart`);
    this.gameOverText.setVisible(true);
    this.restartText.setVisible(true);
    
    // Darken background
    this.cameras.main.setAlpha(0.7);
    
    this.input.keyboard.on('keydown-SPACE', () => {
      this.cameras.main.setAlpha(1);
      this.scene.restart();
    });
  }

  createStarfield() {
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, this.gameWidth);
      const y = Phaser.Math.Between(0, this.gameHeight);
      const size = Phaser.Math.Between(1, 2);
      const star = this.add.circle(x, y, size, 0xffffff);
      star.setDepth(0);
    }
  }
  
  updateShieldVisual() {
    this.shieldGraphic.clear();
    if (this.powerups.shield) {
      this.shieldGraphic.setVisible(true);
      const shieldRadius = 50;
      const shieldAlpha = 0.6 + Math.sin(this.game.getTime() / 200) * 0.3;
      
      // Draw shield sphere
      this.shieldGraphic.fillStyle(0x00ff00, shieldAlpha * 0.3);
      this.shieldGraphic.fillCircle(this.player.x, this.player.y, shieldRadius);
      
      this.shieldGraphic.lineStyle(3, 0x00ff00, shieldAlpha);
      this.shieldGraphic.strokeCircle(this.player.x, this.player.y, shieldRadius);
      
      // Draw pulsing rings
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
}
