# Graph Report - Game  (2026-10-15)

## Corpus Check
- 55 files · ~827,075 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 710 nodes · 1721 edges · 38 communities
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e31f72bf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- create
- azar.js
- game.js
- phaser.min.js
- multijugador.js
- ambiente.js
- jefes.js
- niveles.js
- exclude
- completarNivel
- mazmorra.js
- arte.js
- actualizarJugador
- crearSeleccion
- crearEnemigo
- dañarEnemigo
- ajustes.js
- package.json
- historia.js
- cadena.js
- index.js
- servidor/package.json
- rendimiento.js
- Diseñar niveles de Monhabell Aventura
- ExampleInstrumentedTest.java
- iniciarTactil
- MainActivity
- prueba.js
- tienda.js
- gradlew
- escudo.js

## God Nodes (most connected - your core abstractions)
1. `create()` - 76 edges
2. `actualizarJugador()` - 21 edges
3. `killgesi()` - 21 edges
4. `iniciarSala()` - 21 edges
5. `o()` - 20 edges
6. `enLinea()` - 20 edges
7. `construirNivel()` - 17 edges
8. `e()` - 17 edges
9. `r()` - 16 edges
10. `iniciarMenus()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `esperar()` --indirect_call--> `f()`  [INFERRED]
  servidor/prueba.js → phaser.min.js
- `create()` --indirect_call--> `soltarEscudo()`  [INFERRED]
  game.js → escudo.js
- `create()` --indirect_call--> `avisarJefeFx()`  [INFERRED]
  game.js → multijugador.js
- `create()` --indirect_call--> `soyReplica()`  [INFERRED]
  game.js → multijugador.js
- `create()` --calls--> `factorEnemigos()`  [EXTRACTED]
  game.js → ajustes.js

## Import Cycles
- None detected.

## Communities (38 total, 0 thin omitted)

### Community 0 - "create"
Cohesion: 0.07
Nodes (29): estaInvulnerable(), actualizarBarraSalud(), actualizarCorazones(), actualizarRecurso(), apartarEnemigo(), aplicarAjustes(), aplicarDefensa(), caerMuerto() (+21 more)

### Community 1 - "azar.js"
Cohesion: 0.10
Nodes (25): cortarPorMuros(), inalcanzables(), muroEnMedio(), SALTO, seLlega(), SUELO_Y, superficies(), tramosDeBloques() (+17 more)

### Community 2 - "game.js"
Cohesion: 0.07
Nodes (34): createAnimations(), cargarCastillos(), cargarEnemigos(), crearAnimacionesEnemigos(), ENEMIGOS, cargarEscudo(), crearAnimacionesEscudo(), apiJefe (+26 more)

### Community 3 - "phaser.min.js"
Cohesion: 0.35
Nodes (25): a(), b(), c(), d(), e(), f(), g(), h() (+17 more)

### Community 4 - "multijugador.js"
Cohesion: 0.08
Nodes (64): actualizarEnLinea(), avisarBala(), avisarCheckpoint(), avisarEnemigo(), avisarGolpeEnemigo(), avisarJefe(), avisarJefeFx(), avisarMeta() (+56 more)

### Community 5 - "ambiente.js"
Cohesion: 0.08
Nodes (40): actualizarAmbiente(), aplicarNiebla(), bandaNiebla(), cicloNiebla(), configParticulas(), crearAmbiente(), crearFondoAtmosferico(), crearNieblaSeleccion() (+32 more)

### Community 6 - "jefes.js"
Cohesion: 0.12
Nodes (39): zoomCamara(), actualizarJefe(), ANCHO_ARENA, ANIMS, avisar(), aviso(), AVISOS, avisoVisible() (+31 more)

### Community 7 - "niveles.js"
Cohesion: 0.19
Nodes (23): arco(), azar(), fila(), generarNivel(), colocar(), CON_X, extender(), fila() (+15 more)

### Community 8 - "exclude"
Cohesion: 0.22
Nodes (12): fmt, exclude, lint, exclude, rules, exclude, android/, assets/ (+4 more)

### Community 9 - "completarNivel"
Cohesion: 0.18
Nodes (12): vidasMaximas(), abrirSala, animar(), borrarPartida(), completarNivel(), continuarPartida(), encenderFaro(), guardarPartida() (+4 more)

### Community 10 - "mazmorra.js"
Cohesion: 0.08
Nodes (45): actualizarBosque(), crearArbol(), crearBosque(), crearRama(), romperRama(), soltarHojas(), texturas(), agregarCiclo() (+37 more)

### Community 11 - "arte.js"
Cohesion: 0.67
Nodes (5): crearArteOriginal(), lienzo(), PIEDRA, px(), RUNA

### Community 12 - "actualizarJugador"
Cohesion: 0.13
Nodes (20): activarCheckpoint(), actualizarJugador(), actualizarMundo(), armarAscensorTramposo(), atraerMonedas(), avisar(), ejecutarHabilidad(), guardarBolsa() (+12 more)

### Community 13 - "crearSeleccion"
Cohesion: 0.24
Nodes (13): abrirTienda, abrirTiendaFuera(), abrirVestidor, actualizarSeleccion(), animSel(), colorTexto(), crearSeleccion(), empezarJuego() (+5 more)

### Community 14 - "crearEnemigo"
Cohesion: 0.13
Nodes (16): abrirTiendaEnJuego(), activarRuna(), actualizarMonedasHud(), actualizarTrampas(), addToScore(), collectCoin(), crearEnemigo(), crearzombis() (+8 more)

### Community 15 - "dañarEnemigo"
Cohesion: 0.21
Nodes (12): actualizarEnemigo(), atacar(), balaRemota(), congelarEnemigo(), dañarEnemigo(), dispararEnemigo(), enSu(), golpeDeEnemigo() (+4 more)

### Community 16 - "ajustes.js"
Cohesion: 0.15
Nodes (20): ajustes, BOTONES, CAMARAS, DIFICULTADES, factorEnemigos(), GRAFICOS, guardarAjustes(), POR_DEFECTO (+12 more)

### Community 17 - "package.json"
Cohesion: 0.11
Nodes (18): @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, description, devDependencies, @capacitor/android, @capacitor/app (+10 more)

### Community 18 - "historia.js"
Cohesion: 0.08
Nodes (40): moverNieblaSeleccion(), crearFinal(), crearIntro(), avanzar(), mostrar(), terminar(), crearTitulo(), HEROE (+32 more)

### Community 19 - "cadena.js"
Cohesion: 0.35
Nodes (9): actualizarCadena(), anclarJugador1(), arrastrar(), crearCadena(), dibujar(), enSuelo(), moverCompa(), nodo() (+1 more)

### Community 20 - "index.js"
Cohesion: 0.25
Nodes (14): atender(), avisarLista(), difundir(), entrar(), enviar(), latido, limpiarNombre(), lista() (+6 more)

### Community 21 - "servidor/package.json"
Cohesion: 0.13
Nodes (14): dependencies, ws, description, engines, node, main, name, private (+6 more)

### Community 22 - "rendimiento.js"
Cohesion: 0.20
Nodes (10): actualizarCiclos(), compensarZoom(), relojSala(), seguirReloj(), update(), actualizarContadorFps(), fijosEnPantalla(), recortarVista() (+2 more)

### Community 23 - "Diseñar niveles de Monhabell Aventura"
Cohesion: 0.20
Nodes (9): Al terminar, Cómo crear una pieza nueva (tramos.js), Cómo crear una trampa nueva, Diseñar niveles de Monhabell Aventura, Mapa de archivos, Medidas (no inventar: salen de `alcance.js`), Modo equipo (cadena), Reglas de justicia (las comprueba `niveles_test.js`) (+1 more)

### Community 24 - "ExampleInstrumentedTest.java"
Cohesion: 0.33
Nodes (5): ExampleInstrumentedTest, ExampleUnitTest, androidx.test.ext.junit.runners.AndroidJUnit4, org.junit.runner.RunWith, org.junit.Test

### Community 25 - "iniciarTactil"
Cohesion: 0.33
Nodes (7): esTactil(), iniciarTactil(), escalaBotones(), moverJoy(), soltarJoy(), tecla(), TECLA

### Community 26 - "MainActivity"
Cohesion: 0.43
Nodes (4): MainActivity, android.os.Bundle, com.getcapacitor.BridgeActivity, Override

### Community 27 - "prueba.js"
Cohesion: 0.25
Nodes (6): empA, empB, esperar(), listaA, llega, sale

### Community 28 - "tienda.js"
Cohesion: 0.12
Nodes (32): usarRunaDeReserva(), crearSenales(), destello(), granoDePolvo(), piedrita(), reducirMovimiento(), alternarEquipo(), cantidad() (+24 more)

### Community 29 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 37 - "escudo.js"
Cohesion: 0.38
Nodes (9): actualizarEscudo(), crearEscudo(), crearTexturaAura(), destellarAura(), dibujarCarga(), mostrarEscudo(), recuperarEscudo(), romperEscudo() (+1 more)

## Knowledge Gaps
- **97 isolated node(s):** `POR_DEFECTO`, `SUELO_Y`, `PALETAS`, `NIEBLA_BASE`, `MINIMO_TRAMPAS` (+92 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `create()` connect `create` to `azar.js`, `game.js`, `phaser.min.js`, `multijugador.js`, `ambiente.js`, `jefes.js`, `escudo.js`, `completarNivel`, `mazmorra.js`, `actualizarJugador`, `crearEnemigo`, `dañarEnemigo`, `ajustes.js`, `historia.js`, `cadena.js`, `rendimiento.js`, `tienda.js`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `iniciarSala()` connect `multijugador.js` to `game.js`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `f()` connect `phaser.min.js` to `prueba.js`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `create()` (e.g. with `game.js` and `soltarEscudo()`) actually correct?**
  _`create()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `o()` (e.g. with `a()` and `c()`) actually correct?**
  _`o()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `POR_DEFECTO`, `SUELO_Y`, `PALETAS` to the rest of the system?**
  _97 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create` be split into smaller, more focused modules?**
  _Cohesion score 0.07396870554765292 - nodes in this community are weakly interconnected._