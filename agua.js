// AGUA: zonas inundadas donde se BUCEA (tramos.js: tramoInundado). Hay que aguantar la respiración.
//
//   🏊 NADAR: bajo el agua te mueves más lento, caes despacio y con ↑ (o el botón de saltar) das una
//      brazada hacia arriba (se puede repetir). Asomando la cabeza a la superficie, ↑ te saca del agua.
//      Animación: corre despacio (patalea), se inclina hacia donde nada y suelta burbujitas.
//   🫧 AIRE: una barra sobre la cabeza. Baja mientras tienes la cabeza bajo el agua (nivel.aireMs: de 10 s
//      a 6 s en los niveles altos) y se llena al asomarte (superficie o bolsas de aire entre los techos) o
//      pasando por una COLUMNA DE BURBUJAS. Al 30 % parpadea en rojo. En 0: primero se rompe el escudo
//      (y te quedan unos segundos para buscar aire); si vuelve a 0, te ahogas.
//
// PELIGROS DEL AGUA (parte 2; tramoInundado los reparte según la dificultad):
//   🐟 PECES (piraña): nadan de un lado a otro; si te ven cerca, "!" y se lanzan contra ti
//   🪼 MEDUSAS: suben y bajan despacio; tocarlas da una descarga
//   🫧 BURBUJA TROLL: parece una columna de burbujas, pero es violeta: ¡PLOP!, te quita aire
//   ≋ CORRIENTES: empujan hacia un lado (se ven las líneas del agua)
//   🌿 ALGAS: en el fondo; entre ellas se nada más lento
//   ⛓ REJAS: cierran el paso hasta que tocas su PALANCA (está antes, en el fondo)
//   El daño de peces y medusas es como el de un enemigo: primero se rompe el escudo.
// Bajo el agua, los poderes de 💧 agua pegan más y los de 🔥 fuego menos (poderes.js).
// Un jefe puede INUNDAR su arena un rato (jefes.js: agregarAgua / quitarAgua).
//
// nivel.agua: [[x0, x1, superficie]] (el agua va de la superficie hasta el suelo)
// nivel.burbujas: [x, …] (columnas de burbujas que salen del suelo) · nivel.burbujasFalsas: [x, …]
// nivel.criaturas: [[x, 'pez' | 'medusa', y]] · nivel.corrientes: [[x0, x1, dir]] · nivel.algas: [x, …]
// nivel.rejas: [[x, dxPalanca]] (la palanca, dxPalanca px antes de la reja)
// api (la da game.js): { killgesi(scene, causa, origenX), mensaje(scene, texto, ms) }

import { SUELO_Y } from "./alcance.js"

const AIRE_MS = 10000;          // lo que dura el aire lleno (si el nivel no dice otra cosa)
const RECARGA_MS = 600;         // lo que tarda en llenarse respirando
const RECARGA_BURBUJAS_MS = 450;
const LENTO = 0.6;              // velocidad de lado bajo el agua
const HUNDE = 75;               // px/s máximos cayendo bajo el agua
const BRAZADA = 210;            // px/s hacia arriba con cada brazada
const ENTRE_BRAZADAS = 260;     // ms
const SALE = 0.85;              // salto para salir del agua (fracción del salto normal)
const ANCHO_BURBUJAS = 26;      // px a cada lado de una columna de burbujas
const AIRE_ESCUDO = 0.3;        // el aire que queda al romperse el escudo por ahogarse
const PEZ_VEL = 70, PEZ_LANZA = 280, PEZ_VE = 150; // px/s patrullando, px/s lanzándose, px a los que te ve
const MEDUSA_MS = 4200;         // lo que tarda una medusa en subir y bajar
const CORRIENTE = 95;           // px/s que empuja una corriente
const BURBUJA_TROLL = 0.25;     // el aire que te quita la burbuja troll

let api = null;
export const configurarAgua = a => { api = a; };

