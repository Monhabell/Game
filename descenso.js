// NIVELES DE DESCENSO: se empieza en la superficie y se BAJA piso por piso, hasta las profundidades.
// Son el nivel 5 de cada mundo (desde el mundo 2): niveles.js llama a nivelDescenso.
//
//   SUPERFICIE   ══════════════════╗ (pozo)
//   LOS SÓTANOS        ╚══════════════════════╗
//   LAS CATACUMBAS                ╚═══════════════════╗
//   LAS GRUTAS                                 ╚══════════════════╗
//   LAS PROFUNDIDADES                                      ╚══ ≈≈ agua ≈≈ ══ lava ══ 🏁 (caverna)
//
// Cada piso es una LOSA (física en game.js: 'losas'; el dibujo, aquí). Al final de cada piso hay un POZO
// (más ancho que un salto: no se puede saltar al otro lado, hay que dejarse caer) y se aterriza en el
// piso de abajo, que sigue hacia la derecha. Detrás del aterrizaje queda un rincón con premios. Así el
// avance siempre va hacia la derecha (los puntos de control, la carrera y la barra de avance sirven igual).
// El motor solo crece hacia ARRIBA desde el suelo (y = 332): la superficie está arriba de todo (y negativa)
// y el piso más hondo es el suelo de siempre (ahí van el agua, la lava, las trampas y la meta).
// Bajo tierra todo queda techado: luz.js lo oscurece como un túnel (las antorchas alumbran).
// Cada piso tiene su nombre, su fondo y sus enemigos; al llegar a uno nuevo se anuncia con la profundidad.
// Puntos de control: uno en cada pozo (reaparece en el piso de abajo: alturaDeReaparicion).

import { SUELO_Y } from "./alcance.js"
import { alFondo } from "./mazmorra.js"
import { mecanicasDe } from "./mecanicas.js"

const S = SUELO_Y;
const H = 300;       // de un piso al de abajo
const G = 40;        // grosor de las losas
const POZO = 210;    // ancho del pozo (más que un salto)
const RINCON = 200;  // lo que el piso de abajo sigue por detrás del pozo
const M_POR_PISO = 25; // metros de profundidad por piso (lo que dice el cartel)

const CAPAS = [
    { nombre: 'LOS SÓTANOS', fondo: 'tile136', tinte: 0x8a7a70 },
    { nombre: 'LAS CATACUMBAS', fondo: 'tile153', tinte: 0x7a7a90, enemigo: 'esqueleto' },
    { nombre: 'LAS GRUTAS', fondo: 'tile153', tinte: 0x8a6a50, enemigo: 'zombie3' },
    { nombre: 'LAS MINAS PERDIDAS', fondo: 'tile136', tinte: 0x9a8a50 },
    { nombre: 'EL ABISMO', fondo: 'tile153', tinte: 0x6a5a8a, enemigo: 'esqueleto' },
];
const FONDO_HONDO = { nombre: 'LAS PROFUNDIDADES', fondo: 'tile153', tinte: 0x4a7a8a };

