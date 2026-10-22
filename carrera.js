// Carrera en línea: todos corren la MISMA pista (pistas.js) y el primero en llegar a la meta gana.
//
// Cómo se juega:
//   - En la sala (sala.js) cada uno elige SU apuesta (0, 10, 25, 50 o 100) y confirma "Listo"; el
//     anfitrión elige la pista y arranca cuando todos están listos. De 2 a 8 jugadores.
//   - Cada uno corre en su pantalla, con sus enemigos y sus trampas (la misma semilla para todos, así
//     el recorrido es igual y justo). Los rivales se ven como fantasmas: no estorban ni activan trampas.
//   - PODERES: los poderes especiales de un rival sí te alcanzan (poderes.js revisa en TU pantalla si
//     el poder que lanzó su fantasma te tocó). Cada poder tiene su efecto (aturdir, congelar,
//     ralentizar, explotar, empujar, confundir, bloquear poderes o atraer: EFECTOS_CARRERA en
//     poderes.js) con su señal sobre el personaje. Nunca quitan vidas. Después de un golpe hay 1,5 s
//     de protección (nada de encadenar golpes) y un escudo activo lo para. Quien te alcanzó se entera.
//   - VIDA: además del efecto, cada poder quita vida (barra sobre la cabeza, 100 por vida). Uno de daño
//     3 o más elimina en 2 golpes. Sin vida, el rival muere y vuelve a su último punto de control (pierde
//     tiempo, no la carrera); reaparece con la vida llena. El que lo eliminó se entera.
//   - Pistas con zonas (las Ruinas del Abismo): al entrar a cada zona se anuncia su nombre y el aviso
//     de "lo que viene" muestra la zona siguiente.
//   - HUD: arriba a la izquierda las posiciones, al centro el cronómetro y el avance de cada uno (para
//     ver cómo lo pasa el rival), a la derecha el premio. En el escenario, lo que viene (lava,
//     bifurcación, meta) con su distancia, y un letrero sobre la meta.
//   - Al terminar: podio (2º, 1º, 3º), ganador, tiempo, premio de cada uno y "Volver a competir"
//     (lo arranca el anfitrión; los demás le avisan que quieren otra).
//   - Morir no saca de la carrera: se vuelve al último punto de control (y se pierde tiempo).
//   - Salida a la vez: desde que llega 'empezar' hay una cuenta regresiva fija (aunque cada celular
//     cargue la pista a su ritmo, todos salen en el mismo momento): 3, 2, 1… ¡CORRAN! en grande y la
//     puerta de salida se abre.
//   - Apuestas: cada uno paga la suya al salir. El ganador recupera la suya y cada rival le paga lo
//     que apostó el ganador (o lo que apostó el rival, si es menos); al rival se le devuelve lo que
//     sobra. Así apostar nada no te deja ganar el pozo de los demás. Si nadie apostó: 30 monedas al
//     ganador y 10 a los demás.
//
// En red (sin lógica nueva en el servidor, solo el modo 'carrera'):
//   - Quien llega avisa 'carreraMeta' con su tiempo. El ANFITRIÓN junta las llegadas un instante y
//     anuncia 'carreraFin' con el ganador (el de menor tiempo) y el orden de todos.
//   - Si todos los rivales se van de la sala, el que queda gana.
//
// MONEDAS: las del camino son las mismas para todos y cada una se la lleva EL PRIMERO que la toma: en
//   las demás pantallas desaparece (con el nombre de quien se la llevó) y no vuelve aunque reaparezcas.
//   Al llegar, al terminar la carrera (aunque gane otro) o al salir, se guardan las que no llegaron a un
//   punto de control. (Si dos la toman casi a la vez, se la llevan los dos.)
// ENEMIGOS: los del armado de la pista tienen el mismo número en todas las pantallas; si alguien mata
//   uno, muere también en las demás (multijugador.js: 'enemigo').
//
// api (la da game.js): { mensaje(scene, texto, ms), premio(monedas), pagar(monedas), guardarMonedas(scene), salir(),
//   volverASala(), revancha(nivel), morir(scene) }

