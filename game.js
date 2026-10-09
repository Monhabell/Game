import { createAnimations } from "./animations.js"
import { monedas } from "./monedas.js"
import { NIVELES, SUELO_Y } from "./niveles.js"

let score = 0; // Variable global para la puntuación
let muertes = 0; // vidas infinitas, como en Cat Mario: solo se cuentan las muertes
let scoreInicioNivel = 0; // al morir el puntaje vuelve a este valor
const FLECHAS_INICIALES = 10;
let flechas = FLECHAS_INICIALES;
const BURLAS = ['¡SORPRESA!', '¿NO LO VISTE VENIR?', '¡JA JA JA!', 'OTRA VEZ...', 'CASI...', '¡TROLLEADO!', 'NO CONFÍES EN NADA'];
let nivelActual = 0; // índice en NIVELES
let checkpointX = null; // último punto de control alcanzado en el nivel actual
const config = {
    type: Phaser.AUTO,
    width: 790,
    height: 380,
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
    this.load.image('suelo_cueva', 'assets/scenery/underground/floorbricks.png');
    this.load.image('suelo2', 'assets/scenery/trap2.png');
    this.load.image('suelo3', 'assets/scenery/piso.png');
    this.load.image('door', 'assets/scenery/door.png');

    // bloques
    this.load.image('ladrillo', 'assets/blocks/overworld/block.png');
    this.load.image('ladrillo_cueva', 'assets/blocks/underground/block.png');
    this.load.image('bloque_duro', 'assets/blocks/overworld/immovableBlock.png');
    this.load.image('bloque_duro_cueva', 'assets/blocks/underground/immovableBlock.png');
    this.load.image('vacio', 'assets/blocks/overworld/emptyBlock.png');
    this.load.image('vacio_cueva', 'assets/blocks/underground/emptyBlock.png');
    this.load.spritesheet('misterio', 'assets/blocks/overworld/misteryBlock.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('misterio_cueva', 'assets/blocks/underground/misteryBlock.png', { frameWidth: 16, frameHeight: 16 });

    // meta
    this.load.image('mastil', 'assets/scenery/flag-mast.png');
    this.load.image('bandera', 'assets/scenery/final-flag.png');
    this.load.image('castillo', 'assets/scenery/castle.png');

    this.load.spritesheet('lava', 'assets/scenery/lava1.png', { frameWidth: 64, frameHeight: 64 });

    this.load.audio('gameover', 'assets/sound/music/gameover.mp3');
    this.load.audio('victoria', 'assets/sound/music/win.wav');
    this.load.audio('musica', 'assets/sound/music/overworld/theme.mp3');
    this.load.audio('musica_cueva', 'assets/sound/music/underground/theme.mp3');
    // cargar enemigos
    this.load.spritesheet('malo', 'assets/entities/underground/Run.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('maloDead', 'assets/Dead.png', { frameWidth: 128, frameHeight: 128 });
    // cargar monedas
    this.load.spritesheet('coins', 'assets/collectibles/coin.png', { frameWidth: 16, frameHeight: 16 });

    // sonido de matar
    this.load.audio('matar', 'assets/sound/effects/matar.wav');
    this.load.audio('moneda', 'assets/sound/effects/coin.mp3');
    this.load.audio('disparo', 'assets/sound/effects/kick.mp3');
    this.load.audio('bump', 'assets/sound/effects/block-bump.wav');
    this.load.audio('romper', 'assets/sound/effects/break-block.wav');

    // bolas de fuego que saltan de la lava
    this.load.spritesheet('bola', 'assets/entities/fireball.png', { frameWidth: 8, frameHeight: 8 });


}

function create() {
    const nivel = NIVELES[nivelActual];
    if (!this.anims.exists('gesi-walk')) createAnimations(this);
    crearTexturas(this);
    this.nivelTerminado = false;
    flechas = FLECHAS_INICIALES;
    this.sufijo = nivel.cueva ? '_cueva' : '';
    this.velEnemigos = nivel.velEnemigos ?? 50;

    crearFondo(this, nivel);

    this.floor = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.lavaes = this.physics.add.group();
    this.lavaesgota = this.physics.add.group();
    // frictionX: 1 hace que Gesi se mueva junto con la plataforma cuando está encima
    this.moviles = this.physics.add.group({ allowGravity: false, immovable: true, frictionX: 1 });
    // trampas
    this.invisibles = this.physics.add.staticGroup(); // bloques invisibles
    this.bolas = this.physics.add.group();
    this.carcajes = this.physics.add.staticGroup();
    this.flechasGrupo = this.physics.add.group({ allowGravity: false });
    this.cayentes = []; // ladrillos que caen
    this.pinchos = [];
    this.emboscadas = [];

    if (nivelActual === 0) construirNivel1(this);
    construirNivel(this, nivel);

    // monedas
    monedas(this, nivel.monedas);

    this.mascotaGesi = this.physics.add.sprite(checkpointX ?? 50, 100, 'mascotaGesi')
        .setScale(1)
        .setCollideWorldBounds(true)// asegura que no salga de los limites del juego
        .setGravityY(480); // aplicar garvedad vertical

    // Recortar la imagen desde la parte superior
    this.mascotaGesi.setCrop(0, 57, this.mascotaGesi.width, this.mascotaGesi.height - 50);

    this.mascotaGesi.body.setSize(20, 69).setOffset(55, 57); // recirde de secmenbto de colicion

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

    this.physics.add.collider(this.mascotaGesi, this.floor, golpearBloque, null, this)
    this.physics.add.collider(this.mascotaGesi, this.moviles)
    this.physics.add.collider(this.lavaes, this.floor)

    // Configurar la colisión entre el jugador y los enemigos
    this.physics.add.collider(this.mascotaGesi, this.enemies, onHitEnemy, null, this);// muerte con enemigo

    this.physics.add.collider(this.mascotaGesi, this.lavaes, onlava, null, this);// muere con lava

    this.physics.add.collider(this.lavaesgota, this.lavaes, salpicar, null, this);
    this.physics.add.collider(this.lavaesgota, this.floor, salpicar, (gota, piso) => !piso.esGotero, this);
    this.physics.add.collider(this.lavaesgota, this.moviles, salpicar, null, this);

    this.physics.add.collider(this.mascotaGesi, this.lavaesgota, onlavagotasgesi, null, this);// muere con lava

    this.physics.add.overlap(this.mascotaGesi, this.coins, collectCoin, null, this);

    // bloques invisibles: solo chocan si Gesi los golpea desde abajo (o si ya aparecieron)
    this.physics.add.collider(this.mascotaGesi, this.invisibles, revelarBloque,
        (g, b) => b.revelado || (g.body.velocity.y < 0 && g.body.top >= b.body.bottom - 12), this);
    this.physics.add.collider(this.enemies, this.invisibles, null, (e, b) => b.revelado);
    this.physics.add.overlap(this.mascotaGesi, this.bolas, () => killgesi(this));
    this.physics.add.overlap(this.mascotaGesi, this.carcajes, recogerCarcaj, null, this);

    // flechas
    this.physics.add.overlap(this.flechasGrupo, this.enemies, (flecha, enemy) => {
        if (enemy.isDead) return;
        flecha.destroy();
        matarEnemigo(this, enemy);
    });
    this.physics.add.collider(this.flechasGrupo, this.floor, flecha => flecha.destroy());
    this.physics.add.collider(this.flechasGrupo, this.moviles, flecha => flecha.destroy());
    this.physics.add.collider(this.flechasGrupo, this.invisibles, flecha => flecha.destroy(), (f, b) => b.revelado);
    this.physics.add.overlap(this.mascotaGesi, this.zonaMeta, completarNivel, null, this);

    this.physics.world.setBounds(0, 0, nivel.ancho, config.height);

    // camara
    this.cameras.main.setBounds(0, 0, nivel.ancho, config.height); // cambiar tamaño de mundo
    this.cameras.main.startFollow(this.mascotaGesi);

    // HUD
    const estiloHud = { fontSize: '16px', fill: '#fff', stroke: '#000', strokeThickness: 3 };
    this.muertesText = this.add.text(20, 15, `Muertes: ${muertes}`, estiloHud)
        .setScrollFactor(0).setDepth(50); // Mantener el texto fijo en la pantalla
    this.scoreText = this.add.text(180, 15, `Puntaje: ${score}`, estiloHud)
        .setScrollFactor(0).setDepth(50);
    this.flechasText = this.add.text(370, 15, `Flechas: ${flechas}`, estiloHud)
        .setScrollFactor(0).setDepth(50);
    this.nivelText = this.add.text(config.width - 20, 15, `Nivel ${nivelActual + 1}/${NIVELES.length}`, estiloHud)
        .setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    mostrarMensaje(this, `NIVEL ${nivelActual + 1}\n${nivel.nombre}`, 2000);

    // música de fondo
    this.musica = this.sound.add(nivel.cueva ? 'musica_cueva' : 'musica', { loop: true, volume: 0.25 });
    this.musica.play();
    this.events.once('shutdown', () => this.musica.destroy());

    this.keys = this.input.keyboard.createCursorKeys();
    this.teclasDisparo = this.input.keyboard.addKeys({ espacio: 'SPACE', x: 'X' });
}

// texturas dibujadas con código (no hay imágenes para estas)
function crearTexturas(scene) {
    if (scene.textures.exists('flecha')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // flecha apuntando a la derecha
    g.fillStyle(0x8b5a2b); g.fillRect(4, 3, 18, 2);
    g.fillStyle(0xe0e0e0); g.fillTriangle(22, 0, 28, 4, 22, 8);
    g.fillStyle(0xff4444); g.fillTriangle(0, 0, 7, 4, 0, 4); g.fillTriangle(0, 8, 7, 4, 0, 4);
    g.generateTexture('flecha', 28, 8);
    g.clear();

    // pinchos
    g.fillStyle(0xd0d0d0); g.lineStyle(1, 0x444444);
    for (let i = 0; i < 2; i++) {
        g.fillTriangle(i * 16, 16, i * 16 + 8, 0, i * 16 + 16, 16);
        g.strokeTriangle(i * 16, 16, i * 16 + 8, 0, i * 16 + 16, 16);
    }
    g.generateTexture('pincho', 32, 16);
    g.clear();

    // carcaj con flechas
    g.fillStyle(0x8b5a2b); g.fillRect(4, 0, 2, 10); g.fillRect(10, 0, 2, 10);
    g.fillStyle(0xff4444); g.fillRect(3, 0, 4, 3); g.fillRect(9, 0, 4, 3);
    g.fillStyle(0x7a3e12); g.fillRoundedRect(2, 8, 12, 18, 3);
    g.fillStyle(0xf2c14e); g.fillRect(2, 14, 12, 2);
    g.generateTexture('carcaj', 16, 26);
    g.destroy();
}

function crearFondo(scene, nivel) {
    const anchofondo = 960;
    const cantidad_fondo = Math.ceil(nivel.ancho / anchofondo) + 1;
    for (let i = 0; i < cantidad_fondo; i++) {
        scene.add.image(450 + (i * anchofondo), 200, 'background').setTint(nivel.tinte ?? 0xffffff);
    }

    if (nivel.nubes) {
        for (let x = 200, i = 0; x < nivel.ancho; x += 550, i++) {
            scene.add.image(x, i % 2 ? 90 : 50, 'cloud1').setScale(0.35).setScrollFactor(0.6).setAlpha(0.9);
        }
    }
}

// Primera parte del nivel 1, hecha a mano
function construirNivel1(scene) {
    let arbol = scene.add.sprite(150, 200, 'arbol');
    arbol.setFrame(0);
    arbol.setScale(2);
    arbol.setFlipX(true);

    let door = scene.add.sprite(1150, 150, 'door');
    door.setFrame(0);
    door.setScale(1);
    door.setFlipX(false);

    let arbol2 = scene.add.sprite(850, 200, 'arbol2');
    arbol2.setFrame(0);
    arbol2.setScale(2);
    arbol2.setFlipX(false);

    let indicacion = scene.add.sprite(150, 320, 'indicacion');
    indicacion.setFrame(0);
    indicacion.setScale(3);
    indicacion.setFlipX(false);

    let arbusto = scene.add.sprite(750, 310, 'arbusto');
    arbusto.setFrame(0);
    arbusto.setScale(2);
    arbusto.setFlipX(false);

    let arbusto2 = scene.add.sprite(850, 310, 'arbusto');
    arbusto2.setFrame(0);
    arbusto2.setScale(2);
    arbusto2.setFlipX(false);

    // Crear las piezas del piso
    scene.floor.create(0, config.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();

    scene.piso2 = scene.floor.create(250, config.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2);
    scene.piso3 = scene.floor.create(250, config.height - 160, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    scene.piso3.setVisible(false);
    scene.piso4 = scene.floor.create(600, config.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    scene.piso5 = scene.floor.create(850, config.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();

    // Crear el muro con rotación y ajustar el tamaño del cuerpo de colisión
    scene.muro = scene.floor.create(1300, config.height - 218, 'suelo')
        .setOrigin(0, 0.5)
        .setScale(4, 3)
        .setAngle(90) // Rota el sprite 90 grados
        .setSize(92, 450).setOffset(18, 15);

    // escalones para alcanzar la plataforma escondida (piso3) y piso6 sin hacer un salto perfecto
    [170, 202, 1000, 1032].forEach(x => {
        scene.floor.create(x, 280, 'ladrillo').setOrigin(0, 0.5).setScale(2).refreshBody();
    });

    scene.piso6 = scene.floor.create(1090, config.height - 155, 'suelo').setOrigin(0, 0.5).setScale(0.9, 2).refreshBody();

    scene.piso7 = scene.floor.create(1450, config.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);
    scene.piso8 = scene.floor.create(1640, config.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);
    scene.piso9 = scene.floor.create(1840, config.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);
    scene.piso10 = scene.floor.create(2050, config.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);

    let cantidadLava = 10;

    // Define la posición inicial de la primera lava
    let posicionXInicial = 1350;//1350

    // El ancho de cada bloque de lava (ajusta según tu imagen)
    let anchoLava = 94; // Por ejemplo, si cada imagen de lava mide 64 píxeles de ancho

    for (let i = 0; i < cantidadLava; i++) {
        // Crear cada bloque de lava en una posición consecutiva
        scene.lavaes.create(posicionXInicial + (i * anchoLava), config.height - 200, 'lava').anims.play('lava_quema', true)
            .setOrigin(0, 0.5)
            .setScale(1.5)
            .setSize(60, 40).setOffset(1, 22)
    }

    // goteros del techo (solo decoración, las gotas se crean con los timers)
    // las gotas caen en los huecos entre plataformas (golpean en x + 31)
    [1579, 1979].forEach(x => {
        const gotero = scene.floor.create(x, config.height - 370, 'lava_falling').setOrigin(0, 0.5).anims.play('lavacaer', true)
            .setScale(0.5).refreshBody()
            .setSize(20, 60).setOffset(55, 1);
        gotero.esGotero = true;
    });

    scene.time.addEvent({ delay: 2400, callback: () => crearGota(scene, 1579), loop: true });
    scene.time.addEvent({ delay: 2700, callback: () => crearGota(scene, 1979), loop: true });

    scene.time.addEvent({
        delay: 5000,    // 5000 ms = 5 segundos
        callback: crearzombis,
        callbackScope: scene,
        loop: true
    });

    // piso para lava
    let cantidadpiso3 = 15;
    let posicionInicialPiso3 = 1350;
    let anchopiso3 = 64;

    for (let i = 0; i < cantidadpiso3; i++) {
        scene.floor.create(posicionInicialPiso3 + (i * anchopiso3), config.height - 10, 'suelo3').setOrigin(0, 0.5).setScale(1).refreshBody()
            .setSize(64, 40).setOffset(0, 18);
    }

    // Número de enemigos que quieres crear
    const numEnemies = 3; // Cambia este valor según lo que necesites

    for (let i = 0; i < numEnemies; i++) {
        crearEnemigo(scene, 690 + i * 80, config.height - 250);
    }
}

// Construye un nivel a partir de los datos de niveles.js
function construirNivel(scene, nivel) {
    const s = scene.sufijo;

    // lava en los huecos (se dibuja antes que el suelo para quedar detrás)
    (nivel.lava || []).forEach(([x0, x1]) => {
        for (let x = x0; x < x1; x += 64) {
            scene.add.sprite(x, SUELO_Y + 20, 'lava').setOrigin(0, 0.5).anims.play('lava_quema', true);
        }
    });

    // pinchos (los ocultos empiezan escondidos bajo el suelo)
    (nivel.pinchos || []).forEach(([x, n, oculto]) => {
        for (let i = 0; i < n; i++) {
            const img = scene.add.image(x + i * 32, oculto ? SUELO_Y + 18 : SUELO_Y, 'pincho').setOrigin(0, 1);
            scene.pinchos.push({ img, oculto, x: x + i * 32 });
        }
    });

    // suelo falso: igual al normal pero se derrumba al pisarlo (con lava debajo)
    (nivel.falsos || []).forEach(([x0, x1]) => {
        for (let x = x0; x < x1; x += 64) {
            scene.add.sprite(x, SUELO_Y + 20, 'lava').setOrigin(0, 0.5).anims.play('lava_quema', true);
        }
        crearSuelo(scene, x0, x1, 'suelo' + s).forEach(t => { t.esFalso = true; });
    });

    (nivel.suelo || []).forEach(([x0, x1]) => crearSuelo(scene, x0, x1, 'suelo' + s));

    (nivel.bloques || []).forEach(([x, y, patron]) => {
        [...patron].forEach((tipo, i) => {
            const bx = x + i * 32;
            if (tipo === '?' || tipo === 'E') {
                const bloque = scene.floor.create(bx, y, 'misterio' + s).setOrigin(0, 0.5).setScale(2).refreshBody();
                bloque.anims.play(`misterio${s}-brillo`, true);
                bloque.esMisterio = true;
                bloque.sueltaEnemigo = tipo === 'E'; // '?' falso: sale un enemigo
            } else if (tipo === 'B') {
                scene.floor.create(bx, y, 'ladrillo' + s).setOrigin(0, 0.5).setScale(2).refreshBody();
            } else if (tipo === 'C') {
                // ladrillo que cae cuando Gesi pasa por debajo
                scene.cayentes.push(scene.floor.create(bx, y, 'ladrillo' + s).setOrigin(0, 0.5).setScale(2).refreshBody());
            } else if (tipo === 'H') {
                // bloque invisible
                scene.invisibles.create(bx, y, 'vacio' + s).setOrigin(0, 0.5).setScale(2).refreshBody().setVisible(false);
            } else if (tipo === 'F') {
                // ladrillo falso: se ve pero no tiene piso
                scene.add.image(bx, y, 'ladrillo' + s).setOrigin(0, 0.5).setScale(2);
            }
        });
    });

    (nivel.escaleras || []).forEach(([x, altura]) => {
        for (let col = 0; col < altura; col++) {
            for (let f = 0; f <= col; f++) {
                scene.floor.create(x + col * 32, SUELO_Y - 16 - f * 32, 'bloque_duro' + s)
                    .setOrigin(0, 0.5).setScale(2).refreshBody();
            }
        }
    });

    (nivel.moviles || []).forEach(([x, y, eje, recorrido, vel]) => {
        const plataforma = scene.moviles.create(x, y, 'suelo' + s);
        plataforma.eje = eje;
        plataforma.vel = vel;
        if (eje === 'x') {
            plataforma.min = x;
            plataforma.max = x + recorrido;
            plataforma.setVelocityX(vel);
        } else {
            plataforma.min = y - recorrido;
            plataforma.max = y;
            plataforma.setVelocityY(-vel);
        }
    });

    (nivel.enemigos || []).forEach(e => {
        const [x, y] = Array.isArray(e) ? e : [e, SUELO_Y - 2];
        crearEnemigo(scene, x, y);
    });

    (nivel.goteros || []).forEach(([x, delay]) => {
        scene.add.sprite(x, config.height - 370, 'lava_falling').setOrigin(0, 0.5).setScale(0.5).anims.play('lavacaer', true);
        scene.time.addEvent({ delay, callback: () => crearGota(scene, x), loop: true });
    });

    // bolas de fuego que saltan de la lava
    (nivel.bolas || []).forEach(([x, delay]) => {
        const bola = scene.bolas.create(x, 400, 'bola').setScale(3).anims.play('bola-giro', true);
        bola.disableBody(true, true);
        scene.time.addEvent({
            delay, loop: true, callback: () => {
                bola.enableBody(true, x, 372, true, true);
                bola.setVelocityY(-400);
            }
        });
    });

    // emboscadas: al pasar por xAviso caen enemigos del cielo
    scene.emboscadas = (nivel.emboscadas || []).map(([xAviso, xs]) => ({ xAviso, xs, hecha: false }));

    (nivel.carcajes || []).forEach(([x, y]) => {
        const c = scene.carcajes.create(x, y, 'carcaj').setScale(1.3).refreshBody();
        scene.tweens.add({ targets: c, y: y - 6, yoyo: true, repeat: -1, duration: 600 });
    });

    // puntos de control: un mástil pequeño con bandera
    scene.checkpoints = (nivel.checkpoints || []).map(x => {
        const mastil = scene.add.image(x, SUELO_Y, 'mastil').setOrigin(0.5, 1).setScale(1, 0.5);
        const bandera = scene.add.image(x - 4, SUELO_Y - 80, 'bandera').setOrigin(1, 0).setScale(1.5).setTint(0x888888);
        const cp = { x, mastil, bandera, activo: checkpointX !== null && x <= checkpointX };
        if (cp.activo) bandera.clearTint();
        return cp;
    });

    // meta: mástil, bandera y castillo
    const mx = nivel.meta;
    scene.add.image(mx, SUELO_Y, 'mastil').setOrigin(0.5, 1);
    scene.bandera = scene.add.image(mx - 6, SUELO_Y - 160, 'bandera').setOrigin(1, 0).setScale(2);
    scene.add.image(mx + 180, SUELO_Y, 'castillo').setOrigin(0.5, 1).setScale(2);
    scene.zonaMeta = scene.add.zone(mx, SUELO_Y / 2, 24, SUELO_Y);
    scene.physics.add.existing(scene.zonaMeta, true);
}

function crearSuelo(scene, x0, x1, textura) {
    const piezas = Math.max(1, Math.round((x1 - x0) / 256));
    const ancho = (x1 - x0) / piezas;
    const tiles = [];
    for (let i = 0; i < piezas; i++) {
        tiles.push(scene.floor.create(x0 + i * ancho, config.height - 16, textura)
            .setOrigin(0, 0.5).setScale(ancho / 128, 2).refreshBody());
    }
    return tiles;
}

function activarCheckpoint(scene, cp) {
    cp.activo = true;
    checkpointX = Math.max(checkpointX ?? 0, cp.x);
    cp.bandera.clearTint();
    scene.tweens.add({ targets: cp.bandera, scale: 2.2, yoyo: true, duration: 200 });
    scene.sound.play('moneda');
    mostrarMensaje(scene, '¡PUNTO DE CONTROL!', 1200);
}

function crearEnemigo(scene, x, y) {
    let enemy = scene.enemies.create(x, y, 'malo').anims.play('enemy-walk', true)
        .setOrigin(0, 1)
        .setGravityY(300)
        .setVelocityX(-scene.velEnemigos)
        .setScale(1);
    enemy.flipX = true;
    enemy.body.setSize(20, 69).setOffset(50, 57); // recirde de secmenbto de colicion
    return enemy;
}

function onlavagotasgesi(mascotaGesi, lavaesgota) {
    killgesi(this);
}

function salpicar(gota) {
    if (gota.salpicando) return;
    gota.salpicando = true;
    gota.body.enable = false;
    gota.anims.play('lavacaergotaSplash', true);
    gota.setScale(0.5);
    this.time.delayedCall(500, () => gota.destroy());
}

function crearGota(scene, x) {
    scene.lavaesgota.create(x, config.height - 342, 'lava_falling')
        .setOrigin(0, 0.5)
        .anims.play('lavacaergota', true)
        .setScale(0.5)
        .refreshBody()
        .setSize(10, 20)
        .setOffset(62, 55);
}

function crearzombis() {
    // no aparecen encima de Gesi y como máximo hay 3 a la vez
    if (Math.abs(this.mascotaGesi.x - 1110) < 300) return;
    this.zombis = (this.zombis || []).filter(z => z.active && !z.isDead);
    if (this.zombis.length >= 3) return;
    this.zombis.push(crearEnemigo(this, 1090, 195));
}

function golpearBloque(mascotaGesi, pieza) {
    const cuerpo = mascotaGesi.body;

    // suelo falso: tiembla y se cae
    if (pieza.esFalso && !pieza.cayendo && cuerpo.touching.down) {
        pieza.cayendo = true;
        this.tweens.add({ targets: pieza, x: pieza.x + 3, yoyo: true, repeat: 2, duration: 40 });
        this.time.delayedCall(180, () => {
            pieza.body.enable = false;
            this.sound.play('romper');
            this.tweens.add({ targets: pieza, y: pieza.y + 300, angle: 15, duration: 700 });
        });
    }

    if (!cuerpo.touching.up && !cuerpo.blocked.up) return;

    // el bloque golpeado es el que está justo encima del centro de Gesi
    // (Phaser puede reportar el choque con el ladrillo de al lado)
    const bloque = this.floor.getChildren().find(b => b.esMisterio && !b.usado &&
        cuerpo.center.x >= b.body.left - 4 && cuerpo.center.x <= b.body.right + 4 &&
        Math.abs(b.body.bottom - cuerpo.top) < 10);
    if (!bloque) return;

    bloque.usado = true;
    bloque.anims.stop();
    bloque.setTexture('vacio' + this.sufijo);
    this.tweens.add({ targets: bloque, y: bloque.y - 8, yoyo: true, duration: 80 });

    if (bloque.sueltaEnemigo) {
        // trampa: en vez de moneda sale un enemigo que va hacia Gesi
        this.sound.play('bump');
        const enemigo = crearEnemigo(this, bloque.x - 50, bloque.y - 16);
        const haciaGesi = mascotaGesi.x < bloque.x ? -1 : 1;
        enemigo.setVelocityX(haciaGesi * this.velEnemigos);
        enemigo.flipX = haciaGesi < 0;
        return;
    }

    const moneda = this.add.sprite(bloque.x + 16, bloque.y - 24, 'coins').setScale(1.5).anims.play('coins-giro', true);
    this.tweens.add({ targets: moneda, y: moneda.y - 40, alpha: 0, duration: 500, onComplete: () => moneda.destroy() });
    this.sound.play('moneda');
    addToScore(100, bloque, this);
}

function revelarBloque(mascotaGesi, bloque) {
    if (bloque.revelado) return;
    bloque.revelado = true;
    bloque.setVisible(true);
    this.sound.play('bump');
    this.tweens.add({ targets: bloque, y: bloque.y - 8, yoyo: true, duration: 80 });
}

function recogerCarcaj(mascotaGesi, carcaj) {
    carcaj.disableBody(true, true);
    flechas += 5;
    this.flechasText.setText(`Flechas: ${flechas}`);
    this.sound.play('moneda');
    mostrarMensaje(this, '+5 FLECHAS', 900);
}

function disparar(scene) {
    if (scene.time.now < (scene.proximoDisparo || 0)) return;
    if (flechas <= 0) {
        if (!scene.avisoSinFlechas) {
            scene.avisoSinFlechas = true;
            mostrarMensaje(scene, '¡SIN FLECHAS!', 900);
            scene.time.delayedCall(1200, () => { scene.avisoSinFlechas = false; });
        }
        return;
    }
    scene.proximoDisparo = scene.time.now + 350;
    flechas--;
    scene.flechasText.setText(`Flechas: ${flechas}`);

    const g = scene.mascotaGesi;
    const dir = g.flipX ? -1 : 1;
    const flecha = scene.flechasGrupo.create(g.body.center.x + dir * 18, g.body.center.y - 8, 'flecha');
    flecha.setFlipX(dir < 0);
    flecha.body.setAllowGravity(false);
    flecha.setVelocityX(dir * 520);
    scene.time.delayedCall(1400, () => flecha.active && flecha.destroy());
    scene.sound.play('disparo', { volume: 0.6 });
}

function matarEnemigo(scene, enemy) {
    enemy.isDead = true;
    enemy.anims.play('enemy-muerte', true);
    scene.sound.play('matar');
    addToScore(150, enemy, scene);
    enemy.setVelocityX(0);
    enemy.body.setSize(20, 0.5).setOffset(50, 128);
    scene.time.delayedCall(5000, () => enemy.destroy());
}

function actualizarTrampas(scene) {
    const g = scene.mascotaGesi.body;
    const rectGesi = new Phaser.Geom.Rectangle(g.left, g.top, g.width, g.height);

    // ladrillos que caen
    scene.cayentes.forEach(c => {
        if (!c.estado) {
            if (g.right > c.body.left - 40 && g.left < c.body.right && g.top > c.body.bottom) {
                c.estado = 'cayendo';
                c.body.enable = false;
                scene.tweens.add({
                    targets: c, y: SUELO_Y - 16, duration: 380, ease: 'Quad.easeIn',
                    onComplete: () => {
                        c.estado = 'caido';
                        c.body.enable = true;
                        c.refreshBody();
                        scene.sound.play('bump');
                    }
                });
            }
        } else if (c.estado === 'cayendo') {
            if (Phaser.Geom.Intersects.RectangleToRectangle(c.getBounds(), rectGesi)) killgesi(scene);
        }
    });

    // pinchos ocultos salen cuando Gesi se acerca
    scene.pinchos.forEach(p => {
        if (p.oculto && !p.salio && g.right > p.x - 50 && g.left < p.x + 82) {
            p.salio = true;
            scene.tweens.add({ targets: p.img, y: SUELO_Y, duration: 70 });
        }
        const arriba = p.img.y <= SUELO_Y + 4;
        if (arriba && g.right > p.x + 4 && g.left < p.x + 28 && g.bottom > SUELO_Y - 14) killgesi(scene);
    });

    // emboscadas
    scene.emboscadas.forEach(e => {
        if (!e.hecha && scene.mascotaGesi.x >= e.xAviso) {
            e.hecha = true;
            e.xs.forEach(x => crearEnemigo(scene, x, 0));
        }
    });
}

function collectCoin(mascotaGesi, coin) {
    coin.disableBody(true, true);
    this.sound.play('moneda');
    addToScore(100, coin, this);
}

function addToScore(scoreToAdd, origin, game) {

    score += scoreToAdd; // Actualiza la puntuación
    game.scoreText.setText(`Puntaje: ${score}`);

    const scoreText = game.add.text(
        origin.x,
        origin.y,
        scoreToAdd, {
        fontSize: config.width / 40
    }
    );

    game.tweens.add({
        targets: scoreText,
        duration: 500,
        y: scoreText.y - 40,
        onComplete: () => {
            game.tweens.add({
                targets: scoreText,
                duration: 100,
                alpha: 0,
                onComplete: () => {
                    scoreText.destroy();
                }
            });
        }
    });
}

function onHitEnemy(mascotaGesi, enemy) {
    // Verificar si el enemigo ya está muerto
    if (enemy.isDead || this.nivelTerminado) return;

    if (mascotaGesi.body.touching.down && enemy.body.touching.up) {
        matarEnemigo(this, enemy);
        mascotaGesi.setVelocityY(-250); // rebote al pisar al enemigo
    } else {
        killgesi(this);
    }
}

function onlava(mascotaGesi, lava) {

    if (mascotaGesi.body.touching.down && lava.body.touching.up) {
        killgesi(this);
    }

}

function completarNivel(mascotaGesi) {
    if (this.nivelTerminado || mascotaGesi.isDead) return;
    this.nivelTerminado = true;

    mascotaGesi.setVelocityX(0);
    mascotaGesi.anims.play('gesi-idle', true);
    this.musica.stop();
    this.sound.play('victoria');
    this.tweens.add({ targets: this.bandera, y: SUELO_Y - 40, duration: 1200 });
    addToScore(1000, mascotaGesi, this);

    const ultimo = nivelActual === NIVELES.length - 1;
    mostrarMensaje(this, ultimo
        ? `¡GANASTE EL JUEGO!\nPuntaje: ${score}\nMuertes: ${muertes}`
        : `¡NIVEL ${nivelActual + 1} COMPLETADO!`);

    this.time.delayedCall(ultimo ? 6000 : 3500, () => {
        if (ultimo) {
            nivelActual = 0;
            score = 0;
            muertes = 0;
        } else {
            nivelActual++;
        }
        scoreInicioNivel = score;
        checkpointX = null;
        this.scene.restart();
    });
}

function mostrarMensaje(scene, texto, duracion) {
    const mensaje = scene.add.text(config.width / 2, config.height / 2 - 40, texto, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '20px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 6,
        align: 'center',
        lineSpacing: 12
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    if (duracion) {
        scene.time.delayedCall(duracion, () => {
            scene.tweens.add({ targets: mensaje, alpha: 0, duration: 500, onComplete: () => mensaje.destroy() });
        });
    }
}

function actualizarMundo(scene) {
    // plataformas móviles: cambian de sentido al llegar al final de su recorrido
    scene.moviles.getChildren().forEach(p => {
        if (p.eje === 'x') {
            if (p.x >= p.max) p.setVelocityX(-p.vel);
            else if (p.x <= p.min) p.setVelocityX(p.vel);
        } else {
            if (p.y <= p.min) p.setVelocityY(p.vel);
            else if (p.y >= p.max) p.setVelocityY(-p.vel);
        }
    });

    // enemigos: dan la vuelta al chocar con una pared y desaparecen si caen
    scene.enemies.getChildren().slice().forEach(enemy => {
        if (enemy.y > config.height + 150 || enemy.x < -200) {
            enemy.destroy();
            return;
        }
        if (enemy.isDead) return;
        if (enemy.body.blocked.left) {
            enemy.setVelocityX(scene.velEnemigos);
            enemy.flipX = false;
        } else if (enemy.body.blocked.right) {
            enemy.setVelocityX(-scene.velEnemigos);
            enemy.flipX = true;
        }
    });

    scene.lavaesgota.getChildren().slice().forEach(gota => {
        if (gota.y > config.height + 50) gota.destroy();
    });

    scene.bolas.getChildren().forEach(bola => {
        if (!bola.active) return;
        bola.flipY = bola.body.velocity.y > 0;
        if (bola.body.velocity.y > 0 && bola.y > 390) bola.disableBody(true, true);
    });
}

function trampasNivel1(scene) {
    if (scene.mascotaGesi.x >= config.width - 400 && scene.piso2.active) { // Ajusta el valor según tu necesidad
        moveFloorPiece(scene.piso2, 390);
    }

    if (scene.mascotaGesi.x >= 190 && scene.mascotaGesi.y <= 210) {
        if (!scene.piso3.visible) {
            scene.piso3.setVisible(true); // Mostrar el piso
        }
    }

    // la segunda plataforma sobre la lava tiembla y se cae poco después de pisarla
    const g = scene.mascotaGesi.body, p8 = scene.piso8;
    if (!p8.cayendo && g.touching.down && Math.abs(g.bottom - p8.body.top) < 4 &&
        g.right > p8.body.left && g.left < p8.body.right) {
        p8.cayendo = true;
        scene.tweens.add({ targets: p8, x: p8.x + 3, yoyo: true, repeat: 7, duration: 60 });
        scene.time.delayedCall(1500, () => {
            p8.body.enable = false;
            scene.tweens.add({ targets: p8, y: p8.y + 250, alpha: 0, duration: 700 });
        });
    }
}

function update() {
    actualizarMundo(this);

    if (this.mascotaGesi.isDead) return;

    if (this.nivelTerminado) {
        this.mascotaGesi.setVelocityX(0);
        return;
    }

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

    if (Phaser.Input.Keyboard.JustDown(this.teclasDisparo.espacio) || Phaser.Input.Keyboard.JustDown(this.teclasDisparo.x)) {
        disparar(this);
    }

    if (this.keys.up.isDown && this.mascotaGesi.body.touching.down) {
        this.mascotaGesi.setVelocityY(-480);
        this.mascotaGesi.anims.play('gesi-salto');
    }

    const deathThreshold = 90;

    if (this.mascotaGesi.y >= 390 - deathThreshold) { // linea para matar si cae por fuera de el area de jeugo
        killgesi(this);
    }

    if (nivelActual === 0) trampasNivel1(this);
    actualizarTrampas(this);

    // puntos de control
    this.checkpoints.forEach(cp => {
        if (!cp.activo && this.mascotaGesi.x >= cp.x) activarCheckpoint(this, cp);
    });
}


function moveFloorPiece(floorPiece, newX) {
    floorPiece.destroy();
    floorPiece.setX(newX);
}

function killgesi(game) {
    const { mascotaGesi, scene, sound } = game;
    if (mascotaGesi.isDead || game.nivelTerminado) return;
    mascotaGesi.isDead = true;
    mascotaGesi.anims.play('gesi-muerto');
    mascotaGesi.setCollideWorldBounds(false);
    game.musica.stop();
    sound.add('gameover', { volume: 1 }).play();

    muertes += 1;
    game.muertesText.setText(`Muertes: ${muertes}`);
    score = scoreInicioNivel;

    mascotaGesi.body.checkCollision.none = true;
    mascotaGesi.setVelocityX(0);

    game.time.delayedCall(120, () => mascotaGesi.setVelocityY(-200));

    mostrarMensaje(game, BURLAS[Math.floor(Math.random() * BURLAS.length)], 1600);

    // vuelve a aparecer en el último punto de control
    game.time.delayedCall(2200, () => scene.restart());
}
