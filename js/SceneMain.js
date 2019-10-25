class SceneMain extends Phaser.Scene {
    constructor() {
        super({ key: 'SceneMain' });
    }
  
    preload() {
        // images
        this.load.image('sprEnemy1', 'assets/P3SpaceShooterContent/sprEnemy1.png');       
        this.load.image('sprLaserEnemy0', 'assets/P3SpaceShooterContent/sprLaserEnemy0.png');
        this.load.image('sprLaserPlayer', 'assets/P3SpaceShooterContent/sprLaserPlayer.png');

        // spritesheets
        this.load.spritesheet('sprPlayer', 
            'assets/games/invaders/player.png', 
            { frameWidth: 28, frameHeight: 21
        });
        this.load.spritesheet('sprEnemy0', 
            'assets/P3SpaceShooterContent/sprEnemy0.png', 
            { frameWidth: 16, frameHeight: 16
        });
        this.load.spritesheet('sprEnemy2', 
            'assets/P3SpaceShooterContent/sprEnemy2.png', 
            { frameWidth: 16, frameHeight: 16
        });
        this.load.spritesheet('sprExplosion', 
            'assets/P3SpaceShooterContent/sprExplosion.png', 
            { frameWidth: 32, frameHeight: 32
        });

        // sfx
        this.load.audio('sndExplode0', 'assets/P3SpaceShooterContent/sndExplode0.wav');
        this.load.audio('sndExplode1', 'assets/P3SpaceShooterContent/sndExplode1.wav');
        this.load.audio('sndLaser', 'assets/P3SpaceShooterContent/sndLaser.wav');
    }

    create() {
        // animations
        this.anims.create({
            key: 'sprPlayer',
            frames: this.anims.generateFrameNumbers('sprPlayer'),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'sprEnemy0',
            frames: this.anims.generateFrameNumbers('sprEnemy0'),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'sprEnemy2',
            frames: this.anims.generateFrameNumbers('sprEnemy2'),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'sprExplosion',
            frames: this.anims.generateFrameNumbers('sprExplosion'),
            frameRate: 20,
            repeat: 0
        });

        // sfx
        this.sfx = {
            explosions: [
                this.sound.add('sndExplode0'),
                this.sound.add('sndExplode1')
            ],
            laser: this.sound.add('sndLaser')
        };

        // scrolling background
        this.backgrounds = [];
        for (var i = 0; i < 3; i++) {
            var bg = new ScrollingBackground(this, 'sprBg0', i * 10);
            this.backgrounds.push(bg);
        }

        // create player instance
        this.player = new Player(
            this,
            this.game.config.width * 0.5,
            this.game.config.height * 0.9,
            'sprPlayer'
        );

        // player movement keys
        this.keyLEFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.keyRIGHT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

        // player fire w/ spacbar
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // create enemy instance groups
        this.enemies = this.add.group();
        this.enemyLasers = this.add.group();
        this.playerLasers = this.add.group();

        // spawn enemies timer event
        this.time.addEvent({
            delay: 1000,
            callback: function() {
                var enemy = null;

                if (Phaser.Math.Between(0, 10) >= 3) {
                    enemy = new GunShip(
                        this,
                        Phaser.Math.Between(0, this.game.config.width),
                        0   
                    );
                }
                else if (Phaser.Math.Between(0, 10) >= 5) {
                    if (this.getEnemiesByType('ChaserShip').length < 5) {
                        enemy = new ChaserShip(
                            this,
                            Phaser.Math.Between(0, this.game.config.width),
                            0
                        );
                    }
                }
                else {
                    enemy = new CarrierShip(
                        this,
                        Phaser.Math.Between(0, this.game.config.width),
                        0
                    );
                }
    
                if (enemy !== null) {
                    enemy.setScale(Phaser.Math.Between(10, 20) * 0.1);
                    this.enemies.add(enemy);
                }
            },
            callbackScope: this,
            loop: true
        });

        // player-enemies collision
        this.physics.add.overlap(this.player, this.enemies, function(player, enemy) {
            if (!player.getData('isDead') &&
                !enemy.getData('isDead')) {
                    player.explode(false);
                    player.onDestroy();
                    enemy.explode(true);
            }
        });

        // playerLaser-enemies collision
        this.physics.add.collider(this.playerLasers, this.enemies, function(playerLaser, enemy) {
            if (enemy) {
                if (enemy.onDestroy !== undefined) {
                    enemy.onDestroy();
                }
                enemy.explode(true);
                playerLaser.destroy();
            }
        });

        // player-enemyLasers collision
        this.physics.add.overlap(this.player, this.enemyLasers, function(player, laser) {
            if (!player.getData('isDead') &&
                !laser.getData('isDead')) {
                    player.explode(false);
                    player.onDestroy();
                    laser.destroy();
            }
        });
    }

    getEnemiesByType(type) {
        var arr = [];
        for (var i = 0; i < this.enemies.getChildren().length; i++) {
            var enemy = this.enemies.getChildren()[i];
            if (enemy.getData('type') == type) {
                arr.push(enemy);
            }
        }
        return arr;
    }

    update() {
        // while player is still alive
        if (!this.player.getData('isDead')) {
            this.player.update();

            // player movement keys
            if (this.keyLEFT.isDown) {
                this.player.moveLeft();
            }
            else if (this.keyRIGHT.isDown) {
                this.player.moveRight();
            }

            // player fire w/ spacebar
            if (this.keySpace.isDown) {
                this.player.setData('isShooting', true);
            }
            else {  // create delay between laser fire
                this.player.setData('timerShootTick', this.player.getData('timerShootDelay') - 1);
                this.player.setData('isShooting', false);
            }
        }

        for (var i = 0; i < this.enemies.getChildren().length; i++) {
            var enemy = this.enemies.getChildren()[i];
            
            enemy.update();
            
            if (enemy.x < -enemy.displayWidth || 
                enemy.x > this.game.config.width + enemy.displayWidth ||
                enemy.y < -enemy.displayHeight * 4 ||
                enemy.y > this.game.config.height + enemy.displayHeight) {
                if (enemy) {
                    if (enemy.onDestroy !== undefined) {
                        enemy.onDestroy();
                    }
                    enemy.destroy();
                }
            }
        }

        for (var i = 0; i < this.enemyLasers.getChildren().length; i++) {
            var laser = this.enemyLasers.getChildren()[i];

            laser.update();

            if (laser.x < -laser.displayWidth ||
                laser.x > this.game.config.width + laser.displayWidth ||
                laser.y < -laser.displayHeight * 4 ||
                laser.y > this.game.config.height + laser.displayHeight) {
                if (laser) {
                    laser.destroy();
                }
            }
        }

        for (var i = 0; i < this.playerLasers.getChildren().length; i++) {
            var laser = this.playerLasers.getChildren()[i];

            laser.update();

            if (laser.x < -laser.displayWidth ||
                laser.x > this.game.config.width + laser.displayWidth ||
                laser.y < -laser.displayHeight * 4 ||
                laser.y > this.game.config.height + laser.displayHeight) {
                if (laser) {
                    laser.destroy();
                }
            }
        }

        // scrolling background
        for (var i = 0; i < this.backgrounds.length; i++) {
            this.backgrounds[i].update();
        }
    }
}