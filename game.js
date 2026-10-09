import { createAnimations } from "./animations.js"
import { monedas } from "./monedas.js"
import { NIVELES, SUELO_Y } from "./niveles.js"
import { PERSONAJES, MANA_MAXIMO, cargarPersonajes, crearAnimacionesPersonajes } from "./personajes.js"
import { ENEMIGOS, cargarEnemigos, crearAnimacionesEnemigos } from "./enemigos.js"
import { crearAmbiente, crearFondoAtmosferico, actualizarAmbiente, crearNieblaSeleccion, moverNieblaSeleccion } from "./ambiente.js"
import { cargarCastillos, crearCastilloMeta } from "./castillos.js"
import {
    cargarMazmorra, crearAnimacionesMazmorra, vestirSuelo, vestirMuro, crearLava, moverLava,
    decorarNivel, crearEstatua, encenderEstatua
} from "./mazmorra.js"
import { crearSorpresas, actualizarSorpresas, pisarMordedora, monedaTrampa } from "./sorpresas.js"
import { aleatorizarNivel, iniciarCorazonesAlAzar, iniciarEscudosAlAzar, soltarCorazon } from "./azar.js"
import { cargarJefes, crearAnimacionesJefes, prepararJefe, actualizarJefe, golpearJefeEnZona, jefeBloqueaMeta } from "./jefes.js"
import { cargarSonidos, sonarCerca } from "./sonidos.js"
import { crearMapa, actualizarMapa } from "./mapa.js"
import {
    cargarEscudo, crearAnimacionesEscudo, crearEscudo, actualizarEscudo, estaInvulnerable, romperEscudo, recuperarEscudo, soltarEscudo
} from "./escudo.js"

// funciones que usa el jefe (jefes.js)
const apiJefe = {
    killgesi: (scene, daño) => killgesi(scene, undefined, daño),
    mostrarMensaje: (...a) => mostrarMensaje(...a),
    addToScore: (...a) => addToScore(...a),
    soltarEscudo: (...a) => soltarEscudo(...a),
};

// funciones que usan las trampas sorpresa (sorpresas.js)
const apiSorpresas = { killgesi: (scene) => killgesi(scene), crearEnemigo: (...a) => crearEnemigo(...a), mostrarMensaje: (...a) => mostrarMensaje(...a) };

let score = 0; // Variable global para la puntuación
const VIDAS_INICIALES = 4;
let vidas = VIDAS_INICIALES; // se muestran como corazones; al acabarse se vuelve al inicio del juego
let scoreInicioNivel = 0; // al morir el puntaje vuelve a este valor
const FLECHAS_INICIALES = 10;
let flechas = FLECHAS_INICIALES;
let personajeId = 'arquera'; // personaje elegido en la pantalla de selección
const BURLAS = ['¡SORPRESA!', '¿NO LO VISTE VENIR?', '¡JA JA JA!', 'OTRA VEZ...', 'CASI...', '¡TROLLEADO!', 'NO CONFÍES EN NADA'];
let nivelActual = 0; // índice en NIVELES
let checkpointX = null; // último punto de control alcanzado en el nivel actual
let vidaJefeGuardada = null; // { nivel, vida }: el daño hecho al jefe se mantiene si mueres con vidas
const SALUD_MAXIMA = 100; // barra de vida del jugador durante la pelea con el jefe
// El juego mide 790x380 "por dentro" (física, niveles, HUD), pero se dibuja al doble
// (1580x760) con la cámara en zoom x2: así se ve nítido aunque la pantalla sea grande.
const ZOOM = 2;
const VISTA = { width: 790, height: 380 };

// los textos se dibujan con la misma resolución para que no se vean borrosos
const fabricaTexto = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, texto, estilo) {
    return fabricaTexto.call(this, x, y, texto, { resolution: ZOOM, ...estilo });
};

const config = {
    type: Phaser.AUTO,
    width: VISTA.width * ZOOM,
    height: VISTA.height * ZOOM,
    backgroundColor: '#05070f',
    parent: 'game',
    // el juego se escala para llenar su contenedor sin deformarse (botón agrandar y pantalla completa)
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: VISTA.width * ZOOM,
        height: VISTA.height * ZOOM,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [
        // primero la pantalla para elegir personaje (también carga todos los recursos)
        { key: 'seleccion', preload, create: crearSeleccion, update: actualizarSeleccion },
        { key: 'juego', create, update },
        // mapa del mundo entre un nivel y el siguiente
        {
            key: 'mapa',
            create(data) {
                crearMapa(this, { ...data, personaje: personajeId, vidas, maxVidas: VIDAS_INICIALES, score, zoom: ZOOM });
            },
            update(time) { actualizarMapa(this, time); },
        }
    ]
}

const juego = new Phaser.Game(config)

// botones de la página: agrandar (tecla G) y pantalla completa (tecla F); Esc sale
const botonAgrandar = document.getElementById('btn-agrandar');
function agrandar(activar) {
    const activo = document.body.classList.toggle('modo-grande', activar);
    botonAgrandar?.setAttribute('aria-pressed', String(activo));
    if (botonAgrandar) botonAgrandar.textContent = activo ? '⤡ Achicar' : '⤢ Agrandar';
}
// cada vez que cambia el tamaño del contenedor, el juego se reajusta para llenarlo
if (window.ResizeObserver) {
    new ResizeObserver(() => {
        juego.scale.getParentBounds(); // vuelve a medir el contenedor
        juego.scale.refresh();
    }).observe(document.getElementById('game'));
}
botonAgrandar?.addEventListener('click', e => { agrandar(); e.currentTarget.blur(); });
document.getElementById('btn-pantalla-completa')?.addEventListener('click', e => { juego.scale.toggleFullscreen(); e.currentTarget.blur(); });

// borrar el progreso y volver a la pantalla de selección para empezar desde el nivel 1
function reiniciarDesdeCero() {
    borrarPartida();
    reiniciarPartida();
    juego.scene.getScenes(true).forEach(s => juego.scene.stop(s.scene.key));
    juego.scene.start('seleccion');
}
document.getElementById('btn-reiniciar')?.addEventListener('click', e => {
    e.currentTarget.blur(); // que ESPACIO no vuelva a apretar el botón mientras juegas
    if (window.confirm('¿Borrar el progreso guardado y empezar desde el nivel 1?')) reiniciarDesdeCero();
});
document.addEventListener('keydown', e => {
    if (e.repeat) return;
    const tecla = e.key.toLowerCase();
    if (tecla === 'f') juego.scale.toggleFullscreen();
    else if (tecla === 'g') agrandar();
    else if (e.key === 'Escape' && document.body.classList.contains('modo-grande')) agrandar(false);
});

