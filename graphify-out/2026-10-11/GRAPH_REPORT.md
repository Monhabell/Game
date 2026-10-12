# Graph Report - Game  (2026-10-11)

## Corpus Check
- 22 files · ~782,357 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 301 nodes · 782 edges · 15 communities
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2ce90eb5`
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
- completarNivel
- mazmorra.js
- prepararAnimaciones
- actualizarEnemigo
- enemigos.js
- senales.js

## God Nodes (most connected - your core abstractions)
1. `create()` - 53 edges
2. `o()` - 20 edges
3. `killgesi()` - 18 edges
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
- `crearMapa()` --calls--> `crearNieblaSeleccion()`  [EXTRACTED]
  mapa.js → ambiente.js

## Import Cycles
- None detected.

## Communities (15 total, 0 thin omitted)

### Community 0 - "create"
Cohesion: 0.07
Nodes (45): actualizarEscudo(), crearEscudo(), crearTexturaAura(), destellarAura(), dibujarCarga(), estaInvulnerable(), mostrarEscudo(), recuperarEscudo() (+37 more)

### Community 1 - "ambiente.js"
Cohesion: 0.07
Nodes (42): actualizarAmbiente(), aplicarNiebla(), bandaNiebla(), cicloNiebla(), configParticulas(), crearAmbiente(), crearFondoAtmosferico(), crearTexturasAmbiente() (+34 more)

### Community 2 - "game.js"
Cohesion: 0.11
Nodes (20): cargarCastillos(), cargarEscudo(), apiJefe, apiSorpresas, botonAgrandar, botonFsFlotante, botonSonido, BURLAS (+12 more)

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
Nodes (27): dañarEnemigo(), ejecutarHabilidad(), actualizarJefe(), ANCHO_ARENA, ANIMS, AVISOS, caenRocas(), camaraLenta() (+19 more)

### Community 7 - "construirNivel"
Cohesion: 0.15
Nodes (16): crearCastilloMeta(), soltarEscudo(), actualizarTrampas(), construirNivel(), construirNivel1(), crearEnemigo(), crearGota(), crearSuelo() (+8 more)

### Community 8 - "exclude"
Cohesion: 0.24
Nodes (9): fmt, exclude, lint, exclude, rules, exclude, assets/, no-window (+1 more)

### Community 9 - "completarNivel"
Cohesion: 0.21
Nodes (13): actualizarSeleccion(), animar(), borrarPartida(), completarNivel(), continuarPartida(), crearSeleccion(), empezarJuego(), guardarPartida() (+5 more)

### Community 10 - "mazmorra.js"
Cohesion: 0.29
Nodes (10): crearAntorcha(), crearEstatua(), decorarNivel(), oscuro(), activarCebo(), actualizarSorpresas(), choca(), crearRoca() (+2 more)

### Community 11 - "prepararAnimaciones"
Cohesion: 0.25
Nodes (7): createAnimations(), crearAnimacionesEscudo(), crearTexturas(), pixelArtNitido(), prepararAnimaciones(), crearAnimacionesJefes(), crearAnimacionesMazmorra()

### Community 12 - "actualizarEnemigo"
Cohesion: 0.32
Nodes (8): actualizarEnemigo(), actualizarMundo(), atacar(), dispararEnemigo(), enSu(), golpeDeEnemigo(), volverACaminar(), sonarCerca()

### Community 13 - "enemigos.js"
Cohesion: 0.33
Nodes (3): cargarEnemigos(), crearAnimacionesEnemigos(), ENEMIGOS

### Community 16 - "senales.js"
Cohesion: 0.60
Nodes (5): crearSenales(), destello(), granoDePolvo(), piedrita(), reducirMovimiento()

## Knowledge Gaps
- **25 isolated node(s):** `PALETAS`, `NIEBLA_BASE`, `MINIMO_TRAMPAS`, `CEBOS`, `BURLAS_CARTEL` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `create()` connect `create` to `ambiente.js`, `game.js`, `phaser.min.js`, `azar.js`, `jefes.js`, `construirNivel`, `completarNivel`, `mazmorra.js`, `prepararAnimaciones`, `actualizarEnemigo`, `senales.js`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `v()` connect `phaser.min.js` to `create`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `create()` (e.g. with `game.js` and `soltarEscudo()`) actually correct?**
  _`create()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `o()` (e.g. with `a()` and `c()`) actually correct?**
  _`o()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `e()` (e.g. with `a()` and `c()`) actually correct?**
  _`e()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PALETAS`, `NIEBLA_BASE`, `MINIMO_TRAMPAS` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create` be split into smaller, more focused modules?**
  _Cohesion score 0.06531204644412192 - nodes in this community are weakly interconnected._