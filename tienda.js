// Tienda de la Noche: las monedas que se juntan en los niveles se gastan aquí.
//
// Cómo se ganan (game.js): cada moneda (o "?" que da moneda) va a una BOLSA; la bolsa se guarda al
// activar un punto de control o al terminar el nivel. Al morir se pierde solo la bolsa, y esas
// monedas vuelven a aparecer en el nivel (las que quedan detrás del punto de control no reaparecen,
// así no se pueden juntar dos veces). Lo ya guardado y lo comprado nunca se pierde.
//
// Qué se vende (y qué NO, a propósito):
//   - Mejoras permanentes que cambian decisiones, no solo números: el imán atrae TODAS las monedas
//     cercanas... también las falsas; el ojo da más pistas de las trampas de engaño (hay que mirar
//     igual); un corazón más. Nada de doble salto, embestida ni salto mejorado para todos: cada
//     héroe ya tiene su forma de moverse y los niveles están medidos con esos saltos (alcance.js).
//   - Un consumible: la runa de reserva (cada vida ya empieza con escudo: la runa lo recarga una vez
//     por nivel cuando se rompe, con el sistema de escudo que ya existe).
//   - Apariencias: estelas de luz, solo visuales. Se compran UNA vez y cada héroe lleva la suya
//     (Gesi con brasas, Zeno con la lunar...). Dos se ganan venciendo jefes, no se compran.
//   - Lo demás (imán, ojo, corazón, runa) es para todos los héroes: mejora al jugador, no al héroe.
//   - Mejoras de héroe: una por personaje y SOLO para él. Potencian su estilo sin quitarle su
//     debilidad (Rubí sigue sin defensa, Aria sin ataque de lejos...). Cambian valores de una de
//     sus habilidades (personajes.js): el juego usa los datos mejorados, sin lógica nueva.
//     Algunos héroes tienen dos mejoras (se suman).
//   - Poderes especiales (poderes.js): 50 poderes en su propia pestaña; se compran o se ganan al
//     terminar niveles, y cada héroe equipa dos (teclas V y B).
//   - Los héroes siguen libres desde el principio (son la base del juego, no un premio).
// Precios: hay ~700 monedas en la campaña y un jugador normal junta ~480. Lo permanente (300) y las
// estelas en venta (180) suman lo de una campaña completa: lo primero se compra tras el nivel 1-2,
// todo junto recién al final o rejugando. Para ajustar, cambia 'precio' en CATALOGO.
//
// Guardado: localStorage con su propia clave y versión (no toca el guardado de la partida).

import { PERSONAJES } from "./personajes.js"
import {
    PODERES, RAREZAS, tienePoder, darPoder, equipados, equiparPoder, cuantosPoderes, urlIcono, colorDe,
    nivelPoder, costoSubir, subirPoder, conNivel, ventajas, queGana, NIVEL_MAX,
} from "./poderes.js"

const CLAVE = 'monhabell-aventura-tienda';
const VERSION = 2; // 2: la estela se equipa por héroe (antes una sola para todos)

