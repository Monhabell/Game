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
//   - Poderes especiales (poderes.js): 65 poderes en su propia pestaña; se compran o se ganan al
//     terminar niveles, y cada héroe equipa dos (teclas V y B).
//   - Los héroes siguen libres desde el principio (son la base del juego, no un premio).
// Precios: hay ~700 monedas en la campaña y un jugador normal junta ~480. Lo permanente (300) y las
// estelas en venta (180) suman lo de una campaña completa: lo primero se compra tras el nivel 1-2,
// todo junto recién al final o rejugando. Para ajustar, cambia 'precio' en CATALOGO.
//
// Guardado: localStorage con su propia clave y versión (no toca el guardado de la partida).

import { PERSONAJES } from "./personajes.js"
import { nivelJugador } from "./progreso.js"
import {
    PODERES, RAREZAS, tienePoder, darPoder, equipados, equiparPoder, cuantosPoderes, urlIcono, filtroIcono, colorDe,
    nivelPoder, costoSubir, subirPoder, conNivel, ventajas, queGana, NIVEL_MAX, ELEMENTOS, elementoDe, comboDe, BUILDS,
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
    // premios de los HITOS (hitos.js): llegar lejos en los 5000 niveles. color puede ser una lista
    // (varios colores a la vez); escala y frecuencia: más grandes y más seguidas las de los hitos altos
    { id: 'estela_explorador', tipo: 'cosmetico', icono: '🧭', nombre: 'Estela del explorador', precio: 0, color: 0x9fe0a0, requisito: 25, descripcion: 'Hito: llega al nivel 25.' },
    { id: 'estela_escarcha', tipo: 'cosmetico', icono: '❄', nombre: 'Estela de escarcha', precio: 0, color: [0x9fe8ff, 0xffffff], requisito: 50, descripcion: 'Hito: llega al nivel 50.' },
    { id: 'estela_dorada', tipo: 'cosmetico', icono: '🛡', nombre: 'Estela dorada', precio: 0, color: [0xffd27a, 0xffb347], escala: 0.2, requisito: 100, descripcion: 'Hito: llega al nivel 100.' },
    { id: 'estela_sombra', tipo: 'cosmetico', icono: '🙃', nombre: 'Estela de sombra', precio: 0, color: [0x8a5cff, 0x3a2a6a], escala: 0.22, requisito: 250, descripcion: 'Hito: llega al nivel 250.' },
    { id: 'estela_estelar', tipo: 'cosmetico', icono: '⭐', nombre: 'Estela estelar', precio: 0, color: [0xffffff, 0xfff06a, 0x9fb4ff], escala: 0.22, frecuencia: 30, requisito: 500, descripcion: 'Hito: llega al nivel 500.' },
    { id: 'estela_tormenta', tipo: 'cosmetico', icono: '⚡', nombre: 'Estela de tormenta', precio: 0, color: [0xfff06a, 0x6fe8ff], escala: 0.24, frecuencia: 28, requisito: 1000, descripcion: 'Hito: llega al nivel 1000.' },
    { id: 'estela_noche', tipo: 'cosmetico', icono: '🌙', nombre: 'Estela de la noche eterna', precio: 0, color: [0x3a4aff, 0xc77dff, 0x0a0a2a], escala: 0.26, frecuencia: 25, requisito: 2000, descripcion: 'Hito: llega al nivel 2000.' },
    { id: 'estela_fantasma', tipo: 'cosmetico', icono: '💀', nombre: 'Estela fantasma', precio: 0, color: [0xd8e8ff, 0x9fd8ff], escala: 0.28, frecuencia: 22, requisito: 3500, descripcion: 'Hito: llega al nivel 3500.' },
    { id: 'estela_arcoiris', tipo: 'cosmetico', icono: '👑', nombre: 'Estela arcoíris', precio: 0, color: [0xff4d4d, 0xffa040, 0xffe066, 0x7fe06a, 0x5ab4ff, 0xc77dff], escala: 0.3, frecuencia: 18, requisito: 5000, descripcion: 'Hito: llega al nivel 5000. Venciste a la noche.' },
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
// los legendarios se compran desde cierto nivel del jugador (progreso.js)
const faltaNivel = p => Math.max(0, (RAREZAS[p.rareza].nivelMinimo || 0) - nivelJugador());
export function comprarPoder(id) {
    const p = PODERES.find(q => q.id === id);
    if (!p) return { ok: false, mensaje: 'Ese poder no existe' };
    if (tienePoder(id)) return { ok: false, mensaje: 'Ya es tuyo' };
    if (faltaNivel(p)) return { ok: false, mensaje: `Se desbloquea en el nivel ${RAREZAS[p.rareza].nivelMinimo}` };
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
        scale: { start: o.escala ?? 0.16, end: 0 }, alpha: { start: 0.7, end: 0 }, tint: o.color, blendMode: 'ADD', frequency: o.frecuencia ?? 45,
    }).setDepth(g.depth - 1);
    scene.estela.emitting = false;
}

