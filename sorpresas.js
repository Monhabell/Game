// Trampas sorpresa: carteles burlones, monedas trampa, rocas que caen, estatuas falsas,
// plataformas que muerden, faros de meta falsos, cebos y zombies gigantes que persiguen.
//
// api: funciones de game.js que se necesitan aquí
//   { killgesi(scene), crearEnemigo(scene, x, y, tipo), mostrarMensaje(scene, texto, ms) }

import { crearEstatua } from "./mazmorra.js"

const SUELO_Y = 332;
// tiempos de aviso (a 220 px/s, la velocidad de carrera)
const AVISO_ROCA = 200;        // px: la roca empieza a temblar a esta distancia...
const TIEMBLA_ROCA = 500;      // ms: ...tiembla este tiempo y después tarda 330 ms en caer
const AVISO_ESTATUA = 200;     // px: la estatua falsa despierta a esta distancia...
const DESPIERTA_ESTATUA = 450; // ms: ...y el esqueleto sale después de esta espera

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
    scene.cueva = cueva;
    scene.rocas = (nivel.rocas || []).filter(adelante).map(x => crearRoca(scene, x));

    // cebos: cristales tentadores que esconden una trampa (ver activarCebo)
    (nivel.cebos || []).filter(([x]) => adelante(x)).forEach(([x, y, tipo]) => {
        const c = scene.premios.create(x, y, 'mz_cristal').anims.play('mz_cristal', true).refreshBody();
        c.tipoPremio = 'cristal';
        c.cebo = tipo;
        c.brillo = scene.add.image(x, y, 'brillo').setDepth(41).setScale(0.8).setTint(0xc77dff).setAlpha(0.35).setBlendMode('ADD');
        c.on('destroy', () => c.brillo.destroy());
    });

    // estatuas falsas (iguales a los puntos de control apagados)
    scene.estatuasFalsas = (nivel.estatuasFalsas || []).filter(adelante).map(x => ({ x, hecha: false, ...crearEstatua(scene, x, false) }));

    // plataformas que muerden
    (nivel.mordedoras || []).forEach(([x, y]) => {
        const p = scene.floor.create(x, y, 'mz_plataforma').refreshBody();
        p.muerde = true;
    });

    // faros de meta falsos (iguales al Faro del Alba de la meta)
    scene.banderasFalsas = (nivel.banderasFalsas || []).filter(adelante).map(x => {
        const mastil = scene.add.image(x, SUELO_Y, 'mastil').setOrigin(0.5, 1);
        const bandera = scene.add.image(x, SUELO_Y - 165, 'bandera').setOrigin(0.5, 1).setScale(2);
        return { x, partes: [mastil, bandera], hecha: false };
    });

    scene.persecuciones = (nivel.persecuciones || []).filter(adelante).map(x => ({ x, hecha: false }));
}

// roca colgando del techo; cae cuando el jugador se acerca (ver actualizarSorpresas)
function crearRoca(scene, x) {
    const img = scene.cueva
        ? scene.add.image(x, -8, 'mz_stalactite5').setOrigin(0.5, 0).setScale(1.4).setTint(0xa89888)
        : scene.add.image(x, 10, 'mz_bloque').setOrigin(0.5, 0).setScale(2.2).setTint(0x8a8aa0);
    return { x, img, estado: null };
}

// Castigo a la codicia: al tomar un cebo se activa su trampa.
// Devuelve 'sin_premio' si el cebo no paga nada (el mímico).
export function activarCebo(scene, premio, api) {
    const g = scene.mascotaGesi, x = premio.x;
    premio.brillo?.destroy();
    scene.sound.play('trampa', { volume: 0.5 });
    if (premio.cebo === 'mimico') {
        // era un enemigo disfrazado: te empuja hacia atrás (sin quitarte vida) y pelea
        const lado = g.x < x ? -1 : 1;
        g.setVelocity(lado * 220, -220);
        scene.empujadoHasta = scene.time.now + 250; // las flechas no anulan el empujón
        scene.invulnerableHasta = scene.time.now + 700;
        const e = api.crearEnemigo(scene, x, SUELO_Y - 2);
        e.x = x - (e.def.cuerpo[2] + e.def.cuerpo[0] / 2) * (e.def.escala ?? 1);
        e.flipX = lado < 0; // mira hacia el jugador
        e.setVelocityX(lado < 0 ? -e.velBase : e.velBase);
        e.setTintFill(0xc77dff);
        scene.time.delayedCall(150, () => e.active && e.clearTint());
        api.mostrarMensaje(scene, '¡ERA UN MÍMICO!', 1000);
        return 'sin_premio';
    }
    if (premio.cebo === 'techo') {
        // una roca se desprende encima de donde aterrizas: tiembla y cae como las demás
        // (si sigues moviéndote te salvas; si te quedas admirando el cristal, no)
        api.mostrarMensaje(scene, '¡CODICIOSO!', 900);
        const esperar = scene.time.addEvent({
            delay: 50, repeat: 80, callback: () => { // espera hasta 4 s a que aterrice
                const b = g.body;
                if (!g.isDead && b && !(b.blocked.down || b.touching.down) && esperar.getRepeatCount() > 0) return;
                esperar.remove();
                if (!g.isDead) scene.rocas.push(crearRoca(scene, b.center.x));
            },
        });
    } else if (premio.cebo === 'suelo') {
        // el suelo bajo el cristal se derrumba
        scene.floor.getChildren()
            .filter(p => p.esFalso && p.body && Math.abs(p.body.center.x - x) < 70)
            .forEach(p => api.derrumbarSuelo(scene, p));
        api.mostrarMensaje(scene, '¡EL SUELO!', 900);
    }
    return 'con_premio';
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
    scene.sound.play('trampa', { volume: 0.5 });
}

