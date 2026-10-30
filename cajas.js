// CAJAS DE PODER (solo en la carrera): filas de cajas "?" en el camino. Al pasar por una te toca un
// objeto (una ruleta lo sortea) y lo usas con Z (o el botón 🎁 en el celular, o tocando la caja del HUD).
//
// Lo que te toca depende de TU PUESTO (el que va último recibe lo mejor, así la carrera queda pareja)
// y del MUNDO de la pista (mecanicas.js: el tema de la pista):
//   🚀 Turbo        corres más rápido un rato
//   🛡 Escudo       para el próximo golpe (de un rival o de una trampa)
//   ⚠ Trampa       la dejas atrás: el primero que la pisa la sufre. Según el mundo es una caja troll
//                   (aturde), hielo (congela), fuego (explota) o barro (ralentiza)
//   ⚡ Rayo al 1º   aturde al que va primero (solo si no eres tú)
//   y el del mundo: ❄ congela al de adelante · 🔥 lo hace explotar · 🐌 lo pone lento · 💨 empuja a todos los
//   de adelante · 🌑 los confunde · 🩸 pone lentos a todos · 🪨 una roca al primero · 🫧 una burbuja atrapa
//   al de adelante · 🍄/🌌 supersalto para ti · ⚡ (sin mundo) aturde al de adelante
// Los golpes de las cajas no quitan vida (eso solo lo hacen los poderes): retrasan.
//
// En red (sin lógica nueva en el servidor): 'carreraItem' { a: [ids], efecto, icono } le pega a esos
// jugadores; 'carreraTrampa' { k, x, y, efecto } pone una trampa en todas las pantallas y 'carreraTrampaFuera'
// { k } la quita cuando alguien la pisa. Las cajas son de cada uno (las mismas para todos y vuelven a
// aparecer al rato).
//
// api (la da carrera.js): { nombreDe(id), mensaje(scene, texto, ms), escena() }

import { red, enviarEvento } from "./red.js"
import { aplicarEfecto, puedeRecibirEfecto, textoEfecto } from "./efectos.js"
import { mecanicasDe } from "./mecanicas.js"
import { SUELO_Y } from "./alcance.js"

const ENTRE_FILAS = 1300;   // px entre una fila de cajas y la siguiente
const VUELVE_MS = 4000;     // una caja tomada vuelve a aparecer
const RULETA_MS = 900;      // lo que gira la ruleta antes de dar el objeto
const TURBO_MS = 2500, TURBO = 1.6;
const ESCUDO_MS = 8000;
const SALTO_MS = 6000;      // supersalto: los saltos son más altos
const ALTO_CAJA = SUELO_Y - 44;

const COMUNES = {
    turbo: { icono: '🚀', nombre: 'Turbo' },
    escudo: { icono: '🛡', nombre: 'Escudo' },
    rayo: { icono: '⚡', nombre: 'Rayo al 1º', efecto: 'aturdir', a: 'primero' },
};
// la trampa de cada mundo
const TRAMPA = { hielo: ['congelar', '🧊'], calor: ['explotar', '🔥'], barro: ['ralentizar', '🟫'], pegajoso: ['ralentizar', '🕸'], movediza: ['ralentizar', '⏳'] };
// el objeto propio de cada mundo
const DEL_MUNDO = {
    hielo: { icono: '❄', nombre: 'Congelar', efecto: 'congelar', a: 'adelante1' },
    calor: { icono: '🔥', nombre: 'Bola de fuego', efecto: 'explotar', a: 'adelante1' },
    barro: { icono: '🐌', nombre: 'Lodo', efecto: 'ralentizar', a: 'adelante1' },
    pegajoso: { icono: '🕸', nombre: 'Telaraña', efecto: 'ralentizar', a: 'adelante1' },
    movediza: { icono: '⏳', nombre: 'Arena', efecto: 'ralentizar', a: 'adelante1' },
    viento: { icono: '💨', nombre: 'Ráfaga', efecto: 'empujar', a: 'adelante' },
    gravedad: { icono: '🌌', nombre: 'Supersalto', propio: 'salto' },
    rebote: { icono: '🍄', nombre: 'Supersalto', propio: 'salto' },
    eclipse: { icono: '🌑', nombre: 'Eclipse', efecto: 'confundir', a: 'adelante' },
    sangre: { icono: '🩸', nombre: 'Luna de sangre', efecto: 'ralentizar', a: 'todos' },
    caen: { icono: '🪨', nombre: 'Roca', efecto: 'aturdir', a: 'primero' },
    agua: { icono: '🫧', nombre: 'Burbuja', efecto: 'atraer', a: 'adelante1' },
};
const RAYO = { icono: '⚡', nombre: 'Rayo', efecto: 'aturdir', a: 'adelante1' };

