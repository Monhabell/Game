// Nivel 3: Las Minas del Rey Troll (estilo de las Criptas, ladrillo medieval de assets/criptas).
//
//   ANDAMIOS (arriba)   🔍repisa secreta   ═══ andamios ═══          ═══ andamios 🗝️ ═══   💎
//   RIELES (medio)   ↗ ═══ 🛒 carro ↝ (el riel se corta) ═══ 💣 ═══ 🗝️ ═══ ⛏️ muro ═══ ↘
//   GALERÍAS (abajo) ☁️gas 🗝️  💣  🔥lava🔥 💎 (falso)  🔥 (atajo→gólem)      🛗  🔍escondite
//   …→ 🚪 la guarida (3 SELLOS) → 👹 Rey Troll → faro
//
// MISIONES: la guarida del Rey Troll está cerrada con 3 sellos; cada misión abre uno (en cualquier orden):
//   🗝️ rescatar a 3 mineros (jaulas: se rompen con cualquier ataque, de cerca o de lejos)
//   💎 encender 3 cristales (lejos o en lo alto: hay que dispararles)
//   ⛏️ abrir el túnel derrumbado (un muro agrietado que solo rompe un PODER especial, V o B)
// La lista se ve a la izquierda y una flecha lleva a lo pendiente más cercano. Lo hecho se guarda al morir
// (no después de un GAME OVER: se vuelve a empezar el nivel).
//
// SECRETOS (4, se cuentan al final): el escondite tras la pared falsa, el cuarto minero (regala un corazón),
// la repisa escondida sobre los andamios (un bloque invisible lleva a ella) y su cofre (un poder legendario).
//
// TRAMPAS de este nivel: el carro de mina (el riel se corta: hay que saltar a tiempo), el cristal falso
// (despierta un gólem), el minero traidor (ojos rojos: es un troll), la dinamita (explota si le pegas o si
// la toca un enemigo: te mata a ti también), el ascensor que baja de golpe, las vagonetas colgantes que se
// caen, el "atajo" que lleva a un gólem y el gas de la mina (no puedes usar ataques ni poderes).
// Más las trampas al azar del nivel 3 (azar.js).
//
// api (la da game.js): { killgesi(scene), crearEnemigo(scene, x, y, tipo), mensaje(scene, texto, ms),
//   dañarEnemigo(scene, e, cantidad), soltarCorazon(scene, x, y), orbe(scene) }

import { SUELO_Y } from "./alcance.js" // (no de niveles.js: niveles.js importa este archivo)
import { alFondo } from "./mazmorra.js"

const S = SUELO_Y;
const Y1 = 140;              // los rieles (el piso del medio)
const GROSOR = 30;
const Y2 = -52;              // los andamios
const LOSAS = [[940, 2000], [2600, 3600], [3740, 5000]];
const CARRO = { x: 2064, recorrido: 336, vel: 150 };
const ASCENSOR = 3670;
const LAVA = [2200, 2400];
const GAS = [1100, 1500];
const POCKET = { falsa: [4700, 4760], x0: 4760, x1: 4940, muro: 4940 };
const PUERTA = { x: 5500, ancho: 60 };
const META = 7050;
const fila = (x, y, n, sep = 32) => Array.from({ length: n }, (_, i) => [x + i * sep, y]);
// subida al riel desde la entrada (hacia la derecha) y bajada del riel al final (hacia la derecha)
const SUBIDA = Array.from({ length: 6 }, (_, i) => [700 + i * 40, S - 32 * (i + 1), 40, 'oculta']);
const BAJADA = Array.from({ length: 5 }, (_, i) => [5000 + i * 40, Y1 + 32 * (i + 1), 40, 'oculta']);

// misiones: lo que hay que romper o encender (x, y = centro)
const MINEROS = [
    { id: 'j1', x: 1700, y: S - 30 },          // galería, después del gas
    { id: 'j2', x: 3000, y: Y1 - 30 },         // rieles
    { id: 'j3', x: 4400, y: Y2 - 30 },         // andamios de la derecha
];
const TRAIDOR = { x: 2700, y: S - 30 };
const SECRETO_MINERO = { x: 4850, y: S - 30 };
const CRISTALES = [
    { id: 'c1', x: 2300, y: 270 },             // sobre la lava de la galería
    { id: 'c2', x: 3670, y: 100 },             // sobre el hueco del ascensor (se le dispara desde el riel)
    { id: 'c3', x: 4950, y: Y2 - 40 },         // al final de los andamios
];
const FALSO = { x: 2900, y: 270 };
const MURO = { x: 4400, arriba: -40, abajo: Y1, ancho: 60 };
const DINAMITA = [[1900, S], [3200, Y1], [4200, S]];
const REPISA = { x: 2380, arriba: -262, ancho: 120 };

