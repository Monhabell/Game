// Definición de niveles.
// Coordenadas: el suelo tiene su parte superior en y = 332.
//   - Bloques "fila baja": y = 232 (se pueden golpear desde el suelo y caminar por debajo)
//   - Bloques "fila alta": y = 136 (se alcanzan saltando desde la fila baja)
// Patrón de bloques: 'B' = ladrillo, '?' = piedra rúnica (da moneda al golpearla desde abajo), ' ' = hueco
//   Trampas de bloque (cada una tiene su pista sutil: ver senales.js):
//   'E' = parece piedra rúnica pero suelta un enemigo
//   'C' = ladrillo que cae cuando pasas por debajo
//   'H' = bloque invisible (aparece al golpearlo desde abajo; ideal en el borde de un hueco)
//   'F' = ladrillo falso, no tiene piso
// falsos: [xInicio, xFin] suelo que se derrumba al pisarlo (tiene lava debajo)
// pinchos: [x, cantidad, oculto] (los ocultos salen del suelo cuando te acercas)
// bolas: [x, cadaCuantosMs] bolas de fuego que saltan desde la lava
// emboscadas: [xAviso, [x de cada enemigo]] al pasar por xAviso caen enemigos del cielo
// carcajes: [x, y] dan +5 flechas
// corazones: [x, y] recuperan una vida   cristales: [x, y] valen 500 puntos (suelen estar en sitios peligrosos)
// mezcla: tipos de enemigos que caminan en el nivel (se van turnando); ver enemigos.js
// plantas: x de plantas disfrazadas de arbusto (¡no las pises, tienen espinas!)
// espiritus: [x, y] espíritus de fuego que vuelan y disparan
//
// Más trampas sorpresa (ver sorpresas.js):
// carteles: [x, y, texto] letreros burlones (suelen mentir)
// monedasTrampa: [x, y] parecen monedas, pero al tomarlas cae un enemigo del cielo
// rocas: x  una roca/estalactita se desprende del techo cuando pasas por debajo
// estatuasFalsas: x  parece un punto de control, pero se convierte en esqueleto
// mordedoras: [x, y] plataforma que tiembla, se pone roja y muerde si no te bajas rápido
// banderasFalsas: x  una meta falsa: el faro sale huyendo y suelta enemigos
// persecuciones: x  al pasar por ahí aparece un zombie gigante que te persigue
// suelo / lava: rangos [xInicio, xFin]
// enemigos: x (aparece en el suelo) o [x, y]
// goteros: [x, cadaCuantosMs] (gotas de lava que caen del techo)
// moviles: [x, y, eje 'x'|'y', recorrido, velocidad]  (eje 'y' = ascensor: sube desde y hasta y - recorrido)
// plataformas: [x, arriba, ancho]  plataformas flotantes de roca a cualquier altura
// muros: [x, arriba, ancho]  columna de roca maciza desde el suelo (corta el paso: se sube por encima)
// antorchas: [x, y]  antorchas en la pared
// techos: [x0, x1, abajo]  túnel: roca maciza desde arriba hasta 'abajo' (ver tramos.js)
// runas: [x, y, [losas]]  piedra rúnica: al golpearla desde abajo aparecen las losas [x, arriba, ancho]
// inicio: [x, y]  dónde aparece el jugador al empezar el nivel (por defecto, en el suelo al inicio)
// alto: px que el nivel crece hacia ARRIBA (torres, puentes colgantes); la cámara sube con el jugador.
//   Las secciones altas usan y negativa. Las pruebas comprueban que se llegue a todo (alcance.js)
// escaleras: [x, altura en bloques]
// meta: x de la bandera
// checkpoints: x donde reaparece Gesi si muere después de pasar por ahí
// velEnemigos: velocidad de los enemigos (sube en cada nivel)
// Una gota de lava golpea en x + 31 respecto a su gotero: los goteros se ponen
// sobre huecos o suelo, nunca sobre una plataforma en la que haya que pararse.

import { NIVEL_AFUERAS } from "./afueras.js"
import { NIVEL_CATACUMBAS } from "./catacumbas.js"
import { NIVEL_MINAS } from "./minas.js"
import {
    colocar, extender, tramoLlano, tramoTunel, tramoAscensorMirador, tramoCornisaSecreta,
    tramoTorre, tramoPuentesAltos, tramoDobleCamino, tramoAbismoRunico, tramoRamas, tramoArbolAnciano,
    zonaSalida, zonaPuente, zonaTunel, zonaAtajo, zonaSueloMentiroso, zonaPersecucion, zonaLlegada,
    tramoSalidaEnganosa, tramoRamasTraicioneras, tramoPuenteMadera,
} from "./tramos.js"

export const SUELO_Y = 332;

// fila de monedas
const fila = (x, y, n, sep = 32) => Array.from({ length: n }, (_, i) => [x + i * sep, y]);

// arco de monedas sobre un hueco
const arco = (x, y) => [[x, y + 20], [x + 30, y], [x + 60, y + 20]];

