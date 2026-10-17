// Niveles del jugador y de cada personaje (se guardan en el navegador / la app).
//
// Los niveles NO tienen techo (300, 500...) y los premios nunca se acaban: hay 65 poderes, así que
// cuando ya los tienes todos, el premio pasa a ser una mejora ★ gratis de uno tuyo (65 × 4 = 260
// mejoras más) y, con todo al máximo, monedas. Lo que crece sin fin es el RANGO (insignia junto al nivel).
//
// NIVEL DEL JUGADOR (la cuenta): sube con experiencia (XP) de todo lo que se juega.
//   terminar un nivel de la historia +180 (+50 la primera vez) · carrera: 1º +120, 2º +80, 3º +60,
//   los demás +30 · arena: ganar +100, perder +30 · eliminar a un rival con un poder +15
//   XP para subir: +100 por nivel hasta el 50 (5100) y después +20 por nivel (100: 6100 · 300: 10100 ·
//   500: 14100): cada nivel cuesta un poco más, pero los altísimos se pueden alcanzar.
//   PRIMERA VICTORIA DEL DÍA (terminar un nivel, ganar una carrera o una arena): +150 XP extra.
//   Premios: cada nivel, monedas (20 × nivel, hasta 1000) · cada 5 niveles, un poder nuevo (o una
//   mejora ★ gratis si ya los tienes todos) · cada 25 niveles, uno legendario (o su mejora) ·
//   rangos: 🥉 25 · 🥈 50 · 🥇 100 · 💎 200 · 👑 300 · 🔥 500 (se ven junto al nivel para todos).
// MAESTRÍA DE CADA HÉROE (hasta 100): la XP también la gana el héroe con el que se juega.
//   2: runa de maestría (una vez por nivel, el escudo roto vuelve solo) · 3: su primer poder propio
//   5: habilidades 10 % más rápidas de recargar · 7: su segundo poder propio · 10: título de maestro
//   cada 10 más: una mejora ★ gratis de sus poderes propios (o monedas) · títulos: 25 Veterano,
//   50 Héroe, 100 Leyenda.
//   (Nada de más vida ni más daño: en carrera y arena el que juega más no gana por eso.)
//
// En línea cada uno anuncia su nivel con un evento ('nivel') que el servidor reenvía (sin cambiar el
// servidor): se ve en la sala de espera, sobre la cabeza de los demás y en la carrera.

import { red, alRecibir, enviarEvento } from "./red.js"
import { PODERES, darPoder, tienePoder, poderPorId, nivelPoder, subirPoder, NIVEL_MAX } from "./poderes.js"
import { sumarMonedas } from "./tienda.js"

const CLAVE = 'monhabell-progreso';
export const MAESTRIA_MAX = 100;
const MAESTRO = 10; // maestría con la que se gana el título de maestro
export const XP = { nivel: 180, nivelPrimera: 50, carrera: [120, 80, 60], carreraOtros: 30, arenaGana: 100, arenaPierde: 30, eliminar: 15 };
// XP para pasar del nivel n al n+1: sube rápido hasta el 50 y después despacio (siempre un poco más)
const xpCuenta = n => (n <= 50 ? 200 + 100 * (n - 1) : 5100 + 20 * (n - 50));
const xpHeroe = n => (n <= 40 ? 150 + 75 * (n - 1) : 3075 + 15 * (n - 40));
const XP_PRIMERA_DEL_DIA = 150;
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
// rango: la insignia que acompaña al nivel (la ven todos)
const RANGOS = [[500, '🔥'], [300, '👑'], [200, '💎'], [100, '🥇'], [50, '🥈'], [25, '🥉']];
export const rangoDe = nv => RANGOS.find(([desde]) => nv >= desde)?.[1] || '';
// "Nv 125 🥇": cómo se muestra un nivel en todos lados
export const textoNivel = nv => `Nv ${nv}${rangoDe(nv) ? ` ${rangoDe(nv)}` : ''}`;
// poderes propios de cada héroe (maestría 3 y 7)
const PROPIOS = {
    arquera: ['flecha_jade', 'lanzas_hielo'], espadachin: ['tajo_carmesi', 'doble_tajo'], mago: ['nova_arcana', 'cometa_arcano'],
    hechicera: ['llama_esmeralda', 'niebla_venenosa'], caballera: ['golpe_sismico', 'escudo_arcano'], mosquetera: ['chispa', 'rayo_celestial'],
    paladina: ['pilares_luz', 'bendicion'], asesina: ['zarpazo_sombra', 'bomba_humo'], elfa: ['latigo', 'torbellino_hojas'],
};
const TITULOS = { arquera: 'Maestra arquera', espadachin: 'Maestro espadachín', mago: 'Gran mago', hechicera: 'Gran hechicera',
    caballera: 'Caballera legendaria', mosquetera: 'Tiradora maestra', paladina: 'Paladina sagrada', asesina: 'Sombra maestra', elfa: 'Guardiana del bosque' };

