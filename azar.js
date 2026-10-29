// Trampas aleatorias y vidas al azar.
//
// aleatorizarNivel: cada vez que empieza un intento (al entrar al nivel o al reaparecer)
// las trampas se reparten de nuevo, para que el nivel se sienta nuevo cada vez. Se mantiene
// aproximadamente la cantidad de cada trampa que tiene el nivel (así cada nivel sigue
// siendo más difícil que el anterior) y se respetan reglas para que siempre sea justo:
//   - zonas seguras: el inicio, después de cada punto de control y la antesala del jefe
//   - descansos: tramos sin trampas repartidos al azar a lo largo del nivel
//   - separación: entre dos trampas hay espacio para ver la señal de la siguiente y reaccionar
//   - pocas trampas invisibles: los bloques 'H' tienen un tope por nivel
// Lo que se aprende no es DÓNDE están las trampas sino CÓMO se ven: cada tipo tiene su señal.
//
// Semilla: cada intento usa una semilla al azar (se muestra en la consola). Para reproducir
// un reparto exacto al buscar errores, abre el juego con ?semilla=12345 en la URL.
//
// Corazones al azar: si te falta alguna vida, de vez en cuando aparece uno delante de ti,
// y los enemigos derrotados a veces sueltan uno.

import { TROLLADAS, LUGAR_TROLLADA, TROLLADAS_INOFENSIVAS } from "./trolladas.js"

const SUELO_Y = 332;

