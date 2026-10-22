// Conexión con el servidor multijugador (servidor/index.js), en el VPS detrás de Nginx.
// Para probar con un servidor propio: ?servidor=ws://127.0.0.1:2567 en la URL.
//
// Estado compartido de la sala (red.*) y avisos por tipo de mensaje (alRecibir).

const SERVIDOR = 'wss://www.trakio.pro/juego-ws/';

function direccion() {
    try {
        const propia = new URLSearchParams(location.search).get('servidor');
        if (propia) return propia;
    } catch (_e) { /* sin URL */ }
    return SERVIDOR;
}

export const red = {
    ws: null,
    conectado: false,
    codigo: null,
    tuId: null,
    anfitrion: null,
    jugadores: [],    // [{ id, nombre, pj, equipo }] en orden de llegada (= orden de la cadena)
    modo: 'aventura', // 'aventura' (cadena) | 'duelo' (arena 1 contra 1) | 'equipos' (arena rojo contra azul) | 'carrera' | 'troll'
    rol: null,        // (troll) 'troll' | 'heroe': lo reparte el servidor en secreto al empezar
    compas: [],       // (troll) los otros trolls (solo lo sabe un troll)
    bots: [],         // (troll) bots de relleno hasta 4: [{ id (negativo), nombre, pj, bot: true }]
    arena: 'bosque',
    apuesta: 0,       // monedas que paga cada jugador en la arena
    publica: false,   // la sala aparece en la búsqueda automática
    enPartida: false, // true desde que el anfitrión empieza hasta salir de la sala
    semilla: 0,
    intento: 0,       // sube con cada muerte del equipo: las trampas se reparten igual para todos
    ping: null,       // ms de ida y vuelta al servidor (null: todavía sin medir o servidor viejo)
    hueco: 0,         // el mayor silencio entre dos mensajes recibidos desde la última lectura (ver leerHueco)
};

const PING_MS = 1000;
let ultimoMensaje = 0;

// el mayor silencio de la red desde la última vez que se preguntó (para el contador de FPS)
export function leerHueco() {
    const h = Math.max(red.hueco, ultimoMensaje ? performance.now() - ultimoMensaje : 0);
    red.hueco = 0;
    return Math.round(h);
}

const oyentes = {};
export function alRecibir(tipo, fn) {
    (oyentes[tipo] ||= []).push(fn);
}
function avisar(tipo, m) {
    (oyentes[tipo] || []).forEach(fn => {
        try { fn(m); } catch (e) { console.error(`[red] error atendiendo "${tipo}"`, e); }
    });
}

export function conectar() {
    if (red.ws && red.ws.readyState <= WebSocket.OPEN) {
        return red.conectado ? Promise.resolve() : new Promise((ok, mal) => {
            red.ws.addEventListener('open', () => ok(), { once: true });
            red.ws.addEventListener('error', () => mal(new Error('No se pudo conectar')), { once: true });
        });
    }
    return new Promise((ok, mal) => {
        const ws = new WebSocket(direccion());
        red.ws = ws;
        const tiempo = setTimeout(() => { ws.close(); mal(new Error('El servidor no responde')); }, 8000);
        let medir = null;
        ws.addEventListener('open', () => {
            clearTimeout(tiempo);
            red.conectado = true;
            // cada segundo se mide cuánto tarda el servidor en contestar
            medir = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ t: 'ping', n: performance.now() })), PING_MS);
            ok();
        });
        ws.addEventListener('error', () => { clearTimeout(tiempo); mal(new Error('No se pudo conectar al servidor')); });
        ws.addEventListener('close', () => {
            const estaba = red.conectado;
            red.conectado = false;
            red.ws = null;
            red.ping = null;
            clearInterval(medir);
            const enSala = !!red.codigo;
            limpiarSala();
            if (estaba && enSala) avisar('desconectado', {});
        });
        ws.addEventListener('message', e => {
            let m;
            try { m = JSON.parse(e.data); } catch { return; }
            const ahora = performance.now();
            if (m.t === 'pong') { red.ping = Math.round(ahora - m.n); return; }
            if (ultimoMensaje) red.hueco = Math.max(red.hueco, ahora - ultimoMensaje);
            ultimoMensaje = ahora;
            atender(m);
        });
    });
}

