// Mapa de La Noche del Troll: Las Criptas de Albora (troll.js). Se BAJA a submundos por escaleras
// y se SUBE al cielo por las torres.
//
//  CIELO       ☁️ ══ PUENTE DE LAS ALMAS ══ 🏮 ISLA DEL CIELO (sobre el altar) ══ PUENTE ══ ☁️
//                ▲ zigzag                                                       zigzag ▲
//  SUPERFICIE  ▲Campanario🔥A  [E1↓]  🌼 🚪P2 🌼 🛎️ 🌅ALTAR 🕯️ 🚪P1 [POZO] 🌼   ▲Torre del vigía🔥B
//  CRIPTAS            E1↘ 📜📜📜 Bodega   🕹️ Sala de cadenas  🚪P1 [POZO]  [E2↓] → Cripta del rey
//  CATACUMBAS  🔥C Osario 🕯️ 🚪P2  ~lava~  🗝️ cofre   (cae el pozo)  🔥D Sala del eco (de a dos)  ↙E2
//
// El motor solo crece hacia ARRIBA desde el suelo (y = 332): por eso la superficie está arriba de todo
// (y = −268) y los submundos debajo. Cada piso es una LOSA de ladrillo (física en game.js: 'losas'; el
// dibujo, aquí). Las escaleras son escalones de 40 px que bajan 33 px cada uno ('oculta': solo física,
// el dibujo también es de aquí); una escalera tapa el paso por debajo, por eso están contra los bordes,
// y la losa de arriba tiene un hueco sobre los primeros escalones (para subir sin chocar la cabeza).
//   E1: de la superficie a las Criptas (baja a la derecha).  E2: de las Criptas a las Catacumbas (baja a la
//   izquierda, desde la Cripta del rey).  POZO: un hueco en las dos losas, solo para bajar.
//   PUERTAS MÁGICAS 🚪 (troll.js): P1 superficie ⇄ Criptas, P2 superficie ⇄ Catacumbas (quieto un momento).
// Las Catacumbas son OSCURAS: solo se ve cerca de cada uno (troll.js).
// El CIELO: las dos torres siguen en zigzag hasta el Puente de las Almas (tablas que flotan de torre a
// torre) y la Isla del cielo en el medio, justo sobre el altar: de ahí uno se puede dejar caer al altar.
// Recursos: Medieval Pixel Art de CraftPix (assets/criptas, ver su licencia).

import { SUELO_Y } from "./niveles.js"
import { alFondo } from "./mazmorra.js"

const S = SUELO_Y;            // 332: el piso de las Catacumbas
const ANCHO = 3600;
const GROSOR = 40;            // grosor de cada losa
const Y1 = S - 300;           // 32: el piso de las Criptas
const Y0 = Y1 - 300;          // −268: la superficie
const T1 = Y0 - 96, T2 = Y0 - 192; // escalón y cima de las torres
const T3 = Y0 - 288, T4 = Y0 - 384; // el zigzag que sigue hacia el cielo
const CIELO = Y0 - 480;       // −748: el Puente de las Almas
const ISLA = { x0: 1550, x1: 1850, arriba: CIELO - 40 }; // la Isla del cielo (sobre el altar)
// tablas del puente: [x, arriba] (110 de ancho, huecos de 70 y alguna un poco más alta o más baja)
const PUENTE = [
    [600, CIELO], [780, CIELO - 20], [960, CIELO], [1140, CIELO + 20], [1320, CIELO],
    [1920, CIELO], [2100, CIELO - 20], [2280, CIELO], [2460, CIELO + 20], [2640, CIELO], [2820, CIELO - 20],
];
const ESCALON = { ancho: 40, n: 9 }; // 9 escalones de 33 px: 300 px de un piso al otro
const ALTO_ESC = 300 / ESCALON.n;
const C = 'cr_'; // (prefijo de las texturas)

