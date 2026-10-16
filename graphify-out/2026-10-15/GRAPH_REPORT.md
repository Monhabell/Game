# Graph Report - Game  (2026-10-15)

## Corpus Check
- 59 files · ~1,067,274 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 828 nodes · 2109 edges · 39 communities
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
- actualizarEnemigo
- ajustes.js
- package.json
- historia.js
- vestidor.js
- index.js
- servidor/package.json
- voz.js
- Diseñar niveles de Monhabell Aventura
- ExampleInstrumentedTest.java
- iniciarTactil
- MainActivity
- crearSeleccion
- poderes.js
- gradlew
- escudo.js
- senales.js

## God Nodes (most connected - your core abstractions)
1. `create()` - 83 edges
2. `enLinea()` - 27 edges
3. `enviarEvento()` - 26 edges
4. `killgesi()` - 24 edges
5. `actualizarJugador()` - 23 edges
6. `iniciarSala()` - 23 edges
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
Cohesion: 0.07
Nodes (31): estaInvulnerable(), actualizarBarraSalud(), actualizarCorazones(), apartarEnemigo(), aplicarAjustes(), aplicarDefensa(), caerMuerto(), crearBarraSalud() (+23 more)

### Community 1 - "azar.js"
Cohesion: 0.18
Nodes (16): aleatorizarNivel(), alturaSobreSuelo(), azar(), BURLAS_CARTEL, CEBOS, contarTrampas(), crearAzar(), CUANTAS_LOCURAS (+8 more)

### Community 2 - "game.js"
Cohesion: 0.06
Nodes (42): createAnimations(), cargarCastillos(), cargarEscudo(), crearAnimacionesEscudo(), actualizarCiclos(), actualizarTrampas(), apiJefe, apiSorpresas (+34 more)

### Community 3 - "phaser.min.js"
Cohesion: 0.22
Nodes (31): a(), b(), c(), d(), e(), f(), g(), h() (+23 more)

### Community 4 - "multijugador.js"
Cohesion: 0.11
Nodes (45): actualizarArgollas(), actualizarMecanismos(), crearMecanismos(), jugadores(), necesarios(), piesDeTodos(), actualizarEnLinea(), avisarBala() (+37 more)

### Community 5 - "ambiente.js"
Cohesion: 0.07
Nodes (44): cortarPorMuros(), inalcanzables(), muroEnMedio(), SALTO, seLlega(), SUELO_Y, superficies(), tramosDeBloques() (+36 more)

### Community 6 - "jefes.js"
Cohesion: 0.12
Nodes (40): zoomCamara(), actualizarJefe(), ANCHO_ARENA, ANIMS, avisar(), aviso(), AVISOS, avisoVisible() (+32 more)

### Community 7 - "niveles.js"
Cohesion: 0.15
Nodes (28): nivelEnEquipo(), TRAMOS_EQUIPO, arco(), azar(), fila(), generarNivel(), NIVELES, colocar() (+20 more)

### Community 8 - "exclude"
Cohesion: 0.22
Nodes (12): fmt, exclude, lint, exclude, rules, exclude, android/, assets/ (+4 more)

### Community 9 - "completarNivel"
Cohesion: 0.18
Nodes (12): vidasMaximas(), abrirSala, borrarPartida(), completarNivel(), continuarPartida(), encenderFaro(), guardarPartida(), reiniciarDesdeCero() (+4 more)

### Community 10 - "mazmorra.js"
Cohesion: 0.08
Nodes (44): actualizarBosque(), crearArbol(), crearBosque(), crearRama(), romperRama(), soltarHojas(), texturas(), agregarCiclo() (+36 more)

### Community 11 - "arte.js"
Cohesion: 0.67
Nodes (5): crearArteOriginal(), lienzo(), PIEDRA, px(), RUNA

### Community 12 - "actualizarJugador"
Cohesion: 0.12
Nodes (21): activarCheckpoint(), activarRuna(), actualizarJugador(), actualizarMundo(), actualizarRecurso(), animar(), armarAscensorTramposo(), atraerMonedas() (+13 more)

### Community 13 - "golpearBloque"
Cohesion: 0.25
Nodes (9): soltarCorazon(), addToScore(), collectCoin(), derrumbarSuelo(), golpearBloque(), matarEnemigo(), sumarABolsa(), monedaTrampa() (+1 more)

