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
//     buscar   { nombre, pj, modo? }     búsqueda automática: entra a una sala PÚBLICA que no empezó y tenga
//                                        lugar (del modo pedido, si se pide; la más llena primero). Si no hay,
//                                        crea una pública (con ese modo, o carrera) y espera a que lleguen otros
//     publica  { publica }               (solo anfitrión) abre o cierra la sala a la búsqueda automática
//     elegir   { pj }                    cambia de personaje en la sala de espera
//     empezar  { nivel }                 (solo anfitrión) arranca la partida para todos (también la revancha)
//     modo     { modo, arena, apuesta }  (solo anfitrión) 'aventura' | 'duelo' (1 contra 1) | 'equipos' (rojo contra azul)
//                                        | 'carrera' (todos el mismo nivel, gana el primero en llegar; la deciden los clientes)
//                                        | 'troll' (La Noche del Troll: uno o dos son el troll en secreto)
//     equipo   { equipo }                0 (rojo) o 1 (azul), en el modo por equipos
//     volver   {}                        (solo anfitrión) todos vuelven a la sala de espera
//     saldo    { monedas }               cuántas monedas tiene (para la apuesta de la arena)
//     apostar  { apuesta }               (carrera) lo que apuesta este jugador; vuelve a 'no listo'
//     listo    { listo }                 (carrera) ya eligió su apuesta y está listo para correr
//     estado / evento { ... }            se reenvía a los demás con { de: tuId } (sin 'de' si trae anonimo: true)
//     ping     { n }                     se contesta al momento (para medir la demora en el juego)
//   servidor -> cliente
//     sala     { codigo, tuId, anfitrion, jugadores, modo, arena, publica }   (cada vez que cambia la lista)
//     empezar  { nivel, semilla, jugadores, modo, arena }
//              (troll) + { bots, rol, compas }: rol 'troll' | 'heroe' de ESE jugador; compas, los otros
//              trolls (solo se le dice a un troll). El servidor reparte los roles: así nadie puede
//              leer en los mensajes quién es el troll.
//     volver   {}
//     estado / evento { de, ... }
//     error    { motivo }
//     pong     { n }                     respuesta al ping (el mismo n)

import http from 'node:http';
import { WebSocketServer } from 'ws';

const PUERTO = Number(process.env.PORT) || 2567;
const HOST = process.env.HOST || '127.0.0.1';
const MAX_JUGADORES = 8;
const MAX_MENSAJE = 16 * 1024;       // bytes por mensaje
const MAX_MENSAJES_SEG = 60;         // por jugador (el juego manda ~20 por segundo)
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I ni O (se confunden con 1 y 0)
const MODOS = new Set(['aventura', 'duelo', 'equipos', 'carrera', 'troll']);
// La Noche del Troll: de 4 a 8 (con bots de relleno hasta 4); con 7 u 8, dos trolls
const MIN_NOCHE = 4;
const NOMBRES_BOT = ['Brisa', 'Toto', 'Lumi', 'Pipo', 'Nala', 'Rulo'];
const esArena = modo => modo === 'duelo' || modo === 'equipos';
const ARENAS = new Set(['bosque', 'cueva', 'volcan', 'castillo', 'abismo']);
const MAX_ARENA = 4; // jugadores en una batalla de la arena
const APUESTAS = new Set([0, 10, 25, 50, 100]);
const PERSONAJES = new Set(['arquera', 'espadachin', 'mago', 'hechicera', 'caballera', 'mosquetera', 'paladina', 'asesina', 'elfa']);

/** @type {Map<string, {codigo: string, jugadores: Map<number, any>, anfitrion: number, empezada: boolean, siguienteId: number}>} */
const salas = new Map();

