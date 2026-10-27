// La Noche del Troll: modo en línea de 4 a 8 jugadores (con bots de relleno hasta 4).
//
// El Rey Troll se disfrazó de uno de los héroes. Los héroes encienden las Antorchas del Sol y
// descubren al troll en el Juicio; el troll pone trampas a escondidas y finge ser un héroe.
// Con 7 u 8 jugadores hay dos trolls (se conocen entre ellos).
//
// Los roles los reparte el SERVIDOR al empezar y cada uno recibe solo el suyo (red.rol); a un troll
// también se le dice quiénes son los otros trolls (red.compas). Así nadie puede leer en los mensajes
// quién es el troll.
//
// Fases (ver el plan): 1 sala · 2 roles y revelación · 3 mapa del Bosque, antorchas y altar ·
// 4 poderes del troll · 4.5 encargos · 5 muerte y fantasmas · 6 Juicio y voz por cercanía · 7 bots ·
// 8 final y premios.
//
// MAPAS: el Bosque de Albora (bosque_troll.js) y Las Criptas de Albora (criptas_troll.js, se baja a
// submundos por escaleras). Cada uno trae su nivel, antorchas, altar, encargos, decorados y caminos;
// el anfitrión lo elige en la sala (red.arena) y aquí se usa siempre M (el mapa de esta noche).
// PUERTAS MÁGICAS (si el mapa tiene): quieto un momento delante de una y apareces del otro lado.
// ZONA OSCURA (si el mapa tiene): por debajo de cierta altura solo se ve cerca (como en un apagón suave).
// Se juega sin cadena y cada uno muere por su cuenta (multijugador.js).
//
// ANTORCHAS DEL SOL: se encienden quedándose cerca unos segundos (la de la Cascada, de a dos). Si te
//   alejas, lo avanzado se va perdiendo despacio. Las cuenta el ANFITRIÓN con las posiciones de todos y
//   manda el avance a los demás ('nocheFuego'); si el anfitrión se va, el siguiente sigue desde ahí.
// ALTAR DEL AMANECER (en el claro): con las 4 encendidas despierta; un héroe que lo toca trae el
//   amanecer y ganan los héroes ('nocheAmanece').
//
// PODERES DEL TROLL (teclas 1-4 o sus botones; solo los ve el troll):
//   1 🕳️ Trampa: pinchos escondidos donde estás parado. Hay que quedarse QUIETO 1,5 s para ponerla
//      (esa es la pista: "¿qué hacía Leo parado ahí?"). Los héroes solo ven tierra removida; el que la
//      pisa muere. Los trolls ven todas las trampas y no les hacen nada. En el claro no se puede.
//   2 🌑 Apagón: 10 s de oscuridad para todos; solo se ve alrededor de cada uno (el troll ve un poco más).
//   3 ✋ Empujón: empuja lejos al jugador que tienes pegado (a un precipicio, al río…).
//   4 💨 Apagar antorcha: junto a una encendida, QUIETO 3 s: se apaga y hay que volver a encenderla.
//   5 🗡️ Atacar: elimina al héroe (o bot) que tiene pegado. El troll y la víctima ven la ANIMACIÓN en
//      pantalla completa (el troll se lanza con su ataque, la víctima cae); quien esté cerca ve el
//      zarpazo en el bosque. El aviso le llega SOLO a la víctima ('para') y el servidor revisa que quien
//      ataca sea de verdad un troll; los demás solo ven el zarpazo (anónimo) y, después, el cuerpo.
//   Cada poder tiene su tiempo de espera. Las trampas, el apagón y las antorchas apagadas se mandan
//   ANÓNIMOS (el servidor no dice de quién vienen: 'anonimo' en servidor/index.js).
//
// M.encargos (bosque_troll.js): a cada uno le tocan 3 al azar en zonas distintas, para que el grupo se
//   separe. Se hacen DE A UNO: la lista de la izquierda muestra la misión actual con qué hacer y cómo
//   llegar (paso a paso: el agua primero se busca y después se lleva), el "!" y la flecha grande van solo
//   a ella y las siguientes esperan con 🔒. Con las 3 hechas, el objetivo pasa a las antorchas y al altar. Cada encargo cumplido llena
//   la "☀️ Luz del alba" (arriba, junto a las antorchas); si se llena, también amanece. El troll tiene
//   encargos FALSOS para fingir: los "cumple", pero no suman. Los encargos 'visible' (la campana, la flor)
//   los ven y oyen todos: quien los hace de verdad demuestra que no es el troll.
//
// MUERTE Y FANTASMAS: un héroe que muere deja su CUERPO donde cayó y sigue jugando como FANTASMA
//   (transparente, flota con ↑, no lo ven los vivos ni lo matan las trampas). Un fantasma puede cumplir
//   sus encargos, pero no encender antorchas ni tocar el altar. Si un vivo encuentra un cuerpo, se avisa
//   a todos (en la fase 6 eso abre el Juicio). El troll no deja cuerpo: si se cae, reaparece en el claro
//   (si alguien lo vio caer a la lava… ya sabe algo).
//   GANA EL TROLL cuando quedan tantos héroes vivos como trolls (los bots cuentan como héroes vivos).
//
// EL JUICIO (juicio.js): se abre al encontrar un cuerpo o al tocar la Campana del Juicio del claro
//   (quieto un momento junto a ella; una vez cada uno). El juego se detiene, se vota y el más votado sale
//   (queda como fantasma, sin cuerpo). Si sacan a todos los trolls, ganan los héroes. Al terminar, los
//   vivos vuelven al claro y se quitan los cuerpos ya encontrados.
//
// BOTS (bots.js): rellenan hasta 4; siempre son héroes. Los mueve el anfitrión: hacen sus encargos,
//   ayudan con las antorchas, mueren con las trampas y los empujones, encuentran cuerpos y votan.
//   Los mensajes que el anfitrión manda por un bot llevan 'quien' / 'bot' (su id, negativo).
//
// VOZ POR CERCANÍA (voz.js): en el bosque oyes a los demás según la distancia (cerca fuerte, lejos nada).
//   Los vivos no oyen a los fantasmas; los fantasmas oyen a todos. En el Juicio los vivos se oyen igual.
//
// FIN DE LA NOCHE: la noche dura 6 minutos (el Juicio no cuenta); si se acaba, gana el troll. Quien
//   gane, el ANFITRIÓN lo anuncia ('nocheFin') y el SERVIDOR le agrega quiénes eran los trolls: recién
//   ahí se revela (nadie puede saberlo antes). Premios: monedas y XP (más si ganaste; los héroes suman
//   por sus encargos y el troll por los héroes que cayeron). El anfitrión puede empezar otra noche
//   (roles nuevos) o volver a la sala.
//
// FLECHAS: en el borde de la pantalla, una flecha por cada cosa pendiente que no se ve (mis encargos en
//   amarillo, las antorchas apagadas en naranja; con todas encendidas, el altar). La del objetivo más
//   cercano es más grande y sigue el CAMINO (bots.js: guia): si hay que subir por el zigzag o tomar el
//   ascensor, apunta ahí primero y lo dice.
//
// RELOJ DE LA NOCHE: el ascensor y el tronco del río se mueven con el reloj de la sala (game.js); en la
//   noche ese reloj cuenta desde que empezó la partida y no vuelve a cero cuando alguien reaparece (si no,
//   al morir el anfitrión el ascensor saltaba en todas las pantallas y se veía gente flotando).
//
// api (la da game.js): { mensaje(scene, texto, ms), morir(scene), premio(monedas), revancha(), salir(),
//   volverASala() }

import { red, alRecibir, enviarEvento, esAnfitrion } from "./red.js"
import { PERSONAJES } from "./personajes.js"
import { fantasmas } from "./multijugador.js"
import { SUELO_Y } from "./niveles.js"
import { ganarXP, XP } from "./progreso.js"
import { MAPA_BOSQUE } from "./bosque_troll.js"
import { MAPA_CRIPTAS } from "./criptas_troll.js"
import { resDe } from "./personajes.js"
import { iniciarJuicio, abrirJuicio, cerrarJuicio, juicioActivo } from "./juicio.js"
import { usarVolumenVoz } from "./voz.js"
import { urlHoja } from "./vestidor.js"
import {
    iniciarBots, empezarBots, terminarBots, crearDibujosBots, actualizarBots, botsVivos, empujarBot, matarBot, botsAlClaro, guia, usarMapaBots,
} from "./bots.js"

const REVELACION_MS = 5000;
export const NIVEL_NOCHE = 0; // (la región del Bosque: su cielo, su niebla y su música)
const ENCENDER_MS = 4000;     // quieto junto a una antorcha hasta que prende
const APAGA_MS = 12000;       // sin nadie cerca, lo avanzado se pierde en este tiempo
const CERCA_X = 70, CERCA_Y = 90; // a qué distancia de la antorcha cuenta que estás
const ENVIO_FUEGO_MS = 200;   // el anfitrión manda el avance de las antorchas
const LETRA = '"Press Start 2P", monospace';
// poderes del troll: tecla, ícono, cuánto hay que quedarse quieto (canal) y la espera
const PODERES = [
    { id: 'trampa', tecla: '1', icono: '🕳️', nombre: 'Trampa', canal: 1500, espera: 20000 },
    { id: 'apagon', tecla: '2', icono: '🌑', nombre: 'Apagón', canal: 0, espera: 50000 },
    { id: 'empujon', tecla: '3', icono: '✋', nombre: 'Empujón', canal: 0, espera: 15000 },
    { id: 'apagar', tecla: '4', icono: '💨', nombre: 'Apagar', canal: 3000, espera: 60000 },
    { id: 'atacar', tecla: '5', icono: '🗡️', nombre: 'Atacar', canal: 0, espera: 30000 },
];
const ATAQUE_MS = 1900;  // lo que dura la animación del ataque en pantalla
const APAGON_MS = 10000;
const CLARO_LIBRE = 300;      // px alrededor del altar donde no se pueden poner trampas (en el suelo)
const EMPUJE_X = 55, EMPUJE_Y = 50; // qué tan pegado hay que estar para empujar
const ENCARGOS_POR_JUGADOR = 3;
const TOMAR = 26;             // px para tomar una luciérnaga o un hongo
const HALLAR = 70;            // px para encontrar un cuerpo
const FLOTA = 170;            // fantasma: velocidad al subir con ↑
const PUERTA_MS = 700;          // quieto delante de una puerta mágica hasta cruzarla
// los mapas de la noche (el anfitrión elige uno en la sala) y el de esta noche
export const MAPAS_NOCHE = { bosque: MAPA_BOSQUE, criptas: MAPA_CRIPTAS };
let M = MAPA_BOSQUE;
// (game.js) el nivel del mapa de esta noche; inicio: dónde aparece el fantasma
export const nivelDeNoche = inicio => M.nivel(inicio);
const JUICIO_PAUSA_MS = 15000; // después de un juicio, la campana descansa
const TRAS_JUICIO_MS = 10000;  // y los poderes del troll también
const VOZ_CERCA = 220, VOZ_LEJOS = 600; // px: hasta aquí se oye fuerte; desde aquí ya no se oye
const NOCHE_MS = 6 * 60 * 1000;  // lo que dura la noche (sin contar los juicios)
const FIN_ESPERA_MS = 5000;      // sin el anuncio del anfitrión: el final se muestra igual (sin revelar)
const PREMIO = { gana: 40, pierde: 15, encargo: 5, caido: 10 };

let noche = null, api = null;
export const nocheActiva = () => noche;
export const esModoNoche = modo => modo === 'troll';
export const soyTroll = () => noche?.rol === 'troll';
// para un troll: ¿este jugador es otro troll? (a un héroe nunca se le dice)
export const esCompaTroll = id => !!noche && soyTroll() && noche.compas.includes(id);

