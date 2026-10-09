// Pruebas de los niveles (se ejecutan con `deno test`, también en GitHub Actions).
// Revisan que todos los niveles se puedan jugar y que las trampas al azar respeten las reglas.

import { NIVELES, SUELO_Y } from "./niveles.js";
import { aleatorizarNivel, contarTrampas } from "./azar.js";

const SALTO_MAXIMO = 230; // distancia horizontal que alcanza un salto (con margen)
const ANCHO_ARENA = 950;   // arena del jefe + muros, antes de la meta

function comprobar(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

// tramos de suelo firme ordenados (el nivel 1 tiene además una parte hecha a mano)
function sueloDe(nivel, indice) {
  const extra = indice === 0 ? [[0, 2300]] : [];
  const ordenados = [...(nivel.suelo || []), ...extra].sort((a, b) => a[0] - b[0]);
  // une los tramos que se tocan (son suelo continuo)
  const unidos = [];
  ordenados.forEach(([a, b]) => {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && a <= ultimo[1] + 1) ultimo[1] = Math.max(ultimo[1], b);
    else unidos.push([a, b]);
  });
  return unidos;
}

Deno.test("hay 6 niveles con nombre, ancho y meta", () => {
  comprobar(NIVELES.length === 6, `se esperaban 6 niveles y hay ${NIVELES.length}`);
  NIVELES.forEach((n, i) => {
    comprobar(n.nombre, `el nivel ${i + 1} no tiene nombre`);
    comprobar(n.meta > 0 && n.meta < n.ancho, `la meta del nivel ${i + 1} está fuera del nivel`);
  });
});

Deno.test("la arena del jefe está sobre suelo firme (sin lava)", () => {
  NIVELES.forEach((n, i) => {
    const ini = n.meta - ANCHO_ARENA, fin = n.meta;
    const lava = [...(n.lava || []), ...(n.falsos || [])].find(([a, b]) => a < fin && b > ini);
    comprobar(!lava, `nivel ${i + 1}: hay lava en la arena del jefe (${lava})`);
    const cubierto = sueloDe(n, i).some(([a, b]) => a <= ini + 40 && b >= fin);
    comprobar(cubierto, `nivel ${i + 1}: la arena del jefe no tiene suelo continuo`);
  });
});

Deno.test("ningún hueco sin plataformas es más largo que un salto", () => {
  NIVELES.forEach((n, i) => {
    const tramos = sueloDe(n, i);
    for (let k = 1; k < tramos.length; k++) {
      const desde = tramos[k - 1][1], hasta = tramos[k][0];
      const hueco = hasta - desde;
      if (hueco <= SALTO_MAXIMO) continue;
      // un hueco largo necesita plataformas móviles o bloques para cruzarlo
      const ayuda = (n.moviles || []).some(([x]) => x > desde - 150 && x < hasta) ||
        (n.bloques || []).some(([x, y]) => y > 250 && x > desde && x < hasta);
      comprobar(ayuda || i === 0, `nivel ${i + 1}: hueco de ${hueco}px entre ${desde} y ${hasta} sin forma de cruzarlo`);
    }
  });
});

Deno.test("las trampas al azar no aparecen al inicio, en la arena ni junto a los puntos de control", () => {
  NIVELES.forEach((nivel, i) => {
    for (let intento = 0; intento < 50; intento++) {
      const n = aleatorizarNivel(nivel, i, i === 0 ? [[600, 1106]] : []);
      const xs = [
        ...n.pinchos.map((p) => p[0]), ...n.rocas, ...n.monedasTrampa.map((m) => m[0]),
        ...n.estatuasFalsas, ...n.plantas,
      ];
      xs.forEach((x) => {
        comprobar(x >= 350, `nivel ${i + 1}: trampa en el inicio (x=${x})`);
        comprobar(x <= n.meta - ANCHO_ARENA, `nivel ${i + 1}: trampa dentro de la arena del jefe (x=${x})`);
        (n.checkpoints || []).forEach((cp) =>
          comprobar(Math.abs(x - cp) >= 150, `nivel ${i + 1}: trampa pegada al punto de control ${cp} (x=${x})`)
        );
      });
    }
  });
});

Deno.test("la cantidad de trampas aumenta de nivel en nivel (en promedio)", () => {
  const promedios = NIVELES.map((nivel, i) => {
    let total = 0;
    for (let k = 0; k < 40; k++) total += contarTrampas(aleatorizarNivel(nivel, i, i === 0 ? [[600, 1106]] : []));
    return total / 40;
  });
  for (let i = 1; i < promedios.length; i++) {
    comprobar(
      promedios[i] > promedios[i - 1],
      `el nivel ${i + 1} tiene menos trampas (${promedios[i].toFixed(1)}) que el ${i} (${promedios[i - 1].toFixed(1)})`,
    );
  }
});

Deno.test("las monedas y premios están dentro del nivel y sobre el suelo", () => {
  NIVELES.forEach((n, i) => {
    [...(n.monedas || []), ...(n.corazones || []), ...(n.cristales || [])].forEach(([x, y]) => {
      comprobar(x >= 0 && x <= n.ancho, `nivel ${i + 1}: premio fuera del nivel (x=${x})`);
      comprobar(y > 0 && y < SUELO_Y, `nivel ${i + 1}: premio bajo el suelo (y=${y})`);
    });
  });
});
