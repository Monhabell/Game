// Jefes de final de nivel: trolls (CraftPix "2D Game Troll Free Character Sprites").
//
// Antes de la bandera hay una arena. Al entrar se cierran dos muros de roca, el troll cae
// del cielo y aparece su barra de vida. Hay que quitarle toda la vida para poder llegar a la meta.
// - camina hacia el jugador y lo golpea con el garrote cuando está cerca
// - ataques especiales al azar: salto con onda expansiva, embestida, lanzar roca, rugido que
//   hace caer rocas y (furioso) terremoto de tres saltos. Antes de cada uno aparece un "!".
// - al chocar con un muro tras la embestida queda aturdido: es el momento de atacarlo
// - con la mitad de la vida se enfurece: más rápido y ataca más seguido
// - durante la pelea el escudo no se recarga avanzando: solo aparecen cargas de escudo
//
// api: { killgesi(scene), mostrarMensaje(scene, texto, ms), addToScore(n, origen, scene), soltarEscudo(scene, x, y) }

const SUELO_Y = 332;
export const ANCHO_ARENA = 900;   // ancho de la arena (la cámara se aleja para verla entera)
const ZOOM_ARENA = 1.55;          // zoom de la cámara durante la pelea (normal = 2)
const PISOTON_ESPERA = 900;       // ms entre pisotones que hacen daño
const PISOTONES_PARA_SACUDIR = 2; // pisotones seguidos antes de que se sacuda
const ANIMS = { idle: ['Idle', 10, 10, -1], walk: ['Walk', 10, 12, -1], attack: ['Attack', 10, 15, 0], hurt: ['Hurt', 10, 20, 0], dead: ['Dead', 10, 10, 0], jump: ['Jump', 10, 12, 0] };

// un jefe por nivel (se repite si hay más niveles)
export const JEFES = [
    { nombre: 'TROLL DEL BOSQUE', troll: 1, vida: 12, vel: 70, escala: 0.6 },
    { nombre: 'TROLL DE LA CUEVA', troll: 2, vida: 16, vel: 80, escala: 0.6 },
    { nombre: 'TROLL DEL PUENTE', troll: 3, vida: 20, vel: 90, escala: 0.62 },
    { nombre: 'TROLL DE LA FORTALEZA', troll: 1, vida: 26, vel: 100, escala: 0.65 },
    { nombre: 'TROLL DEL VOLCÁN', troll: 2, vida: 32, vel: 110, escala: 0.66 },
    { nombre: 'EL REY TROLL', troll: 3, vida: 40, vel: 120, escala: 0.72 },
];

export function cargarJefes(scene) {
    [1, 2, 3].forEach(k => Object.values(ANIMS).forEach(([archivo]) => {
        scene.load.spritesheet(`troll${k}_${archivo}`, `assets/jefes/troll${k}_${archivo}.png`, { frameWidth: 600, frameHeight: 440 });
    }));
}

export function crearAnimacionesJefes(scene) {
    if (scene.anims.exists('troll1-idle')) return;
    [1, 2, 3].forEach(k => Object.entries(ANIMS).forEach(([clave, [archivo, frames, frameRate, repeat]]) => {
        scene.anims.create({
            key: `troll${k}-${clave}`,
            frames: scene.anims.generateFrameNumbers(`troll${k}_${archivo}`, { start: 0, end: frames - 1 }),
            frameRate, repeat,
        });
    }));
}

// prepara la arena; el jefe aparece cuando el jugador entra
export function prepararJefe(scene, nivel, indice) {
    const datos = JEFES[indice % JEFES.length];
    const meta = nivel.meta;
    scene.jefe = {
        datos, indice,
        arenaIni: meta - ANCHO_ARENA - 50, arenaFin: meta - 50,
        estado: 'esperando', vida: datos.vida, vidaMax: datos.vida,
        derrotado: false, sprite: null, muros: [],
    };
}

// muro de roca que sale del suelo
function crearMuro(scene, x) {
    const visual = scene.add.tileSprite(x - 20, SUELO_Y, 40, 332, 'mz_relleno').setOrigin(0, 0).setTint(0x9a8f88).setDepth(35);
    const tope = scene.add.tileSprite(x - 24, SUELO_Y, 48, 64, 'mz_suelo').setOrigin(0, 0).setDepth(35);
    scene.tweens.add({ targets: [visual, tope], y: '-=332', duration: 450, ease: 'Back.out' });
    const cuerpo = scene.add.zone(x, SUELO_Y / 2, 40, SUELO_Y);
    scene.physics.add.existing(cuerpo, true);
    scene.physics.add.collider(scene.mascotaGesi, cuerpo);
    return { visual, tope, cuerpo };
}

