// Escudo del personaje: el primer golpe rompe el escudo en vez de quitar una vida.
// Dibujo: un escudo de caballero en PIXEL ART hecho aquí mismo (crearTexturaEscudo: 16 x 18 px
// dibujados a escala 2, sin suavizar), con su brillo; al romperse salta en pedacitos cuadrados.
//
// - Cada vida empieza con escudo: se indica con un ícono junto a los corazones. La burbuja
//   alrededor del personaje solo se ve un momento (al aparecer, al recuperarlo y al romperse).
// - Al romperse: la burbuja estalla, la pantalla tiembla, empuja al personaje hacia atrás
//   y queda 1.5 s sin recibir daño (parpadeando) para no morir en el mismo instante.
// - Caer a la lava o a un hueco mata igual, aunque tenga escudo.
// - Se recarga solo al avanzar (AVANCE_RECARGA px) y con cargas de escudo que aparecen al azar.
//   Durante la pelea con el jefe no se recarga avanzando: solo con las cargas.

const INVULNERABLE_MS = 1500;
const EMPUJON_MS = 250; // el empujón al romperse no se puede anular con las flechas (igual que en game.js)
const AVANCE_RECARGA = 900; // px que hay que avanzar para que el escudo se recargue solo
const ESCALA_ICONO = 0.75; // el escudo de pixel art en el HUD (32 x 36 -> 24 x 27)

export function cargarEscudo(scene) {
    scene.load.audio('escudo_roto', 'assets/sound/aventura/escudo_roto.mp3');
}

export function crearAnimacionesEscudo(scene) {
    crearTexturaEscudo(scene);
}

// escudo de caballero en pixel art: borde oscuro, marco plateado, campo azul con brillo y una
// estrella dorada. Cada letra es un píxel (se dibuja a escala 2 y sin suavizar)
const PIXELES = [
    '..OOOOOOOOOOOO..',
    '.OPPPPPPPPPPPPO.',
    'OPSBBBBBBBBBBSPO',
    'OPBHHBBBBBBBBBPO',
    'OPBHBBBBGBBBBBPO',
    'OPBHBBBGGGBBBBPO',
    'OPBBBGGGGGGGBBPO',
    'OPBBBBGGGGGBBBPO',
    'OPBBBBGGBGGBBBPO',
    'OPBBBGGBBBGGBBPO',
    'OPBBBBBBBBBBBBPO',
    '.OPBBBBBBBBBBPO.',
    '.OPBBBBBBBBBBPO.',
    '..OPBBBBBBBBPO..',
    '...OPBBBBBBPO...',
    '....OPBBBBPO....',
    '.....OPPPPO.....',
    '......OOOO......',
];
const COLORES_PIXEL = { O: 0x14192e, P: 0xc9d3e6, S: 0x8a96b0, B: 0x3a7bd5, H: 0xbfe3ff, G: 0xffd27a };
function crearTexturaEscudo(scene) {
    if (scene.textures.exists('escudo_pixel')) return;
    const g = scene.make.graphics({ add: false });
    PIXELES.forEach((fila, y) => [...fila].forEach((c, x) => {
        if (COLORES_PIXEL[c] !== undefined) g.fillStyle(COLORES_PIXEL[c]).fillRect(x * 2, y * 2, 2, 2);
    }));
    g.generateTexture('escudo_pixel', 32, 36);
    g.destroy();
    scene.textures.get('escudo_pixel').setFilter(Phaser.Textures.FilterMode.NEAREST);
}