export const CATALOGO = [
    // ---------- mejoras permanentes ----------
    {
        id: 'iman', tipo: 'permanente', icono: '🧲', nombre: 'Imán de monedas', precio: 60,
        descripcion: 'Atrae las monedas cercanas sin tocarlas. Ojo: también atrae las falsas.',
    },
    {
        id: 'ojo', tipo: 'permanente', icono: '👁', nombre: 'Ojo del Alba', precio: 90,
        descripcion: 'Las trampas de engaño dan su pista el doble de seguido. Igual hay que mirar.',
    },
    {
        id: 'corazon', tipo: 'permanente', icono: '❤', nombre: 'Corazón de Albora', precio: 150,
        descripcion: 'Un corazón más de vida en todos los niveles.',
    },
    // ---------- consumibles ----------
    {
        id: 'escudo', tipo: 'consumible', icono: '🛡', nombre: 'Runa de reserva', precio: 30, max: 3,
        descripcion: 'La primera vez que se rompa tu escudo en un nivel, se recarga al momento. Solo se gasta si se usa.',
    },
    // ---------- mejoras de héroe (solo para ese héroe) ----------
    {
        id: 'mejora_arquera', tipo: 'heroe', heroe: 'arquera', habilidad: 'c', cambios: { enfriamiento: 1100 },
        icono: '↺', nombre: 'Voltereta ágil', precio: 80, descripcion: 'La voltereta se recarga en 1,1 s (antes 1,6 s).',
    },
    {
        id: 'mejora_espadachin', tipo: 'heroe', heroe: 'espadachin', habilidad: 'espacio', cambios: { parada: 400 },
        icono: '⚔', nombre: 'Parada maestra', precio: 80, descripcion: 'Más tiempo para parar golpes de frente con el espadazo (0,4 s, antes 0,25 s).',
    },
    {
        id: 'mejora_mago', tipo: 'heroe', heroe: 'mago', habilidad: 'c', cambios: { enfriamiento: 5000 },
        icono: '✧', nombre: 'Escudo arcano', precio: 80, descripcion: 'El escudo mágico vuelve en 5 s (antes 7 s).',
    },
    {
        id: 'mejora_hechicera', tipo: 'heroe', heroe: 'hechicera', habilidad: 'espacio', cambios: { congela: 2500 },
        icono: '❄', nombre: 'Escarcha eterna', precio: 80, descripcion: 'El cristal de hielo congela 2,5 s (antes 1,5 s).',
    },
    {
        id: 'mejora_caballera', tipo: 'heroe', heroe: 'caballera', habilidad: 'c', cambios: { duracion: 3000 },
        icono: '⛨', nombre: 'Guardia de hierro', precio: 80, descripcion: 'La guardia dura 3 s (antes 2 s).',
    },
    {
        id: 'mejora_mosquetera', tipo: 'heroe', heroe: 'mosquetera', habilidad: 'x', cambios: { vida: 650 },
        icono: '≋', nombre: 'Viento cortante', precio: 80, descripcion: 'El corte de viento llega bastante más lejos.',
    },
    {
        id: 'mejora_paladina', tipo: 'heroe', heroe: 'paladina', habilidad: 'c', cambios: { duracion: 3000, enfriamiento: 5000 },
        icono: '⛨', nombre: 'Fe inquebrantable', precio: 80, descripcion: 'La Defensa dura 3 s (antes 1,8 s) y vuelve antes.',
    },
    {
        id: 'mejora_paladina2', tipo: 'heroe', heroe: 'paladina', habilidad: 'espacio', cambios: { daño: 2 },
        icono: '✠', nombre: 'Hoja bendita', precio: 120, descripcion: 'El espadazo hace doble daño.',
    },
    {
        id: 'mejora_asesina', tipo: 'heroe', heroe: 'asesina', habilidad: 'x', cambios: { perfora: true, vida: 650 },
        icono: '✂', nombre: 'Cuchillas gemelas', precio: 80, descripcion: 'La cuchilla atraviesa a todos y llega más lejos.',
    },
    {
        id: 'mejora_asesina2', tipo: 'heroe', heroe: 'asesina', habilidad: 'c', cambios: { enfriamiento: 1000, vel: 680 },
        icono: '➶', nombre: 'Sombra veloz', precio: 120, descripcion: 'La arremetida es más rápida y vuelve cada 1 s.',
    },
    {
        id: 'mejora_elfa', tipo: 'heroe', heroe: 'elfa', habilidad: 'espacio', cambios: { enfriamiento: 400 },
        icono: '➹', nombre: 'Mano rápida', precio: 80, descripcion: 'Dispara flechas cada 0,4 s (antes 0,65 s).',
    },
    {
        id: 'mejora_elfa2', tipo: 'heroe', heroe: 'elfa', habilidad: 'x', cambios: { congela: 1500 },
        icono: '❄', nombre: 'Flecha de escarcha', precio: 120, descripcion: 'La flecha élfica además congela 1,5 s.',
    },
    // ---------- apariencias (solo visuales) ----------
    { id: 'estela_luna', tipo: 'cosmetico', icono: '✦', nombre: 'Estela lunar', precio: 40, color: 0xb9c3ff, descripcion: 'Una estela de luz lavanda al correr.' },
    { id: 'estela_brasas', tipo: 'cosmetico', icono: '✹', nombre: 'Estela de brasas', precio: 70, color: 0xff8a3d, descripcion: 'Chispas de fuego a tu paso.' },
    { id: 'estela_bosque', tipo: 'cosmetico', icono: '❦', nombre: 'Estela del bosque', precio: 70, color: 0x7fd36a, descripcion: 'Hojas de luz verde detrás de ti.' },
    {
        id: 'estela_troll', tipo: 'cosmetico', icono: '♛', nombre: 'Estela del Rey Troll', precio: 0, color: 0xff4d6d,
        requisito: 3, descripcion: 'Premio: vence al jefe del nivel 3.',
    },
    {
        id: 'aura_alba', tipo: 'cosmetico', icono: '☀', nombre: 'Aura del Alba', precio: 0, color: 0xffd27a,
        requisito: 6, descripcion: 'Premio: termina el juego y devuelve el sol a Albora.',
    },
];

