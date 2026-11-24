// "Jugar con amigos": sala de espera del multijugador (capa HTML sobre el juego).
//   1. Tu nombre y tu personaje
//   2. Buscar partida (automático: entra a una sala pública con lugar o crea una y espera), crear sala
//      (te da un código de 4 letras) o unirte con el código de un amigo
//   3. En la sala: ves quién está, cambias de personaje; el anfitrión elige el nivel y empieza
//      (nivel, pista y arena vienen en "🎲 Al azar": cada partida en grupo, un mapa distinto; al volver
//      a competir o en la revancha se sortea otro)
// Hasta 8 jugadores, atados en fila por la cadena en el orden en que entraron.
// En la sala, cada jugador aparece en un escenario con su personaje: cae al unirse, pasea de un
// lado a otro y salta al cambiar de personaje (las mismas hojas de sprites del juego, animadas con CSS).
// Modos (los elige el anfitrión): Aventura (todos atados con la cadena) o la Arena del Troll
// (arena.js): 1 contra 1 o por equipos (rojo contra azul, cada uno elige su equipo; hasta 4).
// También la Carrera (carrera.js): todos corren la misma pista y el primero en llegar gana (hasta 8).
// Y La Noche del Troll (troll.js): uno (o dos) es el troll en secreto; de 4 a 8, con bots si faltan.
// En la carrera cada uno elige SU apuesta y confirma con "Listo"; en la lista y sobre cada personaje
// se ve cuánto apuesta cada uno. El anfitrión arranca cuando todos están listos.
// Cada uno se ve con los colores que eligió en el vestidor: al entrar (y cada vez que cambia la sala)
// cada jugador anuncia sus colores con un evento que el servidor reenvía a los demás (sin cambiar el servidor).

import { PERSONAJES } from "./personajes.js"
import { NIVELES } from "./niveles.js"
import {
    red, alRecibir, crearSala, unirseSala, elegirPersonaje, empezarPartida, salirSala, esAnfitrion, enviarEvento, elegirModo, elegirEquipo,
    informarSaldo, apostar, marcarListo, buscarSala, hacerPublica,
} from "./red.js"
import { PISTAS, pistaDeMundo, pistaDelDia, pistaDeNivel } from "./pistas.js"
import { prepararCopa, PISTAS_COPA } from "./carrera.js"
import { temaDeMundo, CUANTOS_TEMAS } from "./niveles.js"
import { ARENAS, APUESTAS, COLORES_EQUIPO, arenaDisponible, victoriasArena, copasArena, ligaDe } from "./arena.js"
import { saldo } from "./tienda.js"

