// Recompensa diaria: al entrar al juego, una vez por día, se cobra el premio del día de la racha.
// 7 días seguidos (PREMIOS): cada día sube; el 7º es un cofre grande y la racha vuelve a empezar.
// Si faltas un día (no entraste ayer), vuelve al día 1. Se guarda en este dispositivo.
import { sumarMonedas, saldo } from "./tienda.js"

const PREMIOS = [20, 30, 40, 50, 60, 80, 150];
const CLAVE = 'troll-night-diario'; // { ultimo: 'AAAA-MM-DD', racha: 1..7 }

const dia = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const ayer = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dia(d); };

function leer() {
    try {
        const g = JSON.parse(localStorage.getItem(CLAVE));
        if (g && typeof g.ultimo === 'string' && g.racha >= 1 && g.racha <= PREMIOS.length) return g;
    } catch (_e) { /* (modo privado o dañado) */ }
    return { ultimo: '', racha: 0 };
}

// qué día de la racha toca hoy (null: ya se cobró hoy)
export function diaDeHoy() {
    const g = leer();
    if (g.ultimo === dia()) return null;
    const sigue = g.ultimo === ayer() && g.racha < PREMIOS.length;
    return sigue ? g.racha + 1 : 1;
}

let capa = null;
// alCobrar(monedas): para refrescar lo que muestre el saldo
export function mostrarDiario({ alCobrar } = {}) {
    const hoy = diaDeHoy();
    if (hoy == null || capa) return false;
    capa = document.createElement('div');
    capa.className = 'menu-capa diario';
    const casillas = PREMIOS.map((m, i) => {
        const n = i + 1, estado = n < hoy ? 'hecho' : n === hoy ? 'hoy' : 'falta';
        return `<li class="diario-dia ${estado}${n === PREMIOS.length ? ' cofre' : ''}">
            <small>Día ${n}</small>
            <span class="diario-icono" aria-hidden="true">${n === PREMIOS.length ? '🎁' : n < hoy ? '✔' : '◉'}</span>
            <b>${m}</b>
        </li>`;
    }).join('');
    capa.innerHTML = `
        <div class="menu-panel diario-panel" role="dialog" aria-modal="true" aria-labelledby="diario-titulo">
            <h2 id="diario-titulo">Recompensa diaria</h2>
            <p class="diario-sub">${hoy === 1 ? 'Entra cada día y el premio sube.' : `¡Racha de ${hoy} días! Sigue mañana.`}</p>
            <ol class="diario-dias">${casillas}</ol>
            <button type="button" class="menu-boton sala-empezar diario-cobrar" data-cobrar>Recibir ◉ ${PREMIOS[hoy - 1]}</button>
            <p class="diario-nota">Si faltas un día, la racha vuelve al día 1</p>
        </div>`;
    document.getElementById('game').append(capa);
    const boton = capa.querySelector('[data-cobrar]');
    const cobrar = () => {
        if (boton.disabled) return;
        boton.disabled = true;
        const m = PREMIOS[hoy - 1];
        sumarMonedas(m);
        try { localStorage.setItem(CLAVE, JSON.stringify({ ultimo: dia(), racha: hoy })); } catch (_e) { /* (modo privado) */ }
        capa.querySelector('.diario-dia.hoy')?.classList.add('cobrado');
        boton.textContent = `◉ +${m} · tienes ${saldo()}`;
        alCobrar?.(m);
        setTimeout(cerrarDiario, 1300);
    };
    boton.addEventListener('click', cobrar);
    capa.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cobrar(); } });
    setTimeout(() => boton.focus(), 50);
    return true;
}
export function cerrarDiario() {
    capa?.remove();
    capa = null;
}
