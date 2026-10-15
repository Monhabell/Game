// Niveles en equipo: los mismos mapas de siempre + tramos cooperativos (placas, puertas...).
// Solo cuando se juega atado con cadena (mismo teclado o en línea); jugando solo, el mapa no cambia.
// Los tramos se insertan con extender() (tramos.js) sobre una COPIA del nivel: NIVELES no se toca.
// Al agregar uno: x debe tener suelo firme en el nivel original y cada grupo de placas, un nombre único.

import { NIVELES } from "./niveles.js"
import { extender, tramoLlano, tramoPuertaDePlacas, tramoArgollas } from "./tramos.js"

const TRAMOS_EQUIPO = [
    // Bosque: la primera puerta de placas (enseña a soltar la placa y cruzar juntos) y, después, el
    // foso de argollas (enseña el rescate: el que cruza se ancla y sube al de atrás). Antes del túnel
    { nivel: 0, x: 3850, piezas: () => [
        tramoLlano(200), tramoPuertaDePlacas('bosque1'), tramoLlano(250), tramoArgollas(), tramoLlano(250),
    ] },
];

export function nivelEnEquipo(i) {
    const tramos = TRAMOS_EQUIPO.filter(t => t.nivel === i);
    if (!tramos.length) return NIVELES[i];
    let copia;
    try { copia = structuredClone(NIVELES[i]); } catch (_e) { return NIVELES[i]; }
    // de derecha a izquierda: así la x de cada tramo sigue siendo la del nivel original
    tramos.sort((a, b) => b.x - a.x).forEach(t => extender(copia, t.x, t.piezas()));
    return copia;
}
