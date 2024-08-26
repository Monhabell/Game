import { createAnimations } from "./animations.js"
let score = 0; // Variable global para la puntuación
let vidas = 3;
const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 400,
    backgroundColor: '#049cd8',
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload, // se ejecuta para precargar recursos
        create, // se ejecuta cuando el juego comienza
        update // se ejecuta en cada frame
    }
}

new Phaser.Game(config)

function preload() {
    this.load.image('background', 'assets/fondo.jpg');
    this.load.image('cloud1', 'assets/scenery/overworld/cloud1.png');
    //this.load.spritesheet('mascotaGesi', 'assets/mascotaGesi1.png', { frameWidth: 41.6, frameHeight: 56 });
    this.load.spritesheet('mascotaGesi', 'assets/mascotaGesiFinal.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('mascotaGesiload', 'assets/mascotaload.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('saltar', 'assets/saltar.png', { frameWidth: 128, frameHeight: 128 });



    this.load.image('suelo', 'assets/scenery/overworld/floorbricks.png');
    this.load.audio('gameover', 'assets/sound/music/gameover.mp3');

    // cargar enemigos
    this.load.spritesheet('malo', 'assets/entities/underground/Run.png', { frameWidth: 128, frameHeight: 128 });

    // cargar monedas
    this.load.spritesheet('coins', 'assets/collectibles/coin.png', { frameWidth: 16, frameHeight: 16 });

    // sonido de matar
    this.load.audio('matar', 'assets/sound/effects/matar.wav');
    this.load.audio('moneda', 'assets/sound/effects/coin.mp3');
}

function create() {
    createAnimations(this);


    this.add.image(700, 400, 'background').setScale(0.4);

    this.scoreText = this.add.text(180, 20, `Puntaje: ${score}`, { fontSize: '20px', fill: '#fff' });
    this.scoreText.setScrollFactor(0); // Mantener el texto fijo en la pantalla

    this.vidasText = this.add.text(50, 20, `Vidas: ${vidas}`, { fontSize: '20px', fill: '#fff' });
    this.vidasText.setScrollFactor(0); // Mantener el texto fijo en la pantalla


    this.floor = this.physics.add.staticGroup();

    // Crear las piezas del piso
    this.floor.create(0, config.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    this.piso2 = this.floor.create(250, config.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    this.piso3 = this.floor.create(390, config.height - 160, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    this.piso3.setVisible(false);

    this.piso4 = this.floor.create(990, config.height - 160, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    this.piso4.setVisible(true);

    this.piso5 = this.floor.create(780, config.height - 350, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    this.piso5.setVisible(true);


    this.piso6 = this.floor.create(610, config.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    this.piso6.setVisible(true);


        

    this.mascotaGesi = this.physics.add.sprite(50, 100, 'mascotaGesi')
        .setScale(1)
        .setCollideWorldBounds(true)
        .setGravityY(480);

    // Crear un grupo de enemigos
    this.enemies = this.physics.add.group();

    // Número de enemigos que quieres crear
    const numEnemies = 50; // Cambia este valor según lo que necesites

    for (let i = 0; i < numEnemies; i++) {
        // Crear un enemigo
        let enemy = this.enemies.create(690 + i * 80, config.height - 250, 'malo').anims.play('enemy-walk', true)
            .setOrigin(0, 1)
            .setGravityY(300)
            .setVelocityX(-50)
            .setScale(0.6);
            enemy.flipX = true;
    }

    // Hacer que todos los enemigos colisionen con el suelo
    this.physics.add.collider(this.enemies, this.floor);

    this.physics.add.collider(this.enemies, this.enemies, (enemy1, enemy2) => {
        enemy1.setVelocityX(enemy1.body.velocity.x * -1); // Cambiar dirección de enemy1
        enemy2.setVelocityX(enemy2.body.velocity.x * -1); // Cambiar dirección de enemy2
    });

    this.physics.add.collider(this.mascotaGesi, this.floor)


    // Configurar la colisión entre el jugador y los enemigos
    this.physics.add.collider(this.mascotaGesi, this.enemies, onHitEnemy, null, this);

    // monedas    
    this.coins = this.physics.add.staticGroup();
    this.coins.create(580, 190, 'coins').anims.play('coins-giro', true).setScale(1.5);
    this.coins.create(610, 190, 'coins').anims.play('coins-giro', true).setScale(1.5);
    this.coins.create(460, 335, 'coins').anims.play('coins-giro', true).setScale(1.5);
    this.coins.create(960, 335, 'coins').anims.play('coins-giro', true).setScale(1.5);
    this.coins.create(860, 100, 'coins').anims.play('coins-giro', true).setScale(1.5);



    this.physics.add.overlap(this.mascotaGesi, this.coins, collectCoin, null, this);
    this.physics.add.world.setBounds(0, 0, 4000, config.height);

    // camara
    this.cameras.main.setBounds(0, 0, 4000, config.height); // cambiar tamaño de mundo 
    this.cameras.main.startFollow(this.mascotaGesi);

    this.keys = this.input.keyboard.createCursorKeys();
}

function collectCoin(mascotaGesi, coin) {
    coin.disableBody(true, true);
    this.sound.play('moneda');
    addToScore(100, coin, this);
}

function addToScore(scoreToAdd, origin, game) {

    score += scoreToAdd; // Actualiza la puntuación
    game.scoreText.setText(`Puntaje: ${score}`);

    console.log(score)

    const scoreText = game.add.text(
        origin.x,
        origin.y,
        scoreToAdd, {
        fontSize: config.width / 40
    }
    );

    game.tweens.add({
        targets: scoreText,
        durations: 500,
        y: scoreText.y - 40,
        onComplete: () => {
            game.tweens.add({
                targets: scoreText,
                durations: 100,
                alpha: 0,
                onClomplete: () => {
                    scoreText.destroy();
                }
            });
        }
    });
}

function onHitEnemy(mascotaGesi, enemy) {
    if (mascotaGesi.body.touching.down && enemy.body.touching.up) {
        enemy.anims.play('enemy-muerte', true);
        enemy.setVelocityX(5);
        this.sound.play('matar');
        addToScore(50, enemy, this);

        setTimeout(() => {
            enemy.destroy();
        }, 50);
    } else {
        killgesi(this);
    }
}

function update() {
    if (this.mascotaGesi.isDead) return;

    if (this.keys.left.isDown) {
        this.mascotaGesi.body.touching.down && this.mascotaGesi.anims.play('gesi-walk', true);
        this.mascotaGesi.x -= 2;
        this.mascotaGesi.setVelocityX(-100);
        this.mascotaGesi.flipX = true;
    } else if (this.keys.right.isDown) {
        this.mascotaGesi.body.touching.down && this.mascotaGesi.anims.play('gesi-walk', true);
        this.mascotaGesi.x += 2;
        this.mascotaGesi.setVelocityX(100);
        this.mascotaGesi.flipX = false;
    } else if (this.mascotaGesi.body.touching.down) {
        this.mascotaGesi.anims.play('gesi-idle', true);
        this.mascotaGesi.setVelocityX(0);
    }

    if (this.keys.up.isDown && this.mascotaGesi.body.touching.down) {
        this.mascotaGesi.setVelocityY(-480);
        this.mascotaGesi.anims.play('gesi-salto');
    }

    const deathThreshold = 90;

    if (this.mascotaGesi.y >= config.height - deathThreshold) {
        killgesi(this);
    }


    if (vidas === 0) {
        score = 0;
        this.scoreText.setText(`Puntaje: ${score}`);
        vidas = 3;
        this.vidasText.setText(`Vidas: ${vidas}`);
    }

    if (this.mascotaGesi.x >= config.width - 330) { // Ajusta el valor según tu necesidad
        moveFloorPiece(this.piso2, 390);
    }

    if (this.mascotaGesi.x >= config.width - 330 && this.mascotaGesi.y >= config.height - 188) { // Ajusta el valor según tu necesidad

        if (!this.piso3.visible) {
            this.piso3.setVisible(true); // Mostrar el piso
            console.log('piso3 ha aparecido');
        }

    }
}


function moveFloorPiece(floorPiece, newX) {
    floorPiece.destroy();
    floorPiece.setX(newX);
}

function killgesi(game) {
    const { mascotaGesi, scene, sound } = game;
    if (mascotaGesi.isDead) return;
    mascotaGesi.isDead = true;
    mascotaGesi.anims.play('gesi-muerto');
    mascotaGesi.setCollideWorldBounds(false);
    sound.add('gameover', { volume: 1 }).play();

    vidas -= 1; // Actualiza la puntuación
    game.vidasText.setText(`Vidas: ${vidas}`);

    mascotaGesi.body.checkCollision.none = true;
    mascotaGesi.setVelocityX(0);

    setTimeout(() => {
        mascotaGesi.setVelocityY(-200);
    }, 120);

    setTimeout(() => {
        scene.restart();
    }, 3000);
}
