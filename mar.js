// MAR ABIERTO: niveles COMPLETOS de agua (casi sin suelo). Se sale de un muelle, se nada todo el nivel y se
// sale por el otro lado a la meta. El reto es PLANEAR DÓNDE RESPIRAR (agua.js: barra de aire):
//   🌊 zonas abiertas: se asoma la cabeza y se respira (a veces con una isla chica para pararse)
//   🪨 tramos cubiertos: techo de roca bajo el agua (no se respira). Cada vez más largos y más hondos
//      (pasajes estrechos cerca del fondo); en los largos, una columna de burbujas para recargar
//   🐟 criaturas: DOS por tramo cubierto desde el principio (rape, medusa, pez espada y anguila; el pulpo
//      un poco después). Y VIGILAN lo que necesitas: una anguila junto a cada columna de burbujas y peces
//      rondando algunas zonas para respirar. Tortugas (inofensivas) en las zonas abiertas
//   ≋ corrientes EN CONTRA en tramos cubiertos (más suaves que las normales: siempre se avanza, y con burbujas)
//   🐙 EL KRAKEN: al final, un pulpo gigante sube y baja frente a la salida y escupe tinta (agua.js: 'kraken').
//      No se le gana: hay que pasar cuando deja hueco
//   🌿 algas, ⛓ rejas con palanca y 🫧 la burbuja troll, según el nivel
// Nunca más de ~620 px sin aire seguidos (buceando se avanzan ~130 px/s y el aire dura 6,5-10 s).
// Sale en el nivel 7 de cada mundo (desde el 2) y, en los mundos de agua, también en el 3 (niveles.js).

import { SUELO_Y } from "./alcance.js"
import { SUPERFICIE_AGUA } from "./tramos.js"
import { tieneAgua } from "./mecanicas.js"

export const esNivelAgua = (mundo, enMundo, tema) => mundo >= 2 && (enMundo === 7 || (enMundo === 3 && tieneAgua(tema)));

