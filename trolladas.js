// TROLLADAS: las 100 trampas troll al estilo Cat Mario (la lista completa, en tandas). Funcionan como
// las locuras (locuras.js las llama: mismo formato [x, tipo] en nivel.locuras) y las reparte azar.js en
// TODOS los niveles: cada nivel estrena una que nunca viste y mezcla las de antes.
//
// Reglas de justicia (las mismas de las locuras): todas avisan antes (una sombra, un crujido, un
// temblor) y, si hacen daño, primero se rompe el escudo. Algunas no hacen nada: solo asustan.
//
// TANDA 1
//   bloqueHuye     #1  el bloque "?" se escapa cuando saltas a golpearlo (a la tercera da una moneda)
//   yunques        #17 caen yunques de cartón (sombra antes)… y el último es de verdad
//   lampara        #18 la lámpara del techo cruje y cae justo cuando pasas
//   jaula          #21 una jaula cae y te encierra un momento
//   corazonFalso   #27 un corazón que late raro: al tomarlo, muerde
//   muertoFalso    #34 un esqueleto tirado en el suelo… se levanta detrás de ti
//   noMirarArriba  #51 "NO MIRES ARRIBA": arriba hay una roca que cae
//   camaraAtras    #72 la cámara se queda atrás un momento y sigues a ciegas
//   trollAsoma     #88 el troll se asoma por el borde de la pantalla, se ríe y se va (no hace nada)
//   monedaExplota  #90 una moneda que hace tic-tac: al tomarla, ¡BOOM! (te empuja, no daña)
//
// api (la de locuras): { killgesi(scene), crearEnemigo(scene, x, y, tipo), mostrarMensaje(scene, texto, ms) }

const SUELO_Y = 332;
const PROF = 41; // por encima de la oscuridad (como las locuras)

// el orden en que se estrenan: cada nivel suma una (la primera tanda se ve entera en el nivel 10)
export const TROLLADAS = [
    'bloqueHuye', 'yunques', 'trollAsoma', 'monedaExplota', 'noMirarArriba',
    'lampara', 'muertoFalso', 'corazonFalso', 'jaula', 'camaraAtras',
];
// dónde va cada una (azar.js): 'techo' = sin bloques ni plataformas encima; 'largo' = suelo firme
// largo por delante (se sigue a ciegas o se corre)
export const LUGAR_TROLLADA = {
    yunques: 'techo', lampara: 'techo', jaula: 'techo', noMirarArriba: 'techo', bloqueHuye: 'techo',
    camaraAtras: 'largo', muertoFalso: 'largo',
};
// las que no hacen daño (no cuentan como trampas)
export const TROLLADAS_INOFENSIVAS = ['trollAsoma', 'monedaExplota', 'bloqueHuye'];
// las que dependen de un jugador en particular (en línea: no se activan con los otros jugadores)
export const TROLLADAS_DE_CADA_JUGADOR = ['bloqueHuye', 'monedaExplota', 'corazonFalso', 'jaula', 'camaraAtras', 'trollAsoma'];

const rect = b => new Phaser.Geom.Rectangle(b.left ?? b.x, b.top ?? b.y, b.width, b.height);
const choca = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);
const enSuelo = g => g.body.blocked.down || g.body.touching.down;
const burla = (scene, api, texto, ms = 900) => { api.mostrarMensaje(scene, texto, ms); scene.sound.play('trampa', { volume: 0.4 }); };