// escalera: k = 1..n−1 escalones (el último es el piso de abajo). dir 1: baja a la derecha
function escalones(x0, arriba, dir) {
    return Array.from({ length: ESCALON.n - 1 }, (_, i) => {
        const k = i + 1;
        const x = dir > 0 ? x0 + (k - 1) * ESCALON.ancho : x0 - k * ESCALON.ancho;
        return [x, Math.round(arriba + ALTO_ESC * k), ESCALON.ancho, 'oculta'];
    });
}
const E1 = { x: 600, dir: 1, hueco: [600, 780] };     // bajada de la superficie a las Criptas
const E2 = { x: 3200, dir: -1, hueco: [3020, 3200] }; // bajada de las Criptas a las Catacumbas
const POZO = [2400, 2480];
const LAVA = [1480, 1680];

// losas: [x0, x1, arriba, grosor]
const LOSAS = [
    [E1.hueco[1], POZO[0], Y0, GROSOR], [POZO[1], ANCHO, Y0, GROSOR],   // superficie
    [600, POZO[0], Y1, GROSOR], [POZO[1], E2.hueco[0], Y1, GROSOR],     // piso de las Criptas
];
// muros macizos (desde el piso de abajo): a la izquierda debajo del campanario, a la derecha la Cripta del rey
const MUROS = [[0, Y0, 600], [3200, Y1, 400]];
// plataformas de las torres (campanario y vigía): [x, arriba, ancho]
const TORRES = [
    [430, T1, 100], [180, T2, 220], [430, T3, 100], [250, T4, 120], [430, CIELO, 100],          // campanario
    [3060, T1, 100], [3190, T2, 260], [3060, T3, 100], [3220, T4, 120], [3060, CIELO, 100],    // torre del vigía
];

const ANTORCHAS = [
    { id: 'A', nombre: 'Campanario', x: 240, pie: T2, dos: false },
    { id: 'B', nombre: 'Torre del vigía', x: 3400, pie: T2, dos: false },
    { id: 'C', nombre: 'Osario', x: 700, pie: S, dos: false },
    { id: 'D', nombre: 'Sala del eco', x: 2600, pie: S, dos: true },
];
const ALTAR = { x: 1650, pie: Y0 };
const PUERTAS = [
    { id: 'P1', nombre: 'Puerta de la cripta', a: { x: 2150, pie: Y0 }, b: { x: 2150, pie: Y1 }, textoA: 'A LAS CRIPTAS ↓', textoB: 'A LA SUPERFICIE ↑' },
    { id: 'P2', nombre: 'Puerta del osario', a: { x: 1150, pie: Y0 }, b: { x: 1150, pie: S }, textoA: 'A LAS CATACUMBAS ↓', textoB: 'A LA SUPERFICIE ↑' },
];

const ENCARGOS = [
    { id: 'campanario', tipo: 'quieto', icono: '🔔', texto: 'Toca la campana del campanario', zona: 'Campanario',
        x: 350, pie: T2, ms: 2000, visible: true,
        pasos: ['Ve a la izquierda de la superficie, sube al campanario saltando por la cornisa y quédate quieto junto a la campana 🔔'] },
    { id: 'flores', tipo: 'recoger', icono: '🌼', texto: 'Recoge 3 flores del cementerio', zona: 'Superficie',
        puntos: [[900, Y0 - 20], [1300, Y0 - 20], [2700, Y0 - 20]],
        pasos: ['Camina por la superficie del cementerio y junta las 3 flores 🌼 de las tumbas (una está pasando el pozo)'] },
    { id: 'pergaminos', tipo: 'recoger', icono: '📜', texto: 'Junta 3 pergaminos de la bodega', zona: 'Criptas',
        puntos: [[1050, Y1 - 20], [1200, Y1 - 20], [1350, Y1 - 20]],
        pasos: ['Baja por la escalera de la izquierda (o la puerta 🚪 junto al altar) a las Criptas y junta los 3 pergaminos 📜 de la bodega'] },
    { id: 'palanca', tipo: 'quieto', icono: '🕹️', texto: 'Baja la palanca de la Sala de cadenas', zona: 'Criptas',
        x: 1750, pie: Y1, ms: 2000, visible: true,
        pasos: ['Baja a las Criptas y quédate quieto junto a la palanca 🕹️ de la Sala de cadenas'] },
    { id: 'cofre', tipo: 'quieto', icono: '🗝️', texto: 'Abre el cofre de las catacumbas', zona: 'Catacumbas',
        x: 2000, pie: S, ms: 1500,
        pasos: ['Baja hasta las Catacumbas (por el pozo, la puerta del osario 🚪 o la escalera del fondo) y abre el cofre 🗝️'] },
    { id: 'farol', tipo: 'quieto', icono: '🏮', texto: 'Enciende el farol del cielo', zona: 'Cielo',
        x: 1700, pie: ISLA.arriba, ms: 2500, visible: true,
        pasos: ['Sube a lo más alto del campanario o de la torre del vigía, cruza el Puente de las Almas ☁️ hasta la isla del cielo y quédate quieto junto al farol 🏮'] },
    { id: 'vela', tipo: 'llevar', icono: '🕯️', texto: 'Lleva una vela del osario al altar', zona: 'Catacumbas → Superficie',
        desde: { x: 860, pie: S }, hasta: { x: 1770, pie: Y0 }, visible: true,
        pasos: ['Baja a las Catacumbas (la puerta 🚪 junto al altar lleva directo) y toma una vela 🕯️ del osario',
            'Sube con la vela (la puerta 🚪 del osario te lleva arriba) y déjala en el candelabro junto al altar 🌅'] },
];

