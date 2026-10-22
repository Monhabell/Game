// Mapa de La Noche del Troll: el Bosque de Albora (troll.js).
//
// No es un nivel de izquierda a derecha: es un bosque grande con varias rutas, para que el grupo
// se separe y el troll tenga momentos sin testigos. Mide unas 4 pantallas de ancho y 3 de alto.
//
//    🔥A COPA DEL ROBLE ─── PUENTE DE RAMAS (sobre el claro) ─── 🔥B NIDO
//          │ (zigzag de tablas)                                     │ (ascensor)
//    CUEVA DE RAÍCES 🔥C    🔔 CLARO CENTRAL + 🌅 ALTAR    ~RÍO~    CASCADA 🔥D (de a dos)
//                                                       TRONCO HUECO ↓ (atajo del nido al suelo)
//
// Antorchas del Sol: [x, pie, dos] (pie = altura donde se pisa; dos: hacen falta dos a la vez).
// Altar del Amanecer: se abre con las 4 encendidas; un héroe que lo toca trae el amanecer.
// Se puede llegar a todo (lo comprueba alcance.js) con el salto más corto.
// El zigzag y el puente son de TABLAS FIRMES (no ramas que se doblan y se rompen): en línea cada pantalla
// doblaría y rompería sus ramas a su manera y se vería a la gente flotando.

import { SUELO_Y } from "./niveles.js"

const ANCHO = 3600;
const PASO = 96; // escalón de una torre (como tramoTorre)

// zigzag de tablas desde el suelo: x0 = donde empieza, pasos = cuántos escalones
const zigzag = (x0, pasos) => Array.from({ length: pasos }, (_, i) => {
    const k = i + 1, izq = k % 2 === 1;
    return [x0 + (izq ? 40 : 250), SUELO_Y - PASO * k, izq ? 120 : 130, 'tabla'];
});

export const COPA_Y = SUELO_Y - PASO * 6;   // -244: arriba del todo (copa y nido)
export const PUENTE_Y = SUELO_Y - PASO * 5 + 14; // -134: el puente de tablas, un poco más abajo
const TECHO_CUEVA = 220;             // la cueva es baja: se pasa caminando, no saltando

export const ANTORCHAS_NOCHE = [
    { id: 'A', nombre: 'Copa del Roble', x: 700, pie: COPA_Y, dos: false },
    { id: 'B', nombre: 'Nido', x: 2960, pie: COPA_Y, dos: false },
    { id: 'C', nombre: 'Cueva de Raíces', x: 430, pie: SUELO_Y, dos: false },
    { id: 'D', nombre: 'Cascada', x: 3400, pie: SUELO_Y, dos: true },
];
export const ALTAR_NOCHE = { x: 1800, pie: SUELO_Y };
export const CASCADA = { x0: 3300, x1: 3500 };
export const TRONCO_HUECO = { x: 2640, arriba: COPA_Y };

// ENCARGOS (troll.js): a cada uno le tocan 3, en zonas distintas, para que el grupo se separe.
//   recoger: tomar las cosas de 'puntos' (solo las ve quien tiene el encargo)
//   quieto:  quedarse quieto 'ms' junto a (x, pie)
//   llevar:  tocar 'desde' y después llevarlo hasta 'hasta'
//   visible: al cumplirlo pasa algo que TODOS ven u oyen (el troll no puede hacerlo de verdad: prueba de inocencia)
export const ENCARGOS = [
    { id: 'luciernagas', tipo: 'recoger', icono: '🐞', texto: 'Atrapa 3 luciérnagas', zona: 'Copa del Roble',
        puntos: [[600, COPA_Y - 40], [860, COPA_Y - 56], [1020, COPA_Y - 36]] },
    { id: 'hongos', tipo: 'recoger', icono: '🍄', texto: 'Junta 3 hongos brillantes', zona: 'Cueva de Raíces',
        puntos: [[260, SUELO_Y - 14], [560, SUELO_Y - 14], [790, SUELO_Y - 14]] },
    { id: 'campana', tipo: 'quieto', icono: '🔔', texto: 'Toca la campana del Nido', zona: 'Nido',
        x: 2790, pie: COPA_Y, ms: 2000, visible: true },
    { id: 'mirador', tipo: 'quieto', icono: '🪵', texto: 'Repara el mirador del puente', zona: 'Puente',
        x: 1830, pie: PUENTE_Y - 20, ms: 3000 },
    { id: 'cofre', tipo: 'quieto', icono: '🗝️', texto: 'Abre el cofre del río', zona: 'Río',
        x: 2780, pie: SUELO_Y, ms: 1500 },
    { id: 'agua', tipo: 'llevar', icono: '💧', texto: 'Lleva agua de la cascada a la flor del claro', zona: 'Cascada → Claro',
        desde: { x: 3260, pie: SUELO_Y }, hasta: { x: 1990, pie: SUELO_Y }, visible: true },
];

// inicio: dónde aparece (el fantasma, donde cayó); si no, junto al altar
export function nivelNoche(inicio = null) {
    return {
        nombre: 'El Bosque de Albora',
        ancho: ANCHO,
        alto: 700,
        nubes: true,
        fondo: 'montanas',
        sinMeta: true, // la meta es el Altar del Amanecer (troll.js)
        meta: ANCHO,   // (solo para repartir la niebla y los relámpagos a lo ancho: ambiente.js)
        inicio: inicio || [ALTAR_NOCHE.x - 120, 250],
        mezcla: [],
        suelo: [[0, 2200], [2560, ANCHO]],
        // el río: lava con un tronco que va y viene
        lava: [[2200, 2560]],
        moviles: [
            [2232, 316, 'x', 200, 60, 'tronco'],
            // ascensor de la cascada al nido
            [3200, 316, 'y', SUELO_Y - COPA_Y + 12, 55],
        ],
        // la cueva: roca desde arriba hasta TECHO_CUEVA (su lomo se camina)
        techos: [[200, 860, TECHO_CUEVA]],
        plataformas: [
            // Copa del Roble: zigzag de tablas y la copa (de roca: ahí se enciende la antorcha)
            ...zigzag(950, 6),
            [560, COPA_Y, 500],
            // puente de tablas sobre el claro (la del medio es de roca: un mirador para descansar)
            [1420, PUENTE_Y, 110, 'tabla'], [1600, PUENTE_Y, 110, 'tabla'], [1760, PUENTE_Y - 20, 140],
            [1970, PUENTE_Y, 110, 'tabla'], [2150, PUENTE_Y, 110, 'tabla'], [2330, PUENTE_Y, 110, 'tabla'],
            [2500, PUENTE_Y - 50, 110],
            // el Nido
            [2700, COPA_Y, 400],
        ],
        escaleras: [],
        enemigos: [], plantas: [], espiritus: [], checkpoints: [], monedas: [],
    };
}