// pedacitos cuadrados del escudo que saltan (al romperse) o se juntan (al recuperarlo)
function pedacitos(scene, x, y, juntar) {
    const colores = [0x3a7bd5, 0xc9d3e6, 0xffd27a, 0xbfe3ff];
    for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2, lejos = 34 + (i % 3) * 8;
        const px = x + Math.cos(ang) * lejos, py = y + Math.sin(ang) * lejos;
        const p = scene.add.rectangle(juntar ? px : x, juntar ? py : y, 4, 4, colores[i % 4]).setDepth(45);
        scene.tweens.add({
            targets: p, x: juntar ? x : px, y: juntar ? y : py + 20, angle: 180, alpha: juntar ? 1 : 0,
            duration: juntar ? 280 : 550, ease: juntar ? 'Quad.easeIn' : 'Quad.easeOut', onComplete: () => p.destroy(),
        });
    }
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
    // barra de carga del escudo (debajo del ícono)
    // (hudCorrido: con más corazones de lo normal el escudo va más a la derecha)
    const x = 140 + (scene.hudCorrido || 0);
    scene.barraEscudoFondo = scene.add.rectangle(x, 42, 34, 6, 0x000000, 0.7).setStrokeStyle(1, 0x8fd8ff).setScrollFactor(0).setDepth(50);
    scene.barraEscudo = scene.add.rectangle(x - 16, 42, 32, 4, 0x5fd0ff).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    scene.textoEscudo = scene.add.text(x + 20, 36, '', { fontSize: '9px', color: '#9fe6ff', stroke: '#000', strokeThickness: 3 })
        .setScrollFactor(0).setDepth(51);
    crearTexturaEscudo(scene);
    scene.iconoEscudo = scene.add.image(x, 24, 'escudo_pixel')
        .setScale(ESCALA_ICONO).setScrollFactor(0).setDepth(50);
    mostrarEscudo(scene, scene.tieneEscudo);
    if (scene.tieneEscudo) destellarAura(scene);
}

// la burbuja aparece un momento y se desvanece
function destellarAura(scene) {
    scene.tweens.killTweensOf(scene.auraEscudo);
    scene.auraEscudo.setVisible(true).setAlpha(0.8);
    scene.tweens.add({ targets: scene.auraEscudo, alpha: 0, delay: 500, duration: 900 });
}

// barra: llena y azul con escudo; si está roto se va llenando en amarillo con el avance
function dibujarCarga(scene, progreso) {
    const lleno = scene.tieneEscudo;
    const p = lleno ? 1 : progreso;
    scene.barraEscudo.width = 32 * p;
    scene.barraEscudo.setFillStyle(lleno ? 0x5fd0ff : 0xffd27a);
    const texto = lleno ? '' : scene.peleaJefe ? 'busca cargas' : `${Math.floor(p * 100)}%`;
    if (scene.textoEscudo.text !== texto) scene.textoEscudo.setText(texto);
}

function mostrarEscudo(scene, activo) {
    if (!activo) {
        scene.tweens.killTweensOf(scene.auraEscudo);
        scene.auraEscudo.setVisible(false);
    }
    if (activo) scene.iconoEscudo.clearTint().setAlpha(1);
    else scene.iconoEscudo.setTint(0x555555).setAlpha(0.45);
}

export function actualizarEscudo(scene, mostrarMensaje) {
    const g = scene.mascotaGesi;
    if (!scene.auraEscudo) return;
    scene.auraEscudo.setPosition(g.body.center.x, g.body.center.y - 4);
    if (g.isDead) { scene.auraEscudo.setVisible(false); return; }
    if (scene.tieneEscudo || scene.peleaJefe) dibujarCarga(scene, 0);

    // recarga por avance: el ícono se va llenando a medida que avanzas
    if (!scene.tieneEscudo && !scene.peleaJefe) {
        if (scene.escudoRotoX == null) scene.escudoRotoX = g.x;
        // Leo (resistencia) lo recarga en menos distancia: ver recargaEscudo en personajes.js
        const progreso = Phaser.Math.Clamp((g.x - scene.escudoRotoX) / (scene.pj?.recargaEscudo ?? AVANCE_RECARGA), 0, 1);
        scene.iconoEscudo.setAlpha(0.3 + 0.6 * progreso);
        dibujarCarga(scene, progreso);
        if (progreso >= 1) {
            dibujarCarga(scene, 1);
            scene.escudoRotoX = null;
            recuperarEscudo(scene, mostrarMensaje, '¡ESCUDO RECARGADO!');
        }
    }
}