// el nivel (game.js): inicio, dónde aparece (el fantasma, donde cayó); si no, junto al altar
function nivelCriptas(inicio = null) {
    return {
        nombre: 'Las Criptas de Albora',
        ancho: ANCHO,
        alto: 960, // (hasta el cielo)
        nubes: true,
        fondo: 'montanas',
        sinMeta: true,
        sinDecorado: true, // (nada de árboles ni ruinas: todo lo pone este archivo)
        meta: ANCHO,
        inicio: inicio || [ALTAR.x - 150, Y0 - 80],
        mezcla: [],
        suelo: [[600, LAVA[0]], [LAVA[1], 3200]],
        lava: [LAVA],
        muros: MUROS,
        losas: LOSAS,
        plataformas: [
            ...TORRES.map(([x, y, w]) => [x, y, w, 'oculta']),
            ...PUENTE.map(([x, y]) => [x, y, 110, 'tabla']),
            [ISLA.x0, ISLA.arriba, ISLA.x1 - ISLA.x0, 'oculta'],
            ...escalones(E1.x, Y0, E1.dir),
            ...escalones(E2.x, Y1, E2.dir),
        ],
        escaleras: [], moviles: [], techos: [],
        enemigos: [], plantas: [], espiritus: [], checkpoints: [], monedas: [],
    };
}

// ---------- recursos ----------
const IMAGENES = [
    'tile4', 'tile9', 'tile53', 'tile75', 'tile93', 'tile136', 'tile153',
    'barrel', 'box', 'chain1', 'chain2', 'chest_closed', 'chest_opened', 'door1', 'door3',
    'lever1', 'lever2', 'shield', 'torch', 'vase', 'window', 'window_small',
];
export function precargarCriptas(scene) {
    IMAGENES.forEach(n => { if (!scene.textures.exists(C + n)) scene.load.image(C + n, `assets/criptas/${n}.png`); });
}

// ---------- dibujo ----------
const ESCALA = 2 / 3; // (las baldosas miden 48: a 32 como los bloques del juego)
// una pared o un relleno de baldosas. El fondo de los submundos va en 0.05: por delante del paisaje del
// cielo (montañas, ruinas: capa 0) y por detrás de los pisos, objetos y personajes
const FONDO = 0.05;
const pared = (scene, x0, y0, x1, y1, tile, prof = FONDO) => {
    const t = scene.add.tileSprite(x0, y0, x1 - x0, y1 - y0, C + tile).setOrigin(0).setTileScale(ESCALA).setDepth(prof);
    if (prof < 1) alFondo(scene, t); // (paredes del fondo: detrás de enemigos y poderes)
    // (el fondo, más oscuro: así se ve bien por dónde se camina)
    if (prof === FONDO) t.setTint(0x5a5a70);
    return t;
};
// una losa de ladrillo: el borde de arriba y el relleno
function dibujarLosa(scene, x0, x1, arriba, grosor, tope, relleno) {
    pared(scene, x0, arriba + 10, x1, arriba + grosor, relleno, 1);
    pared(scene, x0, arriba, x1, arriba + 16, tope, 1.1);
}
// (los muebles van al fondo: detrás de enemigos, poderes y monedas; los que deben ir delante, prof ≥ 30)
const objeto = (scene, n, x, pie, escala = 1, prof = 5) => {
    const o = scene.add.image(x, pie, C + n).setOrigin(0.5, 1).setScale(escala).setDepth(prof);
    return prof < 30 ? alFondo(scene, o) : o;
};

