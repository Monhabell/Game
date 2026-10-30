// MINIMAPA (estilo "Metroid"): un recuadro arriba a la derecha con marco de piedra y borde dorado, y arriba el
// nombre de donde estás (el piso, en los descensos). Se pinta el ESPACIO POR DONDE SE CAMINA (los pasillos y
// salas, en azul) sobre la roca oscura, con los pisos y plataformas marcados en claro, el agua y la lava.
// Encima: tu ficha (con el color de tu personaje), la meta 🏁 (una flechita en el borde si está fuera), los
// puntos de control (verdes al pasarlos), lo que falta de las misiones y, en línea, los demás jugadores.
//   - Lo que ya recorriste se ve claro; lo que no, más tenue.
//   - Chico: unas pantallas alrededor tuyo (los niveles son muy largos) y una barrita con el avance total.
//   - Tocándolo (o con M) se agranda: el nivel entero, con la leyenda; otro toque lo achica.
//   - NOCHE DEL TROLL: lo que no recorriste queda tapado del todo y nunca se ve dónde están los demás ni el troll.
//   - Se apaga en ⚙ Ajustes → Pantalla → Minimapa.
// Es HTML encima del juego (como el HUD de la carrera): no le afecta el zoom de la cámara. La forma del
// nivel se dibuja UNA vez al cargarlo (en un lienzo aparte); después solo se copian trozos y se mueven fichas.

import { ajustes } from "./ajustes.js"
import { SUELO_Y } from "./alcance.js"
import { progresoEnRuta } from "./descenso.js"

const CHICO = { ancho: 190, alto: 58 };   // px de pantalla (el lienzo)
const VENTANA = 1400;                       // px del mundo que se ven a lo ancho, como mínimo (los niveles planos)
const VENTANA_ALTO = 820;                   // px del mundo que se ven a lo alto en el chico (2 o 3 pisos de un descenso)
const CADA_MS = 90;                         // cada cuánto se repinta
const CASILLA = 160;                        // px del mundo por casilla de lo recorrido
const ALCANCE = 300;                        // px sobre un piso que cuentan como "por donde se camina"
const COLUMNA = 12;                         // px del mundo por columna al calcular los pasillos
const COLOR = {
    aire: '#2f4d82', roca: '#16121f', borde: '#dfe7ff', fino: '#a9bcff', bloque: '#d8b060',
    agua: 'rgba(70, 170, 255, 0.85)', lava: '#ff6a20', control: '#6b7688', controlActivo: '#4fd1a5', mision: '#ff7ad9', meta: '#ffd27a',
};

let caja = null, lienzo = null, ctx = null, barra = null, titulo = null;
let mapa = null;

function armarDom() {
    if (caja) return;
    caja = document.createElement('div');
    caja.className = 'minimapa';
    caja.innerHTML = `<span class="minimapa-titulo"></span><span class="minimapa-ayuda">M</span><canvas></canvas>
        <div class="minimapa-barra"><i></i></div>
        <p class="minimapa-leyenda"><b class="mm-tu">●</b> Tú · 🏁 Meta · <b class="mm-cp">●</b> Control · <b class="mm-mi">●</b> Misión ·
            <b class="mm-ag">■</b> Agua · <b class="mm-la">■</b> Lava · <span>toca para cerrar</span></p>`;
    lienzo = caja.querySelector('canvas');
    ctx = lienzo.getContext('2d');
    barra = caja.querySelector('.minimapa-barra i');
    titulo = caja.querySelector('.minimapa-titulo');
    caja.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); alternar(); });
    document.getElementById('game').append(caja);
    window.addEventListener('keydown', e => {
        if ((e.key === 'm' || e.key === 'M') && caja.classList.contains('visible') && !/INPUT|TEXTAREA/.test(e.target?.tagName)) alternar();
    });
}
const alternar = () => { caja.classList.toggle('grande'); if (mapa) mapa.proximo = 0; };
export const ocultarMinimapa = () => { caja?.classList.remove('visible', 'grande'); };

