// Pruebas de los niveles (se ejecutan con `deno test`, también en GitHub Actions).
// Revisan que todos los niveles se puedan jugar y que las trampas al azar respeten las reglas.

import { NIVELES, SUELO_Y } from "./niveles.js";
import { aleatorizarNivel, contarTrampas } from "./azar.js";
import { REGIONES, eventosDeRegion, LIBRE_ANTES_DEL_JEFE, OSCURIDAD_MAXIMA } from "./regiones.js";
import { inalcanzables, seLlega, SALTO } from "./alcance.js";

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
      const losas = (n.runas || []).flatMap(([, , l]) => l);
      const ayuda = (n.moviles || []).some(([x]) => x > desde - 150 && x < hasta) ||
        (n.bloques || []).some(([x, y]) => y > 250 && x > desde && x < hasta) ||
        [...(n.plataformas || []), ...losas].some(([x]) => x >= desde - 50 && x < hasta); // puentes altos y losas de runa
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
      // los niveles con altura crecen hacia arriba (y negativa) hasta -alto
      comprobar(y > -(n.alto || 0) && y < SUELO_Y, `nivel ${i + 1}: premio fuera del nivel en altura (y=${y})`);
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

Deno.test("pinchos, plantas y cebos que se toman saltando no quedan junto a techos bajos", () => {
  NIVELES.forEach((nivel, i) => {
    // techos bajos: filas de bloques bajos, plataformas a poca altura y piedras rúnicas
    const techos = [
      ...(nivel.bloques || []).filter(([, y]) => y >= 200).map(([x, , p]) => [x, x + p.length * 32]),
      ...(nivel.plataformas || []).filter(([, arriba]) => arriba >= 150 && arriba < 320).map(([x, , ancho]) => [x, x + ancho]),
      ...(nivel.runas || []).map(([x]) => [x - 40, x + 72]),
    ];
    const zonas = techos.map(([a, b]) => [a - 100, b + 180]);
    for (let s = 1; s <= 50; s++) {
      const n = aleatorizarNivel(nivel, i, extraDe(i), s);
      const ceboSaltando = (n.cebos || []).filter((c) => c[2] !== "mimico").map((c) => c[0]);
      // cada pincho del grupo cuenta (un grupo de dos ocupa 64 px)
      const pinchos = n.pinchos.flatMap(([x, cuantos]) => Array.from({ length: cuantos }, (_, k) => x + k * 32));
      [...pinchos, ...n.plantas, ...ceboSaltando].forEach((x) => {
        const z = zonas.find(([a, b]) => x >= a && x <= b);
        comprobar(!z, `nivel ${i + 1}: trampa de salto bajo un techo bajo [${z}] (x=${x}, semilla ${s})`);
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

// ---------- Niveles con altura: ¿se llega a todo? ----------

Deno.test("alcance: reconoce lo que se puede y lo que no se puede subir", () => {
  const sup = (x0, x1, top) => ({ x0, x1, top });
  comprobar(seLlega(sup(0, 200, 332), sup(300, 400, 332 - 96)), "un escalón de 96 px con 100 px de hueco debería alcanzarse");
  comprobar(!seLlega(sup(0, 200, 332), sup(250, 400, 332 - SALTO.alto - 20)), "algo más alto que el salto no debería alcanzarse");
  comprobar(!seLlega(sup(0, 200, 332), sup(450, 600, 332 - 100)), "un hueco de 250 px subiendo 100 no debería alcanzarse");
  comprobar(!seLlega(sup(0, 200, 332), sup(-20, 220, 332 - 96)), "una plataforma justo encima, sin borde para saltar, no debería alcanzarse");
  comprobar(seLlega(sup(0, 300, 332), sup(0, 200, 332 - 96)), "si el suelo asoma 100 px fuera de la plataforma, se puede subir");
  comprobar(seLlega(sup(0, 200, 100), sup(300, 500, 332)), "bajar siempre se puede si el hueco se salta");
  // una torre de prueba: escalones de 96 px que suben 600 px en zigzag
  const torre = { suelo: [[0, 1000]], plataformas: [], meta: 900 };
  for (let i = 1; i <= 6; i++) torre.plataformas.push([i % 2 ? 120 : 330, 332 - i * 96, 140]);
  comprobar(inalcanzables(torre).length === 0, "la torre en zigzag debería poder subirse entera");
  torre.plataformas.push([600, 332 - 7 * 96 - 60, 100]);
  comprobar(inalcanzables(torre).length === 1, "una plataforma colgada demasiado alto debería detectarse");
});

Deno.test("alcance: un muro alto corta el paso y solo se cruza subiendo por encima", () => {
  const conMuro = { suelo: [[0, 1000]], muros: [[500, 332 - 300, 80]], plataformas: [] };
  comprobar(inalcanzables(conMuro).some((t) => t.x0 >= 580), "sin forma de subir, el otro lado del muro no debería alcanzarse");
  // escalones de 100 px hasta la cima del muro
  conMuro.plataformas = [[300, 232, 120], [380, 132, 100]];
  comprobar(inalcanzables(conMuro).length === 0, "con escalones hasta la cima, se debería poder cruzar el muro");
});

Deno.test("en todos los niveles se llega a todas las superficies (con el salto más corto)", () => {
  NIVELES.forEach((nivel, i) => {
    const no = inalcanzables(nivel, { sueloExtra: i === 0 ? [[0, 2300]] : [] });
    comprobar(no.length === 0, `nivel ${i + 1}: no se llega a ${no.map((t) => `${t.tipo} [${t.x0}-${t.x1}] a y=${t.top}`).join(", ")}`);
  });
});

Deno.test("las runas se pueden golpear desde abajo y su abismo no se cruza sin ellas", () => {
  let total = 0;
  NIVELES.forEach((nivel, i) => {
    (nivel.runas || []).forEach(([x, y, losas]) => {
      total++;
      const bajo = (nivel.suelo || []).find(([a, b]) => a <= x - 40 && b >= x + 72);
      comprobar(bajo, `nivel ${i + 1}: la runa en x=${x} no tiene suelo firme debajo para golpearla`);
      const tapa = (nivel.bloques || []).some(([bx, by, p]) => by >= 200 && bx < x + 72 && bx + p.length * 32 > x - 40);
      comprobar(!tapa, `nivel ${i + 1}: hay bloques pegados a la runa en x=${x}`);
      const ini = Math.min(...losas.map(([lx]) => lx)), fin = Math.max(...losas.map(([lx, , a]) => lx + a));
      const orillaIzq = Math.max(...(nivel.suelo || []).filter(([, b]) => b <= ini).map(([, b]) => b));
      const orillaDer = Math.min(...(nivel.suelo || []).filter(([a]) => a >= fin).map(([a]) => a));
      comprobar(orillaDer - orillaIzq > SALTO.largo, `nivel ${i + 1}: el abismo de la runa en x=${x} se puede saltar sin activarla`);
    });
  });
  comprobar(total >= 3, `se esperaban al menos 3 runas (Volcán y Nubes) y hay ${total}`);
});

// ---------- Niveles más largos y túneles ----------

Deno.test("cada nivel es más largo que el anterior", () => {
  for (let i = 1; i < NIVELES.length; i++) {
    comprobar(NIVELES[i].ancho > NIVELES[i - 1].ancho, `el nivel ${i + 1} (${NIVELES[i].ancho}px) no es más largo que el ${i} (${NIVELES[i - 1].ancho}px)`);
  }
});

Deno.test("nunca hay más de 3500 px sin un punto de control (hasta la arena del jefe)", () => {
  NIVELES.forEach((n, i) => {
    const puntos = [0, ...(n.checkpoints || []).filter((x) => x < n.meta - ANCHO_ARENA), n.meta - ANCHO_ARENA].sort((a, b) => a - b);
    for (let k = 1; k < puntos.length; k++) {
      comprobar(puntos[k] - puntos[k - 1] <= 3500, `nivel ${i + 1}: ${puntos[k] - puntos[k - 1]}px sin punto de control (de ${puntos[k - 1]} a ${puntos[k]})`);
    }
  });
});

Deno.test("en los túneles cabe el personaje y no hay trampas de suelo", () => {
  NIVELES.forEach((nivel, i) => {
    (nivel.techos || []).forEach(([a, b, abajo]) => comprobar(SUELO_Y - abajo >= 120, `nivel ${i + 1}: túnel [${a}-${b}] demasiado bajo`));
    for (let s = 1; s <= 30; s++) {
      const n = aleatorizarNivel(nivel, i, extraDe(i), s);
      trampasDeSuelo(n).forEach((x) => (nivel.techos || []).forEach(([a, b]) =>
        comprobar(x < a - 60 || x > b + 500, `nivel ${i + 1}: trampa en el túnel [${a}-${b}] o a su salida (x=${x}, semilla ${s})`)
      ));
    }
  });
});

Deno.test("los puntos de control están sobre suelo firme (nunca sobre lava ni suelo falso)", () => {
  NIVELES.forEach((n, i) => {
    (n.checkpoints || []).forEach((cp) => {
      const firme = sueloDe(n, i).some(([a, b]) => cp >= a + 20 && cp <= b - 20);
      const peligro = [...(n.lava || []), ...(n.falsos || [])].some(([a, b]) => cp > a - 20 && cp < b + 20);
      comprobar(firme && !peligro, `nivel ${i + 1}: punto de control en x=${cp} no está sobre suelo firme`);
    });
  });
});

Deno.test("antes de cada túnel hay al menos 300 px de suelo firme (no se entra saltando un foso)", () => {
  NIVELES.forEach((n, i) => {
    (n.techos || []).forEach(([a]) => {
      const firme = sueloDe(n, i).some(([p, q]) => p <= a - 300 && q >= a);
      const peligro = [...(n.lava || []), ...(n.falsos || [])].some(([p, q]) => q > a - 300 && p < a);
      comprobar(firme && !peligro, `nivel ${i + 1}: el túnel en x=${a} no tiene 300 px de suelo firme antes`);
    });
  });
});
