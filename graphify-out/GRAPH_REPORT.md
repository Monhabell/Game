# Graph Report - Game  (2026-10-15)

## Corpus Check
- 60 files · ~1,073,817 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 909 nodes · 2363 edges · 39 communities
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e1f10455`
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
- arena.js
- mazmorra.js
- arte.js
- actualizarJugador
- golpearBloque
- enemigos.js
- dañarEnemigo
- voz.js
- package.json
- historia.js
- sala.js
- index.js
- servidor/package.json
- ejecutarHabilidad
- Diseñar niveles de Monhabell Aventura
- ExampleInstrumentedTest.java
- iniciarTactil
- MainActivity
- crearEnemigo
- poderes.js
- gradlew
- escudo.js
- crearSeleccion

## God Nodes (most connected - your core abstractions)
1. `create()` - 88 edges
2. `enviarEvento()` - 35 edges
3. `enLinea()` - 27 edges
4. `iniciarSala()` - 26 edges
5. `killgesi()` - 25 edges
6. `actualizarJugador()` - 24 edges
7. `o()` - 20 edges
8. `construirNivel()` - 17 edges
9. `e()` - 17 edges
10. `iniciarMenus()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `create()` --indirect_call--> `soltarEscudo()`  [INFERRED]
  game.js → escudo.js
- `create()` --indirect_call--> `avisarJefeFx()`  [INFERRED]
  game.js → multijugador.js
- `create()` --indirect_call--> `soyReplica()`  [INFERRED]
  game.js → multijugador.js
- `iniciarVoz()` --indirect_call--> `boton()`  [INFERRED]
  voz.js → menu.js
- `esperar()` --indirect_call--> `f()`  [INFERRED]
  servidor/prueba.js → phaser.min.js

## Import Cycles
- None detected.

## Communities (39 total, 0 thin omitted)

### Community 0 - "create"
Cohesion: 0.08
Nodes (29): estaInvulnerable(), actualizarBarraSalud(), actualizarCorazones(), actualizarRecurso(), apartarEnemigo(), aplicarAjustes(), aplicarDefensa(), caerMuerto() (+21 more)

### Community 1 - "azar.js"
Cohesion: 0.18
Nodes (16): aleatorizarNivel(), alturaSobreSuelo(), azar(), BURLAS_CARTEL, CEBOS, contarTrampas(), crearAzar(), CUANTAS_LOCURAS (+8 more)

### Community 2 - "game.js"
Cohesion: 0.07
Nodes (37): createAnimations(), cargarCastillos(), cargarEscudo(), crearAnimacionesEscudo(), actualizarCiclos(), apiJefe, apiSorpresas, botonAgrandar (+29 more)

### Community 3 - "phaser.min.js"
Cohesion: 0.22
Nodes (31): a(), b(), c(), d(), e(), f(), g(), h() (+23 more)

### Community 4 - "multijugador.js"
Cohesion: 0.10
Nodes (46): colorDe(), esRival(), actualizarArgollas(), actualizarMecanismos(), crearMecanismos(), jugadores(), necesarios(), piesDeTodos() (+38 more)

### Community 5 - "ambiente.js"
Cohesion: 0.07
Nodes (44): cortarPorMuros(), inalcanzables(), muroEnMedio(), SALTO, seLlega(), SUELO_Y, superficies(), tramosDeBloques() (+36 more)

### Community 6 - "jefes.js"
Cohesion: 0.11
Nodes (40): zoomCamara(), actualizarJefe(), ANCHO_ARENA, ANIMS, avisar(), aviso(), AVISOS, avisoVisible() (+32 more)

### Community 7 - "niveles.js"
Cohesion: 0.15
Nodes (28): nivelEnEquipo(), TRAMOS_EQUIPO, arco(), azar(), fila(), generarNivel(), NIVELES, colocar() (+20 more)

### Community 8 - "exclude"
Cohesion: 0.22
Nodes (12): fmt, exclude, lint, exclude, rules, exclude, android/, assets/ (+4 more)

### Community 9 - "arena.js"
Cohesion: 0.07
Nodes (64): actualizarArena(), actualizarOjos(), anotarResultado(), apagon(), arenaDisponible(), arenaMuerte(), asomarTroll(), azar() (+56 more)

### Community 10 - "mazmorra.js"
Cohesion: 0.08
Nodes (44): actualizarBosque(), crearArbol(), crearBosque(), crearRama(), romperRama(), soltarHojas(), texturas(), agregarCiclo() (+36 more)

### Community 11 - "arte.js"
Cohesion: 0.67
Nodes (5): crearArteOriginal(), lienzo(), PIEDRA, px(), RUNA

