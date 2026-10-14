// "Jugar con amigos": sala de espera del multijugador (capa HTML sobre el juego).
//   1. Tu nombre y tu personaje
//   2. Crear sala (te da un código de 4 letras) o unirte con el código de un amigo
//   3. En la sala: ves quién está, cambias de personaje; el anfitrión elige el nivel y empieza
// Hasta 8 jugadores, atados en fila por la cadena en el orden en que entraron.

import { PERSONAJES } from "./personajes.js"
import { NIVELES } from "./niveles.js"
import { red, alRecibir, crearSala, unirseSala, elegirPersonaje, empezarPartida, salirSala, esAnfitrion } from "./red.js"

const CLAVE_NOMBRE = 'monhabell-aventura-nombre';
const color = pj => '#' + pj.color.toString(16).padStart(6, '0');

// alEmpezar({ nivel, pj }): el juego arranca la partida en línea
export function iniciarSala(juego, { alEmpezar }) {
    const capa = document.createElement('div');
    capa.className = 'menu-capa';
    capa.hidden = true;
    capa.innerHTML = `
        <div class="menu-panel menu-panel-ancho sala-panel" role="dialog" aria-modal="true" aria-labelledby="titulo-sala">
            <h2 id="titulo-sala">JUGAR CON AMIGOS</h2>

            <!-- el cuerpo se desplaza si no cabe; los botones de abajo siempre se ven -->
            <div class="sala-cuerpo">
            <div class="sala-paso" data-paso="entrar">
                <label class="sala-campo">Tu nombre
                    <input type="text" id="sala-nombre" maxlength="14" autocomplete="nickname" placeholder="Ej: Gesi">
                </label>
                <fieldset class="menu-grupo">
                    <legend>Tu personaje</legend>
                    <div class="menu-opciones" data-personajes></div>
                </fieldset>
                <button type="button" class="menu-boton" data-accion="crear">✚ Crear sala</button>
                <div class="menu-fila">
                    <input type="text" id="sala-codigo" maxlength="4" placeholder="CÓDIGO" autocapitalize="characters"
                        autocomplete="off" aria-label="Código de la sala">
                    <button type="button" class="menu-boton" data-accion="unirse">Unirse →</button>
                </div>
            </div>

            <div class="sala-paso sala-dos-columnas" data-paso="sala" hidden>
                <div class="sala-columna">
                    <p class="sala-codigo">Código de la sala: <b data-codigo></b></p>
                    <p class="menu-nota">Pásale este código a tus amigos (hasta 8)</p>
                    <ol class="sala-lista" data-lista></ol>
                </div>
                <div class="sala-columna">
                    <fieldset class="menu-grupo">
                        <legend>Tu personaje</legend>
                        <div class="menu-opciones" data-personajes></div>
                    </fieldset>
                    <label class="sala-campo" data-solo-anfitrion>Nivel
                        <select id="sala-nivel">${NIVELES.map((n, i) => `<option value="${i}">${i + 1} · ${n.nombre}</option>`).join('')}</select>
                    </label>
                    <p class="menu-nota" data-esperando>Esperando a que el anfitrión empiece…</p>
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
        if (red.codigo) elegirPersonaje(pjElegido);
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
            empezarPartida(Number($('#sala-nivel').value));
        } else if (accion === 'cerrar') {
            if (red.codigo) salirSala();
            cerrar();
        }
    });
    codigo.addEventListener('input', () => { codigo.value = codigo.value.toUpperCase().replace(/[^A-Z]/g, ''); });
    codigo.addEventListener('keydown', e => { if (e.key === 'Enter') capa.querySelector('[data-accion="unirse"]').click(); });

    // ---------- mensajes del servidor ----------
    alRecibir('sala', () => { avisar(''); dibujarSala(); });
    alRecibir('error', m => avisar(m.motivo, true));
    alRecibir('empezar', m => {
        const yo = m.jugadores.find(j => j.id === red.tuId);
        cerrar();
        alEmpezar({ nivel: m.nivel, pj: yo?.pj || pjElegido });
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
        $('[data-lista]').innerHTML = red.jugadores.map(j => {
            const pj = PERSONAJES.find(p => p.id === j.pj) || PERSONAJES[0];
            const marcas = `${j.id === red.anfitrion ? ' ★' : ''}${j.id === red.tuId ? ' (tú)' : ''}`;
            return `<li><span class="sala-pj" style="--pj:${color(pj)}">${pj.nombre}</span> ${escapar(j.nombre)}${marcas}</li>`;
        }).join('');
        const anfitrion = esAnfitrion();
        $('[data-solo-anfitrion]').hidden = !anfitrion;
        $('[data-accion="empezar"]').hidden = !anfitrion;
        $('[data-esperando]').hidden = anfitrion;
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
        dibujarSala();
        capa.hidden = false;
        teclado(false);
        (red.codigo ? capa.querySelector('[data-accion="cerrar"]') : nombre).focus({ preventScroll: true });
    };
}

function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