function azar(semilla) {
    let s = semilla >>> 0 || 1;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const esDescenso = (mundo, enMundo) => mundo >= 2 && enMundo === 5;

// ---------- RETOS de los pisos de arriba ----------
//   🔥 lava      un foso de lava en la losa (con una piedra en el medio, o corto para saltarlo de una)
//   🌋 cascada   lava que cae del techo y se corta cada tanto: hay que pasar cuando se corta (avisa goteando)
//   💧 charco    un pozo de agua en el piso: se nada un tramo (se respira en la superficie)
//   🧱 losas     un puente de losas sobre la lava que se caen al pisarlas: ¡no te detengas!
//   ▲ pinchos   tiras de pinchos que salen y se esconden por turnos (asoman antes de salir)
// La lava, las cascadas y los pinchos van con el reloj (Date.now): en la carrera, igual para todos.
const ANCHO_RETO = {
    lava: d => (d >= 0.8 ? 190 : 300),
    cascada: d => (d >= 0.85 ? 330 : 130),
    charco: () => 420,
    losas: d => 64 * (d >= 0.8 ? 7 : 5),
    pinchos: () => 412,
};
const HONDO_LAVA = 60, HONDO_CHARCO = 130;
const CASCADA = [3600, 1700, 3000]; // [ciclo, cuánto cae, desde cuándo gotea avisando]
const PINCHOS = [2400, 1000, 500];  // [ciclo, cuánto están afuera, cuánto asoman antes]

// cuáles (al azar, con más peso los del tema: en el volcán más lava, en el hielo más agua)
// (sinCharco: hay una sala justo debajo, el charco no cabe · sinHueco: en el suelo de abajo, ningún hueco)
function elegirRetos(r, tema, conTecho, cuantos, { sinCharco = false, sinHueco = false } = {}) {
    const tipos = mecanicasDe(tema).map(m => m.tipo);
    const peso = {
        lava: sinHueco ? 0 : tipos.includes('calor') ? 3 : 1, cascada: conTecho ? (tipos.includes('calor') ? 3 : 1) : 0,
        charco: sinHueco || sinCharco ? 0 : tipos.some(t => t === 'agua' || t === 'hielo') ? 3 : tipos.includes('calor') ? 0.4 : 1,
        losas: sinHueco ? 0 : 1.4, pinchos: 1.2,
    };
    const elegidos = [];
    for (let q = 0; q < cuantos; q++) {
        const total = Object.entries(peso).reduce((s, [t, p]) => s + (elegidos.includes(t) ? p * 0.3 : p), 0);
        let tiro = r() * total;
        const tipo = Object.entries(peso).find(([t, p]) => (tiro -= elegidos.includes(t) ? p * 0.3 : p) < 0)?.[0] || 'pinchos';
        elegidos.push(tipo);
    }
    return elegidos;
}

// arma un reto desde x0 (la física va en el nivel; el dibujo y lo que se mueve, en dibujarDescenso)
function armarReto(n, tipo, x0, ancho, y, techo, d, q) {
    const x1 = x0 + ancho, reto = { tipo, x0, x1, y, techo, desfase: q * 900 + (x0 % 7) * 300 };
    const fosa = hondo => { // (una fosa bajo el hueco: paredes y fondo de roca)
        n.losas.push([x0 - 20, x0, y, hondo + G], [x1, x1 + 20, y, hondo + G], [x0, x1, y + hondo, G]); // (las paredes, a ras del piso)
    };
    if (tipo === 'lava') {
        fosa(HONDO_LAVA);
        if (ancho > 220) n.losas.push([x0 + ancho / 2 - 32, x0 + ancho / 2 + 32, y, G]); // (la piedra del medio)
        reto.hueco = true;
    } else if (tipo === 'charco') {
        fosa(HONDO_CHARCO);
        n.agua.push([x0, x1, y + 10, y + HONDO_CHARCO]);
        n.monedas.push([x0 + ancho / 2 - 30, y + 90], [x0 + ancho / 2, y + 90], [x0 + ancho / 2 + 30, y + 90]);
        reto.hueco = true;
    } else if (tipo === 'losas') {
        fosa(HONDO_LAVA);
        reto.tejas = Array.from({ length: Math.round(ancho / 64) }, (_, m) => x0 + m * 64);
        reto.hueco = true;
    } else if (tipo === 'pinchos') {
        reto.tiras = [0, 1, 2].map(m => x0 + m * 174);
    } else if (tipo === 'cascada') {
        reto.chorros = ancho > 200 ? [x0 + 60, x0 + 270] : [x0 + 65];
    }
    n.retosDescenso.push(reto);
    return reto;
}

// ---------- LAS FORMAS ----------
// Cada descenso tiene una FORMA (van rotando de un mundo al siguiente, así no son todos iguales):
//   escalera  ⬇ bajar piso por piso hacia la derecha hasta las profundidades (la meta, abajo)
//   zigzag    ⬇ los pisos uno sobre otro: uno se camina a la derecha, el de abajo a la izquierda…
//   u         ⬇⬆ IDA Y VUELTA: bajar hasta el fondo (el agua y la lava) y volver a SUBIR a la superficie
//   montana   ⬆⬇ LA MONTAÑA: empezar abajo, subir piso por piso hasta la cumbre y bajar por el otro lado
// El nivel es una lista de SALAS (un tramo de un piso) unidas por POZOS (para bajar: un hueco más ancho que un
// salto) y SUBIDAS (para subir: escalones en zigzag o un ascensor). Los pisos y techos salen de juntar las
// salas: la losa de una línea es el piso de las salas de arriba y el techo de las de abajo, menos los huecos.
// Los puntos de control se activan al TOCARLOS (los caminos vuelven a la izquierda o suben: game.js) y se
// reaparece en su piso (puntosControl: [x, y]).
const FORMAS = ['escalera', 'zigzag', 'u', 'montana'];
const TITULO = { escalera: 'Descenso', zigzag: 'Zigzag', u: 'Ida y vuelta', montana: 'La Montaña' };
const SUBE = 270; // ancho del hueco de una subida
export const formaDescenso = i => FORMAS[Math.floor(i / 10) % FORMAS.length];

// el nivel: i (índice), k (niveles infinitos desde el primero), d (dificultad 0-1), tema, mezcla
export function nivelDescenso({ i, k, d, tema, mezcla, nombre }) {
    const r = azar(i * 7349 + 11);
    const entre = (a, b) => Math.round(a + r() * (b - a));
    const forma = formaDescenso(i);
    let N = k < 200 ? 5 : k < 600 ? 6 : 7;                 // pisos (contando la superficie y el fondo)
    if (forma === 'zigzag' && N % 2 === 0) N++;            // (el piso de abajo tiene que ir a la derecha)
    if (forma === 'u' || forma === 'montana') N = k < 300 ? 4 : 5; // (se recorren dos veces: menos pisos)
    const yDe = l => S - (N - 1 - l) * H;                  // el piso de cada línea (la última es el suelo)
    const n = {
        nombre: String(nombre).replace(/Descenso$/, TITULO[forma]),
        cueva: false, nubes: true, tinte: tema.tinte, mezcla, plantas: [], espiritus: [], // (nubes: se empieza afuera, sin el fondo de cueva)
        suelo: [], lava: [], bloques: [], escaleras: [], enemigos: [], monedas: [], goteros: [], moviles: [], checkpoints: [],
        falsos: [], pinchos: [], bolas: [], emboscadas: [], carcajes: [], corazones: [], cristales: [],
        carteles: [], monedasTrampa: [], rocas: [], estatuasFalsas: [], mordedoras: [], banderasFalsas: [], persecuciones: [],
        plataformas: [], muros: [], antorchas: [], runas: [], losas: [], techos: [],
        agua: [], burbujas: [], criaturas: [], algas: [], corrientes: [], rejas: [], burbujasFalsas: [],
        alto: (N - 1) * H + 260, sinDecorado: true, sinMisiones: true, retosDescenso: [],
    };
    const c = { n, r, entre, d, k, tema, N, yDe, forma, salas: [], huecos: [], puntos: [], ruta: [], flechas: [], caverna: null };
    const capaDe = l => (l === 0 ? { nombre: tema.nombre.toUpperCase(), fondo: null } : l === N - 1 ? FONDO_HONDO : CAPAS[l - 1]);
    c.capaDe = capaDe;

    let fin;
    if (forma === 'escalera') {
        let x = 0;
        for (let l = 0; l < N - 1; l++) {
            const plan = planSala(c, l, { conAbajo: false });
            const x0 = l === 0 ? 0 : x - POZO - RINCON, desde = l === 0 ? 0 : x;
            const p = desde + plan.largo;
            llenarSala(c, sala(c, l, x0, p + POZO), plan, desde + (l === 0 ? 450 : 330), p - 260);
            if (l > 0) rincon(c, l, x0);
            pozo(c, l, p);
            x = p + POZO;
        }
        const x0 = x - POZO - RINCON;
        fin = fondo(c, x, true);
        sala(c, N - 1, x0, fin);
        c.inicio = [90, yDe(0) - 80];
    } else if (forma === 'zigzag') {
        // todos los pisos del mismo ancho, uno sobre otro; el de abajo sigue a la derecha hasta el fondo
        const ancho = entre(1700, 2000) + Math.round(500 * d), X0 = 40, X1 = X0 + ancho;
        for (let l = 0; l < N - 1; l++) {
            const derecha = l % 2 === 0;
            const plan = planSala(c, l, { conAbajo: true, largo: ancho - 2 * POZO - 500 });
            llenarSala(c, sala(c, l, X0, X1), plan, X0 + POZO + 220, X1 - POZO - 220);
            pozo(c, l, derecha ? X1 - POZO : X0, derecha ? 1 : -1);
        }
        fin = fondo(c, X0 + POZO + 120, true, X0);
        sala(c, N - 1, X0, fin);
        c.inicio = [X0 + 90, yDe(0) - 80];
    } else if (forma === 'u') {
        // bajar como la escalera…
        let x = 0;
        for (let l = 0; l < N - 1; l++) {
            const plan = planSala(c, l, { conAbajo: false });
            const x0 = l === 0 ? 0 : x - POZO - RINCON, desde = l === 0 ? 0 : x;
            const p = desde + plan.largo;
            llenarSala(c, sala(c, l, x0, p + POZO), plan, desde + (l === 0 ? 450 : 330), p - 260);
            if (l > 0) rincon(c, l, x0);
            pozo(c, l, p);
            x = p + POZO;
        }
        // …el fondo (sin meta) y volver a subir hasta la superficie: la meta, afuera
        const x0 = x - POZO - RINCON;
        let sube = fondo(c, x, false);
        sala(c, N - 1, x0, sube + SUBE);
        fin = subirHasta(c, N - 1, 0, sube, true);
        c.inicio = [90, yDe(0) - 80];
    } else {
        // la montaña: abajo, subir hasta la cumbre…
        const plan = planSala(c, N - 1, { conAbajo: false, sinHueco: true });
        const sube = 300 + plan.largo;
        llenarSala(c, sala(c, N - 1, 0, sube + SUBE), plan, 450, sube - 200);
        n.suelo.push([0, sube + SUBE]);
        let x = subirHasta(c, N - 1, 0, sube, false);
        // …y bajar por el otro lado hasta las profundidades (la meta, abajo)
        for (let l = 1; l < N - 1; l++) {
            const plan2 = planSala(c, l, { conAbajo: false });
            const x0 = x - POZO - RINCON, p = x + plan2.largo;
            llenarSala(c, sala(c, l, x0, p + POZO), plan2, x + 330, p - 260);
            rincon(c, l, x0);
            pozo(c, l, p);
            x = p + POZO;
        }
        const x0 = x - POZO - RINCON;
        fin = fondo(c, x, true);
        sala(c, N - 1, x0, fin);
        c.inicio = [90, S - 80];
    }
    cerrar(c, fin);
    return n;
}

// los retos y el largo de una sala (antes de saber dónde va)
function planSala(c, l, { conAbajo, sinHueco = false, largo = null }) {
    const techo = l === 0 ? null : c.yDe(l - 1) + G;
    let tipos = elegirRetos(c.r, c.tema, techo != null, 1 + (c.d >= 0.75 ? 1 : 0) + (c.k > 400 && l >= 2 ? 1 : 0), { sinCharco: conAbajo, sinHueco });
    let anchos = tipos.map(t => ANCHO_RETO[t](c.d));
    if (largo != null) while (tipos.length > 1 && anchos.reduce((s, w) => s + w, 0) > largo - 500) { tipos.pop(); anchos.pop(); }
    const suma = anchos.reduce((s, w) => s + w, 0);
    return { tipos, anchos, techo, largo: largo ?? c.entre(1000, 1200) + Math.round(500 * c.d) + suma };
}
const sala = (c, l, x0, x1) => { const s = { l, x0, x1 }; c.salas.push(s); return s; };

// los retos y lo demás (cajones, bloques, ladrillos que caen, enemigos, monedas, antorchas) entre c0 y c1
function llenarSala(c, s, plan, c0, c1) {
    const { n, r, entre, d } = c, y = c.yDe(s.l), techo = plan.techo, capa = c.capaDe(s.l);
    const suma = plan.anchos.reduce((t, w) => t + w, 0), libre = Math.max(0, c1 - c0 - suma);
    let acumulado = 0;
    const zonas = plan.tipos.map((tipo, q) => {
        const x0 = Math.round(c0 + (q + 1) * libre / (plan.tipos.length + 1) + acumulado);
        acumulado += plan.anchos[q];
        const reto = armarReto(n, tipo, x0, plan.anchos[q], y, techo, d, q);
        if (reto.hueco) c.huecos.push({ l: s.l, x0: reto.x0, x1: reto.x1 });
        return reto;
    });
    const cerca = x => zonas.some(z => x > z.x0 - 180 && x < z.x1 + 60);
    let x = c0, cuenta = 0;
    while (x < c1) {
        if (cerca(x) || cerca(x + 140)) { x += 60; continue; }
        const que = r();
        if (que < 0.32) {
            n.losas.push([x, x + 48, y - 48, 48]);
            n.monedas.push([x + 24, y - 80]);
        } else if (que < 0.52) {
            n.bloques.push([x, y - 112, r() < 0.7 ? '??' : '?E']);
        } else if (que < 0.66 && techo != null && d > 0.65) {
            n.bloques.push([x, techo + 16, 'C']); // (se cae cuando pasas por debajo)
        } else {
            for (let m = 0; m < 4; m++) n.monedas.push([x + m * 30, y - 30 - Math.round(Math.sin(m / 3 * Math.PI) * 30)]);
        }
        if (cuenta++ % 2 === 1 || d > 0.85) n.enemigos.push([x + 140, y - 2, capa.enemigo]);
        if (techo != null && cuenta % 2 === 0) n.antorchas.push([x + 60, y - 100]);
        x += entre(260, 380) - Math.round(60 * d);
    }
}
// el rincón detrás de un aterrizaje: premios
function rincon(c, l, x0) {
    const y = c.yDe(l);
    c.n.monedas.push([x0 + 40, y - 30], [x0 + 80, y - 30], [x0 + 120, y - 30]);
    if (c.r() < 0.35) c.n.cristales.push([x0 + 60, y - 60]);
}
// un pozo en el piso de la línea l, desde x (para bajar a la línea l + 1)
function pozo(c, l, x, lado = 1) {
    const y = c.yDe(l);
    c.huecos.push({ l, x0: x, x1: x + POZO });
    c.n.carteles.push([lado > 0 ? x - 70 : x + POZO + 70, y - 40, '⬇']);
    c.flechas.push([x + POZO / 2, y + 40, '⬇']);
    if (c.d >= 0.9 && l % 2 === 1) c.n.espiritus.push([x + POZO / 2, y + H / 2]);
    c.ruta.push([x + POZO / 2, y]);
    c.puntos.push([x + Math.round(POZO / 2), c.yDe(l + 1)]); // (punto de control: abajo, donde se aterriza)
}
// una subida desde la línea l a la l - 1, en x (escalones en zigzag o un ascensor)
function subida(c, l, x) {
    const y = c.yDe(l), arriba = c.yDe(l - 1);
    c.huecos.push({ l: l - 1, x0: x, x1: x + SUBE });
    // (ascensor: abajo casi a ras del suelo; arriba, a ras del piso de arriba y pegado a su borde: se sale caminando)
    if (c.r() < 0.45) c.n.moviles.push([x + SUBE - 64, y + 4, 'y', H - 12, 70]);
    else c.n.plataformas.push([x + 10, y - 95, 90], [x + SUBE - 100, y - 190, 90]);
    c.n.carteles.push([x - 60, y - 40, '⬆']);
    c.flechas.push([x + SUBE / 2, y - 150, '⬆']);
    c.ruta.push([x + SUBE / 2, y]);
    c.puntos.push([x + SUBE + 90, arriba]); // (punto de control: arriba, donde se llega)
}
// subir desde la línea 'desde' hasta la 'hasta' empezando en x: una sala por piso (con su subida al
// principio); la última, la superficie, con la meta si conMeta. Devuelve el final (x)
function subirHasta(c, desde, hasta, x, conMeta) {
    let sube = x;
    for (let l = desde - 1; l >= hasta; l--) {
        subida(c, l + 1, sube);
        const plan = planSala(c, l, { conAbajo: false });
        const c0 = sube + SUBE + 200, ultima = l === hasta;
        const largo = plan.largo + (ultima && conMeta ? 700 : 0);
        const fin = sube + SUBE + largo;
        llenarSala(c, sala(c, l, sube, ultima ? fin : fin + SUBE), plan, c0, fin - (ultima && conMeta ? 900 : 260));
        if (ultima) {
            if (conMeta) { c.meta = [fin - 350, c.yDe(l)]; return fin; }
            // (la cumbre de la montaña: termina en un pozo para bajar por el otro lado)
            c.salas.at(-1).x1 = fin + POZO;
            pozo(c, l, fin);
            return fin + POZO;
        }
        sube = fin;
    }
    return sube;
}

// las profundidades desde x: el estanque (orillas, rocas bajo el agua) y el río de lava; con la meta al
// final (caverna) o, si no, termina donde empieza la subida. Devuelve el final (x)
function fondo(c, desde, conMeta, piso0 = desde - POZO - RINCON) {
    const { n, entre, d, k, N } = c;
    const sup = S - 150, techo = c.yDe(N - 2) + G;
    const orilla = sup - 10, ESCALON = 100, ORILLA = 220;
    const escalon0 = desde + 300;
    const agua0 = escalon0 + ESCALON + ORILLA, rocas = 3 + Math.round(2 * d);
    const agua1 = agua0 + 140 + rocas * 270;
    n.agua.push([agua0, agua1, sup]);
    for (let m = 0; m < rocas; m++) {
        const rx = agua0 + 120 + m * 270;
        n.losas.push([rx, rx + 110, techo, sup + 70 - techo]);
        n.burbujas.push(rx + 200);
        if (m % 2 === 1) n.criaturas.push([rx + 190, 'pez', S - 60]);
        n.monedas.push([rx + 55, S - 40]);
    }
    // las orillas (de roca maciza hasta el suelo) y sus escalones
    n.losas.push([escalon0, escalon0 + ESCALON, S - 80, 140], [escalon0 + ESCALON, agua0, orilla, S + 60 - orilla]);
    n.losas.push([agua1, agua1 + ORILLA, orilla, S + 60 - orilla], [agua1 + ORILLA, agua1 + ORILLA + ESCALON, S - 80, 140]);
    n.aireMs = Math.max(7000, 10000 - k * 3);
    let x = agua1 + ORILLA + ESCALON + 300;
    c.ruta.push([agua0, S]);
    c.puntos.push([x - 200, S]);
    // el río de lava: huecos con una plataforma en el medio (los más cortos, con bolas de fuego)
    const huecos = (conMeta ? 3 : 2) + Math.round(2 * d);
    n.suelo.push([piso0, escalon0], [agua0, agua1]); // (bajo las orillas no hay suelo: ahí no van trampas)
    let inicioTramo = agua1 + ORILLA + ESCALON;
    for (let m = 0; m < huecos; m++) {
        const conPlataforma = m % 2 === 0;
        const ancho = conPlataforma ? 300 : 190;
        n.suelo.push([inicioTramo, x]);
        n.lava.push([x, x + ancho]);
        if (conPlataforma) n.plataformas.push([x + ancho / 2 - 48, S - 96, 96]);
        else n.bolas.push([x + ancho / 2, 2600 + m * 300]);
        if (m === 1) n.enemigos.push([x + ancho + 160, S - 2]);
        inicioTramo = x + ancho;
        x = inicioTramo + entre(260, 420);
    }
    if (!conMeta) {
        // (sigue la subida: el suelo llega hasta debajo de ella)
        n.suelo.push([inicioTramo, x + SUBE]);
        c.puntos.push([x - 120, S]);
        return x;
    }
    // la caverna del final (sin techo bajo) y la meta
    const caverna = x;
    x += 900;
    c.meta = [x, S];
    const fin = x + 500;
    n.suelo.push([inicioTramo, fin]);
    c.caverna = [caverna, fin];
    c.huecos.push({ l: N - 2, x0: caverna, x1: fin });
    n.corazones.push([caverna + 300, S - 60]);
    return fin;
}

// junta las salas: las losas de cada línea (pisos y techos, menos los huecos), las paredes de las puntas
// de cada sala, el inicio, la meta y los puntos de control
function cerrar(c, fin) {
    const { n, N, yDe } = c;
    const juntar = tramos => {
        const t = [...tramos].sort((a, b) => a[0] - b[0]), out = [];
        t.forEach(([a, b]) => { if (out.length && a <= out.at(-1)[1]) out.at(-1)[1] = Math.max(out.at(-1)[1], b); else out.push([a, b]); });
        return out;
    };
    const restar = (tramos, huecos) => tramos.flatMap(([a, b]) => {
        let trozos = [[a, b]];
        huecos.forEach(({ x0, x1 }) => { trozos = trozos.flatMap(([p, q]) => (x1 <= p || x0 >= q ? [[p, q]] : [[p, x0], [x1, q]].filter(([u, v]) => v - u > 2))); });
        return trozos;
    });
    for (let l = 0; l < N - 1; l++) {
        const tramos = juntar(c.salas.filter(s => s.l === l || s.l === l + 1).map(s => [s.x0, s.x1]));
        restar(tramos, c.huecos.filter(h => h.l === l)).forEach(([a, b]) => n.losas.push([a, b, yDe(l), G]));
    }
    // paredes en las puntas de cada sala (de su techo a su piso)
    c.salas.forEach(s => {
        const arriba = s.l === 0 ? yDe(0) - 220 : yDe(s.l - 1) + G, alto = yDe(s.l) - arriba + (s.l === N - 1 ? 60 : G);
        const enCaverna = x => c.caverna && x >= c.caverna[0] - 1;
        if (!enCaverna(s.x0)) n.losas.push([s.x0 - 40, s.x0, arriba, alto]);
        n.losas.push([s.x1, s.x1 + 40, arriba, alto]);
    });
    n.suelo = juntar(n.suelo);
    n.ancho = fin + 60;
    n.meta = c.meta[0];
    n.metaY = c.meta[1];
    n.inicio = c.inicio;
    n.carteles.push([c.inicio[0] + 170, c.inicio[1] + 30, n.nombre.includes('Montaña') ? '⬆ LA MONTAÑA' : '⬇ DESCENSO']);
    n.puntosControl = c.puntos;
    n.checkpoints = c.puntos.map(p => p[0]);
    n.descenso = {
        forma: c.forma, N, G, POZO, fin: n.ancho, caverna: c.caverna, retos: n.retosDescenso, flechas: c.flechas,
        salas: c.salas.map(s => ({ ...s, capa: c.capaDe(s.l) })), lineas: Array.from({ length: N }, (_, l) => yDe(l)),
        capas: Array.from({ length: N }, (_, l) => c.capaDe(l)),
        ruta: [c.inicio, ...c.ruta, c.meta],
    };
}

// donde reaparece en un punto de control (su piso); null: en el suelo
export function alturaDeReaparicion(nivel, x) {
    return nivel.puntosControl?.find(p => p[0] === x)?.[1] ?? null;
}
// cuánto del recorrido se hizo (0-1), siguiendo la ruta (los caminos vuelven a la izquierda o suben)
export function progresoEnRuta(ruta, x, y) {
    let total = 0, mejor = Infinity, hecho = 0;
    const largos = ruta.slice(1).map((p, q) => Math.hypot(p[0] - ruta[q][0], (p[1] - ruta[q][1]) * 3));
    const suma = largos.reduce((s, v) => s + v, 0) || 1;
    ruta.slice(1).forEach((b, q) => {
        const a = ruta[q], dx = b[0] - a[0], dy = (b[1] - a[1]) * 3;
        const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * 3 * dy) / (dx * dx + dy * dy || 1)));
        const dist = Math.hypot(a[0] + dx * t - x, (a[1] - y) * 3 + dy * t);
        if (dist < mejor) { mejor = dist; hecho = total + largos[q] * t; }
        total += largos[q];
    });
    return hecho / suma;
}

