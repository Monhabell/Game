// Señales de las trampas: como salen en un lugar distinto en cada intento, lo que el jugador
// aprende no es DÓNDE están sino CÓMO se reconocen. Hay dos familias:
//
// Trampas de REACCIÓN: avisan claro, porque lo que importa es tener tiempo de reaccionar
//   pinchos ocultos y rocas (game.js / sorpresas.js), enemigos que caen del cielo (su sombra)
//
// Trampas de ENGAÑO: su pista es SUTIL y aparece solo de vez en cuando ("premiar la paranoia"):
// quien mira con desconfianza la descubre y se siente un genio; quien corre confiado cae.
//   ladrillo que cae ('C')   un poco más cálido que los normales; a veces suelta un grano de polvo
//   "?" falso ('E')          a veces da un temblor de un píxel
//   bloque invisible ('H')   a veces un destello casi transparente en el aire
//   suelo falso              a veces se desprende una piedrita del borde
//   moneda trampa            gira apenas más lento
//   estatua falsa            de vez en cuando le brillan los ojos en rojo
//   cebo mímico              el cristal parpadea en rojo un instante
//   cebo de techo            a veces cae una piedrita del techo encima del cristal
//   (el cebo de suelo usa la pista del suelo falso)
//
// Las señales se dibujan por encima de la oscuridad (como el brillo de la lava).

const SUELO_Y = 332;
const CADA_MS = 1300;   // cada cuánto se revisan las trampas cercanas para dar señales
const DISTANCIA = 520;  // solo dan señales las que están cerca de la cámara
const PROB_PISTA = 0.25; // probabilidad de que una trampa de engaño dé su pista en cada revisión
const PROFUNDIDAD = 41; // por encima de la oscuridad (40)

const reducirMovimiento = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export function crearSenales(scene) {
    const quieto = reducirMovimiento();

    // ladrillos que caen: apenas más cálidos que los normales
    scene.cayentes.forEach(c => c.setTint(0xf2dcc6));

    // monedas trampa: giran apenas más lento
    scene.coins.getChildren().forEach(m => { if (m.trampa) m.anims.timeScale = 0.8; });

    // estatuas falsas: ojos rojos apagados (solo brillan de vez en cuando)
    (scene.estatuasFalsas || []).forEach(e => {
        e.ojos = scene.add.image(e.x, SUELO_Y - 48, 'brillo').setDepth(PROFUNDIDAD).setScale(0.3)
            .setTint(0xff3030).setAlpha(0).setBlendMode('ADD');
        e.estatua.once('destroy', () => e.ojos.destroy());
    });

    // cada cierto tiempo, algunas trampas cercanas dan su pista (nunca todas a la vez)
    scene.time.addEvent({
        delay: CADA_MS, loop: true, callback: () => {
            const g = scene.mascotaGesi;
            if (!g || g.isDead || scene.nivelTerminado) return;
            const pista = x => Math.abs(x - g.x) < DISTANCIA && Math.random() < PROB_PISTA;

            scene.cayentes.forEach(c => { if (!c.estado && pista(c.x)) granoDePolvo(scene, c.x + 16, c.body.bottom); });
            scene.floor.getChildren().forEach(b => {
                if (b.sueltaEnemigo && !b.usado && pista(b.x) && !quieto) {
                    scene.tweens.add({ targets: b, x: b.x + 1, yoyo: true, repeat: 1, duration: 40 });
                }
                if (b.esFalso && !b.cayendo && b.body && pista(b.x)) granoDePolvo(scene, b.body.left + 2, b.body.top + 4);
            });
            scene.invisibles.getChildren().forEach(b => { if (!b.revelado && pista(b.x)) destello(scene, b.x + 16, b.y); });
            (scene.estatuasFalsas || []).forEach(e => {
                if (!e.hecha && e.ojos?.active && pista(e.x)) scene.tweens.add({ targets: e.ojos, alpha: 0.5, yoyo: true, duration: 220 });
            });
            scene.premios.getChildren().forEach(p => {
                if (!p.active || !p.cebo || !pista(p.x)) return;
                if (p.cebo === 'mimico') { p.setTint(0xff6060); scene.time.delayedCall(120, () => p.active && p.clearTint()); }
                if (p.cebo === 'techo') piedrita(scene, p.x + Phaser.Math.Between(-6, 6));
            });
        },
    });
}

// un grano de polvo que cae (ladrillo agrietado, borde del suelo falso)
function granoDePolvo(scene, x, y) {
    const p = scene.add.rectangle(x + Phaser.Math.Between(-10, 10), y + 2, 2, 2, 0xd8c0a0).setDepth(PROFUNDIDAD).setAlpha(0.8);
    scene.tweens.add({ targets: p, y: y + 26, alpha: 0, duration: 650, ease: 'Quad.in', onComplete: () => p.destroy() });
}

// piedrita que cae del techo (cebo de techo)
function piedrita(scene, x) {
    const p = scene.add.rectangle(x, 4, 3, 3, 0x9a8f88).setDepth(PROFUNDIDAD);
    scene.tweens.add({ targets: p, y: SUELO_Y - 2, duration: 900, ease: 'Quad.in', onComplete: () => p.destroy() });
}

// destello casi transparente donde hay un bloque invisible
function destello(scene, x, y) {
    const d = scene.add.image(x + Phaser.Math.Between(-10, 10), y + Phaser.Math.Between(-10, 10), 'particula')
        .setDepth(PROFUNDIDAD).setScale(0.6).setAlpha(0).setBlendMode('ADD').setTint(0xcfe8ff);
    scene.tweens.add({ targets: d, alpha: 0.4, yoyo: true, duration: 300, onComplete: () => d.destroy() });
}

// sombra en el suelo donde va a caer algo (enemigo de una emboscada, de una moneda trampa...)
// (trampa de reacción: aviso claro)
export function sombraDeCaida(scene, x, duracion = 900) {
    const s = scene.add.ellipse(x, SUELO_Y - 1, 14, 5, 0x000000, 0.55).setDepth(36);
    const aviso = scene.add.image(x, SUELO_Y - 4, 'brillo').setDepth(PROFUNDIDAD).setScale(0.5, 0.18)
        .setTint(0xff6a4a).setAlpha(0.5).setBlendMode('ADD');
    scene.tweens.add({ targets: s, scaleX: 3, scaleY: 1.6, duration: duracion, ease: 'Quad.in' });
    scene.tweens.add({ targets: aviso, alpha: 0.15, yoyo: true, repeat: -1, duration: 160 });
    scene.time.delayedCall(duracion + 150, () => { s.destroy(); aviso.destroy(); });
}
