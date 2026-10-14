// Modo cadena (prototipo local, 2 jugadores en el mismo teclado).
// Los dos personajes van atados por una cadena: si uno cae, el otro siente el tirón.
//
//   Jugador 1: flechas para moverse y saltar, ↓ para anclarse (más ESPACIO, X y C: sus poderes)
//   Jugador 2: A / D para moverse, W para saltar, S para anclarse
//
// Reglas de la cadena:
// - Solo tira cuando está tensa (más de LARGO px entre los dos); floja, cuelga con su peso.
// - Si uno queda en el aire (colgando) y el otro en el suelo, el del suelo es ARRASTRADO hacia el
//   borde... salvo que esté anclado (mantener ↓ / S en el suelo): entonces sostiene al otro.
//   Caminar en contra del tirón sube al que cuelga; el que cuelga puede columpiarse.
// - Vidas compartidas: si uno cae a la lava o lo golpean, caen los dos (es la misma vida).
//
// api: { morir(causa) } (killgesi del juego)

import { PERSONAJES } from "./personajes.js"

const LARGO = 170;          // px de cadena
const ARRASTRE = 120;       // px/s con que el que cuelga arrastra al que está en el suelo
const CORRECCION = 10;      // 1/s: qué tan rápido se recupera el largo si la cadena se estira
const ESTIRON_MAX = 50;     // px que la cadena se puede estirar antes de corregir de golpe
const VEL_CARRERA = 220;
const VEL_DERIVA = 100;
const ESLABONES = 20;

const enSuelo = s => s.body.blocked.down || s.body.touching.down;