export const NIVELES = [
    {
        nombre: 'El Bosque de Gesi',
        ancho: 5200,
        nubes: true,
        fondo: 'montanas', // montañas en silueta con árboles secos (en vez del paisaje)
        velEnemigos: 40,
        checkpoints: [2400],
        mezcla: ['zombie1', 'zombie2', 'alien_green', 'zombie3', 'esqueleto'],
        plantas: [2750, 4150],
        // la primera parte (hasta x≈2300) está hecha a mano en construirNivel1()
        suelo: [[2300, 3000], [3130, 3480], [3600, 3700], [3840, 5200]],
        lava: [[3000, 3130], [3700, 3840]],
        falsos: [[3480, 3600]],
        bloques: [
            [2450, 232, 'B?BEB'],
            [2700, 136, 'BBFB'],
            [2980, 232, 'H'],
            [3300, 232, '?CC?'],
            [3480, 136, 'BBBB'],
            [3690, 232, 'H'],
            [4050, 232, 'BE?B'],
        ],
        pinchos: [[4260, 2, true]],
        emboscadas: [[3900, [4100, 4300]]],
        carcajes: [[2550, 300]],
        corazones: [[4500, 160]],
        cristales: [[3065, 185]],
        carteles: [[2965, 175, '¡SALTA AQUÍ!'], [3440, 255, 'ATAJO →']],
        monedasTrampa: [[2850, 300], [4030, 300]],
        rocas: [4390],
        escaleras: [[4450, 4]],
        enemigos: [2600, 2900, 3350, 3550, 4000, 4200, 4350],
        monedas: [
            [280, 312],
            [2110, 150],
            ...fila(2330, 300, 3),
            ...fila(2716, 100, 4),
            ...arco(3035, 230),
            ...fila(3496, 100, 4),
            ...arco(3740, 230),
            ...fila(3900, 300, 4),
            ...fila(4066, 190, 4),
        ],
        goteros: [[3739, 2200]],
        meta: 4800,
    },
    {
        nombre: 'La Cueva de Lava',
        ancho: 6000,
        cueva: true,
        tinte: 0x8a4a3a,
        velEnemigos: 50,
        checkpoints: [3150],
        mezcla: ['esqueleto', 'zombie2', 'alien_blue', 'zombie3', 'esqueleto', 'alien_gray', 'zombie1'],
        plantas: [1250, 5000],
        espiritus: [[1440, 190], [2840, 170], [4560, 190]],
        suelo: [[0, 700], [850, 1400], [1540, 1740], [1950, 2600], [3100, 3800], [3950, 4500], [4650, 6000]],
        falsos: [[1740, 1800]],
        bolas: [[760, 2500], [1455, 2200], [2842, 2300], [3860, 2000]],
        pinchos: [[4380, 2, true]],
        emboscadas: [[3300, [3500, 3650]]],
        carcajes: [[1200, 290], [3200, 270]],
        corazones: [[2398, 55]],
        cristales: [[2842, 200]],
        carteles: [[2860, 150, '¡ATAJO SEGURO!'], [2200, 110, 'NO MIRES ARRIBA']],
        monedasTrampa: [[1650, 300], [4796, 300]],
        rocas: [520, 5150],
        estatuasFalsas: [1080],
        mordedoras: [[775, 285], [3875, 280]],
        lava: [[700, 850], [1400, 1540], [1800, 1950], [2600, 3100], [3800, 3950], [4500, 4650]],
        bloques: [
            [300, 232, 'B?B'],
            [950, 232, 'BBBBB'],
            [1610, 232, '?'],
            [2150, 232, 'B?B?B'],
            [2350, 136, 'BBB'],
            [2590, 232, 'H'],
            [2720, 280, 'BB'], // islas sobre la lava
            [2900, 280, 'FB'], // ¡la mitad izquierda es falsa!
            [3300, 232, 'BC?CB'],
            [4050, 232, '?B?'],
            [4800, 232, 'EB?'],
            [4950, 136, 'BBB'],
        ],
        escaleras: [[4250, 3], [5300, 4]],
        enemigos: [450, 600, [1000, 200], 1150, 1300, 2100, 2250, 2450, 3250, 3400, 3550, 3700, 4100, 4900, 5050, 5200],
        monedas: [
            ...fila(200, 300, 4),
            ...arco(745, 230),
            ...fila(966, 190, 5),
            ...arco(1440, 230),
            ...arco(1845, 230),
            ...fila(2366, 100, 3),
            ...fila(2736, 245, 2),
            ...fila(2916, 245, 2),
            ...fila(3150, 300, 4),
            ...fila(4966, 100, 3),
            ...fila(4700, 300, 3),
        ],
        goteros: [[744, 2000], [1200, 1800], [1844, 1900], [2811, 2000], [3500, 1800], [4544, 1900], [5150, 1700]],
        meta: 5650,
    },
    {
        nombre: 'Puentes sobre la Lava',
        ancho: 6300,
        // ruta alta sobre el lago de lava (2800-3400): un ascensor sube a los puentes colgantes y al
        // final se baja de un salto a la otra orilla. La ruta de abajo (plataforma móvil) sigue ahí.
        alto: 450,
        plataformas: [[2720, -96, 150], [2900, -150, 120], [3300, -150, 140]],
        nubes: true,
        tinte: 0xffb38a,
        velEnemigos: 55,
        checkpoints: [2350, 3450],
        mezcla: ['alien_green', 'alien_blue', 'esqueleto', 'zombie3'],
        plantas: [1550, 2550],
        espiritus: [[850, 140], [2000, 150], [4350, 150], [3150, -60]],
        suelo: [[0, 600], [1100, 1700], [2300, 2700], [3400, 4000], [4700, 6300]],
        falsos: [[2700, 2800]],
        bolas: [[1000, 2400], [2000, 2100], [3330, 2200], [4300, 2000]],
        pinchos: [[3820, 2, true], [1450, 1, true]],
        emboscadas: [[5000, [5150, 5250]]],
        carcajes: [[1150, 290], [4750, 290]],
        corazones: [[5358, 35]],
        cristales: [[3700, 60], [3150, -240]], // el segundo, premio de la ruta alta
        carteles: [[590, 185, 'SALTA AQUÍ ↓'], [5180, 120, '¡META!'], [1640, 200, 'TODO BIEN :)']],
        monedasTrampa: [[282, 300], [1120, 300], [4780, 300]],
        rocas: [1460, 3530, 4880],
        estatuasFalsas: [4760],
        mordedoras: [[1400, 316], [5480, 316]],
        banderasFalsas: [5180],
        persecuciones: [3470],
        lava: [[600, 1100], [1700, 2300], [2800, 3400], [4000, 4700]],
        moviles: [
            [694, 300, 'x', 312, 70],
            [1794, 300, 'x', 412, 90],
            [2894, 300, 'x', 150, 60],
            [2640, 316, 'y', 396, 55], // ascensor a la ruta alta (descansa en el suelo)
            [3090, -174, 'x', 120, 60], // puente móvil en lo alto
            [4094, 290, 'x', 250, 90],
            [5350, 236, 'y', 110, 45], // ascensor de bonus
        ],
        bloques: [
            [590, 232, 'H'],
            [1250, 232, 'B?B'],
            [1450, 232, 'B?B?B'], // fila sobre la isla del medio: puede esconder trampas de bloque
            [1290, 136, '?B?'],
            [1690, 232, 'H'],
            [3990, 232, 'H'],
            [2330, 232, '?BEB?'], // (deja sitio para saltar al ascensor de la ruta alta)
            [3140, 280, 'BBBB'],
            [3480, 232, 'BB'],
            [3600, 136, 'BBBBBB'],
            [3720, 232, 'B?B?'],
            [3880, 232, '?'],
            [4440, 280, 'BBBB'],
            [5000, 232, 'B?C?B'],
        ],
        escaleras: [[5600, 4]],
        enemigos: [450, 1180, 1300, 1500, 1650, 2450, 2500, 2650, 3600, 3700, 3800, 3900, 4850, 4900, 5050, 5200, 5250, 5450],
        monedas: [
            ...fila(150, 300, 4),
            ...fila(780, 230, 6),
            ...fila(1466, 190, 5),
            ...fila(1900, 230, 8),
            ...fila(3156, 245, 4),
            ...fila(2735, -130, 4), // ruta alta
            ...fila(2915, -185, 3),
            ...fila(3315, -185, 3),
            ...fila(3616, 100, 6),
            ...fila(4180, 220, 5),
            ...fila(5310, 75, 4),
        ],
        goteros: [[2760, 1600], [3550, 1500], [4900, 1500]], // (el primero, lejos del ascensor)
        meta: 5900,
    },
    {
        nombre: 'La Fortaleza',
        ancho: 6900,
        // torre (2850-3500): un muro de roca de casi 600 px corta el paso; se sube en zigzag por la
        // izquierda, se cruza por arriba (con premio) y se baja de un salto por la derecha.
        // El apagón de la Fortaleza ocurre justo al empezar a subir (ver regiones.js)
        alto: 650,
        muros: [[3240, -260, 90]],
        plataformas: [
            [2890, 236, 120], [3100, 140, 130],
            [2890, 44, 120], [3100, -52, 130],
            [2890, -148, 120], [3100, -244, 130],
        ],
        antorchas: [[3226, 200], [3226, 10], [3226, -180]],
        cueva: true,
        tinte: 0x7a5aa8,
        velEnemigos: 65,
        checkpoints: [1950, 2880, 4250],
        mezcla: ['esqueleto', 'alien_armor', 'alien_red', 'zombie1', 'alien_predator_mask'],
        plantas: [1000, 2100, 4700, 5850],
        espiritus: [[1600, 140], [3850, 150], [5075, 180]],
        suelo: [[0, 500], [640, 1300], [1900, 2400], [2600, 2700], [2850, 3600], [4200, 5000], [5150, 6900]], // (2850-3600: torre y aterrizaje amplio al bajar)
        falsos: [[2550, 2600]],
        bolas: [[570, 1800], [1600, 2200], [2475, 1700], [2775, 1700], [3680, 2000], [5075, 1700]],
        pinchos: [[5450, 2, true], [6050, 1, true]],
        emboscadas: [[4300, [4500, 4650, 4800]], [5600, [5800, 5950]]],
        carcajes: [[700, 290], [4250, 280]],
        corazones: [[3285, -300]], // en la cima de la torre
        cristales: [[2475, 200], [3285, -340]],
        carteles: [[480, 180, 'SALTA AQUÍ'], [2250, 150, 'PUNTO DE CONTROL →'], [5700, 120, '¡LLEGASTE!']],
        monedasTrampa: [[1050, 300], [3300, 300], [4900, 300]],
        rocas: [720, 2200, 4550],
        estatuasFalsas: [2300, 5250],
        mordedoras: [[2475, 280], [5075, 280]],
        banderasFalsas: [5720],
        persecuciones: [2900, 4300],
        lava: [[500, 640], [1300, 1900], [2400, 2550], [2700, 2850], [3600, 4200], [5000, 5150]],
        moviles: [
            [1394, 300, 'x', 412, 100],
            [3810, 250, 'x', 230, 80],
        ],
        bloques: [
            [490, 232, 'H'],
            [850, 232, '?BEB?'],
            [2000, 232, 'B?B'],
            [3590, 232, 'H'],
            [3640, 280, 'BBB'],
            [4400, 232, 'BC?C?CB'],
            [5500, 232, 'BCCB'],
        ],
        escaleras: [[5300, 3], [6100, 5]],
        enemigos: [350, 800, 950, 1100, 1250, 2050, 2200, 2600, 3450,
            4350, 4500, 4650, 4800, 4950, 5600, 5750, 5900, 6000],
        monedas: [
            ...arco(540, 230),
            ...fila(1450, 230, 10),
            ...arco(2445, 230),
            ...arco(2745, 230),
            ...fila(3115, 105, 3), // por la torre
            ...fila(3115, -87, 3),
            ...fila(3115, -279, 3),
            ...fila(3636, 245, 3),
            ...fila(3850, 200, 5),
            ...fila(5516, 190, 4),
            ...fila(6200, 100, 3),
        ],
        goteros: [[539, 1500], [1600, 2000], [2444, 1400], [2744, 1400], [3950, 2000], [4600, 1400], [5044, 1400]],
        meta: 6450,
    },
    // el Volcán empieza arriba, en el borde del cráter, y se baja por cornisas sobre la lava;
    // tiene una torre y el primer abismo rúnico (golpear la runa crea el puente)
    generarNivel({
        nombre: 'El Volcán', semilla: 7, dificultad: 0.75, tramos: 12, cueva: true, tinte: 0xb8503a,
        mezcla: ['esqueleto', 'zombie1', 'alien_dark_gray', 'zombie3', 'alien_gray', 'esqueleto'],
        bajadaInicial: true, especiales: ['runa', 'tunel', 'torre4'],
    }),
    // las Nubes combinan todo lo aprendido: puentes altos, abismos rúnicos y una torre alta
    generarNivel({
        nombre: 'El Reino de las Nubes', semilla: 21, dificultad: 1, tramos: 16, nubes: true, tinte: 0x9fb8ff,
        mezcla: ['alien_green', 'alien_blue', 'alien_red', 'alien_predator_mask', 'alien_armor', 'esqueleto'],
        especiales: ['puentesAltos', 'tunel', 'runa', 'torre6', 'dobleCamino', 'runa', 'tunel'],
    }),
    nivelRuinas(),
];

