// El jefe: el Rey Troll (CraftPix "2D Game Troll Free Character Sprites").
//
// Antes de la bandera hay una arena. Al entrar se cierran dos muros de roca, el troll cae
// del cielo y aparece su barra de vida. Hay que quitarle toda la vida para poder llegar a la meta.
//
// Es SIEMPRE el mismo troll: cada vez que lo vences huye herido ("¡volveré más fuerte!") y en el
// nivel siguiente vuelve habiendo aprendido algo nuevo. Cada encuentro enseña UNA cosa (se anuncia
// al empezar) y el último combina todo en tres fases:
//   1 · garrote y salto con onda                    -> saltar la onda
//   2 · + embestida (choca contra el muro: aturdido) -> aprovechar la ventana
//   3 · + coraza frontal y roca lanzada             -> atacar por la espalda, desde arriba o aturdido
//   4 · + rugido (caen rocas); la coraza se rompe   -> leer sombras; la pelea cambia de fase
//   5 · + terremoto al enfurecerse                  -> saltar con él
//   6 · tres fases: con coraza, sin coraza y furioso
// - camina hacia el jugador y lo golpea con el garrote cuando está cerca (destello rojo antes)
// - cada ataque especial tiene su aviso: un símbolo y un color propios sobre la cabeza
// - la dificultad sale de aprender sus patrones, no de que tenga más vida
// - durante la pelea el escudo no se recarga avanzando: solo aparecen cargas de escudo
//
// api: { killgesi(scene, daño, origenX), mostrarMensaje(scene, texto, ms), addToScore(n, origen, scene), soltarEscudo(scene, x, y) }

import { zoomCamara, RESOLUCION } from "./ajustes.js"

// En línea (scene.redJefe, ver multijugador.js): el troll lo maneja el ANFITRIÓN. Su pantalla decide
// a quién persigue (al jugador más cercano de la sala) y qué ataque usa, y avisa cada ataque
// ("jefeFx"); las demás pantallas mueven una copia del troll con lo que manda y cada una revisa si
// el ataque alcanzó a su propio jugador. La pelea empieza para todos cuando cualquiera entra.

const SUELO_Y = 332;
export const ANCHO_ARENA = 900;   // ancho de la arena (la cámara se aleja para verla entera)
const ZOOM_ARENA = 1.3;           // zoom de la cámara durante la pelea (~1200 px de ancho: se ve todo el troll y sus rocas)
const PISOTON_ESPERA = 900;       // ms entre pisotones que hacen daño
const PISOTONES_PARA_SACUDIR = 2; // pisotones seguidos antes de que se sacuda
// (cuadros de cada hoja: Walk tiene 9; la cuadrícula es de 5 x 2 y su último lugar está vacío)
const ANIMS = { idle: ['Idle', 10, 10, -1], walk: ['Walk', 9, 12, -1], run: ['Run', 10, 16, -1], attack: ['Attack', 10, 15, 0], hurt: ['Hurt', 10, 20, 0], dead: ['Dead', 10, 10, 0], jump: ['Jump', 10, 12, 0] };

// un encuentro por nivel con el mismo Rey Troll (se repite el último si hay más niveles)
//   ataques: especiales que ya sabe usar ('terremoto' solo cuando está furioso)
//   coraza: lo protege de frente mientras su vida esté por ENCIMA de esa fracción (null = sin coraza)
//   furia: con esa fracción de vida o menos se enfurece (más rápido y ataca más seguido)
//   leccion: lo que se anuncia al empezar · final: el último no huye, cae derrotado
const NOMBRE_JEFE = 'EL REY TROLL';
export const JEFES = [
    { encuentro: 1, troll: 3, vida: 10, vel: 70, escala: 0.56, ataques: ['salto'], coraza: null, furia: 0,
        leccion: 'Cuando salta, su onda recorre el suelo: ¡salta tú también!' },
    { encuentro: 2, troll: 3, vida: 14, vel: 80, escala: 0.58, ataques: ['salto', 'embestida'], coraza: null, furia: 0.4,
        leccion: 'NUEVO: EMBESTIDA. Si choca contra el muro queda aturdido.' },
    { encuentro: 3, troll: 3, vida: 16, vel: 85, escala: 0.6, ataques: ['salto', 'embestida', 'roca'], coraza: 0, furia: 0.4,
        leccion: 'NUEVO: CORAZA. De frente no le haces nada: por la espalda, desde arriba o aturdido.' },
    { encuentro: 4, troll: 3, vida: 20, vel: 95, escala: 0.62, ataques: ['salto', 'embestida', 'roca', 'rugido'], coraza: 0.5, furia: 0.5,
        leccion: 'NUEVO: RUGIDO. Hace caer rocas: mira sus sombras.' },
    { encuentro: 5, troll: 3, vida: 24, vel: 105, escala: 0.66, ataques: ['salto', 'embestida', 'roca', 'rugido', 'terremoto'], coraza: 0.5, furia: 0.6,
        leccion: 'NUEVO: TERREMOTO. Cuando se enfurece salta tres veces: ¡salta con él!' },
    { encuentro: 6, troll: 3, vida: 30, vel: 115, escala: 0.72, ataques: ['salto', 'embestida', 'roca', 'rugido', 'terremoto'], coraza: 0.66, furia: 0.33,
        leccion: 'Coraza, rocas y furia. Si lo vences, huirá al abismo...' },
    { encuentro: 7, troll: 3, vida: 34, vel: 120, escala: 0.74, ataques: ['salto', 'embestida', 'roca', 'rugido', 'terremoto'], coraza: 0.66, furia: 0.5,
        leccion: 'PELEA FINAL EN EL ABISMO: usa todo lo que aprendiste.', final: true },
];
// avisos de cada ataque especial: símbolo y color sobre la cabeza (siempre los mismos)
const AVISOS = {
    salto: ['↑', '#ffd27a'], embestida: ['»', '#ff5555'], roca: ['●', '#ffb070'],
    rugido: ['!!', '#ff5555'], terremoto: ['≈', '#ff5555'],
};
const ATURDIDO_MS = 1100; // ventana para atacarlo tras chocar contra el muro (la coraza no lo protege)

// solo se cargan los trolls que usan los encuentros (cada uno ocupa ~73 MB en la tarjeta de video)
const TROLLS = [...new Set(JEFES.map(j => j.troll))];

