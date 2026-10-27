// Nivel 2: Las Catacumbas de Albora (estilo de las Criptas, ladrillo medieval de assets/criptas).
//
//   ENTRADA (cripta en ruinas, arriba) → ⬇ ESCALERA… que es una rampa → 🦴 OSARIO (oscuro) → 🚪🚪🚪
//   PUERTAS (una sola sirve) → ⛓️ SALA DE CADENAS (el techo baja) → 🔥 RÍO DE LAVA (sube cuando saltas)
//   → 🗿 punto de control falso → ⬆ TORRE → ⬇ POZO → 🧰 cofre mímico → 👹 Rey Troll → faro (con un cartel
//   que jura que es falso)
//
// Más difícil que el nivel 1 y lleno de trolleo al estilo Cat Mario. Lo propio de este nivel:
//   - la ESCALERA: a mitad de la bajada los escalones se desarman y te deslizas hacia un esqueleto
//   - el ATAÚD que respira: hay dos iguales; uno se abre cuando pasas y sale un esqueleto
//   - las PUERTAS: tres, quieto delante para cruzar; una sirve, otra te devuelve al principio de la sala
//     y otra suelta un zombie (cambian en cada intento). La pared del fondo de la sala es FALSA: detrás
//     hay un escondite con monedas y un cristal (el secreto del nivel)
//   - el TECHO de la sala de cadenas baja y aplasta: hay que correr
//   - la LAVA del río sube un poco cada vez que saltas
//   - el COFRE MÍMICO despierta cuando te acercas y te persigue un rato
//   - las CATACUMBAS son oscuras (solo se ve cerca) y al llegar abajo la cámara se aleja un momento
//   - de siempre: estatua falsa justo después del río, moneda que huye, ladrillos que caen sobre pinchos,
//     espíritus de fuego, más las trampas al azar del nivel 2 (azar.js)
//
// api (la da game.js): { killgesi(scene), crearEnemigo(scene, x, y, tipo), mensaje(scene, texto, ms) }

import { SUELO_Y } from "./alcance.js" // (no de niveles.js: niveles.js importa este archivo)
import { alFondo } from "./mazmorra.js"

const S = SUELO_Y;
const ARRIBA = 32;                     // el piso de la entrada (sobre la cripta)
const ESCALERA = { x: 760, n: 8 };     // 8 escalones de 33 px hasta el piso de las catacumbas
const ALTO_ESC = (S - ARRIBA) / (ESCALERA.n + 1);
const DESARMA_DESDE = 3;               // pisando este escalón, los de abajo se desarman
const TECHO = { x0: 1120, x1: 3600, abajo: 150 }; // el techo de las catacumbas
const OSCURO = [TECHO.x0, TECHO.x1];
const PUERTAS = { sala: 2180, xs: [2290, 2410, 2530], destino: 2960, quieto: 500 };
const FALSA = { x0: 2600, x1: 2660 };  // la pared falsa del fondo de la sala de puertas
const ESCONDITE = { x0: 2660, x1: 2840 };
const APLASTA = { x0: 3080, x1: 3480, aviso: 500, baja: 2600, espera: 800, sube: 1500, rearma: 3500 };
const RIO = { x0: 3650, x1: 4350, sube: 14, max: 75, baja: 20 };
const TORRE = { x0: 4480, muro: [4900, -52, 100] };
const MIMICO = { x: 5350, despierta: 160, vel: 125, dura: 4500 };
const META = 7400;
const fila = (x, y, n, sep = 32) => Array.from({ length: n }, (_, i) => [x + i * sep, y]);
const escalones = Array.from({ length: ESCALERA.n }, (_, i) =>
    [ESCALERA.x + i * 40, Math.round(ARRIBA + ALTO_ESC * (i + 1)), 40, 'oculta']);
const torre = Array.from({ length: 4 }, (_, i) => {
    const k = i + 1, izq = k % 2 === 1;
    return [TORRE.x0 + (izq ? 40 : 250), S - 96 * k, izq ? 120 : 130, 'tabla'];
});

