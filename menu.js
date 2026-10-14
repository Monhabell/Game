// Menú de pausa (botón ⏸, teclas P / Esc) y de configuración (botón ⚙).
// Son capas HTML encima del juego: funcionan igual con mouse, teclado y en el celular.
// Pausar detiene la escena del nivel (física, enemigos, temporizadores) y los sonidos que sonaban.

import { ajustes, guardarAjustes, DIFICULTADES, CAMARAS, BOTONES } from "./ajustes.js"

// aplicar(): el juego aplica los ajustes que cambiaron; salirAlMenu(): vuelve a elegir personaje
export function iniciarMenus(juego, { aplicar, salirAlMenu }) {
    const contenedor = document.getElementById('game');
    const flotantes = contenedor.querySelector('.botones-flotantes');

    // ---------- botones flotantes: pausa y configuración ----------
    const botonPausa = boton('btn-pausa', 'Pausa (tecla P)',
        '<path d="M8 5v14M16 5v14"/>');
    const botonAjustes = boton('btn-ajustes', 'Configuración',
        '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>');
    flotantes.prepend(botonPausa, botonAjustes);

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
            <button type="button" class="menu-boton" data-accion="ajustes">⚙ Configuración</button>
            <button type="button" class="menu-boton menu-salir" data-accion="salir">⌂ Salir al menú</button>
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
                </fieldset>
            </div>
            <button type="button" class="menu-boton" data-accion="volver">← Volver</button>
        </div>`;

    contenedor.append(capaPausa, capaAjustes);

    // ---------- estado ----------
    let pausado = false;
    let sonando = []; // sonidos que se pausaron (para no despertar los que ya estaban en pausa)
    const enNivel = () => juego.scene.isActive('juego') || juego.scene.isPaused('juego');

    function pausar() {
        if (pausado || !juego.scene.isActive('juego')) return;
        pausado = true;
        juego.scene.pause('juego');
        sonando = juego.sound.getAllPlaying();
        sonando.forEach(s => s.pause());
        mostrar(capaPausa);
    }

    function reanudar() {
        ocultar(capaPausa);
        ocultar(capaAjustes);
        if (!pausado) return;
        pausado = false;
        const nivel = juego.scene.getScene('juego');
        nivel.input.keyboard?.resetKeys(); // ninguna tecla queda "pegada" de antes de la pausa
        juego.scene.resume('juego');
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
        else if (accion === 'salir') {
            ocultar(capaPausa);
            pausado = false;
            sonando = [];
            juego.sound.stopAll();
            salirAlMenu();
        }
    });
    capaAjustes.querySelector('[data-accion="volver"]').addEventListener('click', cerrarAjustes);
    botonPausa.addEventListener('click', e => { e.currentTarget.blur(); pausado ? reanudar() : pausar(); });
    botonAjustes.addEventListener('click', e => { e.currentTarget.blur(); capaAjustes.hidden ? abrirAjustes() : cerrarAjustes(); });

    // tocar fuera del panel cierra el menú
    [capaPausa, capaAjustes].forEach(capa => capa.addEventListener('pointerdown', e => {
        if (e.target !== capa) return;
        capa === capaAjustes ? cerrarAjustes() : reanudar();
    }));

    // teclado: P pausa; Esc pausa o cierra (si el juego está agrandado, Esc solo lo achica: game.js)
    document.addEventListener('keydown', e => {
        if (e.repeat) return;
        const esc = e.key === 'Escape';
        if (esc && !capaAjustes.hidden) { cerrarAjustes(); return; }
        if (e.key.toLowerCase() === 'p' || (esc && !document.body.classList.contains('modo-grande'))) {
            pausado ? reanudar() : pausar();
        }
    });

    // si la app o la pestaña pasan a segundo plano, el juego queda en pausa
    document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });

    // el botón de pausa solo se ve durante un nivel
    setInterval(() => { botonPausa.hidden = !enNivel(); }, 250);

    aplicar();
}