export function actualizarSorpresas(scene, api) {
    const g = scene.mascotaGesi;
    if (g.isDead || scene.nivelTerminado) return;
    const gb = g.body, gx = gb.center.x;
    const rGesi = rect(gb);

    // rocas: al acercarte tiemblan, sueltan polvo y su sombra aparece en el suelo; después caen.
    // Si sigues corriendo sin mirar llegas justo debajo: hay que frenar o pasar antes
    scene.rocas.forEach(r => {
        if (!r.estado && Math.abs(gx - r.x) < AVISO_ROCA) {
            r.estado = 'tiembla';
            scene.tweens.add({ targets: r.img, x: r.x + 2, yoyo: true, repeat: Math.floor(TIEMBLA_ROCA / 100) - 1, duration: 50 });
            scene.sound.play('romper', { volume: 0.2, rate: 1.6 });
            const sombra = scene.add.ellipse(r.x, SUELO_Y - 1, 16, 5, 0x000000, 0.55).setDepth(36);
            const aviso = scene.add.image(r.x, SUELO_Y - 4, 'brillo').setDepth(41).setScale(0.7, 0.2)
                .setTint(0xffb070).setAlpha(0.55).setBlendMode('ADD');
            scene.tweens.add({ targets: sombra, scaleX: 3, scaleY: 1.6, duration: TIEMBLA_ROCA + 330 });
            scene.time.delayedCall(TIEMBLA_ROCA + 330, () => { sombra.destroy(); aviso.destroy(); });
            for (let i = 0; i < 4; i++) {
                const polvo = scene.add.rectangle(r.x + Phaser.Math.Between(-8, 8), r.img.y + r.img.displayHeight, 2, 2, 0xd8c0a0).setDepth(41);
                scene.tweens.add({ targets: polvo, y: polvo.y + 60, alpha: 0, delay: i * 120, duration: 600, onComplete: () => polvo.destroy() });
            }
            scene.time.delayedCall(TIEMBLA_ROCA, () => {
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

    // estatua falsa (tiene ojos rojos): se despierta como esqueleto antes de que llegues a ella
    scene.estatuasFalsas.forEach(e => {
        if (e.hecha || gx < e.x - AVISO_ESTATUA) return;
        e.hecha = true;
        api.mostrarMensaje(scene, '¡NO ERA UN PUNTO\nDE CONTROL!', 1200);
        scene.sound.play('trampa', { volume: 0.5 });
        scene.sound.play('romper');
        scene.tweens.add({ targets: e.estatua, x: e.x + 3, yoyo: true, repeat: 8, duration: 40 });
        scene.tweens.add({ targets: [e.estatua, e.luz], alpha: 0, delay: DESPIERTA_ESTATUA, duration: 250, onComplete: () => { e.estatua.destroy(); e.luz.destroy(); } });
        scene.time.delayedCall(DESPIERTA_ESTATUA, () => {
            const esq = api.crearEnemigo(scene, e.x - 64, SUELO_Y - 2, 'esqueleto');
            esq.flipX = gx < e.x;
            esq.setVelocityX(esq.flipX ? -esq.velBase : esq.velBase);
        });
    });

    // faro falso: suena la victoria... y el faro sale corriendo
    scene.banderasFalsas.forEach(f => {
        if (f.hecha || gx < f.x - 40) return;
        f.hecha = true;
        const v = scene.sound.add('victoria');
        v.play();
        scene.time.delayedCall(450, () => { v.stop(); scene.sound.play('trampa', { volume: 0.55 }); });
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
        scene.sound.play('rugido', { volume: 0.7 });
        scene.cameras.main.shake(400, 0.006);
        scene.sound.play('romper');
    });
}
