// Nivel 1: Las Afueras de Albora (estilo de las Criptas: ladrillo medieval de assets/criptas).
//
//   CIELO                                  ☁️ tablas ☁️ ⭐ (secreto, desde la muralla)
//   SALIDA (casa en ruinas) → 🪦 CEMENTERIO → 🏰 MURALLA (se sube por escalones) → ⬇ BODEGA (techada,
//   se baja de la muralla) → FOSO DE LAVA → 🚩 meta falsa → antesala → Rey Troll → faro
//
// Es un nivel de TROLLEO al estilo Cat Mario: lo que parece seguro no lo es. Las trampas de siempre se
// reparten al azar en cada intento (azar.js, con las reglas del nivel 1) y además hay algunas puestas a
// mano que son la "firma" del nivel: el bloque invisible sobre el primer foso, el cartel que miente antes
// de los pinchos, la piedra rúnica que suelta un enemigo en la bodega, el suelo que se derrumba después
// del foso y la meta falsa. La salida es tranquila: la primera pantalla no tiene ni trampas ni enemigos.
//
// La DIFICULTAD es la del nivel 1 de antes (la idea es enganchar: morir de forma graciosa y querer
// otra): después de la meta falsa vuelven sus tres pruebas (la salida engañosa con el suelo de raíces,
// las ramas traicioneras y el puente de madera que se cae), con más enemigos, plantas con espinas, una
// emboscada desde el cielo, monedas trampa y una roca que cae. Solo la primera pantalla es tranquila.
//
// El camino principal va por el suelo (y = 332): ahí funcionan todas las trampas del juego. Para "bajar"
// se sube primero a la muralla y se baja a la bodega (un túnel techado), como en el mapa de las Criptas.

import { SUELO_Y } from "./alcance.js" // (no de niveles.js: niveles.js importa este archivo)
import { alFondo } from "./mazmorra.js"
import { extender, tramoLlano, tramoSalidaEnganosa, tramoRamasTraicioneras, tramoPuenteMadera } from "./tramos.js"

const S = SUELO_Y;
const MURO = { x: 2200, arriba: 140, ancho: 420 };
const BODEGA = { x0: 2700, x1: 3400, techo: 170 };
const META = 6000;
const fila = (x, y, n, sep = 32) => Array.from({ length: n }, (_, i) => [x + i * sep, y]);
// escalones hasta lo alto de la muralla (32 px cada uno)
const escalones = Array.from({ length: 6 }, (_, i) => [1960 + i * 40, S - 32 * (i + 1), 40, 'oculta']);

// (las pruebas del nivel de antes van después de la meta falsa: ver el final del archivo)
const PRUEBAS_X = 4600;
export const NIVEL_AFUERAS = {
    nombre: 'Las Afueras de Albora',
    ancho: 6400,
    alto: 560,
    nubes: true,
    fondo: 'montanas',
    estilo: 'afueras', // (suelos de ladrillo medieval y decorado propio: decorarAfueras)
    sinDecorado: true,
    velEnemigos: 40,
    mezcla: ['zombie1', 'zombie2', 'alien_green', 'zombie3', 'esqueleto'],
    // la salida y la caída desde la muralla no reciben trampas al azar
    zonasTranquilas: [[0, 1000], [2600, 2760]],
    checkpoints: [1880, 3500, 4600],
    suelo: [[0, 1000], [1080, 3700], [3960, 6400]],
    lava: [[1000, 1080], [3700, 3860]],
    // después del foso, el suelo se derrumba
    falsos: [[3860, 3960]],
    muros: [[MURO.x, MURO.arriba, MURO.ancho]],
    techos: [[BODEGA.x0, BODEGA.x1, BODEGA.techo]],
    plataformas: [
        ...escalones,
        // el cielo, desde lo alto de la muralla (con un cristal escondido)
        [2300, 44, 110, 'tabla'], [2470, -52, 110, 'tabla'], [2300, -148, 110, 'tabla'],
        // la piedra en medio del foso de lava
        [3745, 260, 70],
    ],
    bloques: [
        [1010, 232, 'H'],     // ¡el clásico! un bloque invisible justo sobre el primer foso
        [1350, 232, 'B?B'],
        [2950, 232, '?E?'],   // en la bodega: la del medio suelta un enemigo
    ],
    pinchos: [[1720, 2, true]],
    carteles: [[1650, 255, 'TODO BIEN :)'], [4150, 255, '¡META! →']],
    banderasFalsas: [4250],
    enemigos: [1300, 1500, 1850, 3000, 3250, 3600, 4100, 4400],
    plantas: [1580, 4050],                  // arbustos con espinas: ¡no los pises!
    emboscadas: [[1950, [2050, 2150]]],     // al llegar a la muralla caen enemigos del cielo
    monedasTrampa: [[1420, 300], [3550, 300]],
    rocas: [4480],
    monedas: [
        ...fila(560, 300, 3), ...fila(1200, 300, 4), ...fila(2260, 100, 4),
        ...fila(2780, 300, 3), ...fila(4050, 300, 4),
    ],
    cristales: [[2355, -190]],
    corazones: [[3300, 300]],
    meta: META,
};

