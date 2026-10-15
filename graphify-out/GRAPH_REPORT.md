# Graph Report - Game  (2026-10-15)

## Corpus Check
- 58 files · ~823,697 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 756 nodes · 1864 edges · 39 communities
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 91 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b0a6f990`
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
- cadena.js
- mazmorra.js
- arte.js
- actualizarJugador
- crearEnemigo
- voz.js
- dañarEnemigo
- ajustes.js
- package.json
- vestidor.js
- crearSeleccion
- index.js
- servidor/package.json
- update
- Diseñar niveles de Monhabell Aventura
- ExampleInstrumentedTest.java
- iniciarTactil
- MainActivity
- prueba.js
- tienda.js
- gradlew
- escudo.js
- completarNivel

## God Nodes (most connected - your core abstractions)
1. `create()` - 79 edges
2. `enLinea()` - 25 edges
3. `enviarEvento()` - 24 edges
4. `killgesi()` - 23 edges
5. `iniciarSala()` - 23 edges
6. `actualizarJugador()` - 21 edges
7. `o()` - 20 edges
8. `construirNivel()` - 17 edges
9. `e()` - 17 edges
10. `iniciarMenus()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `iniciarVoz()` --indirect_call--> `boton()`  [INFERRED]
  voz.js → menu.js
- `esperar()` --indirect_call--> `f()`  [INFERRED]
  servidor/prueba.js → phaser.min.js
- `create()` --indirect_call--> `soltarEscudo()`  [INFERRED]
  game.js → escudo.js
- `create()` --indirect_call--> `avisarJefeFx()`  [INFERRED]
  game.js → multijugador.js
- `create()` --indirect_call--> `soyReplica()`  [INFERRED]
  game.js → multijugador.js

## Import Cycles
- None detected.

## Communities (39 total, 0 thin omitted)

### Community 0 - "create"
Cohesion: 0.10
Nodes (22): estaInvulnerable(), apartarEnemigo(), aplicarAjustes(), aplicarDefensa(), caerMuerto(), create(), defensa(), killgesi() (+14 more)

### Community 1 - "azar.js"
Cohesion: 0.18
Nodes (16): aleatorizarNivel(), alturaSobreSuelo(), azar(), BURLAS_CARTEL, CEBOS, contarTrampas(), crearAzar(), CUANTAS_LOCURAS (+8 more)

### Community 2 - "game.js"
Cohesion: 0.07
Nodes (35): createAnimations(), cargarCastillos(), cargarEnemigos(), crearAnimacionesEnemigos(), ENEMIGOS, cargarEscudo(), crearAnimacionesEscudo(), apiJefe (+27 more)

### Community 3 - "phaser.min.js"
Cohesion: 0.35
Nodes (25): a(), b(), c(), d(), e(), f(), g(), h() (+17 more)

### Community 4 - "multijugador.js"
Cohesion: 0.07
Nodes (70): actualizarArgollas(), actualizarMecanismos(), crearMecanismos(), jugadores(), necesarios(), piesDeTodos(), actualizarEnLinea(), avisarBala() (+62 more)

### Community 5 - "ambiente.js"
Cohesion: 0.07
Nodes (46): cortarPorMuros(), inalcanzables(), muroEnMedio(), SALTO, seLlega(), SUELO_Y, superficies(), tramosDeBloques() (+38 more)

### Community 6 - "jefes.js"
Cohesion: 0.12
Nodes (39): zoomCamara(), actualizarJefe(), ANCHO_ARENA, ANIMS, avisar(), aviso(), AVISOS, avisoVisible() (+31 more)

### Community 7 - "niveles.js"
Cohesion: 0.15
Nodes (28): nivelEnEquipo(), TRAMOS_EQUIPO, arco(), azar(), fila(), generarNivel(), NIVELES, colocar() (+20 more)

### Community 8 - "exclude"
Cohesion: 0.22
Nodes (12): fmt, exclude, lint, exclude, rules, exclude, android/, assets/ (+4 more)

### Community 9 - "cadena.js"
Cohesion: 0.21
Nodes (16): actualizarCadena(), actualizarColgado(), anclarJugador1(), arrastrar(), crearCadena(), dibujar(), enSuelo(), hayCadena() (+8 more)