// carga de escudo para recoger (aparece al azar y durante la pelea con el jefe)
export function soltarEscudo(scene, x, y, dura = 9000) {
    crearTexturaEscudo(scene);
    const c = scene.premios.create(x, y, 'escudo_pixel').setScale(0.9).refreshBody();
    c.body.setSize(28, 28);
    c.tipoPremio = 'escudo';
    const brillo = scene.add.image(x, y, 'brillo').setDepth(41).setScale(0.9).setTint(0x8fd8ff).setAlpha(0.45).setBlendMode('ADD');
    scene.tweens.add({ targets: c, y: y - 6, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.inOut' });
    scene.sound.play('aparece', { volume: 0.4, rate: 1.2 });
    if (dura) {
        scene.time.delayedCall(dura - 3000, () => {
            if (c.active) scene.tweens.add({ targets: [c, brillo], alpha: 0.2, yoyo: true, repeat: 5, duration: 250 });
        });
        scene.time.delayedCall(dura, () => { if (c.active) c.destroy(); });
    }
    c.on('destroy', () => brillo.active && brillo.destroy());
    return c;
}

export function estaInvulnerable(scene) {
    return scene.time.now < (scene.invulnerableHasta || 0);
}

export function romperEscudo(scene, mostrarMensaje) {
    const g = scene.mascotaGesi;
    scene.tieneEscudo = false;
    scene.escudoRotoX = g.x; // desde aquí cuenta el avance para recargarlo
    scene.invulnerableHasta = scene.time.now + INVULNERABLE_MS;
    mostrarEscudo(scene, false);

    // el escudo salta en pedacitos
    const fx = scene.add.image(g.body.center.x, g.body.center.y - 4, 'escudo_pixel').setScale(1.2).setDepth(45);
    scene.tweens.add({ targets: fx, scale: 1.6, alpha: 0, angle: 20, duration: 300, onComplete: () => fx.destroy() });
    pedacitos(scene, g.body.center.x, g.body.center.y - 4, false);
    const destello = scene.add.image(g.body.center.x, g.body.center.y, 'brillo')
        .setScale(2.6).setTint(0x8fd8ff).setAlpha(0.7).setBlendMode('ADD').setDepth(45);
    scene.tweens.add({ targets: destello, alpha: 0, scale: 3.6, duration: 450, onComplete: () => destello.destroy() });

    scene.sound.play('escudo_roto', { volume: 0.8 });
    scene.sound.play('romper', { volume: 0.5 });
    scene.cameras.main.shake(220, 0.008);

    // empujón hacia atrás y parpadeo mientras es invulnerable
    g.setVelocity(g.flipX ? 200 : -200, -240);
    scene.empujadoHasta = scene.time.now + EMPUJON_MS;
    g.setTintFill(0xffffff);
    scene.time.delayedCall(90, () => g.clearTint());
    scene.tweens.add({ targets: g, alpha: 0.25, yoyo: true, repeat: Math.floor(INVULNERABLE_MS / 180) - 1, duration: 90, onComplete: () => g.setAlpha(1) });

    // el ícono del HUD también se quiebra
    scene.tweens.add({ targets: scene.iconoEscudo, scale: ESCALA_ICONO * 1.4, yoyo: true, duration: 140 });
    mostrarMensaje('¡ESCUDO ROTO!');
}

export function recuperarEscudo(scene, mostrarMensaje, texto = '¡ESCUDO RECUPERADO!') {
    if (scene.tieneEscudo) return false;
    scene.escudoRotoX = null;
    scene.tieneEscudo = true;
    mostrarEscudo(scene, true);
    destellarAura(scene);
    const g = scene.mascotaGesi;
    // los pedacitos se juntan y el escudo aparece un momento sobre el personaje
    pedacitos(scene, g.body.center.x, g.body.center.y - 4, true);
    const fx = scene.add.image(g.body.center.x, g.body.center.y - 4, 'escudo_pixel').setScale(0.4).setAlpha(0).setDepth(45);
    scene.tweens.add({ targets: fx, scale: 1.2, alpha: 1, delay: 260, duration: 200, ease: 'Back.out' });
    scene.tweens.add({ targets: fx, alpha: 0, y: fx.y - 16, delay: 900, duration: 400, onComplete: () => fx.destroy() });
    scene.tweens.add({ targets: scene.iconoEscudo, scale: ESCALA_ICONO * 1.4, yoyo: true, duration: 160 });
    scene.sound.play('punto_control', { volume: 0.5, rate: 1.3 });
    mostrarMensaje(texto);
    return true;
}
