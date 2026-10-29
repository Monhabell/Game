// HITOS: premios por llegar lejos en los 5000 niveles (los cuenta el nivel más alto terminado: tienda.js,
// nivelMaximo). Cada hito da, una sola vez:
//   - un TÍTULO (el más alto se ve en la selección de héroe),
//   - MONEDAS,
//   - una ESTELA propia (tienda.js: apariencias con 'requisito'; se reclama gratis en la Tienda),
//   - y algunos, un PODER LEGENDARIO que no tengas.
// Al terminar el nivel del hito sale una tarjeta de celebración (mostrarHitos).
// Guardado: localStorage con su propia clave (los ya reclamados).

import { sumarMonedas } from "./tienda.js"
import { PODERES, darPoder, tienePoder } from "./poderes.js"

const CLAVE = 'troll-night-hitos';

export const HITOS = [
    { nivel: 25, icono: '🧭', titulo: 'Explorador', monedas: 500, estela: 'Estela del explorador' },
    { nivel: 50, icono: '🪓', titulo: 'Cazatrolls', monedas: 1000, estela: 'Estela de escarcha' },
    { nivel: 100, icono: '🛡️', titulo: 'Héroe de Albora', monedas: 2000, legendario: true, estela: 'Estela dorada' },
    { nivel: 250, icono: '🙃', titulo: 'Domador de trampas', monedas: 3000, estela: 'Estela de sombra' },
    { nivel: 500, icono: '⭐', titulo: 'Leyenda', monedas: 5000, legendario: true, estela: 'Estela estelar' },
    { nivel: 1000, icono: '⚔️', titulo: 'Matatitanes', monedas: 8000, estela: 'Estela de tormenta' },
    { nivel: 2000, icono: '🌙', titulo: 'Señor de la noche', monedas: 12000, legendario: true, estela: 'Estela de la noche eterna' },
    { nivel: 3500, icono: '💀', titulo: 'Inmortal', monedas: 20000, estela: 'Estela fantasma' },
    { nivel: 5000, icono: '👑', titulo: 'El que venció a la noche', monedas: 50000, legendario: true, estela: 'Estela arcoíris' },
];

let reclamados = new Set();
try { reclamados = new Set(JSON.parse(localStorage.getItem(CLAVE) || '[]')); } catch (_e) { /* sin guardado: nada reclamado */ }
const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify([...reclamados])); } catch (_e) { /* (modo privado) */ } };

// el título más alto ganado (o null) y el próximo hito
export const tituloActual = () => [...HITOS].reverse().find(h => reclamados.has(h.nivel)) || null;
export const proximoHito = nivelMax => HITOS.find(h => h.nivel > nivelMax) || null;

// (al terminar un nivel) entrega los hitos alcanzados que faltaban; devuelve lo que se ganó
export function revisarHitos(nivelMax) {
    const nuevos = [];
    HITOS.forEach(h => {
        if (h.nivel > nivelMax || reclamados.has(h.nivel)) return;
        reclamados.add(h.nivel);
        sumarMonedas(h.monedas);
        let poder = null;
        if (h.legendario) {
            const faltan = PODERES.filter(p => p.rareza === 'legendario' && !tienePoder(p.id));
            if (faltan.length) { poder = faltan[Math.floor(Math.random() * faltan.length)]; darPoder(poder.id); }
        }
        nuevos.push({ ...h, poder });
    });
    if (nuevos.length) guardar();
    return nuevos;
}

// ---------- la tarjeta de celebración ----------
let capa = null;
export function mostrarHitos(nuevos) {
    if (!nuevos.length) return;
    capa?.remove();
    const h = nuevos[nuevos.length - 1]; // (si se ganaron varios de una vez, el más alto manda)
    const premios = nuevos.flatMap(n => [`◉ +${n.monedas} monedas`, `✨ ${n.estela} <small>(reclámala en la Tienda › Apariencias)</small>`,
        ...(n.poder ? [`🌟 Poder legendario: <b>${n.poder.nombre}</b>`] : [])]);
    capa = document.createElement('div');
    capa.className = 'hito-capa';
    capa.setAttribute('role', 'dialog');
    capa.setAttribute('aria-label', `Hito: nivel ${h.nivel}`);
    capa.innerHTML = `<div class="hito-tarjeta">
        <p class="hito-sub">🏆 ¡HITO ALCANZADO! · NIVEL ${h.nivel}</p>
        <div class="hito-icono" aria-hidden="true">${h.icono}</div>
        <h2>${h.titulo}</h2>
        <p class="hito-nuevo">Nuevo título</p>
        <ul>${premios.map(p => `<li>${p}</li>`).join('')}</ul>
        <p class="hito-nota">Toca para seguir</p></div>`;
    const cerrar = () => { capa?.remove(); capa = null; };
    capa.addEventListener('click', cerrar);
    document.getElementById('game').append(capa);
    setTimeout(() => { if (capa) cerrar(); }, 7000);
}
