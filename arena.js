// Arena del Troll: batallas en línea entre jugadores, 1 contra 1 o por equipos (2 contra 2).
//
// Cómo se juega:
//   - Al mejor de 3 rondas. En cada ronda cada jugador tiene 3 corazones y una barra de salud.
//   - Los ataques y los poderes golpean a los rivales (a los compañeros de equipo no): bajan la salud
//     y EMPUJAN. Cuanto menos salud tienes, más lejos te mandan (como en Smash): la lava del centro
//     y la de los bordes es la forma más rápida de perder un corazón.
//   - A los 45 s "¡El troll se aburre!": los bordes de la arena se derrumban y queda lava.
//   - Se pierde la ronda cuando todo tu equipo se queda sin corazones.
//   - Apuesta (la elige el anfitrión: 0, 10, 25, 50 o 100 monedas): cada jugador la paga al empezar y
//     el equipo ganador se reparte el pozo. Sin apuesta: 30 monedas al ganar y 10 al perder.
//   - 4 arenas, cada una con su peligro; se desbloquean con victorias (Bosque, Cueva, Volcán, Castillo).
//
// En red (servidor de salas, sin cambios de lógica en el servidor más allá del modo y los equipos):
//   - Quien GOLPEA decide si golpeó (como con los enemigos): avisa al golpeado con 'pvp' (solo a él).
//   - Cada jugador lleva SU salud y sus corazones; al perder uno avisa a todos ('arenaCae').
//   - El ANFITRIÓN cierra las rondas ('arenaRonda') cuando queda un solo equipo con corazones.
//   - Los rivales tienen un cuerpo de física (sin gravedad, sigue a su dibujo) en scene.rivales: así
//     las flechas, los golpes y los poderes los encuentran igual que a los enemigos.
//
// api (la da game.js): { golpearme(scene, daño, origenX), mensaje(scene, texto, ms), ponerVidas(scene, n),
//   premio(monedas), pagar(monedas), salir(), volverASala(), revancha(), reiniciar(scene) }

import { red, alRecibir, enviarEvento, esAnfitrion } from "./red.js"
import { crearLava } from "./mazmorra.js"
import { SUELO_Y } from "./niveles.js"

const VIDAS = 3;
const RONDAS_PARA_GANAR = 2;
const DERRUMBE_MS = 45000;   // desde el comienzo de la ronda
const ESPERA_REAPARECER = 1600;
const PROTECCION_MS = 2000;  // al aparecer: un momento sin recibir golpes
const SALUD_POR_DAÑO = [0, 15, 20, 25, 30]; // daño del ataque (1..4+) -> salud que quita
const CLAVE = 'troll-night-arena';
export const COLORES_EQUIPO = ['#ff5a5a', '#4fa3ff'];
const NOMBRES_EQUIPO = ['Equipo Rojo', 'Equipo Azul'];

export const APUESTAS = [0, 10, 25, 50, 100];

// arenas: cada una se desbloquea con victorias y trae su propio peligro. Todas tienen los bordes
// del suelo en piezas aparte ([0, 120] y [780, 900]): a los 45 s se derrumban
const BORDES = [[0, 120], [780, 900]];
export const ARENAS = [
    {
        id: 'bosque', nombre: 'Arena del Bosque', victorias: 0, peligro: 'un foso de lava en el centro',
        nivel: {
            nubes: true, suelo: [...BORDES, [120, 360], [540, 780]], lava: [[360, 540]],
            plataformas: [[55, 236, 120], [725, 236, 120], [385, 250, 130], [225, 140, 110], [565, 140, 110]],
        },
    },
    {
        id: 'cueva', nombre: 'Cueva de lava', victorias: 5, peligro: 'foso ancho y gotas de lava del techo',
        nivel: {
            nubes: false, cueva: true, tinte: 0xd0a080, suelo: [...BORDES, [120, 300], [600, 780]], lava: [[300, 600]],
            plataformas: [[320, 255, 90], [490, 255, 90], [160, 150, 100], [640, 150, 100], [400, 130, 100]],
            goteros: [[220, 2600], [418, 2200], [650, 2800]],
        },
    },
    {
        id: 'volcan', nombre: 'Volcán', victorias: 15, peligro: 'bolas de fuego y una plataforma que se mueve',
        nivel: {
            nubes: false, cueva: true, tinte: 0xb8503a, suelo: [...BORDES, [120, 330], [570, 780]], lava: [[330, 570]],
            plataformas: [[60, 236, 110], [730, 236, 110], [230, 150, 100], [570, 150, 100]],
            moviles: [[350, 270, 'x', 130, 60]],
            bolas: [[400, 2600], [520, 3200]],
        },
    },
    {
        id: 'castillo', nombre: 'Castillo del Rey Troll', victorias: 30, peligro: 'pinchos ocultos y un muro en el centro',
        nivel: {
            nubes: true, suelo: [...BORDES, [120, 780]],
            muros: [[425, 250, 50]],
            pinchos: [[290, 2, true], [560, 2, true]],
            plataformas: [[150, 236, 110], [640, 236, 110], [395, 150, 110], [60, 130, 90], [750, 130, 90]],
        },
    },
];