### Community 12 - "actualizarJugador"
Cohesion: 0.10
Nodes (25): activarCheckpoint(), activarRuna(), actualizarJugador(), actualizarMundo(), animar(), armarAscensorTramposo(), atraerMonedas(), completarNivel() (+17 more)

### Community 13 - "golpearBloque"
Cohesion: 0.22
Nodes (10): soltarCorazon(), actualizarMonedasHud(), addToScore(), collectCoin(), derrumbarSuelo(), golpearBloque(), matarEnemigo(), sumarABolsa() (+2 more)

### Community 14 - "enemigos.js"
Cohesion: 0.25
Nodes (6): arenaActiva(), cargarEnemigos(), crearAnimacionesEnemigos(), ENEMIGOS, enemigosDelNivel(), precargarNivel()

### Community 15 - "dañarEnemigo"
Cohesion: 0.24
Nodes (11): golpearRival(), actualizarEnemigo(), atacar(), balaRemota(), congelarEnemigo(), dañarEnemigo(), enSu(), golpeDeEnemigo() (+3 more)

### Community 16 - "voz.js"
Cohesion: 0.07
Nodes (48): ajustes, BOTONES, CAMARAS, DIFICULTADES, esMovil, factorEnemigos(), GRAFICOS, guardarAjustes() (+40 more)

### Community 17 - "package.json"
Cohesion: 0.11
Nodes (18): @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, description, devDependencies, @capacitor/android, @capacitor/app (+10 more)

### Community 18 - "historia.js"
Cohesion: 0.09
Nodes (41): crearNieblaSeleccion(), moverNieblaSeleccion(), actualizarCadena(), actualizarColgado(), anclarJugador1(), arrastrar(), crearCadena(), dibujar() (+33 more)

### Community 19 - "sala.js"
Cohesion: 0.07
Nodes (59): APUESTAS, ARENAS, COLORES_EQUIPO, atender(), avisar(), conectar(), crearSala(), direccion() (+51 more)

### Community 20 - "index.js"
Cohesion: 0.19
Nodes (18): APUESTAS, ARENAS, atender(), avisarLista(), difundir(), entrar(), enviar(), latido (+10 more)

### Community 21 - "servidor/package.json"
Cohesion: 0.13
Nodes (14): dependencies, ws, description, engines, node, main, name, private (+6 more)

### Community 22 - "ejecutarHabilidad"
Cohesion: 0.40
Nodes (5): avisar(), ejecutarHabilidad(), pagarCosto(), usarHabilidad(), golpearJefeEnZona()

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

### Community 27 - "crearEnemigo"
Cohesion: 0.50
Nodes (5): actualizarTrampas(), crearEnemigo(), crearzombis(), descartarEnemigo(), soyReplica()

### Community 28 - "poderes.js"
Cohesion: 0.06
Nodes (90): usarRunaDeReserva(), actualizarPoderes(), asegurar(), BUCLE, C, cargarPoderes(), centro(), claveEfecto() (+82 more)

### Community 29 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 37 - "escudo.js"
Cohesion: 0.38
Nodes (9): actualizarEscudo(), crearEscudo(), crearTexturaAura(), destellarAura(), dibujarCarga(), mostrarEscudo(), recuperarEscudo(), romperEscudo() (+1 more)

### Community 38 - "crearSeleccion"
Cohesion: 0.14
Nodes (20): vidasMaximas(), abrirTienda, abrirTiendaEnJuego(), abrirTiendaFuera(), abrirVestidor, actualizarSeleccion(), animSel(), borrarPartida() (+12 more)

## Knowledge Gaps
- **120 isolated node(s):** `POR_DEFECTO`, `SUELO_Y`, `PALETAS`, `ESPERA_NIEBLA`, `DURA_NIEBLA` (+115 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `create()` connect `create` to `azar.js`, `game.js`, `phaser.min.js`, `multijugador.js`, `ambiente.js`, `jefes.js`, `niveles.js`, `arena.js`, `mazmorra.js`, `actualizarJugador`, `golpearBloque`, `enemigos.js`, `dañarEnemigo`, `voz.js`, `historia.js`, `sala.js`, `ejecutarHabilidad`, `crearEnemigo`, `poderes.js`, `escudo.js`, `crearSeleccion`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `iniciarSala()` connect `sala.js` to `game.js`, `multijugador.js`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `create()` (e.g. with `game.js` and `soltarEscudo()`) actually correct?**
  _`create()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `POR_DEFECTO`, `SUELO_Y`, `PALETAS` to the rest of the system?**
  _120 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06565656565656566 - nodes in this community are weakly interconnected._
- **Should `multijugador.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10460992907801418 - nodes in this community are weakly interconnected._