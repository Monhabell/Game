// El Juicio de La Noche del Troll (troll.js): votar a quién expulsar del bosque.
//
// Se abre cuando un vivo encuentra un cuerpo o toca la Campana del Juicio (en el claro; una vez cada uno).
// Mientras dura (60 s) el juego se detiene: los vivos hablan (voz para todos, sin distancia) y usan
// FRASES RÁPIDAS; cada vivo vota a alguien o "saltar". Los fantasmas miran, pero no votan ni hablan.
// Termina al acabarse el tiempo o cuando votaron todos los vivos. Los BOTS (bots.js) los hace hablar y
// votar el anfitrión: dicen una frase y votan al más acusado (o saltan si nadie acusó a nadie).
//
// El ANFITRIÓN cuenta los votos y manda el veredicto ('nocheVeredicto'): el más votado sale; si hay
// empate o gana "saltar", no sale nadie. El SERVIDOR le agrega si el expulsado era el troll (solo él lo
// sabe) y se lo manda a todos, también al anfitrión. Si el anfitrión se va en medio, el siguiente cierra.
//
// ctx (lo da troll.js): { vivos(), todos(), nombreDe(id), colorDe(id), esBot(id), soyFantasma(),
//   alAbrir(), alCerrar(veredicto) }

import { red, alRecibir, enviarEvento, esAnfitrion } from "./red.js"

const DURACION_MS = 60000;
const RESULTADO_MS = 5000;   // la pantalla con el resultado antes de volver al bosque
const ESPERA_VEREDICTO = 4000; // sin veredicto del anfitrión: se cuenta aquí
const FRASE_CADA_MS = 1500;
export const FRASES = [
    '🤔 ¿Quién estaba ahí?', '👀 Lo vi parado', '🙋 Yo estaba arriba', '✅ Confío en ___',
    '❌ Sospecho de ___', '⏭️ Saltemos', '🔥 Encendí una antorcha', '🤐 No vi nada',
];
const SALTAR = 'saltar';
const BOT_VOTA_MS = [6000, 20000]; // cuándo vota cada bot (al azar entre estos)

// quién lo dijo: un bot (lo manda el anfitrión en su nombre) o el que mandó el mensaje
const autor = m => (m.bot != null && m.bot < 0 && m.de === red.anfitrion ? m.bot : m.de);

let ctx = null, juicio = null, capa = null, reloj = null;
export const juicioActivo = () => !!juicio;

export function iniciarJuicio(contexto) {
    ctx = contexto;
    alRecibir('evento', m => {
        switch (m.tipo) {
            case 'nocheJuicio': empezar(autor(m), m.motivo, m.id); break;
            case 'nocheVoto': if (juicio && !juicio.cerrado) votar(autor(m), m.a); break;
            case 'nocheFrase': if (juicio) frase(autor(m), m.f, m.a); break;
            case 'nocheVeredicto': veredicto(m); break;
        }
    });
}

// (troll.js) yo abro el juicio: motivo 'cuerpo' (id: el muerto) o 'campana'; quien: un bot (anfitrión)
export function abrirJuicio(motivo, id = null, quien = red.tuId) {
    if (juicio) return;
    enviarEvento('nocheJuicio', { motivo, id, ...(quien !== red.tuId ? { bot: quien } : {}) });
    empezar(quien, motivo, id);
}

// todo se cierra (la partida terminó o se salió)
export function cerrarJuicio() {
    clearInterval(reloj);
    reloj = null;
    juicio = null;
    capa?.remove();
    capa = null;
}

function empezar(quien, motivo, id) {
    if (juicio) return;
    juicio = {
        quien, motivo, victima: id ?? null,
        votos: new Map(), // votante -> id | 'saltar'
        frases: [],
        elegido: null,    // a quién tengo seleccionado
        fin: Date.now() + DURACION_MS,
        cerrado: false,
        ultimaFrase: 0,
    };
    ctx.alAbrir();
    dibujar();
    reloj = setInterval(tic, 250);
    if (esAnfitrion()) ctx.vivos().filter(ctx.esBot).forEach(programarBot);
}