export const NIVEL_MINAS = {
    nombre: 'Las Minas del Rey Troll',
    ancho: 7400,
    alto: 700,
    nubes: true,
    fondo: 'montanas',
    estilo: 'minas',
    sinDecorado: true,
    velEnemigos: 55,
    mezcla: ['zombie3', 'esqueleto', 'alien_armor', 'zombie2', 'alien_dark_gray'],
    zonasTranquilas: [[0, 700], [GAS[0] - 50, GAS[1] + 50], [POCKET.falsa[0] - 60, POCKET.muro + 260], [PUERTA.x - 200, PUERTA.x + 300]],
    checkpoints: [600, 2050, 5300],
    suelo: [[0, LAVA[0]], [LAVA[1], 7400]],
    lava: [LAVA],
    losas: LOSAS.map(([a, b]) => [a, b, Y1, GROSOR]),
    muros: [[POCKET.muro, Y1 + GROSOR, 60]],
    plataformas: [
        ...SUBIDA, ...BAJADA,
        // a los andamios de la izquierda (desde el riel) y los andamios
        [1440, 44, 110, 'tabla'], [1600, Y2, 110, 'tabla'],
        [1780, Y2, 300, 'tabla'], [2180, Y2, 300, 'tabla'], [2580, Y2, 300, 'tabla'],
        // andamios de la derecha (desde el ascensor)
        [3760, Y2, 400, 'tabla'], [4260, Y2, 400, 'tabla'],
        // la repisa secreta
        [REPISA.x, REPISA.arriba, REPISA.ancho, 'tabla'],
        // las vagonetas colgantes sobre la lava (tiemblan y se caen: locura 'puente')
        [2235, 262, 70], [2325, 250, 70],
    ],
    moviles: [
        [CARRO.x, Y1 + 16, 'x', CARRO.recorrido, CARRO.vel, 'carro'],
        [ASCENSOR, 316, 'y', S - Y2 + 12, 55],
    ],
    // el bloque invisible que lleva a la repisa secreta (golpéalo desde el andamio)
    bloques: [[2300, -150, 'H']],
    locuras: [[ASCENSOR, 'ascensor'], [2235, 'puente'], [2325, 'puente'], [3400, 'monedaHuye']],
    pinchos: [[2480, 2, true], [4100, 2, true]],
    carteles: [[2620, Y1 - 60, 'ATAJO ↓'], [2050, Y1 - 60, '¡SALTA AL FINAL!']],
    espiritus: [[3300, 40], [4600, -120]],
    emboscadas: [[5250, [5350, 5420]]],
    enemigos: [1250, [1300, Y1 - 2], [1750, Y1 - 2], 2600, [3300, Y1 - 2], 3900, [4000, Y2 - 2], [4600, Y1 - 2], 5600, 5800],
    monedas: [...fila(1000, Y1 - 32, 5), ...fila(1820, Y2 - 32, 6), ...fila(POCKET.x0 + 20, 300, 5), ...fila(3800, Y2 - 32, 5), ...fila(5700, 300, 4)],
    cristales: [[REPISA.x + 30, REPISA.arriba - 40]],
    corazones: [[3050, Y1 - 40]],
    meta: META,
};

// ---------- estado de las misiones (sigue al morir; se borra al empezar el nivel de nuevo) ----------
let estado = null;
const nuevoEstado = () => ({
    mineros: new Set(), cristales: new Set(), muro: false, abierta: false,
    secretos: new Set(), rotos: new Set(), // (rotos: jaulas, cristales falsos y dinamita que ya no están)
});
export const reiniciarMinas = () => { estado = null; };
const misionesHechas = () => estado.mineros.size >= 3 && estado.cristales.size >= 3 && estado.muro;

let api = null;
export const configurarMinas = a => { api = a; };

