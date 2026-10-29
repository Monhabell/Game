// Misiones de los NIVELES INFINITOS (niveles.js: nivelPorIndice). La meta no se abre hasta cumplirlas.
//
// Cada nivel trae sus misiones (siempre las mismas para ese nivel: salen de su número) y en niveles más
// altos hay MÁS misiones y cada una es MÁS LARGA (más jaulas, más cristales, viajes más largos, menos tiempo):
//   niveles 8-10: 1 · 11-50: 2 · 51-200: 3 · 201-1000: 3 o 4 · más de 1000: 4 o 5
// Tipos:
//   🗝️ rescatar   romper las jaulas de los prisioneros (cualquier ataque, de cerca o de lejos)
//   💎 encender   cristales sobre la lava o lejos: hay que dispararles
//   ⛏️ romper     muros agrietados que cortan el camino: solo los rompe un PODER (V/B)
//   🏺 llevar     tomar la reliquia y llevarla hasta el altar (si mueres, vuelve a su lugar)
//   ⏱️ contrarreloj  pasar por la bandera de salida y llegar a la de llegada antes de que se acabe el tiempo
// ACERTIJOS (desde el nivel 21; también abren la meta):
//   🕹️ palancas  una fila de palancas con símbolos: hay que golpearlas en el orden que dice la PISTA 📜
//                (escrita en otro lugar del nivel). Si te equivocas, vuelven a subir (y en niveles altos
//                sale un enemigo)
//   🔮 runas     runas repartidas por el nivel; la PISTA 📜 dice cuáles: golpea esas y ninguna más (una
//                equivocada apaga las que llevabas)
//   En niveles altos la pista es TRAMPOSA: si tiene 🙃, el orden es al revés.
//   Cuanto más alto el nivel, más palancas, más runas y más lejos la pista.
// Lo cumplido se guarda al morir; se borra al cambiar de nivel o con un GAME OVER (reiniciarMisiones).
// La lista se ve a la izquierda y una flecha lleva a lo pendiente más cercano.
//
// Los NIVELES HECHOS A MANO (4 a 7) traen su plan en nivel.misiones: { tipos, acertijos, cant, textos, iconos }
// (qué misiones y acertijos, en ese orden, cuántas cosas cada una y sus textos de la historia).
//
// api (la da game.js): { mensaje(scene, texto, ms), crearEnemigo(scene, x, y, tipo) }

import { SUELO_Y } from "./alcance.js"
import { texturasMinas } from "./minas.js"

const S = SUELO_Y;
const PRIMERA = 900;        // nada de misiones al empezar el nivel
const ANTES_META = 1300;    // ni en la arena del jefe / el final
const MURO = { alto: 520, ancho: 50 };
const SIMBOLOS = ['▲', '●', '◆', '★', '✚', '☾', '♥', '✖'];
const LETRA = '"Press Start 2P", monospace';

let api = null;
export const configurarMisiones = a => { api = a; };

// estado (sigue al morir)
let estado = null;
export const reiniciarMisiones = () => { estado = null; };