let api = null;
export const configurarCajas = a => { api = a; };

// ---------- al armar la escena (también al reaparecer) ----------
export function prepararCajas(scene, nivel, carrera) {
    scene.cajasCarrera = [];
    scene.trampasCarrera = new Map();
    if (!carrera) return;
    texturas(scene);
    const tipos = mecanicasDe(nivel.tema).map(m => m.tipo);
    carrera.mundo ??= tipos.find(t => DEL_MUNDO[t]) || null;
    carrera.trampa ??= TRAMPA[tipos.find(t => TRAMPA[t])] || ['aturdir', '❓'];
    carrera.trampas ??= new Map();
    carrera.cuentaTrampas ??= 0;
    lugaresDeCajas(scene, nivel, carrera).forEach(x => [-50, 0, 50].forEach(dx => crearCaja(scene, x + dx)));
    carrera.trampas.forEach((t, k) => dibujarTrampa(scene, k, t));
    document.querySelector('.tactil')?.classList.add('con-caja');
    pintarObjeto(carrera);
}
export function quitarCajas() {
    document.querySelector('.tactil')?.classList.remove('con-caja');
}

function texturas(scene) {
    if (scene.textures.exists('caja_poder')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x6a4a10, 1).fillRoundedRect(0, 0, 26, 26, 5);
    g.fillStyle(0xffc23a, 1).fillRoundedRect(2, 2, 22, 22, 4);
    g.fillStyle(0xffe58a, 1).fillRect(4, 4, 18, 4);
    g.generateTexture('caja_poder', 26, 26);
    g.clear();
    // la caja troll (trampa): igual pero roja
    g.fillStyle(0x5a1010, 1).fillRoundedRect(0, 0, 26, 26, 5);
    g.fillStyle(0xe0403a, 1).fillRoundedRect(2, 2, 22, 22, 4);
    g.fillStyle(0xff9a8a, 1).fillRect(4, 4, 18, 4);
    g.generateTexture('caja_troll', 26, 26);
    g.clear();
    g.fillStyle(0xffffff, 1).fillEllipse(24, 6, 48, 12);
    g.generateTexture('trampa_charco', 48, 12);
    g.destroy();
}

// filas de cajas cada ENTRE_FILAS px, sobre suelo firme (sin muros, bloques ni agua encima)
function lugaresDeCajas(scene, nivel, carrera) {
    const solidos = (scene.floor?.getChildren() || []).map(o => o.body).filter(Boolean);
    const agua = nivel.agua || [];
    const sirve = x => (nivel.suelo || []).some(([a, b]) => x - 110 > a && x + 110 < b) &&
        !agua.some(([a, b]) => x + 110 > a && x - 110 < b) &&
        !solidos.some(c => c.right > x - 100 && c.left < x + 100 && c.bottom > SUELO_Y - 110 && c.top < SUELO_Y - 8);
    const lugares = [];
    for (let x = (carrera.inicioX || 0) + 800; x < nivel.meta - 600; x += ENTRE_FILAS) {
        const bueno = [0, 120, -120, 240, -240, 360].map(d => x + d).find(sirve);
        if (bueno != null) lugares.push(bueno);
    }
    return lugares;
}

