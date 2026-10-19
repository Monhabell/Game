// Rendimiento (sobre todo en el celular):
//
// 1. Solo se dibuja lo que está cerca de la cámara. Phaser dibuja TODOS los objetos del nivel en cada
//    fotograma aunque estén a miles de px; aquí, cada RECORTE_MS, lo que queda fuera de la vista (con
//    margen) se marca para que la cámara no lo dibuje. No se toca .visible (el juego lo usa para otras
//    cosas) ni la física: solo el dibujo, con cameraFilter.
// 2. Los objetos fijos en pantalla (HUD, cielo, niebla, oscuridad) se guardan en una lista que se
//    rehace de vez en cuando, en vez de recorrer todo el nivel en cada fotograma (ver compensarZoom).
// 3. Contador de cuadros por segundo (opcional, en la configuración).
// 4. Modo fluido automático en el celular (ver cuidarRendimiento, al final).

import { ajustes, guardarAjustes, RESOLUCION, esMovil } from "./ajustes.js"
import { red, enLinea, leerHueco } from "./red.js"

const RECORTE_MS = 120;   // cada cuánto se revisa qué está en la vista
const MARGEN = 180;       // px fuera de la vista que se siguen dibujando (lo que entra no "aparece" de golpe)
const FIJOS_MS = 1000;    // cada cuánto se rehace igual la lista de objetos fijos en pantalla

// tipos que no se pueden medir así (sus hijos o su dibujo tienen otras coordenadas): se dibujan siempre
const SIN_RECORTE = new Set(['Container', 'Graphics', 'ParticleEmitter', 'Layer', 'Zone', 'DOMElement']);

export function recortarVista(scene, time) {
    if (time < (scene.proxRecorte || 0)) return;
    scene.proxRecorte = time + RECORTE_MS;
    const cam = scene.cameras.main;
    const anchoVista = cam.width / cam.zoom, altoVista = cam.height / cam.zoom;
    const revisar = o => {
        if (o.type === 'Layer') { o.list.forEach(revisar); return; }
        if (SIN_RECORTE.has(o.type)) return;
        const sx = o.scrollFactorX, sy = o.scrollFactorY;
        if (sx === undefined || sx < 0.1 || sy < 0.1) return; // fijo en pantalla: siempre se dibuja
        const w = Math.abs(o.displayWidth ?? o.width ?? 0), h = Math.abs(o.displayHeight ?? o.height ?? 0);
        if (!w || !h) return;
        // posición en la pantalla (con el efecto de profundidad del scrollFactor)
        const izq = o.x - (o.originX ?? 0.5) * w - cam.scrollX * sx;
        const arr = o.y - (o.originY ?? 0.5) * h - cam.scrollY * sy;
        const fuera = izq + w < -MARGEN || izq > anchoVista + MARGEN || arr + h < -MARGEN || arr > altoVista + MARGEN;
        const filtro = fuera ? cam.id : 0;
        if (o.cameraFilter !== filtro) o.cameraFilter = filtro;
    };
    scene.children.list.forEach(revisar);
}

// objetos fijos en pantalla (scrollFactor ~0): la lista se rehace cuando se agrega algo a la escena
// (un mensaje, un ícono del HUD) y, por las dudas, cada FIJOS_MS
export function vigilarFijos(scene) {
    scene.fijos = null;
    if (scene.vigilandoFijos) return; // la escena se reutiliza al reiniciar el nivel: un solo oyente
    scene.vigilandoFijos = true;
    scene.events.on('addedtoscene', () => { scene.fijos = null; });
}

export function fijosEnPantalla(scene) {
    const ahora = performance.now();
    if (!scene.fijos || ahora > scene.fijosHasta) {
        scene.fijos = scene.children.list.filter(o => o.scrollFactorX !== undefined && o.scrollFactorX <= 0.1 && o.scrollFactorY <= 0.1);
        scene.fijosHasta = ahora + FIJOS_MS;
    }
    return scene.fijos;
}

// ---------- contador de FPS ----------
// en línea también muestra la red: "ping" = ida y vuelta al servidor; "red" = el mayor silencio entre
// mensajes de los demás (lo normal es ~70 ms). FPS bajos = el celular; ping o red altos = la conexión.
export function crearContadorFps(scene) {
    scene.textoFps = scene.add.text(8, 366, '', {
        fontFamily: 'monospace', fontSize: '10px', color: '#7dffc8', stroke: '#000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(60);
    scene.proxFps = 0;
}

export function actualizarContadorFps(scene, time) {
    if (!scene.textoFps || time < scene.proxFps) return;
    scene.proxFps = time + 500;
    const fps = Math.round(scene.game.loop.actualFps);
    let texto = `${fps} FPS`, nota = fps >= 50 ? 0 : fps >= 30 ? 1 : 2;
    if (enLinea()) {
        texto += ` · ping ${red.ping ?? '?'} ms`;
        if (red.ping != null) nota = Math.max(nota, red.ping < 150 ? 0 : red.ping < 300 ? 1 : 2);
        if (red.jugadores.length > 1) { // (solo, no llega nada de nadie)
            const hueco = leerHueco();
            texto += ` · red ${hueco} ms`;
            nota = Math.max(nota, hueco < 250 ? 0 : hueco < 600 ? 1 : 2);
        }
    }
    scene.textoFps.setText(texto).setColor(['#7dffc8', '#ffe066', '#ff8a8a'][nota]);
}

// 4. Modo fluido automático (solo en el celular): si el juego va a menos de FPS_BAJO durante
//    SEGUNDOS_BAJO seguidos, se apagan la niebla y la mitad de las partículas (al momento, y en los
//    niveles siguientes). Con Gráficos en Auto, además se recuerda una resolución un poco menor
//    para la próxima vez que se abra el juego (1,5 -> 1,25 -> 1).
const FPS_BAJO = 42;
const SEGUNDOS_BAJO = 3;
let fluidoEnLaSesion = false;

export function cuidarRendimiento(scene, time) {
    if (!esMovil()) return;
    // (la escena se reutiliza al reiniciar el nivel: se revisa en sus objetos nuevos, no en la escena)
    if (fluidoEnLaSesion && scene.nieblaAlta && !scene.nieblaAlta.fluido) activarFluido(scene);
    if (time < (scene.proxMedida || 0)) return;
    scene.proxMedida = time + 500;
    if (fluidoEnLaSesion || scene.game.loop.actualFps >= FPS_BAJO) { scene.medidasBajas = 0; return; }
    scene.medidasBajas = (scene.medidasBajas || 0) + 1;
    if (scene.medidasBajas < SEGUNDOS_BAJO * 2) return;
    activarFluido(scene);
    fluidoEnLaSesion = true;
    // la próxima vez, una resolución menor (solo si el jugador dejó los gráficos en Auto)
    if (ajustes.graficos === 'auto' && RESOLUCION > 1) guardarAjustes({ autoRes: RESOLUCION > 1.25 ? 1.25 : 1 });
}

function activarFluido(scene) {
    scene.modoFluido = true; // ambiente.js: sin niebla
    if (scene.nieblaAlta) scene.nieblaAlta.fluido = true;
    [scene.nieblaAlta, scene.nieblaBaja, scene.nieblaDensa, ...(scene.capasNiebla || []).map(c => c.capa)]
        .forEach(c => c?.setVisible(false));
    if (scene.particulas) scene.particulas.frequency = Math.max(scene.particulas.frequency * 2, 60);
}