export function crearAgua(scene, nivel) {
    scene.aguas = [];
    scene.burbujasAgua = [];
    scene.aire = 1;
    scene.bajoAgua = false;
    scene.aireMs = nivel.aireMs || AIRE_MS;
    scene.criaturasAgua = [];
    scene.corrientesAgua = [];
    scene.algasAgua = [];
    scene.rejasAgua = [];
    if (!nivel.agua?.length) return;
    nivel.agua.forEach(([x0, x1, sup]) => agregarAgua(scene, x0, x1, sup));
    (nivel.burbujas || []).forEach(x => agregarBurbujas(scene, x));
    (nivel.burbujasFalsas || []).forEach(x => agregarBurbujas(scene, x, true));
    (nivel.criaturas || []).forEach(([x, tipo, y]) => crearCriatura(scene, x, tipo, y));
    (nivel.corrientes || []).forEach(([a, b, dir]) => {
        const agua = scene.aguas.find(q => a >= q.x0 - 1 && b <= q.x1 + 1);
        if (!agua) return;
        const lineas = scene.add.particles(0, 0, 'agua_linea', {
            x: dir > 0 ? a : b, y: { min: agua.sup + 20, max: SUELO_Y - 10 }, speedX: dir * 160, lifespan: (b - a) / 160 * 1000,
            alpha: { start: 0.5, end: 0 }, frequency: 120,
        }).setDepth(34.05);
        scene.corrientesAgua.push({ a, b, dir, agua, lineas });
    });
    (nivel.algas || []).forEach(x => {
        const algas = [0, 1, 2, 3].map(i => scene.add.image(x - 45 + i * 30, SUELO_Y + 4, 'agua_alga').setOrigin(0.5, 1).setDepth(33.7)
            .setScale(0.8 + (i % 2) * 0.35).setFlipX(i % 2 === 1));
        algas.forEach((o, i) => scene.tweens.add({ targets: o, angle: { from: -8, to: 8 }, yoyo: true, repeat: -1, duration: 1100 + i * 170, ease: 'Sine.inOut' }));
        scene.algasAgua.push({ x, algas });
    });
    (nivel.rejas || []).forEach(([x, dx]) => crearReja(scene, x, x - dx));
}

// una zona de agua (también la usa un jefe para inundar su arena): devuelve la zona (con quitarAgua se va)
export function agregarAgua(scene, x0, x1, sup) {
    texturas(scene);
    scene.aguas ||= [];
    scene.barraAire ||= scene.add.graphics().setDepth(47);
    // el agua: azul transparente por delante (te ves sumergido) y la superficie que ondula
    const cuerpo = scene.add.rectangle(x0, sup, x1 - x0, SUELO_Y + 40 - sup, 0x2a7ab8, 0.38).setOrigin(0).setDepth(34);
    const fondo = scene.add.rectangle(x0, sup, x1 - x0, SUELO_Y + 40 - sup, 0x0a2a4a, 0.35).setOrigin(0).setDepth(1);
    const ola = scene.add.tileSprite(x0, sup - 4, x1 - x0, 10, 'agua_ola').setOrigin(0).setDepth(34.1);
    const zona = { x0, x1, sup, cuerpo, fondo, ola };
    scene.aguas.push(zona);
    return zona;
}
// mueve la superficie de una zona (el jefe sube y baja el agua)
export function nivelDeAgua(zona, sup) {
    zona.sup = sup;
    const alto = SUELO_Y + 40 - sup;
    zona.cuerpo.setPosition(zona.x0, sup).setSize(zona.x1 - zona.x0, alto);
    zona.fondo.setPosition(zona.x0, sup).setSize(zona.x1 - zona.x0, alto);
    zona.ola.setPosition(zona.x0, sup - 4);
}
export function quitarAgua(scene, zona) {
    scene.aguas = (scene.aguas || []).filter(a => a !== zona);
    scene.burbujasAgua = (scene.burbujasAgua || []).filter(c => {
        if (c.agua !== zona) return true;
        c.brillo.destroy(); c.parts.destroy();
        return false;
    });
    [zona.cuerpo, zona.fondo, zona.ola].forEach(o => o.destroy());
    if (!scene.aguas.length) { scene.bajoAgua = false; scene.aire = 1; scene.barraAire?.clear(); scene.mascotaGesi?.setAngle(0); }
}

