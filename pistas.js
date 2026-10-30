// Pistas de carrera (modo Carrera en línea: carrera.js).
//
// Una pista es un nivel corto y rápido, sin jefe, pensado para correr contra otros. Su gracia son las
// BIFURCACIONES (tramoBifurcacion en tramos.js): arriba un camino largo y seguro, abajo un atajo con
// trampas ocultas. ¿Arriesgas tu ventaja por el atajo, o subes y pierdes unos segundos seguros?
//
// Medidas: correr el atajo limpio toma ~9 s; el camino de arriba, ~15 s (subir, saltar islas, esperar
// el puente móvil). Caer en el atajo cuesta más: se vuelve al punto de control antes de la bifurcación.
//
// Ritmo de "La Bifurcación del Troll":
//   1. Salida (llano, detrás de la puerta): todos juntos, sin trampas.
//   2. Primera bifurcación: aquí se aprende que el atajo engaña.
//   3. Descanso corto y el abismo rúnico (hay que golpear la runa: todos pierden el mismo tiempo,
//      y los que vienen atrás ven cómo lo hacen los de adelante).
//   4. Segunda bifurcación: ya sabes cómo se ven las trampas... pero están en otro lugar.
//   5. Recta final hasta la meta, sin trampas: se gana corriendo.
//
// LOS NIVELES DEL JUEGO TAMBIÉN SON PISTAS: con el número PISTA_GENERADA + índice se corre un nivel
// generado (pistaDeNivel): su tema, sus trampas troll, su agua y sus túneles oscuros, sin jefe ni misiones
// y más corto (la meta en el primer punto de control pasados LARGO_CARRERA px). En la sala se elige un
// MUNDO (pistaDeMundo: un nivel al azar de ese mundo), la PISTA DEL DÍA (la misma para todos ese día,
// con récord) o al azar.
//
// Las trampas: las comunes las reparte azar.js con la semilla de la sala (fuera de los atajos) y las
// del atajo las pone ponerAtajo con esa misma semilla. Así TODOS corren exactamente la misma pista,
// y al morir se reaparece con las mismas trampas (en la carrera la semilla no cambia).

import {
    colocar, tramoLlano, tramoBifurcacion, tramoAbismoRunico,
    zonaSalida, zonaPuente, zonaTunel, zonaAtajo, zonaSueloMentiroso, zonaPersecucion, zonaLlegada,
} from "./tramos.js"
import { aleatorizarNivel, crearAzar, prepararNivelFijo } from "./azar.js"
import { NIVELES, nivelPorIndice, NIVELES_POR_MUNDO, TOTAL_NIVELES } from "./niveles.js"

// region: el nivel de la historia del que toma el paisaje, el ambiente y los enemigos
export const PISTAS = [
    {
        nombre: 'La Bifurcación del Troll',
        region: 2, // Puentes sobre la Lava (tiene lo alto: los caminos de arriba se ven bien)
        piezas: () => [
            tramoLlano(900, { enemigos: 1 }),
            tramoBifurcacion(),
            tramoLlano(500, { enemigos: 1 }),
            tramoAbismoRunico(),
            tramoLlano(400),
            tramoBifurcacion(),
            tramoLlano(1400, { enemigos: 1 }),
        ],
    },
    // Las Ruinas del Abismo: fantasía oscura (ruinas, caverna, lava, portales). Siete zonas con
    // trampas puestas a mano (fija: no pasa por azar.js) y mecanismos propios en abismo.js.
    //   1. La Salida Explosiva   0 %-14 %   salida ancha, foso fácil, bifurcación opcional
    //   2. El Puente de la Muerte  -29 %    tablones firmes y frágiles, bolas de fuego, tramo roto
    //   3. El Túnel Maldito        -43 %    caverna oscura, techos variables, aplastadores con ritmo
    //   4. El Atajo Maldito        -60 %    senda segura arriba / atajo con cadena, portal y géiser
    //   5. El Suelo Mentiroso      -72 %    losas falsas (con pista), grietas que mienten, suelo móvil
    //   6. La Persecución          -87 %    el Muro del Abismo te persigue: no se puede parar
    //   7. La Llegada             -100 %    último foso y recta hasta el Portal de la meta
    // Un punto de control al empezar cada zona (en suelo firme): caer cuesta tiempo, nunca la carrera.
    {
        nombre: 'Las Ruinas del Abismo',
        region: 2, // Puentes sobre la Lava: cielo abierto, ceniza y relámpagos (lo oscuro lo pone abismo.js)
        fija: true,
        piezas: () => [zonaSalida(), zonaPuente(), zonaTunel(), zonaAtajo(), zonaSueloMentiroso(), zonaPersecucion(), zonaLlegada()],
    },
    // los mapas de la historia también se corren (nivel: su índice en NIVELES): con sus trampas de
    // siempre (la misma semilla para todos) y sin jefe; la meta queda donde empezaría su arena
    ...NIVELES.map((n, i) => ({ nombre: `${n.nombre} · mapa ${i + 1}`, region: i, nivel: i })),
];