export function iniciarNoche(ganchos) {
    api = ganchos;
    iniciarJuicio({
        vivos: () => noche ? noche.jugadores.map(j => j.id).filter(id => !fuera(id)) : [],
        todos: () => noche ? noche.jugadores.map(j => j.id) : [],
        nombreDe: id => nombreDe(id),
        colorDe: id => colorDe(id),
        esBot: id => id < 0,
        soyFantasma: () => !!noche?.fantasma,
        alAbrir: pausarPorJuicio,
        alCerrar: tras => tras && noche && despuesDelJuicio(tras),
    });
    iniciarBots({
        noche: () => noche,
        soyAnfitrion: () => esAnfitrion(),
        juicioActivo: () => juicioActivo(),
        antorchaLista: i => !!noche?.fuego[i]?.lit,
        cumplir: (_b, e) => {
            if (e.visible) { enviarEvento('nocheVisible', { id: e.id, anonimo: true }); encargoVisible(e.id); }
            enviarEvento('nocheLuz', { anonimo: true });
            sumarLuz();
        },
        muere: (b, x, pie) => muereBot(b, x, pie),
        pisaTrampa: (b, t) => {
            enviarEvento('nocheTrampaSalta', { id: t.id });
            saltarTrampa(t.id);
            muereBot(b, t.x, t.pie);
        },
        hallaCuerpo: (b, c) => {
            enviarEvento('nocheHallazgo', { id: c.id, quien: b.id });
            hallazgo(b.id, c.id);
            abrirJuicio('cuerpo', c.id, b.id);
        },
        altar: b => {
            if (noche.amanecio || !noche.fuego.every(f => f.lit)) return;
            enviarEvento('nocheAmanece', { quien: b.id });
            amanecer(b.id);
        },
    });
    alRecibir('evento', m => {
        if (!noche) return;
        switch (m.tipo) {
            case 'nocheFuego': if (!esAnfitrion()) recibirFuego(m.f); break;
            case 'nocheAmanece': amanecer(autor(m)); break;
            case 'nocheTrampa': agregarTrampa(m); break;
            case 'nocheTrampaSalta': saltarTrampa(m.id); break;
            case 'nocheApagon': apagon(); break;
            case 'nocheEmpuje': if (m.para === red.tuId) empujado(m.dir); break;
            case 'nocheEmpujeBot': if (esAnfitrion()) empujarBot(m.id, m.dir, escenaNoche()?.time.now ?? 0); break;
            case 'nocheAtaque': if (m.para === red.tuId) meAtacan(m); break;
            case 'nocheAtaqueBot': if (esAnfitrion()) { const b = botsVivos().find(x => x.id === m.id); if (b) muereBot(b, b.x, b.pie); } break;
            case 'nocheZarpazo': zarpazo(Number(m.x), Number(m.y), m.dir); break;
            case 'nocheApagar': if (esAnfitrion()) apagarAntorcha(m.i); break;
            case 'nocheLuz': sumarLuz(); break;
            case 'nocheVisible': encargoVisible(m.id); break;
            case 'nocheMuerte': muerte(autor(m), m); break;
            case 'nocheHallazgo': hallazgo(autor(m), m.id); break;
            case 'salio': if (noche.jugadores.some(j => j.id === m.de)) salioJugador(m.de); break;
            case 'nocheFin': if (m.de === red.anfitrion) recibirFin(m); break;
        }
    });
}

// quién: un bot (si lo manda el anfitrión en su nombre) o el que mandó el mensaje
const autor = m => (m.quien != null && m.quien < 0 && m.de === red.anfitrion ? m.quien : m.de);

// (anfitrión) un bot murió: queda su cuerpo como el de cualquiera
function muereBot(b, x, pie) {
    if (!b.vivo) return;
    matarBot(b.id);
    const datos = { quien: b.id, x: Math.round(x), y: Math.round(pie - 40), pj: b.pj.id };
    enviarEvento('nocheMuerte', datos);
    muerte(b.id, datos);
}

// el anfitrión empezó la noche (red.js ya guardó el rol, los compañeros y los bots)
export function empezarNoche({ jugadores, mapa }) {
    terminarNoche();
    M = MAPAS_NOCHE[mapa] || MAPA_BOSQUE;
    usarMapaBots(M);
    noche = {
        mapa: M.id,
        rol: red.rol === 'troll' ? 'troll' : 'heroe',
        compas: [...red.compas],
        jugadores: [...jugadores, ...red.bots],
        revelado: false, // la revelación se ve una sola vez por partida (no al reaparecer)
        // avance de cada antorcha (0 a 1) y si ya prendió; sigue igual al reaparecer
        fuego: M.antorchas.map(() => ({ p: 0, lit: false })),
        amanecio: false,
        trampas: [],     // [{ id, x, pie }] las que todavía no saltaron
        espera: {},      // (troll) poder -> Date.now() en que vuelve a estar listo
        canal: null,     // (troll) poder que se está preparando quieto
        apagonHasta: 0,  // Date.now() en que termina el apagón
        encargos: repartirEncargos(),
        luz: 0,          // encargos cumplidos por todos los héroes
        luzMeta: 0,      // (se calcula abajo)
        fantasma: null,  // [x, y] donde morí (soy un fantasma); null: vivo
        muertos: new Set(), // héroes muertos (ids)
        cuerpos: [],     // [{ id, x, y, pj, hallado }]
        visibles: new Set(), // encargos 'visible' ya cumplidos (la flor abierta, la palanca bajada…)
        puerta: null,    // { p, lado, desde }: quieto delante de una puerta
        trollsFuera: new Set(), // trolls expulsados en un juicio
        expulsados: new Set(),  // todos los expulsados (héroes y trolls)
        fin: Date.now() + NOCHE_MS, // cuándo se acaba la noche (se corre con cada juicio)
        t0: Date.now(),  // (el reloj de la sala: ascensor y tronco del río)
        pausaDesde: 0,
        trollsReales: null,     // al final, el servidor dice quiénes eran
        textoFin: '',
        esperaFin: null,
        premiado: false,
        campanaUsada: false,    // (la Campana del Juicio: una vez cada uno)
        finJuicio: 0,
        ganador: null,   // 'heroes' | 'troll' cuando termina
        ultimoEnvio: 0,
        enviado: '',
    };
    noche.luzMeta = ENCARGOS_POR_JUGADOR * Math.max(1, noche.jugadores.length - cuantosTrolls());
    usarVolumenVoz(volumenDe);
    empezarBots(red.bots, red.semilla);
}

// ms desde que empezó la noche (game.js arranca con esto el reloj de la sala al rearmar el nivel)
export const relojNoche = () => (noche ? Date.now() - noche.t0 : 0);

// fuera del juego: un héroe muerto o expulsado, o un troll expulsado
const fuera = id => noche.muertos.has(id) || noche.trollsFuera.has(id);
const colorDe = id => {
    const pj = PERSONAJES.find(p => p.id === noche?.jugadores.find(j => j.id === id)?.pj) || PERSONAJES[0];
    return '#' + pj.color.toString(16).padStart(6, '0');
};

// voz por cercanía: qué tan fuerte oigo a este jugador (0 a 1)
function volumenDe(id) {
    if (!noche) return 1;
    const yoFantasma = !!noche.fantasma, elFantasma = fuera(id);
    if (elFantasma && !yoFantasma) return 0; // (los vivos no oyen a los fantasmas)
    if (juicioActivo()) return 1;
    const scene = escenaNoche(), g = scene?.mascotaGesi, e = scene?.remotos?.get(id)?.estado;
    if (!g || !e) return 0;
    const d = Math.hypot(e.x - g.x, e.y - g.y);
    return Phaser.Math.Clamp(1 - (d - VOZ_CERCA) / (VOZ_LEJOS - VOZ_CERCA), 0, 1);
}

const cuantosTrolls = () => (noche.jugadores.length >= 7 ? 2 : 1);
// dónde aparece: el fantasma, donde cayó (un poco más arriba, por si fue en la lava)
export const inicioNoche = () => (noche?.fantasma ? [noche.fantasma[0], Math.min(noche.fantasma[1], SUELO_Y - 90)] : null);

// 3 encargos al azar (la semilla de la sala y mi número: siempre los mismos en esta partida)
function repartirEncargos() {
    let a = ((red.semilla >>> 0) ^ Math.imul((red.tuId ?? 0) + 7, 2654435761)) >>> 0;
    const azar = () => { a = (Math.imul(a ^ (a >>> 15), 2246822519) + 0x9e3779b9) >>> 0; return a / 4294967296; };
    const bolsa = [...M.encargos];
    for (let i = bolsa.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [bolsa[i], bolsa[j]] = [bolsa[j], bolsa[i]]; }
    return bolsa.slice(0, ENCARGOS_POR_JUGADOR).map(e => ({ ...e, hecho: false, tomados: [], lleva: false }));
}

export function terminarNoche() {
    clearTimeout(noche?.esperaFin);
    noche = null;
    cerrarJuicio();
    terminarBots();
    usarVolumenVoz(null);
    cerrarRevelacion();
    cerrarFin();
    quitarMarca();
    quitarHud();
    quitarBarraTroll();
    quitarLista();
    quitarFlechas();
    quitarReportar();
    capaAtaque?.remove();
    capaAtaque = null;
}

// al crear el nivel: el bosque (antorchas, altar, cascada), la revelación (la primera vez),
// la marca de tu rol y el contador de antorchas
export function prepararNoche(scene) {
    if (!noche) return;
    crearBosque(scene);
    crearEncargos(scene);
    crearCampanaJuicio(scene);
    crearDibujosBots(scene);
    prepararFantasma(scene);
    noche.cuerpos.forEach(c => dibujarCuerpo(scene, c));
    noche.canal = null; // (murió preparando algo)
    noche.trampas.forEach(t => dibujarTrampa(scene, t));
    scene.nocheOscuro = null;
    scene.nocheCanal = null;
    if (soyTroll() && !noche.fantasma) crearBarraTroll();
    else quitarBarraTroll();
    mostrarMarca();
    crearHud();
    pintarHud();
    crearLista();
    crearFlechas();
    if (!noche.revelado) {
        noche.revelado = true;
        mostrarRevelacion();
    }
}

// ---------- cada fotograma ----------
export function actualizarNoche(scene, time) {
    if (!noche || !scene.nocheAntorchas) return;
    actualizarBots(scene, time, scene.game.loop.delta);
    pintarFlechas(scene, time);
    if (juicioActivo()) return; // (todo se detiene mientras se vota)
    pintarTiempo();
    if (esAnfitrion() && !noche.ganador && Date.now() > noche.fin) terminar('troll', 'Se acabó la noche: el sol nunca salió.');
    const dt = Math.min(100, scene.game.loop.delta);
    if (esAnfitrion() && !noche.amanecio) contarFuego(scene, dt, time);
    scene.nocheAntorchas.forEach((a, i) => pintarAntorcha(scene, a, noche.fuego[i]));
    revisarAltar(scene);
    revisarTrampas(scene);
    pintarOscuridad(scene);
    if (soyTroll()) actualizarTroll(scene, time);
    actualizarEncargos(scene, time);
    revisarPuertas(scene, time);
    if (scene.esFantasma) { flotar(scene); mostrarReportar(false); }
    else { revisarCuerpos(scene); revisarCampana(scene, time); }
}

// quiénes cuentan para encender: yo (si estoy vivo) y los demás que se ven
function jugadoresCerca(scene, a) {
    const g = scene.mascotaGesi;
    const todos = [...(g && !g.isDead && !scene.esFantasma ? [g] : []), ...fantasmas(scene)];
    const bots = botsVivos().filter(b => Math.abs(b.x - a.x) < CERCA_X && Math.abs(b.pie - a.pie) < CERCA_Y).length;
    return bots + todos.filter(j => Math.abs(j.body.center.x - a.x) < CERCA_X && Math.abs(j.body.bottom - a.pie) < CERCA_Y).length;
}

