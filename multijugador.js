// Multijugador en línea dentro del nivel (la sala de espera está en sala.js y la conexión en red.js).
//
// Cada jugador manda en SU personaje (con todos sus poderes) y ve a los demás, que se dibujan
// a partir de lo que mandan (~15 veces por segundo) con movimiento suavizado.
// Se comparte entre todos:
//   - la semilla de las trampas (mismo reparto para todos, también al reaparecer)
//   - la muerte: si uno cae, caen todos (vidas compartidas)
//   - puntos de control, enemigos derrotados, daño al jefe y llegar a la meta
//   - la cadena: todos atados en fila, en el orden en que entraron a la sala (cadena.js)
//
// Los ENEMIGOS los mueve solo el anfitrión: persiguen al jugador más cercano de la sala y su
// pantalla manda dónde está cada uno (~8 veces por segundo). En las demás pantallas son copias
// ("réplicas") que siguen esas posiciones; un golpe a una réplica se le avisa al anfitrión.
// Las TRAMPAS se activan con cualquier jugador: cada pantalla las revisa también con "fantasmas"
// de los demás (copias de su posición que no reciben daño: ver comoJugador).
//
// ganchos (game.js): { morir(scene), activarCheckpoint(scene, cp), matarEnemigo(scene, e),
//                      dañarJefe(scene, cantidad), completar(scene), nivelActual(),
//                      crearEnemigo(scene, x, y, tipo), dañarEnemigo(scene, e, cantidad),
//                      golpeEnZona(scene, zona, x), bala(scene, datos),
//                      datosJefe(scene), jefe(scene, datos), jefeFx(scene, m),
//                      reloj(scene), ajustarReloj(scene, reloj) }
// El troll (jefes.js) sigue el mismo esquema: lo maneja el anfitrión, viaja junto con los enemigos
// y cada ataque se avisa con un "jefeFx".

import { PERSONAJES } from "./personajes.js"
import { red, alRecibir, enviarEstado, enviarEvento, enLinea, esAnfitrion } from "./red.js"

const ENVIO_MS = 66;          // ~15 estados por segundo
const OLVIDO_MS = 3000;       // sin noticias de un jugador: se oculta (se fue a otro nivel o se cortó)
const SUAVIDAD = 14;          // qué tan rápido el dibujo alcanza la posición recibida
const ENEMIGOS_MS = 125;      // el anfitrión manda los enemigos ~8 veces por segundo
const SIN_NOTICIAS_MS = 1500; // réplica que el anfitrión ya no manda (murió, cayó): se quita

let juego = null, ganchos = null;

export function iniciarMultijugador(juegoPhaser, g) {
    juego = juegoPhaser;
    ganchos = g;

    alRecibir('estado', m => {
        const scene = escenaNivel();
        if (!scene?.remotos || m.nivel !== ganchos.nivelActual()) return;
        const r = remoto(scene, m.de);
        if (!r) return;
        r.estado = m;
        r.recibido = performance.now();
    });

    alRecibir('evento', m => {
        // la muerte también cuenta fuera del nivel: así todos llevan la misma cuenta de intentos
        if (m.tipo === 'muerte') red.intento = Math.max(red.intento, m.intento || 0);
        const scene = escenaNivel();
        if (!scene) return;
        if (m.tipo === 'salio') { quitarRemoto(scene, m.de); return; }
        if (!scene.remotos || (m.nivel != null && m.nivel !== ganchos.nivelActual())) return;
        switch (m.tipo) {
            case 'muerte': ganchos.morir(scene, nombreDe(m.de)); break;
            case 'checkpoint': {
                const cp = scene.checkpoints?.find(c => c.x === m.x && !c.activo);
                if (cp) ganchos.activarCheckpoint(scene, cp);
                break;
            }
            case 'enemigo': {
                const e = scene.enemies.getChildren().find(en => en.redId === m.id && !en.isDead);
                if (e) ganchos.matarEnemigo(scene, e);
                break;
            }
            case 'jefe': ganchos.dañarJefe(scene, m.cantidad); break;
            case 'meta': ganchos.completar(scene); break;
            case 'poder': poderRemoto(scene, m); break;
            case 'enemigos':
                if (esAnfitrion()) break;
                if (m.reloj != null) ganchos.ajustarReloj(scene, m.reloj); // gotas, bolas y plataformas a la vez
                recibirEnemigos(scene, m.l);
                if (m.jefe) ganchos.jefe(scene, m.jefe);
                break;
            case 'jefeFx': ganchos.jefeFx(scene, m); break;
            case 'golpe': {
                // golpe de otro jugador a una réplica: lo aplica el anfitrión
                if (!esAnfitrion()) break;
                const e = enemigoPorId(scene, m.id);
                if (e && !e.isDead) ganchos.dañarEnemigo(scene, e, m.cantidad || 1, m.congela || 0);
                break;
            }
            case 'zona': ganchos.golpeEnZona(scene, new Phaser.Geom.Rectangle(m.x, m.y, m.w, m.h), m.ox); break;
            case 'bala': ganchos.bala(scene, m); break;
        }
    });
}