// ---------- decorado (game.js lo llama al armar el nivel) ----------
const C = 'cr_';
const ESCALA = 2 / 3;
const pared = (scene, x0, y0, x1, y1, tile, prof, tinte) => {
    const t = scene.add.tileSprite(x0, y0, x1 - x0, y1 - y0, C + tile).setOrigin(0).setTileScale(ESCALA).setDepth(prof);
    if (prof < 1) alFondo(scene, t); // (paredes del fondo: detrás de enemigos y poderes)
    if (tinte) t.setTint(tinte);
    return t;
};
// (los muebles van al fondo: detrás de enemigos, poderes y monedas; los que deben ir delante, prof ≥ 30)
const objeto = (scene, n, x, pie, escala = 1, prof = 2) => {
    const o = scene.add.image(x, pie, C + n).setOrigin(0.5, 1).setScale(escala).setDepth(prof);
    return prof < 30 ? alFondo(scene, o) : o;
};
const letrero = (scene, x, y, texto) => scene.add.text(x, y, texto, {
    fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffe9a8', backgroundColor: '#3b2a1aDD', padding: { x: 6, y: 5 },
}).setOrigin(0.5, 1).setDepth(42);
const farol = (scene, x, y) => {
    objeto(scene, 'torch', x, y, 1, 1);
    scene.add.image(x, y - 22, 'brillo').setDepth(41).setScale(1.6).setTint(0xffa040).setAlpha(0.28).setBlendMode('ADD');
};