// ---------- dibujo ----------
const ESCALA = 2 / 3;
function pared(scene, x0, y0, x1, y1, tile, prof, tinte) {
    if (x1 <= x0 || y1 <= y0) return null;
    let t;
    if (scene.textures.exists('cr_' + tile)) t = scene.add.tileSprite(x0, y0, x1 - x0, y1 - y0, 'cr_' + tile).setOrigin(0).setTileScale(ESCALA);
    else t = scene.add.rectangle(x0, y0, x1 - x0, y1 - y0, 0x3a3440).setOrigin(0);
    t.setDepth(prof);
    if (tinte != null) t.setTint(tinte);
    if (prof < 1) alFondo(scene, t);
    return t;
}

export function dibujarDescenso(scene, nivel) {
    const dsc = nivel.descenso;
    scene.descenso = null; // (la escena se reusa al reaparecer: se arma de nuevo)
    if (!dsc) return;
    const { lineas, capas, salas, G: grosor, caverna, fin, N } = dsc;
    // (el piso donde empieza: la superficie o, en la montaña, el fondo)
    const inicial = Math.max(0, lineas.findIndex(y => y >= (nivel.inicio?.[1] ?? -1e9) + 40));
    scene.descenso = { lineas, capas, vista: inicial };
    const tonoDe = l => {
        const oscuro = Math.max(0.35, 1 - l * 0.12), t = Phaser.Display.Color.ValueToColor(capas[l].tinte ?? 0x8a7a70);
        return Phaser.Display.Color.GetColor(t.red * oscuro, t.green * oscuro, t.blue * oscuro);
    };
    // bajo tierra todo es roca; encima, el fondo de cada sala (por donde se camina), más oscuro cuanto más hondo
    pared(scene, 0, lineas[0] + grosor - 4, fin, SUELO_Y + 60, 'tile93', 0.05, 0x2a2436);
    salas.forEach(s => {
        if (s.l === 0) return; // (la superficie: el cielo)
        pared(scene, s.x0, lineas[s.l - 1] + grosor - 4, s.x1, lineas[s.l] + grosor + (s.l === N - 1 ? 60 : 0), capas[s.l].fondo, 0.05, tonoDe(s.l));
    });
    if (caverna) pared(scene, caverna[0], lineas[Math.max(0, N - 3)] + grosor - 4, caverna[1], SUELO_Y + 60, capas[N - 1].fondo, 0.05, tonoDe(N - 1));
    // las losas (pisos, paredes, cajones, rocas del agua, orillas): el relleno y el borde de arriba
    (nivel.losas || []).forEach(([x0, x1, arriba, alto]) => {
        const esPiso = alto === grosor;
        const esCajon = x1 - x0 === 48 && alto === 48;
        if (esCajon) {
            if (scene.textures.exists('cr_box')) scene.add.image(x0 + 24, arriba + 48, 'cr_box').setOrigin(0.5, 1).setDisplaySize(48, 48).setDepth(1);
            else pared(scene, x0, arriba, x1, arriba + alto, 'tile93', 1);
            return;
        }
        pared(scene, x0, arriba + (esPiso ? 10 : 0), x1, arriba + alto, 'tile93', 0.9, esPiso ? 0x9a90a8 : 0x5a5266);
        pared(scene, x0, arriba, x1, arriba + 16, arriba <= lineas[0] ? 'tile9' : 'tile75', 1.1);
    });
    // la caverna del final: un brillo de lava
    if (caverna) scene.add.rectangle((caverna[0] + caverna[1]) / 2, SUELO_Y - 100, caverna[1] - caverna[0], 260, 0xff5020, 0.08).setDepth(0.06);
    // pozos y subidas: una flecha que se mueve (⬇ baja · ⬆ sube)
    (dsc.flechas || []).forEach(([x, y, f]) => {
        const flecha = scene.add.text(x, y, f, { fontSize: '22px', color: f === '⬆' ? '#7fe0ff' : '#ffd27a' }).setOrigin(0.5).setDepth(2).setAlpha(0.8);
        scene.tweens.add({ targets: flecha, y: y + (f === '⬆' ? -50 : 50), alpha: 0.2, repeat: -1, duration: 900 });
    });
    scene.descenso.retos = (dsc.retos || []).map(r => prepararReto(scene, r));
}

