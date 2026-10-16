// Controles táctiles para celular (y para el APK de Android).
// Los botones "presionan" las mismas teclas que el teclado (flechas, ESPACIO, X, C), así que el
// resto del juego no cambia: cada botón llama a onDown/onUp de las teclas de Phaser de las
// escenas activas. Solo aparecen en pantallas táctiles, y solo mientras se juega un nivel.
//
// - Joystick (lado izquierdo): aparece donde apoyas el pulgar; la bolita mueve izquierda/derecha.
// - Poderes: un anillo se llena mientras el poder se recarga (o mientras juntas maná/flechas);
//   el botón destella cuando vuelve a estar listo.

const TECLA = { izq: 37, arriba: 38, der: 39, abajo: 40, espacio: 32, x: 88, c: 67, v: 86, b: 66 };
const ZONA_MUERTA = 0.28; // fracción del radio del joystick que no mueve al personaje

export const esTactil = () =>
    window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

export function iniciarTactil(juego) {
    if (!esTactil()) return;
    document.body.classList.add('movil');

    const evento = () => ({ timeStamp: performance.now(), altKey: false, ctrlKey: false, shiftKey: false, metaKey: false, location: 0 });
    const presionadas = new Set();
    function tecla(codigo, abajo) {
        if (abajo === presionadas.has(codigo)) return;
        abajo ? presionadas.add(codigo) : presionadas.delete(codigo);
        juego.scene.getScenes(true).forEach(s => {
            const k = s.input?.keyboard?.keys?.[codigo];
            if (k) abajo ? k.onDown(evento()) : k.onUp(evento());
        });
    }
    const soltarTodo = () => [...presionadas].forEach(c => tecla(c, false));

    const capa = document.createElement('div');
    capa.className = 'tactil';
    capa.innerHTML = `
        <div class="t-zona-joy" aria-hidden="true">
            <div class="t-joy"><div class="t-bolita"></div></div>
        </div>
        <div class="t-acciones">
            <button type="button" class="t-btn t-esp vacio" data-tecla="v" data-ranura="0" aria-label="Poder V"><b>V</b></button>
            <button type="button" class="t-btn t-esp vacio" data-tecla="b" data-ranura="1" aria-label="Poder B"><b>B</b></button>
            <button type="button" class="t-btn t-hab" data-tecla="c"><b>C</b><small></small></button>
            <button type="button" class="t-btn t-hab" data-tecla="x"><b>X</b><small></small></button>
            <button type="button" class="t-btn t-hab" data-tecla="espacio"><b>●</b><small></small></button>
            <button type="button" class="t-btn t-salto" data-tecla="arriba"><b>▲</b><small>SALTAR</small></button>
        </div>
        <button type="button" class="t-btn t-anclar" data-tecla="abajo"><b>⚓</b><small>ANCLAR</small></button>`;
    document.getElementById('game').appendChild(capa);

    // ---------- botones: se mantienen presionados mientras el dedo esté encima ----------
    capa.querySelectorAll('.t-btn').forEach(b => {
        const codigo = TECLA[b.dataset.tecla];
        const bajar = e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); b.classList.add('activo'); tecla(codigo, true); };
        const subir = e => { e.preventDefault(); b.classList.remove('activo'); tecla(codigo, false); };
        b.addEventListener('pointerdown', bajar);
        b.addEventListener('pointerup', subir);
        b.addEventListener('pointercancel', subir);
        b.addEventListener('lostpointercapture', subir);
        b.addEventListener('contextmenu', e => e.preventDefault());
    });

    // ---------- joystick: la base aparece bajo el pulgar y la bolita lo sigue ----------
    const zona = capa.querySelector('.t-zona-joy');
    const joy = capa.querySelector('.t-joy');
    const bolita = capa.querySelector('.t-bolita');
    let dedo = null, centro = null;

    function moverJoy(e) {
        const radio = joy.offsetWidth / 2 * escalaBotones();
        let dx = e.clientX - centro.x, dy = e.clientY - centro.y;
        const d = Math.hypot(dx, dy);
        if (d > radio) { dx *= radio / d; dy *= radio / d; }
        bolita.style.transform = `translate(${dx / escalaBotones()}px, ${dy / escalaBotones()}px)`;
        const h = dx / radio;
        tecla(TECLA.izq, h < -ZONA_MUERTA);
        tecla(TECLA.der, h > ZONA_MUERTA);
    }
    function soltarJoy() {
        dedo = null;
        tecla(TECLA.izq, false);
        tecla(TECLA.der, false);
        joy.classList.remove('activo');
        joy.style.left = joy.style.top = '';
        bolita.style.transform = '';
    }
    zona.addEventListener('pointerdown', e => {
        if (dedo !== null) return;
        e.preventDefault();
        dedo = e.pointerId;
        zona.setPointerCapture?.(e.pointerId);
        // la base se centra donde tocaste (sin salirse de la zona)
        const r = zona.getBoundingClientRect();
        const medio = joy.offsetWidth / 2 * escalaBotones();
        const x = Math.min(Math.max(e.clientX - r.left, medio), r.width - medio);
        const y = Math.min(Math.max(e.clientY - r.top, medio), r.height - medio);
        joy.style.left = `${x}px`;
        joy.style.top = `${y}px`;
        joy.classList.add('activo');
        centro = { x: r.left + x, y: r.top + y };
        moverJoy(e);
    });
    zona.addEventListener('pointermove', e => { if (e.pointerId === dedo) moverJoy(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t =>
        zona.addEventListener(t, e => { if (e.pointerId === dedo) soltarJoy(); }));
    zona.addEventListener('contextmenu', e => e.preventDefault());

    function escalaBotones() {
        return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--t-escala')) || 1;
    }

    // ---------- carga de los poderes ----------
    const poderes = [...capa.querySelectorAll('.t-hab')].map(b => ({ b, tecla: b.dataset.tecla, listo: true }));
    function dibujarCarga() {
        const nivel = juego.scene.getScene('juego');
        if (capa.classList.contains('visible') && nivel?.estadoHabilidad) {
            poderes.forEach(p => {
                const { carga, sinRecurso } = nivel.estadoHabilidad(p.tecla);
                const listo = carga >= 1;
                // solo se toca el botón si cambió algo (cambiar estilos en cada fotograma cuesta en el celular)
                const valor = listo ? 1 : Math.floor(carga * 50) / 50;
                if (valor !== p.valor) { p.b.style.setProperty('--carga', valor); p.valor = valor; }
                if (listo !== p.listo) p.b.classList.toggle('cargando', !listo);
                if (sinRecurso !== p.sinRecurso) { p.b.classList.toggle('sin-recurso', sinRecurso); p.sinRecurso = sinRecurso; }
                if (listo && !p.listo) {
                    // destello al quedar listo (se reinicia la animación)
                    p.b.classList.remove('recien');
                    void p.b.offsetWidth;
                    p.b.classList.add('recien');
                }
                p.listo = listo;
            });
        }
        // poderes especiales (V y B): ícono del poder, gris mientras se recarga
        if (capa.classList.contains('visible') && nivel?.estadoPoder) {
            especiales.forEach(p => {
                const e = nivel.estadoPoder(p.ranura);
                const icono = e?.icono || '';
                if (icono !== p.icono) {
                    p.icono = icono;
                    p.b.style.backgroundImage = icono ? `url("${icono}")` : '';
                    p.b.classList.toggle('vacio', !icono);
                    p.b.setAttribute('aria-label', e ? `Poder ${e.nombre}` : 'Sin poder');
                }
                const cargando = !!e && e.carga < 1;
                if (cargando !== p.cargando) { p.b.classList.toggle('cargando', cargando); p.cargando = cargando; }
            });
        }
        requestAnimationFrame(dibujarCarga);
    }
    const especiales = [...capa.querySelectorAll('.t-esp')].map(b => ({ b, ranura: Number(b.dataset.ranura) }));
    requestAnimationFrame(dibujarCarga);

    // ---------- los controles solo se ven durante un nivel ----------
    let pjActual = null;
    setInterval(() => {
        const nivel = juego.scene.isActive('juego') ? juego.scene.getScene('juego') : null;
        const visible = !!nivel?.pj;
        // con cadena (mismo teclado o en línea) aparece el botón de anclarse
        capa.classList.toggle('con-cadena', !!(nivel?.compa?.active || nivel?.cadenaRed));
        if (capa.classList.contains('visible') !== visible) {
            capa.classList.toggle('visible', visible);
            if (!visible) { soltarTodo(); soltarJoy(); }
        }
        if (visible && nivel.pj !== pjActual) {
            pjActual = nivel.pj;
            poderes.forEach(p => {
                p.b.querySelector('small').textContent = pjActual.habilidades[p.tecla].nombre.split(' / ')[0];
                // personaje nuevo: el botón empieza limpio
                p.listo = true;
                p.valor = p.sinRecurso = undefined;
                p.b.classList.remove('cargando', 'sin-recurso');
            });
        }
    }, 250);

    // si la app pasa a segundo plano, que no quede ninguna tecla "pegada"
    document.addEventListener('visibilitychange', () => { if (document.hidden) { soltarTodo(); soltarJoy(); } });
}