const porId = id => CATALOGO.find(o => o.id === id);

// ---------- guardado ----------
const vacio = () => ({ version: VERSION, monedas: 0, comprados: {}, consumibles: {}, equipados: { estelas: {}, escudo: true }, nivelMaximo: 0 });

function leer() {
    try {
        const g = JSON.parse(localStorage.getItem(CLAVE));
        if (!g || typeof g !== 'object') return vacio();
        // se copia solo lo válido: un guardado dañado o de otra versión no rompe nada
        const e = vacio();
        e.monedas = Number.isFinite(g.monedas) && g.monedas > 0 ? Math.floor(g.monedas) : 0;
        e.nivelMaximo = Number.isFinite(g.nivelMaximo) ? Math.max(0, Math.floor(g.nivelMaximo)) : 0;
        Object.keys(g.comprados || {}).forEach(id => { if (porId(id) && porId(id).tipo !== 'consumible' && g.comprados[id]) e.comprados[id] = true; });
        Object.entries(g.consumibles || {}).forEach(([id, n]) => {
            const o = porId(id);
            if (o?.tipo === 'consumible' && Number.isFinite(n) && n > 0) e.consumibles[id] = Math.min(o.max, Math.floor(n));
        });
        // estela de cada héroe (versión 1: una sola estela para todos -> se le pone a cada héroe)
        PERSONAJES.forEach(pj => {
            const id = g.equipados?.estelas?.[pj.id] ?? g.equipados?.estela;
            if (e.comprados[id] && porId(id).tipo === 'cosmetico') e.equipados.estelas[pj.id] = id;
        });
        if (typeof g.equipados?.escudo === 'boolean') e.equipados.escudo = g.equipados.escudo;
        return e;
    } catch (_e) {
        return vacio();
    }
}

const estado = leer();

function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (_e) { /* sin almacenamiento: dura hasta cerrar */ }
}

// ---------- consultas ----------
export const saldo = () => estado.monedas;
export const tiene = id => !!estado.comprados[id];
export const cantidad = id => estado.consumibles[id] || 0;
// héroe para el que se equipan las estelas: lo decide el juego (el marcado o el que se está jugando)
let heroeActual = () => PERSONAJES[0].id;
export function usarHeroeActual(f) { heroeActual = f; }
const heroe = () => PERSONAJES.find(pj => pj.id === heroeActual()) || PERSONAJES[0];

export const estelaEquipada = (heroeId = heroe().id) => porId(estado.equipados.estelas[heroeId]) || null;
export const llevaEscudo = () => estado.equipados.escudo && cantidad('escudo') > 0;

// mejoras de héroe compradas para este personaje
export const mejorasDe = pjId => CATALOGO.filter(o => o.tipo === 'heroe' && o.heroe === pjId && tiene(o.id));