// ---------- texturas ----------
export function texturasMinas(scene) {
    if (scene.textures.exists('min_carro')) return;
    const g = scene.make.graphics({ add: false });
    // carro de mina (mismo tamaño que la plataforma móvil: 128 × 32)
    g.fillStyle(0x5a3a22).fillRect(6, 0, 116, 22);
    g.fillStyle(0x7a5232).fillRect(10, 3, 108, 6);
    g.fillStyle(0x3a3a44).fillRect(0, 0, 128, 4).fillCircle(28, 26, 6).fillCircle(100, 26, 6);
    g.generateTexture('min_carro', 128, 32);
    g.clear();
    // jaula
    g.lineStyle(3, 0x8a8a96).strokeRect(2, 2, 44, 56);
    for (let x = 12; x < 46; x += 10) g.lineBetween(x, 2, x, 58);
    g.fillStyle(0xc9a24a).fillRect(18, 26, 12, 10);
    g.generateTexture('min_jaula', 48, 60);
    g.clear();
    // cristal (apagado: gris azulado; encendido: se tiñe de dorado)
    g.fillStyle(0xffffff).fillPoints([{ x: 14, y: 0 }, { x: 28, y: 18 }, { x: 14, y: 44 }, { x: 0, y: 18 }], true);
    g.fillStyle(0xdfe8ff, 0.6).fillPoints([{ x: 14, y: 0 }, { x: 20, y: 18 }, { x: 14, y: 44 }], true);
    g.generateTexture('min_cristal', 28, 44);
    g.clear();
    // dinamita
    g.fillStyle(0xb02a2a).fillRect(4, 6, 24, 26);
    g.fillStyle(0x7a1a1a).fillRect(4, 12, 24, 3).fillRect(4, 24, 24, 3);
    g.fillStyle(0x3a2a1a).fillRect(15, 0, 2, 7);
    g.fillStyle(0xffc94a).fillCircle(16, 0, 2);
    g.generateTexture('min_tnt', 32, 32);
    g.destroy();
}

// ---------- dibujo ----------
const C = 'cr_';
const ESCALA = 2 / 3;
const pared = (scene, x0, y0, x1, y1, tile, prof, tinte) => {
    const t = scene.add.tileSprite(x0, y0, x1 - x0, y1 - y0, C + tile).setOrigin(0).setTileScale(ESCALA).setDepth(prof);
    if (tinte) t.setTint(tinte);
    if (prof < 1) alFondo(scene, t); // (paredes del fondo: detrás de enemigos y poderes)
    return t;
};
const letrero = (scene, x, y, texto) => scene.add.text(x, y, texto, {
    fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffe9a8', backgroundColor: '#3b2a1aDD', padding: { x: 6, y: 5 },
}).setOrigin(0.5, 1).setDepth(42);
const farol = (scene, x, y) => {
    alFondo(scene, scene.add.image(x, y, C + 'torch').setOrigin(0.5, 1));
    scene.add.image(x, y - 22, 'brillo').setDepth(41).setScale(1.6).setTint(0xffa040).setAlpha(0.3).setBlendMode('ADD');
};
const texto = (scene, x, y, t, tam = 18) => scene.add.text(x, y, t, { fontSize: `${tam}px` }).setOrigin(0.5).setDepth(3);

