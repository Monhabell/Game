// "Jugar con amigos": sala de espera del multijugador (capa HTML sobre el juego).
//   1. Tu nombre y tu personaje
//   2. Crear sala (te da un código de 4 letras) o unirte con el código de un amigo
//   3. En la sala: ves quién está, cambias de personaje; el anfitrión elige el nivel y empieza
// Hasta 8 jugadores, atados en fila por la cadena en el orden en que entraron.
// En la sala, cada jugador aparece en un escenario con su personaje: cae al unirse, pasea de un
// lado a otro y salta al cambiar de personaje (las mismas hojas de sprites del juego, animadas con CSS).
// Modos (los elige el anfitrión): Aventura (todos atados con la cadena) o la Arena del Troll
// (arena.js): 1 contra 1 o por equipos (rojo contra azul, cada uno elige su equipo; hasta 4).
// También la Carrera (carrera.js): todos corren la misma pista y el primero en llegar gana (hasta 8).
// En la carrera cada uno elige SU apuesta y confirma con "Listo"; en la lista y sobre cada personaje
// se ve cuánto apuesta cada uno. El anfitrión arranca cuando todos están listos.
// Cada uno se ve con los colores que eligió en el vestidor: al entrar (y cada vez que cambia la sala)
// cada jugador anuncia sus colores con un evento que el servidor reenvía a los demás (sin cambiar el servidor).

import { PERSONAJES } from "./personajes.js"
import { NIVELES } from "./niveles.js"
import {
    red, alRecibir, crearSala, unirseSala, elegirPersonaje, empezarPartida, salirSala, esAnfitrion, enviarEvento, elegirModo, elegirEquipo,
    informarSaldo, apostar, marcarListo,
} from "./red.js"
import { PISTAS } from "./pistas.js"
import { ARENAS, APUESTAS, COLORES_EQUIPO, arenaDisponible, victoriasArena, copasArena, ligaDe } from "./arena.js"
import { saldo } from "./tienda.js"

const MODOS = { aventura: 'Aventura (en cadena)', duelo: 'Arena · 1 contra 1', equipos: 'Arena · por equipos', carrera: '🏁 Carrera' };
const esArena = modo => modo === 'duelo' || modo === 'equipos';
import { animDe, prefijoValido, urlHoja } from "./vestidor.js"

const CLAVE_NOMBRE = 'monhabell-aventura-nombre';
const color = pj => '#' + pj.color.toString(16).padStart(6, '0');