// ---------- los retos en el juego ----------
let api = null;
export const configurarDescenso = a => { api = a; }; // { killgesi(scene, causa, origenX) }

function texturasRetos(scene) {
    if (scene.textures.exists('dsc_chorro')) return;
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xd9341b).fillRect(0, 0, 28, 24);
    g.fillStyle(0xff7a1a).fillRect(3, 0, 22, 24);
    g.fillStyle(0xffc23a).fillRect(8, 2, 4, 9).fillRect(16, 12, 4, 8).fillRect(11, 15, 3, 6);
    g.fillStyle(0xfff0a0).fillRect(9, 4, 2, 4).fillRect(17, 14, 2, 3);
    g.generateTexture('dsc_chorro', 28, 24);
    g.clear();
    g.fillStyle(0xff3a10).fillRect(0, 0, 32, 128);
    g.fillStyle(0xff8a20).fillRect(0, 0, 32, 10);
    g.fillStyle(0xffd060).fillRect(4, 2, 8, 3).fillRect(20, 4, 6, 2);
    g.generateTexture('dsc_lava', 32, 128); // (más alta que la fosa: la franja clara no se repite)
    g.destroy();
}
// la lava de una fosa: ondulando, con brillo
function lavaEnFosa(scene, x0, x1, y) {
    const lava = scene.add.tileSprite(x0, y + 18, x1 - x0, HONDO_LAVA + G - 18, 'dsc_lava').setOrigin(0).setDepth(1.15); // (tapa el borde del fondo de la fosa)
    scene.lavasFluyen = (scene.lavasFluyen || []).filter(t => t.active); // (al reaparecer quedan las de antes, ya destruidas)
    scene.lavasFluyen.push(lava);
    scene.add.image((x0 + x1) / 2, y + 20, 'brillo').setDepth(41).setScale((x1 - x0) / 90, 0.9).setTint(0xff6a1a).setAlpha(0.3).setBlendMode('ADD');
}

