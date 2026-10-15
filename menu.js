// Menú de pausa (botón ⏸, teclas P / Esc), de configuración (botón ⚙) y acceso a la tienda
// (botón dorado de la bolsa, siempre visible, y "Tienda" dentro de la pausa).
// Son capas HTML encima del juego: funcionan igual con mouse, teclado y en el celular.
// Pausar detiene la escena del nivel (física, enemigos, temporizadores) y los sonidos que sonaban.

import { ajustes, guardarAjustes, DIFICULTADES, CAMARAS, BOTONES, GRAFICOS, RESOLUCION } from "./ajustes.js"
import { enLinea } from "./red.js"
import { saldo } from "./tienda.js"

// dentro del APK (Capacitor): se puede cerrar la app y usar el botón "atrás" de Android
const APP = !!window.Capacitor?.isNativePlatform?.();
const pluginApp = () => window.Capacitor?.Plugins?.App;

// aplicar(): el juego aplica los ajustes que cambiaron; salirAlMenu(): vuelve a elegir personaje
// abrirTienda(alCerrar): abre la tienda; tiendaFuera(): abrirla fuera de un nivel (cada pantalla sabe cómo)
// irAlInicio(): pantalla de título; jugarConAmigos(): deja el nivel y abre la sala de espera
export function iniciarMenus(juego, { aplicar, salirAlMenu, abrirTienda, tiendaFuera, irAlInicio, jugarConAmigos }) {
    const contenedor = document.getElementById('game');
    const flotantes = contenedor.querySelector('.botones-flotantes');

    // los toques en las capas HTML (menús, tienda, vestidor, sala) y en los botones flotantes NO
    // llegan al juego: Phaser también escucha fuera del lienzo y "tocaría" lo que hay debajo
    // (por ejemplo, al tocar "Listo" en el vestidor se empezaba a jugar)
    ['mousedown', 'touchstart', 'pointerdown'].forEach(tipo => contenedor.addEventListener(tipo, e => {
        if (e.target.closest?.('.menu-capa, .botones-flotantes, .boton-voz')) e.stopPropagation();
    }));

    // ---------- botones flotantes: pausa y configuración ----------
    const botonPausa = boton('btn-pausa', 'Pausa (tecla P)',
        '<path d="M8 5v14M16 5v14"/>');
    const botonAjustes = boton('btn-ajustes', 'Configuración',
        '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>');
    // tienda: dorada y con el saldo encima, para que se encuentre fácil
    const botonTienda = boton('btn-tienda', 'Tienda (tecla T)',
        '<path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>');
    botonTienda.classList.add('boton-tienda');
    const insignia = document.createElement('span');
    insignia.className = 'insignia-tienda';
    insignia.setAttribute('aria-hidden', 'true');
    botonTienda.append(insignia);
    flotantes.prepend(botonTienda, botonPausa, botonAjustes);

    // un solo botón (☰) a la vista: al tocarlo despliega los demás (así no tapan el juego).
    // Se cierra al elegir algo o al tocar fuera
    const botonMenu = boton('btn-menu', 'Menú',
        '<path d="M4 7h16M4 12h16M4 17h16"/>');
    botonMenu.setAttribute('aria-expanded', 'false');
    flotantes.append(botonMenu);
    const desplegar = abrir => {
        flotantes.classList.toggle('abierto', abrir);
        botonMenu.setAttribute('aria-expanded', String(abrir));
    };
    botonMenu.addEventListener('click', e => { e.currentTarget.blur(); desplegar(!flotantes.classList.contains('abierto')); });
    flotantes.addEventListener('click', e => {
        if (e.target.closest('.boton-flotante') && !e.target.closest('#btn-menu')) desplegar(false);
    });
    document.addEventListener('pointerdown', e => { if (!e.target.closest?.('.botones-flotantes')) desplegar(false); });

    function boton(id, titulo, svg) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'boton-flotante';
        b.id = id;
        b.title = titulo;
        b.setAttribute('aria-label', titulo);
        b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${svg}</svg>`;
        return b;
    }

    // ---------- capa de pausa ----------
    const capaPausa = document.createElement('div');
    capaPausa.className = 'menu-capa';
    capaPausa.hidden = true;
    capaPausa.innerHTML = `
        <div class="menu-panel" role="dialog" aria-modal="true" aria-labelledby="titulo-pausa">
            <h2 id="titulo-pausa">PAUSA</h2>
            <button type="button" class="menu-boton" data-accion="seguir">▶ Continuar</button>
            <button type="button" class="menu-boton" data-accion="tienda">◉ Tienda</button>
            <button type="button" class="menu-boton" data-accion="ajustes">⚙ Configuración</button>
            <div class="menu-fila">
                <button type="button" class="menu-boton" data-accion="salir">← Elegir héroe</button>
                <button type="button" class="menu-boton" data-accion="inicio">⌂ Inicio</button>
            </div>
            <button type="button" class="menu-boton" data-accion="amigos">👥 Jugar con amigos</button>
            ${APP ? '<button type="button" class="menu-boton menu-salir" data-accion="cerrar">✕ Salir del juego</button>' : ''}
            <p class="menu-nota" data-en-linea hidden>Juego en línea: los demás siguen jugando</p>
            <p class="menu-nota">El progreso se guarda al empezar cada nivel</p>
        </div>`;

    // ---------- capa de configuración ----------
    const capaAjustes = document.createElement('div');
    capaAjustes.className = 'menu-capa';
    capaAjustes.hidden = true;
    const grupo = (clave, titulo, opciones, nota = '') => `
        <fieldset class="menu-grupo">
            <legend>${titulo}</legend>
            <div class="menu-opciones">
                ${Object.entries(opciones).map(([v, o]) =>
                    `<button type="button" class="menu-opcion" data-clave="${clave}" data-valor="${v}">${o.nombre}</button>`).join('')}
            </div>
            ${nota ? `<p class="menu-nota" data-nota="${clave}">${nota}</p>` : ''}
        </fieldset>`;
    capaAjustes.innerHTML = `
        <div class="menu-panel menu-panel-ancho" role="dialog" aria-modal="true" aria-labelledby="titulo-ajustes">
            <h2 id="titulo-ajustes">CONFIGURACIÓN</h2>
            <div class="menu-contenido">
                ${grupo('dificultad', 'Dificultad', DIFICULTADES, ' ')}
                ${grupo('camara', 'Cámara', CAMARAS, 'Lejos: ves más plataformas al saltar')}
                <fieldset class="menu-grupo">
                    <legend>Gráficos</legend>
                    <div class="menu-opciones">
                        ${Object.entries(GRAFICOS).map(([v, o]) =>
                            `<button type="button" class="menu-opcion" data-clave="graficos" data-valor="${v}">${o.nombre}</button>`).join('')}
                    </div>
                    <p class="menu-nota">Rápidos: mejor para celulares · Nítidos: se ve mejor pero pesa más</p>
                    <button type="button" class="menu-boton" data-accion="reabrir" hidden>↻ Aplicar (vuelve a abrir el juego)</button>
                </fieldset>
                <fieldset class="menu-grupo">
                    <legend>Volumen</legend>
                    <div class="menu-volumen">
                        <input type="range" min="0" max="100" step="5" id="ajuste-volumen" aria-label="Volumen">
                        <output for="ajuste-volumen" id="valor-volumen"></output>
                    </div>
                </fieldset>
                ${document.body.classList.contains('movil') ? grupo('botones', 'Botones táctiles', BOTONES) : ''}
                <fieldset class="menu-grupo">
                    <legend>Para probar</legend>
                    <div class="menu-opciones">
                        <button type="button" class="menu-opcion" data-clave="colisiones" data-valor="false">Normal</button>
                        <button type="button" class="menu-opcion" data-clave="colisiones" data-valor="true">Ver colisiones</button>
                    </div>
                    <div class="menu-opciones">
                        <button type="button" class="menu-opcion" data-clave="fps" data-valor="false">Sin FPS</button>
                        <button type="button" class="menu-opcion" data-clave="fps" data-valor="true">Ver FPS</button>
                    </div>
                </fieldset>
                <fieldset class="menu-grupo">
                    <legend>Cadena (2 jugadores)</legend>
                    <div class="menu-opciones">
                        <button type="button" class="menu-opcion" data-clave="cadena" data-valor="false">No</button>
                        <button type="button" class="menu-opcion" data-clave="cadena" data-valor="true">Sí, mismo teclado</button>
                    </div>
                    <p class="menu-nota">J1: flechas, ↓ anclar · J2: A D, W saltar, S anclar<br>Se aplica al reiniciar el nivel</p>
                </fieldset>
            </div>
            <div class="menu-fila">
                <button type="button" class="menu-boton" data-accion="volver">← Volver</button>
                ${APP ? '<button type="button" class="menu-boton menu-salir" data-accion="cerrar">✕ Salir del juego</button>' : ''}
            </div>
        </div>`;

    contenedor.append(capaPausa, capaAjustes);

    // ---------- estado ----------
    let pausado = false;
    let enLineaAlPausar = false;
    let sonando = []; // sonidos que se pausaron (para no despertar los que ya estaban en pausa)
    const enNivel = () => juego.scene.isActive('juego') || juego.scene.isPaused('juego');

    function pausar() {
        if (pausado || !juego.scene.isActive('juego')) return;
        pausado = true;
        // en línea el mundo no se detiene (los demás siguen jugando): solo se abre el menú
        enLineaAlPausar = enLinea();
        capaPausa.querySelector('[data-en-linea]').hidden = !enLineaAlPausar;
        // en línea: salir de la sala; jugando solo o en el mismo teclado: ir a jugar con amigos
        capaPausa.querySelector('[data-accion="amigos"]').textContent = enLinea() ? '🚪 Salir de la sala' : '👥 Jugar con amigos';
        capaPausa.querySelector('[data-accion="amigos"]').classList.toggle('menu-salir', enLinea());
        if (!enLineaAlPausar) {
            juego.scene.pause('juego');
            sonando = juego.sound.getAllPlaying();
            sonando.forEach(s => s.pause());
        }
        mostrar(capaPausa);
    }

    function reanudar() {
        ocultar(capaPausa);
        ocultar(capaAjustes);
        if (!pausado) return;
        pausado = false;
        const nivel = juego.scene.getScene('juego');
        nivel.input.keyboard?.resetKeys(); // ninguna tecla queda "pegada" de antes de la pausa
        if (!enLineaAlPausar) juego.scene.resume('juego');
        sonando.forEach(s => s.resume());
        sonando = [];
    }

    function abrirAjustes() {
        // en medio de un nivel, configurar también pausa
        if (juego.scene.isActive('juego')) pausar();
        ocultar(capaPausa);
        marcar();
        mostrar(capaAjustes);
    }

    // tienda en medio de un nivel: el juego queda en pausa mientras está abierta.
    // Desde la pausa, al cerrarla se vuelve a la pausa; desde el botón dorado, se sigue jugando
    let tiendaAbierta = false;
    function abrirTiendaEnNivel(desdePausa) {
        if (tiendaAbierta) return;
        tiendaAbierta = true;
        pausar();
        ocultar(capaPausa);
        abrirTienda(() => {
            tiendaAbierta = false;
            if (desdePausa) mostrar(capaPausa);
            else reanudar();
        });
    }
    function abrirTiendaDesdeBoton() {
        if (tiendaAbierta) return;
        if (juego.scene.isActive('juego') || pausado) abrirTiendaEnNivel(pausado);
        else tiendaFuera();
    }

    function cerrarAjustes() {
        ocultar(capaAjustes);
        if (pausado) mostrar(capaPausa);
    }

    function mostrar(capa) {
        capa.hidden = false;
        capa.querySelector('button')?.focus({ preventScroll: true });
    }
    function ocultar(capa) {
        if (capa.contains(document.activeElement)) document.activeElement.blur();
        capa.hidden = true;
    }

    // ---------- ajustes: marcar lo elegido y aplicar cambios ----------
    const volumen = capaAjustes.querySelector('#ajuste-volumen');
    const valorVolumen = capaAjustes.querySelector('#valor-volumen');
    function marcar() {
        capaAjustes.querySelectorAll('.menu-opcion').forEach(b => {
            const elegido = String(ajustes[b.dataset.clave]) === b.dataset.valor;
            b.classList.toggle('elegido', elegido);
            b.setAttribute('aria-pressed', String(elegido));
        });
        const notaDificultad = capaAjustes.querySelector('[data-nota="dificultad"]');
        notaDificultad.textContent = `${DIFICULTADES[ajustes.dificultad].detalle}${enNivel() ? ' · se aplica al reiniciar el nivel' : ''}`;
        // la resolución cambia al volver a abrir el juego: se ofrece hacerlo ya
        const resolucionElegida = GRAFICOS[ajustes.graficos].resolucion ?? (matchMedia('(pointer: coarse)').matches ? 1 : 2);
        capaAjustes.querySelector('[data-accion="reabrir"]').hidden = resolucionElegida === RESOLUCION;
        volumen.value = ajustes.volumen;
        valorVolumen.textContent = `${ajustes.volumen}%`;
    }

    capaAjustes.addEventListener('click', e => {
        const b = e.target.closest('.menu-opcion');
        if (!b) return;
        const v = b.dataset.valor;
        guardarAjustes({ [b.dataset.clave]: v === 'true' ? true : v === 'false' ? false : v });
        marcar();
        aplicar();
    });
    volumen.addEventListener('input', () => {
        guardarAjustes({ volumen: Number(volumen.value) });
        valorVolumen.textContent = `${ajustes.volumen}%`;
        aplicar();
    });

    // ---------- acciones ----------
    capaPausa.addEventListener('click', e => {
        const accion = e.target.closest('[data-accion]')?.dataset.accion;
        if (accion === 'seguir') reanudar();
        else if (accion === 'ajustes') abrirAjustes();
        else if (accion === 'tienda') abrirTiendaEnNivel(true);
        else if (accion === 'salir' || accion === 'inicio' || accion === 'amigos') {
            // dejar el nivel (en línea, también la sala) e ir a donde se pidió
            ocultar(capaPausa);
            pausado = false;
            sonando = [];
            juego.sound.stopAll();
            if (accion === 'inicio') irAlInicio();
            else if (accion === 'amigos' && !enLinea()) jugarConAmigos();
            else salirAlMenu(); // "Elegir héroe" o "Salir de la sala"
        }
    });
    capaAjustes.querySelector('[data-accion="volver"]').addEventListener('click', cerrarAjustes);
    capaAjustes.querySelector('[data-accion="reabrir"]').addEventListener('click', () => location.reload());

    // salir del juego (solo en el APK): pide un segundo toque para confirmar
    [capaPausa, capaAjustes].forEach(capa => capa.querySelector('[data-accion="cerrar"]')?.addEventListener('click', e => {
        const b = e.currentTarget;
        if (b.dataset.confirmar) { pluginApp()?.exitApp(); return; }
        b.dataset.confirmar = '1';
        b.textContent = '¿Seguro? Toca otra vez';
        setTimeout(() => { delete b.dataset.confirmar; b.textContent = '✕ Salir del juego'; }, 3000);
    }));

    // botón "atrás" de Android: cierra el menú abierto; en un nivel pausa; en los menús abre la configuración
    pluginApp()?.addListener('backButton', () => {
        if (!capaAjustes.hidden) cerrarAjustes();
        else if (pausado) reanudar();
        else if (juego.scene.isActive('juego')) pausar();
        else abrirAjustes();
    });
    botonPausa.addEventListener('click', e => { e.currentTarget.blur(); pausado ? reanudar() : pausar(); });
    botonAjustes.addEventListener('click', e => { e.currentTarget.blur(); capaAjustes.hidden ? abrirAjustes() : cerrarAjustes(); });
    botonTienda.addEventListener('click', e => { e.currentTarget.blur(); abrirTiendaDesdeBoton(); });

    // tocar fuera del panel cierra el menú
    [capaPausa, capaAjustes].forEach(capa => capa.addEventListener('pointerdown', e => {
        if (e.target !== capa) return;
        capa === capaAjustes ? cerrarAjustes() : reanudar();
    }));

    // teclado: P pausa; Esc pausa o cierra (si el juego está agrandado, Esc solo lo achica: game.js)
    document.addEventListener('keydown', e => {
        if (e.repeat || e.target.closest?.('input[type="text"], textarea, select')) return;
        // T abre la tienda en medio de un nivel (en las otras pantallas la abre cada pantalla)
        if (e.key.toLowerCase() === 't' && juego.scene.isActive('juego') && capaPausa.hidden && capaAjustes.hidden) {
            abrirTiendaEnNivel(false);
            return;
        }
        const esc = e.key === 'Escape';
        if (esc && !capaAjustes.hidden) { cerrarAjustes(); return; }
        if (e.key.toLowerCase() === 'p' || (esc && !document.body.classList.contains('modo-grande'))) {
            pausado ? reanudar() : pausar();
        }
    });

    // si la app o la pestaña pasan a segundo plano, el juego queda en pausa
    document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });

    // el botón de pausa solo se ve durante un nivel; la insignia de la tienda muestra el saldo
    setInterval(() => {
        botonPausa.hidden = !enNivel();
        // en qué pantalla estamos (el CSS acomoda los botones flotantes en el celular)
        document.body.classList.toggle('en-nivel', enNivel());
        document.body.classList.toggle('en-titulo', juego.scene.isActive('titulo'));
        insignia.textContent = saldo() > 999 ? '999+' : saldo();
    }, 250);

    aplicar();
}
