// Gráficos de mazmorra (CraftPix "Free Dungeon Platformer Pixel Art Tileset"):
// suelo de roca, lava, fondos de cueva en capas, antorchas, estalactitas, hongos,
// estatuas de punto de control, monedas, cristales y corazones.
//
// La física del suelo no cambia: los tiles de roca solo "visten" las piezas existentes.

const M = 'assets/mazmorra';
const SUELO_Y = 332;
const BORDE = 13; // el tile de roca tiene 13 px transparentes arriba
// profundidad del dibujo del piso y de la lava hacia abajo (la cámara muestra un poco bajo el piso:
// CAMARA_BAJA en game.js). Solo es dibujo: la física del suelo no cambia
const PROFUNDIDAD_SUELO = 160; // px de roca maciza bajo el borde del piso
const PROFUNDIDAD_LAVA = 200;  // px del fondo de la lava

export function cargarMazmorra(scene) {
    ['suelo_izq', 'suelo', 'suelo_der', 'relleno', 'plat_izq', 'plat', 'plat_der', 'bloque', 'escalon', 'plataforma',
        'lava_sup', 'lava_fondo', 'door', 'chest', 'marker_statue1', 'marker_statue2', 'marker_statue3', 'marker_statue4',
        'stalactite1', 'stalactite2', 'stalactite3', 'stalactite4', 'stalactite5',
        'stalagmite1', 'stalagmite2', 'stalagmite3', 'stalagmite4', 'stalagmite5',
        'stalagnate1', 'stalagnate2', 'stalagnate3',
        'mushrum1', 'mushrum2', 'mushrum3', 'mushrum4', 'mushrum5', 'mushrum6', 'mushrum7',
    ].forEach(n => scene.load.image(`mz_${n}`, `${M}/${n}.png`));
    ['bg', 'rock1', 'rock2', 'rock3', 'rock5', 'myst'].forEach(n => scene.load.image(`mz_fondo_${n}`, `${M}/fondo_${n}.png`));
    scene.load.spritesheet('mz_antorcha1', `${M}/antorcha1.png`, { frameWidth: 64, frameHeight: 64 });
    scene.load.spritesheet('mz_antorcha2', `${M}/antorcha2.png`, { frameWidth: 64, frameHeight: 64 });
    scene.load.spritesheet('mz_antorcha3', `${M}/antorcha3.png`, { frameWidth: 128, frameHeight: 128 });
    // las monedas usan la clave 'coins' que ya usaba el juego
    scene.load.spritesheet('coins', `${M}/moneda.png`, { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('mz_cristal', `${M}/cristal.png`, { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('mz_corazon', `${M}/corazon.png`, { frameWidth: 32, frameHeight: 32 });
}

export function crearAnimacionesMazmorra(scene) {
    if (scene.anims.exists('mz_antorcha1')) return;
    [1, 2, 3].forEach(k => scene.anims.create({
        key: `mz_antorcha${k}`, frames: scene.anims.generateFrameNumbers(`mz_antorcha${k}`, { start: 0, end: 3 }), frameRate: 8, repeat: -1,
    }));
    [['mz_cristal', 10], ['mz_corazon', 10]].forEach(([key, n]) => scene.anims.create({
        key, frames: scene.anims.generateFrameNumbers(key, { start: 0, end: n - 1 }), frameRate: 12, repeat: -1, yoyo: true,
    }));
}

// ---------- Suelo, plataformas y lava ----------

// viste una pieza de suelo (de la física) con roca; 'izq'/'der' agregan el borde
export function vestirSuelo(scene, pieza, { izq = false, der = false, flotante = false } = {}) {
    const b = pieza.getBounds();
    const tex = flotante ? 'mz_plat' : 'mz_suelo';
    // posiciones enteras y 1 px de solape para que no se vean rayas entre piezas
    const x0 = Math.floor(b.x), ancho = Math.ceil(b.right) - x0 + 1;
    // el piso (no las plataformas flotantes) sigue hacia abajo en roca maciza; va antes para quedar detrás del borde
    const relleno = flotante ? null : scene.add.tileSprite(x0, Math.round(b.y) - BORDE + 56, ancho, PROFUNDIDAD_SUELO, 'mz_relleno').setOrigin(0);
    if (relleno) relleno.tilePositionX = x0;
    const visual = scene.add.tileSprite(x0, Math.round(b.y) - BORDE, ancho, 64, tex).setOrigin(0);
    visual.tilePositionX = x0; // continuidad entre piezas vecinas
    const partes = relleno ? [relleno, visual] : [visual];
    if (izq) partes.push(scene.add.image(b.x - 11, b.y - BORDE, flotante ? 'mz_plat_izq' : 'mz_suelo_izq').setOrigin(0));
    if (der) partes.push(scene.add.image(b.x + b.width - 53, b.y - BORDE, flotante ? 'mz_plat_der' : 'mz_suelo_der').setOrigin(0));
    pieza.visuales = partes;
    pieza.setVisible(false);
    return partes;
}

// muro de roca maciza (usa el cuerpo de física para saber dónde está)
export function vestirMuro(scene, pieza) {
    const b = pieza.body;
    const relleno = scene.add.tileSprite(b.x, b.y + 40, b.width, b.height - 40, 'mz_relleno').setOrigin(0);
    const tope = scene.add.tileSprite(b.x, b.y - BORDE, b.width, 64, 'mz_suelo').setOrigin(0);
    pieza.visuales = [relleno, tope];
    pieza.setVisible(false);
}

// techo de túnel: roca maciza con el borde de roca por abajo (usa el cuerpo de física)
export function vestirTecho(scene, pieza) {
    const b = pieza.body;
    const relleno = scene.add.tileSprite(b.x, b.y, b.width, b.height - 30, 'mz_relleno').setOrigin(0).setTint(0xb0a8a0);
    const borde = scene.add.tileSprite(b.x, b.bottom - 64 + BORDE, b.width, 64, 'mz_suelo').setOrigin(0).setFlipY(true);
    pieza.visuales = [relleno, borde];
    pieza.setVisible(false);
}

// lava que fluye en los huecos
export function crearLava(scene, x0, x1) {
    scene.lavasFluyen = scene.lavasFluyen || [];
    const fondo = scene.add.tileSprite(x0, SUELO_Y + 20, x1 - x0, PROFUNDIDAD_LAVA, 'mz_lava_fondo').setOrigin(0);
    const sup = scene.add.tileSprite(x0, SUELO_Y - 14, x1 - x0, 64, 'mz_lava_sup').setOrigin(0);
    scene.lavasFluyen.push(sup, fondo);
}

export function moverLava(scene, time) {
    (scene.lavasFluyen || []).forEach((t, i) => { t.tilePositionX = time * (i % 2 ? 0.006 : 0.015); });
    (scene.chorrosLava || []).forEach(t => { t.tilePositionY = -time * 0.04; });
}

// ---------- Muros que bajan del techo ----------
// En los niveles con altura la cámara sube: lo que cuelga del techo (estalactitas, rocas, goteros)
// necesita un muro de roca que baje desde lo alto del nivel, o se ve flotando en el aire.
// Se dibujan en scene.capaTecho (creada en decorarNivel) para quedar detrás de todo lo jugable.

// muro de roca desde arriba del nivel hasta 'abajo', centrado en x; con punta, termina en pico
// (la punta solo se ve si lo que colgaba se cae)
export function colgarDelTecho(scene, x, abajo, ancho, factorX = 1, conPunta = true) {
    const arriba = -(scene.altoTecho || 0) - 300; // sobra arriba: con la cámara alejada se ve más alto
    const tinte = scene.tinteTecho ?? 0x6a5c54;
    const capa = scene.capaTecho || scene.add.layer();
    const muro = scene.add.tileSprite(x, arriba, ancho, abajo - arriba, 'mz_relleno').setOrigin(0.5, 0).setTint(tinte);
    muro.tilePositionX = x;
    // sombra en los bordes para que se vea redondo
    const sombraIzq = scene.add.rectangle(x - ancho / 2, arriba, 3, abajo - arriba, 0x000000, 0.35).setOrigin(0, 0);
    const sombraDer = scene.add.rectangle(x + ancho / 2, arriba, 3, abajo - arriba, 0x000000, 0.35).setOrigin(1, 0);
    const partes = [muro, sombraIzq, sombraDer];
    if (conPunta) partes.push(scene.add.triangle(x, abajo, 0, 0, ancho, 0, ancho / 2, ancho * 0.7, oscuro(tinte)).setOrigin(0.5, 0));
    partes.forEach(p => p.setScrollFactor(factorX, 1));
    capa.add(partes);
    return partes;
}

// dónde empieza de verdad la roca en una textura (las imágenes traen filas transparentes arriba
// y la roca no siempre está centrada): primera fila visible y el ancho de la roca un poco más abajo
const bordes = new Map();
function bordeSuperior(scene, key) {
    if (bordes.has(key)) return bordes.get(key);
    const src = scene.textures.get(key).getSourceImage();
    const w = src.width, h = src.height;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const datos = ctx.getImageData(0, 0, w, h).data;
    const opaco = (x, y) => datos[(y * w + x) * 4 + 3] > 128;
    let borde = { fila: 0, x0: 0, x1: w };
    for (let y = 0; y < h; y++) {
        let hay = false;
        for (let x = 0; x < w && !hay; x++) hay = opaco(x, y);
        if (!hay) continue;
        const fila = Math.min(h - 1, y + 4); // el ancho se mide un poco más abajo (la primera fila es muy fina)
        let x0 = w, x1 = 0;
        for (let x = 0; x < w; x++) if (opaco(x, fila)) { x0 = Math.min(x0, x); x1 = x + 1; }
        borde = { fila: y, x0, x1 };
        break;
    }
    bordes.set(key, borde);
    return borde;
}

// muro pegado justo encima de una imagen que cuelga (origen 0.5, 0): se mete unos px dentro de la roca
export function colgarSobre(scene, img, factorX = 1, conPunta = true) {
    const { fila, x0, x1 } = bordeSuperior(scene, img.texture.key);
    const s = img.scaleX, izq = img.x - img.displayWidth / 2;
    const ancho = Math.max(8, (x1 - x0) * s * 0.92);
    return colgarDelTecho(scene, izq + (x0 + x1) / 2 * s, img.y + (fila + 6) * s, ancho, factorX, conPunta);
}

// muro encima de una roca trampa (estalactita en la cueva, bloque afuera); al caer la roca el muro queda
export const colgarRoca = (scene, img) => colgarSobre(scene, img);

// gotero de lava: la lava baja por un muro y gotea donde el muro se acaba
// (x es la del sprite 'lava_falling' a escala 0.5: la mancha de lava queda en x + 32, desde y = -12)
export function crearMuroGotero(scene, x) {
    if (!scene.textures.exists('chorro_lava')) {
        const g = scene.make.graphics({ add: false });
        g.fillStyle(0xd9341b).fillRect(0, 0, 8, 24);
        g.fillStyle(0xff7a1a).fillRect(1, 0, 6, 24);
        g.fillStyle(0xffc23a).fillRect(3, 2, 2, 7).fillRect(2, 13, 2, 6);
        g.fillStyle(0xfff0a0).fillRect(3, 4, 1, 3);
        g.generateTexture('chorro_lava', 8, 24);
        g.destroy();
    }
    const cx = x + 32, abajo = -10;
    colgarDelTecho(scene, cx, abajo, 24);
    const arriba = -(scene.altoTecho || 0) - 300; // sobra arriba: con la cámara alejada se ve más alto
    const chorro = scene.add.tileSprite(cx, arriba, 8, abajo - arriba + 4, 'chorro_lava').setOrigin(0.5, 0);
    (scene.capaTecho || scene.add.layer()).add(chorro);
    scene.chorrosLava = scene.chorrosLava || [];
    scene.chorrosLava.push(chorro);
    // brillo de la lava a través de la oscuridad
    scene.add.image(cx, abajo - 10, 'brillo').setDepth(41).setScale(0.9).setTint(0xff7a1a).setAlpha(0.28).setBlendMode('ADD');
}

// ---------- Fondo de cueva en capas (parallax) ----------
export function crearFondoCueva(scene, tinte) {
    const escala = 380 / 540;
    scene.capasCueva = [
        ['mz_fondo_bg', 0.08, 1],
        ['mz_fondo_rock5', 0.18, 0.9],
        ['mz_fondo_rock3', 0.3, 0.95],
        ['mz_fondo_myst', 0.4, 0.6],
        ['mz_fondo_rock2', 0.5, 1],
        ['mz_fondo_rock1', 0.5, 1],
    ].map(([key, factor, alpha]) => {
        const capa = scene.add.tileSprite(0, 0, 790, 380, key).setOrigin(0).setScrollFactor(0)
            .setTileScale(escala).setTint(tinte).setAlpha(alpha);
        return { capa, factor: factor / escala, fy: factor, vel: key === 'mz_fondo_myst' ? 0.01 : 0 };
    });
}

// subida: cuánto subió la cámara (niveles con altura): las capas bajan según su profundidad
export function moverFondoCueva(scene, time, subida = 0) {
    if (!scene.capasCueva) return;
    const x = scene.cameras.main.scrollX;
    scene.capasCueva.forEach(({ capa, factor, fy, vel }) => {
        capa.tilePositionX = x * factor + time * vel;
        capa.y = subida * fy;
    });
}

// ---------- Decoración ----------

// antorcha en la pared con su luz (la luz se ve a través de la oscuridad)
export function crearAntorcha(scene, x, y, k = 2) {
    scene.add.sprite(x, y, `mz_antorcha${k}`).anims.play(`mz_antorcha${k}`).setScale(k === 3 ? 0.6 : 0.9);
    const luz = scene.add.image(x, y, 'brillo').setDepth(41).setScale(2.4).setTint(0xffa040).setAlpha(0.32).setBlendMode('ADD');
    scene.tweens.add({ targets: luz, alpha: 0.22, scale: 2.2, yoyo: true, repeat: -1, duration: 260 + Math.random() * 200, ease: 'Sine.inOut' });
}

// estalactitas, estalagmitas, hongos y antorchas a lo largo del nivel
// (se crea después del fondo y antes del suelo para quedar detrás de todo lo jugable)
export function decorarNivel(scene, nivel, indice, sobreSuelo) {
    let s = 99 + indice * 131;
    const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const cueva = !nivel.nubes;
    const tinte = cueva ? 0x8a7a70 : 0x6a7088;

    // capa para los muros que bajan del techo (ver colgarDelTecho): queda detrás de todo lo jugable
    scene.capaTecho = scene.add.layer();
    scene.altoTecho = nivel.alto || 0;
    scene.tinteTecho = oscuro(tinte);
    scene.chorrosLava = [];

    // estalactitas colgando del techo (solo en cuevas), cada una con su muro de roca encima
    if (cueva) {
        for (let x = 60; x < nivel.ancho; x += 120 + azar() * 260) {
            const img = scene.add.image(x, -10 - azar() * 20, `mz_stalactite${1 + Math.floor(azar() * 5)}`)
                .setOrigin(0.5, 0).setScale(0.8 + azar() * 0.6).setTint(tinte).setScrollFactor(0.95, 1);
            colgarSobre(scene, img, 0.95, false);
        }
    }

    // en el suelo: estalagmitas y hongos (los hongos brillan un poco)
    for (let x = 120; x < nivel.ancho; x += 90 + azar() * 220) {
        if (!sobreSuelo(x)) continue;
        if (azar() < 0.55) {
            const n = 1 + Math.floor(azar() * 7);
            scene.add.image(x, SUELO_Y + 2, `mz_mushrum${n}`).setOrigin(0.5, 1).setScale(0.5 + azar() * 0.35).setTint(0xd8c9a0);
            if (n >= 5) {
                scene.add.image(x, SUELO_Y - 14, 'brillo').setDepth(41).setScale(0.6).setTint(0xffd27a).setAlpha(0.18).setBlendMode('ADD');
            }
        } else {
            const lista = azar() < 0.7 ? 'stalagmite' : 'stalagnate';
            const n = 1 + Math.floor(azar() * (lista === 'stalagmite' ? 5 : 3));
            scene.add.image(x, SUELO_Y + 6, `mz_${lista}${n}`).setOrigin(0.5, 1).setScale(0.45 + azar() * 0.3)
                .setTint(oscuro(tinte));
        }
    }

    // antorchas en las paredes cada cierta distancia (sobre suelo firme)
    for (let x = 300; x < nivel.ancho - 200; x += cueva ? 520 + azar() * 260 : 800 + azar() * 400) {
        if (sobreSuelo(x)) crearAntorcha(scene, x, SUELO_Y - 105 - azar() * 30, cueva ? 2 : 1);
    }

    // puerta de la mazmorra al inicio del nivel
    scene.add.image(48, SUELO_Y + 4, 'mz_door').setOrigin(0.5, 1).setScale(1.2).setTint(0x9a8f88);
    crearAntorcha(scene, 120, SUELO_Y - 110, 1);
}

function oscuro(color) {
    const r = ((color >> 16) & 0xff) * 0.75, g = ((color >> 8) & 0xff) * 0.75, b = (color & 0xff) * 0.75;
    return (r << 16) | (g << 8) | b;
}

// ---------- Puntos de control: estatuas ----------
export function crearEstatua(scene, x, activa) {
    const estatua = scene.add.image(x, SUELO_Y + 2, activa ? 'mz_marker_statue2' : 'mz_marker_statue1').setOrigin(0.5, 1).setScale(1.1);
    const luz = scene.add.image(x, SUELO_Y - 50, 'brillo').setDepth(41).setScale(1.8).setTint(0xffe27a)
        .setAlpha(activa ? 0.35 : 0).setBlendMode('ADD');
    return { estatua, luz };
}

export function encenderEstatua(scene, cp) {
    cp.estatua.setTexture('mz_marker_statue2');
    scene.tweens.add({ targets: cp.estatua, scale: 1.35, yoyo: true, duration: 180 });
    scene.tweens.add({ targets: cp.luz, alpha: 0.35, duration: 300 });
}
