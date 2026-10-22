// Chat de voz: SOLO en las partidas en línea (no jugando solo ni en el mismo teclado).
//
// Dos modos (⚙ Configuración → Chat de voz):
//   - Pulsar para hablar: mantener el botón 🎤 (o la tecla Q).
//   - Micrófono abierto: se habla libremente; tocar 🎤 (o Q) silencia / vuelve a activar el micrófono.
// La primera vez se pide el micrófono.
// Cada jugador se conecta directo con los demás (WebRTC); el servidor del juego solo pasa los
// mensajes para conectarse (eventos 'voz' con 'para': no hubo que cambiar el servidor).
// Quien tiene la voz activada escucha a los demás que también la activaron.
//
// Voz por cercanía (La Noche del Troll): troll.js da una función con el volumen de cada jugador
// (usarVolumenVoz); se aplica varias veces por segundo. Sin ella, todos se oyen igual.
//
// Redes que no permiten la conexión directa (algunos datos móviles o redes de empresa) necesitan
// un servidor TURN: cuando esté instalado en el VPS, se completa TURN abajo y listo.

import { red, alRecibir, enviarEvento } from "./red.js"
import { ajustes } from "./ajustes.js"

// servidores para encontrarse: STUN público + TURN propio (vacío hasta instalarlo en el VPS)
// (la clave queda visible en el código: es solo para este TURN, que tiene un límite de uso en el VPS)
const TURN = { urls: ['turn:93.188.167.2:3478?transport=udp', 'turn:93.188.167.2:3478?transport=tcp'], username: 'trollnight', credential: 'monhabell123456789' };
// STUN: el propio VPS (coturn también responde STUN) y el público de Google de respaldo
const SERVIDORES_ICE = [{ urls: ['stun:93.188.167.2:3478', 'stun:stun.l.google.com:19302'] }, ...(TURN.urls ? [TURN] : [])];
const UMBRAL_HABLA = 0.04;   // volumen (0-1) a partir del cual se considera que alguien habla
const VOLUMEN_JUEGO_HABLANDO = 0.55; // el juego baja a esta proporción mientras alguien habla

const voz = {
    activa: false,      // el micrófono de este jugador está listo
    microfono: null,    // MediaStream local
    conexiones: new Map(), // id -> { pc, audio, analizador }
    hablando: new Set(),   // ids de los que hablan ahora (incluido el propio)
    contexto: null,
    modo: null,         // 'pulsar' | 'abierto' (el que se aplicó por última vez)
    silenciado: false,  // con micrófono abierto: el jugador se silenció
};
const abierto = () => ajustes.voz === 'abierto';

export const vozActiva = () => voz.activa;
// volumen de cada jugador (id -> 0..1) o null: todos al máximo
let volumenDe = null;
export const usarVolumenVoz = fn => { volumenDe = fn; };
export const estaHablando = id => voz.hablando.has(id);
const enPartidaEnLinea = () => red.enPartida && red.conectado && red.tuId != null;

// ---------- activar / desactivar ----------
async function activar() {
    if (voz.activa || !enPartidaEnLinea()) return;
    try {
        voz.microfono = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
    } catch (_e) {
        avisarError('No se pudo usar el micrófono (revisa el permiso)');
        return;
    }
    voz.activa = true;
    aplicarModo(); // pulsar: empieza callado; abierto: ya se escucha
    voz.contexto ||= new (window.AudioContext || window.webkitAudioContext)();
    medir('yo', voz.microfono);
    enviarEvento('voz', { clase: 'hola' }); // "tengo la voz activada": los demás se conectan conmigo
}

function apagar() {
    voz.conexiones.forEach((_c, id) => cerrar(id));
    voz.microfono?.getTracks().forEach(t => t.stop());
    voz.microfono = null;
    voz.activa = false;
    voz.hablando.clear();
    actualizarBoton();
}

export function hablar(si) {
    if (!voz.activa) return;
    voz.microfono?.getAudioTracks().forEach(t => { t.enabled = si; });
    boton?.classList.toggle('hablando', si);
    boton?.classList.toggle('silenciado', abierto() && !si);
}

