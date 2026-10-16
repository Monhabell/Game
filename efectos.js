// Efectos de los poderes sobre OTROS JUGADORES (carrera y arena): cada poder hace lo suyo
// (EFECTOS_CARRERA y efectoEnCarrera en poderes.js):
//   aturdir    estrellas sobre la cabeza: no se mueve, no salta ni ataca
//   congelar   encerrado en un bloque de hielo: no se mueve
//   ralentizar corre a la mitad y salta menos
//   explotar   ¡BOOM!: sale volando hacia atrás y queda aturdido un momento
//   empujar    lo arrastra hacia atrás
//   confundir  izquierda y derecha invertidas
//   bloquear   no puede usar ataques ni poderes (sí correr y saltar)
//   atraer     el vórtice lo atrapa un momento
// Duran más cuanto más raro y más alto de nivel es el poder, con tope. Después de un efecto hay
// PROTEGIDO_MS sin recibir otro (en la arena el daño sí sigue contando): nadie queda trabado.
// game.js aplica los estados: aturdidoHasta, lentoHasta, silenciadoHasta, invertidoHasta, empujadoHasta.

import { EFECTOS_CARRERA } from "./poderes.js"

export const PROTEGIDO_MS = 1500;
const RAREZA = { comun: 1, raro: 1.2, epico: 1.4, legendario: 1.7 };
// ms base de cada efecto (se multiplica por la rareza y el nivel) y su tope
const DURA = {
    aturdir: [800, 1400], congelar: [1100, 1800], ralentizar: [2200, 3500], explotar: [450, 700],
    empujar: [0, 0], confundir: [2200, 3500], bloquear: [2600, 4000], atraer: [500, 800],
};
const TINTE = { aturdir: 0xffe066, congelar: 0x9fe8ff, ralentizar: 0x7fe06a, explotar: 0xff8a4a, empujar: 0x6fb8ff, confundir: 0xc77dff, bloquear: 0x9a9aa8, atraer: 0xff7ad9 };

// ¿puede recibir un efecto ahora? (si sí, empieza la protección)
export function puedeRecibirEfecto(scene) {
    if (scene.time.now < (scene.protegidoEfecto || 0)) return false;
    scene.protegidoEfecto = scene.time.now + PROTEGIDO_MS;
    return true;
}

// aplica el efecto 'tipo' al jugador de esta pantalla
//   rareza, nivel: del poder · lado: hacia dónde lo empuja (-1 / 1) · fuerza: multiplica los empujones
//   recuperacion: ms quieto después de un empujón (la carrera lo usa para que retrasar se note)
export function aplicarEfecto(scene, tipo, { rareza = 'comun', nivel = 1, lado = 1, fuerza = 1, empuje = 0, recuperacion = 0 } = {}) {
    const g = scene.mascotaGesi;
    if (!DURA[tipo] || !g?.body || g.isDead) return;
    const ahora = scene.time.now;
    const [base, tope] = DURA[tipo];
    const ms = Math.min(tope, base * (RAREZA[rareza] || 1) * (1 + 0.12 * ((nivel || 1) - 1)));
    // empujones (los que mueven): un rato sin control para que el golpe se note
    const empujar = (vx, vy, sinControl) => {
        g.setVelocity(Math.max(-600, Math.min(600, vx * fuerza)), vy);
        scene.empujadoHasta = ahora + sinControl;
    };
    switch (tipo) {
        case 'aturdir':
            empujar(lado * 120, -120, 150);
            scene.aturdidoHasta = ahora + 150 + ms;
            break;
        case 'congelar':
            g.setVelocityX(0);
            scene.aturdidoHasta = ahora + ms;
            break;
        case 'ralentizar':
            scene.lentoHasta = ahora + ms;
            break;
        case 'explotar':
            empujar(lado * 330, -330, 380);
            scene.aturdidoHasta = ahora + 380 + ms;
            scene.cameras.main.shake(260, 0.012);
            break;
        case 'empujar':
            empujar(lado * Math.min(380, empuje || 300), -140, 420);
            if (recuperacion) scene.aturdidoHasta = ahora + 420 + recuperacion;
            break;
        case 'confundir':
            scene.invertidoHasta = ahora + ms;
            break;
        case 'bloquear':
            scene.silenciadoHasta = ahora + ms;
            break;
        case 'atraer':
            scene.aturdidoHasta = ahora + ms;
            break;
    }
    mostrarEfecto(scene, tipo, tipo === 'empujar' ? 420 + recuperacion : tipo === 'explotar' ? 380 + ms : ms);
    scene.tweens.add({ targets: g, alpha: 0.55, yoyo: true, repeat: Math.floor(PROTEGIDO_MS / 240), duration: 120, onComplete: () => g.setAlpha(1) });
    if (tipo !== 'explotar') scene.cameras.main.shake(140, 0.005);
    scene.sound.play(tipo === 'explotar' ? 'romper' : 'bump', { volume: 0.6 });
}

// texto para el mensaje: "❄ ¡ANA TE CONGELÓ!"
export const textoEfecto = (tipo, quien) => `${EFECTOS_CARRERA[tipo].icono} ¡${quien} ${EFECTOS_CARRERA[tipo].texto}!`;

// la señal de cada efecto sobre el personaje (lo sigue mientras dura)
function mostrarEfecto(scene, tipo, ms) {
    const g = scene.mascotaGesi;
    scene.efectoJugador?.forEach(o => o.destroy());
    const objetos = [];
    const icono = scene.add.text(0, 0, EFECTOS_CARRERA[tipo].icono, { fontSize: '16px' }).setOrigin(0.5).setDepth(42);
    objetos.push(icono);
    let hielo = null, estrellas = [];
    if (tipo === 'congelar') {
        // bloque de hielo alrededor del cuerpo
        hielo = scene.add.rectangle(0, 0, 34, 78, 0xbff0ff, 0.45).setStrokeStyle(2, 0xe8fbff, 0.9).setDepth(35);
        objetos.push(hielo);
    } else if (tipo === 'aturdir' || tipo === 'explotar') {
        estrellas = [0, 1, 2].map(() => scene.add.star(0, 0, 5, 2, 5, 0xffe066).setDepth(42));
        objetos.push(...estrellas);
    }
    if (tipo === 'explotar') {
        const b = g.body.center;
        const boom = scene.add.image(b.x, b.y, 'brillo').setDepth(41).setScale(0.6).setTint(0xff7a2a).setBlendMode('ADD');
        scene.tweens.add({ targets: boom, scale: 2.4, alpha: 0, duration: 380, onComplete: () => boom.destroy() });
    }
    if (tipo !== 'congelar') g.setTint(TINTE[tipo]);
    scene.efectoJugador = objetos;
    const fin = scene.time.now + ms;
    const seguir = scene.time.addEvent({
        delay: 16, loop: true, callback: () => {
            if (scene.time.now > fin || g.isDead || !g.active) {
                seguir.remove();
                objetos.forEach(o => o.destroy());
                if (scene.efectoJugador === objetos) scene.efectoJugador = null;
                if (g.active && !g.isDead) g.clearTint();
                return;
            }
            const b = g.body.center;
            icono.setPosition(b.x, g.body.top - 14);
            hielo?.setPosition(b.x, b.y);
            const t = scene.time.now / 180;
            estrellas.forEach((e, i) => e.setPosition(b.x + Math.cos(t + i * 2.1) * 16, g.body.top - 4 + Math.sin(t + i * 2.1) * 4));
        },
    });
}
