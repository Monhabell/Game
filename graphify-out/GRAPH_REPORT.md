# Graph Report - Game  (2026-10-11)

## Corpus Check
- 20 files · ~776,108 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 266 nodes · 705 edges · 16 communities
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ff54ea8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- create
- ambiente.js
- game.js
- phaser.min.js
- azar.js
- historia.js
- jefes.js
- construirNivel
- exclude
- escudo.js
- empezarJuego
- actualizarEnemigo
- mazmorra.js
- preload
- enemigos.js
- prepararAnimaciones

## God Nodes (most connected - your core abstractions)
1. `create()` - 50 edges
2. `o()` - 20 edges
3. `killgesi()` - 17 edges
4. `e()` - 17 edges
5. `update()` - 16 edges
6. `r()` - 16 edges
7. `s()` - 14 edges
8. `u()` - 14 edges
9. `a()` - 13 edges
10. `n()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `create()` --indirect_call--> `soltarEscudo()`  [INFERRED]
  game.js → escudo.js
- `create()` --calls--> `crearAmbiente()`  [EXTRACTED]
  game.js → ambiente.js
- `update()` --calls--> `actualizarAmbiente()`  [EXTRACTED]
  game.js → ambiente.js
- `crearSeleccion()` --calls--> `crearNieblaSeleccion()`  [EXTRACTED]
  game.js → ambiente.js
- `crearFinal()` --calls--> `crearNieblaSeleccion()`  [EXTRACTED]
  historia.js → ambiente.js

## Import Cycles
- None detected.

## Communities (16 total, 0 thin omitted)

### Community 0 - "create"
Cohesion: 0.07
Nodes (40): estaInvulnerable(), activarCheckpoint(), actualizarBarraSalud(), actualizarCorazones(), actualizarRecurso(), addToScore(), animar(), avisar() (+32 more)

### Community 1 - "ambiente.js"
Cohesion: 0.11
Nodes (32): actualizarAmbiente(), aplicarNiebla(), bandaNiebla(), cicloLuz(), cicloNiebla(), crearAmbiente(), crearFondoAtmosferico(), crearNieblaSeleccion() (+24 more)

### Community 2 - "game.js"
Cohesion: 0.12
Nodes (16): apiJefe, apiSorpresas, botonAgrandar, botonFsFlotante, botonSonido, BURLAS, config, juego (+8 more)

### Community 3 - "phaser.min.js"
Cohesion: 0.46
Nodes (22): a(), b(), c(), d(), e(), f(), g(), h() (+14 more)

### Community 4 - "azar.js"
Cohesion: 0.16
Nodes (17): aleatorizarNivel(), alturaSobreSuelo(), azar(), BURLAS_CARTEL, contarTrampas(), iniciarCorazonesAlAzar(), iniciarEscudosAlAzar(), mezclar() (+9 more)

### Community 5 - "historia.js"
Cohesion: 0.18
Nodes (16): crearFinal(), crearIntro(), avanzar(), mostrar(), terminar(), crearTitulo(), dibujarBoton(), marcar() (+8 more)

### Community 6 - "jefes.js"
Cohesion: 0.20
Nodes (16): actualizarJefe(), ANCHO_ARENA, ANIMS, caenRocas(), contactoConJefe(), crearMuro(), dañarJefe(), derrotar() (+8 more)

### Community 7 - "construirNivel"
Cohesion: 0.19
Nodes (13): soltarEscudo(), actualizarTrampas(), construirNivel(), construirNivel1(), crearEnemigo(), crearGota(), crearSuelo(), crearzombis() (+5 more)

### Community 8 - "exclude"
Cohesion: 0.24
Nodes (9): fmt, exclude, lint, exclude, rules, exclude, assets/, no-window (+1 more)

### Community 9 - "escudo.js"
Cohesion: 0.44
Nodes (8): actualizarEscudo(), crearEscudo(), crearTexturaAura(), destellarAura(), dibujarCarga(), mostrarEscudo(), recuperarEscudo(), romperEscudo()

### Community 10 - "empezarJuego"
Cohesion: 0.31
Nodes (9): actualizarSeleccion(), borrarPartida(), continuarPartida(), crearSeleccion(), empezarJuego(), leerPartida(), marcarSeleccion(), reiniciarDesdeCero() (+1 more)

### Community 11 - "actualizarEnemigo"
Cohesion: 0.32
Nodes (8): actualizarEnemigo(), actualizarMundo(), atacar(), dispararEnemigo(), enSu(), golpeDeEnemigo(), volverACaminar(), sonarCerca()

### Community 12 - "mazmorra.js"
Cohesion: 0.33
Nodes (8): crearAntorcha(), crearEstatua(), decorarNivel(), oscuro(), actualizarSorpresas(), choca(), crearSorpresas(), rect()

### Community 13 - "preload"
Cohesion: 0.29
Nodes (6): cargarCastillos(), cargarEscudo(), preload(), cargarJefes(), cargarMazmorra(), cargarSonidos()

### Community 14 - "enemigos.js"
Cohesion: 0.33
Nodes (3): cargarEnemigos(), crearAnimacionesEnemigos(), ENEMIGOS

### Community 15 - "prepararAnimaciones"
Cohesion: 0.25
Nodes (7): createAnimations(), crearAnimacionesEscudo(), crearTexturas(), pixelArtNitido(), prepararAnimaciones(), crearAnimacionesJefes(), crearAnimacionesMazmorra()

## Knowledge Gaps
- **23 isolated node(s):** `PALETAS`, `ESTADOS_NIEBLA`, `MINIMO_TRAMPAS`, `BURLAS_CARTEL`, `TORRES` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `create()` connect `create` to `ambiente.js`, `game.js`, `phaser.min.js`, `azar.js`, `construirNivel`, `escudo.js`, `actualizarEnemigo`, `mazmorra.js`, `prepararAnimaciones`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Why does `v()` connect `phaser.min.js` to `create`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `create()` (e.g. with `game.js` and `soltarEscudo()`) actually correct?**
  _`create()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `o()` (e.g. with `a()` and `c()`) actually correct?**
  _`o()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `e()` (e.g. with `a()` and `c()`) actually correct?**
  _`e()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PALETAS`, `ESTADOS_NIEBLA`, `MINIMO_TRAMPAS` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create` be split into smaller, more focused modules?**
  _Cohesion score 0.0730804810360777 - nodes in this community are weakly interconnected._