// Las hojas del troll son cuadrículas de 5 x 2 cuadros de 600 x 440 (3000 x 880): antes eran tiras de
// 6000 px y muchos celulares no cargan imágenes de más de 4096 px (el troll quedaba invisible).
// Con gráficos bajos (resolución 1,25 o menos) se usan las "_ligero" (cuadros de 300 x 220, 4 veces
// menos memoria de video) y el troll se dibuja al doble: se ve igual de grande.
export const TROLL_LIGERO = RESOLUCION <= 1.25;
const K_TROLL = TROLL_LIGERO ? 2 : 1; // cuánto más chico es cada cuadro de la hoja
// escala para dibujar al troll en otros lados (portada, historia, arena): igual de grande con las dos hojas
export const escalaTroll = e => e * K_TROLL;
export function cargarJefes(scene) {
    TROLLS.forEach(k => Object.values(ANIMS).forEach(([archivo]) => {
        scene.load.spritesheet(`troll${k}_${archivo}`, `assets/jefes/troll${k}_${archivo}${TROLL_LIGERO ? '_ligero' : ''}.png`,
            { frameWidth: 600 / K_TROLL, frameHeight: 440 / K_TROLL });
    }));
}

export function crearAnimacionesJefes(scene) {
    if (scene.anims.exists(`troll${TROLLS[0]}-idle`)) return;
    TROLLS.forEach(k => Object.entries(ANIMS).forEach(([clave, [archivo, frames, frameRate, repeat]]) => {
        scene.anims.create({
            key: `troll${k}-${clave}`,
            frames: scene.anims.generateFrameNumbers(`troll${k}_${archivo}`, {
                start: 0, end: Math.min(frames, scene.textures.get(`troll${k}_${archivo}`).frameTotal - 1) - 1,
            }),
            frameRate, repeat,
        });
    }));
}

// prepara la arena; el jefe aparece cuando el jugador entra
export function prepararJefe(scene, nivel, indice) {
    const datos = JEFES[indice % JEFES.length];
    // en niveles altos el troll pega más fuerte y aparecen menos ayudas
    scene.dañoJefe = 1 + 0.2 * indice;              // nivel 1: x1  ...  nivel 6: x2
    scene.esperaAyudas = 6000 + 2000 * indice;      // nivel 1: cada 6 s  ...  nivel 6: cada 16 s
    scene.curacionArena = Math.max(20, 45 - 5 * indice);
    const meta = nivel.meta;
    scene.jefe = {
        datos: { ...datos, nombre: NOMBRE_JEFE }, indice,
        arenaIni: meta - ANCHO_ARENA - 50, arenaFin: meta - 50,
        estado: 'esperando', vida: scene.vidaJefeInicial ?? datos.vida, vidaMax: datos.vida,
        reintento: scene.vidaJefeInicial != null,
        derrotado: false, sprite: null, muros: [],
    };
    // antesala: un cartel de piedra (este no miente) anuncia la guarida
    const cx = meta - ANCHO_ARENA - 260;
    scene.add.rectangle(cx, (SUELO_Y + 150) / 2 + 10, 5, SUELO_Y - 160, 0x3a3440);
    scene.add.text(cx, 150, datos.final ? 'TRONO DEL\nREY TROLL' : 'GUARIDA DEL\nREY TROLL', {
        fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ff9a9a', align: 'center',
        backgroundColor: '#2a2230', padding: { x: 6, y: 5 },
    }).setOrigin(0.5).setDepth(42);
}

// muro de roca que sale del suelo
function crearMuro(scene, x) {
    const visual = scene.add.tileSprite(x - 20, SUELO_Y, 40, 332, 'mz_relleno').setOrigin(0, 0).setTint(0x9a8f88).setDepth(35);
    const tope = scene.add.tileSprite(x - 24, SUELO_Y, 48, 64, 'mz_suelo').setOrigin(0, 0).setDepth(35);
    scene.tweens.add({ targets: [visual, tope], y: '-=332', duration: 450, ease: 'Back.out' });
    const cuerpo = scene.add.zone(x, SUELO_Y / 2, 40, SUELO_Y);
    scene.physics.add.existing(cuerpo, true);
    scene.physics.add.collider(scene.mascotaGesi, cuerpo);
    scene.physics.add.collider(scene.enemies, cuerpo); // los enemigos normales no entran a la arena
    return { visual, tope, cuerpo };
}