// la arena del jefe ocupa los últimos ~950 px antes de la meta: en la carrera se llega antes
const SIN_ARENA = 900;

// cuántas trampas comunes reparte azar.js fuera de los atajos (las de los primeros niveles: pocas)
const INDICE_TRAMPAS = 0;

export const PISTA_GENERADA = 1000;  // desde este número, las pistas son niveles generados
const LARGO_CARRERA = 8000;         // px: lo que se corre de un nivel generado
// un nivel que sirve de pista: de los generados y nunca el del jefe (el último de cada mundo)
function nivelParaCarrera(L) {
    L = Math.min(Math.max(NIVELES.length, L | 0), TOTAL_NIVELES - 2);
    return L % NIVELES_POR_MUNDO === NIVELES_POR_MUNDO - 1 ? L - 1 : L;
}
export const pistaDeNivel = L => PISTA_GENERADA + nivelParaCarrera(L);
// un nivel al azar del mundo (los primeros mundos de cada tema: dificultad de carrera, no de nivel 4000)
export const pistaDeMundo = mundo => pistaDeNivel((mundo - 1) * NIVELES_POR_MUNDO + Math.floor(Math.random() * (NIVELES_POR_MUNDO - 1)));
// la pista del día: la misma para todos (sale de la fecha) entre los niveles 8 y 400
export function pistaDelDia(fecha = new Date()) {
    let h = fecha.getFullYear() * 372 + fecha.getMonth() * 31 + fecha.getDate();
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
    return pistaDeNivel(NIVELES.length + (h % 393));
}
export const esPistaGenerada = i => i >= PISTA_GENERADA;

export const pistaDe = i => {
    if (i >= PISTA_GENERADA) {
        const L = i - PISTA_GENERADA;
        return { nombre: nivelPorIndice(L).nombre, region: L, generado: L };
    }
    return PISTAS[Math.min(Math.max(0, i | 0), PISTAS.length - 1)];
};

// arma la pista con sus trampas para esta semilla (la misma en todas las pantallas)
// CARRERA: menos monedas que en la aventura (se corre, no se junta): queda 1 de cada 3 filas
const FILAS_QUE_QUEDAN = 1 / 3;
export function armarPista(i, semilla) {
    const n = armarPistaBase(i, semilla);
    const r = crearAzar((semilla ^ 0x51ed27) >>> 0);
    // una fila: monedas a la misma altura y seguidas (a menos de 60 px)
    let fila = -1, ultima = null, queda = true;
    const monedas = (n.monedas || []).filter(m => {
        if (!ultima || m[1] !== ultima[1] || Math.abs(m[0] - ultima[0]) > 60) { fila++; queda = r() < FILAS_QUE_QUEDAN; }
        ultima = m;
        return queda;
    });
    return { ...n, monedas };
}
function armarPistaBase(i, semilla) {
    const pista = pistaDe(i);
    if (pista.generado != null) return armarDeGenerado(pista.generado, semilla);
    if (pista.nivel != null) return armarDeNivel(pista.nivel, semilla);
    const region = NIVELES[pista.region];
    const base = {
        nombre: pista.nombre, ancho: 0, meta: 0,
        cueva: region.cueva, nubes: region.nubes, tinte: region.tinte, fondo: region.fondo,
        mezcla: region.mezcla, velEnemigos: region.velEnemigos,
        suelo: [], checkpoints: [], carteles: [], atajos: [],
    };
    let x = 0;
    pista.piezas().forEach(t => {
        colocar(base, t, x);
        // punto de control al empezar cada bifurcación y cada pieza larga (no en la salida)
        if (x > 0 && t.ancho >= 600) base.checkpoints.push(x + 60);
        x += t.ancho;
    });
    base.ancho = x;
    base.meta = x - 300;
    // en la recta final, un punto de control más (nunca más de 3500 px sin uno)
    const ultimo = base.checkpoints[base.checkpoints.length - 1] || 0;
    if (base.meta - ultimo > 3000) base.checkpoints.push(ultimo + 2700);

    if (pista.fija) return prepararNivelFijo({ ...base, abismo: true }, semilla);

    const n = aleatorizarNivel(base, INDICE_TRAMPAS, [], semilla, 9); // (9: todas las trolladas de la primera tanda)
    // los carteles de las bifurcaciones dicen la verdad: siempre están (azar.js a veces quita carteles)
    base.carteles.forEach(c => { if (!n.carteles.some(o => o[0] === c[0] && o[2] === c[2])) n.carteles.push(c); });
    const r = crearAzar((semilla ^ 0x9e3779b9) >>> 0);
    base.atajos.forEach(([a, b]) => ponerAtajo(n, a, b, r));
    return n;
}