function prepararReto(scene, r) {
    texturasRetos(scene);
    const e = { ...r };
    if (r.tipo === 'lava') lavaEnFosa(scene, r.x0, r.x1, r.y);
    if (r.tipo === 'losas') {
        lavaEnFosa(scene, r.x0, r.x1, r.y);
        // las losas del puente: física propia (se caen) y su dibujo
        e.tejas = r.tejas.map(x => {
            const cuerpo = scene.floor.create(x, r.y, 'suelo' + scene.sufijo).setOrigin(0, 0).setScale(64 / 128, G / 32).refreshBody().setVisible(false);
            const dibujo = [pared(scene, x + 1, r.y + 10, x + 63, r.y + 30, 'tile93', 1.05, 0x8a7a70), pared(scene, x + 1, r.y, x + 63, r.y + 16, 'tile75', 1.1, 0xc0a890)]
                .filter(Boolean);
            // (grietas: se ve que son flojas)
            const grieta = scene.add.text(x + 32, r.y + 8, '⟋', { fontSize: '12px', color: '#3a2a20' }).setOrigin(0.5).setDepth(1.12);
            return { x, cuerpo, dibujo: [...dibujo, grieta], pisada: 0, cae: 0 };
        });
    }
    if (r.tipo === 'pinchos') {
        e.tiras = r.tiras.map((x, m) => ({
            x, desfase: m * (PINCHOS[0] / 2),
            puas: [0, 1].map(p => scene.add.image(x + p * 32, r.y + 34, 'pincho').setOrigin(0, 1).setDepth(1)),
        }));
    }
    if (r.tipo === 'cascada') {
        e.chorros = r.chorros.map((cx, m) => ({
            cx, desfase: r.desfase + m * 1300,
            chorro: scene.add.tileSprite(cx, r.techo, 28, r.y - r.techo, 'dsc_chorro').setOrigin(0.5, 0).setDepth(34.2),
            hilo: scene.add.tileSprite(cx, r.techo, 6, r.y - r.techo, 'dsc_chorro').setOrigin(0.5, 0).setDepth(34.2).setAlpha(0.7),
            brillo: scene.add.image(cx, r.y - 20, 'brillo').setDepth(41).setScale(0.9, 1.6).setTint(0xff6a1a).setAlpha(0.35).setBlendMode('ADD'),
            boca: scene.add.rectangle(cx, r.techo + 4, 40, 10, 0x2a1a14).setDepth(34.3),
        }));
    }
    return e;
}

