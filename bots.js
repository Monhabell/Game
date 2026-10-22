// Bots de La Noche del Troll (troll.js): rellenan la partida hasta 4 jugadores. Siempre son HÉROES.
//
// Los mueve solo el ANFITRIÓN y manda dónde está cada uno ~8 veces por segundo ('nocheBots'); las demás
// pantallas los dibujan con movimiento suavizado. Si el anfitrión se va, el siguiente sigue desde la
// última posición que recibió (y con los encargos que ya habían cumplido).
//
// No usan la física del juego: caminan por un MAPA DE CAMINOS del Bosque de Albora (puntos unidos por
// tramos para caminar, saltar, caer o subir en el ascensor) y buscan la ruta más corta.
//
// Qué hace cada bot, en orden:
//   1. con las 4 antorchas encendidas, va al altar (y trae el amanecer)
//   2. sus 3 encargos (los mismos que tendría una persona)
//   3. ayuda a encender la antorcha apagada más cercana (se queda junto a ella un rato)
//   4. si no, pasea
// Mueren con las trampas del troll y con sus empujones (si están en alto o junto al río); encuentran
// cuerpos (y llaman al Juicio) y en el Juicio dicen una frase y votan al más acusado (o saltan).
//
// ctx (lo da troll.js): { noche(), escena(), soyAnfitrion(), juicioActivo(), cumplir(bot, encargo),
//   muere(bot, x, pie), pisaTrampa(bot, trampa), hallaCuerpo(bot, cuerpo), altar(bot), antorchaLista(i) }

import { red, alRecibir, enviarEvento } from "./red.js"
import { PERSONAJES, resDe } from "./personajes.js"
import { SUELO_Y } from "./niveles.js"
import { ANTORCHAS_NOCHE, ALTAR_NOCHE, ENCARGOS, COPA_Y, PUENTE_Y } from "./bosque_troll.js"

const S = SUELO_Y;
const VEL = 115;          // px/s caminando
const SUBE = 55;          // px/s en el ascensor (como el de verdad)
const ENVIO_MS = 125;
const SUAVIDAD = 12;
const ESPERA_ANTORCHA = 12000; // lo que se queda ayudando con una antorcha
const ALTO_PIE = 62;      // del pie al centro del dibujo (como el jugador: pie 332 -> y 270)
const LETRA = '"Press Start 2P", monospace';

// ---------- mapa de caminos ----------
const NODOS = {
    cueva0: [120, S], hongo1: [260, S], antC: [430, S], hongo2: [560, S], hongo3: [790, S], zig0: [1000, S],
    campJ: [1560, S], claro: [ALTAR_NOCHE.x, S], flor: [1990, S], rioI: [2180, S],
    rioD: [2580, S], tronco: [2650, S], cofre: [2780, S], ascB: [3200, S], agua: [3260, S], antD: [3400, S], fondo: [3540, S],
    z1: [1050, S - 96], z2: [1265, S - 192], z3: [1050, S - 288], z4: [1265, S - 384], z5: [1050, S - 480], z6: [1265, COPA_Y],
    copa3: [1020, COPA_Y], luc2: [860, COPA_Y], antA: [700, COPA_Y], luc1: [600, COPA_Y],
    p1: [1475, PUENTE_Y], p2: [1655, PUENTE_Y], mirador: [1830, PUENTE_Y - 20], p4: [2025, PUENTE_Y], p5: [2205, PUENTE_Y],
    p6: [2385, PUENTE_Y], p7: [2555, PUENTE_Y - 50],
    nido0: [2730, COPA_Y], campana: [2790, COPA_Y], antB: [2960, COPA_Y], nido3: [3080, COPA_Y],
};
// [desde, hasta, tipo]; 'caer' va en un solo sentido, lo demás en los dos
const cadena = (ids, tipo) => ids.slice(1).map((id, i) => [ids[i], id, tipo]);
const TRAMOS = [
    ...cadena(['cueva0', 'hongo1', 'antC', 'hongo2', 'hongo3', 'zig0', 'campJ', 'claro', 'flor', 'rioI'], 'camina'),
    ...cadena(['rioD', 'tronco', 'cofre', 'ascB', 'agua', 'antD', 'fondo'], 'camina'),
    ['rioI', 'rioD', 'salta'], // (sobre el tronco del río)
    ...cadena(['zig0', 'z1', 'z2', 'z3', 'z4', 'z5', 'z6'], 'salta'),
    ['z6', 'copa3', 'salta'],
    ...cadena(['copa3', 'luc2', 'antA', 'luc1'], 'camina'),
    ['z6', 'p1', 'salta'],
    ...cadena(['p1', 'p2', 'mirador', 'p4', 'p5', 'p6', 'p7'], 'salta'),
    ['p7', 'nido0', 'salta'],
    ...cadena(['nido0', 'campana', 'antB', 'nido3'], 'camina'),
    ['nido3', 'ascB', 'ascensor'],
    ['mirador', 'claro', 'caer'], ['nido0', 'tronco', 'caer'], // (del mirador al claro; el tronco hueco)
];
const VECINOS = {};
TRAMOS.forEach(([a, b, tipo]) => {
    (VECINOS[a] ||= []).push([b, tipo]);
    if (tipo !== 'caer') (VECINOS[b] ||= []).push([a, tipo]);
});
const dist = (a, b) => Math.hypot(NODOS[a][0] - NODOS[b][0], NODOS[a][1] - NODOS[b][1]);