// (anfitrión) avanza o apaga cada antorcha según cuántos hay cerca, y avisa a los demás
function contarFuego(scene, dt, time) {
    M.antorchas.forEach((a, i) => {
        const f = noche.fuego[i];
        if (f.lit) return;
        const hay = jugadoresCerca(scene, a) >= (a.dos ? 2 : 1);
        f.p = Phaser.Math.Clamp(f.p + (hay ? dt / ENCENDER_MS : -dt / APAGA_MS), 0, 1);
        if (f.p >= 1) { f.lit = true; prendio(scene, i); }
    });
    if (time - noche.ultimoEnvio < ENVIO_FUEGO_MS) return;
    const f = noche.fuego.map(x => [Math.round(x.p * 100) / 100, x.lit ? 1 : 0]);
    const texto = JSON.stringify(f);
    if (texto === noche.enviado) return;
    noche.ultimoEnvio = time;
    noche.enviado = texto;
    enviarEvento('nocheFuego', { f });
}

function recibirFuego(f) {
    if (!Array.isArray(f)) return;
    const scene = escenaNoche();
    f.forEach(([p, lit], i) => {
        const yo = noche.fuego[i];
        if (!yo) return;
        yo.p = Phaser.Math.Clamp(Number(p) || 0, 0, 1);
        if (lit && !yo.lit) { yo.lit = true; if (scene) prendio(scene, i); }
        else if (!lit && yo.lit) { yo.lit = false; if (scene) seApago(scene, i); }
    });
}

// una antorcha acaba de prender: llama, aviso y el contador
function prendio(scene, i) {
    const a = scene.nocheAntorchas?.[i];
    if (a && !a.llama) encenderDibujo(scene, a);
    const encendidas = noche.fuego.filter(f => f.lit).length;
    api.mensaje(scene, encendidas === M.antorchas.length
        ? '🌅 ¡EL ALTAR DESPERTÓ!\nVuelvan al claro'
        : `🔥 ¡ANTORCHA DE ${M.antorchas[i].nombre.toUpperCase()}!\n${encendidas} de ${M.antorchas.length}`, 1600);
    scene.sound.play('punto_control', { volume: 0.5 });
    if (encendidas === M.antorchas.length) despertarAltar(scene);
    pintarHud();
}

// el altar: con todas encendidas, un héroe vivo que lo toca trae el amanecer
function revisarAltar(scene) {
    const g = scene.mascotaGesi;
    if (noche.amanecio || soyTroll() || scene.esFantasma || !g || g.isDead || !noche.fuego.every(f => f.lit)) return;
    if (Math.abs(g.body.center.x - M.altar.x) > 40 || Math.abs(g.body.bottom - M.altar.pie) > 20) return;
    enviarEvento('nocheAmanece', {});
    amanecer(red.tuId);
}

// quien: el héroe que tocó el altar (o null: se llenó la luz del alba); texto: otro motivo
function amanecer(quien, texto = null) {
    if (!noche || noche.amanecio) return;
    terminar('heroes', texto || (quien == null ? 'La luz del alba llenó el cielo.' : `${nombreDe(quien)} trajo el amanecer.`));
}

// la noche terminó: se detiene todo y el anfitrión lo anuncia (el servidor agrega quiénes eran los trolls)
function terminar(ganador, texto, anunciado = false) {
    if (!noche || noche.ganador) return;
    noche.amanecio = true;
    noche.ganador = ganador;
    noche.textoFin = texto;
    const scene = escenaNoche();
    if (scene && ganador === 'heroes') {
        noche.fuego.forEach((f, i) => { if (!f.lit) { f.lit = true; prendio(scene, i); } });
        api.mensaje(scene, '🌅 ¡AMANECIÓ!\nGanan los héroes', 2600);
        scene.cameras.main.flash(900, 255, 220, 150);
    } else if (scene) {
        api.mensaje(scene, '👹 ¡LA NOCHE ES ETERNA!\nGana el troll', 2600);
        scene.cameras.main.flash(900, 180, 20, 40);
    }
    if (esAnfitrion() && !anunciado) enviarEvento('nocheFin', { ganador, texto });
    noche.esperaFin = setTimeout(mostrarFin, anunciado ? 2200 : FIN_ESPERA_MS);
}

// el anuncio del anfitrión (con los trolls de verdad): manda sobre lo que se vio aquí
function recibirFin(m) {
    if (!noche || (m.ganador !== 'heroes' && m.ganador !== 'troll')) return;
    noche.trollsReales = Array.isArray(m.trolls) ? m.trolls : null;
    if (!noche.ganador) { terminar(m.ganador, String(m.texto || ''), true); return; }
    noche.ganador = m.ganador;
    noche.textoFin = String(m.texto || noche.textoFin);
    clearTimeout(noche.esperaFin);
    noche.esperaFin = setTimeout(mostrarFin, capaFin ? 0 : 2200);
}

// quedan tantos héroes vivos como trolls: gana el troll
function revisarTroll() {
    if (noche.amanecio) return;
    const trolls = cuantosTrolls() - noche.trollsFuera.size;
    if (trolls <= 0) { amanecer(null, `Descubrieron ${cuantosTrolls() > 1 ? 'a los trolls' : 'al troll'} en el Juicio.`); return; }
    const vivos = noche.jugadores.length - cuantosTrolls() - noche.muertos.size;
    if (vivos > trolls) return;
    terminar('troll', 'El troll acabó con los héroes.');
}

// ---------- el bosque: antorchas, altar, cascada, tronco hueco y letreros ----------
let juegoNoche = null;
const escenaNoche = () => (juegoNoche?.scene.isActive('juego') ? juegoNoche.scene.getScene('juego') : null);