import { red, alRecibir, enviarEvento, esAnfitrion, informarSaldo } from "./red.js"
import { PERSONAJES } from "./personajes.js"
import { APUESTAS } from "./arena.js"
import { saldo } from "./tienda.js"
import { SUELO_Y } from "./niveles.js"
import { pistaDe } from "./pistas.js"
import { EFECTOS_CARRERA, efectoEnCarrera } from "./poderes.js"
import { aplicarEfecto, puedeRecibirEfecto, textoEfecto } from "./efectos.js"
import { ganarXP, XP, nivelDe, textoNivel } from "./progreso.js"

const CUENTA_MS = 4000;      // de 'empezar' a la salida
const ESPERA_LLEGADAS = 400; // el anfitrión espera este rato por si otro llegó casi a la vez
const PREMIO_GANADOR = 30, PREMIO_CONSUELO = 10; // sin apuesta
const HUD_MS = 100;          // cada cuánto se repinta el HUD (cronómetro, posiciones, avisos)

let carrera = null, api = null, juego = null;
export const carreraActiva = () => carrera;
export const esModoCarrera = modo => modo === 'carrera';
const escena = () => (juego?.scene.isActive('juego') ? juego.scene.getScene('juego') : null);
const nombreDe = id => (id === red.tuId ? 'Tú' : red.jugadores.find(j => j.id === id)?.nombre || carrera?.nombres.get(id) || 'Alguien');
const colorDe = id => {
    const j = red.jugadores.find(x => x.id === id);
    const pj = PERSONAJES.find(p => p.id === j?.pj) || PERSONAJES[0];
    return '#' + pj.color.toString(16).padStart(6, '0');
};

export function iniciarCarrera(juegoPhaser, ganchos) {
    juego = juegoPhaser;
    api = ganchos;
    alRecibir('evento', m => {
        if (!carrera) return;
        if (m.tipo === 'carreraMeta') llegada(m.de, Number(m.ms));
        else if (m.tipo === 'carreraFin') terminar(m);
        else if (m.tipo === 'carreraOtra' && carrera.fin && esAnfitrion()) { (carrera.piden ||= new Set()).add(m.de); pintarPiden(); }
        else if (m.tipo === 'carreraGolpe' && m.para === red.tuId) avisarGolpe(m);
        else if (m.tipo === 'carreraMoneda') seLlevoMoneda(m.de, String(m.k));
    });
    // se fueron todos los rivales: el que queda gana (lo anuncia él mismo, ya es el anfitrión)
    alRecibir('sala', () => {
        if (carrera && !carrera.fin && esAnfitrion() && red.jugadores.length === 1) anunciar(red.tuId, null);
    });
}

// el anfitrión empezó la carrera: cada uno paga SU apuesta al salir
export function empezarCarrera({ pista, jugadores }) {
    cerrarFin();
    const apuestas = new Map(jugadores.map(j => [j.id, APUESTAS.includes(Number(j.apuesta)) ? Number(j.apuesta) : 0]));
    const mia = apuestas.get(red.tuId) || 0;
    if (mia) api.pagar(mia);
    carrera = {
        pista,
        nombrePista: pistaDe(pista).nombre.toUpperCase(),
        apuestas,
        nombres: new Map(jugadores.map(j => [j.id, j.nombre])), // (por si alguien se va antes del final)
        salida: Date.now() + CUENTA_MS,
        avance: new Map(),   // id -> fracción del recorrido (0 a 1)
        llegadas: new Map(), // (anfitrión) id -> ms que tardó
        tomadas: new Set(),  // monedas que se llevaron los demás (no vuelven al reaparecer)
        fin: null,
    };
    crearHud(jugadores);
}
export const terminarCarrera = () => { carrera = null; cerrarFin(); quitarHud(); cuentaEl?.remove(); cuentaEl = null; };

