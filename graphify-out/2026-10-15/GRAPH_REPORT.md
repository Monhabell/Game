# Graph Report - Game  (2026-10-15)

## Corpus Check
- 60 files · ~1,071,457 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 876 nodes · 2266 edges · 38 communities
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 93 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `425576da`
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
- golpearBloque
- enemigos.js
- dañarEnemigo
- ajustes.js
- package.json
- vestidor.js
- sala.js
- index.js
- servidor/package.json
- arena.js
- Diseñar niveles de Monhabell Aventura
- ExampleInstrumentedTest.java
- iniciarTactil
- MainActivity
- crearEnemigo
- poderes.js
- gradlew
- escudo.js

## God Nodes (most connected - your core abstractions)
1. `create()` - 88 edges
2. `enviarEvento()` - 30 edges
3. `enLinea()` - 27 edges
4. `iniciarSala()` - 26 edges
5. `killgesi()` - 25 edges
6. `actualizarJugador()` - 24 edges
7. `o()` - 20 edges
8. `construirNivel()` - 17 edges
9. `e()` - 17 edges
10. `iniciarMenus()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `iniciarVoz()` --indirect_call--> `boton()`  [INFERRED]
  voz.js → menu.js
- `animar()` --indirect_call--> `hoja()`  [INFERRED]
  vestidor.js → sala.js
- `create()` --indirect_call--> `soltarEscudo()`  [INFERRED]
  game.js → escudo.js
- `create()` --indirect_call--> `avisarJefeFx()`  [INFERRED]
  game.js → multijugador.js
- `create()` --indirect_call--> `soyReplica()`  [INFERRED]
  game.js → multijugador.js

## Import Cycles
- None detected.

## Communities (38 total, 0 thin omitted)

### Community 0 - "create"
Cohesion: 0.08
Nodes (29): estaInvulnerable(), actualizarBarraSalud(), actualizarCorazones(), actualizarRecurso(), apartarEnemigo(), aplicarAjustes(), aplicarDefensa(), caerMuerto() (+21 more)

### Community 1 - "azar.js"
Cohesion: 0.18
Nodes (16): aleatorizarNivel(), alturaSobreSuelo(), azar(), BURLAS_CARTEL, CEBOS, contarTrampas(), crearAzar(), CUANTAS_LOCURAS (+8 more)

### Community 2 - "game.js"
Cohesion: 0.06
Nodes (40): createAnimations(), cargarCastillos(), cargarEscudo(), crearAnimacionesEscudo(), actualizarCiclos(), apiJefe, apiSorpresas, botonAgrandar (+32 more)

### Community 3 - "phaser.min.js"
Cohesion: 0.22
Nodes (31): a(), b(), c(), d(), e(), f(), g(), h() (+23 more)

### Community 4 - "multijugador.js"
Cohesion: 0.08
Nodes (62): actualizarArgollas(), actualizarMecanismos(), crearMecanismos(), jugadores(), necesarios(), piesDeTodos(), actualizarEnLinea(), avisarBala() (+54 more)

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

### Community 9 - "completarNivel"
Cohesion: 0.18
Nodes (14): vidasMaximas(), animar(), borrarPartida(), completarNivel(), continuarPartida(), empezarJuego(), encenderFaro(), guardarPartida() (+6 more)

### Community 10 - "mazmorra.js"
Cohesion: 0.08
Nodes (45): actualizarBosque(), crearArbol(), crearBosque(), crearRama(), romperRama(), soltarHojas(), texturas(), soltarEscudo() (+37 more)

### Community 11 - "arte.js"
Cohesion: 0.67
Nodes (5): crearArteOriginal(), lienzo(), PIEDRA, px(), RUNA

### Community 12 - "actualizarJugador"
Cohesion: 0.14
Nodes (18): activarCheckpoint(), activarRuna(), actualizarJugador(), actualizarMundo(), armarAscensorTramposo(), atraerMonedas(), avisar(), ejecutarHabilidad() (+10 more)

### Community 13 - "golpearBloque"
Cohesion: 0.22
Nodes (10): soltarCorazon(), actualizarMonedasHud(), addToScore(), collectCoin(), derrumbarSuelo(), golpearBloque(), matarEnemigo(), sumarABolsa() (+2 more)

### Community 14 - "enemigos.js"
Cohesion: 0.25
Nodes (6): arenaActiva(), cargarEnemigos(), crearAnimacionesEnemigos(), ENEMIGOS, enemigosDelNivel(), precargarNivel()

### Community 15 - "dañarEnemigo"
Cohesion: 0.17
Nodes (15): golpearRival(), actualizarEnemigo(), atacar(), balaRemota(), congelarEnemigo(), dañarEnemigo(), dispararEnemigo(), enSu() (+7 more)

### Community 16 - "ajustes.js"
Cohesion: 0.11
Nodes (30): ajustes, BOTONES, CAMARAS, DIFICULTADES, esMovil, factorEnemigos(), GRAFICOS, guardarAjustes() (+22 more)

### Community 17 - "package.json"
Cohesion: 0.11
Nodes (18): @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, description, devDependencies, @capacitor/android, @capacitor/app (+10 more)

### Community 18 - "vestidor.js"
Cohesion: 0.06
Nodes (59): crearNieblaSeleccion(), moverNieblaSeleccion(), abrirTienda, abrirTiendaEnJuego(), abrirTiendaFuera(), abrirVestidor, actualizarSeleccion(), animSel() (+51 more)

### Community 19 - "sala.js"
Cohesion: 0.08
Nodes (50): arenaDisponible(), ARENAS, actualizarCadena(), actualizarColgado(), anclarJugador1(), arrastrar(), crearCadena(), dibujar() (+42 more)

### Community 20 - "index.js"
Cohesion: 0.19
Nodes (18): APUESTAS, ARENAS, atender(), avisarLista(), difundir(), entrar(), enviar(), latido (+10 more)

### Community 21 - "servidor/package.json"
Cohesion: 0.13
Nodes (14): dependencies, ws, description, engines, node, main, name, private (+6 more)

### Community 22 - "arena.js"
Cohesion: 0.11
Nodes (36): actualizarArena(), APUESTAS, arenaMuerte(), BORDES, cerrarRonda(), colorDe(), COLORES_EQUIPO, cuentaRegresiva() (+28 more)

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
Nodes (89): usarRunaDeReserva(), actualizarPoderes(), asegurar(), BUCLE, C, cargarPoderes(), centro(), claveEfecto() (+81 more)

### Community 29 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 37 - "escudo.js"
Cohesion: 0.44
Nodes (8): actualizarEscudo(), crearEscudo(), crearTexturaAura(), destellarAura(), dibujarCarga(), mostrarEscudo(), recuperarEscudo(), romperEscudo()

## Knowledge Gaps
- **117 isolated node(s):** `POR_DEFECTO`, `SUELO_Y`, `PALETAS`, `ESPERA_NIEBLA`, `DURA_NIEBLA` (+112 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `create()` connect `create` to `azar.js`, `game.js`, `phaser.min.js`, `multijugador.js`, `ambiente.js`, `jefes.js`, `niveles.js`, `completarNivel`, `mazmorra.js`, `actualizarJugador`, `golpearBloque`, `enemigos.js`, `dañarEnemigo`, `ajustes.js`, `vestidor.js`, `sala.js`, `arena.js`, `crearEnemigo`, `poderes.js`, `escudo.js`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `iniciarSala()` connect `sala.js` to `game.js`, `multijugador.js`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `create()` (e.g. with `game.js` and `soltarEscudo()`) actually correct?**
  _`create()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `POR_DEFECTO`, `SUELO_Y`, `PALETAS` to the rest of the system?**
  _117 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06205673758865248 - nodes in this community are weakly interconnected._
- **Should `multijugador.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07553143374038897 - nodes in this community are weakly interconnected._