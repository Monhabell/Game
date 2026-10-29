// TRAMPAS FALSAS de los niveles infinitos (estilo Cat Mario: que el jugador dude de todo).
// Se mezclan con las verdaderas: lo que parece peligroso a veces es de mentira… y a veces no.
//   pinchos   parecen pinchos: al pisarlos se doblan ("¡ERAN DE CARTÓN!")
//   lava      un charco de lava pintado sobre suelo firme: se cruza caminando
//   enemigo   un zombie quieto que no se mueve: al tocarlo se cae ("¡BUU!") — es un muñeco
//   cartel    "¡CUIDADO! PINCHOS ↓" donde no hay nada… o "TODO SEGURO" justo antes de una trampa real
// Más falsas en cada nivel (de 1 a 8). Siempre en suelo firme, lejos de los huecos de verdad y de las
// misiones; el mismo reparto para el mismo nivel.

import { SUELO_Y } from "./alcance.js"

const S = SUELO_Y;
const LETRA = '"Press Start 2P", monospace';

let api = null;
export const configurarFalsas = a => { api = a; };

function azar(semilla) {
    let a = semilla >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ocupados: x donde ya hay algo (misiones, acertijos)
export function crearFalsas(scene, nivel, i, k, ocupados = []) {
    const r = azar(i * 40503 + 17);
    const cuantas = Math.min(8, 1 + Math.floor(k / 25)) + Math.min(6, Math.floor(Math.sqrt(Math.max(0, k - 200) / 130))); // (más allá del 200: +1 en el ~340 … +6 en el ~4900)
    const libres = lugares(nivel).filter(x => !ocupados.some(o => Math.abs(o - x) < 220));
    const tipos = ['pinchos', 'lava', 'enemigo', 'cartel'];
    scene.falsas = [];
    for (let j = 0; j < cuantas && libres.length; j++) {
        const x = libres.splice(Math.floor(r() * libres.length), 1)[0];
        for (let q = libres.length - 1; q >= 0; q--) if (Math.abs(libres[q] - x) < 300) libres.splice(q, 1);
        const tipo = tipos[Math.floor(r() * tipos.length)];
        scene.falsas.push(crear(scene, tipo, x, r));
    }
    // y alguna trampa REAL con cartel que jura que es seguro (las de verdad del nivel)
    (nivel.pinchos || []).slice(0, 1 + Math.floor(k / 60)).forEach(([px]) =>
        cartel(scene, px - 70, r() < 0.5 ? 'TODO SEGURO :)' : 'ESTOS SON FALSOS'));
}

function lugares(nivel) {
    const fin = nivel.meta - 1300;
    const huecos = [...(nivel.lava || []), ...(nivel.falsos || [])];
    const cosas = [
        ...(nivel.plataformas || []).map(([x, , w]) => [x, x + w]), ...(nivel.bloques || []).map(([x, , p]) => [x, x + p.length * 32]),
        ...(nivel.escaleras || []).map(([x, h]) => [x, x + h * 32]), ...(nivel.muros || []).map(([x, , w]) => [x, x + w]),
        ...(nivel.techos || []).map(([a, b]) => [a, b]), ...(nivel.moviles || []).map(([x]) => [x - 140, x + 140]),
        ...(nivel.pinchos || []).map(([x, n]) => [x, x + n * 32]),
    ];
    const cerca = (x, rangos, m) => rangos.some(([a, b]) => x > a - m && x < b + m);
    const xs = [];
    (nivel.suelo || []).forEach(([a, b]) => {
        for (let x = a + 160; x < b - 160; x += 70) {
            if (x < 800 || x > fin || cerca(x, huecos, 160) || cerca(x, cosas, 100)) continue;
            if ((nivel.checkpoints || []).some(c => Math.abs(c - x) < 200)) continue;
            xs.push(x);
        }
    });
    return xs;
}

function cartel(scene, x, texto) {
    scene.add.rectangle(x, S, 4, 90, 0x4a3420).setOrigin(0.5, 1).setDepth(3);
    scene.add.text(x, S - 90, texto, { fontFamily: LETRA, fontSize: '7px', color: '#ffe9a8', backgroundColor: '#3b2a1aDD', padding: { x: 5, y: 4 } })
        .setOrigin(0.5, 1).setDepth(42);
}

function crear(scene, tipo, x, r) {
    const f = { tipo, x, hecha: false };
    if (tipo === 'pinchos') {
        f.dibujo = [0, 1, 2].map(q => scene.add.image(x - 32 + q * 32, S, 'pincho').setOrigin(0, 1).setDepth(33));
        f.ancho = 96;
    } else if (tipo === 'lava') {
        // (se ve igual que la lava de verdad, pero el suelo sigue debajo)
        const ancho = 100 + Math.round(r() * 40);
        f.dibujo = [scene.add.tileSprite(x - ancho / 2, S - 14, ancho, 64, 'mz_lava_sup').setOrigin(0).setDepth(33)];
        scene.add.image(x, S + 20, 'brillo').setDepth(41).setDisplaySize(ancho * 1.4, 150).setTint(0xff5a1f).setAlpha(0.35).setBlendMode('ADD');
        f.ancho = ancho;
    } else if (tipo === 'enemigo') {
        // un zombie del nivel, quieto en su primer cuadro (como los de verdad: hoja a la mitad)
        const cargados = ['zombie1', 'zombie2', 'zombie3'].filter(t => scene.textures.exists(`${t}-walk`));
        const t = cargados[Math.floor(r() * cargados.length)];
        f.dibujo = [t ? scene.add.image(x, S + 4, `${t}-walk`, 0).setOrigin(0.5, 1).setScale(0.5).setDepth(33).setFlipX(true)
            : scene.add.text(x, S, '🧟', { fontSize: '40px' }).setOrigin(0.5, 1).setDepth(33)];
        f.ancho = 40;
    } else {
        cartel(scene, x, r() < 0.5 ? '¡CUIDADO! PINCHOS ↓' : '¡NO PISES AQUÍ!');
        f.hecha = true; // (solo asusta)
    }
    return f;
}

// cada fotograma: ¿la pisaste?
export function actualizarFalsas(scene) {
    const g = scene.mascotaGesi;
    if (!scene.falsas || !g?.body || g.isDead) return;
    const b = g.body;
    scene.falsas.forEach(f => {
        if (f.hecha || Math.abs(b.center.x - f.x) > f.ancho / 2 + 6 || b.bottom < S - 70) return;
        f.hecha = true;
        if (f.tipo === 'pinchos') {
            scene.tweens.add({ targets: f.dibujo, scaleY: 0.15, duration: 180, ease: 'Back.in' });
            api.mensaje(scene, '¡ERAN DE CARTÓN! :)', 900);
        } else if (f.tipo === 'lava') {
            scene.tweens.add({ targets: f.dibujo, alpha: 0.35, duration: 400 });
            api.mensaje(scene, '¡ERA PINTADA!', 900);
        } else {
            scene.tweens.add({ targets: f.dibujo, angle: 90, y: S + 10, alpha: 0, duration: 500, ease: 'Quad.in' });
            api.mensaje(scene, '¡BUU! ERA UN MUÑECO', 900);
        }
        scene.sound.play('menu_mover', { volume: 0.5 });
    });
}
