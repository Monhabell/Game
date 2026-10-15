// Vestidor: cada jugador elige los colores de la ropa, el pelo y los ojos de cada héroe.
//
// Cómo funciona (cambio de paleta): los sprites son pixel art con pocos colores (~20 por héroe).
// Para cada héroe se anotaron qué colores exactos son de cada parte (mirando los sprites); al elegir
// un color, esos tonos se reemplazan por el nuevo color conservando sus luces y sombras. La piel, la
// cara, las armas y los contornos no se tocan. Se generan texturas y animaciones nuevas con un nombre
// que dice los colores ("arquera~b4202a.o.o.o"): ese nombre viaja en línea y cada pantalla arma la
// variante de los demás (prepararVariante). Las originales ("arquera-idle"...) nunca se modifican.
//
// Guardado: localStorage con su propia clave y versión.

import { PERSONAJES } from "./personajes.js"

const CLAVE = 'monhabell-aventura-vestidor';
const VERSION = 1;

// partes de cada héroe: [nombre, [colores originales; el primero es el tono principal]]
export const PARTES = {
    arquera: [['Capa', ['#87102a', '#421020', '#491f30']], ['Cinturón y botas', ['#a05151', '#672d35']],
        ['Pelo', ['#926e6a', '#eee1de', '#342226']], ['Ojos', ['#004d99', '#00c0ea', '#008ad1', '#0f1f47']]],
    espadachin: [['Camisa', ['#65709c', '#a3a9c4', '#0a112b']], ['Pantalón', ['#491f30', '#291727']],
        ['Pelo', ['#ffc622', '#ff8b2a', '#c85b24']], ['Ojos', ['#00c219', '#79dc2b', '#005137', '#00a117']]],
    mago: [['Capa', ['#1b323e', '#001a1a']], ['Ropa', ['#23324d', '#0a112b']],
        ['Pelo', ['#401a22', '#412433', '#291727']], ['Ojos', ['#ffa400', '#ff8a26', '#ffd62a', '#ff6a00']]],
    hechicera: [['Capa', ['#c92b44', '#8c174f']], ['Adornos', ['#d17642', '#eda55f']],
        ['Pelo', ['#c4d552', '#005652']], ['Ojos', ['#ffa400', '#ffd62a', '#ff6a00', '#ff8a26']]],
    caballera: [['Vestido', ['#1b323e', '#0a112b']], ['Adornos', ['#c92b44', '#8c174f']],
        ['Pelo', ['#f8a870', '#ce704d', '#843d36', '#44232f']], ['Ojos', ['#00c219', '#79dc2b', '#005137', '#cbf257']]],
    mosquetera: [['Abrigo', ['#491f30']], ['Chaleco', ['#005137', '#001a1a']],
        ['Pelo', ['#d21a26', '#87102a', '#421020']], ['Ojos', ['#ffa400', '#ffd62a', '#ff6a00']]],
};

// colores para elegir (todos gratis)
export const COLORES = [
    '#b4202a', '#e8772e', '#f2c94c', '#3fa34d', '#2bb3a3', '#2f6fd6', '#4b3fb0',
    '#8e3fb8', '#e05a9c', '#e8e8f0', '#9aa0ad', '#3a3f4f', '#1d1f2b', '#7a4a2a',
];

const HEX = /^#[0-9a-f]{6}$/;

// ---------- guardado ----------
function leer() {
    const e = { version: VERSION, heroes: {} };
    try {
        const g = JSON.parse(localStorage.getItem(CLAVE));
        Object.keys(PARTES).forEach(id => {
            const lista = g?.heroes?.[id];
            if (Array.isArray(lista)) e.heroes[id] = PARTES[id].map((_p, i) => (HEX.test(lista[i]) ? lista[i] : null));
        });
    } catch (_e) { /* guardado dañado o inexistente: colores originales */ }
    return e;
}
const estado = leer();
function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (_e) { /* sin almacenamiento: dura hasta cerrar */ }
}

export const coloresDe = id => PARTES[id] ? PARTES[id].map((_p, i) => estado.heroes[id]?.[i] ?? null) : [];

export function elegirColor(id, parte, color) {
    if (!PARTES[id] || !PARTES[id][parte] || (color !== null && !HEX.test(color))) return;
    estado.heroes[id] = coloresDe(id);
    estado.heroes[id][parte] = color;
    guardar();
}
export function restablecer(id) {
    delete estado.heroes[id];
    guardar();
}