// ---------- victorias guardadas ----------
export function victoriasArena() {
    try { return Math.max(0, Number(JSON.parse(localStorage.getItem(CLAVE))?.victorias) || 0); } catch (_e) { return 0; }
}
function sumarVictoria() {
    try { localStorage.setItem(CLAVE, JSON.stringify({ victorias: victoriasArena() + 1 })); } catch (_e) { /* sin almacenamiento */ }
}
export const arenaDisponible = a => victoriasArena() >= a.victorias;

// ---------- la partida ----------
let partida = null, api = null;
export const arenaActiva = () => partida;
export const esModoArena = modo => modo === 'duelo' || modo === 'equipos';

export function iniciarArena(ganchos) {
    api = ganchos;
    alRecibir('evento', m => {
        if (!partida) return;
        const scene = escena();
        switch (m.tipo) {
            case 'pvp': if (scene && m.ronda === partida.ronda) recibirGolpe(scene, m); break;
            case 'arenaCae':
                if (m.ronda !== partida.ronda) break;
                partida.vidas.set(m.de, Math.max(0, m.vidas | 0));
                revisarRonda();
                break;
            case 'arenaRonda': cerrarRonda(m); break;
            case 'salio':
                partida.equipos.delete(m.de);
                partida.vidas.delete(m.de);
                revisarRonda();
                break;
        }
    });
}

let juego = null;
export const usarJuego = j => { juego = j; };
const escena = () => (juego?.scene.isActive('juego') ? juego.scene.getScene('juego') : null);

// el anfitrión empezó una batalla: modo 'duelo' (cada uno solo) o 'equipos' (rojo y azul)
// apuesta: monedas que paga cada jugador al empezar (el equipo ganador se reparte el pozo)
export function empezarArena({ modo, arena, jugadores, apuesta = 0 }) {
    cerrarFin(); // (revancha: se cierra la pantalla final)
    apuesta = APUESTAS.includes(Number(apuesta)) ? Number(apuesta) : 0;
    if (apuesta) api.pagar(apuesta);
    partida = {
        modo,
        apuesta,
        arena: ARENAS.find(a => a.id === arena) || ARENAS[0],
        equipos: new Map(jugadores.map(j => [j.id, modo === 'equipos' ? (j.equipo === 1 ? 1 : 0) : j.id])),
        marcador: new Map(),
        ronda: 1,
        terminada: null,
    };
    nuevaRonda();
}
export const terminarArena = () => { partida = null; cerrarFin(); };

function nuevaRonda() {
    partida.vidas = new Map([...partida.equipos.keys()].map(id => [id, VIDAS]));
    partida.cerrada = false;
    partida.inicio = Date.now();
    partida.cuenta = false; // la cuenta regresiva se ve una vez por ronda
    partida.derrumbe = false;
}

export const equipoDe = id => partida?.equipos.get(id);
export const esRival = id => !!partida && equipoDe(id) !== undefined && equipoDe(id) !== equipoDe(red.tuId);
export const misVidas = () => partida?.vidas.get(red.tuId) ?? 0;
// número de "nivel" de la ronda (los mensajes de una ronda vieja no se mezclan con los de la nueva)
export const idNivelArena = () => 1000 + (partida?.ronda || 0);
const nombreDe = id => red.jugadores.find(j => j.id === id)?.nombre || 'Alguien';
export function nombreEquipo(equipo) {
    if (!partida) return '';
    return partida.modo === 'equipos' ? NOMBRES_EQUIPO[equipo] : nombreDe(equipo);
}
// color de un jugador: por equipos, rojo o azul; en duelo, tú azul y el rival rojo
export function colorDe(id) {
    if (!partida) return null;
    if (partida.modo === 'equipos') return COLORES_EQUIPO[equipoDe(id)];
    return id === red.tuId ? COLORES_EQUIPO[1] : COLORES_EQUIPO[0];
}

