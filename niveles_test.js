// Pruebas de los niveles (se ejecutan con `deno test`, también en GitHub Actions).
// Revisan que todos los niveles se puedan jugar y que las trampas al azar respeten las reglas.

import { NIVELES, SUELO_Y } from "./niveles.js";
import { aleatorizarNivel, contarTrampas } from "./azar.js";
import { REGIONES, eventosDeRegion, LIBRE_ANTES_DEL_JEFE, OSCURIDAD_MAXIMA } from "./regiones.js";

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

// ---------- Trampas al azar pero justas ----------

const extraDe = (i) => (i === 0 ? [[600, 1106]] : []);
const trampasDeSuelo = (n) => [
  ...n.pinchos.map((p) => p[0]), ...n.rocas, ...n.monedasTrampa.map((m) => m[0]),
  ...n.estatuasFalsas, ...n.plantas, ...n.emboscadas.map((e) => e[0]), ...(n.cebos || []).map((c) => c[0]),
];

Deno.test("la misma semilla da el mismo reparto (para reproducir errores)", () => {
  NIVELES.forEach((nivel, i) => {
    const a = aleatorizarNivel(nivel, i, extraDe(i), 12345);
    const b = aleatorizarNivel(nivel, i, extraDe(i), 12345);
    comprobar(JSON.stringify(a) === JSON.stringify(b), `nivel ${i + 1}: la semilla 12345 no se repite igual`);
  });
});

Deno.test("cada intento es distinto: semillas distintas dan repartos distintos", () => {
  NIVELES.forEach((nivel, i) => {
    const vistos = new Set();
    for (let s = 1; s <= 20; s++) vistos.add(JSON.stringify(trampasDeSuelo(aleatorizarNivel(nivel, i, extraDe(i), s))));
    comprobar(vistos.size >= 15, `nivel ${i + 1}: solo ${vistos.size} repartos distintos en 20 intentos`);
  });
});

Deno.test("no hay trampas donde reapareces ni en la antesala del jefe", () => {
  NIVELES.forEach((nivel, i) => {
    for (let s = 1; s <= 50; s++) {
      const n = aleatorizarNivel(nivel, i, extraDe(i), s);
      trampasDeSuelo(n).forEach((x) => {
        (n.checkpoints || []).forEach((cp) =>
          comprobar(x <= cp - 150 || x >= cp + 260, `nivel ${i + 1}: trampa en la reaparición del punto ${cp} (x=${x}, semilla ${s})`)
        );
        comprobar(x <= n.meta - 1010 - 450, `nivel ${i + 1}: trampa en la antesala del jefe (x=${x}, semilla ${s})`);
        (n.descansos || []).forEach(([a, b]) =>
          comprobar(x < a || x > b, `nivel ${i + 1}: trampa dentro de un descanso [${a}, ${b}] (x=${x}, semilla ${s})`)
        );
      });
    }
  });
});

Deno.test("entre dos trampas de suelo hay espacio para reaccionar", () => {
  NIVELES.forEach((nivel, i) => {
    for (let s = 1; s <= 50; s++) {
      const xs = trampasDeSuelo(aleatorizarNivel(nivel, i, extraDe(i), s)).sort((a, b) => a - b);
      for (let k = 1; k < xs.length; k++) {
        comprobar(xs[k] - xs[k - 1] >= 150, `nivel ${i + 1}: trampas a ${xs[k] - xs[k - 1]}px (x=${xs[k - 1]} y ${xs[k]}, semilla ${s})`);
      }
    }
  });
});

Deno.test("los bloques invisibles tienen un tope por nivel", () => {
  NIVELES.forEach((nivel, i) => {
    const originales = (nivel.bloques || []).reduce((a, [, , p]) => a + [...p].filter((c) => c === "H").length, 0);
    for (let s = 1; s <= 50; s++) {
      const n = aleatorizarNivel(nivel, i, extraDe(i), s);
      const h = n.bloques.reduce((a, [, , p]) => a + [...p].filter((c) => c === "H").length, 0);
      comprobar(h <= Math.max(originales, 1 + Math.floor(i / 2)), `nivel ${i + 1}: ${h} bloques invisibles (semilla ${s})`);
    }
  });
});

