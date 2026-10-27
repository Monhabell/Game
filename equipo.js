// Niveles en equipo: los mismos mapas de siempre + tramos cooperativos (placas, puertas...).
// Solo cuando se juega atado con cadena (mismo teclado o en línea); jugando solo, el mapa no cambia.
// Los tramos se insertan con extender() (tramos.js) sobre una COPIA del nivel: NIVELES no se toca.
// Al agregar uno: x debe tener suelo firme en el nivel original y cada grupo de placas, un nombre único.

import { NIVELES, nivelPorIndice } from "./niveles.js"
import { extender, tramoLlano, tramoPuertaDePlacas, tramoArgollas } from "./tramos.js"

// x donde empieza una zona de las Ruinas del Abismo (las zonas se corren al armar el nivel)
const inicioDeZona = (i, nombre) => (NIVELES[i].zonas || []).find(z => z[1] === nombre)?.[0] ?? 0;

const TRAMOS_EQUIPO = [
    // Bosque: la primera puerta de placas (enseña a soltar la placa y cruzar juntos) y, después, el
    // foso de argollas (enseña el rescate: el que cruza se ancla y sube al de atrás). Antes del túnel
    // (en las Afueras, en el llano después de la meta falsa; en el Bosque de antes, antes del túnel)
    { nivel: 0, x: NIVELES[0].amano ? 3850 : 4500, piezas: () => [
        tramoLlano(200), tramoPuertaDePlacas('bosque1'), tramoLlano(250), tramoArgollas(), tramoLlano(250),
    ] },
    // Ruinas del Abismo: una puerta de placas en la salida (antes de la primera bifurcación) y un foso
    // de argollas al empezar la Llegada (justo después de escapar del muro: el rescate es la ayuda)
    { nivel: 6, x: 700, piezas: () => [tramoLlano(150), tramoPuertaDePlacas('abismo1'), tramoLlano(200)] },
    { nivel: 6, x: inicioDeZona(6, 'LA LLEGADA') + 100, piezas: () => [tramoLlano(150), tramoArgollas(), tramoLlano(200)] },
];

export function nivelEnEquipo(i) {
    const tramos = TRAMOS_EQUIPO.filter(t => t.nivel === i);
    if (!tramos.length) return nivelPorIndice(i);
    let copia;
    try { copia = structuredClone(NIVELES[i]); } catch (_e) { return NIVELES[i]; }
    // de derecha a izquierda: así la x de cada tramo sigue siendo la del nivel original
    tramos.sort((a, b) => b.x - a.x).forEach(t => extender(copia, t.x, t.piezas()));
    return copia;
}