// generador con semilla (mulberry32): la misma semilla da siempre el mismo reparto
export function crearAzar(semilla) {
    let a = semilla >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
let rnd = Math.random; // durante aleatorizarNivel usa el generador con semilla
const azar = (a, b) => a + rnd() * (b - a);
const moneda = p => rnd() < p;
const mezclar = lista => {
    for (let i = lista.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
};

// semilla fija desde la URL (?semilla=123) o una nueva al azar en cada intento
function semillaDelIntento() {
    try {
        const fija = new URLSearchParams(globalThis.location?.search || '').get('semilla');
        if (fija) return Number(fija) >>> 0;
    } catch (_e) { /* sin URL (pruebas) */ }
    return Math.floor(Math.random() * 4294967296);
}

// reglas de justicia (en px)
const ZONA_INICIO = 450;          // sin trampas al empezar el nivel
const ANTES_CHECKPOINT = 150;     // ni justo antes de un punto de control...
const DESPUES_CHECKPOINT = 260;   // ...ni donde reapareces después de morir
const ANTESALA_JEFE = 450;        // tramo tranquilo antes de la arena del jefe
const BORDE_HUECO = 130;          // distancia mínima al borde de un hueco o de la lava
const DESCANSO_CADA = 1400;       // cada ~1400 px hay un tramo de descanso...
const DESCANSO_LARGO = 320;       // ...de este largo, en una posición al azar

// cantidad mínima de trampas por nivel: siempre sube (los primeros niveles son para aprender)
const MINIMO_TRAMPAS = [20, 26, 34, 42, 64, 84];
// cebos por nivel: premios tentadores que esconden una trampa (castigo a la codicia)
const CEBOS = [1, 1, 2, 2, 3, 3];
const ALTURA_CEBO = 225; // y del cristal: caminando no se alcanza (la cabeza llega a ~263), hay que saltar
const ATERRIZAJE_CEBO = 300; // suelo firme que tiene que haber después de un cebo que se toma saltando

// locuras (locuras.js): trampas nuevas que trae cada nivel; los siguientes mezclan las de antes
const LOCURAS_POR_NIVEL = [
    ['monedaHuye', 'cartelCae', 'seta', 'tronco'],
    ['estalactita'],                       // + olas de lava, túnel que se derrumba
    ['viento'],                            // + plataformas que se caen, ascensor que baja de golpe
    ['quieto', 'antorcha', 'puerta'],
    ['cadena'],                            // + géiseres
    ['runaMaldita', 'sombra', 'gravedad'],
];
const CUANTAS_LOCURAS = [7, 8, 10, 12, 15, 18];
// remixes que no hacen daño (no cuentan como trampas)
const INOFENSIVAS = ['monedaBuena', 'estatuaRoja', 'runaDerrumba', 'ascensor', ...TROLLADAS_INOFENSIVAS];

export function contarTrampas(n) {
    const c = ch => (n.bloques || []).reduce((a, b) => a + [...b[2]].filter(x => x === ch).length, 0);
    const L = k => (n[k] || []).length;
    return c('H') + c('E') + c('C') + c('F') + L('falsos') + L('pinchos') + L('emboscadas') + L('plantas') +
        L('monedasTrampa') + L('rocas') + L('estatuasFalsas') + L('mordedoras') + L('banderasFalsas') + L('persecuciones') +
        L('cebos') + (n.locuras || []).filter(([, t]) => !INOFENSIVAS.includes(t)).length;
}

const BURLAS_CARTEL = ['¡SALTA AQUÍ!', 'ATAJO →', 'TODO BIEN :)', 'NO HAY TRAMPAS', 'CONFÍA EN MÍ', '¡CASI LLEGAS!', 'ZONA SEGURA', 'NO CORRAS'];

// sueloExtra: rangos de suelo hechos a mano (nivel 1)
// semilla: opcional; si no se pasa, se toma de la URL (?semilla=) o se elige al azar
// nivelReal: el número de nivel de verdad (indice llega hasta 5: las reglas de los primeros niveles);
// con él se estrenan las trolladas
export function aleatorizarNivel(nivel, indice, sueloExtra = [], semilla = semillaDelIntento(), nivelReal = indice) {
    rnd = crearAzar(semilla);
    try {
        return repartirTrampas(nivel, indice, sueloExtra, semilla, nivelReal);
    } finally {
        rnd = Math.random; // lo demás (corazones, escudos) sigue con el azar normal
    }
}

function repartirTrampas(nivel, indice, sueloExtra, semilla, nivelReal) {
    const n = { ...nivel, semilla };
    const meta = nivel.meta;
    const checkpoints = nivel.checkpoints || [];
    const largo = (lista) => (lista || []).length;
    const inicioArena = meta - 1010;

    // zonas donde no puede haber trampas que necesitan espacio arriba (bloques bajos y escaleras)
    // "techos bajos": filas de bloques bajos y plataformas flotantes a poca altura del suelo
    const techosBajos = [
        ...(nivel.bloques || []).filter(([, y]) => y >= 200).map(([x, , p]) => [x, x + p.length * 32]),
        ...(nivel.plataformas || []).filter(([, arriba]) => arriba >= 150 && arriba < 320).map(([x, , ancho]) => [x, x + ancho]),
        ...(nivel.runas || []).map(([x]) => [x - 40, x + 72]), // hay que ponerse debajo de la runa para golpearla
    ];
    const bloquesBajos = techosBajos.map(([a, b]) => [a - 40, b + 40]);
    // trampas que se esquivan saltando (pinchos, plantas): no debajo ni justo después de un techo bajo,
    // porque al saltar te golpearías la cabeza y caerías encima
    // (desde 64 px antes: un grupo de dos pinchos ocupa 64 px a la derecha de donde empieza)
    const zonasDeSalto = techosBajos.map(([a, b]) => [a - 164, b + 180]);
    // ni donde baja un ascensor ni pegadas a un muro
    const ascensores = (nivel.moviles || []).filter(([, , eje]) => eje === 'y').map(([x]) => [x - 130, x + 130]);
    // (a la derecha del muro se aterriza tras una caída larga: ese tramo también queda libre)
    const muros = (nivel.muros || []).map(([x, , ancho]) => [x - 60, x + ancho + 220]);
    // túneles: sin trampas de suelo dentro (casi no se puede saltar) ni justo a la salida
    // (los enemigos que caen del cielo o el gigante que persigue aparecerían dentro del techo)
    const tuneles = (nivel.techos || []).map(([a, b]) => [a - 60, b + 500]);
    const escaleras = (nivel.escaleras || []).map(([x, h]) => [x - 60, x + h * 32 + 60]);
    // placas y puertas de equipo: sin trampas cerca (ahí el equipo se coordina, no se esquiva)
    const mecanismos = [...(nivel.placas || []), ...(nivel.puertas || [])].map(([x]) => [x - 200, x + 200]);
    const falsos = (nivel.falsos || []).map(([a, b]) => [a - 60, b + 60]);
    // atajos de las pistas de carrera: traen sus propias trampas (pistas.js), aquí no se reparte nada
    const atajos = (nivel.atajos || []).map(([a, b]) => [a - 150, b + 150]);
    // zonas que ya traen su lección (nivel 1: suelo de raíces, ramas, puente, Árbol guardián)
    const tranquilas = nivel.zonasTranquilas || [];
    const dentro = (x, rangos) => rangos.some(([a, b]) => x >= a && x <= b);

    // tramos de descanso: uno cada ~DESCANSO_CADA px, en una posición distinta en cada intento
    const descansos = [];
    for (let desde = ZONA_INICIO + 300; desde < inicioArena; desde += DESCANSO_CADA) {
        const a = Math.round(desde + azar(0, DESCANSO_CADA - DESCANSO_LARGO));
        descansos.push([a, a + DESCANSO_LARGO]);
    }
    n.descansos = descansos;

    // lugares posibles: sobre suelo firme, lejos de los bordes de los huecos, del inicio,
    // de los puntos de control, de la antesala del jefe y fuera de los descansos
    const candidatos = [];
    [...(nivel.suelo || []), ...sueloExtra].forEach(([a, b]) => {
        for (let x = a + BORDE_HUECO; x <= b - BORDE_HUECO; x += 50) {
            if (x < ZONA_INICIO || x > inicioArena - ANTESALA_JEFE) continue;
            if (checkpoints.some(cp => x > cp - ANTES_CHECKPOINT && x < cp + DESPUES_CHECKPOINT)) continue;
            if (dentro(x, escaleras) || dentro(x, falsos) || dentro(x, descansos) || dentro(x, mecanismos) || dentro(x, atajos) || dentro(x, tranquilas)) continue;
            if (dentro(x, ascensores) || dentro(x, muros) || dentro(x, tuneles)) continue;
            candidatos.push(x);
        }
    });
    mezclar(candidatos);
    const usados = [];
    // separación: suficiente para ver la señal de la trampa siguiente (más juntas en niveles altos)
    const separacion = Math.max(150, 200 - 10 * indice);
    // evitar: rangos donde esta trampa no puede ir (bloquesBajos, zonasDeSalto)
    // cumple: condición extra del lugar (por ejemplo, que haya suelo firme alrededor)
    const tomar = (evitar = [], desde = 0, cumple = () => true) => {
        const i = candidatos.findIndex(x => x >= desde && !usados.some(u => Math.abs(u - x) < separacion) && !dentro(x, evitar) && cumple(x));
        if (i < 0) return null;
        const x = candidatos.splice(i, 1)[0];
        usados.push(x);
        return x;
    };
    // cantidad: alrededor de la del nivel, con un poco de variación
    const cuanto = (base) => base ? Math.max(1, Math.round(base * azar(0.9, 1.2))) : 0;
    const repartir = (base, crear, opciones = {}) => {
        const lista = [];
        for (let i = 0; i < cuanto(base); i++) {
            const x = tomar(opciones.evitar, opciones.desde);
            if (x !== null) lista.push(crear(x));
        }
        return lista;
    };

    // (los cebos van primero para que siempre tengan sitio)
    // ---------- Trolladas (trolladas.js): van PRIMERO (si no, las trampas de siempre ocupan todos los
    // lugares). Cada nivel ESTRENA una (la más nueva que se desbloqueó) y mezcla las de antes; de 2 a 8
    const estrenadas = Math.min(TROLLADAS.length, 1 + nivelReal);
    const cuantasT = Math.min(8, 2 + Math.floor(nivelReal / 15));
    const firmeT = (a, b) => [...(nivel.suelo || []), ...sueloExtra].some(([s, e]) => a >= s && b <= e);
    const techoT = [...bloquesBajos, ...(nivel.plataformas || []).map(([x, , ancho]) => [x - 60, x + ancho + 60])];
    const LUGAR_T = {
        techo: () => tomar(techoT, 0, x => firmeT(x - 80, x + 80)),
        largo: () => tomar([], 0, x => firmeT(x - 80, x + 600)),
        normal: () => tomar([], 0, x => firmeT(x - 120, x + 120)),
    };
    const trolladas = [];
    for (let k = 0; k < cuantasT; k++) {
        const tipo = k === 0 ? TROLLADAS[estrenadas - 1] : TROLLADAS[Math.floor(rnd() * estrenadas)];
        const x = LUGAR_T[LUGAR_TROLLADA[tipo] || 'normal']();
        if (x !== null) trolladas.push([x, tipo]);
    }

    // cebos (castigo a la codicia): un cristal tentador que, al tomarlo, esconde una trampa
    //   techo:  cae una roca donde estás (si sigues moviéndote, te salvas)
    //   mimico: el cristal es un enemigo disfrazado (te empuja, sin quitarte vida, y pelea)
    //   suelo:  el suelo bajo el cristal se derrumba (si lo tomaste saltando desde lejos, aterrizas al otro lado)
    // en el nivel 1 solo hay de techo, la más fácil de entender
    const tiposCebo = indice === 0 ? ['techo'] : ['techo', 'mimico', 'suelo'];
    n.suelo = [...(nivel.suelo || [])];
    n.falsos = [...(nivel.falsos || [])];
    n.cebos = [];
    for (let k = 0; k < CEBOS[Math.min(indice, CEBOS.length - 1)]; k++) {
        let tipo = tiposCebo[Math.floor(rnd() * tiposCebo.length)];
        // los de techo y suelo se toman saltando: no junto a bloques bajos (te golpearías la cabeza);
        // si no hay sitio, se pone un mímico, que está en el suelo y no hace falta saltar
        let x = tipo === 'mimico' ? null : tomar(zonasDeSalto);
        // al saltar a por el cristal se aterriza ~250 px más allá: tiene que haber suelo firme ahí
        const sueloTrasCebo = x !== null && [...n.suelo, ...sueloExtra].some(([a, b]) => x - 120 >= a && x + ATERRIZAJE_CEBO <= b);
        if (x !== null && !sueloTrasCebo && indice > 0) {
            usados.splice(usados.indexOf(x), 1); // se devuelve el sitio: el mímico puede usar otro
            x = null;
        }
        if (x === null && indice > 0) {
            tipo = 'mimico';
            x = tomar(bloquesBajos);
        }
        if (x === null) break;
        if (tipo === 'suelo') {
            // se parte el suelo firme en dos y en medio queda un suelo falso con lava debajo
            const i = n.suelo.findIndex(([a, b]) => x - 48 > a + 60 && x + 48 < b - 60);
            if (i < 0) tipo = 'techo';
            else {
                const [a, b] = n.suelo[i];
                n.suelo.splice(i, 1, [a, x - 48], [x + 48, b]);
                n.falsos.push([x - 48, x + 48]);
            }
        }
        // el mímico está a ras del suelo; los demás, a una altura que obliga a dar un saltito
        n.cebos.push([x, tipo === 'mimico' ? 300 : ALTURA_CEBO, tipo]);
    }

    const pinchosPorGrupo = indice >= 3 ? 2 : 1;
    n.pinchos = repartir(largo(nivel.pinchos), x => [x, pinchosPorGrupo, true], { evitar: zonasDeSalto });
    n.rocas = repartir(largo(nivel.rocas), x => x, { evitar: bloquesBajos });
    n.monedasTrampa = repartir(largo(nivel.monedasTrampa), x => [x, 300]);
    n.estatuasFalsas = repartir(largo(nivel.estatuasFalsas), x => x);
    n.emboscadas = repartir(largo(nivel.emboscadas), x => [x, [x + 200, x + 330]]);
    n.plantas = repartir(largo(nivel.plantas), x => x, { evitar: zonasDeSalto });
    n.persecuciones = repartir(largo(nivel.persecuciones), x => x, { desde: meta * 0.3 });

    // plataformas que muerden: las que están sobre la lava se quedan a veces; las del suelo cambian de lugar
    const mordedoras = nivel.mordedoras || [];
    n.mordedoras = [
        ...mordedoras.filter(([, y]) => y < 300 && moneda(0.7)),
        ...repartir(mordedoras.filter(([, y]) => y >= 300).length, x => [x, 316], { evitar: bloquesBajos }),
    ];

    // bandera falsa: en algún lugar del último tramo del nivel
    n.banderasFalsas = repartir(largo(nivel.banderasFalsas), x => x, { desde: meta * 0.6 });

    // carteles: algunos de los originales y otros nuevos en lugares al azar
    n.carteles = [
        ...(nivel.carteles || []).filter(() => moneda(0.5)),
        ...n.banderasFalsas.map(x => [x, 120, '¡META!']),
        ...repartir(Math.max(2, largo(nivel.carteles)), x => [x, Math.round(azar(130, 180)), BURLAS_CARTEL[Math.floor(rnd() * BURLAS_CARTEL.length)]]),
    ];

    // ---------- Locuras: las trampas nuevas de cada nivel (ver locuras.js) ----------
    n.locuras = [...(nivel.locuras || []), ...trolladas]; // (las que el nivel trae puestas a mano se quedan)
    n.cristales = [...(nivel.cristales || [])];
    const firme = (a, b) => [...n.suelo, ...sueloExtra].some(([s, e]) => a >= s && b <= e);
    const flotantes = (nivel.plataformas || []).map(([x, , ancho]) => [x - 60, x + ancho + 60]);
    const enJuego = x => x > ZONA_INICIO && x < inicioArena - ANTESALA_JEFE;
    // dónde puede ir cada una (además de las reglas de siempre)
    const LUGAR = {
        monedaHuye: () => tomar([], 0, x => firme(x - 40, x + 560)),          // salta 3 veces hacia adelante
        cartelCae: () => tomar([], 0, x => firme(x - 220, x + 120)),          // cae hacia atrás
        // los troncos ruedan desde 620 px adelante hasta 60 px atrás: todo ese tramo, suelo firme y sin bloques bajos
        tronco: () => tomar([], 0, x => firme(x - 60, x + 700) && !bloquesBajos.some(([a, b]) => b > x - 60 && a < x + 700)),
        seta: () => tomar([...bloquesBajos, ...flotantes], 0, x => firme(x - 100, x + 520)), // vuela alto y lejos
        estalactita: () => tomar([...bloquesBajos, ...flotantes]),
        viento: () => tomar([], 0, x => firme(x - 220, x + 220)),             // nunca empuja a un hueco
        quieto: () => tomar(zonasDeSalto, 0, x => firme(x - 100, x + 100)),
        antorcha: () => tomar(),
        puerta: () => tomar(bloquesBajos, 0, x => firme(x - 80, x + 420)),   // los enemigos caen delante
        cadena: () => tomar(zonasDeSalto, 0, x => n.suelo.some(([s, e]) => x - 280 >= s && x + 280 <= e)),
        runaMaldita: () => tomar(zonasDeSalto),                               // se esquiva saltando
        sombra: () => tomar([], meta * 0.2),
        gravedad: () => tomar([...zonasDeSalto, ...flotantes], 0, x => firme(x - 160, x + 160)),
    };
    const ponerLocura = (tipo) => {
        const x = LUGAR[tipo]();
        if (x === null) return false;
        if (tipo === 'cadena') {
            // tres losas de suelo falso que se hunden en cadena (con lava debajo)
            const i = n.suelo.findIndex(([s, e]) => x - 280 >= s && x + 280 <= e);
            const [s, e] = n.suelo[i];
            n.suelo.splice(i, 1, [s, x - 150], [x + 150, e]);
            n.falsos.push([x - 150, x - 50], [x - 50, x + 50], [x + 50, x + 150]);
            usados.push(x - 150, x + 150); // nada pegado a la cadena
        }
        if (tipo === 'seta') usados.push(x + 250, x + 450); // donde se aterriza, sin trampas
        if (tipo === 'monedaHuye') usados.push(x + 250, x + 480);
        if (tipo === 'tronco') usados.push(x + 200, x + 400, x + 600); // por donde ruedan, nada más
        n.locuras.push(tipo === 'viento' ? [x, tipo, moneda(0.5) ? 1 : -1] : [x, tipo]);
        return true;
    };
    const desbloqueadas = LOCURAS_POR_NIVEL.slice(0, Math.min(indice, LOCURAS_POR_NIVEL.length - 1) + 1).flat();
    const nuevas = LOCURAS_POR_NIVEL[Math.min(indice, LOCURAS_POR_NIVEL.length - 1)];
    const cuantas = CUANTAS_LOCURAS[Math.min(indice, CUANTAS_LOCURAS.length - 1)];
    for (let k = 0; k < cuantas; k++) {
        // la mitad son las novedades del nivel; las demás, cualquiera de las ya vistas
        const tipo = k < cuantas / 2 ? nuevas[k % nuevas.length] : desbloqueadas[Math.floor(rnd() * desbloqueadas.length)];
        ponerLocura(tipo);
    }

    // fosos de lava "simples" (se cruzan de un salto, sin nada encima): olas y géiseres
    const cerca = (x, a, b) => x > a - 60 && x < b + 60;
    const encima = (a, b) => [...(nivel.plataformas || []), ...(nivel.moviles || []), ...(nivel.bloques || [])].some(([x]) => cerca(x, a, b)) ||
        (nivel.runas || []).some(([, , losas]) => losas.some(([x]) => cerca(x, a, b)));
    const fosos = mezclar((nivel.lava || []).filter(([a, b]) => b - a >= 90 && b - a <= 300 && enJuego(a) && !encima(a, b) && !dentro(a, tranquilas)));
    if (indice >= 1) fosos.splice(0, indice >= 3 ? 2 : 1).forEach(([a, b]) => n.locuras.push([a, 'ola', b]));
    if (indice >= 4) fosos.splice(0, 2).forEach(([a, b]) => n.locuras.push([a, 'geiser', b]));

    // túneles: a veces se derrumban detrás de ti, o una estatua falsa espera en la entrada
    (nivel.techos || []).forEach(([a, b]) => {
        if (!enJuego(a) || indice < 1) return;
        const r = rnd();
        if (r < 0.45) n.locuras.push([a, 'techoBaja', b]);
        else if (r < 0.75) n.estatuasFalsas.push(a + 60);
    });
    // plataformas flotantes que se caen al pisarlas (no junto a una plataforma móvil: ahí se espera)
    if (indice >= 2) {
        const moviles = nivel.moviles || [];
        const lejosDeMoviles = ([x, , ancho]) => !moviles.some(([mx, , eje, rec]) => mx - 300 < x + ancho && (eje === 'x' ? mx + rec : mx) + 300 > x);
        mezclar((nivel.plataformas || []).filter(p => enJuego(p[0]) && p[3] !== 'rama' && lejosDeMoviles(p)))
            .slice(0, indice >= 4 ? 3 : 2).forEach(([x]) => n.locuras.push([x, 'puente']));
    }
    // ascensores que bajan de golpe (el del mirador del nivel 1 también, a veces)
    (nivel.moviles || []).filter(([, , eje]) => eje === 'y').forEach(([x, , , rec]) => {
        if (moneda(indice >= 2 ? 0.6 : rec === 236 ? 0.5 : 0)) n.locuras.push([x, 'ascensor']);
    });
    // el cristal de la cornisa secreta a veces es un mímico
    (nivel.posiblesMimicos || []).forEach(([x, y]) => {
        if (!moneda(0.5)) return;
        n.cristales = n.cristales.filter(([cx, cy]) => cx !== x || cy !== y);
        n.cebos.push([x, y, 'mimico']);
    });

    // remixes: después de tantas mentiras, un cartel que dice la verdad; una moneda que parece trampa
    // y es buena; un punto de control de verdad con ojos rojos; una runa que se rompe la primera vez
    if (indice >= 1) {
        n.pinchos.slice(0, 2).forEach(([x]) => n.carteles.push([x - 70, 150, '¡OJO! PINCHOS']));
        for (let k = 0; k < 2; k++) { const x = tomar(); if (x !== null) n.locuras.push([x, 'monedaBuena']); }
    }
    if (indice >= 2 && checkpoints.length && moneda(0.6)) n.locuras.push([checkpoints[Math.floor(rnd() * checkpoints.length)], 'estatuaRoja']);
    if (indice >= 4) (nivel.runas || []).forEach(([x]) => { if (moneda(0.5)) n.locuras.push([x, 'runaDerrumba']); });

    // bloques: cualquier "?" puede soltar un enemigo y cualquier ladrillo bajo puede caer
    const pE = 0.15 + 0.05 * indice, pC = 0.1 + 0.04 * indice;
    n.bloques = (nivel.bloques || []).filter(([, , p]) => p !== 'H' || moneda(0.6)).map(([x, y, patron]) => {
        const bajo = y >= 200 && y <= 240;
        const nuevo = [...patron].map(c => {
            if (c === '?') return moneda(pE) ? 'E' : '?';
            if (c === 'E') return moneda(0.5) ? 'E' : '?';
            if (c === 'B' && bajo) return moneda(pC) ? 'C' : 'B';
            if (c === 'C') return moneda(0.6) ? 'C' : 'B';
            return c;
        }).join('');
        return [x, y, nuevo];
    });
    // bloque invisible al borde de algún hueco de lava (con tope: son las trampas más difíciles de leer)
    const maxInvisibles = 1 + Math.floor(indice / 2);
    const contarH = () => n.bloques.reduce((a, [, , p]) => a + [...p].filter(c => c === 'H').length, 0);
    const pH = 0.2 + 0.07 * indice;
    mezclar([...(nivel.lava || [])].filter(([x0]) => !dentro(x0, tranquilas))).forEach(([x0]) => {
        const yaHay = n.bloques.some(([x, , p]) => p === 'H' && Math.abs(x - x0) < 40);
        if (!yaHay && contarH() < maxInvisibles && moneda(pH)) n.bloques.push([x0 - 12, 232, 'H']);
    });

    // la arena del jefe (antes de la meta) queda despejada: sin escaleras ni bloques
    n.escaleras = (nivel.escaleras || []).filter(([x]) => x < inicioArena);
    n.bloques = n.bloques.filter(([x, , p]) => x + p.length * 32 < inicioArena);

    // cargas de escudo repartidas al azar por el nivel
    n.escudos = repartir(indice >= 3 ? 2 : 1, x => [x, 296]);

    // si quedaron menos trampas que el mínimo del nivel, se agregan más (con las mismas reglas:
    // si el nivel no tiene sitio, se queda con menos trampas antes que volverse injusto)
    const minimo = MINIMO_TRAMPAS[Math.min(indice, MINIMO_TRAMPAS.length - 1)];
    const extras = [
        () => { const x = tomar(zonasDeSalto); return x !== null && n.pinchos.push([x, pinchosPorGrupo, true]); },
        () => { const x = tomar(bloquesBajos); return x !== null && n.rocas.push(x); },
        () => { const x = tomar(); return x !== null && n.monedasTrampa.push([x, 300]); },
        () => { const x = tomar(zonasDeSalto); return x !== null && n.plantas.push(x); },
        () => { const x = tomar(); return x !== null && n.emboscadas.push([x, [x + 200, x + 330]]); },
        () => ponerLocura(desbloqueadas[Math.floor(rnd() * desbloqueadas.length)]),
    ];
    for (let i = 0, fallos = 0; contarTrampas(n) < minimo && fallos < extras.length; i++) {
        fallos = extras[i % extras.length]() ? 0 : fallos + 1;
    }
    // si el suelo no alcanza (niveles con mucha lava): bloques traicioneros al azar,
    // que tienen señal propia (el "?" falso tiembla, el ladrillo que cae está agrietado)
    const huecos = [];
    n.bloques.forEach((fila, f) => [...fila[2]].forEach((c, i) => {
        const bajo = fila[1] >= 200 && fila[1] <= 240;
        const x = fila[0] + i * 32;
        // el inicio, la reaparición, la antesala del jefe y los descansos quedan tranquilos
        if (x < ZONA_INICIO || x > inicioArena - ANTESALA_JEFE || dentro(x, descansos)) return;
        if (checkpoints.some(cp => x > cp - ANTES_CHECKPOINT && x < cp + DESPUES_CHECKPOINT)) return;
        if (c === '?' || (c === 'B' && bajo)) huecos.push([f, i]);
    }));
    mezclar(huecos);
    for (const [f, i] of huecos) {
        if (contarTrampas(n) >= minimo) break;
        const letras = [...n.bloques[f][2]];
        letras[i] = letras[i] === '?' ? 'E' : 'C';
        n.bloques[f] = [n.bloques[f][0], n.bloques[f][1], letras.join('')];
    }

    return n;
}

// ---------- Niveles con trampas puestas a mano (fija: true) ----------
// Las Ruinas del Abismo (nivel 7 y pista de carrera): sus trampas no se reparten al azar (los
// patrones se aprenden). Lo único que cambia con la semilla: en cada trío de "losas dudosas" cuál
// es la falsa y cuál de las firmes tiene grietas de mentira. Los tablones 'fragil' caen al pisarlos.
export function prepararNivelFijo(nivel, semilla = semillaDelIntento()) {
    const r = crearAzar((semilla ^ 0x51ed270b) >>> 0);
    const n = { ...nivel, semilla, cebos: [], descansos: [], trios: [] };
    n.suelo = [...(n.suelo || [])];
    n.falsos = [...(n.falsos || [])];
    n.grietasFalsas = [...(n.grietasFalsas || [])];
    (n.losasDudosas || []).forEach(x => {
        const falsa = Math.floor(r() * 3);
        for (let k = 0; k < 3; k++) (k === falsa ? n.falsos : n.suelo).push([x + k * 96, x + (k + 1) * 96]);
        // una de las firmes del trío tiene grietas (asusta, pero aguanta)
        n.grietasFalsas.push(x + ((falsa + 1 + Math.floor(r() * 2)) % 3) * 96 + 48);
        n.trios.push([x, falsa]);
    });
    n.locuras = [...(n.locuras || []), ...(n.plataformas || []).filter(p => p[3] === 'fragil').map(([x]) => [x, 'puente'])];
    return n;
}

// ---------- Cargas de escudo al azar ----------
// si no tienes escudo, de vez en cuando aparece una carga delante de ti (fuera de la pelea con el jefe)
export function iniciarEscudosAlAzar(scene, soltarEscudo, ancho) {
    const programar = () => scene.time.delayedCall(azar(22000, 38000), intentar);
    const intentar = () => {
        const g = scene.mascotaGesi;
        if (!g.isDead && !scene.nivelTerminado && !scene.tieneEscudo && !scene.peleaJefe) {
            for (let i = 0; i < 10; i++) {
                const x = g.x + azar(160, 380);
                if (x > ancho - 100) break;
                const y = alturaSobreSuelo(scene, x);
                if (y !== null) {
                    soltarEscudo(scene, x, y - 2);
                    scene.mostrarMensajeCorto?.('¡UN ESCUDO!');
                    break;
                }
            }
        }
        programar();
    };
    programar();
}

// ---------- Corazones al azar ----------

// busca suelo firme en x (no lava) y devuelve la altura donde poner el premio
function alturaSobreSuelo(scene, x) {
    let mejor = null;
    scene.floor.getChildren().forEach(p => {
        const b = p.body;
        if (!p.active || !b || !b.enable || p.esGotero || p.esFalso) return;
        if (x > b.left + 10 && x < b.right - 10 && b.top >= 150 && b.top <= SUELO_Y + 4) {
            if (mejor === null || b.top > mejor) mejor = b.top;
        }
    });
    return mejor === null ? null : mejor - 28;
}

export function soltarCorazon(scene, x, y, mensaje) {
    const c = scene.premios.create(x, y, 'mz_corazon').anims.play('mz_corazon', true).refreshBody();
    c.tipoPremio = 'corazon';
    const brillo = scene.add.image(x, y, 'brillo').setDepth(41).setScale(0.9).setTint(0xff4d6d).setAlpha(0.4).setBlendMode('ADD');
    c.setScale(0.2);
    scene.tweens.add({ targets: c, scale: 1, duration: 300, ease: 'Back.out' });
    scene.sound.play('aparece', { volume: 0.5 });
    if (mensaje) scene.mostrarMensajeCorto?.(mensaje);

    // parpadea y desaparece si no lo tomas
    scene.time.delayedCall(7000, () => {
        if (c.active) scene.tweens.add({ targets: [c, brillo], alpha: 0.2, yoyo: true, repeat: 5, duration: 250 });
    });
    scene.time.delayedCall(10000, () => {
        if (c.active) c.destroy();
        brillo.destroy();
    });
    c.on('destroy', () => brillo.active && brillo.destroy());
    return c;
}

// cada cierto tiempo, si faltan vidas, aparece un corazón delante del jugador
export function iniciarCorazonesAlAzar(scene, faltanVidas, ancho) {
    const programar = () => scene.time.delayedCall(azar(18000, 32000), intentar);
    const intentar = () => {
        const g = scene.mascotaGesi;
        if (!g.isDead && !scene.nivelTerminado && faltanVidas()) {
            for (let i = 0; i < 10; i++) {
                const x = g.x + azar(140, 360);
                if (x > ancho - 100 || (scene.limiteDerecho && x > scene.limiteDerecho)) break;
                const y = alturaSobreSuelo(scene, x);
                if (y !== null) {
                    soltarCorazon(scene, x, y, '¡UNA VIDA!');
                    break;
                }
            }
        }
        programar();
    };
    programar();
}