export function crearMinas(scene) {
    texturasMinas(scene);
    estado ??= nuevoEstado();
    scene.minasCosas = [];
    // el interior de la mina: pared del fondo, vigas de madera y los pisos (losas) de ladrillo
    pared(scene, 640, Y2 - 120, 5000, S, 'tile153', 0.05, 0x55556a);
    for (let x = 1000; x < 5000; x += 260) alFondo(scene, scene.add.rectangle(x, Y1 + GROSOR, 10, S - Y1 - GROSOR, 0x5a3a22).setOrigin(0.5, 0));
    LOSAS.forEach(([a, b]) => {
        pared(scene, a, Y1 + 10, b, Y1 + GROSOR, 'tile93', 1);
        pared(scene, a, Y1, b, Y1 + 16, 'tile75', 1.1);
        // los rieles
        const r = scene.add.graphics().setDepth(1.2);
        r.lineStyle(2, 0x9a9aa8).lineBetween(a, Y1 - 2, b, Y1 - 2);
        for (let x = a + 8; x < b; x += 24) r.fillStyle(0x5a3a22).fillRect(x, Y1 - 3, 10, 3);
    });
    [...SUBIDA, ...BAJADA].forEach(([x, y, w]) => { pared(scene, x, y + 12, x + w, S, 'tile93', 1, 0xb0b0c0); pared(scene, x, y, x + w, y + 16, 'tile75', 1.1); });
    // el escondite: la pared falsa (solo dibujo, delante) y el muro de verdad
    pared(scene, POCKET.falsa[0], Y1 + GROSOR, POCKET.falsa[1], S, 'tile93', 36);
    pared(scene, POCKET.muro, Y1 + GROSOR, POCKET.muro + 60, S, 'tile93', 1);
    // el gas de la mina
    scene.minasGas = scene.add.rectangle(GAS[0], Y1 + GROSOR, GAS[1] - GAS[0], S - Y1 - GROSOR, 0x6aff6a, 0.16).setOrigin(0).setDepth(40);
    scene.tweens.add({ targets: scene.minasGas, alpha: 0.26, yoyo: true, repeat: -1, duration: 1300 });
    letrero(scene, GAS[0] + 200, S - 110, '☁️ GAS: SIN PODERES');
    // cadenas de las vagonetas colgantes
    [2270, 2360].forEach(x => alFondo(scene, scene.add.rectangle(x, Y1 + GROSOR, 3, 230 - Y1 - GROSOR, 0x8a8a96).setOrigin(0.5, 0)));
    // faroles y letreros
    [700, 1200, 1900, 2700, 3300, 4100, 4600].forEach(x => farol(scene, x, Y1 - 50));
    [1000, 1600, 2900, 3900].forEach(x => farol(scene, x, S - 100));
    letrero(scene, 450, S - 90, 'LAS MINAS · 3 SELLOS');
    letrero(scene, CARRO.x + CARRO.recorrido + 120, Y1 - 60, 'EL RIEL SE CORTA →');
    letrero(scene, ASCENSOR, S - 160, 'ASCENSOR ↑');
    // jaulas, cristales, muro agrietado, dinamita y la puerta de los sellos
    scene.minasJaulas = [
        ...MINEROS.map(m => crearJaula(scene, m, 'minero')),
        crearJaula(scene, { id: 'traidor', ...TRAIDOR }, 'traidor'),
        crearJaula(scene, { id: 'secreto', ...SECRETO_MINERO }, 'secreto'),
    ].filter(Boolean);
    scene.minasCristales = [...CRISTALES.map(c => crearCristal(scene, c, false)), crearCristal(scene, { id: 'falso', ...FALSO }, true)].filter(Boolean);
    crearMuro(scene);
    scene.minasTnt = DINAMITA.map(([x, pie], i) => {
        if (estado.rotos.has(`tnt${i}`)) return null;
        return { id: `tnt${i}`, x, y: pie - 22, img: alFondo(scene, scene.add.image(x, pie, 'min_tnt').setOrigin(0.5, 1)) };
    }).filter(Boolean);
    crearPuerta(scene);
    // el cofre de la repisa secreta
    scene.minasCofre = estado.secretos.has('orbe') ? null
        : alFondo(scene, scene.add.image(REPISA.x + 90, REPISA.arriba, C + 'chest_closed').setOrigin(0.5, 1).setScale(1.3));
    scene.minasGolem = new Set(); // (el atajo: un gólem por intento)
    crearLista(scene);
    scene.events.once('shutdown', () => { quitarLista(); });
}

