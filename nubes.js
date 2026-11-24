// NUBES, HUMO, RAYOS Y RÁFAGAS (CraftPix "Free Clouds Pixel Art"): lo que se ve del clima y de las explosiones.
//   humo(scene, x, y, escala)       bocanadas grises que se inflan y se deshacen (explosiones, fuego fuerte)
//   nubesTormenta(scene, nivel)     nubes negras que pasan arriba en los niveles con lluvia o tormenta
//   rayoEnElCielo(scene)            un rayo de verdad que cae en el cielo junto con el destello del relámpago
//   rafagaViento(scene, dir, vista) jirones de nube blanca que cruzan la pantalla cuando sopla el viento
// Las imágenes son chicas (assets/nubes, 71 KB) y se cargan siempre (cargarNubes en el preload).

const RUTA = 'assets/nubes';
const HUMO = ['gray3_1', 'gray4_1', 'gray5_1'];
const TORMENTA = ['black2_1', 'black4_1', 'black6_1', 'black8_1'];
const VIENTO = ['white1_1', 'white6_1', 'white7_1'];
const RAYOS = ['rayo1', 'rayo2', 'rayo3', 'rayo4', 'rayo5'];
const reducir = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_e) { return false; } };
const hay = (scene, k) => scene.textures.exists(`nb_${k}`);

export function cargarNubes(scene) {
    [...HUMO, ...TORMENTA, ...VIENTO, ...RAYOS].forEach(k => {
        if (!scene.textures.exists(`nb_${k}`)) scene.load.image(`nb_${k}`, `${RUTA}/${k}.png`);
    });
}

// humo de una explosión: 3 bocanadas que suben, se inflan y se apagan
export function humo(scene, x, y, escala = 1) {
    if (!hay(scene, HUMO[0])) return;
    const n = reducir() ? 1 : 3;
    for (let i = 0; i < n; i++) {
        const k = HUMO[(Math.random() * HUMO.length) | 0];
        const b = scene.add.image(x + (Math.random() - 0.5) * 40 * escala, y + (Math.random() - 0.5) * 20 * escala, `nb_${k}`)
            .setDepth(37).setScale(0.12 * escala).setAlpha(0.85).setAngle(Math.random() * 360).setFlipX(Math.random() < 0.5);
        scene.tweens.add({
            targets: b, scale: (0.3 + Math.random() * 0.12) * escala, alpha: 0, y: b.y - 30 * escala, angle: b.angle + (Math.random() - 0.5) * 60,
            duration: 750 + i * 160, delay: i * 70, ease: 'Quad.out', onComplete: () => b.destroy(),
        });
    }
}

// tormenta: nubes negras que pasan despacio por arriba (detrás del nivel, delante del cielo)
export function nubesTormenta(scene, nivel) {
    if (!hay(scene, TORMENTA[0])) return;
    const ancho = Math.max(1600, (nivel.ancho || 4000) * 0.25 + 900);
    for (let x = -100, i = 0; x < ancho; x += 220 + ((i * 137) % 160), i++) {
        const k = TORMENTA[i % TORMENTA.length];
        const nube = scene.add.image(x, 20 + ((i * 53) % 70), `nb_${k}`).setOrigin(0.5).setScrollFactor(0.15 + (i % 3) * 0.04)
            .setScale(0.7 + (i % 3) * 0.25).setAlpha(0.9);
        if (!reducir()) scene.tweens.add({ targets: nube, x: nube.x + 60, yoyo: true, repeat: -1, duration: 9000 + (i % 5) * 1500, ease: 'Sine.inOut' });
    }
}

// el rayo del relámpago, en el cielo (lo llama ambiente.js con el destello)
export function rayoEnElCielo(scene) {
    if (!hay(scene, RAYOS[0])) return;
    const cam = scene.cameras.main, w = cam.width / cam.zoom;
    const r = scene.add.image(60 + Math.random() * (w - 120), 0, `nb_${RAYOS[(Math.random() * RAYOS.length) | 0]}`)
        .setOrigin(0.5, 0).setScrollFactor(0).setScale(1.4 + Math.random() * 0.8).setBlendMode('ADD');
    scene.tweens.add({ targets: r, alpha: { from: 1, to: 0 }, duration: 260, delay: 60, onComplete: () => r.destroy() });
}

// ráfaga: jirones de nube blanca que cruzan la pantalla en la dirección del viento
export function rafagaViento(scene, dir) {
    if (!hay(scene, VIENTO[0]) || reducir()) return;
    const cam = scene.cameras.main, vista = cam.worldView;
    for (let i = 0; i < 3; i++) {
        const y = vista.y + 40 + Math.random() * (vista.height - 120);
        const desde = dir > 0 ? vista.x - 120 : vista.right + 120, hasta = dir > 0 ? vista.right + 160 : vista.x - 160;
        const j = scene.add.image(desde, y, `nb_${VIENTO[(Math.random() * VIENTO.length) | 0]}`).setDepth(45)
            .setScale(0.35 + Math.random() * 0.25).setAlpha(0.5).setFlipX(dir < 0);
        scene.tweens.add({ targets: j, x: hasta, alpha: 0.15, duration: 700 + Math.random() * 400, delay: i * 140, onComplete: () => j.destroy() });
    }
}