// columna de burbujas: brilla y suben burbujas sin parar (la falsa, la burbuja troll, es violeta)
export function agregarBurbujas(scene, x, falsa = false) {
    scene.burbujasAgua ||= [];
    const agua = scene.aguas.find(a => x > a.x0 && x < a.x1);
    if (!agua) return null;
    const color = falsa ? 0xd08aff : 0x9fe8ff;
    const brillo = scene.add.image(x, (agua.sup + SUELO_Y) / 2, 'brillo').setDepth(33.8).setScale(1.2, 3.4).setTint(color).setAlpha(0.35).setBlendMode('ADD');
    const parts = scene.add.particles(0, 0, 'agua_burbuja', {
        x: { min: x - 12, max: x + 12 }, y: SUELO_Y - 4, speedY: { min: -120, max: -70 }, speedX: { min: -8, max: 8 },
        lifespan: { min: 1600, max: 2400 }, scale: { min: 0.4, max: 1 }, alpha: { start: 0.9, end: 0.3 }, frequency: 90, tint: falsa ? 0xe0b0ff : 0xffffff,
        deathZone: { type: 'onEnter', source: new Phaser.Geom.Rectangle(x - 60, agua.sup - 200, 120, 200) },
    }).setDepth(33.9);
    const c = { x, agua, brillo, parts, falsa };
    scene.burbujasAgua.push(c);
    return c;
}

function crearCriatura(scene, x, tipo, y) {
    const agua = scene.aguas.find(a => x > a.x0 && x < a.x1);
    if (!agua) return;
    const yy = y ?? Math.round((agua.sup + SUELO_Y) / 2 + 20);
    const img = scene.add.image(x, yy, tipo === 'pez' ? 'agua_pez' : 'agua_medusa').setDepth(33.6);
    const c = { tipo, img, agua, x0: x, y0: yy, dir: 1, estado: 'nada', hasta: 0, fase: Math.random() * Math.PI * 2 };
    if (tipo === 'medusa') { img.setAlpha(0.85); scene.tweens.add({ targets: img, scaleX: 0.85, scaleY: 1.12, yoyo: true, repeat: -1, duration: 500 }); }
    scene.criaturasAgua.push(c);
}