// ruta más corta (Dijkstra; el mapa es chico): lista de [nodo, tipo del tramo para llegar]
function ruta(desde, hasta) {
    const costo = { [desde]: 0 }, previo = {}, abiertos = new Set([desde]);
    while (abiertos.size) {
        const n = [...abiertos].reduce((a, b) => (costo[a] <= costo[b] ? a : b));
        abiertos.delete(n);
        if (n === hasta) break;
        (VECINOS[n] || []).forEach(([v, tipo]) => {
            const c = costo[n] + dist(n, v) * (tipo === 'ascensor' ? 2 : 1);
            if (c < (costo[v] ?? Infinity)) { costo[v] = c; previo[v] = [n, tipo]; abiertos.add(v); }
        });
    }
    if (desde !== hasta && !previo[hasta]) return [];
    const pasos = [];
    for (let n = hasta; n !== desde; n = previo[n][0]) pasos.unshift([n, previo[n][1]]);
    return pasos;
}
// el nodo más cercano (a la misma altura, si hay)
function nodoCerca(x, pie) {
    let mejor = 'claro', d = Infinity;
    Object.entries(NODOS).forEach(([id, [nx, np]]) => {
        const dd = Math.abs(nx - x) + Math.abs(np - pie) * 3;
        if (dd < d) { d = dd; mejor = id; }
    });
    return mejor;
}

// para las flechas (troll.js): hacia dónde ir AHORA para llegar de (x, pie) a (tx, tp) por el camino
// (el zigzag, el ascensor…) y no en línea recta. null: ya está cerca o se va derecho
export function guia(x, pie, tx, tp) {
    const desde = nodoCerca(x, pie), hasta = nodoCerca(tx, tp);
    if (desde === hasta) return null;
    const pasos = ruta(desde, hasta);
    if (!pasos.length) return null;
    // el ascensor en los próximos pasos: la flecha lleva a su base (o a su parada de arriba) y lo dice
    if (pasos.slice(0, 3).some(([, t]) => t === 'ascensor')) return { x: NODOS.ascB[0], pie: pie < S - 100 ? COPA_Y : S, tipo: 'ascensor' };
    let [n, tipo] = pasos[0];
    // (si ya está junto al primero, el que sigue)
    if (Math.hypot(NODOS[n][0] - x, NODOS[n][1] - pie) < 60 && pasos[1]) [n, tipo] = pasos[1];
    return { x: NODOS[n][0], pie: NODOS[n][1], tipo };
}

// adónde va cada encargo (recoger: un nodo por cosa; llevar: ida y vuelta)
const PASOS_ENCARGO = {
    luciernagas: ['luc1', 'luc2', 'copa3'], hongos: ['hongo1', 'hongo2', 'hongo3'],
    campana: ['campana'], mirador: ['mirador'], cofre: ['cofre'], agua: ['agua', 'flor'],
};
const ANTORCHA_NODO = { A: 'antA', B: 'antB', C: 'antC', D: 'antD' };

// ---------- estado ----------
let ctx = null;
let bots = new Map();    // id -> bot (en todas las pantallas: dibujo y estado)
let simulando = false;   // (esta pantalla los mueve)
let ultimoEnvio = 0;