export const NIVEL_CATACUMBAS = {
    nombre: 'Las Catacumbas de Albora',
    ancho: 7800,
    alto: 520,
    nubes: true,
    fondo: 'montanas',
    estilo: 'catacumbas',
    sinDecorado: true,
    velEnemigos: 50,
    mezcla: ['esqueleto', 'zombie3', 'zombie2', 'alien_dark_gray', 'esqueleto'],
    inicio: [180, ARRIBA - 70],
    zonasTranquilas: [[0, 700], [PUERTAS.sala - 80, FALSA.x1 + 300], [APLASTA.x0 - 100, APLASTA.x1 + 100], [RIO.x0 - 150, RIO.x1 + 150]],
    checkpoints: [1300, 3000, 5100, 6000],
    suelo: [[ESCALERA.x, RIO.x0], [RIO.x1, 7800]],
    lava: [[RIO.x0, RIO.x1]],
    muros: [[0, ARRIBA, ESCALERA.x], [2840, TECHO.abajo - 10, 60], TORRE.muro],
    techos: [[TECHO.x0, TECHO.x1, TECHO.abajo]],
    plataformas: [
        ...escalones,
        ...torre,
        // las piedras del río de lava
        [3720, 260, 80], [3880, 230, 80], [4040, 260, 80], [4200, 230, 80],
    ],
    // (combinada) dos ladrillos que caen justo sobre pinchos escondidos
    bloques: [[1790, 232, 'CC'], [1450, 232, 'B?B']],
    pinchos: [[1790, 2, true], [5150, 2, true]],
    estatuasFalsas: [RIO.x1 + 90],
    locuras: [[5600, 'monedaHuye']],
    espiritus: [[2050, 220], [5800, 200]],
    emboscadas: [[6000, [6150, 6250]]],
    enemigos: [1250, 1650, 2000, 3500, 4700, 5250, 5700, 6100],
    carteles: [[1000, ARRIBA - 70, 'BAJA CON CUIDADO'], [META - 90, 255, '¡ESTA ES FALSA!']],
    monedas: [
        ...fila(260, ARRIBA - 32, 4), ...fila(1350, 300, 3), ...fila(3200, 300, 4),
        ...fila(ESCONDITE.x0 + 20, 300, 5), ...fila(5450, 300, 4),
    ],
    cristales: [[(ESCONDITE.x0 + ESCONDITE.x1) / 2, 250]],
    corazones: [[3000, 300]],
    meta: META,
};

// ---------- recursos y dibujo ----------
const C = 'cr_';
const ESCALA = 2 / 3;
const pared = (scene, x0, y0, x1, y1, tile, prof, tinte) => {
    const t = scene.add.tileSprite(x0, y0, x1 - x0, y1 - y0, C + tile).setOrigin(0).setTileScale(ESCALA).setDepth(prof);
    if (prof < 1) alFondo(scene, t); // (paredes del fondo: detrás de enemigos y poderes)
    if (tinte) t.setTint(tinte);
    return t;
};
// (los muebles van al fondo: detrás de enemigos, poderes y monedas; los que deben ir delante, prof ≥ 30)
const objeto = (scene, n, x, pie, escala = 1, prof = 2) => {
    const o = scene.add.image(x, pie, C + n).setOrigin(0.5, 1).setScale(escala).setDepth(prof);
    return prof < 30 ? alFondo(scene, o) : o;
};
const letrero = (scene, x, y, texto) => scene.add.text(x, y, texto, {
    fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffe9a8', backgroundColor: '#3b2a1aDD', padding: { x: 6, y: 5 },
}).setOrigin(0.5, 1).setDepth(42);
const farol = (scene, x, y) => {
    objeto(scene, 'torch', x, y, 1, 1);
    scene.add.image(x, y - 22, 'brillo').setDepth(41).setScale(1.7).setTint(0xffa040).setAlpha(0.34).setBlendMode('ADD');
};