// (anfitrión) un bot dice algo y después vota
function programarBot(id) {
    const j = juicio;
    const ms = BOT_VOTA_MS[0] + Math.random() * (BOT_VOTA_MS[1] - BOT_VOTA_MS[0]);
    setTimeout(() => {
        if (juicio !== j || j.cerrado || !ctx.vivos().includes(id)) return;
        const sospechoso = masAcusado(id);
        const f = sospechoso != null && Math.random() < 0.6 ? 4 : [0, 7, 2][Math.floor(Math.random() * 3)];
        enviarEvento('nocheFrase', { f, a: f === 4 ? sospechoso : null, bot: id });
        frase(id, f, f === 4 ? sospechoso : null);
    }, ms * 0.5);
    setTimeout(() => {
        if (juicio !== j || j.cerrado || j.votos.has(id) || !ctx.vivos().includes(id)) return;
        const sospechoso = masAcusado(id);
        const a = sospechoso != null && Math.random() < 0.75 ? sospechoso : SALTAR;
        enviarEvento('nocheVoto', { a, bot: id });
        votar(id, a);
    }, ms);
}
// el más acusado (frases "Sospecho de…" y votos ya puestos), sin contarse a sí mismo
function masAcusado(yo) {
    const cuenta = new Map();
    const sumar = (a, n) => { if (a != null && a !== SALTAR && a !== yo && ctx.vivos().includes(a)) cuenta.set(a, (cuenta.get(a) || 0) + n); };
    juicio.frases.forEach(f => { if (f.f === 4) sumar(f.a, 1); });
    juicio.votos.forEach(a => sumar(a, 2));
    let mejor = null, max = 0;
    cuenta.forEach((n, a) => { if (n > max) { max = n; mejor = a; } });
    return mejor;
}

// los vivos votan (los bots también: los hace votar el anfitrión)
const votantes = () => ctx.vivos();

function votar(quien, a) {
    if (!votantes().includes(quien) || juicio.votos.has(quien)) return;
    // (un voto a alguien que ya no está vivo cuenta como saltar)
    juicio.votos.set(quien, a == null || a === SALTAR || !ctx.vivos().includes(a) ? SALTAR : a);
    pintar();
    if (esAnfitrion() && votantes().every(id => juicio.votos.has(id))) contar();
}

function frase(quien, f, a) {
    const texto = FRASES[f];
    if (!texto || !ctx.vivos().includes(quien)) return;
    const objetivo = a != null && ctx.todos().includes(a) ? ctx.nombreDe(a) : null;
    juicio.frases.push({ quien, f, a, texto: texto.replace('___', objetivo || 'alguien') });
    if (juicio.frases.length > 30) juicio.frases.shift();
    pintar();
}

function tic() {
    if (!juicio) return;
    pintarReloj();
    const pasado = Date.now() - juicio.fin;
    if (juicio.cerrado) return;
    if (pasado >= 0 && esAnfitrion()) contar();
    // el anfitrión se fue o no contesta: se cuenta aquí (el servidor no agrega si era el troll)
    else if (pasado > ESPERA_VEREDICTO) cerrarCon(contarVotos(), null);
}

function contarVotos() {
    const cuenta = new Map();
    juicio.votos.forEach(a => cuenta.set(a, (cuenta.get(a) || 0) + 1));
    let fuera = null, max = 0, empate = false;
    cuenta.forEach((n, a) => {
        if (n > max) { max = n; fuera = a; empate = false; }
        else if (n === max) empate = true;
    });
    return empate || fuera === SALTAR ? null : fuera;
}

// (anfitrión) cierra la votación y manda el veredicto (el servidor le agrega 'era' y lo devuelve)
function contar() {
    if (juicio.contado) return;
    juicio.contado = true;
    enviarEvento('nocheVeredicto', { fuera: contarVotos(), votos: [...juicio.votos] });
}