function crearJaula(scene, m, tipo) {
    if (estado.rotos.has(m.id)) return null;
    const cara = texto(scene, m.x, m.y + 4, '👷', 22);
    // el traidor: ojos rojos (la pista)
    const ojos = tipo === 'traidor' ? scene.add.text(m.x, m.y - 2, '• •', { fontSize: '8px', color: '#ff2a2a' }).setOrigin(0.5).setDepth(3.1) : null;
    const jaula = scene.add.image(m.x, m.y + 30, 'min_jaula').setOrigin(0.5, 1).setDepth(3.2);
    return { ...m, tipo, cara, ojos, jaula, r: 28 };
}
function crearCristal(scene, c, falso) {
    if (estado.rotos.has(c.id)) return null;
    const lit = estado.cristales.has(c.id);
    const img = scene.add.image(c.x, c.y, 'min_cristal').setDepth(3).setTint(lit ? 0xffd27a : 0x8fc8ff);
    const luz = scene.add.image(c.x, c.y, 'brillo').setDepth(41).setScale(lit ? 2.4 : 1.2).setTint(lit ? 0xffc94a : 0x8fc8ff).setAlpha(lit ? 0.6 : 0.3).setBlendMode('ADD');
    if (!lit) scene.tweens.add({ targets: img, y: c.y - 5, yoyo: true, repeat: -1, duration: 900 });
    return { ...c, falso, lit, img, luz, r: 26 };
}
function crearMuro(scene) {
    if (estado.muro) return;
    const b = scene.floor.create(MURO.x, MURO.arriba, 'suelo').setOrigin(0, 0)
        .setScale(MURO.ancho / 128, (MURO.abajo - MURO.arriba) / 32).refreshBody().setVisible(false);
    const dibujo = pared(scene, MURO.x, MURO.arriba, MURO.x + MURO.ancho, MURO.abajo, 'tile93', 1.3, 0xc8b8a8);
    const grietas = scene.add.graphics().setDepth(1.4);
    grietas.lineStyle(2, 0x1a1008);
    grietas.lineBetween(MURO.x + 10, MURO.arriba + 30, MURO.x + 35, MURO.arriba + 80).lineBetween(MURO.x + 35, MURO.arriba + 80, MURO.x + 20, MURO.arriba + 130)
        .lineBetween(MURO.x + 45, MURO.arriba + 60, MURO.x + 30, MURO.arriba + 110);
    letrero(scene, MURO.x + 30, MURO.arriba - 6, '⛏️ USA UN PODER (V/B)');
    scene.minasMuro = { b, dibujo, grietas };
}
function crearPuerta(scene) {
    if (estado.abierta) return;
    const b = scene.floor.create(PUERTA.x, -380, 'suelo').setOrigin(0, 0)
        .setScale(PUERTA.ancho / 128, (S + 380) / 32).refreshBody().setVisible(false);
    const dibujo = pared(scene, PUERTA.x, -380, PUERTA.x + PUERTA.ancho, S, 'tile93', 1.3, 0x9a8aa8);
    const sellos = [0, 1, 2].map(i => scene.add.circle(PUERTA.x + 30, S - 200 + i * 50, 12, 0x2a2a38).setStrokeStyle(2, 0xffc94a).setDepth(1.5));
    letrero(scene, PUERTA.x - 40, S - 250, 'LA GUARIDA: 3 SELLOS');
    scene.minasPuerta = { b, dibujo, sellos };
    pintarSellos(scene);
}

// ---------- golpes: ataques de cerca (zona), flechas y magia (cada fotograma) y poderes (zona) ----------
// (game.js lo llama con la zona de cada ataque de cerca y de cada poder especial)
export function golpeMinas(scene, zona, fuente) {
    if (!scene.minasJaulas || !estado) return;
    const toca = o => Phaser.Geom.Intersects.CircleToRectangle(new Phaser.Geom.Circle(o.x, o.y, o.r), zona);
    scene.minasJaulas.filter(j => !estado.rotos.has(j.id) && toca(j)).forEach(j => romperJaula(scene, j));
    scene.minasCristales.filter(c => !c.lit && !estado.rotos.has(c.id) && toca(c)).forEach(c => tocarCristal(scene, c));
    scene.minasTnt.filter(t => !estado.rotos.has(t.id) && toca({ ...t, r: 26 })).forEach(t => explotar(scene, t));
    if (fuente === 'poder' && scene.minasMuro && Phaser.Geom.Intersects.RectangleToRectangle(zona,
        new Phaser.Geom.Rectangle(MURO.x, MURO.arriba, MURO.ancho, MURO.abajo - MURO.arriba))) romperMuro(scene);
}
// flechas y magia de los personajes (scene.flechasGrupo)
function revisarProyectiles(scene) {
    scene.flechasGrupo?.getChildren().slice().forEach(p => {
        if (!p.active) return;
        const zona = new Phaser.Geom.Rectangle(p.x - 10, p.y - 10, 20, 20);
        const antes = estado.rotos.size + estado.cristales.size;
        golpeMinas(scene, zona, 'disparo');
        if (estado.rotos.size + estado.cristales.size !== antes && !p.perfora) p.destroy();
        // (el muro agrietado para las flechas: no se rompe con ellas)
        else if (scene.minasMuro && zona.right > MURO.x && zona.left < MURO.x + MURO.ancho && zona.bottom > MURO.arriba && zona.top < MURO.abajo) {
            p.destroy();
            if (!scene.minasAvisoMuro) { scene.minasAvisoMuro = true; api.mensaje(scene, 'SOLO UN PODER LO ROMPE (V/B)', 1100); }
        }
    });
}

