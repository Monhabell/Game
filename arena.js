// Arena del Troll: batallas en línea entre jugadores, 1 contra 1 o por equipos (2 contra 2).
//
// Cómo se juega:
//   - Al mejor de 3 rondas. En cada ronda cada jugador tiene 3 corazones y una barra de salud.
//   - Los ataques y los poderes golpean a los rivales (a los compañeros de equipo no): bajan la salud
//     y EMPUJAN. Cuanto menos salud tienes, más lejos te mandan (como en Smash): la lava del centro
//     y la de los bordes es la forma más rápida de perder un corazón.
//   - A los 45 s "¡El troll se aburre!": los bordes de la arena se derrumban y queda lava.
//   - Se pierde la ronda cuando todo tu equipo se queda sin corazones.
//   - Apuesta (la elige el anfitrión: 0, 10, 25, 50 o 100 monedas): cada jugador la paga al empezar y
//     el equipo ganador se reparte el pozo. Sin apuesta: 30 monedas al ganar y 10 al perder.
//   - 4 arenas, cada una con su peligro; se desbloquean con victorias (Bosque, Cueva, Volcán, Castillo).
//   - TRAVESURAS DEL TROLL: cada 15 s el Rey Troll asoma y hace una al azar (controles al revés, lluvia
//     de rocas, apagón, gravedad baja o un cofre falso que explota). Las elige el anfitrión.
//   - ORBES DE PODER: cada 20 s cae un orbe; quien lo toma tiene un poder legendario de UN uso (tecla V).
//   - MEDALLAS al final (Rey del empujón, Cazador, Intocable, Murió solo en la lava, Troleado por el troll).
//   - LIGAS: copas por ganar (+30) o perder (−15): Madera, Piedra, Hierro, Oro y Rey Troll (premio al subir).
//   - EMOTES: 😂 🔥 😎 👋 sobre tu personaje (botones arriba a la derecha o tecla E); los eliminados también.
// Rendimiento (celulares): todo usa imágenes ya cargadas o figuras simples; nada corre cada fotograma
// salvo mover los ojos del apagón y revisar si tocas un orbe o un cofre.
//
// En red (servidor de salas, sin cambios de lógica en el servidor más allá del modo y los equipos):
//   - Quien GOLPEA decide si golpeó (como con los enemigos): avisa al golpeado con 'pvp' (solo a él).
//   - Cada jugador lleva SU salud y sus corazones; al perder uno avisa a todos ('arenaCae').
//   - El ANFITRIÓN cierra las rondas ('arenaRonda') cuando queda un solo equipo con corazones.
//   - Los rivales tienen un cuerpo de física (sin gravedad, sigue a su dibujo) en scene.rivales: así
//     las flechas, los golpes y los poderes los encuentran igual que a los enemigos.
//
// api (la da game.js): { golpearme(scene, daño, origenX), mensaje(scene, texto, ms), ponerVidas(scene, n),
//   premio(monedas), pagar(monedas), salir(), volverASala(), revancha(), reiniciar(scene),
//   orbe(scene, idPoder) }

import { red, alRecibir, enviarEvento, esAnfitrion } from "./red.js"
import { crearLava } from "./mazmorra.js"
import { SUELO_Y } from "./niveles.js"
import { EFECTOS_CARRERA, efectoEnCarrera } from "./poderes.js"
import { aplicarEfecto, puedeRecibirEfecto, textoEfecto } from "./efectos.js"
import { ganarXP, XP } from "./progreso.js"

const VIDAS = 3;
const RONDAS_PARA_GANAR = 2;
const DERRUMBE_MS = 45000;   // desde el comienzo de la ronda
const ESPERA_REAPARECER = 1600;
const PROTECCION_MS = 2000;  // al aparecer: un momento sin recibir golpes
const SALUD_POR_DAÑO = [0, 15, 20, 25, 30]; // daño del ataque (1..4+) -> salud que quita
// los PODERES especiales pegan fuerte (daño del poder ya con su nivel -> salud que quita):
// uno de daño 3 o más elimina en 2 golpes; uno flojo (1-2), en 3-4. El escudo solo para un cuarto
const SALUD_POR_PODER = [0, 25, 35, 50, 65, 80, 90, 100];
const CURA_ARENA = 25; // lo que cura un corazón que cae en la arena (contra el jefe, más)
const CLAVE = 'troll-night-arena';
const TROLL_CADA_MS = 15000;
const ORBE_CADA_MS = 20000;
const VISTA_ARENA = 1100;     // px de ancho que muestra la cámara (la arena mide 900: se ven sus paredes)
// poderes legendarios que dan los orbes (sus efectos se cargan al entrar a la arena)
export const PODERES_ORBE = ['supernova', 'agujero_negro', 'tormenta', 'galaxia'];
const TRAVESURAS = {
    controles: '¡CONTROLES AL REVÉS!',
    rocas: '¡LLUVIA DE ROCAS!',
    apagon: '¡APAGÓN!',
    gravedad: '¡GRAVEDAD BAJA!',
    cofre: 'UN COFRE MISTERIOSO…',
};
export const EMOTES = ['😂', '🔥', '😎', '👋'];
// ligas por copas
const LIGAS = [['Madera', 0], ['Piedra', 100], ['Hierro', 250], ['Oro', 500], ['Rey Troll', 900]];
export const COLORES_EQUIPO = ['#ff5a5a', '#4fa3ff'];
const NOMBRES_EQUIPO = ['Equipo Rojo', 'Equipo Azul'];

export const APUESTAS = [0, 10, 25, 50, 100];