// azar con semilla (el mismo reparto para el mismo nivel)
function azar(semilla) {
    let a = semilla >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ---------- el reparto: qué misiones trae el nivel y dónde ----------
// i: índice del nivel; k: cuántos niveles infinitos van (0 = el primero)
export function planearMisiones(nivel, i, k) {
    const r = azar(i * 2654435761 + 99);
    const lvl = i + 1;
    const propio = nivel.misiones; // (los niveles hechos a mano: su plan)
    const cuantas = propio ? propio.tipos.length
        : lvl <= 10 ? 1 : lvl <= 50 ? 2 : lvl <= 200 ? 3 : lvl <= 1000 ? 3 + (r() < 0.5 ? 1 : 0) : 4 + (r() < 0.5 ? 1 : 0);
    const tipos = propio ? [...propio.tipos] : ['rescatar', 'encender', 'romper', 'llevar', 'contrarreloj'];
    if (!propio) for (let j = tipos.length - 1; j > 0; j--) { const m = Math.floor(r() * (j + 1)); [tipos[j], tipos[m]] = [tipos[m], tipos[j]]; }
    // dónde se puede poner algo: suelo firme, lejos de los huecos, de las escaleras y de lo que haya arriba
    const libres = lugaresLibres(nivel);
    // desde/hasta: el lugar tiene que quedar entre esas x (si no hay, cualquiera)
    const tomar = (desde = 0, hasta = Infinity) => {
        if (!libres.length) return null;
        const pool = libres.filter(x => x >= desde && x <= hasta);
        if (!pool.length) return null; // (nada a esa distancia: esa misión no va en este nivel)
        const x = pool[Math.floor(r() * pool.length)];
        libres.splice(libres.indexOf(x), 1);
        // (lo que queda cerca ya no sirve: que no se amontonen)
        for (let j = libres.length - 1; j >= 0; j--) if (Math.abs(libres[j] - x) < 260) libres.splice(j, 1);
        return x;
    };
    const cant = propio?.cant ?? Math.min(6, 2 + Math.floor(k / 40)); // más jaulas y cristales en cada nivel
    const plan = [];
    // (los acertijos van primero: necesitan una fila de lugares libres)
    // ---------- acertijos ----------
    const acertijos = propio ? (propio.acertijos || []).length : lvl <= 20 ? 0 : lvl <= 100 ? 1 : lvl <= 500 ? 1 + (r() < 0.5 ? 1 : 0) : 2;
    const tramposa = lvl > 200 && r() < Math.min(0.6, (lvl - 200) / 1000); // (la pista miente: 🙃 al revés)
    const elegir = (n, total) => {
        const bolsa = SIMBOLOS.slice(0, total);
        for (let j = bolsa.length - 1; j > 0; j--) { const m = Math.floor(r() * (j + 1)); [bolsa[j], bolsa[m]] = [bolsa[m], bolsa[j]]; }
        return bolsa.slice(0, n);
    };
    const tiposAcertijo = propio ? propio.acertijos || [] : r() < 0.5 ? ['palancas', 'runas'] : ['runas', 'palancas'];
    const acertijosPlan = [];
    for (let a = 0; a < acertijos; a++) {
        const tipo = tiposAcertijo[a % tiposAcertijo.length];
        if (tipo === 'palancas') {
            const n = Math.min(6, 3 + Math.floor(k / 100));
            const SEP = 70;
            // una fila de n palancas en suelo libre (todos sus lugares tienen que estar libres)
            const x0 = tomarFila(libres, n, SEP, r);
            if (x0 == null) continue;
            const simbolos = elegir(n, Math.min(SIMBOLOS.length, n + 2));
            const ordenReal = [...simbolos].sort(() => r() - 0.5);
            const pista = tomar(x0 + 800 + k * 2, x0 + 2600 + k * 4) ?? tomar(0, x0 - 600);
            if (pista == null) continue;
            acertijosPlan.push({ tipo, icono: '🕹️', texto: 'Acertijo de las palancas', ayuda: 'golpéalas en el orden de la pista 📜', acertijo: true,
                palancas: simbolos.map((sim, j) => ({ sim, x: x0 + j * SEP })), orden: ordenReal, pista, tramposa });
        } else {
            const total = Math.min(8, 4 + Math.floor(k / 80));
            const pedidas = Math.min(5, 2 + Math.floor(k / 120));
            const simbolos = elegir(total, total);
            const xs = simbolos.map(() => tomar()).filter(x => x != null);
            if (xs.length < pedidas + 1) continue;
            const pista = tomar();
            if (pista == null) continue;
            const runas = xs.map((x, j) => ({ sim: simbolos[j], x }));
            const correctas = elegir(pedidas, xs.length).filter(sim => runas.some(q => q.sim === sim));
            acertijosPlan.push({ tipo, icono: '🔮', texto: 'Acertijo de las runas', ayuda: 'golpea solo las de la pista 📜', acertijo: true,
                runas, correctas, pista });
        }
    }
    // de a uno: si una misión no cabe en el mapa se prueba con el tipo siguiente (y rescatar/encender
    // pueden repetirse) hasta tener las que le tocan al nivel
    const cola = propio ? [...tipos] : [...tipos, 'rescatar', 'encender', 'rescatar'];
    while (plan.length < cuantas && cola.length) [cola.shift()].forEach(tipo => {
        if (tipo === 'rescatar') {
            const xs = Array.from({ length: cant }, () => tomar()).filter(x => x != null);
            if (xs.length) plan.push({ tipo, icono: '🗝️', texto: 'Rescata a los prisioneros', cosas: xs.map((x, j) => ({ id: `j${j}`, x, y: S - 30 })) });
        } else if (tipo === 'encender') {
            // sobre la lava (se dispara desde la orilla) y, si faltan, a la altura de un salto
            const huecos = (nivel.lava || []).filter(([a, b]) => a > PRIMERA && b < nivel.meta - ANTES_META);
            const cosas = [];
            for (let j = 0; j < cant; j++) {
                const h = huecos.splice(Math.floor(r() * huecos.length), 1)[0];
                const x = h ? Math.round((h[0] + h[1]) / 2) : tomar();
                if (x != null) cosas.push({ id: `c${j}`, x, y: h ? 285 : 250 });
            }
            if (cosas.length) plan.push({ tipo, icono: '💎', texto: 'Enciende los cristales', ayuda: 'dispárales de lejos', cosas });
        } else if (tipo === 'romper') {
            const n = Math.min(3, 1 + Math.floor(k / 150));
            const xs = Array.from({ length: n }, () => tomar()).filter(x => x != null);
            if (xs.length) plan.push({ tipo, icono: '⛏️', texto: xs.length > 1 ? 'Rompe los muros agrietados' : 'Rompe el muro agrietado', ayuda: 'solo con un poder (V/B)', cosas: xs.map((x, j) => ({ id: `m${j}`, x })) });
        } else if (tipo === 'llevar') {
            // el viaje es más largo en cada nivel (de ~1500 a 5000 px)
            const largo = Math.min(5000, 1500 + k * 15);
            // (los niveles hechos a mano: el altar puede estar un poco más cerca o más lejos)
            // (los niveles hechos a mano: si no cabe, se prueba con más margen: esa misión tiene que estar)
            const margenes = propio ? [[0.6, 2], [0.45, 3.5], [0.5, 12]] : [[0.8, 1.2]];
            let a = null, b = null;
            for (const [c0, c1] of margenes) {
                const libresAntes = [...libres];
                a = tomar(0, nivel.meta - ANTES_META - largo * c0);
                b = a != null ? tomar(a + largo * c0, a + largo * c1) : null;
                if (a != null && b != null) break;
                libres.splice(0, libres.length, ...libresAntes); // (se devuelve lo tomado)
            }
            if (a != null && b != null && b - a > 800) plan.push({ tipo, icono: '🏺', texto: 'Lleva la reliquia al altar', desde: a, hasta: b });
        } else {
            const largo = Math.min(3500, 1400 + k * 6);
            // (los niveles hechos a mano: con más margen si no cabe; el tiempo sale de la distancia igual)
            const margenes = propio ? [[0.8, 1.2], [0.6, 2], [0.6, 4]] : [[0.8, 1.2]];
            let a = null, b = null;
            for (const [c0, c1] of margenes) {
                const libresAntes = [...libres];
                a = tomar(0, nivel.meta - ANTES_META - largo * c0);
                b = a != null ? tomar(a + largo * c0, a + largo * c1) : null;
                if (a != null && b != null && b - a >= 900) break;
                libres.splice(0, libres.length, ...libresAntes);
                a = b = null;
            }
            if (a == null || b == null || b - a < 900 || (!propio && b - a > largo * 1.3)) return;
            // tiempo: lo que tarda alguien corriendo, con un margen que se achica en cada nivel
            const margen = Math.max(1.12, 1.6 - k / 400);
            plan.push({ tipo, icono: '⏱️', texto: 'Contrarreloj', desde: a, hasta: b, ms: Math.round((b - a) / 200 * 1000 * margen) });
        }
    });

    const todo = [...plan, ...acertijosPlan];
    // los textos (y los íconos) de la historia del nivel
    if (propio) todo.forEach(m => { m.texto = propio.textos?.[m.tipo] ?? m.texto; m.icono = propio.iconos?.[m.tipo] ?? m.icono; });
    return todo;
}

// una fila de n lugares libres separados por sep (los toma todos); null si no hay
function tomarFila(libres, n, sep, r) {
    const ok = x => Array.from({ length: n }, (_, j) => x + j * sep).every(px => libres.some(l => Math.abs(l - px) <= 30));
    const cand = libres.filter(ok);
    if (!cand.length) return null;
    const x0 = cand[Math.floor(r() * cand.length)];
    for (let j = libres.length - 1; j >= 0; j--) if (libres[j] > x0 - 260 && libres[j] < x0 + (n - 1) * sep + 260) libres.splice(j, 1);
    return x0;
}

function lugaresLibres(nivel) {
    const fin = nivel.meta - ANTES_META;
    const cerca = (x, rangos, m) => rangos.some(([a, b]) => x > a - m && x < b + m);
    const huecos = [...(nivel.lava || []), ...(nivel.falsos || [])];
    const arriba = [
        ...(nivel.plataformas || []).map(([x, , w]) => [x, x + w]),
        ...(nivel.bloques || []).map(([x, , p]) => [x, x + p.length * 32]),
        ...(nivel.escaleras || []).map(([x, h]) => [x, x + h * 32]),
        ...(nivel.muros || []).map(([x, , w]) => [x, x + w]),
        ...(nivel.techos || []).map(([a, b]) => [a, b]),
        ...(nivel.moviles || []).map(([x]) => [x - 140, x + 140]),
    ];
    const xs = [];
    (nivel.suelo || []).forEach(([a, b]) => {
        for (let x = a + 140; x < b - 140; x += 60) {
            if (x < PRIMERA || x > fin || cerca(x, huecos, 150) || cerca(x, arriba, 120)) continue;
            if ((nivel.checkpoints || []).some(c => Math.abs(c - x) < 180)) continue;
            xs.push(x);
        }
    });
    return xs;
}

// ---------- en el nivel ----------
export function crearMisiones(scene, nivel, i, k) {
    texturasMinas(scene);
    if (estado?.i !== i) estado = { i, plan: planearMisiones(nivel, i, k), hechas: new Set(), rotos: new Set() };
    scene.misionesNivel = estado.plan;
    scene.misCosas = [];
    estado.plan.forEach((m, j) => {
        m.n = j;
        if (m.tipo === 'rescatar') m.cosas.forEach(c => !estado.rotos.has(`${j}${c.id}`) && scene.misCosas.push({ m, c, clave: `${j}${c.id}`, r: 28,
            cara: scene.add.text(c.x, c.y + 4, '🧑', { fontSize: '20px' }).setOrigin(0.5).setDepth(3),
            img: scene.add.image(c.x, c.y + 30, 'min_jaula').setOrigin(0.5, 1).setDepth(3.2) }));
        else if (m.tipo === 'encender') m.cosas.forEach(c => {
            const lit = estado.rotos.has(`${j}${c.id}`);
            const img = scene.add.image(c.x, c.y, 'min_cristal').setDepth(3).setTint(lit ? 0xffd27a : 0x8fc8ff);
            const luz = scene.add.image(c.x, c.y, 'brillo').setDepth(41).setScale(lit ? 2.4 : 1.2).setTint(lit ? 0xffc94a : 0x8fc8ff).setAlpha(lit ? 0.6 : 0.3).setBlendMode('ADD');
            if (!lit) { scene.tweens.add({ targets: img, y: c.y - 5, yoyo: true, repeat: -1, duration: 900 }); scene.misCosas.push({ m, c, clave: `${j}${c.id}`, r: 26, img, luz }); }
        });
        else if (m.tipo === 'romper') m.cosas.forEach(c => {
            if (estado.rotos.has(`${j}${c.id}`)) return;
            const arriba = S - MURO.alto;
            const b = scene.floor.create(c.x, arriba, 'suelo').setOrigin(0, 0).setScale(MURO.ancho / 128, MURO.alto / 32).refreshBody().setVisible(false);
            const dibujo = scene.add.tileSprite(c.x, arriba, MURO.ancho, MURO.alto, 'cr_tile93').setOrigin(0).setTileScale(2 / 3).setDepth(1.3).setTint(0xc8b8a8);
            const grietas = scene.add.graphics().setDepth(1.4);
            grietas.lineStyle(2, 0x1a1008);
            for (let y = S - 40; y > arriba + 40; y -= 90) grietas.lineBetween(c.x + 8, y, c.x + 30, y - 40).lineBetween(c.x + 30, y - 40, c.x + 16, y - 80);
            const letrero = scene.add.text(c.x + 25, S - 120, '⛏️ PODER\n(V/B)', { fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: '#ffe9a8', backgroundColor: '#3b2a1aDD', padding: { x: 4, y: 4 }, align: 'center' }).setOrigin(0.5).setDepth(42);
            scene.misCosas.push({ m, c, clave: `${j}${c.id}`, muro: { b, dibujo, grietas, letrero } });
        });
        else if (m.tipo === 'llevar') {
            m.lleva = false;
            m.objeto = scene.add.text(m.desde, S - 4, '🏺', { fontSize: '20px' }).setOrigin(0.5, 1).setDepth(34).setVisible(!estado.hechas.has(j));
            scene.add.text(m.hasta, S - 4, estado.hechas.has(j) ? '🏺' : '🕯️', { fontSize: '20px' }).setOrigin(0.5, 1).setDepth(3);
            scene.add.rectangle(m.hasta, S, 50, 10, 0x8a8aa0).setOrigin(0.5, 1).setDepth(2.9);
        } else if (m.tipo === 'palancas') {
            m.pulsadas = [];
            const hecho = estado.hechas.has(j);
            m.dibujos = m.palancas.map((pl, q) => {
                const img = scene.add.image(pl.x, S, hecho ? 'cr_lever2' : 'cr_lever1').setOrigin(0.5, 1).setScale(0.8).setDepth(3);
                const t = scene.add.text(pl.x, S - 62, pl.sim, { fontSize: '16px', color: '#ffe066', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(42);
                if (!hecho) scene.misCosas.push({ m, c: { x: pl.x, y: S - 26 }, clave: `${j}p${q}`, r: 26, palanca: q, acertijo: true });
                return { img, t };
            });
            const orden = m.tramposa ? [...m.orden].reverse() : m.orden;
            pista(scene, m.pista, `📜 PALANCAS:\n${orden.join(' ')}${m.tramposa ? '  🙃' : ''}`);
        } else if (m.tipo === 'runas') {
            m.encendidas = new Set();
            const hecho = estado.hechas.has(j);
            m.dibujos = m.runas.map((ru, q) => {
                const disco = scene.add.circle(ru.x, S - 30, 16, hecho && m.correctas.includes(ru.sim) ? 0xffc94a : 0x3a3060).setStrokeStyle(2, 0x9f8cff).setDepth(3);
                const t = scene.add.text(ru.x, S - 30, ru.sim, { fontSize: '16px', color: '#e6dcff' }).setOrigin(0.5).setDepth(3.1);
                if (!hecho) scene.misCosas.push({ m, c: { x: ru.x, y: S - 30 }, clave: `${j}r${q}`, r: 22, runa: ru.sim, acertijo: true });
                return { disco, t, sim: ru.sim };
            });
            pista(scene, m.pista, `📜 RUNAS:\n${m.correctas.join(' ')}`);
        } else if (m.tipo === 'contrarreloj') {
            m.corriendo = null;
            [[m.desde, '🏁 SALIDA'], [m.hasta, '🏁 LLEGADA']].forEach(([x, t]) => {
                scene.add.rectangle(x, S, 4, 110, 0x4a3420).setOrigin(0.5, 1).setDepth(3);
                scene.add.text(x, S - 110, t, { fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: '#ffe066', backgroundColor: '#3b2a1aDD', padding: { x: 4, y: 3 } }).setOrigin(0.5, 1).setDepth(42);
            });
        }
    });
    crearLista();
    pintarLista();
    scene.events.once('shutdown', quitarLista);
}

// la pista de un acertijo: una losa de piedra con el texto
function pista(scene, x, texto) {
    scene.add.rectangle(x, S, 70, 64, 0x4c4858).setOrigin(0.5, 1).setStrokeStyle(2, 0x8a8398).setDepth(2.9);
    scene.add.text(x, S - 74, texto, { fontFamily: LETRA, fontSize: '8px', color: '#ffe9a8', backgroundColor: '#2a2430EE', padding: { x: 6, y: 5 }, align: 'center' })
        .setOrigin(0.5, 1).setDepth(42);
}

// ¿la meta sigue cerrada? (game.js: completarNivel)
export function misionesBloquean(scene) {
    if (!scene.misionesNivel || !estado) return false;
    const faltan = estado.plan.length - estado.hechas.size;
    if (faltan <= 0) return false;
    if (scene.time.now - (scene.misAvisoMeta || 0) > 2500) {
        scene.misAvisoMeta = scene.time.now;
        api.mensaje(scene, `🔒 LA META ESTÁ CERRADA\nFaltan ${faltan} ${faltan === 1 ? 'misión' : 'misiones'}`, 1500);
    }
    return true;
}

// ---------- golpes (game.js: ataques de cerca y poderes) ----------
export function golpeMisiones(scene, zona, fuente) {
    if (!scene.misCosas) return;
    scene.misCosas.slice().forEach(o => {
        if (o.muro) {
            if (fuente !== 'poder') return;
            if (Phaser.Geom.Intersects.RectangleToRectangle(zona, new Phaser.Geom.Rectangle(o.c.x, S - MURO.alto, MURO.ancho, MURO.alto))) romper(scene, o);
        } else if (Phaser.Geom.Intersects.CircleToRectangle(new Phaser.Geom.Circle(o.c.x, o.c.y, o.r), zona)) {
            if (o.acertijo) tocarAcertijo(scene, o); else romper(scene, o);
        }
    });
}

// una palanca o una runa golpeada (con una espera: un golpe largo no cuenta dos veces)
function tocarAcertijo(scene, o) {
    const m = o.m;
    if (estado.hechas.has(m.n) || scene.time.now < (o.espera || 0)) return;
    o.espera = scene.time.now + 600;
    if (o.palanca != null) {
        if (m.pulsadas.includes(o.palanca)) return;
        m.pulsadas.push(o.palanca);
        m.dibujos[o.palanca].img.setTexture('cr_lever2');
        scene.sound.play('menu_mover', { volume: 0.6 });
        const sims = m.pulsadas.map(q => m.palancas[q].sim);
        const bien = sims.every((sim, q) => sim === m.orden[q]);
        if (!bien) return fallo(scene, m, '¡ORDEN EQUIVOCADO!', () => {
            m.pulsadas = [];
            m.dibujos.forEach(d => d.img.setTexture('cr_lever1'));
        }, o.c.x);
        if (sims.length === m.orden.length) { quitarAcertijo(scene, m); cumplir(scene, m); }
        pintarLista();
        return;
    }
    // runa
    if (m.encendidas.has(o.runa)) return;
    const d = m.dibujos.find(q => q.sim === o.runa);
    if (!m.correctas.includes(o.runa)) {
        d.disco.setFillStyle(0xb02a2a);
        scene.time.delayedCall(500, () => d.disco.active && d.disco.setFillStyle(0x3a3060));
        return fallo(scene, m, '¡ESA RUNA NO ERA!', () => {
            m.encendidas.clear();
            m.dibujos.forEach(q => q.disco.setFillStyle(0x3a3060));
        }, o.c.x);
    }
    m.encendidas.add(o.runa);
    d.disco.setFillStyle(0xffc94a);
    scene.sound.play('punto_control', { volume: 0.4, rate: 1.5 });
    if (m.correctas.every(sim => m.encendidas.has(sim))) { quitarAcertijo(scene, m); cumplir(scene, m); }
    pintarLista();
}
// te equivocaste: se reinicia (y en niveles altos sale un enemigo)
function fallo(scene, m, texto, reiniciar, x) {
    reiniciar();
    scene.sound.play('bump', { volume: 0.6 });
    scene.cameras.main.shake(150, 0.004);
    api.mensaje(scene, texto, 900);
    if (estado.i > 150 && api.crearEnemigo) api.crearEnemigo(scene, x + 120, S - 2, 'esqueleto');
    pintarLista();
}
function quitarAcertijo(scene, m) {
    for (let q = scene.misCosas.length - 1; q >= 0; q--) if (scene.misCosas[q].m === m) scene.misCosas.splice(q, 1);
}

function romper(scene, o) {
    scene.misCosas.splice(scene.misCosas.indexOf(o), 1);
    estado.rotos.add(o.clave);
    if (o.m.tipo === 'rescatar') {
        scene.tweens.add({ targets: o.img, y: o.img.y + 20, alpha: 0, angle: 20, duration: 400, onComplete: () => o.img.destroy() });
        scene.tweens.add({ targets: o.cara, y: '-=40', alpha: 0, delay: 400, duration: 700 });
        scene.sound.play('romper', { volume: 0.5 });
    } else if (o.m.tipo === 'encender') {
        scene.tweens.killTweensOf(o.img);
        o.img.setTint(0xffd27a);
        o.luz.setTint(0xffc94a).setScale(2.4).setAlpha(0.6);
        scene.sound.play('punto_control', { volume: 0.5, rate: 1.3 });
    } else {
        const w = o.muro;
        w.b.destroy();
        w.letrero.destroy();
        scene.tweens.add({ targets: [w.dibujo, w.grietas], alpha: 0, y: '+=40', duration: 600, onComplete: () => { w.dibujo.destroy(); w.grietas.destroy(); } });
        scene.cameras.main.shake(300, 0.008);
        scene.sound.play('romper', { volume: 0.8, rate: 0.6 });
    }
    const quedan = scene.misCosas.filter(q => q.m === o.m).length;
    const total = o.m.cosas.length;
    if (!quedan) cumplir(scene, o.m);
    else api.mensaje(scene, `${o.m.icono} ${total - quedan}/${total}`, 700);
    pintarLista();
}

function cumplir(scene, m) {
    if (estado.hechas.has(m.n)) return;
    estado.hechas.add(m.n);
    scene.sound.play('punto_control', { volume: 0.6 });
    const faltan = estado.plan.length - estado.hechas.size;
    api.mensaje(scene, faltan ? `✔ ¡MISIÓN CUMPLIDA!\nFaltan ${faltan}` : '✔ ¡MISIONES CUMPLIDAS!\nLa meta está abierta', 1600);
    pintarLista();
}

// ---------- cada fotograma ----------
export function actualizarMisiones(scene, time) {
    const g = scene.mascotaGesi;
    if (!g?.body || !scene.misionesNivel || !estado) return;
    const b = g.body, vivo = !g.isDead && !scene.nivelTerminado;
    // flechas y magia de los personajes
    scene.flechasGrupo?.getChildren().slice().forEach(p => {
        if (!p.active) return;
        const zona = new Phaser.Geom.Rectangle(p.x - 10, p.y - 10, 20, 20);
        const antes = estado.rotos.size;
        const toca = scene.misCosas.some(o => o.acertijo && Phaser.Geom.Intersects.CircleToRectangle(new Phaser.Geom.Circle(o.c.x, o.c.y, o.r), zona));
        golpeMisiones(scene, zona, 'disparo');
        if ((estado.rotos.size !== antes || toca) && !p.perfora) p.destroy();
        else if (scene.misCosas.some(o => o.muro && zona.right > o.c.x && zona.left < o.c.x + MURO.ancho)) {
            p.destroy();
            if (!scene.misAvisoMuro) { scene.misAvisoMuro = true; api.mensaje(scene, 'SOLO UN PODER LO ROMPE (V/B)', 1100); }
        }
    });
    estado.plan.forEach(m => {
        if (estado.hechas.has(m.n)) return;
        if (m.tipo === 'llevar') {
            if (!vivo) { if (m.lleva) { m.lleva = false; m.objeto.setPosition(m.desde, S - 4); } return; }
            if (!m.lleva && Math.abs(b.center.x - m.desde) < 30 && Math.abs(b.bottom - S) < 40) {
                m.lleva = true;
                api.mensaje(scene, '🏺 ¡LA RELIQUIA! Llévala al altar 🕯️', 1300);
                pintarLista();
            }
            if (m.lleva) {
                m.objeto.setPosition(b.center.x, b.top - 4);
                if (Math.abs(b.center.x - m.hasta) < 30 && Math.abs(b.bottom - S) < 40) { m.objeto.setPosition(m.hasta, S - 4); cumplir(scene, m); }
            }
        } else if (m.tipo === 'contrarreloj') {
            if (!vivo) { m.corriendo = null; return; }
            if (!m.corriendo && b.center.x > m.desde && b.center.x < m.desde + 40 && b.velocity.x > 0) {
                m.corriendo = time;
                api.mensaje(scene, '⏱️ ¡CORRE!', 700);
            }
            if (m.corriendo) {
                const queda = m.ms - (time - m.corriendo);
                if (b.center.x >= m.hasta) { m.corriendo = null; cumplir(scene, m); }
                else if (queda <= 0) { m.corriendo = null; api.mensaje(scene, '⏱️ ¡MUY LENTO!\nVuelve a la salida', 1400); }
                if (Math.floor(queda / 100) !== m.ultimoPintado) { m.ultimoPintado = Math.floor(queda / 100); pintarLista(Math.max(0, queda)); }
            }
        }
    });
    pintarFlecha(scene);
}

// ---------- lista y flecha ----------
let lista = null, flecha = null;
function crearLista() {
    quitarLista();
    lista = document.createElement('div');
    lista.className = 'noche-lista minas-lista';
    lista.setAttribute('aria-live', 'polite');
    flecha = document.createElement('div');
    flecha.className = 'noche-flechas';
    flecha.setAttribute('aria-hidden', 'true');
    document.getElementById('game').append(lista, flecha);
}
function quitarLista() {
    lista?.remove(); flecha?.remove();
    lista = flecha = null;
}
function pintarLista(reloj) {
    if (!lista || !estado) return;
    const faltan = estado.plan.length - estado.hechas.size;
    lista.innerHTML = `<b>${faltan ? `🎯 Misiones (abren la meta) ${estado.hechas.size}/${estado.plan.length}` : '✅ Meta abierta'}</b>` + estado.plan.map(m => {
        const hecho = estado.hechas.has(m.n);
        let extra = '';
        if (m.cosas && !hecho) extra = ` ${m.cosas.filter(c => estado.rotos.has(`${m.n}${c.id}`)).length}/${m.cosas.length}`;
        if (m.tipo === 'llevar' && m.lleva && !hecho) extra = ' (la llevas)';
        if (m.tipo === 'palancas' && !hecho) extra = ` ${m.pulsadas?.length || 0}/${m.palancas.length}`;
        if (m.tipo === 'runas' && !hecho) extra = ` ${m.encendidas?.size || 0}/${m.correctas.length}`;
        if (m.tipo === 'contrarreloj' && !hecho) extra = m.corriendo && reloj != null ? ` ${(reloj / 1000).toFixed(1)} s` : ` en ${Math.round(m.ms / 1000)} s`;
        return `<p class="${hecho ? 'hecho' : ''}">${hecho ? '✔' : m.icono} ${m.texto}${extra}${m.ayuda && !hecho ? `<small>${m.ayuda}</small>` : ''}</p>`;
    }).join('');
}
function pintarFlecha(scene) {
    if (!flecha) return;
    const g = scene.mascotaGesi.body;
    const pend = [];
    estado.plan.forEach(m => {
        if (estado.hechas.has(m.n)) return;
        if (m.acertijo) {
            // primero la pista; después, las palancas o las runas
            const visto = m.vista || (m.vista = false);
            const objetivo = !visto ? m.pista : (m.palancas?.[0].x ?? m.runas.find(ru => !m.encendidas.has(ru.sim) && m.correctas.includes(ru.sim))?.x ?? m.pista);
            pend.push({ x: objetivo, y: S - 40, i: !visto ? '📜' : m.icono });
            if (!visto && Math.abs(g.center.x - m.pista) < 120) m.vista = true;
        } else if (m.cosas) scene.misCosas.filter(o => o.m === m).forEach(o => pend.push({ x: o.c.x + (o.muro ? 25 : 0), y: o.c.y ?? S - 60, i: m.icono }));
        else if (m.tipo === 'llevar') pend.push({ x: m.lleva ? m.hasta : m.desde, y: S - 30, i: m.lleva ? '🕯️' : '🏺' });
        else pend.push({ x: m.corriendo ? m.hasta : m.desde, y: S - 60, i: '⏱️' });
    });
    const o = pend.sort((a, b) => Math.abs(a.x - g.center.x) - Math.abs(b.x - g.center.x))[0];
    const v = scene.cameras.main.worldView, canvas = scene.game.canvas;
    if (!o || !canvas || (o.x > v.x + 30 && o.x < v.right - 30 && o.y > v.y + 30 && o.y < v.bottom - 30)) { if (flecha.innerHTML) flecha.innerHTML = ''; return; }
    const cr = canvas.getBoundingClientRect(), gr = flecha.parentElement.getBoundingClientRect();
    const px = x => cr.left - gr.left + (x - v.x) / v.width * cr.width, py = y => cr.top - gr.top + (y - v.y) / v.height * cr.height;
    const cx = px(g.center.x), cy = py(g.center.y), dx = px(o.x) - cx || 1e-6, dy = py(o.y) - cy || 1e-6;
    const caja = { x0: cr.left - gr.left + 40, x1: cr.right - gr.left - 40, y0: cr.top - gr.top + 76, y1: cr.bottom - gr.top - 58 };
    const k = Math.max(0, Math.min((dx > 0 ? caja.x1 - cx : caja.x0 - cx) / dx, (dy > 0 ? caja.y1 - cy : caja.y0 - cy) / dy));
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    flecha.innerHTML = `<div class="noche-flecha encargo principal" style="left:${(cx + dx * k).toFixed(0)}px;top:${(cy + dy * k).toFixed(0)}px"><i style="transform:rotate(${ang.toFixed(0)}deg)"></i><span>${o.i}</span></div>`;
}
