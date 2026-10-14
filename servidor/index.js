// Servidor multijugador de Monhabell Aventura.
//
// Es un servidor de SALAS: no simula el juego, solo reúne a los jugadores y reenvía mensajes.
// El creador de la sala es el ANFITRIÓN: su juego manda en los enemigos, las trampas y el jefe;
// cada jugador manda en su propio personaje. Todos usan la misma semilla de trampas.
//
// Corre detrás de Nginx (escucha solo en 127.0.0.1). En el VPS:
//   location /juego-ws/  ->  proxy_pass http://127.0.0.1:2567/
//
// Mensajes (JSON, campo t):
//   cliente -> servidor
//     crear    { nombre, pj }            crea una sala y te une como anfitrión
//     unirse   { codigo, nombre, pj }    entra a una sala que todavía no empezó
//     elegir   { pj }                    cambia de personaje en la sala de espera
//     empezar  { nivel }                 (solo anfitrión) arranca la partida para todos
//     estado / evento { ... }            se reenvía a los demás con { de: tuId }
//   servidor -> cliente
//     sala     { codigo, tuId, anfitrion, jugadores }   (cada vez que cambia la lista)
//     empezar  { nivel, semilla, jugadores }
//     estado / evento { de, ... }
//     error    { motivo }

import http from 'node:http';
import { WebSocketServer } from 'ws';

const PUERTO = Number(process.env.PORT) || 2567;
const HOST = process.env.HOST || '127.0.0.1';
const MAX_JUGADORES = 8;
const MAX_MENSAJE = 16 * 1024;       // bytes por mensaje
const MAX_MENSAJES_SEG = 60;         // por jugador (el juego manda ~20 por segundo)
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I ni O (se confunden con 1 y 0)
const PERSONAJES = new Set(['arquera', 'espadachin', 'mago', 'hechicera', 'caballera', 'mosquetera']);

/** @type {Map<string, {codigo: string, jugadores: Map<number, any>, anfitrion: number, empezada: boolean, siguienteId: number}>} */
const salas = new Map();

const servidor = http.createServer((req, res) => {
    // para comprobar desde el navegador que el servidor está vivo
    if (req.url === '/salud' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, salas: salas.size, jugadores: [...salas.values()].reduce((n, s) => n + s.jugadores.size, 0) }));
        return;
    }
    res.writeHead(404).end();
});

const wss = new WebSocketServer({ server: servidor, maxPayload: MAX_MENSAJE });

wss.on('connection', ws => {
    ws.vivo = true;
    ws.sala = null;
    ws.id = null;
    ws.cuenta = 0;
    ws.ventana = Date.now();
    ws.on('pong', () => { ws.vivo = true; });

    ws.on('message', datos => {
        // límite de mensajes por segundo (protege a los demás de un cliente roto o malicioso)
        const ahora = Date.now();
        if (ahora - ws.ventana > 1000) { ws.ventana = ahora; ws.cuenta = 0; }
        if (++ws.cuenta > MAX_MENSAJES_SEG) return;

        let m;
        try { m = JSON.parse(datos); } catch { return; }
        if (!m || typeof m.t !== 'string') return;
        try { atender(ws, m); } catch (e) { console.error('mensaje con error', e); }
    });

    ws.on('close', () => salir(ws));
});