function veredicto(m) {
    if (!juicio || juicio.cerrado) return;
    (m.votos || []).forEach(([v, a]) => { if (!juicio.votos.has(v)) juicio.votos.set(v, a); });
    cerrarCon(m.fuera ?? null, typeof m.era === 'boolean' ? m.era : null);
}

// resultado: quién sale y si era el troll (null: no se sabe); después, de vuelta al bosque
function cerrarCon(fuera, era) {
    juicio.cerrado = true;
    juicio.fuera = fuera;
    juicio.era = fuera != null && ctx.esBot(fuera) ? false : era;
    pintar();
    setTimeout(() => {
        const v = { fuera: juicio?.fuera ?? null, era: juicio?.era ?? null };
        cerrarJuicio();
        ctx.alCerrar(v);
    }, RESULTADO_MS);
}

// ---------- pantalla ----------
function dibujar() {
    capa?.remove();
    capa = document.createElement('div');
    capa.className = 'juicio';
    capa.setAttribute('role', 'dialog');
    capa.setAttribute('aria-modal', 'true');
    capa.setAttribute('aria-labelledby', 'juicio-titulo');
    capa.innerHTML = `
        <div class="juicio-panel">
            <header>
                <h2 id="juicio-titulo">⚖️ ¡JUICIO!</h2>
                <p class="juicio-motivo"></p>
                <span class="juicio-reloj" aria-live="off"></span>
            </header>
            <ul class="juicio-jugadores"></ul>
            <div class="juicio-acciones">
                <button type="button" class="menu-boton sala-empezar" data-juicio="votar">🗳️ Votar</button>
                <button type="button" class="menu-boton" data-juicio="saltar">⏭️ Saltar voto</button>
            </div>
            <div class="juicio-frases">${FRASES.map((f, i) => `<button type="button" data-frase="${i}">${f.replace('___', '…')}</button>`).join('')}</div>
            <ol class="juicio-chat" aria-live="polite"></ol>
            <p class="juicio-resultado" aria-live="assertive" hidden></p>
        </div>`;
    document.getElementById('game').append(capa);
    capa.addEventListener('click', clic);
    capa.addEventListener('keydown', e => e.stopPropagation());
    pintar();
}

function clic(e) {
    if (!juicio || juicio.cerrado) return;
    const yoVoto = votantes().includes(red.tuId);
    const pj = e.target.closest('[data-pj]');
    if (pj && yoVoto) {
        const id = Number(pj.dataset.pj);
        if (!ctx.vivos().includes(id)) return;
        juicio.elegido = juicio.elegido === id ? null : id;
        pintar();
        return;
    }
    const accion = e.target.closest('[data-juicio]')?.dataset.juicio;
    if (accion && yoVoto && !juicio.votos.has(red.tuId)) {
        if (accion === 'votar' && juicio.elegido == null) { avisar('Primero toca a alguien'); return; }
        const a = accion === 'votar' ? juicio.elegido : SALTAR;
        enviarEvento('nocheVoto', { a });
        votar(red.tuId, a);
        return;
    }
    const f = e.target.closest('[data-frase]');
    if (f && yoVoto) {
        const i = Number(f.dataset.frase);
        if (Date.now() - juicio.ultimaFrase < FRASE_CADA_MS) return;
        if (FRASES[i].includes('___') && juicio.elegido == null) { avisar('Toca a alguien para decir eso'); return; }
        juicio.ultimaFrase = Date.now();
        const a = FRASES[i].includes('___') ? juicio.elegido : null;
        enviarEvento('nocheFrase', { f: i, a });
        frase(red.tuId, i, a);
    }
}

function avisar(texto) {
    const p = capa?.querySelector('.juicio-resultado');
    if (!p || juicio?.cerrado) return;
    p.hidden = false;
    p.textContent = texto;
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => { if (!juicio?.cerrado) p.hidden = true; }, 1500);
}

function pintarReloj() {
    const r = capa?.querySelector('.juicio-reloj');
    if (!r || !juicio) return;
    const s = Math.max(0, Math.ceil((juicio.fin - Date.now()) / 1000));
    r.textContent = juicio.cerrado ? '' : `⏳ ${s}`;
    r.classList.toggle('poco', s <= 10);
}

