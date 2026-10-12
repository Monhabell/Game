# Graph Report - Game  (2026-10-11)

## Corpus Check
- 20 files · ~775,826 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 264 nodes · 701 edges · 16 communities
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.53)
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
- sorpresas.js
- preload
- enemigos.js
- mazmorra.js

## God Nodes (most connected - your core abstractions)
1. `create()` - 49 edges
2. `o()` - 20 edges
3. `e()` - 17 edges
4. `update()` - 16 edges
5. `killgesi()` - 16 edges
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
Cohesion: 0.09
Nodes (35): estaInvulnerable(), actualizarBarraSalud(), actualizarCorazones(), actualizarRecurso(), addToScore(), animar(), avisar(), collectCoin() (+27 more)

### Community 1 - "ambiente.js"
Cohesion: 0.11
Nodes (30): actualizarAmbiente(), aplicarNiebla(), bandaNiebla(), cicloLuz(), cicloNiebla(), crearAmbiente(), crearFondoAtmosferico(), crearNieblaSeleccion() (+22 more)

### Community 2 - "game.js"
Cohesion: 0.10
Nodes (23): createAnimations(), crearAnimacionesEscudo(), apiJefe, apiSorpresas, botonAgrandar, botonFsFlotante, botonSonido, BURLAS (+15 more)

### Community 3 - "phaser.min.js"
Cohesion: 0.46
Nodes (22): a(), b(), c(), d(), e(), f(), g(), h() (+14 more)

### Community 4 - "azar.js"
Cohesion: 0.16
Nodes (17): aleatorizarNivel(), alturaSobreSuelo(), azar(), BURLAS_CARTEL, contarTrampas(), iniciarCorazonesAlAzar(), iniciarEscudosAlAzar(), mezclar() (+9 more)

### Community 5 - "historia.js"
Cohesion: 0.18
Nodes (17): moverNieblaSeleccion(), crearFinal(), crearIntro(), avanzar(), mostrar(), terminar(), crearTitulo(), dibujarBoton() (+9 more)

### Community 6 - "jefes.js"
Cohesion: 0.18
Nodes (17): actualizarJefe(), ANCHO_ARENA, ANIMS, caenRocas(), contactoConJefe(), crearMuro(), dañarJefe(), derrotar() (+9 more)

### Community 7 - "construirNivel"
Cohesion: 0.21
Nodes (12): crearCastilloMeta(), soltarEscudo(), actualizarTrampas(), construirNivel(), construirNivel1(), crearEnemigo(), crearGota(), crearSuelo() (+4 more)

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

### Community 12 - "sorpresas.js"
Cohesion: 0.36
Nodes (7): crearEstatua(), actualizarSorpresas(), choca(), crearSorpresas(), monedaTrampa(), pisarMordedora(), rect()

### Community 13 - "preload"
Cohesion: 0.29
Nodes (6): cargarCastillos(), cargarEscudo(), preload(), cargarJefes(), cargarMazmorra(), cargarSonidos()

### Community 14 - "enemigos.js"
Cohesion: 0.33
Nodes (3): cargarEnemigos(), crearAnimacionesEnemigos(), ENEMIGOS

### Community 15 - "mazmorra.js"
Cohesion: 0.47
Nodes (5): activarCheckpoint(), crearAntorcha(), decorarNivel(), encenderEstatua(), oscuro()

## Knowledge Gaps
- **23 isolated node(s):** `PALETAS`, `ESTADOS_NIEBLA`, `MINIMO_TRAMPAS`, `BURLAS_CARTEL`, `TORRES` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `create()` connect `create` to `ambiente.js`, `game.js`, `phaser.min.js`, `azar.js`, `jefes.js`, `construirNivel`, `escudo.js`, `actualizarEnemigo`, `sorpresas.js`, `mazmorra.js`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Why does `v()` connect `phaser.min.js` to `create`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `create()` (e.g. with `game.js` and `soltarEscudo()`) actually correct?**
  _`create()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `o()` (e.g. with `a()` and `c()`) actually correct?**
  _`o()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `e()` (e.g. with `a()` and `c()`) actually correct?**
  _`e()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PALETAS`, `ESTADOS_NIEBLA`, `MINIMO_TRAMPAS` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create` be split into smaller, more focused modules?**
  _Cohesion score 0.0859465737514518 - nodes in this community are weakly interconnected._