function atender(ws, m) {
    switch (m.t) {
        case 'crear': {
            if (ws.sala) return;
            const sala = { codigo: nuevoCodigo(), jugadores: new Map(), anfitrion: 1, empezada: false, siguienteId: 1 };
            salas.set(sala.codigo, sala);
            entrar(ws, sala, m);
            console.log(`sala ${sala.codigo} creada`);
            return;
        }
        case 'unirse': {
            if (ws.sala) return;
            const sala = salas.get(String(m.codigo || '').toUpperCase().trim());
            if (!sala) return enviar(ws, { t: 'error', motivo: 'No existe esa sala' });
            if (sala.empezada) return enviar(ws, { t: 'error', motivo: 'La partida ya empezó' });
            if (sala.jugadores.size >= MAX_JUGADORES) return enviar(ws, { t: 'error', motivo: 'La sala está llena (8 jugadores)' });
            entrar(ws, sala, m);
            return;
        }
        case 'elegir': {
            const sala = ws.sala;
            if (!sala || sala.empezada) return;
            const j = sala.jugadores.get(ws.id);
            if (PERSONAJES.has(m.pj)) j.pj = m.pj;
            avisarLista(sala);
            return;
        }
        case 'empezar': {
            const sala = ws.sala;
            if (!sala || sala.anfitrion !== ws.id) return;
            sala.empezada = true;
            const semilla = Math.floor(Math.random() * 2 ** 31);
            difundir(sala, { t: 'empezar', nivel: Number(m.nivel) || 0, semilla, jugadores: lista(sala) });
            return;
        }
        case 'estado':
        case 'evento': {
            const sala = ws.sala;
            if (!sala) return;
            // se reenvía a los demás; 'para' permite mandarle algo a un solo jugador
            const salida = JSON.stringify({ ...m, de: ws.id });
            for (const [id, j] of sala.jugadores) {
                if (id === ws.id) continue;
                if (m.para != null && m.para !== id) continue;
                if (j.ws.readyState === j.ws.OPEN) j.ws.send(salida);
            }
            return;
        }
    }
}

function entrar(ws, sala, m) {
    ws.sala = sala;
    ws.id = sala.siguienteId++;
    sala.jugadores.set(ws.id, {
        ws,
        id: ws.id,
        nombre: limpiarNombre(m.nombre) || `Jugador ${ws.id}`,
        pj: PERSONAJES.has(m.pj) ? m.pj : 'arquera',
    });
    avisarLista(sala);
}

function salir(ws) {
    const sala = ws.sala;
    if (!sala) return;
    sala.jugadores.delete(ws.id);
    ws.sala = null;
    if (sala.jugadores.size === 0) {
        salas.delete(sala.codigo);
        console.log(`sala ${sala.codigo} cerrada`);
        return;
    }
    // si se fue el anfitrión, el siguiente en la lista toma su lugar
    if (sala.anfitrion === ws.id) sala.anfitrion = sala.jugadores.keys().next().value;
    difundir(sala, { t: 'evento', tipo: 'salio', de: ws.id });
    avisarLista(sala);
}

function avisarLista(sala) {
    const jugadores = lista(sala);
    for (const j of sala.jugadores.values()) {
        enviar(j.ws, { t: 'sala', codigo: sala.codigo, tuId: j.id, anfitrion: sala.anfitrion, empezada: sala.empezada, jugadores });
    }
}

const lista = sala => [...sala.jugadores.values()].map(({ id, nombre, pj }) => ({ id, nombre, pj }));

function difundir(sala, mensaje) {
    const texto = JSON.stringify(mensaje);
    for (const j of sala.jugadores.values()) if (j.ws.readyState === j.ws.OPEN) j.ws.send(texto);
}

function enviar(ws, mensaje) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(mensaje));
}

function nuevoCodigo() {
    let codigo;
    do {
        codigo = Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
    } while (salas.has(codigo));
    return codigo;
}

function limpiarNombre(nombre) {
    return String(nombre || '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 14);
}

// conexiones que se cortaron sin avisar (el celular se quedó sin señal): se cierran
const latido = setInterval(() => {
    for (const ws of wss.clients) {
        if (!ws.vivo) { ws.terminate(); continue; }
        ws.vivo = false;
        ws.ping();
    }
}, 15000);
wss.on('close', () => clearInterval(latido));

servidor.listen(PUERTO, HOST, () => {
    console.log(`Servidor de Monhabell escuchando en http://${HOST}:${PUERTO} (WebSocket en la misma dirección)`);
});