// un mapa de la historia como pista: el mismo reparto de trampas que en el nivel (fijo o al azar con
// la semilla de la sala) y la meta antes de la arena del jefe (en la carrera no hay jefe)
// un nivel generado como pista: con sus trampas (la semilla de la sala), sin jefe ni misiones (game.js no
// las pone en la carrera) y cortado: la meta en el primer punto de control pasados LARGO_CARRERA px
function armarDeGenerado(L, semilla) {
    const base = nivelPorIndice(L);
    const n = aleatorizarNivel(base, 5, [], semilla, L);
    const cp = (base.checkpoints || []).find(c => c >= LARGO_CARRERA && c < base.meta - 1500);
    if (!cp) return n;
    const meta = cp + 150, fin = meta + 500;
    const antes = v => (Array.isArray(v) ? v[0] : v) < fin;
    const recortar = k => { if (Array.isArray(n[k])) n[k] = n[k].filter(antes); };
    ['enemigos', 'monedas', 'locuras', 'plantas', 'espiritus', 'cristales', 'corazones', 'criaturas', 'burbujas', 'burbujasFalsas', 'algas', 'rejas',
        'pinchos', 'rocas', 'monedasTrampa', 'estatuasFalsas', 'mordedoras', 'emboscadas', 'carteles', 'cebos'].forEach(recortar);
    return { ...n, meta, ancho: Math.min(n.ancho, fin + 300), checkpoints: (n.checkpoints || []).filter(c => c < meta - 200), sinJefe: true };
}

function armarDeNivel(i, semilla) {
    const nivel = NIVELES[i];
    const n = nivel.fija ? prepararNivelFijo(nivel, semilla)
        : aleatorizarNivel(nivel, i, i === 0 ? [[600, 1106]] : [], semilla, 9); // (el comienzo del nivel 1 está hecho a mano)
    return { ...n, meta: nivel.meta - SIN_ARENA };
}

// trampas ocultas del atajo: una cada 240-380 px (más que la separación mínima: da tiempo a ver la
// señal de la siguiente). Suelo falso (con lava), pinchos que salen del suelo, rocas del techo y
// plantas disfrazadas: todas tienen su pista (senales.js). Ninguna en los primeros 40 px del atajo.
const TIPOS_ATAJO = ['falso', 'falso', 'pinchos', 'roca', 'planta'];
function ponerAtajo(n, a, b, r) {
    n.suelo = [...n.suelo];
    n.falsos = [...(n.falsos || [])];
    n.pinchos = [...(n.pinchos || [])];
    n.rocas = [...(n.rocas || [])];
    n.plantas = [...(n.plantas || [])];
    for (let x = a + 40 + Math.round(r() * 80); x < b - 120; x += 240 + Math.round(r() * 140)) {
        const tipo = TIPOS_ATAJO[Math.floor(r() * TIPOS_ATAJO.length)];
        if (tipo === 'falso') {
            // se parte el suelo firme y en medio queda una losa falsa con lava debajo
            const i = n.suelo.findIndex(([s, e]) => x - 48 > s + 40 && x + 48 < e - 40);
            if (i < 0) continue;
            const [s, e] = n.suelo[i];
            n.suelo.splice(i, 1, [s, x - 48], [x + 48, e]);
            n.falsos.push([x - 48, x + 48]);
        } else if (tipo === 'pinchos') n.pinchos.push([x, 2, true]);
        else if (tipo === 'roca') n.rocas.push(x);
        else n.plantas.push(x);
    }
}