export function crearCadena(scene, { x, y, api }) {
    // el compañero es otro personaje distinto al del jugador 1
    const pj = PERSONAJES.find(p => p.id !== scene.pj.id);
    const c = scene.physics.add.sprite(x - 40, y, `${pj.id}-idle`)
        .setCollideWorldBounds(true)
        .setGravityY(480)
        .setDepth(34);
    c.setCrop(0, 57, c.width, c.height - 50);
    c.body.setSize(20, 69).setOffset(55, 57);
    c.pj = pj;
    c.anims.play(`${pj.id}-idle`);
    scene.compa = c;
    scene.cadenaApi = api;

    scene.teclasCompa = scene.input.keyboard.addKeys({ izq: 'A', der: 'D', salto: 'W', anclar: 'S' });

    // choca con el mundo como el jugador 1
    scene.physics.add.collider(c, scene.floor);
    scene.physics.add.collider(c, scene.moviles);
    scene.physics.add.collider(c, scene.invisibles, null, (_c, b) => b.revelado);

    // lo que lo mata (la vida es compartida: muere el equipo)
    const vivo = () => !scene.mascotaGesi.isDead;
    scene.physics.add.overlap(c, scene.lavaes, () => api.morir('caida'), vivo);
    scene.physics.add.overlap(c, scene.lavaesgota, () => api.morir(), vivo);
    scene.physics.add.overlap(c, scene.bolas, () => api.morir(), vivo);
    scene.physics.add.overlap(c, scene.enemies, (_c, e) => { if (!e.isDead) api.morir(undefined, 20, e.x); }, vivo);
    scene.physics.add.overlap(c, scene.balasEnemigas, (_c, bala) => { bala.destroy(); api.morir(); }, vivo);

    // nombre sobre la cabeza para no confundirlos
    c.etiqueta = scene.add.text(0, 0, 'J2', {
        fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: '#ffe066', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(35);

    scene.dibujoCadena = scene.add.graphics().setDepth(33);
}

// se llama al final de update(), después de mover al jugador 1
export function actualizarCadena(scene, time) {
    const a = scene.mascotaGesi, c = scene.compa;
    if (!c?.active) return;
    const quieto = a.isDead || scene.nivelTerminado || scene.cinematica;
    if (quieto) {
        c.setVelocityX(0);
    } else {
        moverCompa(scene, c);
        anclarJugador1(scene, a);
        tensar(scene, a, c);
        // caer fuera del mundo
        if (c.y >= 300) scene.cadenaApi.morir('caida');
    }
    c.etiqueta.setPosition(c.x, c.body.top - 4);
    dibujar(scene, a, c, time);
}

function moverCompa(scene, c) {
    const k = scene.teclasCompa, pj = c.pj, suelo = enSuelo(c);
    const v = pj.velocidad;
    c.anclado = k.anclar.isDown && suelo;
    if (c.anclado) {
        c.setVelocityX(0);
    } else if (k.izq.isDown) {
        c.setVelocityX(-VEL_CARRERA * v);
        c.flipX = true;
    } else if (k.der.isDown) {
        c.setVelocityX(VEL_CARRERA * v);
        c.flipX = false;
    } else if (suelo) {
        c.setVelocityX(0);
    } else if (Math.abs(c.body.velocity.x) > VEL_DERIVA * v) {
        c.setVelocityX(Math.sign(c.body.velocity.x) * VEL_DERIVA * v);
    }

    const JD = Phaser.Input.Keyboard.JustDown;
    if (suelo) c.saltosAire = 0;
    if (JD(k.salto) && !c.anclado) {
        if (suelo) {
            c.setVelocityY(-pj.salto);
            scene.sound.play('salto', { volume: 0.25, rate: 1.1 });
        } else if (pj.dobleSalto && (c.saltosAire || 0) < 1) {
            c.saltosAire = (c.saltosAire || 0) + 1;
            c.setVelocityY(Math.min(c.body.velocity.y - 120, -440));
            scene.sound.play('salto', { volume: 0.25, rate: 1.35 });
        }
    }

    const anim = !suelo ? 'jump' : c.anclado ? 'idle' : Math.abs(c.body.velocity.x) > 5 ? 'run' : 'idle';
    c.anims.play(`${pj.id}-${anim}`, true);
    c.setTint(c.anclado ? 0x9fd8ff : 0xffffff);
}

// el jugador 1 se ancla con ↓ (en el suelo): no se mueve mientras lo mantiene
function anclarJugador1(scene, a) {
    a.anclado = scene.keys.down.isDown && enSuelo(a);
    if (a.anclado) a.setVelocityX(0);
    if (a.anclado) a.setTint(0x9fd8ff);
    else if (a.tintTopLeft === 0x9fd8ff) a.clearTint();
}

// la cadena solo actúa cuando está tensa
function tensar(scene, a, c) {
    const pa = a.body.center, pc = c.body.center;
    const dx = pc.x - pa.x, dy = pc.y - pa.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= LARGO || dist === 0) return;
    const nx = dx / dist, ny = dy / dist;

    // cuánto absorbe cada uno del tirón (0 = no se mueve, 1 = se lleva todo)
    const sueloA = enSuelo(a), sueloC = enSuelo(c);
    let wa = 0.5, wc = 0.5;
    if (a.anclado && !c.anclado) { wa = 0; wc = 1; }
    else if (c.anclado && !a.anclado) { wa = 1; wc = 0; }
    else if (a.anclado && c.anclado) { wa = 0; wc = 0; }
    else if (sueloA && !sueloC) { wa = 0; wc = 1; arrastrar(a, dx); }
    else if (sueloC && !sueloA) { wa = 1; wc = 0; arrastrar(c, -dx); }

    const va = a.body.velocity, vc = c.body.velocity;
    // velocidad con la que se separan: esa se anula (la cadena no se estira)
    const separan = (vc.x - va.x) * nx + (vc.y - va.y) * ny;
    // y un poco más para recuperar el largo si ya se estiró
    const extra = Math.min(400, (dist - LARGO) * CORRECCION);
    const total = Math.max(0, separan) + extra;
    va.x += nx * total * wa; va.y += ny * total * wa;
    vc.x -= nx * total * wc; vc.y -= ny * total * wc;

    // estirón demasiado grande (choques, ascensores): se corrige la posición de golpe
    const sobra = dist - LARGO - ESTIRON_MAX;
    if (sobra > 0) {
        const quien = wc >= wa ? c : a, signo = quien === c ? -1 : 1;
        quien.x += nx * sobra * signo;
        quien.y += ny * sobra * signo;
    }
}

// el del suelo es arrastrado hacia el que cuelga (si camina en contra, el que cuelga sube)
function arrastrar(s, haciaX) {
    s.body.velocity.x += Math.sign(haciaX) * ARRASTRE;
}

// eslabones a lo largo de una curva: floja cuelga, tensa queda recta
function dibujar(scene, a, c, time) {
    const g = scene.dibujoCadena;
    g.clear();
    const x0 = a.body.center.x, y0 = a.body.center.y - 6;
    const x1 = c.body.center.x, y1 = c.body.center.y - 6;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const comba = dist < LARGO ? Math.sqrt(LARGO * LARGO - dist * dist) * 0.5 : 0;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + comba;
    const tensa = dist > LARGO + 4;
    for (let i = 0; i <= ESLABONES; i++) {
        const t = i / ESLABONES, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
        const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        // tensa: tiembla un poco y se pone rojiza
        const temblor = tensa ? Math.sin(time * 0.05 + i) * 0.8 : 0;
        g.lineStyle(2, tensa ? 0xc9a090 : 0x9aa0aa, 1);
        if (i % 2) g.strokeEllipse(x, y + temblor, 6, 4);
        else g.strokeEllipse(x, y + temblor, 4, 6);
    }
}