const servidor = http.createServer((req, res) => {
    // para comprobar desde el navegador que el servidor está vivo
    if (req.url === '/salud' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, salas: salas.size, publicas: [...salas.values()].filter(s => s.publica && !s.empezada).length,
            jugadores: [...salas.values()].reduce((n, s) => n + s.jugadores.size, 0) }));
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
        case 'ping': return enviar(ws, { t: 'pong', n: m.n });
        case 'crear': {
            if (ws.sala) return;
            entrar(ws, nuevaSala(), m);
            return;
        }
        case 'buscar': {
            if (ws.sala) return;
            const modo = MODOS.has(m.modo) ? m.modo : null;
            const libre = [...salas.values()]
                .filter(s => s.publica && !s.empezada && s.jugadores.size < cupo(s) && (!modo || s.modo === modo))
                .sort((a, b) => b.jugadores.size - a.jugadores.size)[0];
            if (libre) { entrar(ws, libre, m); return; }
            // nadie esperando: se crea una sala pública y los siguientes que busquen llegan a ella
            const sala = nuevaSala({ publica: true, modo: modo || 'carrera' });
            entrar(ws, sala, m);
            return;
        }
        case 'publica': {
            const sala = ws.sala;
            if (!sala || sala.anfitrion !== ws.id) return;
            sala.publica = !!m.publica;
            avisarLista(sala);
            return;
        }
        case 'unirse': {
            if (ws.sala) return;
            const sala = salas.get(String(m.codigo || '').toUpperCase().trim());
            if (!sala) return enviar(ws, { t: 'error', motivo: 'No existe esa sala' });
            if (sala.empezada) return enviar(ws, { t: 'error', motivo: 'La partida ya empezó' });
            if (sala.jugadores.size >= MAX_JUGADORES) return enviar(ws, { t: 'error', motivo: 'La sala está llena (8 jugadores)' });
            if (sala.modo === 'duelo' && sala.jugadores.size >= 2) return enviar(ws, { t: 'error', motivo: 'El duelo ya tiene sus 2 jugadores' });
            if (esArena(sala.modo) && sala.jugadores.size >= MAX_ARENA) return enviar(ws, { t: 'error', motivo: 'La sala de la arena está llena (4 jugadores)' });
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
        case 'modo': {
            const sala = ws.sala;
            if (!sala || sala.anfitrion !== ws.id || sala.empezada || !MODOS.has(m.modo)) return;
            if (sala.modo !== m.modo) listosAFalso(sala);
            sala.modo = m.modo;
            if (ARENAS.has(m.arena)) sala.arena = m.arena;
            if (APUESTAS.has(Number(m.apuesta))) sala.apuesta = Number(m.apuesta);
            if (sala.modo === 'equipos') repartirEquipos(sala);
            avisarLista(sala);
            return;
        }
        case 'equipo': {
            const sala = ws.sala;
            if (!sala || sala.empezada || (m.equipo !== 0 && m.equipo !== 1)) return;
            sala.jugadores.get(ws.id).equipo = m.equipo;
            avisarLista(sala);
            return;
        }
        case 'saldo': {
            const sala = ws.sala;
            if (!sala) return;
            sala.jugadores.get(ws.id).monedas = Math.max(0, Math.min(1e7, Math.floor(Number(m.monedas) || 0)));
            avisarLista(sala);
            return;
        }
        case 'apostar': {
            const sala = ws.sala;
            if (!sala || sala.empezada || !APUESTAS.has(Number(m.apuesta))) return;
            const j = sala.jugadores.get(ws.id);
            j.apuesta = Number(m.apuesta);
            j.listo = false;
            avisarLista(sala);
            return;
        }
        case 'listo': {
            const sala = ws.sala;
            if (!sala || sala.empezada) return;
            sala.jugadores.get(ws.id).listo = !!m.listo;
            avisarLista(sala);
            return;
        }
        case 'volver': {
            const sala = ws.sala;
            if (!sala || sala.anfitrion !== ws.id) return;
            sala.empezada = false;
            listosAFalso(sala); // (otra carrera: cada uno vuelve a confirmar su apuesta)
            difundir(sala, { t: 'volver' });
            avisarLista(sala);
            return;
        }
        case 'empezar': {
            const sala = ws.sala;
            if (!sala || sala.anfitrion !== ws.id) return;
            // la arena necesita rivales: 1 contra 1 justo 2 jugadores; por equipos, los dos equipos con alguien
            const n = sala.jugadores.size;
            if (sala.modo === 'duelo' && n !== 2) return enviar(ws, { t: 'error', motivo: 'El duelo 1 contra 1 es de 2 jugadores' });
            if (sala.modo === 'equipos') {
                const equipos = new Set([...sala.jugadores.values()].map(j => j.equipo));
                if (n < 2 || n > MAX_ARENA || equipos.size < 2) return enviar(ws, { t: 'error', motivo: 'Hace falta al menos un jugador en cada equipo (máximo 4)' });
            }
            const apuesta = esArena(sala.modo) ? sala.apuesta : 0;
            if (sala.modo === 'carrera') {
                // carrera: cada uno apuesta lo suyo y todos (menos el anfitrión, que es quien arranca) confirman
                if (n < 2) return enviar(ws, { t: 'error', motivo: 'La carrera necesita al menos 2 jugadores' });
                const falta = [...sala.jugadores.values()].find(j => j.id !== sala.anfitrion && !j.listo);
                if (falta) return enviar(ws, { t: 'error', motivo: `${falta.nombre} todavía no está listo` });
                const sinMonedas = [...sala.jugadores.values()].find(j => (j.monedas || 0) < (j.apuesta || 0));
                if (sinMonedas) return enviar(ws, { t: 'error', motivo: `${sinMonedas.nombre} no tiene ${sinMonedas.apuesta} monedas para su apuesta` });
            }
            const pobre = [...sala.jugadores.values()].find(j => (j.monedas || 0) < apuesta);
            if (pobre) return enviar(ws, { t: 'error', motivo: `${pobre.nombre} no tiene ${apuesta} monedas para la apuesta` });
            if (sala.modo === 'troll' && n < 2) return enviar(ws, { t: 'error', motivo: 'La Noche del Troll necesita al menos 2 jugadores' });
            sala.empezada = true;
            const semilla = Math.floor(Math.random() * 2 ** 31);
            const inicio = { t: 'empezar', nivel: Number(m.nivel) || 0, semilla, jugadores: lista(sala), modo: sala.modo, arena: sala.arena, apuesta };
            if (sala.modo === 'troll') empezarNoche(sala, inicio);
            else difundir(sala, inicio);
            return;
        }
        case 'estado':
        case 'evento': {
            const sala = ws.sala;
            if (!sala) return;
            // Noche del Troll: el veredicto del Juicio lo manda el anfitrión; el servidor le agrega si el
            // expulsado era el troll (solo él lo sabe) y se lo manda a TODOS, también al anfitrión
            if (m.tipo === 'nocheVeredicto') {
                if (sala.modo !== 'troll' || ws.id !== sala.anfitrion) return;
                const fuera = Number.isInteger(m.fuera) ? m.fuera : null;
                difundir(sala, { ...m, fuera, era: fuera != null && !!sala.trolls?.has(fuera), de: ws.id });
                return;
            }
            // el ataque del troll: solo un troll de verdad puede mandarlo (si no, cualquiera "mataría")
            if ((m.tipo === 'nocheAtaque' || m.tipo === 'nocheAtaqueBot') && (sala.modo !== 'troll' || !sala.trolls?.has(ws.id))) return;
            // y el final de la noche: recién ahí se dice quiénes eran los trolls (a todos)
            if (m.tipo === 'nocheFin') {
                if (sala.modo !== 'troll' || ws.id !== sala.anfitrion) return;
                difundir(sala, { ...m, trolls: [...(sala.trolls || [])], de: ws.id });
                return;
            }
            // se reenvía a los demás; 'para' permite mandarle algo a un solo jugador.
            // 'anonimo' (Noche del Troll: trampas, apagón…): sin 'de', para que nadie sepa quién fue
            const salida = JSON.stringify(m.anonimo ? m : { ...m, de: ws.id });
            for (const [id, j] of sala.jugadores) {
                if (id === ws.id) continue;
                if (m.para != null && m.para !== id) continue;
                if (j.ws.readyState === j.ws.OPEN) j.ws.send(salida);
            }
            return;
        }
    }
}