// copia del personaje con sus mejoras aplicadas (el original de personajes.js no se toca)
export function personajeConMejoras(pj) {
    return mejorasDe(pj.id).reduce((p, m) => ({
        ...p, habilidades: { ...p.habilidades, [m.habilidad]: { ...p.habilidades[m.habilidad], ...m.cambios, mejorada: true } },
    }), pj);
}

// niveles completados (el más alto): para saber si un nivel se termina por primera vez
export const nivelMaximo = () => estado.nivelMaximo;

// ---------- poderes especiales (los datos y el uso están en poderes.js) ----------
export const precioPoder = p => RAREZAS[p.rareza].precio;
export function comprarPoder(id) {
    const p = PODERES.find(q => q.id === id);
    if (!p) return { ok: false, mensaje: 'Ese poder no existe' };
    if (tienePoder(id)) return { ok: false, mensaje: 'Ya es tuyo' };
    if (estado.monedas < precioPoder(p)) return { ok: false, mensaje: `Te faltan ${precioPoder(p) - estado.monedas} monedas` };
    estado.monedas -= precioPoder(p);
    guardar();
    darPoder(id);
    // si el héroe actual tiene una ranura libre, se lo equipa
    const libre = equipados(heroe().id).indexOf(null);
    if (libre >= 0) equiparPoder(heroe().id, id, libre);
    return { ok: true, mensaje: `¡${p.nombre} es tuyo!` };
}

// subir un poder de nivel (1 → 2 → 3) con monedas
export function mejorarPoder(id) {
    const p = PODERES.find(q => q.id === id);
    if (!p || !tienePoder(id)) return { ok: false, mensaje: 'Primero tienes que tener ese poder' };
    const costo = costoSubir(p);
    if (costo === null) return { ok: false, mensaje: 'Ya está al nivel máximo' };
    if (estado.monedas < costo) return { ok: false, mensaje: `Te faltan ${costo - estado.monedas} monedas` };
    estado.monedas -= costo;
    guardar();
    subirPoder(id);
    return { ok: true, mensaje: `¡${p.nombre} subió a nivel ${nivelPoder(id)}!` };
}

// ---------- cambios (todos validan aquí, no solo en los botones) ----------
export function sumarMonedas(n) {
    if (!(n > 0)) return;
    estado.monedas += Math.floor(n);
    guardar();
}

// apuesta de la arena (arena.js): se paga al empezar la batalla (nunca deja el saldo negativo)
export function gastarMonedas(n) {
    const gasto = Math.min(estado.monedas, Math.max(0, Math.floor(n)));
    estado.monedas -= gasto;
    guardar();
    return gasto;
}

// niveles completados (para los premios de los jefes)
export function registrarNivel(completados) {
    if (completados > estado.nivelMaximo) { estado.nivelMaximo = completados; guardar(); }
}

// estado de un objeto en la tienda
export function situacion(o) {
    if (o.requisito && estado.nivelMaximo < o.requisito) return 'bloqueado';
    if (o.tipo === 'consumible') {
        if (cantidad(o.id) >= o.max) return 'lleno';
        return estado.monedas >= o.precio ? 'disponible' : 'caro';
    }
    if (o.precio === 0 && !tiene(o.id)) return 'premio'; // premio de jefe: se reclama gratis
    if (tiene(o.id)) return o.tipo === 'cosmetico' && estado.equipados.estelas[heroe().id] === o.id ? 'equipado' : 'comprado';
    return estado.monedas >= o.precio ? 'disponible' : 'caro';
}