// el modo elegido en la configuración (se revisa seguido: se puede cambiar en medio de la partida)
function aplicarModo() {
    voz.modo = ajustes.voz;
    voz.silenciado = false;
    hablar(abierto());
}

// tocar 🎤 o Q: pulsar -> empieza a hablar; abierto -> silenciarse / volver a hablar
function apretar() {
    if (!voz.activa) { activar().then(actualizarBoton); return; }
    if (abierto()) { voz.silenciado = !voz.silenciado; hablar(!voz.silenciado); }
    else hablar(true);
}
function soltar() {
    if (!abierto()) hablar(false);
}

// ---------- conexiones con cada jugador ----------
function conexion(id) {
    let c = voz.conexiones.get(id);
    if (c) return c;
    const pc = new RTCPeerConnection({ iceServers: SERVIDORES_ICE });
    c = { pc, audio: null, pendientes: [] };
    voz.conexiones.set(id, c);
    voz.microfono?.getTracks().forEach(t => pc.addTrack(t, voz.microfono));
    pc.onicecandidate = e => { if (e.candidate) enviarEvento('voz', { clase: 'ice', para: id, ice: e.candidate.toJSON() }); };
    pc.ontrack = e => {
        if (c.audio) return;
        c.audio = new Audio();
        c.audio.srcObject = e.streams[0];
        c.audio.autoplay = true;
        c.audio.play().catch(() => { /* se reintenta con el próximo toque (política de reproducción) */ });
        medir(id, e.streams[0]);
    };
    pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) cerrar(id); };
    return c;
}

function cerrar(id) {
    const c = voz.conexiones.get(id);
    if (!c) return;
    voz.conexiones.delete(id);
    try { c.pc.close(); } catch (_e) { /* ya cerrada */ }
    if (c.audio) { c.audio.srcObject = null; c.audio = null; }
    voz.hablando.delete(id);
}

// conectar con otro jugador que también tiene la voz: ofrece el de número menor (así no se cruzan)
async function conectarCon(id) {
    if (!voz.activa || id === red.tuId || voz.conexiones.has(id)) return;
    if (red.tuId > id) { enviarEvento('voz', { clase: 'hola', para: id }); return; } // que ofrezca él
    const { pc } = conexion(id);
    await pc.setLocalDescription(await pc.createOffer());
    enviarEvento('voz', { clase: 'oferta', para: id, sdp: pc.localDescription.toJSON() });
}

alRecibir('evento', async m => {
    if (m.tipo !== 'voz' || m.de == null || !voz.activa) return;
    try {
        if (m.clase === 'hola') await conectarCon(m.de);
        else if (m.clase === 'oferta') {
            const c = conexion(m.de);
            await c.pc.setRemoteDescription(m.sdp);
            await agregarPendientes(c);
            const pc = c.pc;
            await pc.setLocalDescription(await pc.createAnswer());
            enviarEvento('voz', { clase: 'respuesta', para: m.de, sdp: pc.localDescription.toJSON() });
        } else if (m.clase === 'respuesta') {
            const c = voz.conexiones.get(m.de);
            if (c) { await c.pc.setRemoteDescription(m.sdp); await agregarPendientes(c); }
        } else if (m.clase === 'ice') {
            const c = voz.conexiones.get(m.de);
            if (!c) return;
            if (c.pc.remoteDescription) await c.pc.addIceCandidate(m.ice);
            else c.pendientes.push(m.ice); // todavía no llegó su descripción
        }
    } catch (e) {
        console.warn('[voz]', e);
    }
});

async function agregarPendientes(c) {
    for (const ice of c.pendientes.splice(0)) await c.pc.addIceCandidate(ice).catch(() => {});
}

// alguien se fue de la sala: se corta su voz. Se salió de la sala (o del juego en línea): se apaga todo
alRecibir('sala', () => {
    const quedan = new Set(red.jugadores.map(j => j.id));
    [...voz.conexiones.keys()].forEach(id => { if (!quedan.has(id)) cerrar(id); });
});
alRecibir('desconectado', apagar);