// cada fotograma: lo que se mueve (siempre) y lo que le pasa al personaje (vivo)
function actualizarRetos(scene) {
    const d = scene.descenso, g = scene.mascotaGesi, ahora = scene.time.now, reloj = Date.now();
    const b = g?.body, vivo = b && !g.isDead && !scene.nivelTerminado;
    const pisando = vivo && (b.blocked.down || b.touching.down);
    const sobre = (x0, x1) => b.right > x0 + 4 && b.left < x1 - 4;
    for (const r of d.retos || []) {
        if (vivo && Math.abs(b.center.x - (r.x0 + r.x1) / 2) > 900) {
            // (lejos: solo las cascadas siguen su ciclo, para que no salten de golpe)
            if (r.tipo !== 'cascada') continue;
        }
        if (r.tipo === 'lava' || r.tipo === 'losas') {
            // caer a la lava de la fosa
            if (vivo && sobre(r.x0, r.x1) && b.bottom > r.y + 16 && b.bottom < r.y + HONDO_LAVA + 10) api?.killgesi(scene, 'caida', b.center.x);
        }
        if (r.tipo === 'losas') {
            r.tejas.forEach(t => {
                if (!t.cae && !t.pisada && pisando && Math.abs(b.bottom - r.y) < 6 && sobre(t.x, t.x + 64)) {
                    t.pisada = ahora;
                    scene.tweens.add({ targets: t.dibujo, x: '+=2', yoyo: true, repeat: 3, duration: 45 });
                    scene.sound.play('romper', { volume: 0.25, rate: 1.4 });
                }
                if (t.pisada && !t.cae && ahora > t.pisada + 380) {
                    t.cae = ahora;
                    t.cuerpo.body.enable = false;
                    scene.tweens.add({ targets: t.dibujo, y: '+=90', alpha: 0, angle: 12, duration: 500, ease: 'Quad.in' });
                }
                if (t.cae && ahora > t.cae + 5000) { // (vuelve a aparecer, por si hay que intentarlo otra vez)
                    t.cae = 0; t.pisada = 0;
                    t.cuerpo.body.enable = true;
                    t.dibujo.forEach((o, m) => { scene.tweens.killTweensOf(o); o.setAlpha(1).setAngle(0); o.y = m === 0 ? r.y + 10 : m === 1 ? r.y : r.y + 8; });
                }
            });
        }
        if (r.tipo === 'pinchos') {
            r.tiras.forEach(t => {
                const k = (reloj + t.desfase) % PINCHOS[0];
                const afuera = k < PINCHOS[1], asoma = k > PINCHOS[0] - PINCHOS[2];
                const yy = afuera ? r.y : asoma ? r.y + 20 : r.y + 34;
                // (se recortan: solo se ve lo que sale por encima del piso)
                t.puas.forEach(p => { p.y += (yy - p.y) * 0.5; p.setCrop(0, 0, p.width, Math.max(0, r.y - (p.y - p.height))); });
                if (afuera && pisando && Math.abs(b.bottom - r.y) < 6 && sobre(t.x, t.x + 64)) api?.killgesi(scene, 'trampa', t.x + 32);
            });
        }
        if (r.tipo === 'cascada') {
            r.chorros.forEach(c => {
                const k = (reloj + c.desfase) % CASCADA[0];
                const cae = k < CASCADA[1], gotea = k > CASCADA[2];
                c.chorro.setVisible(cae);
                c.hilo.setVisible(gotea && !cae).setAlpha(0.35 + 0.35 * Math.abs(Math.sin(reloj / 90)));
                c.chorro.tilePositionY = -reloj * 0.25;
                c.hilo.tilePositionY = -reloj * 0.12;
                c.brillo.setAlpha(cae ? 0.45 : gotea ? 0.2 : 0.06);
                if (cae && vivo && Math.abs(b.center.x - c.cx) < 14 + b.halfWidth * 0.6 && b.top < r.y && b.bottom > r.techo) {
                    api?.killgesi(scene, 'trampa', c.cx);
                }
            });
        }
    }
}