// arenas: cada una se desbloquea con victorias y trae su propio peligro. Todas tienen los bordes
// del suelo en piezas aparte ([0, 120] y [780, 900]): a los 45 s se derrumban
const BORDES = [[0, 120], [780, 900]];
export const ARENAS = [
    {
        id: 'bosque', nombre: 'Arena del Bosque', victorias: 0, peligro: 'un foso de lava en el centro',
        nivel: {
            nubes: true, suelo: [...BORDES, [120, 360], [540, 780]], lava: [[360, 540]],
            plataformas: [[55, 236, 120], [725, 236, 120], [385, 250, 130], [225, 140, 110], [565, 140, 110]],
        },
    },
    {
        id: 'cueva', nombre: 'Cueva de lava', victorias: 5, peligro: 'foso ancho y gotas de lava del techo',
        nivel: {
            nubes: false, cueva: true, tinte: 0xd0a080, suelo: [...BORDES, [120, 300], [600, 780]], lava: [[300, 600]],
            plataformas: [[320, 255, 90], [490, 255, 90], [160, 150, 100], [640, 150, 100], [400, 130, 100]],
            goteros: [[220, 2600], [418, 2200], [650, 2800]],
        },
    },
    {
        id: 'volcan', nombre: 'Volcán', victorias: 15, peligro: 'bolas de fuego y una plataforma que se mueve',
        nivel: {
            nubes: false, cueva: true, tinte: 0xb8503a, suelo: [...BORDES, [120, 330], [570, 780]], lava: [[330, 570]],
            plataformas: [[60, 236, 110], [730, 236, 110], [230, 150, 100], [570, 150, 100]],
            moviles: [[350, 270, 'x', 130, 60]],
            bolas: [[400, 2600], [520, 3200]],
        },
    },
    {
        id: 'castillo', nombre: 'Castillo del Rey Troll', victorias: 30, peligro: 'pinchos ocultos y un muro en el centro',
        nivel: {
            nubes: true, suelo: [...BORDES, [120, 780]],
            muros: [[425, 250, 50]],
            pinchos: [[290, 2, true], [560, 2, true]],
            plataformas: [[150, 236, 110], [640, 236, 110], [395, 150, 110], [60, 130, 90], [750, 130, 90]],
        },
    },
    {
        // Ruinas del Abismo (abismo.js): dos portales cruzan la arena de punta a punta (se abren a ratos)
        // y el puente sobre la lava tiene tablones frágiles (las grietas lo avisan)
        id: 'abismo', nombre: 'Ruinas del Abismo', victorias: 0, peligro: 'tablones frágiles y portales que se abren a ratos',
        nivel: {
            nubes: false, abismo: true, tinte: 0xa58a9a, suelo: [...BORDES, [120, 330], [570, 780]], lava: [[330, 570]],
            plataformas: [[350, 300, 70, 'fragil'], [415, 290, 70], [480, 300, 70, 'fragil'], [60, 236, 100], [740, 236, 100], [230, 140, 100], [570, 140, 100]],
            locuras: [[350, 'puente'], [480, 'puente']],
            puentes: [[330, 570, -1]],
            bolas: [[450, 3000]],
            // [x, pie, salto en x, y de llegada, ms abierto, ms cerrado]
            portales: [[165, 332, 520, 332, 1600, 3400], [735, 332, -520, 332, 1600, 3400]],
        },
    },
];

// ---------- victorias guardadas ----------
function leerGuardado() {
    try {
        const g = JSON.parse(localStorage.getItem(CLAVE)) || {};
        return { victorias: Math.max(0, Number(g.victorias) || 0), copas: Math.max(0, Number(g.copas) || 0) };
    } catch (_e) { return { victorias: 0, copas: 0 }; }
}
function escribirGuardado(g) {
    try { localStorage.setItem(CLAVE, JSON.stringify(g)); } catch (_e) { /* sin almacenamiento */ }
}
export const victoriasArena = () => leerGuardado().victorias;
export const copasArena = () => leerGuardado().copas;
export const ligaDe = copas => LIGAS.reduce((l, [nombre, desde]) => (copas >= desde ? nombre : l), LIGAS[0][0]);
// fin de una partida: victoria y copas; devuelve { copas, cambio, liga, subio }
function anotarResultado(gano) {
    const g = leerGuardado();
    const antes = ligaDe(g.copas);
    if (gano) g.victorias++;
    const cambio = gano ? 30 : -Math.min(15, g.copas);
    g.copas += cambio;
    escribirGuardado(g);
    const liga = ligaDe(g.copas);
    return { copas: g.copas, cambio, liga, subio: liga !== antes && gano };
}
export const arenaDisponible = a => victoriasArena() >= a.victorias;

// ---------- la partida ----------
let partida = null, api = null;
export const arenaActiva = () => partida;
export const esModoArena = modo => modo === 'duelo' || modo === 'equipos';

export function iniciarArena(ganchos) {
    api = ganchos;
    alRecibir('evento', m => {
        if (!partida) return;
        const scene = escena();
        switch (m.tipo) {
            case 'pvp': if (scene && m.ronda === partida.ronda) recibirGolpe(scene, m); break;
            // eliminé a un rival con un poder
            case 'arenaDerribo': if (scene && m.para === red.tuId) { api.mensaje(scene, `💀 ¡ELIMINASTE A ${nombreDe(m.de).toUpperCase()}!`, 1100); ganarXP(XP.eliminar, scene.pj?.id); } break;
            case 'arenaCae':
                if (m.ronda !== partida.ronda) break;
                partida.vidas.set(m.de, Math.max(0, m.vidas | 0));
                // ¿lo derribé yo? (lo golpeé hace poco)
                if (Date.now() - (partida.golpeA.get(m.de) || 0) < 4000) partida.stats.derribos++;
                revisarRonda();
                break;
            case 'arenaRonda': cerrarRonda(m); break;
            case 'arenaTroll': if (scene && m.ronda === partida.ronda) travesura(scene, m); break;
            case 'arenaOrbe':
                if (m.ronda !== partida.ronda) break;
                partida.orbes.set(m.id, m);
                if (scene) dibujarOrbe(scene, m);
                break;
            case 'arenaOrbeToma': quitarOrbe(scene, m.id); break;
            case 'arenaCofre': quitarCofre(scene, m.id, true); break;
            case 'arenaEmote': if (scene && EMOTES.includes(m.e)) mostrarEmote(scene, m.de, m.e); break;
            case 'arenaStats': recibirStats(m); break;
            case 'salio':
                partida.equipos.delete(m.de);
                partida.vidas.delete(m.de);
                revisarRonda();
                break;
        }
    });
}