// ---------- Niveles más largos a medida que se avanza ----------
// Los niveles hechos a mano se alargan con piezas (tramos.js) colocadas justo antes de la arena
// del jefe: cada nivel suma lo nuevo que enseña (túneles, ascensores, doble camino, torres).
// En x hay suelo firme; todo lo que estaba a la derecha (arena, meta) se corre.
// Bosque: aprender a moverse juntos sin que nadie lo explique (sirve solo, en la carrera y en cadena;
// la lógica está en bosque.js):
//   1. La salida engañosa: el cartel señala un atajo por un suelo de raíces que aguanta a UNO
//   2. Las ramas traicioneras: con dos encima se rompen; en la punta se inclinan: por turnos
//   3. El puente de madera: se cae detrás del grupo; abajo, un atajo saltando troncos que flotan
// (el cristal de lo alto del puente es el secreto del nivel). Después, la antesala y el Rey Troll.
extender(NIVELES[0], 3850, [
    tramoLlano(300, { enemigos: 1 }), tramoRamasTraicioneras(), tramoLlano(200),
    tramoPuenteMadera(), tramoLlano(500), // (la antesala tranquila antes del Rey Troll)
]);
extender(NIVELES[0], 2310, [tramoSalidaEnganosa()]); // (justo después del comienzo hecho a mano)
extender(NIVELES[1], 4660, [ // Cueva: doble camino sobre la lava y un túnel largo
    tramoLlano(300), // (más larga que el nivel 1, que ahora trae sus cuatro zonas)
    tramoLlano(200), tramoDobleCamino(), tramoLlano(400, { enemigos: 1 }), tramoTunel(900),
    tramoLlano(300), tramoCornisaSecreta(),
]);
// NIVEL 1: Las Afueras de Albora (afueras.js), con el estilo de las Criptas. El Bosque de Gesi de antes
// queda guardado en NIVEL_1_ANTERIOR (amano: su primera parte la arma construirNivel1 en game.js);
// para volver a él, basta con quitar la línea que lo reemplaza.
export const NIVEL_1_ANTERIOR = Object.assign(NIVELES[0], { amano: true });
NIVELES[0] = NIVEL_AFUERAS;
// NIVEL 2: Las Catacumbas de Albora (catacumbas.js). La Cueva de Lava de antes queda en NIVEL_2_ANTERIOR
export const NIVEL_2_ANTERIOR = NIVELES[1];
NIVELES[1] = NIVEL_CATACUMBAS;
extender(NIVELES[2], 4710, [ // Puentes: túnel, una torre y otro doble camino
    tramoLlano(300), tramoTunel(600), tramoLlano(300, { enemigos: 1 }), tramoTorre(4), tramoLlano(400),
    tramoDobleCamino(), tramoLlano(300),
]);
extender(NIVELES[3], 5160, [ // Fortaleza: túneles, doble camino y una torre alta
    tramoLlano(300), tramoTunel(900), tramoLlano(700, { enemigos: 2 }), tramoDobleCamino(), tramoLlano(400),
    tramoTorre(6), tramoLlano(400, { enemigos: 1 }), tramoTunel(600), tramoLlano(300),
]);
// NIVEL 3: Las Minas del Rey Troll (minas.js), con misiones. Los Puentes sobre la Lava de antes quedan en
// NIVEL_3_ANTERIOR (con sus tramos ya agregados)
export const NIVEL_3_ANTERIOR = NIVELES[2];
NIVELES[2] = NIVEL_MINAS;
// NIVELES 4 a 7: su recorrido de siempre, ahora en estilo medieval (ladrillo de las Criptas con el color de
// su tema: ver TEMAS) y con MISIONES que abren la meta (misiones.js), como el nivel 3. Cada uno tiene las
// suyas, con los textos de su historia; las trampas falsas (falsas.js) también están.
//   4 La Fortaleza: el castillo del troll. Prisioneros en el calabozo, braseros de la muralla y las
//     palancas del rastrillo.
//   5 El Volcán: se baja al cráter. Cristales de fuego sobre la lava, muros de obsidiana que solo rompe un
//     poder y el huevo de dragón que hay que llevar al altar antes de que el volcán despierte.
//   6 El Reino de las Nubes: el cielo del troll. Faros de las nubes, las runas del viento, los
//     prisioneros de las nubes y la carrera contra la tormenta.
//   7 Las Ruinas del Abismo: el último trono. Todo junto: prisioneros, muros, palancas y runas.
const MEDIEVALES = [
    {
        i: 3, falsas: 40,
        tema: { nombre: 'La Fortaleza', tinte: 0x8a8aa8, suelo: 'piedra', color: 0xb8b8d0, particulas: 'polvo' },
        misiones: { tipos: ['rescatar', 'encender'], acertijos: ['palancas'], cant: 3,
            textos: { rescatar: 'Libera a los prisioneros del calabozo', encender: 'Enciende los braseros de la muralla', palancas: 'Las palancas del rastrillo' } },
    },
    {
        i: 4, falsas: 60,
        tema: { nombre: 'El Volcán', tinte: 0xff6a3a, color: 0x9a5a48, particulas: 'brasas', colores: [0xffd060, 0xff5020] },
        misiones: { tipos: ['llevar', 'romper', 'encender'], cant: 3,
            textos: { encender: 'Enciende los cristales de fuego', romper: 'Rompe los muros de obsidiana', llevar: 'Lleva el huevo de dragón al altar' },
            iconos: { llevar: '🥚' } },
    },
    {
        i: 5, falsas: 80,
        tema: { nombre: 'El Reino de las Nubes', tinte: 0x9fb8ff, suelo: 'piedra', color: 0xd8e4ff,
            cielo: ['#08102a', '#1a2c5a', '#3a5a9a', '#7a9ad0'], luna: 0xeaf0ff, niebla: 0xd0dcff, nieblaSuelo: 0xe0e8ff,
            particulas: 'lluvia', relampagos: [9000, 16000] },
        misiones: { tipos: ['contrarreloj', 'encender', 'rescatar'], acertijos: ['runas'], cant: 3,
            textos: { encender: 'Enciende los faros de las nubes', rescatar: 'Rescata a los prisioneros del cielo', contrarreloj: 'Gánale a la tormenta', runas: 'Las runas del viento' } },
    },
    {
        i: 6, falsas: 100,
        tema: { nombre: 'Las Ruinas del Abismo', tinte: 0xa58a9a, color: 0x9a7ab0, particulas: 'ceniza', relampagos: [14000, 24000] },
        misiones: { tipos: ['romper', 'rescatar'], acertijos: ['palancas', 'runas'], cant: 3,
            textos: { rescatar: 'Libera a los últimos prisioneros', romper: 'Abre el paso al trono', palancas: 'Las palancas del trono', runas: 'Las runas del abismo' } },
    },
];
MEDIEVALES.forEach(({ i, tema, misiones, falsas }) => Object.assign(NIVELES[i], { estilo: 'medieval', tema, misiones, falsas }));