// ---------- monedas: el primero que llega se la lleva ----------
// (game.js) tomé una moneda del camino: que desaparezca en las demás pantallas
export function tomeMonedaCarrera(moneda) {
    if (!carrera || !moneda.clave || moneda.trampa) return;
    enviarEvento('carreraMoneda', { k: moneda.clave });
}
// otro se llevó una: desaparece aquí, con su nombre encima
function seLlevoMoneda(quien, clave) {
    carrera.tomadas.add(clave);
    const scene = escena();
    const m = scene?.coins?.getChildren().find(c => c.clave === clave && c.active && c.body?.enable);
    if (!m) return;
    m.disableBody(true, false);
    const etiqueta = scene.add.text(m.x, m.y - 14, nombreDe(quien), {
        fontFamily: '"Press Start 2P", monospace', fontSize: '6px', color: colorDe(quien), stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(42);
    scene.tweens.add({ targets: [m, etiqueta], y: '-=26', alpha: 0, duration: 650, ease: 'Quad.out', onComplete: () => { m.destroy(); etiqueta.destroy(); } });
}

// ---------- en el nivel ----------
// al crear la escena (también al reaparecer después de morir)
export function prepararCarrera(scene, nivel, inicioX) {
    scene.carrera = carrera;
    scene.vidaCarrera = VIDA_CARRERA; // (cada vez que aparece: después de morir, con la vida llena)
    scene.barraCarrera = null;
    carrera.meta = nivel.meta;
    carrera.inicioX ??= inicioX;
    carrera.peligros ??= peligrosDe(nivel);
    carrera.zonas ??= nivel.zonas?.length ? [...nivel.zonas].sort((a, b) => a[0] - b[0]) : null;
    letreroMeta(scene, nivel.meta);
    // (las que ya se llevaron los demás no están)
    scene.coins?.getChildren().forEach(m => { if (carrera.tomadas.has(m.clave)) m.destroy(); });
    if (carrera.fin) { scene.cinematica = true; return; }
    const falta = carrera.salida - Date.now();
    if (falta <= 0) return;
    // cuenta regresiva: quietos detrás de la puerta hasta la salida
    scene.cinematica = true;
    const puerta = crearPuerta(scene, inicioX + 70);
    api.mensaje(scene, carrera.nombrePista || 'CARRERA', Math.max(300, falta - 3200));
    const pasos = Math.min(3, Math.ceil(falta / 1000));
    for (let i = pasos; i >= 1; i--) {
        scene.time.delayedCall(falta - i * 1000, () => {
            cuenta(String(i));
            scene.sound.play('menu_mover', { volume: 0.7 });
        });
    }
    scene.time.delayedCall(falta, () => {
        if (!carrera || carrera.fin) return;
        scene.cinematica = false;
        cuenta('¡CORRAN!', true);
        puerta.abrir();
        scene.sound.play('menu_ok', { volume: 0.7 });
        scene.cameras.main.shake(180, 0.004);
    });
}

// cada fotograma (también muerto o en la cuenta regresiva): el HUD
export function actualizarCarrera(scene) {
    if (!scene.carrera || !carrera) return;
    const ahora = performance.now();
    if (ahora < (carrera.proxHud || 0)) return;
    carrera.proxHud = ahora + HUD_MS;
    const recorrido = Math.max(1, carrera.meta - carrera.inicioX);
    const fraccion = x => Math.min(1, Math.max(0, (x - carrera.inicioX) / recorrido));
    if (!scene.mascotaGesi.isDead) carrera.avance.set(red.tuId, fraccion(scene.mascotaGesi.x));
    scene.remotos?.forEach((r, id) => { if (r.estado && !r.estado.muerto) carrera.avance.set(id, fraccion(r.estado.x)); });
    if (carrera.fin) carrera.avance.set(carrera.fin.ganador, 1);
    anunciarZona(scene);
    pintarHud(scene);
}

// pistas con zonas: al entrar a una zona nueva, su nombre en grande (una vez por carrera)
function anunciarZona(scene) {
    const zonas = carrera.zonas;
    const g = scene.mascotaGesi;
    if (!zonas?.length || carrera.fin || carrera.llegue || g.isDead) return;
    let i = -1;
    zonas.forEach(([x], k) => { if (g.x >= x) i = k; });
    if (i <= (carrera.zonaVista ?? 0)) return; // (la primera la anuncia la salida)
    carrera.zonaVista = i;
    api.mensaje(scene, `ZONA ${i + 1}\n${zonas[i][1]}`, 1600);
}

// ---------- poderes entre rivales ----------
// Cada poder hace lo suyo (aturdir, congelar, ralentizar, explotar, empujar, confundir, bloquear o
// atraer: efectos.js). Nunca quitan vidas (un empujón sí puede tirarte a la lava).
export function recibirPoderCarrera(scene, p, de, ox) {
    const g = scene.mascotaGesi;
    if (!carrera || carrera.fin || carrera.llegue || scene.cinematica || g.isDead || scene.nivelTerminado) return;
    const tipo = efectoEnCarrera(p);
    if (!tipo || !puedeRecibirEfecto(scene)) return;
    const quien = nombreDe(de).toUpperCase();
    // un escudo activo (habilidad o poder de escudo) lo para
    if (scene.time.now < (scene.escudoHasta || 0)) {
        api.mensaje(scene, '¡BLOQUEADO!', 700);
        enviarEvento('carreraGolpe', { para: de, bloqueado: 1 });
        return;
    }
    // en la carrera los golpes siempre RETRASAN (hacia atrás en el recorrido, aunque le pegues por
    // detrás) y dejan un momento de recuperación: nunca se ayuda al rival a avanzar
    aplicarEfecto(scene, tipo, { rareza: p.rareza, nivel: p.nivel, lado: -1, empuje: p.empuje, recuperacion: 450 });
    // y le quita vida: sin vida, muere y vuelve a su último punto de control
    scene.vidaCarrera = Math.max(0, (scene.vidaCarrera ?? VIDA_CARRERA) - QUITA_PODER[Math.min(7, Math.ceil(p.daño || 1))]);
    pintarVidaCarrera(scene);
    if (scene.vidaCarrera <= 0) {
        api.mensaje(scene, `💀 ¡${quien} TE ELIMINÓ!`, 1300);
        enviarEvento('carreraGolpe', { para: de, efecto: tipo, mato: 1 });
        // (un instante para que se vea el golpe antes de caer)
        scene.time.delayedCall(250, () => { if (!g.isDead) api.morir(scene); });
        return;
    }
    api.mensaje(scene, textoEfecto(tipo, quien), 1000);
    enviarEvento('carreraGolpe', { para: de, efecto: tipo });
}

// ---------- vida en la carrera (solo la quitan los poderes de los rivales) ----------
const VIDA_CARRERA = 100;
// daño del poder (ya con su nivel) -> vida que quita: uno de daño 3 o más elimina en 2 golpes
const QUITA_PODER = [0, 25, 35, 50, 65, 80, 90, 100];
// barra chica sobre la cabeza: aparece al primer golpe y sigue al personaje
function pintarVidaCarrera(scene) {
    const g = scene.mascotaGesi;
    if (!scene.barraCarrera) {
        const fondo = scene.add.rectangle(0, 0, 40, 6, 0x000000, 0.75).setStrokeStyle(1, 0xffffff, 0.6).setDepth(43);
        const barra = scene.add.rectangle(0, 0, 38, 4, 0x4ade80).setOrigin(0, 0.5).setDepth(44);
        scene.barraCarrera = { fondo, barra };
        const seguir = scene.time.addEvent({
            delay: 16, loop: true, callback: () => {
                if (!g.active || !fondo.active) { seguir.remove(); return; }
                const b = g.body;
                fondo.setPosition(b.center.x, b.top - 26);
                barra.setPosition(b.center.x - 19, b.top - 26);
                fondo.setVisible(!g.isDead);
                barra.setVisible(!g.isDead);
            },
        });
    }
    const f = scene.vidaCarrera / VIDA_CARRERA;
    scene.barraCarrera.barra.setSize(38 * f, 4).setFillStyle(f > 0.5 ? 0x4ade80 : f > 0.25 ? 0xfacc15 : 0xef4444);
}

// yo alcancé a un rival con un poder (me avisa él)
function avisarGolpe(m) {
    const scene = escena();
    if (!scene || carrera.fin) return;
    const quien = nombreDe(m.de).toUpperCase();
    const e = EFECTOS_CARRERA[m.efecto];
    if (m.mato) ganarXP(XP.eliminar, scene.pj?.id);
    api.mensaje(scene, m.bloqueado ? `${quien} BLOQUEÓ TU PODER` : m.mato ? `💀 ¡ELIMINASTE A ${quien}!` : `${e ? `${e.icono} ` : ''}¡LE DISTE A ${quien}!`, m.mato ? 1200 : 800);
}

// llegué a la meta (game.js ya hizo la fiesta del faro)
export function llegarMetaCarrera(scene) {
    if (!carrera || carrera.fin || carrera.llegue) return;
    carrera.llegue = true;
    const ms = Math.max(0, Date.now() - carrera.salida);
    carrera.miTiempo = ms; // (el cronómetro se detiene)
    carrera.avance.set(red.tuId, 1);
    enviarEvento('carreraMeta', { ms });
    llegada(red.tuId, ms);
    api.mensaje(scene, '¡LLEGASTE!', 1500);
}

// (anfitrión) alguien llegó: se espera un instante por si otro llegó casi a la vez y gana el más rápido
function llegada(id, ms) {
    if (!carrera || carrera.fin || !esAnfitrion() || !(ms >= 0)) return;
    if (!carrera.llegadas.has(id)) carrera.llegadas.set(id, ms);
    if (carrera.decidiendo) return;
    carrera.decidiendo = true;
    setTimeout(() => {
        if (!carrera || carrera.fin) return;
        const [ganador, tiempo] = [...carrera.llegadas.entries()].sort((a, b) => a[1] - b[1])[0];
        anunciar(ganador, tiempo);
    }, ESPERA_LLEGADAS);
}

function anunciar(ganador, ms) {
    // el orden: el ganador y después los demás según cuánto avanzaron
    const resto = red.jugadores.map(j => j.id).filter(id => id !== ganador)
        .sort((a, b) => (carrera.avance.get(b) || 0) - (carrera.avance.get(a) || 0));
    const m = { ganador, ms, orden: [ganador, ...resto] };
    enviarEvento('carreraFin', m);
    terminar(m);
}

// fin de la carrera: premios y pantalla del podio
function terminar(m) {
    if (!carrera || carrera.fin) return;
    carrera.fin = m;
    const mio = m.ganador === red.tuId;
    const pagos = calcularPagos(m.ganador);
    // experiencia según el puesto (progreso.js)
    const puesto = (Array.isArray(m.orden) ? m.orden.map(Number) : [m.ganador]).indexOf(red.tuId);
    setTimeout(() => ganarXP(XP.carrera[puesto] ?? XP.carreraOtros, escena()?.pj?.id, { victoria: puesto === 0 }), 2600);
    const premio = pagos.get(red.tuId) || 0;
    if (premio) api.premio(premio);
    const scene = escena();
    if (scene) api.guardarMonedas(scene); // (las del camino no se pierden aunque gane otro)
    informarSaldo(saldo()); // (para la próxima: la sala revisa que alcance para la apuesta)
    if (scene) {
        scene.cinematica = true;
        if (!mio) {
            api.mensaje(scene, `¡GANÓ ${nombreDe(m.ganador).toUpperCase()}!`, 1800);
            scene.sound.play('gameover', { volume: 0.5 });
        }
    }
    pintarHud(scene);
    setTimeout(() => {
        if (carrera?.fin !== m) return;
        mostrarFin({
            mio,
            orden: (Array.isArray(m.orden) ? m.orden : [m.ganador]).map(Number),
            ms: Number(m.ms),
            pagos,
        });
    }, mio ? 1800 : 2200);
}

// cuánto recibe cada uno al final (lo que ya pagó al salir no cuenta aquí)
function calcularPagos(ganador) {
    const pagos = new Map();
    const a = carrera.apuestas;
    const total = [...a.values()].reduce((t, v) => t + v, 0);
    if (!total) {
        a.forEach((_v, id) => pagos.set(id, id === ganador ? PREMIO_GANADOR : PREMIO_CONSUELO));
        return pagos;
    }
    const delGanador = a.get(ganador) || 0;
    let gana = delGanador;
    a.forEach((v, id) => {
        if (id === ganador) return;
        const pierde = Math.min(v, delGanador);
        gana += pierde;
        pagos.set(id, v - pierde); // lo que sobra se le devuelve
    });
    pagos.set(ganador, gana);
    return pagos;
}

// ---------- salida: cuenta regresiva gigante y la puerta ----------
let cuentaEl = null;
function cuenta(texto, final = false) {
    cuentaEl?.remove();
    cuentaEl = document.createElement('div');
    cuentaEl.className = `carrera-cuenta${final ? ' ya' : ''}`;
    cuentaEl.setAttribute('aria-live', 'assertive');
    cuentaEl.textContent = texto;
    document.getElementById('game').append(cuentaEl);
    const el = cuentaEl;
    setTimeout(() => { el.remove(); if (cuentaEl === el) cuentaEl = null; }, final ? 1100 : 900);
}

// puerta de salida: una reja de piedra delante de todos que sube al "¡CORRAN!"
function crearPuerta(scene, x) {
    const alto = 150;
    const textura = scene.textures.exists('mz_bloque') ? 'mz_bloque' : '__WHITE';
    const puerta = scene.add.image(x, SUELO_Y, textura).setOrigin(0.5, 1).setDisplaySize(26, alto).setTint(0x8a8fa8).setDepth(34);
    const marco = scene.add.rectangle(x, SUELO_Y - alto - 3, 46, 8, 0x3a3f55).setDepth(35);
    const luz = scene.add.circle(x, SUELO_Y - alto - 14, 6, 0xff5a5a).setDepth(35);
    return {
        abrir: () => {
            luz.setFillStyle(0x4fd1a5);
            scene.tweens.add({ targets: puerta, y: SUELO_Y - alto, alpha: 0.2, duration: 450, ease: 'Quad.in', onComplete: () => puerta.destroy() });
            scene.tweens.add({ targets: [marco, luz], alpha: 0, delay: 900, duration: 400, onComplete: () => { marco.destroy(); luz.destroy(); } });
        },
    };
}

// ---------- HUD de la carrera (capa HTML sobre el juego) ----------
//   arriba a la izquierda: posiciones · arriba al centro: cronómetro y avance · arriba a la derecha: premio
//   en el escenario: lo que viene (lava, bifurcación, meta) con su distancia
let hud = null;
const PX_POR_METRO = 32;     // un bloque = un metro
const AVISO_DESDE = 1400;    // px: el aviso de lo que viene aparece a esta distancia
const tiempo = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${Math.floor(ms % 1000 / 100)}`;

function crearHud(jugadores) {
    quitarHud();
    hud = document.createElement('div');
    hud.className = 'carrera-hud';
    hud.innerHTML = `
        <ol class="carrera-posiciones" data-posiciones aria-label="Posiciones"></ol>
        <div class="carrera-centro">
            <span class="carrera-reloj" data-reloj>0:00.0</span>
            <div class="carrera-pista" aria-hidden="true">
                <span class="carrera-meta">🏁</span>
                ${jugadores.map(j => `<span class="carrera-punto ${j.id === red.tuId ? 'yo' : ''}" data-id="${j.id}" style="--c:${colorDe(j.id)}"></span>`).join('')}
            </div>
        </div>
        <div class="carrera-pozo" data-pozo></div>
        <div class="carrera-aviso" data-aviso hidden></div>`;
    document.getElementById('game').append(hud);
    pintarPozo();
}
function quitarHud() {
    hud?.remove();
    hud = null;
}

// premio acumulado: lo apostado entre todos y lo que ganarías tú
function pintarPozo() {
    const caja = hud?.querySelector('[data-pozo]');
    if (!caja) return;
    const a = carrera.apuestas;
    const total = [...a.values()].reduce((t, v) => t + v, 0);
    const mia = a.get(red.tuId) || 0;
    const siGanas = [...a.entries()].reduce((t, [id, v]) => t + (id === red.tuId ? 0 : Math.min(v, mia)), 0);
    caja.innerHTML = total
        ? `<span>🏆 Pozo</span><b>◉ ${total}</b><small>${mia ? `si ganas: +${siGanas}` : 'no apostaste'}</small>`
        : `<span>🏆 Premio</span><b>◉ ${PREMIO_GANADOR}</b><small>al ganador</small>`;
}

function pintarHud(scene) {
    if (!hud || !carrera) return;
    const enCarrera = new Set(red.jugadores.map(j => j.id));
    // avance de cada uno en la pista de arriba
    hud.querySelectorAll('[data-id]').forEach(p => {
        const id = Number(p.dataset.id);
        p.hidden = !enCarrera.has(id);
        p.style.left = `${(carrera.avance.get(id) || 0) * 100}%`;
    });
    // posiciones: el ganador primero y después por avance
    const orden = [...enCarrera].sort((x, y) => (y === carrera.fin?.ganador) - (x === carrera.fin?.ganador)
        || (carrera.avance.get(y) || 0) - (carrera.avance.get(x) || 0));
    // con muchos jugadores: los 4 primeros y tú
    const visibles = orden.filter((id, i) => i < 4 || id === red.tuId);
    hud.querySelector('[data-posiciones]').innerHTML = visibles.map(id => {
        const i = orden.indexOf(id);
        const llego = id === carrera.fin?.ganador || (id === red.tuId && carrera.llegue);
        return `<li class="${id === red.tuId ? 'yo' : ''}" style="--c:${colorDe(id)}"><span class="carrera-n">${i + 1}</span>
            <span class="carrera-nombre">${escapar(nombreDe(id))}</span>${nivelDe(id) ? ` <small class="carrera-nv">${textoNivel(nivelDe(id))}</small>` : ''}${llego ? ' 🏁' : ''}</li>`;
    }).join('');
    // cronómetro: corre desde la salida; se detiene al llegar (tú) o al terminar (el del ganador)
    const ms = carrera.fin && Number(carrera.fin.ms) >= 0 ? Number(carrera.fin.ms)
        : carrera.miTiempo ?? Math.max(0, Date.now() - carrera.salida);
    hud.querySelector('[data-reloj]').textContent = tiempo(ms);
    // lo que viene en el escenario
    const aviso = hud.querySelector('[data-aviso]');
    const g = scene?.mascotaGesi;
    const proximo = g && !carrera.fin && carrera.peligros?.find(p => p.x > g.x);
    const dist = proximo ? proximo.x - g.x : Infinity;
    aviso.hidden = !(dist < AVISO_DESDE || proximo?.tipo === 'meta');
    if (!aviso.hidden) {
        aviso.className = `carrera-aviso ${proximo.tipo}`;
        aviso.textContent = `${proximo.texto} · ${Math.max(0, Math.round(dist / PX_POR_METRO))} m →`;
    }
}

// lo que viene en la pista: fosos de lava, bifurcaciones y la meta (las trampas ocultas, no: son ocultas)
function peligrosDe(nivel) {
    // pista con zonas: se avisa la zona que viene, las bifurcaciones y la meta
    if (nivel.zonas?.length) {
        return [
            ...nivel.zonas.filter(([x]) => x > 0).map(([x, nombre]) => ({ x, tipo: 'zona', texto: `⚑ ${nombre.charAt(0)}${nombre.slice(1).toLowerCase()}` })),
            ...(nivel.atajos || []).map(([a]) => ({ x: a - 330, tipo: 'bifurcacion', texto: '⑂ Bifurcación' })),
            { x: nivel.meta, tipo: 'meta', texto: '🏁 Meta' },
        ].sort((p, q) => p.x - q.x);
    }
    const lista = [
        ...(nivel.lava || []).filter(([a, b]) => b - a >= 100).map(([a]) => ({ x: a, tipo: 'lava', texto: '🔥 Lava' })),
        // (la bifurcación empieza ~330 px antes de su atajo: donde está el primer escalón)
        ...(nivel.atajos || []).map(([a]) => ({ x: a - 330, tipo: 'bifurcacion', texto: '⑂ Bifurcación' })),
        { x: nivel.meta, tipo: 'meta', texto: '🏁 Meta' },
    ].sort((p, q) => p.x - q.x);
    // dos avisos casi juntos se dicen como uno
    return lista.filter((p, i) => i === 0 || p.x - lista[i - 1].x > 250 || p.tipo === 'meta');
}

// la meta, bien visible en el escenario: un letrero que flota sobre el faro
function letreroMeta(scene, x) {
    const t = scene.add.text(x, SUELO_Y - 250, '🏁 META 🏁', {
        fontFamily: '"Press Start 2P", monospace', fontSize: '16px', color: '#ffe066', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(41);
    scene.tweens.add({ targets: t, y: t.y - 8, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
}

// ---------- pantalla final: podio, ganador, premio y volver a competir ----------
let capaFin = null;
const MEDALLAS = ['🥇', '🥈', '🥉'];
function mostrarFin(d) {
    cerrarFin();
    const anfitrion = esAnfitrion();
    const conApuestas = [...carrera.apuestas.values()].some(v => v > 0);
    const neto = id => (d.pagos.get(id) || 0) - (conApuestas ? carrera.apuestas.get(id) || 0 : 0);
    const signo = n => `${n >= 0 ? '+' : '−'}${Math.abs(n)}`;
    // podio: 2º, 1º, 3º (como uno de verdad)
    const escalon = i => {
        const id = d.orden[i];
        if (id == null) return '<div class="carrera-escalon vacio"></div>';
        return `<div class="carrera-escalon e${i + 1} ${id === red.tuId ? 'yo' : ''}" style="--c:${colorDe(id)}">
            <span class="carrera-medalla" aria-hidden="true">${MEDALLAS[i]}</span>
            <b>${escapar(nombreDe(id))}</b>
            <small>◉ ${signo(neto(id))}</small>
            <div class="carrera-bloque">${i + 1}</div>
        </div>`;
    };
    const resto = d.orden.slice(3).map((id, k) => `<li${id === red.tuId ? ' class="yo"' : ''}>${k + 4}º <b>${escapar(nombreDe(id))}</b>
        <small>(${Math.round((carrera.avance.get(id) || 0) * 100)}% · ◉ ${signo(neto(id))})</small></li>`).join('');
    const mioNeto = neto(red.tuId);
    const premio = d.mio ? `Premio recibido: ◉ +${d.pagos.get(red.tuId) || 0}`
        : mioNeto > 0 ? `Recibes ◉ +${mioNeto}`
        : mioNeto < 0 ? `Perdiste ◉ ${-mioNeto}${(d.pagos.get(red.tuId) || 0) ? ` (se te devuelven ◉ ${d.pagos.get(red.tuId)})` : ''}`
        : 'No ganas ni pierdes monedas';
    capaFin = document.createElement('div');
    capaFin.className = 'menu-capa';
    capaFin.innerHTML = `
        <div class="menu-panel arena-fin carrera-fin ${d.mio ? 'gano' : ''}" role="dialog" aria-modal="true" aria-labelledby="carrera-fin-titulo">
            <h2 id="carrera-fin-titulo">${d.mio ? '🏆 ¡GANASTE!' : `🏆 ¡GANÓ ${escapar(nombreDe(d.orden[0])).toUpperCase()}!`}</h2>
            <p class="carrera-fin-tiempo">${d.ms >= 0 ? `Tiempo: ${tiempo(d.ms)}` : 'Los demás se fueron'}</p>
            <div class="carrera-podio3">${escalon(1)}${escalon(0)}${escalon(2)}</div>
            ${resto ? `<ol class="arena-medallas carrera-podio">${resto}</ol>` : ''}
            <p class="carrera-premio ${mioNeto < 0 ? 'pierde' : ''}">${premio}</p>
            <p class="menu-nota" data-piden hidden></p>
            <button type="button" class="menu-boton sala-empezar" data-fin="revancha">↻ Volver a competir</button>
            ${anfitrion ? '<button type="button" class="menu-boton" data-fin="sala">☰ Volver a la sala</button>' : ''}
            <button type="button" class="menu-boton menu-salir" data-fin="salir">✕ Salir</button>
        </div>`;
    document.getElementById('game').append(capaFin);
    const pista = carrera.pista;
    capaFin.addEventListener('click', e => {
        const b = e.target.closest('[data-fin]');
        const accion = b?.dataset.fin;
        if (!accion) return;
        if (accion === 'revancha' && !esAnfitrion()) {
            // solo el anfitrión arranca: los demás le avisan que quieren otra
            enviarEvento('carreraOtra', {});
            b.disabled = true;
            b.textContent = 'Esperando al anfitrión…';
            return;
        }
        cerrarFin();
        if (accion === 'revancha') api.revancha(pista);
        else if (accion === 'sala') api.volverASala();
        else api.salir();
    });
    capaFin.addEventListener('keydown', e => e.stopPropagation());
    capaFin.querySelector('[data-fin]')?.focus();
    pintarPiden();
}
// (anfitrión) quiénes quieren volver a competir
function pintarPiden() {
    const p = capaFin?.querySelector('[data-piden]');
    if (!p || !carrera?.piden?.size) return;
    p.hidden = false;
    p.textContent = `🙋 ${[...carrera.piden].map(nombreDe).join(', ')} ${carrera.piden.size > 1 ? 'quieren' : 'quiere'} volver a competir`;
}
export function cerrarFin() {
    capaFin?.remove();
    capaFin = null;
}

const escapar = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