### Community 14 - "enemigos.js"
Cohesion: 0.29
Nodes (5): cargarEnemigos(), crearAnimacionesEnemigos(), ENEMIGOS, enemigosDelNivel(), precargarNivel()

### Community 15 - "actualizarEnemigo"
Cohesion: 0.22
Nodes (11): actualizarEnemigo(), atacar(), balaRemota(), congelarEnemigo(), dispararEnemigo(), enSu(), golpeDeEnemigo(), golpeEnZona() (+3 more)

### Community 16 - "ajustes.js"
Cohesion: 0.12
Nodes (29): ajustes, BOTONES, CAMARAS, DIFICULTADES, esMovil, factorEnemigos(), GRAFICOS, guardarAjustes() (+21 more)

### Community 17 - "package.json"
Cohesion: 0.11
Nodes (18): @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, description, devDependencies, @capacitor/android, @capacitor/app (+10 more)

### Community 18 - "historia.js"
Cohesion: 0.09
Nodes (41): crearNieblaSeleccion(), moverNieblaSeleccion(), actualizarCadena(), actualizarColgado(), anclarJugador1(), arrastrar(), crearCadena(), dibujar() (+33 more)

### Community 19 - "vestidor.js"
Cohesion: 0.07
Nodes (52): alRecibir(), atender(), avisar(), conectar(), crearSala(), direccion(), elegirPersonaje(), empezarPartida() (+44 more)

### Community 20 - "index.js"
Cohesion: 0.25
Nodes (14): atender(), avisarLista(), difundir(), entrar(), enviar(), latido, limpiarNombre(), lista() (+6 more)

### Community 21 - "servidor/package.json"
Cohesion: 0.13
Nodes (14): dependencies, ws, description, engines, node, main, name, private (+6 more)

### Community 22 - "voz.js"
Cohesion: 0.20
Nodes (19): boton(), abierto(), activar(), actualizarBoton(), apagar(), aplicarModo(), apretar(), avisarError() (+11 more)

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

### Community 27 - "crearSeleccion"
Cohesion: 0.20
Nodes (15): abrirTienda, abrirTiendaEnJuego(), abrirTiendaFuera(), abrirVestidor, actualizarMonedasHud(), actualizarSeleccion(), animSel(), colorTexto() (+7 more)

### Community 28 - "poderes.js"
Cohesion: 0.06
Nodes (83): usarRunaDeReserva(), actualizarPoderes(), asegurar(), BUCLE, C, cargarPoderes(), centro(), claveEfecto() (+75 more)

### Community 29 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 37 - "escudo.js"
Cohesion: 0.38
Nodes (9): actualizarEscudo(), crearEscudo(), crearTexturaAura(), destellarAura(), dibujarCarga(), mostrarEscudo(), recuperarEscudo(), romperEscudo() (+1 more)

### Community 38 - "senales.js"
Cohesion: 0.60
Nodes (5): crearSenales(), destello(), granoDePolvo(), piedrita(), reducirMovimiento()

## Knowledge Gaps
- **110 isolated node(s):** `POR_DEFECTO`, `SUELO_Y`, `PALETAS`, `ESPERA_NIEBLA`, `DURA_NIEBLA` (+105 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `create()` connect `create` to `azar.js`, `game.js`, `phaser.min.js`, `multijugador.js`, `ambiente.js`, `jefes.js`, `niveles.js`, `completarNivel`, `mazmorra.js`, `actualizarJugador`, `golpearBloque`, `actualizarEnemigo`, `ajustes.js`, `historia.js`, `vestidor.js`, `crearSeleccion`, `poderes.js`, `escudo.js`, `senales.js`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `iniciarSala()` connect `vestidor.js` to `game.js`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `create()` (e.g. with `game.js` and `soltarEscudo()`) actually correct?**
  _`create()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `POR_DEFECTO`, `SUELO_Y`, `PALETAS` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create` be split into smaller, more focused modules?**
  _Cohesion score 0.07307692307692308 - nodes in this community are weakly interconnected._
- **Should `game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.061224489795918366 - nodes in this community are weakly interconnected._
- **Should `multijugador.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10638297872340426 - nodes in this community are weakly interconnected._