function pintar() {
    if (!capa || !juicio) return;
    const vivos = ctx.vivos(), yoVoto = votantes().includes(red.tuId), cerrado = juicio.cerrado;
    const nombre = id => (id === red.tuId ? 'Tú' : ctx.nombreDe(id));
    const yoAbri = juicio.quien === red.tuId;
    capa.querySelector('.juicio-motivo').textContent = juicio.motivo === 'cuerpo'
        ? `💀 ${yoAbri ? 'Encontraste' : `${ctx.nombreDe(juicio.quien)} encontró`} el cuerpo de ${ctx.nombreDe(juicio.victima)}`
        : `🛎️ ${yoAbri ? 'Tocaste' : `${ctx.nombreDe(juicio.quien)} tocó`} la Campana del Juicio`;
    // votos recibidos (se ven al final)
    const recibidos = new Map();
    juicio.votos.forEach((a, v) => recibidos.set(a, [...(recibidos.get(a) || []), v]));
    capa.querySelector('.juicio-jugadores').innerHTML = ctx.todos().map(id => {
        const vivo = vivos.includes(id);
        const clases = ['juicio-pj', vivo ? '' : 'muerto', id === juicio.elegido ? 'elegido' : '', id === red.tuId ? 'yo' : '',
            cerrado && id === juicio.fuera ? 'fuera' : ''].filter(Boolean).join(' ');
        const quienes = cerrado ? (recibidos.get(id) || []).map(v => `<i style="--c:${ctx.colorDe(v)}" title="${escapar(ctx.nombreDe(v))}"></i>`).join('') : '';
        return `<li><button type="button" class="${clases}" data-pj="${id}" style="--c:${ctx.colorDe(id)}" ${vivo && yoVoto && !cerrado ? '' : 'disabled'}
            aria-pressed="${id === juicio.elegido}">
            <span aria-hidden="true">${vivo ? (ctx.esBot(id) ? '🤖' : '🙂') : '💀'}</span>
            <b>${escapar(nombre(id))}</b>
            ${juicio.votos.has(id) ? '<small>✔ votó</small>' : ''}
            ${quienes ? `<span class="juicio-votos">${quienes}</span>` : ''}
        </button></li>`;
    }).join('');
    const ya = juicio.votos.has(red.tuId);
    capa.querySelectorAll('[data-juicio], [data-frase]').forEach(b => { b.disabled = !yoVoto || cerrado || (b.dataset.juicio && ya); });
    capa.querySelector('.juicio-acciones').hidden = !yoVoto;
    capa.querySelector('.juicio-frases').hidden = !yoVoto;
    capa.querySelector('.juicio-chat').innerHTML = juicio.frases.slice(-6).map(f =>
        `<li><b style="color:${ctx.colorDe(f.quien)}">${escapar(nombre(f.quien))}:</b> ${escapar(f.texto)}</li>`).join('');
    const res = capa.querySelector('.juicio-resultado');
    if (cerrado) {
        res.hidden = false;
        const saltos = (recibidos.get(SALTAR) || []).length;
        res.textContent = juicio.fuera == null
            ? `Nadie fue expulsado (${saltos ? `${saltos} ${saltos === 1 ? 'saltó' : 'saltaron'}` : 'empate'})`
            : `${juicio.fuera === red.tuId ? 'Te expulsaron' : `${ctx.nombreDe(juicio.fuera)} fue expulsado`}… ${juicio.era === true ? 'y ERA el troll 👹' : juicio.era === false ? 'y NO era el troll 😇' : '¿era el troll? Nadie lo sabe'}`;
        res.classList.toggle('troll', juicio.era === true);
    } else if (!yoVoto) {
        res.hidden = false;
        res.textContent = ctx.soyFantasma() ? '👻 Los fantasmas solo miran' : 'Mirando el juicio…';
    }
    pintarReloj();
}

const escapar = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
