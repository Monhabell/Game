// Ajustes del jugador (menú de configuración): se guardan en el navegador / la app.
// La dificultad y los enemigos se aplican al empezar o reiniciar un nivel (al morir también);
// la cámara, el volumen y los botones táctiles (tamaño y posición), al momento.

const CLAVE = 'monhabell-aventura-ajustes';

export const DIFICULTADES = {
    facil: { nombre: 'Fácil', detalle: '6 vidas · enemigos lentos', vidas: 6, velEnemigos: 0.8 },
    normal: { nombre: 'Normal', detalle: '4 vidas', vidas: 4, velEnemigos: 1 },
    dificil: { nombre: 'Difícil', detalle: '3 vidas · enemigos rápidos', vidas: 3, velEnemigos: 1.25 },
};

// zoom de la cámara, en medidas de la resolución alta (2): menos zoom = se ve más mundo
export const CAMARAS = {
    cerca: { nombre: 'Cerca', zoom: 1.85 },
    normal: { nombre: 'Normal', zoom: 1.6 },
    lejos: { nombre: 'Lejos', zoom: 1.4 },
};

// calidad de los gráficos: a qué resolución se dibuja el juego (790x380 por este número).
// Se aplica al volver a abrir el juego. Auto: nítidos en el PC, rápidos en el celular.
export const GRAFICOS = {
    auto: { nombre: 'Auto' },
    rapida: { nombre: 'Rápidos', resolucion: 1 },
    media: { nombre: 'Medios', resolucion: 1.5 },
    alta: { nombre: 'Nítidos', resolucion: 2 },
};

export const BOTONES = {
    chicos: { nombre: 'Pequeños', escala: 0.8 },
    normales: { nombre: 'Normales', escala: 1 },
    grandes: { nombre: 'Grandes', escala: 1.25 },
};

// chat de voz (solo en partidas en línea): pulsar para hablar o micrófono abierto
export const VOCES = {
    pulsar: { nombre: 'Pulsar para hablar' },
    abierto: { nombre: 'Micrófono abierto' },
};

// version: sube cuando cambia un valor por defecto que debe aplicarse también a quien ya tenía ajustes
const VERSION = 2;
const POR_DEFECTO = { version: VERSION, dificultad: 'normal', camara: 'lejos', volumen: 100, botones: 'normales', colisiones: false, cadena: false, graficos: 'auto', fps: false, voz: 'pulsar' };

export const ajustes = leer();

function leer() {
    try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE)) || {};
        const a = { ...POR_DEFECTO, ...guardado };
        // versión 2: la cámara empieza lejos (antes 'normal')
        if (!(guardado.version >= 2)) a.camara = POR_DEFECTO.camara;
        a.version = VERSION;
        // valores dañados o de versiones viejas: se vuelve al de por defecto
        if (!DIFICULTADES[a.dificultad]) a.dificultad = POR_DEFECTO.dificultad;
        if (!CAMARAS[a.camara]) a.camara = POR_DEFECTO.camara;
        if (!BOTONES[a.botones]) a.botones = POR_DEFECTO.botones;
        if (!GRAFICOS[a.graficos]) a.graficos = POR_DEFECTO.graficos;
        if (!VOCES[a.voz]) a.voz = POR_DEFECTO.voz;
        if (![1, 1.25, 1.5].includes(a.autoRes)) delete a.autoRes;
        if (!(a.volumen >= 0 && a.volumen <= 100)) a.volumen = POR_DEFECTO.volumen;
        // posición de los botones táctiles (tactil.js): { id: [fracción del ancho, fracción del alto] }
        if (typeof a.posBotones !== 'object' || !a.posBotones) a.posBotones = {};
        for (const [id, p] of Object.entries(a.posBotones))
            if (!Array.isArray(p) || !p.every(n => Number.isFinite(n) && Math.abs(n) <= 1)) delete a.posBotones[id];
        return a;
    } catch (_e) {
        return { ...POR_DEFECTO };
    }
}

export function guardarAjustes(cambios) {
    Object.assign(ajustes, cambios);
    try { localStorage.setItem(CLAVE, JSON.stringify(ajustes)); } catch (_e) { /* sin almacenamiento: dura hasta cerrar */ }
}

export const vidasMaximas = () => DIFICULTADES[ajustes.dificultad].vidas;
export const factorEnemigos = () => DIFICULTADES[ajustes.dificultad].velEnemigos;
// resolución con la que arrancó el juego (cambiarla pide volver a abrirlo)
const esCelular = () => !!globalThis.matchMedia?.('(pointer: coarse)').matches;
// Auto: nítido en el PC (2); en el celular 1,5 si la pantalla es de alta densidad (con 1 se veía borroso
// al estirarse) y 1 en los de baja densidad. Si un celular va lento: ⚙ → Gráficos → Rápidos
// autoRes: si en este celular el juego iba lento, el modo fluido (rendimiento.js) guarda una resolución
// menor para la próxima vez que se abra (solo con Gráficos en Auto)
export const RESOLUCION = GRAFICOS[ajustes.graficos].resolucion
    ?? (esCelular() ? (ajustes.autoRes ?? ((globalThis.devicePixelRatio || 1) >= 2 ? 1.5 : 1)) : 2);
export const esMovil = esCelular;

export const zoomCamara = () => CAMARAS[ajustes.camara].zoom * RESOLUCION / 2;