function crearBosque(scene) {
    juegoNoche = scene.game;
    texturasNoche(scene);
    // lo propio del mapa (el tronco y la cascada del bosque; las losas y escaleras de las criptas…)
    M.decorar(scene, { letrero, visibles: noche.visibles });
    // luces que cambian (luz.js): las Antorchas del Sol encendidas y el altar despierto alumbran su zona
    scene.lucesExtra = () => {
        if (!noche) return [];
        const l = M.antorchas.filter((_a, i) => noche.fuego[i].lit).map(a => ({ x: a.x, y: a.pie - 70, r: 300, color: 0xffb050, fuerza: 1 }));
        if (noche.fuego.every(f => f.lit)) l.push({ x: M.altar.x, y: M.altar.pie - 60, r: 280, color: 0xffe08a, fuerza: 1 });
        return l;
    };
    crearPuertas(scene);
    // antorchas: un pedestal de piedra con su brasero (prenden en troll.js)
    scene.nocheAntorchas = M.antorchas.map((a, i) => {
        scene.add.image(a.x, a.pie, 'noche_pedestal').setOrigin(0.5, 1).setDepth(6);
        const anillo = scene.add.graphics().setDepth(42);
        const nombre = scene.add.text(a.x, a.pie - 92, `${a.id} · ${a.nombre}${a.dos ? ' 👥' : ''}`, {
            fontFamily: LETRA, fontSize: '7px', color: '#ffe9a8', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5, 1).setDepth(42);
        const pista = scene.add.text(a.x, a.pie - 104, '', {
            fontFamily: LETRA, fontSize: '7px', color: '#9fd8ff', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5, 1).setDepth(42);
        const d = { ...a, anillo, nombre, pista, llama: null };
        if (noche.fuego[i].lit) encenderDibujo(scene, d);
        return d;
    });
    // altar del amanecer: piedra con 4 ranuras (una por antorcha)
    const al = M.altar;
    scene.add.image(al.x, al.pie, 'noche_altar').setOrigin(0.5, 1).setDepth(6);
    scene.nocheRanuras = M.antorchas.map((_a, i) => scene.add.circle(al.x - 27 + i * 18, al.pie - 30, 5, 0x2a2a38).setDepth(7));
    letrero(scene, al.x, al.pie - 76, 'ALTAR DEL AMANECER');
    scene.nocheAltarLuz = null;
    if (noche.fuego.every(f => f.lit)) despertarAltar(scene);
}

function letrero(scene, x, y, texto) {
    scene.add.text(x, y, texto, {
        fontFamily: LETRA, fontSize: '7px', color: '#e8dcc0', backgroundColor: '#3b2a1aCC', padding: { x: 5, y: 4 },
    }).setOrigin(0.5, 1).setDepth(8);
}

function texturasNoche(scene) {
    if (scene.textures.exists('noche_pedestal')) return;
    const g = scene.make.graphics({ add: false });
    // pedestal con brasero
    g.fillStyle(0x5a5466).fillRect(10, 22, 28, 44);
    g.fillStyle(0x6f6a7c).fillRect(6, 60, 36, 8).fillRect(8, 18, 32, 6);
    g.fillStyle(0x3a3440).fillRect(4, 8, 40, 12);
    g.fillStyle(0x2a2430).fillRect(8, 6, 32, 4);
    g.generateTexture('noche_pedestal', 48, 68);
    g.clear();
    // altar: losa de piedra con un sol tallado
    g.fillStyle(0x4c4858).fillRect(0, 24, 84, 36);
    g.fillStyle(0x625d72).fillRect(4, 18, 76, 10).fillRect(0, 56, 84, 6);
    g.lineStyle(2, 0x8a8398).strokeCircle(42, 10, 9);
    g.generateTexture('noche_altar', 84, 62);
    g.clear();
    // agua: franjas que bajan
    g.fillStyle(0x6aa8d8).fillRect(0, 0, 64, 64);
    g.fillStyle(0xb8e0ff, 0.7).fillRect(6, 0, 4, 40).fillRect(22, 18, 3, 46).fillRect(40, 4, 5, 34).fillRect(54, 26, 3, 38);
    g.generateTexture('noche_agua', 64, 64);
    g.destroy();
}

function pintarAntorcha(scene, a, f) {
    a.anillo.clear();
    // pista "hacen falta 2" para quien está junto a la de la cascada solo
    const g = scene.mascotaGesi;
    const cerca = g && !g.isDead && Math.abs(g.body.center.x - a.x) < CERCA_X && Math.abs(g.body.bottom - a.pie) < CERCA_Y;
    a.pista.setText(!f.lit && cerca && a.dos && jugadoresCerca(scene, a) < 2 ? 'HACEN FALTA 2' : '');
    if (f.lit || f.p <= 0) return;
    // (al lado del brasero: arriba lo taparía el techo de la cueva)
    const x = a.x + 40, y = a.pie - 78;
    a.anillo.lineStyle(4, 0x000000, 0.5).strokeCircle(x, y, 12);
    a.anillo.lineStyle(4, 0xffc94a, 1).beginPath()
        .arc(x, y, 12, -Math.PI / 2, -Math.PI / 2 + f.p * Math.PI * 2).strokePath();
}

function encenderDibujo(scene, a) {
    a.llama = scene.add.sprite(a.x, a.pie - 74, 'mz_antorcha3').setScale(0.6).setDepth(7);
    if (scene.anims.exists('mz_antorcha3')) a.llama.play('mz_antorcha3');
    a.luz = scene.add.image(a.x, a.pie - 70, 'brillo').setDepth(41).setScale(3.4).setTint(0xffd27a).setAlpha(0.45).setBlendMode('ADD');
    scene.tweens.add({ targets: a.luz, alpha: 0.3, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
    a.nombre.setColor('#ffc94a');
}
function apagarDibujo(scene, a) {
    a.llama?.destroy();
    a.luz?.destroy();
    a.llama = a.luz = null;
    a.nombre.setColor('#ffe9a8');
    // humo
    const humo = scene.add.image(a.x, a.pie - 80, 'brillo').setDepth(41).setScale(1.2).setTint(0x8a8a9a).setAlpha(0.6);
    scene.tweens.add({ targets: humo, y: humo.y - 50, alpha: 0, scale: 2.4, duration: 1400, onComplete: () => humo.destroy() });
}

// una antorcha se apagó (el troll): sin llama, aviso y el altar vuelve a dormirse
function seApago(scene, i) {
    const a = scene.nocheAntorchas?.[i];
    if (a?.llama) apagarDibujo(scene, a);
    dormirAltar(scene);
    api.mensaje(scene, `💨 ¡SE APAGÓ LA ANTORCHA DE ${M.antorchas[i].nombre.toUpperCase()}!`, 1800);
    pintarHud();
}
// (anfitrión) el troll apagó una antorcha: los demás se enteran con el próximo 'nocheFuego'
function apagarAntorcha(i) {
    const f = noche?.fuego[i];
    if (!f?.lit || noche.amanecio) return;
    f.lit = false;
    f.p = 0;
    const scene = escenaNoche();
    if (scene) seApago(scene, i);
}
function dormirAltar(scene) {
    scene.nocheRanuras?.forEach(r => r.setFillStyle(0x2a2a38));
    scene.nocheAltarLuz?.destroy();
    scene.nocheAltarLuz = null;
}

function despertarAltar(scene) {
    if (scene.nocheAltarLuz) return;
    scene.nocheRanuras?.forEach(r => r.setFillStyle(0xffc94a));
    const al = M.altar;
    scene.nocheAltarLuz = scene.add.rectangle(al.x, al.pie - 40, 20, 520, 0xffe9a8, 0.35).setOrigin(0.5, 1).setDepth(41).setBlendMode('ADD');
    scene.tweens.add({ targets: scene.nocheAltarLuz, alpha: 0.15, yoyo: true, repeat: -1, duration: 800 });
}

// ---------- trampas del troll ----------
const idNuevo = () => Math.random().toString(36).slice(2, 9); // (al azar: que no delate a nadie)

function agregarTrampa(m) {
    const t = { id: String(m.id), x: Number(m.x), pie: Number(m.pie) };
    if (!Number.isFinite(t.x) || !Number.isFinite(t.pie) || noche.trampas.some(o => o.id === t.id)) return;
    noche.trampas.push(t);
    const scene = escenaNoche();
    if (scene) dibujarTrampa(scene, t);
}

// el troll ve los pinchos en rojo; los héroes, solo un poco de tierra removida (la pista)
function dibujarTrampa(scene, t) {
    if (soyTroll()) {
        t.dibujo = scene.add.container(t.x, t.pie, [-16, 0, 16].map(dx =>
            scene.add.image(dx, 0, 'pincho').setOrigin(0.5, 1).setTint(0xff4d5e).setAlpha(0.5))).setDepth(33);
    } else {
        t.dibujo = scene.add.ellipse(t.x, t.pie + 1, 30, 7, 0x4a3420, 0.75).setDepth(33);
    }
}

// ¿la pisé? (solo los héroes; cada pantalla revisa a su propio jugador)
function revisarTrampas(scene) {
    const g = scene.mascotaGesi;
    if (soyTroll() || scene.esFantasma || !g || g.isDead || !noche.trampas.length) return;
    const b = g.body;
    const t = noche.trampas.find(t => Math.abs(b.center.x - t.x) < 22 && Math.abs(b.bottom - t.pie) < 12);
    if (!t) return;
    enviarEvento('nocheTrampaSalta', { id: t.id });
    saltarTrampa(t.id);
    api.mensaje(scene, '🕳️ ¡UNA TRAMPA DEL TROLL!', 1500);
    api.morir(scene);
}

function saltarTrampa(id) {
    const i = noche.trampas.findIndex(t => t.id === id);
    if (i < 0) return;
    const [t] = noche.trampas.splice(i, 1);
    t.dibujo?.destroy();
    const scene = escenaNoche();
    if (!scene) return;
    const pinchos = [-16, 0, 16].map(dx => scene.add.image(t.x + dx, t.pie + 18, 'pincho').setOrigin(0.5, 1).setDepth(33));
    scene.tweens.add({ targets: pinchos, y: t.pie, duration: 120, ease: 'Back.out' });
    scene.tweens.add({ targets: pinchos, alpha: 0, delay: 1800, duration: 400, onComplete: () => pinchos.forEach(p => p.destroy()) });
    scene.sound.play('bump', { volume: 0.5 });
}

// ---------- apagón ----------
function apagon() {
    noche.apagonHasta = Date.now() + APAGON_MS;
    const scene = escenaNoche();
    if (scene) api.mensaje(scene, '🌑 ¡APAGÓN!', 1400);
}
function texturaOscura(scene) {
    if (scene.textures.exists('noche_oscuro')) return;
    const w = 2000, h = 1200;
    const tx = scene.textures.createCanvas('noche_oscuro', w, h);
    const ctx = tx.getContext();
    const grad = ctx.createRadialGradient(w / 2, h / 2, 70, w / 2, h / 2, 170);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(2,3,8,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    tx.refresh();
}
// sigue al jugador mientras dure; el troll ve un poco a través
// (también en la zona oscura del mapa, más suave: las Catacumbas)
function pintarOscuridad(scene) {
    const g = scene.mascotaGesi;
    const apagon = Date.now() < noche.apagonHasta;
    const zona = !!M.oscuro && !!g?.body && g.body.bottom > M.oscuro.desde;
    // con la luz nueva (luz.js): se oscurece la noche en vez de tapar la pantalla (el troll ve más)
    if (scene.luz) {
        scene.luzOscurecer = apagon ? (soyTroll() ? 0.45 : 0.9) : zona ? (soyTroll() ? 0.3 : 0.55) : 0;
        return;
    }
    if (!apagon && !zona) {
        if (scene.nocheOscuro) { scene.nocheOscuro.destroy(); scene.nocheOscuro = null; }
        return;
    }
    if (!scene.nocheOscuro) {
        texturaOscura(scene);
        scene.nocheOscuro = scene.add.image(0, 0, 'noche_oscuro').setDepth(45);
    }
    scene.nocheOscuro.setAlpha(apagon ? (soyTroll() ? 0.6 : 0.97) : (soyTroll() ? 0.5 : 0.82));
    if (g) scene.nocheOscuro.setPosition(g.body?.center.x ?? g.x, g.body?.center.y ?? g.y);
}

// ---------- empujón ----------
function empujado(dir) {
    const scene = escenaNoche();
    const g = scene?.mascotaGesi;
    if (!g || g.isDead) return;
    g.setVelocity((dir < 0 ? -1 : 1) * 480, -300);
    scene.empujadoHasta = scene.time.now + 600;
    scene.cameras.main.shake(160, 0.006);
    scene.sound.play('bump', { volume: 0.6 });
}
// el jugador (o bot) pegado a mí, que no sea un compañero troll: { id, x, bot }
function alcanzable(scene) {
    const g = scene.mascotaGesi;
    let mejor = null, dist = Infinity;
    const probar = (id, x, y, bot) => {
        const dx = Math.abs(x - g.x), dy = Math.abs(y - g.y);
        if (dx < EMPUJE_X && dy < EMPUJE_Y && dx < dist) { dist = dx; mejor = { id, x, bot }; }
    };
    scene.remotos?.forEach(r => { if (r.visible && !r.estado?.fantasma && !noche.compas.includes(r.id)) probar(r.id, r.s.x, r.s.y, false); });
    botsVivos().forEach(b => probar(b.id, b.x, b.pie - 62, true));
    return mejor;
}

// ---------- ataque del troll ----------
// el troll elimina al que tiene pegado: se lanza sobre él, todos ven el zarpazo y los dos, la animación
function atacar(scene) {
    const g = scene.mascotaGesi, v = alcanzable(scene);
    if (!v) return;
    const dir = v.x < g.x ? -1 : 1;
    const y = Math.round(g.body.center.y);
    // el prefijo de animación de la víctima (sus colores) para dibujarla en la animación
    const victima = v.bot ? botsVivos().find(b => b.id === v.id) : null;
    const prefijo = v.bot ? victima?.pj.id : scene.remotos?.get(v.id)?.prefijo || noche.jugadores.find(j => j.id === v.id)?.pj;
    if (v.bot) {
        if (esAnfitrion()) { if (victima) muereBot(victima, victima.x, victima.pie); }
        else enviarEvento('nocheAtaqueBot', { id: v.id, anonimo: true });
    } else enviarEvento('nocheAtaque', { para: v.id, pref: scene.pj?.anim, dir });
    enviarEvento('nocheZarpazo', { x: Math.round(v.x), y, dir, anonimo: true });
    zarpazo(v.x, y, dir);
    // se lanza sobre la víctima
    g.body.reset(v.x - dir * 12, g.y);
    g.setFlipX(dir < 0);
    mostrarAtaque({ atacante: scene.pj?.anim, victima: prefijo, texto: `🗡️ ¡ELIMINASTE A ${nombreDe(v.id).toUpperCase()}!`, soyTroll: true });
}

// me atacó el troll: la animación y muero (quedo como fantasma, como con una trampa)
function meAtacan(m) {
    const scene = escenaNoche(), g = scene?.mascotaGesi;
    if (!scene || !g || g.isDead || scene.esFantasma || soyTroll() || noche.ganador) return;
    mostrarAtaque({ atacante: m.pref, victima: scene.pj?.anim, texto: '💀 ¡EL TROLL TE ATRAPÓ!', soyTroll: false });
    noche.atrapado = true; // (sin el aviso de "moriste": ya lo dice la animación)
    api.morir(scene);
}

// en el bosque (lo ve quien esté cerca): un zarpazo rojo y unas chispas
function zarpazo(x, y, dir = 1) {
    const scene = escenaNoche();
    if (!scene || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const g = scene.add.graphics().setDepth(44);
    [-12, 0, 12].forEach(d => {
        g.lineStyle(4, 0xff3b4e, 1).beginPath();
        g.arc(x - dir * 6, y + d, 26, (dir > 0 ? -0.9 : Math.PI - 0.9) + d / 40, (dir > 0 ? 0.9 : Math.PI + 0.9) + d / 40);
        g.strokePath();
    });
    scene.tweens.add({ targets: g, alpha: 0, duration: 650, delay: 150, onComplete: () => g.destroy() });
    for (let i = 0; i < 8; i++) {
        const c = scene.add.circle(x, y, 3, 0xff4d5e).setDepth(44);
        scene.tweens.add({ targets: c, x: x + (Math.random() - 0.5) * 90, y: y + (Math.random() - 0.7) * 70, alpha: 0, duration: 600, onComplete: () => c.destroy() });
    }
    scene.sound.play('romper', { volume: 0.6, rate: 0.7 });
    if (scene.mascotaGesi && Math.abs(scene.mascotaGesi.x - x) < 500) scene.cameras.main.shake(180, 0.006);
}

// la animación en pantalla completa: el troll se lanza con su ataque y la víctima cae
let capaAtaque = null;
function mostrarAtaque({ atacante, victima, texto, soyTroll: esTroll }) {
    capaAtaque?.remove();
    const juego = escenaNoche()?.game;
    const hoja = (prefijo, anim) => {
        const id = String(prefijo || '').split('~')[0];
        const pj = PERSONAJES.find(p => p.id === id) || PERSONAJES[0];
        // (si no tiene esa hoja: su primer ataque, o quieto)
        const nombre = pj.hojas[anim] ? anim : anim.startsWith('atk') ? Object.keys(pj.hojas).find(k => /^(atk|shot)/.test(k)) || 'idle' : 'idle';
        const [, n, fps] = pj.hojas[nombre];
        return `background-image:url('${urlHoja(juego, prefijo || pj.id, nombre)}');--n:${n};--fps:${fps}`;
    };
    capaAtaque = document.createElement('div');
    capaAtaque.className = `noche-ataque ${esTroll ? 'troll' : 'victima'}`;
    capaAtaque.setAttribute('role', 'alert');
    capaAtaque.innerHTML = `
        <div class="noche-ataque-escena">
            <div class="noche-ataque-pj atacante"><div class="sala-sprite" style="${hoja(atacante, 'atk1')}"></div></div>
            <div class="noche-ataque-corte" aria-hidden="true"></div>
            <div class="noche-ataque-pj caido"><div class="sala-sprite izquierda vivo" style="${hoja(victima, 'idle')}"></div><div class="sala-sprite izquierda muerto" style="${hoja(victima, 'dead')}"></div></div>
        </div>
        <p>${escapar(texto)}</p>`;
    document.getElementById('game').append(capaAtaque);
    const capa = capaAtaque;
    setTimeout(() => { capa.remove(); if (capaAtaque === capa) capaAtaque = null; }, ATAQUE_MS);
}

// ---------- poderes del troll: barra, teclas y "quieto" ----------
const antorchaCerca = (scene, soloEncendida) => {
    const g = scene.mascotaGesi;
    return M.antorchas.findIndex((a, i) => (!soloEncendida || noche.fuego[i].lit) &&
        Math.abs(g.body.center.x - a.x) < CERCA_X && Math.abs(g.body.bottom - a.pie) < CERCA_Y);
};

// ¿se puede usar ahora? devuelve el motivo si no
function motivoNo(scene, poder) {
    const g = scene.mascotaGesi;
    if (!g || g.isDead || noche.amanecio || scene.esFantasma || juicioActivo()) return 'ahora no';
    if (Date.now() < (noche.espera[poder.id] || 0)) return 'esperando';
    if (noche.canal) return 'ocupado';
    const suelo = g.body.blocked.down || g.body.touching.down;
    if (poder.id === 'trampa') {
        if (!suelo) return 'párate en el suelo';
        if (Math.abs(g.body.bottom - M.altar.pie) < 4 && Math.abs(g.body.center.x - M.altar.x) < CLARO_LIBRE) return 'junto al altar no';
        if (antorchaCerca(scene, false) >= 0) return 'muy cerca de una antorcha';
    }
    if ((poder.id === 'empujon' || poder.id === 'atacar') && !alcanzable(scene)) return 'nadie cerca';
    if (poder.id === 'apagar' && (!suelo || antorchaCerca(scene, true) < 0)) return 'ponte junto a una encendida';
    return null;
}

function usarPoder(poder) {
    const scene = escenaNoche();
    if (!scene || !noche || !soyTroll() || !poder) return;
    const no = motivoNo(scene, poder);
    if (no) {
        if (no !== 'esperando' && no !== 'ocupado') api.mensaje(scene, no.toUpperCase(), 900);
        return;
    }
    const g = scene.mascotaGesi;
    if (poder.canal) {
        noche.canal = { poder, desde: scene.time.now, x: g.x, i: antorchaCerca(scene, true) };
        return;
    }
    hacerPoder(scene, poder);
}

function hacerPoder(scene, poder, canal) {
    const g = scene.mascotaGesi;
    noche.espera[poder.id] = Date.now() + poder.espera;
    if (poder.id === 'trampa') {
        const t = { id: idNuevo(), x: Math.round(g.body.center.x), pie: Math.round(g.body.bottom) };
        enviarEvento('nocheTrampa', { ...t, anonimo: true });
        agregarTrampa(t);
        api.mensaje(scene, '🕳️ TRAMPA LISTA', 800);
    } else if (poder.id === 'apagon') {
        enviarEvento('nocheApagon', { anonimo: true });
        apagon();
    } else if (poder.id === 'empujon') {
        const v = alcanzable(scene);
        const dir = v && v.x < g.x ? -1 : 1;
        if (v?.bot) {
            // (a los bots los mueve el anfitrión; anónimo, como las trampas)
            if (esAnfitrion()) empujarBot(v.id, dir, scene.time.now);
            else enviarEvento('nocheEmpujeBot', { id: v.id, dir, anonimo: true });
        } else if (v) enviarEvento('nocheEmpuje', { para: v.id, dir });
    } else if (poder.id === 'atacar') {
        atacar(scene);
    } else if (poder.id === 'apagar' && canal?.i >= 0) {
        if (esAnfitrion()) apagarAntorcha(canal.i);
        else enviarEvento('nocheApagar', { i: canal.i, anonimo: true });
    }
}

// cada fotograma (troll): lo que se prepara quieto y la barra
function actualizarTroll(scene, time) {
    const g = scene.mascotaGesi;
    const c = noche.canal;
    scene.nocheCanal ||= scene.add.graphics().setDepth(46);
    scene.nocheCanal.clear();
    if (c) {
        if (!g || g.isDead || Math.abs(g.x - c.x) > 6) {
            noche.canal = null;
            api.mensaje(scene, '¡TE MOVISTE!', 700);
        } else {
            const p = (time - c.desde) / c.poder.canal;
            const y = g.body.top - 18;
            scene.nocheCanal.lineStyle(4, 0x000000, 0.5).strokeCircle(g.x, y, 10);
            scene.nocheCanal.lineStyle(4, 0xff4d5e, 1).beginPath().arc(g.x, y, 10, -Math.PI / 2, -Math.PI / 2 + Math.min(1, p) * Math.PI * 2).strokePath();
            if (p >= 1) { noche.canal = null; hacerPoder(scene, c.poder, c); }
        }
    }
    if (time - (barraTroll?.pintada || 0) > 120) pintarBarraTroll(scene);
}

let barraTroll = null, teclasTroll = null;
function crearBarraTroll() {
    quitarBarraTroll();
    barraTroll = document.createElement('div');
    barraTroll.className = 'noche-troll';
    barraTroll.setAttribute('aria-label', 'Poderes del troll');
    barraTroll.innerHTML = PODERES.map(p => `<button type="button" data-poder="${p.id}" aria-label="${p.nombre} (tecla ${p.tecla})">
        <span aria-hidden="true">${p.icono}</span><small>${p.tecla}</small><i aria-hidden="true"></i></button>`).join('');
    barraTroll.addEventListener('pointerdown', e => {
        const b = e.target.closest('[data-poder]');
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        usarPoder(PODERES.find(p => p.id === b.dataset.poder));
    });
    document.getElementById('game').append(barraTroll);
    teclasTroll = e => {
        if (e.repeat || e.target.closest?.('input, textarea, select')) return;
        const p = PODERES.find(x => x.tecla === e.key);
        if (p) usarPoder(p);
    };
    document.addEventListener('keydown', teclasTroll);
}
function pintarBarraTroll(scene) {
    if (!barraTroll) return;
    barraTroll.pintada = scene.time.now;
    const ahora = Date.now();
    PODERES.forEach(p => {
        const b = barraTroll.querySelector(`[data-poder="${p.id}"]`);
        const falta = Math.max(0, (noche.espera[p.id] || 0) - ahora);
        b.style.setProperty('--espera', String(falta / p.espera));
        b.querySelector('i').textContent = falta ? Math.ceil(falta / 1000) : '';
        const no = motivoNo(scene, p);
        b.classList.toggle('listo', !no);
        b.title = `${p.nombre}${no && no !== 'esperando' ? ` · ${no}` : ''}`;
    });
}
function quitarBarraTroll() {
    barraTroll?.remove();
    barraTroll = null;
    if (teclasTroll) document.removeEventListener('keydown', teclasTroll);
    teclasTroll = null;
}

// ---------- encargos ----------
function crearEncargos(scene) {
    // (lo que todos ven de los encargos lo dibuja el mapa: M.decorar)
    // lo mío: las cosas de la misión actual y su "!"
    marcarMision(scene);
    scene.nocheEncargoAnillo = scene.add.graphics().setDepth(46);
    noche.encargoQuieto = null;
}
// la misión que toca (de a una, en orden); null: ya están todas
const misionActual = () => noche.encargos.find(e => !e.hecho) || null;
// qué paso de la misión va (el agua: 0 buscarla, 1 llevarla)
const pasoDe = e => (e.tipo === 'llevar' && e.lleva ? 1 : 0);

// dibuja lo de la misión actual (las cosas que hay que tomar y el "!") y borra lo de la anterior
function marcarMision(scene) {
    noche.encargos.forEach(e => { e.marca?.destroy(); e.marca = null; (e.dibujos || []).forEach(d => d.destroy()); e.dibujos = []; });
    const e = misionActual();
    if (!e) return;
    if (e.tipo === 'recoger') {
        e.puntos.forEach(([x, y], k) => {
            if (e.tomados.includes(k)) return;
            const d = scene.add.text(x, y, e.icono, { fontSize: '16px' }).setOrigin(0.5).setDepth(34);
            scene.tweens.add({ targets: d, y: y - 6, yoyo: true, repeat: -1, duration: 700 + k * 90, ease: 'Sine.inOut' });
            d.k = k;
            e.dibujos.push(d);
        });
    }
    const [mx, my] = marcaDe(e);
    const m = scene.add.text(mx, my, '!', {
        fontFamily: LETRA, fontSize: '14px', color: '#ffe066', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5, 1).setDepth(42);
    scene.tweens.add({ targets: m, y: my - 8, yoyo: true, repeat: -1, duration: 500 });
    e.marca = m;
}

// dónde va el "!" de un encargo (el agua: primero la cascada, después la flor)
function marcaDe(e) {
    if (e.tipo === 'recoger') return [e.puntos[1][0], e.puntos[1][1] - 34];
    if (e.tipo === 'llevar') { const p = e.lleva ? e.hasta : e.desde; return [p.x, p.pie - 40]; }
    return [e.x, e.pie - 60];
}

function actualizarEncargos(scene, time) {
    const g = scene.mascotaGesi;
    scene.nocheEncargoAnillo?.clear();
    if (!g || g.isDead || noche.ganador) return;
    const b = g.body;
    const cerca = (x, pie, dx = 40, dy = 30) => Math.abs(b.center.x - x) < dx && Math.abs(b.bottom - pie) < dy;
    let quieto = null;
    // solo la misión actual (las demás esperan su turno)
    [misionActual()].filter(Boolean).forEach(e => {
        if (e.tipo === 'recoger') {
            e.dibujos.forEach(d => {
                if (!d.active || Math.abs(b.center.x - d.x) > TOMAR || Math.abs(b.center.y - d.y) > TOMAR + 20) return;
                e.tomados.push(d.k);
                d.destroy();
                scene.sound.play('moneda', { volume: 0.4 });
                if (e.tomados.length >= e.puntos.length) cumplir(scene, e);
                else pintarLista();
            });
        } else if (e.tipo === 'llevar') {
            const p = e.lleva ? e.hasta : e.desde;
            if (!cerca(p.x, p.pie)) return;
            if (!e.lleva) {
                e.lleva = true;
                api.mensaje(scene, '💧 ¡TIENES EL AGUA!\nLlévala a la flor del claro', 1600);
                scene.sound.play('moneda', { volume: 0.5 });
                const [mx, my] = marcaDe(e);
                e.marca?.setPosition(mx, my);
                pintarLista();
            } else cumplir(scene, e);
        } else if (e.tipo === 'quieto' && cerca(e.x, e.pie) && Math.abs(b.velocity.x) < 5) quieto = e;
    });
    // quieto junto al encargo: un anillo dorado se llena
    const q = noche.encargoQuieto;
    if (!quieto) { noche.encargoQuieto = null; return; }
    if (q?.e !== quieto) { noche.encargoQuieto = { e: quieto, desde: time }; return; }
    const p = (time - q.desde) / quieto.ms;
    const y = b.top - 18;
    scene.nocheEncargoAnillo.lineStyle(4, 0x000000, 0.5).strokeCircle(b.center.x, y, 10);
    scene.nocheEncargoAnillo.lineStyle(4, 0xffe066, 1).beginPath().arc(b.center.x, y, 10, -Math.PI / 2, -Math.PI / 2 + Math.min(1, p) * Math.PI * 2).strokePath();
    if (p >= 1) { noche.encargoQuieto = null; cumplir(scene, quieto); }
}

// encargo cumplido: suma a la luz del alba (el troll solo finge: no suma ni se ve)
function cumplir(scene, e) {
    e.hecho = true;
    scene.sound.play('punto_control', { volume: 0.4 });
    // la siguiente misión (o, si eran todas, las antorchas)
    const sig = misionActual();
    api.mensaje(scene, sig ? `✔ ¡MISIÓN CUMPLIDA!\nSiguiente: ${sig.icono} ${sig.texto}` : '✔ ¡MISIONES LISTAS!\nAhora: ayuda con las antorchas 🔥', 2200);
    marcarMision(scene);
    pintarLista();
    if (soyTroll()) return;
    if (e.visible) { enviarEvento('nocheVisible', { id: e.id, anonimo: true }); encargoVisible(e.id); }
    enviarEvento('nocheLuz', { anonimo: true });
    sumarLuz();
}

function sumarLuz() {
    noche.luz++;
    pintarHud();
    if (noche.luz >= noche.luzMeta) amanecer(null);
}

// un encargo 'visible' se cumplió (la campana suena, la flor se abre…): lo ven todos (prueba de que
// quien estaba ahí es héroe). Lo que pasa lo dice el mapa (M.visible)
function encargoVisible(id) {
    noche.visibles.add(id);
    const scene = escenaNoche();
    const aviso = scene && M.visible(scene, id);
    if (aviso) api.mensaje(scene, aviso, 1300);
}

// lista de mis encargos (izquierda): ✔ los cumplidos; el troll ve que son de mentira
let lista = null;
function crearLista() {
    quitarLista();
    lista = document.createElement('div');
    lista.className = 'noche-lista';
    lista.setAttribute('aria-live', 'polite');
    document.getElementById('game').append(lista);
    pintarLista();
}
function pintarLista() {
    if (!lista || !noche) return;
    const actual = misionActual(), n = noche.encargos.indexOf(actual) + 1, total = noche.encargos.length;
    const titulo = soyTroll() ? '🎭 Misión de mentira' : noche.fantasma ? '👻 Misión' : '🎯 Misión';
    let html;
    if (actual) {
        const progreso = actual.tipo === 'recoger' ? ` <em>${actual.tomados.length}/${actual.puntos.length}</em>`
            : actual.tipo === 'llevar' ? ` <em>${pasoDe(actual) + 1}/2</em>` : '';
        html = `<b>${titulo} ${n} de ${total}</b>
            <p class="actual">${actual.icono} ${escapar(actual.texto)}${progreso}</p>
            <p class="paso">👉 ${escapar(actual.pasos?.[pasoDe(actual)] || actual.zona)}</p>`;
    } else {
        // misiones listas: lo que sigue es lo de todos
        const faltan = M.antorchas.filter((_a, i) => !noche.fuego[i].lit).map(a => a.id);
        html = `<b>✅ Misiones listas</b><p class="paso">👉 ${faltan.length
            ? `Ayuda a encender las antorchas 🔥 (faltan ${faltan.join(', ')}): quédate junto a una`
            : soyTroll() ? '¡Las 4 antorchas están encendidas! Que no lleguen al altar 👹' : '¡Las 4 antorchas están encendidas! Corre al altar 🌅 del claro'}</p>`;
    }
    html += noche.encargos.filter(e => e !== actual).map(e => `<p class="${e.hecho ? 'hecho' : 'bloq'}">${e.hecho ? '✔' : '🔒'} ${escapar(e.texto)}</p>`).join('');
    lista.innerHTML = html;
}
function quitarLista() {
    lista?.remove();
    lista = null;
}

// ---------- muerte, fantasmas y cuerpos ----------
// (game.js) acabo de morir en la noche. reaparecer(): vuelve a armar el nivel
export function nocheMuerte(scene, reaparecer) {
    if (!noche) return;
    const g = scene.mascotaGesi;
    if (soyTroll()) {
        // el troll no muere: vuelve al claro (sin cuerpo)
        api.mensaje(scene, '👹 Vuelves al claro…\n¿alguien te vio caer?', 1400);
        reaparecer(1600);
        return;
    }
    const datos = { x: Math.round(g.x), y: Math.round(Math.min(g.y, SUELO_Y - 40)), pj: scene.pj?.id };
    noche.fantasma = [datos.x, datos.y];
    enviarEvento('nocheMuerte', datos);
    muerte(red.tuId, datos);
    if (!noche.atrapado) api.mensaje(scene, '💀 MORISTE\nAhora eres un fantasma 👻', 1800);
    noche.atrapado = false;
    reaparecer(1900);
}

// alguien murió: queda su cuerpo (lo ven los vivos) y se cuenta
function muerte(id, m) {
    if (noche.muertos.has(id)) return;
    noche.muertos.add(id);
    if (id < 0) matarBot(id);
    const c = { id, x: Number(m.x) || 0, y: Number(m.y) || 0, pj: m.pj, hallado: false };
    noche.cuerpos.push(c);
    const scene = escenaNoche();
    if (scene) dibujarCuerpo(scene, c);
    revisarTroll();
}
// alguien se fue de la sala: cuenta como si no estuviera (un héroe menos)
function salioJugador(id) {
    if (noche.muertos.has(id)) return;
    noche.muertos.add(id);
    revisarTroll();
}

function dibujarCuerpo(scene, c) {
    if (c.dibujo) c.dibujo.destroy();
    const pj = PERSONAJES.find(p => p.id === c.pj) || PERSONAJES[0];
    const res = resDe(pj);
    const s = scene.add.sprite(c.x, c.y, `${pj.id}-idle`).setScale(1 / res).setDepth(32).setAngle(90).setTint(0x9a9aaa);
    s.setCrop(0, 57 * res, s.width, s.height - 50 * res);
    const marca = scene.add.text(c.x, c.y - 30, '💀', { fontSize: '14px' }).setOrigin(0.5, 1).setDepth(42);
    c.dibujo = scene.add.container(0, 0, [s, marca]).setDepth(32);
}

// un vivo pasa junto a un cuerpo que nadie encontró: se avisa a todos
// el cuerpo se queda donde cayó hasta que alguien lo REPORTA: junto a él aparece el botón "📢 REPORTAR"
// (o la tecla R) y eso llama al Juicio. Pasar al lado sin reportar no avisa a nadie (el troll también
// puede pasar de largo… o reportar su propia víctima para parecer inocente)
function revisarCuerpos(scene) {
    const g = scene.mascotaGesi;
    const c = !g || g.isDead || noche.ganador || juicioActivo() ? null
        : noche.cuerpos.find(c => !c.hallado && c.id !== red.tuId && Math.abs(g.x - c.x) < HALLAR && Math.abs(g.y - c.y) < HALLAR);
    noche.cuerpoCerca = c?.id ?? null;
    mostrarReportar(!!c);
}
function reportar() {
    const scene = escenaNoche();
    const id = noche?.cuerpoCerca;
    if (!scene || id == null || juicioActivo() || scene.esFantasma) return;
    const c = noche.cuerpos.find(c => c.id === id && !c.hallado);
    if (!c) return;
    noche.cuerpoCerca = null;
    mostrarReportar(false);
    enviarEvento('nocheHallazgo', { id: c.id });
    hallazgo(red.tuId, c.id);
    abrirJuicio('cuerpo', c.id);
}
let botonReportar = null, teclaReportar = null;
function mostrarReportar(si) {
    if (!si) { botonReportar?.setAttribute('hidden', ''); return; }
    if (!botonReportar) {
        botonReportar = document.createElement('button');
        botonReportar.type = 'button';
        botonReportar.className = 'noche-reportar';
        botonReportar.innerHTML = '<span aria-hidden="true">📢</span>REPORTAR<small>R</small>';
        botonReportar.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); reportar(); });
        document.getElementById('game').append(botonReportar);
        teclaReportar = e => {
            if (!e.repeat && e.key.toLowerCase() === 'r' && !e.target.closest?.('input, textarea, select') && !botonReportar?.hidden) reportar();
        };
        document.addEventListener('keydown', teclaReportar);
    }
    botonReportar.removeAttribute('hidden');
}
function quitarReportar() {
    botonReportar?.remove();
    botonReportar = null;
    if (teclaReportar) document.removeEventListener('keydown', teclaReportar);
    teclaReportar = null;
}
function hallazgo(quien, id) {
    const c = noche.cuerpos.find(c => c.id === id);
    if (!c || c.hallado) return;
    c.hallado = true;
    const scene = escenaNoche();
    if (!scene) return;
    api.mensaje(scene, `💀 ¡${(quien === red.tuId ? 'ENCONTRASTE' : `${nombreDe(quien).toUpperCase()} ENCONTRÓ`)} A ${nombreDe(id).toUpperCase()}!`, 2000);
    scene.sound.play('bump', { volume: 0.6 });
    scene.cameras.main.shake(200, 0.004);
}

// ---------- puertas mágicas (si el mapa tiene): quieto delante de una y apareces del otro lado ----------
function crearPuertas(scene) {
    scene.nochePuertaAnillo = scene.add.graphics().setDepth(46);
    noche.puerta = null;
    (M.puertas || []).forEach(p => [['a', p.a, p.textoA], ['b', p.b, p.textoB]].forEach(([, lado, texto]) => {
        if (scene.textures.exists('cr_door1')) scene.add.image(lado.x, lado.pie, 'cr_door1').setOrigin(0.5, 1).setDepth(3);
        const brillo = scene.add.image(lado.x, lado.pie - 30, 'brillo').setDepth(41).setScale(1.4).setTint(0x9f8cff).setAlpha(0.35).setBlendMode('ADD');
        scene.tweens.add({ targets: brillo, alpha: 0.15, yoyo: true, repeat: -1, duration: 900 });
        letrero(scene, lado.x, lado.pie - 70, `🚪 ${texto}`);
    }));
}
function revisarPuertas(scene, time) {
    const g = scene.mascotaGesi;
    scene.nochePuertaAnillo?.clear();
    if (!M.puertas?.length || !g || g.isDead || noche.ganador) { noche.puerta = null; return; }
    const b = g.body;
    let aqui = null;
    M.puertas.forEach(p => [['a', p.a, p.b], ['b', p.b, p.a]].forEach(([lado, de, a]) => {
        if (!aqui && Math.abs(b.center.x - de.x) < 24 && Math.abs(b.bottom - de.pie) < 14 && Math.abs(b.velocity.x) < 5) aqui = { p, lado, a };
    }));
    if (!aqui) { noche.puerta = null; return; }
    if (noche.puerta?.p !== aqui.p || noche.puerta.lado !== aqui.lado) { noche.puerta = { ...aqui, desde: time }; return; }
    const k = (time - noche.puerta.desde) / PUERTA_MS;
    const y = b.top - 18;
    scene.nochePuertaAnillo.lineStyle(4, 0x000000, 0.5).strokeCircle(b.center.x, y, 10);
    scene.nochePuertaAnillo.lineStyle(4, 0x9f8cff, 1).beginPath().arc(b.center.x, y, 10, -Math.PI / 2, -Math.PI / 2 + Math.min(1, k) * Math.PI * 2).strokePath();
    if (k < 1) return;
    // ¡al otro lado!
    noche.puerta = null;
    g.body.reset(aqui.a.x + 30, aqui.a.pie - 70);
    g.setVelocity(0, 0);
    scene.cameras.main.flash(250, 140, 120, 255);
    scene.sound.play('aparece', { volume: 0.5 });
}

// ---------- el Juicio: la campana del claro, la pausa y lo que pasa después ----------
function crearCampanaJuicio(scene) {
    const c = M.campanaJuicio;
    scene.add.rectangle(c.x, c.pie, 6, 70, 0x4a3420).setOrigin(0.5, 1).setDepth(6);
    scene.add.rectangle(c.x, c.pie - 70, 34, 5, 0x4a3420).setOrigin(0.5, 0.5).setDepth(6);
    scene.nocheCampanaJuicio = scene.add.text(c.x, c.pie - 66, '🛎️', { fontSize: '20px' }).setOrigin(0.5, 0).setDepth(7);
    letrero(scene, c.x, c.pie - 96, noche.campanaUsada ? 'CAMPANA DEL JUICIO (usada)' : 'CAMPANA DEL JUICIO');
    scene.nocheCampanaAnillo = scene.add.graphics().setDepth(46);
    noche.campanaDesde = null;
}

// quieto junto a la campana: se llena un anillo y se llama al Juicio (una vez cada uno)
function revisarCampana(scene, time) {
    const g = scene.mascotaGesi, c = M.campanaJuicio;
    scene.nocheCampanaAnillo?.clear();
    const listo = !noche.campanaUsada && !noche.ganador && Date.now() - noche.finJuicio > JUICIO_PAUSA_MS;
    const cerca = g && !g.isDead && Math.abs(g.body.center.x - c.x) < 34 && Math.abs(g.body.bottom - c.pie) < 12 && Math.abs(g.body.velocity.x) < 5;
    if (!listo || !cerca) { noche.campanaDesde = null; return; }
    noche.campanaDesde ??= time;
    const p = (time - noche.campanaDesde) / c.ms;
    const y = g.body.top - 18;
    scene.nocheCampanaAnillo.lineStyle(4, 0x000000, 0.5).strokeCircle(g.body.center.x, y, 10);
    scene.nocheCampanaAnillo.lineStyle(4, 0x9fd8ff, 1).beginPath().arc(g.body.center.x, y, 10, -Math.PI / 2, -Math.PI / 2 + Math.min(1, p) * Math.PI * 2).strokePath();
    if (p < 1) return;
    noche.campanaUsada = true;
    noche.campanaDesde = null;
    abrirJuicio('campana');
}

// empieza el Juicio: todo se detiene (sin apagón, sin nada a medio preparar)
function pausarPorJuicio() {
    if (!noche) return;
    mostrarReportar(false);
    const sc = escenaNoche();
    if (sc) sc.luzOscurecer = 0; // (el apagón termina con el Juicio)
    noche.pausaDesde = Date.now();
    noche.apagonHasta = 0;
    noche.canal = null;
    noche.encargoQuieto = null;
    const scene = escenaNoche();
    if (!scene) return;
    scene.physics.pause();
    scene.sound.play('punto_control', { volume: 0.8, rate: 0.7 });
}

// termina el Juicio: el expulsado sale, se revisa si alguien ganó y los vivos vuelven al claro
function despuesDelJuicio({ fuera: id, era }) {
    noche.finJuicio = Date.now();
    if (noche.pausaDesde) { noche.fin += Date.now() - noche.pausaDesde; noche.pausaDesde = 0; }
    const ahora = Date.now();
    PODERES.forEach(p => { noche.espera[p.id] = Math.max(noche.espera[p.id] || 0, ahora + TRAS_JUICIO_MS); });
    const scene = escenaNoche();
    // los cuerpos encontrados ya no están
    noche.cuerpos = noche.cuerpos.filter(c => { if (c.hallado) c.dibujo?.destroy(); return !c.hallado; });
    if (id != null && noche.jugadores.some(j => j.id === id) && !fuera(id)) {
        // (si no se sabe si era el troll, cuenta como héroe)
        if (era === true) noche.trollsFuera.add(id); else noche.muertos.add(id);
        noche.expulsados.add(id);
        if (id < 0) matarBot(id); // (un bot expulsado: se va sin cuerpo)
        if (id === red.tuId) noche.fantasma = [M.campanaJuicio.x + 80, M.campanaJuicio.pie - 90];
    }
    revisarTroll();
    if (esAnfitrion()) botsAlClaro();
    if (!scene) return;
    if (id === red.tuId) { scene.scene.restart(); return; } // (vuelve como fantasma)
    scene.physics.resume();
    // los vivos, de vuelta al claro (cada uno en su lugar)
    const g = scene.mascotaGesi;
    if (g && !g.isDead && !scene.esFantasma) {
        const i = Math.max(0, noche.jugadores.findIndex(j => j.id === red.tuId));
        g.body.reset(M.altar.x - 260 + i * 70, M.altar.pie - 90);
    }
}

// al aparecer: si morí, soy un fantasma (transparente, flota, nadie vivo me ve)
function prepararFantasma(scene) {
    scene.esFantasma = !!noche.fantasma;
    if (!scene.esFantasma) return;
    scene.mascotaGesi.setAlpha(0.45).setTint(0xb8d8ff);
}
function flotar(scene) {
    const g = scene.mascotaGesi;
    if (g && !g.isDead && scene.keys?.up.isDown) g.setVelocityY(-FLOTA);
}

// ---------- flechas hacia lo pendiente ----------
const FLECHAS_MS = 100;  // cada cuánto se recalculan
let flechas = null;
function crearFlechas() {
    quitarFlechas();
    flechas = document.createElement('div');
    flechas.className = 'noche-flechas';
    flechas.setAttribute('aria-hidden', 'true');
    document.getElementById('game').append(flechas);
    flechas.pintada = 0;
}
function quitarFlechas() {
    flechas?.remove();
    flechas = null;
}

// lo pendiente, con su lugar: mis encargos, las antorchas apagadas o (con todas) el altar
function objetivos() {
    const lista = [];
    [misionActual()].filter(Boolean).forEach(e => {
        let x, pie;
        if (e.tipo === 'recoger') {
            const k = e.puntos.findIndex((_p, i) => !e.tomados.includes(i));
            [x, pie] = e.puntos[k];
            pie += 30; // (la cosa flota sobre el piso)
        } else if (e.tipo === 'llevar') ({ x, pie } = e.lleva ? e.hasta : e.desde);
        else ({ x, pie } = e);
        lista.push({ id: `e-${e.id}`, x, pie, icono: e.icono, clase: 'encargo', texto: e.texto });
    });
    if (lista.length) return lista; // (primero la misión)
    if (noche.fuego.every(f => f.lit)) {
        if (!soyTroll() && !noche.fantasma) lista.push({ id: 'altar', x: M.altar.x, pie: M.altar.pie, icono: '🌅', clase: 'altar', texto: 'Altar del Amanecer' });
    } else if (!noche.fantasma) {
        M.antorchas.forEach((a, i) => {
            if (!noche.fuego[i].lit) lista.push({ id: `a-${a.id}`, x: a.x, pie: a.pie, icono: '🔥', letra: a.id, clase: 'antorcha', texto: `Antorcha ${a.id} · ${a.nombre}${a.dos ? ' (de a dos)' : ''}` });
        });
    }
    return lista;
}

const AVISO_TRAMO = { ascensor: '🛗 ascensor', puerta: '🚪 puerta', sube: '⬆ sube', baja: '⬇ baja' };
// márgenes dentro del juego: arriba el contador, abajo la marca del rol, a la izquierda la lista
const MARGEN = { arriba: 76, abajo: 58, izq: 34, der: 34 };
const SEPARA = 34; // dos flechas no quedan más cerca que esto
function pintarFlechas(scene, time) {
    if (!flechas || time - flechas.pintada < FLECHAS_MS) return;
    flechas.pintada = time;
    const g = scene.mascotaGesi, cam = scene.cameras.main, canvas = scene.game.canvas;
    if (!g || !canvas || noche.ganador || juicioActivo()) { flechas.innerHTML = ''; flechas.ultimo = ''; return; }
    const cr = canvas.getBoundingClientRect(), gr = flechas.parentElement.getBoundingClientRect();
    const wv = cam.worldView;
    if (!cr.width || !wv.width) return;
    // el rectángulo donde van las flechas (px dentro del juego) y su centro
    const caja = { x0: cr.left - gr.left + MARGEN.izq, x1: cr.right - gr.left - MARGEN.der, y0: cr.top - gr.top + MARGEN.arriba, y1: cr.bottom - gr.top - MARGEN.abajo };
    // la lista de encargos (una flecha que caería encima se corre a su lado)
    const lr = lista?.getBoundingClientRect();
    const tapa = lr && { x0: lr.left - gr.left - 18, x1: lr.right - gr.left + 18, y0: lr.top - gr.top - 18, y1: lr.bottom - gr.top + 18 };
    const enPantalla = (x, y) => [cr.left - gr.left + (x - wv.x) / wv.width * cr.width, cr.top - gr.top + (y - wv.y) / wv.height * cr.height];
    const px = g.body.center.x, pie = g.body.bottom;
    // las flechas salen desde el personaje (la cámara no siempre lo tiene en el centro)
    const [cx, cy] = enPantalla(px, g.body.center.y).map((v, i) => Phaser.Math.Clamp(v, i ? caja.y0 + 1 : caja.x0 + 1, i ? caja.y1 - 1 : caja.x1 - 1));
    // mis encargos y las 2 antorchas apagadas más cercanas (más, ya es un lío)
    const todos = objetivos().map(o => ({ ...o, d: Math.hypot(o.x - px, o.pie - pie) })).sort((a, b) => a.d - b.d);
    let antorchas = 0;
    const pendientes = todos.filter(o => o.clase !== 'antorcha' || ++antorchas <= 2);
    let principal = null;
    pendientes.forEach(o => { o.d = Math.hypot(o.x - px, o.pie - pie); if (!principal || o.d < principal.d) principal = o; });
    const puestas = [], html = [], avisos = new Set();
    pendientes.sort((a, b) => a.d - b.d).forEach(o => {
        // cada flecha sigue el camino (el fantasma flota: va derecho)
        let tx = o.x, ty = o.pie - 40, aviso = '';
        const paso = scene.esFantasma ? null : guia(px, pie, o.x, o.pie);
        if (paso) {
            tx = paso.x; ty = paso.pie - 40;
            if (paso.tipo === 'ascensor' || paso.tipo === 'puerta') aviso = AVISO_TRAMO[paso.tipo];
            else if (paso.pie < pie - 20 && (paso.tipo === 'salta' || paso.tipo === 'escalera')) aviso = AVISO_TRAMO.sube;
            else if (paso.pie > pie + 20 && (paso.tipo === 'escalera' || paso.tipo === 'caer')) aviso = AVISO_TRAMO.baja;
        }
        const visible = ([x, y]) => x > caja.x0 && x < caja.x1 && y > caja.y0 && y < caja.y1;
        const [sx, sy] = enPantalla(tx, ty);
        // el objetivo a la vista: no hace falta flecha (salvo la principal sobre el ascensor o la subida)
        const sobreElPaso = o === principal && aviso && visible([sx, sy]);
        if (visible(enPantalla(o.x, o.pie - 40)) && !sobreElPaso) return;
        // si no, en el borde, hacia donde sigue el camino (o sobre el paso, si es la principal y se ve)
        let fx = sx, fy = sy;
        const dentro = sobreElPaso;
        if (!dentro) {
            // donde el rayo del personaje hacia el camino toca el borde
            const dx = sx - cx || 1e-6, dy = sy - cy || 1e-6;
            const k = Math.min((dx > 0 ? caja.x1 - cx : caja.x0 - cx) / dx, (dy > 0 ? caja.y1 - cy : caja.y0 - cy) / dy);
            fx = cx + dx * k; fy = cy + dy * k;
        }
        let corrida = false;
        if (tapa && fx > tapa.x0 && fx < tapa.x1 && fy > tapa.y0 && fy < tapa.y1) { fx = tapa.x1; corrida = true; }
        // que no se encimen: se corre a lo largo del borde (o de la lista), a un lado y al otro
        const enLado = corrida || (!dentro && (Math.abs(fx - caja.x0) < 2 || Math.abs(fx - caja.x1) < 2));
        const libre = (x, y) => !puestas.some(([qx, qy]) => Math.hypot(qx - x, qy - y) < SEPARA);
        if (!libre(fx, fy)) {
            for (let n = 1; n < 12; n++) {
                const d = Math.ceil(n / 2) * SEPARA * (n % 2 ? 1 : -1);
                const nx = enLado ? fx : Phaser.Math.Clamp(fx + d, caja.x0, caja.x1), ny = enLado ? Phaser.Math.Clamp(fy + d, caja.y0, caja.y1) : fy;
                if (libre(nx, ny)) { fx = nx; fy = ny; break; }
            }
        }
        puestas.push([fx, fy]);
        const angulo = dentro ? 90 : Math.atan2(sy - cy, sx - cx) * 180 / Math.PI;
        const lado = fx > caja.x1 - 60 ? ' der' : fx < caja.x0 + 60 ? ' izq' : '';
        // (cada aviso una sola vez: dos "ascensor" seguidos se enciman)
        if (aviso && avisos.has(aviso)) aviso = '';
        if (aviso) avisos.add(aviso);
        html.push(`<div class="noche-flecha ${o.clase}${o === principal ? ' principal' : ''}${lado}" style="left:${fx.toFixed(0)}px;top:${fy.toFixed(0)}px" title="${escapar(o.texto)}">
            <i style="transform:rotate(${angulo.toFixed(0)}deg)"></i><span>${o.icono}${o.letra ? `<b>${o.letra}</b>` : ''}</span>${aviso ? `<small>${aviso}</small>` : ''}</div>`);
    });
    const nuevo = html.join('');
    if (nuevo !== flechas.ultimo) { flechas.innerHTML = nuevo; flechas.ultimo = nuevo; }
}

// ---------- contador de antorchas (arriba al centro) ----------
let hud = null;
function crearHud() {
    quitarHud();
    hud = document.createElement('div');
    hud.className = 'noche-hud';
    hud.setAttribute('aria-live', 'polite');
    document.getElementById('game').append(hud);
}
// lo que queda de noche (se repinta solo cuando cambia el segundo)
function pintarTiempo() {
    const el = hud?.querySelector('.noche-tiempo');
    if (!el || !noche) return;
    const s = Math.max(0, Math.ceil((noche.fin - Date.now()) / 1000));
    if (el.dataset.s === String(s)) return;
    el.dataset.s = String(s);
    el.textContent = `🌙 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    el.classList.toggle('poco', s <= 60);
}
function pintarHud() {
    pintarLista(); // (con las misiones listas, la lista dice qué antorchas faltan)
    if (!hud || !noche) return;
    const n = noche.fuego.filter(f => f.lit).length;
    const luz = Math.min(1, noche.luz / noche.luzMeta);
    hud.innerHTML = `<span>🔥 ${n}/${M.antorchas.length}</span>` + M.antorchas.map((a, i) =>
        `<b class="${noche.fuego[i].lit ? 'lit' : ''}" title="${a.nombre}">${a.id}</b>`).join('') +
        `<span class="noche-luz" title="Luz del alba: ${noche.luz} de ${noche.luzMeta} encargos" role="img" aria-label="Luz del alba ${Math.round(luz * 100)}%">☀️<em><u style="width:${luz * 100}%"></u></em></span>` +
        '<span class="noche-tiempo" title="Lo que queda de noche"></span>';
    pintarTiempo();
}
function quitarHud() {
    hud?.remove();
    hud = null;
}

// ---------- revelación: "Eres HÉROE" / "Eres el TROLL" ----------
let capa = null, temporizador = null;
function mostrarRevelacion() {
    cerrarRevelacion();
    const troll = soyTroll();
    const cuantos = noche.jugadores.length;
    const trolls = cuantos >= 7 ? 2 : 1;
    const compas = noche.compas.map(nombreDe);
    capa = document.createElement('div');
    capa.className = `noche-revela ${troll ? 'troll' : 'heroe'}`;
    capa.setAttribute('role', 'dialog');
    capa.setAttribute('aria-modal', 'true');
    capa.setAttribute('aria-labelledby', 'noche-revela-rol');
    capa.innerHTML = `
        <p class="noche-revela-mapa">🗺️ ${escapar(M.nombre)}</p>
        <p class="noche-revela-eres">Eres…</p>
        <h2 id="noche-revela-rol" class="noche-revela-rol">${troll ? '👹 EL TROLL' : '☀️ HÉROE'}</h2>
        <p class="noche-revela-mision">${troll
            ? 'Pon trampas sin que te vean y finge ser un héroe. Que no te descubran en el Juicio.'
            : `Enciende las Antorchas del Sol y llega al amanecer. ${trolls > 1 ? 'Hay 2 trolls' : 'Hay 1 troll'} entre ustedes.`}</p>
        ${troll && compas.length ? `<p class="noche-revela-compas">Tu compañero troll: <b>${compas.map(escapar).join(', ')}</b></p>` : ''}
        <ul class="noche-revela-grupo">${noche.jugadores.map(j => tarjeta(j, troll)).join('')}</ul>
        <p class="noche-revela-nota">Toca para empezar</p>`;
    document.getElementById('game').append(capa);
    capa.addEventListener('click', cerrarRevelacion);
    capa.addEventListener('keydown', e => { e.stopPropagation(); cerrarRevelacion(); });
    capa.tabIndex = -1;
    capa.focus();
    temporizador = setTimeout(cerrarRevelacion, REVELACION_MS);
}
// cada jugador de la noche: su color, su nombre, 🤖 si es bot; un troll ve en rojo a sus compañeros
function tarjeta(j, troll) {
    const pj = PERSONAJES.find(p => p.id === j.pj) || PERSONAJES[0];
    const color = '#' + pj.color.toString(16).padStart(6, '0');
    const yo = j.id === red.tuId;
    const marca = yo ? (troll ? ' troll' : '') : esCompaTroll(j.id) ? ' troll' : '';
    return `<li class="noche-revela-pj${yo ? ' yo' : ''}${marca}" style="--c:${color}">
        <span aria-hidden="true">${j.bot ? '🤖' : yo || esCompaTroll(j.id) ? (troll ? '👹' : '☀️') : '❔'}</span>
        <b>${escapar(yo ? 'Tú' : j.nombre)}</b></li>`;
}
function cerrarRevelacion() {
    clearTimeout(temporizador);
    temporizador = null;
    if (capa && noche) {
        // al cerrar la revelación: qué hay que hacer (el cartel de siempre quedaría tapado por ella)
        const scene = escenaNoche();
        if (scene) api.mensaje(scene, soyTroll() ? 'QUE NO TE DESCUBRAN 👹\nFinge tu misión (arriba a la izquierda)' : 'SIGUE TU MISIÓN 🎯\n(arriba a la izquierda y la flecha)', 2600);
    }
    capa?.remove();
    capa = null;
}

// ---------- marca del rol (solo la ves tú) ----------
let marca = null;
function mostrarMarca() {
    quitarMarca();
    marca = document.createElement('div');
    marca.className = `noche-marca ${soyTroll() ? 'troll' : noche.fantasma ? 'fantasma' : 'heroe'}`;
    marca.textContent = soyTroll() ? '👹 Troll' : noche.fantasma ? '👻 Fantasma' : '☀️ Héroe';
    marca.title = 'Tu rol (solo lo ves tú)';
    document.getElementById('game').append(marca);
}
function quitarMarca() {
    marca?.remove();
    marca = null;
}

// ---------- final: quién era el troll, cómo quedó cada uno, premios y otra noche ----------
let capaFin = null;
function mostrarFin() {
    if (!noche?.ganador) return;
    cerrarFin();
    const ganador = noche.ganador, troll = soyTroll();
    const gane = (ganador === 'troll') === troll;
    const premio = darPremio(gane);
    // quiénes eran los trolls: lo dice el servidor; si no llegó, solo lo que sé (yo y mis compañeros)
    const reales = noche.trollsReales ? new Set(noche.trollsReales)
        : troll ? new Set([red.tuId, ...noche.compas]) : null;
    const filas = noche.jugadores.map(j => {
        const esTroll = reales ? reales.has(j.id) : j.id === red.tuId ? false : null;
        const rol = esTroll === true ? '👹 Troll' : esTroll === false ? (j.bot ? '🤖 Héroe' : '☀️ Héroe') : '❔';
        const estado = noche.expulsados.has(j.id) ? '⚖️ expulsado' : noche.muertos.has(j.id) ? '💀 cayó' : '🙂 vivo';
        return `<li class="${esTroll ? 'troll' : ''} ${j.id === red.tuId ? 'yo' : ''}" style="--c:${colorDe(j.id)}">
            <b>${escapar(j.id === red.tuId ? 'Tú' : j.nombre)}</b><span>${rol}</span><small>${estado}</small></li>`;
    }).join('');
    const nombresTroll = reales ? noche.jugadores.filter(j => reales.has(j.id)).map(j => (j.id === red.tuId ? 'tú' : j.nombre)) : [];
    const anfitrion = esAnfitrion();
    capaFin = document.createElement('div');
    capaFin.className = 'menu-capa';
    capaFin.innerHTML = `
        <div class="menu-panel arena-fin noche-fin ${gane ? 'gano' : ''}" role="dialog" aria-modal="true" aria-labelledby="noche-fin-titulo">
            <h2 id="noche-fin-titulo">${ganador === 'troll' ? '👹 ¡LA NOCHE ES ETERNA!' : '🌅 ¡AMANECIÓ!'}</h2>
            <p class="carrera-fin-tiempo">${escapar(noche.textoFin)} <b>${gane ? '¡Ganaste!' : 'Perdiste…'}</b></p>
            ${nombresTroll.length ? `<p class="noche-fin-troll">${nombresTroll.length > 1 ? 'Los trolls eran' : nombresTroll[0] === 'tú' ? 'El troll eras' : 'El troll era'} <b>${escapar(nombresTroll.join(' y '))}</b></p>` : ''}
            <ul class="noche-fin-lista">${filas}</ul>
            <p class="carrera-premio">◉ +${premio.monedas}${premio.detalle ? ` <small>(${escapar(premio.detalle)})</small>` : ''} · +${premio.xp} XP</p>
            <div class="noche-fin-botones">
                ${anfitrion ? '<button type="button" class="menu-boton sala-empezar" data-fin="otra">↻ Otra noche</button><button type="button" class="menu-boton" data-fin="sala">☰ Sala</button>'
                    : '<p class="menu-nota">Esperando al anfitrión…</p>'}
                <button type="button" class="menu-boton menu-salir" data-fin="salir">✕ Salir</button>
            </div>
        </div>`;
    document.getElementById('game').append(capaFin);
    capaFin.addEventListener('click', e => {
        const accion = e.target.closest('[data-fin]')?.dataset.fin;
        if (!accion) return;
        if (accion === 'otra') { api.revancha(); return; } // (la sala manda 'empezar' a todos: roles nuevos)
        cerrarFin();
        if (accion === 'sala') api.volverASala();
        else api.salir();
    });
    capaFin.addEventListener('keydown', e => e.stopPropagation());
    capaFin.querySelector('[data-fin]')?.focus();
}

// monedas y XP (una sola vez por noche)
function darPremio(gane) {
    if (noche.premiado) return noche.premiado;
    const encargos = soyTroll() ? 0 : noche.encargos.filter(e => e.hecho).length;
    const caidos = soyTroll() && gane ? [...noche.muertos].filter(id => !noche.expulsados.has(id)).length : 0;
    const monedas = (gane ? PREMIO.gana : PREMIO.pierde) + encargos * PREMIO.encargo + caidos * PREMIO.caido;
    const detalle = [encargos ? `${encargos} encargo${encargos > 1 ? 's' : ''}` : '', caidos ? `${caidos} héroe${caidos > 1 ? 's' : ''} cayeron` : ''].filter(Boolean).join(', ');
    const xp = gane ? XP.nocheGana : XP.nochePierde;
    api.premio(monedas);
    ganarXP(xp, escenaNoche()?.pj?.id, { victoria: gane });
    noche.premiado = { monedas, xp, detalle };
    return noche.premiado;
}
function cerrarFin() {
    capaFin?.remove();
    capaFin = null;
}

const nombreDe = id => noche?.jugadores.find(j => j.id === id)?.nombre || 'Alguien';
const escapar = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