function texturas(scene) {
    if (scene.textures.exists('cat_ataud')) return;
    const g = scene.make.graphics({ add: false });
    // ataúd de pie (cuerpo y tapa por separado: la tapa se abre)
    g.fillStyle(0x3a2416).fillPoints([{ x: 8, y: 0 }, { x: 32, y: 0 }, { x: 40, y: 18 }, { x: 34, y: 80 }, { x: 6, y: 80 }, { x: 0, y: 18 }], true);
    g.generateTexture('cat_ataud', 40, 80);
    g.clear();
    g.fillStyle(0x6b4423).fillPoints([{ x: 8, y: 0 }, { x: 32, y: 0 }, { x: 40, y: 18 }, { x: 34, y: 80 }, { x: 6, y: 80 }, { x: 0, y: 18 }], true);
    g.fillStyle(0xc9a24a).fillRect(18, 16, 4, 26).fillRect(12, 24, 16, 4);
    g.generateTexture('cat_tapa', 40, 80);
    g.clear();
    // dientes del mímico
    g.fillStyle(0xffffff);
    for (let i = 0; i < 5; i++) g.fillTriangle(i * 8, 0, i * 8 + 8, 0, i * 8 + 4, 8);
    g.generateTexture('cat_dientes', 40, 8);
    g.destroy();
    // la oscuridad: un círculo de luz alrededor del jugador
    const w = 2000, h = 1200;
    const tx = scene.textures.createCanvas('cat_oscuro', w, h);
    const ctx = tx.getContext();
    const grad = ctx.createRadialGradient(w / 2, h / 2, 90, w / 2, h / 2, 230);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(3,3,10,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    tx.refresh();
}

let api = null;
export const configurarCatacumbas = a => { api = a; };

// al armar el nivel: el decorado y los mecanismos
export function crearCatacumbas(scene) {
    texturas(scene);
    // la entrada: la cripta en ruinas sobre el bloque de piedra
    pared(scene, 0, ARRIBA + 12, ESCALERA.x, S + 60, 'tile93', 1);
    pared(scene, 0, ARRIBA, ESCALERA.x, ARRIBA + 16, 'tile75', 1.1);
    pared(scene, 80, ARRIBA - 130, 330, ARRIBA, 'tile93', 0.1, 0x8a8aa0);
    for (let x = 80; x < 330; x += 50) pared(scene, x, ARRIBA - 154, x + 30, ARRIBA - 130, 'tile93', 0.1, 0x8a8aa0);
    objeto(scene, 'door3', 200, ARRIBA, 1.2, 0.3);
    letrero(scene, 520, ARRIBA - 80, 'LAS CATACUMBAS ↓');
    farol(scene, 420, ARRIBA - 60);
    farol(scene, 700, ARRIBA - 60);
    // la escalera (se dibuja aquí: se desarma)
    scene.catEscalones = escalones.map(([x, y, w]) => {
        const p = scene.floor.getChildren().find(f => f.esPlataforma && Math.abs(f.body.left - x) < 3 && Math.abs(f.body.top - y) < 3);
        const dibujo = [pared(scene, x, y + 12, x + w, Math.min(S, y + 60), 'tile93', 1, 0xb0b0c0), pared(scene, x, y, x + w, y + 16, 'tile75', 1.1)];
        return { p, dibujo, x, y };
    });
    scene.catEscaleraHecha = false;
    // las catacumbas: pared del fondo, huesos, ataúdes y antorchas
    pared(scene, TECHO.x0, TECHO.abajo, TECHO.x1, S, 'tile153', 0.05, 0x5a5a70);
    pared(scene, TECHO.x0, -40, TECHO.x1, -24, 'tile75', 1.2);
    for (let x = TECHO.x0; x < TECHO.x1; x += 70) pared(scene, x, -64, x + 40, -40, 'tile93', 1.2);
    [1180, 1600, 2100, 3000, 3300, 3550].forEach(x => farol(scene, x, S - 110));
    [[1500, 'vase'], [1900, 'barrel'], [3150, 'box'], [3420, 'barrel']].forEach(([x, n]) => objeto(scene, n, x, S, 1, 2));
    [3150, 3300, 3450].forEach(x => objeto(scene, 'chain1', x, TECHO.abajo, 1, 0.3).setOrigin(0.5, 0));
    letrero(scene, 1550, TECHO.abajo + 40, 'OSARIO');
    letrero(scene, 2400, TECHO.abajo + 40, 'SOLO UNA ES LA BUENA');
    letrero(scene, 3280, TECHO.abajo + 40, 'SALA DE CADENAS');
    // los ataúdes: dos iguales; el de la derecha respira
    objeto(scene, 'shield', 1700, TECHO.abajo + 90, 0.7, 0.3);
    alFondo(scene, scene.add.image(1380, S, 'cat_ataud').setOrigin(0.5, 1));
    alFondo(scene, scene.add.image(1380, S, 'cat_tapa').setOrigin(0.5, 1));
    alFondo(scene, scene.add.image(1560, S, 'cat_ataud').setOrigin(0.5, 1));
    scene.catAtaud = { tapa: alFondo(scene, scene.add.image(1560 - 20, S, 'cat_tapa').setOrigin(0, 1)), x: 1560, abierto: false };
    crearPuertas(scene);
    // la pared falsa (solo dibujo: se camina a través) y el muro de verdad detrás del escondite
    pared(scene, FALSA.x0, TECHO.abajo, FALSA.x1, S, 'tile93', 36);
    pared(scene, 2840, TECHO.abajo, 2900, S, 'tile93', 1);
    // el techo que baja
    scene.catAplasta = { fase: 'quieto', desde: 0, abajo: TECHO.abajo, dibujo: pared(scene, APLASTA.x0, TECHO.abajo, APLASTA.x1, TECHO.abajo + 1, 'tile93', 36) };
    scene.catAplasta.borde = pared(scene, APLASTA.x0, TECHO.abajo, APLASTA.x1, TECHO.abajo + 16, 'tile75', 36.1).setFlipY(true);
    // el río de lava que sube
    scene.catRio = { subida: 0, enSuelo: true, aviso: false, lava: scene.add.tileSprite(RIO.x0, S - 14, RIO.x1 - RIO.x0, 64, 'mz_lava_sup').setOrigin(0).setDepth(33).setAlpha(0) };
    // la torre y el pozo
    const [mx, ma, mw] = TORRE.muro;
    pared(scene, mx, ma + 12, mx + mw, S, 'tile93', 1);
    pared(scene, mx, ma, mx + mw, ma + 16, 'tile75', 1.1);
    objeto(scene, 'window', mx + 50, ma + 120, 1, 1.2);
    letrero(scene, TORRE.x0 + 120, S - 20, 'LA TORRE ↑');
    letrero(scene, mx + 160, ma - 10, 'POZO ↓');
    // el cofre mímico
    scene.catMimico = { x: MIMICO.x, cofre: objeto(scene, 'chest_closed', MIMICO.x, S, 1.6, 34), fase: 'duerme', hasta: 0 };
    scene.catMimico.dientes = scene.add.image(MIMICO.x, S - 30, 'cat_dientes').setDepth(34.1).setVisible(false);
    // la antesala
    [6200, 6350].forEach(x => farol(scene, x, S - 90));
    // la oscuridad y la cámara
    scene.catOscuro = null;
    scene.catWow = false;
}

// ---------- las puertas: una sirve, otra te devuelve, otra suelta un zombie ----------
function crearPuertas(scene) {
    const tipos = ['buena', 'vuelve', 'zombie'].sort(() => Math.random() - 0.5); // (distinto en cada intento)
    scene.catPuertas = PUERTAS.xs.map((x, i) => {
        const img = objeto(scene, 'door1', x, S, 1.1, 3);
        letrero(scene, x, S - 80, ['I', 'II', 'III'][i]);
        return { x, tipo: tipos[i], usada: false, img };
    });
    scene.catPuertaQuieto = null;
}
function revisarPuertas(scene, time) {
    const g = scene.mascotaGesi, b = g.body;
    const p = scene.catPuertas.find(q => !q.usada && Math.abs(b.center.x - q.x) < 22 && Math.abs(b.bottom - S) < 6 && Math.abs(b.velocity.x) < 5);
    if (!p) { scene.catPuertaQuieto = null; return; }
    if (scene.catPuertaQuieto?.p !== p) { scene.catPuertaQuieto = { p, desde: time }; return; }
    if (time - scene.catPuertaQuieto.desde < PUERTAS.quieto) return;
    scene.catPuertaQuieto = null;
    if (p.tipo === 'buena') {
        g.body.reset(PUERTAS.destino, S - 70);
        scene.cameras.main.flash(250, 140, 120, 255);
        api.mensaje(scene, '¡ERA LA BUENA!', 900);
        return;
    }
    p.usada = true;
    p.img.setTint(0x555566);
    if (p.tipo === 'vuelve') {
        g.body.reset(PUERTAS.sala, S - 70);
        scene.cameras.main.flash(250, 140, 120, 255);
        api.mensaje(scene, '¡VUELVE A EMPEZAR! :)', 1100);
    } else {
        api.crearEnemigo(scene, p.x, S - 2, 'zombie2');
        api.mensaje(scene, '¡JA, JA!', 900);
    }
}

// ---------- cada fotograma ----------
export function actualizarCatacumbas(scene, time) {
    const g = scene.mascotaGesi;
    if (!g?.body || !scene.catEscalones) return;
    const vivo = !g.isDead && !scene.nivelTerminado;
    if (vivo) {
        escalera(scene);
        ataud(scene);
        revisarPuertas(scene, time);
        wow(scene);
    }
    aplastar(scene, time, vivo);
    rio(scene, vivo);
    mimico(scene, time, vivo);
    oscuridad(scene);
}

// a mitad de la bajada, los escalones de abajo se desarman y te deslizas hacia el esqueleto
function escalera(scene) {
    if (scene.catEscaleraHecha) return;
    const g = scene.mascotaGesi, b = g.body;
    // (al bajar se pasa por los escalones medio en el aire: cuenta cruzar ese punto de la escalera)
    const pisa = scene.catEscalones[DESARMA_DESDE - 1];
    if (b.center.x < pisa.x + 10 || b.center.x > pisa.x + 120 || b.bottom > S - 60 || b.bottom < ARRIBA) return;
    scene.catEscaleraHecha = true;
    scene.catEscalones.slice(DESARMA_DESDE).forEach((e, i) => {
        if (e.p?.body) e.p.body.enable = false;
        scene.tweens.add({ targets: e.dibujo, y: '+=30', alpha: 0, angle: 12, delay: 80 * i, duration: 500 });
    });
    g.setVelocity(260, -60);
    scene.empujadoHasta = scene.time.now + 700; // (se desliza: no se frena)
    scene.cameras.main.shake(220, 0.006);
    scene.sound.play('romper', { volume: 0.6 });
    api.mensaje(scene, '¡ERA UNA RAMPA!', 1000);
    api.crearEnemigo(scene, ESCALERA.x + ESCALERA.n * 40 + 140, S - 2, 'esqueleto');
}

// el ataúd de la derecha se abre al pasar y sale un esqueleto
function ataud(scene) {
    const a = scene.catAtaud;
    if (a.abierto || Math.abs(scene.mascotaGesi.body.center.x - a.x) > 90) return;
    a.abierto = true;
    scene.tweens.add({ targets: a.tapa, angle: -70, duration: 300, ease: 'Back.out' });
    scene.sound.play('romper', { volume: 0.5, rate: 0.6 });
    api.crearEnemigo(scene, a.x + 30, S - 2, 'esqueleto');
    api.mensaje(scene, '¡EL ATAÚD RESPIRA!', 1000);
}

// al llegar abajo, la cámara se aleja un momento: se ve el laberinto oscuro
function wow(scene) {
    if (scene.catWow) return;
    const b = scene.mascotaGesi.body;
    if (b.center.x < TECHO.x0 + 40 || b.bottom < S - 4) return;
    scene.catWow = true;
    const cam = scene.cameras.main, z = cam.zoom;
    cam.zoomTo(z * 0.7, 900, 'Sine.easeInOut');
    scene.time.delayedCall(2300, () => { if (scene.scene.isActive()) cam.zoomTo(z, 900, 'Sine.easeInOut'); });
}

// el techo de la sala de cadenas baja hasta el piso (aplasta) y vuelve a subir
function aplastar(scene, time, vivo) {
    const a = scene.catAplasta, g = scene.mascotaGesi, b = g.body;
    const dentro = b.center.x > APLASTA.x0 + 20 && b.center.x < APLASTA.x1;
    const t = time - a.desde;
    if (a.fase === 'quieto') {
        if (vivo && dentro) { a.fase = 'aviso'; a.desde = time; scene.cameras.main.shake(APLASTA.aviso, 0.003); scene.sound.play('romper', { volume: 0.4, rate: 0.5 }); }
    } else if (a.fase === 'aviso') {
        if (t > APLASTA.aviso) { a.fase = 'baja'; a.desde = time; }
    } else if (a.fase === 'baja') {
        a.abajo = TECHO.abajo + (S - TECHO.abajo) * Math.min(1, t / APLASTA.baja);
        if (t > APLASTA.baja) { a.fase = 'espera'; a.desde = time; scene.cameras.main.shake(160, 0.008); }
    } else if (a.fase === 'espera') {
        if (t > APLASTA.espera) { a.fase = 'sube'; a.desde = time; }
    } else if (a.fase === 'sube') {
        a.abajo = S - (S - TECHO.abajo) * Math.min(1, t / APLASTA.sube);
        if (t > APLASTA.sube) { a.fase = 'descansa'; a.desde = time; a.abajo = TECHO.abajo; }
    } else if (t > APLASTA.rearma) a.fase = 'quieto';
    a.dibujo.setSize(APLASTA.x1 - APLASTA.x0, Math.max(1, a.abajo - TECHO.abajo));
    a.borde.setY(a.abajo - 16);
    if (vivo && dentro && a.abajo > b.top + 6 && (a.fase === 'baja' || a.fase === 'espera')) api.killgesi(scene);
}

// cada salto sobre el río sube la lava; si no saltas, baja despacio
function rio(scene, vivo) {
    const r = scene.catRio, g = scene.mascotaGesi, b = g.body;
    const encima = b.center.x > RIO.x0 && b.center.x < RIO.x1;
    const suelo = b.blocked.down || b.touching.down;
    if (vivo && encima && r.enSuelo && !suelo && b.velocity.y < -50) {
        r.subida = Math.min(RIO.max, r.subida + RIO.sube);
        if (!r.aviso) { r.aviso = true; api.mensaje(scene, '¿…la lava sube?', 900); }
    }
    r.enSuelo = suelo;
    if (!encima) r.subida = Math.max(0, r.subida - RIO.baja * scene.game.loop.delta / 1000);
    const arriba = S - 14 - r.subida;
    r.lava.setY(arriba).setAlpha(r.subida > 1 ? 1 : 0).setSize(RIO.x1 - RIO.x0, S + 60 - arriba);
    r.lava.tilePositionX = scene.time.now * 0.015;
    if (vivo && encima && r.subida > 4 && b.bottom > arriba + 8) api.killgesi(scene);
}

// el cofre mímico: despierta cuando te acercas, muestra los dientes y te persigue un rato
function mimico(scene, time, vivo) {
    const m = scene.catMimico, g = scene.mascotaGesi, b = g.body;
    const dx = b.center.x - m.x;
    if (m.fase === 'duerme') {
        if (vivo && Math.abs(dx) < MIMICO.despierta && Math.abs(b.bottom - S) < 40) {
            m.fase = 'persigue'; m.hasta = time + MIMICO.dura;
            m.dientes.setVisible(true);
            scene.tweens.add({ targets: m.cofre, angle: { from: -8, to: 8 }, yoyo: true, repeat: 3, duration: 70 });
            api.mensaje(scene, '¡EL COFRE TIENE DIENTES!', 1000);
        }
    } else if (m.fase === 'persigue') {
        m.x += Math.sign(dx) * MIMICO.vel * scene.game.loop.delta / 1000;
        m.cofre.setX(m.x).setFlipX(dx < 0).setY(S - Math.abs(Math.sin(time / 90)) * 8);
        m.dientes.setPosition(m.x, m.cofre.y - 30);
        if (vivo && Math.abs(dx) < 26 && b.bottom > S - 40) api.killgesi(scene);
        if (time > m.hasta) { m.fase = 'duerme'; m.dientes.setVisible(false); m.cofre.setY(S); }
    }
}

// las catacumbas son oscuras: solo se ve alrededor del jugador
function oscuridad(scene) {
    const g = scene.mascotaGesi, b = g.body;
    const dentro = b.center.x > OSCURO[0] && b.center.x < OSCURO[1] && b.bottom > TECHO.abajo;
    if (!dentro) { scene.catOscuro?.setVisible(false); return; }
    scene.catOscuro ||= scene.add.image(0, 0, 'cat_oscuro').setDepth(45).setAlpha(0.88);
    scene.catOscuro.setVisible(true).setPosition(b.center.x, b.center.y);
}
