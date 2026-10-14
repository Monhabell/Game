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
    jugadores: [],    // [{ id, nombre, pj }] en orden de llegada (= orden de la cadena)
    enPartida: false, // true desde que el anfitrión empieza hasta salir de la sala
    semilla: 0,
    intento: 0,       // sube con cada muerte del equipo: las trampas se reparten igual para todos
};

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
        ws.addEventListener('open', () => { clearTimeout(tiempo); red.conectado = true; ok(); });
        ws.addEventListener('error', () => { clearTimeout(tiempo); mal(new Error('No se pudo conectar al servidor')); });
        ws.addEventListener('close', () => {
            const estaba = red.conectado;
            red.conectado = false;
            red.ws = null;
            const enSala = !!red.codigo;
            limpiarSala();
            if (estaba && enSala) avisar('desconectado', {});
        });
        ws.addEventListener('message', e => {
            let m;
            try { m = JSON.parse(e.data); } catch { return; }
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
    } else if (m.t === 'empezar') {
        red.enPartida = true;
        red.semilla = m.semilla >>> 0;
        red.intento = 0;
        red.jugadores = m.jugadores;
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

export const elegirPersonaje = pj => enviar({ t: 'elegir', pj });
export const empezarPartida = nivel => enviar({ t: 'empezar', nivel });
export const enviarEstado = estado => enviar({ t: 'estado', ...estado });
export const enviarEvento = (tipo, datos = {}) => enviar({ t: 'evento', tipo, ...datos });

export function salirSala() {
    red.ws?.close();
    limpiarSala();
}

export const esAnfitrion = () => red.tuId != null && red.tuId === red.anfitrion;
export const enLinea = () => red.enPartida && red.conectado;