export function decorarAfueras(scene) {
    // la casa en ruinas de la salida: paredes de ladrillo, una ventana y la puerta
    pared(scene, 90, S - 150, 330, S, 'tile93', 0.1, 0x8a8aa0);
    pared(scene, 90, S - 166, 330, S - 150, 'tile75', 0.2);
    objeto(scene, 'door1', 160, S, 1.2, 0.3);
    objeto(scene, 'window', 270, S - 60, 1, 0.3);
    farol(scene, 360, S - 60);
    letrero(scene, 450, S - 70, '¡BIENVENIDO! :)');
    letrero(scene, 760, S - 90, '← → CAMINAR · ↑ SALTAR');
    // el cementerio: lápidas
    lapidas(scene, [1150, 1290, 1440, 1590, 1800, 1890]);
    farol(scene, 1260, S - 90);
    farol(scene, 1830, S - 90);
    // la muralla: ladrillo, almenas y una ventana; los escalones
    pared(scene, MURO.x, MURO.arriba + 12, MURO.x + MURO.ancho, S, 'tile93', 1);
    pared(scene, MURO.x, MURO.arriba, MURO.x + MURO.ancho, MURO.arriba + 16, 'tile75', 1.1);
    objeto(scene, 'window', MURO.x + 210, MURO.arriba + 110, 1, 1.2);
    objeto(scene, 'shield', MURO.x + 90, MURO.arriba + 90, 0.8, 1.2);
    escalones.forEach(([x, y, w]) => pared(scene, x, y, x + w, S, 'tile93', 1, 0xb0b0c0) && pared(scene, x, y, x + w, y + 16, 'tile53', 1.1));
    letrero(scene, 2030, S - 210, 'LA MURALLA ↑');
    // el cielo: las tablas las dibuja el juego; aquí, unas nubes debajo
    [[2355, 70], [2525, -26], [2355, -122]].forEach(([x, y]) => scene.add.ellipse(x, y, 150, 38, 0xdfe6ff, 0.18).setDepth(0.3));
    // la bodega es el torreón del castillo: almenas arriba y una ventana (el techo lo dibuja el juego)
    for (let x = BODEGA.x0; x < BODEGA.x1; x += 60) pared(scene, x, -72, x + 36, -40, 'tile93', 1);
    objeto(scene, 'window', (BODEGA.x0 + BODEGA.x1) / 2, 90, 1.2, 1.2);
    objeto(scene, 'shield', BODEGA.x0 + 120, 70, 0.8, 1.2);
    objeto(scene, 'shield', BODEGA.x1 - 120, 70, 0.8, 1.2);
    // la bodega: pared del fondo, barriles, cajas, cadenas y antorchas
    pared(scene, BODEGA.x0, BODEGA.techo, BODEGA.x1, S, 'tile136', 0.05, 0x5a5a70);
    [[2790, 'barrel'], [2830, 'box'], [3080, 'vase'], [3250, 'barrel'], [3285, 'barrel'], [3320, 'box']].forEach(([x, n]) => objeto(scene, n, x, S, 1, 2));
    [2880, 3200].forEach(x => objeto(scene, 'chain1', x, BODEGA.techo, 1, 0.3).setOrigin(0.5, 0));
    farol(scene, 2760, S - 100);
    farol(scene, 3360, S - 100);
    objeto(scene, 'chest_closed', 3020, S, 1.3, 2);
    letrero(scene, 2660, S - 200, '⬇ BODEGA');
    // el foso y la meta falsa: más lápidas y faroles hasta la guarida del Rey Troll
    farol(scene, 4060, S - 90);
    // la antesala de la guarida (después de las pruebas: se ubica desde la meta)
    const m = scene.metaNivel ?? META;
    lapidas(scene, [m - 1500, m - 1300, m - 1150]);
    farol(scene, m - 1400, S - 90);
}

function lapidas(scene, xs) {
    if (!scene.textures.exists('cr_lapida')) {
        const g = scene.make.graphics({ add: false });
        g.fillStyle(0x6e6a80).fillRoundedRect(4, 6, 24, 34, { tl: 12, tr: 12, bl: 0, br: 0 });
        g.fillStyle(0x8a86a0).fillRect(14, 12, 4, 16).fillRect(9, 17, 14, 4);
        g.fillStyle(0x3d3a4c).fillRect(0, 38, 32, 4);
        g.generateTexture('cr_lapida', 32, 42);
        g.destroy();
    }
    xs.forEach((x, i) => alFondo(scene, scene.add.image(x, S, 'cr_lapida').setOrigin(0.5, 1).setFlipX(i % 2 === 1)));
}

// las tres pruebas del nivel 1 de antes, después de la meta falsa (corre lo que viene después)
extender(NIVEL_AFUERAS, PRUEBAS_X, [
    tramoLlano(200), tramoSalidaEnganosa(), tramoLlano(300, { enemigos: 1 }), tramoRamasTraicioneras(),
    tramoLlano(250, { enemigos: 1 }), tramoPuenteMadera(), tramoLlano(400),
]);
