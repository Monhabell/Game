// Espera a que TODOS carguen el mapa (en línea).
// Antes cada pantalla arrancaba apenas terminaba de armar el nivel: en un celular lento, los demás ya
// llevaban segundos jugando (y en la carrera la cuenta regresiva ya había pasado).
// Ahora, al terminar de armar el nivel la primera vez de la partida, cada uno avisa 'cargue' y se queda
// quieto (física, temporizadores y animaciones de la escena en pausa) hasta que estén todos, o hasta
// ESPERA_MAX_MS (si alguien no llega, no se queda nadie trabado). Al soltar, el reloj del nivel, la salida
// de la carrera y la noche se corren lo que duró la espera: así nadie empieza "atrasado".
// (Solo la primera vez: al reaparecer no se espera.)
import { red, alRecibir, enviarEvento, enLinea } from "./red.js"

const ESPERA_MAX_MS = 30000; // como mucho; después arranca igual
const REPETIR_MS = 1500;     // se repite el aviso por si alguien no lo recibió
let ronda = null;            // { semilla, cargados: Set, hecha, empezo }

alRecibir('empezar', () => { ronda = { semilla: red.semilla, cargados: new Set(), hecha: false, empezo: Date.now() }; });
// todavía no arrancó la partida (carrera.js deja la cuenta regresiva para cuando se suelte)
export const esperaPendiente = () => enLinea() && !!ronda && !ronda.hecha;
alRecibir('evento', m => {
    if (m.tipo === 'cargue' && ronda && m.s === ronda.semilla && m.de != null) ronda.cargados.add(m.de);
});

// los que faltan (personas: los bots no cargan nada)
const faltan = () => (red.jugadores || []).filter(j => !j.bot && j.id !== red.tuId && !ronda.cargados.has(j.id));

// se llama al terminar de armar el nivel. alSoltar(ms) corre lo que dependa de Date.now (carrera, noche): ms es
// lo que pasó desde 'empezar' hasta que se soltó, igual para todos (también para el último, que no espera)
export function esperarATodos(scene, alSoltar) {
    if (!enLinea() || !ronda || ronda.hecha) return;
    const avisar = () => enviarEvento('cargue', { s: ronda.semilla });
    avisar();
    if (!faltan().length) { ronda.hecha = true; alSoltar?.(Date.now() - ronda.empezo); return; } // (era el último: arranca ya)

    scene.esperandoTodos = true;
    scene.physics.pause();
    scene.time.paused = true;
    scene.tweens.pauseAll();
    const desde = Date.now(), desdeEscena = scene.game.loop.time;
    const cartel = document.createElement('div');
    cartel.className = 'espera-todos';
    cartel.style.cssText = 'position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);z-index:60;' +
        'background:rgba(8,10,24,.88);color:#fff;border:2px solid #d9b25a;border-radius:14px;padding:14px 22px;' +
        'font:700 18px system-ui,sans-serif;text-align:center;pointer-events:none;max-width:86vw';
    document.body.appendChild(cartel);
    let proxAviso = 0;
    const revisar = () => {
        const ahora = Date.now(), lista = faltan();
        if (ahora >= proxAviso) { avisar(); proxAviso = ahora + REPETIR_MS; }
        if (lista.length && ahora - desde < ESPERA_MAX_MS) {
            const s = Math.ceil((ESPERA_MAX_MS - (ahora - desde)) / 1000);
            const texto = `⏳ Esperando a ${lista.map(j => j.nombre).join(', ')}…<br><small style="font-weight:400;opacity:.75">cargando el mapa · ${s} s</small>`;
            if (cartel.innerHTML !== texto) cartel.innerHTML = texto;
            return;
        }
        soltar();
    };
    const reloj = setInterval(revisar, 200);
    const soltar = () => {
        clearInterval(reloj);
        cartel.remove();
        ronda.hecha = true;
        // el reloj del nivel no salta: cuenta desde que se soltó
        if (scene.inicioNivel != null) scene.inicioNivel += scene.game.loop.time - desdeEscena;
        alSoltar?.(Date.now() - ronda.empezo);
        scene.esperandoTodos = false;
        scene.physics.resume();
        scene.time.paused = false;
        scene.tweens.resumeAll();
    };
    // (se fue del nivel mientras esperaba: se quita el cartel y no se suelta nada)
    scene.events.once('shutdown', () => { if (scene.esperandoTodos) { clearInterval(reloj); cartel.remove(); scene.esperandoTodos = false; ronda.hecha = true; } });
    revisar();
}
