import { createAnimations } from "./animations.js"
import { monedas } from "./monedas.js"

let score = 0; // Variable global para la puntuación
let vidas = 3;
const config = {
    type: Phaser.AUTO,
    width: 650,
    height: 380,
    backgroundColor: '#049cd8',
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: true
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

    this.load.image('background', 'assets/fondo.png');
    this.load.image('cloud1', 'assets/scenery/overworld/cloud1.png');
    //this.load.spritesheet('mascotaGesi', 'assets/mascotaGesi1.png', { frameWidth: 41.6, frameHeight: 56 });
    this.load.spritesheet('mascotaGesi', 'assets/mascotaGesiFinal.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('mascotaGesiload', 'assets/mascotaload.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('saltar', 'assets/saltar.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('arbol', 'assets/scenery/arbol1.png', { frameWidth: 208, frameHeight: 191 });
    this.load.spritesheet('arbol2', 'assets/scenery/arbol2.png', { frameWidth: 208, frameHeight: 191 });

    this.load.spritesheet('indicacion', 'assets/scenery/1.png', { frameWidth: 208, frameHeight: 191 });

    this.load.spritesheet('arbusto', 'assets/scenery/arbusto.png', { frameWidth: 208, frameHeight: 191 });

    this.load.spritesheet('lava_falling', 'assets/scenery/lava_callendo.png', {
        frameWidth: 126,  // Ajusta según el ancho de cada frame en la hoja de sprites
        frameHeight: 129  // Ajusta según la altura de cada frame en la hoja de sprites
    });







    this.load.image('suelo', 'assets/scenery/overworld/floorbricks.png');
    this.load.image('suelo2', 'assets/scenery/trap2.png');
    this.load.image('suelo3', 'assets/scenery/piso.png');
    this.load.image('door', 'assets/scenery/door.png');

    this.load.spritesheet('lava', 'assets/scenery/lava1.png', { frameWidth: 64, frameHeight: 64 });

    this.load.audio('gameover', 'assets/sound/music/gameover.mp3');
    // cargar enemigos
    this.load.spritesheet('malo', 'assets/entities/underground/Run.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('maloDead', 'assets/Dead.png', { frameWidth: 128, frameHeight: 128 });
    // cargar monedas
    this.load.spritesheet('coins', 'assets/collectibles/coin.png', { frameWidth: 16, frameHeight: 16 });

    // sonido de matar
    this.load.audio('matar', 'assets/sound/effects/matar.wav');
    this.load.audio('moneda', 'assets/sound/effects/coin.mp3');


}

function create() {
    createAnimations(this);
    let cantidad_fondo = 10;

    // Define la posición inicial de la primera lava
    let inical = 450;//1350

    // El ancho de cada bloque de lava (ajusta según tu imagen)
    let anchofondo = 960; // Por ejemplo, si cada imagen de lava mide 64 píxeles de ancho

    for (let i = 0; i < cantidad_fondo; i++) {
        // Crear cada bloque de lava en una posición consecutiva
        this.lava = this.add.image(inical + (i * anchofondo), 200, 'background')
            .setScale(1)
        //.setSize(64, 64).setOffset(35, 15)
        //.refreshBody();
    }

    let arbol = this.add.sprite(150, 200, 'arbol');
    arbol.setFrame(0);
    arbol.setScale(2);
    arbol.setFlipX(true);

    let door = this.add.sprite(1150, 150, 'door');
    door.setFrame(0);
    door.setScale(1);
    door.setFlipX(false);

    let arbol2 = this.add.sprite(850, 200, 'arbol2');
    arbol2.setFrame(0);
    arbol2.setScale(2);
    arbol2.setFlipX(false);

    let indicacion = this.add.sprite(150, 320, 'indicacion');
    indicacion.setFrame(0);
    indicacion.setScale(3);
    indicacion.setFlipX(false);


    let arbusto = this.add.sprite(750, 310, 'arbusto');
    arbusto.setFrame(0);
    arbusto.setScale(2);
    arbusto.setFlipX(false);

    let arbusto2 = this.add.sprite(850, 310, 'arbusto');
    arbusto2.setFrame(0);
    arbusto2.setScale(2);
    arbusto2.setFlipX(false);

    this.scoreText = this.add.text(180, 20, `Puntaje: ${score}`, { fontSize: '20px', fill: '#fff' });
    this.scoreText.setScrollFactor(0); // Mantener el texto fijo en la pantalla

    this.vidasText = this.add.text(50, 20, `Vidas: ${vidas}`, { fontSize: '20px', fill: '#fff' });
    this.vidasText.setScrollFactor(0); // Mantener el texto fijo en la pantalla


    this.floor = this.physics.add.staticGroup();

    // Crear las piezas del piso
    this.floor.create(0, config.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody().refreshBody();

    this.piso2 = this.floor.create(250, config.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2);
    this.piso3 = this.floor.create(250, config.height - 160, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    this.piso3.setVisible(false);
    this.piso4 = this.floor.create(600, config.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    this.piso5 = this.floor.create(850, config.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();


    // Crear el muro con rotación y ajustar el tamaño del cuerpo de colisión
    this.muro = this.floor.create(1300, config.height - 218, 'suelo')
        .setOrigin(0, 0.5)
        .setScale(4, 3)
        .setAngle(90) // Rota el sprite 90 grados
        .setSize(92, 450).setOffset(18, 15);
    // .refreshBody(); // Aplica los cambios al cuerpo físico


    this.piso6 = this.floor.create(1090, config.height - 155, 'suelo').setOrigin(0, 0.5).setScale(0.9, 2).refreshBody();

    this.piso7 = this.floor.create(1450, config.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);
    this.piso8 = this.floor.create(1640, config.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);
    this.piso9 = this.floor.create(1840, config.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);






    this.lavaes = this.physics.add.group();


    let cantidadLava = 10;

    // Define la posición inicial de la primera lava
    let posicionXInicial = 1350;//1350

    // El ancho de cada bloque de lava (ajusta según tu imagen)
    let anchoLava = 94; // Por ejemplo, si cada imagen de lava mide 64 píxeles de ancho

    for (let i = 0; i < cantidadLava; i++) {
        // Crear cada bloque de lava en una posición consecutiva
        this.lavaes.create(posicionXInicial + (i * anchoLava), config.height - 200, 'lava').anims.play('lava_quema', true)
            .setOrigin(0, 0.5)
            .setScale(1.5)
            .setSize(60, 40).setOffset(1, 22)
        //.refreshBody();
    }

    this.lavaesgota = this.physics.add.group();


    this.lavacaer = this.floor.create(1450, config.height - 370, 'lava_falling').setOrigin(0, 0.5).anims.play('lavacaer', true)
        .setScale(0.5).refreshBody()
        .setSize(20, 60).setOffset(55, 1);


    this.lavacaer = this.floor.create(1650, config.height - 370, 'lava_falling').setOrigin(0, 0.5).anims.play('lavacaer', true)
        .setScale(0.5).refreshBody()
        .setSize(20, 60).setOffset(55, 1);

    this.lavacaer = this.floor.create(1780, config.height - 370, 'lava_falling').setOrigin(0, 0.5).anims.play('lavacaer', true)
        .setScale(0.5).refreshBody()
        .setSize(20, 60).setOffset(55, 1);

    this.time.addEvent({
        delay: 1250,    // 2000 ms = 2 segundos
        callback: crearGotaDeLava3,
        callbackScope: this,
        loop: true
    });

    this.time.addEvent({
        delay: 1200,    // 2000 ms = 2 segundos
        callback: crearGotaDeLava,
        callbackScope: this,
        loop: true
    });

    this.time.addEvent({
        delay: 1300,    // 2000 ms = 2 segundos
        callback: crearGotaDeLava2,
        callbackScope: this,
        loop: true
    });


    this.time.addEvent({
        delay: 3000,    // 2000 ms = 2 segundos
        callback: crearzombis,
        callbackScope: this,
        loop: true
    });


    // piso para lava
    let cantidadpiso3 = 10;
    let posicionInicialPiso3 = 1350;
    let anchopiso3 = 64;

    for (let i = 0; i < cantidadpiso3; i++) {
        this.pisolava = this.floor.create(posicionInicialPiso3 + (i * anchopiso3), config.height - 10, 'suelo3').setOrigin(0, 0.5).setScale(1).refreshBody()
            .setSize(64, 40).setOffset(0, 18);
    }


    this.mascotaGesi = this.physics.add.sprite(50, 100, 'mascotaGesi')
        .setScale(1)
        .setCollideWorldBounds(true)// asegura que no salga de los limites del juego
        .setGravityY(480); // aplicar garvedad vertical



    // Recortar la imagen desde la parte superior
    this.mascotaGesi.setCrop(0, 57, this.mascotaGesi.width, this.mascotaGesi.height - 50);

    this.mascotaGesi.body.setSize(20, 69).setOffset(55, 57); // recirde de secmenbto de colicion

    // Crear un grupo de enemigos
    this.enemies = this.physics.add.group();

    // Número de enemigos que quieres crear
    const numEnemies = 3; // Cambia este valor según lo que necesites

    for (let i = 0; i < numEnemies; i++) {
        // Crear un enemigo
        let enemy = this.enemies.create(690 + i * 80, config.height - 250, 'malo').anims.play('enemy-walk', true)
            .setOrigin(0, 1)
            .setGravityY(300)
            .setVelocityX(-50)
            .setScale(1);
        enemy.flipX = true;
        enemy.body.setSize(20, 69).setOffset(50, 57); // recirde de secmenbto de colicion
    }

    // Hacer que todos los enemigos colisionen con el suelo
    this.physics.add.collider(this.enemies, this.floor);

    this.physics.add.collider(this.enemies, this.enemies, (enemy1, enemy2) => {
        // Cambiar la dirección de ambos enemigos invirtiendo su velocidad
        enemy1.setVelocityX(-enemy1.body.velocity.x);
        enemy2.setVelocityX(-enemy2.body.velocity.x);

        // Cambiar la dirección visual (flip) dependiendo de la nueva dirección de la velocidad
        enemy1.flipX = enemy1.body.velocity.x < 0;  // Flip si se mueve hacia la izquierda
        enemy2.flipX = enemy2.body.velocity.x < 0;  // Flip si se mueve hacia la izquierda
    });



    this.physics.add.collider(this.mascotaGesi, this.floor)
    this.physics.add.collider(this.lavaes, this.floor)

    // Configurar la colisión entre el jugador y los enemigos
    this.physics.add.collider(this.mascotaGesi, this.enemies, onHitEnemy, null, this);// muerte con enemigo

    this.physics.add.collider(this.mascotaGesi, this.lavaes, onlava, null, this);// muere con lava

    this.physics.add.collider(this.lavaesgota, this.lavaes, onlavagotas, null, this);// muere con lava

    this.physics.add.collider(this.mascotaGesi, this.lavaesgota, onlavagotasgesi, null, this);// muere con lava

    // monedas    
    monedas(this);
    this.physics.add.overlap(this.mascotaGesi, this.coins, collectCoin, null, this);
    this.physics.add.world.setBounds(0, 0, 4000, 380);

    // camara
    this.cameras.main.setBounds(0, 0, 4000, 380); // cambiar tamaño de mundo 
    this.cameras.main.startFollow(this.mascotaGesi);

    this.keys = this.input.keyboard.createCursorKeys();
}

function onlavagotasgesi(mascotaGesi, lavaesgota) {
    if (mascotaGesi.body.touching.down && lavaesgota.body.touching.up) {
        killgesi(this);
    } else {
        killgesi(this);
    }
}


function onlavagotas(lavaesgotas, lavaes) {
    if (lavaesgotas.body.touching.down && lavaes.body.touching.up) {

        lavaesgotas.anims.play('lavacaergotaSplash', true)
        lavaesgotas.setScale(0.5)
        setTimeout(() => {
            lavaesgotas.destroy();
        }, 500);
    }
}


function crearGotaDeLava() {
    this.lavaesgota.create(1650, config.height - 342, 'lava_falling')
        .setOrigin(0, 0.5)
        .anims.play('lavacaergota', true)
        .setScale(0.5)
        .refreshBody()
        .setSize(10, 20)
        .setOffset(62, 55);
}


function crearGotaDeLava2() {
    this.lavaesgota.create(1780, config.height - 342, 'lava_falling')
        .setOrigin(0, 0.5)
        .anims.play('lavacaergota', true)
        .setScale(0.5)
        .refreshBody()
        .setSize(10, 20)
        .setOffset(62, 55);
}


function crearGotaDeLava3() {
    this.lavaesgota.create(1450, config.height - 342, 'lava_falling')
        .setOrigin(0, 0.5)
        .anims.play('lavacaergota', true)
        .setScale(0.5)
        .refreshBody()
        .setSize(10, 20)
        .setOffset(62, 55);
}


function crearzombis() {

    let enemy = this.enemies.create(1090, 195, 'malo').anims.play('enemy-walk', true)
        .setOrigin(0, 1)
        .setGravityY(300)
        .setVelocityX(-50)
        .setScale(1);
    enemy.flipX = true;
    enemy.body.setSize(20, 69).setOffset(50, 57); // recirde de secmenbto de colicion

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
    // Verificar si el enemigo ya está muerto
    if (enemy.isDead) return;

    if (mascotaGesi.body.touching.down && enemy.body.touching.up) {
        // Marcar al enemigo como muerto
        enemy.isDead = true;

        enemy.anims.play('enemy-muerte', true);
        enemy.setVelocityX(5);
        this.sound.play('matar');
        addToScore(150, enemy, this);

        enemy.body.checkCollision.none = false;
        enemy.setVelocityX(0);
        enemy.body.setSize(20, 0.5).setOffset(50, 128);

        setTimeout(() => {
            enemy.destroy();
        }, 5000);
    } else {
        killgesi(this);
    }
}

function onlava(mascotaGesi, lava) {

    if (mascotaGesi.body.touching.down && lava.body.touching.up) {
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

    if (this.mascotaGesi.y >= 390 - deathThreshold) { // linea para matar si cae por fuera de el area de jeugo
        killgesi(this);
    }


    if (vidas === 0) {
        score = 0;
        this.scoreText.setText(`Puntaje: ${score}`);
        vidas = 3;
        this.vidasText.setText(`Vidas: ${vidas}`);
    }

    if (this.mascotaGesi.x >= config.width - 400) { // Ajusta el valor según tu necesidad
        moveFloorPiece(this.piso2, 390);
    }

    let posX = this.mascotaGesi.x;
    let posY = this.mascotaGesi.y;

    // Obtener las dimensiones del área de juego
    let gameWidth = config.width;
    let gameHeight = config.height;

    // Calcular las relaciones
    let relativeX = posX / gameWidth;
    let relativeY = posY / gameHeight;

    // Imprimir las posiciones y relaciones en la consola
    console.log("x " + this.mascotaGesi.x);
    console.log("y " + this.mascotaGesi.y);


    if (this.mascotaGesi.x >= 190 && this.mascotaGesi.y <= 210) {
        console.log()
        if (!this.piso3.visible) {
            this.piso3.setVisible(true); // Mostrar el piso
            console.log('piso3 ha aparecido');
        }
    }

    if (this.mascotaGesi.x >= 1610 && this.mascotaGesi.y <= 210) {
        this.piso8.setX(1550);
        this.piso8.setSize(80, 60).setOffset(-62, 35);


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
