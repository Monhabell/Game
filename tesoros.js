// TESOROS Y DETALLES DEL MUNDO (CraftPix "Free Platformer Game Tileset", pixel art):
//   🗝 LLAVE Y COFRE   en algunos niveles hay una llave escondida en lo alto (la cima de una subida) y un
//                      cofre cerca de la meta. Con la llave se abre: monedas de la tienda (◉) y brillos.
//   🧚 HADAS           flotan en lugares altos; al tocarlas te devuelven el escudo (si lo tenías roto)
//   🪨 PIEDRAS VOLADORAS  rocas con un cristal que flotan al fondo de las cuevas (adorno)
//   🕳 ENTRADA DE CUEVA   el comienzo de los niveles bajo tierra
//   (las estalactitas que caen del techo usan las de este paquete: mecanicas.js)
// nivel.llave: [x, y] · nivel.cofre: x · nivel.hadas: [[x, y], …] (los pone niveles.js; iguales para todos)

import { SUELO_Y } from "./alcance.js"
import { sumarMonedas } from "./tienda.js"
import { recuperarEscudo } from "./escudo.js"
import { humo } from "./nubes.js"

const PREMIO_COFRE = 60; // ◉ que trae el cofre
let api = null;
export const configurarTesoros = a => { api = a; };

export function cargarTesoros(scene) {
    const hoja = (k, archivo, w, h) => { if (!scene.textures.exists(k)) scene.load.spritesheet(k, `assets/objetos/${archivo}.png`, { frameWidth: w, frameHeight: h }); };
    hoja('obj_hada', 'fairys', 32, 32);
    hoja('obj_llave', 'key', 32, 32);
    hoja('obj_cofre', 'chest', 64, 64);
    hoja('obj_brillo', 'shinies', 64, 192);
    hoja('obj_piedra', 'flying_stone', 192, 128);
    if (!scene.textures.exists('obj_cueva')) scene.load.image('obj_cueva', 'assets/objetos/cave_entrance.png');
    [1, 2, 3, 4].forEach(k => { if (!scene.textures.exists(`obj_estalactita${k}`)) scene.load.image(`obj_estalactita${k}`, `assets/objetos/estalactita${k}.png`); });
}

function animaciones(scene) {
    [['obj_hada', 12, 12, -1], ['obj_llave', 12, 12, -1], ['obj_brillo', 12, 10, -1], ['obj_piedra', 5, 6, -1], ['obj_cofre', 6, 12, 0]]
        .forEach(([k, n, fps, rep]) => {
            if (scene.textures.exists(k) && !scene.anims.exists(k)) scene.anims.create({ key: k, frames: scene.anims.generateFrameNumbers(k, { start: 0, end: n - 1 }), frameRate: fps, repeat: rep });
        });
}

export function crearTesoros(scene, nivel) {
    scene.tesoros = null;
    if (!scene.textures.exists('obj_hada')) return;
    animaciones(scene);
    const t = scene.tesoros = { llave: null, cofre: null, hadas: [], tieneLlave: false };
    // llave en lo alto, con brillos
    if (nivel.llave && nivel.cofre) {
        const [lx, ly] = nivel.llave;
        const brillo = scene.add.sprite(lx, ly - 40, 'obj_brillo').setDepth(33).setAlpha(0.7).setScale(0.6).play('obj_brillo');
        const s = scene.add.sprite(lx, ly, 'obj_llave').setDepth(34).setScale(1.3).play('obj_llave');
        scene.tweens.add({ targets: s, y: ly - 6, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
        t.llave = { s, brillo, x: lx, y: ly };
        const c = scene.add.sprite(nivel.cofre, SUELO_Y + 4, 'obj_cofre', 0).setOrigin(0.5, 1).setDepth(34).setScale(1.2);
        t.cofre = { s: c, x: nivel.cofre, abierto: false, avisado: false };
    }
    // hadas
    (nivel.hadas || []).forEach(([hx, hy]) => {
        const s = scene.add.sprite(hx, hy, 'obj_hada').setDepth(34).setScale(1.2).play('obj_hada');
        s.anims.setProgress(Math.random());
        scene.tweens.add({ targets: s, y: hy - 10, x: hx + 8, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.inOut' });
        const luz = scene.add.image(hx, hy, 'brillo').setDepth(33.9).setScale(0.8).setTint(0xbfe8ff).setAlpha(0.35).setBlendMode('ADD');
        t.hadas.push({ s, luz, usada: false });
    });
    // piedras voladoras al fondo de las cuevas (adorno)
    if (!nivel.nubes && scene.anims.exists('obj_piedra')) {
        for (let x = 700, i = 0; x < (nivel.ancho || 4000) - 600; x += 1500 + (i * 397) % 900, i++) {
            const p = scene.add.sprite(x, 120 + (i % 3) * 40, 'obj_piedra').setScrollFactor(0.6, 1).setScale(0.55).setAlpha(0.75).setTint(0xb8c0d8).play('obj_piedra');
            p.anims.setProgress((i * 0.37) % 1);
            scene.tweens.add({ targets: p, y: p.y - 14, yoyo: true, repeat: -1, duration: 2200 + i * 130, ease: 'Sine.inOut' });
        }
    }
}

// cada fotograma (después de mover al personaje)
export function actualizarTesoros(scene) {
    const t = scene.tesoros, g = scene.mascotaGesi;
    if (!t || !g?.body || g.isDead) return;
    const b = g.body, cerca = (x, y, r) => Math.abs(b.center.x - x) < r && Math.abs(b.center.y - y) < r + 20;
    if (t.llave && !t.tieneLlave && cerca(t.llave.x, t.llave.y, 26)) {
        t.tieneLlave = true;
        scene.sound.play('moneda', { volume: 0.6, rate: 0.8 });
        scene.tweens.add({ targets: t.llave.s, y: t.llave.y - 40, alpha: 0, scale: 2, duration: 450, onComplete: () => t.llave.s.destroy() });
        t.llave.brillo.destroy();
        api?.mensaje(scene, '🗝 ¡LLAVE! Busca el cofre', 1500);
    }
    const c = t.cofre;
    if (c && !c.abierto && Math.abs(b.center.x - c.x) < 40 && b.bottom > SUELO_Y - 40) {
        if (t.tieneLlave) {
            c.abierto = true;
            c.s.play('obj_cofre');
            scene.sound.play('victoria', { volume: 0.4 });
            sumarMonedas(PREMIO_COFRE);
            humo(scene, c.x, SUELO_Y - 30, 0.7);
            const brillo = scene.add.sprite(c.x, SUELO_Y - 60, 'obj_brillo').setDepth(35).setScale(0.8).play('obj_brillo');
            scene.time.delayedCall(1600, () => brillo.destroy());
            api?.mensaje(scene, `🎁 ¡COFRE! ◉ +${PREMIO_COFRE}`, 1600);
        } else if (!c.avisado) {
            c.avisado = true;
            api?.mensaje(scene, '🔒 Este cofre necesita una LLAVE (está en lo alto)', 1600);
        }
    }
    t.hadas.forEach(h => {
        if (h.usada || !cerca(h.s.x, h.s.y, 26)) return;
        h.usada = true;
        recuperarEscudo(scene, texto => api?.mensaje(scene, texto, 900), '🧚 ¡UN HADA TE DEVOLVIÓ EL ESCUDO!');
        scene.sound.play('moneda', { volume: 0.4, rate: 1.4 });
        scene.tweens.add({ targets: [h.s, h.luz], y: '-=60', alpha: 0, duration: 700, onComplete: () => { h.s.destroy(); h.luz.destroy(); } });
    });
}