let juego = null;
export const usarJuego = j => { juego = j; };
const escena = () => (juego?.scene.isActive('juego') ? juego.scene.getScene('juego') : null);

// el anfitrión empezó una batalla: modo 'duelo' (cada uno solo) o 'equipos' (rojo y azul)
// apuesta: monedas que paga cada jugador al empezar (el equipo ganador se reparte el pozo)
export function empezarArena({ modo, arena, jugadores, apuesta = 0 }) {
    cerrarFin(); // (revancha: se cierra la pantalla final)
    apuesta = APUESTAS.includes(Number(apuesta)) ? Number(apuesta) : 0;
    if (apuesta) api.pagar(apuesta);
    partida = {
        modo,
        apuesta,
        arena: ARENAS.find(a => a.id === arena) || ARENAS[0],
        equipos: new Map(jugadores.map(j => [j.id, modo === 'equipos' ? (j.equipo === 1 ? 1 : 0) : j.id])),
        marcador: new Map(),
        ronda: 1,
        terminada: null,
        stats: { golpes: 0, derribos: 0, lavaSolo: 0, troll: 0, perfectas: 0 }, // para las medallas
        golpeA: new Map(),        // último golpe que le di a cada rival
        statsDe: new Map(),       // medallas: lo que manda cada jugador al final
        siguienteId: 1,
    };
    nuevaRonda();
}
export const terminarArena = () => { partida = null; cerrarFin(); };

function nuevaRonda() {
    partida.vidas = new Map([...partida.equipos.keys()].map(id => [id, VIDAS]));
    partida.cerrada = false;
    partida.inicio = Date.now();
    partida.cuenta = false; // la cuenta regresiva se ve una vez por ronda
    partida.derrumbe = false;
    partida.orbes = new Map();   // orbes en el suelo (id -> { x, y, poder })
    partida.cofres = new Map();  // cofres falsos (id -> x)
    partida.proxTroll = Infinity;
    partida.proxOrbe = Infinity;
    partida.golpeRecibido = 0;
    partida.dañoTroll = 0;
}

export const equipoDe = id => partida?.equipos.get(id);
export const esRival = id => !!partida && equipoDe(id) !== undefined && equipoDe(id) !== equipoDe(red.tuId);
export const misVidas = () => partida?.vidas.get(red.tuId) ?? 0;
// número de "nivel" de la ronda (los mensajes de una ronda vieja no se mezclan con los de la nueva)
export const idNivelArena = () => 1000 + (partida?.ronda || 0);
const nombreDe = id => red.jugadores.find(j => j.id === id)?.nombre || 'Alguien';
export function nombreEquipo(equipo) {
    if (!partida) return '';
    return partida.modo === 'equipos' ? NOMBRES_EQUIPO[equipo] : nombreDe(equipo);
}
// color de un jugador: por equipos, rojo o azul; en duelo, tú azul y el rival rojo
export function colorDe(id) {
    if (!partida) return null;
    if (partida.modo === 'equipos') return COLORES_EQUIPO[equipoDe(id)];
    return id === red.tuId ? COLORES_EQUIPO[1] : COLORES_EQUIPO[0];
}

// ---------- el escenario (el juego lo arma como un nivel más) ----------
// suelo partido en piezas: los bordes se derrumban solos más tarde
export function nivelArena() {
    return {
        ...partida.arena.nivel,
        nombre: partida.arena.nombre, ancho: 900, arena: true,
        monedas: [], meta: 99999, oscuridad: 0.2,
        inicio: lugarDeAparicion(),
    };
}

// dónde aparece cada uno: un equipo a la izquierda y el otro a la derecha
export function lugarDeAparicion() {
    const orden = [...new Set([...partida.equipos.values()])];
    const lado = orden.indexOf(equipoDe(red.tuId)) % 2 === 0 ? -1 : 1;
    const mios = [...partida.equipos.entries()].filter(([, e]) => e === equipoDe(red.tuId)).map(([id]) => id).sort((a, b) => a - b);
    const k = Math.max(0, mios.indexOf(red.tuId));
    return [lado < 0 ? 140 + k * 70 : 760 - k * 70, 200]; // (cae sobre el suelo)
}

// paredes de roca a los dos lados de la arena (la cámara ve más allá de los 900 px)
function paredesArena(scene) {
    const g = scene.add.graphics().setDepth(2);
    [[-400, 0], [900, 1300]].forEach(([a, b]) => {
        g.fillStyle(0x1a1420, 1).fillRect(a, -600, b - a, SUELO_Y + 700);
        g.fillStyle(0x2a2230, 1).fillRect(a < 0 ? b - 14 : a, -600, 14, SUELO_Y + 700);
    });
}

