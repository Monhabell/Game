// Piezas propias del Bosque (región del nivel 1). Ver tramos.js: tramoRamas, tramoArbolAnciano.
//
// Ramas que se doblan: plataformas de madera ([x, arriba, ancho, 'rama'] en 'plataformas').
//   Al pisarlas se doblan hacia abajo; si te quedas mucho, crujen (la señal) y se rompen.
//   Vuelven a los pocos segundos. Enseñan a no quedarse quieto encima de nada.
// Árbol Anciano (el momento ¡wow! del Bosque): un tronco gigante que se sube por sus ramas
//   ('muros' con tipo 'tronco' + 'arbolesGigantes' para la copa y la cara). Al llegar a la cima
//   abre los ojos... y estornuda: te lanza hacia el lado de la bajada (no hace daño).
//
// api: { mostrarMensaje(scene, texto, ms) }

const SUELO_Y = 332;
const DOBLA = 22;          // px que baja una rama con alguien encima
const BAJA_VEL = 40;       // px/s al doblarse
const SUBE_VEL = 70;       // px/s al volver
const CRUJE_MS = 900;      // ms encima: cruje (la señal)
const ROMPE_MS = 1500;     // ms encima: se rompe
const VUELVE_MS = 3000;    // ms hasta que vuelve la rama rota
const ESTORNUDO_MS = 1000; // ms desde que abre los ojos hasta que estornuda

function texturas(scene) {
    if (scene.textures.exists('rama_bosque')) return;
    const g = scene.make.graphics({ add: false });
    // rama: madera con vetas y hojitas
    g.fillStyle(0x6b4423).fillRoundedRect(0, 3, 64, 12, 4);
    g.fillStyle(0x8a5a30).fillRect(4, 5, 56, 3);
    g.lineStyle(1, 0x4a2e16).lineBetween(10, 11, 24, 11).lineBetween(34, 9, 52, 9);
    g.fillStyle(0x3f8a3a).fillEllipse(8, 3, 10, 6).fillEllipse(40, 2, 12, 6).fillEllipse(58, 4, 8, 5);
    g.generateTexture('rama_bosque', 64, 16);
    g.destroy();
}

// se llama desde construirNivel (game.js) para las plataformas con tipo 'rama'
export function crearRama(scene, x, arriba, ancho) {
    texturas(scene);
    const p = scene.floor.create(x, arriba + 8, 'rama_bosque').setOrigin(0, 0.5).setDisplaySize(ancho, 16).refreshBody();
    p.esRama = true;
    p.yBase = p.y;
    p.pisadaDesde = 0;
    scene.ramas.push(p);
    return p;
}

export function crearBosque(scene, nivel) {
    texturas(scene);
    scene.arboles = (nivel.arbolesGigantes || []).map(([x, arriba, ancho]) => crearArbol(scene, x, arriba, ancho));
}

function crearArbol(scene, x, arriba, ancho) {
    const centro = x + ancho / 2;
    // tronco con corteza (el muro de roca invisible es lo que se pisa)
    const tronco = scene.add.graphics().setDepth(4);
    tronco.fillStyle(0x5a3a22).fillRect(x, arriba, ancho, SUELO_Y - arriba);
    tronco.lineStyle(2, 0x3e2614);
    for (let y = arriba + 30; y < SUELO_Y - 10; y += 46) {
        tronco.lineBetween(x + 14, y, x + 24, y + 22).lineBetween(x + ancho - 20, y + 18, x + ancho - 30, y + 40);
    }
    // raíces
    tronco.fillStyle(0x5a3a22).fillTriangle(x - 26, SUELO_Y, x + 10, SUELO_Y - 40, x + 10, SUELO_Y)
        .fillTriangle(x + ancho + 26, SUELO_Y, x + ancho - 10, SUELO_Y - 40, x + ancho - 10, SUELO_Y);
    // copa: muchas hojas alrededor de la cima (detrás del jugador)
    const copa = scene.add.graphics().setDepth(3);
    [[0, -70, 95, 0x2f6b2f], [-90, -40, 70, 0x3f8a3a], [90, -40, 70, 0x3f8a3a], [-50, -120, 65, 0x356f33], [55, -125, 60, 0x2f6b2f], [0, -150, 55, 0x3f8a3a]]
        .forEach(([dx, dy, r, color]) => copa.fillStyle(color, 0.95).fillCircle(centro + dx, arriba + dy, r));
    // cara: ojos cerrados (una línea) que se abren
    const yOjos = arriba + 70;
    const ojos = [-18, 18].map(dx => {
        const blanco = scene.add.ellipse(centro + dx, yOjos, 16, 12, 0xfff4d0).setDepth(5).setScale(1, 0.1);
        const pupila = scene.add.circle(centro + dx, yOjos + 1, 3, 0x1a0e06).setDepth(5).setVisible(false);
        return { blanco, pupila };
    });
    return { x, arriba, ancho, centro, ojos, copa, despierto: false };
}