function romperJaula(scene, j) {
    estado.rotos.add(j.id);
    scene.tweens.add({ targets: j.jaula, y: j.jaula.y + 20, alpha: 0, angle: 20, duration: 400, onComplete: () => j.jaula.destroy() });
    scene.sound.play('romper', { volume: 0.5 });
    if (j.tipo === 'traidor') {
        // ¡no era un minero!
        j.cara.destroy(); j.ojos?.destroy();
        api.crearEnemigo(scene, j.x, S - 2, 'zombie3');
        api.mensaje(scene, '¡ERA UN TROLL DISFRAZADO!', 1200);
        return;
    }
    scene.tweens.add({ targets: [j.cara, j.ojos].filter(Boolean), y: '-=40', alpha: 0, delay: 500, duration: 700 });
    if (j.tipo === 'secreto') {
        estado.secretos.add('minero4');
        api.soltarCorazon(scene, j.x, j.y);
        api.mensaje(scene, '🔍 ¡UN MINERO ESCONDIDO!\nTe regala un corazón', 1600);
        pintarLista(scene);
        return;
    }
    estado.mineros.add(j.id);
    api.mensaje(scene, `🗝️ ¡MINERO RESCATADO! ${estado.mineros.size}/3`, 1200);
    revisarSellos(scene);
}
function tocarCristal(scene, c) {
    if (c.falso) {
        estado.rotos.add(c.id);
        c.img.destroy(); c.luz.destroy();
        golem(scene, c.x, S - 2);
        api.mensaje(scene, '¡ERA UN CRISTAL FALSO!', 1200);
        return;
    }
    c.lit = true;
    estado.cristales.add(c.id);
    scene.tweens.killTweensOf(c.img);
    c.img.setTint(0xffd27a);
    c.luz.setTint(0xffc94a).setScale(2.4).setAlpha(0.6);
    scene.sound.play('punto_control', { volume: 0.5, rate: 1.3 });
    api.mensaje(scene, `💎 ¡CRISTAL ENCENDIDO! ${estado.cristales.size}/3`, 1200);
    revisarSellos(scene);
}
function romperMuro(scene) {
    const m = scene.minasMuro;
    scene.minasMuro = null;
    estado.muro = true;
    m.b.destroy();
    scene.tweens.add({ targets: [m.dibujo, m.grietas], alpha: 0, y: '+=40', duration: 600, onComplete: () => { m.dibujo.destroy(); m.grietas.destroy(); } });
    scene.cameras.main.shake(300, 0.008);
    scene.sound.play('romper', { volume: 0.8, rate: 0.6 });
    api.mensaje(scene, '⛏️ ¡TÚNEL ABIERTO!', 1200);
    revisarSellos(scene);
}

// dinamita: explota (le pegaste o la tocó un enemigo) y alcanza a todo lo que esté cerca
const RADIO_TNT = 95;
function explotar(scene, t) {
    if (estado.rotos.has(t.id)) return;
    estado.rotos.add(t.id);
    t.img.destroy();
    const fx = scene.add.circle(t.x, t.y, 20, 0xffa040, 0.85).setDepth(44);
    scene.tweens.add({ targets: fx, radius: RADIO_TNT, alpha: 0, duration: 450, onComplete: () => fx.destroy() });
    scene.cameras.main.shake(300, 0.012);
    scene.sound.play('romper', { volume: 0.9, rate: 0.5 });
    scene.enemies.getChildren().forEach(e => {
        if (!e.isDead && e.body && Math.hypot(e.body.center.x - t.x, e.body.center.y - t.y) < RADIO_TNT) api.dañarEnemigo(scene, e, 5);
    });
    // las otras dinamitas cerca, en cadena
    scene.minasTnt.filter(o => o !== t && !estado.rotos.has(o.id) && Math.hypot(o.x - t.x, o.y - t.y) < RADIO_TNT).forEach(o => scene.time.delayedCall(200, () => explotar(scene, o)));
    const g = scene.mascotaGesi;
    if (g && !g.isDead && Math.hypot(g.body.center.x - t.x, g.body.center.y - t.y) < RADIO_TNT) api.killgesi(scene);
}

// un gólem de cristal: un enemigo grande, celeste
function golem(scene, x, y) {
    const e = api.crearEnemigo(scene, x, y, 'alien_armor');
    if (!e) return;
    e.setScale(e.scaleX * 1.35).setTint(0x9fe8ff);
    e.vida = (e.vida || 1) + 3;
    e.gigante = true;
}

