// TROLLADAS: las 100 trampas troll al estilo Cat Mario (la lista completa, en tandas). Funcionan como
// las locuras (locuras.js las llama: mismo formato [x, tipo] en nivel.locuras) y las reparte azar.js en
// TODOS los niveles: cada nivel estrena una que nunca viste y mezcla las de antes.
//
// Reglas de justicia (las mismas de las locuras): todas avisan antes (una sombra, un crujido, un
// temblor) y, si hacen daño, primero se rompe el escudo. Algunas no hacen nada: solo asustan.
//
// TANDA 1
//   bloqueHuye     #1  el bloque "?" se escapa cuando saltas a golpearlo (a la tercera da una moneda)
//   yunques        #17 caen yunques de cartón (sombra antes)… y el último es de verdad
//   lampara        #18 la lámpara del techo cruje y cae justo cuando pasas
//   jaula          #21 una jaula cae y te encierra un momento
//   corazonFalso   #27 un corazón que late raro: al tomarlo, muerde
//   muertoFalso    #34 un esqueleto tirado en el suelo… se levanta detrás de ti
//   noMirarArriba  #51 "NO MIRES ARRIBA": arriba hay una roca que cae
//   camaraAtras    #72 la cámara se queda atrás un momento y sigues a ciegas
//   trollAsoma     #88 el troll se asoma por el borde de la pantalla, se ríe y se va (no hace nada)
//   monedaExplota  #90 una moneda que hace tic-tac: al tomarla, ¡BOOM! (te empuja, no daña)
//
// TANDA 2 (ideas nuevas, sin número de la lista)
//   gameOverFalso   pantalla de GAME OVER… "ES BROMA" (no hace nada)
//   falsaVictoria   "¡NIVEL COMPLETADO!" a mitad de camino… "…NAH" (no hace nada)
//   mundoAlReves    la pantalla se da vuelta 2 s (no daña; va en suelo firme largo)
//   resorteOculto   un destellito en el suelo: ¡BOING!, te lanza hacia arriba
//   botonRojo       botón "NO TOCAR": si lo pisas, cae un yunque donde estés (con sombra antes)
//   rocaCorre       cartel "CORRE": se oye un temblor y una roca te alcanza por detrás; hay que saltarla
//   fantasmaTimido  un fantasma te sigue por 8 s, pero se queda quieto si lo miras
//   manoTroll       una grieta que respira: una mano te agarra del pie 1 s (no daña)
//   palomaBomba     una paloma pasa y suelta un regalo (con sombra); solo te frena un momento
//   bombaReloj      cae una bomba delante con cuenta regresiva 3, 2, 1: aléjate
//
// TANDA 3 (ideas nuevas, sin número de la lista)
//   creditosFalsos  "FIN" con créditos a mitad de nivel (no hace nada)
//   cargandoFalso   "CARGANDO… 99 %" y no cargaba nada (no hace nada)
//   bateriaFalsa    pantalla negra: "EL REY TROLL APAGÓ LA PANTALLA" (no hace nada; a propósito no imita
//                   nada del sistema del teléfono: Google Play es estricto con eso)
//   tesoroFalso     una bolsa de 1.000.000 de monedas… de chocolate (no da nada)
//   banana          te resbalas y sales disparado hacia adelante (no daña; suelo firme largo)
//   pastelazo       un pastel vuela de frente; si no lo saltas, te tapa la pantalla un momento (no daña)
//   abejas          un panal cae y el enjambre te persigue 4,5 s: es más lento que el que corre
//   nubeRayos       una nube te sigue y lanza 3 rayos; marca el suelo antes: hay que moverse
//   patadaTroll     "¡OYE, TÚ!" y una patada te lanza adelante (no daña; suelo firme largo)
//   lavaPintada     un charco de lava con cartel… es pintura: al revés de una trampa (no hace nada)
//
// TANDA 4 (ideas nuevas, sin número de la lista)
//   puertaGiratoria una puerta con cartel SALIDA: te manda 100 px atrás (no daña)
//   cuentaFalsa     "ESTO EXPLOTA EN 5…" y no explota nada
//   premioReal      la sorpresa es que no hay trampa: cinco monedas de verdad
//   sapoSaltarin    un sapo viene a los saltos: hay que esquivarlo
//   globoTroll      un globo te levanta un rato y explota (no daña)
//   pisadasGigantes tiembla todo… y era un ratón
//   cartelSigue     un cartel "NO ME DEJES" te persigue 5 s (no daña)
//   gallinaBomba    una gallina pone tres huevos que explotan
//   canonTroll      tres balas a ras del suelo: hay que saltarlas
//   fotoTroll       "¡SONRÍE!", flash y burla (no hace nada)
//
// TANDA 5 (ideas nuevas, sin número de la lista)
//   vacaCae        una vaca cae del cielo (con sombra grande)
//   captchaFalso   "¿Eres humano?" sin nada que tocar (no hace nada)
//   anuncioTroll   "ANUNCIO DEL REY TROLL": dice claro que es broma; no se puede tocar ni vende nada
//   ovniTroll      un ovni te levanta si te quedas debajo de su luz (no daña)
//   aletaSuelo     una aleta viene de frente por el suelo: hay que saltarla
//   murcielagos    pasan a la altura de un salto: lo seguro es NO saltar
//   misilTroll     un misil te sigue 4 s: más lento que el que corre
//   fiestaTroll    confeti: "eres el visitante 1.000.000" (no hace nada)
//   imanMalo       un imán te arrastra hacia adelante 1,5 s (no daña; suelo firme largo)
//   pinturaTroll   un balde te tiñe de rosado hasta que mueras (solo se ve)
//
// TANDA 6 (ideas nuevas, sin número de la lista)
//   cajaSorpresa    un regalo que se mueve: sale un payaso y te empuja (no daña)
//   camaraLenta     todo va lento 2 s (solo jugando solo: en carrera o en línea no se activa)
//   laserRasante    una línea avisa y un láser barre el suelo: hay que estar en el aire
//   apagonTroll     2 s a oscuras, solo se ven unos ojos (no daña; suelo firme largo)
//   corazonesRobados el troll se lleva tus corazones del HUD… y los devuelve (no quita vidas)
//   puntajeFalso    el puntaje marca -9.999.999 un momento (no lo cambia)
//   abuelaBolso     una abuela cruza lento: si la chocas, bolsazo (te empuja, no daña)
//   perroCarinoso   un perro te persigue ladrando: si te alcanza, solo te lame
//   pinchosCobardes pinchos que se esconden al acercarte (nunca pinchan)
//   bumeranTroll    un bumerán pasa y vuelve: hay que saltarlo dos veces
//
// api (la de locuras): { killgesi(scene), crearEnemigo(scene, x, y, tipo), mostrarMensaje(scene, texto, ms) }

const SUELO_Y = 332;
const PROF = 41; // por encima de la oscuridad (como las locuras)

// el orden en que se estrenan: cada nivel suma una (la primera tanda se ve entera en el nivel 10)
export const TROLLADAS = [
    'bloqueHuye', 'yunques', 'trollAsoma', 'monedaExplota', 'noMirarArriba',
    'lampara', 'muertoFalso', 'corazonFalso', 'jaula', 'camaraAtras',
    // tanda 2
    'gameOverFalso', 'resorteOculto', 'botonRojo', 'palomaBomba', 'rocaCorre',
    'falsaVictoria', 'manoTroll', 'bombaReloj', 'mundoAlReves', 'fantasmaTimido',
    // tanda 3
    'lavaPintada', 'banana', 'tesoroFalso', 'pastelazo', 'abejas',
    'creditosFalsos', 'patadaTroll', 'nubeRayos', 'cargandoFalso', 'bateriaFalsa',
    // tanda 4
    'premioReal', 'sapoSaltarin', 'puertaGiratoria', 'pisadasGigantes', 'gallinaBomba',
    'globoTroll', 'cuentaFalsa', 'canonTroll', 'fotoTroll', 'cartelSigue',
    // tanda 5
    'vacaCae', 'fiestaTroll', 'murcielagos', 'pinturaTroll', 'aletaSuelo',
    'captchaFalso', 'imanMalo', 'misilTroll', 'ovniTroll', 'anuncioTroll',
    // tanda 6
    'pinchosCobardes', 'perroCarinoso', 'laserRasante', 'corazonesRobados', 'cajaSorpresa',
    'bumeranTroll', 'abuelaBolso', 'apagonTroll', 'puntajeFalso', 'camaraLenta',
];
// pantallas falsas a todo lo ancho: como mucho UNA por nivel (repetidas pierden la gracia; ver azar.js)
export const TROLLADAS_PANTALLA = ['gameOverFalso', 'falsaVictoria', 'creditosFalsos', 'cargandoFalso', 'bateriaFalsa', 'captchaFalso', 'anuncioTroll', 'apagonTroll'];
// dónde va cada una (azar.js): 'techo' = sin bloques ni plataformas encima; 'largo' = suelo firme
// largo por delante (se sigue a ciegas o se corre)
export const LUGAR_TROLLADA = {
    yunques: 'techo', lampara: 'techo', jaula: 'techo', noMirarArriba: 'techo', bloqueHuye: 'techo',
    camaraAtras: 'largo', muertoFalso: 'largo',
    botonRojo: 'techo', rocaCorre: 'largo', mundoAlReves: 'largo', fantasmaTimido: 'largo', bombaReloj: 'largo',
    abejas: 'techo', banana: 'largo', patadaTroll: 'largo', pastelazo: 'largo', nubeRayos: 'largo',
    premioReal: 'largo', sapoSaltarin: 'largo', gallinaBomba: 'largo', canonTroll: 'largo',
    pinturaTroll: 'techo', vacaCae: 'techo', ovniTroll: 'techo', aletaSuelo: 'largo', murcielagos: 'techo', misilTroll: 'largo', imanMalo: 'largo',
    laserRasante: 'largo', apagonTroll: 'largo', perroCarinoso: 'largo', abuelaBolso: 'largo', bumeranTroll: 'largo',
};
// las que no hacen daño (no cuentan como trampas)
export const TROLLADAS_INOFENSIVAS = ['trollAsoma', 'monedaExplota', 'bloqueHuye', 'gameOverFalso', 'falsaVictoria', 'mundoAlReves', 'resorteOculto', 'manoTroll', 'palomaBomba',
    'creditosFalsos', 'cargandoFalso', 'bateriaFalsa', 'tesoroFalso', 'banana', 'pastelazo', 'patadaTroll', 'lavaPintada',
    'puertaGiratoria', 'cuentaFalsa', 'premioReal', 'globoTroll', 'pisadasGigantes', 'cartelSigue', 'fotoTroll',
    'captchaFalso', 'anuncioTroll', 'ovniTroll', 'fiestaTroll', 'imanMalo', 'pinturaTroll',
    'cajaSorpresa', 'camaraLenta', 'apagonTroll', 'corazonesRobados', 'puntajeFalso', 'abuelaBolso', 'perroCarinoso', 'pinchosCobardes'];