export function actualizarEstela(scene) {
    if (!scene.estela) return;
    const g = scene.mascotaGesi;
    scene.estela.emitting = !g.isDead && Math.abs(g.body.velocity.x) > 30;
}

// ---------- la tienda (capa HTML a pantalla completa) ----------
// Como en los juegos de celular: a la izquierda las categorías y a la derecha una vitrina de cartas que
// se pasa de lado (deslizando, con las flechas ‹ ›, la rueda del mouse o las teclas ← →), sin desplazarse
// hacia abajo. Los puntitos de abajo dicen en qué página estás.
const moneda = n => `<i class="moneda" aria-hidden="true"></i>${n}`;
// [id, ícono, nombre en la barra, título arriba de la vitrina]
const CATEGORIAS = [
    ['heroe', '⚔', 'Héroes', 'Mejoras de héroe · cada una solo para su héroe'],
    ['permanente', '⭐', 'Mejoras', 'Mejoras permanentes · para todos los héroes'],
    ['consumible', '🧪', 'Consumibles', 'Consumibles · para todos los héroes'],
    ['cosmetico', '🎨', 'Apariencias', 'Apariencias'],
    ['poderes', '✨', 'Poderes', ''],
];
// alto mínimo de una carta: si caben dos, la vitrina muestra dos filas (las de poderes traen más datos)
const ALTO_CARTA = { poderes: 330, otras: 240 };

