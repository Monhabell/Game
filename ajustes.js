// Ajustes del jugador (menú de configuración): se guardan en el navegador / la app.
// La dificultad y los enemigos se aplican al empezar o reiniciar un nivel (al morir también);
// la cámara, el volumen y los botones táctiles, al momento.

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

// version: sube cuando cambia un valor por defecto que debe aplicarse también a quien ya tenía ajustes
const VERSION = 2;
const POR_DEFECTO = { version: VERSION, dificultad: 'normal', camara: 'lejos', volumen: 100, botones: 'normales', colisiones: false, cadena: false, graficos: 'auto', fps: false };

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
        if (!(a.volumen >= 0 && a.volumen <= 100)) a.volumen = POR_DEFECTO.volumen;
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
export const RESOLUCION = GRAFICOS[ajustes.graficos].resolucion ?? (esCelular() ? 1 : 2);

export const zoomCamara = () => CAMARAS[ajustes.camara].zoom * RESOLUCION / 2;