// ---------- los sellos y la guarida ----------
function revisarSellos(scene) {
    pintarSellos(scene);
    pintarLista(scene);
    if (!misionesHechas() || estado.abierta) return;
    estado.abierta = true;
    const p = scene.minasPuerta;
    if (p) {
        scene.minasPuerta = null;
        p.b.destroy();
        scene.tweens.add({ targets: [p.dibujo, ...p.sellos], y: '-=400', alpha: 0, duration: 1400, ease: 'Quad.in', onComplete: () => { p.dibujo.destroy(); p.sellos.forEach(s => s.destroy()); } });
    }
    scene.cameras.main.shake(500, 0.006);
    api.mensaje(scene, '🚪 ¡LOS 3 SELLOS ESTÁN ROTOS!\nLa guarida del Rey Troll se abrió', 2200);
}
function pintarSellos(scene) {
    const p = scene.minasPuerta;
    if (!p) return;
    [estado.mineros.size >= 3, estado.cristales.size >= 3, estado.muro].forEach((hecho, i) => p.sellos[i].setFillStyle(hecho ? 0xffc94a : 0x2a2a38));
}

// ---------- cada fotograma ----------
export function actualizarMinas(scene, time) {
    const g = scene.mascotaGesi;
    if (!g?.body || !scene.minasJaulas || !estado) return;
    const b = g.body, vivo = !g.isDead && !scene.nivelTerminado;
    revisarProyectiles(scene);
    // el gas: sin ataques ni poderes
    const enGas = b.center.x > GAS[0] && b.center.x < GAS[1] && b.bottom > Y1 + GROSOR;
    if (enGas) scene.silenciadoHasta = scene.time.now + 250;
    if (enGas && !scene.minasAvisoGas) { scene.minasAvisoGas = true; api.mensaje(scene, '☁️ ¡GAS! NO PUEDES ATACAR', 1000); }
    // la dinamita que toca un enemigo
    scene.minasTnt.forEach(t => {
        if (estado.rotos.has(t.id)) return;
        if (scene.enemies.getChildren().some(e => !e.isDead && e.body && Math.abs(e.body.center.x - t.x) < 26 && Math.abs(e.body.bottom - (t.y + 22)) < 20)) explotar(scene, t);
    });
    if (!vivo) return;
    // el "atajo" de la galería lleva a un gólem
    if (!scene.minasGolem.has('atajo') && b.bottom > S - 4 && b.center.x > 2480 && b.center.x < 2560) {
        scene.minasGolem.add('atajo');
        golem(scene, 2800, S - 2);
        api.mensaje(scene, '¿ATAJO? :)', 900);
    }
    // secretos: el escondite y la repisa
    if (!estado.secretos.has('escondite') && b.center.x > POCKET.x0 && b.center.x < POCKET.x1 && b.bottom > Y1 + GROSOR) {
        estado.secretos.add('escondite');
        api.mensaje(scene, '🔍 ¡UN ESCONDITE!', 1100);
        pintarLista(scene);
    }
    if (!estado.secretos.has('repisa') && Math.abs(b.bottom - REPISA.arriba) < 6 && b.center.x > REPISA.x && b.center.x < REPISA.x + REPISA.ancho) {
        estado.secretos.add('repisa');
        api.mensaje(scene, '🔍 ¡LA REPISA ESCONDIDA!', 1100);
        pintarLista(scene);
    }
    if (scene.minasCofre && Math.abs(b.center.x - scene.minasCofre.x) < 30 && Math.abs(b.bottom - REPISA.arriba) < 8) {
        estado.secretos.add('orbe');
        scene.minasCofre.setTexture(C + 'chest_opened');
        scene.minasCofre = null;
        api.orbe(scene);
        pintarLista(scene);
    }
    pintarFlecha(scene);
}