Deno.test("pinchos, plantas y cebos que se toman saltando no quedan junto a bloques bajos", () => {
  NIVELES.forEach((nivel, i) => {
    const zonas = (nivel.bloques || []).filter(([, y]) => y >= 200).map(([x, , p]) => [x - 100, x + p.length * 32 + 180]);
    for (let s = 1; s <= 50; s++) {
      const n = aleatorizarNivel(nivel, i, extraDe(i), s);
      const ceboSaltando = (n.cebos || []).filter((c) => c[2] !== "mimico").map((c) => c[0]);
      [...n.pinchos.map((p) => p[0]), ...n.plantas, ...ceboSaltando].forEach((x) => {
        const z = zonas.find(([a, b]) => x >= a && x <= b);
        comprobar(!z, `nivel ${i + 1}: trampa de salto bajo bloques [${z}] (x=${x}, semilla ${s})`);
      });
    }
  });
});

Deno.test("los cebos de suelo dejan un hueco que se puede saltar y tienen lava debajo", () => {
  NIVELES.forEach((nivel, i) => {
    for (let s = 1; s <= 50; s++) {
      const n = aleatorizarNivel(nivel, i, extraDe(i), s);
      (n.cebos || []).filter((c) => c[2] === "suelo").forEach(([x]) => {
        comprobar(n.falsos.some(([a, b]) => a === x - 48 && b === x + 48), `nivel ${i + 1}: cebo de suelo sin suelo falso (x=${x}, semilla ${s})`);
        comprobar(!n.suelo.some(([a, b]) => a < x + 48 && b > x - 48), `nivel ${i + 1}: suelo firme encima del cebo (x=${x}, semilla ${s})`);
      });
      if (i === 0) comprobar((n.cebos || []).every((c) => c[2] === "techo"), `nivel 1: cebo que no es de techo (semilla ${s})`);
      // los cebos que se toman saltando tienen suelo firme donde aterrizar
      if (i > 0) {
        (n.cebos || []).filter((c) => c[2] !== "mimico").forEach(([x]) => {
          const ok = n.suelo.some(([a, b]) => x + 48 <= a + 1 && x + 300 <= b) || n.suelo.some(([a, b]) => x - 120 >= a && x + 300 <= b);
          comprobar(ok, `nivel ${i + 1}: cebo de salto sin suelo para aterrizar (x=${x}, semilla ${s})`);
        });
      }
    }
  });
});

// ---------- Ambiente por región ----------

Deno.test("cada nivel tiene su región y ninguna oscuridad tapa todo", () => {
  comprobar(REGIONES.length >= NIVELES.length, `hay ${NIVELES.length} niveles y solo ${REGIONES.length} regiones`);
  REGIONES.forEach((r) => comprobar(r.oscuridad <= OSCURIDAD_MAXIMA, `${r.nombre}: oscuridad ${r.oscuridad} mayor que el máximo`));
});

Deno.test("los momentos fuertes son pocos, separados y lejos del jefe", () => {
  comprobar(REGIONES[0].eventos.length === 0, "el primer nivel es para aprender: sin apagones ni niebla densa");
  NIVELES.forEach((nivel, i) => {
    const r = REGIONES[i];
    const evs = eventosDeRegion(r, nivel.meta).sort((a, b) => a.x - b.x);
    comprobar(evs.filter((e) => e.tipo === "apagon").length <= 1, `${r.nombre}: más de un apagón`);
    evs.forEach((e) => comprobar(e.x < nivel.meta - LIBRE_ANTES_DEL_JEFE, `${r.nombre}: evento en x=${e.x}, demasiado cerca del jefe`));
    for (let k = 1; k < evs.length; k++) {
      comprobar(evs[k].x - evs[k - 1].x >= 2000, `${r.nombre}: dos eventos a solo ${evs[k].x - evs[k - 1].x}px`);
    }
  });
});