export function actualizarBosque(scene, api) {
    const g = scene.mascotaGesi;
    if (!scene.ramas || g.isDead || scene.nivelTerminado) return;
    const ahora = scene.time.now, dt = scene.game.loop.delta / 1000;
    const gb = g.body;
    const enSuelo = gb.blocked.down || gb.touching.down;

    scene.ramas.forEach(p => {
        if (!p.active || p.rota) return;
        const pb = p.body;
        const encima = enSuelo && Math.abs(gb.bottom - pb.top) < 6 && gb.right > pb.left && gb.left < pb.right;
        let objetivo = p.yBase;
        if (encima) {
            if (!p.pisadaDesde) p.pisadaDesde = ahora;
            const t = ahora - p.pisadaDesde;
            objetivo = p.yBase + DOBLA;
            if (t > CRUJE_MS && !p.cruje) {
                // la señal: cruje, se pone clara y suelta hojas
                p.cruje = true;
                scene.sound.play('romper', { volume: 0.25, rate: 1.9 });
                scene.tweens.add({ targets: p, alpha: 0.6, yoyo: true, repeat: 3, duration: 70 });
                soltarHojas(scene, pb.center.x, pb.top, 4);
            }
            if (t > ROMPE_MS) { romperRama(scene, p); return; }
        } else {
            p.pisadaDesde = 0;
            p.cruje = false;
        }
        if (p.y !== objetivo) {
            const vel = objetivo > p.y ? BAJA_VEL : SUBE_VEL;
            p.y += Math.sign(objetivo - p.y) * Math.min(Math.abs(objetivo - p.y), vel * dt);
            p.refreshBody();
        }
    });

    // Árbol Anciano: al llegar a la cima abre los ojos y estornuda
    scene.arboles.forEach(a => {
        if (a.despierto) return;
        if (!enSuelo || gb.bottom > a.arriba + 4 || gb.right < a.x - 10 || gb.left > a.x + a.ancho + 10) return;
        a.despierto = true;
        a.ojos.forEach(o => {
            scene.tweens.add({ targets: o.blanco, scaleY: 1, duration: 200 });
            scene.time.delayedCall(200, () => o.pupila.setVisible(true));
        });
        scene.sound.play('rugido', { volume: 0.3, rate: 1.4 });
        api.mostrarMensaje(scene, '¿QUIÉN ME PISA?', 900);
        scene.time.delayedCall(ESTORNUDO_MS, () => {
            const yo = scene.mascotaGesi;
            api.mostrarMensaje(scene, '¡AAACHÍS!', 900);
            scene.cameras.main.shake(300, 0.008);
            scene.tweens.add({ targets: a.copa, x: 6, yoyo: true, repeat: 4, duration: 50 });
            soltarHojas(scene, a.centro, a.arriba - 60, 14);
            // te lanza hacia la bajada (a la derecha), sin daño, si sigues arriba
            const b = yo.body;
            if (!yo.isDead && b.bottom <= a.arriba + 30 && b.right > a.x - 60 && b.left < a.x + a.ancho + 60) {
                yo.setVelocity(260, -260);
                scene.empujadoHasta = scene.time.now + 400;
            }
            scene.time.delayedCall(1200, () => api.mostrarMensaje(scene, '...PERDÓN :)', 900));
        });
    });
}

function romperRama(scene, p) {
    p.rota = true;
    p.body.enable = false;
    scene.sound.play('romper', { volume: 0.5 });
    soltarHojas(scene, p.body.center.x, p.y, 6);
    scene.tweens.add({ targets: p, y: p.y + 300, angle: 25, alpha: 0, duration: 700, ease: 'Quad.easeIn' });
    scene.time.delayedCall(VUELVE_MS, () => {
        if (!p.active) return;
        p.setAngle(0);
        p.y = p.yBase;
        p.pisadaDesde = 0;
        p.cruje = false;
        p.body.enable = true;
        p.refreshBody();
        scene.tweens.add({ targets: p, alpha: 1, duration: 300, onComplete: () => { p.rota = false; } });
    });
}

function soltarHojas(scene, x, y, n) {
    for (let i = 0; i < n; i++) {
        const hoja = scene.add.rectangle(x + Phaser.Math.Between(-30, 30), y + Phaser.Math.Between(-10, 10), 4, 3, i % 2 ? 0x3f8a3a : 0x6fae4a).setDepth(41);
        scene.tweens.add({
            targets: hoja, y: hoja.y + Phaser.Math.Between(60, 120), x: hoja.x + Phaser.Math.Between(-30, 30), angle: 180,
            alpha: 0, duration: Phaser.Math.Between(700, 1200), onComplete: () => hoja.destroy(),
        });
    }
}
