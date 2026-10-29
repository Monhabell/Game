import { createAnimations } from "./animations.js"
import { monedas } from "./monedas.js"
import { NIVELES, SUELO_Y, nivelPorIndice, esInfinito, TOTAL_NIVELES } from "./niveles.js"
import { PERSONAJES, MANA_MAXIMO, cargarPersonajes, crearAnimacionesPersonajes, resDe } from "./personajes.js"
import { ENEMIGOS, cargarEnemigos, crearAnimacionesEnemigos, enemigosDelNivel } from "./enemigos.js"
import { crearAmbiente, crearFondoAtmosferico, actualizarAmbiente, crearNieblaSeleccion, moverNieblaSeleccion } from "./ambiente.js"
import { cargarCastillos, crearCastilloMeta } from "./castillos.js"
import {
    cargarMazmorra, crearAnimacionesMazmorra, vestirSuelo, vestirMuro, vestirTecho, crearLava, moverLava,
    decorarNivel, crearEstatua, encenderEstatua, crearAntorcha, crearMuroGotero, sueloDeTema
} from "./mazmorra.js"
import { iniciarTactil, esTactil } from "./tactil.js"
import { iniciarMenus } from "./menu.js"
import { nivelEnEquipo } from "./equipo.js"
import { iniciarVoz } from "./voz.js"
import { crearMecanismos, actualizarMecanismos } from "./mecanismos.js"
import { crearCadena, actualizarCadena, sostenerEnCadena } from "./cadena.js"
import { iniciarSala, pistaParaRevancha, arenaParaRevancha } from "./sala.js"
import { revisarHitos, mostrarHitos, tituloActual, proximoHito } from "./hitos.js"
import { ganarXP, XP, progresoJugador, maestria, tituloHeroe, factorRecarga, tieneRunaMaestria, MAESTRIA_MAX, textoNivel } from "./progreso.js"
import { recortarVista, vigilarFijos, fijosEnPantalla, crearContadorFps, actualizarContadorFps, cuidarRendimiento } from "./rendimiento.js"
import { red, enLinea, enCarrera, enNoche, mundoCompartido, salirSala, alRecibir, empezarPartida, volverASala, enviarEvento } from "./red.js"
import {
    iniciarCarrera, carreraActiva, empezarCarrera, terminarCarrera, esModoCarrera, prepararCarrera, actualizarCarrera,
    llegarMetaCarrera, recibirPoderCarrera, tomeMonedaCarrera,
} from "./carrera.js"
import { iniciarAbismo, crearFondoAbismo, crearAbismo, actualizarAbismo } from "./abismo.js"
import { armarPista, pistaDe } from "./pistas.js"
import {
    iniciarArena, usarJuego, arenaActiva, empezarArena, terminarArena, esModoArena, nivelArena, prepararArena,
    actualizarArena, arenaMuerte, golpearRival, idNivelArena, PODERES_ORBE,
} from "./arena.js"
import { iniciarNoche, empezarNoche, terminarNoche, esModoNoche, prepararNoche, actualizarNoche, nocheActiva, nocheMuerte, nocheGolpe, inicioNoche, relojNoche, nivelDeNoche, NIVEL_NOCHE } from "./troll.js"
import { precargarCriptas } from "./criptas_troll.js"
import { decorarAfueras } from "./afueras.js"
import { configurarCatacumbas, crearCatacumbas, actualizarCatacumbas } from "./catacumbas.js"
import { crearLuz, actualizarLuz } from "./luz.js"
import { configurarMundos, abrirMapa, mapaAbierto, contarMoneda, reiniciarMonedasNivel, ganarEstrellas, textoEstrellas } from "./mundos.js"
import { configurarFalsas, crearFalsas, actualizarFalsas } from "./falsas.js"
import { configurarMisiones, crearMisiones, actualizarMisiones, golpeMisiones, reiniciarMisiones, misionesBloquean } from "./misiones.js"
import { configurarMinas, crearMinas, actualizarMinas, golpeMinas, reiniciarMinas, resultadosMinas, texturasMinas } from "./minas.js"
import {
    iniciarMultijugador, semillaEnLinea, prepararNivelEnLinea, actualizarEnLinea,
    avisarMuerte, avisarCheckpoint, avisarEnemigo, avisarJefe, avisarMeta, avisarPoder,
    soyReplica, soyAnfitrion, hacerReplica, avisarGolpeEnemigo, avisarZona, avisarBala,
    fantasmas, comoJugador, fantasmaMasCercano, avisarJefeFx
} from "./multijugador.js"
import { ajustes, BOTONES, CAMARAS, vidasMaximas, factorEnemigos, zoomCamara, RESOLUCION } from "./ajustes.js"
import { engañoDeRuna } from "./locuras.js"
import { crearRama, crearTabla, texturasBosque } from "./bosque.js"
import { animDe, prepararVariante, iniciarVestidor } from "./vestidor.js"
import {
    iniciarTienda, sumarMonedas, saldo, tiene, llevaEscudo, usarConsumible, registrarNivel, crearEstela, actualizarEstela, usarHeroeActual,
    personajeConMejoras, nivelMaximo, gastarMonedas,
} from "./tienda.js"
import {
    iniciarPoderes, cargarPoderes, crearPoderes, usarPoder, actualizarPoderes, equipados, premioDeNivel, estadoPoder, darOrbe,
} from "./poderes.js"
import { crearSorpresas, actualizarSorpresas, pisarMordedora, monedaTrampa, activarCebo } from "./sorpresas.js"
import { crearSenales, sombraDeCaida } from "./senales.js"
import { crearArteOriginal } from "./arte.js"
import { aleatorizarNivel, prepararNivelFijo, iniciarCorazonesAlAzar, iniciarEscudosAlAzar, soltarCorazon } from "./azar.js"
import {
    cargarJefes, trollDelNivel, crearAnimacionesJefes, prepararJefe, actualizarJefe, golpearJefeEnZona, jefeBloqueaMeta, dañarJefe, alterarJefe,
    datosJefe, recibirJefe, efectoJefe
} from "./jefes.js"
import { cargarSonidos, sonarCerca } from "./sonidos.js"
import { crearMapa, actualizarMapa } from "./mapa.js"
import { mostrarCarga, crearTitulo, crearIntro, crearFinal } from "./historia.js"
import {
    cargarEscudo, crearAnimacionesEscudo, crearEscudo, actualizarEscudo, estaInvulnerable, romperEscudo, recuperarEscudo, soltarEscudo
} from "./escudo.js"

// funciones que usa el jefe (jefes.js)
const apiJefe = {
    killgesi: (scene, daño, origenX) => killgesi(scene, undefined, daño, origenX),
    mostrarMensaje: (...a) => mostrarMensaje(...a),
    addToScore: (...a) => addToScore(...a),
    soltarEscudo: (...a) => soltarEscudo(...a),
    crearEnemigo: (scene, x, y, tipo) => crearEnemigo(scene, x, y, tipo), // (los ayudantes de algunos jefes)
};

// poderes especiales (poderes.js): lo que necesitan del juego
iniciarPoderes({
    dañar: (scene, e, daño, congela, empuje, p) => (e.rivalId != null ? golpearRival(scene, e, daño, congela, empuje, p) : dañarEnemigo(scene, e, daño, congela)),
    golpearJefe: (scene, zona, daño) => {
        if (scene.misionesNivel) golpeMisiones(scene, zona, 'poder'); // (niveles infinitos: muros agrietados…)
        if (scene.minas) golpeMinas(scene, zona, 'poder'); // (nivel 3: el muro agrietado solo se rompe con un poder)
        return golpearJefeEnZona(scene, zona, daño, apiJefe);
    },
    alterarJefe: (scene, tipo, ms) => alterarJefe(scene, tipo, ms),
    congelar: (scene, e, ms) => congelarEnemigo(scene, e, ms),
    // carrera: el poder de un rival me alcanzó (carrera.js decide el efecto)
    golpeCarrera: (scene, p, de, ox) => recibirPoderCarrera(scene, p, de, ox),
    habilidadBase: (scene, h) => ejecutarHabilidad(scene, h),
    recuperarEscudo: scene => recuperarEscudo(scene, texto => mostrarMensaje(scene, texto, 900)),
    curarVida: scene => {
        if (vidas >= VIDAS_INICIALES) return false;
        vidas++;
        actualizarCorazones(scene);
        mostrarMensaje(scene, '¡+1 CORAZÓN!', 900);
        return true;
    },
    // el héroe hace su gesto de ataque al lanzar un poder
    animarPoder: scene => {
        const nombre = scene.pj.hojas.atk1 ? 'atk1' : scene.pj.habilidades.espacio.anim;
        const anim = scene.anims.get(`${scene.pj.anim}-${nombre}`);
        if (!anim) return;
        scene.atacando = true;
        scene.mascotaGesi.anims.play(anim.key, true);
        scene.time.delayedCall(Math.min(420, anim.frames.length / anim.frameRate * 1000), () => { scene.atacando = false; });
    },
    mensaje: (scene, texto) => mostrarMensaje(scene, texto, 900),
});

// funciones que usan las trampas sorpresa (sorpresas.js)
const apiSorpresas = {
    killgesi: (scene) => killgesi(scene), crearEnemigo: (...a) => crearEnemigo(...a), mostrarMensaje: (...a) => mostrarMensaje(...a),
    derrumbarSuelo: (...a) => derrumbarSuelo(...a),
};

let score = 0; // Variable global para la puntuación
// vidas: según la dificultad (ajustes.js), más una si se compró el Corazón de Albora (tienda.js)
const vidasTotales = () => vidasMaximas() + (tiene('corazon') ? 1 : 0);
let VIDAS_INICIALES = vidasTotales(); // se relee en cada nivel
let runaNivel = -1; // nivel en que ya se usó la runa de reserva (una por nivel)
let vidas = VIDAS_INICIALES; // se muestran como corazones; al acabarse se vuelve al inicio del juego
let scoreInicioNivel = 0; // al morir el puntaje vuelve a este valor
const FLECHAS_INICIALES = 10;
const FLECHAS_RECOGIDAS = 5; // Gesi recoge flechas sola hasta tener esta cantidad
let flechas = FLECHAS_INICIALES;
let muertes = 0; // en toda la partida: se muestra en el HUD y en el final
const muertesNivel = {}; // nivel -> muertes en este nivel (para la pantalla de GAME OVER)
let personajeId = 'arquera'; // personaje elegido en la pantalla de selección
// volver a intentarlo: rápido, para que una trampa divertida no se vuelva agotadora
const REINTENTO_MS = 1100;   // al morir: se ve la caída y la burla, y se reaparece en el punto de control
const GAME_OVER_MS = 2200;   // sin vidas: un poco más (el mensaje explica qué se perdió)
const SALTAR_ESPERA_MS = 400; // desde aquí, cualquier tecla o toque reaparece al instante
// GAME OVER (sin corazones): se vuelve al INICIO del nivel. La pantalla dice cuántas veces moriste y
// se burla un poco; "Reintentar" (o cualquier tecla) vuelve a empezar al instante
const BURLAS_GAME_OVER = ['El Rey Troll se ríe de ti', 'El troll ya te conoce', 'Nada es lo que parece',
    '¿Seguro que viste la trampa?', 'Una más… solo una más', 'El bosque guarda tus huesos'];
const BURLAS = ['¡SORPRESA!', '¿NO LO VISTE VENIR?', '¡JA JA JA!', 'OTRA VEZ...', 'CASI...', '¡TROLLEADO!', 'NO CONFÍES EN NADA'];
let nivelActual = 0; // índice en NIVELES
let checkpointX = null; // último punto de control alcanzado en el nivel actual
let runaMaestriaNivel = -1; // nivel en que ya se usó la runa de maestría (progreso.js)
let vidaJefeGuardada = null; // { nivel, vida }: el daño hecho al jefe se mantiene si mueres con vidas
const SALUD_MAXIMA = 100; // barra de vida del jugador durante la pelea con el jefe
// carrera: antes se sumaban 2 px por fotograma (120 px/s a 60 Hz) + 100 px/s de velocidad
const VEL_CARRERA = 220; // px/s al correr (se multiplica por la velocidad del personaje)
const VEL_DERIVA = 100;  // px/s que conserva en el aire al soltar la flecha
// pinchos ocultos: asoman a esta distancia y salen del todo después de la espera
// (corriendo a 220 px/s quedan ~90 px para saltarlos)
// tiempo en que un empujón (escudo roto, golpe, mímico) no se puede anular con las flechas
const EMPUJON_MS = 250;
// cámara vertical (niveles con altura): dónde queda el personaje en la pantalla y qué tan rápido lo sigue
const CAMARA_ALTURA_PJ = 0.40; // fracción de la pantalla desde arriba
const CAMARA_SUAVIDAD_MS = 140; // más alto = sigue más lento
// cámara horizontal: el personaje queda a ~40 % del ancho y se ve más escenario hacia donde va
const CAMARA_POS_PJ = 0.37;        // fracción del ancho donde queda el personaje (yendo a la derecha)
const CAMARA_ZONA_MUERTA = 0.04;   // fracción del ancho que se mueve el personaje sin que la cámara lo siga
                                   // (corriendo queda entre ~35 % y ~45 %: 37 % + zona muerta + retraso)
const CAMARA_SIGUE_MS = 110;       // suavidad del seguimiento horizontal
const CAMARA_GIRO_MS = 650;        // al cambiar de dirección, la vista se reacomoda despacio (sin saltos)
const CAMARA_BANDA_Y = 40;         // px: al caer más que esto por debajo del último piso, la cámara baja
const CAMARA_MARGEN_ARRIBA = 0.15; // en el aire la cámara no sube, salvo que el personaje llegue a este borde
const CAMARA_BAJA = 0.10;          // fracción del alto visible que la cámara baja: se ve más suelo y menos cielo
const SUBSUELO = 420;              // px de tierra dibujada bajo el piso (lo que se ve al bajar la cámara)
// aparición al empezar un nivel: a ~30 % del ancho visible (no pegado al borde ni bajo los controles)
const INICIO_POS_PJ = 0.3;
const PAUSA_ASCENSOR = 1500; // ms que el ascensor espera en cada parada
// enemigos que caen del cielo (emboscadas, monedas trampa, rejas...): nunca amontonados
const SEPARACION_ENEMIGOS = 130; // px mínimos entre dos enemigos (se corre hasta encontrar sitio)
const PAUSA_APARICIONES = 600;   // ms entre dos enemigos que caen del cielo
const MAXIMO_CERCA = [3, 3, 4, 4, 5, 6]; // enemigos a la vez cerca del jugador (por nivel); los demás esperan
const CERCA_JUGADOR = 450;       // px: qué cuenta como "cerca"
const ESPERA_MAXIMA = 5000;      // ms: después de esto cae igual
const SEPARACION_NIVEL = 90;     // px mínimos entre los enemigos del armado del nivel
const AVISO_PINCHOS = 190;
const ESPERA_PINCHOS = 450;
// El juego mide 790x380 "por dentro" (física, niveles, HUD), pero se dibuja más grande
// (al doble en el PC: 1580x760) con la cámara en zoom: así se ve nítido aunque la pantalla sea grande.
// En el celular se dibuja a tamaño normal (mucho más rápido); se cambia en ⚙ → Gráficos.
const ZOOM = RESOLUCION;
const VISTA = { width: 790, height: 380 };

// los textos se dibujan con la misma resolución para que no se vean borrosos, y todos con la letra
// moderna del juego (Poppins, cargada en index.html): los estilos viejos se convierten aquí
const LETRA = '"Poppins", system-ui, sans-serif';
function estiloModerno(estilo = {}) {
    const e = { ...estilo };
    const familia = e.fontFamily || '';
    const pixelada = familia.includes('Press Start');
    if (!familia || pixelada || familia === 'monospace') e.fontFamily = LETRA;
    // la letra pixelada era muy ancha: Poppins necesita ~1,3 veces el tamaño para leerse igual
    if (pixelada && parseFloat(e.fontSize)) e.fontSize = `${Math.round(parseFloat(e.fontSize) * 1.3)}px`;
    if (!e.fontStyle) e.fontStyle = pixelada ? '600' : '500';
    // contorno negro grueso (estilo antiguo) -> contorno fino y una sombra suave
    if (e.strokeThickness) {
        e.strokeThickness = Math.min(e.strokeThickness, 2);
        e.stroke = 'rgba(0, 0, 0, 0.55)';
        e.shadow = { offsetX: 0, offsetY: 2, color: 'rgba(0, 0, 0, 0.6)', blur: 6, fill: true, stroke: true, ...e.shadow };
    }
    return e;
}
const fabricaTexto = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, texto, estilo) {
    return fabricaTexto.call(this, x, y, texto, { resolution: ZOOM, ...estiloModerno(estilo) });
};

const config = {
    type: Phaser.AUTO,
    width: VISTA.width * ZOOM,
    height: VISTA.height * ZOOM,
    backgroundColor: '#05070f',
    parent: 'game',
    // con la cámara suave las posiciones tienen decimales: se redondean al dibujar para que el
    // pixel art no se vea borroso ni tiemble (las texturas de pixel art ya usan filtro NEAREST)
    render: { roundPixels: true },
    // el juego se escala para llenar su contenedor sin deformarse (botón agrandar y pantalla completa)
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: VISTA.width * ZOOM,
        height: VISTA.height * ZOOM,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [
        // pantalla de título (también carga todos los recursos), historia y elegir personaje
        {
            key: 'titulo',
            preload() { mostrarCarga(this, ZOOM); preload.call(this); },
            create() {
                prepararAnimaciones(this);
                if (atajoDesarrollo(this)) return; // (solo en desarrollo: ?nivel=3 entra directo al nivel 3)
                crearTitulo(this, {
                    zoom: ZOOM,
                    alJugar: () => this.scene.start('seleccion'),
                    alHistoria: () => this.scene.start('intro'),
                    // la sala de espera se abre sobre la pantalla de elegir personaje
                    alAmigos: () => { this.scene.start('seleccion'); abrirSala(); },
                });
            },
            update(time) { this.actualizarTitulo(time); },
        },
        {
            key: 'intro',
            create() { crearIntro(this, { zoom: ZOOM, alTerminar: () => this.scene.start('seleccion') }); },
            update(time) { this.actualizarIntro(time); },
        },
        { key: 'seleccion', create: crearSeleccion, update: actualizarSeleccion },
        { key: 'juego', preload: precargarNivel, create, update },
        // mapa del mundo entre un nivel y el siguiente
        {
            key: 'mapa',
            create(data) {
                crearMapa(this, { ...data, personaje: prepararVariante(this, animDe(personajeId)), vidas, maxVidas: VIDAS_INICIALES, score, zoom: ZOOM, abrirTienda });
            },
            update(time) { actualizarMapa(this, time); },
        },
        // final: amanece en Albora y se muestran puntaje y muertes
        {
            key: 'final',
            create(data) { crearFinal(this, { zoom: ZOOM, ...data, alTerminar: () => this.scene.start('titulo') }); },
            update(time) { this.actualizarFinal(time); },
        },
    ]
}

// la letra se carga antes de empezar (un texto de Phaser no se redibuja si la letra llega tarde);
// sin internet, a los 2,5 s se sigue con la letra del sistema
try {
    await Promise.race([
        Promise.all(['400', '500', '600', '700'].map(peso => document.fonts.load(`${peso} 16px Poppins`))),
        new Promise(listo => setTimeout(listo, 2500)),
    ]);
} catch (_e) { /* el navegador no permite cargar letras: letra del sistema */ }
const juego = new Phaser.Game(config)
// Phaser recorta cada cuadro a 1/60 s mientras cree que la ventana no tiene el foco (pasa en el
// WebView del APK y en el iframe de itch.io): en el celular, que dibuja menos cuadros por segundo,
// todo el juego iba en cámara lenta. El resto del suavizado del reloj se mantiene
juego.loop.blur = () => {};
juego.loop.inFocus = true;
globalThis.juegoMonhabell = juego; // para revisar el juego desde la consola del navegador (pruebas)

// en celulares: botones táctiles sobre el juego (tactil.js)
iniciarTactil(juego);

// menú de pausa y de configuración (menu.js); los ajustes viven en ajustes.js
// tienda (capa HTML como los menús): se abre desde "Elige tu héroe" y desde el mapa entre niveles
const abrirTienda = iniciarTienda();
const abrirVestidor = iniciarVestidor(juego);
iniciarVoz(juego); // chat de voz: solo en las partidas en línea (voz.js)
// las estelas se equipan en el héroe marcado en "Elige tu héroe"; en las demás pantallas, en el que se juega
usarHeroeActual(() => {
    const sel = juego.scene.isActive('seleccion') && juego.scene.getScene('seleccion');
    return sel ? PERSONAJES[sel.indiceSel]?.id ?? personajeId : personajeId;
});
// el progreso guardado de antes de la tienda cuenta para los premios de los jefes
registrarNivel(leerPartida()?.nivel ?? 0);

// fuera de un nivel, el botón dorado de la tienda abre la tienda de la pantalla actual
// (elegir héroe y el mapa saben esperar a que se cierre)
function abrirTiendaFuera() {
    const activa = clave => juego.scene.isActive(clave) && juego.scene.getScene(clave);
    if (activa('seleccion')?.abrirTiendaSel) activa('seleccion').abrirTiendaSel();
    else if (activa('mapa')?.irATienda) activa('mapa').irATienda();
    else abrirTienda();
}
// al cerrar la tienda en medio de un nivel se actualizan las monedas del HUD
const abrirTiendaEnJuego = alCerrar => abrirTienda(() => {
    const nivel = juego.scene.getScene('juego');
    if (nivel?.monedasText?.active) actualizarMonedasHud(nivel);
    alCerrar?.();
});

iniciarMenus(juego, {
    abrirTienda: abrirTiendaEnJuego, tiendaFuera: abrirTiendaFuera,
    // a la pantalla de título (en línea, dejando la sala)
    irAlInicio: () => {
        terminarArena();
        terminarCarrera();
        terminarNoche();
        if (red.codigo) salirSala();
        juego.scene.stop('juego');
        juego.scene.start('titulo');
    },
    // dejar el nivel y abrir la sala de espera (sobre "Elige tu héroe")
    jugarConAmigos: () => {
        terminarArena();
        terminarCarrera();
        terminarNoche();
        juego.scene.stop('juego');
        juego.scene.start('seleccion');
        abrirSala();
    },
    aplicar: aplicarAjustes,
    salirAlMenu: () => {
        terminarArena();
        terminarCarrera();
        terminarNoche();
        if (red.codigo) salirSala(); // salir del nivel en línea también es dejar la sala
        juego.scene.stop('juego');
        juego.scene.start('seleccion');
    },
});

// ---------- Arena del Troll (arena.js): batallas entre jugadores ----------
iniciarArena({
    golpearme: (scene, daño, origenX) => killgesi(scene, 'pvp', daño, origenX),
    mensaje: (scene, texto, ms) => mostrarMensaje(scene, texto, ms),
    ponerVidas: (scene, n) => { vidas = n; actualizarCorazones(scene); },
    premio: n => sumarMonedas(n),
    pagar: n => gastarMonedas(n),
    // orbe de poder: un poder legendario de un solo uso en la tecla V
    orbe: (scene, id) => {
        if (!darOrbe(scene, id)) return;
        mostrarMensaje(scene, `¡ORBE DE PODER!\nV: ${scene.orbe.nombre} (un uso)`, 1500);
    },
    reiniciar: scene => scene.scene.restart(),
    salir: () => {
        terminarArena();
        terminarCarrera();
        terminarNoche();
        if (red.codigo) salirSala();
        juego.scene.stop('juego');
        juego.scene.start('seleccion');
    },
    revancha: () => { arenaParaRevancha(); empezarPartida(0); }, // (el modo y la arena los guarda la sala; si era al azar, otra arena)
    volverASala: () => volverASala(),
});
usarJuego(juego);