function texturas(scene) {
    if (scene.textures.exists('tr_yunque')) return;
    const g = scene.make.graphics({ add: false });
    // yunque
    g.fillStyle(0x5a5f6e).fillRect(4, 0, 40, 10).fillRect(14, 10, 20, 10).fillRect(8, 20, 32, 8);
    g.fillStyle(0x7d8394).fillRect(4, 0, 40, 3);
    g.generateTexture('tr_yunque', 48, 28);
    g.clear();
    // yunque de cartón (marrón, con una arruga)
    g.fillStyle(0xb58a55).fillRect(4, 0, 40, 10).fillRect(14, 10, 20, 10).fillRect(8, 20, 32, 8);
    g.lineStyle(1, 0x7a5a32).lineBetween(10, 4, 20, 7).lineBetween(26, 22, 34, 25);
    g.generateTexture('tr_carton', 48, 28);
    g.clear();
    // lámpara de velas
    g.fillStyle(0x8a6a2a).fillRect(0, 14, 56, 5).fillRect(26, 0, 4, 16);
    g.fillStyle(0xe8dcc0).fillRect(4, 6, 5, 8).fillRect(25, 6, 5, 0).fillRect(47, 6, 5, 8).fillRect(17, 6, 5, 8).fillRect(34, 6, 5, 8);
    g.fillStyle(0xffc94a).fillCircle(6, 4, 2).fillCircle(19, 4, 2).fillCircle(36, 4, 2).fillCircle(49, 4, 2);
    g.generateTexture('tr_lampara', 56, 20);
    g.clear();
    // jaula
    g.lineStyle(3, 0x6e6a80);
    for (let i = 0; i <= 6; i++) g.lineBetween(2 + i * 8, 6, 2 + i * 8, 76);
    g.fillStyle(0x55526a).fillRect(0, 0, 54, 7).fillRect(0, 74, 54, 6);
    g.generateTexture('tr_jaula', 54, 80);
    g.clear();
    // bloque "?"
    g.fillStyle(0xc98a1e).fillRect(0, 0, 32, 32);
    g.fillStyle(0xffc94a).fillRect(2, 2, 28, 28);
    g.fillStyle(0x7a4a0a).fillRect(12, 8, 8, 3).fillRect(18, 10, 3, 6).fillRect(14, 15, 5, 3).fillRect(14, 18, 3, 3).fillRect(14, 23, 3, 3);
    g.generateTexture('tr_bloque', 32, 32);
    g.clear();
    // roca
    g.fillStyle(0x6a6070).fillCircle(16, 16, 15);
    g.fillStyle(0x857a8c).fillCircle(11, 10, 5).fillCircle(21, 20, 3);
    g.generateTexture('tr_roca', 32, 32);
    g.clear();
    // sombra en el suelo
    g.fillStyle(0x000000, 0.45).fillEllipse(24, 5, 48, 10);
    g.generateTexture('tr_sombra', 48, 10);
    g.destroy();
}