export function comprar(id) {
    const o = porId(id);
    if (!o) return { ok: false, mensaje: 'Ese objeto no existe' };
    const s = situacion(o);
    if (s === 'bloqueado') return { ok: false, mensaje: o.descripcion };
    if (s === 'lleno') return { ok: false, mensaje: `Ya llevas el máximo (${o.max})` };
    if (s === 'comprado' || s === 'equipado') return { ok: false, mensaje: 'Ya es tuyo' };
    if (estado.monedas < o.precio) return { ok: false, mensaje: `Te faltan ${o.precio - estado.monedas} monedas` };
    estado.monedas -= o.precio;
    if (o.tipo === 'consumible') estado.consumibles[o.id] = cantidad(o.id) + 1;
    else estado.comprados[o.id] = true;
    // una estela recién comprada se la pone el héroe actual
    if (o.tipo === 'cosmetico') estado.equipados.estelas[heroe().id] = o.id;
    guardar();
    return { ok: true, mensaje: o.precio ? `¡${o.nombre} es tuyo!` : `¡Reclamaste ${o.nombre}!` };
}

// estelas: equipar / quitar en el héroe actual (una a la vez). Runa: llevarla o no
export function alternarEquipo(id) {
    const o = porId(id);
    if (o?.tipo === 'cosmetico' && tiene(id)) {
        const h = heroe().id;
        estado.equipados.estelas[h] = estado.equipados.estelas[h] === id ? null : id;
    } else if (o?.tipo === 'consumible') {
        estado.equipados.escudo = !estado.equipados.escudo;
    } else return;
    guardar();
}

export function usarConsumible(id) {
    if (cantidad(id) <= 0) return false;
    estado.consumibles[id] = cantidad(id) - 1;
    guardar();
    return true;
}

// ---------- estela en el nivel (solo visual) ----------
export function crearEstela(scene) {
    const o = estelaEquipada(scene.pj?.id);
    if (!o || !scene.textures.exists('brillo')) return;
    const g = scene.mascotaGesi;
    scene.estela = scene.add.particles(0, 0, 'brillo', {
        follow: g, followOffset: { x: 0, y: 10 }, speed: { min: 6, max: 24 }, lifespan: 520,
        scale: { start: 0.16, end: 0 }, alpha: { start: 0.7, end: 0 }, tint: o.color, blendMode: 'ADD', frequency: 45,
    }).setDepth(g.depth - 1);
    scene.estela.emitting = false;
}

export function actualizarEstela(scene) {
    if (!scene.estela) return;
    const g = scene.mascotaGesi;
    scene.estela.emitting = !g.isDead && Math.abs(g.body.velocity.x) > 30;
}

// ---------- la tienda (capa HTML, como los menús de pausa y configuración) ----------
const TEXTO_TIPO = { heroe: 'Mejoras de héroe', permanente: 'Mejoras permanentes', consumible: 'Consumibles', cosmetico: 'Apariencias' };