// ---------- Carrera (carrera.js): el primero en llegar a la meta se lleva el pozo ----------
iniciarCarrera(juego, {
    mensaje: (scene, texto, ms) => mostrarMensaje(scene, texto, ms),
    premio: n => sumarMonedas(n),
    pagar: n => gastarMonedas(n),
    // la carrera terminó (o me voy): se guardan las monedas juntadas que no llegaron a un punto de control
    guardarMonedas: scene => guardarBolsa(scene),
    salir: () => {
        const nivel = juego.scene.getScene('juego');
        if (nivel?.bolsa) guardarBolsa(nivel);
        terminarCarrera();
        terminarNoche();
        if (red.codigo) salirSala();
        juego.scene.stop('juego');
        juego.scene.start('seleccion');
    },
    revancha: pista => empezarPartida(pistaParaRevancha(pista)), // (si la pista era al azar, se sortea otra)
    volverASala: () => volverASala(),
    // un rival te dejó sin vida con sus poderes: mueres (ni el escudo ni las defensas lo evitan)
    morir: scene => killgesi(scene, 'rival'),
});
// ---------- La Noche del Troll (troll.js): antorchas, altar y el final ----------
iniciarNoche({
    mensaje: (scene, texto, ms) => mostrarMensaje(scene, texto, ms),
    crearEnemigo: (scene, x, y, tipo) => crearEnemigo(scene, x, y, tipo), // (los monstruos del troll)
    pagar: n => gastarMonedas(n), // (la apuesta de la noche)
    // una trampa del troll: mueres (ni el escudo ni las defensas lo evitan)
    morir: scene => killgesi(scene, 'rival'),
    premio: n => sumarMonedas(n),
    revancha: () => empezarPartida(0), // (otra noche: el servidor reparte roles nuevos)
    salir: () => {
        terminarNoche();
        if (red.codigo) salirSala();
        juego.scene.stop('juego');
        juego.scene.start('seleccion');
    },
    volverASala: () => volverASala(),
});
// estrellas y mapa de mundos (mundos.js): jugar un nivel ya alcanzado
configurarMundos({
    nivelMaximo: () => nivelMaximo(),
    jugar: n => {
        nivelActual = Phaser.Math.Clamp(n, 0, TOTAL_NIVELES - 1);
        reiniciarMinas(); reiniciarMisiones(); reiniciarMonedasNivel();
        vidaJefeGuardada = null;
        runaNivel = -1;
        vidas = VIDAS_INICIALES = vidasTotales();
        scoreInicioNivel = score;
        checkpointX = null;
        guardarPartida();
        juego.scene.getScenes(true).forEach(s => juego.scene.stop(s.scene.key));
        juego.scene.start('juego');
    },
});
// trampas falsas de los niveles infinitos (falsas.js)
configurarFalsas({ mensaje: (scene, texto, ms) => mostrarMensaje(scene, texto, ms) });
// misiones de los niveles infinitos (misiones.js)
configurarMisiones({
    mensaje: (scene, texto, ms) => mostrarMensaje(scene, texto, ms),
    crearEnemigo: (scene, x, y, tipo) => crearEnemigo(scene, x, y, tipo), // (acertijo equivocado en niveles altos)
});
// misiones y mecanismos del nivel 3, las Minas (minas.js)
configurarMinas({
    killgesi: scene => killgesi(scene, 'rival'), // (la dinamita: ni el escudo lo evita)
    crearEnemigo: (scene, x, y, tipo) => crearEnemigo(scene, x, y, tipo),
    mensaje: (scene, texto, ms) => mostrarMensaje(scene, texto, ms),
    dañarEnemigo: (scene, e, n) => dañarEnemigo(scene, e, n),
    soltarCorazon: (scene, x, y) => soltarCorazon(scene, x, y),
    // el cofre secreto: un poder legendario de un solo uso (tecla V)
    orbe: scene => {
        if (darOrbe(scene, 'supernova')) mostrarMensaje(scene, `🔍 ¡UN COFRE SECRETO!\nV: ${scene.orbe.nombre} (un uso)`, 1800);
    },
});
// mecanismos del nivel 2, las Catacumbas (catacumbas.js)
configurarCatacumbas({
    killgesi: scene => killgesi(scene, 'rival'), // (aplastado, quemado o mordido: ni el escudo lo evita)
    crearEnemigo: (scene, x, y, tipo) => crearEnemigo(scene, x, y, tipo),
    mensaje: (scene, texto, ms) => mostrarMensaje(scene, texto, ms),
});
// mecanismos de las Ruinas del Abismo (abismo.js)
iniciarAbismo({
    killgesi: scene => killgesi(scene),
    mensaje: (scene, texto, ms) => mostrarMensaje(scene, texto, ms),
});
// el anfitrión volvió a la sala de espera: todos vuelven a ella
alRecibir('volver', () => {
    terminarArena();
    terminarCarrera();
    terminarNoche();
    juego.scene.getScenes(true).forEach(s => juego.scene.stop(s.scene.key));
    juego.scene.start('seleccion');
    abrirSala();
});

// ---------- multijugador en línea (sala.js, red.js, multijugador.js) ----------
const abrirSala = iniciarSala(juego, {
    // el anfitrión empezó: todos entran al mismo nivel con el personaje que eligieron en la sala
    // modo 'duelo' o 'equipos': batalla en la Arena del Troll (arena.js)
    alEmpezar: ({ nivel, pj, modo, arena, jugadores, apuesta }) => {
        personajeId = pj;
        reiniciarPartida();
        nivelActual = Phaser.Math.Clamp(nivel, 0, NIVELES.length - 1);
        if (esModoArena(modo)) empezarArena({ modo, arena, jugadores, apuesta });
        else terminarArena();
        // carrera: el número es la pista (pistas.js); el paisaje y los enemigos son los de su región
        if (esModoCarrera(modo)) {
            empezarCarrera({ pista: nivel, jugadores });
            nivelActual = pistaDe(nivel).region;
        } else terminarCarrera();
        // La Noche del Troll (troll.js): los roles ya los repartió el servidor
        if (esModoNoche(modo)) {
            empezarNoche({ jugadores, mapa: arena }); // (en la noche, 'arena' es el mapa: bosque o criptas)
            nivelActual = NIVEL_NOCHE;
        } else terminarNoche();
        juego.scene.getScenes(true).forEach(s => juego.scene.stop(s.scene.key));
        juego.scene.start('juego');
    },
});
iniciarMultijugador(juego, {
    nivelActual: () => (arenaActiva() ? idNivelArena() : nivelActual),
    // otro jugador cayó: caen todos (vidas compartidas)
    morir: (scene, nombre) => {
        if (scene.mascotaGesi.isDead || scene.nivelTerminado) return;
        scene.muerteRemota = true;
        killgesi(scene, 'caida');
        mostrarMensaje(scene, `¡CAYÓ ${nombre.toUpperCase()}!`, 1600);
    },
    activarCheckpoint: (scene, cp) => activarCheckpoint(scene, cp, true),
    matarEnemigo: (scene, e) => { e.muerteRemota = true; matarEnemigo(scene, e); },
    dañarJefe: (scene, cantidad) => dañarJefe(scene, cantidad, apiJefe, undefined, true),
    alterarJefe: (scene, tipo, ms) => alterarJefe(scene, tipo, ms, true),
    completar: scene => { scene.metaRemota = true; completarNivel.call(scene, scene.mascotaGesi); },
    crearEnemigo: (scene, x, y, tipo) => crearEnemigo(scene, x, y, tipo),
    dañarEnemigo: (scene, e, cantidad, congela) => dañarEnemigo(scene, e, cantidad, congela),
    golpeEnZona: (scene, zona, x) => golpeEnZona(scene, zona, x),
    bala: (scene, m) => balaRemota(scene, m),
    datosJefe: scene => datosJefe(scene),
    reloj: scene => Math.round(relojSala(scene)),
    ajustarReloj: (scene, reloj) => ajustarReloj(scene, reloj),
    jefe: (scene, datos) => recibirJefe(scene, datos, apiJefe),
    jefeFx: (scene, m) => efectoJefe(scene, m, apiJefe),
});

// aplica lo que cambia al momento (la dificultad se aplica al empezar o reiniciar un nivel)
function aplicarAjustes() {
    if (juego.sound) juego.sound.volume = ajustes.volumen / 100;
    document.documentElement.style.setProperty('--t-escala', BOTONES[ajustes.botones].escala);
    if (!juego.scene.isActive('juego') && !juego.scene.isPaused('juego')) return;
    const nivel = juego.scene.getScene('juego');
    // en la pelea con el jefe la cámara la maneja jefes.js (vuelve al zoom elegido al ganar)
    if (!nivel.camaraArena && nivel.mascotaGesi) {
        nivel.cameras.main.setZoom(zoomCamara());
        // de golpe sobre el personaje: con el juego en pausa la cámara no lo seguiría
        nivel.camaraVerticalLista = false;
        nivel.camaraHorizontalLista = false;
        moverCamara(nivel);
    }
    verColisiones(nivel);
    // contador de FPS (se crea o se quita al momento)
    if (ajustes.fps && !nivel.textoFps) crearContadorFps(nivel);
    else if (!ajustes.fps && nivel.textoFps) { nivel.textoFps.destroy(); nivel.textoFps = null; }
}
// el volumen guardado se aplica cuando el sonido ya existe
juego.events.once('ready', aplicarAjustes);

// cajas de colisión de la física (opción "Ver colisiones" de la configuración, para probar)
function verColisiones(scene) {
    const mundo = scene.physics.world;
    if (ajustes.colisiones && !mundo.debugGraphic) mundo.createDebugGraphic();
    mundo.drawDebug = ajustes.colisiones;
    if (!ajustes.colisiones) mundo.debugGraphic?.clear();
}

// botones de la página: agrandar (tecla G) y pantalla completa (tecla F); Esc sale
const botonAgrandar = document.getElementById('btn-agrandar');
function agrandar(activar) {
    const activo = document.body.classList.toggle('modo-grande', activar);
    botonAgrandar?.setAttribute('aria-pressed', String(activo));
    if (botonAgrandar) botonAgrandar.textContent = activo ? '⤡ Achicar' : '⤢ Agrandar';
}
// cada vez que cambia el tamaño del contenedor, el juego se reajusta para llenarlo
if (window.ResizeObserver) {
    new ResizeObserver(() => {
        juego.scale.getParentBounds(); // vuelve a medir el contenedor
        juego.scale.refresh();
    }).observe(document.getElementById('game'));
}
botonAgrandar?.addEventListener('click', e => { agrandar(); e.currentTarget.blur(); });
document.getElementById('btn-pantalla-completa')?.addEventListener('click', e => { juego.scale.toggleFullscreen(); e.currentTarget.blur(); });

