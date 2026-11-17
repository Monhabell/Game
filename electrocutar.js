// Electrocutado (de caricatura): cuando un poder de RAYO le pega a un jugador (carrera.js).
//   1. un rayo cae del cielo en zigzag hasta él (con destello)
//   2. "rayos X": parpadea entre su silueta negra y un esqueleto blanco
//   3. queda tiznado (gris oscuro) con humito un rato, y aturdido (eso lo hace efectos.js)
// Se ve en todas las pantallas: en la del que lo recibe sobre su personaje y en las demás sobre su
// muñeco (multijugador.js, evento 'rayoCae').
//
// objetivo: el sprite (el jugador de esta pantalla o el muñeco de otro jugador)
// centro(): dónde está el centro del cuerpo ahora (el objetivo se puede mover)

const ALTO = 66, ANCHO = 22;        // tamaño del cuerpo (como los de los personajes)
const PARPADEOS = 10, PARPADEO_MS = 80; // (~0,8 s de "rayos X": que se alcance a ver el esqueleto)
const TIZNADO_MS = 2200;

// ¿este poder es de rayo? (los de hielo no, aunque suenen a rayo: la ventisca)
export function esRayo(p) {
    if (!p || p.congela || p.efectoCarrera === 'congelar') return false;
    return p.tipo === 'rayo' || /rayo|chispa|voltaic|tormenta/.test(p.id || '');
}

export function electrocutar(scene, objetivo, centro, { propio = false } = {}) {
    if (!objetivo?.active || !scene?.add) return;
    const { x, y } = centro();
    // 1. el rayo: zigzag desde arriba de la vista hasta la cabeza
    const cam = scene.cameras.main, arriba = cam.worldView.y - 30, cabeza = y - ALTO / 2;
    const puntos = [];
    let px = x + Phaser.Math.Between(-60, 60);
    for (let py = arriba; py < cabeza; py += 26) {
        puntos.push([px, py]);
        px = Phaser.Math.Linear(px, x, 0.35) + Phaser.Math.Between(-18, 18);
    }
    puntos.push([x, cabeza]);
    const rayo = scene.add.graphics().setDepth(46).setBlendMode('ADD');
    const dibujar = (grueso, color, alfa) => {
        rayo.lineStyle(grueso, color, alfa);
        rayo.beginPath();
        rayo.moveTo(puntos[0][0], puntos[0][1]);
        puntos.slice(1).forEach(([a, b]) => rayo.lineTo(a, b));
        rayo.strokePath();
    };
    dibujar(9, 0xffe066, 0.35);
    dibujar(4, 0xfff6c0, 0.95);
    dibujar(1.5, 0xffffff, 1);
    scene.tweens.add({ targets: rayo, alpha: { from: 1, to: 0.2 }, yoyo: true, repeat: 2, duration: 60, onComplete: () => rayo.destroy() });
    const chispa = scene.add.circle(x, cabeza, 18, 0xfff6c0, 0.9).setDepth(46).setBlendMode('ADD');
    scene.tweens.add({ targets: chispa, scale: 2.6, alpha: 0, duration: 320, onComplete: () => chispa.destroy() });
    if (propio) cam.flash(140, 255, 250, 200);
    else if (scene.cache.audio.exists('rayo')) scene.sound.play('rayo', { volume: 0.35 });
    if (propio && scene.cache.audio.exists('rayo')) scene.sound.play('rayo', { volume: 0.6 });

    // 2. rayos X: silueta negra <-> esqueleto
    const huesos = esqueleto(scene).setDepth((objetivo.depth || 33) + 0.6).setVisible(false);
    objetivo.electrocutadoHasta = scene.time.now + PARPADEOS * PARPADEO_MS + TIZNADO_MS; // (multijugador.js no le pisa el color)
    let n = 0;
    const parpadeo = scene.time.addEvent({
        delay: PARPADEO_MS, repeat: PARPADEOS - 1, callback: () => {
            n++;
            const rx = n % 2 === 1;
            const c = centro();
            huesos.setPosition(c.x, c.y).setVisible(rx);
            if (objetivo.active) rx ? objetivo.setTintFill(0x101018) : objetivo.setTint(0xfff3a0);
            if (n >= PARPADEOS) {
                huesos.destroy();
                tiznar(scene, objetivo, centro);
            }
        },
    });
    objetivo.once?.('destroy', () => { parpadeo.remove(); huesos.destroy(); });
}

// 3. tiznado con humito; vuelve a su color de a poco
function tiznar(scene, objetivo, centro) {
    if (!objetivo.active) return;
    objetivo.setTint(0x3a3a3a);
    const color = { v: 0x3a };
    scene.tweens.add({
        targets: color, v: 0xff, delay: TIZNADO_MS * 0.55, duration: TIZNADO_MS * 0.45,
        onUpdate: () => { if (objetivo.active) { const c = Math.round(color.v); objetivo.setTint((c << 16) | (c << 8) | c); } },
        onComplete: () => { if (objetivo.active) objetivo.clearTint(); },
    });
    // humito y unas chispitas
    for (let i = 0; i < 6; i++) {
        scene.time.delayedCall(i * 160, () => {
            const c = centro();
            const humo = scene.add.circle(c.x + Phaser.Math.Between(-8, 8), c.y - ALTO / 2 + 4, Phaser.Math.Between(4, 7), 0x6b6b6b, 0.7).setDepth(45);
            scene.tweens.add({ targets: humo, y: humo.y - 34, x: humo.x + Phaser.Math.Between(-10, 10), scale: 2, alpha: 0, duration: 900, onComplete: () => humo.destroy() });
            if (i % 2 === 0) {
                const ch = scene.add.star(c.x + Phaser.Math.Between(-12, 12), c.y + Phaser.Math.Between(-20, 10), 4, 2, 5, 0xffe066).setDepth(45).setBlendMode('ADD');
                scene.tweens.add({ targets: ch, alpha: 0, scale: 0.3, angle: 90, duration: 260, onComplete: () => ch.destroy() });
            }
        });
    }
}

// el esqueleto de caricatura (centrado en el cuerpo)
function esqueleto(scene) {
    const g = scene.add.graphics();
    const t = -ALTO / 2, blanco = 0xf4f1e6;
    // cráneo con cuencas y dientes
    g.fillStyle(blanco, 1).fillCircle(0, t + 9, 8);
    g.fillStyle(0x101018, 1).fillCircle(-3, t + 8, 2.2).fillCircle(3, t + 8, 2.2);
    g.fillRect(-3, t + 13, 6, 1.5);
    g.lineStyle(2.5, blanco, 1);
    // columna
    g.lineBetween(0, t + 17, 0, t + 44);
    // costillas
    for (let i = 0; i < 4; i++) g.lineBetween(-ANCHO / 2 + 3, t + 21 + i * 5, ANCHO / 2 - 3, t + 21 + i * 5);
    // brazos (sueltos hacia arriba: ¡electrocutado!)
    g.lineBetween(-4, t + 20, -14, t + 10).lineBetween(-14, t + 10, -17, t);
    g.lineBetween(4, t + 20, 14, t + 10).lineBetween(14, t + 10, 17, t);
    // cadera y piernas
    g.lineBetween(-6, t + 45, 6, t + 45);
    g.lineBetween(-5, t + 45, -9, t + 64).lineBetween(5, t + 45, 9, t + 64);
    return g;
}
