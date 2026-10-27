// Estrellas y MAPA DE MUNDOS (los 5000 niveles van en mundos de 10; el 10 de cada mundo trae al Rey Troll).
//
// ESTRELLAS (se guardan las mejores de cada nivel):
//   ⭐ terminar el nivel   ⭐ sin morir ni una vez   ⭐ juntar al menos el 80 % de las monedas
// Al terminar un nivel se ven las estrellas que ganaste. Repetir niveles para sacar las 3 es la gracia.
//
// MAPA DE MUNDOS (capa HTML): el mundo con sus 10 niveles (estrellas, 👹 en el del jefe, 🔒 los que faltan),
// flechas para ir a otros mundos y el total de estrellas. Se puede jugar cualquier nivel ya alcanzado.
// Se abre al terminar un nivel infinito (con "Siguiente nivel") y desde "Elige tu héroe" (tecla M).
//
// api (la da game.js): { jugar(nivel), nivelMaximo() }

import { nivelPorIndice, TOTAL_NIVELES, NIVELES_POR_MUNDO, mundoDe } from "./niveles.js"

const CLAVE = 'troll-night-estrellas';
const MONEDAS_PARA_ESTRELLA = 0.8;

let api = null;
export const configurarMundos = a => { api = a; };

// ---------- estrellas ----------
function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (_e) { return {}; }
}
function guardar(e) {
    try { localStorage.setItem(CLAVE, JSON.stringify(e)); } catch (_e) { /* sin almacenamiento */ }
}
export const estrellasDe = i => leer()[i] || 0;
export const totalEstrellas = () => Object.values(leer()).reduce((s, n) => s + n, 0);

// monedas juntadas en el nivel (game.js avisa cada una; se reinicia al empezar el nivel de nuevo)
let monedas = { i: -1, n: 0 };
export function contarMoneda(i) {
    if (monedas.i !== i) monedas = { i, n: 0 };
    monedas.n++;
}
export const reiniciarMonedasNivel = () => { monedas = { i: -1, n: 0 }; };

// terminó el nivel i: calcula las estrellas, guarda las mejores y devuelve { estrellas, nuevas }
export function ganarEstrellas(i, muertes, totalMonedas) {
    const juntadas = monedas.i === i ? monedas.n : 0;
    const estrellas = 1 + (muertes === 0 ? 1 : 0) + (!totalMonedas || juntadas >= totalMonedas * MONEDAS_PARA_ESTRELLA ? 1 : 0);
    const e = leer();
    const antes = e[i] || 0;
    if (estrellas > antes) { e[i] = estrellas; guardar(e); }
    return { estrellas, antes, sinMorir: muertes === 0, monedas: Math.min(juntadas, totalMonedas), totalMonedas };
}
export const textoEstrellas = n => '⭐'.repeat(n) + '☆'.repeat(3 - n);

// ---------- el mapa ----------
let capa = null;
// mundo: el que se muestra; siguiente: nivel que se juega con el botón grande (o null)
export function abrirMapa({ mundo, siguiente = null } = {}) {
    cerrarMapa();
    const max = Math.max(0, api.nivelMaximo()); // niveles terminados
    const ultimoMundo = mundoDe(Math.min(TOTAL_NIVELES - 1, max));
    let m = Math.max(1, Math.min(mundo ?? mundoDe(siguiente ?? max), mundoDe(TOTAL_NIVELES - 1)));
    capa = document.createElement('div');
    capa.className = 'menu-capa mundos';
    document.getElementById('game').append(capa);
    const pintar = () => {
        const desde = (m - 1) * NIVELES_POR_MUNDO;
        const nombre = nivelPorIndice(desde).nombre.replace(/\s+\d+-\d+$/, '');
        const nodos = Array.from({ length: NIVELES_POR_MUNDO }, (_, j) => {
            const i = desde + j;
            if (i >= TOTAL_NIVELES) return '';
            const abierto = i <= max, jefe = j === NIVELES_POR_MUNDO - 1, est = estrellasDe(i);
            return `<button type="button" class="mundo-nivel ${abierto ? '' : 'cerrado'} ${jefe ? 'jefe' : ''} ${i === siguiente ? 'sigue' : ''}"
                data-nivel="${i}" ${abierto ? '' : 'disabled'} aria-label="Nivel ${i + 1}${abierto ? `, ${est} estrellas` : ', bloqueado'}">
                <b>${abierto ? (jefe ? '👹' : i + 1) : '🔒'}</b><small>${abierto ? textoEstrellas(est) : `${i + 1}`}</small></button>`;
        }).join('');
        const delMundo = Array.from({ length: NIVELES_POR_MUNDO }, (_, j) => estrellasDe(desde + j)).reduce((s, n) => s + n, 0);
        capa.innerHTML = `
            <div class="menu-panel mundos-panel" role="dialog" aria-modal="true" aria-labelledby="mundos-titulo">
                <header>
                    <button type="button" class="mundos-flecha" data-ir="-1" ${m <= 1 ? 'disabled' : ''} aria-label="Mundo anterior">‹</button>
                    <div><h2 id="mundos-titulo">Mundo ${m}</h2><p>${nombre}</p></div>
                    <button type="button" class="mundos-flecha" data-ir="1" ${m >= ultimoMundo ? 'disabled' : ''} aria-label="Mundo siguiente">›</button>
                </header>
                <div class="mundos-camino">${nodos}</div>
                <p class="mundos-total">⭐ ${delMundo}/${NIVELES_POR_MUNDO * 3} en este mundo · ${totalEstrellas()} en total</p>
                <p class="menu-nota">⭐ terminar · ⭐ sin morir · ⭐ 80 % de las monedas</p>
                ${siguiente != null ? `<button type="button" class="menu-boton sala-empezar" data-nivel="${siguiente}">▶ Nivel ${siguiente + 1}</button>` : ''}
                <button type="button" class="menu-boton menu-salir" data-cerrar>✕ Cerrar</button>
            </div>`;
    };
    pintar();
    capa.addEventListener('click', e => {
        const ir = e.target.closest('[data-ir]');
        if (ir) { m += Number(ir.dataset.ir); pintar(); return; }
        const n = e.target.closest('[data-nivel]');
        if (n && !n.disabled) { cerrarMapa(); api.jugar(Number(n.dataset.nivel)); return; }
        if (e.target.closest('[data-cerrar]')) {
            cerrarMapa();
            if (siguiente != null) api.jugar(siguiente); // (después de un nivel, cerrar también sigue)
        }
    });
    capa.addEventListener('keydown', e => e.stopPropagation());
    capa.querySelector('.sigue, .sala-empezar')?.focus();
}
export function cerrarMapa() {
    capa?.remove();
    capa = null;
}
export const mapaAbierto = () => !!capa;
