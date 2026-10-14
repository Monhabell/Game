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
// ganchos (game.js): { morir(scene), activarCheckpoint(scene, cp), matarEnemigo(scene, e),
//                      dañarJefe(scene, cantidad), completar(scene), nivelActual() }

import { PERSONAJES } from "./personajes.js"
import { red, alRecibir, enviarEstado, enviarEvento, enLinea } from "./red.js"

const ENVIO_MS = 66;          // ~15 estados por segundo
const OLVIDO_MS = 3000;       // sin noticias de un jugador: se oculta (se fue a otro nivel o se cortó)
const SUAVIDAD = 14;          // qué tan rápido el dibujo alcanza la posición recibida

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