// ---------- la lista de misiones y la flecha ----------
let lista = null, flecha = null;
function crearLista(scene) {
    quitarLista();
    lista = document.createElement('div');
    lista.className = 'noche-lista minas-lista';
    lista.setAttribute('aria-live', 'polite');
    flecha = document.createElement('div');
    flecha.className = 'noche-flechas';
    flecha.setAttribute('aria-hidden', 'true');
    document.getElementById('game').append(lista, flecha);
    pintarLista(scene);
}
function quitarLista() {
    lista?.remove(); flecha?.remove();
    lista = flecha = null;
}
function pintarLista() {
    if (!lista || !estado) return;
    const fila = (hecho, t) => `<p class="${hecho ? 'hecho' : ''}">${hecho ? '✔' : '•'} ${t}</p>`;
    lista.innerHTML = estado.abierta
        ? `<b>✅ La guarida está abierta</b><p class="paso">👉 Ve a la derecha y derrota al Rey Troll</p><p>🔍 Secretos ${estado.secretos.size}/4</p>`
        : `<b>🎯 Misiones (abren la guarida)</b>
            ${fila(estado.mineros.size >= 3, `🗝️ Rescata a los mineros ${estado.mineros.size}/3`)}
            ${fila(estado.cristales.size >= 3, `💎 Enciende los cristales ${estado.cristales.size}/3 <small>dispárales de lejos</small>`)}
            ${fila(estado.muro, '⛏️ Abre el túnel derrumbado <small>solo con un poder (V/B)</small>')}
            <p>🔍 Secretos ${estado.secretos.size}/4</p>`;
}
// una flecha en el borde hacia lo pendiente más cercano (si no se ve)
function pintarFlecha(scene) {
    if (!flecha) return;
    const g = scene.mascotaGesi.body;
    const pend = [
        ...scene.minasJaulas.filter(j => j.tipo === 'minero' && !estado.rotos.has(j.id)).map(j => ({ x: j.x, y: j.y, i: '🗝️' })),
        ...scene.minasCristales.filter(c => !c.falso && !c.lit).map(c => ({ x: c.x, y: c.y, i: '💎' })),
        ...(scene.minasMuro ? [{ x: MURO.x + 30, y: (MURO.arriba + MURO.abajo) / 2, i: '⛏️' }] : []),
        ...(estado.abierta ? [{ x: PUERTA.x + 300, y: S - 40, i: '👹' }] : []),
    ];
    const o = pend.sort((a, b) => Math.hypot(a.x - g.center.x, a.y - g.center.y) - Math.hypot(b.x - g.center.x, b.y - g.center.y))[0];
    const cam = scene.cameras.main, v = cam.worldView, canvas = scene.game.canvas;
    if (!o || !canvas || (o.x > v.x + 30 && o.x < v.right - 30 && o.y > v.y + 30 && o.y < v.bottom - 30)) { flecha.innerHTML = ''; return; }
    const cr = canvas.getBoundingClientRect(), gr = flecha.parentElement.getBoundingClientRect();
    const px = x => cr.left - gr.left + (x - v.x) / v.width * cr.width, py = y => cr.top - gr.top + (y - v.y) / v.height * cr.height;
    const cx = px(g.center.x), cy = py(g.center.y), tx = px(o.x), ty = py(o.y);
    const caja = { x0: cr.left - gr.left + 40, x1: cr.right - gr.left - 40, y0: cr.top - gr.top + 76, y1: cr.bottom - gr.top - 58 };
    const dx = tx - cx || 1e-6, dy = ty - cy || 1e-6;
    const k = Math.min((dx > 0 ? caja.x1 - cx : caja.x0 - cx) / dx, (dy > 0 ? caja.y1 - cy : caja.y0 - cy) / dy);
    const fx = cx + dx * Math.max(0, k), fy = cy + dy * Math.max(0, k);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    flecha.innerHTML = `<div class="noche-flecha encargo principal" style="left:${fx.toFixed(0)}px;top:${fy.toFixed(0)}px"><i style="transform:rotate(${ang.toFixed(0)}deg)"></i><span>${o.i}</span></div>`;
}

// ---------- al terminar el nivel: el resumen ----------
export function resultadosMinas(scene, muertes) {
    if (!estado) return;
    const capa = document.createElement('div');
    capa.className = 'minas-resultados';
    capa.innerHTML = `<b>⛏️ LAS MINAS · RESULTADOS</b>
        <p>🎯 Misiones <em>3/3</em></p><p>🔍 Secretos <em>${estado.secretos.size}/4</em></p><p>💀 Muertes <em>${muertes}</em></p>
        ${estado.secretos.size < 4 ? '<small>Quedan secretos por descubrir…</small>' : '<small>¡Lo encontraste todo!</small>'}`;
    document.getElementById('game').append(capa);
    setTimeout(() => capa.remove(), 4500);
    quitarLista();
}