// devuelve abrir(alCerrar): abre la tienda; alCerrar() se llama al cerrarla
export function iniciarTienda() {
    const contenedor = document.getElementById('game');
    const capa = document.createElement('div');
    capa.className = 'menu-capa';
    capa.hidden = true;
    capa.innerHTML = `
        <div class="menu-panel menu-panel-ancho tienda-panel" role="dialog" aria-modal="true" aria-labelledby="titulo-tienda">
            <div class="tienda-cabecera">
                <h2 id="titulo-tienda">Tienda de la Noche</h2>
                <span class="tienda-saldo" aria-live="polite"><span aria-hidden="true">◉</span> <b data-saldo>0</b> monedas</span>
            </div>
            <div class="tienda-pestanas" role="tablist">
                <button type="button" class="tienda-pestana" role="tab" data-pestana="tienda">Tienda</button>
                <button type="button" class="tienda-pestana" role="tab" data-pestana="poderes">Poderes <b data-cuantos></b></button>
            </div>
            <div class="tienda-lista" data-lista></div>
            <p class="tienda-aviso" data-aviso role="status" aria-live="polite"></p>
            <button type="button" class="menu-boton" data-accion="cerrar">← Volver</button>
            <p class="menu-nota">Las monedas se guardan al tocar un punto de control o al terminar el nivel. Al morir solo pierdes las que no alcanzaste a guardar. Lo que compres en medio de un nivel se aplica desde tu próximo intento (el imán y el ojo, al momento).</p>
        </div>`;
    contenedor.appendChild(capa);
    const lista = capa.querySelector('[data-lista]');
    const aviso = capa.querySelector('[data-aviso]');
    let alCerrar = null, temporizador = null, pestana = 'tienda', filtro = 'todos';

    function avisar(texto, ok) {
        aviso.textContent = texto;
        aviso.className = `tienda-aviso ${ok ? 'ok' : 'error'} visible`;
        clearTimeout(temporizador);
        temporizador = setTimeout(() => aviso.classList.remove('visible'), 2200);
    }

    function botonDe(o, s) {
        const faltan = o.precio - estado.monedas;
        if (s === 'bloqueado') return `<button type="button" class="menu-boton tienda-btn" disabled>🔒 Bloqueado</button>`;
        if (s === 'premio') return `<button type="button" class="menu-boton tienda-btn tienda-comprar" data-comprar="${o.id}">Reclamar gratis</button>`;
        if (o.tipo === 'consumible') {
            const llevar = `<button type="button" class="menu-boton tienda-btn" data-equipar="${o.id}" aria-pressed="${estado.equipados.escudo}">${estado.equipados.escudo ? '✓ La llevo' : 'No la llevo'}</button>`;
            const compra = s === 'lleno'
                ? `<button type="button" class="menu-boton tienda-btn" disabled>Máximo (${o.max})</button>`
                : `<button type="button" class="menu-boton tienda-btn tienda-comprar" data-comprar="${o.id}" ${s === 'caro' ? 'disabled' : ''}>${s === 'caro' ? `Faltan ${faltan}` : `Comprar · ◉ ${o.precio}`}</button>`;
            return compra + (cantidad(o.id) > 0 ? llevar : '');
        }
        if (s === 'equipado') return `<button type="button" class="menu-boton tienda-btn tienda-equipado" data-equipar="${o.id}" aria-pressed="true">✓ Equipado · quitar</button>`;
        if (s === 'comprado') {
            return o.tipo === 'cosmetico'
                ? `<button type="button" class="menu-boton tienda-btn" data-equipar="${o.id}" aria-pressed="false">Equipar</button>`
                : `<button type="button" class="menu-boton tienda-btn" disabled>✓ Comprado</button>`;
        }
        return `<button type="button" class="menu-boton tienda-btn tienda-comprar" data-comprar="${o.id}" ${s === 'caro' ? 'disabled' : ''}>${s === 'caro' ? `Faltan ${faltan}` : `Comprar · ◉ ${o.precio}`}</button>`;
    }

    // pestaña de poderes: los 2 equipados del héroe actual arriba y los 50 abajo (filtrables por rareza)
    function pintarPoderes() {
        const h = heroe(), colorHeroe = '#' + h.color.toString(16).padStart(6, '0');
        const eq = equipados(h.id);
        const ranura = (id, i) => {
            const p = PODERES.find(q => q.id === id);
            return `<div class="poder-ranura"><kbd>${i ? 'B' : 'V'}</kbd>${p
                ? `<img src="${urlIcono(p)}" alt="" width="34" height="34"><span>${p.nombre}</span>`
                : '<span class="vacia">Vacía</span>'}</div>`;
        };
        const filtros = ['todos', 'mios', ...Object.keys(RAREZAS)].map(f => `<button type="button" class="poder-filtro ${filtro === f ? 'activo' : ''}"
            data-filtro="${f}" aria-pressed="${filtro === f}">${f === 'todos' ? 'Todos' : f === 'mios' ? 'Míos' : RAREZAS[f].nombre}</button>`).join('');
        const visibles = PODERES.filter(p => filtro === 'todos' || (filtro === 'mios' ? tienePoder(p.id) : p.rareza === filtro));
        lista.innerHTML = `
            <div class="poder-equipo"><b>Equipados en <span style="color:${colorHeroe}">${h.nombre}</span></b>${eq.map(ranura).join('')}</div>
            <p class="menu-nota">Ganas un poder al terminar cada nivel por primera vez (y a veces al rejugarlo). En el nivel se usan con V y B. Súbelos hasta ★★★ con monedas.</p>
            <div class="poder-filtros" role="group" aria-label="Filtrar poderes">${filtros}</div>
            ${visibles.map(p => {
                const mio = tienePoder(p.id), r = RAREZAS[p.rareza], precio = precioPoder(p);
                const nv = nivelPoder(p.id), costo = mio ? costoSubir(p) : null;
                const subir = costo === null ? ''
                    : `<button type="button" class="menu-boton tienda-btn poder-subir" data-subir-poder="${p.id}" ${estado.monedas < costo ? 'disabled' : ''}
                        title="Nivel ${nv + 1}: ${queGana(nv + 1)}">${estado.monedas < costo ? `⬆ Nv ${nv + 1} · faltan ${costo - estado.monedas}` : `⬆ Nv ${nv + 1} · ◉ ${costo}`}</button>`;
                const botones = mio
                    ? [0, 1].map(i => `<button type="button" class="menu-boton tienda-btn ${eq[i] === p.id ? 'tienda-equipado' : ''}" data-poder="${p.id}"
                        data-ranura="${i}" aria-pressed="${eq[i] === p.id}">${eq[i] === p.id ? `✓ En ${i ? 'B' : 'V'}` : `Poner en ${i ? 'B' : 'V'}`}</button>`).join('') + subir
                    : `<button type="button" class="menu-boton tienda-btn tienda-comprar" data-comprar-poder="${p.id}" ${estado.monedas < precio ? 'disabled' : ''}>${estado.monedas < precio ? `Faltan ${precio - estado.monedas}` : `Comprar · ◉ ${precio}`}</button>`;
                // ventajas con los valores de su nivel actual (y qué gana al subir)
                const chips = ventajas(conNivel(p)).map(([i, t]) => `<i class="poder-ventaja"><span aria-hidden="true">${i}</span> ${t}</i>`).join('');
                const siguiente = costo === null ? (mio ? '<small class="poder-max">★ Nivel máximo</small>' : '')
                    : `<small>Nivel ${nv + 1}: ${queGana(nv + 1)}</small>`;
                const nivelChip = mio ? `<em class="poder-nivel" aria-label="Nivel ${nv} de ${NIVEL_MAX}">${'★'.repeat(nv)}${'☆'.repeat(NIVEL_MAX - nv)}</em>` : '';
                return `
                <div class="tienda-item poder-item ${mio ? 'comprado' : ''} ${eq.includes(p.id) ? 'equipado' : ''}" style="--tienda-color:${colorDe(p)}">
                    <img class="poder-icono" src="${urlIcono(p)}" alt="" width="44" height="44" loading="lazy" style="border-color:${r.color}">
                    <div class="tienda-info">
                        <b>${p.nombre} <em class="tienda-heroe" style="--pj:${r.color}">${r.nombre}</em> ${nivelChip}</b>
                        <span>${p.descripcion}</span>
                        <span class="poder-ventajas">${chips}</span>
                        ${siguiente}
                    </div>
                    <div class="tienda-acciones">${botones}</div>
                </div>`;
            }).join('')}`;
    }

    function pintar() {
        capa.querySelector('[data-saldo]').textContent = estado.monedas;
        capa.querySelector('[data-cuantos]').textContent = `${cuantosPoderes()}/${PODERES.length}`;
        capa.querySelectorAll('[data-pestana]').forEach(b => {
            b.classList.toggle('activa', b.dataset.pestana === pestana);
            b.setAttribute('aria-selected', b.dataset.pestana === pestana);
        });
        if (pestana === 'poderes') { pintarPoderes(); return; }
        const h = heroe(), colorHeroe = '#' + h.color.toString(16).padStart(6, '0');
        lista.innerHTML = Object.entries(TEXTO_TIPO).map(([tipo, titulo]) => `
            <h3 class="tienda-seccion">${titulo}${tipo === 'cosmetico'
                ? ` · <span style="color:${colorHeroe}">para ${h.nombre}</span>`
                : tipo === 'heroe' ? ' · cada una solo para su héroe' : ' · para todos los héroes'}</h3>
            ${CATALOGO.filter(o => o.tipo === tipo)
                // mejoras de héroe: primero la del héroe actual
                .sort((a, b) => (b.heroe === h.id) - (a.heroe === h.id)).map(o => {
                const s = situacion(o);
                const color = o.color ? `--tienda-color:#${o.color.toString(16).padStart(6, '0')}` : '';
                const extra = o.tipo === 'consumible' ? ` · tienes ${cantidad(o.id)}` : '';
                const dueño = o.tipo === 'heroe' ? PERSONAJES.find(pj => pj.id === o.heroe) : null;
                const chip = dueño ? `<em class="tienda-heroe" style="--pj:#${dueño.color.toString(16).padStart(6, '0')}">Solo ${dueño.nombre}</em>` : '';
                return `
                <div class="tienda-item ${s}" style="${color}">
                    <span class="tienda-icono" aria-hidden="true">${s === 'bloqueado' ? '🔒' : o.icono}</span>
                    <div class="tienda-info">
                        <b>${o.nombre} ${chip}</b>
                        <span>${o.descripcion}${extra}</span>
                    </div>
                    <div class="tienda-acciones">${botonDe(o, s)}</div>
                </div>`;
            }).join('')}`).join('');
    }

    capa.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b || b.disabled) return;
        if (b.dataset.accion === 'cerrar') { cerrar(); return; }
        if (b.dataset.pestana) { pestana = b.dataset.pestana; pintar(); lista.scrollTop = 0; return; }
        if (b.dataset.filtro) { filtro = b.dataset.filtro; pintar(); capa.querySelector(`[data-filtro="${filtro}"]`)?.focus(); return; }
        if (b.dataset.poder) {
            equiparPoder(heroe().id, b.dataset.poder, Number(b.dataset.ranura));
            pintar();
            capa.querySelector(`[data-poder="${b.dataset.poder}"][data-ranura="${b.dataset.ranura}"]`)?.focus();
            return;
        }
        if (b.dataset.subirPoder) {
            const r = mejorarPoder(b.dataset.subirPoder);
            avisar(r.mensaje, r.ok);
            pintar();
            (capa.querySelector(`[data-subir-poder="${b.dataset.subirPoder}"]`) || capa.querySelector(`[data-poder="${b.dataset.subirPoder}"]`))?.focus();
            return;
        }
        if (b.dataset.comprarPoder) {
            const r = comprarPoder(b.dataset.comprarPoder);
            avisar(r.mensaje, r.ok);
            pintar();
            capa.querySelector(`[data-poder="${b.dataset.comprarPoder}"]`)?.focus();
            return;
        }
        if (b.dataset.comprar) {
            const r = comprar(b.dataset.comprar); // la validación real está en comprar()
            avisar(r.mensaje, r.ok);
        } else if (b.dataset.equipar) {
            alternarEquipo(b.dataset.equipar);
        }
        pintar();
        // el foco vuelve al mismo objeto (teclado y lectores de pantalla)
        const id = b.dataset.comprar || b.dataset.equipar;
        if (id) (lista.querySelector(`[data-equipar="${id}"]`) || lista.querySelector(`[data-comprar="${id}"]`))?.focus();
    });
    // tocar fuera del panel la cierra (como los demás menús)
    capa.addEventListener('pointerdown', e => { if (e.target === capa) cerrar(); });
    capa.addEventListener('keydown', e => {
        e.stopPropagation(); // las teclas no llegan al juego mientras la tienda está abierta
        if (e.key === 'Escape') cerrar();
    });

    function cerrar() {
        capa.hidden = true;
        const f = alCerrar;
        alCerrar = null;
        f?.();
    }

    // abrir(alCerrar, 'poderes'): abre directo en la pestaña de poderes
    return function abrir(cuandoCierre, enPestana) {
        if (!capa.hidden) return;
        alCerrar = cuandoCierre;
        if (enPestana) pestana = enPestana;
        aviso.className = 'tienda-aviso';
        pintar();
        capa.hidden = false;
        capa.querySelector('[data-accion="cerrar"]').focus();
    };
}