// La Noche del Troll: bots hasta llegar a 4 y los trolls sorteados entre las personas (los bots
// solo son héroes). Cada jugador recibe SU rol; los compañeros trolls, solo los trolls.
function empezarNoche(sala, inicio) {
    const ids = [...sala.jugadores.keys()];
    const bots = Array.from({ length: Math.max(0, MIN_NOCHE - ids.length) }, (_, i) =>
        ({ id: -(i + 1), nombre: NOMBRES_BOT[i % NOMBRES_BOT.length], pj: [...PERSONAJES][(i * 3 + 1) % PERSONAJES.size], bot: true }));
    const cuantos = ids.length + bots.length >= 7 ? 2 : 1;
    const trolls = new Set();
    while (trolls.size < cuantos) trolls.add(ids[Math.floor(Math.random() * ids.length)]);
    sala.trolls = trolls;
    for (const j of sala.jugadores.values()) {
        const esTroll = trolls.has(j.id);
        enviar(j.ws, { ...inicio, bots, rol: esTroll ? 'troll' : 'heroe', compas: esTroll ? [...trolls].filter(id => id !== j.id) : [] });
    }
}

// cuántos caben según el modo (duelo 2, arena por equipos 4, lo demás 8)
const cupo = sala => (sala.modo === 'duelo' ? 2 : esArena(sala.modo) ? MAX_ARENA : MAX_JUGADORES);

