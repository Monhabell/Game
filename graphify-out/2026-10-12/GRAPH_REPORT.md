# Graph Report - Game  (2026-10-12)

## Corpus Check
- 25 files · ~775,660 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 338 nodes · 870 edges · 17 communities
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.52)
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
- mazmorra.js
- arte.js
- update
- escudo.js
- addToScore
- actualizarEnemigo
- senales.js

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
- `crearMapa()` --calls--> `crearNieblaSeleccion()`  [EXTRACTED]
  mapa.js → ambiente.js

## Import Cycles
- None detected.

## Communities (17 total, 0 thin omitted)

### Community 0 - "create"
Cohesion: 0.11
Nodes (23): actualizarBarraSalud(), actualizarCorazones(), actualizarRecurso(), apartarEnemigo(), aplicarDefensa(), caerMuerto(), compensarZoom(), crearBarraSalud() (+15 more)

### Community 1 - "ambiente.js"
Cohesion: 0.08
Nodes (36): cortarPorMuros(), inalcanzables(), muroEnMedio(), SALTO, seLlega(), SUELO_Y, superficies(), tramosDeBloques() (+28 more)

### Community 2 - "game.js"
Cohesion: 0.08
Nodes (30): createAnimations(), cargarCastillos(), cargarEnemigos(), crearAnimacionesEnemigos(), ENEMIGOS, cargarEscudo(), crearAnimacionesEscudo(), apiJefe (+22 more)

### Community 3 - "phaser.min.js"
Cohesion: 0.46
Nodes (22): a(), b(), c(), d(), e(), f(), g(), h() (+14 more)

### Community 4 - "azar.js"
Cohesion: 0.20
Nodes (15): aleatorizarNivel(), alturaSobreSuelo(), azar(), BURLAS_CARTEL, CEBOS, contarTrampas(), crearAzar(), iniciarCorazonesAlAzar() (+7 more)

### Community 5 - "historia.js"
Cohesion: 0.18
Nodes (18): crearNieblaSeleccion(), moverNieblaSeleccion(), crearFinal(), crearIntro(), avanzar(), mostrar(), terminar(), crearTitulo() (+10 more)

### Community 6 - "jefes.js"
Cohesion: 0.13
Nodes (26): ejecutarHabilidad(), actualizarJefe(), ANCHO_ARENA, ANIMS, AVISOS, caenRocas(), camaraLenta(), contactoConJefe() (+18 more)

### Community 7 - "niveles.js"
Cohesion: 0.11
Nodes (32): CASTILLO_META, crearCastilloMeta(), ESTILO_RUINAS, MUROS, TORRES, actualizarMapa(), crearMapa(), estiloTexto() (+24 more)

### Community 8 - "exclude"
Cohesion: 0.24
Nodes (9): fmt, exclude, lint, exclude, rules, exclude, assets/, no-window (+1 more)

### Community 9 - "completarNivel"
Cohesion: 0.19
Nodes (14): actualizarSeleccion(), animar(), borrarPartida(), completarNivel(), continuarPartida(), crearSeleccion(), empezarJuego(), encenderFaro() (+6 more)

### Community 10 - "mazmorra.js"
Cohesion: 0.14
Nodes (23): soltarEscudo(), construirNivel(), construirNivel1(), crearEnemigo(), crearGota(), crearPlataforma(), crearSuelo(), crearzombis() (+15 more)

### Community 11 - "arte.js"
Cohesion: 0.67
Nodes (5): crearArteOriginal(), lienzo(), PIEDRA, px(), RUNA

### Community 12 - "update"
Cohesion: 0.18
Nodes (11): activarCheckpoint(), actualizarTrampas(), avisar(), moveFloorPiece(), moverCamara(), pagarCosto(), trampasNivel1(), update() (+3 more)

### Community 13 - "escudo.js"
Cohesion: 0.38
Nodes (9): actualizarEscudo(), crearEscudo(), crearTexturaAura(), destellarAura(), dibujarCarga(), estaInvulnerable(), mostrarEscudo(), recuperarEscudo() (+1 more)

### Community 14 - "addToScore"
Cohesion: 0.29
Nodes (7): activarRuna(), addToScore(), collectCoin(), derrumbarSuelo(), golpearBloque(), monedaTrampa(), pisarMordedora()

### Community 15 - "actualizarEnemigo"
Cohesion: 0.28
Nodes (9): actualizarEnemigo(), actualizarMundo(), atacar(), dañarEnemigo(), dispararEnemigo(), enSu(), golpeDeEnemigo(), volverACaminar() (+1 more)

### Community 16 - "senales.js"
Cohesion: 0.60
Nodes (5): crearSenales(), destello(), granoDePolvo(), piedrita(), reducirMovimiento()

## Knowledge Gaps
- **31 isolated node(s):** `SUELO_Y`, `PALETAS`, `NIEBLA_BASE`, `MINIMO_TRAMPAS`, `CEBOS` (+26 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `create()` connect `create` to `ambiente.js`, `game.js`, `phaser.min.js`, `azar.js`, `jefes.js`, `completarNivel`, `mazmorra.js`, `update`, `escudo.js`, `addToScore`, `actualizarEnemigo`, `senales.js`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `v()` connect `phaser.min.js` to `create`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `create()` (e.g. with `game.js` and `soltarEscudo()`) actually correct?**
  _`create()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `o()` (e.g. with `a()` and `c()`) actually correct?**
  _`o()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `e()` (e.g. with `a()` and `c()`) actually correct?**
  _`e()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SUELO_Y`, `PALETAS`, `NIEBLA_BASE` to the rest of the system?**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create` be split into smaller, more focused modules?**
  _Cohesion score 0.10804597701149425 - nodes in this community are weakly interconnected._