export function iniciarBots(contexto) {
    ctx = contexto;
    alRecibir('evento', m => {
        if (m.tipo !== 'nocheBots' || m.de !== red.anfitrion || simulando) return;
        (m.l || []).forEach(([id, x, pie, dir, anim, vivo, hechos]) => {
            const b = bots.get(id);
            if (!b) return;
            Object.assign(b, { meta: { x, pie }, dir, anim, vivo: !!vivo, hechos: new Set(hechos || []), recibido: performance.now() });
        });
    });
}

// empieza la noche: los bots de la sala, junto al altar, con sus 3 encargos
export function empezarBots(lista, semilla) {
    terminarBots();
    lista.forEach((j, i) => {
        const x = ALTAR_NOCHE.x + 90 + i * 50;
        bots.set(j.id, {
            id: j.id, nombre: j.nombre, pj: PERSONAJES.find(p => p.id === j.pj) || PERSONAJES[0],
            x, pie: S, meta: { x, pie: S }, dir: 1, anim: 0, vivo: true,
            encargos: repartir(semilla, j.id), hechos: new Set(),
            pasos: [], tramo: null, quieto: 0, objetivo: null, aturdido: 0, pensar: 0,
        });
    });
}
export function terminarBots() {
    bots.forEach(b => b.dibujo?.destroy());
    bots = new Map();
    simulando = false;
}
export const botsVivos = () => [...bots.values()].filter(b => b.vivo);
export const botPorId = id => bots.get(id);

function repartir(semilla, id) {
    let a = ((semilla >>> 0) ^ Math.imul(id + 97, 2654435761)) >>> 0;
    const azar = () => { a = (Math.imul(a ^ (a >>> 15), 2246822519) + 0x9e3779b9) >>> 0; return a / 4294967296; };
    const bolsa = ENCARGOS.map(e => e.id);
    for (let i = bolsa.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [bolsa[i], bolsa[j]] = [bolsa[j], bolsa[i]]; }
    return bolsa.slice(0, 3);
}

