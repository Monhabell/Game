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
import { PISTAS } from "./pistas.js"
import { ARENAS, APUESTAS, COLORES_EQUIPO, arenaDisponible, victoriasArena, copasArena, ligaDe } from "./arena.js"
import { saldo } from "./tienda.js"

const MODOS = { aventura: 'Aventura (en cadena)', duelo: 'Arena · 1 contra 1', equipos: 'Arena · por equipos', carrera: '🏁 Carrera', troll: '🌙 Noche del Troll' };
const esArena = modo => modo === 'duelo' || modo === 'equipos';
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
const pistaAlAzar = () => sortear(PISTAS.length);
// (solo las arenas que el anfitrión ya desbloqueó)
const arenaAlAzar = () => { const libres = ARENAS.filter(arenaDisponible); return (libres[sortear(libres.length)] || ARENAS[0]).id; };
// volver a competir (carrera) y revancha (arena): si estaba al azar, otro mapa
export const pistaParaRevancha = actual => (azar.pista ? pistaAlAzar() : actual);
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
                                <option value="">Cualquier modo</option>
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

            <!-- la sala, como en Among Us: el escenario ocupa todo y encima van la partida (arriba a la izquierda),
                 el código y cuántos son (abajo) y Personalizar / Empezar (abajo a la derecha); las opciones, en un cajón -->
            <div class="sala-paso sala-lobby" data-paso="sala" hidden>
                <div class="sala-escenario" data-escenario>
                    <div class="sala-nave" aria-hidden="true"><i class="sala-ventana"></i><i class="sala-ventana"></i><i class="sala-ventana"></i></div>
                    <div class="sala-piso" aria-hidden="true"></div>
                </div>
                <div class="lobby-partida">
                    <b>Partida</b>
                    <p data-modo-texto></p>
                    <p class="lobby-espera" data-esperando>Esperando a que el anfitrión empiece…</p>
                </div>
                <button type="button" class="lobby-salir" data-accion="cerrar" aria-label="Salir de la sala">✕</button>
                <!-- mover a tu personaje: en el celular, botones; en la PC, un recordatorio de las teclas -->
                <div class="lobby-mando lobby-cruz">
                    <button type="button" data-mover="izq" aria-label="Caminar a la izquierda">◀</button>
                    <button type="button" data-mover="der" aria-label="Caminar a la derecha">▶</button>
                </div>
                <button type="button" class="lobby-mando lobby-saltar" data-saltar aria-label="Saltar">▲</button>
                <p class="lobby-teclas" aria-hidden="true"><kbd>←</kbd><kbd>→</kbd> caminar · <kbd>↑</kbd> saltar · o toca el piso</p>
                <div class="lobby-abajo">
                    <div class="sala-codigo lobby-codigo">
                        <span>Código</span><b data-codigo></b>
                        <button type="button" class="sala-copiar" data-copiar aria-label="Copiar el código">Copiar</button>
                    </div>
                    <span class="lobby-cuenta" data-cuenta aria-label="Jugadores en la sala"></span>
                    <span class="lobby-hueco"></span>
                    <button type="button" class="lobby-boton" data-cajon-abrir aria-expanded="false">⚙ Personalizar</button>
                    <button type="button" class="lobby-boton lobby-empezar" data-accion="empezar" hidden>▶ Empezar</button>
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
                            <fieldset class="menu-grupo" data-solo-carrera hidden>
                                <legend>Tu apuesta</legend>
                                <div class="menu-opciones">${APUESTAS.map(a =>
                                    `<button type="button" class="menu-opcion" data-apuesta="${a}">${a ? `◉ ${a}` : 'Nada'}</button>`).join('')}</div>
                                <p class="menu-nota">Si ganas, cada rival te paga lo que apostaste (o lo que apostó él, si es menos)</p>
                                <button type="button" class="menu-boton" data-listo>✔ Estoy listo</button>
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
                            <label class="sala-campo" data-solo-anfitrion data-solo-carrera hidden>Pista
                                <select id="sala-pista"><option value="azar" selected>🎲 Al azar</option>${PISTAS.map((p, i) => `<option value="${i}">${p.nombre}</option>`).join('')}</select>
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
        } else if (accion === 'empezar') {
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
                empezarPartida(azar.pista ? pistaAlAzar() : Number($('#sala-pista').value) || 0); // (en la carrera, el número es la pista)
                return;
            }
            const pobre = red.modo !== 'aventura' && red.jugadores.find(j => (j.monedas || 0) < red.apuesta);
            if (pobre) { avisar(`${pobre.nombre} no tiene ${red.apuesta} monedas para la apuesta`, true); return; }
            // arena al azar: primero se avisa cuál (el servidor atiende los mensajes en orden)
            if (esArena(red.modo) && azar.arena) elegirModo(red.modo, arenaAlAzar(), red.apuesta);
            empezarPartida(red.modo === 'aventura' && azar.nivel ? nivelAlAzar() : Number($('#sala-nivel').value) || 0);
        } else if (accion === 'cerrar') {
            if (red.codigo) salirSala();
            cerrar();
        }
    });
    // carrera: mi apuesta (no más de lo que tengo) y "listo"
    capa.addEventListener('click', e => {
        const b = e.target.closest('[data-apuesta], [data-listo]');
        if (!b || !red.codigo || red.modo !== 'carrera') return;
        const yo = red.jugadores.find(j => j.id === red.tuId);
        if (b.dataset.apuesta != null) {
            const a = Number(b.dataset.apuesta);
            if (a > saldo()) { avisar(`No tienes ◉ ${a} monedas`, true); return; }
            avisar('');
            if (yo?.apuesta !== a) apostar(a);
        } else marcarListo(!yo?.listo);
    });
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
        const arenaSel = ARENAS.find(a => a.id === red.arena);
        $('[data-modo-texto]').textContent = carrera
            ? `Carrera: todos corren la misma pista y ven el avance de los demás. Hay caminos largos y seguros y atajos con trampas. Tus poderes especiales alcanzan a los rivales (empujan, aturden o congelan, sin quitar vidas). Gana el primero en llegar · hasta 8 jugadores · apostado en total ◉ ${red.jugadores.reduce((t, j) => t + (j.apuesta || 0), 0)}`
            : enArena
            ? `${MODOS[red.modo]} · ${arenaSel?.nombre || ''} (${arenaSel?.peligro || ''}) · al mejor de 3 · ${red.apuesta ? `apuesta ◉ ${red.apuesta} cada uno, el ganador se lleva el pozo` : 'sin apuesta'} · 🏆 Tu liga: ${ligaDe(copasArena())} (${copasArena()} copas)`
            : red.modo === 'troll'
            ? `Noche del Troll: uno de ustedes es el troll en secreto${red.jugadores.length >= 7 ? ' (con 7 u 8, son dos)' : ''}. Los héroes encienden las antorchas y descubren al troll en el Juicio; el troll pone trampas sin que lo vean · de 4 a 8 (si faltan, se completa con bots 🤖)`
            : 'Aventura: todos atados con la cadena';
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
        // mi apuesta y mi "listo" (el anfitrión no confirma: él arranca)
        capa.querySelectorAll('[data-apuesta]').forEach(b => {
            const si = Number(b.dataset.apuesta) === (yo2?.apuesta || 0);
            b.classList.toggle('elegido', si);
            b.setAttribute('aria-pressed', String(si));
            b.disabled = Number(b.dataset.apuesta) > saldo();
        });
        const botonListo = $('[data-listo]');
        botonListo.hidden = anfitrion;
        botonListo.classList.toggle('sala-empezar', !yo2?.listo);
        botonListo.textContent = yo2?.listo ? '✔ Listo (toca para cambiar)' : '✔ Estoy listo';
        $('[data-accion="empezar"]').hidden = !anfitrion;
        $('[data-esperando]').hidden = anfitrion;
        // cuántos somos (y cuántos caben en este modo)
        const cupo = red.modo === 'duelo' ? 2 : enArena ? 4 : 8;
        $('[data-cuenta]').textContent = `👥 ${red.jugadores.length}/${cupo}`;
        // carrera: el que no está listo tiene que entrar a Personalizar para apostar y confirmar
        $('[data-cajon-abrir]').classList.toggle('atencion', carrera && !anfitrion && !yo2?.listo && cajon.hidden);
        actualizarEscenario();
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
                a = { el, sprite: el.querySelector('.sala-sprite'), etiqueta: el.querySelector('.sala-etiqueta'),
                    x: 40 + Math.random() * Math.max(1, ancho - 80), y: Math.random() * fondoPiso(), destino: null, destinoY: 0, quieto: 0 };
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
                    a.destino = 40 + Math.random() * Math.max(1, ancho - 80);
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
        if (paso !== 'sala') { $('[data-accion="empezar"]').hidden = true; abrirCajon(false); }
    }

    function avisar(texto, error = false) {
        aviso.textContent = texto;
        aviso.classList.toggle('error', error);
    }

    function cerrar() {
        if (capa.contains(document.activeElement)) document.activeElement.blur();
        capa.hidden = true;
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
        capa.hidden = false;
        dibujarSala();
        teclado(false);
        (red.codigo ? $('.lobby-salir') : nombre).focus({ preventScroll: true });
    };
}

function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
