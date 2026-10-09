// Trampas sorpresa estilo Cat Mario: carteles burlones, monedas trampa, rocas que caen,
// estatuas falsas, plataformas que muerden, banderas falsas y zombies gigantes que persiguen.
//
// api: funciones de game.js que se necesitan aquí
//   { killgesi(scene), crearEnemigo(scene, x, y, tipo), mostrarMensaje(scene, texto, ms) }

import { crearEstatua } from "./mazmorra.js"

const SUELO_Y = 332;

const rect = b => new Phaser.Geom.Rectangle(b.left ?? b.x, b.top ?? b.y, b.width, b.height);
const choca = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);

// inicioX: dónde aparece Gesi; las sorpresas que quedaron atrás no se vuelven a activar
export function crearSorpresas(scene, nivel, inicioX = 0) {
    const cueva = !nivel.nubes;
    const adelante = x => x > inicioX + 40;

    // carteles: se leen siempre (por encima de la oscuridad)... y casi siempre mienten
    (nivel.carteles || []).forEach(([x, y, texto]) => {
        scene.add.rectangle(x, (y + SUELO_Y) / 2, 4, SUELO_Y - y, 0x4a3420);
        scene.add.text(x, y, texto, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#ffe9a8',
            backgroundColor: '#3b2a1a', padding: { x: 6, y: 5 },
        }).setOrigin(0.5).setDepth(42);
    });

    // monedas trampa: idénticas a las normales
    (nivel.monedasTrampa || []).forEach(([x, y]) => {
        const m = scene.coins.create(x, y, 'coins').anims.play('coins-giro', true).setScale(0.75).refreshBody();
        m.trampa = true;
    });

    // rocas (estalactitas en la cueva, bloques de piedra afuera) colgando arriba
    scene.rocas = (nivel.rocas || []).filter(adelante).map(x => {
        const img = cueva
            ? scene.add.image(x, -8, 'mz_stalactite5').setOrigin(0.5, 0).setScale(1.4).setTint(0xa89888)
            : scene.add.image(x, 10, 'mz_bloque').setOrigin(0.5, 0).setScale(2.2).setTint(0x8a8aa0);
        return { x, img, estado: null };
    });

    // estatuas falsas (iguales a los puntos de control apagados)
    scene.estatuasFalsas = (nivel.estatuasFalsas || []).filter(adelante).map(x => ({ x, hecha: false, ...crearEstatua(scene, x, false) }));

    // plataformas que muerden
    (nivel.mordedoras || []).forEach(([x, y]) => {
        const p = scene.floor.create(x, y, 'mz_plataforma').refreshBody();
        p.muerde = true;
    });

    // banderas de meta falsas
    scene.banderasFalsas = (nivel.banderasFalsas || []).filter(adelante).map(x => {
        const mastil = scene.add.image(x, SUELO_Y, 'mastil').setOrigin(0.5, 1);
        const bandera = scene.add.image(x - 6, SUELO_Y - 160, 'bandera').setOrigin(1, 0).setScale(2);
        return { x, partes: [mastil, bandera], hecha: false };
    });

    scene.persecuciones = (nivel.persecuciones || []).filter(adelante).map(x => ({ x, hecha: false }));
}

// la plataforma que muerde: se llama cuando Gesi la toca (colisión con el suelo)
export function pisarMordedora(scene, pieza, api) {
    const g = scene.mascotaGesi.body;
    if (!pieza.muerde || pieza.mordiendo || !g.touching.down) return;
    pieza.mordiendo = true;

    // aviso: tiembla y se pone roja
    pieza.setTint(0xff5555);
    scene.tweens.add({ targets: pieza, x: '+=2', yoyo: true, repeat: 4, duration: 45 });
    const top = pieza.body.top;
    const dientes = [0, 1, 2, 3].map(i => scene.add.image(pieza.body.left + i * 32, top + 14, 'pincho').setOrigin(0, 1).setTint(0xffe0e0));
    scene.tweens.add({ targets: dientes, y: top, delay: 300, duration: 120 });

    // ¡ñam! si sigue encima, muere
    scene.time.delayedCall(450, () => {
        const b = scene.mascotaGesi.body;
        const encima = Math.abs(b.bottom - top) < 5 && b.right > pieza.body.left && b.left < pieza.body.right;
        if (encima) api.killgesi(scene);
        scene.sound.play('matar', { volume: 0.5 });
    });
    scene.time.delayedCall(1200, () => {
        scene.tweens.add({ targets: dientes, y: top + 16, duration: 150, onComplete: () => dientes.forEach(d => d.destroy()) });
        if (pieza.active) pieza.clearTint();
        pieza.mordiendo = false;
    });
}