// al llegar a un piso nuevo: su nombre y la profundidad, en un cartel propio arriba (no lo tapan los
// otros mensajes, como el del punto de control del pozo)
function cartelPiso(scene, nombre, metros, sube) {
    scene.cartelPiso?.destroy();
    const t = scene.cartelPiso = scene.add.text(395, 92, `${sube ? '⬆' : '⬇'} ${nombre}
${metros ? `${metros} m bajo tierra` : 'afuera'}`, {
        fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: sube ? '#7fe0ff' : '#ffd27a', stroke: '#000', strokeThickness: 5,
        align: 'center', lineSpacing: 8,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);
    scene.tweens.add({ targets: t, alpha: 1, y: 100, duration: 300 });
    scene.tweens.add({ targets: t, alpha: 0, delay: 2600, duration: 600, onComplete: () => t.destroy() });
}
export function actualizarDescenso(scene) {
    const d = scene.descenso, g = scene.mascotaGesi;
    if (!d) return;
    actualizarRetos(scene);
    if (!g?.body || g.isDead) return;
    const pie = g.body.bottom;
    // el piso donde está: más de 150 px bajo la línea de arriba (así nadar en un charco o caer a una fosa
    // no cuenta como otro piso); se avisa al llegar a uno distinto (bajando o subiendo)
    let j = 0;
    d.lineas.forEach((y, l) => { if (l > 0 && pie > d.lineas[l - 1] + 150) j = l; });
    if (j === d.vista) return;
    const sube = j < d.vista;
    d.vista = j;
    cartelPiso(scene, d.capas[j].nombre, j * M_POR_PISO, sube);
}
