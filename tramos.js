// Piezas de nivel reutilizables ("tramos"). Cada una devuelve sus datos en coordenadas
// RELATIVAS (x = 0 al empezar) con el mismo formato que los niveles (ver niveles.js), más 'ancho'.
// Se usan para alargar los niveles hechos a mano (extender) y en el generador de niveles.
//
// Las medidas de la torre, los puentes y la runa son las que se probaron con los tres
// personajes (subiendo, cruzando y bajando con la física real del juego).

export const SUELO_Y = 332;
export const TECHO_TUNEL = 196; // altura del techo de los túneles (quedan 136 px: se salta poco)

const fila = (x, y, n, sep = 32) => Array.from({ length: n }, (_, i) => [x + i * sep, y]);

// llano: suelo firme con monedas y, si se pide, algunos enemigos
export function tramoLlano(largo, { enemigos = 0 } = {}) {
    return {
        ancho: largo,
        suelo: [[0, largo]],
        monedas: fila(120, 300, Math.min(4, Math.floor(largo / 120))),
        enemigos: Array.from({ length: enemigos }, (_, i) => Math.round(largo * (i + 1) / (enemigos + 1))),
    };
}

// túnel: un techo de roca baja; antorchas en la pared, monedas y enemigos (sin trampas de suelo:
// ver azar.js). Obliga a pelear y moverse con poco espacio para saltar
export function tramoTunel(largo, { enemigos = 2 } = {}) {
    const antorchas = [];
    for (let x = 130; x < largo - 60; x += 260) antorchas.push([x, TECHO_TUNEL + 44]);
    return {
        ancho: largo,
        suelo: [[0, largo]],
        techos: [[0, largo, TECHO_TUNEL]],
        antorchas,
        monedas: fila(90, 300, Math.floor((largo - 120) / 64), 64),
        enemigos: Array.from({ length: enemigos }, (_, i) => Math.round(largo * (i + 1) / (enemigos + 1))),
    };
}

// ascensor mirador: un primer ascensor corto (opcional) que sube a una cornisa con premio
export function tramoAscensorMirador() {
    return {
        ancho: 560,
        suelo: [[0, 560]],
        // el ascensor descansa en el suelo (nadie puede quedar debajo) y sube hasta y = 80 (se pisa en 64)
        moviles: [[160, 316, 'y', 236, 50]],
        plataformas: [[230, 64, 200]],
        cristales: [[330, 20]],
        monedas: fila(250, 30, 3),
    };
}

// cornisa secreta: de una fila de bloques se sube a una cornisa y de ahí a otra más alta con premio
export function tramoCornisaSecreta() {
    return {
        ancho: 640, alto: 150,
        suelo: [[0, 640]],
        bloques: [[120, 232, 'B?B']],
        plataformas: [[260, 120, 140], [440, 24, 120]],
        corazones: [[500, -20]],
        cristales: [[470, -20]],
        posiblesMimicos: [[470, -20]], // a veces el cristal de la cima es un mímico (azar.js)
        monedas: fila(280, 85, 3),
    };
}

// torre: un muro corta el paso; se sube en zigzag por la izquierda y se baja por la derecha
export function tramoTorre(pasos) {
    const t = { ancho: 750, alto: 96 * pasos + 120, suelo: [[0, 750]], plataformas: [], muros: [], antorchas: [], cristales: [], monedas: [] };
    for (let k = 1; k <= pasos; k++) {
        const izq = k % 2 === 1;
        t.plataformas.push([izq ? 40 : 250, SUELO_Y - 96 * k, izq ? 120 : 130]);
        if (!izq) t.monedas.push(...fila(265, SUELO_Y - 96 * k - 35, 3));
    }
    const cima = SUELO_Y - 96 * pasos - 16;
    t.muros.push([390, cima, 90]);
    t.antorchas.push([376, SUELO_Y - 130], [376, cima + 110]);
    t.cristales.push([435, cima - 40]);
    return t;
}

// puentes altos: un ascensor sube a puentes colgantes sobre un lago de lava (no hay ruta por abajo)
export function tramoPuentesAltos() {
    const l = 400;
    return {
        ancho: 1000, alto: 450,
        suelo: [[0, 400]],
        lava: [[l, l + 600]],
        moviles: [[340, 316, 'y', 396, 55], [l + 390, -174, 'x', 120, 60]], // (el ascensor descansa en el suelo)
        plataformas: [[l + 20, -96, 150], [l + 200, -150, 120], [l + 600, -150, 140]],
        monedas: [...fila(l + 35, -130, 4), ...fila(l + 215, -185, 3), ...fila(l + 615, -185, 3)],
        cristales: [[l + 450, -240]],
    };
}

// doble camino: el mismo lago de lava con DOS rutas: abajo una plataforma móvil (directa),
// arriba el ascensor y los puentes colgantes (más larga, con premio)
export function tramoDobleCamino() {
    const t = tramoPuentesAltos();
    // ruta baja: cruza el lago de orilla a orilla (la orilla de enfrente la pone la pieza siguiente)
    t.moviles.push([494, 300, 'x', 412, 80]);
    return t;
}

// abismo rúnico: un foso de lava imposible de saltar; golpear la piedra rúnica desde abajo
// hace aparecer tres losas (antes se ven como contornos fantasma: la pista)
export function tramoAbismoRunico() {
    const l = 450, ancho = 440;
    return {
        ancho: l + ancho,
        suelo: [[0, 450]],
        lava: [[l, l + ancho]],
        runas: [[300, 232, [[l + 40, 300, 96], [l + 172, 284, 96], [l + 304, 300, 96]]]],
        monedas: [[l + 190, 250], [l + 220, 230], [l + 250, 250]],
    };
}