function azar(semilla) {
    let s = semilla >>> 0 || 1;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const fila = (x, y, n, sep = 32) => Array.from({ length: n }, (_, i) => [x + i * sep, y]);

export function nivelAgua({ i, k, d, tema, mezcla, nombre }) {
    const r = azar(i * 5021 + 17);
    const entre = (a, b) => Math.round(a + r() * (b - a));
    const S = SUELO_Y, sup = SUPERFICIE_AGUA, MURO = 40;
    const n = {
        nombre, cueva: !!tema.cueva, nubes: !tema.cueva, tinte: tema.tinte, mezcla, plantas: [], espiritus: [],
        suelo: [], lava: [], bloques: [], escaleras: [], enemigos: [], monedas: [], goteros: [], moviles: [], checkpoints: [],
        falsos: [], pinchos: [], bolas: [], emboscadas: [], carcajes: [], corazones: [], cristales: [],
        carteles: [], monedasTrampa: [], rocas: [], estatuasFalsas: [], mordedoras: [], banderasFalsas: [], persecuciones: [],
        plataformas: [], muros: [], antorchas: [], runas: [], techos: [],
        agua: [], burbujas: [], criaturas: [], algas: [], corrientes: [], rejas: [], burbujasFalsas: [],
        alto: 0, sinMisiones: true, marAbierto: true,
        aireMs: Math.max(6500, 9500 - k * 25), // (de 9,5 s a 6,5 s en pocos mundos)
    };
    // las criaturas que ya pueden salir
    const fauna = ['pez', 'medusa', 'espada', 'anguila', ...(k >= 20 ? ['pulpo'] : [])];
    const criatura = () => fauna[Math.floor(r() * fauna.length)];

    // el muelle: suelo firme, un cartel y escalones para subir al muro de la orilla
    const x0 = 620;
    n.carteles.push([150, 150, '🌊 MAR ABIERTO: planea dónde respirar']);
    n.monedas.push(...fila(160, 300, 5));
    n.muros.push([x0 - MURO, sup - 6, MURO]);
    n.plataformas.push([x0 - 230, S - 72, 60], [x0 - 160, S - 144, 60]);

    const largoAgua = Math.min(9500, 4300 + k * 14 + entre(0, 700));
    const fin = x0 + largoAgua;
    let a = x0 + 40, ultimoCheck = x0, cubiertos = 0;
    while (a < fin - 700) {
        // ---- zona abierta: se respira ----
        const abierta = entre(190, 360);
        const centro = a + Math.round(abierta / 2);
        if (r() < 0.22) {
            n.plataformas.push([centro - 50, sup - 34, 100]); // (una isla para pararse un momento: pocas)
            n.monedas.push(...fila(centro - 30, sup - 70, 3));
        } else n.monedas.push(...fila(centro - 30, sup - 24, 3));
        if (r() < 0.3) n.criaturas.push([centro, 'tortuga']);
        // un pez rondando la zona para respirar (hay que respirar con cuidado)
        else if (r() < 0.45) n.criaturas.push([centro, r() < 0.5 ? 'pez' : 'espada', sup + 45]);
        if (centro - ultimoCheck > 2000) { n.checkpoints.push(centro); n.corazones.push([centro + 40, sup + 40]); ultimoCheck = centro; }
        // la reja: en una zona abierta (se respira mientras se busca la palanca, en el fondo de antes)
        if (k >= 50 && cubiertos === 3 && !n.rejas.length) n.rejas.push([centro + 30, 90]);
        a += abierta;

        // ---- tramo cubierto: techo de roca bajo el agua ----
        const largo = entre(280, Math.min(620, 360 + Math.round(280 * d)));
        // qué tan hondo baja el techo (los más hondos dejan un pasaje estrecho cerca del fondo)
        const abajo = sup + entre(60, Math.round(60 + 85 * d));
        n.techos.push([a, a + largo, abajo]);
        cubiertos++;
        // en contra: una corriente suave (siempre se avanza) en algunos tramos; ahí siempre hay burbujas
        const contra = k >= 8 && r() < 0.3;
        if (largo > 430 || contra) {
            const xb = a + Math.round(largo / 2) + entre(-60, 60);
            n.burbujas.push(xb);
            n.criaturas.push([xb + (r() < 0.5 ? -70 : 70), 'anguila']); // (la anguila vigila las burbujas)
        }
        if (contra) n.corrientes.push([a, a + largo, -1, 0.45]);
        // una roca del fondo (deja siempre al menos 85 px para pasar entre ella y el techo)
        const hRoca = Math.min(entre(40, 95), S - abajo - 90);
        if (r() < 0.45 && hRoca >= 30) n.muros.push([a + Math.round(largo * (0.25 + r() * 0.4)), S - hRoca, entre(40, 70)]);
        // criaturas (más con la dificultad)
        n.criaturas.push([a + Math.round(largo * 0.3), criatura()], [a + Math.round(largo * 0.75), criatura()]);
        if (d > 0.8 && largo > 450) n.criaturas.push([a + Math.round(largo * 0.55), criatura()]);
        if (k >= 25 && r() < 0.3) n.algas.push(a + entre(60, largo - 60));
        if (!contra && k >= 30 && r() < 0.2) n.corrientes.push([a, a + largo, 1]); // (a favor: un respiro)
        n.monedas.push(...fila(a + 50, Math.round((abajo + S) / 2), Math.max(2, Math.floor((largo - 100) / 64)), 64));
        a += largo;
    }
    // el final: una zona abierta ANCHA con el Kraken frente a la salida (y la burbuja troll antes, en los altos)
    n.carteles.push([a - 120, sup - 60, '🐙 ¡CUIDADO! EL KRAKEN']);
    const x1 = a + 760;
    n.criaturas.push([a + 470, 'kraken']);
    if (k >= 80) n.burbujasFalsas.push(a + 120);
    n.agua.push([x0, x1, sup]);
    n.muros.push([x1, sup - 6, MURO]);
    n.plataformas.push([x1 + MURO + 50, S - 144, 60], [x1 + MURO + 120, S - 72, 60]);
    n.cristales.push([Math.round((x0 + x1) / 2), sup - 60]);

    // la orilla de llegada: escalera y meta (como el final de los demás niveles)
    const meta = x1 + MURO + 420, altura = d > 0.6 ? 5 : 4;
    n.escaleras.push([meta - 250 - altura * 32, altura]);
    n.meta = meta;
    n.ancho = meta + 500;
    n.suelo.push([0, n.ancho]);
    return n;
}
