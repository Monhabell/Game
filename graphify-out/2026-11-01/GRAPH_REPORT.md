# Graph Report - Game  (2026-11-01)

## Corpus Check
- 87 files · ~2,096,057 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1699 nodes · 4615 edges · 73 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a3efcb3e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- create
- azar.js
- game.js
- phaser.min.js
- enviarEvento
- ambiente.js
- jefes.js
- tramos.js
- exclude
- arena.js
- mazmorra.js
- arte.js
- actualizarJugador
- precargarNivel
- carrera.js
- dañarEnemigo
- voz.js
- package.json
- historia.js
- sala.js
- index.js
- servidor/package.json
- minas.js
- Diseñar niveles de Monhabell Aventura
- ExampleInstrumentedTest.java
- abismo.js
- MainActivity
- juicio.js
- poderes.js
- gradlew
- escudo.js
- crearSeleccion
- progreso.js
- tienda.js
- criptas_troll.js
- iniciarNoche
- catacumbas.js
- troll.js
- niveles.js
- descenso.js
- bots.js
- resDe
- alcance.js
- prepararNoche
- mecanicas.js
- pistas.js
- soyTroll
- completarNivel
- actualizarNoche
- mecanismos.js
- afueras.js
- esAnfitrion
- nivelPorIndice
- mundos.js
- cadena.js
- senales.js
- minimapa.js
- bosque_troll.js
- tienePoder
- falsas.js
- castillos.js
- empezarNoche
- SUELO_Y
- dibujarDescenso

