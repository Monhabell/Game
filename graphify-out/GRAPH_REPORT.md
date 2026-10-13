# Graph Report - Game  (2026-10-12)

## Corpus Check
- 26 files · ~780,515 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 357 nodes · 903 edges · 17 communities
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `095f3854`
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
- niveles.js
- exclude
- completarNivel
- locuras.js
- arte.js
- update
- escudo.js
- addToScore
- actualizarEnemigo
- dañarEnemigo

## God Nodes (most connected - your core abstractions)
1. `create()` - 54 edges
2. `o()` - 20 edges
3. `killgesi()` - 18 edges
4. `e()` - 17 edges
5. `update()` - 16 edges
6. `r()` - 16 edges
7. `construirNivel()` - 14 edges
8. `s()` - 14 edges
9. `u()` - 14 edges
10. `a()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `create()` --indirect_call--> `soltarEscudo()`  [INFERRED]
  game.js → escudo.js
- `create()` --calls--> `crearAmbiente()`  [EXTRACTED]
  game.js → ambiente.js
- `update()` --calls--> `actualizarAmbiente()`  [EXTRACTED]
  game.js → ambiente.js
- `crearSeleccion()` --calls--> `crearNieblaSeleccion()`  [EXTRACTED]
  game.js → ambiente.js
- `actualizarSeleccion()` --calls--> `moverNieblaSeleccion()`  [EXTRACTED]
  game.js → ambiente.js

## Import Cycles
- None detected.

## Communities (17 total, 0 thin omitted)

### Community 0 - "create"
Cohesion: 0.12
Nodes (21): actualizarBarraSalud(), actualizarCorazones(), apartarEnemigo(), aplicarDefensa(), caerMuerto(), compensarZoom(), crearBarraSalud(), create() (+13 more)

### Community 1 - "ambiente.js"
Cohesion: 0.08
Nodes (36): cortarPorMuros(), inalcanzables(), muroEnMedio(), SALTO, seLlega(), SUELO_Y, superficies(), tramosDeBloques() (+28 more)

### Community 2 - "game.js"
Cohesion: 0.08
Nodes (29): createAnimations(), cargarCastillos(), cargarEnemigos(), crearAnimacionesEnemigos(), ENEMIGOS, cargarEscudo(), apiJefe, apiSorpresas (+21 more)

### Community 3 - "phaser.min.js"
Cohesion: 0.46
Nodes (22): a(), b(), c(), d(), e(), f(), g(), h() (+14 more)

### Community 4 - "azar.js"
Cohesion: 0.16
Nodes (18): aleatorizarNivel(), alturaSobreSuelo(), azar(), BURLAS_CARTEL, CEBOS, contarTrampas(), crearAzar(), CUANTAS_LOCURAS (+10 more)

### Community 5 - "historia.js"
Cohesion: 0.10
Nodes (29): crearNieblaSeleccion(), moverNieblaSeleccion(), CASTILLO_META, crearCastilloMeta(), ESTILO_RUINAS, MUROS, TORRES, crearFinal() (+21 more)

### Community 6 - "jefes.js"
Cohesion: 0.14
Nodes (24): actualizarJefe(), ANCHO_ARENA, ANIMS, AVISOS, caenRocas(), camaraLenta(), contactoConJefe(), crearCoraza() (+16 more)

### Community 7 - "niveles.js"
Cohesion: 0.20
Nodes (21): arco(), azar(), fila(), generarNivel(), colocar(), CON_X, extender(), fila() (+13 more)

### Community 8 - "exclude"
Cohesion: 0.24
Nodes (9): fmt, exclude, lint, exclude, rules, exclude, assets/, no-window (+1 more)

### Community 9 - "completarNivel"
Cohesion: 0.19
Nodes (14): actualizarSeleccion(), animar(), borrarPartida(), completarNivel(), continuarPartida(), crearSeleccion(), empezarJuego(), encenderFaro() (+6 more)

### Community 10 - "locuras.js"
Cohesion: 0.08
Nodes (37): construirNivel(), construirNivel1(), crearEnemigo(), crearGota(), crearPlataforma(), crearSuelo(), crearzombis(), ACTUALIZAR (+29 more)

### Community 11 - "arte.js"
Cohesion: 0.67
Nodes (5): crearArteOriginal(), lienzo(), PIEDRA, px(), RUNA

### Community 12 - "update"
Cohesion: 0.25
Nodes (8): activarCheckpoint(), actualizarTrampas(), moveFloorPiece(), moverCamara(), trampasNivel1(), update(), encenderEstatua(), moverLava()

### Community 13 - "escudo.js"
Cohesion: 0.29
Nodes (11): actualizarEscudo(), crearAnimacionesEscudo(), crearEscudo(), crearTexturaAura(), destellarAura(), dibujarCarga(), estaInvulnerable(), mostrarEscudo() (+3 more)

### Community 14 - "addToScore"
Cohesion: 0.18
Nodes (10): activarRuna(), actualizarRecurso(), addToScore(), collectCoin(), derrumbarSuelo(), golpearBloque(), recogerCarcaj(), engañoDeRuna() (+2 more)

### Community 15 - "actualizarEnemigo"
Cohesion: 0.32
Nodes (8): actualizarEnemigo(), actualizarMundo(), atacar(), dispararEnemigo(), enSu(), golpeDeEnemigo(), volverACaminar(), sonarCerca()

### Community 16 - "dañarEnemigo"
Cohesion: 0.33
Nodes (6): avisar(), dañarEnemigo(), ejecutarHabilidad(), pagarCosto(), usarHabilidad(), golpearJefeEnZona()

## Knowledge Gaps
- **36 isolated node(s):** `SUELO_Y`, `PALETAS`, `NIEBLA_BASE`, `MINIMO_TRAMPAS`, `CEBOS` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `create()` connect `create` to `ambiente.js`, `game.js`, `phaser.min.js`, `azar.js`, `jefes.js`, `completarNivel`, `locuras.js`, `update`, `escudo.js`, `addToScore`, `actualizarEnemigo`, `dañarEnemigo`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `v()` connect `phaser.min.js` to `create`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `create()` (e.g. with `game.js` and `soltarEscudo()`) actually correct?**
  _`create()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `o()` (e.g. with `a()` and `c()`) actually correct?**
  _`o()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `e()` (e.g. with `a()` and `c()`) actually correct?**
  _`e()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SUELO_Y`, `PALETAS`, `NIEBLA_BASE` to the rest of the system?**
  _36 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create` be split into smaller, more focused modules?**
  _Cohesion score 0.1168091168091168 - nodes in this community are weakly interconnected._