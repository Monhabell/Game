// Definición de niveles.
// Coordenadas: el suelo tiene su parte superior en y = 332.
//   - Bloques "fila baja": y = 232 (se pueden golpear desde el suelo y caminar por debajo)
//   - Bloques "fila alta": y = 136 (se alcanzan saltando desde la fila baja)
// Patrón de bloques: 'B' = ladrillo, '?' = bloque sorpresa (da moneda), ' ' = hueco
//   Trampas estilo Cat Mario:
//   'E' = parece '?' pero suelta un enemigo
//   'C' = ladrillo que cae cuando pasas por debajo
//   'H' = bloque invisible (aparece al golpearlo desde abajo; ideal en el borde de un hueco)
//   'F' = ladrillo falso, no tiene piso
// falsos: [xInicio, xFin] suelo que se derrumba al pisarlo (tiene lava debajo)
// pinchos: [x, cantidad, oculto] (los ocultos salen del suelo cuando te acercas)
// bolas: [x, cadaCuantosMs] bolas de fuego que saltan desde la lava
// emboscadas: [xAviso, [x de cada enemigo]] al pasar por xAviso caen enemigos del cielo
// carcajes: [x, y] dan +5 flechas
// mezcla: tipos de enemigos que caminan en el nivel (se van turnando); ver enemigos.js
// plantas: x de plantas disfrazadas de arbusto (¡no las pises, tienen espinas!)
// espiritus: [x, y] espíritus de fuego que vuelan y disparan
// suelo / lava: rangos [xInicio, xFin]
// enemigos: x (aparece en el suelo) o [x, y]
// goteros: [x, cadaCuantosMs] (gotas de lava que caen del techo)
// moviles: [x, y, eje 'x'|'y', recorrido, velocidad]
// escaleras: [x, altura en bloques]
// meta: x de la bandera
// checkpoints: x donde reaparece Gesi si muere después de pasar por ahí
// velEnemigos: velocidad de los enemigos (sube en cada nivel)
// Una gota de lava golpea en x + 31 respecto a su gotero: los goteros se ponen
// sobre huecos o suelo, nunca sobre una plataforma en la que haya que pararse.

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
        velEnemigos: 40,
        checkpoints: [2400],
        mezcla: ['zombie1', 'zombie2', 'zombie3', 'esqueleto'],
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
        mezcla: ['esqueleto', 'zombie2', 'zombie3', 'esqueleto', 'zombie1'],
        plantas: [1250, 3600, 5000],
        espiritus: [[1440, 190], [2840, 170], [4560, 190]],
        suelo: [[0, 700], [850, 1400], [1540, 1740], [1950, 2600], [3100, 3800], [3950, 4500], [4650, 6000]],
        falsos: [[1740, 1800]],
        bolas: [[760, 2500], [1455, 2200], [2842, 2300], [3860, 2000]],
        pinchos: [[4380, 2, true]],
        emboscadas: [[3300, [3500, 3650]]],
        carcajes: [[1200, 290], [3200, 270]],
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
        nubes: true,
        tinte: 0xffb38a,
        velEnemigos: 55,
        checkpoints: [2350, 3450],
        mezcla: ['alien_green', 'alien_blue', 'esqueleto', 'zombie3'],
        plantas: [1550, 2550],
        espiritus: [[850, 140], [2000, 150], [4350, 150]],
        suelo: [[0, 600], [1100, 1700], [2300, 2700], [3400, 4000], [4700, 6300]],
        falsos: [[2700, 2800]],
        bolas: [[1000, 2400], [2000, 2100], [3330, 2200], [4300, 2000]],
        pinchos: [[3820, 2, true]],
        emboscadas: [[5000, [5150, 5250]]],
        carcajes: [[1150, 290], [4750, 290]],
        lava: [[600, 1100], [1700, 2300], [2800, 3400], [4000, 4700]],
        moviles: [
            [694, 300, 'x', 312, 70],
            [1794, 300, 'x', 412, 90],
            [2894, 300, 'x', 150, 60],
            [4094, 290, 'x', 250, 90],
            [5350, 236, 'y', 110, 45], // ascensor de bonus
        ],
        bloques: [
            [590, 232, 'H'],
            [1250, 232, 'B?B'],
            [2400, 232, '?BEB?'],
            [3140, 280, 'BBBB'],
            [3480, 232, 'BB'],
            [3600, 136, 'BBBBBB'],
            [4440, 280, 'BBBB'],
            [5000, 232, 'B?C?B'],
        ],
        escaleras: [[5600, 4]],
        enemigos: [450, 1300, 1500, 2450, 2650, 3700, 3900, 4900, 5050, 5200, 5450],
        monedas: [
            ...fila(150, 300, 4),
            ...fila(780, 230, 6),
            ...fila(1900, 230, 8),
            ...fila(3156, 245, 4),
            ...fila(3616, 100, 6),
            ...fila(4180, 220, 5),
            ...fila(5310, 75, 4),
        ],
        goteros: [[2600, 1600], [3550, 1500], [4900, 1500]],
        meta: 5900,
    },
    {
        nombre: 'La Fortaleza',
        ancho: 6900,
        cueva: true,
        tinte: 0x7a5aa8,
        velEnemigos: 65,
        checkpoints: [1950, 2880, 4250],
        mezcla: ['esqueleto', 'alien_armor', 'alien_red', 'zombie1', 'alien_predator_mask'],
        plantas: [1000, 2100, 4700, 5850],
        espiritus: [[1600, 140], [3850, 150], [5075, 180]],
        suelo: [[0, 500], [640, 1300], [1900, 2400], [2600, 2700], [2850, 3500], [4200, 5000], [5150, 6900]],
        falsos: [[2550, 2600]],
        bolas: [[570, 1800], [1600, 2200], [2475, 1700], [2775, 1700], [3550, 2000], [5075, 1700]],
        pinchos: [[5450, 2, true], [6050, 1, true]],
        emboscadas: [[4300, [4500, 4650, 4800]], [5600, [5800, 5950]]],
        carcajes: [[700, 290], [4250, 280]],
        lava: [[500, 640], [1300, 1900], [2400, 2550], [2700, 2850], [3500, 4200], [5000, 5150]],
        moviles: [
            [1394, 300, 'x', 412, 100],
            [3810, 250, 'x', 230, 80],
        ],
        bloques: [
            [490, 232, 'H'],
            [850, 232, '?BEB?'],
            [2000, 232, 'B?B'],
            [2950, 232, 'BBB'],
            [3080, 136, 'BBBB'],
            [3250, 232, '?E?'],
            [3490, 232, 'H'],
            [3620, 280, 'BBB'],
            [4400, 232, 'BC?C?CB'],
            [5500, 232, 'BCCB'],
        ],
        escaleras: [[5300, 3], [6100, 5]],
        enemigos: [350, 800, 950, 1100, 1250, 2050, 2200, 2600, 3000, 3200, 3350, 3450,
            4350, 4500, 4650, 4800, 4950, 5600, 5750, 5900, 6000],
        monedas: [
            ...arco(540, 230),
            ...fila(1450, 230, 10),
            ...arco(2445, 230),
            ...arco(2745, 230),
            ...fila(3096, 100, 4),
            ...fila(3636, 245, 3),
            ...fila(3850, 200, 5),
            ...fila(5516, 190, 4),
            ...fila(6200, 100, 3),
        ],
        goteros: [[539, 1500], [1600, 2000], [2444, 1400], [2744, 1400], [3950, 2000], [4600, 1400], [5044, 1400]],
        meta: 6450,
    },
    generarNivel({
        nombre: 'El Volcán', semilla: 7, dificultad: 0.75, tramos: 11, cueva: true, tinte: 0xb8503a,
        mezcla: ['esqueleto', 'zombie1', 'alien_dark_gray', 'zombie3', 'alien_gray', 'esqueleto'],
    }),
    generarNivel({
        nombre: 'El Reino de las Nubes', semilla: 21, dificultad: 1, tramos: 14, nubes: true, tinte: 0x9fb8ff,
        mezcla: ['alien_green', 'alien_blue', 'alien_red', 'alien_predator_mask', 'alien_armor', 'esqueleto'],
    }),
];

// Generador de niveles grandes a partir de "tramos" que siempre se pueden pasar.
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

function generarNivel({ nombre, semilla, dificultad: d, tramos, cueva = false, nubes = false, tinte, mezcla }) {
    const r = azar(semilla);
    const entre = (a, b) => Math.round(a + r() * (b - a));
    const n = {
        nombre, cueva, nubes, tinte, mezcla, plantas: [], espiritus: [],
        velEnemigos: Math.round(50 + 30 * d),
        suelo: [], lava: [], bloques: [], escaleras: [], enemigos: [],
        monedas: [], goteros: [], moviles: [], checkpoints: [],
        falsos: [], pinchos: [], bolas: [], emboscadas: [], carcajes: [],
    };
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
        if (r() < 0.6 * d) n.bloques.push([x - 12, 232, 'H']); // bloque invisible en el borde
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

    const obstaculos = [hueco, hueco, islas, puente, escalera];
    llano(700, { enemigos: false, trampas: false });
    for (let i = 0; i < tramos; i++) {
        obstaculos[entre(0, obstaculos.length - 1)]();
        if (i === Math.floor(tramos / 3) || i === Math.floor((2 * tramos) / 3)) n.checkpoints.push(x + 60);
        llano(entre(450, 800));
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