// Generador de niveles grandes a partir de "tramos" que siempre se pueden pasar.
// Nivel 7 · Las Ruinas del Abismo: el Rey Troll huye de las Nubes al abismo y ahí espera, en su
// último trono. Es la pista de carrera de las Ruinas (las 7 zonas de tramos.js) alargada con piezas
// conocidas. Trampas puestas a mano (fija: no pasa por aleatorizarNivel, ver prepararNivelFijo en
// azar.js); los mecanismos propios (aplastadores, portal, muro que persigue) están en abismo.js.
// Ritmo:
//   1. Introducción: la salida y su bifurcación opcional (arriba premio, abajo directo)
//   2. Desafío: el Puente de la Muerte (tablones frágiles) y el Túnel Maldito (aplastadores)
//   3. Descanso: llano, una torre con cristal y el abismo rúnico
//   4. Momento ¡wow!: el Atajo Maldito (senda segura arriba / atajo con portal y géiser abajo)
//   5. Desafío fuerte: suelo mentiroso, otro puente, túnel y la Persecución del muro del abismo
//   6. Antesala tranquila y el trono del Rey Troll
function nivelRuinas() {
    const n = {
        nombre: 'Las Ruinas del Abismo', ancho: 0, meta: 0, fija: true, abismo: true,
        tinte: 0xa58a9a, velEnemigos: 80,
        mezcla: ['esqueleto', 'zombie3', 'alien_dark_gray', 'zombie2', 'alien_armor', 'esqueleto'],
        suelo: [], checkpoints: [], carteles: [],
    };
    const piezas = [
        zonaSalida(), zonaPuente(), zonaTunel(),
        tramoLlano(400, { enemigos: 1 }), tramoTorre(5), tramoAbismoRunico(), tramoLlano(300),
        zonaAtajo(), zonaSueloMentiroso(), tramoDobleCamino(), tramoLlano(500, { enemigos: 2 }),
        zonaPuente(), tramoCornisaSecreta(), tramoAscensorMirador(), tramoTunel(800), tramoLlano(400),
        zonaPersecucion(), zonaLlegada(), tramoLlano(800),
    ];
    const ancho = piezas.reduce((s, t) => s + t.ancho, 0);
    const arena = ancho - 300 - 1500; // (la arena del jefe y su antesala: sin puntos de control dentro)
    let x = 0;
    piezas.forEach(t => {
        colocar(n, t, x);
        if (x > 0 && t.ancho >= 600 && x + 60 < arena) n.checkpoints.push(x + 60);
        x += t.ancho;
    });
    n.ancho = ancho;
    n.meta = ancho - 300;
    return n;
}