// ---------- el escenario (el juego lo arma como un nivel más) ----------
// suelo partido en piezas: los bordes se derrumban solos más tarde
export function nivelArena() {
    return {
        ...partida.arena.nivel,
        nombre: partida.arena.nombre, ancho: 900, arena: true,
        monedas: [], meta: 99999, oscuridad: 0.2,
        inicio: lugarDeAparicion(),
    };
}

// dónde aparece cada uno: un equipo a la izquierda y el otro a la derecha
export function lugarDeAparicion() {
    const orden = [...new Set([...partida.equipos.values()])];
    const lado = orden.indexOf(equipoDe(red.tuId)) % 2 === 0 ? -1 : 1;
    const mios = [...partida.equipos.entries()].filter(([, e]) => e === equipoDe(red.tuId)).map(([id]) => id).sort((a, b) => a - b);
    const k = Math.max(0, mios.indexOf(red.tuId));
    return [lado < 0 ? 140 + k * 70 : 760 - k * 70, 200]; // (cae sobre el suelo)
}

// al crear la escena de la arena
export function prepararArena(scene, alDañarRival) {
    scene.arena = partida;
    scene.rivales = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.physics.add.overlap(scene.flechasGrupo, scene.rivales, (flecha, rival) => {
        if (!flecha.perfora) flecha.destroy();
        alDañarRival(rival, 1, flecha.congela);
    });
    // la cámara muestra la arena entera
    scene.camaraArena = 450;
    scene.cameras.main.setZoom(scene.cameras.main.width / 900); // (justo los 900 px de la arena)
    // salud (como contra el jefe) y corazones de la ronda
    api.ponerVidas(scene, misVidas());
    scene.mascotaGesi.setFlipX(lugarDeAparicion()[0] > 450);
    // marcador arriba al centro
    scene.textoMarcador = scene.add.text(395, 40, '', {
        fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontStyle: '700', color: '#ffffff', stroke: '#000', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(55);
    pintarMarcador(scene);

    if (misVidas() <= 0) {
        // eliminado en esta ronda: mira cómo termina
        const g = scene.mascotaGesi;
        g.isDead = true;
        g.setVisible(false);
        g.body.enable = false;
        api.mensaje(scene, 'ELIMINADO\nmira cómo termina la ronda', 1800);
        return;
    }
    // al aparecer: unos segundos protegido (parpadea)
    scene.proteccionHasta = scene.time.now + PROTECCION_MS;
    scene.tweens.add({ targets: scene.mascotaGesi, alpha: 0.35, yoyo: true, repeat: 7, duration: 125, onComplete: () => scene.mascotaGesi.setAlpha(1) });
    if (!partida.cuenta) cuentaRegresiva(scene);
    // el derrumbe ya pasó en esta ronda (reapareciste después): los bordes siguen siendo lava
    if (partida.derrumbe) derrumbar(scene, false);
}

function cuentaRegresiva(scene) {
    partida.cuenta = true;
    partida.inicio = Date.now();
    scene.cinematica = true;
    const pasos = ['3', '2', '1', '¡A PELEAR!'];
    pasos.forEach((t, i) => scene.time.delayedCall(i * 700, () => {
        api.mensaje(scene, partida.ronda > 1 && i === 0 ? `RONDA ${partida.ronda}\n${t}` : t, 650);
        scene.sound.play(i < 3 ? 'menu_mover' : 'menu_ok', { volume: 0.6 });
        if (i === pasos.length - 1) {
            scene.cinematica = false;
            scene.proteccionHasta = scene.time.now + 600;
        }
    }));
}

function pintarMarcador(scene) {
    if (!scene.textoMarcador?.active) return;
    const orden = [...new Set([...partida.equipos.values()])];
    const partes = orden.map(e => `${nombreEquipo(e)} ${partida.marcador.get(e) || 0}`);
    scene.textoMarcador.setText(`RONDA ${partida.ronda} · ${partes.join('  –  ')}`);
}

// cada fotograma
export function actualizarArena(scene) {
    if (!scene.arena || partida.cerrada) return;
    const pasado = Date.now() - partida.inicio;
    if (partida.avisoDerrumbe !== partida.ronda && pasado > DERRUMBE_MS - 3000 && partida.cuenta) {
        partida.avisoDerrumbe = partida.ronda;
        api.mensaje(scene, '¡EL TROLL SE ABURRE!\nlos bordes se derrumban…', 2200);
        scene.cameras.main.shake(2600, 0.003);
        scene.sound.play('rugido', { volume: 0.5 });
    }
    if (!partida.derrumbe && pasado > DERRUMBE_MS && partida.cuenta) {
        partida.derrumbe = true;
        derrumbar(scene, true);
    }
}

// los bordes del suelo caen y queda lava
function derrumbar(scene, conEfecto) {
    [[0, 120], [780, 900]].forEach(([x0, x1]) => {
        scene.floor.getChildren().filter(p => p.body && Math.abs(p.body.top - (SUELO_Y)) < 8 && p.body.left >= x0 - 2 && p.body.right <= x1 + 2)
            .forEach(p => {
                p.body.enable = false;
                if (conEfecto) scene.tweens.add({ targets: p, y: p.y + 120, alpha: 0, duration: 700, ease: 'Quad.in', onComplete: () => p.destroy() });
                else p.destroy();
            });
        crearLava(scene, x0, x1);
    });
    if (conEfecto) scene.sound.play('romper', { volume: 0.7 });
}

// ---------- golpes entre jugadores ----------
// yo golpeé a un rival (lo decide mi pantalla): se le avisa solo a él
export function golpearRival(scene, rival, daño = 1, congela = 0, empuje = 0) {
    if (!partida || partida.cerrada || rival.rivalId == null) return;
    const ahora = scene.time.now;
    if (ahora < (rival.pvpHasta || 0)) return; // (un mismo ataque no cuenta varias veces seguidas)
    rival.pvpHasta = ahora + 300;
    const ox = scene.mascotaGesi.body.center.x;
    if (!empuje) empuje = Math.sign(rival.x - ox || 1) * 240;
    enviarEvento('pvp', { para: rival.rivalId, daño, congela, empuje, ox, ronda: partida.ronda });
    rival.setTintFill(0xffffff);
    scene.time.delayedCall(90, () => rival.active && rival.clearTint());
    scene.sound.play('bump', { volume: 0.5 });
}

// un rival me golpeó
function recibirGolpe(scene, m) {
    const g = scene.mascotaGesi;
    if (!scene.arena || g.isDead || scene.cinematica || scene.time.now < (scene.proteccionHasta || 0)) return;
    const daño = Math.max(0, Number(m.daño) || 0);
    const congela = Math.min(1500, (Number(m.congela) || 0) / 2); // contra jugadores, congelar dura la mitad
    if (daño > 0) {
        const antes = scene.salud;
        api.golpearme(scene, SALUD_POR_DAÑO[Math.min(4, Math.ceil(daño))], Number(m.ox));
        if (scene.salud === antes || g.isDead) return; // lo esquivó o lo paró (o ya cayó)
    }
    // empujón: más fuerte cuanto menos salud te queda
    const lado = Math.sign(Number(m.empuje) || g.body.center.x - Number(m.ox)) || 1;
    const fuerza = Math.min(560, Math.max(200, Math.abs(Number(m.empuje)) || 240) * (1 + (1 - scene.salud / 100) * 0.9));
    g.setVelocity(lado * fuerza, -220);
    scene.empujadoHasta = scene.time.now + 260 + congela;
    if (congela) {
        g.setTint(0x9fe8ff);
        scene.time.delayedCall(congela, () => g.active && !g.isDead && g.clearTint());
    }
}

// perdí un corazón (lava o sin salud)
export function arenaMuerte(scene) {
    const quedan = Math.max(0, misVidas() - 1);
    partida.vidas.set(red.tuId, quedan);
    api.ponerVidas(scene, quedan);
    enviarEvento('arenaCae', { vidas: quedan, ronda: partida.ronda });
    const ronda = partida.ronda;
    if (quedan > 0) {
        api.mensaje(scene, `¡PERDISTE UN CORAZÓN!\nte quedan ${quedan}`, ESPERA_REAPARECER);
        scene.time.delayedCall(ESPERA_REAPARECER, () => {
            if (partida && partida.ronda === ronda && !partida.cerrada && scene.scene.isActive()) api.reiniciar(scene);
        });
    } else {
        api.mensaje(scene, 'ELIMINADO\nmira cómo termina la ronda', 1800);
    }
    revisarRonda();
}

// el anfitrión cierra la ronda cuando queda un solo equipo con corazones
function revisarRonda() {
    if (!partida || partida.cerrada || !esAnfitrion()) return;
    const conVida = new Set([...partida.vidas.entries()]
        .filter(([id, n]) => n > 0 && red.jugadores.some(j => j.id === id)).map(([id]) => equipoDe(id)));
    if (conVida.size > 1) return;
    partida.cerrada = true;
    const ronda = partida.ronda;
    setTimeout(() => {
        const m = { ronda, ganador: conVida.size ? [...conVida][0] : null };
        enviarEvento('arenaRonda', m);
        cerrarRonda(m);
    }, 1200);
}

function cerrarRonda(m) {
    if (!partida || m.ronda !== partida.ronda || partida.fin === m.ronda) return;
    partida.fin = m.ronda;
    partida.cerrada = true;
    const scene = escena();
    const g = m.ganador;
    if (g != null) partida.marcador.set(g, (partida.marcador.get(g) || 0) + 1);
    if (scene) {
        pintarMarcador(scene);
        scene.cinematica = true;
        scene.sound.play('victoria', { volume: 0.5 });
    }
    const gano = g != null && (partida.marcador.get(g) || 0) >= RONDAS_PARA_GANAR;
    if (scene) api.mensaje(scene, g == null ? '¡EMPATE!' : `¡RONDA PARA\n${nombreEquipo(g).toUpperCase()}!`, 2400);
    setTimeout(() => {
        if (!partida) return;
        if (gano) { terminarPartida(g); return; }
        partida.ronda++;
        nuevaRonda();
        const s = escena();
        if (s) api.reiniciar(s);
    }, 2600);
}

// fin de la partida: premios y pantalla del ganador
function terminarPartida(ganador) {
    const scene = escena();
    const mio = ganador === equipoDe(red.tuId);
    partida.terminada = { ganador };
    if (mio) sumarVictoria();
    // con apuesta: el pozo (lo que pagaron todos) se reparte entre los del equipo ganador
    const ganadores = [...partida.equipos.values()].filter(e => e === ganador).length || 1;
    const pozo = partida.apuesta * partida.equipos.size;
    const premio = partida.apuesta ? (mio ? Math.floor(pozo / ganadores) : 0) : (mio ? 30 : 10);
    if (premio) api.premio(premio);
    if (scene) scene.cinematica = true;
    const orden = [...new Set([...partida.equipos.values()])];
    mostrarFin({
        mio,
        titulo: mio ? '¡VICTORIA!' : 'DERROTA',
        gana: `Gana ${nombreEquipo(ganador)}`,
        marcador: orden.map(e => `${nombreEquipo(e)}: ${partida.marcador.get(e) || 0}`).join('  ·  '),
        monedas: `${partida.apuesta ? `Pozo ◉ ${pozo} · ` : ''}${premio ? `◉ +${premio} monedas` : `Perdiste ◉ ${partida.apuesta}`}`
            + (mio ? ` · ${victoriasArena()} victorias en la arena` : ''),
    });
}

// pantalla final de la partida: capa HTML (como los menús), así los botones se pueden tocar
// en el celular (los dibujos del juego quedan debajo de los controles táctiles y del zoom de la arena)
let capaFin = null;
function mostrarFin(d) {
    cerrarFin();
    const anfitrion = esAnfitrion();
    capaFin = document.createElement('div');
    capaFin.className = 'menu-capa';
    capaFin.innerHTML = `
        <div class="menu-panel arena-fin ${d.mio ? 'gano' : ''}" role="dialog" aria-modal="true" aria-labelledby="arena-fin-titulo">
            <h2 id="arena-fin-titulo">${d.titulo}</h2>
            <p class="arena-fin-gana">${d.gana}</p>
            <p class="menu-nota">${d.marcador}</p>
            <p class="arena-fin-monedas">${d.monedas}</p>
            ${anfitrion ? `
            <button type="button" class="menu-boton sala-empezar" data-fin="revancha">↻ Revancha</button>
            <button type="button" class="menu-boton" data-fin="sala">☰ Volver a la sala</button>`
            : '<p class="menu-nota">Esperando a que el anfitrión elija revancha o volver a la sala…</p>'}
            <button type="button" class="menu-boton menu-salir" data-fin="salir">✕ Salir</button>
        </div>`;
    document.getElementById('game').append(capaFin);
    capaFin.addEventListener('click', e => {
        const accion = e.target.closest('[data-fin]')?.dataset.fin;
        if (!accion) return;
        cerrarFin();
        if (accion === 'revancha') api.revancha();
        else if (accion === 'sala') api.volverASala();
        else api.salir();
    });
    capaFin.addEventListener('keydown', e => e.stopPropagation());
    capaFin.querySelector('[data-fin]')?.focus();
}
export function cerrarFin() {
    capaFin?.remove();
    capaFin = null;
}