// al crear la escena de la arena
export function prepararArena(scene, alDañarRival) {
    scene.arena = partida;
    scene.rivales = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.physics.add.overlap(scene.flechasGrupo, scene.rivales, (flecha, rival) => {
        if (!flecha.perfora) flecha.destroy();
        alDañarRival(rival, 1, flecha.congela);
    });
    scene.curacionArena = CURA_ARENA;
    // la cámara muestra la arena entera y un poco más (se ven las paredes y más cielo: lo que cae de arriba)
    scene.camaraArena = 450;
    scene.cameras.main.setZoom(scene.cameras.main.width / VISTA_ARENA);
    paredesArena(scene);
    // salud (como contra el jefe) y corazones de la ronda
    api.ponerVidas(scene, misVidas());
    scene.mascotaGesi.setFlipX(lugarDeAparicion()[0] > 450);
    // marcador arriba al centro
    scene.physics.world.gravity.y = 300; // (por si reapareces en medio de la gravedad baja)
    scene.orbesFx = new Map();
    scene.cofresFx = new Map();
    scene.ojos = null;
    partida.orbes.forEach(o => dibujarOrbe(scene, o));
    partida.cofres.forEach((x, id) => dibujarCofre(scene, id, x));
    crearEmotes(scene);
    scene.events.once('shutdown', () => { quitarEmotes(); scene.oscuro = null; });
    scene.textoMarcador = scene.add.text(395, 40, '', {
        fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontStyle: '700', color: '#ffffff', stroke: '#000', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(55);
    pintarMarcador(scene);

    if (misVidas() <= 0) {
        // eliminado en esta ronda: mira cómo termina
        const g = scene.mascotaGesi;
        g.isDead = true;
        g.setVisible(false);
        g.body.enable = false;
        api.mensaje(scene, 'ELIMINADO\nmira cómo termina la ronda', 1800);
        return;
    }
    // al aparecer: unos segundos protegido (parpadea)
    scene.proteccionHasta = scene.time.now + PROTECCION_MS;
    scene.tweens.add({ targets: scene.mascotaGesi, alpha: 0.35, yoyo: true, repeat: 7, duration: 125, onComplete: () => scene.mascotaGesi.setAlpha(1) });
    if (!partida.cuenta) cuentaRegresiva(scene);
    // el derrumbe ya pasó en esta ronda (reapareciste después): los bordes siguen siendo lava
    if (partida.derrumbe) derrumbar(scene, false);
}

function cuentaRegresiva(scene) {
    partida.cuenta = true;
    partida.inicio = Date.now();
    scene.cinematica = true;
    const pasos = ['3', '2', '1', '¡A PELEAR!'];
    pasos.forEach((t, i) => scene.time.delayedCall(i * 700, () => {
        api.mensaje(scene, partida.ronda > 1 && i === 0 ? `RONDA ${partida.ronda}\n${t}` : t, 650);
        scene.sound.play(i < 3 ? 'menu_mover' : 'menu_ok', { volume: 0.6 });
        if (i === pasos.length - 1) {
            scene.cinematica = false;
            scene.proteccionHasta = scene.time.now + 600;
            // el troll y los orbes empiezan un rato después
            partida.proxTroll = Date.now() + 10000;
            partida.proxOrbe = Date.now() + 6000;
        }
    }));
}

function pintarMarcador(scene) {
    if (!scene.textoMarcador?.active) return;
    const orden = [...new Set([...partida.equipos.values()])];
    const partes = orden.map(e => `${nombreEquipo(e)} ${partida.marcador.get(e) || 0}`);
    scene.textoMarcador.setText(`RONDA ${partida.ronda} · ${partes.join('  –  ')}`);
}

// cada fotograma
export function actualizarArena(scene) {
    if (!scene.arena) return;
    actualizarOjos(scene);
    if (partida.cerrada) return;
    tocarOrbesYCofres(scene);
    // el anfitrión decide las travesuras y los orbes (y los avisa a todos)
    if (esAnfitrion() && partida.cuenta) {
        const ahora = Date.now();
        if (ahora > partida.proxTroll) { partida.proxTroll = ahora + TROLL_CADA_MS; elegirTravesura(scene); }
        if (ahora > partida.proxOrbe) { partida.proxOrbe = ahora + ORBE_CADA_MS; soltarOrbe(); }
    }
    const pasado = Date.now() - partida.inicio;
    if (partida.avisoDerrumbe !== partida.ronda && pasado > DERRUMBE_MS - 3000 && partida.cuenta) {
        partida.avisoDerrumbe = partida.ronda;
        api.mensaje(scene, '¡EL TROLL SE ABURRE!\nlos bordes se derrumban…', 2200);
        scene.cameras.main.shake(2600, 0.003);
        scene.sound.play('rugido', { volume: 0.5 });
    }
    if (!partida.derrumbe && pasado > DERRUMBE_MS && partida.cuenta) {
        partida.derrumbe = true;
        derrumbar(scene, true);
    }
}

// los bordes del suelo caen y queda lava
function derrumbar(scene, conEfecto) {
    [[0, 120], [780, 900]].forEach(([x0, x1]) => {
        scene.floor.getChildren().filter(p => p.body && Math.abs(p.body.top - (SUELO_Y)) < 8 && p.body.left >= x0 - 2 && p.body.right <= x1 + 2)
            .forEach(p => {
                p.body.enable = false;
                if (conEfecto) scene.tweens.add({ targets: p, y: p.y + 120, alpha: 0, duration: 700, ease: 'Quad.in', onComplete: () => p.destroy() });
                else p.destroy();
            });
        crearLava(scene, x0, x1);
    });
    if (conEfecto) scene.sound.play('romper', { volume: 0.7 });
}

// ---------- golpes entre jugadores ----------
// yo golpeé a un rival (lo decide mi pantalla): se le avisa solo a él
// p: el poder especial con el que le pegué (si fue uno): le hace además su efecto (efectos.js)
export function golpearRival(scene, rival, daño = 1, congela = 0, empuje = 0, p = null) {
    if (!partida || partida.cerrada || rival.rivalId == null) return;
    const ahora = scene.time.now;
    if (ahora < (rival.pvpHasta || 0)) return; // (un mismo ataque no cuenta varias veces seguidas)
    rival.pvpHasta = ahora + 300;
    partida.stats.golpes++;
    partida.golpeA.set(rival.rivalId, Date.now());
    const ox = scene.mascotaGesi.body.center.x;
    if (!empuje) empuje = Math.sign(rival.x - ox || 1) * 240;
    const efecto = efectoEnCarrera(p);
    enviarEvento('pvp', { para: rival.rivalId, daño, congela, empuje, ox, ronda: partida.ronda,
        ...(p ? { poder: 1 } : {}), ...(efecto ? { efecto, rareza: p.rareza, nv: p.nivel || 1 } : {}) });
    rival.setTintFill(0xffffff);
    scene.time.delayedCall(90, () => rival.active && rival.clearTint());
    scene.sound.play('bump', { volume: 0.5 });
}

// un rival me golpeó
function recibirGolpe(scene, m) {
    const g = scene.mascotaGesi;
    if (!scene.arena || g.isDead || scene.cinematica || scene.time.now < (scene.proteccionHasta || 0)) return;
    partida.golpeRecibido = Date.now();
    const daño = Math.max(0, Number(m.daño) || 0);
    const congela = Math.min(1500, (Number(m.congela) || 0) / 2); // contra jugadores, congelar dura la mitad
    if (daño > 0) {
        const antes = scene.salud;
        const quita = m.poder ? SALUD_POR_PODER[Math.min(7, Math.ceil(daño))] : SALUD_POR_DAÑO[Math.min(4, Math.ceil(daño))];
        scene.golpeFuerte = !!m.poder; // (game.js: contra un poder el escudo absorbe menos)
        api.golpearme(scene, quita, Number(m.ox));
        scene.golpeFuerte = false;
        if (g.isDead && m.poder) enviarEvento('arenaDerribo', { para: m.de, ronda: partida.ronda });
        if (scene.salud === antes || g.isDead) return; // lo esquivó o lo paró (o ya cayó)
    }
    const lado = Math.sign(Number(m.empuje) || g.body.center.x - Number(m.ox)) || 1;
    // poder especial: su efecto (congela, explota, ralentiza...), con los empujones más fuertes cuanto
    // menos salud te queda; si acabas de recibir uno, solo cuenta el daño (nadie queda trabado)
    if (m.efecto && EFECTOS_CARRERA[m.efecto]) {
        if (!puedeRecibirEfecto(scene)) return;
        aplicarEfecto(scene, m.efecto, { rareza: m.rareza, nivel: Number(m.nv) || 1, lado, fuerza: 1 + (1 - scene.salud / 100) * 0.9, empuje: Math.abs(Number(m.empuje)) });
        api.mensaje(scene, textoEfecto(m.efecto, nombreDe(m.de).toUpperCase()), 900);
        return;
    }
    // empujón: más fuerte cuanto menos salud te queda
    const fuerza = Math.min(560, Math.max(200, Math.abs(Number(m.empuje)) || 240) * (1 + (1 - scene.salud / 100) * 0.9));
    g.setVelocity(lado * fuerza, -220);
    scene.empujadoHasta = scene.time.now + 260 + congela;
    if (congela) {
        g.setTint(0x9fe8ff);
        scene.time.delayedCall(congela, () => g.active && !g.isDead && g.clearTint());
    }
}

// perdí un corazón (lava o sin salud)
export function arenaMuerte(scene, causa) {
    const ahora = Date.now();
    if (ahora - partida.dañoTroll < 2500) partida.stats.troll++;
    else if (causa === 'caida' && ahora - partida.golpeRecibido > 3000) partida.stats.lavaSolo++;
    const quedan = Math.max(0, misVidas() - 1);
    partida.vidas.set(red.tuId, quedan);
    api.ponerVidas(scene, quedan);
    enviarEvento('arenaCae', { vidas: quedan, ronda: partida.ronda });
    const ronda = partida.ronda;
    if (quedan > 0) {
        api.mensaje(scene, `¡PERDISTE UN CORAZÓN!\nte quedan ${quedan}`, ESPERA_REAPARECER);
        scene.time.delayedCall(ESPERA_REAPARECER, () => {
            if (partida && partida.ronda === ronda && !partida.cerrada && scene.scene.isActive()) api.reiniciar(scene);
        });
    } else {
        api.mensaje(scene, 'ELIMINADO\nmira cómo termina la ronda', 1800);
    }
    revisarRonda();
}

// el anfitrión cierra la ronda cuando queda un solo equipo con corazones
function revisarRonda() {
    if (!partida || partida.cerrada || !esAnfitrion()) return;
    const conVida = new Set([...partida.vidas.entries()]
        .filter(([id, n]) => n > 0 && red.jugadores.some(j => j.id === id)).map(([id]) => equipoDe(id)));
    if (conVida.size > 1) return;
    partida.cerrada = true;
    const ronda = partida.ronda;
    setTimeout(() => {
        const m = { ronda, ganador: conVida.size ? [...conVida][0] : null };
        enviarEvento('arenaRonda', m);
        cerrarRonda(m);
    }, 1200);
}

function cerrarRonda(m) {
    if (!partida || m.ronda !== partida.ronda || partida.fin === m.ronda) return;
    partida.fin = m.ronda;
    partida.cerrada = true;
    const scene = escena();
    const g = m.ganador;
    if (g != null) partida.marcador.set(g, (partida.marcador.get(g) || 0) + 1);
    if (g != null && g === equipoDe(red.tuId) && misVidas() === VIDAS) partida.stats.perfectas++; // ronda sin perder corazones
    if (scene) {
        pintarMarcador(scene);
        scene.cinematica = true;
        scene.sound.play('victoria', { volume: 0.5 });
    }
    const gano = g != null && (partida.marcador.get(g) || 0) >= RONDAS_PARA_GANAR;
    if (scene) api.mensaje(scene, g == null ? '¡EMPATE!' : `¡RONDA PARA\n${nombreEquipo(g).toUpperCase()}!`, 2400);
    setTimeout(() => {
        if (!partida) return;
        if (gano) { terminarPartida(g); return; }
        partida.ronda++;
        nuevaRonda();
        const s = escena();
        if (s) api.reiniciar(s);
    }, 2600);
}

// fin de la partida: premios y pantalla del ganador
function terminarPartida(ganador) {
    const scene = escena();
    const mio = ganador === equipoDe(red.tuId);
    partida.terminada = { ganador };
    const liga = anotarResultado(mio);
    setTimeout(() => ganarXP(mio ? XP.arenaGana : XP.arenaPierde, scene?.pj?.id, { victoria: mio }), 2000); // (progreso.js)
    if (liga.subio) api.premio(50); // premio por subir de liga
    // medallas: cada uno manda sus números y todos calculan las mismas
    partida.statsDe.set(red.tuId, partida.stats);
    enviarEvento('arenaStats', { stats: partida.stats });
    setTimeout(pintarMedallas, 1500);
    // con apuesta: el pozo (lo que pagaron todos) se reparte entre los del equipo ganador
    const ganadores = [...partida.equipos.values()].filter(e => e === ganador).length || 1;
    const pozo = partida.apuesta * partida.equipos.size;
    const premio = partida.apuesta ? (mio ? Math.floor(pozo / ganadores) : 0) : (mio ? 30 : 10);
    if (premio) api.premio(premio);
    if (scene) scene.cinematica = true;
    const orden = [...new Set([...partida.equipos.values()])];
    mostrarFin({
        mio,
        titulo: mio ? '¡VICTORIA!' : 'DERROTA',
        gana: `Gana ${nombreEquipo(ganador)}`,
        marcador: orden.map(e => `${nombreEquipo(e)}: ${partida.marcador.get(e) || 0}`).join('  ·  '),
        monedas: `${partida.apuesta ? `Pozo ◉ ${pozo} · ` : ''}${premio ? `◉ +${premio} monedas` : `Perdiste ◉ ${partida.apuesta}`}`
            + (mio ? ` · ${victoriasArena()} victorias en la arena` : ''),
        liga: `🏆 Liga ${liga.liga} · ${liga.copas} copas (${liga.cambio >= 0 ? '+' : ''}${liga.cambio})${liga.subio ? ' · ¡SUBISTE DE LIGA! ◉ +50' : ''}`,
    });
}

// pantalla final de la partida: capa HTML (como los menús), así los botones se pueden tocar
// en el celular (los dibujos del juego quedan debajo de los controles táctiles y del zoom de la arena)
let capaFin = null;
function mostrarFin(d) {
    cerrarFin();
    const anfitrion = esAnfitrion();
    capaFin = document.createElement('div');
    capaFin.className = 'menu-capa';
    capaFin.innerHTML = `
        <div class="menu-panel arena-fin ${d.mio ? 'gano' : ''}" role="dialog" aria-modal="true" aria-labelledby="arena-fin-titulo">
            <h2 id="arena-fin-titulo">${d.titulo}</h2>
            <p class="arena-fin-gana">${d.gana}</p>
            <p class="menu-nota">${d.marcador}</p>
            <p class="arena-fin-monedas">${d.monedas}</p>
            <p class="arena-fin-liga">${d.liga}</p>
            <ul class="arena-medallas" data-medallas><li class="menu-nota">Repartiendo medallas…</li></ul>
            ${anfitrion ? `
            <button type="button" class="menu-boton sala-empezar" data-fin="revancha">↻ Revancha</button>
            <button type="button" class="menu-boton" data-fin="sala">☰ Volver a la sala</button>`
            : '<p class="menu-nota">Esperando a que el anfitrión elija revancha o volver a la sala…</p>'}
            <button type="button" class="menu-boton menu-salir" data-fin="salir">✕ Salir</button>
        </div>`;
    document.getElementById('game').append(capaFin);
    capaFin.addEventListener('click', e => {
        const accion = e.target.closest('[data-fin]')?.dataset.fin;
        if (!accion) return;
        cerrarFin();
        if (accion === 'revancha') api.revancha();
        else if (accion === 'sala') api.volverASala();
        else api.salir();
    });
    capaFin.addEventListener('keydown', e => e.stopPropagation());
    capaFin.querySelector('[data-fin]')?.focus();
}
export function cerrarFin() {
    capaFin?.remove();
    capaFin = null;
}


// ---------- travesuras del Rey Troll ----------
const azar = (a, b) => a + Math.random() * (b - a);
const sueloLibre = () => (partida.arena.id === 'castillo' ? azar(150, 750) : Math.random() < 0.5 ? azar(150, 320) : azar(590, 760));

function elegirTravesura() {
    const tipos = Object.keys(TRAVESURAS);
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const m = { tipo, ronda: partida.ronda };
    if (tipo === 'rocas') m.xs = Array.from({ length: 6 }, () => Math.round(azar(60, 840)));
    if (tipo === 'cofre') { m.x = Math.round(sueloLibre()); m.id = partida.siguienteId++; }
    enviarEvento('arenaTroll', m);
    const scene = escena();
    if (scene) travesura(scene, m);
}

function travesura(scene, m) {
    if (!TRAVESURAS[m.tipo]) return;
    asomarTroll(scene);
    api.mensaje(scene, TRAVESURAS[m.tipo], 1400);
    const ahora = scene.time.now;
    if (m.tipo === 'controles') {
        scene.invertidoHasta = ahora + 3500;
    } else if (m.tipo === 'rocas') {
        (m.xs || []).slice(0, 8).forEach((x, i) => scene.time.delayedCall(300 + i * 220, () => caerRoca(scene, Number(x))));
    } else if (m.tipo === 'apagon') {
        apagon(scene, 5000);
    } else if (m.tipo === 'gravedad') {
        const g = scene.mascotaGesi;
        scene.physics.world.gravity.y = 110;
        if (g.body) g.body.setGravityY(200);
        scene.time.delayedCall(6000, () => {
            scene.physics.world.gravity.y = 300;
            if (g.active && g.body) g.body.setGravityY(480);
        });
    } else if (m.tipo === 'cofre') {
        partida.cofres.set(m.id, Number(m.x));
        dibujarCofre(scene, m.id, Number(m.x));
    }
}

// el Rey Troll se asoma desde arriba un momento
function asomarTroll(scene) {
    if (!scene.textures.exists('troll3_Idle')) return;
    const arriba = scene.cameras.main.worldView.y;
    const t = scene.add.sprite(450, arriba - 70, 'troll3_Idle').setOrigin(0.5, 0).setScale(0.3).setDepth(48).setFlipY(true);
    if (scene.anims.exists('troll3-idle')) t.anims.play('troll3-idle');
    scene.sound.play('rugido', { volume: 0.35, rate: 1.2 });
    scene.tweens.add({ targets: t, y: arriba - 10, duration: 350, yoyo: true, hold: 900, ease: 'Back.out', onComplete: () => t.destroy() });
}

// roca: sombra en el suelo, cae y golpea a quien esté debajo
function caerRoca(scene, x) {
    if (!scene.scene.isActive()) return;
    const sombra = scene.add.ellipse(x, SUELO_Y - 2, 30, 8, 0x000000, 0.45).setDepth(20);
    const roca = scene.add.circle(x, scene.cameras.main.worldView.y - 30, 13, 0x6b6157).setStrokeStyle(3, 0x3a332c).setDepth(36);
    scene.tweens.add({
        targets: roca, y: SUELO_Y - 14, duration: 850, ease: 'Quad.in',
        onComplete: () => {
            sombra.destroy();
            scene.tweens.add({ targets: roca, alpha: 0, scale: 1.6, duration: 200, onComplete: () => roca.destroy() });
            scene.sound.play('romper', { volume: 0.35 });
            const g = scene.mascotaGesi;
            if (!g.isDead && g.body && Math.abs(g.body.center.x - x) < 26 && g.body.bottom > SUELO_Y - 40 && !scene.cinematica) {
                partida.dañoTroll = Date.now();
                api.golpearme(scene, 15, x);
            }
        },
    });
}

// apagón: todo a oscuras, solo se ven los ojos de cada personaje
function apagon(scene, ms) {
    const cam = scene.cameras.main;
    scene.oscuro?.destroy();
    scene.oscuro = scene.add.rectangle(0, 0, cam.width * 2, cam.height * 2, 0x000000, 0.94).setOrigin(0).setScrollFactor(0).setDepth(44);
    scene.ojos = [];
    scene.time.delayedCall(ms, () => {
        if (!scene.oscuro) return;
        scene.tweens.add({ targets: scene.oscuro, alpha: 0, duration: 400, onComplete: () => { scene.oscuro?.destroy(); scene.oscuro = null; } });
        scene.ojos?.forEach(o => o.destroy());
        scene.ojos = null;
    });
}
function actualizarOjos(scene) {
    if (!scene.ojos) return;
    const cuerpos = [scene.mascotaGesi, ...[...(scene.remotos?.values() || [])].filter(r => r.visible).map(r => r.s)];
    while (scene.ojos.length < cuerpos.length) {
        scene.ojos.push(scene.add.text(0, 0, '• •', { fontSize: '10px', color: '#ffe066', fontStyle: '700' }).setOrigin(0.5).setDepth(45));
    }
    scene.ojos.forEach((o, i) => {
        const c = cuerpos[i];
        o.setVisible(!!c && c.visible && !c.isDead);
        if (c) o.setPosition(c.x + (c.flipX ? -3 : 3), c.y - 22);
    });
}

// cofre falso: parece un premio y explota al tocarlo
function dibujarCofre(scene, id, x) {
    if (scene.cofresFx.has(id) || !scene.textures.exists('misterio')) return;
    const c = scene.add.sprite(x, SUELO_Y - 16, 'misterio').setScale(1.4).setDepth(30);
    if (scene.anims.exists('misterio-brillo')) c.anims.play('misterio-brillo');
    scene.tweens.add({ targets: c, y: c.y - 4, yoyo: true, repeat: -1, duration: 500 });
    scene.cofresFx.set(id, c);
}
function quitarCofre(scene, id, remoto) {
    partida?.cofres.delete(id);
    const c = scene?.cofresFx?.get(id);
    if (!c) return;
    scene.cofresFx.delete(id);
    if (remoto) explosion(scene, c.x, c.y);
    c.destroy();
}
function explosion(scene, x, y) {
    if (scene.textures.exists('pd_fuego2')) {
        const e = scene.add.sprite(x, y, 'pd_fuego2').setDepth(37).setScale(0.8);
        if (scene.anims.exists('pd_fuego2-a')) { e.anims.play('pd_fuego2-a'); e.once('animationcomplete', () => e.destroy()); } else scene.time.delayedCall(500, () => e.destroy());
    }
    scene.sound.play('romper', { volume: 0.6 });
    scene.cameras.main.shake(200, 0.006);
}

// ---------- orbes de poder ----------
function soltarOrbe() {
    const scene = escena();
    if (!scene) return;
    // sobre una plataforma o el suelo, al azar
    const lugares = scene.floor.getChildren().filter(p => p.body?.enable && p.body.width > 60).map(p => [p.body.left + 20, p.body.right - 20, p.body.top]);
    if (!lugares.length) return;
    const [x0, x1, arriba] = lugares[Math.floor(Math.random() * lugares.length)];
    const m = { id: partida.siguienteId++, x: Math.round(azar(x0, x1)), y: Math.round(arriba - 18), poder: PODERES_ORBE[Math.floor(Math.random() * PODERES_ORBE.length)], ronda: partida.ronda };
    enviarEvento('arenaOrbe', m);
    partida.orbes.set(m.id, m);
    dibujarOrbe(scene, m);
}
function dibujarOrbe(scene, o) {
    if (scene.orbesFx.has(o.id)) return;
    const brillo = scene.add.image(o.x, o.y, scene.textures.exists('brillo') ? 'brillo' : '__WHITE').setTint(0xffc94a).setBlendMode('ADD').setScale(0.5).setDepth(31);
    const nucleo = scene.add.circle(o.x, o.y, 6, 0xfff3c0).setDepth(32);
    scene.tweens.add({ targets: [brillo, nucleo], y: o.y - 6, yoyo: true, repeat: -1, duration: 600 });
    scene.tweens.add({ targets: brillo, scale: 0.7, yoyo: true, repeat: -1, duration: 400 });
    scene.orbesFx.set(o.id, [brillo, nucleo]);
}
function quitarOrbe(scene, id) {
    partida?.orbes.delete(id);
    const fx = scene?.orbesFx?.get(id);
    if (!fx) return;
    scene.orbesFx.delete(id);
    fx.forEach(f => f.destroy());
}
function tocarOrbesYCofres(scene) {
    const g = scene.mascotaGesi;
    if (g.isDead || !g.body || scene.cinematica) return;
    const cx = g.body.center.x, cy = g.body.center.y;
    partida.orbes.forEach((o, id) => {
        if (Math.abs(o.x - cx) > 22 || Math.abs(o.y - cy) > 40) return;
        enviarEvento('arenaOrbeToma', { id });
        quitarOrbe(scene, id);
        api.orbe(scene, o.poder);
        scene.sound.play('punto_control', { volume: 0.6, rate: 1.4 });
    });
    partida.cofres.forEach((x, id) => {
        if (Math.abs(x - cx) > 22 || g.body.bottom < SUELO_Y - 40) return;
        enviarEvento('arenaCofre', { id });
        const c = scene.cofresFx.get(id);
        explosion(scene, x, c ? c.y : SUELO_Y - 16);
        quitarCofre(scene, id, false);
        partida.dañoTroll = Date.now();
        api.golpearme(scene, 25, x + (Math.random() < 0.5 ? -1 : 1));
        g.setVelocityY(-380);
        api.mensaje(scene, '¡ERA UNA TRAMPA DEL TROLL!', 1100);
    });
}

// ---------- emotes ----------
let barraEmotes = null, ultimoEmote = 0;
function crearEmotes(scene) {
    quitarEmotes();
    barraEmotes = document.createElement('div');
    barraEmotes.className = 'arena-emotes botones-flotantes-arena';
    barraEmotes.innerHTML = EMOTES.map(e => `<button type="button" data-emote="${e}" aria-label="Emote ${e}">${e}</button>`).join('');
    ['pointerdown', 'mousedown', 'touchstart'].forEach(t => barraEmotes.addEventListener(t, ev => ev.stopPropagation()));
    barraEmotes.addEventListener('click', ev => {
        const e = ev.target.closest('[data-emote]')?.dataset.emote;
        if (e) enviarEmote(e);
    });
    document.getElementById('game').append(barraEmotes);
    scene.input.keyboard?.on('keydown-E', () => enviarEmote(EMOTES[Math.floor(Math.random() * EMOTES.length)]));
}
function quitarEmotes() {
    barraEmotes?.remove();
    barraEmotes = null;
}
function enviarEmote(e) {
    const scene = escena();
    if (!scene || !partida || Date.now() - ultimoEmote < 1200) return;
    ultimoEmote = Date.now();
    enviarEvento('arenaEmote', { e });
    mostrarEmote(scene, red.tuId, e);
}
function mostrarEmote(scene, id, e) {
    const s = id === red.tuId ? scene.mascotaGesi : scene.remotos?.get(id)?.s;
    // los eliminados no se ven: su emote sale arriba, como reacción del público
    const visible = s && s.visible && !(id === red.tuId && s.isDead);
    const x = visible ? s.x : azar(200, 700), y = visible ? s.y - 40 : scene.cameras.main.worldView.y + 70;
    const t = scene.add.text(x, y, e, { fontSize: '22px' }).setOrigin(0.5).setDepth(60);
    scene.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 1400, ease: 'Sine.out', onComplete: () => t.destroy() });
}