// dificultad va de 0 (fácil) a 1 (difícil): huecos más anchos, más enemigos,
// gotas más seguidas y plataformas más rápidas.
function azar(semilla) {
    let a = semilla;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// especiales: tramos con altura que se reparten a lo largo del nivel ('torre4', 'torre6', 'puentesAltos', 'runa')
// bajadaInicial: el nivel empieza arriba y se baja por cornisas sobre la lava
// obstaculos: los que se usan entre llanos (repetir uno le da más peso); llanos: [mínimo, máximo] px
function generarNivel({ nombre, semilla, dificultad: d, tramos, cueva = false, nubes = false, tinte, mezcla, especiales = [], bajadaInicial = false,
    obstaculos: nombresObstaculos = ['hueco', 'hueco', 'islas', 'puente', 'escalera'], llanos = [450, 800] }) {
    const r = azar(semilla);
    const entre = (a, b) => Math.round(a + r() * (b - a));
    const n = {
        nombre, cueva, nubes, tinte, mezcla, plantas: [], espiritus: [],
        velEnemigos: Math.round(50 + 30 * d),
        suelo: [], lava: [], bloques: [], escaleras: [], enemigos: [],
        monedas: [], goteros: [], moviles: [], checkpoints: [],
        falsos: [], pinchos: [], bolas: [], emboscadas: [], carcajes: [], corazones: [], cristales: [],
        carteles: [], monedasTrampa: [], rocas: [], estatuasFalsas: [], mordedoras: [], banderasFalsas: [], persecuciones: [],
        plataformas: [], muros: [], antorchas: [], runas: [], alto: 0,
    };
    const BURLAS_CARTEL = ['¡SALTA AQUÍ!', 'ATAJO →', 'TODO BIEN :)', 'NO HAY TRAMPAS', 'CONFÍA', '¡CASI LLEGAS!'];
    const intervaloGota = () => Math.round(2200 - 800 * d);
    let x = 0;

    const llano = (largo, { enemigos = true, bloques = true, trampas = true } = {}) => {
        // suelo falso en medio del llano (siempre se puede saltar por encima)
        if (trampas && largo >= 600 && r() < 0.35 * d) {
            const a = entre(250, largo - 260);
            n.suelo.push([x, x + a], [x + a + 96, x + largo]);
            n.falsos.push([x + a, x + a + 96]);
        } else {
            n.suelo.push([x, x + largo]);
        }
        if (trampas && largo >= 500) {
            if (r() < 0.4 + 0.4 * d) n.pinchos.push([x + largo - 120, d > 0.6 ? 2 : 1, true]);
            if (r() < 0.4 + 0.4 * d) n.monedasTrampa.push([x + entre(160, largo - 160), 300]);
            if (r() < 0.3 + 0.4 * d) n.rocas.push(x + entre(200, largo - 200));
            if (r() < 0.25 * d) n.mordedoras.push([x + Math.round(largo / 2), 316]);
            if (r() < 0.3) n.carteles.push([x + entre(120, largo - 120), 150, BURLAS_CARTEL[entre(0, BURLAS_CARTEL.length - 1)]]);
            if (r() < 0.5 * d) n.emboscadas.push([x + 100, [x + 300, x + 450]]);
            if (r() < 0.25) n.carcajes.push([x + Math.round(largo / 2), 290]);
            if (r() < 0.3 + 0.3 * d) n.plantas.push(x + entre(220, largo - 160));
        }
        if (bloques && largo >= 500 && r() < 0.75) {
            const patrones = ['B?B', '?B?B?', 'BB?BB', '???', 'B??B', 'BEB', '?C?', 'C?C', 'E??', 'BCCB'];
            const p = patrones[entre(0, patrones.length - 1)];
            const bx = x + entre(150, largo - 350);
            n.bloques.push([bx, 232, p]);
            n.monedas.push(...fila(bx + 16, 190, p.length));
            if (r() < 0.5) {
                const ax = bx + p.length * 32 + 50;
                n.bloques.push([ax, 136, 'BBB']);
                n.monedas.push(...fila(ax + 16, 100, 3));
            }
        } else {
            n.monedas.push(...fila(x + 120, 300, 4));
        }
        if (enemigos) {
            const cuantos = 1 + Math.floor(r() * (1 + 2.5 * d));
            const paso = (largo - 250) / cuantos;
            for (let i = 0; i < cuantos; i++) n.enemigos.push(Math.round(x + 150 + i * paso + r() * paso * 0.5));
        }
        x += largo;
    };

    const hueco = () => {
        const g = entre(100, 110 + 40 * d);
        n.lava.push([x, x + g]);
        n.monedas.push(...arco(Math.round(x + g / 2 - 30), 230));
        if (r() < 0.25) n.cristales.push([Math.round(x + g / 2), 185]); // cristal sobre la lava
        if (r() < 0.6 * d) {
            n.bloques.push([x - 12, 232, 'H']); // bloque invisible en el borde
            if (r() < 0.5) n.carteles.push([x - 30, 175, '¡SALTA AQUÍ!']);
        }
        // plataforma tentadora en medio de la lava (el hueco se puede saltar sin ella)
        if (g >= 120 && r() < 0.4 * d) n.mordedoras.push([Math.round(x + g / 2), 284]);
        if (r() < 0.5 * d) n.bolas.push([Math.round(x + g / 2), entre(1800, 2600)]);
        else if (r() < 0.3 * d) n.espiritus.push([Math.round(x + g / 2), 170]);
        if (r() < 0.3 + 0.6 * d) n.goteros.push([Math.round(x + g / 2 - 31), intervaloGota()]);
        x += g;
    };

    const islas = () => {
        const inicio = x;
        const cuantas = d > 0.5 ? 3 : 2;
        x += 115;
        for (let i = 0; i < cuantas; i++) {
            n.bloques.push([x, 280, 'BBB']);
            n.monedas.push(...fila(x + 16, 245, 3));
            x += 96;
            if (i < cuantas - 1 && r() < d) {
                if (r() < 0.5) n.goteros.push([x + 57 - 31, intervaloGota()]);
                else n.bolas.push([x + 57, entre(1800, 2600)]);
            }
            x += 115;
        }
        n.lava.push([inicio, x]);
    };

    const puente = () => {
        const ancho = entre(380, 420 + 200 * d);
        n.lava.push([x, x + ancho]);
        n.moviles.push([x + 94, 300, 'x', ancho - 188, Math.round(70 + 40 * d)]);
        if (r() < d) n.espiritus.push([x + Math.round(ancho / 2), 140]);
        n.monedas.push(...fila(x + 100, 230, Math.floor((ancho - 200) / 40), 40));
        x += ancho;
    };

    const escalera = () => {
        const inicio = x;
        llano(520, { enemigos: false, bloques: false, trampas: false });
        n.escaleras.push([inicio + 200, d > 0.5 ? 4 : 3]);
    };

    // tramos especiales: piezas compartidas (tramos.js), las mismas que alargan los niveles hechos a mano
    const especial = t => { colocar(n, t, x); x += t.ancho; };
    const TRAMOS_ESPECIALES = {
        // bajada a un sótano: cada vez más largo (más difícil en niveles altos: más enemigos adentro)
        sotano: () => especial(tramoSotano(entre(600, 900 + Math.round(700 * d)), d)),
        torre4: () => especial(tramoTorre(4)), torre6: () => especial(tramoTorre(6)),
        puentesAltos: () => especial(tramoPuentesAltos()), dobleCamino: () => especial(tramoDobleCamino()),
        runa: () => especial(tramoAbismoRunico()), tunel: () => especial(tramoTunel(800)),
    };
    // en qué tramo va cada especial: repartidos a lo largo del nivel
    const posEspecial = new Map(especiales.map((e, k) => [Math.floor(((k + 1) * tramos) / (especiales.length + 1)), e]));

    // bajada inicial: se aparece en el borde del cráter y se baja por cornisas en zigzag sobre la lava
    if (bajadaInicial) {
        n.inicio = [60, -450]; // (el personaje cae un poco y se posa en la primera cornisa)
        n.plataformas.push([0, -300, 200], [250, -204, 120], [40, -108, 120], [250, -12, 120], [40, 84, 120], [250, 180, 120]);
        n.lava.push([0, 480]);
        n.alto = Math.max(n.alto, 520);
        x = 480;
    }

    const obstaculos = nombresObstaculos.map(o => ({ hueco, islas, puente, escalera })[o]);
    const CHECKPOINT_CADA = 2400; // un punto de control cada ~2400 px (los niveles generados son largos)
    let ultimoCheckpoint = 0;
    const ponerCheckpoint = cx => {
        if (r() < d) n.estatuasFalsas.push(cx - 30); // una estatua falsa justo antes de la real
        n.checkpoints.push(cx);
        ultimoCheckpoint = cx;
        if (r() < d) n.persecuciones.push(cx + 60); // y después, un gigante
        n.corazones.push([cx + 50, 290]); // un corazón junto a cada punto de control
    };
    llano(700, { enemigos: false, trampas: false });
    for (let i = 0; i < tramos; i++) {
        // un tramo especial reemplaza al obstáculo al azar (el punto de control y el llano siguen igual)
        if (posEspecial.has(i)) TRAMOS_ESPECIALES[posEspecial.get(i)]();
        else obstaculos[entre(0, obstaculos.length - 1)]();
        // después del obstáculo empieza un llano: el punto de control va al comienzo
        if (x - ultimoCheckpoint >= CHECKPOINT_CADA) ponerCheckpoint(x + 60);
        llano(entre(llanos[0], llanos[1]));
        // y al final del llano también se revisa (por si el obstáculo siguiente es largo)
        // (a 120 px del final: un suelo falso del llano termina como mucho a 164 px del final)
        if (x - ultimoCheckpoint >= CHECKPOINT_CADA) ponerCheckpoint(x - 120);
    }

    // meta falsa antes de la verdadera
    llano(700, { enemigos: false, bloques: false, trampas: false });
    n.banderasFalsas.push(x - 350);
    n.carteles.push([x - 350, 120, '¡META!']);
    if (d >= 1) {
        n.persecuciones.push(x - 600);
        llano(600, { bloques: false, trampas: false }); // tramo de la arena del jefe: sin suelo falso
    }

    // final: escalera, bandera y castillo
    const fin = x;
    const altura = d > 0.6 ? 5 : 4;
    llano(1100, { enemigos: false, bloques: false, trampas: false });
    n.escaleras.push([fin + 200, altura]);
    n.meta = fin + 200 + altura * 32 + 250;
    n.ancho = x;
    return n;
}

// ---------- NIVELES INFINITOS ----------
// Después de los niveles hechos a mano (NIVELES) sigue un camino de miles de niveles GENERADOS: cada uno
// es una "receta" (generarNivel) que se arma con su número como semilla al entrar, así que no pesan nada
// (en memoria solo está el nivel que se juega) y el nivel 347 es el mismo para todos.
//   - Van en MUNDOS de 10: el último de cada mundo trae al Rey Troll; los otros 9 no tienen jefe.
//   - Cada nivel es más difícil que el anterior: más largo, enemigos más rápidos y más tramos especiales
//     (torres, túneles, puentes altos, doble camino). La forma del suelo deja de crecer en la dificultad
//     1 (más, y los huecos ya no se podrían saltar): de ahí en adelante crecen el largo y la velocidad.
//   - Suelos de ladrillo medieval, como los niveles nuevos; cada mundo cambia de tema.
//   - MÁS ALLÁ (desde el nivel ~207, cuando lo de arriba ya llegó a su tope): sigue subiendo hasta el 5000,
//     de a poco (ver masAlla): enemigos más rápidos y con más vida, enemigos más duros en la mezcla,
//     dos personalidades juntas ("Tormenta ✦ Cuevas"), más sorpresas y menos puntos de control.
export const TOTAL_NIVELES = 5000;
export const NIVELES_POR_MUNDO = 10;
export const esInfinito = i => i >= NIVELES.length;
export const mundoDe = i => Math.floor(i / NIVELES_POR_MUNDO) + 1;

// TEMAS: cada mundo (10 niveles) tiene uno, en ciclo (28 temas: el mundo 29 vuelve al primero). Cambian todo
// lo que se ve y los enemigos (ambiente.js y mazmorra.js leen nivel.tema):
//   cueva / nubes: bajo tierra o al aire libre · tinte: el fondo de la cueva y la decoración
//   suelo: 'ladrillo' | 'piedra' y color: el tono del suelo (sin color, el de siempre)
//   cielo: degradado de 4 colores (al aire libre) · luna: su color · niebla / nieblaSuelo: colores
//   particulas: 'brasas' | 'luciernagas' | 'ceniza' | 'polvo' | 'lluvia' | 'nieve' | 'hojas' | 'esporas' |
//     'chispas' | 'burbujas' | 'arena' | 'petalos' | 'estrellas'  ·  colores: los de las partículas
//   relampagos: [mín, máx] ms entre relámpagos (sin esto, no hay) · mezcla: los enemigos del tema
// (los que están al lado se alternan: afuera y bajo tierra, y colores distintos)
const TEMAS = [
    { nombre: 'Las Ruinas Olvidadas', nubes: true, tinte: 0x9a9ab8, particulas: 'polvo', mezcla: ['zombie1', 'zombie2', 'esqueleto', 'zombie3'] },
    { nombre: 'Las Grutas Rojas', cueva: true, tinte: 0xc08070, particulas: 'brasas', mezcla: ['esqueleto', 'zombie3', 'alien_dark_gray', 'zombie2'] },
    { nombre: 'Los Pantanos Muertos', nubes: true, tinte: 0x7fa080, suelo: 'piedra', color: 0x9ac08a,
        cielo: ['#020604', '#0b1a12', '#1c3324', '#36503a'], luna: 0xd8ffc8, niebla: 0x8fbf8a, nieblaSuelo: 0x7fd07a,
        particulas: 'esporas', colores: [0xb8ff8a, 0x7fffb0], mezcla: ['zombie2', 'alien_green', 'zombie3', 'esqueleto'] },
    { nombre: 'Las Forjas del Troll', cueva: true, tinte: 0xb8503a, color: 0xffa070, particulas: 'chispas', colores: [0xffd27a, 0xff8a3d],
        mezcla: ['alien_armor', 'esqueleto', 'zombie3', 'alien_dark_gray'] },
    { nombre: 'Las Torres del Cielo', nubes: true, tinte: 0x9fb8ff, suelo: 'piedra',
        cielo: ['#050a1c', '#12234a', '#2a4778', '#5a7fb0'], particulas: 'lluvia', relampagos: [9000, 16000],
        mezcla: ['alien_armor', 'zombie3', 'alien_green', 'esqueleto'] },
    { nombre: 'El Abismo sin Fondo', cueva: true, tinte: 0xa58a9a, color: 0x9a7ab0, particulas: 'ceniza',
        mezcla: ['alien_armor', 'alien_dark_gray', 'esqueleto', 'zombie3'] },
    { nombre: 'El Bosque Helado', nubes: true, tinte: 0xc8e0ff, suelo: 'piedra', color: 0xe8f4ff,
        cielo: ['#0a1424', '#1c3048', '#3a5a7a', '#8fb0cc'], luna: 0xeaf4ff, niebla: 0xd8e8ff, nieblaSuelo: 0xe8f4ff,
        particulas: 'nieve', mezcla: ['esqueleto', 'alien_blue', 'zombie3', 'alien_gray'] },
    { nombre: 'Las Minas de Oro', cueva: true, tinte: 0xd8b060, suelo: 'piedra', color: 0xffd890, particulas: 'polvo', colores: [0xffe08a, 0xffc040],
        mezcla: ['zombie3', 'esqueleto', 'alien_gray', 'zombie1'] },
    { nombre: 'El Desierto de Huesos', nubes: true, tinte: 0xe0b880, color: 0xf0d0a0,
        cielo: ['#120a14', '#3a1a24', '#8a4a3a', '#e09a5a'], luna: 0xffe0b0, niebla: 0xe8c098, nieblaSuelo: 0xe0c090,
        particulas: 'arena', mezcla: ['esqueleto', 'zombie2', 'alien_red', 'zombie3'] },
    { nombre: 'La Cripta de Cristal', cueva: true, tinte: 0x80e0ff, suelo: 'piedra', color: 0xa0f0ff, particulas: 'estrellas', colores: [0x9ff0ff, 0xd8a0ff],
        mezcla: ['alien_blue', 'esqueleto', 'alien_gray', 'zombie3'] },
    { nombre: 'El Jardín de Calabazas', nubes: true, tinte: 0xff9a40, color: 0xd89a60,
        cielo: ['#0c0606', '#2a1208', '#4a2410', '#7a4018'], luna: 0xffa040, niebla: 0xffb070, nieblaSuelo: 0xa0c070,
        particulas: 'hojas', mezcla: ['zombie1', 'zombie2', 'zombie3', 'esqueleto'] },
    { nombre: 'El Reino de los Hongos', cueva: true, tinte: 0xd080ff, suelo: 'piedra', color: 0xe0a8ff, particulas: 'esporas', colores: [0xff8af0, 0xb08aff],
        mezcla: ['alien_green', 'zombie3', 'esqueleto', 'alien_dark_gray'] },
    { nombre: 'El Castillo Sangriento', nubes: true, tinte: 0xc04048, color: 0xb05058,
        cielo: ['#0a0204', '#2a060c', '#5a1018', '#8a2028'], luna: 0xff5a5a, niebla: 0xc08088, nieblaSuelo: 0xa06070,
        particulas: 'ceniza', colores: [0xff8a8a, 0xa04040], relampagos: [18000, 30000], mezcla: ['esqueleto', 'alien_red', 'zombie3', 'zombie2'] },
    { nombre: 'El Glaciar Eterno', cueva: true, tinte: 0x9fd0ff, suelo: 'piedra', color: 0xd0ecff, particulas: 'nieve',
        mezcla: ['alien_blue', 'esqueleto', 'alien_armor', 'zombie3'] },
    { nombre: 'El Mar de Niebla', nubes: true, tinte: 0xb0b8c8, suelo: 'piedra', color: 0xc0c8d8,
        cielo: ['#0a0c10', '#1c2028', '#3a4048', '#6a7078'], luna: 0xe0e8f0, niebla: 0xd0d8e0, nieblaSuelo: 0xd0d8e0,
        particulas: 'polvo', mezcla: ['zombie1', 'alien_gray', 'zombie3', 'esqueleto'] },
    { nombre: 'La Ciudad Hundida', cueva: true, tinte: 0x60c0b0, suelo: 'piedra', color: 0x80d8c8, particulas: 'burbujas', colores: [0xb0fff0, 0x80d0ff],
        mezcla: ['alien_green', 'alien_blue', 'zombie2', 'esqueleto'] },
    { nombre: 'El Volcán Dormido', nubes: true, tinte: 0xff6040, color: 0x8a5a50,
        cielo: ['#100404', '#3a0a06', '#7a2008', '#c04a10'], luna: 0xff8a50, niebla: 0xff9a70, nieblaSuelo: 0xc08060,
        particulas: 'brasas', mezcla: ['alien_red', 'zombie3', 'esqueleto', 'alien_armor'] },
    { nombre: 'La Biblioteca Maldita', cueva: true, tinte: 0xb09070, color: 0xc0a080, particulas: 'polvo', colores: [0xffe8c0, 0xd0c0a0],
        mezcla: ['esqueleto', 'zombie1', 'alien_dark_gray', 'zombie3'] },
    { nombre: 'La Selva Embrujada', nubes: true, tinte: 0x60c060, suelo: 'piedra', color: 0x88c890,
        cielo: ['#020804', '#081c0c', '#14361a', '#2a5a30'], luna: 0xd0ffd0, niebla: 0x90d090, nieblaSuelo: 0x70c070,
        particulas: 'luciernagas', mezcla: ['alien_green', 'zombie2', 'alien_predator_mask', 'zombie3'] },
    { nombre: 'El Nido de Arañas', cueva: true, tinte: 0x8a9a80, suelo: 'piedra', color: 0xa0a890, particulas: 'polvo', colores: [0xd0e0c0, 0xa0b090],
        mezcla: ['alien_dark_gray', 'esqueleto', 'zombie3', 'alien_gray'] },
    { nombre: 'El Bosque Otoñal', nubes: true, tinte: 0xe08040, color: 0xc08850,
        cielo: ['#0c0608', '#24101a', '#4a2030', '#8a4a40'], luna: 0xffd0a0, niebla: 0xe0a080, nieblaSuelo: 0xc09060,
        particulas: 'hojas', mezcla: ['zombie1', 'zombie2', 'esqueleto', 'alien_green'] },
    { nombre: 'La Cueva de los Ecos', cueva: true, tinte: 0x6070c0, suelo: 'piedra', particulas: 'estrellas', colores: [0xa0b0ff, 0xffffff],
        mezcla: ['alien_blue', 'alien_gray', 'esqueleto', 'zombie3'] },
    { nombre: 'El Templo del Sol Negro', nubes: true, tinte: 0xd8b040, color: 0xd8c080,
        cielo: ['#000000', '#120c02', '#3a2a08', '#6a5010'], luna: 0x4a3a18, niebla: 0xd8c080, nieblaSuelo: 0xb0a060,
        particulas: 'ceniza', colores: [0xffd060, 0x806020], mezcla: ['alien_armor', 'esqueleto', 'alien_red', 'zombie3'] },
    { nombre: 'El Corazón del Volcán', cueva: true, tinte: 0xff5020, color: 0x7a4030, particulas: 'brasas', colores: [0xffd060, 0xff5020],
        mezcla: ['alien_red', 'alien_armor', 'zombie3', 'esqueleto'] },
    { nombre: 'El Reino de Caramelo Podrido', nubes: true, tinte: 0xff90c0, color: 0xffb0d0,
        cielo: ['#10040c', '#3a0a2a', '#6a1a4a', '#b04a7a'], luna: 0xffd0ea, niebla: 0xffb0d8, nieblaSuelo: 0xffa0c0,
        particulas: 'petalos', mezcla: ['zombie1', 'alien_green', 'zombie2', 'esqueleto'] },
    { nombre: 'El Cementerio de Barcos', nubes: true, tinte: 0x70a0a0, suelo: 'piedra', color: 0x90a8a0,
        cielo: ['#020608', '#08161c', '#14303a', '#2a5058'], luna: 0xc0f0f0, niebla: 0x9ac0c0, nieblaSuelo: 0x80b0b0,
        particulas: 'lluvia', relampagos: [14000, 24000], mezcla: ['zombie2', 'esqueleto', 'alien_blue', 'zombie3'] },
    { nombre: 'Las Cumbres de la Tormenta', nubes: true, tinte: 0x8090b0, suelo: 'piedra', color: 0x9098b0,
        cielo: ['#02030a', '#0a1020', '#1a2440', '#3a4870'], luna: 0xc0d0ff, particulas: 'lluvia', relampagos: [5000, 9000],
        mezcla: ['alien_armor', 'alien_gray', 'zombie3', 'esqueleto'] },
    { nombre: 'El Fin del Mundo', nubes: true, tinte: 0xa060ff, suelo: 'piedra', color: 0x9a80c0,
        cielo: ['#05000c', '#1a0430', '#3a0a5a', '#7a2a8a'], luna: 0xd0a0ff, niebla: 0xc0a0ff, nieblaSuelo: 0xa080e0,
        particulas: 'estrellas', colores: [0xffffff, 0xd0a0ff], relampagos: [7000, 12000],
        mezcla: ['alien_predator_mask', 'alien_armor', 'alien_red', 'esqueleto'] },
];
// PERSONALIDADES: cada nivel generado tiene una, y le cambia la forma, el ritmo, la luz y las sorpresas
// (las más raras aparecen en niveles más altos). Se ve en el nombre: "Las Grutas Rojas 2-7 · Torres".
//   obstaculos/llanos/especiales: la forma del nivel · oscuridad: qué tan oscuro · cueva: con techo
//   locuras: sorpresas de locuras.js repartidas por el nivel · persecuciones: gigantes que te persiguen
//   bajada: se empieza arriba de un cráter y se baja por cornisas
const ARQUETIPOS = [
    { nombre: 'Clásico', desde: 0, obstaculos: ['hueco', 'hueco', 'islas', 'puente', 'escalera'], llanos: [450, 800] },
    { nombre: 'Torres', desde: 0, obstaculos: ['escalera', 'islas', 'hueco'], llanos: [380, 620], especiales: ['torre6', 'torre4', 'puentesAltos'], locuras: ['seta'] },
    { nombre: 'Cuevas', desde: 0, obstaculos: ['hueco', 'escalera', 'hueco'], llanos: [420, 700], especiales: ['sotano', 'tunel'], cueva: true, oscuridad: 0.8, luz: true, locuras: ['estalactita'] },
    { nombre: 'Mar de lava', desde: 0, obstaculos: ['islas', 'puente', 'hueco', 'islas'], llanos: [280, 480], especiales: ['dobleCamino', 'runa', 'puentesAltos'], locuras: ['monedaHuye'] },
    { nombre: 'Persecución', desde: 3, obstaculos: ['hueco', 'hueco', 'escalera'], llanos: [800, 1200], especiales: ['tunel'], persecuciones: 3, locuras: ['tronco'] },
    { nombre: 'Tormenta', desde: 6, obstaculos: ['islas', 'puente', 'hueco'], llanos: [450, 800], locuras: ['viento', 'viento', 'cartelCae'], nubes: true },
    { nombre: 'Cráter', desde: 10, obstaculos: ['hueco', 'islas', 'escalera'], llanos: [400, 700], bajada: true, especiales: ['sotano', 'torre4'] },
    { nombre: 'Embrujado', desde: 15, obstaculos: ['hueco', 'escalera', 'puente'], llanos: [420, 720], oscuridad: 0.75, luz: true, sombras: true, locuras: ['antorcha', 'quieto', 'sombra'] },
    { nombre: 'Pesadilla', desde: 25, obstaculos: ['islas', 'hueco', 'puente', 'escalera'], llanos: [350, 650], oscuridad: 0.82, luz: true, sombras: true, locuras: ['gravedad', 'sombra', 'quieto', 'viento'] },
];
const ESPECIALES_INF = ['torre4', 'tunel', 'dobleCamino', 'puentesAltos', 'torre6', 'runa', 'sotano', 'sotano'];
const SUBIDAS = ['torre4', 'torre6', 'puentesAltos'];

let guardado = null; // (solo el último nivel generado: no se juntan miles en memoria)
// la personalidad de un nivel: cada mundo baraja las desbloqueadas y las va dando en orden (así dos
// niveles seguidos nunca se parecen); el "Clásico" va al final, para que salga menos
function ordenDelMundo(mundo) {
    // (las desbloqueadas al EMPEZAR el mundo: la lista no cambia a mitad de mundo)
    const k = Math.max(0, (mundo - 1) * NIVELES_POR_MUNDO - NIVELES.length);
    const r = azar(mundo * 15485863 + 3);
    const otras = ARQUETIPOS.filter(a => k >= a.desde && a.nombre !== 'Clásico');
    for (let j = otras.length - 1; j > 0; j--) { const m = Math.floor(r() * (j + 1)); [otras[j], otras[m]] = [otras[m], otras[j]]; }
    return [...otras, ARQUETIPOS[0]];
}
// si el primero de un mundo repetiría el último del anterior, el mundo entero se corre un lugar
const corrimientos = new Map();
function corrimiento(mundo) {
    if (mundo <= 1) return 0;
    if (corrimientos.has(mundo)) return corrimientos.get(mundo);
    // (de a un mundo hacia atrás, sin recursión profunda: se calculan en orden)
    let c = 0;
    for (let w = 2; w <= mundo; w++) {
        if (corrimientos.has(w)) { c = corrimientos.get(w); continue; }
        const antes = ordenDelMundo(w - 1), ahora = ordenDelMundo(w);
        const ultimo = antes[(NIVELES_POR_MUNDO - 1 + (corrimientos.get(w - 1) ?? 0)) % antes.length];
        c = ahora[0] === ultimo ? 1 : 0;
        corrimientos.set(w, c);
    }
    return c;
}
function arquetipoDe(i) {
    const mundo = mundoDe(i), orden = ordenDelMundo(mundo);
    return orden[(i % NIVELES_POR_MUNDO + corrimiento(mundo)) % orden.length];
}
export function nivelPorIndice(i) {
    if (!esInfinito(i)) return NIVELES[i];
    if (guardado?.i === i) return guardado.nivel;
    guardado = { i, nivel: nivelInfinito(i) };
    return guardado.nivel;
}

function nivelInfinito(i) {
    const k = i - NIVELES.length;                 // 0 = el primer nivel infinito
    const mundo = mundoDe(i), enMundo = i % NIVELES_POR_MUNDO + 1;
    const tema = TEMAS[(mundo - 1) % TEMAS.length];
    const conJefe = enMundo === NIVELES_POR_MUNDO;
    const r = azar(i * 7919 + 13);
    const arq = arquetipoDe(i);
    const mas = masAlla(i, k, arq);
    // cuántos tramos especiales y cuáles (al azar, pero siempre los mismos para este nivel)
    // siempre al menos una subida y una bajada a un sótano; con el nivel, más de todo
    const cuantos = Math.min(8, 2 + Math.floor(k / 12));
    // (con más peso los de su personalidad)
    const pool = arq.especiales ? [...arq.especiales, ...arq.especiales, ...ESPECIALES_INF] : ESPECIALES_INF;
    const especiales = [SUBIDAS[Math.floor(r() * SUBIDAS.length)], 'sotano',
        ...Array.from({ length: cuantos - 2 }, () => pool[Math.floor(r() * pool.length)])];
    for (let j = especiales.length - 1; j > 0; j--) { const m = Math.floor(r() * (j + 1)); [especiales[j], especiales[m]] = [especiales[m], especiales[j]]; }
    const n = generarNivel({
        nombre: `${tema.nombre} ${mundo}-${enMundo} · ${arq.nombre}${mas.arq2 ? ` ✦ ${mas.arq2.nombre}` : ''}`,
        semilla: i * 104729 + 7,
        dificultad: Math.min(1, 0.6 + k * 0.01),
        tramos: Math.min(26, 12 + Math.floor(k / 3)),     // más largo en cada nivel (tope: muchos enemigos a la vez pesan en el celular)
        cueva: !!(arq.cueva ?? tema.cueva), nubes: !!(arq.nubes ?? tema.nubes) && !arq.cueva, tinte: tema.tinte, mezcla: mas.mezcla(tema.mezcla),
        especiales, obstaculos: arq.obstaculos, llanos: arq.llanos, bajadaInicial: !!arq.bajada,
    });
    n.arquetipo = arq.nombre;
    n.tema = tema; // (ambiente.js y mazmorra.js: cielo, luna, niebla, partículas, relámpagos y suelo)
    // (con dos personalidades: la oscura manda en la luz)
    const oscura = [arq, mas.arq2].find(a => a?.luz);
    if (arq.oscuridad) n.oscuridad = arq.oscuridad;
    if (oscura && !arq.oscuridad) n.oscuridad = oscura.oscuridad;
    // luz de antorcha y braseros (luz.js): cada ~1100-1500 px, en suelo firme lejos de la lava
    if (oscura) {
        n.luz = { oscuridad: Math.min(0.95, oscura.oscuridad + 0.1), sombras: !!oscura.sombras };
        n.braseros = [];
        const huecos = [...n.lava, ...n.falsos];
        let proximo = 1200;
        (n.suelo || []).forEach(([a, b]) => {
            for (let x = Math.max(a + 150, proximo); x < b - 150 && x < n.meta - 400; x += 100) {
                if (huecos.some(([h0, h1]) => x > h0 - 150 && x < h1 + 150)) continue;
                n.braseros.push(x);
                proximo = x + 1100 + Math.round(r() * 400);
                break;
            }
            while (proximo < b - 150) {
                const x = proximo;
                if (x >= n.meta - 400) break;
                if (!huecos.some(([h0, h1]) => x > h0 - 150 && x < h1 + 150) && x > a + 150) { n.braseros.push(x); proximo = x + 1100 + Math.round(r() * 400); }
                else proximo += 100;
            }
        });
    }
    // sus sorpresas, repartidas por el suelo firme (más en cada nivel)
    const locuras = [...(arq.locuras || []), ...(mas.arq2?.locuras || [])];
    if (locuras.length) {
        const huecos = [...n.lava, ...n.falsos];
        const libres = [];
        (n.suelo || []).forEach(([a, b]) => { for (let x = Math.max(a + 200, 1000); x < b - 200 && x < n.meta - 1500; x += 120) {
            if (!huecos.some(([h0, h1]) => x > h0 - 200 && x < h1 + 200)) libres.push(x);
        } });
        const cuantas = Math.min(10, 3 + Math.floor(k / 30)) + mas.locurasExtra;
        n.locuras = n.locuras || [];
        for (let j = 0; j < cuantas && libres.length; j++) {
            const x = libres.splice(Math.floor(r() * libres.length), 1)[0];
            for (let q = libres.length - 1; q >= 0; q--) if (Math.abs(libres[q] - x) < 700) libres.splice(q, 1);
            const tipo = locuras[j % locuras.length];
            n.locuras.push(tipo === 'viento' ? [x, tipo, r() < 0.5 ? 1 : -1] : [x, tipo]);
        }
    }
    // gigantes que te persiguen
    const persecuciones = Math.max(arq.persecuciones || 0, mas.arq2?.persecuciones || 0);
    for (let j = 0; j < persecuciones; j++) n.persecuciones.push(Math.round(1500 + (n.meta - 3500) * (j + 1) / (persecuciones + 1)));
    n.velEnemigos = Math.min(120, 80 + Math.floor(k * 0.4)) + mas.velExtra; // más rápidos en cada nivel
    n.vidaExtra = mas.vidaExtra; // (game.js: cada enemigo aguanta más golpes)
    // menos puntos de control (el último, antes del jefe o de la meta, queda siempre)
    if (mas.sinCheckpoints) n.checkpoints = n.checkpoints.filter((_c, j, t) => j % 2 === 0 || j === t.length - 1);
    // más enemigos: uno cada 'paso' px de suelo firme (más juntos en cada nivel), con tope por los celulares
    const paso = Math.max(300, 620 - k * 3);
    const huecos = [...n.lava, ...n.falsos];
    const fin = n.meta - (conJefe ? 1500 : 500);
    const tope = 110;
    (n.suelo || []).forEach(([a, b]) => {
        for (let x = Math.max(a + 120, 900); x < Math.min(b - 120, fin) && n.enemigos.length < tope; x += paso) {
            if (huecos.some(([h0, h1]) => x > h0 - 120 && x < h1 + 120)) continue;
            if (n.enemigos.some(e => Math.abs((Array.isArray(e) ? e[0] : e) - x) < 160)) continue;
            n.enemigos.push(Math.round(x + r() * 60));
        }
    });
    n.estilo = 'infinito';
    n.sinJefe = !conJefe;
    n.mundo = mundo;
    return n;
}

// MÁS ALLÁ del nivel ~207 (k: niveles infinitos desde el primero): lo que sigue subiendo cuando lo
// demás ya llegó a su tope. Todo va de a poco, para que el 5000 sea el más difícil:
// (con raíz cuadrada: se nota rápido al principio y sigue subiendo, más despacio, hasta el 5000)
//   velExtra: velocidad de los enemigos: +6 en el 300, +14 en el 800, +25 en el 2200, +40 en el 5000
//   vidaExtra: golpes de más para cada enemigo: +1 desde el ~740, +2 desde el ~2330, +3 desde el ~4980
//   mezcla: enemigos más duros reemplazan a los más débiles del tema (1 desde el 300, 2 desde el 700, 3 desde el 2200)
//   arq2: desde el 300, a veces (cada vez más) una SEGUNDA personalidad: sus locuras y su oscuridad
//   locurasExtra: sorpresas de más: +1 en el ~400, +2 en el ~970, +3 en el ~1900, +4 en el ~3250, +5 en el ~4960
//   sinCheckpoints: desde el 500, la mitad de los puntos de control
const DUROS = ['alien_predator_mask', 'alien_red', 'alien_armor'];
function masAlla(i, k, arq) {
    const extra = Math.max(0, k - 200);
    const r = azar(i * 31337 + 5); // (aparte: no cambia el resto del nivel)
    let arq2 = null;
    if (extra >= 100 && r() < Math.min(0.85, 0.3 + (extra - 100) / 8000)) {
        const otras = ARQUETIPOS.filter(a => a !== arq && a.nombre !== 'Clásico' && k >= a.desde);
        arq2 = otras[Math.floor(r() * otras.length)] || null;
    }
    const duros = extra < 100 ? 0 : extra < 500 ? 1 : extra < 2000 ? 2 : 3;
    return {
        arq2,
        velExtra: Math.min(40, Math.floor(Math.sqrt(extra) * 0.57)),
        vidaExtra: Math.min(3, Math.floor(Math.sqrt(extra / 530))),
        locurasExtra: Math.min(5, Math.floor(Math.sqrt(extra / 190))),
        sinCheckpoints: extra >= 300,
        // los primeros de la mezcla del tema (los más débiles) se cambian por duros
        mezcla: m => m.map((t, j) => (j < duros ? DUROS[(i + j) % DUROS.length] : t)).filter((t, j, a) => a.indexOf(t) === j),
    };
}

// SÓTANO (niveles infinitos): se sube por escalones a un bloque de ladrillo y desde ahí se BAJA a un túnel
// techado a ras del suelo (el sótano), con enemigos y monedas; se sale por el otro lado.
//   largo: lo que mide el túnel; d: dificultad (más enemigos adentro)
function tramoSotano(largo, d) {
    const A = 140;                                  // lo alto del bloque de la entrada
    const subida = [0, 1, 2, 3, 4].map(i => [40 + i * 48, SUELO_Y - 38 * (i + 1), 44]);
    const bajada = [0, 1, 2, 3, 4].map(i => [500 + i * 44, A + 32 * (i + 1), 44]);
    const t0 = 740, t1 = t0 + largo, ancho = t1 + 220;
    const adentro = 2 + Math.round(3 * d);
    return {
        ancho,
        suelo: [[0, ancho]],
        muros: [[280, A, 220]],
        plataformas: [...subida, ...bajada],
        techos: [[t0, t1, 200]],
        enemigos: Array.from({ length: adentro }, (_, i) => Math.round(t0 + 150 + i * (largo - 250) / Math.max(1, adentro - 1))),
        monedas: Array.from({ length: Math.floor(largo / 120) }, (_, i) => [t0 + 80 + i * 120, 300]),
        carteles: [[400, A - 40, '⬇ SÓTANO']],
    };
}