// ---------- Bosque (nivel 1) ----------

// ramas sobre la lava: tres ramas de madera que se doblan al pisarlas y se rompen si te quedas
// (bosque.js). Huecos de 70-80 px entre ramas y alturas casi iguales: lo difícil es no detenerse
export function tramoRamas() {
    const l = 150, hueco = 560;
    return {
        ancho: l + hueco,
        suelo: [[0, l]],
        lava: [[l, l + hueco]],
        plataformas: [[l + 40, 270, 110, 'rama'], [l + 230, 250, 110, 'rama'], [l + 410, 270, 110, 'rama']],
        monedas: [...fila(l + 70, 235, 2), ...fila(l + 260, 215, 2), ...fila(l + 440, 235, 2)],
    };
}

// Árbol Anciano (el momento ¡wow! del Bosque): la torre de siempre, pero el muro es un tronco
// gigante con cara y los escalones son ramas. Arriba hay premio... y el árbol despierta
export function tramoArbolAnciano() {
    const t = tramoTorre(4);
    t.plataformas = t.plataformas.map(p => [...p, 'rama']);
    t.muros = t.muros.map(m => [...m, 'tronco']);
    t.arbolesGigantes = t.muros.map(([x, arriba, ancho]) => [x, arriba, ancho]);
    t.antorchas = []; // en el bosque no hay antorchas
    const [mx, arriba] = t.muros[0];
    t.corazones = [[mx + 70, arriba - 40]];
    return t;
}

// ---------- Colocar piezas en un nivel ----------

// campos con x en la primera posición ([x, ...]) y campos que son solo x
const CON_X = ['bloques', 'monedas', 'carcajes', 'corazones', 'cristales', 'carteles', 'monedasTrampa', 'mordedoras',
    'espiritus', 'pinchos', 'bolas', 'goteros', 'moviles', 'escaleras', 'plataformas', 'muros', 'antorchas', 'posiblesMimicos', 'arbolesGigantes'];
const SOLO_X = ['plantas', 'rocas', 'estatuasFalsas', 'banderasFalsas', 'persecuciones', 'checkpoints'];
const RANGOS = ['suelo', 'lava', 'falsos'];

const moverEnemigo = (e, d) => Array.isArray(e) ? [e[0] + d, ...e.slice(1)] : e + d;

// copia los datos de un tramo al nivel, desplazados a la posición x
export function colocar(n, t, x) {
    RANGOS.forEach(k => (t[k] || []).forEach(([a, b]) => (n[k] = n[k] || []).push([a + x, b + x])));
    CON_X.forEach(k => (t[k] || []).forEach(([px, ...resto]) => (n[k] = n[k] || []).push([px + x, ...resto])));
    SOLO_X.forEach(k => (t[k] || []).forEach(px => (n[k] = n[k] || []).push(px + x)));
    (t.enemigos || []).forEach(e => (n.enemigos = n.enemigos || []).push(moverEnemigo(e, x)));
    (t.techos || []).forEach(([a, b, abajo]) => (n.techos = n.techos || []).push([a + x, b + x, abajo]));
    (t.runas || []).forEach(([rx, ry, losas]) => (n.runas = n.runas || []).push([rx + x, ry, losas.map(([lx, ...r]) => [lx + x, ...r])]));
    (t.emboscadas || []).forEach(([a, xs]) => (n.emboscadas = n.emboscadas || []).push([a + x, xs.map(v => v + x)]));
    if (t.alto) n.alto = Math.max(n.alto || 0, t.alto);
}

// alarga un nivel hecho a mano: abre un hueco en x (todo lo que está a la derecha se corre)
// y coloca ahí las piezas en orden. Pone un punto de control al empezar cada pieza larga.
export function extender(nivel, x, piezas) {
    const d = piezas.reduce((s, t) => s + t.ancho, 0);
    const mover = v => v >= x ? v + d : v;
    RANGOS.forEach(k => {
        nivel[k] = (nivel[k] || []).flatMap(([a, b]) => a < x && b > x ? [[a, x], [x + d, b + d]] : [[mover(a), mover(b)]]);
    });
    CON_X.forEach(k => { nivel[k] = (nivel[k] || []).map(([px, ...resto]) => [mover(px), ...resto]); });
    SOLO_X.forEach(k => { nivel[k] = (nivel[k] || []).map(mover); });
    nivel.enemigos = (nivel.enemigos || []).map(e => Array.isArray(e) ? [mover(e[0]), ...e.slice(1)] : mover(e));
    nivel.techos = (nivel.techos || []).map(([a, b, abajo]) => [mover(a), mover(b), abajo]);
    nivel.runas = (nivel.runas || []).map(([rx, ry, losas]) => [mover(rx), ry, losas.map(([lx, ...r]) => [mover(lx), ...r])]);
    nivel.emboscadas = (nivel.emboscadas || []).map(([a, xs]) => [mover(a), xs.map(mover)]);
    nivel.meta += d;
    nivel.ancho += d;
    let px = x;
    piezas.forEach(t => {
        colocar(nivel, t, px);
        if (t.ancho >= 600) nivel.checkpoints.push(px + 60);
        px += t.ancho;
    });
    nivel.checkpoints.sort((a, b) => a - b);
    return nivel;
}