function texturasCriptas(scene) {
    if (scene.textures.exists('cr_lapida')) return;
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0x6e6a80).fillRoundedRect(4, 6, 24, 34, { tl: 12, tr: 12, bl: 0, br: 0 });
    g.fillStyle(0x8a86a0).fillRect(14, 12, 4, 16).fillRect(9, 17, 14, 4);
    g.fillStyle(0x3d3a4c).fillRect(0, 38, 32, 4);
    g.generateTexture('cr_lapida', 32, 42);
    g.clear();
    // candelabro (sin vela: la pone el encargo)
    g.fillStyle(0x8a6a2a).fillRect(14, 10, 4, 34).fillRect(6, 40, 20, 4).fillRect(8, 8, 16, 4);
    g.generateTexture('cr_candelabro', 32, 44);
    g.destroy();
}

function decorar(scene, h) {
    texturasCriptas(scene);
    // fondos: las Criptas (ladrillo) y las Catacumbas (más oscuro); el cielo queda solo arriba
    pared(scene, 600, Y0 + GROSOR - 4, 3600, Y1 + GROSOR, 'tile136');
    pared(scene, 600, Y1 + GROSOR - 4, 3200, S, 'tile153'); // (hasta el piso: no tapa la lava)
    // muros macizos y losas
    pared(scene, 0, Y0 + 10, 600, S + 60, 'tile93', 0.9);
    pared(scene, 0, Y0, 600, Y0 + 16, 'tile9', 1.1);
    pared(scene, 3200, Y1 + 10, 3600, S + 60, 'tile93', 0.9);
    pared(scene, 3200, Y1, 3600, Y1 + 16, 'tile75', 1.1);
    LOSAS.forEach(([x0, x1, arriba, grosor]) => dibujarLosa(scene, x0, x1, arriba, grosor,
        arriba === Y0 ? 'tile9' : 'tile75', arriba === Y0 ? 'tile4' : 'tile93'));
    // el piso de las Catacumbas
    [[600, LAVA[0]], [LAVA[1], 3200]].forEach(([x0, x1]) => { pared(scene, x0, S + 10, x1, S + 60, 'tile93', 1); pared(scene, x0, S, x1, S + 16, 'tile75', 1.1); });
    // torres: el cuerpo de ladrillo y las cornisas
    pared(scene, 190, CIELO + 60, 390, Y0, 'tile93', 0.2);
    pared(scene, 3200, CIELO + 60, 3440, Y0, 'tile93', 0.2);
    objeto(scene, 'window', 290, T4 + 40, 1, 0.3);
    objeto(scene, 'window', 3320, T4 + 40, 1, 0.3);
    // la Isla del cielo: piedra azul sobre nubes
    [[ISLA.x0 - 20, 60], [ISLA.x0 + 110, 80], [ISLA.x1 - 30, 70], [ISLA.x0 + 220, 50]].forEach(([x, w]) =>
        scene.add.ellipse(x, ISLA.arriba + 52, w * 1.6, w * 0.7, 0xdfe6ff, 0.28).setDepth(0.3));
    pared(scene, ISLA.x0, ISLA.arriba + 10, ISLA.x1, ISLA.arriba + 44, 'tile4', 1);
    pared(scene, ISLA.x0, ISLA.arriba, ISLA.x1, ISLA.arriba + 16, 'tile9', 1.1);
    const far = ENCARGOS.find(e => e.id === 'farol');
    objeto(scene, 'torch', far.x, far.pie, 1.4, 4);
    scene.criptaFarol = scene.add.image(far.x, far.pie - 30, 'brillo').setDepth(41).setScale(4).setTint(0xffc94a).setBlendMode('ADD')
        .setAlpha(h.visibles.has('farol') ? 0.6 : 0);
    objeto(scene, 'window', 290, T2 + 120, 1, 0.3);
    objeto(scene, 'window', 3320, T2 + 120, 1, 0.3);
    TORRES.forEach(([x, y, w]) => pared(scene, x, y, x + w, y + 16, 'tile53', 1.1));
    // escalones
    [...escalones(E1.x, Y0, E1.dir), ...escalones(E2.x, Y1, E2.dir)].forEach(([x, y, w]) => pared(scene, x, y, x + w, y + 16, 'tile53', 1.1));
    // superficie: tumbas y faroles
    [760, 980, 1270, 2300, 2650, 2780, 2950].forEach((x, i) => scene.add.image(x, Y0, 'cr_lapida').setOrigin(0.5, 1).setDepth(2).setFlipX(i % 2 === 1));
    // criptas: bodega, cadenas, escudos, ventanas y antorchas en la pared
    [[1000, 'barrel'], [1100, 'box'], [1280, 'vase'], [1400, 'barrel'], [1430, 'box']].forEach(([x, n]) => objeto(scene, n, x, Y1, 1, 2));
    [1600, 1680, 1830, 1900].forEach((x, i) => objeto(scene, i % 2 ? 'chain2' : 'chain1', x, Y1 - 150, 1, 0.3).setOrigin(0.5, 0));
    [1500, 2600, 3400].forEach(x => objeto(scene, 'shield', x, Y1 - 110, 0.8, 0.3));
    [[1150, Y1 - 100], [1950, Y1 - 100], [2750, Y1 - 100], [900, S - 110], [1350, S - 110], [2250, S - 110], [2850, S - 110]].forEach(([x, y]) => {
        objeto(scene, 'torch', x, y, 1, 0.3);
        scene.add.image(x, y - 22, 'brillo').setDepth(41).setScale(1.6).setTint(0xffa040).setAlpha(0.28).setBlendMode('ADD');
    });
    objeto(scene, 'chest_closed', 3420, Y1, 1.4, 2); // (la Cripta del rey)
    // las cosas de los encargos que ve todo el mundo
    const camp = ENCARGOS.find(e => e.id === 'campanario');
    scene.nocheCampana = scene.add.text(camp.x, camp.pie - 46, '🔔', { fontSize: '22px' }).setOrigin(0.5, 1).setDepth(8);
    const pal = ENCARGOS.find(e => e.id === 'palanca');
    scene.criptaPalanca = objeto(scene, h.visibles.has('palanca') ? 'lever2' : 'lever1', pal.x, pal.pie, 0.8, 4);
    const cof = ENCARGOS.find(e => e.id === 'cofre');
    objeto(scene, 'chest_closed', cof.x, cof.pie, 1.2, 4);
    const vela = ENCARGOS.find(e => e.id === 'vela');
    scene.add.text(vela.desde.x, vela.desde.pie, '🕯️', { fontSize: '16px' }).setOrigin(0.5, 1).setDepth(8);
    scene.add.image(vela.hasta.x, vela.hasta.pie, 'cr_candelabro').setOrigin(0.5, 1).setDepth(6);
    scene.criptaVela = scene.add.text(vela.hasta.x, vela.hasta.pie - 40, '🕯️', { fontSize: '14px' }).setOrigin(0.5, 1).setDepth(8).setVisible(h.visibles.has('vela'));
    // letreros
    h.letrero(scene, 690, Y0 - 6, '↓ ESCALERA A LAS CRIPTAS');
    h.letrero(scene, 2440, Y0 - 30, 'POZO ↓');
    h.letrero(scene, 2440, Y1 - 30, 'POZO ↓');
    h.letrero(scene, 2960, Y1 - 6, 'CATACUMBAS ↓ (escalera)');
    h.letrero(scene, 1200, Y1 - 120, 'BODEGA');
    h.letrero(scene, 1750, Y1 - 160, 'SALA DE CADENAS');
    h.letrero(scene, 3400, Y1 - 120, 'CRIPTA DEL REY');
    h.letrero(scene, 700, S - 130, 'OSARIO');
    h.letrero(scene, 2600, S - 130, 'SALA DEL ECO');
    h.letrero(scene, 1580, S - 10, '~ LAVA ~');
    h.letrero(scene, 300, T2 - 110, 'CAMPANARIO');
    h.letrero(scene, 3320, T2 - 110, 'TORRE DEL VIGÍA');
    h.letrero(scene, 1000, CIELO - 50, '☁️ PUENTE DE LAS ALMAS ☁️');
    h.letrero(scene, ISLA.x0 + 150, ISLA.arriba - 90, 'ISLA DEL CIELO');
    h.letrero(scene, 300, T4 - 20, '↑ AL CIELO');
    h.letrero(scene, 3280, T4 - 20, '↑ AL CIELO');
}