// al crear la escena del nivel (también al reaparecer: si es el mismo nivel, el dibujo y lo recorrido se reusan)
export function crearMinimapa(scene, nivel, { arena = false, noche = false } = {}) {
    armarDom();
    scene.minimapa = null;
    scene.events.once('shutdown', ocultarMinimapa);
    if (arena || !nivel?.ancho) { ocultarMinimapa(); return; } // (la arena entra en una pantalla)
    const clave = `${nivel.nombre}|${nivel.ancho}|${nivel.semilla}|${noche}`;
    if (mapa?.clave !== clave) mapa = dibujarNivel(nivel, clave, noche);
    mapa.proximo = 0;
    scene.minimapa = mapa;
    caja.classList.toggle('noche', noche);
}

// ---------- el dibujo del nivel (una vez) ----------
// todo lo macizo como rectángulos: 'roca' (suelo, losas, muros, techos) o 'fino' (plataformas, bloques)
function macizos(nivel, arriba) {
    const S = SUELO_Y, r = [];
    const roca = (x0, x1, y0, y1) => r.push({ x0, x1, y0, y1, fino: false });
    const fino = (x0, x1, y0, y1, color) => r.push({ x0, x1, y0, y1, fino: true, color });
    (nivel.suelo || []).forEach(([a, b]) => roca(a, b, S, S + 50));
    (nivel.losas || []).forEach(([x0, x1, y, g]) => roca(x0, x1, y, y + g));
    (nivel.muros || []).forEach(([x, y, w]) => roca(x, x + w, y, S));
    (nivel.techos || []).forEach(([x0, x1, bajo]) => roca(x0, x1, arriba, bajo));
    (nivel.escaleras || []).forEach(([x, h]) => { for (let c = 0; c < h; c++) roca(x + c * 32, x + (c + 1) * 32, S - 32 * (c + 1), S); });
    (nivel.plataformas || []).forEach(([x, y, w]) => fino(x, x + w, y, y + 12));
    (nivel.bloques || []).forEach(([x, y, p]) => fino(x, x + p.length * 32, y - 16, y + 16, COLOR.bloque));
    (nivel.moviles || []).forEach(([x, y, eje, rec]) => fino(x - 64, x + 64 + (eje === 'x' ? rec : 0), y - 8, y + 8));
    (nivel.descenso?.retos || []).forEach(t => (t.tejas || []).forEach(x => fino(x, x + 64, t.y, t.y + 14, COLOR.bloque)));
    return r;
}