function empezarPelea(scene, api) {
    const j = scene.jefe, d = j.datos;
    const ahora = scene.time.now;
    const corta = j.reintento; // al volver después de morir, la entrada es más corta
    const DURACION = corta ? 1600 : 3600;
    j.estado = 'pelea';
    scene.peleaJefe = true;
    scene.limiteDerecho = j.arenaFin - 40;
    scene.cinematica = true;
    scene.salud = scene.salud ?? 100;

    // si muere, vuelve a la entrada de la arena
    scene.reaparecerEnArena?.(j.arenaIni + 40);
    scene.recargarParaJefe?.();

    // la música del nivel se apaga
    if (scene.musica) scene.tweens.add({ targets: scene.musica, volume: 0, duration: 600, onComplete: () => scene.musica?.pause() });

    // barras negras de cine
    const barraArriba = scene.add.rectangle(0, -45, 790, 45, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(70);
    const barraAbajo = scene.add.rectangle(0, 380, 790, 45, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(70);
    scene.tweens.add({ targets: barraArriba, y: 0, duration: 400 });
    scene.tweens.add({ targets: barraAbajo, y: 335, duration: 400 });

    j.muros = [crearMuro(scene, j.arenaIni), crearMuro(scene, j.arenaFin)];
    scene.sound.play('romper', { volume: 0.6 });

    // la cámara se aleja para ver toda la arena
    scene.camaraArena = (j.arenaIni + j.arenaFin) / 2;
    scene.tweens.add({ targets: scene.cameras.main, zoom: Math.min(ZOOM_ARENA * RESOLUCION / 2, zoomCamara()), duration: 900, ease: 'Sine.inOut' });

    // los enemigos normales que estaban en la arena se desvanecen: el troll pelea solo
    scene.enemies.getChildren().slice().forEach(e => {
        const ex = e.body ? e.body.center.x : e.x; // el centro del cuerpo (la imagen empieza más a la izquierda)
        if (ex > j.arenaIni - 40 && ex < j.arenaFin + 40) {
            e.body.enable = false;
            scene.tweens.add({ targets: e, alpha: 0, duration: 400, onComplete: () => e.destroy() });
        }
    });
    j.pisotones = [];
    j.proxPisoton = 0;
    j.sacudidaHasta = 0;
    j.huidaHasta = 0;
    j.encimaDesde = 0;

    // el troll cae del cielo
    const s = scene.physics.add.sprite(j.arenaFin - 150, -80, `troll${d.troll}_Idle`).setOrigin(0.5, 1).setScale(d.escala * K_TROLL).setDepth(20);
    // (el cuerpo se mide en píxeles de la hoja: con la ligera, todo a la mitad)
    s.body.setSize(110 / K_TROLL, 210 / K_TROLL).setOffset(235 / K_TROLL, (440 - 214) / K_TROLL);
    s.setGravityY(300);
    s.body.pushable = false;
    s.flipX = true;
    s.anims.play(`troll${d.troll}-jump`);
    j.sprite = s;
    if (esReplica(scene)) s.body.moves = false; // en línea lo mueve el anfitrión
    j.proxAtaque = ahora + DURACION + 800;
    j.proxEspecial = ahora + DURACION + 2500;
    j.invulHasta = 0;
    j.ocupadoHasta = ahora + DURACION;
    j.enAire = true;
    j.aturdidoHasta = 0;
    j.coraza = tieneCoraza(j);
    if (j.coraza) crearCoraza(scene, j);
    if (d.furia && j.vida <= j.vidaMax * d.furia) j.furioso = true;
    restaurarTinte(j);

    scene.physics.add.collider(s, scene.floor);
    j.muros.forEach(m => scene.physics.add.collider(s, m.cuerpo));
    scene.physics.add.collider(scene.mascotaGesi, s, () => contactoConJefe(scene, api), () => !scene.mascotaGesi.isDead);
    scene.physics.add.overlap(scene.flechasGrupo, s, (a, b) => {
        const flecha = a === s ? b : a;
        if (!flecha.perfora) flecha.destroy();
        dañarJefe(scene, 1, api, flecha.x);
    });

    // rugido cuando cae
    scene.time.delayedCall(corta ? 500 : 900, () => {
        scene.sound.play('rugido', { volume: 0.9 });
        scene.cameras.main.shake(600, 0.012);
        scene.cameras.main.flash(200, 120, 20, 20);
    });

    // cartel con el nombre del jefe
    if (!corta) {
        const franja = scene.add.rectangle(395, 190, 790, 70, 0x5a0b14, 0.85).setScrollFactor(0).setDepth(71).setScale(0, 1);
        const nombre = scene.add.text(395, 178, d.nombre, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '20px', color: '#ffe9a8', stroke: '#000', strokeThickness: 6,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(72).setAlpha(0).setScale(1.6);
        const sub = scene.add.text(395, 210, `ENCUENTRO ${d.encuentro} · ${d.leccion}`, {
            fontFamily: 'monospace', fontSize: '11px', color: '#ffb4b4', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(72).setAlpha(0);
        scene.tweens.add({ targets: franja, scaleX: 1, delay: 1100, duration: 350, ease: 'Cubic.out' });
        scene.tweens.add({ targets: nombre, alpha: 1, scale: 1, delay: 1300, duration: 350, ease: 'Back.out' });
        scene.tweens.add({ targets: sub, alpha: 1, delay: 1600, duration: 300 });
        scene.tweens.add({ targets: [franja, nombre, sub], alpha: 0, delay: DURACION - 500, duration: 400, onComplete: () => [franja, nombre, sub].forEach(o => o.destroy()) });
    } else {
        api.mostrarMensaje(scene, '¡OTRA VEZ!', 1200);
        // al reintentar se repite la lección, corta
        scene.time.delayedCall(1300, () => api.mostrarMensaje(scene, d.leccion, 2200));
    }

    // barra de vida del jefe (se llena hasta la vida que le queda)
    const x0 = 395 - 140;
    j.barraFondo = scene.add.rectangle(395, 62, 284, 14, 0x000000, 0.7).setStrokeStyle(2, 0xffe9a8).setScrollFactor(0).setDepth(50);
    j.barra = scene.add.rectangle(x0, 62, 280, 10, 0xd62839).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    j.barra.width = 0;
    j.nombre = scene.add.text(395, 44, d.nombre, {
        fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#ffe9a8', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    scene.tweens.add({ targets: j.barra, width: 280 * j.vida / j.vidaMax, delay: corta ? 300 : 1800, duration: 900, ease: 'Cubic.out' });

    // barra de vida del jugador
    scene.mostrarBarraSalud?.();

    // fin de la cinemática: empieza la pelea con su música
    scene.time.delayedCall(DURACION, () => {
        scene.cinematica = false;
        scene.tweens.add({ targets: barraArriba, y: -45, duration: 400, onComplete: () => barraArriba.destroy() });
        scene.tweens.add({ targets: barraAbajo, y: 380, duration: 400, onComplete: () => barraAbajo.destroy() });
        if (j.estado !== 'pelea') return;
        scene.musicaBatalla = scene.sound.add('musica_batalla', { loop: true, volume: 0.3 });
        scene.musicaBatalla.play();
        if (!corta) api.mostrarMensaje(scene, '¡PELEA!', 900);
    });
    scene.events.once('shutdown', () => scene.musicaBatalla?.destroy());

    // en la arena aparecen más escudos y corazones para protegerse y curarse
    const sueltos = { escudo: null, corazon: null };
    scene.time.addEvent({
        delay: scene.esperaAyudas, loop: true, callback: () => {
            if (j.estado !== 'pelea' || scene.mascotaGesi.isDead || scene.cinematica) return;
            // solo una ayuda en la arena a la vez
            if ((sueltos.escudo && sueltos.escudo.active) || (sueltos.corazon && sueltos.corazon.active)) return;
            const x = Phaser.Math.Between(j.arenaIni + 80, j.arenaFin - 80);
            const faltaEscudo = !scene.tieneEscudo, faltaSalud = scene.faltaSalud?.();
            if (faltaEscudo && (!faltaSalud || Math.random() < 0.5)) sueltos.escudo = api.soltarEscudo(scene, x, SUELO_Y - 30, 7000);
            else if (faltaSalud) sueltos.corazon = scene.soltarCorazonArena?.(x, SUELO_Y - 30);
        },
    });
}

function contactoConJefe(scene, api) {
    const j = scene.jefe, g = scene.mascotaGesi;
    if (!j || j.estado !== 'pelea') return;
    // saltarle encima: le quita vida y rebota (pero no se deja pisar seguido)
    if (g.body.touching.down && j.sprite.body.touching.up) {
        const ahora = scene.time.now;
        g.setVelocityY(-380);
        // si insiste mientras está protegido, se lo quita de encima de nuevo
        if (ahora < j.sacudidaHasta) { if (ahora > (j.ultimaSacudida || 0) + 400) sacudirse(scene); return; }
        if (ahora < j.proxPisoton) return; // no le hace daño
        dañarJefe(scene, 1, api);
        j.proxPisoton = ahora + PISOTON_ESPERA;
        j.pisotones = j.pisotones.filter(t => ahora - t < 4000);
        j.pisotones.push(ahora);
        const limite = j.furioso ? 1 : PISOTONES_PARA_SACUDIR;
        if (j.pisotones.length >= limite) sacudirse(scene);
        return;
    }
    if (scene.protegido?.()) dañarJefe(scene, 1, api, g.body.center.x); // con la embestida de Leo le pegas al chocar, pero igual te golpea
    api.killgesi(scene, 15, j.sprite.body.center.x);
}

// origenX: desde dónde llega el golpe (para la coraza); los pisotones desde arriba no lo pasan
// remoto: el golpe lo dio otro jugador (en línea) y ya pasó su coraza e invulnerabilidad allá
export function dañarJefe(scene, cantidad, api, origenX, remoto = false) {
    const j = scene.jefe;
    if (!j || j.estado !== 'pelea' || (!remoto && scene.time.now < j.invulHasta)) return false;
    // coraza: de frente no le entra nada, salvo que esté aturdido
    if (!remoto && j.coraza && origenX !== undefined && scene.time.now >= j.aturdidoHasta) {
        const sb = j.sprite.body, frente = j.sprite.flipX ? -1 : 1;
        if ((origenX - sb.center.x) * frente > 0) { rebotaEnCoraza(scene, j); return false; }
    }
    j.vida = Math.max(0, j.vida - cantidad);
    if (!remoto) scene.alDañarJefe?.(cantidad); // en línea: los demás también se lo restan
    scene.guardarVidaJefe?.(j.vida);
    j.invulHasta = scene.time.now + 250;
    j.barra.width = 280 * j.vida / j.vidaMax;
    const s = j.sprite;
    s.setTintFill(0xffffff);
    scene.time.delayedCall(80, () => { if (s.active) restaurarTinte(j); });
    scene.sound.play('bump', { volume: 0.5 });
    api.addToScore(25, s, scene);

    if (j.vida <= 0) {
        derrotar(scene, api);
        return true;
    }
    // cambio de fase: se le rompe la coraza
    if (j.coraza && !tieneCoraza(j)) {
        j.coraza = false;
        romperCoraza(scene, j);
        api.mostrarMensaje(scene, '¡SE LE ROMPE\nLA CORAZA!', 1300);
    } else if (!j.furioso && j.datos.furia && j.vida <= j.vidaMax * j.datos.furia) {
        // cambio de fase: se enfurece (más rápido, ataca más seguido y, si lo sabe, usa el terremoto)
        j.furioso = true;
        restaurarTinte(j);
        scene.sound.play('rugido', { volume: 0.8, rate: 1.2 });
        scene.cameras.main.shake(400, 0.007);
        api.mostrarMensaje(scene, '¡SE ENFURECE!', 1200);
    }
    return true;
}

// ---------- Congelar y aturdir (poderes.js) ----------
// Los poderes que congelan o aturden también le hacen efecto al troll, pero CORTO y con un tiempo
// inmune después: nadie lo deja quieto toda la pelea. Quieto, la coraza no lo protege.
// (Empujar y atraer no lo mueven: es enorme. Solo hacen su daño.)
const QUIETO_JEFE_MAX = 1000;   // ms como mucho congelado o aturdido (detener el tiempo: 2000)
const INMUNE_ESTADOS = 6000;    // ms sin poder volver a congelarlo o aturdirlo
// remoto: lo aplicó otra pantalla en línea (ya revisó la inmunidad y avisó a todos)
export function alterarJefe(scene, tipo, ms, remoto = false) {
    const j = scene.jefe;
    if (!j || j.estado !== 'pelea' || !j.sprite?.active) return false;
    const ahora = scene.time.now;
    if (!remoto && ahora < (j.inmuneEstadosHasta || 0)) return false;
    const dura = Math.min(tipo === 'tiempo' ? 2000 : QUIETO_JEFE_MAX, Math.max(300, ms | 0));
    j.inmuneEstadosHasta = ahora + dura + INMUNE_ESTADOS;
    j.ocupadoHasta = Math.max(j.ocupadoHasta || 0, ahora + dura);
    j.aturdidoHasta = Math.max(j.aturdidoHasta || 0, ahora + dura); // (sin coraza mientras está quieto)
    j.embistiendo = false;
    j.huidaHasta = 0;
    const s = j.sprite;
    s.setVelocityX(0);
    if (tipo === 'aturdir') mareado(scene, s);
    else {
        // congelado (o el tiempo detenido): azul y sin moverse
        s.setTint(0x9fe8ff);
        s.anims.pause();
        scene.time.delayedCall(dura, () => { if (s.active) { s.anims.resume(); restaurarTinte(j); } });
    }
    if (!remoto) scene.alAlterarJefe?.(tipo, dura); // en línea: a todos (el anfitrión lo deja quieto de verdad)
    return true;
}

// ---------- Coraza y tintes ----------
function tieneCoraza(j) {
    return j.datos.coraza !== null && j.datos.coraza !== undefined && j.vida > j.vidaMax * j.datos.coraza;
}

// placa de metal delante del troll, con un brillo azul que respira (se mueve con él en actualizarJefe)
function crearCoraza(scene, j) {
    j.brilloPlaca = scene.add.image(0, 0, 'brillo').setScale(0.9, 1.6).setTint(0x7f9cff).setAlpha(0.35).setBlendMode('ADD').setDepth(21);
    j.placa = scene.add.image(0, 0, 'mz_bloque').setScale(0.9, 2.2).setTint(0xaab4ff).setDepth(22);
    scene.tweens.add({ targets: j.brilloPlaca, alpha: 0.15, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
}

function moverCoraza(j) {
    if (!j.placa) return;
    const b = j.sprite.body, frente = j.sprite.flipX ? -1 : 1;
    j.placa.setPosition(b.center.x + frente * (b.width / 2 + 4), b.center.y - 4);
    j.brilloPlaca.setPosition(j.placa.x, j.placa.y);
}

function rebotaEnCoraza(scene, j) {
    const ahora = scene.time.now;
    if (ahora < (j.proxRebote || 0)) return;
    j.proxRebote = ahora + 250;
    scene.sound.play('bump', { volume: 0.6, rate: 2 });
    if (j.placa) {
        const chispa = scene.add.image(j.placa.x, j.placa.y - 10, 'brillo').setDepth(45).setScale(0.6).setTint(0xfff2a0).setBlendMode('ADD');
        scene.tweens.add({ targets: chispa, scale: 1.2, alpha: 0, duration: 220, onComplete: () => chispa.destroy() });
        scene.tweens.add({ targets: j.placa, x: j.placa.x + (j.sprite.flipX ? -3 : 3), yoyo: true, duration: 50 });
    }
    if (ahora > (j.proxTextoCoraza || 0)) {
        j.proxTextoCoraza = ahora + 1500;
        const t = scene.add.text(j.sprite.x, j.sprite.body.top - 24, '¡CORAZA!', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#cfd6ff', stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(45);
        scene.tweens.add({ targets: t, y: t.y - 16, alpha: 0, delay: 300, duration: 450, onComplete: () => t.destroy() });
    }
}

function romperCoraza(scene, j) {
    scene.sound.play('romper', { volume: 0.8 });
    scene.cameras.main.shake(300, 0.01);
    const p = j.placa;
    j.placa = null;
    j.brilloPlaca?.destroy();
    if (p) scene.tweens.add({ targets: p, y: SUELO_Y + 40, angle: j.sprite.flipX ? -70 : 70, alpha: 0, duration: 600, ease: 'Quad.in', onComplete: () => p.destroy() });
}

// rojo si está furioso, normal si no
function restaurarTinte(j) {
    const s = j.sprite;
    if (!s || !s.active) return;
    s.clearTint();
    if (j.furioso) s.setTint(0xff8a8a);
}

function derrotar(scene, api) {
    const j = scene.jefe, s = j.sprite;
    j.estado = 'derrotado';
    j.derrotado = true;
    scene.peleaJefe = false;
    scene.camaraArena = null;
    scene.tweens.add({ targets: scene.cameras.main, zoom: zoomCamara(), delay: 1500, duration: 900, ease: 'Sine.inOut' });
    scene.limiteDerecho = null;
    if (j.placa) { j.placa.destroy(); j.placa = null; }
    j.brilloPlaca?.destroy();
    s.body.moves = true;
    s.setVelocity(0, 0).clearTint();
    s.body.checkCollision.none = true;
    camaraLenta(scene);
    scene.sound.play('rugido', { volume: 0.8, rate: 0.7 });
    scene.sound.play('matar');
    if (j.datos.final) {
        // el último encuentro: cae derrotado para siempre
        s.anims.play(`troll${j.datos.troll}-dead`);
    } else {
        // huye herido: tambalea, salta fuera de la arena y promete volver
        s.anims.play(`troll${j.datos.troll}-hurt`);
        scene.tweens.add({ targets: s, angle: { from: -10, to: 10 }, yoyo: true, repeat: 4, duration: 90, onComplete: () => s.setAngle(0) });
        scene.time.delayedCall(1300, () => {
            if (!s.active) return;
            s.anims.play(`troll${j.datos.troll}-jump`);
            s.body.setAllowGravity(true);
            s.setVelocity(260, -620);
            const amenaza = scene.add.text(s.x, s.body.top - 30, '¡VOLVERÉ MÁS FUERTE!', {
                fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#ff9a9a', stroke: '#000', strokeThickness: 4,
            }).setOrigin(0.5).setDepth(45);
            scene.tweens.add({ targets: amenaza, y: amenaza.y - 30, alpha: 0, delay: 900, duration: 700, onComplete: () => amenaza.destroy() });
        });
    }
    // termina la música de batalla y vuelve la del nivel
    scene.tweens.add({ targets: scene.musicaBatalla, volume: 0, duration: 1200, onComplete: () => { scene.musicaBatalla?.stop(); if (scene.musica) { scene.musica.setVolume(0.25); scene.musica.resume(); } } });
    scene.cameras.main.flash(300, 255, 230, 180);
    scene.cameras.main.shake(600, 0.01);
    api.addToScore(2000, s, scene);
    api.mostrarMensaje(scene, j.datos.final ? '¡EL REY TROLL\nCAYÓ!' : `¡VICTORIA!\nEL REY TROLL HUYE`, 2200);

    // se va la barra y se derrumban los muros
    [j.barra, j.barraFondo, j.nombre].forEach(o => scene.tweens.add({ targets: o, alpha: 0, duration: 600, onComplete: () => o.destroy() }));
    scene.time.delayedCall(900, () => {
        scene.sound.play('romper');
        j.muros.forEach(m => {
            m.cuerpo.body.enable = false;
            scene.tweens.add({ targets: [m.visual, m.tope], y: '+=340', alpha: 0, duration: 800, ease: 'Quad.in' });
        });
    });
    scene.tweens.add({ targets: s, alpha: 0, delay: 2500, duration: 800 });
}

export function actualizarJefe(scene, time, api) {
    const j = scene.jefe;
    if (!j) return;
    const g = scene.mascotaGesi;

    if (j.estado === 'esperando') {
        if (!j.avisado && !g.isDead && g.x > j.arenaIni - 380) {
            // se acerca el jefe: la tierra tiembla y se escucha a lo lejos
            j.avisado = true;
            if (!j.reintento) {
                scene.cameras.main.shake(900, 0.004);
                scene.sound.play('rugido', { volume: 0.35, rate: 0.75 });
                const d = j.datos;
                api.mostrarMensaje(scene, d.encuentro === 1 ? 'Algo enorme se acerca...'
                    : d.final ? 'El trono tiembla...' : '¡El Rey Troll volvió!', 1600);
            }
        }
        if (!g.isDead && g.x > j.arenaIni + 60) {
            empezarPelea(scene, api);
            scene.redJefe?.avisar('empieza'); // en línea: la pelea empieza para todos
        }
        return;
    }
    if (j.estado !== 'pelea') return;
    if (esReplica(scene)) { seguirAlAnfitrion(scene, time); return; }
    // en línea el troll pelea contra el jugador más cercano de la sala (puede ser de otra pantalla)
    const otro = scene.redJefe?.cercano(j.sprite);
    if (otro) scene.redJefe.comoJugador(otro, () => pelear(scene, time, api));
    else pelear(scene, time, api);
}

function pelear(scene, time, api) {
    const j = scene.jefe, g = scene.mascotaGesi;
    const s = j.sprite, b = s.body, d = j.datos;
    moverCoraza(j);
    const margen = 130 * d.escala / 0.6; // medio ancho del troll con su garrote
    if (s.x < j.arenaIni + margen || s.x > j.arenaFin - margen) {
        s.x = Phaser.Math.Clamp(s.x, j.arenaIni + margen, j.arenaFin - margen);
        if (j.embistiendo) j.finEmbestida = 0; // la embestida termina contra el muro
        j.huidaHasta = 0;
        s.setVelocityX(0);
    }
    const enSuelo = b.blocked.down || b.touching.down;
    const dx = g.body.center.x - b.center.x;
    const vel = d.vel * (j.furioso ? 1.45 : 1);

    // al caer de un salto: onda expansiva
    if (j.enAire && enSuelo) {
        j.enAire = false;
        ondaExpansiva(scene, b.center.x, api);
        j.ocupadoHasta = time + 450;
    }
    // después de sacudirse, corre rápido lejos del jugador
    if (time < j.huidaHasta) {
        s.setVelocityX(j.dirHuida * vel * 3);
        s.flipX = j.dirHuida < 0;
        if (b.blocked.left || b.blocked.right) j.huidaHasta = 0;
        return;
    }

    // si el jugador se queda parado sobre su cabeza, se lo quita de encima
    const gb = g.body;
    const encima = Math.abs(gb.bottom - b.top) < 6 && gb.right > b.left && gb.left < b.right;
    if (encima) {
        if (!j.encimaDesde) j.encimaDesde = time;
        if (time - j.encimaDesde > 350) { sacudirse(scene); j.encimaDesde = 0; return; }
    } else {
        j.encimaDesde = 0;
    }

    // embestida: corre en línea recta hasta chocar con un muro
    if (j.embistiendo) {
        s.setVelocityX(j.dirEmbestida * vel * 3.2);
        if (b.blocked.left || b.blocked.right || time > j.finEmbestida) {
            j.embistiendo = false;
            s.setVelocityX(0);
            scene.cameras.main.shake(350, 0.01);
            scene.sound.play('romper', { volume: 0.7 });
            caenRocas(scene, 3, api); // al chocar con el muro caen rocas
            j.ocupadoHasta = time + ATURDIDO_MS; // queda aturdido: momento para atacarlo
            j.aturdidoHasta = time + ATURDIDO_MS; // (y la coraza no lo protege)
            mareado(scene, s);
        }
        return;
    }
    if (time < j.ocupadoHasta || !enSuelo || g.isDead) {
        if (enSuelo) s.setVelocityX(0);
        return;
    }

    s.flipX = dx < 0;
    const distancia = Math.abs(dx);
    const cerca = distancia < 110 && Math.abs(g.body.center.y - b.center.y) < 90;

    if (time > j.proxEspecial) {
        // ataques especiales: uno al azar entre los que ya sabe (sin repetir el anterior).
        // Van primero: aunque el jugador se pegue a él, el troll muestra lo que aprendió
        const lista = d.ataques.filter(a => a !== 'terremoto' || j.furioso);
        if (j.furioso && lista.includes('embestida')) lista.push('embestida');
        let ataque;
        do { ataque = lista[Math.floor(Math.random() * lista.length)]; } while (ataque === j.ultimoEspecial && new Set(lista).size > 1);
        if (ataque === 'embestida' && distancia < 160) ataque = 'salto';
        j.ultimoEspecial = ataque;
        j.proxEspecial = time + (j.furioso ? 2600 : 4200) + Math.random() * 1200;
        j.proxAtaque = Math.max(j.proxAtaque, time + 900); // nunca un garrotazo pegado a un especial
        ESPECIALES[ataque](scene, api, dx);
    } else if (cerca && time > j.proxAtaque) {
        // de cerca: garrotazo (furioso hace un combo de dos golpes)
        garrotazo(scene, api, 0);
        if (j.furioso) garrotazo(scene, api, 650);
        j.ocupadoHasta = time + (j.furioso ? 1350 : 700);
        j.proxAtaque = time + (j.furioso ? 1100 : 1500);
    } else {
        // caminar hacia el jugador
        s.setVelocityX(Math.sign(dx) * vel);
        s.anims.play(`troll${d.troll}-walk`, true);
        s.anims.timeScale = j.furioso ? 1.4 : 1;
    }
}

// ---------- Ataques del troll ----------

// se sacude con fuerza: lanza al jugador lejos y sale corriendo
function sacudirse(scene) {
    const j = scene.jefe, s = j.sprite, g = scene.mascotaGesi, d = j.datos;
    if (j.estado !== 'pelea') return;
    const ahora = scene.time.now;
    j.pisotones = [];
    j.ultimaSacudida = ahora;
    j.sacudidaHasta = Math.max(j.sacudidaHasta, ahora + 2500); // un rato sin que los pisotones le hagan daño
    j.embistiendo = false;

    // lanza al jugador hacia un lado
    const lado = g.body.center.x < s.body.center.x ? -1 : 1;
    g.setVelocity(lado * 420, -460);
    scene.sound.play('rugido', { volume: 0.7, rate: 1.3 });
    scene.cameras.main.shake(250, 0.008);
    s.anims.play(`troll${d.troll}-hurt`, true);
    scene.tweens.add({ targets: s, angle: { from: -8, to: 8 }, yoyo: true, repeat: 3, duration: 60, onComplete: () => s.setAngle(0) });
    const t = scene.add.text(s.x, s.body.top - 24, '¡FUERA!', {
        fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#ffd27a', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(45);
    scene.tweens.add({ targets: t, y: t.y - 20, alpha: 0, delay: 400, duration: 500, onComplete: () => t.destroy() });

    // y corre hacia el otro lado
    j.dirHuida = -lado;
    j.huidaHasta = ahora + 300 + 650;
    j.ocupadoHasta = ahora + 300;
}

function garrotazo(scene, api, retraso) {
    const j = scene.jefe, s = j.sprite, b = s.body, d = j.datos;
    scene.time.delayedCall(retraso, () => {
        if (j.estado !== 'pelea') return;
        s.setVelocityX(0);
        s.anims.play(`troll${d.troll}-attack`, true);
        // aviso del garrotazo: destello rojo mientras levanta el garrote
        destelloGarrote(scene);
        avisar(scene, 'garrote');
        scene.time.delayedCall(330, () => {
            if (j.estado !== 'pelea') return;
            const dir = s.flipX ? -1 : 1;
            const zona = new Phaser.Geom.Rectangle(dir > 0 ? b.right - 10 : b.left - 120, b.top, 130, b.height);
            avisar(scene, 'zona', { x: Math.round(zona.x), y: Math.round(zona.y), w: zona.width, h: Math.round(zona.height), ox: Math.round(b.center.x) });
            golpeDeGarrote(scene, zona, b.center.x, api);
        });
    });
}

function destelloGarrote(scene) {
    const j = scene.jefe;
    j.sprite.setTintFill(0xff5050);
    scene.time.delayedCall(110, () => restaurarTinte(j));
}

function golpeDeGarrote(scene, zona, origenX, api) {
    scene.sound.play('golpe_enemigo', { volume: 0.7, rate: 0.7 });
    const gb = scene.mascotaGesi.body;
    if (Phaser.Geom.Intersects.RectangleToRectangle(zona, new Phaser.Geom.Rectangle(gb.left, gb.top, gb.width, gb.height))) api.killgesi(scene, 25, origenX);
}

// aviso sobre la cabeza: cada ataque especial tiene su símbolo y su color (ver AVISOS)
function aviso(scene, s, ataque) {
    avisar(scene, 'aviso', { ataque });
    avisoVisible(scene, s, ataque);
}

function avisoVisible(scene, s, ataque) {
    const [simbolo, color] = AVISOS[ataque];
    const t = scene.add.text(s.x, s.body.top - 26, simbolo, {
        fontFamily: '"Press Start 2P", monospace', fontSize: '18px', color, stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(45);
    scene.tweens.add({ targets: t, y: t.y - 12, alpha: 0, delay: 350, duration: 400, onComplete: () => t.destroy() });
}

function mareado(scene, s) {
    avisar(scene, 'mareado');
    const t = scene.add.text(s.x, s.body.top - 20, '★ ★', { fontSize: '14px', color: '#ffe066', stroke: '#000', strokeThickness: 3 })
        .setOrigin(0.5).setDepth(45);
    scene.tweens.add({ targets: t, angle: 360, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
    s.anims.play(`troll${scene.jefe.datos.troll}-hurt`, true);
}

// rocas que caen del techo con su sombra de aviso
function caenRocas(scene, cuantas, api, cercaDeGesi = false) {
    const j = scene.jefe;
    for (let n = 0; n < cuantas; n++) {
        const x = cercaDeGesi && n === 0
            ? scene.mascotaGesi.body.center.x
            : Phaser.Math.Between(j.arenaIni + 70, j.arenaFin - 70);
        scene.time.delayedCall(n * 280, () => {
            if (j.estado !== 'pelea') return;
            avisar(scene, 'roca', { x: Math.round(x) });
            rocaQueCae(scene, x, api);
        });
    }
}

function rocaQueCae(scene, x, api) {
    const sombra = scene.add.ellipse(x, SUELO_Y - 2, 20, 6, 0x000000, 0.5).setDepth(36);
    scene.tweens.add({ targets: sombra, scaleX: 2.4, scaleY: 1.6, duration: 700 });
    const roca = scene.add.image(x, -30, 'mz_bloque').setScale(1.3).setTint(0x9a8f88).setDepth(36);
    scene.tweens.add({
        targets: roca, y: SUELO_Y - 20, angle: 180, delay: 450, duration: 380, ease: 'Quad.in',
        onComplete: () => {
            scene.sound.play('romper', { volume: 0.4 });
            const gb = scene.mascotaGesi.body;
            if (Math.abs(gb.center.x - x) < 30 && gb.bottom > SUELO_Y - 80) api.killgesi(scene, 20);
            sombra.destroy();
            scene.tweens.add({ targets: roca, alpha: 0, duration: 300, onComplete: () => roca.destroy() });
        },
    });
}

const ESPECIALES = {
    // salto hacia el jugador y onda expansiva al caer
    salto(scene, _api, dx) {
        const j = scene.jefe, s = j.sprite;
        aviso(scene, s, 'salto');
        s.anims.play(`troll${j.datos.troll}-jump`, true);
        s.setVelocity(Phaser.Math.Clamp(dx * 1.2, -260, 260), -520);
        j.enAire = true;
        scene.sound.play('rugido', { volume: 0.4, rate: 1.4 });
    },

    // embestida: carga corriendo de lado a lado (hay que saltarlo)
    embestida(scene, _api, dx) {
        const j = scene.jefe, s = j.sprite, d = j.datos;
        aviso(scene, s, 'embestida');
        s.setVelocityX(0);
        s.anims.play(`troll${d.troll}-idle`, true);
        scene.sound.play('rugido', { volume: 0.5, rate: 1.1 });
        j.ocupadoHasta = scene.time.now + 9999;
        scene.time.delayedCall(650, () => {
            if (j.estado !== 'pelea') return;
            j.embistiendo = true;
            j.dirEmbestida = Math.sign(dx) || 1;
            j.finEmbestida = scene.time.now + 2500;
            s.flipX = j.dirEmbestida < 0;
            s.anims.play(`troll${d.troll}-run`, true);
        });
    },

    // lanza una roca en arco hacia el jugador
    roca(scene, _api, dx) {
        const j = scene.jefe, s = j.sprite, d = j.datos;
        aviso(scene, s, 'roca');
        s.setVelocityX(0);
        s.anims.play(`troll${d.troll}-attack`, true);
        j.ocupadoHasta = scene.time.now + 800;
        scene.time.delayedCall(320, () => {
            if (j.estado !== 'pelea') return;
            const datos = { x: Math.round(s.body.center.x), y: Math.round(s.body.top + 10), vx: Math.round(dx / 1.0), vy: -330 };
            avisar(scene, 'lanza', datos);
            rocaLanzada(scene, datos);
        });
    },

    // rugido: hace temblar la cueva y caen rocas, una justo encima del jugador
    rugido(scene, api) {
        const j = scene.jefe, s = j.sprite, d = j.datos;
        aviso(scene, s, 'rugido');
        s.setVelocityX(0);
        s.anims.play(`troll${d.troll}-hurt`, true);
        j.ocupadoHasta = scene.time.now + 1200;
        avisar(scene, 'rugido');
        rugir(scene);
        caenRocas(scene, j.furioso ? 5 : 3, api, true);
    },

    // terremoto (solo furioso): tres saltitos seguidos, cada uno con onda
    terremoto(scene, _api, _dx) {
        const j = scene.jefe, s = j.sprite, d = j.datos;
        aviso(scene, s, 'terremoto');
        j.ocupadoHasta = scene.time.now + 2600;
        [0, 800, 1600].forEach(t => scene.time.delayedCall(t, () => {
            if (j.estado !== 'pelea') return;
            s.anims.play(`troll${d.troll}-jump`, true);
            s.setVelocity(0, -320);
            j.enAire = true;
        }));
    },
};

function rocaLanzada(scene, { x, y, vx, vy }) {
    const roca = scene.balasEnemigas.create(x, y, 'mz_bloque').setScale(1.2).setTint(0x9a8f88);
    roca.body.setAllowGravity(true);
    roca.body.setGravityY(300);
    roca.setVelocity(vx, vy);
    scene.tweens.add({ targets: roca, angle: 720, duration: 1600 });
    scene.time.delayedCall(2500, () => roca.active && roca.destroy());
    scene.sound.play('golpe_enemigo', { volume: 0.6, rate: 0.6 });
}

function rugir(scene) {
    scene.sound.play('rugido', { volume: 0.8 });
    scene.cameras.main.shake(900, 0.008);
}

function ondaExpansiva(scene, x, api) {
    avisar(scene, 'onda', { x: Math.round(x) });
    scene.cameras.main.shake(300, 0.012);
    scene.sound.play('emboscada', { volume: 0.6 });
    const onda = scene.add.ellipse(x, SUELO_Y - 4, 40, 14, 0xffd27a, 0.6).setDepth(36);
    scene.tweens.add({ targets: onda, scaleX: 9, scaleY: 1.6, alpha: 0, duration: 450, onComplete: () => onda.destroy() });
    // golpea si el jugador está en el suelo cerca (saltando se esquiva); un instante después,
    // ya con el jugador de esta pantalla (la IA puede estar mirando a otro: ver actualizarJefe)
    scene.time.delayedCall(0, () => {
        const g = scene.mascotaGesi.body;
        const enSuelo = g.blocked.down || g.touching.down;
        if (enSuelo && Math.abs(g.center.x - x) < 170) api.killgesi(scene, 20);
    });
}

// el jefe también recibe los golpes cuerpo a cuerpo y el rayo
export function golpearJefeEnZona(scene, zona, cantidad, api) {
    const j = scene.jefe;
    if (!j || j.estado !== 'pelea') return;
    const b = j.sprite.body;
    if (Phaser.Geom.Intersects.RectangleToRectangle(zona, new Phaser.Geom.Rectangle(b.left, b.top, b.width, b.height))) {
        dañarJefe(scene, cantidad, api, scene.mascotaGesi.body.center.x);
    }
}

export function jefeBloqueaMeta(scene) {
    return scene.jefe && !scene.jefe.derrotado;
}

// cámara lenta un instante al vencerlo: que se sienta el golpe final
function camaraLenta(scene) {
    const t = 0.35;
    scene.physics.world.timeScale = 1 / t;
    scene.tweens.timeScale = t;
    scene.time.timeScale = t;
    scene.time.delayedCall(800 * t, () => {
        scene.physics.world.timeScale = 1;
        scene.tweens.timeScale = 1;
        scene.time.timeScale = 1;
    });
}

// ---------- En línea ----------

// en esta pantalla el troll es una copia (lo maneja el anfitrión)
const esReplica = scene => !!scene.redJefe?.replica();

// solo quien maneja al troll avisa sus ataques (las copias no repiten los avisos)
function avisar(scene, fx, datos) {
    if (!esReplica(scene)) scene.redJefe?.avisar(fx, datos);
}

// anfitrión: lo que las demás pantallas necesitan para dibujar al troll
export function datosJefe(scene) {
    const j = scene.jefe;
    if (!j || j.estado !== 'pelea' || !j.sprite?.body) return null;
    const s = j.sprite, r = n => Math.round(n);
    return [r(s.x), r(s.y), r(s.body.velocity.x), r(s.body.velocity.y), s.flipX ? 1 : 0,
        s.anims.currentAnim?.key || '', j.furioso ? 1 : 0, j.vida];
}

// copia: guarda a dónde tiene que ir el troll y toma la vida del anfitrión
export function recibirJefe(scene, datos, api) {
    const j = scene.jefe;
    if (!j || j.estado !== 'pelea' || !j.sprite) return;
    const [x, y, vx, vy, flip, anim, furioso, vida] = datos;
    j.red = { x, y, vx, vy, flip, anim, t: performance.now() };
    if (!!furioso !== !!j.furioso) { j.furioso = !!furioso; restaurarTinte(j); }
    if (vida < j.vida) {
        j.vida = vida;
        scene.guardarVidaJefe?.(j.vida);
        if (j.barra) j.barra.width = 280 * j.vida / j.vidaMax;
        if (j.coraza && !tieneCoraza(j)) { j.coraza = false; romperCoraza(scene, j); }
        if (j.vida <= 0) derrotar(scene, api);
    }
}

// copia: se mueve suavemente hacia lo que mandó el anfitrión
function seguirAlAnfitrion(scene, time) {
    const j = scene.jefe, s = j.sprite;
    moverCoraza(j);
    if (j.red) {
        const adelanto = Math.min(0.2, (performance.now() - j.red.t) / 1000);
        const x = j.red.x + j.red.vx * adelanto, y = j.red.y + j.red.vy * adelanto;
        const k = Math.min(1, scene.game.loop.delta / 1000 * 14);
        if (Math.hypot(x - s.x, y - s.y) > 250) s.setPosition(x, y);
        else s.setPosition(s.x + (x - s.x) * k, s.y + (y - s.y) * k);
        s.flipX = !!j.red.flip;
        if (j.red.anim && s.anims.currentAnim?.key !== j.red.anim && scene.anims.exists(j.red.anim)) s.anims.play(j.red.anim, true);
    }
    // si el jugador de esta pantalla se queda parado sobre su cabeza, se lo quita de encima
    const g = scene.mascotaGesi, gb = g.body, b = s.body;
    if (g.isDead) return;
    const encima = Math.abs(gb.bottom - b.top) < 6 && gb.right > b.left && gb.left < b.right;
    if (!encima) { j.encimaDesde = 0; return; }
    if (!j.encimaDesde) j.encimaDesde = time;
    if (time - j.encimaDesde > 350) { sacudirse(scene); j.encimaDesde = 0; }
}

// lo que avisó la pantalla que maneja al troll (o, 'empieza', cualquier jugador)
export function efectoJefe(scene, m, api) {
    const j = scene.jefe;
    if (!j) return;
    if (m.fx === 'empieza') {
        if (j.estado !== 'esperando') return;
        // los que se quedaron afuera entran a la arena (si no, los muros los dejarían del lado equivocado)
        const g = scene.mascotaGesi;
        if (!g.isDead && g.x < j.arenaIni + 60) g.setPosition(j.arenaIni + 90, Math.min(g.y, SUELO_Y - 60));
        j.avisado = true;
        empezarPelea(scene, api);
        return;
    }
    if (j.estado !== 'pelea' || !j.sprite) return;
    const s = j.sprite;
    switch (m.fx) {
        case 'aviso': if (AVISOS[m.ataque]) avisoVisible(scene, s, m.ataque); break;
        case 'garrote': destelloGarrote(scene); break;
        case 'zona': golpeDeGarrote(scene, new Phaser.Geom.Rectangle(m.x, m.y, m.w, m.h), m.ox, api); break;
        case 'onda': ondaExpansiva(scene, m.x, api); break;
        case 'roca': rocaQueCae(scene, m.x, api); break;
        case 'lanza': rocaLanzada(scene, m); break;
        case 'mareado': mareado(scene, s); break;
        case 'rugido': rugir(scene); break;
    }
}