## God Nodes (most connected - your core abstractions)
1. `create()` - 119 edges
2. `enviarEvento()` - 74 edges
3. `iniciarSala()` - 45 edges
4. `actualizarJugador()` - 39 edges
5. `iniciarNoche()` - 36 edges
6. `esAnfitrion()` - 32 edges
7. `completarNivel()` - 30 edges
8. `killgesi()` - 28 edges
9. `enLinea()` - 25 edges
10. `actualizarNoche()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `cerrarJuicio()` --indirect_call--> `reloj()`  [INFERRED]
  juicio.js → abismo.js
- `cerrar()` --indirect_call--> `reloj()`  [INFERRED]
  vestidor.js → abismo.js
- `pintarFlechas()` --calls--> `visible()`  [EXTRACTED]
  troll.js → criptas_troll.js
- `create()` --indirect_call--> `soltarEscudo()`  [INFERRED]
  game.js → escudo.js
- `create()` --indirect_call--> `avisarJefeFx()`  [INFERRED]
  game.js → multijugador.js

## Import Cycles
- None detected.

## Communities (73 total, 0 thin omitted)

### Community 0 - "create"
Cohesion: 0.06
Nodes (37): estaInvulnerable(), activarRuna(), actualizarBarraSalud(), actualizarCorazones(), actualizarRecurso(), apartarEnemigo(), aplicarAjustes(), aplicarDefensa() (+29 more)

### Community 1 - "azar.js"
Cohesion: 0.09
Nodes (26): alturaSobreSuelo(), azar(), BURLAS_CARTEL, CEBOS, contarTrampas(), CUANTAS_LOCURAS, iniciarCorazonesAlAzar(), iniciarEscudosAlAzar() (+18 more)

### Community 2 - "game.js"
Cohesion: 0.04
Nodes (68): createAnimations(), tomeMonedaCarrera(), cargarCastillos(), precargarCriptas(), cargarEscudo(), abrirTiendaEnJuego(), activarCheckpoint(), actualizarCiclos() (+60 more)

### Community 3 - "phaser.min.js"
Cohesion: 0.22
Nodes (31): a(), b(), c(), d(), e(), f(), g(), h() (+23 more)

### Community 4 - "enviarEvento"
Cohesion: 0.12
Nodes (42): colorDe(), esRival(), actualizarEnLinea(), avisarBala(), avisarCheckpoint(), avisarEnemigo(), avisarGolpeEnemigo(), avisarJefe() (+34 more)

### Community 5 - "ambiente.js"
Cohesion: 0.13
Nodes (27): actualizarAmbiente(), aplicarNiebla(), bandaNiebla(), cicloNiebla(), cieloDe(), configParticulas(), crearAmbiente(), crearFondoAtmosferico() (+19 more)

### Community 6 - "jefes.js"
Cohesion: 0.06
Nodes (76): actualizarNado(), agregarAgua(), agregarBurbujas(), aguaEn(), ahogarse(), animarNado(), chapuzon(), configurarAgua() (+68 more)

### Community 7 - "tramos.js"
Cohesion: 0.17
Nodes (22): nivelRuinas(), CON_X, fila(), LOCURAS_CON_FIN, RANGOS, SOLO_X, SUELO_Y, SUPERFICIE_AGUA (+14 more)

### Community 8 - "exclude"
Cohesion: 0.22
Nodes (12): fmt, exclude, lint, exclude, rules, exclude, android/, assets/ (+4 more)

### Community 9 - "arena.js"
Cohesion: 0.06
Nodes (70): actualizarArena(), actualizarOjos(), anotarResultado(), apagon(), APUESTAS, arenaMuerte(), ARENAS, asomarTroll() (+62 more)

### Community 10 - "mazmorra.js"
Cohesion: 0.07
Nodes (54): actualizarBosque(), actualizarNivel1Juntos(), crearArbol(), crearBosque(), crearNivel1Juntos(), crearRama(), crearTabla(), cuantosEncima() (+46 more)

### Community 11 - "arte.js"
Cohesion: 0.67
Nodes (5): crearArteOriginal(), lienzo(), PIEDRA, px(), RUNA

### Community 12 - "actualizarJugador"
Cohesion: 0.14
Nodes (15): saltoCarrera(), turboCarrera(), actualizarJugador(), actualizarMundo(), animar(), armarAscensorTramposo(), atraerMonedas(), moveFloorPiece() (+7 more)

### Community 13 - "precargarNivel"
Cohesion: 0.25
Nodes (6): arenaActiva(), cargarEnemigos(), crearAnimacionesEnemigos(), ENEMIGOS, enemigosDelNivel(), precargarNivel()

### Community 14 - "carrera.js"
Cohesion: 0.06
Nodes (74): esModoArena(), recibirGolpe(), actualizarCajas(), borrarTrampa(), COMUNES, configurarCajas(), crearCaja(), DEL_MUNDO (+66 more)

### Community 15 - "dañarEnemigo"
Cohesion: 0.13
Nodes (19): golpearRival(), actualizarEnemigo(), atacar(), avisar(), balaRemota(), congelarEnemigo(), dañarEnemigo(), dispararEnemigo() (+11 more)

### Community 16 - "voz.js"
Cohesion: 0.06
Nodes (60): ajustes, BOTONES, CAMARAS, DIFICULTADES, esMovil, factorEnemigos(), GRAFICOS, guardarAjustes() (+52 more)

### Community 17 - "package.json"
Cohesion: 0.09
Nodes (21): @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, description, devDependencies, @capacitor/android, @capacitor/app (+13 more)

### Community 18 - "historia.js"
Cohesion: 0.15
Nodes (20): moverNieblaSeleccion(), crearFinal(), crearIntro(), avanzar(), mostrar(), terminar(), crearTitulo(), fondoNoche() (+12 more)

### Community 19 - "sala.js"
Cohesion: 0.05
Nodes (85): arenaDisponible(), victoriasArena(), CUANTOS_TEMAS(), temaDeMundo(), pistaDelDia(), pistaDeMundo(), pistaDeNivel(), PISTAS (+77 more)

### Community 20 - "index.js"
Cohesion: 0.15
Nodes (24): APUESTAS, ARENAS, atender(), avisarLista(), cupo(), difundir(), empezarNoche(), entrar() (+16 more)

### Community 21 - "servidor/package.json"
Cohesion: 0.13
Nodes (14): dependencies, ws, description, engines, node, main, name, private (+6 more)

### Community 22 - "minas.js"
Cohesion: 0.06
Nodes (66): actualizarMinas(), BAJADA, CARRO, configurarMinas(), crearCristal(), crearJaula(), crearLista(), crearMinas() (+58 more)

### Community 23 - "Diseñar niveles de Monhabell Aventura"
Cohesion: 0.20
Nodes (9): Al terminar, Cómo crear una pieza nueva (tramos.js), Cómo crear una trampa nueva, Diseñar niveles de Monhabell Aventura, Mapa de archivos, Medidas (no inventar: salen de `alcance.js`), Modo equipo (cadena), Reglas de justicia (las comprueba `niveles_test.js`) (+1 more)

### Community 24 - "ExampleInstrumentedTest.java"
Cohesion: 0.33
Nodes (5): ExampleInstrumentedTest, ExampleUnitTest, androidx.test.ext.junit.runners.AndroidJUnit4, org.junit.runner.RunWith, org.junit.Test

### Community 25 - "abismo.js"
Cohesion: 0.15
Nodes (24): actualizarAbismo(), actualizarAplastador(), actualizarMuro(), actualizarPortal(), APLASTADOR, cavernas(), crearAbismo(), crearAplastador() (+16 more)

### Community 26 - "MainActivity"
Cohesion: 0.43
Nodes (4): MainActivity, android.os.Bundle, com.getcapacitor.BridgeActivity, Override

### Community 27 - "juicio.js"
Cohesion: 0.22
Nodes (22): autor(), avisar(), BOT_VOTA_MS, cerrarCon(), cerrarJuicio(), clic(), contar(), contarVotos() (+14 more)

### Community 28 - "poderes.js"
Cohesion: 0.11
Nodes (44): actualizarPoderes(), ALCANCE, alcanzarme(), alterarAlJefe(), asegurar(), BUCLE, C, cargarPoderes() (+36 more)

### Community 29 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 37 - "escudo.js"
Cohesion: 0.26
Nodes (14): actualizarEscudo(), COLORES_PIXEL, crearAnimacionesEscudo(), crearEscudo(), crearTexturaAura(), crearTexturaEscudo(), destellarAura(), dibujarCarga() (+6 more)

### Community 38 - "crearSeleccion"
Cohesion: 0.15
Nodes (17): abrirTienda, abrirTiendaFuera(), abrirVestidor, actualizarSeleccion(), animSel(), botonSel(), colorTexto(), crearSeleccion() (+9 more)

### Community 39 - "progreso.js"
Cohesion: 0.11
Nodes (24): NIVEL_MAX, anunciar(), cola, escapar(), estado, ganarXP(), guardar(), heroe() (+16 more)

### Community 40 - "tienda.js"
Cohesion: 0.08
Nodes (49): usarRunaDeReserva(), mostrarHitos(), BUILDS, colorDe(), comboDe(), cuantosPoderes(), elementoDe(), ELEMENTOS (+41 more)

### Community 41 - "criptas_troll.js"
Cohesion: 0.09
Nodes (28): ALTAR, ANTORCHAS, decorar(), decorarEste(), dibujarLosa(), E1, E2, E3 (+20 more)

### Community 42 - "iniciarNoche"
Cohesion: 0.14
Nodes (28): botsVivos(), empujarBot(), iniciarBots(), agregarTrampa(), alcanzable(), amanecer(), apagon(), atacar() (+20 more)

### Community 43 - "catacumbas.js"
Cohesion: 0.11
Nodes (26): actualizarCatacumbas(), APLASTA, aplastar(), ataud(), configurarCatacumbas(), crearCatacumbas(), crearPuertas(), ESCALERA (+18 more)

### Community 44 - "troll.js"
Cohesion: 0.12
Nodes (27): apagarAntorcha(), apagarDibujo(), AVISO_TRAMO, contarFuego(), crearBosque(), crearCampanaJuicio(), crearPuertas(), despertarAltar() (+19 more)

### Community 45 - "niveles.js"
Cohesion: 0.13
Nodes (27): esDescenso(), tieneAgua(), arco(), arquetipoDe(), ARQUETIPOS, azar(), corrimiento(), corrimientos (+19 more)

### Community 46 - "descenso.js"
Cohesion: 0.13
Nodes (24): actualizarDescenso(), actualizarRetos(), ANCHO_RETO, armarReto(), azar(), CAPAS, cartelPiso(), CASCADA (+16 more)

### Community 47 - "bots.js"
Cohesion: 0.16
Nodes (20): actualizarBots(), bots, COSTO, dist(), elegirObjetivo(), empezarBots(), guia(), irA() (+12 more)

### Community 48 - "resDe"
Cohesion: 0.29
Nodes (8): crearNieblaSeleccion(), crearCadena(), crearMapa(), estiloTexto(), PUNTOS, MANA_MAXIMO, PERSONAJES, resDe()

### Community 49 - "alcance.js"
Cohesion: 0.18
Nodes (12): cortarPorMuros(), inalcanzables(), muroEnMedio(), SALTO, seLlega(), superficies(), tramosDeBloques(), eventosDeRegion() (+4 more)

### Community 50 - "prepararNoche"
Cohesion: 0.14
Nodes (19): crearDibujosBots(), usarBotonesTroll(), cerrarFin(), cerrarRevelacion(), crearBarraTroll(), crearEncargos(), crearFlechas(), crearHud() (+11 more)

### Community 51 - "mecanicas.js"
Cohesion: 0.15
Nodes (17): animarMecanicas(), AVISO_PEGAJOSO, AVISOS, azar(), CALOR, CICLO, configurarMecanicas(), crearMecanicas() (+9 more)

### Community 52 - "pistas.js"
Cohesion: 0.30
Nodes (12): aleatorizarNivel(), crearAzar(), prepararNivelFijo(), formaDescenso(), armarDeGenerado(), armarDeNivel(), armarPista(), armarPistaBase() (+4 more)

### Community 53 - "soyTroll"
Cohesion: 0.20
Nodes (18): actualizarEncargos(), cumplir(), darPremio(), escapar(), esCompaTroll(), marcaDe(), marcarMision(), misionActual() (+10 more)

### Community 54 - "completarNivel"
Cohesion: 0.23
Nodes (16): atajoDesarrollo(), borrarPartida(), completarNivel(), continuarPartida(), empezarJuego(), encenderFaro(), guardarPartida(), pantallaGameOver() (+8 more)

### Community 55 - "actualizarNoche"
Cohesion: 0.16
Nodes (17): abrirJuicio(), juicioActivo(), actualizarNoche(), actualizarTroll(), antorchaCerca(), flotar(), mostrarReportar(), motivoNo() (+9 more)

### Community 56 - "mecanismos.js"
Cohesion: 0.48
Nodes (6): actualizarArgollas(), actualizarMecanismos(), crearMecanismos(), jugadores(), necesarios(), piesDeTodos()

### Community 57 - "afueras.js"
Cohesion: 0.20
Nodes (14): BODEGA, decorarAfueras(), escalones, farol(), lapidas(), letrero(), MURO, NIVEL_AFUERAS (+6 more)

### Community 58 - "esAnfitrion"
Cohesion: 0.17
Nodes (16): botsAlClaro(), matarBot(), esAnfitrion(), colorDe(), cuantosTrolls(), despuesDelJuicio(), dibujarCuerpo(), mostrarFin() (+8 more)

### Community 59 - "nivelPorIndice"
Cohesion: 0.18
Nodes (12): nivelEnEquipo(), TRAMOS_EQUIPO, esInfinito(), NIVELES, nivelPorIndice(), colocar(), extender(), moverEnemigo() (+4 more)

### Community 61 - "mundos.js"
Cohesion: 0.27
Nodes (12): abrirMapa(), cerrarMapa(), estrellasDe(), ganarEstrellas(), guardar(), leer(), monedas, textoEstrellas() (+4 more)

### Community 62 - "cadena.js"
Cohesion: 0.33
Nodes (12): actualizarCadena(), actualizarColgado(), anclarJugador1(), arrastrar(), dibujar(), enSuelo(), hayCadena(), haySueloDebajo() (+4 more)

### Community 63 - "senales.js"
Cohesion: 0.52
Nodes (6): crearSenales(), destello(), granoDePolvo(), piedrita(), reducirMovimiento(), tiene()

### Community 64 - "minimapa.js"
Cohesion: 0.27
Nodes (11): progresoEnRuta(), actualizarMinimapa(), alternar(), armarDom(), CHICO, COLOR, crearMinimapa(), dibujarNivel() (+3 more)

### Community 65 - "bosque_troll.js"
Cohesion: 0.18
Nodes (10): ALTAR_NOCHE, ANTORCHAS_NOCHE, CASCADA, COPA_Y, ENCARGOS, MAPA_BOSQUE, nivelNoche(), PUENTE_Y (+2 more)

### Community 68 - "tienePoder"
Cohesion: 0.14
Nodes (27): guardar(), HITOS, proximoHito(), reclamados, revisarHitos(), tituloActual(), costoSubir(), crearPoderes() (+19 more)

### Community 70 - "falsas.js"
Cohesion: 0.43
Nodes (7): actualizarFalsas(), azar(), cartel(), configurarFalsas(), crear(), crearFalsas(), lugares()

### Community 71 - "castillos.js"
Cohesion: 0.29
Nodes (6): CASTILLO_META, crearCastilloMeta(), ESTILO_RUINAS, MUROS, TORRES, SUELO_Y

### Community 72 - "empezarNoche"
Cohesion: 0.33
Nodes (7): usarMapaBots(), empezarNoche(), fuera(), porJugador(), repartirEncargos(), volumenDe(), usarVolumenVoz()

### Community 73 - "SUELO_Y"
Cohesion: 0.36
Nodes (7): SUELO_Y, actualizarLuz(), crearLuz(), pintarSombras(), RADIO_ANTORCHA, texturas(), zonasTunel()

### Community 74 - "dibujarDescenso"
Cohesion: 0.50
Nodes (5): dibujarDescenso(), lavaEnFosa(), pared(), prepararReto(), texturasRetos()

## Knowledge Gaps
- **268 isolated node(s):** `APLASTADOR`, `MURO`, `BODEGA`, `escalones`, `POR_DEFECTO` (+263 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `enviarEvento()` connect `enviarEvento` to `create`, `game.js`, `progreso.js`, `arena.js`, `iniciarNoche`, `troll.js`, `carrera.js`, `bots.js`, `dañarEnemigo`, `voz.js`, `sala.js`, `soyTroll`, `actualizarNoche`, `mecanismos.js`, `esAnfitrion`, `juicio.js`, `poderes.js`, `cadena.js`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `create()` connect `create` to `azar.js`, `game.js`, `phaser.min.js`, `enviarEvento`, `ambiente.js`, `jefes.js`, `arena.js`, `mazmorra.js`, `actualizarJugador`, `precargarNivel`, `carrera.js`, `dañarEnemigo`, `voz.js`, `sala.js`, `minas.js`, `abismo.js`, `escudo.js`, `crearSeleccion`, `tienda.js`, `catacumbas.js`, `resDe`, `prepararNoche`, `mecanicas.js`, `pistas.js`, `completarNivel`, `mecanismos.js`, `afueras.js`, `nivelPorIndice`, `senales.js`, `minimapa.js`, `tienePoder`, `falsas.js`, `SUELO_Y`, `dibujarDescenso`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `iniciarSala()` connect `sala.js` to `game.js`, `esAnfitrion`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `create()` (e.g. with `game.js` and `soltarEscudo()`) actually correct?**
  _`create()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `APLASTADOR`, `MURO`, `BODEGA` to the rest of the system?**
  _268 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create` be split into smaller, more focused modules?**
  _Cohesion score 0.06382978723404255 - nodes in this community are weakly interconnected._
- **Should `azar.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08912655971479501 - nodes in this community are weakly interconnected._