function leer() {
    try {
        const e = JSON.parse(localStorage.getItem(CLAVE)) || {};
        return { nivel: Math.max(1, e.nivel | 0), xp: Math.max(0, e.xp | 0), heroes: typeof e.heroes === 'object' && e.heroes ? e.heroes : {},
            victoriaDia: typeof e.victoriaDia === 'string' ? e.victoriaDia : '' };
    } catch (_e) { return { nivel: 1, xp: 0, heroes: {}, victoriaDia: '' }; }
}
const estado = leer();
function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (_e) { /* sin almacenamiento */ }
}

export const nivelJugador = () => estado.nivel;
export const progresoJugador = () => ({ nivel: estado.nivel, xp: estado.xp, falta: xpCuenta(estado.nivel) });
const heroe = id => (estado.heroes[id] ||= { nivel: 1, xp: 0 });
export const maestria = id => estado.heroes[id]?.nivel || 1;
export function tituloHeroe(id) {
    const m = maestria(id);
    if (m < MAESTRO) return null;
    const grado = m >= 100 ? 'Leyenda · ' : m >= 50 ? 'Héroe · ' : m >= 25 ? 'Veterano · ' : '';
    return `${grado}${TITULOS[id] || ''}`;
}
// maestría 5: las habilidades recargan 10 % más rápido
export const factorRecarga = id => (maestria(id) >= 5 ? 0.9 : 1);
// maestría 2: la runa de maestría (el escudo roto vuelve una vez por nivel)
export const tieneRunaMaestria = id => maestria(id) >= 2;

// ---------- ganar experiencia ----------
// pjId: el héroe con el que se jugó (también gana maestría)
// victoria: terminó un nivel o ganó una carrera o una arena (la primera del día da XP extra)
export function ganarXP(cantidad, pjId, { victoria = false } = {}) {
    cantidad = Math.max(0, Math.round(cantidad));
    if (!cantidad) return;
    let extra = '';
    if (victoria && estado.victoriaDia !== hoy()) {
        estado.victoriaDia = hoy();
        cantidad += XP_PRIMERA_DEL_DIA;
        extra = `🌅 Primera victoria del día +${XP_PRIMERA_DEL_DIA}`;
    }
    const avisos = [`+${cantidad} XP`, ...(extra ? [extra] : [])];
    estado.xp += cantidad;
    while (estado.xp >= xpCuenta(estado.nivel)) {
        estado.xp -= xpCuenta(estado.nivel);
        estado.nivel++;
        avisos.push(...premiosCuenta(estado.nivel));
    }
    if (pjId) {
        const h = heroe(pjId);
        if (h.nivel < MAESTRIA_MAX) {
            h.xp += cantidad;
            while (h.nivel < MAESTRIA_MAX && h.xp >= xpHeroe(h.nivel)) {
                h.xp -= xpHeroe(h.nivel);
                h.nivel++;
                avisos.push(...premiosHeroe(pjId, h.nivel));
            }
            if (h.nivel >= MAESTRIA_MAX) h.xp = 0;
        }
    }
    guardar();
    mostrarAvisos(avisos);
    anunciar();
}

function premiosCuenta(n) {
    const avisos = [`⬆ ¡NIVEL ${n}!`];
    const monedas = 20 * Math.min(n, 50);
    sumarMonedas(monedas);
    avisos.push(`◉ +${monedas} monedas`);
    if (n % 25 === 0) avisos.push(premioPoder(['legendario']));
    else if (n % 5 === 0) avisos.push(premioPoder(n < 15 ? ['comun', 'raro'] : n < 40 ? ['raro', 'epico'] : ['epico', 'legendario']));
    const rango = RANGOS.find(([desde]) => desde === n);
    if (rango) avisos.push(`${rango[1]} ¡Nuevo rango!`);
    return avisos;
}

