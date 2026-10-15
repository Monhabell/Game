---
name: disenar-niveles
description: Diseña o modifica niveles, tramos (piezas de nivel) y trampas de "Monhabell Aventura: La Noche Eterna" (Phaser 3) respetando las medidas de salto, las reglas de justicia, el ritmo y la identidad de cada región. Úsala siempre que se pida un nivel nuevo, alargar o rediseñar un nivel, una pieza nueva para tramos.js, una trampa nueva, un tramo de equipo (modo cadena) o "que los mapas se sientan distintos".
---

# Diseñar niveles de Monhabell Aventura

El juego es un plataformas troll (al estilo de los juegos que engañan al jugador, pero con ideas
propias): cada nivel debe sorprender, ser JUSTO (toda trampa avisa y da tiempo) y sentirse distinto
del anterior. Las trampas cambian de lugar en cada intento (semilla), así que el jugador aprende
CÓMO se ven, no DÓNDE están.

## Mapa de archivos

| Archivo | Qué hay |
|---|---|
| `niveles.js` | Los 6 niveles. Documenta TODOS los campos de un nivel (comentario inicial). 1–4 hechos a mano y alargados con `extender()`; 5–6 con `generarNivel()` |
| `tramos.js` | Piezas reutilizables (`tramoLlano`, `tramoTunel`, `tramoTorre`, `tramoPuentesAltos`, `tramoDobleCamino`, `tramoAbismoRunico`, `tramoRamas`, `tramoArbolAnciano`...) y `colocar` / `extender` |
| `azar.js` | Reparto al azar de trampas en cada intento + reglas de justicia + cuotas (`MINIMO_TRAMPAS`, `LOCURAS_POR_NIVEL`) |
| `sorpresas.js`, `locuras.js` | Comportamiento de las trampas troll (crear + actualizar) |
| `bosque.js` (y futuros módulos por región) | Piezas propias de cada región (ramas que se doblan, Árbol Anciano) |
| `senales.js` | La pista visual de cada trampa |
| `alcance.js` | Medidas de salto y comprobación de que se llega a todo |
| `regiones.js`, `ambiente.js` | Región de cada nivel: oscuridad, partículas, niebla, eventos |
| `game.js` | `construirNivel` dibuja cada campo; `crearEnemigo` (con separación y turnos al caer del cielo), `killgesi`, etc. |
| `cadena.js`, `multijugador.js` | Modo equipo: jugadores atados por una cadena de 170 px, vidas compartidas |
| `niveles_test.js` | Pruebas de justicia y alcance |

## Medidas (no inventar: salen de `alcance.js`)

- Suelo: parte de arriba en **y = 332**. Pantalla interna 790×380. Hacia arriba, y negativa + campo `alto`.
- Salto más corto (Leo/Zeno sin doble salto): sube **128 px**, cruza **220 px** a la misma altura, **150 px** subiendo al máximo.
- Escalones de torre: 96 px de alto entre plataformas.
- Bloques: fila baja y = 232 (se golpea desde el suelo), fila alta y = 136.
- Túnel: techo en y = 196 (quedan 136 px: casi no se salta). Sin trampas de suelo dentro.
- Velocidad de carrera 220 px/s: un aviso de 200 px da ~0,9 s para reaccionar.
- Cadena del modo equipo: 170 px. Un mecanismo para dos (placas, palancas) va a ≤ 170 px o exige soltarse.
- Cada nivel debe ser más largo que el anterior (lo comprueban las pruebas): revisa los anchos antes de alargar uno.

## Reglas de justicia (las comprueba `niveles_test.js`)

1. Sin trampas en: los primeros 450 px, 150 px antes / 260 px después de cada punto de control, la antesala del jefe (450 px antes de la arena) y los tramos de descanso.
2. Separación entre trampas: `max(150, 200 − 10·nivel)` px.
3. Nada que se esquive saltando (pinchos, plantas, cebos) debajo o justo después de un techo bajo.
4. Ningún hueco sin plataformas más largo que un salto; todo se alcanza con el salto más corto.
5. Máximo 3500 px sin punto de control; los puntos de control siempre sobre suelo firme.
6. Antes de cada túnel, ≥ 300 px de suelo firme.
7. Toda trampa tiene SEÑAL: las de reacción (rocas, pinchos, enemigos del cielo) avisan claro; las de engaño (bloques falsos, estatuas, cebos) dan una pista sutil de vez en cuando (`senales.js`).
8. Enemigos: nunca amontonados (`SEPARACION_ENEMIGOS`, `MAXIMO_CERCA` en game.js). Una horda solo si es a propósito y anunciada.

