// Escudo del personaje: el primer golpe rompe el escudo en vez de quitar una vida.
// Efecto: CraftPix "Free Animated Explosion Sprite Pack" (Explosion_5, burbuja que se quiebra).
//
// - Cada vida empieza con escudo: se indica con un ícono junto a los corazones. La burbuja
//   alrededor del personaje solo se ve un momento (al aparecer, al recuperarlo y al romperse).
// - Al romperse: la burbuja estalla, la pantalla tiembla, empuja al personaje hacia atrás
//   y queda 1.5 s sin recibir daño (parpadeando) para no morir en el mismo instante.
// - Caer a la lava o a un hueco mata igual, aunque tenga escudo.

const INVULNERABLE_MS = 1500;
const FRAME_BURBUJA = 3; // frame de la animación donde la burbuja está entera

export function cargarEscudo(scene) {
    scene.load.spritesheet('fx_escudo', 'assets/efectos/escudo.png', { frameWidth: 256, frameHeight: 256 });
    scene.load.audio('escudo_roto', 'assets/sound/effects/powerdown.mp3');
}

export function crearAnimacionesEscudo(scene) {
    if (scene.anims.exists('escudo-roto')) return;
    scene.anims.create({
        key: 'escudo-roto',
        frames: scene.anims.generateFrameNumbers('fx_escudo', { start: FRAME_BURBUJA, end: 9 }),
        frameRate: 16,
    });
    scene.anims.create({
        key: 'escudo-aparece',
        frames: scene.anims.generateFrameNumbers('fx_escudo', { start: 0, end: FRAME_BURBUJA }),
        frameRate: 14,
    });
}

// anillo de energía: transparente en el centro (se ve el personaje) y brillante en el borde
function crearTexturaAura(scene) {
    if (scene.textures.exists('aura_escudo')) return;
    const t = scene.textures.createCanvas('aura_escudo', 128, 128);
    const ctx = t.getContext();
    const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
    gr.addColorStop(0, 'rgba(120,200,255,0)');
    gr.addColorStop(0.62, 'rgba(120,200,255,0.06)');
    gr.addColorStop(0.84, 'rgba(150,220,255,0.55)');
    gr.addColorStop(0.92, 'rgba(220,245,255,0.9)');
    gr.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 128, 128);
    t.refresh();
}

// anillo alrededor del personaje e ícono en el HUD
export function crearEscudo(scene) {
    scene.invulnerableHasta = 0;
    crearTexturaAura(scene);
    scene.auraEscudo = scene.add.image(0, 0, 'aura_escudo')
        .setScale(0.72, 0.82).setAlpha(0).setDepth(41);
    scene.iconoEscudo = scene.add.image(140, 24, 'fx_escudo', FRAME_BURBUJA)
        .setScale(0.16).setScrollFactor(0).setDepth(50);
    mostrarEscudo(scene, scene.tieneEscudo);
    if (scene.tieneEscudo) destellarAura(scene);
}

// la burbuja aparece un momento y se desvanece
function destellarAura(scene) {
    scene.tweens.killTweensOf(scene.auraEscudo);
    scene.auraEscudo.setVisible(true).setAlpha(0.8);
    scene.tweens.add({ targets: scene.auraEscudo, alpha: 0, delay: 500, duration: 900 });
}

function mostrarEscudo(scene, activo) {
    if (!activo) {
        scene.tweens.killTweensOf(scene.auraEscudo);
        scene.auraEscudo.setVisible(false);
    }
    if (activo) scene.iconoEscudo.clearTint().setAlpha(1);
    else scene.iconoEscudo.setTint(0x555555).setAlpha(0.45);
}

export function actualizarEscudo(scene) {
    const g = scene.mascotaGesi;
    if (!scene.auraEscudo) return;
    scene.auraEscudo.setPosition(g.body.center.x, g.body.center.y - 4);
    if (g.isDead) scene.auraEscudo.setVisible(false);
}

export function estaInvulnerable(scene) {
    return scene.time.now < (scene.invulnerableHasta || 0);
}

export function romperEscudo(scene, mostrarMensaje) {
    const g = scene.mascotaGesi;
    scene.tieneEscudo = false;
    scene.invulnerableHasta = scene.time.now + INVULNERABLE_MS;
    mostrarEscudo(scene, false);

    // la burbuja estalla en grietas azules
    const fx = scene.add.sprite(g.body.center.x, g.body.center.y - 4, 'fx_escudo')
        .setScale(0.6).setBlendMode('ADD').setDepth(45);
    fx.anims.play('escudo-roto');
    fx.once('animationcomplete', () => fx.destroy());
    const destello = scene.add.image(g.body.center.x, g.body.center.y, 'brillo')
        .setScale(2.6).setTint(0x8fd8ff).setAlpha(0.7).setBlendMode('ADD').setDepth(45);
    scene.tweens.add({ targets: destello, alpha: 0, scale: 3.6, duration: 450, onComplete: () => destello.destroy() });

    scene.sound.play('escudo_roto', { volume: 0.8 });
    scene.sound.play('romper', { volume: 0.5 });
    scene.cameras.main.shake(220, 0.008);

    // empujón hacia atrás y parpadeo mientras es invulnerable
    g.setVelocity(g.flipX ? 200 : -200, -240);
    g.setTintFill(0xffffff);
    scene.time.delayedCall(90, () => g.clearTint());
    scene.tweens.add({ targets: g, alpha: 0.25, yoyo: true, repeat: Math.floor(INVULNERABLE_MS / 180) - 1, duration: 90, onComplete: () => g.setAlpha(1) });

    // el ícono del HUD también se quiebra
    scene.tweens.add({ targets: scene.iconoEscudo, scale: 0.24, yoyo: true, duration: 140 });
    mostrarMensaje('¡ESCUDO ROTO!');
}

export function recuperarEscudo(scene, mostrarMensaje) {
    if (scene.tieneEscudo) return false;
    scene.tieneEscudo = true;
    mostrarEscudo(scene, true);
    destellarAura(scene);
    const g = scene.mascotaGesi;
    const fx = scene.add.sprite(g.body.center.x, g.body.center.y - 4, 'fx_escudo').setScale(0.42).setBlendMode('ADD').setDepth(45);
    fx.anims.play('escudo-aparece');
    fx.once('animationcomplete', () => fx.destroy());
    scene.tweens.add({ targets: scene.iconoEscudo, scale: 0.24, yoyo: true, duration: 160 });
    mostrarMensaje('¡ESCUDO RECUPERADO!');
    return true;
}