function visible(scene, id) {
    if (id === 'campanario' && scene.nocheCampana) {
        scene.tweens.add({ targets: scene.nocheCampana, angle: { from: -25, to: 25 }, yoyo: true, repeat: 5, duration: 120, onComplete: () => scene.nocheCampana.setAngle(0) });
        scene.sound.play('punto_control', { volume: 0.7, rate: 1.2 });
        return '🔔 ¡SONÓ LA CAMPANA DEL CAMPANARIO!';
    }
    if (id === 'palanca' && scene.criptaPalanca) {
        scene.criptaPalanca.setTexture(C + 'lever2');
        scene.sound.play('romper', { volume: 0.6, rate: 0.6 });
        scene.cameras.main.shake(250, 0.004);
        return '⛓️ ¡ALGUIEN BAJÓ LA PALANCA DE LAS CRIPTAS!';
    }
    if (id === 'farol' && scene.criptaFarol) {
        scene.tweens.add({ targets: scene.criptaFarol, alpha: { from: 0, to: 0.6 }, duration: 700 });
        scene.sound.play('punto_control', { volume: 0.6, rate: 1.5 });
        return '🏮 ¡SE ENCENDIÓ EL FAROL DEL CIELO!';
    }
    if (id === 'vela' && scene.criptaVela) {
        scene.criptaVela.setVisible(true);
        scene.tweens.add({ targets: scene.criptaVela, scale: { from: 0.3, to: 1 }, duration: 500, ease: 'Back.out' });
        return '🕯️ ¡SE ENCENDIÓ UNA VELA JUNTO AL ALTAR!';
    }
    return null;
}