function dibujarNivel(nivel, clave, noche) {
    // hasta lo más alto que tenga algo (no todo el cielo: si no, la forma queda como una rayita abajo)
    const tope = Math.min(SUELO_Y - 240,
        ...(nivel.plataformas || []).map(p => p[1]), ...(nivel.losas || []).map(l => l[2]), ...(nivel.muros || []).map(m => m[1]),
        ...(nivel.bloques || []).map(q => q[1]), ...(nivel.moviles || []).map(q => q[1] - (q[2] === 'y' ? q[3] : 0)));
    const arriba = Math.max(-(nivel.alto || 0) - 120, tope - 90), abajo = SUELO_Y + 50;
    const altoMundo = abajo - arriba;
    // escala: la misma en x y en y (sin deformar); en los niveles altos se ve más ancho
    const escala = Math.min(CHICO.ancho / VENTANA, CHICO.alto / altoMundo) * 2; // (×2: nítido en pantallas densas)
    const fuera = document.createElement('canvas');
    fuera.width = Math.ceil(nivel.ancho * escala);
    fuera.height = Math.ceil(altoMundo * escala);
    const c = fuera.getContext('2d');
    const X = x => x * escala, Y = y => (y - arriba) * escala;
    const rect = (x0, y0, x1, y1, color, min = 0) => {
        c.fillStyle = color;
        c.fillRect(X(x0), Y(y0), Math.max(min, X(x1) - X(x0)), Math.max(min, Y(y1) - Y(y0)));
    };
    const todo = macizos(nivel, arriba);
    const bordes = []; // [x, y]: el borde claro de arriba de la roca, solo donde se pisa (no bajo otra roca)
    // 1) los pasillos: en cada columna, el aire que hay sobre cada piso (hasta lo que tenga encima)
    for (let x = 0; x < nivel.ancho; x += COLUMNA) {
        const cx = x + COLUMNA / 2;
        const aqui = todo.filter(q => cx >= q.x0 && cx < q.x1).sort((p, q) => p.y0 - q.y0);
        aqui.forEach((q, i) => {
            const encima = aqui.slice(0, i).reduce((m, p) => (p.y1 <= q.y0 ? Math.max(m, p.y1) : m), -Infinity);
            const desde = Math.max(arriba, q.y0 - ALCANCE, encima);
            if (desde < q.y0 && !nivel.descenso) rect(x, desde, x + COLUMNA + 1, q.y0, COLOR.aire); // (+1: sin rayitas entre columnas)
            if (!q.fino && !aqui.some(p => p !== q && !p.fino && p.y0 < q.y0 && p.y1 >= q.y0 - 1)) bordes.push([x, q.y0]);
        });
        // (los ascensores: su recorrido también es pasillo)
        (nivel.moviles || []).forEach(([mx, my, eje, rec]) => { if (eje === 'y' && Math.abs(cx - mx) < 64) rect(x, my - rec - 60, x + COLUMNA, my, COLOR.aire); });
    }
    // (los descensos: los pasillos son sus salas, exactas: de su techo a su piso)
    const dsc = nivel.descenso;
    if (dsc) {
        dsc.salas.forEach(s => rect(s.x0, s.l === 0 ? Math.max(arriba, dsc.lineas[0] - 220) : dsc.lineas[s.l - 1] + dsc.G, s.x1, dsc.lineas[s.l], COLOR.aire));
        if (dsc.caverna) rect(dsc.caverna[0], dsc.lineas[Math.max(0, dsc.N - 3)] + dsc.G, dsc.caverna[1], SUELO_Y, COLOR.aire);
    }
    // 2) el agua y la lava (dentro de los pasillos)
    (nivel.agua || []).forEach(([x0, x1, sup, hondo = SUELO_Y + 40]) => rect(x0, sup, x1, hondo, COLOR.agua));
    [...(nivel.lava || []), ...(nivel.falsos || [])].forEach(([x0, x1]) => rect(x0, SUELO_Y - 10, x1, SUELO_Y + 50, COLOR.lava));
    (nivel.descenso?.retos || []).forEach(t => {
        if (t.tipo === 'lava' || t.tipo === 'losas') rect(t.x0, t.y + 12, t.x1, t.y + 100, COLOR.lava);
        if (t.tipo === 'cascada') t.chorros.forEach(cx => rect(cx - 10, t.techo, cx + 10, t.y, COLOR.lava, 1));
    });
    // 3) la roca, con su borde de arriba en claro (lo que se pisa), y las plataformas
    todo.filter(q => !q.fino).forEach(q => rect(q.x0, q.y0, q.x1, q.y1, COLOR.roca));
    bordes.forEach(([x, y]) => rect(x, y, x + COLUMNA + 1, y + 6, COLOR.borde, 1));
    todo.filter(q => q.fino).forEach(q => rect(q.x0, q.y0, q.x1, q.y1, q.color || COLOR.fino, 1.2));
    return {
        clave, fuera, escala, arriba, ancho: nivel.ancho, meta: nivel.meta, metaY: nivel.metaY ?? SUELO_Y, ruta: nivel.descenso?.ruta,
        nombre: String(nivel.nombre || '').split(' · ')[0],
        noche, visto: new Set(), columnas: Math.ceil(nivel.ancho / CASILLA), filas: Math.ceil(altoMundo / CASILLA), proximo: 0,
    };
}