// ---------- dibujo (todas las pantallas) ----------
export function crearDibujosBots(scene) {
    bots.forEach(b => {
        const res = resDe(b.pj);
        const s = scene.add.sprite(b.x, b.pie - ALTO_PIE, `${b.pj.id}-idle`).setScale(1 / res).setDepth(33.5);
        s.setCrop(0, 57 * res, s.width, s.height - 50 * res);
        const color = '#' + b.pj.color.toString(16).padStart(6, '0');
        const etiqueta = scene.add.text(0, 0, `🤖 ${b.nombre}`, {
            fontFamily: LETRA, fontSize: '7px', color, stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5, 1).setDepth(35);
        b.dibujo = scene.add.container(0, 0, [s, etiqueta]).setDepth(33.5);
        b.sprite = s;
        b.etiqueta = etiqueta;
    });
}

function pintar(scene, b, delta) {
    if (!b.sprite?.active) return;
    if (!simulando) {
        // suavizado hacia lo último que mandó el anfitrión
        const k = Math.min(1, delta / 1000 * SUAVIDAD);
        if (Math.abs(b.meta.x - b.x) > 300) { b.x = b.meta.x; b.pie = b.meta.pie; }
        b.x += (b.meta.x - b.x) * k;
        b.pie += (b.meta.pie - b.pie) * k;
    }
    b.dibujo.setVisible(b.vivo);
    if (!b.vivo) return;
    b.sprite.setPosition(b.x, b.pie - ALTO_PIE).setFlipX(b.dir < 0);
    b.etiqueta.setPosition(b.x, b.pie - ALTO_PIE - 8);
    const anim = `${b.pj.id}-${['idle', 'run', 'jump'][b.anim] || 'idle'}`;
    const clave = scene.anims.exists(anim) ? anim : `${b.pj.id}-idle`;
    if (b.sprite.anims.currentAnim?.key !== clave && scene.anims.exists(clave)) b.sprite.play(clave, true);
}

// ---------- cada fotograma ----------
export function actualizarBots(scene, time, delta) {
    if (!bots.size) return;
    const anfitrion = ctx.soyAnfitrion();
    if (anfitrion && !simulando) {
        // (soy el nuevo anfitrión: sigo desde donde iban)
        simulando = true;
        bots.forEach(b => { b.x = b.meta.x; b.pie = b.meta.pie; b.pasos = []; b.tramo = null; b.objetivo = null; });
    } else if (!anfitrion) simulando = false;
    if (simulando && !ctx.juicioActivo() && !ctx.noche()?.ganador) {
        const dt = Math.min(100, delta) / 1000;
        bots.forEach(b => { if (b.vivo) pensar(scene, b, time, dt); });
        if (time - ultimoEnvio > ENVIO_MS) {
            ultimoEnvio = time;
            enviarEvento('nocheBots', { l: [...bots.values()].map(b => [b.id, Math.round(b.x), Math.round(b.pie), b.dir, b.anim, b.vivo ? 1 : 0, [...b.hechos]]) });
        }
    }
    bots.forEach(b => pintar(scene, b, delta));
}

function pensar(scene, b, time, dt) {
    if (time < b.aturdido) { b.anim = 0; return; }
    if (b.tramo) { mover(b, dt); revisarAlrededor(b); return; }
    if (b.pasos.length) { siguienteTramo(b); return; }
    // llegó: hacer lo que vino a hacer
    const o = b.objetivo;
    if (o) {
        b.anim = 0;
        b.quieto += dt * 1000;
        if (o.tipo === 'paso') { b.objetivo = null; terminarEncargo(b, o.encargo); return; } // (el siguiente punto, o cumplido)
        if (o.tipo === 'quieto' && b.quieto >= o.ms) { b.objetivo = null; terminarEncargo(b, o.encargo); return; }
        if (o.tipo === 'antorcha' && (ctx.antorchaLista(o.i) || b.quieto > ESPERA_ANTORCHA)) { b.objetivo = null; return; }
        if (o.tipo === 'altar') { b.objetivo = null; ctx.altar(b); return; }
        if (o.tipo === 'pasear' && b.quieto > o.ms) { b.objetivo = null; return; }
        revisarAlrededor(b);
        return;
    }
    elegirObjetivo(b);
}

function irA(b, nodo, objetivo) {
    b.pasos = ruta(nodoCerca(b.x, b.pie), nodo);
    b.objetivo = objetivo;
    b.quieto = 0;
    if (!b.pasos.length) {
        // (ya está ahí o no hay camino: se acomoda en el lugar)
        b.x = NODOS[nodo][0];
        b.pie = NODOS[nodo][1];
    }
}

function elegirObjetivo(b) {
    const n = ctx.noche();
    if (!n) return;
    // 1. el altar despertó
    if (n.fuego.every(f => f.lit)) { irA(b, 'claro', { tipo: 'altar' }); return; }
    // 2. sus encargos
    const pendiente = b.encargos.find(id => !b.hechos.has(id));
    if (pendiente) {
        const pasos = PASOS_ENCARGO[pendiente];
        const enc = ENCARGOS.find(e => e.id === pendiente);
        // (los de recoger o llevar: un nodo tras otro; al llegar al último se cumple)
        b.cola = pasos.slice(1);
        irA(b, pasos[0], enc.tipo === 'quieto' ? { tipo: 'quieto', ms: enc.ms + 300, encargo: pendiente }
            : { tipo: 'paso', encargo: pendiente });
        return;
    }
    // 3. una antorcha apagada (la más cercana a la que no vaya otro bot; a la de la cascada, de a dos)
    const ocupadas = new Set([...bots.values()].filter(o => o !== b && o.vivo && o.objetivo?.tipo === 'antorcha').map(o => o.objetivo.i));
    const todas = ANTORCHAS_NOCHE.map((a, i) => ({ a, i })).filter(({ i }) => !n.fuego[i].lit);
    const libres = todas.filter(({ a, i }) => a.dos || !ocupadas.has(i));
    const apagadas = libres.length ? libres : todas;
    if (apagadas.length) {
        const { a, i } = apagadas.reduce((m, o) => (Math.abs(o.a.x - b.x) < Math.abs(m.a.x - b.x) ? o : m));
        irA(b, ANTORCHA_NODO[a.id], { tipo: 'antorcha', i });
        return;
    }
    // 4. pasear
    const nodos = Object.keys(NODOS);
    irA(b, nodos[Math.floor(Math.random() * nodos.length)], { tipo: 'pasear', ms: 1500 + Math.random() * 2500 });
}

function terminarEncargo(b, id) {
    // recoger / llevar: faltan nodos
    if (b.cola?.length) {
        const sig = b.cola.shift();
        irA(b, sig, { tipo: 'paso', encargo: id });
        return;
    }
    if (b.hechos.has(id)) return;
    b.hechos.add(id);
    ctx.cumplir(b, ENCARGOS.find(e => e.id === id));
}

function siguienteTramo(b) {
    const [nodo, tipo, xx, pp] = b.pasos.shift();
    const [x, pie] = xx != null ? [xx, pp] : NODOS[nodo];
    if (tipo === 'ascensor') {
        // en dos partes: el ascensor sube o baja en vertical, y en el nido se camina
        const ax = NODOS.ascB[0];
        if (pie < b.pie) { b.pasos.unshift(['', 'sube', ax, pie], [nodo, 'camina']); }
        else { b.pasos.unshift(['', 'camina', ax, b.pie], [nodo, 'sube']); }
        siguienteTramo(b);
        return;
    }
    const d = Math.hypot(x - b.x, pie - b.pie);
    const dur = tipo === 'camina' ? d / VEL : tipo === 'sube' ? Math.abs(pie - b.pie) / SUBE : Math.max(0.45, d / 320);
    b.tramo = { tipo, x0: b.x, p0: b.pie, x1: x, p1: pie, t: 0, dur: Math.max(0.05, dur) };
    b.dir = x < b.x ? -1 : x > b.x ? 1 : b.dir;
}

function mover(b, dt) {
    const t = b.tramo;
    t.t = Math.min(1, t.t + dt / t.dur);
    const k = t.t;
    if (t.tipo === 'camina' || t.tipo === 'sube') {
        b.x = t.x0 + (t.x1 - t.x0) * k;
        b.pie = t.p0 + (t.p1 - t.p0) * k;
        b.anim = t.tipo === 'camina' ? 1 : 0;
    } else {
        // salto o caída: una parábola
        const alto = t.tipo === 'caer' ? 18 : 40 + Math.max(0, t.p0 - t.p1);
        b.x = t.x0 + (t.x1 - t.x0) * k;
        b.pie = t.p0 + (t.p1 - t.p0) * k - 4 * alto * k * (1 - k);
        b.anim = 2;
    }
    if (k >= 1) { b.x = t.x1; b.pie = t.p1; b.tramo = null; b.anim = 0; }
}

// trampas y cuerpos (solo cuando está apoyado)
function revisarAlrededor(b) {
    const n = ctx.noche();
    if (!n || !b.vivo || (b.tramo && b.tramo.tipo !== 'camina')) return;
    const t = n.trampas.find(t => Math.abs(b.x - t.x) < 22 && Math.abs(b.pie - t.pie) < 12);
    if (t) { ctx.pisaTrampa(b, t); return; }
    const c = n.cuerpos.find(c => !c.hallado && Math.abs(b.x - c.x) < 70 && Math.abs(b.pie - ALTO_PIE - c.y) < 70);
    if (c) ctx.hallaCuerpo(b, c);
}

// ---------- lo que les pasa ----------
// el troll empujó a un bot: en alto o junto al río se cae (y muere); si no, queda aturdido
export function empujarBot(id, dir, time) {
    const b = bots.get(id);
    if (!b?.vivo || !simulando) return;
    const enAlto = b.pie < S - 20, rio = b.x > 2080 && b.x < 2680;
    if (enAlto || rio) { ctx.muere(b, b.x + dir * 40, S); return; }
    b.x = Math.max(20, Math.min(3580, b.x + dir * 70));
    b.tramo = null;
    b.pasos = [];
    b.objetivo = null;
    b.aturdido = time + 1500;
}
export function matarBot(id) {
    const b = bots.get(id);
    if (!b) return;
    b.vivo = false;
    b.tramo = null;
    b.pasos = [];
}
// después del Juicio: de vuelta al claro, cada uno en su lugar
export function botsAlClaro() {
    let i = 0;
    bots.forEach(b => {
        if (!b.vivo) return;
        b.x = b.meta.x = ALTAR_NOCHE.x + 120 + i++ * 60;
        b.pie = b.meta.pie = S;
        b.tramo = null; b.pasos = []; b.objetivo = null;
    });
}