function nuevaSala({ publica = false, modo = 'aventura' } = {}) {
    const sala = { codigo: nuevoCodigo(), jugadores: new Map(), anfitrion: 1, empezada: false, siguienteId: 1, modo, arena: 'bosque', apuesta: 0, publica };
    salas.set(sala.codigo, sala);
    console.log(`sala ${sala.codigo} creada${publica ? ' (pública)' : ''}`);
    return sala;
}

function entrar(ws, sala, m) {
    ws.sala = sala;
    ws.id = sala.siguienteId++;
    sala.jugadores.set(ws.id, {
        ws,
        id: ws.id,
        nombre: limpiarNombre(m.nombre) || `Jugador ${ws.id}`,
        pj: PERSONAJES.has(m.pj) ? m.pj : 'arquera',
        equipo: 0,
        apuesta: 0,  // (carrera) lo que apuesta este jugador
        listo: false,
    });
    if (sala.modo === 'equipos') repartirEquipos(sala);
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
    if (sala.modo === 'equipos') repartirEquipos(sala);
    difundir(sala, { t: 'evento', tipo: 'salio', de: ws.id });
    avisarLista(sala);
}

function avisarLista(sala) {
    const jugadores = lista(sala);
    for (const j of sala.jugadores.values()) {
        enviar(j.ws, { t: 'sala', codigo: sala.codigo, tuId: j.id, anfitrion: sala.anfitrion, empezada: sala.empezada, jugadores, modo: sala.modo, arena: sala.arena, apuesta: sala.apuesta, publica: !!sala.publica });
    }
}

// por equipos: si un equipo quedó vacío, el último en llegar del otro equipo se pasa
function repartirEquipos(sala) {
    const js = [...sala.jugadores.values()];
    const rojos = js.filter(j => j.equipo === 0), azules = js.filter(j => j.equipo === 1);
    if (js.length >= 2 && !azules.length) rojos[rojos.length - 1].equipo = 1;
    else if (js.length >= 2 && !rojos.length) azules[azules.length - 1].equipo = 0;
}

const lista = sala => [...sala.jugadores.values()].map(({ id, nombre, pj, equipo, monedas, apuesta, listo }) =>
    ({ id, nombre, pj, equipo, monedas: monedas || 0, apuesta: apuesta || 0, listo: !!listo }));
const listosAFalso = sala => sala.jugadores.forEach(j => { j.listo = false; });

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