function crearCaja(scene, x) {
    const caja = scene.add.image(x, ALTO_CAJA, 'caja_poder').setDepth(33.9);
    const signo = scene.add.text(x, ALTO_CAJA + 1, '?', { fontFamily: '"Press Start 2P", monospace', fontSize: '12px', color: '#6a4a10' }).setOrigin(0.5).setDepth(33.95);
    scene.tweens.add({ targets: [caja, signo], y: '-=5', yoyo: true, repeat: -1, duration: 700 + (x % 5) * 60, ease: 'Sine.inOut' });
    scene.cajasCarrera.push({ x, caja, signo, vuelve: 0 });
}

// ---------- cada fotograma ----------
export function actualizarCajas(scene, carrera) {
    if (!carrera || !scene.cajasCarrera) return;
    const g = scene.mascotaGesi, ahora = scene.time.now;
    const vivo = g?.body && !g.isDead && !carrera.fin && !carrera.llegue && !scene.cinematica;
    // las cajas: tomar una y que vuelva a aparecer
    for (const c of scene.cajasCarrera) {
        if (c.vuelve) {
            if (ahora < c.vuelve) continue;
            c.vuelve = 0;
            c.caja.setVisible(true).setScale(0.2);
            c.signo.setVisible(true);
            scene.tweens.add({ targets: c.caja, scale: 1, duration: 250, ease: 'Back.out' });
        }
        if (!vivo || Math.abs(g.body.center.x - c.x) > 24 || Math.abs(g.body.center.y - c.caja.y) > 42) continue;
        c.vuelve = ahora + VUELVE_MS;
        c.caja.setVisible(false);
        c.signo.setVisible(false);
        const brillo = scene.add.particles(c.x, c.caja.y, 'caja_poder', { speed: { min: 60, max: 150 }, scale: { start: 0.35, end: 0 }, lifespan: 380, emitting: false }).setDepth(34.9);
        brillo.explode(8);
        scene.time.delayedCall(450, () => brillo.destroy());
        if (!carrera.objeto && !carrera.ruleta) sortear(scene, carrera);
    }
    // las trampas de los rivales: el primero que la pisa la sufre
    if (vivo) for (const [k, t] of carrera.trampas) {
        if (t.de === red.tuId || Math.abs(g.body.center.x - t.x) > 22 || Math.abs(g.body.bottom - t.y) > 26) continue;
        carrera.trampas.delete(k);
        borrarTrampa(scene, k);
        enviarEvento('carreraTrampaFuera', { k });
        recibir(scene, carrera, t.efecto, t.icono, t.de);
    }
    // el turbo deja una estela
    if (ahora < (scene.turboHasta || 0) && ahora > (scene.proxEstela || 0) && g.active) {
        scene.proxEstela = ahora + 55;
        const sombra = scene.add.image(g.x, g.y, g.texture.key, g.frame.name).setFlipX(g.flipX).setScale(g.scaleX, g.scaleY)
            .setOrigin(g.originX, g.originY).setTint(0xffb040).setAlpha(0.5).setDepth(33.8);
        scene.tweens.add({ targets: sombra, alpha: 0, duration: 260, onComplete: () => sombra.destroy() });
    }
}

// ---------- la ruleta: qué te toca ----------
function puesto(carrera) {
    const ids = red.jugadores.map(j => j.id);
    const orden = ids.sort((x, y) => (carrera.avance.get(y) || 0) - (carrera.avance.get(x) || 0));
    return { pos: orden.indexOf(red.tuId), total: orden.length, orden };
}
function opciones(carrera) {
    const { pos, total } = puesto(carrera);
    const mundo = (carrera.mundo && DEL_MUNDO[carrera.mundo]) || RAYO;
    const trampa = { icono: carrera.trampa[1], nombre: 'Trampa', trampa: true };
    const contraAdelante = !mundo.propio && mundo.a !== 'todos';
    if (pos === 0) return [trampa, trampa, COMUNES.escudo, ...(contraAdelante ? [] : [mundo]), ...(total === 1 ? [COMUNES.turbo] : [])]; // (primero)
    if (pos === total - 1) return [COMUNES.turbo, COMUNES.turbo, COMUNES.rayo, mundo, mundo];                        // (último)
    return [COMUNES.turbo, mundo, mundo, trampa, COMUNES.escudo, ...(pos >= total / 2 ? [COMUNES.rayo] : [])];        // (en el medio)
}
function sortear(scene, carrera) {
    const lista = opciones(carrera);
    const final = lista[Math.floor(Math.random() * lista.length)];
    carrera.ruleta = true;
    scene.sound.play('menu_mover', { volume: 0.4 });
    let i = 0;
    const giro = scene.time.addEvent({ delay: 80, repeat: Math.floor(RULETA_MS / 80) - 1, callback: () => {
        pintarObjeto(carrera, lista[i++ % lista.length].icono, true);
        if (giro.getRepeatCount() === 0) {
            carrera.ruleta = false;
            carrera.objeto = final;
            pintarObjeto(carrera);
            scene.sound.play('menu_ok', { volume: 0.5 });
            api.mensaje(scene, `${final.icono} ${final.nombre.toUpperCase()}\n(Z para usar)`, 1000);
        }
    } });
}