// ---------- al armar el nivel ----------
export const CREAR_TROLLADAS = {
    bloqueHuye(scene, l) {
        texturas(scene);
        l.img = scene.add.image(l.x, 232, 'tr_bloque').setDepth(PROF);
        l.saltos = 0;
    },
    yunques(scene, l) { texturas(scene); },
    lampara(scene, l) {
        texturas(scene);
        l.cadena = scene.add.rectangle(l.x, 0, 3, 130, 0x55526a).setOrigin(0.5, 0).setDepth(PROF);
        l.img = scene.add.image(l.x, 130, 'tr_lampara').setOrigin(0.5, 0).setDepth(PROF);
        l.brillo = scene.add.image(l.x, 136, 'brillo').setDepth(PROF).setScale(1.4).setTint(0xffc94a).setAlpha(0.35).setBlendMode('ADD');
        scene.tweens.add({ targets: [l.img], angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' });
    },
    jaula(scene, l) {
        texturas(scene);
        l.cadena = scene.add.rectangle(l.x, 0, 3, 40, 0x55526a).setOrigin(0.5, 0).setDepth(PROF);
        l.img = scene.add.image(l.x, 40, 'tr_jaula').setOrigin(0.5, 0).setDepth(PROF);
    },
    corazonFalso(scene, l) {
        l.img = scene.add.image(l.x, 286, 'mz_corazon', 9).setDepth(PROF).setScale(0.8).setTint(0xff7ab0);
        // late raro: rápido y torcido (la pista)
        scene.tweens.add({ targets: l.img, scale: 0.95, angle: 8, yoyo: true, repeat: -1, duration: 220 });
    },
    muertoFalso(scene, l) {
        if (!scene.textures.exists('esqueleto-dead')) return false;
        l.img = scene.add.sprite(l.x, SUELO_Y + 2, 'esqueleto-dead', 2).setOrigin(0.5, 1).setDepth(5);
        // se mueve un poquito cada tanto (la pista)
        l.tic = scene.time.addEvent({ delay: 2200, loop: true, callback: () => l.img.active && scene.tweens.add({ targets: l.img, angle: 6, yoyo: true, duration: 90 }) });
    },
    noMirarArriba(scene, l) {
        texturas(scene);
        const palo = scene.add.rectangle(l.x - 120, SUELO_Y, 4, 70, 0x4a3420).setOrigin(0.5, 1).setDepth(PROF);
        const texto = scene.add.text(l.x - 120, SUELO_Y - 70, 'NO MIRES ARRIBA', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffe9a8', backgroundColor: '#3b2a1a', padding: { x: 5, y: 4 },
        }).setOrigin(0.5, 1).setDepth(PROF);
        l.cartel = [palo, texto];
        l.img = scene.add.image(l.x, 40, 'tr_roca').setDepth(PROF);
    },
    camaraAtras() {},
    trollAsoma() {},
    monedaExplota(scene, l) {
        l.img = scene.add.sprite(l.x, 300, 'coins').anims.play('coins-giro', true).setScale(0.75).setDepth(PROF).setTint(0xffb0a0);
        // tic-tac: se agranda un poquito, como si latiera (la pista)
        scene.tweens.add({ targets: l.img, scale: 0.85, yoyo: true, repeat: -1, duration: 260 });
    },
};

// ---------- cada fotograma ----------
export const ACTUALIZAR_TROLLADAS = {
    bloqueHuye(scene, l, api, { gb, gx }) {
        if (l.hecha || l.saltando || Math.abs(gx - l.img.x) > 46 || gb.velocity.y >= 0 || gb.top > 300) return;
        l.saltando = true;
        l.saltos++;
        scene.sound.play('salto', { volume: 0.3, rate: 1.7 });
        if (l.saltos >= 3) {
            // a la tercera se deja: suelta una moneda de verdad
            l.hecha = true;
            scene.tweens.add({ targets: l.img, y: l.img.y - 10, yoyo: true, duration: 90 });
            scene.coins.create(l.img.x, l.img.y - 34, 'coins').anims.play('coins-giro', true).setScale(0.75).refreshBody();
            api.mostrarMensaje(scene, 'BUENO, TOMA…', 700);
            return;
        }
        if (l.saltos === 1) burla(scene, api, '¡JE! ¡NO ME ALCANZAS!', 800);
        scene.tweens.add({ targets: l.img, x: l.img.x + 150, duration: 380, ease: 'Quad.out' });
        scene.tweens.add({ targets: l.img, y: 190, yoyo: true, duration: 190, onComplete: () => { l.saltando = false; } });
    },
    yunques(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x - 150 || gx > l.x + 300) return;
        l.hecha = true;
        // tres de cartón (delante de ti, para que aprendas que no pasa nada)… y el cuarto, de verdad, donde estés
        [0, 1, 2].forEach(i => scene.time.delayedCall(i * 520, () => caer(scene, api, gx + 70 + i * 60, false)));
        scene.time.delayedCall(3 * 520 + 250, () => caer(scene, api, scene.mascotaGesi.body.center.x, true));
    },
    lampara(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x - 130 || gx > l.x + 20) return;
        l.hecha = true;
        scene.sound.play('romper', { volume: 0.3, rate: 1.8 });
        scene.tweens.killTweensOf(l.img);
        scene.tweens.add({ targets: l.img, angle: { from: -10, to: 10 }, yoyo: true, repeat: 2, duration: 90 });
        scene.time.delayedCall(560, () => {
            l.cadena.destroy();
            scene.tweens.add({ targets: [l.img, l.brillo], y: SUELO_Y - 20, duration: 330, ease: 'Quad.in', onComplete: () => {
                scene.sound.play('romper');
                scene.cameras.main.shake(120, 0.005);
                const zona = new Phaser.Geom.Rectangle(l.x - 30, SUELO_Y - 70, 60, 70);
                if (choca(zona, rect(scene.mascotaGesi.body))) api.killgesi(scene);
                else api.mostrarMensaje(scene, '¡UY! CASI', 600);
                scene.tweens.add({ targets: l.brillo, alpha: 0, duration: 300 });
            } });
        });
    },
    jaula(scene, l, api, { g, gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 24 || !enSuelo(g)) return;
        l.hecha = true;
        scene.sound.play('romper', { volume: 0.3, rate: 1.5 });
        scene.tweens.add({ targets: l.img, x: '+=2', yoyo: true, repeat: 3, duration: 40 });
        scene.time.delayedCall(260, () => {
            const x = scene.mascotaGesi.body.center.x;
            const atrapado = Math.abs(x - l.x) < 30;
            scene.tweens.add({ targets: l.img, y: SUELO_Y - 80, duration: 200, ease: 'Quad.in', onComplete: () => {
                scene.sound.play('romper');
                if (atrapado) {
                    scene.aturdidoHasta = scene.time.now + 1700;
                    burla(scene, api, '¡ENJAULADO! JA JA', 1200);
                }
                scene.time.delayedCall(1700, () => scene.tweens.add({ targets: [l.img, l.cadena], y: '-=400', duration: 700, ease: 'Quad.in' }));
            } });
        });
    },
    corazonFalso(scene, l, api, { rGesi }) {
        if (l.hecha || !choca(new Phaser.Geom.Rectangle(l.x - 12, 274, 24, 24), rGesi)) return;
        l.hecha = true;
        scene.tweens.killTweensOf(l.img);
        l.img.setTint(0x9b2fff);
        scene.tweens.add({ targets: l.img, scale: 1.4, duration: 120, onComplete: () => l.img.destroy() });
        burla(scene, api, '¡ÑAM! ERA UN CORAZÓN MORDEDOR', 1100);
        api.killgesi(scene);
    },
    muertoFalso(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x + 60) return;
        l.hecha = true;
        l.tic.remove();
        scene.tweens.add({ targets: l.img, angle: -20, alpha: 0, duration: 250, onComplete: () => l.img.destroy() });
        api.crearEnemigo(scene, l.x - 20, SUELO_Y - 2, 'esqueleto');
        burla(scene, api, '¡NO ESTABA MUERTO!', 1000);
    },
    noMirarArriba(scene, l, api, { gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 40) return;
        l.hecha = true;
        scene.tweens.add({ targets: l.img, x: '+=3', yoyo: true, repeat: 4, duration: 50 });
        scene.time.delayedCall(450, () => scene.tweens.add({ targets: l.img, y: SUELO_Y - 16, duration: 380, ease: 'Quad.in', onComplete: () => {
            scene.sound.play('romper');
            scene.cameras.main.shake(100, 0.004);
            const zona = new Phaser.Geom.Rectangle(l.x - 22, SUELO_Y - 60, 44, 60);
            if (choca(zona, rect(scene.mascotaGesi.body))) api.killgesi(scene);
            else api.mostrarMensaje(scene, '¿VES? NO HABÍA QUE MIRAR', 900);
        } }));
    },
    camaraAtras(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        scene.camaraQuietaHasta = scene.time.now + 1300; // (game.js: moverCamara no se mueve hasta entonces)
        burla(scene, api, '¿Y LA CÁMARA? 🙃', 900);
    },
    trollAsoma(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x) return;
        l.hecha = true;
        const cam = scene.cameras.main;
        const arriba = Math.random() < 0.5;
        const x = cam.width * (0.25 + Math.random() * 0.5);
        const cara = scene.add.text(x, arriba ? -40 : cam.height + 40, '👹', { fontSize: '44px' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(60);
        const risa = scene.add.text(x + 40, arriba ? 50 : cam.height - 60, 'JE JE JE', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#ff4d5e', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(60).setAlpha(0);
        scene.tweens.add({ targets: cara, y: arriba ? 26 : cam.height - 26, duration: 350, yoyo: true, hold: 1100, onComplete: () => cara.destroy() });
        scene.tweens.add({ targets: risa, alpha: 1, delay: 350, duration: 150, yoyo: true, hold: 800, onComplete: () => risa.destroy() });
        scene.sound.play('trampa', { volume: 0.3, rate: 0.8 });
    },
    monedaExplota(scene, l, api, { g, gx, gb }) {
        if (l.hecha || Math.abs(gx - l.x) > 18 || Math.abs(gb.center.y - 300) > 36) return;
        l.hecha = true;
        const boom = scene.add.circle(l.x, 300, 10, 0xffa040, 0.9).setDepth(PROF);
        scene.tweens.add({ targets: boom, scale: 5, alpha: 0, duration: 350, onComplete: () => boom.destroy() });
        l.img.destroy();
        scene.sound.play('romper');
        scene.cameras.main.shake(140, 0.006);
        g.setVelocity((g.flipX ? 1 : -1) * 320, -260);
        scene.empujadoHasta = scene.time.now + 300;
        api.mostrarMensaje(scene, '¡BOOM! REGALO DEL TROLL', 900);
    },
};

// un yunque cae en x: primero su sombra en el suelo (la pista), después él
function caer(scene, api, x, deVerdad) {
    const sombra = scene.add.image(x, SUELO_Y - 2, 'tr_sombra').setDepth(PROF).setAlpha(0);
    scene.tweens.add({ targets: sombra, alpha: 1, duration: 420 });
    const y0 = scene.cameras.main.scrollY - 40;
    const img = scene.add.image(x, y0, deVerdad ? 'tr_yunque' : 'tr_carton').setOrigin(0.5, 1).setDepth(PROF);
    scene.tweens.add({ targets: img, y: SUELO_Y, delay: 420, duration: 300, ease: 'Quad.in', onComplete: () => {
        sombra.destroy();
        if (!deVerdad) {
            scene.tweens.add({ targets: img, scaleY: 0.3, alpha: 0, duration: 260, onComplete: () => img.destroy() });
            scene.sound.play('bump', { volume: 0.3, rate: 1.4 });
            if (Math.abs(scene.mascotaGesi.body.center.x - x) < 40) api.mostrarMensaje(scene, '¡ERA DE CARTÓN!', 600);
            return;
        }
        scene.sound.play('romper');
        scene.cameras.main.shake(160, 0.007);
        const zona = new Phaser.Geom.Rectangle(x - 22, SUELO_Y - 60, 44, 60);
        if (choca(zona, rect(scene.mascotaGesi.body))) api.killgesi(scene);
        else api.mostrarMensaje(scene, 'ESE SÍ ERA DE VERDAD', 800);
        scene.tweens.add({ targets: img, alpha: 0, delay: 1200, duration: 400, onComplete: () => img.destroy() });
    } });
}
