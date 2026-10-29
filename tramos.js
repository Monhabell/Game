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

// cueva inundada (agua.js): se sube por dos escalones a un muro, se salta al agua y se cruza BUCEANDO bajo
// un techo de roca. Para respirar: los huecos entre los techos (bolsas de aire, se asoma la cabeza) y las
// columnas de burbujas en los techos largos. Al final se nada hasta arriba y se sale por el otro muro.
// d: dificultad (0,6 a 1): techos más largos (más tiempo sin aire). Nunca más de ~560 px sin aire
// (buceando se avanzan ~130 px/s: con 6 s de aire, alcanza con margen)
export const SUPERFICIE_AGUA = SUELO_Y - 210;
export function tramoInundado(largo, d = 0.6) {
    const S = SUELO_Y, sup = SUPERFICIE_AGUA, MURO = 40, BOLSA = 110, ABRE = 150;
    const x0 = 200, x1 = largo - 200; // el agua, entre los dos muros
    const t = {
        ancho: largo, suelo: [[0, largo]],
        muros: [[x0 - MURO, sup - 6, MURO], [x1, sup - 6, MURO]],
        // escalones para subir al muro (y para bajar del otro lado)
        plataformas: [[20, S - 72, 60], [90, S - 144, 60], [x1 + MURO + 50, S - 144, 60], [x1 + MURO + 120, S - 72, 60]],
        agua: [[x0, x1, sup]], techos: [], burbujas: [], monedas: [],
        burbujasFalsas: [], criaturas: [], corrientes: [], algas: [], rejas: [],
        carteles: [[60, 150, '🫧 AGUANTA LA RESPIRACIÓN']],
    };
    // los peligros llegan con la dificultad (d va de 0,6 a 1): peces, algas, medusas, corrientes, rejas y
    // la burbuja troll. Siempre donde no dejan sin aire: la burbuja troll va en un techo corto (sin
    // burbujas de verdad, se llega a la siguiente bolsa) y la reja, junto a una bolsa de aire
    const largoTecho = Math.round(300 + 260 * Math.min(1, d)); // de 456 a 560
    let a = x0 + ABRE;
    while (a < x1 - ABRE - 120) {
        const b = Math.min(a + largoTecho, x1 - ABRE);
        t.techos.push([a, b, sup + 60]); // (el techo baja 60 px dentro del agua: ahí no se respira)
        if (b - a > 380) t.burbujas.push(Math.round((a + b) / 2)); // en los largos, una columna de burbujas
        t.monedas.push(...fila(a + 60, S - 80, Math.max(2, Math.floor((b - a - 120) / 64)), 64));
        t.monedas.push(...fila(b + 30, sup - 26, 2)); // (en la bolsa de aire, arriba)
        const n = t.techos.length; // (cuántos techos van, contando este)
        if (d >= 0.65 && n % 2 === 1) t.criaturas.push([Math.round((a + b) / 2) - 90, 'pez']);
        if (d >= 0.7 && n % 3 === 2) t.algas.push(Math.round(a + 90));
        if (d >= 0.8 && n % 2 === 0) t.criaturas.push([Math.round((a + b) / 2) + 80, 'medusa']);
        if (d >= 0.75 && n === 2) t.corrientes.push([a, b, n % 4 === 2 ? -1 : 1]);
        a = b + BOLSA;
    }
    // la reja: en la bolsa de aire del medio; su palanca, en el fondo justo antes
    if (d >= 0.85 && t.techos.length >= 2) {
        const [, bm] = t.techos[0];
        t.rejas.push([bm + BOLSA - 10, 70]);
    }
    // la burbuja troll: al final de la cueva (cerca de la salida, el aire nunca es problema)
    if (d >= 0.9) t.burbujasFalsas.push(x1 - ABRE + 40);
    return t;
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

// bifurcación (carreras): DOS caminos sobre el mismo tramo, para decidir si arriesgar la ventaja.
//   Arriba, LARGO y SEGURO: se sube en zigzag (como la torre: escalones de 96 px, huecos de 60 px),
//   se cruzan islas altas (huecos de ≤ 160 px casi a la misma altura) y un puente móvil que hay
//   que esperar; al final se baja de un salto. Sin trampas: ahí solo hay monedas y un cristal.
//   Abajo, CORTO: suelo llano de punta a punta... con trampas ocultas que pone la pista (pistas.js)
//   en la zona 'atajos' (azar.js no reparte nada ahí). Las islas altas están a 384 px del suelo:
//   no son techo bajo para el que va por abajo.
// Los carteles del comienzo dicen la verdad (por una vez).
export function tramoBifurcacion() {
    const largo = 2600, cima = -52;
    return {
        ancho: largo, alto: 470,
        suelo: [[0, largo]],
        plataformas: [
            [150, 236, 120], [330, 140, 120], [150, 44, 120], [330, cima, 140], // subida
            [600, cima, 180], [930, cima - 28, 150], [1240, cima, 160],           // islas
            [1800, cima, 180], [2120, cima + 12, 200],
        ],
        moviles: [[1470, cima - 24, 'x', 220, 65]], // puente móvil: hay que esperarlo (cuesta tiempo)
        monedas: [...fila(625, cima - 35, 5), ...fila(950, cima - 63, 4), ...fila(1260, cima - 35, 4), ...fila(1825, cima - 35, 5), ...fila(2150, cima - 23, 5)],
        cristales: [[1290, cima - 110]],
        antorchas: [[110, 180], [500, 180]],
        carteles: [[90, 150, '↑ LARGO Y SEGURO'], [520, 200, 'ATAJO →']],
        atajos: [[480, 2420]],
    };
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

// ---------- Carrera: Las Ruinas del Abismo (pistas.js, mecanismos propios en abismo.js) ----------
// Siete zonas seguidas. Cada pieza trae sus trampas puestas a mano (la pista no usa azar.js): así
// todos corren exactamente lo mismo y se pueden aprender los patrones. Solo las "losas dudosas"
// cambian con la semilla de la sala (una de cada tres es falsa).
// Plataformas 'fragil': tiemblan 0,7 s al pisarlas, caen y vuelven a los 3 s (locura 'puente');
// se distinguen por las grietas que dibuja abismo.js.

// Zona 1 · La Salida Explosiva: salida ancha, un foso fácil y la primera bifurcación opcional:
// arriba una cornisa con premio (subir cuesta ~1,5 s), abajo un foso y pinchos a la vista.
// La cornisa está a y = 60: no es techo bajo para el que va por abajo (la cabeza llega a 135).
export function zonaSalida() {
    return {
        ancho: 2200, alto: 160,
        suelo: [[0, 1000], [1100, 1600], [1700, 2200]],
        lava: [[1000, 1100], [1600, 1700]],
        plataformas: [[1150, 236, 120], [1330, 140, 120], [1500, 60, 500]],
        pinchos: [[1880, 2, false]],
        monedas: [...fila(1530, 25, 8, 56), ...fila(1180, 200, 3)],
        cristales: [[1760, -10]],
        escudos: [[1960, 30]],
        carteles: [[1060, 150, '↑ RUTA ALTA'], [1240, 300, 'RUTA BAJA →']],
        enemigos: [2120],
        zonas: [[0, 'LA SALIDA EXPLOSIVA']],
    };
}

// Zona 2 · El Puente de la Muerte: tablones de 96 px sobre un río de lava, unos firmes y otros
// frágiles. Antes de cada salto con bola de fuego hay un tablón FIRME (ahí se espera sin que se
// caiga). El tramo roto mide 184 px (se salta con el salto más corto: 220 px).
export function zonaPuente() {
    return {
        ancho: 2200,
        suelo: [[0, 360], [1060, 1300], [1960, 2200]],
        lava: [[360, 1060], [1300, 1960]],
        plataformas: [
            [400, 300, 96, 'fragil'], [540, 300, 96], [820, 300, 96], [950, 300, 96, 'fragil'],
            [1340, 300, 96, 'fragil'], [1480, 290, 96], [1620, 280, 96, 'fragil'], [1760, 300, 96],
        ],
        bolas: [[728, 2400], [1908, 2600]],
        pinchos: [[1180, 1, false]],
        puentes: [[360, 1060, 728], [1300, 1960, -1]], // [inicio, fin, x del tramo roto] (cuerdas: abismo.js)
        monedas: [[700, 240], [728, 220], [756, 240], ...fila(1500, 255, 3)],
        zonas: [[0, 'EL PUENTE DE LA MUERTE']],
    };
}

// Zona 3 · El Túnel Maldito: 360 px de suelo firme y una caverna de techos variables (136 a 172 px
// de alto). Sin trampas de suelo: aplastadores que avisan (polvo y runas rojas 0,6 s) y caen con
// un ritmo fijo, el mismo para todos (reloj de la carrera). Un foso corto donde el techo es más alto.
export function zonaTunel() {
    return {
        ancho: 2200,
        suelo: [[0, 1150], [1230, 2200]],
        lava: [[1150, 1230]],
        techos: [[360, 900, 196], [900, 1400, 160], [1400, 1800, 196], [1800, 2000, 176]],
        // [x, ciclo ms, desfase ms]: 64 px de ancho; seguros ~1,4 s de cada ciclo
        aplastadores: [[600, 2800, 0], [1000, 2600, 1300], [1530, 2400, 700], [1650, 2400, 1900], [1880, 2800, 400]],
        antorchas: [[500, 240], [1300, 210], [1760, 240]],
        cuevas: [[360, 2000]], // oscuridad visual del túnel (abismo.js)
        enemigos: [800, 1400],
        monedas: [...fila(420, 300, 3, 48), ...fila(1160, 230, 3, 28), ...fila(2050, 300, 3)],
        zonas: [[0, 'EL TÚNEL MALDITO']],
    };
}

// Zona 4 · El Atajo Maldito: arriba la senda del guardián de tramoBifurcacion (larga, ancha,
// un puente móvil que se espera). Abajo, el atajo: foso con bola de fuego, suelo que se hunde en
// cadena, un portal que solo se abre a ratos (se salta el géiser) o el foso del géiser, una roca
// del techo y otro foso. Se reúnen al final (la última isla de arriba baja al suelo de abajo).
export function zonaAtajo() {
    const t = tramoBifurcacion();
    return {
        ...t,
        suelo: [[0, 700], [880, 950], [1250, 1500], [1690, 2000], [2160, 2600]],
        falsos: [[950, 1050], [1050, 1150], [1150, 1250]],
        lava: [[700, 880], [1500, 1690], [2000, 2160]],
        bolas: [[790, 2600], [2080, 2500]],
        locuras: [[1100, 'cadena'], [1500, 'geiser', 1690]],
        rocas: [1860],
        // [x, y de los pies, salto en x, y de llegada, ms abierto, ms cerrado]
        portales: [[1380, 332, 380, 332, 1400, 2600]],
        carteles: [[90, 150, '↑ SENDA SEGURA'], [540, 200, '☠ ATAJO MALDITO →']],
        zonas: [[0, 'EL ATAJO MALDITO']],
    };
}

// Zona 5 · El Suelo Mentiroso: tríos de losas (una es falsa: deja escapar brillo de lava por las
// juntas), grietas que asustan pero son firmes, un suelo que se desliza sobre la lava, una losa
// que muerde y un suelo agrietado que solo castiga al que se queda quieto
export function zonaSueloMentiroso() {
    return {
        ancho: 1800,
        suelo: [[0, 400], [688, 800], [1060, 1440], [1728, 1800]],
        lava: [[800, 1060]],
        losasDudosas: [400, 1440], // cada una: tres losas de 96 px (pistas.js elige la falsa)
        moviles: [[874, 316, 'x', 112, 70]], // (128 px de ancho: nunca toca las orillas; huecos de 10 a 122 px)
        mordedoras: [[1140, 316]],
        locuras: [[1330, 'quieto']],
        grietasFalsas: [300, 1220],
        monedas: [...fila(700, 300, 3), ...fila(1080, 300, 2), ...fila(1260, 300, 3)],
        zonas: [[0, 'EL SUELO MENTIROSO']],
    };
}

// Zona 6 · La Persecución: al pasar por x = 300 despierta el Muro del Abismo (aparece 520 px
// detrás, avisa 1 s y avanza a 165 px/s: el héroe más lento corre a 209). Nada obliga a esperar:
// fosos de ≤ 150 px, pinchos a la vista, una roca del techo y dos plataformas sobre la lava.
export function zonaPersecucion() {
    return {
        ancho: 2300,
        suelo: [[0, 520], [640, 1000], [1150, 1500], [1620, 1700], [2040, 2300]],
        lava: [[520, 640], [1000, 1150], [1500, 1620], [1700, 2040]],
        plataformas: [[1720, 250, 140], [1900, 250, 140]],
        pinchos: [[800, 2, false]],
        rocas: [1300],
        murosAbismo: [[300, 2150]],
        monedas: [...fila(1740, 215, 3), ...fila(1920, 215, 3)],
        zonas: [[0, 'LA PERSECUCIÓN']],
    };
}

// Zona 7 · La Llegada: un último foso con bola de fuego y la recta final hasta el Portal de la
// meta (se ve desde lejos: columna de luz). Sin trampas en la recta: se gana corriendo.
export function zonaLlegada() {
    return {
        ancho: 1900,
        suelo: [[0, 500], [640, 1900]],
        lava: [[500, 640]],
        bolas: [[570, 2200]],
        monedas: [...fila(800, 300, 4), ...fila(1100, 300, 4)],
        zonas: [[0, 'LA LLEGADA']],
    };
}

// ---------- Bosque (nivel 1): aprender a moverse juntos ----------
// Tres zonas que enseñan el modo en cadena sin explicarlo (y que solo, o en la carrera, también
// tienen gracia). La lógica está en bosque.js. zonasTranquilas: azar.js no reparte trampas ahí
// (cada zona ya trae su lección y una trampa al azar la taparía).

// Zona 1 · La salida engañosa: el cartel señala el atajo por un suelo de raíces sobre la lava que
// AGUANTA A UNO (suelosPeso: [x, ancho, cuántos aguanta]). Con dos encima cruje y se hunde; solo,
// aguanta... si no te quedas quieto. El camino largo va por tres piedras altas (escalones de 96 px).
export function tramoSalidaEnganosa() {
    return {
        ancho: 700,
        suelo: [[0, 220], [480, 700]],
        lava: [[220, 480]],
        suelosPeso: [[220, 260, 1]],
        plataformas: [[200, 236, 70], [320, 150, 90], [450, 236, 70]],
        carteles: [[110, 165, 'ATAJO →']],
        monedas: [[335, 115], [365, 115], [395, 115]],
        zonasTranquilas: [[0, 700]],
    };
}

// Zona 2 · Las ramas traicioneras: cuatro ramas sobre la lava (bosque.js). Con dos encima cruje y se
// rompe enseguida; si te paras en la punta, se inclina y te resbala hacia el borde. Hay que cruzar por
// turnos (en cadena: el de adelante espera en la orilla mientras los demás pasan). Huecos de 70 px
export function tramoRamasTraicioneras() {
    const l = 150;
    return {
        ancho: 950,
        suelo: [[0, l], [880, 950]],
        lava: [[l, 880]],
        plataformas: [[190, 270, 110, 'rama'], [370, 250, 110, 'rama'], [550, 265, 110, 'rama'], [730, 255, 110, 'rama']],
        carteles: [[60, 170, 'RAMAS: DE A UNO']],
        monedas: [...fila(220, 235, 2), ...fila(400, 215, 2), ...fila(580, 230, 2), ...fila(760, 220, 2)],
        zonasTranquilas: [[0, 950]],
    };
}

// Zona 3 · El puente de madera: arriba (y = 60) un puente de tablas que se desmorona DETRÁS del grupo
// (puentesMadera: el derrumbe empieza 0,9 s después de que alguien lo pisa y avanza a 120 px/s; el
// más lento corre a 209). Abajo, el atajo: tres troncos que flotan a distintas velocidades sobre la
// lava (huecos de 0 a 212 px: hay que esperar el momento). Las tablas están tan altas que los saltos
// de abajo no chocan con ellas (la cabeza llega a y = 103). Arriba hay un cristal (el secreto).
export function tramoPuenteMadera() {
    const tablas = [];
    for (let x = 360; x < 1042; x += 62) tablas.push([x, 60, 62, 'tabla']);
    return {
        ancho: 1200, alto: 160,
        suelo: [[0, 300], [1000, 1200]],
        lava: [[300, 1000]],
        plataformas: [[120, 236, 100], [250, 140, 100], ...tablas],
        puentesMadera: [[360, 1042]],
        moviles: [[380, 316, 'x', 100, 60, 'tronco'], [600, 316, 'x', 120, 90, 'tronco'], [840, 316, 'x', 80, 70, 'tronco']],
        cristales: [[700, 0]],
        carteles: [[60, 150, '↑ PUENTE'], [270, 210, 'TRONCOS →']],
        monedas: [...fila(420, 25, 4, 60), ...fila(860, 25, 3, 60)],
        zonasTranquilas: [[0, 1200]],
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

// ---------- Equipo (solo en los niveles en equipo: equipo.js y mecanismos.js) ----------

// puerta de placas: la placa abre la puerta, pero quien la pisa NO alcanza a pasar (la placa está
// a 190 px de la puerta y la cadena mide 170): hay que soltarla y cruzar todos juntos mientras la
// puerta sigue abierta (1,5 s). grupo: nombre único que une la placa con su puerta
export function tramoPuertaDePlacas(grupo) {
    return {
        ancho: 560,
        suelo: [[0, 560]],
        placas: [[150, grupo]],
        puertas: [[340, grupo]],
        monedas: fila(390, 300, 4),
    };
}

// foso de argollas: más ancho que la cadena (320 px > 170) y que un salto. Se cruza columpiándose
// (la primera argolla se alcanza saltando desde el borde). El de atrás es arrastrado al foso: el que
// cruzó se ancla y la cadena lo sube (rescate). Con 8 jugadores van pasando de a uno, igual
export function tramoArgollas() {
    const l = 150, foso = 320;
    return {
        ancho: l + foso,
        suelo: [[0, l]],
        lava: [[l, l + foso]],
        argollas: [[l + 85, 185], [l + 215, 185]],
        monedas: [[l + 150, 160], [l + 180, 150], [l + 210, 160]],
    };
}

// ---------- Colocar piezas en un nivel ----------

// campos con x en la primera posición ([x, ...]) y campos que son solo x
const CON_X = ['bloques', 'monedas', 'carcajes', 'corazones', 'cristales', 'carteles', 'monedasTrampa', 'mordedoras',
    'espiritus', 'pinchos', 'bolas', 'goteros', 'moviles', 'escaleras', 'plataformas', 'muros', 'antorchas', 'posiblesMimicos', 'arbolesGigantes', 'placas', 'puertas', 'argollas',
    'escudos', 'aplastadores', 'portales', 'zonas', 'suelosPeso'];
const SOLO_X = ['plantas', 'rocas', 'estatuasFalsas', 'banderasFalsas', 'persecuciones', 'checkpoints', 'losasDudosas', 'grietasFalsas', 'burbujas', 'burbujasFalsas', 'algas'];
const RANGOS = ['suelo', 'lava', 'falsos', 'atajos', 'cuevas', 'murosAbismo', 'puentesMadera', 'zonasTranquilas'];
// locuras: [x, tipo, extra]; en las de lava y el túnel, extra es la x del final (también se corre)
const LOCURAS_CON_FIN = ['ola', 'geiser', 'techoBaja'];
const moverLocura = ([lx, tipo, extra], d) => [lx + d, tipo, LOCURAS_CON_FIN.includes(tipo) ? extra + d : extra];

const moverEnemigo = (e, d) => Array.isArray(e) ? [e[0] + d, ...e.slice(1)] : e + d;

// copia los datos de un tramo al nivel, desplazados a la posición x
export function colocar(n, t, x) {
    RANGOS.forEach(k => (t[k] || []).forEach(([a, b]) => (n[k] = n[k] || []).push([a + x, b + x])));
    CON_X.forEach(k => (t[k] || []).forEach(([px, ...resto]) => (n[k] = n[k] || []).push([px + x, ...resto])));
    SOLO_X.forEach(k => (t[k] || []).forEach(px => (n[k] = n[k] || []).push(px + x)));
    (t.enemigos || []).forEach(e => (n.enemigos = n.enemigos || []).push(moverEnemigo(e, x)));
    (t.techos || []).forEach(([a, b, abajo]) => (n.techos = n.techos || []).push([a + x, b + x, abajo]));
    (t.agua || []).forEach(([a, b, sup]) => (n.agua = n.agua || []).push([a + x, b + x, sup]));
    (t.corrientes || []).forEach(([a, b, dir]) => (n.corrientes = n.corrientes || []).push([a + x, b + x, dir]));
    (t.criaturas || []).forEach(([cx, ...r]) => (n.criaturas = n.criaturas || []).push([cx + x, ...r]));
    (t.rejas || []).forEach(([rx, ...r]) => (n.rejas = n.rejas || []).push([rx + x, ...r]));
    (t.runas || []).forEach(([rx, ry, losas]) => (n.runas = n.runas || []).push([rx + x, ry, losas.map(([lx, ...r]) => [lx + x, ...r])]));
    (t.emboscadas || []).forEach(([a, xs]) => (n.emboscadas = n.emboscadas || []).push([a + x, xs.map(v => v + x)]));
    (t.locuras || []).forEach(l => (n.locuras = n.locuras || []).push(moverLocura(l, x)));
    (t.puentes || []).forEach(([a, b, roto]) => (n.puentes = n.puentes || []).push([a + x, b + x, roto < 0 ? roto : roto + x]));
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
    nivel.agua = (nivel.agua || []).map(([a, b, sup]) => [mover(a), mover(b), sup]);
    nivel.corrientes = (nivel.corrientes || []).map(([a, b, dir]) => [mover(a), mover(b), dir]);
    nivel.criaturas = (nivel.criaturas || []).map(([cx, ...r]) => [mover(cx), ...r]);
    nivel.rejas = (nivel.rejas || []).map(([rx, ...r]) => [mover(rx), ...r]);
    nivel.runas = (nivel.runas || []).map(([rx, ry, losas]) => [mover(rx), ry, losas.map(([lx, ...r]) => [mover(lx), ...r])]);
    nivel.emboscadas = (nivel.emboscadas || []).map(([a, xs]) => [mover(a), xs.map(mover)]);
    nivel.locuras = (nivel.locuras || []).map(l => (l[0] >= x ? moverLocura(l, d) : l));
    nivel.puentes = (nivel.puentes || []).map(([a, b, roto]) => [mover(a), mover(b), roto < 0 ? roto : mover(roto)]);
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