// devuelve abrir(alCerrar): abre la tienda; alCerrar() se llama al cerrarla
export function iniciarTienda() {
    const capa = document.createElement('div');
    // (ocupa toda la pantalla, no solo el recuadro del juego, como la sala)
    capa.className = 'menu-capa tienda-capa';
    capa.hidden = true;
    capa.innerHTML = `
        <div class="menu-panel tienda-panel" role="dialog" aria-modal="true" aria-labelledby="titulo-tienda">
            <div class="tienda-cabecera">
                <h2 id="titulo-tienda">Tienda de la Noche</h2>
                <span class="tienda-saldo" aria-live="polite"><i class="moneda" aria-hidden="true"></i><b data-saldo>0</b> monedas</span>
                <button type="button" class="tienda-cerrar" data-accion="cerrar" aria-label="Cerrar la tienda">✕</button>
            </div>
            <div class="tienda-cuerpo">
                <nav class="tienda-pestanas" role="tablist" aria-label="Categorías">${CATEGORIAS.map(([id, icono, nombre]) => `
                    <button type="button" class="tienda-pestana" role="tab" data-pestana="${id}">
                        <span class="tienda-pestana-icono" aria-hidden="true">${icono}</span><span>${nombre}</span>${id === 'poderes' ? '<b data-cuantos></b>' : ''}
                    </button>`).join('')}
                    <p class="tienda-nota">Las monedas se guardan al tocar un punto de control o al terminar el nivel. Lo que compres en medio de un nivel se aplica desde tu próximo intento (el imán y el ojo, al momento).</p>
                </nav>
                <section class="tienda-zona">
                    <div class="tienda-arriba" data-arriba></div>
                    <div class="tienda-vitrina-marco">
                        <button type="button" class="tienda-flecha" data-pagina="-1" aria-label="Página anterior">‹</button>
                        <div class="tienda-lista" data-lista tabindex="-1"></div>
                        <button type="button" class="tienda-flecha" data-pagina="1" aria-label="Página siguiente">›</button>
                    </div>
                    <div class="tienda-puntos" data-puntos aria-hidden="true"></div>
                </section>
            </div>
            <p class="tienda-aviso" data-aviso role="status" aria-live="polite"></p>
        </div>`;
    document.getElementById('game').appendChild(capa);
    const lista = capa.querySelector('[data-lista]');
    const arriba = capa.querySelector('[data-arriba]');
    const puntos = capa.querySelector('[data-puntos]');
    const aviso = capa.querySelector('[data-aviso]');
    let alCerrar = null, temporizador = null, pestana = 'heroe', filtro = 'todos';

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
                : `<button type="button" class="menu-boton tienda-btn tienda-comprar" data-comprar="${o.id}" ${s === 'caro' ? 'disabled' : ''}>${s === 'caro' ? `Faltan ${faltan}` : `Comprar · ${moneda(o.precio)}`}</button>`;
            return compra + (cantidad(o.id) > 0 ? llevar : '');
        }
        if (s === 'equipado') return `<button type="button" class="menu-boton tienda-btn tienda-equipado" data-equipar="${o.id}" aria-pressed="true">✓ Equipado · quitar</button>`;
        if (s === 'comprado') {
            return o.tipo === 'cosmetico'
                ? `<button type="button" class="menu-boton tienda-btn" data-equipar="${o.id}" aria-pressed="false">Equipar</button>`
                : `<button type="button" class="menu-boton tienda-btn" disabled>✓ Comprado</button>`;
        }
        return `<button type="button" class="menu-boton tienda-btn tienda-comprar" data-comprar="${o.id}" ${s === 'caro' ? 'disabled' : ''}>${s === 'caro' ? `Faltan ${faltan}` : `Comprar · ${moneda(o.precio)}`}</button>`;
    }

    // la carta: arriba la etiqueta (rareza o dueño) y las estrellas, el ícono grande, el nombre, el texto y los botones al pie
    const carta = ({ clases, estilo, etiqueta, esquina = '', media, nombre, desc, extra = '', botones }) => `
        <article class="tienda-item ${clases}" style="${estilo}">
            <div class="carta-cima">${etiqueta}${esquina}</div>
            <div class="tienda-media">${media}</div>
            <div class="tienda-info">
                <b class="carta-nombre">${nombre}</b>
                <p class="tienda-desc">${desc}</p>
                ${extra}
            </div>
            <div class="tienda-acciones">${botones}</div>
        </article>`;

    // poderes: arriba los 2 equipados del héroe actual y los filtros por rareza
    function pintarPoderes() {
        const h = heroe(), colorHeroe = '#' + h.color.toString(16).padStart(6, '0');
        const eq = equipados(h.id);
        const ranura = (id, i) => {
            const p = PODERES.find(q => q.id === id);
            return `<div class="poder-ranura"><kbd>${i ? 'B' : 'V'}</kbd>${p
                ? `<img src="${urlIcono(p)}" alt="" width="30" height="30" style="filter:${filtroIcono(p)}"><span>${p.nombre}</span>`
                : '<span class="vacia">Vacía</span>'}</div>`;
        };
        const filtros = ['todos', 'mios', ...Object.keys(RAREZAS)].map(f => `<button type="button" class="poder-filtro ${filtro === f ? 'activo' : ''}"
            data-filtro="${f}" aria-pressed="${filtro === f}">${f === 'todos' ? 'Todos' : f === 'mios' ? 'Míos' : RAREZAS[f].nombre}</button>`).join('');
        // la build recomendada del héroe (dos poderes que hacen combo)
        const build = BUILDS[h.id];
        let recomendada = '';
        if (build) {
            const [a, b, porque] = build, pa = PODERES.find(q => q.id === a), pb = PODERES.find(q => q.id === b);
            const combo = comboDe(elementoDe(pa), elementoDe(pb));
            const tiene = tienePoder(a) && tienePoder(b), puesta = eq[0] === a && eq[1] === b;
            const nombre = p => `${ELEMENTOS[elementoDe(p)][0]} ${p.nombre}${tienePoder(p.id) ? '' : ' 🔒'}`;
            recomendada = `<div class="poder-build"><b>⭐ Recomendado para ${h.nombre}:</b> ${nombre(pa)} + ${nombre(pb)}${combo ? ` → <em>${combo[0]}</em>` : ''}
                <small>${porque}</small>
                <button type="button" class="menu-boton tienda-btn" data-build="${h.id}" ${tiene && !puesta ? '' : 'disabled'}>${puesta ? '✓ Equipada' : tiene ? 'Equipar los dos' : 'Te falta alguno 🔒'}</button></div>`;
        }
        // el combo que hacen los dos equipados ahora
        const pe = eq.map(id => PODERES.find(q => q.id === id));
        const comboAhora = pe[0] && pe[1] ? comboDe(elementoDe(pe[0]), elementoDe(pe[1])) : null;
        arriba.innerHTML = `
            <div class="poder-equipo"><b>En <span style="color:${colorHeroe}">${h.nombre}</span></b>${eq.map(ranura).join('')}${comboAhora
                ? `<em class="poder-combo">Combo: ${comboAhora[0]}</em>` : pe[0] && pe[1] ? '<em class="poder-combo nada">Sin combo: prueba otro elemento</em>' : ''}</div>
            ${recomendada}
            <div class="poder-filtros" role="group" aria-label="Filtrar poderes">${filtros}</div>`;
        const visibles = PODERES.filter(p => filtro === 'todos' || (filtro === 'mios' ? tienePoder(p.id) : p.rareza === filtro));
        lista.innerHTML = visibles.map(p => {
            const mio = tienePoder(p.id), r = RAREZAS[p.rareza], precio = precioPoder(p);
            const nv = nivelPoder(p.id), costo = mio ? costoSubir(p) : null;
            const subir = costo === null ? ''
                : `<button type="button" class="menu-boton tienda-btn poder-subir" data-subir-poder="${p.id}" ${estado.monedas < costo ? 'disabled' : ''}
                    title="Nivel ${nv + 1}: ${queGana(nv + 1)}">${estado.monedas < costo ? `⬆ Nv ${nv + 1} · faltan ${costo - estado.monedas}` : `⬆ Nivel ${nv + 1} · ${moneda(costo)}`}</button>`;
            const botones = mio
                ? `<div class="poder-ranuras" role="group" aria-label="Tecla para usarlo">${[0, 1].map(i => `<button type="button"
                    class="poder-tecla ${eq[i] === p.id ? 'activa' : ''}" data-poder="${p.id}" data-ranura="${i}" aria-pressed="${eq[i] === p.id}"
                    aria-label="${eq[i] === p.id ? `Equipado en ${i ? 'B' : 'V'}` : `Poner en ${i ? 'B' : 'V'}`}">${eq[i] === p.id ? '✓ ' : ''}${i ? 'B' : 'V'}</button>`).join('')}</div>` + subir
                : faltaNivel(p) ? `<button type="button" class="menu-boton tienda-btn" disabled>🔒 Nivel ${RAREZAS[p.rareza].nivelMinimo} · ${moneda(precio)}</button>`
                : `<button type="button" class="menu-boton tienda-btn tienda-comprar" data-comprar-poder="${p.id}" ${estado.monedas < precio ? 'disabled' : ''}>${estado.monedas < precio ? `Faltan ${precio - estado.monedas}` : `Comprar · ${moneda(precio)}`}</button>`;
            // ventajas con los valores de su nivel actual (y qué gana al subir)
            const [ie, ne, ce] = ELEMENTOS[elementoDe(p)];
            const chips = `<i class="poder-ventaja poder-elemento" style="--elem:${ce}"><span aria-hidden="true">${ie}</span> ${ne}</i>` +
                ventajas(conNivel(p)).map(([i, t]) => `<i class="poder-ventaja"><span aria-hidden="true">${i}</span> ${t}</i>`).join('');
            const siguiente = costo === null ? (mio ? '<small class="poder-max">★ Nivel máximo</small>' : '')
                : `<small class="poder-siguiente"><b>Nivel ${nv + 1}:</b> ${queGana(nv + 1)}</small>`;
            return carta({
                clases: `poder-item ${mio ? 'comprado' : 'nuevo'} ${eq.includes(p.id) ? 'equipado' : ''}`,
                estilo: `--tienda-color:${colorDe(p)};--rareza:${r.color}`,
                etiqueta: `<em class="tienda-heroe" style="--pj:${r.color}">${r.nombre}</em>`,
                esquina: mio ? `<em class="poder-nivel" aria-label="Nivel ${nv} de ${NIVEL_MAX}">${'★'.repeat(nv)}<span>${'★'.repeat(NIVEL_MAX - nv)}</span></em>` : '',
                media: `<img class="poder-icono" src="${urlIcono(p)}" alt="" width="96" height="96" loading="lazy" style="filter:${filtroIcono(p)}">`,
                nombre: p.nombre, desc: p.descripcion,
                extra: `<div class="poder-ventajas">${chips}</div>${siguiente}`,
                botones,
            });
        }).join('');
    }

    function pintarCatalogo() {
        const h = heroe(), colorHeroe = '#' + h.color.toString(16).padStart(6, '0');
        const titulo = CATEGORIAS.find(c => c[0] === pestana)[3];
        arriba.innerHTML = `<h3 class="tienda-seccion">${pestana === 'cosmetico' ? `${titulo} · <span style="color:${colorHeroe}">para ${h.nombre}</span>` : titulo}</h3>`;
        lista.innerHTML = CATALOGO.filter(o => o.tipo === pestana)
            // mejoras de héroe: primero la del héroe actual
            .sort((a, b) => (b.heroe === h.id) - (a.heroe === h.id)).map(o => {
                const s = situacion(o);
                const dueño = o.tipo === 'heroe' ? PERSONAJES.find(pj => pj.id === o.heroe) : null;
                const colorDueño = dueño ? '#' + dueño.color.toString(16).padStart(6, '0') : null;
                const color = o.color ? '#' + o.color.toString(16).padStart(6, '0') : colorDueño;
                return carta({
                    clases: s,
                    estilo: color ? `--tienda-color:${color}` : '',
                    etiqueta: dueño ? `<em class="tienda-heroe" style="--pj:${colorDueño}">Solo ${dueño.nombre}</em>`
                        : `<em class="tienda-heroe" style="--pj:var(--texto-2)">${CATEGORIAS.find(c => c[0] === pestana)[2]}</em>`,
                    esquina: o.tipo === 'consumible' ? `<em class="tienda-tienes">Tienes ${cantidad(o.id)}</em>` : '',
                    media: `<span class="tienda-icono" aria-hidden="true">${s === 'bloqueado' ? '🔒' : o.icono}</span>`,
                    nombre: o.nombre, desc: o.descripcion,
                    botones: botonDe(o, s),
                });
            }).join('');
    }

    // repinta sin perder la página en la que estabas (salvo al cambiar de categoría o de filtro)
    function pintar(alPrincipio = false) {
        const x = alPrincipio ? 0 : lista.scrollLeft;
        capa.querySelector('[data-saldo]').textContent = estado.monedas;
        capa.querySelector('[data-cuantos]').textContent = `${cuantosPoderes()}/${PODERES.length}`;
        capa.querySelectorAll('[data-pestana]').forEach(b => {
            b.classList.toggle('activa', b.dataset.pestana === pestana);
            b.setAttribute('aria-selected', b.dataset.pestana === pestana);
        });
        if (pestana === 'poderes') pintarPoderes(); else pintarCatalogo();
        acomodarFilas();
        lista.scrollLeft = x;
        marcarPagina();
    }

    // ---------- la vitrina por páginas ----------
    // una fila de cartas altas (dos si la pantalla es muy alta) y tantas cartas por página como quepan:
    // así cada página muestra cartas enteras y pasar de página avanza justo una página
    const hueco = () => parseFloat(getComputedStyle(lista).getPropertyValue('--hueco')) || 14;
    const anchoPagina = () => lista.clientWidth + hueco();
    function acomodarFilas() {
        const filas = Math.max(1, Math.min(2, Math.floor(lista.clientHeight / (pestana === 'poderes' ? ALTO_CARTA.poderes : ALTO_CARTA.otras))));
        const minimo = lista.clientHeight < 300 ? 150 : 210; // (en el celular las cartas son más angostas)
        lista.dataset.filas = String(filas);
        lista.style.setProperty('--filas', String(filas));
        lista.style.setProperty('--por-pagina', String(Math.max(1, Math.floor(anchoPagina() / (minimo + hueco())))));
    }
    const paginas = () => Math.max(1, Math.round((lista.scrollWidth + hueco()) / Math.max(1, anchoPagina())));
    const paginaActual = () => Math.round(lista.scrollLeft / Math.max(1, anchoPagina()));
    function marcarPagina() {
        const n = paginas(), actual = Math.min(n - 1, paginaActual());
        const fin = lista.scrollLeft + lista.clientWidth >= lista.scrollWidth - 4;
        puntos.innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<i class="${i === actual || (fin && i === n - 1) ? 'activo' : ''}"></i>`).join('') : '';
        capa.querySelector('[data-pagina="-1"]').disabled = lista.scrollLeft <= 4;
        capa.querySelector('[data-pagina="1"]').disabled = fin;
    }
    const pasarPagina = dir => lista.scrollBy({ left: dir * anchoPagina(), behavior: 'smooth' });
    let marcando = 0;
    lista.addEventListener('scroll', () => { if (!marcando) marcando = requestAnimationFrame(() => { marcando = 0; marcarPagina(); }); });
    // la rueda del mouse pasa las cartas de lado
    lista.addEventListener('wheel', e => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        e.preventDefault();
        lista.scrollLeft += e.deltaY;
    }, { passive: false });
    window.addEventListener('resize', () => { if (!capa.hidden) { acomodarFilas(); marcarPagina(); } });

    capa.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b || b.disabled) return;
        if (b.dataset.accion === 'cerrar') { cerrar(); return; }
        if (b.dataset.pagina) { pasarPagina(Number(b.dataset.pagina)); return; }
        if (b.dataset.pestana) { pestana = b.dataset.pestana; pintar(true); return; }
        if (b.dataset.filtro) { filtro = b.dataset.filtro; pintar(true); capa.querySelector(`[data-filtro="${filtro}"]`)?.focus(); return; }
        if (b.dataset.poder) {
            equiparPoder(heroe().id, b.dataset.poder, Number(b.dataset.ranura));
            pintar();
            capa.querySelector(`[data-poder="${b.dataset.poder}"][data-ranura="${b.dataset.ranura}"]`)?.focus();
            return;
        }
        if (b.dataset.build) {
            const [a, bb] = BUILDS[b.dataset.build];
            equiparPoder(heroe().id, a, 0);
            equiparPoder(heroe().id, bb, 1);
            avisar('⭐ Build equipada: golpea con uno y luego con el otro para el combo', true);
            pintar();
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
        // ← → pasan de página (si no se está eligiendo algo con las flechas en otro lado)
        else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.closest('[role="tablist"], [role="group"]')) {
            e.preventDefault();
            pasarPagina(e.key === 'ArrowLeft' ? -1 : 1);
        }
    });

    function cerrar() {
        capa.hidden = true;
        const f = alCerrar;
        alCerrar = null;
        f?.();
    }

    // abrir(alCerrar, 'poderes'): abre directo en una categoría ('tienda' = la primera)
    return function abrir(cuandoCierre, enPestana) {
        if (!capa.hidden) return;
        alCerrar = cuandoCierre;
        if (enPestana) pestana = CATEGORIAS.some(c => c[0] === enPestana) ? enPestana : 'heroe';
        aviso.className = 'tienda-aviso';
        capa.hidden = false; // (primero se muestra: la vitrina necesita su tamaño para armar las páginas)
        pintar(true);
        capa.querySelector('[data-accion="cerrar"]').focus();
    };
}