// las que dependen de un jugador en particular (en línea: no se activan con los otros jugadores)
export const TROLLADAS_DE_CADA_JUGADOR = [
    'bloqueHuye', 'monedaExplota', 'corazonFalso', 'jaula', 'camaraAtras', 'trollAsoma',
    'gameOverFalso', 'falsaVictoria', 'mundoAlReves', 'resorteOculto', 'botonRojo', 'rocaCorre', 'fantasmaTimido', 'manoTroll', 'palomaBomba', 'bombaReloj',
    'creditosFalsos', 'cargandoFalso', 'bateriaFalsa', 'tesoroFalso', 'banana', 'pastelazo', 'abejas', 'nubeRayos', 'patadaTroll', 'lavaPintada',
    'puertaGiratoria', 'cuentaFalsa', 'premioReal', 'sapoSaltarin', 'globoTroll', 'pisadasGigantes', 'cartelSigue', 'gallinaBomba', 'canonTroll', 'fotoTroll',
    'vacaCae', 'captchaFalso', 'anuncioTroll', 'ovniTroll', 'aletaSuelo', 'murcielagos', 'misilTroll', 'fiestaTroll', 'imanMalo', 'pinturaTroll',
    'cajaSorpresa', 'camaraLenta', 'laserRasante', 'apagonTroll', 'corazonesRobados', 'puntajeFalso', 'abuelaBolso', 'perroCarinoso', 'pinchosCobardes', 'bumeranTroll',
];

const rect = b => new Phaser.Geom.Rectangle(b.left ?? b.x, b.top ?? b.y, b.width, b.height);
const choca = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);
const enSuelo = g => g.body.blocked.down || g.body.touching.down;
const burla = (scene, api, texto, ms = 900) => { api.mostrarMensaje(scene, texto, ms); scene.sound.play('trampa', { volume: 0.4 }); };

function texturas(scene) {
    if (scene.textures.exists('tr_yunque')) return;
    const g = scene.make.graphics({ add: false });
    // yunque
    g.fillStyle(0x5a5f6e).fillRect(4, 0, 40, 10).fillRect(14, 10, 20, 10).fillRect(8, 20, 32, 8);
    g.fillStyle(0x7d8394).fillRect(4, 0, 40, 3);
    g.generateTexture('tr_yunque', 48, 28);
    g.clear();
    // yunque de cartón (marrón, con una arruga)
    g.fillStyle(0xb58a55).fillRect(4, 0, 40, 10).fillRect(14, 10, 20, 10).fillRect(8, 20, 32, 8);
    g.lineStyle(1, 0x7a5a32).lineBetween(10, 4, 20, 7).lineBetween(26, 22, 34, 25);
    g.generateTexture('tr_carton', 48, 28);
    g.clear();
    // lámpara de velas
    g.fillStyle(0x8a6a2a).fillRect(0, 14, 56, 5).fillRect(26, 0, 4, 16);
    g.fillStyle(0xe8dcc0).fillRect(4, 6, 5, 8).fillRect(25, 6, 5, 0).fillRect(47, 6, 5, 8).fillRect(17, 6, 5, 8).fillRect(34, 6, 5, 8);
    g.fillStyle(0xffc94a).fillCircle(6, 4, 2).fillCircle(19, 4, 2).fillCircle(36, 4, 2).fillCircle(49, 4, 2);
    g.generateTexture('tr_lampara', 56, 20);
    g.clear();
    // jaula
    g.lineStyle(3, 0x6e6a80);
    for (let i = 0; i <= 6; i++) g.lineBetween(2 + i * 8, 6, 2 + i * 8, 76);
    g.fillStyle(0x55526a).fillRect(0, 0, 54, 7).fillRect(0, 74, 54, 6);
    g.generateTexture('tr_jaula', 54, 80);
    g.clear();
    // bloque "?"
    g.fillStyle(0xc98a1e).fillRect(0, 0, 32, 32);
    g.fillStyle(0xffc94a).fillRect(2, 2, 28, 28);
    g.fillStyle(0x7a4a0a).fillRect(12, 8, 8, 3).fillRect(18, 10, 3, 6).fillRect(14, 15, 5, 3).fillRect(14, 18, 3, 3).fillRect(14, 23, 3, 3);
    g.generateTexture('tr_bloque', 32, 32);
    g.clear();
    // roca
    g.fillStyle(0x6a6070).fillCircle(16, 16, 15);
    g.fillStyle(0x857a8c).fillCircle(11, 10, 5).fillCircle(21, 20, 3);
    g.generateTexture('tr_roca', 32, 32);
    g.clear();
    // sombra en el suelo
    g.fillStyle(0x000000, 0.45).fillEllipse(24, 5, 48, 10);
    g.generateTexture('tr_sombra', 48, 10);
    g.clear();
    // botón rojo
    g.fillStyle(0x4a4a58).fillRect(2, 12, 32, 6);
    g.fillStyle(0xd8263a).fillRoundedRect(7, 2, 22, 12, 5);
    g.fillStyle(0xff7a86).fillRect(11, 4, 8, 2);
    g.generateTexture('tr_boton', 36, 18);
    g.destroy();
}

