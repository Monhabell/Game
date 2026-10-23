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
//   pasos: qué hacer y cómo llegar (uno por paso; 'llevar' tiene dos: ir a buscarlo y llevarlo)
export const ENCARGOS = [
    { id: 'luciernagas', tipo: 'recoger', icono: '🐞', texto: 'Atrapa 3 luciérnagas', zona: 'Copa del Roble',
        puntos: [[600, COPA_Y - 40], [860, COPA_Y - 56], [1020, COPA_Y - 36]],
        pasos: ['Sube por el zigzag de tablas (a la izquierda del claro) hasta la Copa del Roble y atrapa las 3 luciérnagas 🐞'] },
    { id: 'hongos', tipo: 'recoger', icono: '🍄', texto: 'Junta 3 hongos brillantes', zona: 'Cueva de Raíces',
        puntos: [[260, SUELO_Y - 14], [560, SUELO_Y - 14], [790, SUELO_Y - 14]],
        pasos: ['Ve a la izquierda, entra a la Cueva de Raíces y junta los 3 hongos 🍄 del suelo'] },
    { id: 'campana', tipo: 'quieto', icono: '🔔', texto: 'Toca la campana del Nido', zona: 'Nido',
        x: 2790, pie: COPA_Y, ms: 2000, visible: true,
        pasos: ['Cruza el río, sube al Nido en el ascensor 🛗 (junto a la cascada) y quédate quieto junto a la campana 🔔'] },
    { id: 'mirador', tipo: 'quieto', icono: '🪵', texto: 'Repara el mirador del puente', zona: 'Puente',
        x: 1830, pie: PUENTE_Y - 20, ms: 3000,
        pasos: ['Sube al puente de tablas sobre el claro (por el zigzag) y quédate quieto en el mirador 🪵 del medio'] },
    { id: 'cofre', tipo: 'quieto', icono: '🗝️', texto: 'Abre el cofre del río', zona: 'Río',
        x: 2780, pie: SUELO_Y, ms: 1500,
        pasos: ['Cruza el río saltando sobre el tronco y quédate quieto junto al cofre 🧰'] },
    { id: 'agua', tipo: 'llevar', icono: '💧', texto: 'Lleva agua de la cascada a la flor del claro', zona: 'Cascada → Claro',
        desde: { x: 3260, pie: SUELO_Y }, hasta: { x: 1990, pie: SUELO_Y }, visible: true,
        pasos: ['Ve a la derecha, cruza el río y toma el agua del cántaro 🏺 junto a la cascada',
            'Ahora vuelve y lleva el agua a la flor 🌱 del claro (junto al altar)'] },
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

// ---------- el mapa completo, para troll.js y bots.js ----------
// Cada mapa de la noche trae lo mismo: el nivel, las antorchas, el altar, los encargos, la campana del
// Juicio, sus puertas mágicas y su zona oscura (si tiene), cómo se dibujan sus cosas propias, qué pasa
// con los encargos 'visible' y el mapa de caminos de los bots (y de las flechas).
const S = SUELO_Y;
const cadena = (ids, tipo) => ids.slice(1).map((id, i) => [ids[i], id, tipo]);

export const MAPA_BOSQUE = {
    id: 'bosque',
    nombre: 'El Bosque de Albora',
    ancho: ANCHO,
    nivel: nivelNoche,
    antorchas: ANTORCHAS_NOCHE,
    altar: ALTAR_NOCHE,
    encargos: ENCARGOS,
    campanaJuicio: { x: 1560, pie: S, ms: 1200 },
    puertas: [],
    oscuro: null,

    // lo propio del bosque: el tronco hueco, la cascada, los letreros y las cosas de los encargos
    // h: { letrero(scene, x, y, texto), visibles: Set de encargos visibles ya cumplidos }
    decorar(scene, h) {
        const t = TRONCO_HUECO;
        scene.add.rectangle(t.x, t.arriba - 20, 90, 352 - t.arriba + 20, 0x3b2716).setOrigin(0.5, 0).setDepth(2);
        scene.add.rectangle(t.x, t.arriba + 10, 46, 352 - t.arriba - 30, 0x140b05).setOrigin(0.5, 0).setDepth(2);
        h.letrero(scene, t.x, 300, 'TRONCO HUECO ↓');
        // la cascada: el agua tapa a quien está detrás (buen escondite… para cualquiera)
        const c = CASCADA;
        const agua = scene.add.tileSprite(c.x0, -60, c.x1 - c.x0, S + 60, 'noche_agua').setOrigin(0, 0).setDepth(36).setAlpha(0.62);
        scene.tweens.add({ targets: agua, tilePositionY: -256, duration: 1400, repeat: -1 });
        scene.add.ellipse((c.x0 + c.x1) / 2, S, c.x1 - c.x0 + 40, 26, 0xd8f0ff, 0.35).setDepth(36);
        h.letrero(scene, 2400, 250, '~ RÍO ~');
        h.letrero(scene, 900, S - 20, '← CUEVA');
        h.letrero(scene, 3200, S - 140, 'ASCENSOR AL NIDO ↑');
        // lo que todos ven de los encargos: la campana del nido, la flor del claro, el cántaro y el cofre
        const camp = ENCARGOS.find(e => e.id === 'campana');
        scene.nocheCampana = scene.add.text(camp.x, camp.pie - 46, '🔔', { fontSize: '22px' }).setOrigin(0.5, 1).setDepth(8);
        scene.add.rectangle(camp.x, camp.pie - 46, 3, 30, 0x4a3420).setOrigin(0.5, 0).setDepth(7);
        const agu = ENCARGOS.find(e => e.id === 'agua');
        scene.nocheFlor = scene.add.text(agu.hasta.x, agu.hasta.pie, h.visibles.has('agua') ? '🌸' : '🌱', { fontSize: '18px' }).setOrigin(0.5, 1).setDepth(8);
        scene.add.text(agu.desde.x, agu.desde.pie, '🏺', { fontSize: '16px' }).setOrigin(0.5, 1).setDepth(8);
        const cofre = ENCARGOS.find(e => e.id === 'cofre');
        scene.add.text(cofre.x, cofre.pie, '🧰', { fontSize: '18px' }).setOrigin(0.5, 1).setDepth(8);
    },

    // un encargo 'visible' se cumplió: lo ven y oyen todos. Devuelve el aviso
    visible(scene, id) {
        if (id === 'campana' && scene.nocheCampana) {
            scene.tweens.add({ targets: scene.nocheCampana, angle: { from: -25, to: 25 }, yoyo: true, repeat: 5, duration: 120, onComplete: () => scene.nocheCampana.setAngle(0) });
            scene.sound.play('punto_control', { volume: 0.7, rate: 1.4 });
            return '🔔 ¡SONÓ LA CAMPANA DEL NIDO!';
        }
        if (id === 'agua' && scene.nocheFlor) {
            scene.nocheFlor.setText('🌸');
            scene.tweens.add({ targets: scene.nocheFlor, scale: { from: 0.4, to: 1 }, duration: 500, ease: 'Back.out' });
            return '🌸 ¡SE ABRIÓ LA FLOR DEL CLARO!';
        }
        return null;
    },

    // mapa de caminos (bots.js): puntos y tramos para caminar, saltar, caer o subir en el ascensor
    nav: {
        altar: 'claro',
        nodos: {
            cueva0: [120, S], hongo1: [260, S], antC: [430, S], hongo2: [560, S], hongo3: [790, S], zig0: [1000, S],
            campJ: [1560, S], claro: [ALTAR_NOCHE.x, S], flor: [1990, S], rioI: [2180, S],
            rioD: [2580, S], tronco: [2650, S], cofre: [2780, S], ascB: [3200, S], agua: [3260, S], antD: [3400, S], fondo: [3540, S],
            z1: [1050, S - 96], z2: [1265, S - 192], z3: [1050, S - 288], z4: [1265, S - 384], z5: [1050, S - 480], z6: [1265, COPA_Y],
            copa3: [1020, COPA_Y], luc2: [860, COPA_Y], antA: [700, COPA_Y], luc1: [600, COPA_Y],
            p1: [1475, PUENTE_Y], p2: [1655, PUENTE_Y], mirador: [1830, PUENTE_Y - 20], p4: [2025, PUENTE_Y], p5: [2205, PUENTE_Y],
            p6: [2385, PUENTE_Y], p7: [2555, PUENTE_Y - 50],
            nido0: [2730, COPA_Y], campana: [2790, COPA_Y], antB: [2960, COPA_Y], nido3: [3080, COPA_Y],
        },
        // [desde, hasta, tipo]; 'caer' va en un solo sentido, lo demás en los dos
        tramos: [
            ...cadena(['cueva0', 'hongo1', 'antC', 'hongo2', 'hongo3', 'zig0', 'campJ', 'claro', 'flor', 'rioI'], 'camina'),
            ...cadena(['rioD', 'tronco', 'cofre', 'ascB', 'agua', 'antD', 'fondo'], 'camina'),
            ['rioI', 'rioD', 'salta'], // (sobre el tronco del río)
            ...cadena(['zig0', 'z1', 'z2', 'z3', 'z4', 'z5', 'z6'], 'salta'),
            ['z6', 'copa3', 'salta'],
            ...cadena(['copa3', 'luc2', 'antA', 'luc1'], 'camina'),
            ['z6', 'p1', 'salta'],
            ...cadena(['p1', 'p2', 'mirador', 'p4', 'p5', 'p6', 'p7'], 'salta'),
            ['p7', 'nido0', 'salta'],
            ...cadena(['nido0', 'campana', 'antB', 'nido3'], 'camina'),
            ['nido3', 'ascB', 'ascensor'],
            ['mirador', 'claro', 'caer'], ['nido0', 'tronco', 'caer'], // (del mirador al claro; el tronco hueco)
        ],
        ascensor: { x: 3200, abajo: S, arriba: COPA_Y },
        // adónde va cada encargo (recoger: un nodo por cosa; llevar: ida y vuelta)
        pasos: {
            luciernagas: ['luc1', 'luc2', 'copa3'], hongos: ['hongo1', 'hongo2', 'hongo3'],
            campana: ['campana'], mirador: ['mirador'], cofre: ['cofre'], agua: ['agua', 'flor'],
        },
        antorchas: { A: 'antA', B: 'antB', C: 'antC', D: 'antD' },
        // un bot empujado aquí se cae (y muere): en lo alto o junto al río. Devuelve dónde queda el cuerpo
        caida: (x, pie) => (pie < S - 20 || (x > 2080 && x < 2680) ? S : null),
    },
};