// prefijo de las animaciones del héroe con los colores elegidos (sin cambios: el de siempre)
function codigo(id, colores) {
    if (!colores.some(Boolean)) return '';
    return '~' + colores.map(c => (c ? c.slice(1) : 'o')).join('.');
}
export const animDe = pj => {
    const id = typeof pj === 'string' ? pj : pj.id;
    return id + codigo(id, coloresDe(id));
};

// ---------- cambio de paleta ----------
const aRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function aHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h / 6, s, l];
}
function deHsl([h, s, l]) {
    if (!s) return [l, l, l].map(v => Math.round(v * 255));
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => {
        t = (t + 1) % 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
}
const clave = ([r, g, b]) => (r << 16) | (g << 8) | b;

// tono original -> tono nuevo: toma el color elegido y conserva lo claro/oscuro de cada tono
// respecto del principal (así siguen las sombras y los brillos del dibujo)
function mapaDeColores(id, colores) {
    const mapa = new Map();
    PARTES[id].forEach(([, tonos], i) => {
        if (!colores[i]) return;
        const [ht, st, lt] = aHsl(aRgb(colores[i]));
        const [, sp, lp] = aHsl(aRgb(tonos[0]));
        tonos.forEach(t => {
            const [, s, l] = aHsl(aRgb(t));
            const nl = Math.min(0.94, Math.max(0.03, lt * (lp ? l / lp : 1)));
            const ns = Math.min(1, st * (sp ? Math.max(0.3, s / sp) : 1));
            mapa.set(clave(aRgb(t)), deHsl([ht, ns, nl]));
        });
    });
    return mapa;
}

function recolorear(imagen, mapa) {
    const lienzo = document.createElement('canvas');
    lienzo.width = imagen.width;
    lienzo.height = imagen.height;
    const ctx = lienzo.getContext('2d');
    ctx.drawImage(imagen, 0, 0);
    const datos = ctx.getImageData(0, 0, lienzo.width, lienzo.height), p = datos.data;
    for (let i = 0; i < p.length; i += 4) {
        if (p[i + 3] === 0) continue;
        const nuevo = mapa.get((p[i] << 16) | (p[i + 1] << 8) | p[i + 2]);
        if (nuevo) { p[i] = nuevo[0]; p[i + 1] = nuevo[1]; p[i + 2] = nuevo[2]; }
    }
    ctx.putImageData(datos, 0, 0);
    return lienzo;
}

const PREFIJO = /^([a-z]+)(~(?:[0-9a-f]{6}|o)(?:\.(?:[0-9a-f]{6}|o)){0,7})?$/;

// arma (una sola vez) las texturas y animaciones de una variante de colores; devuelve el prefijo
// que hay que usar en las animaciones (`${prefijo}-run`). juego: la escena o el juego de Phaser
export function prepararVariante(juego, prefijo) {
    const m = PREFIJO.exec(prefijo || '');
    const pj = m && PERSONAJES.find(p => p.id === m[1]);
    if (!pj) return PERSONAJES[0].id;
    if (!m[2] || juego.anims.exists(`${prefijo}-idle`)) return prefijo;
    const colores = m[2].slice(1).split('.').map(c => (c === 'o' ? null : `#${c}`));
    const mapa = mapaDeColores(pj.id, colores);
    Object.entries(pj.hojas).forEach(([nombre, [, frames, fps, repetir]]) => {
        const original = juego.textures.get(`${pj.id}-${nombre}`);
        const key = `${prefijo}-${nombre}`;
        if (!original || original.key === '__MISSING' || juego.textures.exists(key)) return;
        const lienzo = recolorear(original.getSourceImage(), mapa);
        const t = juego.textures.addCanvas(key, lienzo);
        Phaser.Textures.Parsers.SpriteSheet(t, 0, 0, 0, lienzo.width, lienzo.height, { frameWidth: 128, frameHeight: 128 });
        t.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art nítido
        juego.anims.create({ key, frames: juego.anims.generateFrameNumbers(key, { start: 0, end: frames - 1 }), frameRate: fps, repeat: repetir });
    });
    return prefijo;
}

// ---------- la ventana del vestidor (capa HTML, como la tienda y los menús) ----------
// devuelve abrir(pjId, alCerrar)
export function iniciarVestidor(juego) {
    const capa = document.createElement('div');
    capa.className = 'menu-capa';
    capa.hidden = true;
    capa.innerHTML = `
        <div class="menu-panel menu-panel-ancho vestidor-panel" role="dialog" aria-modal="true" aria-labelledby="titulo-vestidor">
            <h2 id="titulo-vestidor">Personalizar</h2>
            <div class="vestidor-cuerpo">
                <canvas class="vestidor-vista" width="128" height="128" aria-hidden="true"></canvas>
                <div class="vestidor-partes" data-partes></div>
            </div>
            <div class="menu-fila">
                <button type="button" class="menu-boton" data-accion="original">↺ Colores originales</button>
                <button type="button" class="menu-boton sala-empezar" data-accion="listo">✓ Listo</button>
            </div>
            <p class="menu-nota">Solo cambia cómo se ve. En línea, los demás también ven tus colores.</p>
        </div>`;
    document.getElementById('game').append(capa);
    const partes = capa.querySelector('[data-partes]');
    const vista = capa.querySelector('.vestidor-vista'), ctx = vista.getContext('2d');
    let pj = null, alCerrar = null, hoja = null, cuadro = 0, reloj = null;

    function pintar() {
        const elegidos = coloresDe(pj.id);
        const color = '#' + pj.color.toString(16).padStart(6, '0');
        capa.querySelector('#titulo-vestidor').innerHTML = `Personalizar · <span style="color:${color}">${pj.nombre}</span>`;
        partes.innerHTML = PARTES[pj.id].map(([nombre, tonos], i) => `
            <div class="vestidor-parte">
                <span>${nombre}</span>
                <div class="vestidor-colores" role="group" aria-label="Color de ${nombre}">
                    <button type="button" class="vestidor-color original ${elegidos[i] ? '' : 'elegido'}" data-parte="${i}" data-color=""
                        style="--c:${tonos[0]}" aria-label="Original" aria-pressed="${!elegidos[i]}" title="Original">↺</button>
                    ${COLORES.map(c => `<button type="button" class="vestidor-color ${elegidos[i] === c ? 'elegido' : ''}" data-parte="${i}"
                        data-color="${c}" style="--c:${c}" aria-label="${c}" aria-pressed="${elegidos[i] === c}"></button>`).join('')}
                </div>
            </div>`).join('');
        // vista previa: la animación de quieto con los colores elegidos
        const original = juego.textures.get(`${pj.id}-idle`);
        hoja = original?.key !== '__MISSING' ? recolorear(original.getSourceImage(), mapaDeColores(pj.id, elegidos)) : null;
    }

    function animar() {
        if (!hoja) return;
        const frames = pj.hojas.idle[1];
        cuadro = (cuadro + 1) % frames;
        ctx.clearRect(0, 0, 128, 128);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(hoja, cuadro * 128, 0, 128, 128, 0, 0, 128, 128);
    }

    capa.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.accion === 'listo') { cerrar(); return; }
        if (b.dataset.accion === 'original') { restablecer(pj.id); pintar(); return; }
        if (b.dataset.parte !== undefined) {
            elegirColor(pj.id, Number(b.dataset.parte), b.dataset.color || null);
            pintar();
            partes.querySelector(`[data-parte="${b.dataset.parte}"][data-color="${b.dataset.color}"]`)?.focus();
        }
    });
    capa.addEventListener('pointerdown', e => { if (e.target === capa) cerrar(); });
    capa.addEventListener('keydown', e => {
        e.stopPropagation(); // las teclas no llegan al juego
        if (e.key === 'Escape') cerrar();
    });

    function cerrar() {
        capa.hidden = true;
        clearInterval(reloj);
        const f = alCerrar;
        alCerrar = null;
        f?.();
    }

    return function abrir(pjId, cuandoCierre) {
        if (!capa.hidden) return;
        pj = PERSONAJES.find(p => p.id === pjId) || PERSONAJES[0];
        alCerrar = cuandoCierre;
        pintar();
        animar();
        reloj = setInterval(animar, 1000 / pj.hojas.idle[2]);
        capa.hidden = false;
        capa.querySelector('[data-accion="listo"]').focus();
    };
}