// el objeto que tienes, en el HUD de la carrera y en el botón 🎁 del celular
function pintarObjeto(carrera, icono = carrera.objeto?.icono, girando = false) {
    const caja = document.querySelector('.carrera-hud [data-caja]');
    if (caja) {
        caja.querySelector('b').textContent = icono || '';
        caja.classList.toggle('llena', !!icono);
        caja.classList.toggle('girando', girando);
    }
    const boton = document.querySelector('.tactil .t-caja');
    if (boton) {
        boton.querySelector('b').textContent = icono || '🎁';
        boton.classList.toggle('llena', !!icono && !girando);
    }
}

// ---------- usar el objeto (Z) ----------
export function usarCaja(scene, carrera) {
    const o = carrera?.objeto, g = scene?.mascotaGesi;
    if (!o || carrera.ruleta || !g?.body || g.isDead || carrera.fin || carrera.llegue || scene.cinematica) return;
    const ahora = scene.time.now;
    if (o.trampa) soltarTrampa(scene, carrera);
    else if (o === COMUNES.turbo) {
        scene.turboHasta = ahora + TURBO_MS;
        scene.sound.play('salto', { volume: 0.4, rate: 0.6 });
    } else if (o === COMUNES.escudo) {
        scene.escudoHasta = ahora + ESCUDO_MS;
        scene.escudoFx?.destroy();
        scene.escudoFx = scene.add.circle(g.x, g.body.center.y, 30, 0x6fe0ff, 0.12).setStrokeStyle(2, 0x9ff0ff, 0.9).setDepth(35);
        scene.sound.play('menu_ok', { volume: 0.4 });
    } else if (o.propio === 'salto') {
        scene.superSaltoHasta = ahora + SALTO_MS;
        api.mensaje(scene, `${o.icono} ¡SALTOS GIGANTES!`, 800);
    } else {
        const para = objetivos(carrera, o.a);
        // (si ya no hay a quién: se convierte en trampa)
        if (!para.length) soltarTrampa(scene, carrera);
        else {
            enviarEvento('carreraItem', { a: para, efecto: o.efecto, icono: o.icono }); // ('a' y no 'para': el servidor reparte 'para' a uno solo)
            api.mensaje(scene, `${o.icono} ${o.nombre.toUpperCase()} → ${para.map(id => api.nombreDe(id).toUpperCase()).join(', ')}`, 900);
            scene.sound.play('salto', { volume: 0.4, rate: 1.4 });
        }
    }
    carrera.objeto = null;
    pintarObjeto(carrera);
}
// a quién le pega: el de adelante, todos los de adelante, el primero o todos
function objetivos(carrera, a) {
    const { pos, orden } = puesto(carrera);
    const llegaron = id => id === carrera.fin?.ganador;
    const rivales = orden.filter(id => id !== red.tuId && !llegaron(id));
    if (a === 'todos') return rivales;
    if (a === 'primero') return pos === 0 ? [] : rivales.slice(0, 1);
    const adelante = orden.slice(0, pos).filter(id => !llegaron(id));
    return a === 'adelante' ? adelante : adelante.slice(-1);
}