// ---------- al armar el nivel ----------
export const CREAR_TROLLADAS = {
    bloqueHuye(scene, l) {
        texturas(scene);
        l.img = scene.add.image(l.x, 232, 'tr_bloque').setDepth(PROF);
        l.saltos = 0;
    },
    yunques(scene, l) { texturas(scene); },
    lampara(scene, l) {
        texturas(scene);
        l.cadena = scene.add.rectangle(l.x, 0, 3, 130, 0x55526a).setOrigin(0.5, 0).setDepth(PROF);
        l.img = scene.add.image(l.x, 130, 'tr_lampara').setOrigin(0.5, 0).setDepth(PROF);
        l.brillo = scene.add.image(l.x, 136, 'brillo').setDepth(PROF).setScale(1.4).setTint(0xffc94a).setAlpha(0.35).setBlendMode('ADD');
        scene.tweens.add({ targets: [l.img], angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' });
    },
    jaula(scene, l) {
        texturas(scene);
        l.cadena = scene.add.rectangle(l.x, 0, 3, 40, 0x55526a).setOrigin(0.5, 0).setDepth(PROF);
        l.img = scene.add.image(l.x, 40, 'tr_jaula').setOrigin(0.5, 0).setDepth(PROF);
    },
    corazonFalso(scene, l) {
        l.img = scene.add.image(l.x, 286, 'mz_corazon', 9).setDepth(PROF).setScale(0.8).setTint(0xff7ab0);
        // late raro: rápido y torcido (la pista)
        scene.tweens.add({ targets: l.img, scale: 0.95, angle: 8, yoyo: true, repeat: -1, duration: 220 });
    },
    muertoFalso(scene, l) {
        if (!scene.textures.exists('esqueleto-dead')) return false;
        l.img = scene.add.sprite(l.x, SUELO_Y + 2, 'esqueleto-dead', 2).setOrigin(0.5, 1).setDepth(5);
        // se mueve un poquito cada tanto (la pista)
        l.tic = scene.time.addEvent({ delay: 2200, loop: true, callback: () => l.img.active && scene.tweens.add({ targets: l.img, angle: 6, yoyo: true, duration: 90 }) });
    },
    noMirarArriba(scene, l) {
        texturas(scene);
        const palo = scene.add.rectangle(l.x - 120, SUELO_Y, 4, 70, 0x4a3420).setOrigin(0.5, 1).setDepth(PROF);
        const texto = scene.add.text(l.x - 120, SUELO_Y - 70, 'NO MIRES ARRIBA', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffe9a8', backgroundColor: '#3b2a1a', padding: { x: 5, y: 4 },
        }).setOrigin(0.5, 1).setDepth(PROF);
        l.cartel = [palo, texto];
        l.img = scene.add.image(l.x, 40, 'tr_roca').setDepth(PROF);
    },
    camaraAtras() {},
    trollAsoma() {},
    monedaExplota(scene, l) {
        l.img = scene.add.sprite(l.x, 300, 'coins').anims.play('coins-giro', true).setScale(0.75).setDepth(PROF).setTint(0xffb0a0);
        // tic-tac: se agranda un poquito, como si latiera (la pista)
        scene.tweens.add({ targets: l.img, scale: 0.85, yoyo: true, repeat: -1, duration: 260 });
    },
    // ---------- tanda 2 ----------
    gameOverFalso() {},
    falsaVictoria() {},
    mundoAlReves() {},
    palomaBomba() {},
    fantasmaTimido() {},
    bombaReloj() {},
    resorteOculto(scene, l) {
        // un destellito en el suelo (la pista)
        l.img = scene.add.image(l.x, SUELO_Y - 3, 'brillo').setScale(0.16).setTint(0x9fe8ff).setBlendMode('ADD').setDepth(PROF);
        scene.tweens.add({ targets: l.img, scale: 0.26, alpha: 0.4, yoyo: true, repeat: -1, duration: 600 });
    },
    botonRojo(scene, l) {
        texturas(scene);
        l.img = scene.add.image(l.x, SUELO_Y, 'tr_boton').setOrigin(0.5, 1).setDepth(PROF);
        l.cartel = scene.add.text(l.x, SUELO_Y - 26, 'NO TOCAR', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffe9a8', backgroundColor: '#3b2a1a', padding: { x: 5, y: 4 },
        }).setOrigin(0.5, 1).setDepth(PROF);
    },
    rocaCorre(scene, l) {
        l.cartel = scene.add.text(l.x, SUELO_Y - 58, 'CORRE', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#ffe9a8', backgroundColor: '#3b2a1a', padding: { x: 5, y: 4 },
        }).setOrigin(0.5, 1).setDepth(PROF);
        l.palo = scene.add.rectangle(l.x, SUELO_Y, 4, 58, 0x4a3420).setOrigin(0.5, 1).setDepth(PROF);
    },
    manoTroll(scene, l) {
        texturas(scene);
        // una grieta oscura que respira (la pista)
        l.img = scene.add.image(l.x, SUELO_Y - 1, 'tr_sombra').setScale(0.7, 0.5).setDepth(PROF);
        scene.tweens.add({ targets: l.img, scaleX: 0.9, yoyo: true, repeat: -1, duration: 700 });
    },
    // ---------- tanda 3 ----------
    creditosFalsos() {},
    cargandoFalso() {},
    bateriaFalsa() {},
    pastelazo() {},
    nubeRayos() {},
    patadaTroll() {},
    tesoroFalso(scene, l) {
        l.img = scene.add.text(l.x, SUELO_Y - 20, '💰', { fontSize: '26px' }).setOrigin(0.5).setDepth(PROF);
        scene.tweens.add({ targets: l.img, y: l.img.y - 6, angle: 6, yoyo: true, repeat: -1, duration: 420 }); // (demasiado contento: la pista)
    },
    banana(scene, l) {
        l.img = scene.add.text(l.x, SUELO_Y + 2, '🍌', { fontSize: '20px' }).setOrigin(0.5, 1).setDepth(PROF);
    },
    abejas(scene, l) {
        l.cuerda = scene.add.rectangle(l.x, 0, 2, 140, 0x4a3420).setOrigin(0.5, 0).setDepth(PROF);
        l.img = scene.add.text(l.x, 140, '🍯', { fontSize: '26px' }).setOrigin(0.5, 0).setDepth(PROF);
        scene.tweens.add({ targets: l.img, angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 500 }); // (zumba: la pista)
    },
    lavaPintada(scene, l) {
        l.img = scene.add.rectangle(l.x, SUELO_Y + 2, 110, 12, 0xff5a1f).setOrigin(0.5, 1).setDepth(PROF);
        scene.tweens.add({ targets: l.img, alpha: 0.75, yoyo: true, repeat: -1, duration: 500 });
        l.cartel = scene.add.text(l.x, SUELO_Y - 34, '⚠ LAVA', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffe9a8', backgroundColor: '#3b2a1a', padding: { x: 5, y: 4 },
        }).setOrigin(0.5, 1).setDepth(PROF);
    },
    // ---------- tanda 4 ----------
    cuentaFalsa() {},
    premioReal() {},
    sapoSaltarin() {},
    pisadasGigantes() {},
    gallinaBomba() {},
    canonTroll() {},
    fotoTroll() {},
    puertaGiratoria(scene, l) {
        l.img = scene.add.text(l.x, SUELO_Y + 2, '🚪', { fontSize: '46px' }).setOrigin(0.5, 1).setDepth(5);
        l.cartel = scene.add.text(l.x, SUELO_Y - 54, 'SALIDA', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#8dff9a', backgroundColor: '#14301c', padding: { x: 5, y: 4 },
        }).setOrigin(0.5, 1).setDepth(PROF);
    },
    globoTroll(scene, l) {
        l.img = scene.add.text(l.x, SUELO_Y - 40, '🎈', { fontSize: '28px' }).setOrigin(0.5).setDepth(PROF);
        scene.tweens.add({ targets: l.img, y: l.img.y - 8, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
    },
    cartelSigue(scene, l) {
        l.img = scene.add.text(l.x, SUELO_Y - 2, 'NO ME DEJES', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffe9a8', backgroundColor: '#3b2a1a', padding: { x: 5, y: 4 },
        }).setOrigin(0.5, 1).setDepth(PROF);
    },
    // ---------- tanda 5 ----------
    vacaCae() {},
    captchaFalso() {},
    anuncioTroll() {},
    ovniTroll() {},
    aletaSuelo() {},
    murcielagos() {},
    misilTroll() {},
    fiestaTroll() {},
    imanMalo() {},
    pinturaTroll(scene, l) {
        l.cuerda = scene.add.rectangle(l.x, 0, 2, 130, 0x4a3420).setOrigin(0.5, 0).setDepth(PROF);
        l.img = scene.add.text(l.x, 130, '🪣', { fontSize: '26px' }).setOrigin(0.5, 0).setDepth(PROF);
        scene.tweens.add({ targets: l.img, angle: { from: -5, to: 5 }, yoyo: true, repeat: -1, duration: 700 });
    },
    // ---------- tanda 6 ----------
    camaraLenta() {},
    laserRasante() {},
    apagonTroll() {},
    corazonesRobados() {},
    puntajeFalso() {},
    abuelaBolso() {},
    perroCarinoso() {},
    bumeranTroll() {},
    cajaSorpresa(scene, l) {
        l.img = scene.add.text(l.x, SUELO_Y + 2, '🎁', { fontSize: '26px' }).setOrigin(0.5, 1).setDepth(PROF);
        scene.tweens.add({ targets: l.img, angle: { from: -4, to: 4 }, yoyo: true, repeat: -1, duration: 260 }); // (se mueve sola: la pista)
    },
    pinchosCobardes(scene, l) {
        l.puas = [-1, 0, 1].map(i => scene.add.image(l.x - 16 + i * 32, SUELO_Y, 'pincho').setOrigin(0, 1).setDepth(PROF));
    },
};