// ---------- cada fotograma (game.js) ----------
export function actualizarMinimapa(scene) {
    const m = scene.minimapa;
    if (!m || !caja) return;
    const mostrar = ajustes.minimapa !== false;
    caja.classList.toggle('visible', mostrar);
    if (!mostrar) return;
    const g = scene.mascotaGesi;
    // lo recorrido: las casillas cerca tuyo
    if (g && !g.isDead) {
        const cx = Math.floor(g.x / CASILLA), cy = Math.floor((g.y - m.arriba) / CASILLA);
        for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) m.visto.add((cy + j) * m.columnas + cx + i);
    }
    const ahora = performance.now();
    if (ahora < m.proximo) return;
    m.proximo = ahora + CADA_MS;
    pintar(scene, m);
}

function pintar(scene, m) {
    const grande = caja.classList.contains('grande');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = lienzo.getBoundingClientRect();
    const W = Math.max(1, Math.round(rect.width * dpr)), H = Math.max(1, Math.round(rect.height * dpr));
    if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
    const g = scene.mascotaGesi;
    const px = g?.x ?? 0, py = g?.y ?? SUELO_Y;
    // el título: el piso (descensos) o el nivel
    const d = scene.descenso;
    const texto = d ? `${d.vista ? '⬇' : '☀'} ${d.capas[d.vista]?.nombre ?? ''}` : m.nombre;
    if (titulo.textContent !== texto) titulo.textContent = texto;
    // qué parte del nivel se ve: entero (grande) o una ventana alrededor tuyo (chico)
    const fw = m.fuera.width, fh = m.fuera.height;
    let k, ky, ox, oy;
    if (grande) {
        // el nivel entero; si es muy largo y bajo, se estira un poco a lo alto (si no, es una rayita)
        k = Math.min(W / fw, H / fh);
        ky = Math.min(H / fh, k * 3);
        ox = 0; oy = 0;
    } else {
        // una ventana alrededor tuyo: al menos VENTANA px del mundo a lo ancho y, en los niveles altos
        // (descensos), unos VENTANA_ALTO a lo alto (2 o 3 pisos), siguiéndote también hacia abajo
        const altoVisible = Math.min(fh, VENTANA_ALTO * m.escala);
        k = ky = Math.min(H / altoVisible, W / (VENTANA * m.escala));
        const vis = W / k, visAlto = H / k;
        ox = Math.max(0, Math.min(fw - vis, px * m.escala - vis * 0.42));
        oy = fh <= visAlto ? 0 : Math.max(0, Math.min(fh - visAlto, (py - m.arriba) * m.escala - visAlto * 0.55));
    }
    // (grande: centrado · chico: pegado abajo, que es donde está el suelo)
    const dx = grande ? (W - fw * k) / 2 : 0;
    const dy = grande ? (H - fh * ky) / 2 : Math.max(0, H - (fh - oy) * ky);
    const aMini = (x, y) => [(x * m.escala - ox) * k + dx, ((y - m.arriba) * m.escala - oy) * ky + dy];
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    const anchoFuente = Math.min(fw - ox, W / k), altoFuente = Math.min(fh - oy, H / ky);
    ctx.drawImage(m.fuera, ox, oy, anchoFuente, altoFuente, dx, dy, anchoFuente * k, altoFuente * ky);
    // lo que no recorriste: más tenue (en la Noche del Troll, tapado del todo). Todo en un solo trazo: así
    // las casillas que se tocan no se oscurecen dos veces (quedaba una cuadrícula)
    ctx.fillStyle = m.noche ? 'rgba(10, 8, 18, 0.96)' : 'rgba(10, 8, 18, 0.5)';
    ctx.beginPath();
    for (let f = 0; f < m.filas; f++) for (let col = 0; col < m.columnas; col++) {
        if (m.visto.has(f * m.columnas + col)) continue;
        const [x0, y0] = aMini(col * CASILLA, m.arriba + f * CASILLA);
        const [x1, y1] = aMini((col + 1) * CASILLA, m.arriba + (f + 1) * CASILLA);
        if (x1 < 0 || x0 > W || y1 < 0 || y0 > H) continue;
        ctx.rect(Math.floor(x0), Math.floor(y0), Math.ceil(x1) - Math.floor(x0), Math.ceil(y1) - Math.floor(y0));
    }
    ctx.fill('nonzero');
    const ficha = (x, y, r, color, borde = '#0a0814') => {
        const [mx, my] = aMini(x, y);
        if (mx < -r * dpr || mx > W + r * dpr) return;
        ctx.beginPath(); ctx.arc(mx, my, r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.lineWidth = dpr; ctx.strokeStyle = borde; ctx.stroke();
    };
    // puntos de control y misiones
    (scene.checkpoints || []).forEach(cp => ficha(cp.x, (cp.pie ?? SUELO_Y) - 22, 2.3, cp.activo ? COLOR.controlActivo : COLOR.control));
    if (!m.noche) (scene.misCosas || []).forEach(o => { if (o.c?.x != null) ficha(o.c.x, o.c.y ?? SUELO_Y - 20, 2.1, COLOR.mision); });
    // la meta (si está fuera del recuadro, una flechita en el borde)
    if (m.meta && !scene.noche) {
        const [mx, my] = aMini(m.meta, m.metaY);
        ctx.font = `${Math.round(10 * dpr)}px sans-serif`;
        ctx.textAlign = 'center';
        if (mx <= W - 4 * dpr) ctx.fillText('🏁', mx, my - 1 * dpr);
        else {
            const ay = Math.max(8 * dpr, Math.min(H - 6 * dpr, my));
            ctx.fillStyle = COLOR.meta;
            ctx.beginPath(); ctx.moveTo(W - 2 * dpr, ay); ctx.lineTo(W - 8 * dpr, ay - 5 * dpr); ctx.lineTo(W - 8 * dpr, ay + 5 * dpr); ctx.fill();
            ctx.fillText('🏁', W - 16 * dpr, ay + 3.5 * dpr);
        }
    }
    // los demás jugadores (no en la Noche del Troll: no se sabe dónde está nadie)
    if (!m.noche) scene.remotos?.forEach(r => {
        if (!r.estado || r.estado.muerto) return;
        ficha(r.estado.x, r.estado.y, 2.8, '#' + (r.pj?.color ?? 0x9fb4ff).toString(16).padStart(6, '0'));
    });
    // tú: tu ficha, con el color de tu personaje, un brillo que late y hacia dónde miras
    if (g) {
        const late = 0.5 + 0.5 * Math.sin(performance.now() / 180);
        const [mx, my] = aMini(px, py);
        ctx.beginPath(); ctx.arc(mx, my, (6 + 2 * late) * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 230, 120, ${0.18 + 0.18 * late})`; ctx.fill();
        ficha(px, py, 4, '#' + (scene.pj?.color ?? 0xffe066).toString(16).padStart(6, '0'), '#ffffff');
        const lado = g.flipX ? -1 : 1;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(mx + lado * 7 * dpr, my); ctx.lineTo(mx + lado * 4.5 * dpr, my - 2.5 * dpr); ctx.lineTo(mx + lado * 4.5 * dpr, my + 2.5 * dpr); ctx.fill();
    }
    // la barrita: cuánto llevas del nivel
    // (los descensos con formas: por la ruta, que vuelve a la izquierda o sube)
    const avance = m.ruta ? progresoEnRuta(m.ruta, px, py) : px / Math.max(1, m.meta || m.ancho);
    barra.style.width = `${Math.max(0, Math.min(100, avance * 100))}%`;
}