const MODOS = { aventura: 'Aventura (en cadena)', duelo: 'Arena · 1 contra 1', equipos: 'Arena · por equipos', carrera: '🏁 Carrera', troll: '🌙 Noche del Troll' };
const esArena = modo => modo === 'duelo' || modo === 'equipos';
// el letrero de la sala: icono y nombre corto de cada modo
const MODO_CORTO = { aventura: ['⛓', 'Aventura en cadena'], duelo: ['⚔', 'Arena 1 contra 1'], equipos: ['⚔', 'Arena por equipos'], carrera: ['🏁', 'Carrera'], troll: ['🌙', 'Noche del Troll'] };
const MINIMO = { duelo: 2, equipos: 2, carrera: 2, troll: 2 }; // jugadores para poder empezar (aventura: 1)
const CUENTA_ATRAS = 5; // s: todos listos → arranca sola
// ---------- el bosque de la sala, en cuadritos (SVG con rectángulos, sin suavizado) ----------
const rect = (x, y, w, h, c) => `<rect x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.max(1, Math.round(w))}" height="${Math.max(1, Math.round(h))}"${c ? ` fill="${c}"` : ''}/>`;
const azarCon = semilla => { let s = semilla; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
// un pino: pisos dentados (cada piso, tres escalones) cada vez más anchos. 'luz' (opcional): el borde del
// lado de la fogata (lado = 1 derecha, -1 izquierda) más claro
function pino(x, base, h, w, cuerpo, luz, lado = 1, tronco = '#1c1210') {
    const pisos = Math.max(4, Math.min(8, Math.round(h / 80) + 3)), alto = h * 0.88 / pisos;
    let r = rect(x - w * 0.06, base - h * 0.14, w * 0.12, h * 0.14, tronco);
    for (let k = 0; k < pisos; k++) {
        const ak = w * (0.28 + 0.72 * (k + 1) / pisos), y = base - h + alto * k;
        [0.45, 0.72, 1].forEach((f, n) => {
            const a = ak * f, yy = y + alto * 0.45 * n;
            r += rect(x - a / 2, yy, a, alto * 0.5 + 1, cuerpo);
            if (luz && n === 2) { const b = Math.max(3, a * 0.22); r += rect(lado > 0 ? x + a / 2 - b : x - a / 2, yy, b, alto * 0.5 + 1, luz); }
        });
    }
    return r;
}
// una fila de pinos de fondo
function arboles(clase, ancho, alto, cuantos, semilla, cuerpo = '', luz = '') {
    const azar = azarCon(semilla);
    let r = '';
    for (let i = 0; i < cuantos; i++) {
        const x = (i + azar() * 0.8) * ancho / cuantos, h = alto * (0.5 + azar() * 0.5);
        r += pino(x, alto, h, h * (0.46 + azar() * 0.12), cuerpo, luz, x < ancho / 2 ? 1 : -1, cuerpo);
    }
    return `<svg class="campo-arboles ${clase}" viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">${r}</svg>`;
}
// troncos altos del bosque (como en un bosque cerrado), salvo donde está la luna
function troncos(ancho, alto, semilla) {
    const azar = azarCon(semilla);
    let r = '';
    for (let x = 20; x < ancho; x += 70 + azar() * 90) {
        if (x / ancho > 0.72 && x / ancho < 0.92) continue;
        const w = 10 + azar() * 16, h = alto * (0.5 + azar() * 0.22); // (bajos: no tapan la luna)
        r += rect(x, alto - h, w, h, '#2a1b3a') + rect(x, alto - h, w * 0.3, h, '#33224a');
        r += rect(x - w * 0.8, alto - h + h * (0.2 + azar() * 0.3), w * 0.8, 4, '#2a1b3a'); // (una rama)
    }
    return `<svg class="campo-troncos" viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">${r}</svg>`;
}
// matorrales en el borde del claro
function matorrales(ancho, alto, semilla) {
    const azar = azarCon(semilla);
    let r = '';
    for (let x = 0; x < ancho; x += 40 + azar() * 120) {
        const w = 40 + azar() * 70, h = alto * (0.45 + azar() * 0.55);
        r += rect(x, alto - h * 0.6, w, h * 0.6, '#14301f') + rect(x + w * 0.15, alto - h, w * 0.7, h * 0.45, '#14301f')
            + rect(x + w * 0.2, alto - h, w * 0.45, h * 0.16, '#24502f') + rect(x + w * 0.05, alto - h * 0.6, w * 0.25, h * 0.12, '#24502f');
    }
    return `<svg class="campo-matas" viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">${r}</svg>`;
}
// los pinos grandes de adelante, a cada lado (enmarcan el claro; el borde de la fogata, iluminado)
function pinosFrente(lado) {
    const W = 280, H = 600, d = lado > 0 ? 1 : -1, xs = x => (d > 0 ? x : W - x);
    const r = pino(xs(70), H, H * 1.02, 250, '#0f2c1d') + pino(xs(190), H, H * 0.7, 170, '#14381f');
    return `<svg class="campo-frente ${lado > 0 ? 'izq' : 'der'}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="${lado > 0 ? 'xMinYMax' : 'xMaxYMax'} meet" shape-rendering="crispEdges">${r}</svg>`;
}
// el bosque de noche (lo comparten la entrada y la sala): cielo con luna, pinos, el claro, la carpa
function bosqueDeNoche() {
    return `<div class="campo-cielo" aria-hidden="true">
            <i class="campo-estrellas"></i>
            <i class="campo-luna"></i>
            ${arboles('lejos', 1600, 150, 34, 7, '#1d1d4a')}
            ${troncos(1600, 300, 5)}
            ${arboles('cerca', 1600, 230, 15, 3, '#0d2019', '#1a3a2a')}
            <i class="campo-ojos" style="left:14%;bottom:12%;--d:0s"></i>
            <i class="campo-ojos" style="left:71%;bottom:18%;--d:-5.5s"></i>
        </div>
        <div class="sala-piso" aria-hidden="true"></div>
        ${matorrales(1600, 60, 11)}
        ${carpa()}
        ${pinosFrente(1)}${pinosFrente(-1)}`;
}
// la carpa del campamento
function carpa() {
    let r = '';
    const W = 120, H = 80, pasos = 10;
    for (let k = 0; k < pasos; k++) {
        const a = W * (k + 1) / pasos, y = H * k / pasos;
        r += rect((W - a) / 2, y, a, H / pasos + 1, '#24364f') + rect((W - a) / 2, y, a * 0.18, H / pasos + 1, '#34506e');
    }
    for (let k = 3; k < pasos; k++) { const a = W * 0.36 * (k - 2) / (pasos - 3); r += rect((W - a) / 2, H * k / pasos, a, H / pasos + 1, '#0d1420'); }
    r += rect(W / 2 - 1, -6, 3, 8, '#5a4030');
    return `<svg class="campo-carpa" viewBox="0 -6 ${W} ${H + 6}" shape-rendering="crispEdges">${r}</svg>`;
}
import { animDe, prefijoValido, urlHoja } from "./vestidor.js"
import { nivelDe, alCambiarNiveles, textoNivel } from "./progreso.js"

const CLAVE_NOMBRE = 'monhabell-aventura-nombre';

// mapas al azar (el anfitrión puede elegir uno fijo): qué está en "🎲 Al azar"
const azar = { nivel: true, pista: true, arena: true, mapaNoche: true };
// mapas de la Noche del Troll (troll.js: MAPAS_NOCHE); viajan en el campo 'arena' de la sala
const MAPAS_NOCHE = { bosque: '🌲 El Bosque de Albora', criptas: '🏰 Las Criptas de Albora' };
const mapaNocheAlAzar = () => { const ids = Object.keys(MAPAS_NOCHE); return ids[sortear(ids.length)]; };
const sortear = n => Math.floor(Math.random() * n);
const nivelAlAzar = () => sortear(NIVELES.length);
// al azar: la mitad de las veces una de siempre y la otra mitad un nivel del juego (hasta el 400)
const pistaAlAzar = () => (Math.random() < 0.5 ? sortear(PISTAS.length) : pistaDeNivel(7 + sortear(393)));
// lo elegido en la lista de pistas: una de siempre, la del día o un mundo
function pistaElegida(valor) {
    if (valor === 'dia') return pistaDelDia();
    if (String(valor).startsWith('mundo:')) return pistaDeMundo(Number(valor.slice(6)) || 1);
    return Number(valor) || 0;
}
// (solo las arenas que el anfitrión ya desbloqueó)
const arenaAlAzar = () => { const libres = ARENAS.filter(arenaDisponible); return (libres[sortear(libres.length)] || ARENAS[0]).id; };
// volver a competir (carrera) y revancha (arena): si estaba al azar, otro mapa
export const pistaParaRevancha = actual => (azar.pista ? pistaAlAzar() : actual);
// copa (carrera.js): la primera pista es la elegida (o al azar) y las otras dos al azar, sin repetir
export function empezarCopa(primera = pistaAlAzar()) {
    const pistas = [primera];
    for (let i = 0; pistas.length < PISTAS_COPA && i < 50; i++) {
        const p = pistaAlAzar();
        if (!pistas.includes(p)) pistas.push(p);
    }
    prepararCopa(pistas); // (avisa a todos antes de 'empezar': el servidor atiende en orden)
    empezarPartida(pistas[0]);
}
export function arenaParaRevancha() {
    if (azar.arena && esAnfitrion() && (red.modo === 'duelo' || red.modo === 'equipos')) elegirModo(red.modo, arenaAlAzar(), red.apuesta);
}
const color = pj => '#' + pj.color.toString(16).padStart(6, '0');

// alEmpezar({ nivel, pj }): el juego arranca la partida en línea
export function iniciarSala(juego, { alEmpezar }) {
    const capa = document.createElement('div');
    // (ocupa toda la pantalla, no solo el recuadro del juego: así caben todas las opciones)
    capa.className = 'menu-capa sala-capa';
    capa.hidden = true;
    capa.innerHTML = `
        <div class="menu-panel menu-panel-ancho sala-panel" role="dialog" aria-modal="true" aria-labelledby="titulo-sala">
            <!-- la entrada también es de noche en el bosque (en la sala, el escenario tiene el suyo) -->
            <div class="sala-fondo" aria-hidden="true">${bosqueDeNoche()}<i class="fondo-fogata"></i></div>
            <div class="sala-cabeza">
                <h2 id="titulo-sala">JUGAR CON AMIGOS</h2>
                <button type="button" class="sala-x" data-accion="cerrar" aria-label="Volver">✕</button>
            </div>

            <!-- el cuerpo se desplaza si no cabe; los botones de abajo siempre se ven -->
            <div class="sala-cuerpo">
            <!-- primer paso (sin desplazarse hacia abajo): arriba tu nombre y la tira de personajes (se ven animados);
                 abajo, lado a lado, las tres formas de jugar -->
            <div class="sala-paso sala-entrar" data-paso="entrar">
                <div class="entrar-quien">
                    <label class="sala-campo entrar-nombre">Tu nombre
                        <input type="text" id="sala-nombre" maxlength="14" autocomplete="nickname" placeholder="Ej: Gesi">
                    </label>
                    <div class="entrar-personajes" role="group" aria-label="Tu personaje" data-personajes></div>
                </div>
                <div class="entrar-acciones">
                    <div class="sala-tarjeta sala-buscar">
                        <span class="tarjeta-icono" aria-hidden="true">🔍</span>
                        <b>Buscar partida</b>
                        <p class="menu-nota">Te unimos a una sala con gente esperando (o creamos una y llegan otros).</p>
                        <div class="tarjeta-pie">
                            <select id="sala-buscar-modo" aria-label="Modo a buscar">
                                <option value="">Todos los modos</option>
                                ${Object.entries(MODOS).map(([m, t]) => `<option value="${m}">${t}</option>`).join('')}
                            </select>
                            <button type="button" class="menu-boton sala-empezar" data-accion="buscar">Buscar</button>
                        </div>
                    </div>
                    <div class="sala-tarjeta">
                        <span class="tarjeta-icono" aria-hidden="true">✚</span>
                        <b>Crear una sala</b>
                        <p class="menu-nota">Te da un código de 4 letras para pasarle a tus amigos (hasta 8).</p>
                        <div class="tarjeta-pie">
                            <button type="button" class="menu-boton sala-empezar" data-accion="crear">Crear sala</button>
                        </div>
                    </div>
                    <div class="sala-tarjeta">
                        <span class="tarjeta-icono" aria-hidden="true">🔑</span>
                        <b>Unirme a una sala</b>
                        <p class="menu-nota">Escribe el código que te pasó tu amigo.</p>
                        <div class="tarjeta-pie menu-fila">
                            <input type="text" id="sala-codigo" maxlength="4" placeholder="CÓDIGO" autocapitalize="characters"
                                autocomplete="off" aria-label="Código de la sala">
                            <button type="button" class="menu-boton" data-accion="unirse">Unirse</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- la sala: el campamento antes de la noche. Un claro del bosque con la fogata al medio y el portal de
                 piedra a la derecha (entrar al portal = LISTO). Encima: el letrero de la partida (arriba a la izquierda),
                 qué falta (arriba al medio), los puestos de los jugadores (izquierda), el código abajo y UN botón
                 principal abajo a la derecha (ESTOY LISTO / EMPEZAR). Las opciones, en un cajón -->
            <div class="sala-paso sala-lobby" data-paso="sala" hidden>
                <div class="sala-escenario" data-escenario>
                    ${bosqueDeNoche()}
                    <i class="campo-tronco izq" aria-hidden="true"></i><i class="campo-tronco der" aria-hidden="true"></i>
                    <div class="campo-fogata" aria-hidden="true">
                        <i class="fogata-luz"></i><i class="fogata-lenos"></i><i class="fogata-llama"></i>
                        <i class="fogata-chispa"></i><i class="fogata-chispa"></i><i class="fogata-chispa"></i><i class="fogata-chispa"></i><i class="fogata-piedras"></i>
                    </div>
                    <div class="campo-portal" aria-hidden="true">
                        <span class="portal-cartel" data-portal-cartel>LISTO</span>
                        <i class="portal-antorcha"></i><i class="portal-remolino"></i><i class="portal-puerta"></i><i class="portal-antorcha der"></i>
                    </div>
                    <div class="campo-niebla" aria-hidden="true"></div>
                </div>
                <button type="button" class="lobby-letrero" data-letrero>
                    <span class="letrero-modo" data-modo-corto></span>
                    <span class="letrero-detalle" data-modo-detalle></span>
                    <span class="letrero-cambiar" data-solo-anfitrion>✎ cambiar</span>
                </button>
                <p class="lobby-estado" data-estado role="status" aria-live="polite"></p>
                <ol class="lobby-puestos" data-puestos aria-label="Jugadores en la sala"></ol>
                <button type="button" class="lobby-salir" data-accion="cerrar" aria-label="Salir de la sala">✕</button>
                <!-- mover a tu personaje: en el celular, botones; en la PC, un recordatorio de las teclas -->
                <div class="lobby-mando lobby-cruz">
                    <button type="button" data-mover="izq" aria-label="Caminar a la izquierda">◀</button>
                    <button type="button" data-mover="der" aria-label="Caminar a la derecha">▶</button>
                </div>
                <button type="button" class="lobby-mando lobby-saltar" data-saltar aria-label="Saltar">▲</button>
                <p class="lobby-teclas" aria-hidden="true"><kbd>←</kbd><kbd>→</kbd> caminar · <kbd>↑</kbd> saltar · entra al portal para decir LISTO</p>
                <div class="lobby-abajo">
                    <div class="sala-codigo lobby-codigo">
                        <span>Código</span><b data-codigo></b>
                        <button type="button" class="sala-copiar" data-copiar aria-label="Copiar el código">Copiar</button>
                        <button type="button" class="sala-copiar lobby-compartir" data-invitar aria-label="Invitar amigos">Invitar</button>
                    </div>
                    <span class="lobby-hueco"></span>
                    <button type="button" class="lobby-icono" data-cajon-abrir aria-expanded="false" aria-label="Personalizar: personaje, equipo y partida" title="Personalizar">⚙</button>
                    <button type="button" class="lobby-principal" data-principal></button>
                </div>
                <aside class="lobby-cajon" data-cajon hidden aria-label="Personalizar">
                    <div class="lobby-cajon-cabeza">
                        <b>Personalizar</b>
                        <button type="button" class="lobby-cerrar-cajon" data-cajon-cerrar aria-label="Cerrar">✕</button>
                    </div>
                    <div class="cajon-pestanas" role="tablist">
                        <button type="button" role="tab" data-cajon-tab="jugadores">👥 Jugadores</button>
                        <button type="button" role="tab" data-cajon-tab="tu">🙂 Tú</button>
                        <button type="button" role="tab" data-cajon-tab="partida">🎮 Partida</button>
                    </div>
                    <div class="lobby-cajon-cuerpo">
                        <div class="sala-columna" data-cajon-panel="jugadores">
                            <ol class="sala-lista" data-lista></ol>
                            <p class="menu-nota">Pásales el código a tus amigos para que entren</p>
                            <label class="sala-publica" data-solo-anfitrion>
                                <input type="checkbox" data-publica> Pública: cualquiera que busque partida puede entrar
                            </label>
                            <p class="menu-nota" data-es-publica hidden>🌐 Sala pública: llegan jugadores que buscan partida</p>
                        </div>
                        <div class="sala-columna" data-cajon-panel="tu" hidden>
                            <div class="menu-opciones cajon-personajes" role="group" aria-label="Tu personaje" data-personajes></div>
                            <fieldset class="menu-grupo" data-equipos hidden>
                                <legend>Tu equipo</legend>
                                <div class="menu-opciones">
                                    <button type="button" class="menu-opcion" data-equipo="0" style="--pj:${COLORES_EQUIPO[0]}">● Rojo</button>
                                    <button type="button" class="menu-opcion" data-equipo="1" style="--pj:${COLORES_EQUIPO[1]}">● Azul</button>
                                </div>
                            </fieldset>
                            <fieldset class="menu-grupo" data-tu-apuesta hidden>
                                <legend>Tu apuesta</legend>
                                <div class="menu-opciones">${APUESTAS.map(a =>
                                    `<button type="button" class="menu-opcion" data-apuesta="${a}">${a ? `◉ ${a}` : 'Nada'}</button>`).join('')}</div>
                                <p class="menu-nota" data-nota-apuesta></p>
                            </fieldset>
                        </div>
                        <div class="sala-columna" data-cajon-panel="partida" hidden>
                            <fieldset class="menu-grupo" data-solo-anfitrion>
                                <legend>Modo</legend>
                                <div class="menu-opciones" data-modos>${Object.entries(MODOS).map(([m, t]) =>
                                    `<button type="button" class="menu-opcion" data-modo="${m}">${t}</button>`).join('')}</div>
                            </fieldset>
                            <label class="sala-campo" data-solo-anfitrion data-solo-arena hidden>Arena
                                <select id="sala-arena"></select>
                            </label>
                            <label class="sala-campo" data-solo-anfitrion data-con-apuesta hidden>Apuesta (cada jugador)
                                <select id="sala-apuesta">${APUESTAS.map(a => `<option value="${a}">${a ? `◉ ${a} monedas` : 'Sin apuesta'}</option>`).join('')}</select>
                            </label>
                            <label class="sala-campo" data-solo-anfitrion data-solo-aventura>Nivel
                                <select id="sala-nivel"><option value="azar" selected>🎲 Al azar</option>${NIVELES.map((n, i) => `<option value="${i}">${i + 1} · ${n.nombre}</option>`).join('')}</select>
                            </label>
                            <label class="sala-campo" data-solo-anfitrion data-solo-noche hidden>Mapa
                                <select id="sala-mapa-noche"><option value="azar" selected>🎲 Al azar</option>${Object.entries(MAPAS_NOCHE).map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</select>
                            </label>
                            <label class="sala-campo" data-solo-anfitrion data-solo-carrera hidden>Formato
                                <select id="sala-formato"><option value="una" selected>Una carrera</option><option value="copa">🏆 Copa (3 pistas, por puntos)</option></select>
                            </label>
                            <label class="sala-campo" data-solo-anfitrion data-solo-carrera hidden>Pista
                                <select id="sala-pista"><option value="azar" selected>🎲 Al azar</option><option value="dia">⭐ Pista del día</option>
                                    <optgroup label="Pistas">${PISTAS.map((p, i) => `<option value="${i}">${p.nombre}</option>`).join('')}</optgroup>
                                    <optgroup label="Mundos del juego">${Array.from({ length: CUANTOS_TEMAS() }, (_, k) => `<option value="mundo:${k + 1}">🌍 ${temaDeMundo(k + 1)}</option>`).join('')}</optgroup></select>
                            </label>
                        </div>
                    </div>
                </aside>
            </div>
            </div>

            <p class="sala-aviso" data-aviso role="status"></p>
        </div>`;
    document.getElementById('game').append(capa);

    const $ = s => capa.querySelector(s);
    const nombre = $('#sala-nombre');
    const codigo = $('#sala-codigo');
    const aviso = $('[data-aviso]');
    try { nombre.value = localStorage.getItem(CLAVE_NOMBRE) || ''; } catch (_e) { /* sin almacenamiento */ }

    let pjElegido = PERSONAJES[0].id;
    let ocupado = false;

    // botones de personaje (en los dos pasos)
    capa.querySelectorAll('[data-personajes]').forEach(caja => {
        caja.innerHTML = PERSONAJES.map(pj => `<button type="button" class="menu-opcion pj-boton" data-pj="${pj.id}" style="--pj:${color(pj)}">
            <span class="pj-mini" aria-hidden="true"></span><span>${pj.nombre}</span></button>`).join('');
    });
    capa.addEventListener('click', e => {
        const b = e.target.closest('[data-pj]');
        if (!b) return;
        pjElegido = b.dataset.pj;
        marcarPersonaje();
        if (red.codigo) { elegirPersonaje(pjElegido); anunciarColores(); }
    });
    // el personaje animado en cada botón (con los colores del vestidor)
    function pintarMinis() {
        capa.querySelectorAll('.pj-boton').forEach(b => {
            const pj = PERSONAJES.find(p => p.id === b.dataset.pj);
            const mini = b.querySelector('.pj-mini');
            if (!pj || !mini) return;
            const [, frames, fps] = pj.hojas.idle;
            mini.style.backgroundImage = `url("${urlHoja(juego, animDe(pj), 'idle')}")`;
            mini.style.setProperty('--n', frames);
            mini.style.setProperty('--fps', fps);
            mini.style.imageRendering = pj.res > 1 ? 'auto' : 'pixelated';
        });
    }
    function marcarPersonaje() {
        capa.querySelectorAll('[data-pj]').forEach(b => {
            const si = b.dataset.pj === pjElegido;
            b.classList.toggle('elegido', si);
            b.setAttribute('aria-pressed', String(si));
        });
    }

    function nombreLimpio() {
        const n = nombre.value.trim().slice(0, 14);
        try { localStorage.setItem(CLAVE_NOMBRE, n); } catch (_e) { /* nada */ }
        return n;
    }

    async function conEspera(trabajo) {
        if (ocupado) return;
        ocupado = true;
        avisar('Conectando…');
        try { await trabajo(); } catch (e) { avisar(e.message || 'No se pudo conectar', true); } finally { ocupado = false; }
    }

    capa.addEventListener('click', e => {
        const accion = e.target.closest('[data-accion]')?.dataset.accion;
        if (accion === 'crear') conEspera(() => crearSala(nombreLimpio(), pjElegido));
        else if (accion === 'buscar') {
            conEspera(async () => {
                await buscarSala(nombreLimpio(), pjElegido, $('#sala-buscar-modo').value);
                avisar('Buscando partida…');
                // un servidor viejo no conoce la búsqueda: no contesta
                const pedido = Date.now();
                setTimeout(() => { if (!red.codigo && Date.now() - pedido >= 5900) avisar('El servidor todavía no tiene la búsqueda automática: crea una sala o únete con código', true); }, 6000);
            });
        }
        else if (accion === 'unirse') {
            const c = codigo.value.trim().toUpperCase();
            if (c.length !== 4) { avisar('El código tiene 4 letras', true); codigo.focus(); return; }
            conEspera(() => unirseSala(c, nombreLimpio(), pjElegido));
        } else if (accion === 'cerrar') {
            if (red.codigo) salirSala();
            cerrar();
        }
    });
    // el anfitrión arranca la partida (con el botón principal o al terminar la cuenta atrás)
    function empezar() {
        {
            // la arena necesita rivales (el servidor también lo revisa)
            const n = red.jugadores.length, equipos = new Set(red.jugadores.map(j => j.equipo));
            if (red.modo === 'duelo' && n !== 2) { avisar('El 1 contra 1 es de 2 jugadores', true); return; }
            if (red.modo === 'equipos' && (n < 2 || equipos.size < 2)) { avisar('Hace falta alguien en cada equipo', true); return; }
            if (red.modo === 'troll') {
                if (n < 2) { avisar('La Noche del Troll necesita al menos 2 jugadores', true); return; }
                // el mapa viaja como 'arena' (al azar: se sortea ahora; el servidor atiende en orden)
                elegirModo('troll', azar.mapaNoche ? mapaNocheAlAzar() : $('#sala-mapa-noche').value, 0);
                empezarPartida(0);
                return;
            }
            if (red.modo === 'carrera') {
                if (n < 2) { avisar('La carrera necesita al menos 2 jugadores', true); return; }
                const falta = red.jugadores.filter(j => j.id !== red.anfitrion && !j.listo);
                if (falta.length) { avisar(`Falta que confirmen: ${falta.map(j => j.nombre).join(', ')}`, true); return; }
                const primera = azar.pista ? pistaAlAzar() : pistaElegida($('#sala-pista').value); // (en la carrera, el número es la pista)
                if ($('#sala-formato').value === 'copa') empezarCopa(primera);
                else empezarPartida(primera);
                return;
            }
            const pobre = red.modo !== 'aventura' && red.jugadores.find(j => (j.monedas || 0) < red.apuesta);
            if (pobre) { avisar(`${pobre.nombre} no tiene ${red.apuesta} monedas para la apuesta`, true); return; }
            // arena al azar: primero se avisa cuál (el servidor atiende los mensajes en orden)
            if (esArena(red.modo) && azar.arena) elegirModo(red.modo, arenaAlAzar(), red.apuesta);
            empezarPartida(red.modo === 'aventura' && azar.nivel ? nivelAlAzar() : Number($('#sala-nivel').value) || 0);
        }
    }
    // carrera y noche: mi apuesta (no más de lo que tengo; cambiarla me deja "no listo")
    capa.addEventListener('click', e => {
        const b = e.target.closest('[data-apuesta]');
        if (!b || !red.codigo || (red.modo !== 'carrera' && red.modo !== 'troll')) return;
        const yo = red.jugadores.find(j => j.id === red.tuId);
        const a = Number(b.dataset.apuesta);
        if (a > saldo()) { avisar(`No tienes ◉ ${a} monedas`, true); return; }
        avisar('');
        if (yo?.apuesta !== a) apostar(a);
    });
    // ---------- el botón principal: ESTOY LISTO (los demás) o EMPEZAR (el anfitrión) ----------
    const principal = $('[data-principal]');
    let confirmarSinEsperar = 0;
    principal.addEventListener('click', () => {
        if (!red.codigo) return;
        const yo = red.jugadores.find(j => j.id === red.tuId);
        if (!esAnfitrion()) {
            ponerListo(!yo?.listo);
            return;
        }
        // el anfitrión puede empezar sin esperar a todos (menos en la carrera, donde todos confirman su apuesta):
        // si falta alguien, pide un segundo toque
        const faltan = red.jugadores.filter(j => j.id !== red.anfitrion && !j.listo);
        if (faltan.length && red.modo !== 'carrera' && performance.now() > confirmarSinEsperar) {
            confirmarSinEsperar = performance.now() + 3000;
            principal.innerHTML = '<span>¿SIN ESPERAR?</span><small>toca otra vez para empezar</small>';
            sonar('bump');
            setTimeout(() => { if (performance.now() >= confirmarSinEsperar) pintarSala(); }, 3050);
            return;
        }
        confirmarSinEsperar = 0;
        empezar();
    });
    function ponerListo(si) {
        const yo = red.jugadores.find(j => j.id === red.tuId);
        if (!red.codigo || esAnfitrion() || !yo || !!yo.listo === si) return;
        marcarListo(si);
        if (si) sonar('moneda');
    }
    // invitar: el menú de compartir del teléfono (o WhatsApp); si no hay, copia el código
    capa.addEventListener('click', async e => {
        if (!e.target.closest('[data-invitar]') || !red.codigo) return;
        const texto = `¡Juega conmigo a Troll Night: La Noche Eterna! Entra a "Jugar con amigos" y usa el código ${red.codigo}`;
        try {
            if (navigator.share) { await navigator.share({ text: texto }); return; }
        } catch (err) { if (err?.name === 'AbortError') return; }
        try { await navigator.clipboard.writeText(red.codigo); avisar(`Código ${red.codigo} copiado: pásaselo a tus amigos`); } catch (_e) { /* nada */ }
        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    });
    // el letrero de la partida: el anfitrión lo toca para cambiar el modo y el mapa
    $('[data-letrero]').addEventListener('click', () => {
        if (!esAnfitrion()) return;
        pestanaCajon('partida');
        abrirCajon(true);
    });
    // el anfitrión cambia el nivel o la pista: el letrero lo dice
    capa.addEventListener('change', e => { if (red.codigo && e.target.closest('[data-cajon]')) pintarSala(); });
    // modo y arena (anfitrión) y equipo (cada jugador)
    capa.addEventListener('click', e => {
        const b = e.target.closest('[data-modo], [data-equipo]');
        if (!b || !red.codigo) return;
        if (b.dataset.modo && esAnfitrion()) elegirModo(b.dataset.modo, b.dataset.modo === 'troll' ? (azar.mapaNoche ? 'bosque' : $('#sala-mapa-noche').value)
            : azar.arena ? red.arena : $('#sala-arena').value || 'bosque', Number($('#sala-apuesta').value) || 0);
        if (b.dataset.equipo) elegirEquipo(Number(b.dataset.equipo));
    });
    $('#sala-arena').addEventListener('change', e => {
        azar.arena = e.target.value === 'azar';
        if (esAnfitrion() && !azar.arena) elegirModo(red.modo, e.target.value, red.apuesta);
    });
    $('#sala-nivel').addEventListener('change', e => { azar.nivel = e.target.value === 'azar'; });
    $('#sala-mapa-noche').addEventListener('change', e => {
        azar.mapaNoche = e.target.value === 'azar';
        if (esAnfitrion() && !azar.mapaNoche) elegirModo('troll', e.target.value, 0);
    });
    $('#sala-pista').addEventListener('change', e => { azar.pista = e.target.value === 'azar'; });
    $('#sala-apuesta').addEventListener('change', e => { if (esAnfitrion()) elegirModo(red.modo, red.arena, Number(e.target.value)); });
    // copiar el código de la sala (para mandarlo por mensaje)
    $('[data-copiar]').addEventListener('click', async e => {
        const b = e.currentTarget;
        try { await navigator.clipboard.writeText(red.codigo || ''); b.textContent = '¡Copiado!'; }
        catch (_e) { b.textContent = 'No se pudo'; }
        setTimeout(() => { b.textContent = 'Copiar'; }, 1500);
    });
    // cajón de opciones (Personalizar): se abre sobre el escenario
    const cajon = $('[data-cajon]');
    const abrirCajon = si => {
        cajon.hidden = !si;
        $('[data-cajon-abrir]').setAttribute('aria-expanded', String(si));
        if (si) $('[data-cajon-abrir]').classList.remove('atencion');
        if (si) cajon.querySelector('[data-cajon-tab].activa')?.focus({ preventScroll: true });
    };
    function pestanaCajon(t) {
        capa.querySelectorAll('[data-cajon-tab]').forEach(b => {
            b.classList.toggle('activa', b.dataset.cajonTab === t);
            b.setAttribute('aria-selected', String(b.dataset.cajonTab === t));
        });
        capa.querySelectorAll('[data-cajon-panel]').forEach(p => { p.hidden = p.dataset.cajonPanel !== t; });
    }
    capa.addEventListener('click', e => { const b = e.target.closest('[data-cajon-tab]'); if (b) pestanaCajon(b.dataset.cajonTab); });
    // al abrir: el anfitrión ve la partida; los demás, lo suyo (personaje, equipo, apuesta)
    $('[data-cajon-abrir]').addEventListener('click', () => { if (cajon.hidden) pestanaCajon(esAnfitrion() ? 'partida' : 'tu'); abrirCajon(cajon.hidden); });
    $('[data-cajon-cerrar]').addEventListener('click', () => { abrirCajon(false); $('[data-cajon-abrir]').focus(); });
    codigo.addEventListener('input', () => { codigo.value = codigo.value.toUpperCase().replace(/[^A-Z]/g, ''); });
    codigo.addEventListener('keydown', e => { if (e.key === 'Enter') capa.querySelector('[data-accion="unirse"]').click(); });

    // ---------- mensajes del servidor ----------
    alRecibir('sala', () => { avisar(''); anunciarColores(); dibujarSala(); pintarPublica(); });
    // llegó el nivel de alguien (progreso.js): se vuelve a dibujar la lista y las etiquetas
    alCambiarNiveles(() => { if (!capa.hidden && red.codigo) dibujarSala(); });
    // sala pública: el anfitrión la abre o la cierra a la búsqueda automática
    $('[data-publica]').addEventListener('change', e => hacerPublica(e.target.checked));
    function pintarPublica() {
        $('[data-publica]').checked = red.publica;
        $('[data-es-publica]').hidden = !red.publica || esAnfitrion();
    }
    // colores de los demás (prefijo de animación: "arquera~b4202a.o.o.o")
    const coloresDe = new Map();
    alRecibir('evento', m => {
        if (m.tipo !== 'colores' || m.de == null || !prefijoValido(m.prefijo)) return;
        if (coloresDe.get(m.de) === m.prefijo) return;
        coloresDe.set(m.de, m.prefijo);
        if (!capa.hidden) actualizarEscenario();
    });
    function anunciarColores() {
        if (red.codigo) enviarEvento('colores', { prefijo: animDe(pjElegido) });
        // y las monedas (para la apuesta de la arena), solo si cambiaron
        const yo = red.jugadores.find(j => j.id === red.tuId);
        if (red.codigo && yo && yo.monedas !== saldo()) informarSaldo(saldo());
    }
    alRecibir('error', m => avisar(m.motivo, true));
    alRecibir('empezar', m => {
        const yo = m.jugadores.find(j => j.id === red.tuId);
        cerrar();
        alEmpezar({ nivel: m.nivel, pj: yo?.pj || pjElegido, modo: m.modo, arena: m.arena, jugadores: m.jugadores, apuesta: m.apuesta });
    });
    alRecibir('desconectado', () => {
        avisar('Se perdió la conexión con el servidor', true);
        mostrarPaso('entrar');
    });

    function dibujarSala() {
        if (!red.codigo) { mostrarPaso('entrar'); return; }
        mostrarPaso('sala');
        $('[data-codigo]').textContent = red.codigo;
        const yo = red.jugadores.find(j => j.id === red.tuId);
        if (yo) { pjElegido = yo.pj; marcarPersonaje(); }
        const porEquipos = red.modo === 'equipos', enArena = esArena(red.modo), carrera = red.modo === 'carrera';
        const conApuesta = enArena || carrera;
        $('[data-lista]').innerHTML = red.jugadores.map(j => {
            const pj = PERSONAJES.find(p => p.id === j.pj) || PERSONAJES[0];
            const marcas = `${j.id === red.anfitrion ? ' ★' : ''}${j.id === red.tuId ? ' (tú)' : ''}`;
            const eq = porEquipos ? `<span class="sala-equipo" style="color:${COLORES_EQUIPO[j.equipo === 1 ? 1 : 0]}">●</span> ` : '';
            // en la carrera: lo que apuesta cada uno y si ya está listo; en la arena, sus monedas
            const listo = j.id === red.anfitrion ? '' : j.listo ? ' <small class="sala-listo">✔ listo</small>' : ' <small class="sala-pensando">eligiendo…</small>';
            const mon = carrera ? ` <small class="sala-monedas">apuesta ◉ ${j.apuesta || 0}</small>${listo}`
                : conApuesta ? ` <small class="sala-monedas">◉ ${j.monedas || 0}</small>` : '';
            const nv = nivelDe(j.id) ? ` <small class="sala-nv">${textoNivel(nivelDe(j.id))}</small>` : '';
            return `<li>${eq}<span class="sala-pj" style="--pj:${color(pj)}">${pj.nombre}</span> ${escapar(j.nombre)}${nv}${marcas}${mon}</li>`;
        }).join('');
        const anfitrion = esAnfitrion();
        // modo: el anfitrión lo elige; los demás lo ven escrito
        capa.querySelectorAll('[data-modo]').forEach(b => {
            b.classList.toggle('elegido', b.dataset.modo === red.modo);
            b.setAttribute('aria-pressed', String(b.dataset.modo === red.modo));
        });
        const yo2 = red.jugadores.find(j => j.id === red.tuId);
        $('[data-equipos]').hidden = !porEquipos;
        capa.querySelectorAll('[data-equipo]').forEach(b => {
            const si = porEquipos && Number(b.dataset.equipo) === (yo2?.equipo === 1 ? 1 : 0);
            b.classList.toggle('elegido', si);
            b.setAttribute('aria-pressed', String(si));
        });
        // arenas: las bloqueadas dicen cuántas victorias faltan
        const v = victoriasArena();
        $('#sala-arena').innerHTML = `<option value="azar" ${azar.arena ? 'selected' : ''}>🎲 Al azar</option>` + ARENAS.map(a => `<option value="${a.id}" ${arenaDisponible(a) ? '' : 'disabled'} ${!azar.arena && a.id === red.arena ? 'selected' : ''}>${a.nombre}${
            arenaDisponible(a) ? '' : ` · 🔒 faltan ${a.victorias - v} victorias`}</option>`).join('');
        $('#sala-apuesta').value = String(red.apuesta || 0);
        capa.querySelectorAll('[data-solo-anfitrion]').forEach(el => { el.hidden = !anfitrion; });
        capa.querySelectorAll('[data-solo-arena]').forEach(el => { el.hidden = !anfitrion || !enArena; });
        capa.querySelectorAll('[data-con-apuesta]').forEach(el => { el.hidden = !anfitrion || !enArena; });
        capa.querySelectorAll('[data-solo-aventura]').forEach(el => { el.hidden = !anfitrion || red.modo !== 'aventura'; });
        capa.querySelectorAll('[data-solo-carrera]').forEach(el => { el.hidden = !carrera || (el.matches('[data-solo-anfitrion]') && !anfitrion); });
        capa.querySelectorAll('[data-solo-noche]').forEach(el => { el.hidden = !anfitrion || red.modo !== 'troll'; });
        // la apuesta: en la carrera y en la noche (cada uno la suya)
        $('[data-tu-apuesta]').hidden = !carrera && red.modo !== 'troll';
        $('[data-nota-apuesta]').textContent = carrera ? 'Si ganas, cada rival te paga lo que apostaste (o lo que apostó él, si es menos)'
            : 'Gana tu bando (héroes o troll): se reparten lo que apostó el bando que perdió, según cuánto apostó cada uno';
        // mi apuesta y mi "listo" (el anfitrión no confirma: él arranca)
        capa.querySelectorAll('[data-apuesta]').forEach(b => {
            const si = Number(b.dataset.apuesta) === (yo2?.apuesta || 0);
            b.classList.toggle('elegido', si);
            b.setAttribute('aria-pressed', String(si));
            b.disabled = Number(b.dataset.apuesta) > saldo();
        });
        pintarSala();
        actualizarEscenario();
    }

    // ---------- el letrero, los puestos, el botón principal, qué falta y la cuenta atrás ----------
    const otrosDe = () => red.jugadores.filter(j => j.id !== red.anfitrion);
    const todosListos = () => red.jugadores.length >= Math.max(2, MINIMO[red.modo] || 1) && otrosDe().every(j => j.listo);
    function pintarSala() {
        if (!red.codigo) return;
        const anfitrion = esAnfitrion(), carrera = red.modo === 'carrera', enArena = esArena(red.modo);
        const yo = red.jugadores.find(j => j.id === red.tuId);
        // letrero: modo y mapa
        const [icono, nombreModo] = MODO_CORTO[red.modo] || MODO_CORTO.aventura;
        const arenaSel = ARENAS.find(a => a.id === red.arena);
        const nivelSel = NIVELES[Number($('#sala-nivel').value)];
        const pistaSel = $('#sala-pista');
        $('[data-modo-corto]').textContent = `${icono} ${nombreModo}`;
        $('[data-modo-detalle]').textContent = carrera
            ? `${anfitrion ? `${azar.pista ? '🎲 pista al azar' : pistaSel.selectedOptions[0]?.textContent || ''}${$('#sala-formato').value === 'copa' ? ' · 🏆 copa' : ''} · ` : ''}en juego ◉ ${red.jugadores.reduce((t, j) => t + (j.apuesta || 0), 0)}`
            : enArena
            ? `${azar.arena && anfitrion ? '🎲 arena al azar' : arenaSel?.nombre || ''} · al mejor de 3 · ${red.apuesta ? `◉ ${red.apuesta} cada uno` : 'sin apuesta'}`
            : red.modo === 'troll'
            ? `${azar.mapaNoche && anfitrion ? '🎲 mapa al azar' : MAPAS_NOCHE[red.arena] || ''} · uno es el troll en secreto`
            : `Todos atados con la cadena${anfitrion ? ` · ${azar.nivel || !nivelSel ? '🎲 nivel al azar' : `nivel ${Number($('#sala-nivel').value) + 1}`}` : ''}`;
        const letrero = $('[data-letrero]');
        letrero.classList.toggle('editable', anfitrion);
        letrero.setAttribute('aria-disabled', String(!anfitrion));
        letrero.title = anfitrion ? 'Cambiar el modo y el mapa' : '';
        // puestos: los que están (★ anfitrión, ✔ listo, … pensando) y los lugares libres
        const cupo = red.modo === 'duelo' ? 2 : enArena ? 4 : 8;
        const puestos = red.jugadores.map(j => {
            const pj = PERSONAJES.find(p => p.id === j.pj) || PERSONAJES[0];
            const host = j.id === red.anfitrion, estado = host ? 'anfitrion' : j.listo ? 'listo' : 'espera';
            const dice = host ? 'anfitrión' : j.listo ? 'listo' : 'todavía no está listo';
            return `<li class="puesto ${estado}${j.id === red.tuId ? ' yo' : ''}" style="--pj:${color(pj)}" title="${escapar(j.nombre)}: ${dice}">
                <span class="puesto-cara" data-cara="${j.id}" aria-hidden="true"></span>
                <span class="puesto-nombre">${escapar(j.nombre)}${j.id === red.tuId ? ' <small>(tú)</small>' : ''}</span>
                <span class="puesto-estado" aria-label="${dice}">${host ? '★' : j.listo ? '✔' : '…'}</span></li>`;
        });
        // (lugares libres: hasta 2 en la PC para que la lista no tape la pantalla; en el celular van todos en fila)
        const libres = cupo - red.jugadores.length;
        for (let i = 0; i < libres; i++) puestos.push(`<li class="puesto vacio${i >= 2 ? ' extra' : ''}"><button type="button" data-invitar>＋ <span>Invitar${i === 1 && libres > 2 ? ` · ${libres} lugares` : ''}</span></button></li>`);
        $('[data-puestos]').innerHTML = puestos.join('');
        capa.querySelectorAll('[data-cara]').forEach(el => {
            const j = red.jugadores.find(x => String(x.id) === el.dataset.cara), pj = PERSONAJES.find(p => p.id === j?.pj) || PERSONAJES[0];
            const suyo = j?.id === red.tuId ? animDe(pj) : coloresDe.get(j?.id);
            el.style.backgroundImage = `url("${urlHoja(juego, suyo && suyo.split('~')[0] === pj.id ? suyo : pj.id, 'idle')}")`;
            el.style.setProperty('--n', pj.hojas.idle[1]);
        });
        // el botón principal
        const otros = otrosDe(), listos = otros.filter(j => j.listo).length;
        if (performance.now() < confirmarSinEsperar) { /* (está preguntando "¿sin esperar?") */ }
        else if (anfitrion) {
            principal.className = `lobby-principal empezar${todosListos() || !otros.length ? ' brilla' : ''}`;
            principal.innerHTML = `<span>▶ EMPEZAR</span>${otros.length ? `<small>${listos} de ${otros.length} listos</small>` : '<small>o espera a tus amigos</small>'}`;
        } else {
            principal.className = `lobby-principal ${yo?.listo ? 'hecho' : 'brilla'}`;
            principal.innerHTML = yo?.listo ? '<span>✔ LISTO</span><small>toca para cancelar</small>' : '<span>✋ ESTOY LISTO</span>';
        }
        $('[data-portal-cartel]').textContent = anfitrion ? '★ TÚ EMPIEZAS' : yo?.listo ? '✔ LISTO' : 'LISTO ➜';
        $('[data-portal-cartel]').closest('.campo-portal').classList.toggle('abierto', !!yo?.listo || anfitrion);
        // carrera y noche: la apuesta se elige en Personalizar (el engranaje avisa si aún no estás listo)
        $('[data-cajon-abrir]').classList.toggle('atencion', carrera && !anfitrion && !yo?.listo && cajon.hidden);
        revisarCuenta();
        pintarEstado();
    }
    // qué falta, en una frase
    function pintarEstado() {
        const n = red.jugadores.length, anfitrion = esAnfitrion(), yo = red.jugadores.find(j => j.id === red.tuId);
        const faltan = otrosDe().filter(j => !j.listo), minimo = MINIMO[red.modo] || 1;
        const nombres = l => l.length <= 2 ? l.map(j => j.nombre).join(' y ') : `${l[0].nombre}, ${l[1].nombre} y ${l.length - 2} más`;
        let texto;
        if (cuenta?.fin) texto = `🔥 ¡Todos listos! Empieza en ${Math.max(1, Math.ceil((cuenta.fin - performance.now()) / 1000))}…`;
        else if (n < minimo) texto = anfitrion ? `Faltan jugadores: este modo es de ${minimo} o más` : 'Esperando a que lleguen más jugadores…';
        else if (n === 1) texto = 'Invita amigos o empieza solo';
        else if (!anfitrion && !yo?.listo) texto = red.modo === 'carrera' ? '👉 Elige tu apuesta en ⚙ y toca ESTOY LISTO (o entra al portal)' : '👉 Toca ESTOY LISTO o entra al portal';
        else if (faltan.length) texto = `Esperando a que ${nombres(faltan)} ${faltan.length > 1 ? 'digan' : 'diga'} LISTO`;
        else texto = anfitrion ? '¡Todos listos! Toca ▶ EMPEZAR' : 'Esperando a que el anfitrión empiece';
        const el = $('[data-estado]');
        if (el.textContent !== texto) el.textContent = texto;
        el.classList.toggle('cuenta', !!cuenta?.fin);
    }
    // todos listos: cuenta atrás de 5 s (la ven todos; al llegar a 0 arranca el anfitrión). Si alguien
    // cancela, se corta. Termina una sola vez: si el servidor no deja empezar, no vuelve a contar sola
    let cuenta = null;
    function revisarCuenta() {
        const si = todosListos() && !$('[data-paso="sala"]').hidden && !capa.hidden;
        if (si && !cuenta) {
            cuenta = { fin: performance.now() + CUENTA_ATRAS * 1000 };
            cuenta.reloj = setInterval(() => {
                if (!cuenta?.fin) return;
                if (performance.now() >= cuenta.fin) {
                    clearInterval(cuenta.reloj);
                    cuenta = { hecha: true };
                    escenario.classList.remove('contando');
                    if (esAnfitrion()) empezar();
                }
                pintarEstado();
            }, 200);
            escenario.classList.add('contando');
            sonar('aparece');
        } else if (!si && cuenta) {
            clearInterval(cuenta.reloj);
            cuenta = null;
            escenario.classList.remove('contando');
        }
    }

    // ---------- escenario: los personajes de la sala paseando ----------
    const escenario = $('[data-escenario]');
    const actores = new Map(); // id del jugador -> { el, sprite, etiqueta, x, destino, pj, quieto }
    let animando = 0, ultimo = 0;
    const VEL = 55;          // px/s al pasear solos
    const VEL_MANDO = 150;   // px/s cuando los mueve su jugador (flechas, botones o tocando el piso)
    const ENVIO_POS_MS = 100; // mi posición a los demás, ~10 veces por segundo
    const MANDO_MS = 10000;  // un jugador que movió a su personaje hace poco: ese ya no pasea solo
    // el piso tiene fondo (como la nave de Among Us): y = px hacia el fondo; los de atrás se ven más chicos
    const fondoPiso = () => (escenario.clientHeight || 200) * 0.22;
    const zonaPortal = () => Math.max(70, (escenario.clientWidth || 400) * 0.09); // (el portal, a la derecha)
    const pjDe = a => PERSONAJES.find(p => p.id === a.pj) || PERSONAJES[0];
    // cambia la animación solo si es otra (no se recarga la hoja en cada cuadro)
    const animar = (a, anim) => { if (a.sprite.dataset.anim !== anim) hoja(a.sprite, pjDe(a), anim, a.prefijo); };

    // ---------- mover a tu personaje: ← → (o A/D) caminan, ↑ / W / ESPACIO saltan; en el celular, botones ----------
    const mando = { izq: false, der: false };
    let ultimaPos = 0, posEnviada = '';
    function saltar(a, avisar) {
        if (!a || a.el.classList.contains('saltando') || a.el.classList.contains('entrando')) return;
        a.el.classList.add('saltando');
        sonar('salto');
        if (avisar) enviarEvento('salaPos', { ...posDe(a), salto: 1 });
    }
    // la posición viaja en fracciones del escenario (cada pantalla tiene otro tamaño)
    const posDe = a => ({ x: Math.round(a.x / (escenario.clientWidth || 1) * 1000) / 1000, y: Math.round(a.y / (fondoPiso() || 1) * 1000) / 1000 });
    const enLaSala = () => !capa.hidden && !!red.codigo && !$('[data-paso="sala"]').hidden;
    const TECLAS = { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der' };
    const SALTO = new Set(['ArrowUp', 'KeyW', 'Space']);
    // (dentro del cajón de opciones y en los campos las teclas hacen lo de siempre; afuera, ESPACIO salta
    // aunque haya un botón con foco: así no se sale de la sala sin querer con el ✕. ENTER sigue apretando botones)
    const teclasLibres = e => !enLaSala() || !!e.target.closest?.('input, select, textarea, [data-cajon]');
    document.addEventListener('keydown', e => {
        if (teclasLibres(e)) return;
        if (TECLAS[e.code]) { mando[TECLAS[e.code]] = true; e.preventDefault(); }
        else if (SALTO.has(e.code)) {
            e.preventDefault();
            if (!e.repeat) saltar(actores.get(red.tuId), true);
        }
    });
    document.addEventListener('keyup', e => {
        if (TECLAS[e.code]) mando[TECLAS[e.code]] = false;
        if (e.code === 'Space' && !teclasLibres(e)) e.preventDefault(); // (el botón con foco se apretaría al soltar)
    });
    window.addEventListener('blur', () => { mando.izq = mando.der = false; });
    // botones táctiles (se ven solo en pantallas táctiles: ver .lobby-mando en index.html)
    capa.querySelectorAll('[data-mover]').forEach(b => {
        const lado = b.dataset.mover;
        const soltar = () => { mando[lado] = false; b.classList.remove('apretado'); };
        b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); mando[lado] = true; b.classList.add('apretado'); });
        b.addEventListener('pointerup', soltar);
        b.addEventListener('pointercancel', soltar);
        b.addEventListener('lostpointercapture', soltar);
    });
    $('[data-saltar]').addEventListener('pointerdown', e => { e.preventDefault(); saltar(actores.get(red.tuId), true); });

    // tocar el piso: tu personaje camina hasta ahí
    escenario.addEventListener('pointerdown', e => {
        const a = actores.get(red.tuId);
        if (!a) return;
        const caja = escenario.getBoundingClientRect();
        a.destino = Math.max(30, Math.min(caja.width - 30, e.clientX - caja.left));
        a.destinoY = Math.max(0, Math.min(fondoPiso(), caja.bottom - e.clientY - 10));
        animar(a, 'run');
    });

    // los demás: caminan hasta donde dicen que están (y saltan si saltaron)
    alRecibir('evento', m => {
        if (m.tipo !== 'salaPos' || !enLaSala()) return;
        const a = actores.get(m.de);
        if (!a || !Number.isFinite(m.x) || !Number.isFinite(m.y)) return;
        a.mandado = performance.now();
        a.destino = Math.max(0, Math.min(1, m.x)) * escenario.clientWidth;
        a.destinoY = Math.max(0, Math.min(1, m.y)) * fondoPiso();
        if (Math.hypot(a.destino - a.x, a.destinoY - a.y) >= 1) animar(a, 'run');
        if (m.salto) saltar(a, false);
    });

    // pone en el sprite la hoja de una animación ('idle' o 'run') del personaje
    function hoja(sprite, pj, anim, prefijo = pj.id) {
        const [, frames, fps] = pj.hojas[anim];
        sprite.style.backgroundImage = `url("${urlHoja(juego, prefijo, anim)}")`;
        sprite.style.setProperty('--n', frames);
        sprite.style.setProperty('--fps', fps);
        sprite.dataset.anim = anim;
        sprite.style.imageRendering = pj.res > 1 ? 'auto' : ''; // héroes HD: suaves, no en cuadritos
    }

    function actualizarEscenario() {
        const ancho = escenario.clientWidth || 400;
        const vivos = new Set();
        red.jugadores.forEach(j => {
            vivos.add(j.id);
            const pj = PERSONAJES.find(p => p.id === j.pj) || PERSONAJES[0];
            // sus colores: los míos los sé; los de los demás llegan por evento (si son de otro héroe, aún no)
            const suyo = j.id === red.tuId ? animDe(pj) : coloresDe.get(j.id);
            const prefijo = suyo && suyo.split('~')[0] === pj.id ? suyo : pj.id;
            let a = actores.get(j.id);
            if (!a) {
                // recién llegado: cae desde arriba en un lugar al azar
                const el = document.createElement('div');
                el.className = 'sala-heroe entrando';
                el.innerHTML = '<span class="sala-etiqueta"></span><div class="sala-sprite"></div>';
                escenario.append(el);
                // (lejos del portal: entrar ahí es decir LISTO)
                a = { el, sprite: el.querySelector('.sala-sprite'), etiqueta: el.querySelector('.sala-etiqueta'),
                    x: 40 + Math.random() * Math.max(1, ancho - 80 - zonaPortal()), y: Math.random() * fondoPiso(), destino: null, destinoY: 0, quieto: 0 };
                a.el.addEventListener('animationend', () => a.el.classList.remove('entrando', 'saltando'));
                actores.set(j.id, a);
                if (actores.size > 1) sonar('aparece');
            }
            if (a.pj !== pj.id || a.prefijo !== prefijo) {
                if (a.pj && a.pj !== pj.id) { a.el.classList.add('saltando'); sonar('salto'); } // cambió de personaje: salta
                a.pj = pj.id;
                a.prefijo = prefijo;
                hoja(a.sprite, pj, a.destino === null ? 'idle' : 'run', prefijo);
            }
            a.el.style.setProperty('--pj', color(pj));
            a.el.classList.toggle('yo', j.id === red.tuId);
            a.el.classList.toggle('listo', j.id !== red.anfitrion && !!j.listo);
            a.etiqueta.textContent = `${nivelDe(j.id) ? `${textoNivel(nivelDe(j.id))} · ` : ''}${j.id === red.anfitrion ? '★ ' : ''}${j.nombre}${red.modo === 'carrera' ? ` · ◉${j.apuesta || 0}${j.listo ? ' ✔' : ''}` : ''}`;
        });
        // los que se fueron se desvanecen
        actores.forEach((a, id) => {
            if (vivos.has(id)) return;
            actores.delete(id);
            a.el.classList.add('saliendo');
            setTimeout(() => a.el.remove(), 400);
        });
        if (!animando) { ultimo = performance.now(); animando = requestAnimationFrame(pasear); }
    }

    // cada personaje elige a ratos un lugar al que caminar, o se queda quieto un momento
    function pasear(ahora) {
        const dt = Math.min(0.05, (ahora - ultimo) / 1000);
        ultimo = ahora;
        const ancho = escenario.clientWidth, fondo = fondoPiso();
        actores.forEach((a, id) => {
            const yo = id === red.tuId;
            const dir = yo ? (mando.der ? 1 : 0) - (mando.izq ? 1 : 0) : 0;
            const mandado = !yo && ahora - (a.mandado || -MANDO_MS) < MANDO_MS;
            if (dir) {
                // flechas o botones: camina mientras están apretados (deja lo que estaba haciendo)
                a.destino = null;
                a.x += dir * VEL_MANDO * dt;
                a.sprite.classList.toggle('izquierda', dir < 0);
                animar(a, 'run');
            } else if (a.destino === null) {
                if (yo) animar(a, 'idle');
                a.quieto -= dt;
                // los demás pasean solos (salvo que su jugador los esté moviendo); el tuyo solo camina si lo mueves
                if (a.quieto <= 0 && ancho && !yo && !mandado) {
                    a.destino = 40 + Math.random() * Math.max(1, ancho - 80 - zonaPortal());
                    a.destinoY = Math.random() * fondo;
                    animar(a, 'run');
                }
            } else {
                const dx = a.destino - a.x, dy = a.destinoY - a.y, d = Math.hypot(dx, dy);
                if (Math.abs(dx) > 1) a.sprite.classList.toggle('izquierda', dx < 0);
                const paso = Math.min(d, (yo || mandado ? VEL_MANDO : VEL) * dt);
                if (d > 0) { a.x += dx / d * paso; a.y += dy / d * paso; }
                if (d < 1) {
                    a.destino = null;
                    a.quieto = 1.2 + Math.random() * 3;
                    animar(a, 'idle');
                }
            }
            a.x = Math.max(30, Math.min(Math.max(30, ancho - 30), a.x));
            a.y = Math.max(0, Math.min(fondo, a.y));
            // entrar al portal (a la derecha) = LISTO
            if (yo) {
                const dentro = a.x > ancho - zonaPortal();
                if (dentro && !a.enPortal) {
                    if (esAnfitrion()) avisar('Tú eres el anfitrión: toca ▶ EMPEZAR cuando estén todos');
                    else ponerListo(true);
                }
                a.enPortal = dentro;
            }
            // mi posición a los demás (solo si cambió)
            if (yo && ahora - ultimaPos > ENVIO_POS_MS) {
                const p = posDe(a), clave = `${p.x},${p.y}`;
                if (clave !== posEnviada) { posEnviada = clave; ultimaPos = ahora; enviarEvento('salaPos', p); }
            }
            // más al fondo: más arriba, más chico y detrás de los demás
            const escala = 1 - (fondo ? a.y / fondo : 0) * 0.22;
            a.el.style.transform = `translate(${a.x}px, ${-a.y}px) scale(${escala.toFixed(3)})`;
            a.el.style.zIndex = String(1000 - Math.round(a.y));
        });
        animando = !capa.hidden && red.codigo ? requestAnimationFrame(pasear) : 0;
    }

    function sonar(clave) {
        try { if (juego.sound && juego.cache.audio.exists(clave)) juego.sound.play(clave, { volume: 0.4 }); } catch (_e) { /* sin sonido */ }
    }

    function mostrarPaso(paso) {
        capa.querySelectorAll('.sala-paso').forEach(p => { p.hidden = p.dataset.paso !== paso; });
        capa.classList.toggle('en-sala', paso === 'sala'); // (en la sala: escenario a pantalla completa)
        if (paso !== 'sala') { abrirCajon(false); if (cuenta) { clearInterval(cuenta.reloj); cuenta = null; } }
    }

    function avisar(texto, error = false) {
        aviso.textContent = texto;
        aviso.classList.toggle('error', error);
    }

    function cerrar() {
        if (capa.contains(document.activeElement)) document.activeElement.blur();
        capa.hidden = true;
        if (cuenta) { clearInterval(cuenta.reloj); cuenta = null; escenario.classList.remove('contando'); }
        // al salir de la sala se vacía el escenario (al volver, todos entran de nuevo)
        actores.forEach(a => a.el.remove());
        actores.clear();
        teclado(true);
    }

    // mientras la sala está abierta el juego no usa el teclado (si no, no se podría escribir el nombre)
    function teclado(activo) {
        if (juego.input?.keyboard) juego.input.keyboard.enabled = activo;
    }

    // abre la sala de espera (desde el menú del título)
    return function abrir() {
        avisar('');
        pintarMinis();
        marcarPersonaje();
        anunciarColores();
        // al volver de una partida: cada uno vuelve a decir LISTO (si no, la cuenta atrás arrancaría sola)
        const yo = red.jugadores.find(j => j.id === red.tuId);
        if (red.codigo && yo?.listo && !esAnfitrion()) marcarListo(false);
        capa.hidden = false;
        dibujarSala();
        teclado(false);
        (red.codigo ? $('.lobby-salir') : nombre).focus({ preventScroll: true });
    };
}

function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