### Community 10 - "mazmorra.js"
Cohesion: 0.08
Nodes (45): actualizarBosque(), crearArbol(), crearBosque(), crearRama(), romperRama(), soltarHojas(), texturas(), agregarCiclo() (+37 more)

### Community 11 - "arte.js"
Cohesion: 0.67
Nodes (5): crearArteOriginal(), lienzo(), PIEDRA, px(), RUNA

### Community 12 - "actualizarJugador"
Cohesion: 0.11
Nodes (22): activarRuna(), actualizarJugador(), actualizarMundo(), actualizarRecurso(), armarAscensorTramposo(), atraerMonedas(), avisar(), ejecutarHabilidad() (+14 more)

### Community 13 - "crearEnemigo"
Cohesion: 0.15
Nodes (15): soltarCorazon(), actualizarMonedasHud(), actualizarTrampas(), addToScore(), collectCoin(), crearEnemigo(), crearzombis(), derrumbarSuelo() (+7 more)

### Community 14 - "voz.js"
Cohesion: 0.21
Nodes (18): abierto(), activar(), actualizarBoton(), apagar(), aplicarModo(), apretar(), avisarError(), cerrar() (+10 more)

### Community 15 - "dañarEnemigo"
Cohesion: 0.24
Nodes (11): actualizarEnemigo(), atacar(), balaRemota(), congelarEnemigo(), dañarEnemigo(), dispararEnemigo(), enSu(), golpeDeEnemigo() (+3 more)

### Community 16 - "ajustes.js"
Cohesion: 0.15
Nodes (22): ajustes, BOTONES, CAMARAS, DIFICULTADES, factorEnemigos(), GRAFICOS, guardarAjustes(), POR_DEFECTO (+14 more)

### Community 17 - "package.json"
Cohesion: 0.11
Nodes (18): @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, description, devDependencies, @capacitor/android, @capacitor/app (+10 more)

### Community 18 - "vestidor.js"
Cohesion: 0.08
Nodes (41): moverNieblaSeleccion(), crearFinal(), crearIntro(), avanzar(), mostrar(), terminar(), crearTitulo(), fondoNoche() (+33 more)

### Community 19 - "crearSeleccion"
Cohesion: 0.21
Nodes (14): abrirTienda, abrirTiendaEnJuego(), abrirTiendaFuera(), abrirVestidor, actualizarSeleccion(), animSel(), colorTexto(), crearSeleccion() (+6 more)

### Community 20 - "index.js"
Cohesion: 0.25
Nodes (14): atender(), avisarLista(), difundir(), entrar(), enviar(), latido, limpiarNombre(), lista() (+6 more)

### Community 21 - "servidor/package.json"
Cohesion: 0.13
Nodes (14): dependencies, ws, description, engines, node, main, name, private (+6 more)

### Community 22 - "update"
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
Cohesion: 0.19
Nodes (14): actualizarEscudo(), crearEscudo(), crearTexturaAura(), destellarAura(), dibujarCarga(), mostrarEscudo(), recuperarEscudo(), romperEscudo() (+6 more)

### Community 38 - "completarNivel"
Cohesion: 0.14
Nodes (15): vidasMaximas(), abrirSala, activarCheckpoint(), animar(), borrarPartida(), completarNivel(), continuarPartida(), encenderFaro() (+7 more)

## Knowledge Gaps
- **102 isolated node(s):** `POR_DEFECTO`, `SUELO_Y`, `PALETAS`, `NIEBLA_BASE`, `MINIMO_TRAMPAS` (+97 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `create()` connect `create` to `azar.js`, `game.js`, `phaser.min.js`, `multijugador.js`, `ambiente.js`, `jefes.js`, `niveles.js`, `escudo.js`, `cadena.js`, `mazmorra.js`, `completarNivel`, `actualizarJugador`, `crearEnemigo`, `dañarEnemigo`, `ajustes.js`, `vestidor.js`, `update`, `tienda.js`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `iniciarSala()` connect `multijugador.js` to `game.js`, `vestidor.js`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `f()` connect `phaser.min.js` to `prueba.js`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `create()` (e.g. with `game.js` and `soltarEscudo()`) actually correct?**
  _`create()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `POR_DEFECTO`, `SUELO_Y`, `PALETAS` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create` be split into smaller, more focused modules?**
  _Cohesion score 0.0960591133004926 - nodes in this community are weakly interconnected._
- **Should `game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06570048309178744 - nodes in this community are weakly interconnected._