function preload() {

    this.load.image('background', 'assets/fondo.png');
    this.load.image('cloud1', 'assets/scenery/overworld/cloud1.png');
    // personajes jugables (arquera, espadachín y mago)
    cargarPersonajes(this);
    cargarEnemigos(this);
    cargarCastillos(this);
    cargarMazmorra(this);



    this.load.spritesheet('lava_falling', 'assets/scenery/lava_callendo.png', {
        frameWidth: 126,  // Ajusta según el ancho de cada frame en la hoja de sprites
        frameHeight: 129  // Ajusta según la altura de cada frame en la hoja de sprites
    });

    this.load.image('suelo', 'assets/scenery/overworld/floorbricks.png');
    this.load.image('suelo_cueva', 'assets/scenery/underground/floorbricks.png');
    this.load.image('suelo2', 'assets/scenery/trap2.png');
    this.load.image('suelo3', 'assets/scenery/piso.png');

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

    // música y efectos de aventura originales (assets/sound/aventura)
    this.load.audio('gameover', 'assets/sound/aventura/muerte.mp3');
    this.load.audio('victoria', 'assets/sound/aventura/victoria.mp3');
    this.load.audio('musica', 'assets/sound/aventura/musica_aventura.mp3');
    this.load.audio('musica_cueva', 'assets/sound/aventura/musica_cueva.mp3');
    this.load.audio('musica_batalla', 'assets/sound/aventura/musica_batalla.mp3');
    // cargar enemigos
    this.load.spritesheet('malo', 'assets/entities/underground/Run.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('maloDead', 'assets/Dead.png', { frameWidth: 128, frameHeight: 128 });
    // cargar monedas
    // (las monedas se cargan en cargarMazmorra)

    // sonido de matar
    this.load.audio('matar', 'assets/sound/aventura/matar.mp3');
    this.load.audio('moneda', 'assets/sound/aventura/moneda.mp3');
    this.load.audio('disparo', 'assets/sound/aventura/disparo.mp3');
    this.load.audio('bump', 'assets/sound/aventura/bump.mp3');
    this.load.audio('romper', 'assets/sound/aventura/romper.mp3');
    this.load.audio('aparece', 'assets/sound/aventura/aparece.mp3');
    cargarEscudo(this);
    cargarJefes(this);
    cargarSonidos(this);

    // bolas de fuego que saltan de la lava
    this.load.spritesheet('bola', 'assets/entities/fireball.png', { frameWidth: 8, frameHeight: 8 });


}

function create() {
    // las trampas se reparten al azar en cada intento (no se pueden memorizar);
    // en el nivel 1 la primera parte hecha a mano no se toca
    const nivel = aleatorizarNivel(NIVELES[nivelActual], nivelActual, nivelActual === 0 ? [[600, 1106]] : []);
    guardarPartida(); // para no tener que volver al inicio
    prepararAnimaciones(this);
    this.nivelTerminado = false;
    this.pj = PERSONAJES.find(pj => pj.id === personajeId);
    flechas = FLECHAS_INICIALES;
    this.mana = MANA_MAXIMO;
    this.enfriamientos = {};
    this.atacando = false;
    this.dashHasta = 0;
    this.escudoHasta = 0;
    this.tieneEscudo = true; // cada vida empieza con escudo (aguanta un golpe)
    this.saltosAire = 0;
    this.sufijo = nivel.cueva ? '_cueva' : '';
    this.velEnemigos = nivel.velEnemigos ?? 50;
    // enemigos que caminan en este nivel (se van turnando)
    this.mezcla = nivel.mezcla || ['zombie1', 'zombie2', 'zombie3'];
    this.contEnemigos = 0;

    crearFondo(this, nivel);

    // estalactitas, hongos, antorchas y la puerta de entrada (detrás de todo lo jugable)
    const rangosSuelo = [...(nivel.suelo || []), ...(nivelActual === 0 ? [[0, 1106]] : [])];
    decorarNivel(this, nivel, nivelActual, x => rangosSuelo.some(([a, b]) => x > a + 40 && x < b - 40));

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
    this.premios = this.physics.add.staticGroup();
    this.flechasGrupo = this.physics.add.group({ allowGravity: false });
    this.balasEnemigas = this.physics.add.group({ allowGravity: false });
    this.cayentes = []; // ladrillos que caen
    this.pinchos = [];
    this.emboscadas = [];

    if (nivelActual === 0) construirNivel1(this);
    construirNivel(this, nivel);

    // monedas
    monedas(this, nivel.monedas);

    // carteles, monedas trampa, rocas, estatuas falsas, plataformas que muerden, banderas falsas y gigantes
    crearSorpresas(this, nivel, checkpointX ?? 0);

    // corazones que aparecen al azar cuando te faltan vidas
    this.mostrarMensajeCorto = texto => mostrarMensaje(this, texto, 900);
    iniciarCorazonesAlAzar(this, () => vidas < VIDAS_INICIALES, nivel.ancho);
    iniciarEscudosAlAzar(this, soltarEscudo, nivel.ancho);

    // jefe al final del nivel
    this.peleaJefe = false;
    this.limiteDerecho = null;
    this.protegido = () => protegido(this);
    this.reaparecerEnArena = x => { checkpointX = Math.max(checkpointX ?? 0, x); };
    // al empezar la pelea: flechas y maná llenos para poder usar los poderes contra el jefe
    this.recargarParaJefe = () => {
        flechas = Math.max(flechas, 20);
        this.mana = MANA_MAXIMO;
        actualizarRecurso(this);
    };
    this.vidaJefeInicial = vidaJefeGuardada && vidaJefeGuardada.nivel === nivelActual ? vidaJefeGuardada.vida : null;
    this.guardarVidaJefe = v => { vidaJefeGuardada = { nivel: nivelActual, vida: v }; };
    this.salud = SALUD_MAXIMA;
    this.barraSalud = this.barraSaludFondo = this.textoSalud = null;
    this.mostrarBarraSalud = () => crearBarraSalud(this);
    this.soltarCorazonArena = (x, y) => soltarCorazon(this, x, y);
    this.faltaSalud = () => this.salud < SALUD_MAXIMA || vidas < VIDAS_INICIALES;
    prepararJefe(this, nivel, nivelActual);

    // con una sola vida se escucha un latido
    this.time.addEvent({
        delay: 1300, loop: true, callback: () => {
            if (vidas === 1 && !this.mascotaGesi.isDead && !this.nivelTerminado) this.sound.play('latido', { volume: 0.45 });
        }
    });

    this.mascotaGesi = this.physics.add.sprite(checkpointX ?? 50, 100, `${this.pj.id}-idle`)
        .setScale(1)
        .setCollideWorldBounds(true)// asegura que no salga de los limites del juego
        .setGravityY(480); // aplicar garvedad vertical

    // Recortar la imagen desde la parte superior
    this.mascotaGesi.setCrop(0, 57, this.mascotaGesi.width, this.mascotaGesi.height - 50);

    this.mascotaGesi.body.setSize(20, 69).setOffset(55, 57); // recirde de secmenbto de colicion
    // el personaje se dibuja delante de la niebla (capas 30-33) pero detrás de la oscuridad (40)
    this.mascotaGesi.setDepth(34);

    // Hacer que todos los enemigos colisionen con el suelo
    this.physics.add.collider(this.enemies, this.floor);

    this.physics.add.collider(this.enemies, this.enemies, (enemy1, enemy2) => {
        if (enemy1.def?.tipo === 'planta' || enemy2.def?.tipo === 'planta') return;
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
    this.physics.add.collider(this.lavaesgota, this.floor, salpicar, (_gota, piso) => !piso.esGotero, this);
    this.physics.add.collider(this.lavaesgota, this.moviles, salpicar, null, this);

    this.physics.add.collider(this.mascotaGesi, this.lavaesgota, onlavagotasgesi, null, this);// muere con lava

    this.physics.add.overlap(this.mascotaGesi, this.coins, collectCoin, null, this);

    // bloques invisibles: solo chocan si Gesi los golpea desde abajo (o si ya aparecieron)
    this.physics.add.collider(this.mascotaGesi, this.invisibles, revelarBloque,
        (g, b) => b.revelado || (g.body.velocity.y < 0 && g.body.top >= b.body.bottom - 12), this);
    this.physics.add.collider(this.enemies, this.invisibles, null, (_e, b) => b.revelado);
    this.physics.add.overlap(this.mascotaGesi, this.bolas, () => killgesi(this));
    this.physics.add.overlap(this.mascotaGesi, this.carcajes, recogerCarcaj, null, this);
    this.physics.add.overlap(this.mascotaGesi, this.premios, recogerPremio, null, this);

    // flechas
    this.physics.add.overlap(this.flechasGrupo, this.enemies, (flecha, enemy) => {
        if (enemy.isDead) return;
        if (!flecha.perfora) flecha.destroy();
        dañarEnemigo(this, enemy, 1);
    });
    this.physics.add.collider(this.flechasGrupo, this.floor, flecha => flecha.destroy());

    // disparos de los enemigos
    this.physics.add.overlap(this.mascotaGesi, this.balasEnemigas, (_g, bala) => {
        if (protegido(this)) { bala.destroy(); return; }
        bala.destroy();
        killgesi(this, undefined, 20);
    });
    this.physics.add.collider(this.balasEnemigas, this.floor, bala => bala.destroy());
    this.physics.add.collider(this.flechasGrupo, this.moviles, flecha => flecha.destroy());
    this.physics.add.collider(this.flechasGrupo, this.invisibles, flecha => flecha.destroy(), (_f, b) => b.revelado);
    this.physics.add.overlap(this.mascotaGesi, this.zonaMeta, completarNivel, null, this);

    this.physics.world.setBounds(0, 0, nivel.ancho, VISTA.height);

    // camara
    this.anchoNivel = nivel.ancho;
    this.camaraArena = null;
    const antes = () => compensarZoom(this), despues = () => quitarCompensacion(this);
    this.events.on('prerender', antes);
    this.events.on('render', despues);
    this.events.once('shutdown', () => { this.events.off('prerender', antes); this.events.off('render', despues); });
    this.cameras.main.setOrigin(0).setZoom(ZOOM);
    moverCamara(this);

    // ambiente oscuro: niebla, oscuridad con luz alrededor del personaje y relámpagos
    crearAmbiente(this, nivel, nivelActual, nivelActual === 0 ? [[1350, 2310]] : []);

    // HUD
    const estiloHud = { fontSize: '16px', fill: '#fff', stroke: '#000', strokeThickness: 3 };
    // corazones de vida (los perdidos se ven grises)
    this.corazones = [];
    for (let i = 0; i < VIDAS_INICIALES; i++) {
        this.corazones.push(this.add.image(28 + i * 26, 24, 'mz_corazon', 9).setScale(0.75)
            .setScrollFactor(0).setDepth(50)); // Mantener fijo en la pantalla
    }
    actualizarCorazones(this);
    crearEscudo(this);
    this.scoreText = this.add.text(180, 15, `Puntaje: ${score}`, estiloHud)
        .setScrollFactor(0).setDepth(50);
    this.recursoText = this.add.text(370, 15, '', estiloHud)
        .setScrollFactor(0).setDepth(50);
    actualizarRecurso(this);
    this.nivelText = this.add.text(VISTA.width - 20, 15, `Nivel ${nivelActual + 1}/${NIVELES.length}`, estiloHud)
        .setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    mostrarMensaje(this, `NIVEL ${nivelActual + 1}\n${nivel.nombre}`, 2000);

    // música de fondo
    this.musica = this.sound.add(nivel.cueva ? 'musica_cueva' : 'musica', { loop: true, volume: 0.25 });
    this.musica.play();
    this.events.once('shutdown', () => this.musica.destroy());

    this.keys = this.input.keyboard.createCursorKeys();
    this.teclasDisparo = this.input.keyboard.addKeys({ espacio: 'SPACE', x: 'X', c: 'C' });
}

// la cámara sigue a Gesi sin mostrar nada fuera del nivel
function moverCamara(scene) {
    const g = scene.mascotaGesi;
    const cam = scene.cameras.main;
    // con la cámara alejada (pelea con el jefe) se ve más mundo: se centra en la arena
    const anchoVista = VISTA.width * ZOOM / cam.zoom, altoVista = VISTA.height * ZOOM / cam.zoom;
    if (!g.isDead || scene.camaraArena) {
        const centro = scene.camaraArena ?? g.x;
        cam.scrollX = Phaser.Math.Clamp(centro - anchoVista / 2, 0, Math.max(0, scene.anchoNivel - anchoVista));
    }
    cam.scrollY = VISTA.height - altoVista; // el suelo siempre queda abajo; lo extra se ve arriba (cielo)
}

// Lo que se dibuja fijo en la pantalla (HUD, cielo, niebla, oscuridad) está pensado para zoom 2.
// Cuando la cámara se aleja, se agranda solo al dibujar para que siga cubriendo toda la pantalla.
function compensarZoom(scene) {
    const cam = scene.cameras.main;
    const k = ZOOM / cam.zoom;
    scene.objetosCompensados = [];
    if (Math.abs(k - 1) < 0.001) return;
    scene.children.list.forEach(o => {
        if (o.scrollFactorX === undefined || o.scrollFactorX > 0.1 || o.scrollFactorY > 0.1) return;
        scene.objetosCompensados.push([o, o.x, o.y, o.scaleX, o.scaleY]);
        o.x *= k; o.y *= k;
        o.setScale(o.scaleX * k, o.scaleY * k);
    });
}
function quitarCompensacion(scene) {
    (scene.objetosCompensados || []).forEach(([o, x, y, sx, sy]) => { o.x = x; o.y = y; o.setScale(sx, sy); });
    scene.objetosCompensados = [];
}

// pixel art nítido: cada píxel se dibuja como un bloque limpio, sin desenfoque
const PIXEL_ART = /^(arquera|espadachin|mago|esqueleto|planta|espiritu|bola|mz_|coins|misterio|vacio|ladrillo|bloque_duro|flecha_pj|onda|magia|mastil|bandera|suelo|piso|door|arbol|arbusto|indicacion|lava|malo|cloud)/;
function pixelArtNitido(scene) {
    scene.textures.getTextureKeys().forEach(k => {
        if (PIXEL_ART.test(k) && !k.startsWith('mz_fondo')) scene.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
    });
}

function prepararAnimaciones(scene) {
    pixelArtNitido(scene);
    if (!scene.anims.exists('enemy-walk')) createAnimations(scene);
    crearAnimacionesPersonajes(scene);
    crearAnimacionesEnemigos(scene);
    crearAnimacionesMazmorra(scene);
    crearAnimacionesEscudo(scene);
    crearAnimacionesJefes(scene);
    crearTexturas(scene);
}

// ---------- Pantalla de selección de personaje ----------
function crearSeleccion() {
    prepararAnimaciones(this);
    this.cameras.main.setOrigin(0).setZoom(ZOOM);
    crearNieblaSeleccion(this);
    this.add.image(VISTA.width / 2, VISTA.height + 10, 'castillo_28').setOrigin(0.5, 1).setScale(0.625).setTint(0x2c3140);
    this.nieblaAlta.setDepth(1);

    this.add.text(VISTA.width / 2, 22, 'ELIGE TU PERSONAJE', {
        fontFamily: '"Press Start 2P", monospace', fontSize: '18px', fill: '#fff', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);

    const estilo = (tam, color = '#fff') => ({ fontFamily: 'monospace', fontSize: tam, fill: color, stroke: '#000', strokeThickness: 3, align: 'center' });
    // si hay partida guardada, se elige el personaje con el que se venía jugando
    this.partida = leerPartida();
    if (this.partida && this.partida.nivel === 0 && !this.partida.score) this.partida = null; // nada que continuar
    if (this.partida) personajeId = this.partida.personaje || personajeId;
    this.indiceSel = Math.max(0, PERSONAJES.findIndex(pj => pj.id === personajeId));
    this.tarjetas = PERSONAJES.map((pj, i) => {
        const x = 135 + i * 260;
        const panel = this.add.rectangle(x, 205, 240, 300, 0x000000, 0.55).setStrokeStyle(3, 0x666666)
            .setInteractive({ useHandCursor: true });
        const sprite = this.add.sprite(x - 2, 82, `${pj.id}-idle`).anims.play(`${pj.id}-idle`).setScale(1.3);
        this.add.text(x, 178, pj.nombre, { ...estilo('16px', '#' + pj.color.toString(16).padStart(6, '0')), fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(x, 197, pj.titulo, estilo('12px', '#ddd')).setOrigin(0.5);
        const h = pj.habilidades;
        const lineas = [
            `ESPACIO: ${h.espacio.nombre}`,
            `X: ${h.x.nombre}`,
            `C: ${h.c.nombre}`,
            `★ ${pj.pasiva}`,
        ];
        this.add.text(x, 262, lineas.join('\n'), { ...estilo('11px'), lineSpacing: 6 }).setOrigin(0.5);
        panel.on('pointerdown', () => {
            if (this.indiceSel === i) empezarJuego(this, true);
            else this.sound.play('menu_mover', { volume: 0.5 });
            this.indiceSel = i;
            marcarSeleccion(this);
        });
        return { panel, sprite, pj };
    });

    if (this.partida) {
        // botón para empezar desde cero (pide un segundo clic para confirmar)
        const boton = this.add.text(16, 14, '↺ DESDE EL NIVEL 1', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffd6d6',
            backgroundColor: '#6e141e', padding: { x: 6, y: 6 },
        }).setDepth(5).setInteractive({ useHandCursor: true });
        let confirmar = false;
        boton.on('pointerdown', () => {
            if (!confirmar) {
                confirmar = true;
                boton.setText('¿SEGURO? CLIC OTRA VEZ').setBackgroundColor('#a3122a');
                this.sound.play('vacio', { volume: 0.5 });
                this.time.delayedCall(3000, () => {
                    if (boton.active) { confirmar = false; boton.setText('↺ DESDE EL NIVEL 1').setBackgroundColor('#6e141e'); }
                });
            } else {
                empezarJuego(this, false);
            }
        });
        const n = this.partida.nivel;
        this.add.text(VISTA.width / 2, 44, `Partida guardada: Nivel ${n + 1} · ${NIVELES[n].nombre}`, estilo('11px', '#9fe6ff')).setOrigin(0.5);
        this.add.text(VISTA.width / 2, 366, `← → personaje   ·   ENTER: continuar en el Nivel ${n + 1}   ·   N: nueva partida`, estilo('12px', '#ffe066')).setOrigin(0.5);
    } else {
        this.add.text(VISTA.width / 2, 366, '← → elegir   ·   ENTER o ESPACIO jugar   ·   F pantalla completa', estilo('12px', '#ffe066')).setOrigin(0.5);
    }
    this.teclasSel = this.input.keyboard.addKeys({ izq: 'LEFT', der: 'RIGHT', enter: 'ENTER', espacio: 'SPACE', nueva: 'N' });
    marcarSeleccion(this);
}

function marcarSeleccion(scene) {
    scene.tarjetas.forEach((t, i) => {
        const elegido = i === scene.indiceSel;
        t.panel.setStrokeStyle(elegido ? 4 : 2, elegido ? t.pj.color : 0x666666);
        t.panel.setFillStyle(0x000000, elegido ? 0.75 : 0.45);
        t.sprite.setAlpha(elegido ? 1 : 0.6);
        t.sprite.anims.play(`${t.pj.id}-${elegido ? 'run' : 'idle'}`, true);
    });
}

function actualizarSeleccion(time) {
    moverNieblaSeleccion(this, time);
    const k = this.teclasSel, JD = Phaser.Input.Keyboard.JustDown;
    if (JD(k.izq)) { this.indiceSel = (this.indiceSel + PERSONAJES.length - 1) % PERSONAJES.length; marcarSeleccion(this); this.sound.play('menu_mover', { volume: 0.5 }); }
    if (JD(k.der)) { this.indiceSel = (this.indiceSel + 1) % PERSONAJES.length; marcarSeleccion(this); this.sound.play('menu_mover', { volume: 0.5 }); }
    if (JD(k.enter) || JD(k.espacio)) empezarJuego(this, true);
    if (JD(k.nueva) && this.partida) empezarJuego(this, false);
}

// continuar = true: sigue en el nivel guardado (si hay); false: partida nueva desde el nivel 1
function empezarJuego(scene, continuar = true) {
    personajeId = PERSONAJES[scene.indiceSel].id;
    scene.sound.play('menu_ok', { volume: 0.6 });
    const partida = continuar ? leerPartida() : null;
    if (partida) continuarPartida(partida);
    else {
        borrarPartida();
        reiniciarPartida();
    }
    scene.scene.start('juego');
}

function reiniciarPartida() {
    vidaJefeGuardada = null;
    vidas = VIDAS_INICIALES;
    nivelActual = 0;
    score = 0;
    scoreInicioNivel = 0;
    checkpointX = null;
}

// ---------- Partida guardada (en el navegador, sobrevive a cerrar la página) ----------
const CLAVE_GUARDADO = 'monhabell-aventura-partida';

function guardarPartida() {
    try {
        localStorage.setItem(CLAVE_GUARDADO, JSON.stringify({ nivel: nivelActual, score: scoreInicioNivel, personaje: personajeId }));
    } catch (_e) { /* sin almacenamiento disponible: se juega igual, sin guardar */ }
}

function leerPartida() {
    try {
        const p = JSON.parse(localStorage.getItem(CLAVE_GUARDADO));
        if (p && Number.isInteger(p.nivel) && p.nivel >= 0 && p.nivel < NIVELES.length) return p;
    } catch (_e) { /* guardado dañado o no disponible */ }
    return null;
}

function borrarPartida() {
    try { localStorage.removeItem(CLAVE_GUARDADO); } catch (_e) { /* nada que borrar */ }
}

// sigue desde el comienzo del nivel guardado, con las vidas llenas
function continuarPartida(p) {
    vidaJefeGuardada = null;
    vidas = VIDAS_INICIALES;
    nivelActual = p.nivel;
    score = p.score || 0;
    scoreInicioNivel = score;
    checkpointX = null;
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
    g.clear();

    // corazón
    g.fillStyle(0xff2d55);
    g.fillCircle(4, 4, 4); g.fillCircle(12, 4, 4);
    g.fillTriangle(0, 5, 16, 5, 8, 14);
    g.fillStyle(0xffffff, 0.7); g.fillRect(3, 2, 2, 2);
    g.generateTexture('corazon', 16, 14);
    g.clear();

    // láser de los aliens
    g.fillStyle(0xd94dff); g.fillRect(0, 1, 22, 4);
    g.fillStyle(0xffffff); g.fillRect(4, 2, 14, 2);
    g.generateTexture('laser', 22, 6);
    g.destroy();
}

// ---------- Barra de vida del jugador (solo en la pelea con el jefe) ----------
function crearBarraSalud(scene) {
    if (scene.barraSalud) return;
    scene.barraSaludFondo = scene.add.rectangle(20, 60, 124, 12, 0x000000, 0.75).setOrigin(0, 0.5)
        .setStrokeStyle(2, 0xffffff).setScrollFactor(0).setDepth(50);
    scene.barraSalud = scene.add.rectangle(22, 60, 120, 8, 0x4ade80).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    scene.textoSalud = scene.add.text(150, 54, '', { fontSize: '11px', color: '#ffffff', stroke: '#000', strokeThickness: 3 })
        .setScrollFactor(0).setDepth(51);
    actualizarBarraSalud(scene);
}

function actualizarBarraSalud(scene) {
    if (!scene.barraSalud || !scene.barraSalud.active) return;
    const p = Phaser.Math.Clamp(scene.salud / SALUD_MAXIMA, 0, 1);
    scene.barraSalud.width = 120 * p;
    scene.barraSalud.setFillStyle(p > 0.5 ? 0x4ade80 : p > 0.25 ? 0xfacc15 : 0xef4444);
    scene.textoSalud.setText(`${Math.ceil(scene.salud)}`);
}

function recibirDaño(scene, daño) {
    const g = scene.mascotaGesi;
    scene.salud = Math.max(0, scene.salud - Math.round(daño * (scene.dañoJefe || 1)));
    actualizarBarraSalud(scene);
    scene.tweens.add({ targets: [scene.barraSalud, scene.barraSaludFondo], scaleY: 1.6, yoyo: true, duration: 90 });
    scene.cameras.main.shake(160, 0.006);
    scene.sound.play('bump', { volume: 0.7 });
    // empujón y un momento sin recibir más daño
    const lado = scene.jefe?.sprite && g.body.center.x < scene.jefe.sprite.body.center.x ? -1 : 1;
    g.setVelocity(lado * 230, -220);
    g.setTintFill(0xff4444);
    scene.time.delayedCall(100, () => g.clearTint());
    scene.invulnerableHasta = scene.time.now + 700;
    scene.tweens.add({ targets: g, alpha: 0.3, yoyo: true, repeat: 4, duration: 90, onComplete: () => g.setAlpha(1) });
    if (scene.salud <= 0) {
        scene.invulnerableHasta = 0;
        killgesi(scene, 'sin_salud');
    }
}

function actualizarCorazones(scene) {
    scene.corazones.forEach((c, i) => {
        if (i < vidas) c.clearTint().setAlpha(1);
        else c.setTint(0x555555).setAlpha(0.5);
    });
}

function crearFondo(scene, nivel) {
    // cielo, luna, montañas, ruinas y niebla en capas (ver ambiente.js)
    crearFondoAtmosferico(scene, nivel, nivelActual);
}

// Primera parte del nivel 1, hecha a mano
function construirNivel1(scene) {
    // entrada en ruinas: torres y muros rotos, hongos que brillan y un cartel burlón
    const ruina = (x, clave, escala, voltear = false) =>
        scene.add.image(x, SUELO_Y + 8, clave).setOrigin(0.5, 1).setScale(escala).setFlipX(voltear).setTint(0x8a8798);
    ruina(215, 'torre_1_26', 0.42);
    ruina(330, 'muro_1_35', 0.5, true);
    ruina(720, 'muro_1_34', 0.5);
    ruina(905, 'torre_1_31', 0.4, true);
    [[560, 6], [610, 3], [980, 7], [1040, 4]].forEach(([x, n]) => {
        scene.add.image(x, SUELO_Y + 2, `mz_mushrum${n}`).setOrigin(0.5, 1).setScale(0.6).setTint(0xd8c9a0);
        scene.add.image(x, SUELO_Y - 14, 'brillo').setDepth(41).setScale(0.6).setTint(0xffd27a).setAlpha(0.2).setBlendMode('ADD');
    });
    scene.add.rectangle(150, 266, 4, 132, 0x4a3420);
    scene.add.text(150, 200, '¡BIENVENIDO! :)', {
        fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#ffe9a8',
        backgroundColor: '#3b2a1a', padding: { x: 6, y: 5 },
    }).setOrigin(0.5).setDepth(42);

    // Crear las piezas del piso
    scene.piso1 = scene.floor.create(0, VISTA.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();

    scene.piso2 = scene.floor.create(250, VISTA.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2);
    scene.piso3 = scene.floor.create(250, VISTA.height - 160, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    scene.piso3.setVisible(false);
    scene.piso4 = scene.floor.create(600, VISTA.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    scene.piso5 = scene.floor.create(850, VISTA.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();

    // Crear el muro con rotación y ajustar el tamaño del cuerpo de colisión
    scene.muro = scene.floor.create(1300, VISTA.height - 218, 'suelo')
        .setOrigin(0, 0.5)
        .setScale(4, 3)
        .setAngle(90) // Rota el sprite 90 grados
        .setSize(92, 450).setOffset(18, 15);

    // escalones para alcanzar la plataforma escondida (piso3) y piso6 sin hacer un salto perfecto
    [170, 202, 1000, 1032].forEach(x => {
        scene.floor.create(x, 280, 'mz_bloque').setOrigin(0, 0.5).refreshBody();
    });

    scene.piso6 = scene.floor.create(1090, VISTA.height - 155, 'suelo').setOrigin(0, 0.5).setScale(0.9, 2).refreshBody();

    // el piso de ladrillos se viste con roca de la mazmorra
    vestirSuelo(scene, scene.piso1, { izq: true });
    vestirSuelo(scene, scene.piso2, { der: true });
    vestirSuelo(scene, scene.piso3, { izq: true, der: true, flotante: true });
    scene.piso3.visuales.forEach(v => v.setVisible(false)); // plataforma escondida
    vestirSuelo(scene, scene.piso4, { izq: true });
    vestirSuelo(scene, scene.piso5, { der: true });
    vestirSuelo(scene, scene.piso6, { izq: true, der: true, flotante: true });
    vestirMuro(scene, scene.muro);

    scene.piso7 = scene.floor.create(1450, VISTA.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);
    scene.piso8 = scene.floor.create(1640, VISTA.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);
    scene.piso9 = scene.floor.create(1840, VISTA.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);
    scene.piso10 = scene.floor.create(2050, VISTA.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);

    const cantidadLava = 10;

    // Define la posición inicial de la primera lava
    const posicionXInicial = 1350;//1350

    // El ancho de cada bloque de lava (ajusta según tu imagen)
    const anchoLava = 94; // Por ejemplo, si cada imagen de lava mide 64 píxeles de ancho

    for (let i = 0; i < cantidadLava; i++) {
        // Crear cada bloque de lava en una posición consecutiva
        scene.lavaes.create(posicionXInicial + (i * anchoLava), VISTA.height - 200, 'lava').anims.play('lava_quema', true)
            .setOrigin(0, 0.5)
            .setScale(1.5)
            .setSize(60, 40).setOffset(1, 22)
    }

    // goteros del techo (solo decoración, las gotas se crean con los timers)
    // las gotas caen en los huecos entre plataformas (golpean en x + 31)
    [1579, 1979].forEach(x => {
        const gotero = scene.floor.create(x, VISTA.height - 370, 'lava_falling').setOrigin(0, 0.5).anims.play('lavacaer', true)
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
    const cantidadpiso3 = 15;
    const posicionInicialPiso3 = 1350;
    const anchopiso3 = 64;

    for (let i = 0; i < cantidadpiso3; i++) {
        scene.floor.create(posicionInicialPiso3 + (i * anchopiso3), VISTA.height - 10, 'suelo3').setOrigin(0, 0.5).setScale(1).refreshBody()
            .setSize(64, 40).setOffset(0, 18);
    }

    // Número de enemigos que quieres crear
    const numEnemies = 3; // Cambia este valor según lo que necesites

    for (let i = 0; i < numEnemies; i++) {
        crearEnemigo(scene, 690 + i * 80, VISTA.height - 250);
    }
}

// Construye un nivel a partir de los datos de niveles.js
function construirNivel(scene, nivel) {
    const s = scene.sufijo;

    // lava en los huecos (se dibuja antes que el suelo para quedar detrás)
    (nivel.lava || []).forEach(([x0, x1]) => crearLava(scene, x0, x1));

    // pinchos (los ocultos empiezan escondidos bajo el suelo)
    (nivel.pinchos || []).forEach(([x, n, oculto]) => {
        for (let i = 0; i < n; i++) {
            const img = scene.add.image(x + i * 32, oculto ? SUELO_Y + 18 : SUELO_Y, 'pincho').setOrigin(0, 1);
            scene.pinchos.push({ img, oculto, x: x + i * 32 });
        }
    });

    // suelo falso: igual al normal pero se derrumba al pisarlo (con lava debajo)
    (nivel.falsos || []).forEach(([x0, x1]) => {
        crearLava(scene, x0, x1);
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
                scene.floor.create(bx, y, 'mz_bloque').setOrigin(0, 0.5).refreshBody();
            } else if (tipo === 'C') {
                // ladrillo que cae cuando Gesi pasa por debajo
                scene.cayentes.push(scene.floor.create(bx, y, 'mz_bloque').setOrigin(0, 0.5).refreshBody());
            } else if (tipo === 'H') {
                // bloque invisible
                scene.invisibles.create(bx, y, 'vacio' + s).setOrigin(0, 0.5).setScale(2).refreshBody().setVisible(false);
            } else if (tipo === 'F') {
                // ladrillo falso: se ve pero no tiene piso
                scene.add.image(bx, y, 'mz_bloque').setOrigin(0, 0.5);
            }
        });
    });

    (nivel.escaleras || []).forEach(([x, altura]) => {
        for (let col = 0; col < altura; col++) {
            for (let f = 0; f <= col; f++) {
                scene.floor.create(x + col * 32, SUELO_Y - 16 - f * 32, 'mz_escalon')
                    .setOrigin(0, 0.5).refreshBody();
            }
        }
    });

    (nivel.moviles || []).forEach(([x, y, eje, recorrido, vel]) => {
        const plataforma = scene.moviles.create(x, y, 'mz_plataforma');
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
        const [x, y, tipo] = Array.isArray(e) ? e : [e, SUELO_Y - 2];
        crearEnemigo(scene, x, y ?? SUELO_Y - 2, tipo);
    });
    // plantas disfrazadas de arbusto y espíritus de fuego voladores
    (nivel.plantas || []).forEach(x => crearEnemigo(scene, x, SUELO_Y - 2, 'planta'));
    (nivel.espiritus || []).forEach(([x, y]) => crearEnemigo(scene, x, y, 'espiritu'));

    (nivel.goteros || []).forEach(([x, delay]) => {
        scene.add.sprite(x, VISTA.height - 370, 'lava_falling').setOrigin(0, 0.5).setScale(0.5).anims.play('lavacaer', true);
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
                sonarCerca(scene, 'fuego', x, { volume: 0.2, rate: 0.8 });
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
        const activo = checkpointX !== null && x <= checkpointX;
        return { x, activo, ...crearEstatua(scene, x, activo) };
    });

    // corazones (recuperan una vida) y cristales (tesoro de 500 puntos)
    (nivel.escudos || []).forEach(([x, y]) => soltarEscudo(scene, x, y, 0));
    (nivel.corazones || []).forEach(([x, y]) => {
        const c = scene.premios.create(x, y, 'mz_corazon').anims.play('mz_corazon', true).refreshBody();
        c.tipoPremio = 'corazon';
        scene.add.image(x, y, 'brillo').setDepth(41).setScale(0.8).setTint(0xff4d6d).setAlpha(0.35).setBlendMode('ADD');
    });
    (nivel.cristales || []).forEach(([x, y]) => {
        const c = scene.premios.create(x, y, 'mz_cristal').anims.play('mz_cristal', true).refreshBody();
        c.tipoPremio = 'cristal';
        scene.add.image(x, y, 'brillo').setDepth(41).setScale(0.8).setTint(0xc77dff).setAlpha(0.35).setBlendMode('ADD');
    });

    // meta: mástil, bandera y castillo
    const mx = nivel.meta;
    scene.add.image(mx, SUELO_Y, 'mastil').setOrigin(0.5, 1);
    scene.bandera = scene.add.image(mx - 6, SUELO_Y - 160, 'bandera').setOrigin(1, 0).setScale(2);
    crearCastilloMeta(scene, mx + 50, nivelActual, 0xb4b4bc);
    scene.zonaMeta = scene.add.zone(mx, SUELO_Y / 2, 24, SUELO_Y);
    scene.physics.add.existing(scene.zonaMeta, true);
}

function crearSuelo(scene, x0, x1, textura) {
    const piezas = Math.max(1, Math.round((x1 - x0) / 256));
    const ancho = (x1 - x0) / piezas;
    const tiles = [];
    for (let i = 0; i < piezas; i++) {
        const pieza = scene.floor.create(x0 + i * ancho, VISTA.height - 16, textura)
            .setOrigin(0, 0.5).setScale(ancho / 128, 2).refreshBody();
        vestirSuelo(scene, pieza, { izq: i === 0, der: i === piezas - 1 });
        tiles.push(pieza);
    }
    return tiles;
}

function activarCheckpoint(scene, cp) {
    cp.activo = true;
    checkpointX = Math.max(checkpointX ?? 0, cp.x);
    encenderEstatua(scene, cp);
    scene.sound.play('punto_control', { volume: 0.6 });
    mostrarMensaje(scene, '¡PUNTO DE CONTROL!', 1200);
}

// tipo: clave de ENEMIGOS; sin tipo se usa el siguiente de la mezcla del nivel
function crearEnemigo(scene, x, y, tipo) {
    tipo = tipo || scene.mezcla[scene.contEnemigos++ % scene.mezcla.length];
    const def = ENEMIGOS[tipo];
    const inicial = def.tipo === 'planta' ? 'disfraz' : 'walk';
    const enemy = scene.enemies.create(x, y, `${tipo}-${inicial}`).anims.play(`${tipo}-${inicial}`, true)
        .setOrigin(0, 1)
        .setGravityY(300)
        .setScale(def.escala ?? 1);
    const [w, h, ox, oy] = def.cuerpo;
    enemy.body.setSize(w, h).setOffset(ox, oy);
    enemy.tipoId = tipo;
    enemy.def = def;
    enemy.vida = def.vida;
    enemy.velBase = scene.velEnemigos * def.vel;
    enemy.proxAtaque = scene.time.now + 800 + Math.random() * 800;
    enemy.atacandoHasta = 0;
    enemy.invulHasta = 0;

    if (def.tipo === 'planta') {
        enemy.body.setAllowGravity(false).setImmovable(true);
        enemy.body.pushable = false;
    } else if (def.tipo === 'volador') {
        enemy.body.setAllowGravity(false);
        enemy.fase = Math.random() * Math.PI * 2;
    }
    if (def.corre) enemy.anims.play(`${tipo}-run`, true);
    enemy.setVelocityX(-enemy.velBase);
    enemy.flipX = true; // los sprites miran a la derecha
    return enemy;
}

// el enemigo pierde vida; devuelve true si lo golpeó
function dañarEnemigo(scene, enemy, cantidad = 1) {
    if (enemy.isDead || scene.time.now < (enemy.invulHasta || 0)) return false;
    enemy.vida = (enemy.vida ?? 1) - cantidad;
    if (enemy.vida <= 0) {
        matarEnemigo(scene, enemy);
        return true;
    }
    enemy.invulHasta = scene.time.now + 350;
    enemy.setTintFill(0xffffff);
    scene.time.delayedCall(90, () => enemy.active && enemy.clearTint());
    scene.sound.play('bump', { volume: 0.4 });
    if (enemy.tipoId) {
        enemy.anims.play(`${enemy.tipoId}-hurt`, true);
        enemy.atacandoHasta = scene.time.now + 300;
        enemy.setVelocityX(0);
        scene.time.delayedCall(300, () => volverACaminar(enemy));
    }
    return true;
}

function volverACaminar(enemy) {
    if (!enemy.active || enemy.isDead) return;
    const def = enemy.def;
    const anim = def.tipo === 'planta' ? 'walk' : def.corre ? 'run' : 'walk';
    enemy.anims.play(`${enemy.tipoId}-${anim}`, true);
    if (def.tipo !== 'planta') enemy.setVelocityX(enemy.flipX ? -enemy.velBase : enemy.velBase);
}

// ataque del enemigo: se detiene, hace la animación y en el frame "soltar" golpea o dispara
function atacar(scene, enemy, alSoltar) {
    const def = enemy.def;
    const anim = scene.anims.get(`${enemy.tipoId}-attack`);
    const duracion = anim.frames.length / anim.frameRate * 1000;
    enemy.atacandoHasta = scene.time.now + duracion;
    enemy.proxAtaque = scene.time.now + duracion + def.cadencia;
    enemy.setVelocity(0, def.tipo === 'volador' ? 0 : enemy.body.velocity.y);
    enemy.anims.play(`${enemy.tipoId}-attack`, true);
    scene.time.delayedCall(def.soltar / anim.frameRate * 1000, () => {
        if (enemy.active && !enemy.isDead) alSoltar();
    });
    scene.time.delayedCall(duracion, () => volverACaminar(enemy));
}

// golpe cuerpo a cuerpo de un enemigo (esqueleto, planta)
function golpeDeEnemigo(scene, enemy) {
    const eb = enemy.body, alcance = enemy.def.alcance;
    sonarCerca(scene, enemy.def.tipo === 'planta' ? 'latigo' : 'golpe_enemigo', eb.center.x, { volume: 0.5 });
    const x0 = enemy.flipX ? eb.left - alcance : eb.right;
    const zona = new Phaser.Geom.Rectangle(x0, eb.top - 10, alcance, eb.height + 10);
    const gb = scene.mascotaGesi.body;
    if (Phaser.Geom.Intersects.RectangleToRectangle(zona, new Phaser.Geom.Rectangle(gb.left, gb.top, gb.width, gb.height))) {
        killgesi(scene);
    }
}

function dispararEnemigo(scene, enemy) {
    const eb = enemy.body, gb = scene.mascotaGesi.body;
    if (enemy.def.tipo === 'volador') {
        // bola de fuego apuntada a Gesi
        const bola = scene.balasEnemigas.create(eb.center.x, eb.center.y, 'bola_espiritu').anims.play('bola_espiritu-giro', true);
        bola.body.setSize(16, 16);
        const ang = Phaser.Math.Angle.Between(eb.center.x, eb.center.y, gb.center.x, gb.center.y);
        scene.physics.velocityFromRotation(ang, 190, bola.body.velocity);
        bola.setRotation(ang + Math.PI);
        scene.time.delayedCall(3500, () => bola.active && bola.destroy());
    } else {
        // láser horizontal desde la pistola
        const dir = enemy.flipX ? -1 : 1;
        const laser = scene.balasEnemigas.create(eb.center.x + dir * 30, eb.top + 34, 'laser');
        laser.setVelocityX(dir * 320);
        scene.time.delayedCall(2500, () => laser.active && laser.destroy());
    }
    sonarCerca(scene, enemy.def.tipo === 'volador' ? 'fuego' : 'laser', eb.center.x, { volume: 0.4 });
}

function actualizarEnemigo(scene, enemy, time) {
    const def = enemy.def;
    if (!def) return;
    const g = scene.mascotaGesi, gb = g.body, eb = enemy.body;
    const dx = gb.center.x - eb.center.x, dy = gb.center.y - eb.center.y;

    // el zombie gigante solo persigue a Gesi (y salta las paredes)
    if (enemy.gigante) {
        if (time < enemy.atacandoHasta) return;
        const dir = Math.sign(dx) || 1;
        enemy.setVelocityX(dir * enemy.velBase);
        enemy.flipX = dir < 0;
        if ((eb.blocked.left || eb.blocked.right) && eb.blocked.down) enemy.setVelocityY(-430);
        return;
    }
    const gesiVivo = !g.isDead && !scene.nivelTerminado;
    const atacando = time < enemy.atacandoHasta;

    if (def.tipo === 'planta') {
        enemy.setVelocity(0, 0);
        if (!enemy.revelada) {
            if (gesiVivo && Math.abs(dx) < 120 && Math.abs(dy) < 90) {
                // ¡sorpresa! el arbusto era una planta
                enemy.revelada = true;
                enemy.flipX = dx < 0;
                enemy.atacandoHasta = time + 600;
                enemy.proxAtaque = time + 400;
                enemy.anims.play('planta-revelar', true);
                scene.time.delayedCall(600, () => volverACaminar(enemy));
            }
        } else if (gesiVivo && !atacando && time > enemy.proxAtaque && Math.abs(dx) < def.alcance + 20 && Math.abs(dy) < 70) {
            enemy.flipX = dx < 0;
            atacar(scene, enemy, () => golpeDeEnemigo(scene, enemy));
        }
        return;
    }

    if (def.tipo === 'volador') {
        if (!atacando) {
            // flota subiendo y bajando y se acerca a Gesi sin pegarse
            enemy.setVelocityY(Math.cos(time / 380 + enemy.fase) * 35);
            const cerca = Math.abs(dx) < 500;
            enemy.setVelocityX(cerca && Math.abs(dx) > 150 ? Math.sign(dx) * enemy.velBase : 0);
            if (cerca) enemy.flipX = dx < 0;
            if (gesiVivo && cerca && time > enemy.proxAtaque && Math.abs(dx) < def.alcance) {
                atacar(scene, enemy, () => dispararEnemigo(scene, enemy));
            }
        }
        return;
    }

    if (atacando) return;

    // caminar y dar la vuelta en las paredes
    if (eb.blocked.left) { enemy.setVelocityX(enemy.velBase); }
    else if (eb.blocked.right) { enemy.setVelocityX(-enemy.velBase); }
    if (Math.abs(eb.velocity.x) > 1) enemy.flipX = eb.velocity.x < 0;

    if (!gesiVivo || time < enemy.proxAtaque || Math.abs(dy) > 60) return;
    const delante = enemy.flipX ? -dx : dx;
    if (def.tipo === 'espadachin' && delante > 0 && delante < def.alcance + 25) {
        atacar(scene, enemy, () => golpeDeEnemigo(scene, enemy));
    } else if (def.tipo === 'tirador' && Math.abs(dx) < def.alcance && enSu(scene, enemy)) {
        enemy.flipX = dx < 0; // se voltea hacia Gesi para disparar
        atacar(scene, enemy, () => dispararEnemigo(scene, enemy));
    }
}

// el enemigo está dentro de la pantalla (no disparan desde fuera de la cámara)
function enSu(scene, enemy) {
    const izq = scene.cameras.main.scrollX;
    return enemy.x > izq - 40 && enemy.x < izq + VISTA.width;
}

function onlavagotasgesi(_mascotaGesi, _lavaesgota) {
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
    scene.lavaesgota.create(x, VISTA.height - 342, 'lava_falling')
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

    if (pieza.muerde) pisarMordedora(this, pieza, apiSorpresas);

    // suelo falso: tiembla y se cae
    if (pieza.esFalso && !pieza.cayendo && cuerpo.touching.down) {
        pieza.cayendo = true;
        const partes = [pieza, ...(pieza.visuales || [])];
        this.tweens.add({ targets: partes, x: '+=3', yoyo: true, repeat: 2, duration: 40 });
        this.time.delayedCall(180, () => {
            pieza.body.enable = false;
            this.sound.play('romper');
            this.tweens.add({ targets: partes, y: '+=300', alpha: 0, duration: 700 });
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
        enemigo.setVelocityX(haciaGesi * enemigo.velBase);
        enemigo.flipX = haciaGesi < 0;
        return;
    }

    const moneda = this.add.sprite(bloque.x + 16, bloque.y - 24, 'coins').setScale(0.75).anims.play('coins-giro', true);
    this.tweens.add({ targets: moneda, y: moneda.y - 40, alpha: 0, duration: 500, onComplete: () => moneda.destroy() });
    this.sound.play('moneda');
    addToScore(100, bloque, this);
}

function revelarBloque(_mascotaGesi, bloque) {
    if (bloque.revelado) return;
    bloque.revelado = true;
    bloque.setVisible(true);
    this.sound.play('bump');
    this.tweens.add({ targets: bloque, y: bloque.y - 8, yoyo: true, duration: 80 });
}

function recogerPremio(_mascotaGesi, premio) {
    premio.disableBody(true, true);
    if (premio.tipoPremio === 'corazon' && this.peleaJefe && this.salud < SALUD_MAXIMA) {
        // en la pelea el corazón cura la barra de vida
        const cura = this.curacionArena || 45;
        this.salud = Math.min(SALUD_MAXIMA, this.salud + cura);
        actualizarBarraSalud(this);
        mostrarMensaje(this, `+${cura} VIDA`, 800);
        this.sound.play('aparece', { volume: 0.5 });
    } else if (premio.tipoPremio === 'corazon') {
        if (vidas < VIDAS_INICIALES) {
            vidas++;
            actualizarCorazones(this);
            this.tweens.add({ targets: this.corazones[vidas - 1], scale: 1.3, yoyo: true, duration: 180 });
            mostrarMensaje(this, '+1 VIDA', 900);
        } else if (!recuperarEscudo(this, texto => mostrarMensaje(this, texto, 900))) {
            addToScore(300, premio, this);
        }
        this.sound.play('victoria', { volume: 0.4 });
    } else if (premio.tipoPremio === 'escudo') {
        if (!recuperarEscudo(this, texto => mostrarMensaje(this, texto, 900), '¡ESCUDO CARGADO!')) {
            addToScore(200, premio, this);
            this.sound.play('moneda');
        }
    } else {
        addToScore(500, premio, this);
        this.sound.play('moneda');
        mostrarMensaje(this, '¡CRISTAL! +500', 900);
    }
}

function recogerCarcaj(_mascotaGesi, carcaj) {
    carcaj.disableBody(true, true);
    this.sound.play('moneda');
    if (this.pj.recurso === 'flechas') {
        flechas += 5;
        mostrarMensaje(this, '+5 FLECHAS', 900);
    } else if (this.pj.recurso === 'mana') {
        this.mana = MANA_MAXIMO;
        mostrarMensaje(this, '¡MANÁ LLENO!', 900);
    } else {
        addToScore(300, carcaj, this);
    }
    actualizarRecurso(this);
}

function actualizarRecurso(scene) {
    const texto = scene.pj.recurso === 'flechas' ? `Flechas: ${flechas}`
        : scene.pj.recurso === 'mana' ? `Maná: ${Math.floor(scene.mana)}`
            : 'Espada: ∞';
    if (scene.recursoText.text !== texto) scene.recursoText.setText(texto);
}

function animar(scene, clave) {
    if (scene.atacando) return; // no cortar la animación de ataque
    scene.mascotaGesi.anims.play(`${scene.pj.id}-${clave}`, true);
}

// ---------- Habilidades (ESPACIO, X, C) ----------
function avisar(scene, texto) {
    scene.sound.play('vacio', { volume: 0.5 });
    if (scene.avisoActivo) return;
    scene.avisoActivo = true;
    mostrarMensaje(scene, texto, 800);
    scene.time.delayedCall(1100, () => { scene.avisoActivo = false; });
}

function pagarCosto(scene, costo) {
    if (!costo) return true;
    if (scene.pj.recurso === 'flechas') {
        if (flechas < costo) { avisar(scene, '¡SIN FLECHAS!'); return false; }
        flechas -= costo;
    } else if (scene.pj.recurso === 'mana') {
        if (scene.mana < costo) { avisar(scene, '¡SIN MANÁ!'); return false; }
        scene.mana -= costo;
    }
    actualizarRecurso(scene);
    return true;
}

function usarHabilidad(scene, tecla) {
    const h = scene.pj.habilidades[tecla];
    if (!h || scene.atacando || scene.time.now < (scene.enfriamientos[tecla] || 0)) return;
    if (!pagarCosto(scene, h.costo)) return;
    scene.enfriamientos[tecla] = scene.time.now + h.enfriamiento;

    const g = scene.mascotaGesi;
    const clave = `${scene.pj.id}-${h.anim}`;
    const anim = scene.anims.get(clave);
    scene.atacando = true;
    g.anims.play(clave, true);
    const duracion = anim.frames.length / anim.frameRate * 1000;
    scene.time.delayedCall(duracion, () => { scene.atacando = false; });
    scene.time.delayedCall(h.soltar / anim.frameRate * 1000, () => {
        if (!g.isDead && !scene.nivelTerminado) ejecutarHabilidad(scene, h);
    });
}

function ejecutarHabilidad(scene, h) {
    const g = scene.mascotaGesi, b = g.body;
    const dir = g.flipX ? -1 : 1;
    if (h.sonido) scene.sound.play(h.sonido, { volume: 0.6, rate: h.rate || 1 });

    if (h.tipo === 'proyectil') {
        const p = scene.flechasGrupo.create(b.center.x + dir * 20, b.center.y - 8, h.textura);
        p.setScale(h.escala || 1).setFlipX(dir < 0);
        if (h.textura === 'flecha_pj') p.body.setSize(40, 6).setOffset(4, 21);
        if (h.animProyectil) p.anims.play(h.animProyectil, true);
        if (h.tinte) p.setTint(h.tinte);
        p.perfora = !!h.perfora;
        p.body.setAllowGravity(false);
        p.setVelocityX(dir * h.vel);
        scene.time.delayedCall(h.vida, () => p.active && p.destroy());
    } else if (h.tipo === 'golpe' || h.tipo === 'rayo') {
        // golpea a todos los enemigos en una franja delante del personaje
        const x0 = dir > 0 ? b.right : b.left - h.alcance;
        const zona = new Phaser.Geom.Rectangle(x0, b.top - 10, h.alcance, b.height + 10);
        scene.enemies.getChildren().slice().forEach(e => {
            if (e.isDead || !e.body) return;
            const re = new Phaser.Geom.Rectangle(e.body.left, e.body.top, e.body.width, e.body.height);
            if (Phaser.Geom.Intersects.RectangleToRectangle(zona, re)) dañarEnemigo(scene, e, h.tipo === 'rayo' ? 2 : 1);
        });
        golpearJefeEnZona(scene, zona, h.tipo === 'rayo' ? 2 : 1, apiJefe);
        if (h.tipo === 'rayo') {
            const rayo = scene.add.rectangle(x0 + h.alcance / 2, b.center.y - 6, h.alcance, 6, 0xffe066).setDepth(20);
            scene.tweens.add({ targets: rayo, scaleY: 3, alpha: 0, duration: 350, onComplete: () => rayo.destroy() });
        }
    } else if (h.tipo === 'embestida') {
        scene.dashHasta = scene.time.now + h.duracion;
        scene.dashVel = dir * h.vel;
        b.setAllowGravity(false);
        g.setVelocityY(0);
    } else if (h.tipo === 'escudo') {
        scene.escudoHasta = scene.time.now + h.duracion;
        if (scene.escudoFx) scene.escudoFx.destroy();
        scene.escudoFx = scene.add.circle(g.x, b.center.y, 46, 0x66ccff, 0.25).setStrokeStyle(3, 0x99ddff).setDepth(20);
    }
}

function protegido(scene) {
    return scene.time.now < scene.escudoHasta || scene.time.now < scene.dashHasta;
}

function matarEnemigo(scene, enemy) {
    enemy.isDead = true;
    enemy.clearTint();
    enemy.anims.play(enemy.tipoId ? `${enemy.tipoId}-dead` : 'enemy-muerte', true);
    scene.sound.play('matar');
    addToScore(enemy.def ? 100 + 50 * enemy.def.vida : 150, enemy, scene);
    // a veces el enemigo suelta un corazón (más a menudo los más fuertes)
    const prob = 0.06 + 0.03 * ((enemy.def?.vida ?? 1) - 1);
    if (vidas < VIDAS_INICIALES && Math.random() < prob && enemy.body) {
        soltarCorazon(scene, enemy.body.center.x, Math.min(enemy.body.center.y, SUELO_Y - 28));
    }
    enemy.setVelocity(0, 0);
    // sin cuerpo para que no estorbe; queda tirado un momento y desaparece
    enemy.body.checkCollision.none = true;
    enemy.body.setAllowGravity(false);
    scene.tweens.add({ targets: enemy, alpha: 0, delay: 1500, duration: 800, onComplete: () => enemy.destroy() });
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
            if (scene.time.now - (scene.ultimoPincho || 0) > 200) scene.sound.play('pinchos', { volume: 0.5 });
            scene.ultimoPincho = scene.time.now;
        }
        const arriba = p.img.y <= SUELO_Y + 4;
        if (arriba && g.right > p.x + 4 && g.left < p.x + 28 && g.bottom > SUELO_Y - 14) killgesi(scene);
    });

    // emboscadas
    scene.emboscadas.forEach(e => {
        if (!e.hecha && scene.mascotaGesi.x >= e.xAviso) {
            e.hecha = true;
            e.xs.forEach(x => crearEnemigo(scene, x, 0));
            scene.sound.play('emboscada', { volume: 0.6 });
        }
    });
}

function collectCoin(_mascotaGesi, coin) {
    coin.disableBody(true, true);
    if (coin.trampa) {
        monedaTrampa(this, coin, apiSorpresas);
        return;
    }
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
        fontSize: VISTA.width / 40
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

    // con el escudo o durante la embestida, los enemigos reciben daño al tocarlos
    if (protegido(this)) {
        dañarEnemigo(this, enemy, 1);
        return;
    }

    if (mascotaGesi.body.touching.down && enemy.body.touching.up) {
        if (enemy.def?.espinas) {
            // la planta tiene espinas: pisarla duele
            killgesi(this);
            return;
        }
        dañarEnemigo(this, enemy, 1);
        mascotaGesi.setVelocityY(-280); // rebote al pisar al enemigo
    } else {
        killgesi(this);
    }
}

function onlava(mascotaGesi, lava) {

    if (mascotaGesi.body.touching.down && lava.body.touching.up) {
        killgesi(this, 'caida');
    }

}

function completarNivel(mascotaGesi) {
    if (this.nivelTerminado || mascotaGesi.isDead || jefeBloqueaMeta(this)) return;
    this.nivelTerminado = true;

    mascotaGesi.setVelocityX(0);
    this.atacando = false;
    animar(this, 'idle');
    this.musica.stop();
    this.musicaBatalla?.stop();
    this.sound.play('victoria');
    this.tweens.add({ targets: this.bandera, y: SUELO_Y - 40, duration: 1200 });
    addToScore(1000, mascotaGesi, this);

    const ultimo = nivelActual === NIVELES.length - 1;
    mostrarMensaje(this, ultimo
        ? `¡GANASTE EL JUEGO!\nPuntaje: ${score}`
        : `¡NIVEL ${nivelActual + 1} COMPLETADO!`);

    this.time.delayedCall(ultimo ? 6000 : 3500, () => {
        if (ultimo) {
            // juego terminado: volver a elegir personaje y empezar de cero
            borrarPartida();
            reiniciarPartida();
            this.scene.start('seleccion');
            return;
        }
        nivelActual++;
        vidaJefeGuardada = null;
        scoreInicioNivel = score;
        checkpointX = null;
        guardarPartida();
        // el personaje camina por el mapa hasta el siguiente nivel
        this.scene.start('mapa', { desde: nivelActual - 1, hasta: nivelActual });
    });
}

function mostrarMensaje(scene, texto, duracion) {
    // un mensaje nuevo reemplaza al anterior para que no se encimen
    if (scene.mensajeActual && scene.mensajeActual.active) scene.mensajeActual.destroy();
    const mensaje = scene.mensajeActual = scene.add.text(VISTA.width / 2, VISTA.height / 2 - 40, texto, {
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

    // enemigos: cada tipo tiene su comportamiento; desaparecen si caen
    const ahora = scene.time.now;
    scene.enemies.getChildren().slice().forEach(enemy => {
        if (enemy.y > VISTA.height + 150 || enemy.x < -200) {
            enemy.destroy();
            return;
        }
        if (enemy.isDead) return;
        if (enemy.def) {
            actualizarEnemigo(scene, enemy, ahora);
        } else if (enemy.body.blocked.left) {
            enemy.setVelocityX(scene.velEnemigos);
            enemy.flipX = false;
        } else if (enemy.body.blocked.right) {
            enemy.setVelocityX(-scene.velEnemigos);
            enemy.flipX = true;
        }
    });

    scene.lavaesgota.getChildren().slice().forEach(gota => {
        if (gota.y > VISTA.height + 50) gota.destroy();
    });

    scene.bolas.getChildren().forEach(bola => {
        if (!bola.active) return;
        bola.flipY = bola.body.velocity.y > 0;
        if (bola.body.velocity.y > 0 && bola.y > 390) bola.disableBody(true, true);
    });
}

function trampasNivel1(scene) {
    if (scene.mascotaGesi.x >= VISTA.width - 400 && scene.piso2.active) { // Ajusta el valor según tu necesidad
        moveFloorPiece(scene.piso2, 390);
    }

    if (scene.mascotaGesi.x >= 190 && scene.mascotaGesi.y <= 210) {
        if (!scene.piso3.mostrado) {
            scene.piso3.mostrado = true; // Mostrar el piso
            scene.piso3.visuales.forEach(v => v.setVisible(true));
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

function update(time, delta) {
    moverCamara(this);
    actualizarEscudo(this, texto => mostrarMensaje(this, texto, 900));
    actualizarJefe(this, this.time.now, apiJefe);
    actualizarMundo(this);
    actualizarAmbiente(this, time, this.mascotaGesi);
    moverLava(this, time);

    if (this.mascotaGesi.isDead) return;

    if (this.nivelTerminado) {
        this.mascotaGesi.setVelocityX(0);
        return;
    }
    if (this.cinematica) {
        this.mascotaGesi.setVelocityX(0);
        animar(this, 'idle');
        return;
    }

    const g = this.mascotaGesi;
    const enSuelo = g.body.touching.down || g.body.blocked.down;
    const v = this.pj.velocidad;

    // maná del mago se recupera poco a poco
    if (this.pj.recurso === 'mana' && this.mana < MANA_MAXIMO) {
        this.mana = Math.min(MANA_MAXIMO, this.mana + delta * 0.012);
        actualizarRecurso(this);
    }

    // escudo mágico
    if (this.escudoFx) {
        if (time < this.escudoHasta) this.escudoFx.setPosition(g.x, g.body.center.y);
        else { this.escudoFx.destroy(); this.escudoFx = null; }
    }

    if (time < this.dashHasta) {
        // embestida: avanza rápido en línea recta
        g.setVelocity(this.dashVel, 0);
    } else {
        if (!g.body.allowGravity) g.body.setAllowGravity(true);

        if (this.keys.left.isDown) {
            enSuelo && animar(this, 'run');
            g.x -= 2 * v;
            g.setVelocityX(-100 * v);
            g.flipX = true;
        } else if (this.keys.right.isDown) {
            enSuelo && animar(this, 'run');
            g.x += 2 * v;
            g.setVelocityX(100 * v);
            g.flipX = false;
        } else if (enSuelo) {
            animar(this, 'idle');
            g.setVelocityX(0);
        }
    }

    const JD = Phaser.Input.Keyboard.JustDown, t = this.teclasDisparo;
    if (JD(t.espacio)) usarHabilidad(this, 'espacio');
    if (JD(t.x)) usarHabilidad(this, 'x');
    if (JD(t.c)) usarHabilidad(this, 'c');

    if (enSuelo) this.saltosAire = 0;
    if (this.keys.up.isDown && enSuelo) {
        // se "gasta" la pulsación: el doble salto necesita volver a presionar ↑
        JD(this.keys.up);
        g.setVelocityY(-this.pj.salto);
        this.sound.play('salto', { volume: 0.3 });
        animar(this, 'jump');
    } else if (this.pj.dobleSalto && !enSuelo && this.saltosAire < 1 && JD(this.keys.up)) {
        // doble salto del mago (nunca frena: si ya sube más rápido, se suma un poco)
        this.saltosAire++;
        g.setVelocityY(Math.min(g.body.velocity.y - 120, -440));
        this.sound.play('salto', { volume: 0.3, rate: 1.35 });
        g.anims.play(`${this.pj.id}-jump`, false);
    }

    const deathThreshold = 90;

    if (g.y >= 390 - deathThreshold) { // linea para matar si cae por fuera de el area de jeugo
        killgesi(this, 'caida');
    }

    if (nivelActual === 0) trampasNivel1(this);
    actualizarTrampas(this);
    actualizarSorpresas(this, apiSorpresas);

    // puntos de control
    this.checkpoints.forEach(cp => {
        if (!cp.activo && this.mascotaGesi.x >= cp.x) activarCheckpoint(this, cp);
    });
}


function moveFloorPiece(floorPiece, newX) {
    (floorPiece.visuales || []).forEach(v => v.destroy());
    floorPiece.destroy();
    floorPiece.setX(newX);
}

// daño: cuánta salud quita durante la pelea con el jefe (fuera de la pelea, cualquier golpe mata)
function killgesi(game, causa, daño = 20) {
    const { mascotaGesi, scene, sound } = game;
    if (mascotaGesi.isDead || game.nivelTerminado) return;
    if (game.cinematica && causa !== 'caida') return;
    if (game.peleaJefe && causa !== 'caida' && causa !== 'sin_salud') {
        // contra el jefe ninguna protección anula el golpe: solo lo reduce
        if (estaInvulnerable(game)) return; // un instante después de cada golpe
        let factor = 1;
        if (game.tieneEscudo) {
            romperEscudo(game, texto => mostrarMensaje(game, texto, 900));
            factor *= 0.5; // el escudo absorbe la mitad y se rompe
        }
        if (protegido(game)) factor *= 0.5; // escudo mágico del mago o embestida del espadachín
        recibirDaño(game, Math.max(10, daño * factor));
        return;
    }
    // el escudo y la embestida protegen de todo menos de caer a la lava
    if (causa !== 'caida' && protegido(game)) return;
    if (causa !== 'caida') {
        // recién roto el escudo: unos instantes sin recibir daño
        if (estaInvulnerable(game)) return;
        // el primer golpe solo rompe el escudo
        if (game.tieneEscudo) {
            romperEscudo(game, texto => mostrarMensaje(game, texto, 900));
            return;
        }
    }
    mascotaGesi.isDead = true;
    game.atacando = false;
    game.dashHasta = 0;
    mascotaGesi.body.setAllowGravity(true);
    mascotaGesi.anims.play(`${game.pj.id}-dead`);
    mascotaGesi.setCollideWorldBounds(false);
    game.musica.stop();
    game.musicaBatalla?.stop();
    sound.add('gameover', { volume: 1 }).play();

    vidas = Math.max(0, vidas - 1);
    actualizarCorazones(game);
    if (game.corazones[vidas]) game.tweens.add({ targets: game.corazones[vidas], scale: 1.3, yoyo: true, duration: 150 });
    score = scoreInicioNivel;

    mascotaGesi.body.checkCollision.none = true;
    mascotaGesi.setVelocityX(0);

    game.time.delayedCall(120, () => mascotaGesi.setVelocityY(-200));

    if (vidas <= 0) {
        // sin corazones: GAME OVER y se vuelve al inicio del juego
        mostrarMensaje(game, `GAME OVER\nVuelves al inicio\ndel nivel ${nivelActual + 1}`);
        game.time.delayedCall(900, () => sound.play('game_over', { volume: 0.7 }));
        game.time.delayedCall(3500, () => {
            continuarPartida({ nivel: nivelActual, score: scoreInicioNivel });
            guardarPartida();
            scene.start('seleccion');
        });
        return;
    }

    mostrarMensaje(game, BURLAS[Math.floor(Math.random() * BURLAS.length)], 1600);

    // vuelve a aparecer en el último punto de control
    game.time.delayedCall(2200, () => scene.restart());
}