## Ritmo de un nivel (lo que evita que "todos se sientan iguales")

Un nivel no es una fila de piezas al azar. Usa esta estructura y escríbela como comentario sobre el nivel:

1. **Introducción** (llano seguro): presenta la novedad del nivel sin peligro.
2. **Desafío**: la novedad con una trampa conocida.
3. **Descanso**: monedas, un corazón, un secreto opcional.
4. **Momento ¡wow!**: un lugar memorable y único del nivel (Árbol Anciano, cascada de lava, templo, puente que se derrumba en escena).
5. **Desafío fuerte**: la novedad combinada con lo aprendido antes.
6. **Antesala tranquila** y **jefe**.

Además, cada nivel debe tener:
- Al menos una **subida y bajada** (no solo ir a la derecha) y una **ruta alternativa** (arriba con premio / abajo directa).
- Uno o dos **secretos** (cornisa oculta, bloque invisible con premio).
- Algo que solo exista en **esa región**:

| Región | Piezas propias (ideas) |
|---|---|
| Bosque (hecho) | ramas que se doblan, Árbol Anciano, troncos que ruedan, setas trampolín |
| Cueva de lava | vagonetas, lagos subterráneos, estalactitas |
| Puentes | puentes colgantes que se balancean, viento |
| Fortaleza | rejas, cañones, pasillos con guardias |
| Volcán | plataformas que se hunden, géiseres, erupciones |
| Nubes | nubes que desaparecen, viento constante, gravedad loca |

## Cómo crear una pieza nueva (tramos.js)

1. Función `tramoNombre(opciones)` que devuelve datos en coordenadas RELATIVAS (x = 0 al empezar) + `ancho` (y `alto` si sube).
2. Usa solo campos que `construirNivel` ya dibuja; si necesitas uno nuevo, agrégalo a `CON_X`, `SOLO_X` o `RANGOS` en tramos.js (para que `colocar` y `extender` lo desplacen) y dibújalo en game.js o en el módulo de la región.
3. Variantes de un campo existente con un 4.º elemento de tipo (como `[x, arriba, ancho, 'rama']` en `plataformas`): así el alcance y las pruebas las cuentan sin cambios.
4. Comentario arriba: qué enseña la pieza y por qué es justa (medidas).
5. Úsala en `extender(NIVELES[i], x, [...])` (niveles hechos a mano) o en `TRAMOS_ESPECIALES` de `generarNivel`.
6. Si la pieza tiene sitios donde una trampa sería injusta (donde se espera un ascensor, etc.), exclúyelos en `azar.js`.

## Cómo crear una trampa nueva

- Comportamiento en `locuras.js` (`CREAR` + `ACTUALIZAR`), reparto en `azar.js` (`LUGAR` con sus condiciones de suelo firme / zonas a evitar), pista en `senales.js` si es de engaño.
- Mensaje burlón corto en mayúsculas (`¡ERA UN MÍMICO!`). Original: inspirada en el género, nunca copiada.
- En línea, las trampas las activa cualquier jugador; los enemigos los crea el anfitrión.

## Modo equipo (cadena)

- Solo: el mapa no cambia. En equipo: el mismo nivel recibe tramos de equipo extra (argollas, puertas con contrapeso, placas dobles, suelo que aguanta a uno) y trampas para la cadena.
- Un tramo de equipo debe poder resolverse con 2 jugadores y escalar con hasta 8 (por ejemplo, "se necesitan N en las placas").

## Al terminar

- game.js e index.html usan CRLF; los demás archivos, LF. Edita sin cambiar los finales de línea.
- Pruebas: el usuario prefiere probar él mismo para ahorrar tokens. NO ejecutes pruebas ni el navegador salvo que lo pida; como mucho, `node --check archivo.js`.
- Ejecuta `graphify update .`.
- ZIP para itch.io: `index.html` + todos los `*.js` (menos `*_test.js`) + TODA la carpeta `assets` (no una lista vieja: faltarían imágenes nuevas y Phaser dibuja un cuadro verde).
- Recuerda al usuario hacer commit: los cambios sin commit se pierden si se descartan.
- Explica al usuario, en español y breve, qué cambió y qué debería probar.