// moneda trampa: al tomarla cae un enemigo justo encima
export function monedaTrampa(scene, moneda, api) {
    const e = api.crearEnemigo(scene, moneda.x, 0);
    e.x = moneda.x - (e.def.cuerpo[2] + e.def.cuerpo[0] / 2) * (e.def.escala ?? 1);
    api.mostrarMensaje(scene, '¡ERA UNA TRAMPA!', 1000);
}

export function actualizarSorpresas(scene, api) {
    const g = scene.mascotaGesi;
    if (g.isDead || scene.nivelTerminado) return;
    const gb = g.body, gx = gb.center.x;
    const rGesi = rect(gb);

    // rocas: tiemblan cuando te acercas y caen
    scene.rocas.forEach(r => {
        if (!r.estado && gx > r.x - 90 && gx < r.x + 30) {
            r.estado = 'tiembla';
            scene.tweens.add({ targets: r.img, x: r.x + 2, yoyo: true, repeat: 3, duration: 50 });
            scene.time.delayedCall(220, () => {
                r.estado = 'cae';
                scene.tweens.add({
                    targets: r.img, y: SUELO_Y - r.img.displayHeight + 4, duration: 330, ease: 'Quad.easeIn',
                    onComplete: () => {
                        r.estado = 'caida';
                        scene.sound.play('romper');
                        scene.cameras.main.shake(120, 0.004);
                        scene.tweens.add({ targets: r.img, alpha: 0, delay: 700, duration: 500, onComplete: () => r.img.destroy() });
                    }
                });
            });
        } else if (r.estado === 'cae') {
            const b = r.img.getBounds();
            if (choca(new Phaser.Geom.Rectangle(b.x + b.width * 0.2, b.y, b.width * 0.6, b.height), rGesi)) api.killgesi(scene);
        }
    });

    // estatua falsa: se despierta como esqueleto
    scene.estatuasFalsas.forEach(e => {
        if (e.hecha || gx < e.x - 25) return;
        e.hecha = true;
        api.mostrarMensaje(scene, '¡NO ERA UN PUNTO\nDE CONTROL!', 1200);
        scene.sound.play('romper');
        scene.tweens.add({ targets: e.estatua, x: e.x + 3, yoyo: true, repeat: 4, duration: 40 });
        scene.tweens.add({ targets: [e.estatua, e.luz], alpha: 0, delay: 250, duration: 250, onComplete: () => { e.estatua.destroy(); e.luz.destroy(); } });
        scene.time.delayedCall(250, () => {
            const esq = api.crearEnemigo(scene, e.x - 64, SUELO_Y - 2, 'esqueleto');
            esq.flipX = gx < e.x;
            esq.setVelocityX(esq.flipX ? -esq.velBase : esq.velBase);
        });
    });

    // bandera falsa: suena la victoria... y la bandera sale corriendo
    scene.banderasFalsas.forEach(f => {
        if (f.hecha || gx < f.x - 40) return;
        f.hecha = true;
        const v = scene.sound.add('victoria');
        v.play();
        scene.time.delayedCall(450, () => v.stop());
        api.mostrarMensaje(scene, '¡JA! ESA NO ERA\nLA META', 1500);
        scene.tweens.add({ targets: f.partes, x: '+=650', duration: 1800, ease: 'Quad.easeIn', onComplete: () => f.partes.forEach(p => p.destroy()) });
        scene.tweens.add({ targets: f.partes, y: '-=30', yoyo: true, repeat: 5, duration: 150 });
        [120, 230].forEach((dx, i) => scene.time.delayedCall(300 + i * 250, () => api.crearEnemigo(scene, f.x + dx, 0)));
    });

    // persecución: un zombie gigante aparece detrás
    scene.persecuciones.forEach(p => {
        if (p.hecha || g.x < p.x) return;
        p.hecha = true;
        const gigante = api.crearEnemigo(scene, g.x - 430, 0, 'zombie3');
        gigante.setScale(2 * (gigante.def.escala ?? 1)).setTint(0xff9a9a);
        gigante.gigante = true;
        gigante.vida = 6;
        gigante.velBase = 150;
        gigante.anims.timeScale = 1.8;
        api.mostrarMensaje(scene, '¡CORRE!', 1200);
        scene.cameras.main.shake(400, 0.006);
        scene.sound.play('romper');
    });
}