// ---------- cada fotograma ----------
export const ACTUALIZAR_TROLLADAS = {
    bloqueHuye(scene, l, api, { gb, gx }) {
        if (l.hecha || l.saltando || Math.abs(gx - l.img.x) > 46 || gb.velocity.y >= 0 || gb.top > 300) return;
        l.saltando = true;
        l.saltos++;
        scene.sound.play('salto', { volume: 0.3, rate: 1.7 });
        if (l.saltos >= 3) {
            // a la tercera se deja: suelta una moneda de verdad
            l.hecha = true;
            scene.tweens.add({ targets: l.img, y: l.img.y - 10, yoyo: true, duration: 90 });
            scene.coins.create(l.img.x, l.img.y - 34, 'coins').anims.play('coins-giro', true).setScale(0.75).refreshBody();
            api.mostrarMensaje(scene, 'BUENO, TOMA…', 700);
            return;
        }
        if (l.saltos === 1) burla(scene, api, '¡JE! ¡NO ME ALCANZAS!', 800);
        scene.tweens.add({ targets: l.img, x: l.img.x + 150, duration: 380, ease: 'Quad.out' });
        scene.tweens.add({ targets: l.img, y: 190, yoyo: true, duration: 190, onComplete: () => { l.saltando = false; } });
    },
    yunques(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x - 150 || gx > l.x + 300) return;
        l.hecha = true;
        // tres de cartón (delante de ti, para que aprendas que no pasa nada)… y el cuarto, de verdad, donde estés
        [0, 1, 2].forEach(i => scene.time.delayedCall(i * 520, () => caer(scene, api, gx + 70 + i * 60, false)));
        scene.time.delayedCall(3 * 520 + 250, () => caer(scene, api, scene.mascotaGesi.body.center.x, true));
    },
    lampara(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x - 130 || gx > l.x + 20) return;
        l.hecha = true;
        scene.sound.play('romper', { volume: 0.3, rate: 1.8 });
        scene.tweens.killTweensOf(l.img);
        scene.tweens.add({ targets: l.img, angle: { from: -10, to: 10 }, yoyo: true, repeat: 2, duration: 90 });
        scene.time.delayedCall(560, () => {
            l.cadena.destroy();
            scene.tweens.add({ targets: [l.img, l.brillo], y: SUELO_Y - 20, duration: 330, ease: 'Quad.in', onComplete: () => {
                scene.sound.play('romper');
                scene.cameras.main.shake(120, 0.005);
                const zona = new Phaser.Geom.Rectangle(l.x - 30, SUELO_Y - 70, 60, 70);
                if (choca(zona, rect(scene.mascotaGesi.body))) api.killgesi(scene);
                else api.mostrarMensaje(scene, '¡UY! CASI', 600);
                scene.tweens.add({ targets: l.brillo, alpha: 0, duration: 300 });
            } });
        });
    },
    jaula(scene, l, api, { g, gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 24 || !enSuelo(g)) return;
        l.hecha = true;
        scene.sound.play('romper', { volume: 0.3, rate: 1.5 });
        scene.tweens.add({ targets: l.img, x: '+=2', yoyo: true, repeat: 3, duration: 40 });
        scene.time.delayedCall(260, () => {
            const x = scene.mascotaGesi.body.center.x;
            const atrapado = Math.abs(x - l.x) < 30;
            scene.tweens.add({ targets: l.img, y: SUELO_Y - 80, duration: 200, ease: 'Quad.in', onComplete: () => {
                scene.sound.play('romper');
                if (atrapado) {
                    scene.aturdidoHasta = scene.time.now + 1700;
                    burla(scene, api, '¡ENJAULADO! JA JA', 1200);
                }
                scene.time.delayedCall(1700, () => scene.tweens.add({ targets: [l.img, l.cadena], y: '-=400', duration: 700, ease: 'Quad.in' }));
            } });
        });
    },
    corazonFalso(scene, l, api, { rGesi }) {
        if (l.hecha || !choca(new Phaser.Geom.Rectangle(l.x - 12, 274, 24, 24), rGesi)) return;
        l.hecha = true;
        scene.tweens.killTweensOf(l.img);
        l.img.setTint(0x9b2fff);
        scene.tweens.add({ targets: l.img, scale: 1.4, duration: 120, onComplete: () => l.img.destroy() });
        burla(scene, api, '¡ÑAM! ERA UN CORAZÓN MORDEDOR', 1100);
        api.killgesi(scene);
    },
    muertoFalso(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x + 60) return;
        l.hecha = true;
        l.tic.remove();
        scene.tweens.add({ targets: l.img, angle: -20, alpha: 0, duration: 250, onComplete: () => l.img.destroy() });
        api.crearEnemigo(scene, l.x - 20, SUELO_Y - 2, 'esqueleto');
        burla(scene, api, '¡NO ESTABA MUERTO!', 1000);
    },
    noMirarArriba(scene, l, api, { gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 40) return;
        l.hecha = true;
        scene.tweens.add({ targets: l.img, x: '+=3', yoyo: true, repeat: 4, duration: 50 });
        scene.time.delayedCall(450, () => scene.tweens.add({ targets: l.img, y: SUELO_Y - 16, duration: 380, ease: 'Quad.in', onComplete: () => {
            scene.sound.play('romper');
            scene.cameras.main.shake(100, 0.004);
            const zona = new Phaser.Geom.Rectangle(l.x - 22, SUELO_Y - 60, 44, 60);
            if (choca(zona, rect(scene.mascotaGesi.body))) api.killgesi(scene);
            else api.mostrarMensaje(scene, '¿VES? NO HABÍA QUE MIRAR', 900);
        } }));
    },
    camaraAtras(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        scene.camaraQuietaHasta = scene.time.now + 1300; // (game.js: moverCamara no se mueve hasta entonces)
        burla(scene, api, '¿Y LA CÁMARA? 🙃', 900);
    },
    trollAsoma(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        const cam = scene.cameras.main;
        const arriba = Math.random() < 0.5;
        const x = cam.width * (0.25 + Math.random() * 0.5);
        const cara = scene.add.text(x, arriba ? -40 : cam.height + 40, '👹', { fontSize: '44px' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(60);
        const risa = scene.add.text(x + 40, arriba ? 50 : cam.height - 60, 'JE JE JE', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#ff4d5e', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(60).setAlpha(0);
        scene.tweens.add({ targets: cara, y: arriba ? 26 : cam.height - 26, duration: 350, yoyo: true, hold: 1100, onComplete: () => cara.destroy() });
        scene.tweens.add({ targets: risa, alpha: 1, delay: 350, duration: 150, yoyo: true, hold: 800, onComplete: () => risa.destroy() });
        scene.sound.play('trampa', { volume: 0.3, rate: 0.8 });
    },
    monedaExplota(scene, l, api, { g, gx, gb }) {
        if (l.hecha || Math.abs(gx - l.x) > 18 || Math.abs(gb.center.y - 300) > 36) return;
        l.hecha = true;
        const boom = scene.add.circle(l.x, 300, 10, 0xffa040, 0.9).setDepth(PROF);
        scene.tweens.add({ targets: boom, scale: 5, alpha: 0, duration: 350, onComplete: () => boom.destroy() });
        l.img.destroy();
        scene.sound.play('romper');
        scene.cameras.main.shake(140, 0.006);
        g.setVelocity((g.flipX ? 1 : -1) * 320, -260);
        scene.empujadoHasta = scene.time.now + 300;
        api.mostrarMensaje(scene, '¡BOOM! REGALO DEL TROLL', 900);
    },
    // ---------- tanda 2 ----------
    gameOverFalso(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        scene.aturdidoHasta = scene.time.now + 1700; // (quieto: que la broma no te tire a la lava)
        scene.sound.play('game_over', { volume: 0.5 });
        pantallaFalsa(scene, 'GAME OVER', '#ff4d5e', 'Pierdes todos los puntos', 1100, () => {
            scene.sound.play('trampa', { volume: 0.4 });
            pantallaFalsa(scene, 'ES BROMA 😜', '#ffe066', 'Tenías que ver tu cara', 600);
        });
    },
    falsaVictoria(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        scene.aturdidoHasta = scene.time.now + 1700;
        scene.sound.play('victoria', { volume: 0.4 });
        pantallaFalsa(scene, '¡NIVEL COMPLETADO!', '#ffe066', '¡Eres increíble!', 1100, () => {
            scene.sound.play('trampa', { volume: 0.4 });
            pantallaFalsa(scene, '…NAH 😏', '#ff8a8a', 'Sigue caminando', 600);
        });
    },
    mundoAlReves(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        // se gira el dibujo del juego (no la cámara): así no toca nada del nivel
        const lienzo = scene.game.canvas;
        lienzo.style.transition = 'transform 0.45s ease-in-out';
        lienzo.style.transform = 'rotate(180deg)';
        const volver = () => { lienzo.style.transform = ''; };
        scene.events.once('shutdown', volver);
        setTimeout(volver, 2200); // (reloj del navegador: si pausan, no se queda de cabeza)
        burla(scene, api, '¡MUNDO AL REVÉS!', 1000);
    },
    resorteOculto(scene, l, api, { g, gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 16 || !enSuelo(g)) return;
        l.hecha = true;
        l.img.destroy();
        g.setVelocityY(-640);
        scene.sound.play('salto', { volume: 0.5, rate: 0.7 });
        api.mostrarMensaje(scene, '¡BOING!', 700);
    },
    botonRojo(scene, l, api, { g, gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 18 || !enSuelo(g)) return;
        l.hecha = true;
        l.img.setScale(1, 0.5);
        scene.sound.play('bump', { volume: 0.6, rate: 0.7 });
        burla(scene, api, '¿QUÉ PARTE DE "NO TOCAR" NO ENTENDISTE?', 1300);
        // uno de cartón delante y el de verdad donde estés (con su sombra, hay tiempo de moverse)
        scene.time.delayedCall(300, () => caer(scene, api, gx + 90, false));
        scene.time.delayedCall(800, () => caer(scene, api, scene.mascotaGesi.body.center.x, true));
    },
    rocaCorre(scene, l, api, { gx, rGesi, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            scene.cameras.main.shake(800, 0.003);
            scene.sound.play('romper', { volume: 0.4, rate: 0.6 });
            burla(scene, api, 'ESE RUIDO… ¡CORRE!', 900);
            scene.time.delayedCall(900, () => {
                texturas(scene);
                l.roca = scene.add.image(scene.cameras.main.worldView.x - 40, SUELO_Y - 22, 'tr_roca').setScale(1.4).setDepth(PROF);
                l.vive = 4000;
            });
        }
        if (!l.roca) return;
        // alcanza al que corre (300 px/s contra 220): hay que saltarla
        l.roca.x += 300 * dt;
        l.roca.angle += 400 * dt;
        l.vive -= dt * 1000;
        if (!l.pego && dt && choca(new Phaser.Geom.Rectangle(l.roca.x - 16, l.roca.y - 16, 32, 36), rGesi)) {
            l.pego = true;
            api.killgesi(scene);
        }
        if (l.vive <= 0) { l.roca.destroy(); l.roca = null; }
    },
    fantasmaTimido(scene, l, api, { g, gx, gb, rGesi, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            l.fant = scene.add.text(gx - 260, gb.center.y - 20, '👻', { fontSize: '30px' }).setOrigin(0.5).setDepth(PROF);
            l.vive = 8000;
            burla(scene, api, 'NO LE DES LA ESPALDA…', 1200);
        }
        if (!l.fant) return;
        l.vive -= dt * 1000;
        // como los fantasmas tímidos: si lo miras se queda quieto y se tapa; si no, se acerca
        const dx = gx - l.fant.x, dy = gb.center.y - l.fant.y;
        const mirando = (dx > 0) === g.flipX;
        l.fant.setAlpha(mirando ? 0.45 : 0.95);
        if (!mirando) {
            const d = Math.max(1, Math.hypot(dx, dy));
            l.fant.x += dx / d * 170 * dt;
            l.fant.y += dy / d * 170 * dt;
        }
        if (dt && choca(new Phaser.Geom.Rectangle(l.fant.x - 12, l.fant.y - 12, 24, 24), rGesi)) {
            l.vive = 0;
            api.killgesi(scene);
        }
        if (l.vive <= 0) {
            const f = l.fant;
            l.fant = null;
            scene.tweens.add({ targets: f, alpha: 0, y: f.y - 30, duration: 400, onComplete: () => f.destroy() });
        }
    },
    manoTroll(scene, l, api, { g, gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 20 || !enSuelo(g)) return;
        l.hecha = true;
        l.img.destroy();
        scene.aturdidoHasta = scene.time.now + 1000;
        g.setVelocityX(0);
        const mano = scene.add.text(gx, SUELO_Y + 20, '🖐️', { fontSize: '30px' }).setOrigin(0.5, 1).setDepth(PROF);
        scene.tweens.add({ targets: mano, y: SUELO_Y + 4, duration: 160, yoyo: true, hold: 800, onComplete: () => mano.destroy() });
        burla(scene, api, '¡TE AGARRÉ EL PIE!', 900);
    },
    palomaBomba(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        const vista = scene.cameras.main.worldView;
        const y = vista.y + 44;
        const ave = scene.add.text(vista.right + 30, y, '🐦', { fontSize: '26px' }).setOrigin(0.5).setDepth(PROF).setFlipX(true);
        scene.tweens.add({ targets: ave, x: vista.x - 40, duration: 1900, onComplete: () => ave.destroy() });
        scene.time.delayedCall(800, () => {
            const x = scene.mascotaGesi.body.center.x;
            texturas(scene);
            const sombra = scene.add.image(x, SUELO_Y - 2, 'tr_sombra').setScale(0.5).setDepth(PROF);
            const gota = scene.add.circle(x, y, 6, 0xf2f2e6).setDepth(PROF);
            scene.tweens.add({ targets: gota, y: SUELO_Y - 8, duration: 620, ease: 'Quad.in', onComplete: () => {
                sombra.destroy();
                gota.destroy();
                const b = scene.mascotaGesi.body;
                if (b && Math.abs(b.center.x - x) < 24 && b.bottom > SUELO_Y - 60) {
                    scene.aturdidoHasta = scene.time.now + 500;
                    scene.mascotaGesi.setTint(0xf2f2e6);
                    scene.time.delayedCall(500, () => scene.mascotaGesi.active && scene.mascotaGesi.clearTint());
                    burla(scene, api, '¡PLOF! DA BUENA SUERTE', 1000);
                } else api.mostrarMensaje(scene, '¡TE SALVASTE DE LA PALOMA!', 800);
            } });
        });
    },
    bombaReloj(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        const x = gx + 90;
        const bomba = scene.add.text(x, scene.cameras.main.worldView.y - 30, '💣', { fontSize: '30px' }).setOrigin(0.5, 1).setDepth(PROF);
        const cuenta = scene.add.text(x, SUELO_Y - 44, '', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '12px', color: '#ff4d5e', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(PROF);
        scene.tweens.add({ targets: bomba, y: SUELO_Y, duration: 420, ease: 'Bounce.out' });
        ['3', '2', '1'].forEach((t, i) => scene.time.delayedCall(420 + i * 600, () => {
            cuenta.setText(t);
            scene.sound.play('menu_mover', { volume: 0.5, rate: 1 + i * 0.3 });
        }));
        scene.time.delayedCall(420 + 3 * 600, () => {
            bomba.destroy();
            cuenta.destroy();
            const boom = scene.add.circle(x, SUELO_Y - 20, 14, 0xffa040, 0.9).setDepth(PROF);
            scene.tweens.add({ targets: boom, scale: 6, alpha: 0, duration: 350, onComplete: () => boom.destroy() });
            scene.sound.play('romper');
            scene.cameras.main.shake(180, 0.008);
            const zona = new Phaser.Geom.Rectangle(x - 80, SUELO_Y - 90, 160, 90);
            if (choca(zona, rect(scene.mascotaGesi.body))) api.killgesi(scene);
            else api.mostrarMensaje(scene, '¡UF! POR POCO', 700);
        });
    },
    // ---------- tanda 3 ----------
    creditosFalsos(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        scene.aturdidoHasta = scene.time.now + 2300;
        scene.sound.play('victoria', { volume: 0.3 });
        pantallaFalsa(scene, 'FIN', '#eef1f7', 'Gracias por jugar · Dirigido por el Rey Troll · Basado en hechos reales', 1600, () => {
            scene.sound.play('trampa', { volume: 0.4 });
            pantallaFalsa(scene, '¿TE LO CREÍSTE? 😜', '#ffe066', 'Sigue, que falta nivel', 650);
        });
    },
    cargandoFalso(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        scene.aturdidoHasta = scene.time.now + 2200;
        const capa = pantallaFalsa(scene, 'CARGANDO…', '#b9c3ff', '12 %', 1600, () => {
            scene.sound.play('trampa', { volume: 0.4 });
            pantallaFalsa(scene, 'NO CARGABA NADA 😏', '#ffe066', 'Solo quería verte esperar', 550);
        });
        [41, 78, 96, 99].forEach((n, i) => setTimeout(() => { capa.querySelector('span').textContent = `${n} %`; }, 250 * (i + 1)));
    },
    bateriaFalsa(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        scene.aturdidoHasta = scene.time.now + 2100;
        pantallaFalsa(scene, '👹 APAGUÉ LA PANTALLA', '#ff4d5e', 'Firmado: el Rey Troll', 1500, () => {
            scene.sound.play('trampa', { volume: 0.4 });
            pantallaFalsa(scene, 'TE ASUSTÉ 😜', '#ffe066', 'Ya la prendí', 550);
        }, true);
    },
    tesoroFalso(scene, l, api, { rGesi }) {
        if (l.hecha || !choca(new Phaser.Geom.Rectangle(l.x - 16, SUELO_Y - 36, 32, 36), rGesi)) return;
        l.hecha = true;
        scene.tweens.killTweensOf(l.img);
        l.img.destroy();
        scene.sound.play('moneda', { volume: 0.5 });
        api.mostrarMensaje(scene, '¡1.000.000 DE MONEDAS!', 900);
        scene.time.delayedCall(950, () => burla(scene, api, '…DE CHOCOLATE 🍫', 1000));
    },
    banana(scene, l, api, { g, gb, rGesi }) {
        if (l.hecha || !enSuelo(g) || !choca(new Phaser.Geom.Rectangle(l.x - 12, SUELO_Y - 16, 24, 18), rGesi)) return;
        l.hecha = true;
        l.img.destroy();
        const lado = gb.velocity.x < 0 ? -1 : 1;
        g.setVelocity(lado * 420, -120);
        scene.empujadoHasta = scene.time.now + 650;
        scene.tweens.add({ targets: g, angle: lado * 360, duration: 500, onComplete: () => g.setAngle(0) });
        scene.sound.play('salto', { volume: 0.4, rate: 1.6 });
        api.mostrarMensaje(scene, '¡RESBALÓN!', 800);
    },
    pastelazo(scene, l, api, { gx, gb, rGesi, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            burla(scene, api, '¿HUELES ESO?', 800);
            scene.time.delayedCall(800, () => {
                const y = scene.mascotaGesi.body.center.y;
                l.pastel = scene.add.text(scene.cameras.main.worldView.right + 30, y, '🥧', { fontSize: '28px' }).setOrigin(0.5).setDepth(PROF);
                l.vive = 3000;
            });
        }
        if (!l.pastel) return;
        l.pastel.x -= 400 * dt; // viene de frente, a la altura de la cara: se salta
        l.pastel.angle -= 300 * dt;
        l.vive -= dt * 1000;
        if (dt && choca(new Phaser.Geom.Rectangle(l.pastel.x - 12, l.pastel.y - 12, 24, 24), rGesi)) {
            l.vive = 0;
            pantallaManchada(scene);
            burla(scene, api, '¡PASTELAZO!', 1000);
        }
        if (l.vive <= 0) { l.pastel.destroy(); l.pastel = null; }
    },
    abejas(scene, l, api, { gx, gb, rGesi, dt }) {
        if (!l.hecha && Math.abs(gx - l.x) < 60) {
            l.hecha = true;
            l.cuerda.destroy();
            scene.tweens.killTweensOf(l.img);
            scene.tweens.add({ targets: l.img, y: SUELO_Y - 26, duration: 420, ease: 'Quad.in', onComplete: () => l.img.destroy() });
            l.enjambre = scene.add.text(l.x, 160, '🐝🐝🐝', { fontSize: '16px' }).setOrigin(0.5).setDepth(PROF);
            l.vive = 4500;
            burla(scene, api, '¡EL PANAL! ¡CORRE!', 900);
        }
        if (!l.enjambre) return;
        l.vive -= dt * 1000;
        // más lentas que el que corre: si te detienes, te alcanzan
        const dx = gx - l.enjambre.x, dy = gb.center.y - l.enjambre.y, d = Math.max(1, Math.hypot(dx, dy));
        l.enjambre.x += dx / d * 190 * dt;
        l.enjambre.y += dy / d * 190 * dt + Math.sin(l.vive / 80) * 0.6;
        if (dt && choca(new Phaser.Geom.Rectangle(l.enjambre.x - 16, l.enjambre.y - 10, 32, 20), rGesi)) {
            l.vive = 0;
            api.killgesi(scene);
        }
        if (l.vive <= 0) {
            const e = l.enjambre;
            l.enjambre = null;
            scene.tweens.add({ targets: e, alpha: 0, y: e.y - 40, duration: 400, onComplete: () => e.destroy() });
        }
    },
    nubeRayos(scene, l, api, { gx, gb, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            l.nube = scene.add.text(gx, gb.top - 90, '🌩️', { fontSize: '34px' }).setOrigin(0.5).setDepth(PROF);
            l.vive = 5000;
            burla(scene, api, 'ESA NUBE TE TIENE GANAS', 1000);
            [1100, 2300, 3500].forEach(ms => scene.time.delayedCall(ms, () => rayoDeNube(scene, api, l)));
        }
        if (!l.nube) return;
        l.vive -= dt * 1000;
        l.nube.x += (gx - l.nube.x) * Math.min(1, dt * 4);
        l.nube.y += (gb.top - 90 - l.nube.y) * Math.min(1, dt * 4);
        if (l.vive <= 0) {
            const n = l.nube;
            l.nube = null;
            scene.tweens.add({ targets: n, alpha: 0, y: n.y - 30, duration: 400, onComplete: () => n.destroy() });
        }
    },
    patadaTroll(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        burla(scene, api, '¡OYE, TÚ!', 600);
        scene.time.delayedCall(550, () => {
            const g = scene.mascotaGesi;
            if (!g.active || g.isDead) return;
            const b = g.body;
            const pie = scene.add.text(b.center.x - 60, b.center.y, '🦶', { fontSize: '30px' }).setOrigin(0.5).setDepth(PROF);
            scene.tweens.add({ targets: pie, x: b.center.x - 10, duration: 110, yoyo: true, hold: 150, onComplete: () => pie.destroy() });
            scene.time.delayedCall(100, () => {
                if (!g.active || g.isDead) return;
                g.setVelocity(460, -180);
                scene.empujadoHasta = scene.time.now + 450;
                scene.sound.play('bump', { volume: 0.6, rate: 0.8 });
                api.mostrarMensaje(scene, '¡APÚRATE!', 700);
            });
        });
    },
    lavaPintada(scene, l, api, { g, gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 44 || !enSuelo(g)) return;
        l.hecha = true;
        scene.tweens.killTweensOf(l.img);
        scene.tweens.add({ targets: [l.img, l.cartel], alpha: 0, duration: 500, onComplete: () => { l.img.destroy(); l.cartel.destroy(); } });
        burla(scene, api, '¡ERA PINTURA! 🎨', 1000);
    },
    // ---------- tanda 4 ----------
    puertaGiratoria(scene, l, api, { g, gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 14 || !enSuelo(g)) return;
        l.hecha = true;
        g.setPosition(g.x - 100, g.y); // (dentro del suelo firme: el reparto deja 120 px a cada lado)
        scene.tweens.add({ targets: g, alpha: 0.3, yoyo: true, repeat: 2, duration: 80, onComplete: () => g.setAlpha(1) });
        scene.sound.play('aparece', { volume: 0.4 });
        burla(scene, api, '¡POR AQUÍ NO! 🚪', 900);
    },
    cuentaFalsa(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        ['5', '4', '3', '2', '1'].forEach((n, i) => scene.time.delayedCall(i * 750, () => {
            api.mostrarMensaje(scene, `ESTO EXPLOTA EN ${n}`, 700);
            scene.sound.play('menu_mover', { volume: 0.5, rate: 1 + i * 0.2 });
        }));
        scene.time.delayedCall(5 * 750, () => burla(scene, api, 'NO HABÍA NADA 😏', 1000));
    },
    premioReal(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        api.mostrarMensaje(scene, 'HOY ESTOY DE BUENAS… 👹', 1100);
        scene.sound.play('moneda', { volume: 0.5 });
        // de verdad: cinco monedas delante (va en suelo firme largo)
        for (let i = 0; i < 5; i++) {
            scene.coins.create(gx + 70 + i * 34, SUELO_Y - 40, 'coins').anims.play('coins-giro', true).setScale(0.75).refreshBody();
        }
    },
    sapoSaltarin(scene, l, api, { gx, rGesi, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            l.sapo = scene.add.text(gx + 300, SUELO_Y, '🐸', { fontSize: '30px' }).setOrigin(0.5, 1).setDepth(PROF);
            l.t = 0;
            burla(scene, api, 'CROAC…', 700);
        }
        if (!l.sapo) return;
        l.t += dt;
        // viene a los saltos: se pasa por encima cuando está abajo, o por debajo cuando está arriba
        l.sapo.x -= 150 * dt;
        l.sapo.y = SUELO_Y - Math.abs(Math.sin(l.t * Math.PI / 0.7)) * 60;
        let fin = l.t > 4.5;
        if (dt && choca(new Phaser.Geom.Rectangle(l.sapo.x - 13, l.sapo.y - 26, 26, 26), rGesi)) {
            fin = true;
            api.killgesi(scene);
        }
        if (fin) { l.sapo.destroy(); l.sapo = null; }
    },
    globoTroll(scene, l, api, { g, rGesi, dt }) {
        if (!l.hecha && choca(new Phaser.Geom.Rectangle(l.x - 14, l.img.y - 16, 28, 32), rGesi)) {
            l.hecha = true;
            l.vive = 1.6;
            scene.tweens.killTweensOf(l.img);
            api.mostrarMensaje(scene, '¡ME LLEVAAA! 🎈', 1000);
        }
        if (l.vive === undefined || l.vive <= 0) return;
        l.vive -= dt;
        g.setVelocityY(-110);
        l.img.setPosition(g.x, g.body.top - 18);
        if (l.vive <= 0) {
            l.img.destroy();
            scene.sound.play('bump', { volume: 0.5, rate: 1.8 });
            api.mostrarMensaje(scene, '¡PUM!', 500);
        }
    },
    pisadasGigantes(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        api.mostrarMensaje(scene, '¿QUÉ ES ESE RUIDO?', 1800);
        [0, 700, 1400].forEach(ms => scene.time.delayedCall(ms, () => {
            scene.cameras.main.shake(260, 0.012);
            scene.sound.play('romper', { volume: 0.6, rate: 0.5 });
        }));
        scene.time.delayedCall(2100, () => {
            const vista = scene.cameras.main.worldView;
            const raton = scene.add.text(vista.right + 20, SUELO_Y + 2, '🐭', { fontSize: '20px' }).setOrigin(0.5, 1).setDepth(PROF);
            scene.tweens.add({ targets: raton, x: vista.x - 30, duration: 2200, onComplete: () => raton.destroy() });
            burla(scene, api, '¿ESO ERA TODO?', 1200);
        });
    },
    cartelSigue(scene, l, api, { g, gx, dt }) {
        if (!l.hecha && gx > l.x + 30) {
            l.hecha = true;
            l.vive = 5;
            api.mostrarMensaje(scene, 'NO ME DEJES SOLO 😢', 1000);
        }
        if (l.vive === undefined || l.vive <= 0) return;
        l.vive -= dt;
        const objetivo = gx + (g.flipX ? 70 : -70), paso = Math.min(Math.abs(objetivo - l.img.x), 230 * dt);
        l.img.x += Math.sign(objetivo - l.img.x) * paso;
        l.img.y = g.body.bottom - 2 - Math.abs(Math.sin(l.vive * 9)) * 10;
        if (l.vive <= 0) {
            l.img.setText('ADIÓS…');
            scene.tweens.add({ targets: l.img, alpha: 0, delay: 500, duration: 400, onComplete: () => l.img.destroy() });
        }
    },
    gallinaBomba(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        burla(scene, api, 'COCOROCÓ… ¿QUÉ PUSO?', 1000);
        const gallina = scene.add.text(gx + 340, SUELO_Y + 2, '🐔', { fontSize: '26px' }).setOrigin(0.5, 1).setDepth(PROF);
        scene.tweens.add({ targets: gallina, x: gx + 60, duration: 1500, onComplete: () => gallina.destroy() });
        // tres huevos en el camino: titilan y explotan; se esperan o se saltan
        [280, 190, 100].forEach((d, i) => scene.time.delayedCall(250 + i * 420, () => {
            const x = gx + d;
            const huevo = scene.add.text(x, SUELO_Y + 2, '🥚', { fontSize: '18px' }).setOrigin(0.5, 1).setDepth(PROF);
            scene.tweens.add({ targets: huevo, alpha: 0.4, yoyo: true, repeat: 5, duration: 110 });
            scene.time.delayedCall(1400, () => {
                huevo.destroy();
                const boom = scene.add.circle(x, SUELO_Y - 16, 10, 0xffa040, 0.9).setDepth(PROF);
                scene.tweens.add({ targets: boom, scale: 3.6, alpha: 0, duration: 280, onComplete: () => boom.destroy() });
                scene.sound.play('romper', { volume: 0.4, rate: 1.4 });
                const j = scene.mascotaGesi;
                if (j.active && !j.isDead && choca(new Phaser.Geom.Rectangle(x - 34, SUELO_Y - 66, 68, 66), rect(j.body))) api.killgesi(scene);
            });
        }));
    },
    canonTroll(scene, l, api, { gx, rGesi, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            l.balas = [];
            burla(scene, api, '¡FUEGO! ¡SALTA!', 900);
            texturas(scene);
            [700, 1600, 2500].forEach(ms => scene.time.delayedCall(ms, () => {
                l.balas.push(scene.add.image(scene.cameras.main.worldView.right + 20, SUELO_Y - 14, 'tr_roca').setScale(0.8).setDepth(PROF));
                scene.sound.play('disparo', { volume: 0.4, rate: 0.7 });
            }));
            l.vive = 6;
        }
        if (!l.balas || l.vive <= 0) return;
        l.vive -= dt;
        l.balas = l.balas.filter(b => {
            b.x -= 380 * dt;
            b.angle -= 500 * dt;
            const pega = dt && choca(new Phaser.Geom.Rectangle(b.x - 12, b.y - 12, 24, 24), rGesi);
            if (pega) api.killgesi(scene);
            if (pega || l.vive <= 0 || b.x < scene.cameras.main.worldView.x - 40) { b.destroy(); return false; }
            return true;
        });
    },
    fotoTroll(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        api.mostrarMensaje(scene, '¡SONRÍE! 📸', 800);
        scene.time.delayedCall(800, () => {
            scene.cameras.main.flash(260, 255, 255, 255);
            scene.sound.play('trampa', { volume: 0.4, rate: 1.8 });
            api.mostrarMensaje(scene, 'SALISTE HORRIBLE. LA GUARDO.', 1100);
        });
    },
    // ---------- tanda 5 ----------
    vacaCae(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        api.mostrarMensaje(scene, 'MUUU…', 800);
        scene.time.delayedCall(350, () => {
            texturas(scene);
            const x = scene.mascotaGesi.body.center.x;
            const sombra = scene.add.image(x, SUELO_Y - 2, 'tr_sombra').setScale(1.4).setDepth(PROF).setAlpha(0);
            scene.tweens.add({ targets: sombra, alpha: 1, duration: 450 });
            const vaca = scene.add.text(x, scene.cameras.main.scrollY - 50, '🐄', { fontSize: '52px' }).setOrigin(0.5, 1).setDepth(PROF);
            scene.tweens.add({ targets: vaca, y: SUELO_Y + 4, delay: 450, duration: 320, ease: 'Quad.in', onComplete: () => {
                sombra.destroy();
                scene.sound.play('romper');
                scene.cameras.main.shake(180, 0.008);
                const g = scene.mascotaGesi;
                if (g.active && !g.isDead && choca(new Phaser.Geom.Rectangle(x - 30, SUELO_Y - 64, 60, 64), rect(g.body))) api.killgesi(scene);
                else api.mostrarMensaje(scene, '¿UNA VACA? ¿EN SERIO?', 900);
                scene.tweens.add({ targets: vaca, alpha: 0, delay: 900, duration: 400, onComplete: () => vaca.destroy() });
            } });
        });
    },
    captchaFalso(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        scene.aturdidoHasta = scene.time.now + 2300;
        pantallaFalsa(scene, '🤖 ¿ERES HUMANO?', '#b9c3ff', 'Selecciona todos los trolls: 👹 👹 👹 👹 👹', 1600, () => {
            scene.sound.play('trampa', { volume: 0.4 });
            pantallaFalsa(scene, 'ERAN TODOS 😜', '#ffe066', 'Y no había dónde tocar', 650);
        });
    },
    anuncioTroll(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        scene.aturdidoHasta = scene.time.now + 2500;
        const texto = s => `Compra 1.000.000 de trampas · Sigues en ${s}…`;
        const capa = pantallaFalsa(scene, '📢 ANUNCIO DEL REY TROLL', '#ffc94a', texto(3), 1800, () => {
            scene.sound.play('trampa', { volume: 0.4 });
            pantallaFalsa(scene, 'GRACIAS POR ESPERAR 😏', '#ffe066', 'No vendo nada, solo molesto', 650);
        });
        [2, 1].forEach((s, i) => setTimeout(() => { capa.querySelector('span').textContent = texto(s); }, 600 * (i + 1)));
    },
    ovniTroll(scene, l, api, { g, gb, gx, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            const y = gb.top - 110;
            l.ovni = scene.add.text(gx + 40, scene.cameras.main.scrollY - 40, '🛸', { fontSize: '34px' }).setOrigin(0.5).setDepth(PROF);
            api.mostrarMensaje(scene, '¿Y ESE ZUMBIDO?', 800);
            scene.tweens.add({ targets: l.ovni, y, duration: 800, ease: 'Quad.out', onComplete: () => {
                l.luz = scene.add.triangle(l.ovni.x, y + 12, 0, 150, 25, 0, 50, 150, 0xa0ffb0, 0.3).setOrigin(0.5, 0).setDepth(PROF);
                l.vive = 1.5;
            } });
        }
        if (l.vive === undefined || l.vive <= 0) return;
        l.vive -= dt;
        // si te quedas debajo te levanta un rato; al apagarse caes donde estabas
        if (Math.abs(gx - l.ovni.x) < 30) { g.setVelocityY(-105); scene.atrapadoOvni = true; }
        if (l.vive <= 0) {
            l.luz.destroy();
            scene.tweens.add({ targets: l.ovni, x: l.ovni.x + 500, y: l.ovni.y - 100, duration: 500, ease: 'Quad.in', onComplete: () => l.ovni.destroy() });
            if (scene.atrapadoOvni) api.mostrarMensaje(scene, 'NO ERES INTERESANTE. TE DEVOLVEMOS.', 1100);
            scene.atrapadoOvni = false;
        }
    },
    aletaSuelo(scene, l, api, { gx, rGesi, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            burla(scene, api, '¿ESO ES UNA ALETA?', 900);
            scene.time.delayedCall(900, () => {
                l.aleta = scene.add.text(scene.cameras.main.worldView.right + 30, SUELO_Y + 4, '🦈', { fontSize: '30px' }).setOrigin(0.5, 1).setDepth(PROF);
                l.vive = 3.5;
            });
        }
        if (!l.aleta) return;
        l.aleta.x -= 300 * dt; // viene de frente por el suelo: se salta
        l.vive -= dt;
        if (dt && choca(new Phaser.Geom.Rectangle(l.aleta.x - 16, SUELO_Y - 26, 32, 26), rGesi)) {
            l.vive = 0;
            api.killgesi(scene);
        }
        if (l.vive <= 0) { l.aleta.destroy(); l.aleta = null; }
    },
    murcielagos(scene, l, api, { gx, gb, rGesi, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            burla(scene, api, 'NO SALTES…', 900);
            const y = gb.bottom - 105; // a la altura de un salto: por tierra pasan por encima
            scene.time.delayedCall(800, () => {
                const x = scene.cameras.main.worldView.right + 30;
                l.grupo = [0, 1, 2].map(i => scene.add.text(x + i * 70, y, '🦇', { fontSize: '22px' }).setOrigin(0.5).setDepth(PROF));
                l.vive = 3;
            });
        }
        if (!l.grupo) return;
        l.vive -= dt;
        l.grupo.forEach(m => {
            m.x -= 360 * dt;
            if (dt && !l.pego && choca(new Phaser.Geom.Rectangle(m.x - 12, m.y - 10, 24, 20), rGesi)) {
                l.pego = true;
                api.killgesi(scene);
            }
        });
        if (l.vive <= 0) { l.grupo.forEach(m => m.destroy()); l.grupo = null; }
    },
    misilTroll(scene, l, api, { gx, gb, rGesi, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            l.misil = scene.add.text(gx - 300, gb.center.y - 30, '🚀', { fontSize: '24px' }).setOrigin(0.5).setDepth(PROF);
            l.vive = 4;
            burla(scene, api, 'ESO TE ESTÁ SIGUIENDO', 1000);
        }
        if (!l.misil) return;
        l.vive -= dt;
        // más lento que el que corre: se agota si no te detienes
        const dx = gx - l.misil.x, dy = gb.center.y - l.misil.y, d = Math.max(1, Math.hypot(dx, dy));
        l.misil.x += dx / d * 190 * dt;
        l.misil.y += dy / d * 190 * dt;
        l.misil.setRotation(Math.atan2(dy, dx) + Math.PI / 4);
        const pega = dt && choca(new Phaser.Geom.Rectangle(l.misil.x - 11, l.misil.y - 11, 22, 22), rGesi);
        if (pega || l.vive <= 0) {
            const boom = scene.add.circle(l.misil.x, l.misil.y, 8, 0xffa040, 0.9).setDepth(PROF);
            scene.tweens.add({ targets: boom, scale: 3, alpha: 0, duration: 260, onComplete: () => boom.destroy() });
            scene.sound.play('romper', { volume: 0.4 });
            l.misil.destroy();
            l.misil = null;
            if (pega) api.killgesi(scene);
        }
    },
    fiestaTroll(scene, l, api, { gx, gb }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        scene.aturdidoHasta = scene.time.now + 1300;
        scene.sound.play('victoria', { volume: 0.3, rate: 1.3 });
        api.mostrarMensaje(scene, '¡FELICIDADES!\nERES EL VISITANTE 1.000.000', 1300);
        const colores = [0xff4d5e, 0xffc94a, 0x7fe06a, 0x6fe8ff, 0xc77dff];
        for (let i = 0; i < 16; i++) {
            const c = scene.add.rectangle(gx + (i - 8) * 18, gb.top - 90, 6, 10, colores[i % 5]).setDepth(PROF);
            scene.tweens.add({ targets: c, y: gb.bottom + 10, angle: 360, alpha: 0, delay: i * 40, duration: 900, onComplete: () => c.destroy() });
        }
    },
    imanMalo(scene, l, api, { g, gx, gb, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            l.vive = 1.5;
            l.iman = scene.add.text(gx + 260, gb.center.y, '🧲', { fontSize: '30px' }).setOrigin(0.5).setDepth(PROF);
            api.mostrarMensaje(scene, '¡TE JALA! ¿TRAES MONEDAS?', 1200);
        }
        if (l.vive === undefined || l.vive <= 0) return;
        l.vive -= dt;
        g.setPosition(g.x + 120 * dt, g.y); // hacia adelante: va en suelo firme largo
        if (l.vive <= 0) scene.tweens.add({ targets: l.iman, alpha: 0, duration: 300, onComplete: () => l.iman.destroy() });
    },
    pinturaTroll(scene, l, api, { gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 26) return;
        l.hecha = true;
        l.cuerda.destroy();
        scene.tweens.killTweensOf(l.img);
        scene.tweens.add({ targets: l.img, y: SUELO_Y - 40, duration: 320, ease: 'Quad.in', onComplete: () => {
            l.img.destroy();
            const g = scene.mascotaGesi;
            if (g.active && !g.isDead && Math.abs(g.body.center.x - l.x) < 34) {
                g.setTint(0xff7ad9);
                burla(scene, api, '¡TE QUEDA PRECIOSO! 💖', 1100);
            } else api.mostrarMensaje(scene, 'TE SALVASTE DEL ROSADO', 800);
        } });
    },
    // ---------- tanda 6 ----------
    cajaSorpresa(scene, l, api, { g, gb, rGesi }) {
        if (l.hecha || !choca(new Phaser.Geom.Rectangle(l.x - 14, SUELO_Y - 28, 28, 28), rGesi)) return;
        l.hecha = true;
        scene.tweens.killTweensOf(l.img);
        l.img.setText('🤡');
        scene.tweens.add({ targets: l.img, y: SUELO_Y - 34, scale: 1.5, duration: 140, ease: 'Back.out', yoyo: true, hold: 700, onComplete: () => l.img.destroy() });
        g.setVelocity((gb.velocity.x > 0 ? -1 : 1) * 280, -220);
        scene.empujadoHasta = scene.time.now + 340;
        scene.sound.play('bump', { volume: 0.5, rate: 1.5 });
        api.mostrarMensaje(scene, '¡SORPRESA!', 800);
    },
    camaraLenta(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        if (scene.carrera || scene.remotos) return; // (compitiendo sería injusto: en línea cada pantalla va a su ritmo)
        const mundo = scene.physics.world;
        mundo.timeScale = 2.5;
        const volver = () => { mundo.timeScale = 1; };
        scene.events.once('shutdown', volver);
        setTimeout(volver, 2000);
        api.mostrarMensaje(scene, 'M O D O   P E L Í C U L A', 1700);
    },
    laserRasante(scene, l, api, { g, gx, gb, ahora }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            const y = l.y = gb.bottom - 8;
            const vista = scene.cameras.main.worldView;
            const linea = scene.add.rectangle(vista.x, y, vista.width, 2, 0xff3040, 0.6).setOrigin(0, 0.5).setDepth(PROF);
            scene.tweens.add({ targets: linea, alpha: 0.15, yoyo: true, repeat: 6, duration: 90 });
            burla(scene, api, 'SALTA CUANDO SE PONGA ROJO', 1000);
            scene.time.delayedCall(1200, () => {
                linea.destroy();
                const v = scene.cameras.main.worldView;
                const haz = scene.add.rectangle(v.x, y, v.width, 12, 0xff2030).setOrigin(0, 0.5).setBlendMode('ADD').setDepth(PROF);
                scene.tweens.add({ targets: haz, alpha: 0, delay: 200, duration: 160, onComplete: () => haz.destroy() });
                scene.sound.play('laser', { volume: 0.5 });
                l.hastaLaser = scene.time.now + 300;
            });
        }
        if (!l.hastaLaser || ahora > l.hastaLaser || l.pego) return;
        if (enSuelo(g) && Math.abs(gb.bottom - 8 - l.y) < 24) {
            l.pego = true;
            api.killgesi(scene);
        }
    },
    apagonTroll(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        const capa = document.createElement('div');
        capa.style.cssText = 'position:absolute;inset:0;z-index:15;display:grid;place-items:center;font-size:40px;pointer-events:none;background:rgba(0,0,0,0.93)';
        capa.textContent = '👀';
        document.getElementById('game').append(capa);
        const quitar = () => capa.remove();
        scene.events.once('shutdown', quitar);
        setTimeout(quitar, 2000); // (reloj del navegador: si pausan, no se queda a oscuras)
        burla(scene, api, '¿QUIÉN APAGÓ LA LUZ?', 1000);
    },
    corazonesRobados(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        const lista = scene.corazones || [];
        if (!lista.length) return;
        // solo se dibujan robados: las vidas de verdad no se tocan
        const antes = lista.map(c => [c.x, c.alpha]);
        scene.tweens.add({ targets: lista, x: '+=420', alpha: 0, duration: 500, ease: 'Quad.in' });
        burla(scene, api, 'ME LLEVO TUS CORAZONES 👹', 1100);
        scene.time.delayedCall(1500, () => {
            lista.forEach((c, i) => { if (c.active) { c.x = antes[i][0]; scene.tweens.add({ targets: c, alpha: antes[i][1], duration: 250 }); } });
            api.mostrarMensaje(scene, 'NAH, TOMA. PESAN MUCHO', 900);
        });
    },
    puntajeFalso(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        const t = scene.scoreText;
        if (!t?.active) return;
        const antes = t.text;
        t.setText('Puntaje: -9.999.999').setColor('#ff4d5e');
        burla(scene, api, 'UPS. SE ME FUE EL DEDO', 1000);
        scene.time.delayedCall(1800, () => { if (t.active) { if (t.text.includes('-9.999.999')) t.setText(antes); t.setColor('#ffffff'); } });
    },
    abuelaBolso(scene, l, api, { g, gx, gb, rGesi, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            l.abuela = scene.add.text(gx + 240, SUELO_Y + 2, '👵', { fontSize: '30px' }).setOrigin(0.5, 1).setDepth(PROF);
            l.vive = 7;
        }
        if (!l.abuela) return;
        l.vive -= dt;
        l.abuela.x -= 40 * dt;
        let fin = l.vive <= 0;
        if (dt && choca(new Phaser.Geom.Rectangle(l.abuela.x - 12, SUELO_Y - 30, 24, 30), rGesi)) {
            fin = true;
            g.setVelocity((gx < l.abuela.x ? -1 : 1) * 260, -200);
            scene.empujadoHasta = scene.time.now + 340;
            scene.sound.play('bump', { volume: 0.6, rate: 0.7 });
            const bolso = scene.add.text(gx, gb.top - 10, '👜', { fontSize: '22px' }).setOrigin(0.5).setDepth(PROF);
            scene.tweens.add({ targets: bolso, angle: 200, alpha: 0, duration: 500, onComplete: () => bolso.destroy() });
            api.mostrarMensaje(scene, '¡JOVENCITO, MÁS RESPETO!', 1100);
        }
        if (fin) { l.abuela.destroy(); l.abuela = null; }
    },
    perroCarinoso(scene, l, api, { gx, gb, rGesi, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            l.perro = scene.add.text(gx - 320, SUELO_Y + 2, '🐕', { fontSize: '30px' }).setOrigin(0.5, 1).setDepth(PROF).setScale(-1, 1);
            l.vive = 3.5;
            burla(scene, api, '¡GUAU! ¡GUAU! ¡CORRE!', 900);
            scene.sound.play('rugido', { volume: 0.25, rate: 1.8 });
        }
        if (!l.perro) return;
        l.vive -= dt;
        l.perro.x += 330 * dt;
        let fin = l.vive <= 0;
        if (dt && choca(new Phaser.Geom.Rectangle(l.perro.x - 14, SUELO_Y - 26, 28, 26), rGesi)) {
            fin = true;
            scene.aturdidoHasta = scene.time.now + 800;
            const amor = scene.add.text(gx, gb.top - 14, '💕', { fontSize: '24px' }).setOrigin(0.5).setDepth(PROF);
            scene.tweens.add({ targets: amor, y: amor.y - 30, alpha: 0, duration: 800, onComplete: () => amor.destroy() });
            api.mostrarMensaje(scene, 'SOLO QUERÍA LAMERTE', 1000);
        }
        if (fin) { l.perro.destroy(); l.perro = null; }
    },
    pinchosCobardes(scene, l, api, { gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 75) return;
        l.hecha = true;
        // al acercarte se esconden: nunca pinchan
        scene.tweens.add({ targets: l.puas, y: SUELO_Y + 20, duration: 160, ease: 'Quad.in' });
        scene.sound.play('trampa', { volume: 0.3, rate: 1.7 });
        api.mostrarMensaje(scene, '¡AY, NO! ¡NO ME PISES!', 900);
    },
    bumeranTroll(scene, l, api, { gx, gb, rGesi, dt }) {
        if (!l.hecha && gx >= l.x) {
            l.hecha = true;
            l.x0 = gx;
            l.yB = gb.center.y + 8;
            l.t = 0;
            l.bum = scene.add.text(gx + 340, l.yB, '🪃', { fontSize: '24px' }).setOrigin(0.5).setDepth(PROF);
            burla(scene, api, '¡OJO! VA Y VUELVE', 1000);
        }
        if (!l.bum) return;
        l.t += dt;
        // va de derecha a izquierda y regresa: hay que saltarlo DOS veces
        l.bum.x = l.x0 + Math.cos(l.t * 1.5) * 340;
        l.bum.angle += 720 * dt;
        if (dt && !l.pego && choca(new Phaser.Geom.Rectangle(l.bum.x - 12, l.bum.y - 12, 24, 24), rGesi)) {
            l.pego = true;
            api.killgesi(scene);
        }
        if (l.t * 1.5 > Math.PI * 2) { l.bum.destroy(); l.bum = null; }
    },
};

// un rayo de la nube: marca el suelo donde estás y medio segundo después cae ahí (si te moviste, te salvas)
function rayoDeNube(scene, api, l) {
    const g = scene.mascotaGesi;
    if (!l.nube || !g.active || g.isDead || !g.body) return;
    const x = g.body.center.x, suelo = g.body.bottom;
    const marca = scene.add.image(x, suelo, 'tr_sombra').setDepth(PROF).setTint(0xffe066).setScale(0.8);
    scene.sound.play('trampa', { volume: 0.2, rate: 1.6 });
    scene.time.delayedCall(550, () => {
        marca.destroy();
        const arriba = suelo - 260;
        const rayo = scene.add.rectangle(x, arriba, 6, 260, 0xfff3a0).setOrigin(0.5, 0).setDepth(PROF);
        scene.tweens.add({ targets: rayo, alpha: 0, scaleX: 3, duration: 240, onComplete: () => rayo.destroy() });
        scene.sound.play('rayo', { volume: 0.5 });
        const zona = new Phaser.Geom.Rectangle(x - 20, arriba, 40, 262);
        if (g.active && !g.isDead && choca(zona, rect(g.body))) api.killgesi(scene);
    });
}

// el pastel en la cara: manchas blancas que se van solas (no se pueden tocar)
function pantallaManchada(scene) {
    const capa = document.createElement('div');
    const manchas = [[22, 30, 26], [55, 22, 34], [72, 58, 28], [35, 68, 30], [50, 45, 22]];
    capa.style.cssText = 'position:absolute;inset:0;z-index:15;pointer-events:none;overflow:hidden;transition:opacity 0.9s';
    capa.innerHTML = manchas.map(([x, y, t]) => `<i style="position:absolute;left:${x}%;top:${y}%;width:${t}vmin;height:${t}vmin;transform:translate(-50%,-50%);border-radius:47% 53% 44% 56%;background:#f4efe2;opacity:0.94"></i>`).join('');
    document.getElementById('game').append(capa);
    const quitar = () => capa.remove();
    scene.events.once('shutdown', quitar);
    setTimeout(() => { capa.style.opacity = '0'; }, 1100);
    setTimeout(quitar, 2000);
}

// pantalla falsa a todo lo ancho (HTML sobre el juego: ignora el zoom de la cámara y no se pueden tocar)
function pantallaFalsa(scene, titulo, color, pie, ms, despues, opaca = false) {
    const capa = document.createElement('div');
    capa.style.cssText = 'position:absolute;inset:0;z-index:15;display:flex;flex-direction:column;align-items:center;justify-content:center;'
        + `gap:8px;text-align:center;pointer-events:none;background:${opaca ? '#000' : 'rgba(0,0,0,0.82)'};font-family:var(--letra);color:#eef1f7`;
    capa.innerHTML = `<b style="font-size:clamp(26px,7vw,52px);color:${color}">${titulo}</b><span style="font-size:14px;opacity:0.8">${pie}</span>`;
    document.getElementById('game').append(capa);
    const quitar = () => capa.remove();
    scene.events.once('shutdown', quitar);
    // (reloj del navegador, no el del juego: si pausan justo ahora, la pantalla no se queda pegada)
    setTimeout(() => {
        quitar();
        if (scene.scene.isActive()) despues?.();
    }, ms);
    return capa;
}

// un yunque cae en x: primero su sombra en el suelo (la pista), después él
function caer(scene, api, x, deVerdad) {
    const sombra = scene.add.image(x, SUELO_Y - 2, 'tr_sombra').setDepth(PROF).setAlpha(0);
    scene.tweens.add({ targets: sombra, alpha: 1, duration: 420 });
    const y0 = scene.cameras.main.scrollY - 40;
    const img = scene.add.image(x, y0, deVerdad ? 'tr_yunque' : 'tr_carton').setOrigin(0.5, 1).setDepth(PROF);
    scene.tweens.add({ targets: img, y: SUELO_Y, delay: 420, duration: 300, ease: 'Quad.in', onComplete: () => {
        sombra.destroy();
        if (!deVerdad) {
            scene.tweens.add({ targets: img, scaleY: 0.3, alpha: 0, duration: 260, onComplete: () => img.destroy() });
            scene.sound.play('bump', { volume: 0.3, rate: 1.4 });
            if (Math.abs(scene.mascotaGesi.body.center.x - x) < 40) api.mostrarMensaje(scene, '¡ERA DE CARTÓN!', 600);
            return;
        }
        scene.sound.play('romper');
        scene.cameras.main.shake(160, 0.007);
        const zona = new Phaser.Geom.Rectangle(x - 22, SUELO_Y - 60, 44, 60);
        if (choca(zona, rect(scene.mascotaGesi.body))) api.killgesi(scene);
        else api.mostrarMensaje(scene, 'ESE SÍ ERA DE VERDAD', 800);
        scene.tweens.add({ targets: img, alpha: 0, delay: 1200, duration: 400, onComplete: () => img.destroy() });
    } });
}