// borrar el progreso y volver a la pantalla de selección para empezar desde el nivel 1
function reiniciarDesdeCero() {
    borrarPartida();
    reiniciarPartida();
    juego.scene.getScenes(true).forEach(s => juego.scene.stop(s.scene.key));
    juego.scene.start('seleccion');
}
document.getElementById('btn-reiniciar')?.addEventListener('click', e => {
    e.currentTarget.blur(); // que ESPACIO no vuelva a apretar el botón mientras juegas
    if (window.confirm('¿Borrar el progreso guardado y empezar desde el nivel 1?')) reiniciarDesdeCero();
});
// botones flotantes sobre el juego (los únicos visibles cuando está embebido en itch.io)
const botonSonido = document.getElementById('btn-sonido');
const botonFsFlotante = document.getElementById('btn-fs-flotante');
let silenciado = false; // juego.sound.mute tarda en reflejarse con WebAudio, así que lo recordamos aquí
function silenciar(activar = !silenciado) {
    silenciado = activar;
    if (juego.sound) juego.sound.mute = activar;
    botonSonido?.setAttribute('aria-pressed', String(activar));
    botonSonido?.setAttribute('aria-label', activar ? 'Activar sonido' : 'Silenciar sonido');
    try { localStorage.setItem('monhabell-aventura-mute', activar ? '1' : '0'); } catch (_e) { /* no se recuerda, no pasa nada */ }
}
// al arrancar se recupera la preferencia guardada (el sonido existe recién cuando el juego está listo)
juego.events.once('ready', () => {
    try { if (localStorage.getItem('monhabell-aventura-mute') === '1') silenciar(true); } catch (_e) { /* sin almacenamiento */ }
});
botonSonido?.addEventListener('click', e => { silenciar(); e.currentTarget.blur(); });
botonFsFlotante?.addEventListener('click', e => { juego.scale.toggleFullscreen(); e.currentTarget.blur(); });
document.addEventListener('fullscreenchange', () => {
    botonFsFlotante?.setAttribute('aria-pressed', String(!!document.fullscreenElement));
    botonFsFlotante?.setAttribute('aria-label', document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa');
});

document.addEventListener('keydown', e => {
    if (e.repeat || e.target.closest?.('input, textarea, select')) return; // escribiendo en un menú
    const tecla = e.key.toLowerCase();
    if (tecla === 'm') silenciar();
    else if (tecla === 'f') juego.scale.toggleFullscreen();
    else if (tecla === 'g') agrandar();
    else if (e.key === 'Escape' && document.body.classList.contains('modo-grande')) agrandar(false);
});

function preload() {

    // la nube, el bloque rúnico, el faro de la meta, la bola de fuego y el cuerpo del suelo
    // son gráficos propios dibujados por código: ver arte.js
    // personajes jugables (arquera, espadachín y mago)
    cargarPersonajes(this);
    // (los enemigos se cargan al entrar a cada nivel: ver precargarNivel)
    cargarCastillos(this);
    cargarMazmorra(this);
    precargarCriptas(this);
    this.load.image('portada', 'assets/portada.jpg'); // (la imagen de la pantalla de título) // (losas, escaleras y objetos del mapa de las Criptas: Noche del Troll)



    this.load.spritesheet('lava_falling', 'assets/scenery/lava_callendo.png', {
        frameWidth: 126,  // Ajusta según el ancho de cada frame en la hoja de sprites
        frameHeight: 129  // Ajusta según la altura de cada frame en la hoja de sprites
    });

    this.load.image('suelo2', 'assets/scenery/trap2.png');
    this.load.image('suelo3', 'assets/scenery/piso.png');


    this.load.spritesheet('lava', 'assets/scenery/lava1.png', { frameWidth: 64, frameHeight: 64 });

    // música y efectos de aventura originales (assets/sound/aventura)
    this.load.audio('gameover', 'assets/sound/aventura/muerte.mp3');
    this.load.audio('victoria', 'assets/sound/aventura/victoria.mp3');
    this.load.audio('musica', 'assets/sound/aventura/musica_aventura.mp3');
    this.load.audio('musica_cueva', 'assets/sound/aventura/musica_cueva.mp3');
    this.load.audio('musica_batalla', 'assets/sound/aventura/musica_batalla.mp3');
    // cargar enemigos
    this.load.spritesheet('malo', 'assets/entities/underground/Run.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('maloDead', 'assets/Dead.png', { frameWidth: 128, frameHeight: 128 });
    // cargar monedas
    // (las monedas se cargan en cargarMazmorra)

    // sonido de matar
    this.load.audio('matar', 'assets/sound/aventura/matar.mp3');
    this.load.audio('moneda', 'assets/sound/aventura/moneda.mp3');
    this.load.audio('disparo', 'assets/sound/aventura/disparo.mp3');
    this.load.audio('bump', 'assets/sound/aventura/bump.mp3');
    this.load.audio('romper', 'assets/sound/aventura/romper.mp3');
    this.load.audio('aparece', 'assets/sound/aventura/aparece.mp3');
    cargarEscudo(this);
    cargarJefes(this, trollDelNivel(nivelPorIndice(Phaser.Math.Clamp(nivelActual, 0, TOTAL_NIVELES - 1)))); // (solo el troll del jefe de este nivel)
    cargarSonidos(this);

    // bolas de fuego que saltan de la lava


}

// al entrar a un nivel: carga solo los enemigos que usa y suelta los demás (memoria en celulares)
function precargarNivel() {
    cargarEnemigos(this, arenaActiva() ? [] : enemigosDelNivel(nivelPorIndice(nivelActual))); // (en la arena no hay enemigos)
    // solo los efectos de los poderes equipados (en la arena, también los de los orbes)
    cargarPoderes(this, [...equipados(personajeId).filter(Boolean), ...(arenaActiva() ? PODERES_ORBE : []),
        ...(!arenaActiva() && nivelPorIndice(nivelActual)?.estilo === 'minas' ? ['supernova'] : [])]); // (nivel 3: el cofre secreto)
    if (this.load.list.size) mostrarCarga(this, ZOOM);
}

function create() {
    // las trampas se reparten al azar en cada intento (el nivel se siente nuevo cada vez,
    // pero con reglas para que sea justo: ver azar.js); en el nivel 1 la parte hecha a mano no se toca
    // en línea todos usan la misma semilla (la de la sala + el intento): mismas trampas para todos
    // atados con cadena (mismo teclado o en línea): el mismo mapa con sus tramos de equipo (equipo.js)
    // Arena del Troll (arena.js): batalla entre jugadores en un escenario propio, sin enemigos ni jefe
    const arena = arenaActiva();
    this.arena = arena;
    // (en la carrera cada uno corre el nivel normal, como solo)
    const enEquipo = mundoCompartido() || (ajustes.cadena && !enLinea());
    // carrera: la pista con sus dos caminos (pistas.js), la misma para todos con la semilla de la sala
    const pista = !arena && enCarrera() && carreraActiva() ? carreraActiva().pista : null;
    // La Noche del Troll: el Bosque de Albora (bosque_troll.js), sin trampas al azar ni jefe
    const noche = !arena && enNoche() && !!nocheActiva();
    this.noche = noche;
    this.esFantasma = false; // (troll.js: un héroe que murió en la noche)
    // (las Ruinas del Abismo tienen sus trampas puestas a mano: prepararNivelFijo en azar.js)
    const delNivel = enEquipo ? nivelEnEquipo(nivelActual) : nivelPorIndice(nivelActual);
    const nivel = arena ? nivelArena() : noche ? nivelDeNoche(inicioNoche()) : pista != null ? armarPista(pista, semillaEnLinea(nivelActual))
        : delNivel.fija ? prepararNivelFijo(delNivel, semillaEnLinea(nivelActual))
        // (las reglas de trampas al azar llegan hasta las del nivel 6: los infinitos ya traen las suyas)
        : aleatorizarNivel(delNivel, Math.min(nivelActual, 5), nivelActual === 0 && delNivel.amano ? [[600, 1106]] : [], semillaEnLinea(nivelActual), nivelActual);
    if (!arena) console.info(`[trampas] nivel ${nivelActual + 1} · semilla ${nivel.semilla} (para repetir este reparto: ?semilla=${nivel.semilla})`);
    if (!enLinea()) guardarPartida(); // para no tener que volver al inicio (en línea no se pisa la partida propia)
    prepararAnimaciones(this);
    // reloj del nivel: las gotas, las bolas de fuego y las plataformas se guían por él (en línea,
    // todas las pantallas lo ajustan al del anfitrión: ver relojSala)
    // (en la Noche del Troll cuenta desde que empezó la noche: no vuelve a cero al reaparecer)
    this.inicioNivel = this.time.now - (noche ? relojNoche() : 0);
    this.desfaseReloj = 0;
    this.ciclos = [];
    // multijugador: los enemigos creados al armar el nivel llevan un número (igual en todas las pantallas)
    this.contIds = 0;
    this.idsCerrados = false;
    this.muerteRemota = false;
    this.metaRemota = false;
    // (la escena se reutiliza: lo de una carrera o batalla anterior no sigue en la próxima partida)
    this.cinematica = false;
    this.carrera = null;
    this.dibujoCadena = null;
    this.nivelTerminado = false;
    // con la mejora de héroe comprada en la tienda (si la tiene)
    // y con los colores elegidos en el vestidor (anim: prefijo de sus animaciones)
    const pjBase = personajeConMejoras(PERSONAJES.find(pj => pj.id === personajeId));
    this.pj = { ...pjBase, anim: prepararVariante(this, animDe(pjBase)) };
    flechas = FLECHAS_INICIALES;
    this.mana = MANA_MAXIMO;
    this.enfriamientos = {};
    // para los botones táctiles (tactil.js): cuánto le falta a cada poder para poder usarse
    // carga: 0 → recién usado, 1 → listo; sinRecurso: no alcanzan las flechas o el maná
    this.estadoHabilidad = tecla => {
        const h = this.pj.habilidades[tecla];
        const resta = Math.max(0, (this.enfriamientos[tecla] || 0) - this.time.now);
        const enfriado = h.enfriamiento ? 1 - resta / h.enfriamiento : 1;
        const tengo = !h.costo ? Infinity : this.pj.recurso === 'flechas' ? flechas : this.pj.recurso === 'mana' ? this.mana : Infinity;
        const recurso = h.costo ? Math.min(1, tengo / h.costo) : 1;
        return { carga: Math.min(enfriado, recurso), sinRecurso: recurso < 1 };
    };
    this.atacando = false;
    this.dashHasta = 0;
    this.escudoHasta = 0;
    this.volteretaHasta = 0;
    this.paradaHasta = 0;
    this.empujadoHasta = 0;
    this.aturdidoHasta = 0; // carrera: aturdido o congelado por el poder de un rival (no se mueve)
    this.lentoHasta = 0;     // carrera: ralentizado (corre a la mitad y salta menos)
    this.silenciadoHasta = 0; // carrera: bloqueado (no puede usar ataques ni poderes)
    this.recogiendoFlechas = 0;
    this.tieneEscudo = !noche; // cada vida empieza con escudo (aguanta un golpe; en la noche, el escudo de luz de troll.js)
    this.saltosAire = 0;
    this.sufijo = nivel.cueva ? '_cueva' : '';
    this.velEnemigos = (nivel.velEnemigos ?? 50) * factorEnemigos(); // la dificultad los acelera o frena
    this.vidaExtraEnemigos = nivel.vidaExtra || 0;
    // vidas según la dificultad elegida (si se bajó en medio de la partida, se recortan)
    VIDAS_INICIALES = arena ? 3 : vidasTotales();
    vidas = arena ? 3 : Math.min(vidas, VIDAS_INICIALES); // (en la arena: los corazones de la ronda, ver prepararArena)
    this.bolsa = 0; // monedas juntadas que todavía no se guardaron (ver tienda.js)
    // enemigos que caminan en este nivel (se van turnando)
    this.mezcla = nivel.mezcla || ['zombie1', 'zombie2', 'zombie3'];
    this.contEnemigos = 0;

    crearFondo(this, nivel);
    crearFondoAbismo(this, nivel); // (solo la pista de las Ruinas del Abismo: volcanes y ruinas)
    this.fondoHasta = this.children.list.length; // (el decorado de fondo de los mapas nuevos va aquí: alFondo)

    // estalactitas, hongos, antorchas y la puerta de entrada (detrás de todo lo jugable)
    // (la parte hecha a mano del nivel 1 de antes: solo si el nivel 1 es ese)
    const nivel1 = nivelActual === 0 && !arena && !noche && !!NIVELES[0].amano;
    this.nivel1AMano = nivel1;
    // suelos y plataformas de ladrillo medieval (el nivel 1 de las Afueras): ver vestirSuelo en mazmorra.js
    this.estiloMedieval = ['afueras', 'catacumbas', 'minas', 'infinito', 'medieval'].includes(nivel.estilo);
    this.murosPropios = ['afueras', 'catacumbas', 'minas'].includes(nivel.estilo); // (esos niveles dibujan sus muros)
    this.sueloTema = this.estiloMedieval ? sueloDeTema(this, nivel.tema) : null; // (el ladrillo o la piedra del tema, con su color)
    this.minas = nivel.estilo === 'minas';
    this.catacumbas = nivel.estilo === 'catacumbas';
    const rangosSuelo = [...(nivel.suelo || []), ...(nivel1 ? [[0, 1106]] : [])];
    // (sinDecorado: el mapa pone todo lo suyo, como las Criptas de la Noche del Troll)
    decorarNivel(this, nivel, arena ? 0 : nivelActual, x => !nivel.sinDecorado && rangosSuelo.some(([a, b]) => x > a + 40 && x < b - 40));

    this.floor = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.lavaes = this.physics.add.group();
    this.lavaesgota = this.physics.add.group();
    // frictionX: 1 hace que Gesi se mueva junto con la plataforma cuando está encima
    this.moviles = this.physics.add.group({ allowGravity: false, immovable: true, frictionX: 1 });
    // trampas
    this.invisibles = this.physics.add.staticGroup(); // bloques invisibles
    this.bolas = this.physics.add.group();
    this.carcajes = this.physics.add.staticGroup();
    this.premios = this.physics.add.staticGroup();
    this.flechasGrupo = this.physics.add.group({ allowGravity: false });
    this.balasEnemigas = this.physics.add.group({ allowGravity: false });
    this.cayentes = []; // ladrillos que caen
    this.pinchos = [];
    this.emboscadas = [];

    // subsuelo: tierra oscura bajo todo el nivel (antes que el suelo y la lava: queda detrás).
    // La cámara muestra un poco por debajo del piso (CAMARA_BAJA)
    this.add.graphics().fillGradientStyle(
        nivel.cueva ? 0x2a1f1a : 0x221d2a, nivel.cueva ? 0x2a1f1a : 0x221d2a, 0x07060a, 0x07060a, 1,
    ).fillRect(-200, SUELO_Y + 12, nivel.ancho + 400, SUBSUELO);
    if (nivel1) construirNivel1(this);
    construirNivel(this, nivel);
    if (nivel.estilo === 'afueras') { this.metaNivel = nivel.meta; decorarAfueras(this); }
    this.catEscalones = null;
    if (this.catacumbas) crearCatacumbas(this); // (nivel 2: escalera-rampa, puertas, techo que baja…)
    this.minasJaulas = null;
    this.misionesNivel = null;
    // niveles infinitos: misiones que abren la meta (misiones.js)
    this.falsas = null;
    // (y los niveles hechos a mano que traen las suyas: del 4 al 7)
    if ((esInfinito(nivelActual) || nivel.misiones) && !arena && !noche && pista == null) {
        const k = esInfinito(nivelActual) ? nivelActual - NIVELES.length : 0;
        crearMisiones(this, nivel, nivelActual, k);
        // trampas falsas (falsas.js), lejos de las misiones y los acertijos
        const ocupados = (this.misionesNivel || []).flatMap(m => [m.desde, m.hasta, m.pista, ...(m.cosas || []).map(c => c.x),
            ...(m.palancas || []).map(p => p.x), ...(m.runas || []).map(p => p.x)]).filter(x => x != null);
        crearFalsas(this, nivel, nivelActual, esInfinito(nivelActual) ? k : nivel.falsas ?? 0, ocupados);
    }
    if (this.minas) crearMinas(this); // (nivel 3: misiones, sellos, carro, dinamita…)
    crearMecanismos(this, nivel, nivelActual); // placas y puertas de equipo (si el nivel las tiene)

    // monedas (las que quedan detrás del punto de control no reaparecen: ya se guardaron al pasar)
    monedas(this, checkpointX == null ? nivel.monedas : (nivel.monedas || []).filter(([x]) => x > checkpointX));

    // carteles, monedas trampa, rocas, estatuas falsas, plataformas que muerden, banderas falsas y gigantes
    crearSorpresas(this, nivel, checkpointX ?? 0);
    // cada tipo de trampa tiene su señal visible (grietas, temblores, destellos, ojos rojos)
    crearSenales(this);
    // las Ruinas del Abismo: aplastadores, portales, el muro que persigue y la decoración (abismo.js)
    crearAbismo(this, nivel);

    // corazones que aparecen al azar cuando te faltan vidas
    this.mostrarMensajeCorto = texto => mostrarMensaje(this, texto, 900);
    // el bosque del nivel 1 (bosque.js) cuenta también a los demás jugadores en línea
    this.fantasmasBosque = () => fantasmas(this);
    // nadie lo rescató a tiempo (cadena.js): ahora sí cuenta la caída
    this.morirPorCaida = () => killgesi(this, 'caida');
    iniciarCorazonesAlAzar(this, () => !arena && vidas < VIDAS_INICIALES, nivel.ancho);
    iniciarEscudosAlAzar(this, soltarEscudo, nivel.ancho);

    // jefe al final del nivel
    this.peleaJefe = false;
    this.limiteDerecho = null;
    // al chocar con el jefe solo la embestida de Leo le hace daño (ver jefes.js)
    this.protegido = () => this.time.now < this.dashHasta;
    this.reaparecerEnArena = x => { checkpointX = Math.max(checkpointX ?? 0, x); };
    // al empezar la pelea: flechas y maná llenos para poder usar los poderes contra el jefe
    this.recargarParaJefe = () => {
        flechas = Math.max(flechas, 20);
        this.mana = MANA_MAXIMO;
        actualizarRecurso(this);
    };
    this.vidaJefeInicial = vidaJefeGuardada && vidaJefeGuardada.nivel === nivelActual ? vidaJefeGuardada.vida : null;
    this.guardarVidaJefe = v => { vidaJefeGuardada = { nivel: nivelActual, vida: v }; };
    this.salud = SALUD_MAXIMA;
    this.barraSalud = this.barraSaludFondo = this.textoSalud = null;
    this.mostrarBarraSalud = () => crearBarraSalud(this);
    this.soltarCorazonArena = (x, y) => soltarCorazon(this, x, y);
    this.faltaSalud = () => this.salud < SALUD_MAXIMA || vidas < VIDAS_INICIALES;
    this.jefe = null;
    if (!arena && !noche && pista == null && !nivel.sinJefe) prepararJefe(this, nivel, nivelActual); // (las pistas y la noche no tienen jefe)

    // con una sola vida se escucha un latido
    this.time.addEvent({
        delay: 1300, loop: true, callback: () => {
            if (vidas === 1 && !this.mascotaGesi.isDead && !this.nivelTerminado) this.sound.play('latido', { volume: 0.45 });
        }
    });

    // aparece en el último punto de control; si no hay, donde diga el nivel (p. ej. arriba del cráter)
    const [inicioX, inicioY] = checkpointX == null && nivel.inicio ? nivel.inicio
        : [checkpointX ?? lugarDeInicio(this, enCarrera() ? VISTA.width * 2 / CAMARAS.normal.zoom : VISTA.width * ZOOM / zoomCamara()), 100];
    // (en la carrera todos salen del mismo lugar, sin importar la cámara que eligió cada uno)
    const r = resDe(this.pj); // héroes HD: hojas al doble, se dibujan a la mitad
    this.mascotaGesi = this.physics.add.sprite(inicioX, inicioY, `${this.pj.anim}-idle`)
        .setScale(1 / r)
        .setCollideWorldBounds(true)// asegura que no salga de los limites del juego
        .setGravityY(480); // aplicar garvedad vertical

    // Recortar la imagen desde la parte superior
    this.mascotaGesi.setCrop(0, 57 * r, this.mascotaGesi.width, this.mascotaGesi.height - 50 * r);

    this.mascotaGesi.body.setSize(20 * r, 69 * r).setOffset(55 * r, 57 * r); // (en píxeles de la hoja: se escalan con el sprite)
    // el personaje se dibuja delante de la niebla (capas 30-33) pero detrás de la oscuridad (40)
    this.mascotaGesi.setDepth(34);

    // Hacer que todos los enemigos colisionen con el suelo
    this.physics.add.collider(this.enemies, this.floor);

    this.physics.add.collider(this.enemies, this.enemies, (enemy1, enemy2) => {
        if (enemy1.def?.tipo === 'planta' || enemy2.def?.tipo === 'planta') return;
        // Cambiar la dirección de ambos enemigos invirtiendo su velocidad
        enemy1.setVelocityX(-enemy1.body.velocity.x);
        enemy2.setVelocityX(-enemy2.body.velocity.x);

        // Cambiar la dirección visual (flip) dependiendo de la nueva dirección de la velocidad
        enemy1.flipX = enemy1.body.velocity.x < 0;  // Flip si se mueve hacia la izquierda
        enemy2.flipX = enemy2.body.velocity.x < 0;  // Flip si se mueve hacia la izquierda
    });

    this.physics.add.collider(this.mascotaGesi, this.floor, golpearBloque, null, this)
    this.physics.add.collider(this.mascotaGesi, this.moviles)
    this.physics.add.collider(this.lavaes, this.floor)

    // Configurar la colisión entre el jugador y los enemigos
    this.physics.add.collider(this.mascotaGesi, this.enemies, onHitEnemy, tocaEnemigos, this);// muerte con enemigo

    this.physics.add.collider(this.mascotaGesi, this.lavaes, onlava, null, this);// muere con lava

    this.physics.add.collider(this.lavaesgota, this.lavaes, salpicar, null, this);
    this.physics.add.collider(this.lavaesgota, this.floor, salpicar, (_gota, piso) => !piso.esGotero, this);
    this.physics.add.collider(this.lavaesgota, this.moviles, salpicar, null, this);

    this.physics.add.collider(this.mascotaGesi, this.lavaesgota, onlavagotasgesi, vivo, this);// muere con lava

    this.physics.add.overlap(this.mascotaGesi, this.coins, collectCoin, vivo, this);

    // bloques invisibles: solo chocan si Gesi los golpea desde abajo (o si ya aparecieron)
    this.physics.add.collider(this.mascotaGesi, this.invisibles, revelarBloque,
        (g, b) => b.revelado || (g.body.velocity.y < 0 && g.body.top >= b.body.bottom - 12), this);
    this.physics.add.collider(this.enemies, this.invisibles, null, (_e, b) => b.revelado);
    this.physics.add.overlap(this.mascotaGesi, this.bolas, () => killgesi(this));
    this.physics.add.overlap(this.mascotaGesi, this.carcajes, recogerCarcaj, vivo, this);
    this.physics.add.overlap(this.mascotaGesi, this.premios, recogerPremio, vivo, this);

    // flechas
    this.physics.add.overlap(this.flechasGrupo, this.enemies, (flecha, enemy) => {
        if (enemy.isDead) return;
        if (!flecha.perfora) flecha.destroy();
        dañarEnemigo(this, enemy, 1, flecha.congela);
    });
    this.physics.add.collider(this.flechasGrupo, this.floor, flecha => flecha.destroy());

    // disparos de los enemigos
    this.physics.add.overlap(this.mascotaGesi, this.balasEnemigas, (_g, bala) => {
        const d = defensa(this, bala.x);
        if (d) { bala.destroy(); aplicarDefensa(this, d); return; }
        bala.destroy();
        killgesi(this, undefined, 20, bala.x);
    });
    this.physics.add.collider(this.balasEnemigas, this.floor, bala => bala.destroy());
    this.physics.add.collider(this.flechasGrupo, this.moviles, flecha => flecha.destroy());
    this.physics.add.collider(this.flechasGrupo, this.invisibles, flecha => flecha.destroy(), (_f, b) => b.revelado);
    if (this.zonaMeta) this.physics.add.overlap(this.mascotaGesi, this.zonaMeta, completarNivel, null, this);

    // modo cadena (prototipo de 2 jugadores en el mismo teclado, se activa en la configuración)
    this.compa = null;
    if (ajustes.cadena && !enLinea()) {
        crearCadena(this, { x: inicioX, y: inicioY, api: { morir: (causa, daño, x) => killgesi(this, causa, daño, x) } });
    }

    // el mundo crece hacia ARRIBA en los niveles con altura (torres, puentes colgantes):
    // el suelo, la lava y el jefe siguen en su sitio y las secciones altas quedan en y negativa
    this.altoNivel = nivel.alto || 0;
    this.camaraVerticalLista = false;
    this.camaraHorizontalLista = false;
    this.camaraMira = 1;
    this.physics.world.setBounds(0, -this.altoNivel, nivel.ancho, VISTA.height + this.altoNivel);

    // camara
    this.anchoNivel = nivel.ancho;
    this.camaraArena = null;
    const antes = () => compensarZoom(this), despues = () => quitarCompensacion(this);
    this.events.on('prerender', antes);
    this.events.on('render', despues);
    this.events.once('shutdown', () => { this.events.off('prerender', antes); this.events.off('render', despues); });
    this.cameras.main.setOrigin(0).setZoom(zoomCamara()); // alejada según los ajustes: se ve más mundo
    moverCamara(this);
    verColisiones(this);

    // ambiente oscuro: niebla, oscuridad con luz alrededor del personaje y relámpagos
    crearAmbiente(this, nivel, arena ? 0 : nivelActual, nivel1 ? [[1350, 2310]] : []);
    crearLuz(this, nivel, ZOOM); // (niveles oscuros: antorcha, braseros y enemigos sombra; sombras bajo los pies)

    // HUD (en el celular, más chico y con íconos en vez de palabras: deja ver el juego, como en los
    // juegos de celular; lo de los poderes V y B lo muestran los botones táctiles)
    const movil = document.body.classList.contains('movil');
    this.hudMovil = movil;
    const estiloHud = { fontSize: movil ? '11px' : '16px', fill: '#fff', stroke: '#000', strokeThickness: movil ? 3 : 3 };
    // corazones de vida (los perdidos se ven grises)
    this.corazones = [];
    for (let i = 0; i < VIDAS_INICIALES; i++) {
        this.corazones.push(this.add.image(movil ? 22 + i * 21 : 28 + i * 26, movil ? 20 : 24, 'mz_corazon', 9).setScale(movil ? 0.6 : 0.75)
            .setScrollFactor(0).setDepth(50)); // Mantener fijo en la pantalla
    }
    actualizarCorazones(this);
    // con más de 4 corazones (dificultad fácil) el resto del HUD se corre a la derecha
    const corrido = Math.max(0, VIDAS_INICIALES - 4) * 26;
    this.hudCorrido = corrido;
    crearEscudo(this);
    // celular: puntaje y recurso en una fila debajo de los corazones; a la derecha monedas, muertes y nivel
    this.scoreText = this.add.text(movil ? 12 : 180 + corrido, movil ? 50 : 15, movil ? `★ ${score}` : `Puntaje: ${score}`, estiloHud)
        .setScrollFactor(0).setDepth(50);
    this.recursoText = this.add.text(movil ? 92 : 370 + corrido, movil ? 50 : 15, '', estiloHud)
        .setScrollFactor(0).setDepth(50);
    actualizarRecurso(this);
    this.muertesText = this.add.text(VISTA.width - (movil ? 62 : 130), movil ? 10 : 15, `☠ ${muertes}`, estiloHud)
        .setOrigin(1, 0).setScrollFactor(0).setDepth(50);
    // monedas: las guardadas y, en lavanda, las de la bolsa (se guardan en el próximo punto de control)
    this.monedasText = this.add.text(VISTA.width - (movil ? 112 : 196), movil ? 10 : 15, '', estiloHud).setOrigin(1, 0).setScrollFactor(0).setDepth(50);
    this.bolsaText = this.add.text(VISTA.width - (movil ? 110 : 192), movil ? 11 : 17, '', { ...estiloHud, fontSize: movil ? '9px' : '12px', fill: '#b9c3ff' })
        .setScrollFactor(0).setDepth(50);
    actualizarMonedasHud(this);
    crearEstela(this); // apariencia comprada en la tienda (solo visual)
    crearPoderes(this); // poderes especiales equipados (V y B) y su HUD
    this.estadoPoder = ranura => estadoPoder(this, ranura); // (para los botones táctiles)
    // (en el celular los poderes V y B ya se ven en sus botones: el HUD del juego se esconde)
    if (movil) this.hudPoderes?.forEach(h => [h.fondo, h.icono, h.sombra, h.letra].forEach(o => o?.setVisible(false)));
    // Noche del Troll: sin corazones, sin el escudo de siempre (troll.js tiene su escudo de luz) y sin
    // los poderes V y B (son para los rivales de la carrera y la arena)
    if (noche) {
        [...this.corazones, this.iconoEscudo, this.barraEscudo, this.barraEscudoFondo, this.textoEscudo].forEach(o => o?.setVisible(false));
        this.hudPoderes?.forEach(h => [h.fondo, h.icono, h.sombra, h.letra].forEach(o => o?.setVisible(false)));
        this.estadoPoder = () => null;
    }
    this.nivelText = this.add.text(VISTA.width - (movil ? 14 : 20), movil ? 10 : 15, movil ? `${nivelActual + 1}` : `Nivel ${nivelActual + 1}`, estiloHud)
        .setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    if (arena) {
        // en la arena: barra de salud como contra el jefe (los golpes de los rivales la bajan)
        this.peleaJefe = true;
        this.salud = SALUD_MAXIMA;
        crearBarraSalud(this);
        this.scoreText.setVisible(false);
        this.nivelText.setText('ARENA');
    } else if (pista != null) {
        // carrera: el cronómetro, las posiciones y el premio los muestra carrera.js (HUD propio)
        this.scoreText.setVisible(false);
        this.nivelText.setVisible(false);
    } else if (noche) {
        // Noche del Troll: ni puntaje ni "Nivel 1/7" (las antorchas y la luz las muestra troll.js)
        this.scoreText.setVisible(false);
        this.nivelText.setVisible(false);
    }
    else mostrarMensaje(this, `NIVEL ${nivelActual + 1}\n${nivel.nombre}`, 2000);

    // música de fondo
    this.musica = this.sound.add(arena ? 'musica_batalla' : nivel.cueva ? 'musica_cueva' : 'musica', { loop: true, volume: 0.25 });
    this.musica.play();
    this.events.once('shutdown', () => this.musica.destroy());

    this.keys = this.input.keyboard.createCursorKeys();
    this.teclasDisparo = this.input.keyboard.addKeys({ espacio: 'SPACE', x: 'X', c: 'C', v: 'V', b: 'B' });

    // multijugador en línea: los demás jugadores y la cadena entre todos (multijugador.js)
    this.idsCerrados = true; // los enemigos que aparezcan de aquí en adelante no se sincronizan
    // rendimiento: lista de lo fijo en pantalla y contador de FPS (opcional)
    vigilarFijos(this);
    this.textoFps = null;
    if (ajustes.fps) crearContadorFps(this);
    this.proxRecorte = 0;
    prepararNivelEnLinea(this);
    if (arena) prepararArena(this, (rival, daño, congela) => golpearRival(this, rival, daño, congela));
    if (enCarrera() && carreraActiva()) prepararCarrera(this, nivel, inicioX);
    if (noche) prepararNoche(this);
    this.alDañarJefe = avisarJefe;
    this.alAlterarJefe = (tipo, ms) => { if (mundoCompartido()) enviarEvento('jefeEstado', { tipo, ms, nivel: nivelActual }); };
    // el troll en línea: lo maneja el anfitrión (jefes.js)
    this.redJefe = mundoCompartido() ? {
        replica: soyReplica,
        avisar: avisarJefeFx,
        cercano: sprite => fantasmaMasCercano(this, sprite),
        comoJugador: (f, fn) => comoJugador(this, f, fn),
    } : null;
    if (mundoCompartido() && !arena && !noche) mostrarMensaje(this, `NIVEL ${nivelActual + 1}
${nivel.nombre}
${red.jugadores.length} jugadores en cadena`, 2400);
}

// la cámara sigue a Gesi sin mostrar nada fuera del nivel
// x donde aparece el personaje al empezar un nivel: lo más cerca posible del 30 % del ancho visible,
// sobre el suelo de abajo, sin plataformas ni bloques encima y sin lava (si no hay, en x = 50)
function lugarDeInicio(scene, anchoVista) {
    const piezas = scene.floor.getChildren().filter(p => p.body && p.body.enable && !p.esFalso);
    const libre = x => {
        const aqui = piezas.filter(p => x - 20 > p.body.left && x + 20 < p.body.right);
        return aqui.some(p => Math.abs(p.body.top - SUELO_Y) < 6) && !aqui.some(p => p.body.top < SUELO_Y - 6);
    };
    for (let x = Math.round(anchoVista * INICIO_POS_PJ); x > 50; x -= 10) if (libre(x)) return x;
    return 50;
}

function moverCamara(scene) {
    const g = scene.mascotaGesi;
    const cam = scene.cameras.main;
    // con la cámara alejada (pelea con el jefe) se ve más mundo: se centra en la arena
    const anchoVista = VISTA.width * ZOOM / cam.zoom, altoVista = VISTA.height * ZOOM / cam.zoom;
    // modo cadena: se sigue el punto medio entre los dos jugadores
    const c = scene.compa?.active ? scene.compa : null;
    const fx = c ? (g.x + c.x) / 2 : g.x, fy = c ? (g.y + c.y) / 2 : g.y;
    const dt = scene.game.loop.delta;
    if (scene.time.now < (scene.camaraQuietaHasta || 0)) return; // (trolladas.js: la cámara se queda atrás)
    if (scene.camaraArena) {
        // (si se ve más que el nivel entero, como en la arena, queda centrada)
        cam.scrollX = anchoVista >= scene.anchoNivel ? scene.camaraArena - anchoVista / 2
            : Phaser.Math.Clamp(scene.camaraArena - anchoVista / 2, 0, scene.anchoNivel - anchoVista);
    } else if (!g.isDead) {
        // mira hacia donde se mueve: yendo a la derecha el personaje queda a ~40 % (más espacio delante);
        // quieto, mantiene la última dirección (la cámara no se mueve por soltar la tecla)
        const vx = c ? (g.body.velocity.x + c.body.velocity.x) / 2 : g.body.velocity.x;
        if (Math.abs(vx) > 40) scene.camaraMira = Math.sign(vx);
        const lista = scene.camaraHorizontalLista;
        const objetivoMira = (0.5 - CAMARA_POS_PJ) * (scene.camaraMira ?? 1);
        scene.camaraAdelanto = lista
            ? scene.camaraAdelanto + (objetivoMira - scene.camaraAdelanto) * (1 - Math.exp(-dt / CAMARA_GIRO_MS))
            : objetivoMira;
        const objetivo = Phaser.Math.Clamp(fx - anchoVista * (0.5 - scene.camaraAdelanto), 0, Math.max(0, scene.anchoNivel - anchoVista));
        // zona muerta: mientras el personaje no se aleje del punto ideal, la cámara no se mueve
        const zona = anchoVista * CAMARA_ZONA_MUERTA, error = objetivo - cam.scrollX;
        const destino = Math.abs(error) > zona ? objetivo - Math.sign(error) * zona : cam.scrollX;
        // al empezar (o reaparecer) se coloca de golpe; después lo sigue con suavidad
        cam.scrollX = lista ? cam.scrollX + (destino - cam.scrollX) * (1 - Math.exp(-dt / CAMARA_SIGUE_MS)) : objetivo;
        scene.camaraHorizontalLista = true;
    }
    // el suelo casi abajo del todo (un poco más arriba: se ve el piso con algo de tierra debajo);
    // lo extra se ve arriba (cielo)
    const abajo = VISTA.height - altoVista + altoVista * CAMARA_BAJA;
    if (!scene.altoNivel || scene.camaraArena) {
        cam.scrollY = abajo;
    } else if (!g.isDead) {
        // en los niveles con altura la cámara sigue al personaje en vertical, con suavidad
        // (lo deja algo por debajo del centro: se ve más de lo que hay arriba, adonde se va).
        // No sube con los saltos (así siempre se ve dónde vas a caer): usa la altura del último piso.
        // Al caer por debajo de ese piso baja enseguida; al aterrizar más arriba sube con suavidad
        const pisando = g.body.blocked.down || g.body.touching.down;
        if (!scene.camaraVerticalLista || pisando) scene.camaraAlturaRef = fy;
        else if (fy > scene.camaraAlturaRef + CAMARA_BANDA_Y) scene.camaraAlturaRef = fy - CAMARA_BANDA_Y;
        let objetivo = scene.camaraAlturaRef - altoVista * CAMARA_ALTURA_PJ;
        // salvo que el personaje esté por salir de la pantalla por arriba (salto muy alto, seta, doble salto)
        objetivo = Math.min(objetivo, fy - altoVista * CAMARA_MARGEN_ARRIBA);
        objetivo = Phaser.Math.Clamp(objetivo, abajo - scene.altoNivel, abajo);
        // al empezar (o reaparecer) se coloca de golpe; después lo sigue con suavidad
        const k = scene.camaraVerticalLista ? 1 - Math.exp(-scene.game.loop.delta / CAMARA_SUAVIDAD_MS) : 1;
        cam.scrollY += (objetivo - cam.scrollY) * k;
        scene.camaraVerticalLista = true;
    }
}

// Lo que se dibuja fijo en la pantalla (HUD, cielo, niebla, oscuridad) está pensado para zoom 2.
// Cuando la cámara se aleja, se agranda solo al dibujar para que siga cubriendo toda la pantalla.
function compensarZoom(scene) {
    const cam = scene.cameras.main;
    const k = ZOOM / cam.zoom;
    scene.objetosCompensados = [];
    if (Math.abs(k - 1) < 0.001) return;
    // solo los fijos en pantalla (lista guardada: no se recorre todo el nivel en cada fotograma)
    fijosEnPantalla(scene).forEach(o => {
        if (!o.scene) return; // ya destruido
        scene.objetosCompensados.push([o, o.x, o.y, o.scaleX, o.scaleY]);
        o.x *= k; o.y *= k;
        o.setScale(o.scaleX * k, o.scaleY * k);
    });
}
function quitarCompensacion(scene) {
    (scene.objetosCompensados || []).forEach(([o, x, y, sx, sy]) => { o.x = x; o.y = y; o.setScale(sx, sy); });
    scene.objetosCompensados = [];
}

// pixel art nítido: cada píxel se dibuja como un bloque limpio, sin desenfoque
const PIXEL_ART = /^(arquera|espadachin|mago|hechicera|caballera|mosquetera|hielo|esqueleto|planta|espiritu|bola|mz_|coins|misterio|vacio|ladrillo|bloque_duro|flecha_pj|onda|magia|mastil|bandera|suelo|piso|door|arbol|arbusto|indicacion|lava|malo|cloud)/;
function pixelArtNitido(scene) {
    scene.textures.getTextureKeys().forEach(k => {
        if (PIXEL_ART.test(k) && !k.startsWith('mz_fondo')) scene.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
    });
}

function prepararAnimaciones(scene) {
    crearArteOriginal(scene); // antes de las animaciones: el bloque rúnico y la bola de fuego se animan
    pixelArtNitido(scene);
    if (!scene.anims.exists('enemy-walk')) createAnimations(scene);
    crearAnimacionesPersonajes(scene);
    crearAnimacionesEnemigos(scene);
    crearAnimacionesMazmorra(scene);
    crearAnimacionesEscudo(scene);
    crearAnimacionesJefes(scene);
    crearTexturas(scene);
}

// ---------- Pantalla de selección de personaje ----------
// Como en los juegos de celular:
//   arriba: ⌂ inicio y tu perfil (nivel y barra de XP) a la izquierda, el título al medio, Amigos y la
//           Tienda (con tus monedas) a la derecha
//   izquierda: el héroe marcado GRANDE (con su color de fondo y su nombre gigante detrás) y una flecha
//              a cada lado para cambiarlo
//   derecha: sus datos y, al pie, 🎨 personalizar junto a "Jugar con ..."
//   abajo: todos los héroes en miniatura
// Botones de al menos 34 px de alto (se tocan con el dedo); en el celular no se muestran las teclas.
// "Elige tu héroe" al estilo de la selección de operador de los shooters: la LISTA de héroes a la
// izquierda, el héroe GRANDE al centro con un haz de luz y anillos a sus pies, y a la derecha el nombre
// enorme, sus ESTADÍSTICAS en barras, sus habilidades y el botón "DESPLEGAR"
const HEROE = { x: 318, pie: 306, escala: 3.1 };
const LISTA = { x: 14, y: 56, w: 150, h: 29, paso: 31 };
const PANEL = { x: 484, y: 56, w: 292, h: 276 };
const ESTADISTICAS = ['VELOCIDAD', 'SALTO', 'ALCANCE', 'DEFENSA'];
// de 0 a 1, según cómo es cada héroe (personajes.js)
function estadisticasDe(pj) {
    const h = Object.values(pj.habilidades);
    const lejos = h.filter(x => x.tipo === 'proyectil' || x.tipo === 'rayo').length;
    const defensa = h.filter(x => ['escudo', 'voltereta', 'embestida'].includes(x.tipo)).length + (pj.id === 'espadachin' ? 1 : 0);
    const c = v => Phaser.Math.Clamp(v, 0.15, 1);
    return [c(((pj.velocidad ?? 1) - 0.9) / 0.32), c(((pj.salto ?? 480) - 450) / 100 + (pj.dobleSalto ? 0.3 : 0)), c(0.25 + lejos * 0.35), c(0.3 + defensa * 0.3)];
}
// símbolos de las habilidades en el celular (los mismos de los botones táctiles: tactil.js)
const SIMBOLO_HAB = { espacio: '⚔', x: '✦', c: '❖' };

// botón redondeado de esta pantalla: fondo, texto y zona para tocar; se ilumina con el mouse encima
function botonSel(scene, { x, y, w, h, texto, tam = 12, color = '#eef1f7', fondo = 0xffffff, alfa = 0.1, borde = 0xffffff, alfaBorde = 0.16, alTocar }) {
    const g = scene.add.graphics().setDepth(5);
    const pintar = encima => g.clear().fillStyle(fondo, encima ? Math.min(1, alfa + 0.12) : alfa).fillRoundedRect(x, y, w, h, 11)
        .lineStyle(1, borde, alfaBorde).strokeRoundedRect(x, y, w, h, 11);
    pintar(false);
    const t = scene.add.text(x + w / 2, y + h / 2, texto, { fontSize: `${tam}px`, fontStyle: '700', color }).setOrigin(0.5).setDepth(6);
    const z = scene.add.zone(x + w / 2, y + h / 2, w, h).setDepth(7).setInteractive({ useHandCursor: true });
    z.on('pointerover', () => pintar(true));
    z.on('pointerout', () => pintar(false));
    z.on('pointerdown', () => { if (!scene.tiendaAbierta) alTocar(); });
    return { texto: t };
}

const reducirMovimientoSel = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function crearSeleccion() {
    prepararAnimaciones(this);
    this.cameras.main.setOrigin(0).setZoom(ZOOM);
    resplandor(this);

    // fondo: la portada del juego a pantalla completa, oscurecida (el héroe y el panel resaltan encima),
    // con un velo que se oscurece hacia los bordes y estrellas; sin la portada, el degradado de antes
    this.add.graphics().fillGradientStyle(0x141b38, 0x141b38, 0x05060c, 0x05060c, 1).fillRect(0, 0, VISTA.width, VISTA.height);
    if (this.textures.exists('portada')) {
        const img = this.add.image(VISTA.width / 2, VISTA.height / 2, 'portada').setTint(0x6a74a0).setAlpha(0.55);
        const esc = Math.max(VISTA.width / img.width, VISTA.height / img.height) * 1.08;
        img.setScale(esc);
        if (!reducirMovimientoSel()) this.tweens.add({ targets: img, scale: esc * 1.05, yoyo: true, repeat: -1, duration: 14000, ease: 'Sine.inOut' });
        this.add.graphics().fillGradientStyle(0x05060c, 0x05060c, 0x05060c, 0x05060c, 0.55, 0.55, 0.9, 0.9).fillRect(0, 0, VISTA.width, VISTA.height);
    } else {
        this.add.image(VISTA.width - 120, VISTA.height + 10, 'castillo_28').setOrigin(0.5, 1).setScale(0.5).setTint(0x161b30).setAlpha(0.8);
    }
    for (let i = 0; i < 50; i++) {
        this.add.circle(Phaser.Math.Between(0, VISTA.width), Phaser.Math.Between(0, 220), Math.random() < 0.15 ? 1.1 : 0.6, 0xdfe4ff, Phaser.Math.FloatBetween(0.2, 0.7));
    }
    crearNieblaSeleccion(this);
    this.nieblaAlta.setDepth(1).setTint(0x8b9cff).setAlpha(0.15); // niebla lavanda (antes verde)
    this.nieblaBaja.setTint(0x8b9cff).setAlpha(0.22);

    // ---- barra de arriba ----
    this.add.text(VISTA.width / 2, 22, 'S E L E C C I O N A   T U   H É R O E', { fontSize: '11px', fill: '#ffffff', fontStyle: '700' }).setOrigin(0.5).setDepth(5);
    this.add.graphics().setDepth(5).lineStyle(1, 0x9fc0ff, 0.5).lineBetween(VISTA.width / 2 - 120, 34, VISTA.width / 2 + 120, 34)
        .fillStyle(0x9fc0ff, 1).fillRect(VISTA.width / 2 - 3, 32, 6, 4);
    botonSel(this, { x: 14, y: 10, w: 36, h: 34, texto: '⌂', tam: 16, alTocar: () => this.scene.start('titulo') });
    // tu perfil: nivel (progreso.js) y barra de experiencia
    const pr = progresoJugador();
    this.add.graphics().setDepth(5).fillStyle(0x0d1220, 0.75).fillRoundedRect(58, 10, 170, 34, 17)
        .lineStyle(1, 0xffffff, 0.12).strokeRoundedRect(58, 10, 170, 34, 17)
        .fillStyle(0x6f82ff, 1).fillCircle(75, 27, 13)
        .fillStyle(0xffffff, 0.12).fillRoundedRect(96, 30, 120, 6, 3)
        .fillStyle(0xffd27a, 1).fillRoundedRect(96, 30, Math.max(6, 120 * Math.min(1, pr.xp / Math.max(1, pr.falta))), 6, 3);
    this.add.text(75, 27, String(pr.nivel), { fontSize: pr.nivel > 99 ? '9px' : '11px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5).setDepth(6);
    this.add.text(96, 20, textoNivel(pr.nivel), { fontSize: '10px', fontStyle: '700', color: '#ffd27a' }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(216, 20, `${pr.xp}/${pr.falta} XP`, { fontSize: '8px', color: '#9aa3bf' }).setOrigin(1, 0.5).setDepth(6);
    // tu título (hitos.js) y lo que falta para el próximo hito
    const titulo = tituloActual(), prox = proximoHito(nivelMaximo());
    const lineaHito = [titulo ? `${titulo.icono} ${titulo.titulo}` : '', prox ? `🏆 próximo hito: nivel ${prox.nivel} (faltan ${prox.nivel - nivelMaximo()})` : '👑 ¡todos los hitos!'].filter(Boolean).join('  ·  ');
    this.add.text(LISTA.x + 76, LISTA.y - 8, lineaHito, { fontSize: '8px', color: '#ffd27a', fontStyle: '700' }).setOrigin(0, 0.5).setDepth(6);

    // si hay partida guardada, se elige el personaje con el que se venía jugando
    this.partida = leerPartida();
    if (this.partida && this.partida.nivel === 0 && !this.partida.score) this.partida = null; // nada que continuar
    if (this.partida) personajeId = this.partida.personaje || personajeId;
    this.indiceSel = Math.max(0, PERSONAJES.findIndex(pj => pj.id === personajeId));

    // escenario del héroe: luz de su color, nombre gigante detrás, sombra y aro de luz en el piso
    const e = this.escenario = {};
    e.luz = this.add.image(HEROE.x, HEROE.pie - 110, 'resplandor').setScale(3.6).setAlpha(0.3).setBlendMode('ADD').setDepth(2);
    e.marca = this.add.text(HEROE.x, HEROE.pie - 120, '', { fontSize: '96px', fontStyle: '700', color: '#ffffff' })
        .setOrigin(0.5).setAlpha(0.05).setDepth(2);
    e.piso = this.add.image(HEROE.x, HEROE.pie, 'resplandor').setScale(1.9, 0.35).setAlpha(0.5).setBlendMode('ADD').setDepth(3);
    e.sombra = this.add.ellipse(HEROE.x, HEROE.pie, 110, 16, 0x000000, 0.45).setDepth(3);
    // un haz de luz desde arriba y dos anillos a sus pies (del color del héroe: marcarSeleccion)
    e.haz = this.add.graphics().setDepth(1.9).setBlendMode('ADD');
    e.anillos = this.add.graphics().setDepth(3.1);
    if (!reducirMovimientoSel()) this.tweens.add({ targets: e.anillos, alpha: 0.45, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' });
    e.sprite = this.add.sprite(HEROE.x, HEROE.pie + 4, `${animSel(this, PERSONAJES[this.indiceSel])}-idle`).setOrigin(0.5, 1)
        .setScale(HEROE.escala / resDe(PERSONAJES[this.indiceSel])).setDepth(4).setInteractive({ useHandCursor: true });
    e.sprite.on('pointerdown', () => empezarJuego(this, true));
    // después de un ataque vuelve a quedarse quieto
    e.sprite.on('animationcomplete', anim => {
        if (!anim.key.endsWith('-idle')) e.sprite.anims.play(`${animSel(this, PERSONAJES[this.indiceSel])}-idle`, true);
    });
    // cada tanto el héroe hace un ataque, para lucirse
    this.time.addEvent({
        delay: 3200, loop: true, callback: () => {
            const pj = PERSONAJES[this.indiceSel];
            const lucirse = pj.hojas.atk1 ? 'atk1' : pj.hojas.slash ? 'slash' : null; // (los ángeles: tajo)
            if (lucirse) e.sprite.anims.play(`${animSel(this, pj)}-${lucirse}`, true);
        },
    });
    // (se cambia de héroe con la lista de la izquierda o con las flechas del teclado)

    // ---- datos del héroe (derecha): panel de vidrio con la esquina cortada y una franja de su color ----
    const P = PANEL, tactil = esTactil();
    const C = 18; // la esquina cortada (arriba a la derecha)
    this.add.graphics().setDepth(4).fillStyle(0x060913, 0.86)
        .fillPoints([{ x: P.x, y: P.y }, { x: P.x + P.w - C, y: P.y }, { x: P.x + P.w, y: P.y + C }, { x: P.x + P.w, y: P.y + P.h }, { x: P.x, y: P.y + P.h }], true)
        .lineStyle(1, 0x9fc0ff, 0.35)
        .strokePoints([{ x: P.x, y: P.y }, { x: P.x + P.w - C, y: P.y }, { x: P.x + P.w, y: P.y + C }, { x: P.x + P.w, y: P.y + P.h }, { x: P.x, y: P.y + P.h }], true);
    this.franjaSel = this.add.graphics().setDepth(4.5);
    const X = P.x + 18;
    this.detalle = {
        nombre: this.add.text(X, P.y + 26, '', { fontSize: '30px', fontStyle: '700' }).setOrigin(0, 0.5).setDepth(5),
        titulo: this.add.text(X, P.y + 52, '', { fontSize: '10px', color: '#9aa3bf', fontStyle: '600' }).setOrigin(0, 0.5).setDepth(5),
        pasiva: this.add.text(X, P.y + 72, '', { fontSize: '10px', color: '#eef1f7', backgroundColor: 'rgba(255, 255, 255, 0.07)', padding: { x: 7, y: 3 } })
            .setOrigin(0, 0.5).setDepth(5),
        frase: this.add.text(0, 0, '').setVisible(false),
        // estadísticas: nombre y barra (las barras se pintan en marcarSeleccion)
        estad: ESTADISTICAS.map((n, i) => this.add.text(X, P.y + 94 + i * 14, n, { fontSize: '8px', color: '#8a93b0', fontStyle: '700' }).setOrigin(0, 0.5).setDepth(5)),
        barras: this.add.graphics().setDepth(5),
        // habilidades: en la PC su tecla; en el celular el símbolo de su botón
        teclas: ['espacio', 'x', 'c'].map((k, i) => this.add.text(X, P.y + 160 + i * 19, tactil ? SIMBOLO_HAB[k] : k === 'espacio' ? 'ESPACIO' : k.toUpperCase(), {
            fontSize: tactil ? '11px' : '8px', fontStyle: '700', color: '#c9d0e6', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: { x: tactil ? 6 : 5, y: 2 },
        }).setOrigin(0, 0.5).setDepth(5)),
        poderes: [0, 1, 2].map(i => this.add.text(X + (tactil ? 32 : 64), P.y + 160 + i * 19, '', { fontSize: '11px', color: '#eef1f7' })
            .setOrigin(0, 0.5).setDepth(5)),
    };

    // al pie del panel: 🎨 personalizar (vestidor) y el botón para jugar, del color del héroe (marcarSeleccion)
    const pie = P.y + P.h - 48;
    botonSel(this, { x: X, y: pie, w: 40, h: 36, texto: '🎨', tam: 16, alTocar: () => this.abrirVestidorSel() });
    const B = { x: X + 48, y: pie, w: P.w - 36 - 48, h: 36 };
    this.botonElegir = {
        ...B,
        fondo: this.add.graphics().setDepth(5),
        texto: this.add.text(B.x + B.w / 2, B.y + B.h / 2, '', { fontSize: '13px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5).setDepth(6),
        encima: false,
    };
    const zonaElegir = this.add.zone(B.x + B.w / 2, B.y + B.h / 2, B.w, B.h).setDepth(7).setInteractive({ useHandCursor: true });
    zonaElegir.on('pointerover', () => { this.botonElegir.encima = true; pintarBotonElegir(this); });
    zonaElegir.on('pointerout', () => { this.botonElegir.encima = false; pintarBotonElegir(this); });
    zonaElegir.on('pointerdown', () => { if (!this.tiendaAbierta) empezarJuego(this, true); });

    // ---- la lista de héroes (izquierda): cada fila con su retrato, nombre y clase ----
    this.add.text(LISTA.x + 2, LISTA.y - 8, `HÉROES · ${PERSONAJES.length}`, { fontSize: '8px', color: '#8a93b0', fontStyle: '700' }).setOrigin(0, 0.5).setDepth(5);
    this.tarjetas = PERSONAJES.map((pj, i) => {
        const y = LISTA.y + i * LISTA.paso;
        const fondo = this.add.graphics().setDepth(5);
        // (retrato: el personaje recortado a la altura de la fila)
        const sprite = this.add.sprite(LISTA.x + 20, y + LISTA.h + 7, `${animSel(this, pj)}-idle`).setOrigin(0.5, 1).setScale(0.36 / resDe(pj)).setDepth(6);
        sprite.setCrop(0, 0, sprite.width, sprite.height - 30 * resDe(pj));
        const nombre = this.add.text(LISTA.x + 40, y + 10, pj.nombre.toUpperCase(), { fontSize: '10px', fontStyle: '700', color: '#eef1f7' }).setOrigin(0, 0.5).setDepth(6);
        const sub = this.add.text(LISTA.x + 40, y + 21, pj.titulo, { fontSize: '8px', color: '#8a93b0' }).setOrigin(0, 0.5).setDepth(6);
        const zona = this.add.zone(LISTA.x + LISTA.w / 2, y + LISTA.h / 2, LISTA.w, LISTA.h).setDepth(7).setInteractive({ useHandCursor: true });
        zona.on('pointerdown', () => {
            if (this.tiendaAbierta) return;
            if (this.indiceSel === i) empezarJuego(this, true);
            else { this.indiceSel = i; marcarSeleccion(this); this.sound.play('menu_mover', { volume: 0.5 }); }
        });
        return { fondo, y, sprite, nombre, sub, pj };
    });

    if (this.partida) {
        // partida guardada: dónde sigue y, a la derecha, empezar de cero (pide un segundo toque para confirmar)
        const n = this.partida.nivel;
        // (cortado si es largo: que no llegue al botón de la derecha)
        const lugar = `💾 Nivel ${n + 1}: ${nivelPorIndice(n).nombre}`;
        this.add.text(X, pie - 14, lugar.length > 28 ? `${lugar.slice(0, 27)}…` : lugar, { fontSize: '9px', color: '#9aa3bf' }).setOrigin(0, 0.5).setDepth(5);
        const boton = this.add.text(P.x + P.w - 18, pie - 14, '↺ De cero', {
            fontSize: '9px', fontStyle: '600', color: '#ff8a94', backgroundColor: 'rgba(255, 107, 120, 0.14)', padding: { x: 8, y: 4 },
        }).setOrigin(1, 0.5).setDepth(5).setInteractive({ useHandCursor: true });
        let confirmar = false;
        boton.on('pointerdown', () => {
            if (this.tiendaAbierta) return;
            if (!confirmar) {
                confirmar = true;
                boton.setText('¿Seguro? Otra vez').setBackgroundColor('rgba(255, 107, 120, 0.32)');
                this.sound.play('vacio', { volume: 0.5 });
                this.time.delayedCall(3000, () => {
                    if (boton.active) { confirmar = false; boton.setText('↺ De cero').setBackgroundColor('rgba(255, 107, 120, 0.14)'); }
                });
            } else {
                empezarJuego(this, false);
            }
        });
    }
    // ayuda de teclado (solo en la PC)
    if (!tactil) {
        const ayuda = this.partida
            ? `↑ ↓ elegir  ·  Enter: continuar en el nivel ${this.partida.nivel + 1}  ·  N: nueva partida  ·  V: personalizar  ·  T: tienda  ·  M: mundos`
            : '↑ ↓ elegir  ·  Enter: desplegar  ·  V: personalizar  ·  T: tienda  ·  M: mundos';
        this.add.text(VISTA.width / 2, 371, ayuda, { fontSize: '8px', color: '#6c7591' }).setOrigin(0.5).setDepth(5);
    }

    // ---- amigos y tienda (arriba a la derecha) ----
    const tienda = botonSel(this, {
        x: VISTA.width - 14 - 124, y: 10, w: 124, h: 34, texto: `◉ ${saldo()}  Tienda`, color: '#ffd27a',
        fondo: 0xffd27a, alfa: 0.14, borde: 0xffd27a, alfaBorde: 0.45, alTocar: () => this.abrirTiendaSel(),
    });
    botonSel(this, { x: VISTA.width - 14 - 124 - 8 - 104, y: 10, w: 104, h: 34, texto: '👥 Amigos', alTocar: () => abrirSala() });

    // vestidor: colores de la ropa, el pelo y los ojos del héroe marcado (botón 🎨 o tecla V)
    this.abrirVestidorSel = () => {
        if (this.tiendaAbierta) return;
        this.tiendaAbierta = true; // (bloquea las teclas igual que la tienda)
        abrirVestidor(PERSONAJES[this.indiceSel].id, () => {
            this.tiendaAbierta = false;
            this.tarjetas.forEach(t => t.sprite.setTexture(`${animSel(this, t.pj)}-idle`, 0));
            marcarSeleccion(this, true);
        });
    };
    // tienda (botón de arriba a la derecha o tecla T)
    this.abrirTiendaSel = () => {
        if (this.tiendaAbierta) return;
        this.tiendaAbierta = true;
        abrirTienda(() => {
            this.tiendaAbierta = false;
            tienda.texto.setText(`◉ ${saldo()}  Tienda`);
            marcarSeleccion(this, true); // (la cantidad de corazones puede haber cambiado)
        });
    };
    this.teclasSel = this.input.keyboard.addKeys({ izq: 'LEFT', der: 'RIGHT', enter: 'ENTER', espacio: 'SPACE', nueva: 'N', tienda: 'T', vestir: 'V', mapa: 'M', arriba: 'UP', abajo: 'DOWN' });
    marcarSeleccion(this, true);
}

const colorTexto = pj => '#' + pj.color.toString(16).padStart(6, '0');
// prefijo de animaciones del héroe con los colores del vestidor (arma la variante si hace falta)
const animSel = (scene, pj) => prepararVariante(scene, animDe(pj));

// brillo radial suave (propio de estas pantallas: no depende de que se haya creado el de los niveles)
function resplandor(scene) {
    if (scene.textures.exists('resplandor')) return;
    const t = scene.textures.createCanvas('resplandor', 128, 128), ctx = t.getContext();
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    t.refresh();
}

function marcarSeleccion(scene, inicio = false) {
    const pj = PERSONAJES[scene.indiceSel], h = pj.habilidades, d = scene.detalle, e = scene.escenario;
    // la lista: el elegido, con una franja de su color a la izquierda y la fila inclinada que sobresale
    scene.tarjetas.forEach((t, i) => {
        const elegido = i === scene.indiceSel, L = LISTA, extra = elegido ? 8 : 0;
        t.fondo.clear()
            .fillStyle(elegido ? t.pj.color : 0x0a0e1c, elegido ? 0.28 : 0.62)
            .fillPoints([{ x: L.x, y: t.y }, { x: L.x + L.w + extra, y: t.y }, { x: L.x + L.w + extra - 8, y: t.y + L.h }, { x: L.x, y: t.y + L.h }], true)
            .lineStyle(1, elegido ? t.pj.color : 0xffffff, elegido ? 0.9 : 0.08)
            .strokePoints([{ x: L.x, y: t.y }, { x: L.x + L.w + extra, y: t.y }, { x: L.x + L.w + extra - 8, y: t.y + L.h }, { x: L.x, y: t.y + L.h }], true);
        if (elegido) t.fondo.fillStyle(t.pj.color, 1).fillRect(L.x, t.y, 3, L.h);
        t.sprite.setAlpha(elegido ? 1 : 0.5);
        t.nombre.setColor(elegido ? '#ffffff' : '#aab2cc');
    });
    // el haz de luz y los anillos del color del héroe
    e.haz.clear().fillGradientStyle(pj.color, pj.color, pj.color, pj.color, 0, 0, 0.22, 0.22).fillRect(HEROE.x - 70, 40, 140, HEROE.pie - 40);
    e.anillos.clear().lineStyle(2, pj.color, 0.8).strokeEllipse(HEROE.x, HEROE.pie, 150, 24)
        .lineStyle(1, pj.color, 0.4).strokeEllipse(HEROE.x, HEROE.pie, 210, 34);
    // la franja del panel y las barras de estadísticas
    scene.franjaSel.clear().fillStyle(pj.color, 1).fillRect(PANEL.x, PANEL.y, 4, PANEL.h);
    const X0 = PANEL.x + 18 + 70, W = PANEL.w - 18 - 70 - 22;
    d.barras.clear();
    estadisticasDe(pj).forEach((v, i) => {
        const y = PANEL.y + 94 + i * 14 - 3;
        d.barras.fillStyle(0xffffff, 0.1).fillRect(X0, y, W, 6);
        for (let k = 0; k < 10; k++) if (k / 10 < v) d.barras.fillStyle(pj.color, 1).fillRect(X0 + k * W / 10, y, W / 10 - 2, 6);
    });
    // héroe grande: entra con un salto y se queda quieto
    e.sprite.anims.play(`${animSel(scene, pj)}-${inicio ? 'idle' : 'jump'}`, true);
    e.sprite.setScale(HEROE.escala / resDe(pj));
    e.luz.setTint(pj.color);
    e.piso.setTint(pj.color);
    e.marca.setText(pj.nombre.toUpperCase());
    if (!inicio && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
        scene.tweens.killTweensOf([e.sprite, e.marca]);
        const escala = HEROE.escala / resDe(pj);
        e.sprite.setAlpha(0.3).setScale(escala * 0.92);
        scene.tweens.add({ targets: e.sprite, alpha: 1, scale: escala, duration: 260, ease: 'Back.out' });
        e.marca.setAlpha(0);
        scene.tweens.add({ targets: e.marca, alpha: 0.05, duration: 400 });
    }
    d.nombre.setText(pj.nombre.toUpperCase()).setColor(colorTexto(pj));
    // maestría del héroe (progreso.js): estrellas y, al máximo, su título
    const m = maestria(pj.id);
    d.titulo.setText(`${(tituloHeroe(pj.id) || pj.titulo).toUpperCase()}  ·  ⭐ MAESTRÍA ${m}${m >= MAESTRIA_MAX ? ' (MÁX.)' : ''}`);
    d.pasiva.setText(`★ ${pj.pasiva}`);
    d.frase.setText(`"${pj.frase}"`);
    const mejorado = personajeConMejoras(pj).habilidades;
    ['espacio', 'x', 'c'].forEach((k, i) => d.poderes[i].setText(`${h[k].nombre}${mejorado[k].mejorada ? '  ✦ mejorada' : ''}`));
    pintarBotonElegir(scene);
}

// botón "Jugar con ..." del color del héroe marcado (más claro con el mouse encima)
function pintarBotonElegir(scene) {
    const b = scene.botonElegir, pj = PERSONAJES[scene.indiceSel];
    const color = b.encima ? Phaser.Display.Color.ValueToColor(pj.color).lighten(12).color : pj.color;
    const pts = [{ x: b.x + 10, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x + b.w - 10, y: b.y + b.h }, { x: b.x, y: b.y + b.h }];
    b.fondo.clear().fillStyle(color, 1).fillPoints(pts, true).lineStyle(1, 0xffffff, b.encima ? 0.8 : 0.35).strokePoints(pts, true);
    b.texto.setText(scene.partida ? `CONTINUAR · NIVEL ${scene.partida.nivel + 1}  ▶` : 'DESPLEGAR  ▶');
}

function actualizarSeleccion(time) {
    moverNieblaSeleccion(this, time);
    const k = this.teclasSel, JD = Phaser.Input.Keyboard.JustDown;
    if (this.tiendaAbierta) return; // con la tienda abierta, las teclas son de la tienda
    if (JD(k.tienda)) { this.abrirTiendaSel(); return; }
    if (JD(k.vestir)) { this.abrirVestidorSel(); return; }
    if (JD(k.arriba)) { this.indiceSel = (this.indiceSel + PERSONAJES.length - 1) % PERSONAJES.length; marcarSeleccion(this); this.sound.play('menu_mover', { volume: 0.5 }); }
    if (JD(k.abajo)) { this.indiceSel = (this.indiceSel + 1) % PERSONAJES.length; marcarSeleccion(this); this.sound.play('menu_mover', { volume: 0.5 }); }
    if (JD(k.izq)) { this.indiceSel = (this.indiceSel + PERSONAJES.length - 1) % PERSONAJES.length; marcarSeleccion(this); this.sound.play('menu_mover', { volume: 0.5 }); }
    if (JD(k.der)) { this.indiceSel = (this.indiceSel + 1) % PERSONAJES.length; marcarSeleccion(this); this.sound.play('menu_mover', { volume: 0.5 }); }
    if (JD(k.enter) || JD(k.espacio)) empezarJuego(this, true);
    if (JD(k.nueva) && this.partida) empezarJuego(this, false);
    if (JD(k.mapa) && !mapaAbierto()) { personajeId = PERSONAJES[this.indiceSel].id; abrirMapa({}); } // (mapa de mundos)
}

// continuar = true: sigue en el nivel guardado (si hay); false: partida nueva desde el nivel 1
function empezarJuego(scene, continuar = true) {
    personajeId = PERSONAJES[scene.indiceSel].id;
    scene.sound.play('menu_ok', { volume: 0.6 });
    const partida = continuar ? leerPartida() : null;
    if (partida) continuarPartida(partida);
    else {
        borrarPartida();
        reiniciarPartida();
    }
    scene.scene.start('juego');
}

// ATAJO DE DESARROLLO: abre el juego con ?nivel=N (1 = el primero) y entra directo a ese nivel, sin
// título, historia ni elegir personaje. ?personaje=mago elige con quién. Solo funciona en tu computadora
// (localhost / 127.0.0.1 / archivo): en itch.io o en el celular no hace nada.
function atajoDesarrollo(scene) {
    let q;
    try { q = new URLSearchParams(location.search); } catch (_e) { return false; }
    const local = ['localhost', '127.0.0.1', ''].includes(location.hostname);
    const n = Number(q.get('nivel'));
    if (!local || !Number.isInteger(n) || n < 1) return false;
    reiniciarPartida();
    nivelActual = Phaser.Math.Clamp(n - 1, 0, TOTAL_NIVELES - 1);
    const pj = q.get('personaje');
    if (PERSONAJES.some(p => p.id === pj)) personajeId = pj;
    console.info(`[desarrollo] directo al nivel ${nivelActual + 1}: ${nivelPorIndice(nivelActual).nombre} (${personajeId})`);
    scene.scene.start('juego');
    return true;
}

function reiniciarPartida() {
    reiniciarMinas(); reiniciarMisiones(); reiniciarMonedasNivel();
    vidaJefeGuardada = null;
    vidas = VIDAS_INICIALES = vidasTotales();
    runaNivel = -1;
    nivelActual = 0;
    score = 0;
    scoreInicioNivel = 0;
    checkpointX = null;
    muertes = 0;
}

// ---------- Partida guardada (en el navegador, sobrevive a cerrar la página) ----------
const CLAVE_GUARDADO = 'monhabell-aventura-partida';

function guardarPartida() {
    try {
        localStorage.setItem(CLAVE_GUARDADO, JSON.stringify({ nivel: nivelActual, score: scoreInicioNivel, personaje: personajeId, muertes }));
    } catch (_e) { /* sin almacenamiento disponible: se juega igual, sin guardar */ }
}

function leerPartida() {
    try {
        const p = JSON.parse(localStorage.getItem(CLAVE_GUARDADO));
        if (p && Number.isInteger(p.nivel) && p.nivel >= 0 && p.nivel < TOTAL_NIVELES) return p;
    } catch (_e) { /* guardado dañado o no disponible */ }
    return null;
}

function borrarPartida() {
    try { localStorage.removeItem(CLAVE_GUARDADO); } catch (_e) { /* nada que borrar */ }
}

// sigue desde el comienzo del nivel guardado, con las vidas llenas
function continuarPartida(p) {
    reiniciarMinas(); reiniciarMisiones(); reiniciarMonedasNivel();
    vidaJefeGuardada = null;
    vidas = VIDAS_INICIALES = vidasTotales();
    runaNivel = -1;
    nivelActual = p.nivel;
    score = p.score || 0;
    scoreInicioNivel = score;
    checkpointX = null;
    muertes = p.muertes || 0;
}

// texturas dibujadas con código (no hay imágenes para estas)
function crearTexturas(scene) {
    if (scene.textures.exists('flecha')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // flecha apuntando a la derecha
    g.fillStyle(0x8b5a2b); g.fillRect(4, 3, 18, 2);
    g.fillStyle(0xe0e0e0); g.fillTriangle(22, 0, 28, 4, 22, 8);
    g.fillStyle(0xff4444); g.fillTriangle(0, 0, 7, 4, 0, 4); g.fillTriangle(0, 8, 7, 4, 0, 4);
    g.generateTexture('flecha', 28, 8);
    g.clear();

    // pinchos
    g.fillStyle(0xd0d0d0); g.lineStyle(1, 0x444444);
    for (let i = 0; i < 2; i++) {
        g.fillTriangle(i * 16, 16, i * 16 + 8, 0, i * 16 + 16, 16);
        g.strokeTriangle(i * 16, 16, i * 16 + 8, 0, i * 16 + 16, 16);
    }
    g.generateTexture('pincho', 32, 16);
    g.clear();

    // carcaj con flechas
    g.fillStyle(0x8b5a2b); g.fillRect(4, 0, 2, 10); g.fillRect(10, 0, 2, 10);
    g.fillStyle(0xff4444); g.fillRect(3, 0, 4, 3); g.fillRect(9, 0, 4, 3);
    g.fillStyle(0x7a3e12); g.fillRoundedRect(2, 8, 12, 18, 3);
    g.fillStyle(0xf2c14e); g.fillRect(2, 14, 12, 2);
    g.generateTexture('carcaj', 16, 26);
    g.clear();

    // corazón
    g.fillStyle(0xff2d55);
    g.fillCircle(4, 4, 4); g.fillCircle(12, 4, 4);
    g.fillTriangle(0, 5, 16, 5, 8, 14);
    g.fillStyle(0xffffff, 0.7); g.fillRect(3, 2, 2, 2);
    g.generateTexture('corazon', 16, 14);
    g.clear();

    // láser de los aliens
    g.fillStyle(0xd94dff); g.fillRect(0, 1, 22, 4);
    g.fillStyle(0xffffff); g.fillRect(4, 2, 14, 2);
    g.generateTexture('laser', 22, 6);
    g.destroy();
}

// ---------- Barra de vida del jugador (solo en la pelea con el jefe) ----------
function crearBarraSalud(scene) {
    if (scene.barraSalud) return;
    scene.barraSaludFondo = scene.add.rectangle(20, 60, 124, 12, 0x000000, 0.75).setOrigin(0, 0.5)
        .setStrokeStyle(2, 0xffffff).setScrollFactor(0).setDepth(50);
    scene.barraSalud = scene.add.rectangle(22, 60, 120, 8, 0x4ade80).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    scene.textoSalud = scene.add.text(150, 54, '', { fontSize: '11px', color: '#ffffff', stroke: '#000', strokeThickness: 3 })
        .setScrollFactor(0).setDepth(51);
    actualizarBarraSalud(scene);
}

function actualizarBarraSalud(scene) {
    if (!scene.barraSalud || !scene.barraSalud.active) return;
    const p = Phaser.Math.Clamp(scene.salud / SALUD_MAXIMA, 0, 1);
    scene.barraSalud.width = 120 * p;
    scene.barraSalud.setFillStyle(p > 0.5 ? 0x4ade80 : p > 0.25 ? 0xfacc15 : 0xef4444);
    scene.textoSalud.setText(`${Math.ceil(scene.salud)}`);
}

function recibirDaño(scene, daño) {
    mostrarDolor(scene);
    const g = scene.mascotaGesi;
    scene.salud = Math.max(0, scene.salud - Math.round(daño * (scene.dañoJefe || 1)));
    actualizarBarraSalud(scene);
    scene.tweens.add({ targets: [scene.barraSalud, scene.barraSaludFondo], scaleY: 1.6, yoyo: true, duration: 90 });
    scene.cameras.main.shake(160, 0.006);
    scene.sound.play('bump', { volume: 0.7 });
    // empujón y un momento sin recibir más daño
    const lado = scene.jefe?.sprite && g.body.center.x < scene.jefe.sprite.body.center.x ? -1 : 1;
    g.setVelocity(lado * 230, -220);
    scene.empujadoHasta = scene.time.now + EMPUJON_MS;
    g.setTintFill(0xff4444);
    scene.time.delayedCall(100, () => g.clearTint());
    scene.invulnerableHasta = scene.time.now + 700;
    scene.tweens.add({ targets: g, alpha: 0.3, yoyo: true, repeat: 4, duration: 90, onComplete: () => g.setAlpha(1) });
    if (scene.salud <= 0) {
        scene.invulnerableHasta = 0;
        killgesi(scene, 'sin_salud');
    }
}

function actualizarCorazones(scene) {
    scene.corazones.forEach((c, i) => {
        if (i < vidas) c.clearTint().setAlpha(1);
        else c.setTint(0x555555).setAlpha(0.5);
    });
}

function crearFondo(scene, nivel) {
    // cielo, luna, montañas, ruinas y niebla en capas (ver ambiente.js)
    crearFondoAtmosferico(scene, nivel, nivelActual);
}

// Primera parte del nivel 1, hecha a mano
function construirNivel1(scene) {
    // entrada en ruinas: torres y muros rotos, hongos que brillan y un cartel burlón
    const ruina = (x, clave, escala, voltear = false) =>
        scene.add.image(x, SUELO_Y + 8, clave).setOrigin(0.5, 1).setScale(escala).setFlipX(voltear).setTint(0x8a8798);
    ruina(215, 'torre_1_26', 0.42);
    ruina(330, 'muro_1_35', 0.5, true);
    ruina(720, 'muro_1_34', 0.5);
    ruina(905, 'torre_1_31', 0.4, true);
    [[560, 6], [610, 3], [980, 7], [1040, 4]].forEach(([x, n]) => {
        scene.add.image(x, SUELO_Y + 2, `mz_mushrum${n}`).setOrigin(0.5, 1).setScale(0.6).setTint(0xd8c9a0);
        scene.add.image(x, SUELO_Y - 14, 'brillo').setDepth(41).setScale(0.6).setTint(0xffd27a).setAlpha(0.2).setBlendMode('ADD');
    });
    scene.add.rectangle(150, 266, 4, 132, 0x4a3420);
    scene.add.text(150, 200, '¡BIENVENIDO! :)', {
        fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#ffe9a8',
        backgroundColor: '#3b2a1a', padding: { x: 6, y: 5 },
    }).setOrigin(0.5).setDepth(42);

    // Crear las piezas del piso
    scene.piso1 = scene.floor.create(0, VISTA.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();

    scene.piso2 = scene.floor.create(250, VISTA.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2);
    scene.piso3 = scene.floor.create(250, VISTA.height - 160, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    scene.piso3.setVisible(false);
    scene.piso4 = scene.floor.create(600, VISTA.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();
    scene.piso5 = scene.floor.create(850, VISTA.height - 16, 'suelo').setOrigin(0, 0.5).setScale(2).refreshBody();

    // Crear el muro con rotación y ajustar el tamaño del cuerpo de colisión
    scene.muro = scene.floor.create(1300, VISTA.height - 218, 'suelo')
        .setOrigin(0, 0.5)
        .setScale(4, 3)
        .setAngle(90) // Rota el sprite 90 grados
        .setSize(92, 450).setOffset(18, 15);

    // escalones para alcanzar la plataforma escondida (piso3) y piso6 sin hacer un salto perfecto
    [170, 202, 1000, 1032].forEach(x => {
        scene.floor.create(x, 280, 'mz_bloque').setOrigin(0, 0.5).refreshBody();
    });

    scene.piso6 = scene.floor.create(1090, VISTA.height - 155, 'suelo').setOrigin(0, 0.5).setScale(0.9, 2).refreshBody();

    // el piso de ladrillos se viste con roca de la mazmorra
    vestirSuelo(scene, scene.piso1, { izq: true });
    vestirSuelo(scene, scene.piso2, { der: true });
    vestirSuelo(scene, scene.piso3, { izq: true, der: true, flotante: true });
    scene.piso3.visuales.forEach(v => v.setVisible(false)); // plataforma escondida
    vestirSuelo(scene, scene.piso4, { izq: true });
    vestirSuelo(scene, scene.piso5, { der: true });
    vestirSuelo(scene, scene.piso6, { izq: true, der: true, flotante: true });
    vestirMuro(scene, scene.muro);

    scene.piso7 = scene.floor.create(1450, VISTA.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);
    scene.piso8 = scene.floor.create(1640, VISTA.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);
    scene.piso9 = scene.floor.create(1840, VISTA.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);
    scene.piso10 = scene.floor.create(2050, VISTA.height - 155, 'suelo2').setOrigin(0, 0.5).setScale(1).refreshBody().setSize(80, 60).setOffset(25, 35);

    const cantidadLava = 10;

    // Define la posición inicial de la primera lava
    const posicionXInicial = 1350;//1350

    // El ancho de cada bloque de lava (ajusta según tu imagen)
    const anchoLava = 94; // Por ejemplo, si cada imagen de lava mide 64 píxeles de ancho

    for (let i = 0; i < cantidadLava; i++) {
        // Crear cada bloque de lava en una posición consecutiva
        scene.lavaes.create(posicionXInicial + (i * anchoLava), VISTA.height - 200, 'lava').anims.play('lava_quema', true)
            .setOrigin(0, 0.5)
            .setScale(1.5)
            .setSize(60, 40).setOffset(1, 22)
    }

    // goteros del techo (solo decoración, las gotas se crean con los timers)
    // las gotas caen en los huecos entre plataformas (golpean en x + 31)
    [1579, 1979].forEach(x => {
        crearMuroGotero(scene, x);
        const gotero = scene.floor.create(x, VISTA.height - 370, 'lava_falling').setOrigin(0, 0.5).anims.play('lavacaer', true)
            .setScale(0.5).refreshBody()
            .setSize(20, 60).setOffset(55, 1);
        gotero.esGotero = true;
    });

    agregarCiclo(scene, 2400, () => crearGota(scene, 1579));
    agregarCiclo(scene, 2700, () => crearGota(scene, 1979));

    scene.time.addEvent({
        delay: 5000,    // 5000 ms = 5 segundos
        callback: crearzombis,
        callbackScope: scene,
        loop: true
    });

    // piso para lava
    const cantidadpiso3 = 15;
    const posicionInicialPiso3 = 1350;
    const anchopiso3 = 64;

    for (let i = 0; i < cantidadpiso3; i++) {
        scene.floor.create(posicionInicialPiso3 + (i * anchopiso3), VISTA.height - 10, 'suelo3').setOrigin(0, 0.5).setScale(1).refreshBody()
            .setSize(64, 40).setOffset(0, 18);
    }

    // Número de enemigos que quieres crear
    const numEnemies = 3; // Cambia este valor según lo que necesites

    for (let i = 0; i < numEnemies; i++) {
        crearEnemigo(scene, 690 + i * 80, VISTA.height - 250);
    }
}

// Construye un nivel a partir de los datos de niveles.js
function construirNivel(scene, nivel) {
    const s = scene.sufijo;

    // lava en los huecos (se dibuja antes que el suelo para quedar detrás)
    (nivel.lava || []).forEach(([x0, x1]) => crearLava(scene, x0, x1));

    // pinchos (los ocultos empiezan escondidos bajo el suelo)
    (nivel.pinchos || []).forEach(([x, n, oculto]) => {
        for (let i = 0; i < n; i++) {
            const img = scene.add.image(x + i * 32, oculto ? SUELO_Y + 18 : SUELO_Y, 'pincho').setOrigin(0, 1);
            scene.pinchos.push({ img, oculto, x: x + i * 32 });
        }
    });

    // suelo falso: igual al normal pero se derrumba al pisarlo (con lava debajo)
    (nivel.falsos || []).forEach(([x0, x1]) => {
        crearLava(scene, x0, x1);
        crearSuelo(scene, x0, x1, 'suelo' + s).forEach(t => { t.esFalso = true; });
    });

    (nivel.suelo || []).forEach(([x0, x1]) => crearSuelo(scene, x0, x1, 'suelo' + s));

    (nivel.bloques || []).forEach(([x, y, patron]) => {
        [...patron].forEach((tipo, i) => {
            const bx = x + i * 32;
            if (tipo === '?' || tipo === 'E') {
                const bloque = scene.floor.create(bx, y, 'misterio' + s).setOrigin(0, 0.5).setScale(2).refreshBody();
                bloque.anims.play(`misterio${s}-brillo`, true);
                bloque.esMisterio = true;
                bloque.sueltaEnemigo = tipo === 'E'; // '?' falso: sale un enemigo
            } else if (tipo === 'B') {
                scene.floor.create(bx, y, 'mz_bloque').setOrigin(0, 0.5).refreshBody();
            } else if (tipo === 'C') {
                // ladrillo que cae cuando Gesi pasa por debajo
                scene.cayentes.push(scene.floor.create(bx, y, 'mz_bloque').setOrigin(0, 0.5).refreshBody());
            } else if (tipo === 'H') {
                // bloque invisible
                scene.invisibles.create(bx, y, 'vacio' + s).setOrigin(0, 0.5).setScale(2).refreshBody().setVisible(false);
            } else if (tipo === 'F') {
                // ladrillo falso: se ve pero no tiene piso
                scene.add.image(bx, y, 'mz_bloque').setOrigin(0, 0.5);
            }
        });
    });

    // plataformas flotantes de roca (torres, puentes colgantes): [x, arriba, ancho]
    // (tipo 'rama': rama de madera del bosque que se dobla y se rompe, ver bosque.js)
    scene.ramas = [];
    (nivel.plataformas || []).forEach(([x, arriba, ancho, tipo]) => {
        if (tipo === 'rama') crearRama(scene, x, arriba, ancho);
        else if (tipo === 'tabla') crearTabla(scene, x, arriba, ancho); // (puente de madera del nivel 1, bosque.js)
        else if (tipo === 'oculta') {
            // solo la física: el dibujo lo pone el mapa (escalones y torres de las Criptas)
            const p = crearPlataforma(scene, x, arriba, ancho);
            p.esPlataforma = true;
            p.setVisible(false);
            p.visuales?.forEach(v => v.setVisible(false));
        } else crearPlataforma(scene, x, arriba, ancho).esPlataforma = true;
    });
    // piedras rúnicas doradas: al golpearlas desde abajo aparecen sus losas sobre el abismo.
    // Antes de activarlas, las losas se ven como contornos fantasma (la pista de que hay un camino)
    (nivel.runas || []).forEach(([x, y, losas]) => {
        const runa = scene.floor.create(x, y, 'misterio' + scene.sufijo).setOrigin(0, 0.5).setScale(2).refreshBody();
        runa.anims.play(`misterio${scene.sufijo}-brillo`, true);
        runa.setTint(0xffd27a);
        runa.esRuna = true;
        runa.brillo = scene.add.image(x + 16, y, 'brillo').setDepth(41).setScale(0.9).setTint(0xffd27a).setAlpha(0.4).setBlendMode('ADD');
        scene.tweens.add({ targets: runa.brillo, alpha: 0.15, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
        runa.losas = losas.map(([lx, arriba, ancho]) => {
            const losa = crearPlataforma(scene, lx, arriba, ancho);
            losa.body.enable = false;
            losa.visuales.forEach(v => v.setAlpha(0.22).setTint(0xffe9a8));
            return losa;
        });
    });

    // muros de roca maciza desde el suelo hasta 'arriba' (cortan el paso: hay que subir por encima)
    // (tipo 'tronco': el tronco del Árbol Anciano; se dibuja en bosque.js)
    (nivel.muros || []).forEach(([x, arriba, ancho, tipo]) => {
        const pieza = scene.floor.create(x, arriba, 'suelo' + scene.sufijo)
            .setOrigin(0, 0).setScale(ancho / 128, (SUELO_Y - arriba) / 32).refreshBody();
        if (tipo === 'tronco') pieza.setVisible(false);
        else vestirMuro(scene, pieza);
    });
    // losas: [x0, x1, arriba, grosor] pisos macizos a cualquier altura (los pisos de las Criptas);
    // solo la física: el dibujo lo pone el mapa
    (nivel.losas || []).forEach(([x0, x1, arriba, grosor]) => {
        scene.floor.create(x0, arriba, 'suelo' + scene.sufijo)
            .setOrigin(0, 0).setScale((x1 - x0) / 128, grosor / 32).refreshBody().setVisible(false);
    });
    // techos de túnel: roca maciza desde arriba hasta 'abajo' (queda poco espacio para saltar)
    (nivel.techos || []).forEach(([x0, x1, abajo]) => {
        const pieza = scene.floor.create(x0, -40, 'suelo' + scene.sufijo)
            .setOrigin(0, 0).setScale((x1 - x0) / 128, (abajo + 40) / 32).refreshBody();
        vestirTecho(scene, pieza);
    });
    // antorchas en las paredes (su luz se ve a través de la oscuridad)
    (nivel.antorchas || []).forEach(([x, y]) => crearAntorcha(scene, x, y));

    (nivel.escaleras || []).forEach(([x, altura]) => {
        for (let col = 0; col < altura; col++) {
            for (let f = 0; f <= col; f++) {
                scene.floor.create(x + col * 32, SUELO_Y - 16 - f * 32, 'mz_escalon')
                    .setOrigin(0, 0.5).refreshBody();
            }
        }
    });

    (nivel.moviles || []).forEach(([x, y, eje, recorrido, vel, tipo]) => {
        const plataforma = scene.moviles.create(x, y, 'mz_plataforma');
        // tronco que flota en la lava (nivel 1): mismo tamaño, otra textura
        if (tipo === 'tronco') { texturasBosque(scene); plataforma.setTexture('tronco_rio'); }
        if (tipo === 'carro') { texturasMinas(scene); plataforma.setTexture('min_carro'); } // (nivel 3: el carro de mina)
        plataforma.eje = eje;
        plataforma.vel = vel;
        if (eje === 'x') {
            plataforma.min = x;
            plataforma.max = x + recorrido;
            plataforma.setVelocityX(vel);
        } else {
            plataforma.min = y - recorrido;
            plataforma.max = y;
            plataforma.setVelocityY(-vel);
        }
    });

    // (si dos quedaron casi encima uno del otro, se salta el segundo: igual en todas las pantallas)
    const puestos = [];
    (nivel.enemigos || []).forEach(e => {
        const [x, y, tipo] = Array.isArray(e) ? e : [e, SUELO_Y - 2];
        if (puestos.some(px => Math.abs(px - x) < SEPARACION_NIVEL)) return;
        puestos.push(x);
        crearEnemigo(scene, x, y ?? SUELO_Y - 2, tipo);
    });
    // plantas disfrazadas de arbusto y espíritus de fuego voladores
    (nivel.plantas || []).forEach(x => crearEnemigo(scene, x, SUELO_Y - 2, 'planta'));
    (nivel.espiritus || []).forEach(([x, y]) => crearEnemigo(scene, x, y, 'espiritu'));

    (nivel.goteros || []).forEach(([x, delay]) => {
        crearMuroGotero(scene, x);
        scene.add.sprite(x, VISTA.height - 370, 'lava_falling').setOrigin(0, 0.5).setScale(0.5).anims.play('lavacaer', true);
        agregarCiclo(scene, delay, () => crearGota(scene, x));
    });

    // bolas de fuego que saltan de la lava
    (nivel.bolas || []).forEach(([x, delay]) => {
        const bola = scene.bolas.create(x, 400, 'bola').setScale(3).anims.play('bola-giro', true);
        bola.disableBody(true, true);
        agregarCiclo(scene, delay, () => {
            bola.enableBody(true, x, 372, true, true);
            bola.setVelocityY(-400);
            sonarCerca(scene, 'fuego', x, { volume: 0.2, rate: 0.8 });
        });
    });

    // emboscadas: al pasar por xAviso caen enemigos del cielo
    scene.emboscadas = (nivel.emboscadas || []).map(([xAviso, xs]) => ({ xAviso, xs, hecha: false }));

    (nivel.carcajes || []).forEach(([x, y]) => {
        const c = scene.carcajes.create(x, y, 'carcaj').setScale(1.3).refreshBody();
        scene.tweens.add({ targets: c, y: y - 6, yoyo: true, repeat: -1, duration: 600 });
    });

    // puntos de control: un mástil pequeño con bandera
    scene.checkpoints = (nivel.checkpoints || []).map(x => {
        const activo = checkpointX !== null && x <= checkpointX;
        return { x, activo, ...crearEstatua(scene, x, activo) };
    });

    // corazones (recuperan una vida) y cristales (tesoro de 500 puntos)
    (nivel.escudos || []).forEach(([x, y]) => soltarEscudo(scene, x, y, 0));
    (nivel.corazones || []).forEach(([x, y]) => {
        const c = scene.premios.create(x, y, 'mz_corazon').anims.play('mz_corazon', true).refreshBody();
        c.tipoPremio = 'corazon';
        scene.add.image(x, y, 'brillo').setDepth(41).setScale(0.8).setTint(0xff4d6d).setAlpha(0.35).setBlendMode('ADD');
    });
    (nivel.cristales || []).forEach(([x, y]) => {
        const c = scene.premios.create(x, y, 'mz_cristal').anims.play('mz_cristal', true).refreshBody();
        c.tipoPremio = 'cristal';
        scene.add.image(x, y, 'brillo').setDepth(41).setScale(0.8).setTint(0xc77dff).setAlpha(0.35).setBlendMode('ADD');
    });

    // meta: el Faro del Alba (columna con un cristal que se enciende al llegar) y el castillo
    // (la Noche del Troll no tiene: su meta es el Altar del Amanecer, ver troll.js)
    scene.zonaMeta = null;
    if (nivel.sinMeta) return;
    const mx = nivel.meta;
    scene.add.image(mx, SUELO_Y, 'mastil').setOrigin(0.5, 1);
    scene.bandera = scene.add.image(mx, SUELO_Y - 165, 'bandera').setOrigin(0.5, 1).setScale(2);
    crearCastilloMeta(scene, mx + 50, nivelActual, 0xb4b4bc);
    scene.zonaMeta = scene.add.zone(mx, SUELO_Y / 2, 24, SUELO_Y);
    scene.physics.add.existing(scene.zonaMeta, true);
}

function crearSuelo(scene, x0, x1, textura) {
    const piezas = Math.max(1, Math.round((x1 - x0) / 256));
    const ancho = (x1 - x0) / piezas;
    const tiles = [];
    for (let i = 0; i < piezas; i++) {
        const pieza = scene.floor.create(x0 + i * ancho, VISTA.height - 16, textura)
            .setOrigin(0, 0.5).setScale(ancho / 128, 2).refreshBody();
        vestirSuelo(scene, pieza, { izq: i === 0, der: i === piezas - 1 });
        tiles.push(pieza);
    }
    return tiles;
}

// plataforma flotante: 'arriba' es la altura donde se pisa (16 px de grosor físico)
function crearPlataforma(scene, x, arriba, ancho) {
    const pieza = scene.floor.create(x, arriba + 8, 'suelo' + scene.sufijo)
        .setOrigin(0, 0.5).setScale(ancho / 128, 0.5).refreshBody();
    vestirSuelo(scene, pieza, { izq: true, der: true, flotante: true });
    return pieza;
}

// remoto: lo activó otro jugador (en línea); no se vuelve a avisar
function activarCheckpoint(scene, cp, remoto = false) {
    cp.activo = true;
    if (!remoto) avisarCheckpoint(cp.x);
    checkpointX = Math.max(checkpointX ?? 0, cp.x);
    encenderEstatua(scene, cp);
    scene.sound.play('punto_control', { volume: 0.6 });
    mostrarMensaje(scene, scene.bolsa ? `¡PUNTO DE CONTROL!\n◉ ${scene.bolsa} monedas guardadas` : '¡PUNTO DE CONTROL!', 1200);
    guardarBolsa(scene);
}

// tipo: clave de ENEMIGOS; sin tipo se usa el siguiente de la mezcla del nivel
function crearEnemigo(scene, x, y, tipo) {
    tipo = tipo || scene.mezcla[scene.contEnemigos++ % scene.mezcla.length];
    if (!scene.textures.exists(`${tipo}-walk`)) tipo = scene.mezcla[0]; // (enemigo no cargado en este nivel)
    const def = ENEMIGOS[tipo];
    const inicial = def.tipo === 'planta' ? 'disfraz' : 'walk';
    const enemy = scene.enemies.create(x, y, `${tipo}-${inicial}`).anims.play(`${tipo}-${inicial}`, true)
        .setOrigin(0, 1)
        .setGravityY(300)
        .setScale(def.escala ?? 1);
    const [w, h, ox, oy] = def.cuerpo;
    enemy.body.setSize(w, h).setOffset(ox, oy);
    enemy.tipoId = tipo;
    enemy.def = def;
    // número de red: los del armado del nivel salen iguales en todas las pantallas; los que aparecen
    // después (trampas, zombis) los numera el anfitrión, que es quien los crea
    if (!scene.idsCerrados || (soyAnfitrion() && !scene.creandoReplica)) enemy.redId = scene.contIds++;
    if (soyReplica()) {
        hacerReplica(enemy); // en esta pantalla lo mueve el anfitrión
        if (scene.idsCerrados && !scene.creandoReplica) descartarEnemigo(scene, enemy);
    }
    enemy.vida = def.vida + (scene.vidaExtraEnemigos || 0); // (niveles muy altos: aguantan más golpes)
    enemy.velBase = scene.velEnemigos * def.vel;
    enemy.proxAtaque = scene.time.now + 800 + Math.random() * 800;
    enemy.atacandoHasta = 0;
    enemy.invulHasta = 0;

    if (def.tipo === 'planta') {
        enemy.body.setAllowGravity(false).setImmovable(true);
        enemy.body.pushable = false;
    } else if (def.tipo === 'volador') {
        enemy.body.setAllowGravity(false);
        enemy.fase = Math.random() * Math.PI * 2;
    }
    if (def.corre) enemy.anims.play(`${tipo}-run`, true);
    enemy.setVelocityX(-enemy.velBase);
    enemy.flipX = true; // los sprites miran a la derecha
    // si cae del cielo (emboscada, moneda trampa...), su sombra avisa dónde va a aterrizar
    // (un instante después: quien lo crea a veces lo recoloca, como la moneda trampa)
    // (y no cae amontonado: ver soltarDelCielo)
    if (y <= 0 && def.tipo !== 'volador' && !scene.creandoReplica) {
        enemy.esperando = true;
        enemy.body.enable = false;
        enemy.setVisible(false);
        enemy.esperaDesde = scene.time.now;
        scene.time.delayedCall(0, () => enemy.active && soltarDelCielo(scene, enemy, true));
    }
    return enemy;
}

// centro del cuerpo de un enemigo (el sprite tiene origen abajo a la izquierda)
const centroEnemigo = e => e.x + (e.def.cuerpo[2] + e.def.cuerpo[0] / 2) * (e.def.escala ?? 1);

// hay suelo donde aterrizar en x (no lava ni suelo falso)
function haySueloEn(scene, x) {
    return scene.floor.getChildren().some(p => {
        const b = p.body;
        return p.active && b && b.enable && !p.esFalso && !p.esCadena && !p.esGotero &&
            x > b.left + 10 && x < b.right - 10 && b.top >= 0 && b.top <= SUELO_Y + 4;
    });
}

// hay piso en x a la altura 'pie' (suelo, plataforma o muro; no lava ni suelo falso)
function pisoEn(scene, x, pie) {
    return scene.floor.getChildren().some(p => {
        const b = p.body;
        return p.active && b && b.enable && !p.esFalso && !p.esGotero && x > b.left && x < b.right && Math.abs(b.top - pie) < 8;
    }) || scene.moviles.getChildren().some(m => m.body && x > m.body.left && x < m.body.right && Math.abs(m.body.top - pie) < 10);
}

// Enemigo que cae del cielo: primero se corre si cae pegado a otro; después espera su turno
// (uno cada PAUSA_APARICIONES y no más de MAXIMO_CERCA a la vez cerca del jugador).
// Su sombra avisa dónde va a aterrizar.
function soltarDelCielo(scene, enemy, primeraVez) {
    if (!enemy.active || !enemy.esperando) return;
    const otros = scene.enemies.getChildren().filter(e => e !== enemy && e.active && !e.isDead && e.def);
    if (primeraVez) {
        // el lugar más cercano al pedido (quien lo crea ya lo recolocó) lejos de los demás
        const c = centroEnemigo(enemy);
        for (const d of [0, 40, -40, 80, -80, 120, -120, 160, -160, 200, -200, 240, -240]) {
            const libre = otros.every(o => Math.abs(centroEnemigo(o) - (c + d)) >= SEPARACION_ENEMIGOS);
            if (libre && (d === 0 || haySueloEn(scene, c + d))) { enemy.x += d; break; }
        }
    }
    const ahora = scene.time.now;
    const g = scene.mascotaGesi;
    const cerca = otros.filter(o => !o.esperando && Math.abs(o.x - g.x) < CERCA_JUGADOR).length;
    const maximo = MAXIMO_CERCA[Math.min(nivelActual, MAXIMO_CERCA.length - 1)];
    const forzar = ahora - enemy.esperaDesde > ESPERA_MAXIMA;
    if (!forzar && (ahora < (scene.proximaCaida || 0) || cerca >= maximo)) {
        scene.time.delayedCall(150, () => soltarDelCielo(scene, enemy, false));
        return;
    }
    scene.proximaCaida = ahora + PAUSA_APARICIONES;
    enemy.esperando = false;
    enemy.body.enable = true;
    enemy.setVisible(true);
    sombraDeCaida(scene, centroEnemigo(enemy), 1000);
}

// el enemigo pierde vida; devuelve true si lo golpeó
// congela: ms que el enemigo queda congelado (los poderes de hielo de Lira)
function dañarEnemigo(scene, enemy, cantidad = 1, congela = 0) {
    if (enemy.rivalId != null) { golpearRival(scene, enemy, cantidad, congela); return true; } // (arena: otro jugador)
    if (enemy.isDead || scene.time.now < (enemy.invulHasta || 0)) return false;
    if (enemy.replica) {
        // la vida de los enemigos la lleva el anfitrión: aquí solo se ve el golpe
        enemy.invulHasta = scene.time.now + 350;
        avisarGolpeEnemigo(enemy.redId, cantidad, congela);
        enemy.setTintFill(0xffffff);
        scene.time.delayedCall(90, () => { if (enemy.active) enemy.gigante ? enemy.setTint(0xff9a9a) : enemy.clearTint(); });
        scene.sound.play('bump', { volume: 0.4 });
        return true;
    }
    enemy.vida = (enemy.vida ?? 1) - cantidad;
    if (enemy.vida <= 0) {
        matarEnemigo(scene, enemy);
        return true;
    }
    enemy.invulHasta = scene.time.now + 350;
    enemy.setTintFill(0xffffff);
    scene.time.delayedCall(90, () => enemy.active && enemy.clearTint());
    scene.sound.play('bump', { volume: 0.4 });
    if (enemy.tipoId) {
        enemy.anims.play(`${enemy.tipoId}-hurt`, true);
        enemy.atacandoHasta = scene.time.now + 300;
        enemy.setVelocityX(0);
        scene.time.delayedCall(300, () => volverACaminar(enemy));
    }
    if (congela) congelarEnemigo(scene, enemy, congela);
    return true;
}

function volverACaminar(enemy) {
    if (!enemy.active || enemy.isDead) return;
    if (enemy.scene && enemy.scene.time.now < (enemy.congeladoHasta || 0)) return; // sigue congelado
    const def = enemy.def;
    const anim = def.tipo === 'planta' ? 'walk' : def.corre ? 'run' : 'walk';
    enemy.anims.play(`${enemy.tipoId}-${anim}`, true);
    if (def.tipo !== 'planta') enemy.setVelocityX(enemy.flipX ? -enemy.velBase : enemy.velBase);
}

// hielo: el enemigo queda quieto, azulado y sin atacar; al terminar vuelve a caminar
function congelarEnemigo(scene, enemy, ms) {
    if (enemy.rivalId != null) { golpearRival(scene, enemy, 0, ms); return; } // (arena: otro jugador)
    if (!enemy.active || enemy.isDead || !enemy.def) return;
    const hasta = scene.time.now + ms;
    enemy.congeladoHasta = Math.max(enemy.congeladoHasta || 0, hasta);
    enemy.atacandoHasta = Math.max(enemy.atacandoHasta || 0, hasta);
    enemy.proxAtaque = Math.max(enemy.proxAtaque || 0, hasta + 300);
    enemy.setVelocity(0, enemy.def.tipo === 'volador' ? 0 : enemy.body.velocity.y);
    scene.time.delayedCall(100, () => { if (enemy.active && !enemy.isDead) { enemy.anims.pause(); enemy.setTint(0x9fe8ff); } });
    scene.sound.play('magia', { volume: 0.3, rate: 1.8 });
    scene.time.delayedCall(ms, () => {
        if (!enemy.active || enemy.isDead || scene.time.now < enemy.congeladoHasta - 5) return;
        enemy.anims.resume();
        if (enemy.gigante) enemy.setTint(0xff9a9a); else enemy.clearTint();
        volverACaminar(enemy);
    });
}

// ataque del enemigo: se detiene, hace la animación y en el frame "soltar" golpea o dispara
function atacar(scene, enemy, alSoltar) {
    const def = enemy.def;
    const anim = scene.anims.get(`${enemy.tipoId}-attack`);
    const duracion = anim.frames.length / anim.frameRate * 1000;
    enemy.atacandoHasta = scene.time.now + duracion;
    enemy.proxAtaque = scene.time.now + duracion + def.cadencia;
    enemy.setVelocity(0, def.tipo === 'volador' ? 0 : enemy.body.velocity.y);
    enemy.anims.play(`${enemy.tipoId}-attack`, true);
    scene.time.delayedCall(def.soltar / anim.frameRate * 1000, () => {
        if (enemy.active && !enemy.isDead) alSoltar();
    });
    scene.time.delayedCall(duracion, () => volverACaminar(enemy));
}

// golpe cuerpo a cuerpo de un enemigo (esqueleto, planta)
function golpeDeEnemigo(scene, enemy) {
    const eb = enemy.body, alcance = enemy.def.alcance;
    sonarCerca(scene, enemy.def.tipo === 'planta' ? 'latigo' : 'golpe_enemigo', eb.center.x, { volume: 0.5 });
    const x0 = enemy.flipX ? eb.left - alcance : eb.right;
    const zona = new Phaser.Geom.Rectangle(x0, eb.top - 10, alcance, eb.height + 10);
    avisarZona(zona, eb.center.x); // en línea: cada jugador revisa si el golpe lo alcanzó
    golpeEnZona(scene, zona, eb.center.x);
}

function golpeEnZona(scene, zona, origenX) {
    const gb = scene.mascotaGesi.body;
    if (Phaser.Geom.Intersects.RectangleToRectangle(zona, new Phaser.Geom.Rectangle(gb.left, gb.top, gb.width, gb.height))) {
        killgesi(scene, undefined, 20, origenX);
    }
}

// réplica: un enemigo que apareció aquí por una trampa, pero que en línea crea el anfitrión
// (llega por la red); la copia local queda invisible y sin cuerpo por si alguien la sigue usando
function descartarEnemigo(scene, enemy) {
    enemy.isDead = true;
    enemy.setVisible(false);
    enemy.body.enable = false;
    scene.time.delayedCall(4000, () => enemy.active && enemy.destroy());
}

// disparo de un enemigo hecho en la pantalla del anfitrión
function balaRemota(scene, m) {
    if (m.k === 'bola') {
        const bola = scene.balasEnemigas.create(m.x, m.y, 'bola_espiritu').anims.play('bola_espiritu-giro', true);
        bola.body.setSize(16, 16);
        bola.setVelocity(m.vx, m.vy).setRotation(m.rot || 0);
        scene.time.delayedCall(3500, () => bola.active && bola.destroy());
    } else {
        const laser = scene.balasEnemigas.create(m.x, m.y, 'laser');
        laser.setVelocityX(m.vx);
        scene.time.delayedCall(2500, () => laser.active && laser.destroy());
    }
    sonarCerca(scene, m.k === 'bola' ? 'fuego' : 'laser', m.x, { volume: 0.4 });
}

function dispararEnemigo(scene, enemy) {
    const eb = enemy.body, gb = (fantasmaMasCercano(scene, enemy) || scene.mascotaGesi).body;
    if (enemy.def.tipo === 'volador') {
        // bola de fuego apuntada a Gesi
        const bola = scene.balasEnemigas.create(eb.center.x, eb.center.y, 'bola_espiritu').anims.play('bola_espiritu-giro', true);
        bola.body.setSize(16, 16);
        const ang = Phaser.Math.Angle.Between(eb.center.x, eb.center.y, gb.center.x, gb.center.y);
        scene.physics.velocityFromRotation(ang, 190, bola.body.velocity);
        bola.setRotation(ang + Math.PI);
        scene.time.delayedCall(3500, () => bola.active && bola.destroy());
        avisarBala({ k: 'bola', x: Math.round(bola.x), y: Math.round(bola.y), vx: Math.round(bola.body.velocity.x), vy: Math.round(bola.body.velocity.y), rot: bola.rotation });
    } else {
        // láser horizontal desde la pistola
        const dir = enemy.flipX ? -1 : 1;
        const laser = scene.balasEnemigas.create(eb.center.x + dir * 30, eb.top + 34, 'laser');
        laser.setVelocityX(dir * 320);
        scene.time.delayedCall(2500, () => laser.active && laser.destroy());
        avisarBala({ k: 'laser', x: Math.round(laser.x), y: Math.round(laser.y), vx: dir * 320 });
    }
    sonarCerca(scene, enemy.def.tipo === 'volador' ? 'fuego' : 'laser', eb.center.x, { volume: 0.4 });
}

function actualizarEnemigo(scene, enemy, time) {
    const def = enemy.def;
    if (!def) return;
    const g = scene.mascotaGesi, gb = g.body, eb = enemy.body;
    const dx = gb.center.x - eb.center.x, dy = gb.center.y - eb.center.y;

    // el zombie gigante solo persigue a Gesi (y salta las paredes)
    if (enemy.gigante) {
        if (time < enemy.atacandoHasta) return;
        const dir = Math.sign(dx) || 1;
        enemy.setVelocityX(dir * enemy.velBase);
        enemy.flipX = dir < 0;
        if ((eb.blocked.left || eb.blocked.right) && eb.blocked.down) enemy.setVelocityY(-430);
        return;
    }
    const gesiVivo = !g.isDead && !scene.nivelTerminado;
    const atacando = time < enemy.atacandoHasta;

    if (def.tipo === 'planta') {
        enemy.setVelocity(0, 0);
        if (!enemy.revelada) {
            if (gesiVivo && Math.abs(dx) < 120 && Math.abs(dy) < 90) {
                // ¡sorpresa! el arbusto era una planta
                enemy.revelada = true;
                enemy.flipX = dx < 0;
                enemy.atacandoHasta = time + 600;
                enemy.proxAtaque = time + 400;
                enemy.anims.play('planta-revelar', true);
                scene.time.delayedCall(600, () => volverACaminar(enemy));
            }
        } else if (gesiVivo && !atacando && time > enemy.proxAtaque && Math.abs(dx) < def.alcance + 20 && Math.abs(dy) < 70) {
            enemy.flipX = dx < 0;
            atacar(scene, enemy, () => golpeDeEnemigo(scene, enemy));
        }
        return;
    }

    if (def.tipo === 'volador') {
        if (!atacando) {
            // flota subiendo y bajando y se acerca a Gesi sin pegarse
            enemy.setVelocityY(Math.cos(time / 380 + enemy.fase) * 35);
            const cerca = Math.abs(dx) < 500;
            enemy.setVelocityX(cerca && Math.abs(dx) > 150 ? Math.sign(dx) * enemy.velBase : 0);
            if (cerca) enemy.flipX = dx < 0;
            if (gesiVivo && cerca && time > enemy.proxAtaque && Math.abs(dx) < def.alcance) {
                atacar(scene, enemy, () => dispararEnemigo(scene, enemy));
            }
        }
        return;
    }

    if (atacando) return;

    // caminar y dar la vuelta en las paredes
    if (eb.blocked.left) { enemy.setVelocityX(enemy.velBase); }
    else if (eb.blocked.right) { enemy.setVelocityX(-enemy.velBase); }
    // …y en el borde del suelo (si no, se tiran a la lava antes de que llegues). Se mira cada 150 ms
    else if (eb.blocked.down && time > (enemy.proxBorde || 0)) {
        enemy.proxBorde = time + 150;
        const dir = Math.sign(eb.velocity.x);
        if (dir && !pisoEn(scene, dir > 0 ? eb.right + 8 : eb.left - 8, eb.bottom)) enemy.setVelocityX(-dir * enemy.velBase);
    }
    if (Math.abs(eb.velocity.x) > 1) enemy.flipX = eb.velocity.x < 0;

    if (!gesiVivo || time < enemy.proxAtaque || Math.abs(dy) > 60) return;
    const delante = enemy.flipX ? -dx : dx;
    if (def.tipo === 'espadachin' && delante > 0 && delante < def.alcance + 25) {
        atacar(scene, enemy, () => golpeDeEnemigo(scene, enemy));
    } else if (def.tipo === 'tirador' && Math.abs(dx) < def.alcance && enSu(scene, enemy)) {
        enemy.flipX = dx < 0; // se voltea hacia Gesi para disparar
        atacar(scene, enemy, () => dispararEnemigo(scene, enemy));
    }
}

// el enemigo está dentro de la pantalla (no disparan desde fuera de la cámara)
function enSu(scene, enemy) {
    if (scene.soloActivar) return true; // apuntando a otro jugador: su cámara no es esta
    const izq = scene.cameras.main.scrollX;
    return enemy.x > izq - 40 && enemy.x < izq + VISTA.width;
}

function onlavagotasgesi(_mascotaGesi, _lavaesgota) {
    killgesi(this);
}

function salpicar(gota) {
    if (gota.salpicando) return;
    gota.salpicando = true;
    gota.body.enable = false;
    gota.anims.play('lavacaergotaSplash', true);
    gota.setScale(0.5);
    this.time.delayedCall(500, () => gota.destroy());
}

// ascensor tramposo (locuras.js): si lo pisas, arriba no espera y baja de golpe
function armarAscensorTramposo(scene, p) {
    if (!p.tramposo || p.armado) return;
    const gb = scene.mascotaGesi.body, pb = p.body;
    if (gb.touching.down && Math.abs(gb.bottom - pb.top) < 5 && gb.right > pb.left && gb.left < pb.right) {
        p.armado = true;
        scene.tweens.add({ targets: p, alpha: 0.6, yoyo: true, repeat: 5, duration: 120 });
        p.setTint(0xffb0b0);
    }
}

// ---------- Reloj del nivel (gotas, bolas de fuego y plataformas) ----------
// Lo periódico no usa temporizadores propios de cada pantalla sino este reloj: en línea el anfitrión
// manda el suyo y las demás pantallas lo copian, así las gotas caen y las bolas saltan a la vez para todos.
function relojSala(scene) {
    return scene.time.now - scene.inicioNivel + (scene.desfaseReloj || 0);
}

// en línea: el reloj del anfitrión (llega con los enemigos)
function ajustarReloj(scene, relojAnfitrion) {
    if (scene.inicioNivel == null) return;
    scene.desfaseReloj = relojAnfitrion - (scene.time.now - scene.inicioNivel);
}

// algo que pasa cada 'cada' ms (como un temporizador en bucle)
function agregarCiclo(scene, cada, disparar) {
    scene.ciclos.push({ cada, disparar, ultimo: null });
}

function actualizarCiclos(scene) {
    const t = relojSala(scene);
    scene.ciclos.forEach(c => {
        const n = Math.floor(t / c.cada);
        if (c.ultimo === null) { c.ultimo = n; return; }
        if (n === c.ultimo + 1) c.disparar();
        // si el reloj saltó (se ajustó al del anfitrión) se retoma sin disparar de golpe
        if (n !== c.ultimo) c.ultimo = n;
    });
}

// en línea: plataforma o ascensor donde le toca estar según el reloj (con su velocidad, para que
// quien está encima se mueva con ella); los ascensores paran PAUSA_ASCENSOR arriba y abajo
function seguirReloj(scene, p) {
    const t = relojSala(scene);
    const recorrido = p.max - p.min, T = recorrido / p.vel * 1000;
    let objetivo, vel;
    if (p.eje === 'x') {
        const c = t % (2 * T), ida = c < T;
        objetivo = ida ? p.min + p.vel * c / 1000 : p.max - p.vel * (c - T) / 1000;
        vel = ida ? p.vel : -p.vel;
    } else {
        const P = PAUSA_ASCENSOR, c = t % (2 * T + 2 * P);
        if (c < T) { objetivo = p.max - p.vel * c / 1000; vel = -p.vel; }
        else if (c < T + P) { objetivo = p.min; vel = 0; }
        else if (c < 2 * T + P) { objetivo = p.min + p.vel * (c - T - P) / 1000; vel = p.vel; }
        else { objetivo = p.max; vel = 0; }
    }
    const pos = p.eje === 'x' ? p.x : p.y;
    if (Math.abs(objetivo - pos) > 200) { // muy lejos (recién ajustado): se pone en su lugar
        if (p.eje === 'x') p.x = objetivo; else p.y = objetivo;
    }
    const correccion = Phaser.Math.Clamp((objetivo - pos) * 6, -120, 120);
    if (p.eje === 'x') p.setVelocityX(vel + correccion); else p.setVelocityY(vel + correccion);
}

function crearGota(scene, x) {
    const y = VISTA.height - 342;
    const gota = scene.lavaesgota.create(x, y, 'lava_falling')
        .setOrigin(0, 0.5)
        .anims.play('lavacaergota', true)
        .setScale(0.5)
        .refreshBody()
        .setSize(10, 20)
        .setOffset(62, 55);
    // el origen cambió después de crear el cuerpo: sin esto, la física lo toma como un movimiento y
    // en el primer cuadro corre la gota 63 px a la derecha (cae al lado del chorro, no de su punta)
    gota.body.reset(x, y);
}

function crearzombis() {
    if (soyReplica()) return; // en línea los crea el anfitrión
    // no aparecen encima de Gesi y como máximo hay 3 a la vez
    if (Math.abs(this.mascotaGesi.x - 1110) < 300) return;
    this.zombis = (this.zombis || []).filter(z => z.active && !z.isDead);
    if (this.zombis.length >= 3) return;
    this.zombis.push(crearEnemigo(this, 1090, 195));
}

// una pieza de suelo falso tiembla y se cae (al pisarla, o al tomar un cebo de suelo)
function derrumbarSuelo(scene, pieza) {
    if (pieza.cayendo) return;
    pieza.cayendo = true;
    const partes = [pieza, ...(pieza.visuales || [])];
    scene.tweens.add({ targets: partes, x: '+=3', yoyo: true, repeat: 2, duration: 40 });
    scene.time.delayedCall(180, () => {
        pieza.body.enable = false;
        scene.sound.play('romper');
        scene.tweens.add({ targets: partes, y: '+=300', alpha: 0, duration: 700 });
    });
}

function activarRuna(scene, runa) {
    runa.usado = true;
    runa.anims.stop();
    runa.setTexture('vacio' + scene.sufijo).setTint(0xb8a070);
    runa.brillo?.destroy();
    scene.tweens.add({ targets: runa, y: runa.y - 8, yoyo: true, duration: 80 });
    scene.sound.play('aparece', { volume: 0.6 });
    scene.cameras.main.shake(200, 0.004);
    runa.losas.forEach((losa, i) => scene.time.delayedCall(150 + i * 220, () => {
        losa.body.enable = true;
        losa.refreshBody();
        losa.visuales.forEach(v => { v.clearTint(); scene.tweens.add({ targets: v, alpha: 1, duration: 250 }); });
        scene.sound.play('romper', { volume: 0.35, rate: 1.4 });
    }));
    mostrarMensaje(scene, '¡UN PUENTE DE PIEDRA!', 1100);
    engañoDeRuna(scene, runa, apiSorpresas); // a veces las losas se rompen la primera vez (locuras.js)
}

function golpearBloque(mascotaGesi, pieza) {
    const cuerpo = mascotaGesi.body;

    if (pieza.muerde) pisarMordedora(this, pieza, apiSorpresas);

    // suelo falso: tiembla y se cae
    if (pieza.esFalso && cuerpo.touching.down) derrumbarSuelo(this, pieza);

    if (!cuerpo.touching.up && !cuerpo.blocked.up) return;

    // piedra rúnica dorada golpeada desde abajo: aparecen las losas
    const runa = this.floor.getChildren().find(b => b.esRuna && !b.usado &&
        cuerpo.center.x >= b.body.left - 4 && cuerpo.center.x <= b.body.right + 4 &&
        Math.abs(b.body.bottom - cuerpo.top) < 10);
    if (runa) { activarRuna(this, runa); return; }

    // el bloque golpeado es el que está justo encima del centro de Gesi
    // (Phaser puede reportar el choque con el ladrillo de al lado)
    const bloque = this.floor.getChildren().find(b => b.esMisterio && !b.usado &&
        cuerpo.center.x >= b.body.left - 4 && cuerpo.center.x <= b.body.right + 4 &&
        Math.abs(b.body.bottom - cuerpo.top) < 10);
    if (!bloque) return;

    bloque.usado = true;
    bloque.anims.stop();
    bloque.setTexture('vacio' + this.sufijo);
    this.tweens.add({ targets: bloque, y: bloque.y - 8, yoyo: true, duration: 80 });

    if (bloque.sueltaEnemigo) {
        // trampa: en vez de moneda sale un enemigo que va hacia Gesi
        this.sound.play('bump');
        const enemigo = crearEnemigo(this, bloque.x - 50, bloque.y - 16);
        const haciaGesi = mascotaGesi.x < bloque.x ? -1 : 1;
        enemigo.setVelocityX(haciaGesi * enemigo.velBase);
        enemigo.flipX = haciaGesi < 0;
        return;
    }

    const moneda = this.add.sprite(bloque.x + 16, bloque.y - 24, 'coins').setScale(0.75).anims.play('coins-giro', true);
    this.tweens.add({ targets: moneda, y: moneda.y - 40, alpha: 0, duration: 500, onComplete: () => moneda.destroy() });
    this.sound.play('moneda');
    addToScore(100, bloque, this);
    sumarABolsa(this);
}

function revelarBloque(_mascotaGesi, bloque) {
    if (bloque.revelado) return;
    bloque.revelado = true;
    bloque.setVisible(true);
    this.sound.play('bump');
    this.tweens.add({ targets: bloque, y: bloque.y - 8, yoyo: true, duration: 80 });
}

function recogerPremio(_mascotaGesi, premio) {
    premio.disableBody(true, true);
    // cebo: el mímico no da nada; los demás pagan el premio... y activan su trampa
    if (premio.cebo && activarCebo(this, premio, apiSorpresas) === 'sin_premio') return;
    if (premio.tipoPremio === 'corazon' && this.peleaJefe && this.salud < SALUD_MAXIMA) {
        // en la pelea el corazón cura la barra de vida
        const cura = this.curacionArena || 45;
        this.salud = Math.min(SALUD_MAXIMA, this.salud + cura);
        actualizarBarraSalud(this);
        mostrarMensaje(this, `+${cura} VIDA`, 800);
        this.sound.play('aparece', { volume: 0.5 });
    } else if (premio.tipoPremio === 'corazon') {
        if (vidas < VIDAS_INICIALES) {
            vidas++;
            actualizarCorazones(this);
            this.tweens.add({ targets: this.corazones[vidas - 1], scale: 1.3, yoyo: true, duration: 180 });
            mostrarMensaje(this, '+1 VIDA', 900);
        } else if (!recuperarEscudo(this, texto => mostrarMensaje(this, texto, 900))) {
            addToScore(300, premio, this);
        }
        this.sound.play('victoria', { volume: 0.4 });
    } else if (premio.tipoPremio === 'escudo') {
        if (!recuperarEscudo(this, texto => mostrarMensaje(this, texto, 900), '¡ESCUDO CARGADO!')) {
            addToScore(200, premio, this);
            this.sound.play('moneda');
        }
    } else {
        addToScore(500, premio, this);
        this.sound.play('moneda');
        mostrarMensaje(this, '¡CRISTAL! +500', 900);
    }
}

function recogerCarcaj(_mascotaGesi, carcaj) {
    carcaj.disableBody(true, true);
    this.sound.play('moneda');
    if (this.pj.recurso === 'flechas') {
        flechas += 5;
        mostrarMensaje(this, '+5 FLECHAS', 900);
    } else if (this.pj.recurso === 'mana') {
        this.mana = MANA_MAXIMO;
        mostrarMensaje(this, '¡MANÁ LLENO!', 900);
    } else {
        addToScore(300, carcaj, this);
    }
    actualizarRecurso(this);
}

function actualizarRecurso(scene) {
    const texto = scene.hudMovil
        ? (scene.pj.recurso === 'flechas' ? `➶ ${flechas}` : scene.pj.recurso === 'mana' ? `✧ ${Math.floor(scene.mana)}` : '⚔ ∞')
        : scene.pj.recurso === 'flechas' ? `Flechas: ${flechas}`
            : scene.pj.recurso === 'mana' ? `Maná: ${Math.floor(scene.mana)}`
                : 'Espada: ∞';
    if (scene.recursoText.text !== texto) scene.recursoText.setText(texto);
}

function animar(scene, clave) {
    if (scene.atacando) return; // no cortar la animación de ataque
    scene.mascotaGesi.anims.play(`${scene.pj.anim}-${clave}`, true);
}

// ---------- Habilidades (ESPACIO, X, C) ----------
function avisar(scene, texto) {
    scene.sound.play('vacio', { volume: 0.5 });
    if (scene.avisoActivo) return;
    scene.avisoActivo = true;
    mostrarMensaje(scene, texto, 800);
    scene.time.delayedCall(1100, () => { scene.avisoActivo = false; });
}

function pagarCosto(scene, costo) {
    if (!costo) return true;
    if (scene.pj.recurso === 'flechas') {
        if (flechas < costo) { avisar(scene, '¡SIN FLECHAS!'); return false; }
        flechas -= costo;
    } else if (scene.pj.recurso === 'mana') {
        if (scene.mana < costo) { avisar(scene, '¡SIN MANÁ!'); return false; }
        scene.mana -= costo;
    }
    actualizarRecurso(scene);
    return true;
}

function usarHabilidad(scene, tecla) {
    const h = scene.pj.habilidades[tecla];
    if (!h || scene.atacando || scene.time.now < (scene.enfriamientos[tecla] || 0)) return;
    if (!pagarCosto(scene, h.costo)) return;
    scene.enfriamientos[tecla] = scene.time.now + h.enfriamiento * factorRecarga(scene.pj.id); // (maestría 5: más rápido)
    avisarPoder(scene, tecla);

    const g = scene.mascotaGesi;
    // la parada de Leo empieza en cuanto aprieta la tecla (no cuando sale el golpe)
    if (h.parada) scene.paradaHasta = scene.time.now + h.parada;
    // qué animación: la del combo (va alternando), o la de correr / en el aire si el héroe la tiene
    const pisa = g.body.blocked.down || g.body.touching.down;
    let nombreAnim = h.combo ? h.combo[(scene.combo = ((scene.combo ?? -1) + 1) % h.combo.length)] : h.anim;
    if (!pisa && h.animAire) nombreAnim = h.animAire;
    else if (pisa && Math.abs(g.body.velocity.x) > 40 && h.animCorriendo) nombreAnim = h.animCorriendo;
    const clave = `${scene.pj.anim}-${nombreAnim}`;
    const anim = scene.anims.get(clave);
    scene.atacando = true;
    g.anims.play(clave, true);
    const duracion = anim.frames.length / anim.frameRate * 1000;
    scene.time.delayedCall(duracion, () => { scene.atacando = false; });
    scene.time.delayedCall(h.soltar / anim.frameRate * 1000, () => {
        if (!g.isDead && !scene.nivelTerminado) ejecutarHabilidad(scene, h);
    });
}

// los proyectiles no tienen distancia fija: siguen de largo hasta chocar con una pared o salir de
// la pantalla (con un tope de tiempo por si acaso)
const PROYECTIL_MAX_MS = 6000;
const PROYECTIL_MARGEN = 80; // px fuera de la vista antes de quitarlo
function fueraDeVista(scene, x, y) {
    const v = scene.cameras.main.worldView;
    return x < v.x - PROYECTIL_MARGEN || x > v.right + PROYECTIL_MARGEN || y < v.y - PROYECTIL_MARGEN || y > v.bottom + PROYECTIL_MARGEN;
}
function limpiarProyectiles(scene) {
    scene.flechasGrupo?.getChildren().slice().forEach(p => {
        if (p.nace != null && (fueraDeVista(scene, p.x, p.y) || scene.time.now - p.nace > PROYECTIL_MAX_MS)) p.destroy();
    });
}

function ejecutarHabilidad(scene, h) {
    const g = scene.mascotaGesi, b = g.body;
    const dir = g.flipX ? -1 : 1;
    if (h.sonido) scene.sound.play(h.sonido, { volume: 0.6, rate: h.rate || 1 });

    if (h.tipo === 'proyectil') {
        const p = scene.flechasGrupo.create(b.center.x + dir * 20, b.center.y - 8, h.textura);
        p.setScale(h.escala || 1).setFlipX(dir < 0);
        if (h.textura === 'flecha_pj') p.body.setSize(40, 6).setOffset(4, 21);
        if (h.animProyectil) p.anims.play(h.animProyectil, true);
        if (h.tinte) p.setTint(h.tinte);
        p.perfora = !!h.perfora;
        p.congela = h.congela || 0;
        p.body.setAllowGravity(false);
        p.setVelocityX(dir * h.vel);
        p.nace = scene.time.now; // (sigue de largo: se quita al salir de la pantalla, ver limpiarProyectiles)
    } else if (h.tipo === 'golpe' || h.tipo === 'rayo') {
        // golpea a todos los enemigos en una franja delante del personaje (o a los dos lados: torbellino)
        const daño = h.daño ?? (h.tipo === 'rayo' ? 2 : 1);
        const x0 = h.ambosLados ? b.left - h.alcance : dir > 0 ? b.right : b.left - h.alcance;
        const ancho = h.ambosLados ? b.width + h.alcance * 2 : h.alcance;
        const zona = new Phaser.Geom.Rectangle(x0, b.top - 10, ancho, b.height + 10);
        [...scene.enemies.getChildren(), ...(scene.rivales?.getChildren() || [])].forEach(e => {
            if (e.isDead || !e.body || !e.body.enable) return;
            const re = new Phaser.Geom.Rectangle(e.body.left, e.body.top, e.body.width, e.body.height);
            if (Phaser.Geom.Intersects.RectangleToRectangle(zona, re)) dañarEnemigo(scene, e, daño, h.congela);
        });
        golpearJefeEnZona(scene, zona, daño, apiJefe);
        if (scene.misionesNivel) golpeMisiones(scene, zona, 'ataque');
        if (scene.minas) golpeMinas(scene, zona, 'ataque'); // (nivel 3: jaulas, cristales y dinamita)
        if (h.ambosLados) {
            // el torbellino se ve como un anillo que se abre alrededor
            const anillo = scene.add.ellipse(b.center.x, b.center.y, ancho * 0.6, b.height * 0.7).setStrokeStyle(3, 0xdfe8ff, 0.9).setDepth(20);
            scene.tweens.add({ targets: anillo, scaleX: 1.6, scaleY: 1.2, alpha: 0, duration: 260, onComplete: () => anillo.destroy() });
        }
        if (h.tipo === 'rayo') {
            const rayo = scene.add.rectangle(x0 + h.alcance / 2, b.center.y - 6, h.alcance, 6, h.color ?? 0xffe066).setDepth(20);
            scene.tweens.add({ targets: rayo, scaleY: 3, alpha: 0, duration: 350, onComplete: () => rayo.destroy() });
        }
    } else if (h.tipo === 'embestida') {
        scene.dashHasta = scene.time.now + h.duracion;
        scene.dashVel = dir * h.vel;
        b.setAllowGravity(false);
        g.setVelocityY(0);
    } else if (h.tipo === 'escudo') {
        scene.escudoHasta = scene.time.now + h.duracion;
        if (scene.escudoFx) scene.escudoFx.destroy();
        scene.escudoFx = scene.add.circle(g.x, b.center.y, 46, 0x66ccff, 0.25).setStrokeStyle(3, 0x99ddff).setDepth(20);
    } else if (h.tipo === 'voltereta') {
        // rueda hacia donde mira; mientras dura, los enemigos y disparos la atraviesan
        scene.volteretaHasta = scene.time.now + h.duracion;
        scene.volteretaVel = dir * h.vel;
        g.setAlpha(0.55);
        scene.time.delayedCall(h.duracion, () => g.active && !g.isDead && g.setAlpha(1));
    }
}

// ---------- Defensas de cada personaje ----------
// Devuelve cómo se salva de un golpe (o null si no se salva):
//   'esquiva'  voltereta de Gesi o embestida de Leo: el golpe no la toca
//   'parada'   espadazo de Leo a tiempo y de frente: anula el golpe
//   'escudo'   escudo mágico de Zeno: absorbe este golpe y se rompe
// origenX: de dónde viene el golpe (para saber si es de frente); si no se sabe (trampas), no se puede parar
function defensa(scene, origenX) {
    const ahora = scene.time.now, g = scene.mascotaGesi;
    if (ahora < (scene.volteretaHasta || 0) || ahora < (scene.dashHasta || 0)) return 'esquiva';
    // la parada solo sirve contra ataques que vienen de frente (no contra rocas, pinchos u ondas)
    if (ahora < (scene.paradaHasta || 0) && origenX !== undefined) {
        const dir = g.flipX ? -1 : 1;
        if ((origenX - g.body.center.x) * dir > -12) return 'parada';
    }
    if (ahora < (scene.escudoHasta || 0)) return 'escudo';
    return null;
}

// efectos de una defensa que funcionó
function aplicarDefensa(scene, tipo) {
    const g = scene.mascotaGesi;
    if (tipo === 'parada') {
        scene.paradaHasta = 0;
        scene.invulnerableHasta = scene.time.now + 400;
        scene.sound.play('espada', { volume: 0.7, rate: 1.8 });
        const dir = g.flipX ? -1 : 1;
        const chispa = scene.add.image(g.body.center.x + dir * 22, g.body.center.y - 6, 'brillo').setDepth(41)
            .setScale(0.7).setTint(0xfff2a0).setBlendMode('ADD');
        scene.tweens.add({ targets: chispa, scale: 1.4, alpha: 0, duration: 250, onComplete: () => chispa.destroy() });
        scene.mostrarMensajeCorto?.('¡PARADA!');
    } else if (tipo === 'escudo') {
        // el escudo mágico se gasta con este golpe
        scene.escudoHasta = 0;
        scene.invulnerableHasta = scene.time.now + 600;
        scene.sound.play('escudo_roto', { volume: 0.5, rate: 1.3 });
        if (scene.escudoFx) {
            const fx = scene.escudoFx;
            scene.escudoFx = null;
            scene.tweens.add({ targets: fx, scale: 1.6, alpha: 0, duration: 250, onComplete: () => fx.destroy() });
        }
    }
}

function matarEnemigo(scene, enemy) {
    enemy.isDead = true;
    if (enemy.redId != null && !enemy.muerteRemota) avisarEnemigo(enemy.redId);
    enemy.clearTint();
    enemy.anims.play(enemy.tipoId ? `${enemy.tipoId}-dead` : 'enemy-muerte', true);
    scene.sound.play('matar');
    addToScore(enemy.def ? 100 + 50 * enemy.def.vida : 150, enemy, scene);
    // a veces el enemigo suelta un corazón (más a menudo los más fuertes)
    const prob = 0.06 + 0.03 * ((enemy.def?.vida ?? 1) - 1);
    if (vidas < VIDAS_INICIALES && Math.random() < prob && enemy.body) {
        soltarCorazon(scene, enemy.body.center.x, Math.min(enemy.body.center.y, SUELO_Y - 28));
    }
    enemy.setVelocity(0, 0);
    // sin cuerpo para que no estorbe; queda tirado un momento y desaparece
    enemy.body.checkCollision.none = true;
    enemy.body.setAllowGravity(false);
    scene.tweens.add({ targets: enemy, alpha: 0, delay: 1500, duration: 800, onComplete: () => enemy.destroy() });
}

function actualizarTrampas(scene) {
    const g = scene.mascotaGesi.body;
    const rectGesi = new Phaser.Geom.Rectangle(g.left, g.top, g.width, g.height);

    // ladrillos que caen
    scene.cayentes.forEach(c => {
        if (!c.estado) {
            if (g.right > c.body.left - 40 && g.left < c.body.right && g.top > c.body.bottom) {
                c.estado = 'cayendo';
                c.body.enable = false;
                scene.tweens.add({
                    targets: c, y: SUELO_Y - 16, duration: 380, ease: 'Quad.easeIn',
                    onComplete: () => {
                        c.estado = 'caido';
                        c.body.enable = true;
                        c.refreshBody();
                        scene.sound.play('bump');
                    }
                });
            }
        } else if (c.estado === 'cayendo') {
            if (Phaser.Geom.Intersects.RectangleToRectangle(c.getBounds(), rectGesi)) killgesi(scene);
        }
    });

    // pinchos ocultos: al acercarte asoman las puntas (con un destello y un sonido) y
    // un momento después salen del todo; da tiempo de verlos y saltar aunque vayas corriendo
    scene.pinchos.forEach(p => {
        if (p.oculto && !p.avisado && g.right > p.x - AVISO_PINCHOS && g.left < p.x + 82) {
            p.avisado = true;
            scene.tweens.add({ targets: p.img, y: SUELO_Y + 9, duration: 90 });
            const brillo = scene.add.image(p.x + 16, SUELO_Y - 4, 'brillo').setDepth(41).setScale(0.6, 0.25)
                .setTint(0xffe0a0).setAlpha(0.7).setBlendMode('ADD');
            scene.tweens.add({ targets: brillo, alpha: 0, duration: ESPERA_PINCHOS + 200, onComplete: () => brillo.destroy() });
            if (scene.time.now - (scene.ultimoPincho || 0) > 200) scene.sound.play('pinchos', { volume: 0.25, rate: 1.4 });
            scene.ultimoPincho = scene.time.now;
            scene.time.delayedCall(ESPERA_PINCHOS, () => {
                p.salio = true;
                scene.tweens.add({ targets: p.img, y: SUELO_Y, duration: 70 });
                if (scene.time.now - (scene.ultimoPincho || 0) > 200) scene.sound.play('pinchos', { volume: 0.5 });
                scene.ultimoPincho = scene.time.now;
            });
        }
        const arriba = p.img.y <= SUELO_Y + 4;
        if (arriba && g.right > p.x + 4 && g.left < p.x + 28 && g.bottom > SUELO_Y - 14) killgesi(scene);
    });

    // emboscadas
    scene.emboscadas.forEach(e => {
        if (!e.hecha && scene.mascotaGesi.x >= e.xAviso) {
            e.hecha = true;
            e.xs.forEach(x => crearEnemigo(scene, x, 0));
            scene.sound.play('emboscada', { volume: 0.6 });
        }
    });
}

// Imán de monedas (tienda.js): las monedas cercanas vuelan hacia el personaje... también las falsas
const ALCANCE_IMAN = 60;
function atraerMonedas(scene) {
    const g = scene.mascotaGesi;
    if (g.isDead) return;
    const c = g.body.center;
    scene.coins.getChildren().forEach(m => {
        if (!m.active || !m.body?.enable || m.atraida) return;
        if (Phaser.Math.Distance.Between(m.x, m.y, c.x, c.y) > ALCANCE_IMAN) return;
        m.atraida = true;
        m.body.enable = false;
        scene.tweens.add({
            targets: m, x: c.x, y: c.y, duration: 140, ease: 'Quad.in',
            onComplete: () => { m.body.enable = true; collectCoin.call(scene, g, m); },
        });
    });
}

function collectCoin(_mascotaGesi, coin) {
    coin.disableBody(true, true);
    if (coin.trampa) {
        monedaTrampa(this, coin, apiSorpresas);
        return;
    }
    this.sound.play('moneda');
    addToScore(100, coin, this);
    sumarABolsa(this);
    if (!this.carrera && !enLinea()) contarMoneda(nivelActual); // (estrella de las monedas: mundos.js)
    if (this.carrera) tomeMonedaCarrera(coin); // (en la carrera, la que tomo ya no está para los demás)
}

// moneda juntada: a la bolsa (se guarda al activar un punto de control o al terminar el nivel)
function sumarABolsa(scene, n = 1) {
    scene.bolsa = (scene.bolsa || 0) + n;
    actualizarMonedasHud(scene);
}
function guardarBolsa(scene) {
    if (!scene.bolsa) return;
    sumarMonedas(scene.bolsa);
    scene.bolsa = 0;
    actualizarMonedasHud(scene);
    if (scene.monedasText) scene.tweens.add({ targets: scene.monedasText, scale: 1.25, yoyo: true, duration: 150 });
}
function actualizarMonedasHud(scene) {
    if (!scene.monedasText) return;
    scene.monedasText.setText(`◉ ${saldo()}`);
    scene.bolsaText.setText(scene.bolsa ? `+${scene.bolsa}` : '');
}

function addToScore(scoreToAdd, origin, game) {

    score += scoreToAdd; // Actualiza la puntuación
    game.scoreText.setText(game.hudMovil ? `★ ${score}` : `Puntaje: ${score}`);

    const scoreText = game.add.text(
        origin.x,
        origin.y,
        scoreToAdd, {
        fontSize: VISTA.width / 40
    }
    );

    game.tweens.add({
        targets: scoreText,
        duration: 500,
        y: scoreText.y - 40,
        onComplete: () => {
            game.tweens.add({
                targets: scoreText,
                duration: 100,
                alpha: 0,
                onComplete: () => {
                    scoreText.destroy();
                }
            });
        }
    });
}

function onHitEnemy(mascotaGesi, enemy) {
    // Verificar si el enemigo ya está muerto
    if (enemy.isDead || this.nivelTerminado) return;

    // durante la embestida de Leo, los enemigos reciben daño al tocarlos
    if (this.time.now < this.dashHasta) {
        dañarEnemigo(this, enemy, 1);
        return;
    }

    if (mascotaGesi.body.touching.down && enemy.body.touching.up) {
        if (enemy.def?.espinas) {
            // la planta tiene espinas: pisarla duele
            killgesi(this);
            return;
        }
        dañarEnemigo(this, enemy, 1);
        mascotaGesi.setVelocityY(-280); // rebote al pisar al enemigo
        return;
    }
    // parada de Leo o escudo mágico de Zeno: el golpe no entra y el enemigo retrocede
    const d = defensa(this, enemy.body.center.x);
    if (d) {
        aplicarDefensa(this, d);
        apartarEnemigo(this, enemy);
        return;
    }
    killgesi(this, undefined, 20, enemy.body.center.x);
}

// el enemigo retrocede un poco y tarda en volver a atacar (después de una parada o del escudo mágico)
function apartarEnemigo(scene, enemy) {
    const lado = enemy.body.center.x < scene.mascotaGesi.body.center.x ? -1 : 1;
    scene.tweens.add({ targets: enemy, x: enemy.x + lado * 28, duration: 120 });
    enemy.proxAtaque = scene.time.now + 900;
    enemy.setTintFill(0xffffff);
    scene.time.delayedCall(80, () => enemy.active && enemy.clearTint());
}

function onlava(mascotaGesi, lava) {

    if (mascotaGesi.body.touching.down && lava.body.touching.up) {
        killgesi(this, 'caida');
    }

}

// al llegar a la meta el cristal del faro se enciende: un poco de luz vuelve al reino
function encenderFaro(scene) {
    const c = scene.bandera;
    c.setTint(0xffe27a);
    scene.tweens.add({ targets: c, scale: 2.6, yoyo: true, duration: 260, ease: 'Back.out' });
    const halo = scene.add.image(c.x, c.y - 16, 'brillo').setDepth(41).setScale(0.5).setTint(0xffd27a).setAlpha(0).setBlendMode('ADD');
    scene.tweens.add({ targets: halo, scale: 4, alpha: 0.75, duration: 900, ease: 'Sine.out' });
    const rayo = scene.add.rectangle(c.x, c.y - 30, 10, 380, 0xffe9a8, 0.35).setOrigin(0.5, 1).setDepth(41).setBlendMode('ADD').setScale(1, 0);
    scene.tweens.add({ targets: rayo, scaleY: 1, duration: 700, delay: 200, ease: 'Quad.out' });
    scene.tweens.add({ targets: rayo, alpha: 0.12, yoyo: true, repeat: -1, delay: 900, duration: 700 });
}

function completarNivel(mascotaGesi) {
    // metaRemota: otro jugador llegó a la meta (en línea): se completa aunque aquí el jefe siga vivo
    if (this.nivelTerminado || mascotaGesi.isDead || (!this.metaRemota && (jefeBloqueaMeta(this) || misionesBloquean(this)))) return;
    this.nivelTerminado = true;
    if (!this.metaRemota) avisarMeta();

    mascotaGesi.setVelocityX(0);
    this.atacando = false;
    animar(this, 'idle');
    this.musica.stop();
    this.musicaBatalla?.stop();
    this.sound.play('victoria');
    encenderFaro(this);
    if (this.minas) resultadosMinas(this, muertesNivel[nivelActual] || 0); // (nivel 3: misiones y secretos)
    // carrera: llegar es avisar (gana el primero); no hay premios del nivel ni se pasa al siguiente
    // (las monedas juntadas desde el último punto de control sí se guardan)
    if (this.carrera) { guardarBolsa(this); llegarMetaCarrera(this); return; }
    addToScore(1000, mascotaGesi, this);
    guardarBolsa(this);
    // premio: un poder especial (seguro la primera vez que se termina este nivel)
    const primeraVez = nivelActual + 1 > nivelMaximo();
    const premio = premioDeNivel(primeraVez);
    registrarNivel(nivelActual + 1);
    // hitos (hitos.js): llegar al 25, 50, 100… da título, monedas, estela y a veces un legendario
    const hitosNuevos = revisarHitos(nivelMaximo());
    if (hitosNuevos.length) this.time.delayedCall(2600, () => mostrarHitos(hitosNuevos));
    // experiencia para el jugador y la maestría del héroe (progreso.js)
    this.time.delayedCall(900, () => ganarXP(XP.nivel + (primeraVez ? XP.nivelPrimera : 0), this.pj.id, { victoria: true }));
    if (premio) this.time.delayedCall(1700, () => mostrarMensaje(this, `¡NUEVO PODER!\n${premio.nombre}\n(equípalo en la Tienda › Poderes)`, 2200));

    const ultimo = nivelActual === TOTAL_NIVELES - 1;
    // estrellas (mundos.js): terminar, sin morir y el 80 % de las monedas
    const est = enLinea() ? null : ganarEstrellas(nivelActual, muertesNivel[nivelActual] || 0, (nivelPorIndice(nivelActual).monedas || []).length);
    const linea = est ? `\n${textoEstrellas(est.estrellas)}${est.estrellas > est.antes && est.antes ? '  ¡RÉCORD!' : ''}` : '';
    mostrarMensaje(this, ultimo
        ? `¡GANASTE EL JUEGO!\nPuntaje: ${score}`
        : `¡NIVEL ${nivelActual + 1} COMPLETADO!${linea}`);

    this.time.delayedCall(ultimo ? 6000 : 3500, () => {
        if (ultimo) {
            // juego terminado: escena final y luego se empieza de cero
            const resumen = { personaje: personajeId, score, muertes };
            borrarPartida();
            reiniciarPartida();
            this.scene.start('final', resumen);
            return;
        }
        nivelActual++;
        reiniciarMinas(); reiniciarMisiones(); reiniciarMonedasNivel();
        vidaJefeGuardada = null;
        runaNivel = -1;
        scoreInicioNivel = score;
        checkpointX = null;
        guardarPartida();
        // el personaje camina por el mapa hasta el siguiente nivel (el mapa dibuja los hechos a mano;
        // en los niveles infinitos se pasa directo al siguiente)
        // (en los infinitos: el mapa de mundos, con el botón del siguiente nivel; mundos.js)
        if (esInfinito(nivelActual) && !enLinea()) abrirMapa({ siguiente: nivelActual });
        else if (esInfinito(nivelActual)) this.scene.start('juego');
        else this.scene.start('mapa', { desde: nivelActual - 1, hasta: nivelActual });
    });
}

function mostrarMensaje(scene, texto, duracion) {
    // un mensaje nuevo reemplaza al anterior para que no se encimen
    if (scene.mensajeActual && scene.mensajeActual.active) scene.mensajeActual.destroy();
    const mensaje = scene.mensajeActual = scene.add.text(VISTA.width / 2, VISTA.height / 2 - 40, texto, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '20px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 6,
        align: 'center',
        lineSpacing: 12
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    if (duracion) {
        scene.time.delayedCall(duracion, () => {
            scene.tweens.add({ targets: mensaje, alpha: 0, duration: 500, onComplete: () => mensaje.destroy() });
        });
    }
}

function actualizarMundo(scene) {
    // plataformas móviles: cambian de sentido al llegar al final de su recorrido
    scene.moviles.getChildren().forEach(p => {
        // en línea siguen el reloj de la sala (mismo lugar en todas las pantallas);
        // el ascensor tramposo, mientras hace su truco, se maneja como siempre
        if (p.eje !== 'x') armarAscensorTramposo(scene, p);
        if (scene.remotos && !p.armado && !p.paradoHasta) { seguirReloj(scene, p); return; }
        if (p.eje === 'x') {
            if (p.x >= p.max) p.setVelocityX(-p.vel);
            else if (p.x <= p.min) p.setVelocityX(p.vel);
        } else {
            // ascensor: se detiene un momento en cada parada para subir y bajar con calma
            if (p.paradoHasta) {
                if (scene.time.now >= p.paradoHasta) { p.paradoHasta = 0; p.setVelocityY(p.siguiente); }
                return;
            }
            // (en línea pudo armarse mientras estaba detenido en una parada: arranca hacia arriba)
            if (p.armado && Math.abs(p.body.velocity.y) < 1) p.setVelocityY(-p.vel);
            const vy = p.body.velocity.y;
            if ((p.y <= p.min && vy < 0) || (p.y >= p.max && vy > 0)) {
                p.y = Phaser.Math.Clamp(p.y, p.min, p.max);
                p.setVelocityY(0);
                p.siguiente = vy < 0 ? p.vel : -p.vel;
                p.paradoHasta = scene.time.now + PAUSA_ASCENSOR;
                if (p.armado && vy < 0) {
                    // ¡se pasa de largo! casi sin parar, baja cuatro veces más rápido
                    p.armado = false;
                    p.tramposo = false;
                    p.clearTint();
                    p.siguiente = p.vel * 4;
                    p.paradoHasta = scene.time.now + 450;
                    mostrarMensaje(scene, '¡SALTA YA!', 600);
                }
            }
        }
    });

    // enemigos: cada tipo tiene su comportamiento; desaparecen si caen
    const ahora = scene.time.now;
    scene.enemies.getChildren().slice().forEach(enemy => {
        if (enemy.y > VISTA.height + 150 || enemy.x < -200) {
            enemy.destroy();
            return;
        }
        if (enemy.isDead || enemy.replica || enemy.esperando) return; // las réplicas las mueve el anfitrión
        if (enemy.def) {
            // en línea persigue al jugador más cercano de la sala (puede ser el de otra pantalla)
            const otro = fantasmaMasCercano(scene, enemy);
            if (otro) comoJugador(scene, otro, () => actualizarEnemigo(scene, enemy, ahora));
            else actualizarEnemigo(scene, enemy, ahora);
        } else if (enemy.body.blocked.left) {
            enemy.setVelocityX(scene.velEnemigos);
            enemy.flipX = false;
        } else if (enemy.body.blocked.right) {
            enemy.setVelocityX(-scene.velEnemigos);
            enemy.flipX = true;
        }
    });

    scene.lavaesgota.getChildren().slice().forEach(gota => {
        if (gota.y > VISTA.height + 50) gota.destroy();
    });

    scene.bolas.getChildren().forEach(bola => {
        if (!bola.active) return;
        bola.flipY = bola.body.velocity.y > 0;
        if (bola.body.velocity.y > 0 && bola.y > 390) bola.disableBody(true, true);
    });
}

function trampasNivel1(scene) {
    if (scene.mascotaGesi.x >= VISTA.width - 400 && scene.piso2.active) { // Ajusta el valor según tu necesidad
        moveFloorPiece(scene.piso2, 390);
    }

    if (scene.mascotaGesi.x >= 190 && scene.mascotaGesi.y <= 210) {
        if (!scene.piso3.mostrado) {
            scene.piso3.mostrado = true; // Mostrar el piso
            scene.piso3.visuales.forEach(v => v.setVisible(true));
        }
    }

    // la segunda plataforma sobre la lava tiembla y se cae poco después de pisarla
    const g = scene.mascotaGesi.body, p8 = scene.piso8;
    if (!p8.cayendo && g.touching.down && Math.abs(g.bottom - p8.body.top) < 4 &&
        g.right > p8.body.left && g.left < p8.body.right) {
        p8.cayendo = true;
        scene.tweens.add({ targets: p8, x: p8.x + 3, yoyo: true, repeat: 7, duration: 60 });
        scene.time.delayedCall(1500, () => {
            p8.body.enable = false;
            scene.tweens.add({ targets: p8, y: p8.y + 250, alpha: 0, duration: 700 });
        });
    }
}

function update(time, delta) {
    actualizarCiclos(this);
    limpiarProyectiles(this);
    actualizarJugador.call(this, time, delta);
    if (this.compa || this.cadenaRed) actualizarCadena(this, time);
    actualizarMecanismos(this);
    actualizarEnLinea(this, time, delta);
    recortarVista(this, time); // solo se dibuja lo que está cerca de la cámara
    cuidarRendimiento(this, time); // celular lento: modo fluido automático
    actualizarContadorFps(this, time);
}

function actualizarJugador(time, delta) {
    moverCamara(this);
    if (!this.noche) actualizarEscudo(this, texto => mostrarMensaje(this, texto, 900));
    actualizarJefe(this, this.time.now, apiJefe);
    actualizarMundo(this);
    actualizarAmbiente(this, time, this.mascotaGesi);
    moverLava(this, time);
    actualizarCarrera(this); // (la barra de avance sigue aunque estés muerto o en la cuenta regresiva)
    if (this.noche) actualizarNoche(this, time);
    if (this.catacumbas) actualizarCatacumbas(this, time); // (el techo y la lava siguen aunque estés muerto)
    if (this.minas) actualizarMinas(this, time);
    if (this.misionesNivel) actualizarMisiones(this, time);
    if (this.falsas) actualizarFalsas(this);
    actualizarLuz(this, time, this.game.loop.delta);

    if (this.mascotaGesi.isDead) return;

    if (this.nivelTerminado) {
        this.mascotaGesi.setVelocityX(0);
        return;
    }
    if (this.cinematica) {
        this.mascotaGesi.setVelocityX(0);
        animar(this, 'idle');
        return;
    }

    const g = this.mascotaGesi;
    const enSuelo = g.body.touching.down || g.body.blocked.down;
    const lento = time < (this.lentoHasta || 0); // (carrera: un rival lo ralentizó)
    const v = this.pj.velocidad * (lento ? 0.5 : 1);

    // maná del mago se recupera poco a poco
    if (this.pj.recurso === 'mana' && this.mana < MANA_MAXIMO) {
        this.mana = Math.min(MANA_MAXIMO, this.mana + delta * 0.012 * (this.pj.regeneraMana || 1));
        actualizarRecurso(this);
    }
    // Gesi recoge flechas del suelo poco a poco mientras le queden pocas (nunca se queda sin atacar)
    if (this.pj.regeneraFlechas && flechas < FLECHAS_RECOGIDAS) {
        this.recogiendoFlechas = (this.recogiendoFlechas || 0) + delta;
        if (this.recogiendoFlechas >= this.pj.regeneraFlechas) {
            this.recogiendoFlechas = 0;
            flechas++;
            actualizarRecurso(this);
        }
    }

    // escudo mágico
    if (this.escudoFx) {
        if (time < this.escudoHasta) this.escudoFx.setPosition(g.x, g.body.center.y);
        else { this.escudoFx.destroy(); this.escudoFx = null; }
    }

    if (time < this.dashHasta) {
        // embestida: avanza rápido en línea recta
        g.setVelocity(this.dashVel, 0);
    } else if (time < (this.volteretaHasta || 0)) {
        // voltereta: rueda rápido (con gravedad: no sirve para cruzar huecos volando)
        g.setVelocityX(this.volteretaVel);
    } else if (time < (this.empujadoHasta || 0)) {
        // lo acaban de empujar (escudo roto, golpe, mímico): las flechas no anulan el empujón
        if (!g.body.allowGravity) g.body.setAllowGravity(true);
    } else if (time < (this.aturdidoHasta || 0)) {
        // carrera: aturdido o congelado por un rival: se queda quieto (la gravedad sigue)
        if (!g.body.allowGravity) g.body.setAllowGravity(true);
        if (enSuelo) g.setVelocityX(0);
    } else {
        if (!g.body.allowGravity) g.body.setAllowGravity(true);

        // la velocidad va en px/s: el personaje corre igual en pantallas de 60 Hz o de 144 Hz
        // (la runa maldita y la sombra invierten izquierda y derecha un rato: locuras.js)
        const invertido = time < (this.invertidoHasta || 0);
        const izquierda = invertido ? this.keys.right.isDown : this.keys.left.isDown;
        const derecha = invertido ? this.keys.left.isDown : this.keys.right.isDown;
        if (izquierda) {
            enSuelo && animar(this, 'run');
            g.setVelocityX(-VEL_CARRERA * v);
            g.flipX = true;
        } else if (derecha) {
            enSuelo && animar(this, 'run');
            g.setVelocityX(VEL_CARRERA * v);
            g.flipX = false;
        } else if (enSuelo) {
            animar(this, 'idle');
            g.setVelocityX(0);
        } else if (Math.abs(g.body.velocity.x) > VEL_DERIVA * v) {
            // al soltar la flecha en el aire sigue avanzando, pero más lento (como antes)
            g.setVelocityX(Math.sign(g.body.velocity.x) * VEL_DERIVA * v);
        }
    }

    const JD = Phaser.Input.Keyboard.JustDown, t = this.teclasDisparo;
    const aturdido = time < (this.aturdidoHasta || 0);
    const sinPoderes = aturdido || time < (this.silenciadoHasta || 0); // (carrera: bloqueado por un rival)
    if (JD(t.espacio) && !sinPoderes) usarHabilidad(this, 'espacio');
    if (JD(t.x) && !sinPoderes) usarHabilidad(this, 'x');
    if (JD(t.c) && !sinPoderes) usarHabilidad(this, 'c');
    if (JD(t.v) && !sinPoderes && !this.noche) usarPoder(this, 0);
    if (JD(t.b) && !sinPoderes && !this.noche) usarPoder(this, 1);

    if (enSuelo) this.saltosAire = 0;
    if (aturdido) {
        // (no salta mientras está aturdido)
    } else if (this.keys.up.isDown && enSuelo) {
        // se "gasta" la pulsación: el doble salto necesita volver a presionar ↑
        JD(this.keys.up);
        g.setVelocityY(-this.pj.salto * (lento ? 0.9 : 1));
        this.sound.play('salto', { volume: 0.3 });
        animar(this, 'jump');
    } else if (this.pj.dobleSalto && !enSuelo && this.saltosAire < 1 && JD(this.keys.up)) {
        // doble salto del mago (nunca frena: si ya sube más rápido, se suma un poco)
        this.saltosAire++;
        g.setVelocityY(Math.min(g.body.velocity.y - 120, -440));
        this.sound.play('salto', { volume: 0.3, rate: 1.35 });
        g.anims.play(`${this.pj.anim}-jump`, false);
    }

    // cayendo: animación de caída (los héroes que la tienen)
    if (!enSuelo && this.pj.hojas.fall && g.body.velocity.y > 120 && !this.atacando && !g.isDead &&
        !g.anims.currentAnim?.key.endsWith('-fall')) animar(this, 'fall');

    const deathThreshold = 90;

    if (g.y >= 390 - deathThreshold) { // linea para matar si cae por fuera de el area de jeugo
        killgesi(this, 'caida');
    }

    if (this.nivel1AMano) trampasNivel1(this);
    if (tiene('iman')) atraerMonedas(this);
    actualizarEstela(this);
    actualizarPoderes(this, time, delta);
    actualizarArena(this);
    actualizarTrampas(this);
    actualizarSorpresas(this, apiSorpresas);
    actualizarAbismo(this);
    // en línea las trampas también se activan cuando pasa otro jugador (sin hacerte daño a ti)
    fantasmas(this).forEach(f => comoJugador(this, f, () => {
        if (this.nivel1AMano) trampasNivel1(this);
        actualizarTrampas(this);
        actualizarSorpresas(this, apiSorpresas);
    }));

    // puntos de control
    this.checkpoints.forEach(cp => {
        if (!cp.activo && this.mascotaGesi.x >= cp.x) activarCheckpoint(this, cp);
    });
}


function moveFloorPiece(floorPiece, newX) {
    (floorPiece.visuales || []).forEach(v => v.destroy());
    floorPiece.destroy();
    floorPiece.setX(newX);
}

// daño: cuánta salud quita durante la pelea con el jefe (fuera de la pelea, cualquier golpe mata)
// los enemigos, las gotas y los premios dejan de interactuar con el cuerpo después de morir
const vivo = g => !g.isDead;
// durante la voltereta de Gesi los enemigos no la tocan: los atraviesa
const tocaEnemigos = g => !g.isDead && !(g.scene.time.now < (g.scene.volteretaHasta || 0));

// Cómo queda el cuerpo al morir (sin saltos ni atravesar el suelo):
// - lava o hueco: se hunde despacio en la lava, brillando, y desaparece
// - golpe, trampa o enemigo: sigue chocando con el suelo; si estaba en el aire cae
//   con la gravedad normal y termina tendido donde murió, con un pequeño empujón hacia atrás
function caerMuerto(game, causa) {
    const g = game.mascotaGesi;
    g.body.setAllowGravity(true);
    if (causa === 'caida') {
        g.body.checkCollision.none = true; // ya está dentro de la lava: no hay suelo donde apoyarse
        g.setCollideWorldBounds(false);    // se hunde por debajo del borde de la pantalla
        g.body.setAllowGravity(false);
        g.setVelocity(0, 40);
        g.setTint(0xff7a3d);
        game.tweens.add({ targets: g, alpha: 0, delay: 500, duration: 1100 });
        const brillo = game.add.image(g.x, SUELO_Y + 6, 'brillo').setDepth(41).setScale(1.6)
            .setTint(0xff5a1f).setAlpha(0.8).setBlendMode('ADD');
        game.tweens.add({ targets: brillo, alpha: 0, scale: 2.4, duration: 1200, onComplete: () => brillo.destroy() });
        return;
    }
    // empujón corto en sentido contrario a donde mira, y frena por rozamiento contra el suelo
    g.setVelocityX(g.flipX ? 70 : -70);
    if (g.body.velocity.y < 0) g.setVelocityY(0); // si iba subiendo, empieza a caer en ese punto
    g.setDragX(500);
}

// origenX: de dónde vino el golpe (enemigos, disparos, troll); las trampas no lo pasan
// golpe recibido: los héroes con animación de dolor la muestran un instante
function mostrarDolor(game) {
    const g = game.mascotaGesi, hoja = game.pj.hojas.hurt;
    if (!hoja || g.isDead) return;
    game.atacando = true; // (que el movimiento no la tape)
    g.anims.play(`${game.pj.anim}-hurt`, true);
    game.time.delayedCall(hoja[1] / hoja[2] * 1000, () => { game.atacando = false; });
}

// Runa de reserva (tienda.js): la primera vez que se rompe el escudo en un nivel, se recarga
function usarRunaDeReserva(game) {
    // maestría 2 del héroe (progreso.js): la runa de maestría, gratis, una vez por nivel
    if (tieneRunaMaestria(game.pj.id) && runaMaestriaNivel !== nivelActual && !game.arena) {
        runaMaestriaNivel = nivelActual;
        game.time.delayedCall(700, () => {
            if (!game.mascotaGesi.isDead) recuperarEscudo(game, texto => mostrarMensaje(game, texto, 900), '¡RUNA DE MAESTRÍA!');
        });
        return;
    }
    if (!llevaEscudo() || runaNivel === nivelActual) return;
    runaNivel = nivelActual;
    usarConsumible('escudo');
    game.time.delayedCall(700, () => {
        if (!game.mascotaGesi.isDead) recuperarEscudo(game, texto => mostrarMensaje(game, texto, 900), '¡RUNA DE RESERVA!');
    });
}

function killgesi(game, causa, daño = 20, origenX) {
    if (game.soloActivar) return; // trampa o enemigo revisado con otro jugador (fantasma): el daño no es aquí
    if (game.esFantasma) return;  // (Noche del Troll: los fantasmas no mueren)
    // Noche del Troll: no hay vidas. Un monstruo aturde (troll.js); solo matan el troll y la lava
    if (game.noche && causa !== 'caida' && causa !== 'rival') { nocheGolpe(game, origenX); return; }
    const { mascotaGesi, scene, sound } = game;
    if (mascotaGesi.isDead || game.nivelTerminado) return;
    // cayó al foso estando atado: la cadena lo atrapa y el equipo puede rescatarlo (cadena.js)
    if (causa === 'caida' && !game.muerteRemota && sostenerEnCadena(game, mascotaGesi)) return;
    if (game.cinematica && causa !== 'caida') return;
    if (game.peleaJefe && causa !== 'caida' && causa !== 'sin_salud') {
        // contra el jefe solo esquivar a tiempo evita el golpe del todo; las demás defensas lo reducen
        if (estaInvulnerable(game)) return; // un instante después de cada golpe
        const d = defensa(game, origenX);
        if (d === 'esquiva') return; // voltereta o embestida en el momento justo
        let factor = 1;
        if (game.tieneEscudo) {
            romperEscudo(game, texto => mostrarMensaje(game, texto, 900));
            usarRunaDeReserva(game);
            mostrarDolor(game);
            factor *= game.golpeFuerte ? 0.75 : 0.5; // el escudo absorbe la mitad (un cuarto contra un poder de la arena) y se rompe
        }
        if (d === 'parada') factor *= 0.25; // la parada de Leo frena casi todo el garrotazo
        if (d === 'escudo') factor *= 0.5;  // el escudo mágico absorbe la mitad y se rompe
        if (d) aplicarDefensa(game, d);
        recibirDaño(game, Math.max(d === 'parada' ? 5 : 10, daño * factor));
        return;
    }
    // las defensas de cada personaje protegen de todo menos de caer a la lava
    // (ni de quedarte sin vida en la carrera: 'rival', ver carrera.js)
    if (causa !== 'caida' && causa !== 'rival') {
        const d = defensa(game, origenX);
        if (d) { aplicarDefensa(game, d); return; }
    }
    if (causa !== 'caida' && causa !== 'rival') {
        // recién roto el escudo: unos instantes sin recibir daño
        if (estaInvulnerable(game)) return;
        // el primer golpe solo rompe el escudo
        if (game.tieneEscudo) {
            romperEscudo(game, texto => mostrarMensaje(game, texto, 900));
            usarRunaDeReserva(game);
            mostrarDolor(game);
            return;
        }
    }
    mascotaGesi.isDead = true;
    if (!game.muerteRemota && !game.arena) avisarMuerte(); // en línea: caen todos
    game.atacando = false;
    game.dashHasta = 0;
    game.volteretaHasta = 0;
    game.paradaHasta = 0;
    mascotaGesi.anims.play(`${game.pj.anim}-dead`);
    caerMuerto(game, causa);
    if (game.arena) { arenaMuerte(game, causa); return; } // en la arena: pierde un corazón de la ronda (arena.js)
    // Noche del Troll: un héroe queda como fantasma (y deja su cuerpo); el troll vuelve al claro (troll.js)
    if (game.noche) { nocheMuerte(game, ms => reaparecer(game, ms)); return; }
    game.musica.stop();
    game.musicaBatalla?.stop();
    sound.add('gameover', { volume: 1 }).play();

    vidas = Math.max(0, vidas - 1);
    muertes++;
    muertesNivel[nivelActual] = (muertesNivel[nivelActual] || 0) + 1;
    game.muertesText?.setText(`☠ ${muertes}`);
    if (game.muertesText) game.tweens.add({ targets: game.muertesText, scale: 1.4, yoyo: true, duration: 140 });
    actualizarCorazones(game);
    if (game.corazones[vidas]) game.tweens.add({ targets: game.corazones[vidas], scale: 1.3, yoyo: true, duration: 150 });
    score = scoreInicioNivel;


    if (vidas <= 0 && !enLinea()) {
        // sin corazones: GAME OVER y de vuelta al INICIO del nivel (con las vidas llenas): se pierden
        // los puntos, las monedas sin guardar y el daño hecho al jefe
        game.time.delayedCall(600, () => sound.play('game_over', { volume: 0.7 }));
        game.time.delayedCall(700, () => pantallaGameOver(game));
        return;
    }
    if (vidas <= 0) {
        // (en línea: el grupo sigue junto, así que se vuelve al último punto de control como siempre)
        mostrarMensaje(game, 'GAME OVER\nPierdes los puntos del nivel', GAME_OVER_MS);
        game.time.delayedCall(600, () => sound.play('game_over', { volume: 0.7 }));
        reaparecer(game, GAME_OVER_MS, () => {
            vidas = VIDAS_INICIALES;
            score = scoreInicioNivel;
            if (!enLinea()) guardarPartida();
        });
        return;
    }

    const burla = BURLAS[Math.floor(Math.random() * BURLAS.length)];
    mostrarMensaje(game, game.bolsa ? `${burla}\n◉ -${game.bolsa} sin guardar` : burla, REINTENTO_MS);
    // vuelve a aparecer en el último punto de control
    reaparecer(game, REINTENTO_MS);
}

// la pantalla de GAME OVER: cuántas veces moriste, una burla y "Reintentar" (desde el inicio del nivel)
function pantallaGameOver(game) {
    if (!game.scene.isActive()) return;
    document.querySelector('.game-over')?.remove();
    const capa = document.createElement('div');
    capa.className = 'menu-capa game-over';
    const n = muertesNivel[nivelActual] || 0;
    capa.innerHTML = `
        <div class="menu-panel arena-fin" role="dialog" aria-modal="true" aria-labelledby="game-over-titulo">
            <h2 id="game-over-titulo">💀 GAME OVER</h2>
            <p class="game-over-muertes">Moriste <b>${n}</b> ${n === 1 ? 'vez' : 'veces'} en este nivel</p>
            <p class="game-over-burla">${BURLAS_GAME_OVER[Math.floor(Math.random() * BURLAS_GAME_OVER.length)]} 👹</p>
            <p class="menu-nota">Vuelves al inicio del nivel</p>
            <button type="button" class="menu-boton sala-empezar" data-reintentar>↻ Reintentar</button>
        </div>`;
    document.getElementById('game').append(capa);
    let hecho = false;
    const reintentar = () => {
        if (hecho) return;
        hecho = true;
        document.removeEventListener('keydown', tecla, true);
        capa.remove();
        vidas = VIDAS_INICIALES;
        score = scoreInicioNivel;
        checkpointX = null;
        vidaJefeGuardada = null;
        reiniciarMinas(); reiniciarMisiones(); reiniciarMonedasNivel(); // (GAME OVER: las misiones vuelven a empezar)
        guardarPartida();
        if (game.scene.isActive()) game.scene.restart();
    };
    // cualquier tecla reintenta (pasado un instante: la que se venía apretando no cuenta)
    const desde = performance.now() + 500;
    const tecla = e => {
        if (e.repeat || performance.now() < desde) return;
        e.preventDefault();
        e.stopPropagation();
        reintentar();
    };
    document.addEventListener('keydown', tecla, true);
    capa.querySelector('[data-reintentar]').addEventListener('click', reintentar);
    capa.querySelector('[data-reintentar]').focus();
}

// reaparece en el último punto de control después de 'espera' ms; pasado un instante, cualquier
// tecla o toque lo hace al momento (para reintentar sin esperar). antes(): lo que cambia al reaparecer
function reaparecer(game, espera, antes) {
    let hecho = false;
    const ir = () => {
        if (hecho || !game.scene.isActive()) return;
        hecho = true;
        antes?.();
        game.scene.restart();
    };
    game.time.delayedCall(espera, ir);
    game.time.delayedCall(SALTAR_ESPERA_MS, () => {
        game.input.keyboard?.on('keydown', e => { if (!e.repeat) ir(); }); // (una tecla que se venía apretando no cuenta)
        game.input.once('pointerdown', ir);
    });
}