// un poder nuevo de esas rarezas; si ya los tienes todos, una mejora ★ gratis de uno tuyo; si todo
// está al máximo, monedas. Así el premio nunca se acaba aunque el nivel llegue a 500
function premioPoder(rarezas) {
    const p = poderAlAzar(rarezas);
    if (p) return `✨ Nuevo poder: ${p.nombre}`;
    const m = mejoraGratis(PODERES.filter(q => tienePoder(q.id)), rarezas);
    if (m) return `⬆ Mejora gratis: ${m.nombre} ★${nivelPoder(m.id)}`;
    sumarMonedas(500);
    return '◉ +500 (todos tus poderes están al máximo)';
}

// sube un nivel ★ a uno de esos poderes (primero los de esas rarezas)
function mejoraGratis(lista, rarezas = []) {
    const subibles = lista.filter(q => nivelPoder(q.id) < NIVEL_MAX);
    const preferidos = subibles.filter(q => rarezas.includes(q.rareza));
    const elegidos = preferidos.length ? preferidos : subibles;
    const p = elegidos[Math.floor(Math.random() * elegidos.length)];
    return p && subirPoder(p.id) ? p : null;
}

function premiosHeroe(id, n) {
    const avisos = [`⭐ Maestría ${n}`];
    if (n === 2) avisos.push('🛡 Runa de maestría: tu escudo vuelve una vez por nivel');
    if (n === 3 || n === 7) {
        const pid = PROPIOS[id]?.[n === 3 ? 0 : 1];
        if (pid && darPoder(pid)) avisos.push(`✨ Poder propio: ${poderPorId(pid).nombre}`);
        else { sumarMonedas(150); avisos.push('◉ +150 (ya tenías su poder)'); }
    }
    if (n === 5) avisos.push('⟳ Habilidades 10 % más rápidas');
    if ([MAESTRO, 25, 50, 100].includes(n) && TITULOS[id]) avisos.push(`👑 Título: ${tituloHeroe(id)}`);
    // de ahí en adelante, cada 10: una mejora ★ de sus poderes propios (o monedas)
    if (n > MAESTRO && n % 10 === 0) {
        const m = mejoraGratis((PROPIOS[id] || []).map(poderPorId).filter(p => p && tienePoder(p.id)));
        if (m) avisos.push(`⬆ Mejora gratis: ${m.nombre} ★${nivelPoder(m.id)}`);
        else { sumarMonedas(300); avisos.push('◉ +300 monedas'); }
    }
    return avisos;
}

function poderAlAzar(rarezas) {
    const libres = PODERES.filter(p => rarezas.includes(p.rareza) && !tienePoder(p.id));
    const todos = libres.length ? libres : PODERES.filter(p => !tienePoder(p.id));
    const p = todos[Math.floor(Math.random() * todos.length)];
    return p && darPoder(p.id) ? p : null;
}

// ---------- aviso en pantalla al ganar XP o subir ----------
let caja = null, cola = [];
function mostrarAvisos(avisos) {
    const juego = document.getElementById('game');
    if (!juego) return;
    cola.push(avisos);
    if (caja) return;
    const siguiente = () => {
        const a = cola.shift();
        if (!a) { caja = null; return; }
        caja = document.createElement('div');
        const sube = a.length > 1;
        caja.className = `progreso-aviso${sube ? ' sube' : ''}`;
        caja.setAttribute('role', 'status');
        caja.innerHTML = a.map((t, i) => `<div class="${i === 0 ? 'xp' : ''}">${escapar(t)}</div>`).join('');
        juego.append(caja);
        const el = caja;
        setTimeout(() => { el.remove(); siguiente(); }, sube ? 3800 : 1600);
    };
    siguiente();
}

// ---------- en línea: cada uno anuncia su nivel ----------
const niveles = new Map(); // id del jugador -> nivel
const oyentes = [];
export const nivelDe = id => (id === red.tuId ? estado.nivel : niveles.get(id));
export const alCambiarNiveles = fn => oyentes.push(fn);
function anunciar() {
    if (red.codigo) enviarEvento('nivel', { nv: estado.nivel });
}
// cada vez que cambia la sala (alguien entró), todos vuelven a anunciar el suyo
alRecibir('sala', anunciar);
alRecibir('evento', m => {
    if (m.tipo !== 'nivel' || m.de == null) return;
    const nv = Math.max(1, Math.min(999, Number(m.nv) | 0));
    if (niveles.get(m.de) === nv) return;
    niveles.set(m.de, nv);
    oyentes.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
});

const escapar = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
