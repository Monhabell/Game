// Controles táctiles para celular (y para el APK de Android).
// Los botones "presionan" las mismas teclas que el teclado (flechas, ESPACIO, X, C), así que el
// resto del juego no cambia: cada botón llama a onDown/onUp de las teclas de Phaser de las
// escenas activas. Solo aparecen en pantallas táctiles, y solo mientras se juega un nivel.

const TECLA = { izq: 37, arriba: 38, der: 39, espacio: 32, x: 88, c: 67 };

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
        <div class="t-cruceta" aria-hidden="true"><span>◀</span><span>▶</span></div>
        <div class="t-acciones">
            <button type="button" class="t-btn t-hab" data-tecla="c"><b>C</b><small></small></button>
            <button type="button" class="t-btn t-hab" data-tecla="x"><b>X</b><small></small></button>
            <button type="button" class="t-btn t-hab" data-tecla="espacio"><b>●</b><small></small></button>
            <button type="button" class="t-btn t-salto" data-tecla="arriba"><b>▲</b><small>SALTAR</small></button>
        </div>`;
    document.getElementById('game').appendChild(capa);

    // botones de acción: se mantienen presionados mientras el dedo esté encima
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

    // cruceta: un solo dedo; deslizándolo se pasa de izquierda a derecha sin levantarlo
    const cruceta = capa.querySelector('.t-cruceta');
    let dedo = null;
    function mover(e) {
        const r = cruceta.getBoundingClientRect();
        const lado = e.clientX < r.left + r.width / 2 ? 'izq' : 'der';
        tecla(TECLA.izq, lado === 'izq');
        tecla(TECLA.der, lado === 'der');
        cruceta.dataset.lado = lado;
    }
    function soltarCruceta() {
        dedo = null;
        tecla(TECLA.izq, false);
        tecla(TECLA.der, false);
        delete cruceta.dataset.lado;
    }
    cruceta.addEventListener('pointerdown', e => {
        e.preventDefault();
        dedo = e.pointerId;
        cruceta.setPointerCapture?.(e.pointerId);
        mover(e);
    });
    cruceta.addEventListener('pointermove', e => { if (e.pointerId === dedo) mover(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t =>
        cruceta.addEventListener(t, e => { if (e.pointerId === dedo) soltarCruceta(); }));

    // los botones solo se ven durante un nivel; los nombres de las habilidades son los del personaje
    let pjActual = null;
    setInterval(() => {
        const nivel = juego.scene.isActive('juego') ? juego.scene.getScene('juego') : null;
        const visible = !!nivel?.pj;
        if (capa.classList.contains('visible') !== visible) {
            capa.classList.toggle('visible', visible);
            if (!visible) { soltarTodo(); soltarCruceta(); }
        }
        if (visible && nivel.pj !== pjActual) {
            pjActual = nivel.pj;
            capa.querySelectorAll('.t-hab').forEach(b => {
                b.querySelector('small').textContent = pjActual.habilidades[b.dataset.tecla].nombre.split(' / ')[0];
            });
        }
    }, 250);

    // si la app pasa a segundo plano, que no quede ninguna tecla "pegada"
    document.addEventListener('visibilitychange', () => { if (document.hidden) { soltarTodo(); soltarCruceta(); } });
}