function empezarPelea(scene, api) {
    const j = scene.jefe, d = j.datos;
    j.estado = 'pelea';
    scene.peleaJefe = true;
    scene.limiteDerecho = j.arenaFin - 40;

    // si muere, vuelve a la entrada de la arena
    scene.reaparecerEnArena?.(j.arenaIni + 40);
    scene.recargarParaJefe?.();

    j.muros = [crearMuro(scene, j.arenaIni), crearMuro(scene, j.arenaFin)];

    // la cámara se aleja para ver toda la arena
    scene.camaraArena = (j.arenaIni + j.arenaFin) / 2;
    scene.tweens.add({ targets: scene.cameras.main, zoom: ZOOM_ARENA, duration: 900, ease: 'Sine.inOut' });

    // los enemigos normales que estaban en la arena se desvanecen: el troll pelea solo
    scene.enemies.getChildren().slice().forEach(e => {
        if (e.x > j.arenaIni - 40 && e.x < j.arenaFin + 40) {
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
    const s = scene.physics.add.sprite(j.arenaFin - 150, -80, `troll${d.troll}_Idle`).setOrigin(0.5, 1).setScale(d.escala).setDepth(20);
    s.body.setSize(110, 210).setOffset(235, 440 - 214);
    s.setGravityY(300);
    s.body.pushable = false;
    s.flipX = true;
    s.anims.play(`troll${d.troll}-jump`);
    j.sprite = s;
    j.proxAtaque = scene.time.now + 1500;
    j.proxEspecial = scene.time.now + 3500;
    j.invulHasta = 0;
    j.ocupadoHasta = scene.time.now + 900;
    j.enAire = true;

    scene.physics.add.collider(s, scene.floor);
    j.muros.forEach(m => scene.physics.add.collider(s, m.cuerpo));
    scene.physics.add.collider(scene.mascotaGesi, s, () => contactoConJefe(scene, api));
    scene.physics.add.overlap(scene.flechasGrupo, s, (a, b) => {
        const flecha = a === s ? b : a;
        if (!flecha.perfora) flecha.destroy();
        dañarJefe(scene, 1, api);
    });

    // barra de vida
    const x0 = 395 - 140;
    j.barraFondo = scene.add.rectangle(395, 62, 284, 14, 0x000000, 0.7).setStrokeStyle(2, 0xffe9a8).setScrollFactor(0).setDepth(50);
    j.barra = scene.add.rectangle(x0, 62, 280, 10, 0xd62839).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    j.nombre = scene.add.text(395, 44, d.nombre, {
        fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#ffe9a8', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    scene.sound.play('rugido', { volume: 0.8 });
    scene.sound.play('emboscada', { volume: 0.5 });
    // cambia la música a la de batalla
    scene.musica?.pause();
    scene.musicaBatalla = scene.sound.add('musica_batalla', { loop: true, volume: 0.3 });
    scene.musicaBatalla.play();
    scene.events.once('shutdown', () => scene.musicaBatalla?.destroy());
    scene.cameras.main.shake(500, 0.008);
    api.mostrarMensaje(scene, `¡${d.nombre}!`, 1500);

    // durante la pelea solo aparecen cargas de escudo
    scene.time.addEvent({
        delay: 9000, loop: true, callback: () => {
            if (j.estado !== 'pelea' || scene.tieneEscudo || scene.mascotaGesi.isDead) return;
            const x = Phaser.Math.Between(j.arenaIni + 80, j.arenaFin - 80);
            api.soltarEscudo(scene, x, SUELO_Y - 30);
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
    if (scene.protegido?.()) {
        dañarJefe(scene, 1, api);
        return;
    }
    api.killgesi(scene);
}

export function dañarJefe(scene, cantidad, api) {
    const j = scene.jefe;
    if (!j || j.estado !== 'pelea' || scene.time.now < j.invulHasta) return false;
    j.vida = Math.max(0, j.vida - cantidad);
    j.invulHasta = scene.time.now + 250;
    j.barra.width = 280 * j.vida / j.vidaMax;
    const s = j.sprite;
    s.setTintFill(0xffffff);
    scene.time.delayedCall(80, () => { if (s.active) { s.clearTint(); if (j.furioso) s.setTint(0xff8a8a); } });
    scene.sound.play('bump', { volume: 0.5 });
    api.addToScore(25, s, scene);

    if (j.vida <= 0) {
        derrotar(scene, api);
    } else if (!j.furioso && j.vida <= j.vidaMax / 2) {
        // con la mitad de la vida se enfurece
        j.furioso = true;
        s.setTint(0xff8a8a);
        scene.sound.play('rugido', { volume: 0.8, rate: 1.2 });
        scene.cameras.main.shake(400, 0.007);
        api.mostrarMensaje(scene, '¡SE ENFURECE!', 1200);
    }
    return true;
}

function derrotar(scene, api) {
    const j = scene.jefe, s = j.sprite;
    j.estado = 'derrotado';
    j.derrotado = true;
    scene.peleaJefe = false;
    scene.camaraArena = null;
    scene.tweens.add({ targets: scene.cameras.main, zoom: 2, delay: 1500, duration: 900, ease: 'Sine.inOut' });
    scene.limiteDerecho = null;
    s.setVelocity(0, 0).clearTint();
    s.anims.play(`troll${j.datos.troll}-dead`);
    s.body.checkCollision.none = true;
    scene.sound.play('rugido', { volume: 0.8, rate: 0.7 });
    scene.sound.play('matar');
    // termina la música de batalla y vuelve la del nivel
    scene.tweens.add({ targets: scene.musicaBatalla, volume: 0, duration: 1200, onComplete: () => { scene.musicaBatalla?.stop(); scene.musica?.resume(); } });
    scene.cameras.main.flash(300, 255, 230, 180);
    scene.cameras.main.shake(600, 0.01);
    api.addToScore(2000, s, scene);
    api.mostrarMensaje(scene, `¡${j.datos.nombre}\nDERROTADO!`, 2200);

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
        if (!g.isDead && g.x > j.arenaIni + 60) empezarPelea(scene, api);
        return;
    }
    if (j.estado !== 'pelea') return;

    const s = j.sprite, b = s.body, d = j.datos;
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
            j.ocupadoHasta = time + 1100; // queda aturdido: momento para atacarlo
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

    if (cerca && time > j.proxAtaque) {
        // de cerca: garrotazo (furioso hace un combo de dos golpes)
        garrotazo(scene, api, 0);
        if (j.furioso) garrotazo(scene, api, 650);
        j.ocupadoHasta = time + (j.furioso ? 1350 : 700);
        j.proxAtaque = time + (j.furioso ? 1100 : 1500);
    } else if (time > j.proxEspecial) {
        // ataques especiales: se elige uno al azar (sin repetir el anterior)
        const lista = ['salto', 'embestida', 'roca', 'rugido'];
        if (j.furioso) lista.push('terremoto', 'embestida');
        let ataque;
        do { ataque = lista[Math.floor(Math.random() * lista.length)]; } while (ataque === j.ultimoEspecial && lista.length > 1);
        if (ataque === 'embestida' && distancia < 160) ataque = 'salto';
        j.ultimoEspecial = ataque;
        j.proxEspecial = time + (j.furioso ? 2600 : 4200) + Math.random() * 1200;
        ESPECIALES[ataque](scene, api, dx);
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
        scene.time.delayedCall(330, () => {
            if (j.estado !== 'pelea') return;
            scene.sound.play('golpe_enemigo', { volume: 0.7, rate: 0.7 });
            const dir = s.flipX ? -1 : 1;
            const zona = new Phaser.Geom.Rectangle(dir > 0 ? b.right - 10 : b.left - 120, b.top, 130, b.height);
            const gb = scene.mascotaGesi.body;
            if (Phaser.Geom.Intersects.RectangleToRectangle(zona, new Phaser.Geom.Rectangle(gb.left, gb.top, gb.width, gb.height))) api.killgesi(scene);
        });
    });
}

// "!" sobre la cabeza: avisa que viene un ataque especial
function aviso(scene, s, color = '#ff5555') {
    const t = scene.add.text(s.x, s.body.top - 26, '!', {
        fontFamily: '"Press Start 2P", monospace', fontSize: '18px', color, stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(45);
    scene.tweens.add({ targets: t, y: t.y - 12, alpha: 0, delay: 350, duration: 400, onComplete: () => t.destroy() });
}

function mareado(scene, s) {
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
            const sombra = scene.add.ellipse(x, SUELO_Y - 2, 20, 6, 0x000000, 0.5).setDepth(36);
            scene.tweens.add({ targets: sombra, scaleX: 2.4, scaleY: 1.6, duration: 700 });
            const roca = scene.add.image(x, -30, 'mz_bloque').setScale(1.3).setTint(0x9a8f88).setDepth(36);
            scene.tweens.add({
                targets: roca, y: SUELO_Y - 20, angle: 180, delay: 450, duration: 380, ease: 'Quad.in',
                onComplete: () => {
                    scene.sound.play('romper', { volume: 0.4 });
                    const gb = scene.mascotaGesi.body;
                    if (Math.abs(gb.center.x - x) < 30 && gb.bottom > SUELO_Y - 80) api.killgesi(scene);
                    sombra.destroy();
                    scene.tweens.add({ targets: roca, alpha: 0, duration: 300, onComplete: () => roca.destroy() });
                },
            });
        });
    }
}

const ESPECIALES = {
    // salto hacia el jugador y onda expansiva al caer
    salto(scene, _api, dx) {
        const j = scene.jefe, s = j.sprite;
        aviso(scene, s, '#ffd27a');
        s.anims.play(`troll${j.datos.troll}-jump`, true);
        s.setVelocity(Phaser.Math.Clamp(dx * 1.2, -260, 260), -520);
        j.enAire = true;
        scene.sound.play('rugido', { volume: 0.4, rate: 1.4 });
    },

    // embestida: carga corriendo de lado a lado (hay que saltarlo)
    embestida(scene, _api, dx) {
        const j = scene.jefe, s = j.sprite, d = j.datos;
        aviso(scene, s);
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
        aviso(scene, s, '#ffd27a');
        s.setVelocityX(0);
        s.anims.play(`troll${d.troll}-attack`, true);
        j.ocupadoHasta = scene.time.now + 800;
        scene.time.delayedCall(320, () => {
            if (j.estado !== 'pelea') return;
            const roca = scene.balasEnemigas.create(s.body.center.x, s.body.top + 10, 'mz_bloque').setScale(1.2).setTint(0x9a8f88);
            roca.body.setAllowGravity(true);
            roca.body.setGravityY(300);
            const tiempo = 1.0;
            roca.setVelocity(dx / tiempo, -330);
            scene.tweens.add({ targets: roca, angle: 720, duration: 1600 });
            scene.time.delayedCall(2500, () => roca.active && roca.destroy());
            scene.sound.play('golpe_enemigo', { volume: 0.6, rate: 0.6 });
        });
    },

    // rugido: hace temblar la cueva y caen rocas, una justo encima del jugador
    rugido(scene, api) {
        const j = scene.jefe, s = j.sprite, d = j.datos;
        aviso(scene, s);
        s.setVelocityX(0);
        s.anims.play(`troll${d.troll}-hurt`, true);
        j.ocupadoHasta = scene.time.now + 1200;
        scene.sound.play('rugido', { volume: 0.8 });
        scene.cameras.main.shake(900, 0.008);
        caenRocas(scene, j.furioso ? 5 : 3, api, true);
    },

    // terremoto (solo furioso): tres saltitos seguidos, cada uno con onda
    terremoto(scene, _api, _dx) {
        const j = scene.jefe, s = j.sprite, d = j.datos;
        aviso(scene, s);
        j.ocupadoHasta = scene.time.now + 2600;
        [0, 800, 1600].forEach(t => scene.time.delayedCall(t, () => {
            if (j.estado !== 'pelea') return;
            s.anims.play(`troll${d.troll}-jump`, true);
            s.setVelocity(0, -320);
            j.enAire = true;
        }));
    },
};

function ondaExpansiva(scene, x, api) {
    scene.cameras.main.shake(300, 0.012);
    scene.sound.play('emboscada', { volume: 0.6 });
    const onda = scene.add.ellipse(x, SUELO_Y - 4, 40, 14, 0xffd27a, 0.6).setDepth(36);
    scene.tweens.add({ targets: onda, scaleX: 9, scaleY: 1.6, alpha: 0, duration: 450, onComplete: () => onda.destroy() });
    // golpea si el jugador está en el suelo cerca (saltando se esquiva)
    const g = scene.mascotaGesi.body;
    const enSuelo = g.blocked.down || g.touching.down;
    if (enSuelo && Math.abs(g.center.x - x) < 170) api.killgesi(scene);
}

// el jefe también recibe los golpes cuerpo a cuerpo y el rayo
export function golpearJefeEnZona(scene, zona, cantidad, api) {
    const j = scene.jefe;
    if (!j || j.estado !== 'pelea') return;
    const b = j.sprite.body;
    if (Phaser.Geom.Intersects.RectangleToRectangle(zona, new Phaser.Geom.Rectangle(b.left, b.top, b.width, b.height))) {
        dañarJefe(scene, cantidad, api);
    }
}

export function jefeBloqueaMeta(scene) {
    return scene.jefe && !scene.jefe.derrotado;
}