const escenaNivel = () => (juego?.scene.isActive('juego') ? juego.scene.getScene('juego') : null);
const nombreDe = id => red.jugadores.find(j => j.id === id)?.nombre || 'Alguien';

// semilla de trampas para este intento (todos iguales); undefined fuera de línea
export function semillaEnLinea(nivel) {
    if (!enLinea()) return undefined;
    return (red.semilla + nivel * 7919 + red.intento * 104729) >>> 0;
}

// ---------- al crear el nivel ----------
export function prepararNivelEnLinea(scene) {
    scene.remotos = enLinea() ? new Map() : null;
    scene.ultimoEnvio = 0;
    if (!scene.remotos) { scene.cadenaRed = null; return; }
    // la cadena une a todos en el orden de la sala (yo soy el jugador 1 de mi pantalla)
    scene.cadenaRed = () => red.jugadores.map(j => {
        if (j.id === red.tuId) return { local: true, s: scene.mascotaGesi };
        const r = scene.remotos.get(j.id);
        return r?.visible ? nodoRemoto(r) : null;
    }).filter(Boolean);
}

function remoto(scene, id) {
    if (id === red.tuId) return null;
    let r = scene.remotos.get(id);
    if (r) return r;
    const j = red.jugadores.find(x => x.id === id);
    if (!j) return null;
    const pj = PERSONAJES.find(p => p.id === j.pj) || PERSONAJES[0];
    const s = scene.add.sprite(0, -1000, `${pj.id}-idle`).setDepth(33.5).setVisible(false);
    s.setCrop(0, 57, s.width, s.height - 50);
    const color = '#' + pj.color.toString(16).padStart(6, '0');
    const etiqueta = scene.add.text(0, 0, j.nombre, {
        fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(35).setVisible(false);
    r = { id, pj, s, etiqueta, estado: null, recibido: 0, visible: false, primera: true };
    scene.remotos.set(id, r);
    return r;
}

function quitarRemoto(scene, id) {
    const r = scene.remotos?.get(id);
    if (!r) return;
    r.s.destroy();
    r.etiqueta.destroy();
    scene.remotos.delete(id);
}

function nodoRemoto(r) {
    const e = r.estado;
    return {
        local: false,
        cx: r.s.x + (e.cx - e.x), cy: r.s.y + (e.cy - e.y),
        v: { x: e.vx, y: e.vy },
        suelo: !!e.suelo, anclado: !!e.anclado,
    };
}

// ---------- cada fotograma ----------
export function actualizarEnLinea(scene, time, delta) {
    if (!scene.remotos) return;
    if (!enLinea()) {
        // se cortó la conexión: se sigue jugando solo
        scene.remotos.forEach((_r, id) => quitarRemoto(scene, id));
        scene.remotos = null;
        scene.cadenaRed = null;
        return;
    }
    enviarMiEstado(scene, time);
    if (esAnfitrion()) { enviarEnemigos(scene, time); soltarReplicas(scene); }
    else moverReplicas(scene, delta);

    const ahora = performance.now(), k = Math.min(1, delta / 1000 * SUAVIDAD);
    scene.remotos.forEach(r => {
        const e = r.estado;
        r.visible = !!e && ahora - r.recibido < OLVIDO_MS && !e.muerto;
        r.s.setVisible(r.visible);
        r.etiqueta.setVisible(r.visible);
        if (!r.visible) return;
        // se adelanta un poco con su velocidad para compensar el retraso de la red
        const adelanto = Math.min(0.15, (ahora - r.recibido) / 1000);
        const x = e.x + e.vx * adelanto, y = e.y + e.vy * adelanto;
        if (r.primera || Math.hypot(x - r.s.x, y - r.s.y) > 300) { r.s.setPosition(x, y); r.primera = false; }
        else r.s.setPosition(r.s.x + (x - r.s.x) * k, r.s.y + (y - r.s.y) * k);
        r.s.flipX = !!e.flip;
        if (e.anim && r.s.anims.currentAnim?.key !== e.anim && scene.anims.exists(e.anim)) r.s.anims.play(e.anim, true);
        r.s.setTint(e.anclado ? 0x9fd8ff : 0xffffff);
        r.etiqueta.setPosition(r.s.x, r.s.y - 8);
    });
}

function enviarMiEstado(scene, time) {
    if (time - scene.ultimoEnvio < ENVIO_MS) return;
    scene.ultimoEnvio = time;
    const g = scene.mascotaGesi, b = g.body;
    const r = n => Math.round(n);
    enviarEstado({
        nivel: ganchos.nivelActual(),
        x: r(g.x), y: r(g.y), cx: r(b.center.x), cy: r(b.center.y),
        vx: r(b.velocity.x), vy: r(b.velocity.y),
        flip: g.flipX, anim: g.anims.currentAnim?.key,
        suelo: b.blocked.down || b.touching.down, anclado: !!g.anclado, muerto: !!g.isDead,
    });
}

// ---------- avisos a los demás (los llama game.js) ----------
const nivel = () => ganchos.nivelActual();

export function avisarMuerte() {
    if (!enLinea()) return;
    red.intento++;
    enviarEvento('muerte', { intento: red.intento, nivel: nivel() });
}
export const avisarCheckpoint = x => enLinea() && enviarEvento('checkpoint', { x, nivel: nivel() });
export const avisarEnemigo = id => enLinea() && enviarEvento('enemigo', { id, nivel: nivel() });
export const avisarJefe = cantidad => enLinea() && enviarEvento('jefe', { cantidad, nivel: nivel() });
export const avisarMeta = () => enLinea() && enviarEvento('meta', { nivel: nivel() });
export function avisarPoder(scene, tecla) {
    if (!enLinea()) return;
    const g = scene.mascotaGesi;
    enviarEvento('poder', { tecla, nivel: nivel(), dir: g.flipX ? -1 : 1 });
}

// el poder de otro jugador: se ve el proyectil (el daño a los enemigos llega por 'enemigo')
function poderRemoto(scene, m) {
    const r = scene.remotos.get(m.de);
    const h = r?.pj.habilidades[m.tecla];
    if (!r?.visible || !h || h.tipo !== 'proyectil') return;
    const anim = scene.anims.get(`${r.pj.id}-${h.anim}`);
    const espera = anim ? h.soltar / anim.frameRate * 1000 : 200;
    scene.time.delayedCall(espera, () => {
        if (!r.s.active) return;
        const x = r.s.x + m.dir * 20, y = r.s.y + (r.estado.cy - r.estado.y) - 8;
        const p = scene.add.sprite(x, y, h.textura).setScale(h.escala || 1).setFlipX(m.dir < 0).setDepth(33);
        if (h.animProyectil) p.anims.play(h.animProyectil, true);
        if (h.tinte) p.setTint(h.tinte);
        scene.tweens.add({ targets: p, x: x + m.dir * h.vel * h.vida / 1000, duration: h.vida, onComplete: () => p.destroy() });
        if (h.sonido) scene.sound.play(h.sonido, { volume: 0.3, rate: h.rate || 1 });
    });
}

// ---------- quién manda en los enemigos ----------
export const soyReplica = () => enLinea() && !esAnfitrion();
export const soyAnfitrion = () => enLinea() && esAnfitrion();

const enemigoPorId = (scene, id) => scene.enemies.getChildren().find(e => e.redId === id);

// anfitrión: posición de cada enemigo vivo
function enviarEnemigos(scene, time) {
    if (time < (scene.proxEnemigos || 0)) return;
    scene.proxEnemigos = time + ENEMIGOS_MS;
    const r = n => Math.round(n);
    const l = [];
    scene.enemies.getChildren().forEach(e => {
        if (e.isDead || e.redId == null || !e.body) return;
        l.push([e.redId, e.tipoId || '', r(e.x), r(e.y), r(e.body.velocity.x), r(e.body.velocity.y),
            e.flipX ? 1 : 0, e.anims.currentAnim?.key || '', Math.round(e.scaleX * 100) / 100, e.gigante ? 1 : 0,
            scene.time.now < (e.congeladoHasta || 0) ? 1 : 0]);
    });
    const jefe = ganchos.datosJefe(scene);
    const datos = { l, reloj: ganchos.reloj(scene), nivel: nivel() };
    if (jefe) datos.jefe = jefe;
    enviarEvento('enemigos', datos);
}

// réplica: se crean las que faltan y se guarda a dónde tiene que ir cada una
function recibirEnemigos(scene, lista) {
    const ahora = performance.now();
    lista.forEach(([id, tipo, x, y, vx, vy, flip, anim, escala, gigante, congelado]) => {
        let e = enemigoPorId(scene, id);
        if (e && tipo && e.tipoId !== tipo) { e.destroy(); e = null; } // no coincide: se rehace
        if (!e) {
            if (!tipo) return;
            scene.creandoReplica = true;
            try { e = ganchos.crearEnemigo(scene, x, y, tipo); } finally { scene.creandoReplica = false; }
            if (!e) return;
            e.redId = id;
            e.setPosition(x, y);
            if (gigante) { e.gigante = true; e.setTint(0xff9a9a); }
        }
        if (e.isDead) return;
        hacerReplica(e);
        e.red = { x, y, vx, vy, t: ahora };
        e.flipX = !!flip;
        if (e.scaleX !== escala) e.setScale(escala);
        if (anim && e.anims.currentAnim?.key !== anim && scene.anims.exists(anim)) e.anims.play(anim, true);
        // congelado por el hielo de Lira (en la pantalla del anfitrión)
        if (!!congelado !== !!e.congeladoRed) {
            e.congeladoRed = !!congelado;
            if (congelado) { e.anims.pause(); e.setTint(0x9fe8ff); }
            else { e.anims.resume(); if (e.gigante) e.setTint(0xff9a9a); else e.clearTint(); }
        }
    });
}

export function hacerReplica(e) {
    if (e.replica || !e.body) return;
    e.replica = true;
    e.body.moves = false;     // la mueve la red, no la física
    e.body.setImmovable(true);
}

function moverReplicas(scene, delta) {
    const ahora = performance.now(), k = Math.min(1, delta / 1000 * SUAVIDAD);
    scene.enemies.getChildren().slice().forEach(e => {
        if (!e.replica || e.isDead || !e.red) return; // sin noticias todavía: se queda quieta
        if (ahora - e.red.t > SIN_NOTICIAS_MS) { e.destroy(); return; }
        const adelanto = Math.min(0.2, (ahora - e.red.t) / 1000);
        const x = e.red.x + e.red.vx * adelanto, y = e.red.y + e.red.vy * adelanto;
        if (Math.hypot(x - e.x, y - e.y) > 200) e.setPosition(x, y);
        else e.setPosition(e.x + (x - e.x) * k, e.y + (y - e.y) * k);
    });
}

// si este jugador pasó a ser el anfitrión (el anterior se fue), sus réplicas vuelven a tener física
function soltarReplicas(scene) {
    scene.enemies.getChildren().forEach(e => {
        if (!e.replica || !e.body) return;
        e.replica = false;
        e.red = null;
        e.body.moves = true;
        e.body.setImmovable(false);
        if (!e.isDead) e.setVelocityX(e.flipX ? -e.velBase : e.velBase);
    });
}

export const avisarGolpeEnemigo = (id, cantidad, congela = 0) => enLinea() && enviarEvento('golpe', { id, cantidad, congela, para: red.anfitrion, nivel: nivel() });
export const avisarZona = (zona, ox) => soyAnfitrion() && enviarEvento('zona', {
    x: Math.round(zona.x), y: Math.round(zona.y), w: Math.round(zona.width), h: Math.round(zona.height), ox: Math.round(ox), nivel: nivel(),
});
export const avisarBala = datos => soyAnfitrion() && enviarEvento('bala', { ...datos, nivel: nivel() });
// ataques del troll (y 'empieza', que puede mandarlo cualquiera)
export const avisarJefeFx = (fx, datos = {}) => enLinea() && enviarEvento('jefeFx', { fx, ...datos, nivel: nivel() });

// ---------- fantasmas: los demás jugadores, para trampas y enemigos ----------
// Un fantasma tiene lo que el código de trampas y enemigos lee del jugador (posición, cuerpo,
// velocidad, si está en el suelo); cualquier otra cosa que se le pida no hace nada.
const nada = new Proxy(function () {}, {
    get: (_t, p) => (p === Symbol.toPrimitive ? () => 0 : nada),
    apply: () => nada,
});
const sinEfecto = obj => new Proxy(obj, {
    get: (t, p) => (p in t ? t[p] : nada),
    set: (t, p, v) => { t[p] = v; return true; },
});

const ANCHO_CUERPO = 20, ALTO_CUERPO = 69;

export function fantasmas(scene) {
    if (!scene.remotos) return [];
    const cuadro = scene.game.loop.frame;
    if (scene.fantasmasCuadro === cuadro) return scene.listaFantasmas;
    scene.fantasmasCuadro = cuadro;
    scene.listaFantasmas = [];
    scene.remotos.forEach(r => {
        if (!r.visible) return;
        const e = r.estado;
        const cx = r.s.x + (e.cx - e.x), cy = r.s.y + (e.cy - e.y);
        const body = sinEfecto({
            center: { x: cx, y: cy }, x: cx - ANCHO_CUERPO / 2, y: cy - ALTO_CUERPO / 2,
            left: cx - ANCHO_CUERPO / 2, right: cx + ANCHO_CUERPO / 2, top: cy - ALTO_CUERPO / 2, bottom: cy + ALTO_CUERPO / 2,
            width: ANCHO_CUERPO, height: ALTO_CUERPO, velocity: { x: e.vx, y: e.vy },
            blocked: { down: !!e.suelo, left: false, right: false, up: false },
            touching: { down: !!e.suelo, left: false, right: false, up: false }, gravity: { y: 480 },
        });
        scene.listaFantasmas.push(sinEfecto({ x: r.s.x, y: r.s.y, isDead: false, flipX: !!e.flip, body, active: true, fantasma: true }));
    });
    return scene.listaFantasmas;
}

// ejecuta fn como si el jugador fuera el fantasma f: lo que active, se activa; el daño no cuenta
// (game.js ignora killgesi con scene.soloActivar) y no cambia nada del jugador de esta pantalla
export function comoJugador(scene, f, fn) {
    const propio = scene.mascotaGesi;
    const guardado = { invertidoHasta: scene.invertidoHasta, empujadoHasta: scene.empujadoHasta };
    scene.mascotaGesi = f;
    scene.soloActivar = true;
    try { return fn(); }
    catch (e) { if (!scene.avisoFantasma) { scene.avisoFantasma = true; console.warn('[multijugador] trampa con fantasma', e); } }
    finally {
        scene.mascotaGesi = propio;
        scene.soloActivar = false;
        Object.assign(scene, guardado);
    }
}

// el jugador más cercano a un enemigo: null si es el de esta pantalla (o no hay nadie más)
export function fantasmaMasCercano(scene, enemigo) {
    const lista = fantasmas(scene);
    if (!lista.length) return null;
    const ex = enemigo.body.center.x, ey = enemigo.body.center.y;
    const g = scene.mascotaGesi;
    let mejor = null, dist = g.isDead ? Infinity : Math.hypot(g.body.center.x - ex, g.body.center.y - ey);
    lista.forEach(f => {
        const d = Math.hypot(f.body.center.x - ex, f.body.center.y - ey);
        if (d < dist) { dist = d; mejor = f; }
    });
    return mejor;
}