// ---------- mapa de caminos (bots.js y las flechas) ----------
const cadena = (ids, tipo) => ids.slice(1).map((id, i) => [ids[i], id, tipo]);
const NAV = {
    altar: 'altar',
    nodos: {
        // superficie
        antA: [240, T2], aTop: [300, T2], campanario: [350, T2], aStep: [480, T1], s0: [520, Y0], sE1: [590, Y0], sE1R: [800, Y0],
        flor1: [900, Y0], sP2: [1150, Y0], flor2: [1300, Y0], juicio: [1420, Y0], altar: [ALTAR.x, Y0], cand: [1770, Y0], sP1: [2150, Y0],
        pozoS: [2380, Y0], pozoSR: [2500, Y0], flor3: [2700, Y0], vBase: [3000, Y0], vStep: [3110, T1], vTop: [3260, T2], antB: [3400, T2],
        // cielo: el zigzag de cada torre, las tablas del puente y la isla
        aS3: [480, T3], aS4: [310, T4], aCielo: [480, CIELO], vS3: [3110, T3], vS4: [3280, T4], vCielo: [3110, CIELO],
        ...Object.fromEntries(PUENTE.map(([x, y], i) => [`t${i}`, [x + 55, y]])),
        farol: [1700, ISLA.arriba], islaI: [ISLA.x0 + 30, ISLA.arriba], islaD: [ISLA.x1 - 30, ISLA.arriba],
        // criptas
        cE1: [960, Y1], perg1: [1050, Y1], perg2: [1200, Y1], perg3: [1350, Y1], palanca: [1750, Y1], cP1: [2150, Y1],
        pozoC: [2380, Y1], pozoCR: [2500, Y1], cE2: [2990, Y1], rey: [3300, Y1],
        // catacumbas
        antC: [700, S], vela: [860, S], kP2: [1150, S], lavaI: [1450, S], lavaD: [1710, S], cofre: [2000, S], kPozo: [2440, S],
        antD: [2600, S], kE2: [2860, S],
    },
    tramos: [
        ['s0', 'sE1', 'camina'], ['sE1', 'sE1R', 'salta'],
        ...cadena(['sE1R', 'flor1', 'sP2', 'flor2', 'juicio', 'altar', 'cand', 'sP1', 'pozoS'], 'camina'),
        ['pozoS', 'pozoSR', 'salta'],
        ...cadena(['pozoSR', 'flor3', 'vBase'], 'camina'),
        ['vBase', 'vStep', 'salta'], ['vStep', 'vTop', 'salta'], ['vTop', 'antB', 'camina'],
        ['s0', 'aStep', 'salta'], ['aStep', 'aTop', 'salta'], ...cadena(['antA', 'aTop', 'campanario'], 'camina'),
        ...cadena(['aTop', 'aS3', 'aS4', 'aCielo', 't0', 't1', 't2', 't3', 't4', 'islaI'], 'salta'),
        ...cadena(['islaI', 'farol', 'islaD'], 'camina'),
        ...cadena(['islaD', 't5', 't6', 't7', 't8', 't9', 't10', 'vCielo', 'vS4', 'vS3', 'vTop'], 'salta'),
        ['farol', 'altar', 'caer'], // (de la isla, de un salto al altar)
        ['sE1', 'cE1', 'escalera'],
        ...cadena(['cE1', 'perg1', 'perg2', 'perg3', 'palanca', 'cP1', 'pozoC'], 'camina'),
        ['pozoC', 'pozoCR', 'salta'], ['pozoCR', 'cE2', 'camina'], ['cE2', 'rey', 'salta'],
        ['rey', 'kE2', 'escalera'],
        ...cadena(['antC', 'vela', 'kP2', 'lavaI'], 'camina'),
        ['lavaI', 'lavaD', 'salta'],
        ...cadena(['lavaD', 'cofre', 'kPozo', 'antD', 'kE2'], 'camina'),
        ['sP1', 'cP1', 'puerta'], ['sP2', 'kP2', 'puerta'],
        ['pozoS', 'kPozo', 'caer'], ['pozoC', 'kPozo', 'caer'],
    ],
    ascensor: null,
    pasos: {
        campanario: ['campanario'], flores: ['flor1', 'flor2', 'flor3'], pergaminos: ['perg1', 'perg2', 'perg3'],
        palanca: ['palanca'], cofre: ['cofre'], vela: ['vela', 'cand'], farol: ['farol'],
    },
    antorchas: { A: 'antA', B: 'antB', C: 'antC', D: 'antD' },
    // un bot empujado se cae de las torres (queda en la superficie) o a la lava de las catacumbas
    caida: (x, pie) => (pie < Y0 - 20 ? Y0 : pie > S - 5 && x > LAVA[0] - 40 && x < LAVA[1] + 40 ? S : null),
};

export const MAPA_CRIPTAS = {
    id: 'criptas',
    nombre: 'Las Criptas de Albora',
    ancho: ANCHO,
    nivel: nivelCriptas,
    antorchas: ANTORCHAS,
    altar: ALTAR,
    encargos: ENCARGOS,
    campanaJuicio: { x: 1420, pie: Y0, ms: 1200 },
    puertas: PUERTAS,
    // las Catacumbas son oscuras (por debajo de la losa de las Criptas)
    oscuro: { desde: Y1 + GROSOR + 20 },
    decorar,
    visible,
    nav: NAV,
};