// reja: corta el paso (física) hasta que se toca su palanca
function crearReja(scene, x, xPalanca) {
    const agua = scene.aguas.find(a => x > a.x0 && x < a.x1);
    if (!agua) return;
    const alto = SUELO_Y - agua.sup + 20;
    const img = scene.add.tileSprite(x - 8, agua.sup - 20, 16, alto, 'agua_reja').setOrigin(0).setDepth(33.5);
    const cuerpo = scene.add.zone(x, agua.sup - 20 + alto / 2, 16, alto);
    scene.physics.add.existing(cuerpo, true);
    const choque = scene.physics.add.collider(scene.mascotaGesi, cuerpo);
    const palanca = scene.add.text(xPalanca, SUELO_Y - 2, '🕹️', { fontSize: '18px' }).setOrigin(0.5, 1).setDepth(33.6);
    const marca = scene.add.text(xPalanca, SUELO_Y - 30, '!', { fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#ffe066', stroke: '#000', strokeThickness: 3 })
        .setOrigin(0.5, 1).setDepth(35);
    scene.tweens.add({ targets: marca, y: marca.y - 6, yoyo: true, repeat: -1, duration: 400 });
    scene.rejasAgua.push({ x, xPalanca, img, cuerpo, choque, palanca, marca, abierta: false });
}

function texturas(scene) {
    if (scene.textures.exists('agua_ola')) return;
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xbfe8ff, 0.7);
    for (let x = 0; x < 64; x += 2) g.fillRect(x, 4 + Math.round(Math.sin(x / 64 * Math.PI * 2) * 3), 2, 3);
    g.generateTexture('agua_ola', 64, 10);
    g.clear();
    g.lineStyle(1.5, 0xe0f8ff, 0.9).strokeCircle(5, 5, 4);
    g.fillStyle(0xffffff, 0.8).fillCircle(3.5, 3.5, 1.2);
    g.generateTexture('agua_burbuja', 10, 10);
    g.clear();
    // pez (piraña): cuerpo naranja, cola, ojo y dientes
    g.fillStyle(0xe8743a).fillEllipse(16, 10, 26, 16);
    g.fillStyle(0xc0502a).fillTriangle(2, 10, -6 + 6, 2, -6 + 6, 18);
    g.fillStyle(0xffffff).fillCircle(22, 7, 3);
    g.fillStyle(0x000000).fillCircle(23, 7, 1.5);
    g.fillStyle(0xffffff).fillTriangle(24, 12, 27, 12, 25.5, 15);
    g.generateTexture('agua_pez', 32, 20);
    g.clear();
    // medusa: campana violeta con tentáculos
    g.fillStyle(0xc77dff, 0.9).fillEllipse(14, 9, 26, 16);
    g.fillStyle(0xf0d0ff, 0.9).fillEllipse(14, 7, 14, 6);
    g.lineStyle(2, 0xc77dff, 0.8);
    [5, 10, 14, 18, 23].forEach((x, i) => g.lineBetween(x, 14, x + (i % 2 ? 2 : -2), 30));
    g.generateTexture('agua_medusa', 28, 32);
    g.clear();
    // línea de corriente
    g.fillStyle(0xe0f8ff, 0.7).fillRect(0, 0, 22, 2);
    g.generateTexture('agua_linea', 22, 2);
    g.clear();
    // alga
    g.fillStyle(0x3a8a4a).fillRect(4, 0, 4, 40);
    g.fillStyle(0x4fae5a).fillEllipse(2, 10, 8, 5).fillEllipse(10, 20, 8, 5).fillEllipse(2, 30, 8, 5);
    g.generateTexture('agua_alga', 12, 40);
    g.clear();
    // reja
    g.fillStyle(0x6e6a80).fillRect(2, 0, 3, 32).fillRect(11, 0, 3, 32).fillRect(0, 14, 16, 3);
    g.generateTexture('agua_reja', 16, 32);
    g.destroy();
}

// el agua donde está un punto (o null)
const aguaEn = (scene, x, y) => scene.aguas.find(a => x > a.x0 && x < a.x1 && y > a.sup && y < SUELO_Y + 40);

// cada fotograma, DESPUÉS de mover al personaje (game.js): devuelve true si está nadando (así game.js
// no hace su salto de siempre)
export function actualizarNado(scene, time, delta) {
    if (!scene.aguas?.length) return false;
    scene.aguas.forEach(a => { a.ola.tilePositionX += delta * 0.03; });
    moverCriaturas(scene, time, delta);
    const g = scene.mascotaGesi, b = g.body;
    if (!b || g.isDead) { scene.barraAire.clear(); return false; }
    const agua = aguaEn(scene, b.center.x, b.center.y);
    const antes = scene.bajoAgua;
    scene.bajoAgua = !!agua;
    if (scene.bajoAgua !== antes) chapuzon(scene, b.center.x, (agua || scene.ultimaAgua)?.sup ?? b.top, !!agua);
    if (agua) scene.ultimaAgua = agua;
    if (!agua) {
        // fuera del agua: respira y todo vuelve a la normalidad
        if (g.angle !== 0) g.setAngle(0);
        if (g.anims.timeScale !== 1) g.anims.timeScale = 1;
        respirar(scene, delta, RECARGA_MS);
        pintarAire(scene);
        return false;
    }
    // ---- nadando ----
    const arriba = scene.keys.up;
    // de lado, más lento (y más entre las algas); hacia abajo, despacio (flota)
    const enAlgas = scene.algasAgua.some(q => Math.abs(b.center.x - q.x) < 60 && b.bottom > SUELO_Y - 60);
    g.setVelocityX(b.velocity.x * LENTO * (enAlgas ? 0.55 : 1));
    // corrientes: empujan hacia un lado
    scene.corrientesAgua.forEach(c => { if (b.center.x > c.a && b.center.x < c.b && c.agua === agua) g.x += c.dir * CORRIENTE * delta / 1000; });
    // rejas: se abren tocando su palanca
    scene.rejasAgua.forEach(r => {
        if (r.abierta || Math.abs(b.center.x - r.xPalanca) > 26 || b.bottom < SUELO_Y - 50) return;
        r.abierta = true;
        r.choque.destroy();
        r.cuerpo.destroy();
        r.marca.destroy();
        r.palanca.setAngle(-30);
        scene.tweens.add({ targets: r.img, y: r.img.y - 160, alpha: 0.3, duration: 900, ease: 'Quad.out' });
        scene.sound.play('romper', { volume: 0.5, rate: 0.7 });
        api?.mensaje(scene, '⛓ ¡SE ABRIÓ LA REJA!', 900);
    });
    if (b.velocity.y > HUNDE) g.setVelocityY(HUNDE);
    const asomado = b.top < agua.sup + 6; // la cabeza afuera
    if (Phaser.Input.Keyboard.JustDown(arriba) && asomado) {
        // salir del agua de un salto
        g.setVelocityY(-scene.pj.salto * SALE);
        scene.sound.play('salto', { volume: 0.3, rate: 0.8 });
    } else if (arriba.isDown && time > (scene.proxBrazada || 0)) {
        scene.proxBrazada = time + ENTRE_BRAZADAS;
        g.setVelocityY(-BRAZADA);
        if (!asomado) scene.sound.play('salto', { volume: 0.12, rate: 0.6 });
    }
    // aire: con la cabeza bajo el agua se gasta; en una columna de burbujas o asomado, se llena
    const columna = scene.burbujasAgua.find(c => Math.abs(b.center.x - c.x) < ANCHO_BURBUJAS);
    // la burbuja troll: ¡PLOP! (una vez cada vez que entras)
    if (columna?.falsa) {
        if (scene.burbujaPisada !== columna) {
            scene.burbujaPisada = columna;
            scene.aire = Math.max(0.05, scene.aire - BURBUJA_TROLL);
            api?.mensaje(scene, '¡PLOP! ERA UNA BURBUJA TROLL 🙃', 1000);
            scene.sound.play('trampa', { volume: 0.4 });
            const p = scene.add.circle(columna.x, b.center.y, 10, 0xd08aff, 0.7).setDepth(35);
            scene.tweens.add({ targets: p, scale: 4, alpha: 0, duration: 350, onComplete: () => p.destroy() });
        }
    } else scene.burbujaPisada = null;
    const enBurbujas = columna && !columna.falsa;
    if (enBurbujas) { respirar(scene, delta, RECARGA_BURBUJAS_MS); if (b.velocity.y > -40) g.setVelocityY(b.velocity.y - 6); }
    else if (asomado) respirar(scene, delta, RECARGA_MS);
    else ahogarse(scene, delta);
    animarNado(scene, time);
    pintarAire(scene);
    return true;
}

function respirar(scene, delta, ms) {
    if (scene.aire >= 1) return;
    scene.aire = Math.min(1, scene.aire + delta / ms);
    if (scene.aire > 0.5) scene.avisoAire = false;
}

function ahogarse(scene, delta) {
    scene.aire = Math.max(0, scene.aire - delta / scene.aireMs);
    if (scene.aire < 0.3 && !scene.avisoAire) {
        scene.avisoAire = true;
        api?.mensaje(scene, '🫧 ¡SE ACABA EL AIRE!\n¡Busca burbujas o sube!', 1200);
        scene.sound.play('vacio', { volume: 0.5 });
    }
    if (scene.aire > 0) return;
    // sin aire: primero se rompe el escudo (y queda un poco de aire); si no hay escudo, se ahoga
    const g = scene.mascotaGesi;
    api?.killgesi(scene, 'ahogo');
    if (!g.isDead) {
        scene.aire = AIRE_ESCUDO;
        api?.mensaje(scene, '¡SIN AIRE! ¡SUBE YA!', 1000);
    }
}

// la animación de nadar: patalea despacio (la de correr, lenta), se inclina hacia donde va y suelta burbujitas
function animarNado(scene, time) {
    const g = scene.mascotaGesi, b = g.body;
    if (!scene.atacando) {
        const moviendo = Math.abs(b.velocity.x) > 20 || b.velocity.y < -40;
        g.anims.play(`${scene.pj.anim}-${moviendo ? 'run' : 'idle'}`, true);
        g.anims.timeScale = moviendo ? 0.55 : 0.6;
    }
    const meta = Math.abs(b.velocity.x) > 20 ? (b.velocity.x > 0 ? 9 : -9) : Math.sin(time / 500) * 3;
    g.setAngle(g.angle + (meta - g.angle) * 0.15);
    if (time > (scene.proxBurbujita || 0)) {
        scene.proxBurbujita = time + 500 + Math.random() * 500;
        const bx = b.center.x + (g.flipX ? -8 : 8), by = b.top + 10;
        const p = scene.add.image(bx, by, 'agua_burbuja').setDepth(34.2).setScale(0.6);
        scene.tweens.add({ targets: p, y: by - 60, x: bx + (Math.random() - 0.5) * 16, alpha: 0, scale: 1, duration: 1100, onComplete: () => p.destroy() });
    }
}

// peces y medusas: se mueven y, si te tocan, golpean como un enemigo
function moverCriaturas(scene, time, delta) {
    const g = scene.mascotaGesi, b = g.body;
    if (!b) return;
    const dt = delta / 1000;
    scene.criaturasAgua.forEach(c => {
        const a = c.agua, img = c.img;
        if (!img.active) return;
        if (c.tipo === 'medusa') {
            // sube y baja despacio entre la superficie y el fondo
            const k = (Math.sin(time / MEDUSA_MS * Math.PI * 2 + c.fase) + 1) / 2;
            img.y = a.sup + 50 + k * (SUELO_Y - 40 - a.sup - 50);
        } else {
            const dx = b.center.x - img.x, dy = b.center.y - img.y;
            if (c.estado === 'nada') {
                img.x += c.dir * PEZ_VEL * dt;
                if (Math.abs(img.x - c.x0) > 120) c.dir = Math.sign(c.x0 - img.x);
                img.y = c.y0 + Math.sin(time / 400 + c.fase) * 6;
                img.setFlipX(c.dir < 0);
                // te ve: avisa y se lanza
                if (scene.bajoAgua && Math.abs(dx) < PEZ_VE && Math.abs(dy) < 60 && time > c.hasta) {
                    c.estado = 'aviso';
                    c.hasta = time + 450;
                    c.dir = Math.sign(dx) || 1;
                    img.setFlipX(c.dir < 0);
                    const t = scene.add.text(img.x, img.y - 16, '!', { fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#ff5555', stroke: '#000', strokeThickness: 3 })
                        .setOrigin(0.5).setDepth(35);
                    scene.tweens.add({ targets: t, y: t.y - 8, alpha: 0, duration: 450, onComplete: () => t.destroy() });
                }
            } else if (c.estado === 'aviso') {
                if (time > c.hasta) { c.estado = 'lanza'; c.hasta = time + 650; }
            } else if (c.estado === 'lanza') {
                img.x += c.dir * PEZ_LANZA * dt;
                img.y += Math.sign(dy) * 40 * dt;
                if (time > c.hasta || img.x < a.x0 + 10 || img.x > a.x1 - 10) { c.estado = 'nada'; c.hasta = time + 1500; c.dir = Math.sign(c.x0 - img.x) || 1; }
            }
            img.y = Phaser.Math.Clamp(img.y, a.sup + 20, SUELO_Y - 12);
        }
        // ¿te tocó?
        if (!g.isDead && Math.abs(b.center.x - img.x) < 20 && Math.abs(b.center.y - img.y) < 30) {
            if (c.tipo === 'medusa' && time > (c.descarga || 0)) {
                c.descarga = time + 800;
                scene.cameras.main.flash(90, 200, 160, 255);
            }
            api?.killgesi(scene, undefined, img.x);
        }
    });
}

// al entrar o salir del agua: salpicadura
function chapuzon(scene, x, sup, entra) {
    for (let i = 0; i < 7; i++) {
        const gota = scene.add.circle(x, sup, 2 + Math.random() * 2, 0xbfe8ff, 0.9).setDepth(35);
        scene.tweens.add({ targets: gota, x: x + (Math.random() - 0.5) * 70, y: sup - 20 - Math.random() * 40, alpha: 0, duration: 450, ease: 'Quad.out', onComplete: () => gota.destroy() });
    }
    scene.sound.play('salto', { volume: 0.25, rate: entra ? 0.55 : 0.8 });
}

// la barra de aire sobre la cabeza (solo cuando falta aire)
function pintarAire(scene) {
    const gr = scene.barraAire;
    gr.clear();
    if (scene.aire >= 1) return;
    const g = scene.mascotaGesi, b = g.body;
    const x = b.center.x - 20, y = b.top - 16;
    const poco = scene.aire < 0.3;
    const parpadea = poco && Math.floor(scene.time.now / 200) % 2 === 0;
    gr.fillStyle(0x000000, 0.6).fillRoundedRect(x - 2, y - 2, 44, 8, 3);
    gr.fillStyle(parpadea ? 0xff4d5e : poco ? 0xff9a6a : 0x7fd8ff, 1).fillRoundedRect(x, y, 40 * scene.aire, 4, 2);
    // burbujitas de adorno a la izquierda
    gr.lineStyle(1, 0xe0f8ff, 0.9).strokeCircle(x - 7, y + 2, 3);
}