function atender(m) {
    if (m.t === 'sala') {
        red.codigo = m.codigo;
        red.tuId = m.tuId;
        red.anfitrion = m.anfitrion;
        red.jugadores = m.jugadores;
        red.modo = m.modo || 'aventura';
        red.arena = m.arena || 'bosque';
        red.apuesta = m.apuesta || 0;
        red.publica = !!m.publica;
    } else if (m.t === 'volver') {
        red.enPartida = false;
    } else if (m.t === 'empezar') {
        red.enPartida = true;
        red.semilla = m.semilla >>> 0;
        red.intento = 0;
        red.modo = m.modo || red.modo;
        red.jugadores = m.jugadores;
        red.rol = m.rol || null;
        red.compas = m.compas || [];
        red.bots = m.bots || [];
    }
    avisar(m.t, m);
}

function limpiarSala() {
    red.codigo = red.tuId = red.anfitrion = null;
    red.jugadores = [];
    red.enPartida = false;
}

function enviar(m) {
    if (red.ws?.readyState === WebSocket.OPEN) red.ws.send(JSON.stringify(m));
}

export async function crearSala(nombre, pj) {
    await conectar();
    enviar({ t: 'crear', nombre, pj });
}

export async function unirseSala(codigo, nombre, pj) {
    await conectar();
    enviar({ t: 'unirse', codigo, nombre, pj });
}

// búsqueda automática: entra a una sala pública con lugar (del modo pedido, o cualquiera) o crea una
export async function buscarSala(nombre, pj, modo) {
    await conectar();
    enviar({ t: 'buscar', nombre, pj, ...(modo ? { modo } : {}) });
}
// (solo el anfitrión) que la sala aparezca o no en la búsqueda automática
export const hacerPublica = publica => enviar({ t: 'publica', publica });

export const elegirPersonaje = pj => enviar({ t: 'elegir', pj });
export const empezarPartida = nivel => enviar({ t: 'empezar', nivel });
// (solo el anfitrión) modo de la sala y arena; volver: todos vuelven a la sala de espera
export const elegirModo = (modo, arena, apuesta) => enviar({ t: 'modo', modo, arena, apuesta });
// monedas que tiene cada uno (para saber si alcanza para la apuesta de la arena)
export const informarSaldo = monedas => enviar({ t: 'saldo', monedas });
export const elegirEquipo = equipo => enviar({ t: 'equipo', equipo });
// carrera: lo que apuesta cada uno (cambiarla te deja "no listo") y la confirmación de que está listo
export const apostar = apuesta => enviar({ t: 'apostar', apuesta });
export const marcarListo = listo => enviar({ t: 'listo', listo });
export const volverASala = () => enviar({ t: 'volver' });
export const enviarEstado = estado => enviar({ t: 'estado', ...estado });
export const enviarEvento = (tipo, datos = {}) => enviar({ t: 'evento', tipo, ...datos });

export function salirSala() {
    red.ws?.close();
    limpiarSala();
}

export const esAnfitrion = () => red.tuId != null && red.tuId === red.anfitrion;
export const enLinea = () => red.enPartida && red.conectado;
// carrera (carrera.js): cada uno corre en su propio mundo; de los demás solo se ve dónde van
export const enCarrera = () => enLinea() && red.modo === 'carrera';
// en línea con el mundo compartido (enemigos, trampas, muertes, puntos de control y meta de todos)
export const mundoCompartido = () => enLinea() && red.modo !== 'carrera';
// La Noche del Troll (troll.js): mundo compartido, sin cadena y cada uno muere por su cuenta
export const enNoche = () => enLinea() && red.modo === 'troll';