// ---------- medallas ----------
function recibirStats(m) {
    if (!partida || !m.stats) return;
    const n = k => Math.max(0, Math.min(999, Number(m.stats[k]) || 0));
    partida.statsDe.set(m.de, { golpes: n('golpes'), derribos: n('derribos'), lavaSolo: n('lavaSolo'), troll: n('troll'), perfectas: n('perfectas') });
    pintarMedallas();
}
function pintarMedallas() {
    const lista = capaFin?.querySelector('[data-medallas]');
    if (!lista || !partida) return;
    const todos = [...partida.statsDe.entries()];
    const nombre = id => (id === red.tuId ? 'Tú' : nombreDe(id));
    const mejor = clave => todos.reduce((a, b) => (b[1][clave] > (a?.[1][clave] ?? 0) ? b : a), null);
    const medallas = [];
    const empujon = mejor('golpes'), cazador = mejor('derribos');
    if (empujon) medallas.push(['👊', 'Rey del empujón', nombre(empujon[0]), `${empujon[1].golpes} golpes`]);
    if (cazador) medallas.push(['🎯', 'Cazador', nombre(cazador[0]), `${cazador[1].derribos} corazones quitados`]);
    todos.forEach(([id, s]) => {
        if (s.perfectas) medallas.push(['🛡', 'Intocable', nombre(id), `${s.perfectas} ronda${s.perfectas > 1 ? 's' : ''} sin perder corazones`]);
        if (s.lavaSolo) medallas.push(['🌋', 'Murió solo en la lava', nombre(id), `${s.lavaSolo} vez${s.lavaSolo > 1 ? 'ces' : ''}`]);
        if (s.troll) medallas.push(['🧌', 'Troleado por el troll', nombre(id), `${s.troll} vez${s.troll > 1 ? 'ces' : ''}`]);
    });
    lista.innerHTML = medallas.length
        ? medallas.map(([i, t, quien, por]) => `<li><span aria-hidden="true">${i}</span> <b>${t}</b> · ${escaparTexto(quien)} <small>(${por})</small></li>`).join('')
        : '<li class="menu-nota">Sin medallas esta vez</li>';
}
const escaparTexto = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
