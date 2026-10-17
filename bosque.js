// Piezas propias del Bosque (región del nivel 1). Ver tramos.js: tramoRamas, tramoArbolAnciano.
//
// Ramas que se doblan: plataformas de madera ([x, arriba, ancho, 'rama'] en 'plataformas').
//   Al pisarlas se doblan hacia abajo; si te quedas mucho, crujen (la señal) y se rompen.
//   Vuelven a los pocos segundos. Enseñan a no quedarse quieto encima de nada.
// Árbol Anciano (el momento ¡wow! del Bosque): un tronco gigante que se sube por sus ramas
//   ('muros' con tipo 'tronco' + 'arbolesGigantes' para la copa y la cara). Al llegar a la cima
//   abre los ojos... y estornuda: te lanza hacia el lado de la bajada (no hace daño).
//
// Nivel 1, "aprender a moverse juntos" (ver el bloque de abajo): suelo de raíces que aguanta a uno,
//   ramas que se rompen con dos encima y se inclinan en la punta, puente de madera que se cae detrás
//   del grupo y troncos que flotan en la lava.
//
// api: { mostrarMensaje(scene, texto, ms), killgesi(scene) }

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
    crearNivel1Juntos(scene, nivel);
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
    if (!scene.soloActivar) actualizarNivel1Juntos(scene, api);
    const ahora = scene.time.now, dt = scene.game.loop.delta / 1000;
    const gb = g.body;
    const enSuelo = gb.blocked.down || gb.touching.down;

    scene.ramas.forEach(p => {
        if (!p.active || p.rota) return;
        const pb = p.body;
        const encima = enSuelo && Math.abs(gb.bottom - pb.top) < 6 && gb.right > pb.left && gb.left < pb.right;
        let objetivo = p.yBase;
        // con dos encima cruje y se rompe enseguida (hay que cruzar por turnos)
        if (!scene.soloActivar) {
            const n = cuantosEncima(scene, pb.left, pb.right, pb.top);
            if (n >= 2) {
                if (!p.sobrecarga) {
                    p.sobrecarga = ahora;
                    scene.sound.play('romper', { volume: 0.35, rate: 1.9 });
                    soltarHojas(scene, pb.center.x, pb.top, 4);
                    if (!scene.avisoRamas) { scene.avisoRamas = true; api.mostrarMensaje(scene, '¡DE A UNO!', 900); }
                }
                if (ahora - p.sobrecarga > RAMA_SOBRECARGA) { romperRama(scene, p); return; }
            } else p.sobrecarga = 0;
            // en la punta se inclina y resbala hacia el borde
            const punta = encima ? (gb.center.x < pb.left + pb.width * PUNTA ? -1 : gb.center.x > pb.right - pb.width * PUNTA ? 1 : 0) : 0;
            const angulo = punta * 7;
            if (p.angle !== angulo) p.setAngle(p.angle + Math.sign(angulo - p.angle) * Math.min(Math.abs(angulo - p.angle), 40 * dt));
            if (punta) g.x += punta * RESBALA * dt;
        }
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

// =====================================================================================
// Nivel 1: aprender a moverse juntos (tramos.js: tramoSalidaEnganosa, tramoRamasTraicioneras,
// tramoPuenteMadera). Todo funciona solo, en la carrera y en cadena: "cuántos
// hay encima" cuenta al jugador, al compañero del mismo teclado y a los demás jugadores en línea
// (en la carrera los rivales son fantasmas: no pesan).
// =====================================================================================

const PESO_CRUJE = 350;     // ms que cruje un suelo de raíces sobrecargado antes de hundirse
const PESO_QUIETO = 1200;   // ms quieto encima (aunque seas uno solo) hasta que se hunde
const PESO_VUELVE = 4000;   // ms hasta que el suelo de raíces vuelve
const RAMA_SOBRECARGA = 450; // ms que aguanta una rama con dos encima
const PUNTA = 0.2;          // fracción de la rama que es "la punta" (ahí se inclina)
const RESBALA = 55;         // px/s que resbala en la punta
const PUENTE_ESPERA = 900;  // ms desde que alguien pisa el puente hasta que empieza a caerse
const PUENTE_VEL = 120;     // px/s del derrumbe (el más lento corre a 209)

// lo de este bosque que hay que dibujar con texturas propias
export function texturasBosque(scene) {
    texturas(scene);
    if (scene.textures.exists('tabla_madera')) return;
    const g = scene.make.graphics({ add: false });
    // tabla del puente: madera clara con clavos
    g.fillStyle(0x7a5230).fillRect(0, 0, 62, 16);
    g.fillStyle(0x9a6a3c).fillRect(0, 2, 62, 4);
    g.lineStyle(1, 0x4a2e16).strokeRect(0, 0, 62, 16).lineBetween(31, 0, 31, 16);
    g.fillStyle(0x2a1a0a).fillCircle(5, 8, 1.5).fillCircle(57, 8, 1.5);
    g.generateTexture('tabla_madera', 62, 16);
    g.clear();
    // tronco que flota en la lava (mismo tamaño que la plataforma móvil: 128 x 32)
    g.fillStyle(0x5a3a22).fillRoundedRect(0, 4, 128, 24, 10);
    g.fillStyle(0x7a5230).fillRect(8, 8, 112, 5);
    g.lineStyle(2, 0x3e2614).strokeCircle(12, 16, 7).lineBetween(30, 22, 70, 22).lineBetween(80, 12, 116, 12);
    g.fillStyle(0x3f8a3a).fillEllipse(60, 5, 14, 6);
    g.generateTexture('tronco_rio', 128, 32);
    g.clear();
    // suelo de raíces (aguanta a uno)
    g.fillStyle(0x4a2e16).fillRect(0, 0, 64, 16);
    g.lineStyle(3, 0x6b4423).lineBetween(0, 5, 22, 9).lineBetween(18, 9, 40, 4).lineBetween(36, 4, 64, 10);
    g.lineStyle(2, 0x8a5a30).lineBetween(4, 13, 30, 12).lineBetween(34, 13, 60, 14);
    g.generateTexture('suelo_raices', 64, 16);
    g.destroy();
}

// tablas del puente de madera ([x, arriba, ancho, 'tabla'] en 'plataformas')
export function crearTabla(scene, x, arriba, ancho) {
    texturasBosque(scene);
    const p = scene.floor.create(x, arriba + 8, 'tabla_madera').setOrigin(0, 0.5).setDisplaySize(ancho, 16).refreshBody();
    p.esTabla = true;
    return p;
}

// cuántos jugadores están parados sobre [izq, der] a la altura 'arriba'
function cuantosEncima(scene, izq, der, arriba) {
    const pisa = s => {
        const b = s?.body;
        if (!b || s.isDead || s.active === false) return false;
        const suelo = b.blocked?.down || b.touching?.down;
        return suelo && Math.abs(b.bottom - arriba) < 8 && b.right > izq && b.left < der;
    };
    let n = 0;
    const g = scene.mascotaGesi;
    if (pisa(g)) n++;
    if (scene.compa && pisa(scene.compa)) n++;
    (scene.fantasmasBosque?.() || []).forEach(f => { if (pisa(f)) n++; });
    return n;
}

function crearNivel1Juntos(scene, nivel) {
    texturasBosque(scene);
    // suelo de raíces que aguanta a uno (sobre la lava)
    scene.suelosPeso = (nivel.suelosPeso || []).map(([x, ancho, aguanta]) => {
        const p = scene.floor.create(x, SUELO_Y + 8, 'suelo_raices').setOrigin(0, 0.5).setDisplaySize(ancho, 16).refreshBody();
        return { p, x, ancho, aguanta, quietoDesde: 0, cruje: 0, caido: false };
    });
    // puentes de madera: las tablas que caen detrás del grupo
    scene.puentesMadera = (nivel.puentesMadera || []).map(([a, b]) => ({
        a, b, empieza: 0, frente: a,
        tablas: scene.floor.getChildren().filter(t => t.esTabla && t.body.left >= a - 2 && t.body.right <= b + 2).sort((t, u) => t.body.left - u.body.left),
    }));
}

function actualizarNivel1Juntos(scene, api) {
    const g = scene.mascotaGesi, ahora = scene.time.now, dt = scene.game.loop.delta / 1000;
    // suelo de raíces: aguanta a uno (y a uno que no se queda quieto)
    (scene.suelosPeso || []).forEach(s => {
        if (s.caido) return;
        const n = cuantosEncima(scene, s.x, s.x + s.ancho, SUELO_Y);
        const yoEncima = cuantosEncima({ mascotaGesi: g }, s.x, s.x + s.ancho, SUELO_Y) > 0;
        if (yoEncima && Math.abs(g.body.velocity.x) < 5) s.quietoDesde ||= ahora;
        else s.quietoDesde = 0;
        const sobra = n > s.aguanta || (s.quietoDesde && ahora - s.quietoDesde > PESO_QUIETO);
        // con uno encima se dobla un poco (asusta, pero aguanta)
        s.p.setAlpha(n ? 0.85 : 1);
        if (!sobra) { s.cruje = 0; s.p.clearTint(); return; }
        if (!s.cruje) {
            s.cruje = ahora;
            s.p.setTint(0xff9a7a);
            scene.sound.play('romper', { volume: 0.35, rate: 1.7 });
            scene.tweens.add({ targets: s.p, x: s.p.x + 2, yoyo: true, repeat: 3, duration: 40 });
        }
        if (ahora - s.cruje < PESO_CRUJE) return;
        s.caido = true;
        s.p.body.enable = false;
        scene.tweens.add({ targets: s.p, y: s.p.y + 60, alpha: 0, duration: 500 });
        soltarHojas(scene, s.x + s.ancho / 2, SUELO_Y, 6);
        if (!scene.avisoPeso) { scene.avisoPeso = true; api.mostrarMensaje(scene, n > s.aguanta ? '¡CRAC!\nAGUANTA A UNO SOLO' : '¡CRAC!\nNO TE QUEDES QUIETO', 1300); }
        scene.time.delayedCall(PESO_VUELVE, () => {
            if (!s.p.active) return;
            s.p.y = SUELO_Y + 8;
            s.p.clearTint();
            s.p.body.enable = true;
            s.p.refreshBody();
            scene.tweens.add({ targets: s.p, alpha: 1, duration: 300, onComplete: () => { s.caido = false; s.cruje = 0; s.quietoDesde = 0; } });
        });
    });
    // puente de madera: se cae detrás del grupo
    (scene.puentesMadera || []).forEach(pm => {
        if (!pm.empieza) {
            const alguien = pm.tablas.some(t => t.body.enable && cuantosEncima(scene, t.body.left, t.body.right, t.body.top) > 0);
            if (!alguien) return;
            pm.empieza = ahora + PUENTE_ESPERA;
            scene.sound.play('romper', { volume: 0.3, rate: 1.5 });
            api.mostrarMensaje(scene, '¡EL PUENTE CRUJE!\n¡SIGAN!', 1100);
            return;
        }
        if (ahora < pm.empieza || pm.frente >= pm.b) return;
        pm.frente += PUENTE_VEL * dt;
        pm.tablas.forEach(t => {
            if (t.cae || t.body.right > pm.frente) return;
            t.cae = true;
            t.setTint(0xc08a6a);
            scene.time.delayedCall(150, () => {
                if (!t.active) return;
                t.body.enable = false;
                scene.tweens.add({ targets: t, y: t.y + 280, angle: Phaser.Math.Between(-30, 30), alpha: 0, duration: 800, ease: 'Quad.easeIn' });
            });
            if (Math.random() < 0.4) scene.sound.play('romper', { volume: 0.2, rate: 1.8 });
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
        p.sobrecarga = 0;
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