// ---------- quién habla (para el 🔊 sobre su nombre) ----------
function medir(id, stream) {
    if (!voz.contexto) return;
    const fuente = voz.contexto.createMediaStreamSource(stream);
    const analizador = voz.contexto.createAnalyser();
    analizador.fftSize = 512;
    fuente.connect(analizador); // (solo se mide: el sonido de los demás lo reproduce el <audio>)
    const datos = new Uint8Array(analizador.fftSize);
    const revisar = () => {
        if (id !== 'yo' && !voz.conexiones.has(id)) return;
        if (id === 'yo' && !voz.activa) return;
        analizador.getByteTimeDomainData(datos);
        let suma = 0;
        for (const v of datos) suma += ((v - 128) / 128) ** 2;
        const nivel = Math.sqrt(suma / datos.length);
        const clave = id === 'yo' ? red.tuId : id;
        if (nivel > UMBRAL_HABLA) voz.hablando.add(clave); else voz.hablando.delete(clave);
        setTimeout(revisar, 120);
    };
    revisar();
}

// ---------- botón 🎤 y tecla Q ----------
let boton = null, juegoRef = null, volumenBase = null;

function avisarError(texto) {
    if (!boton) return;
    boton.title = texto;
    boton.classList.add('error');
    setTimeout(() => boton?.classList.remove('error'), 2500);
}

function actualizarBoton() {
    if (!boton) return;
    const enLinea = enPartidaEnLinea();
    boton.hidden = !enLinea;
    if (!enLinea && voz.activa) apagar();
    boton.classList.toggle('activa', voz.activa);
    const texto = !voz.activa ? 'Activar chat de voz'
        : abierto() ? (voz.silenciado ? 'Silenciado: toca para hablar (Q)' : 'Micrófono abierto: toca para silenciarte (Q)')
        : 'Mantén para hablar (tecla Q)';
    boton.setAttribute('aria-label', texto);
    boton.title = texto;
}

// crea el botón (dentro del juego) y la tecla Q; se muestra solo en las partidas en línea
export function iniciarVoz(juego) {
    juegoRef = juego;
    boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton-voz';
    boton.hidden = true;
    boton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
    document.getElementById('game').append(boton);

    // primer toque: activa la voz; después, mantener para hablar
    boton.addEventListener('pointerdown', e => {
        e.preventDefault();
        voz.conexiones.forEach(c => c.audio?.play().catch(() => {}));
        apretar();
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => boton.addEventListener(t, soltar));

    document.addEventListener('keydown', e => {
        if (e.repeat || e.key.toLowerCase() !== 'q' || e.target.closest?.('input, textarea, select')) return;
        if (!enPartidaEnLinea()) return;
        apretar();
    });
    document.addEventListener('keyup', e => { if (e.key.toLowerCase() === 'q') soltar(); });

    // voz por cercanía: el volumen de cada uno
    setInterval(() => {
        voz.conexiones.forEach((c, id) => {
            if (!c.audio) return;
            let v = 1;
            try { v = volumenDe ? Math.max(0, Math.min(1, Number(volumenDe(id)) || 0)) : 1; } catch (_e) { v = 1; }
            if (Math.abs(c.audio.volume - v) > 0.01) c.audio.volume = v;
        });
    }, 100);

    // cada tanto: mostrar/ocultar el botón y bajar el juego mientras alguien habla
    setInterval(() => {
        actualizarBoton();
        if (voz.activa && voz.modo !== ajustes.voz) aplicarModo();
        if (!juegoRef?.sound) return;
        const otrosHablan = [...voz.hablando].some(id => id !== red.tuId && (voz.conexiones.get(id)?.audio?.volume ?? 1) > 0.1);
        if (otrosHablan && volumenBase === null) {
            volumenBase = juegoRef.sound.volume;
            juegoRef.sound.volume = volumenBase * VOLUMEN_JUEGO_HABLANDO;
        } else if (!otrosHablan && volumenBase !== null) {
            juegoRef.sound.volume = volumenBase;
            volumenBase = null;
        }
    }, 200);
}