// alEmpezar({ nivel, pj }): el juego arranca la partida en línea
export function iniciarSala(juego, { alEmpezar }) {
    const capa = document.createElement('div');
    // (ocupa toda la pantalla, no solo el recuadro del juego: así caben todas las opciones)
    capa.className = 'menu-capa sala-capa';
    capa.hidden = true;
    capa.innerHTML = `
        <div class="menu-panel menu-panel-ancho sala-panel" role="dialog" aria-modal="true" aria-labelledby="titulo-sala">
            <h2 id="titulo-sala">JUGAR CON AMIGOS</h2>

            <!-- el cuerpo se desplaza si no cabe; los botones de abajo siempre se ven -->
            <div class="sala-cuerpo">
            <!-- primer paso: a la izquierda quién eres, a la derecha crear una sala o unirte a una -->
            <div class="sala-paso sala-entrar" data-paso="entrar">
                <div class="sala-columna">
                    <h3 class="sala-titulo">Quién eres</h3>
                    <label class="sala-campo">Tu nombre
                        <input type="text" id="sala-nombre" maxlength="14" autocomplete="nickname" placeholder="Ej: Gesi">
                    </label>
                    <fieldset class="menu-grupo">
                        <legend>Tu personaje</legend>
                        <div class="menu-opciones" data-personajes></div>
                    </fieldset>
                </div>
                <div class="sala-columna">
                    <h3 class="sala-titulo">A jugar</h3>
                    <div class="sala-tarjeta">
                        <b>Crear una sala</b>
                        <p class="menu-nota">Te da un código de 4 letras para pasarle a tus amigos (hasta 8).</p>
                        <button type="button" class="menu-boton sala-empezar" data-accion="crear">✚ Crear sala</button>
                    </div>
                    <div class="sala-tarjeta">
                        <b>Unirme a una sala</b>
                        <p class="menu-nota">Escribe el código que te pasó tu amigo.</p>
                        <div class="menu-fila">
                            <input type="text" id="sala-codigo" maxlength="4" placeholder="CÓDIGO" autocapitalize="characters"
                                autocomplete="off" aria-label="Código de la sala">
                            <button type="button" class="menu-boton" data-accion="unirse">Unirse →</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- la sala: a la izquierda la sala de espera (escenario y jugadores), a la derecha las opciones -->
            <div class="sala-paso sala-dos-columnas" data-paso="sala" hidden>
                <div class="sala-espera">
                <div class="sala-escenario" data-escenario aria-hidden="true"><div class="sala-piso"></div></div>
                <div class="sala-columna">
                    <h3 class="sala-titulo">Jugadores</h3>
                    <div class="sala-codigo">
                        <span>Código</span><b data-codigo></b>
                        <button type="button" class="sala-copiar" data-copiar aria-label="Copiar el código">Copiar</button>
                    </div>
                    <p class="menu-nota">Pásale este código a tus amigos (hasta 8)</p>
                    <ol class="sala-lista" data-lista></ol>
                </div>
                </div>
                <div class="sala-opciones">
                <div class="sala-columna">
                    <h3 class="sala-titulo">Tú</h3>
                    <fieldset class="menu-grupo">
                        <legend>Tu personaje</legend>
                        <div class="menu-opciones" data-personajes></div>
                    </fieldset>
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
                <div class="sala-columna">
                    <h3 class="sala-titulo">La partida</h3>
                    <fieldset class="menu-grupo" data-solo-anfitrion>
                        <legend>Modo</legend>
                        <div class="menu-opciones" data-modos>${Object.entries(MODOS).map(([m, t]) =>
                            `<button type="button" class="menu-opcion" data-modo="${m}">${t}</button>`).join('')}</div>
                    </fieldset>
                    <p class="menu-nota sala-modo-texto" data-modo-texto></p>
                    <label class="sala-campo" data-solo-anfitrion data-solo-arena hidden>Arena
                        <select id="sala-arena"></select>
                    </label>
                    <label class="sala-campo" data-solo-anfitrion data-con-apuesta hidden>Apuesta (cada jugador)
                        <select id="sala-apuesta">${APUESTAS.map(a => `<option value="${a}">${a ? `◉ ${a} monedas` : 'Sin apuesta'}</option>`).join('')}</select>
                    </label>
                    <label class="sala-campo" data-solo-anfitrion data-solo-aventura>Nivel
                        <select id="sala-nivel">${NIVELES.map((n, i) => `<option value="${i}">${i + 1} · ${n.nombre}</option>`).join('')}</select>
                    </label>
                    <label class="sala-campo" data-solo-anfitrion data-solo-carrera hidden>Pista
                        <select id="sala-pista">${PISTAS.map((p, i) => `<option value="${i}">${p.nombre}</option>`).join('')}</select>
                    </label>
                    <p class="menu-nota" data-esperando>Esperando a que el anfitrión empiece…</p>
                </div>
                </div>
            </div>
            </div>

            <p class="sala-aviso" data-aviso role="status"></p>
            <div class="menu-fila sala-pie">
                <button type="button" class="menu-boton menu-salir" data-accion="cerrar">← Volver</button>
                <button type="button" class="menu-boton sala-empezar" data-accion="empezar" hidden>▶ Empezar</button>
            </div>
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
        caja.innerHTML = PERSONAJES.map(pj =>
            `<button type="button" class="menu-opcion" data-pj="${pj.id}" style="--pj:${color(pj)}">${pj.nombre}</button>`).join('');
    });
    capa.addEventListener('click', e => {
        const b = e.target.closest('[data-pj]');
        if (!b) return;
        pjElegido = b.dataset.pj;
        marcarPersonaje();
        if (red.codigo) { elegirPersonaje(pjElegido); anunciarColores(); }
    });
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
        else if (accion === 'unirse') {
            const c = codigo.value.trim().toUpperCase();
            if (c.length !== 4) { avisar('El código tiene 4 letras', true); codigo.focus(); return; }
            conEspera(() => unirseSala(c, nombreLimpio(), pjElegido));
        } else if (accion === 'empezar') {
            // la arena necesita rivales (el servidor también lo revisa)
            const n = red.jugadores.length, equipos = new Set(red.jugadores.map(j => j.equipo));
            if (red.modo === 'duelo' && n !== 2) { avisar('El 1 contra 1 es de 2 jugadores', true); return; }
            if (red.modo === 'equipos' && (n < 2 || equipos.size < 2)) { avisar('Hace falta alguien en cada equipo', true); return; }
            if (red.modo === 'carrera') {
                if (n < 2) { avisar('La carrera necesita al menos 2 jugadores', true); return; }
                const falta = red.jugadores.filter(j => j.id !== red.anfitrion && !j.listo);
                if (falta.length) { avisar(`Falta que confirmen: ${falta.map(j => j.nombre).join(', ')}`, true); return; }
                empezarPartida(Number($('#sala-pista').value) || 0); // (en la carrera, el número es la pista)
                return;
            }
            const pobre = red.modo !== 'aventura' && red.jugadores.find(j => (j.monedas || 0) < red.apuesta);
            if (pobre) { avisar(`${pobre.nombre} no tiene ${red.apuesta} monedas para la apuesta`, true); return; }
            empezarPartida(Number($('#sala-nivel').value));
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
        if (b.dataset.modo && esAnfitrion()) elegirModo(b.dataset.modo, $('#sala-arena').value || 'bosque', Number($('#sala-apuesta').value) || 0);
        if (b.dataset.equipo) elegirEquipo(Number(b.dataset.equipo));
    });
    $('#sala-arena').addEventListener('change', e => { if (esAnfitrion()) elegirModo(red.modo, e.target.value, red.apuesta); });
    $('#sala-apuesta').addEventListener('change', e => { if (esAnfitrion()) elegirModo(red.modo, red.arena, Number(e.target.value)); });
    // copiar el código de la sala (para mandarlo por mensaje)
    $('[data-copiar]').addEventListener('click', async e => {
        const b = e.currentTarget;
        try { await navigator.clipboard.writeText(red.codigo || ''); b.textContent = '¡Copiado!'; }
        catch (_e) { b.textContent = 'No se pudo'; }
        setTimeout(() => { b.textContent = 'Copiar'; }, 1500);
    });
    codigo.addEventListener('input', () => { codigo.value = codigo.value.toUpperCase().replace(/[^A-Z]/g, ''); });
    codigo.addEventListener('keydown', e => { if (e.key === 'Enter') capa.querySelector('[data-accion="unirse"]').click(); });

    // ---------- mensajes del servidor ----------
    alRecibir('sala', () => { avisar(''); anunciarColores(); dibujarSala(); });
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
            return `<li>${eq}<span class="sala-pj" style="--pj:${color(pj)}">${pj.nombre}</span> ${escapar(j.nombre)}${marcas}${mon}</li>`;
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
        $('#sala-arena').innerHTML = ARENAS.map(a => `<option value="${a.id}" ${arenaDisponible(a) ? '' : 'disabled'} ${a.id === red.arena ? 'selected' : ''}>${a.nombre}${
            arenaDisponible(a) ? '' : ` · 🔒 faltan ${a.victorias - v} victorias`}</option>`).join('');
        $('#sala-apuesta').value = String(red.apuesta || 0);
        capa.querySelectorAll('[data-solo-anfitrion]').forEach(el => { el.hidden = !anfitrion; });
        capa.querySelectorAll('[data-solo-arena]').forEach(el => { el.hidden = !anfitrion || !enArena; });
        capa.querySelectorAll('[data-con-apuesta]').forEach(el => { el.hidden = !anfitrion || !enArena; });
        capa.querySelectorAll('[data-solo-aventura]').forEach(el => { el.hidden = !anfitrion || red.modo !== 'aventura'; });
        capa.querySelectorAll('[data-solo-carrera]').forEach(el => { el.hidden = !carrera || (el.matches('[data-solo-anfitrion]') && !anfitrion); });
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
        actualizarEscenario();
    }

    // ---------- escenario: los personajes de la sala paseando ----------
    const escenario = $('[data-escenario]');
    const actores = new Map(); // id del jugador -> { el, sprite, etiqueta, x, destino, pj, quieto }
    let animando = 0, ultimo = 0;
    const VEL = 55; // px/s al pasear

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
                    x: 40 + Math.random() * Math.max(1, ancho - 80), destino: null, quieto: 0 };
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
            a.etiqueta.textContent = `${j.id === red.anfitrion ? '★ ' : ''}${j.nombre}${red.modo === 'carrera' ? ` · ◉${j.apuesta || 0}${j.listo ? ' ✔' : ''}` : ''}`;
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
        const ancho = escenario.clientWidth;
        actores.forEach(a => {
            const pj = PERSONAJES.find(p => p.id === a.pj) || PERSONAJES[0];
            if (a.destino === null) {
                a.quieto -= dt;
                if (a.quieto <= 0 && ancho) {
                    a.destino = 40 + Math.random() * Math.max(1, ancho - 80);
                    hoja(a.sprite, pj, 'run', a.prefijo);
                }
            } else {
                const d = a.destino - a.x;
                a.sprite.classList.toggle('izquierda', d < 0);
                a.x += Math.sign(d) * Math.min(Math.abs(d), VEL * dt);
                if (Math.abs(d) < 1) {
                    a.destino = null;
                    a.quieto = 1.2 + Math.random() * 3;
                    hoja(a.sprite, pj, 'idle', a.prefijo);
                }
            }
            a.x = Math.max(30, Math.min(Math.max(30, ancho - 30), a.x));
            a.el.style.transform = `translateX(${a.x}px)`;
        });
        animando = !capa.hidden && red.codigo ? requestAnimationFrame(pasear) : 0;
    }

    function sonar(clave) {
        try { if (juego.sound && juego.cache.audio.exists(clave)) juego.sound.play(clave, { volume: 0.4 }); } catch (_e) { /* sin sonido */ }
    }

    function mostrarPaso(paso) {
        capa.querySelectorAll('.sala-paso').forEach(p => { p.hidden = p.dataset.paso !== paso; });
        if (paso !== 'sala') $('[data-accion="empezar"]').hidden = true;
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
        marcarPersonaje();
        anunciarColores();
        capa.hidden = false;
        dibujarSala();
        teclado(false);
        (red.codigo ? capa.querySelector('[data-accion="cerrar"]') : nombre).focus({ preventScroll: true });
    };
}

function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