function soltarTrampa(scene, carrera) {
    const g = scene.mascotaGesi;
    const k = `${red.tuId}-${carrera.cuentaTrampas++}`;
    const t = { x: Math.round(g.x - (g.flipX ? -60 : 60)), y: Math.round(g.body.bottom), efecto: carrera.trampa[0], icono: carrera.trampa[1], de: red.tuId };
    carrera.trampas.set(k, t);
    dibujarTrampa(scene, k, t);
    enviarEvento('carreraTrampa', { k, ...t });
    scene.sound.play('bump', { volume: 0.3 });
}
function dibujarTrampa(scene, k, t) {
    if (!scene.trampasCarrera || scene.trampasCarrera.has(k)) return;
    const partes = [];
    if (t.efecto === 'aturdir') {
        // una caja troll: parece de poder, pero es roja
        partes.push(scene.add.image(t.x, t.y - 16, 'caja_troll').setDepth(33.9),
            scene.add.text(t.x, t.y - 15, '!', { fontFamily: '"Press Start 2P", monospace', fontSize: '12px', color: '#5a1010' }).setOrigin(0.5).setDepth(33.95));
    } else {
        const color = { congelar: 0x9fe8ff, explotar: 0xff6a20, ralentizar: 0x6a4a28 }[t.efecto] || 0xffffff;
        partes.push(scene.add.image(t.x, t.y - 2, 'trampa_charco').setTint(color).setDepth(33.9));
        partes.push(scene.add.text(t.x, t.y - 14, t.icono, { fontSize: '12px' }).setOrigin(0.5).setDepth(33.95));
    }
    scene.tweens.add({ targets: partes, alpha: 0.6, yoyo: true, repeat: -1, duration: 500 });
    scene.trampasCarrera.set(k, partes);
}
function borrarTrampa(scene, k) {
    scene?.trampasCarrera?.get(k)?.forEach(p => p.destroy());
    scene?.trampasCarrera?.delete(k);
}

// ---------- lo que llega de los demás ----------
export function eventoCajas(m, carrera) {
    const scene = api.escena();
    if (m.tipo === 'carreraTrampa') {
        const t = { x: Number(m.x), y: Number(m.y), efecto: String(m.efecto), icono: String(m.icono || '❓'), de: m.de };
        carrera.trampas.set(String(m.k), t);
        if (scene) dibujarTrampa(scene, String(m.k), t);
    } else if (m.tipo === 'carreraTrampaFuera') {
        carrera.trampas.delete(String(m.k));
        borrarTrampa(scene, String(m.k));
    } else if (m.tipo === 'carreraItem' && Array.isArray(m.a) && m.a.includes(red.tuId) && scene) {
        recibir(scene, carrera, String(m.efecto), String(m.icono || ''), m.de);
    } else return false;
    return true;
}
function recibir(scene, carrera, efecto, _icono, de) {
    const g = scene.mascotaGesi;
    if (!g?.body || g.isDead || carrera.fin || carrera.llegue || scene.cinematica) return;
    const quien = api.nombreDe(de).toUpperCase();
    if (scene.time.now < (scene.escudoHasta || 0)) {
        scene.escudoHasta = 0; // (el escudo de la caja para un golpe y se rompe)
        api.mensaje(scene, '🛡 ¡BLOQUEADO!', 700);
        enviarEvento('carreraGolpe', { para: de, bloqueado: 1 });
        return;
    }
    if (!puedeRecibirEfecto(scene)) return;
    aplicarEfecto(scene, efecto, { rareza: 'raro', lado: -1, recuperacion: 300 }); // (como los poderes: siempre retrasa)
    api.mensaje(scene, textoEfecto(efecto, quien), 1000);
    enviarEvento('carreraGolpe', { para: de, efecto });
}

// (game.js) el turbo y el supersalto
export const turboCarrera = (scene, ahora) => (ahora < (scene.turboHasta || 0) ? TURBO : 1);
export const saltoCarrera = (scene, ahora) => (ahora < (scene.superSaltoHasta || 0) ? 1.35 : 1);
