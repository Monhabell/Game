// Enemigos del juego.
// - esqueleto, planta y espiritu: CraftPix "Free Fantasy Enemies" (pixel art, frames 128x128)
// - zombies y aliens: CraftPix "Zombie" y "Alien" sprite packs, convertidos a tiras de 384x256
//   (el doble de detalle; se dibujan a escala 0.5)
//
// tipo de comportamiento:
//   'caminante'  camina y da la vuelta en las paredes
//   'espadachin' camina y ataca con la espada si Gesi está cerca
//   'planta'     disfrazada de arbusto; despierta y azota cuando te acercas (tiene espinas)
//   'volador'    flota, persigue y lanza bolas de fuego
//   'tirador'    camina y dispara con su pistola láser
// hojas: clave -> [archivo, frames, frameRate, repeat]
// cuerpo: [ancho, alto, offsetX, offsetY] del cuerpo de colisión dentro del frame (en píxeles de la imagen)
// escala: tamaño con que se dibuja (0.5 para las imágenes de doble resolución)
// soltar: frame del ataque en el que sale el golpe o el disparo

const zombie = (n, ataque) => ({
    carpeta: `assets/enemigos/zombie${n}`, ancho: 384, alto: 256, escala: 0.5,
    hojas: {
        walk: ['Walk', 6, 8, -1], dead: ['Dead', 8, 12, 0], hurt: ['Hurt', 5, 14, 0], attack: ['Attack', ataque, 12, 0],
    },
    cuerpo: [52, 140, 166, 112], vida: 1, vel: 0.8, tipo: 'caminante',
});

const alien = (color, extra = {}) => ({
    carpeta: `assets/enemigos/alien_${color}`, ancho: 384, alto: 256, escala: 0.5,
    hojas: {
        walk: ['Walk', 6, 10, -1], run: ['Run', 6, 14, -1], dead: ['Dead', 5, 10, 0], hurt: ['Hurt', 4, 12, 0],
        attack: ['Fire', color === 'armor' ? 10 : 11, 16, 0],
    },
    cuerpo: [52, 144, 166, 112], vida: 1, vel: 1, tipo: 'tirador', soltar: 6, cadencia: 2600, alcance: 330,
    ...extra,
});

export const ENEMIGOS = {
    zombie1: zombie(1, 6),
    zombie2: zombie(2, 6),
    zombie3: zombie(3, 5),
    esqueleto: {
        carpeta: 'assets/enemigos/esqueleto', ancho: 128,
        hojas: {
            walk: ['Walk', 8, 10, -1], dead: ['Dead', 3, 6, 0], hurt: ['Hurt', 3, 10, 0], attack: ['Attack_1', 7, 14, 0],
        },
        cuerpo: [24, 64, 52, 64], vida: 2, vel: 1, tipo: 'espadachin', soltar: 3, cadencia: 1300, alcance: 60,
    },
    planta: {
        carpeta: 'assets/enemigos/planta', ancho: 128,
        hojas: {
            disfraz: ['Disguise', 11, 6, -1], revelar: ['Attack_Disquise', 7, 12, 0], walk: ['Idle', 5, 8, -1],
            attack: ['Attack_1', 6, 12, 0], dead: ['Dead', 2, 4, 0], hurt: ['Hurt', 3, 10, 0],
        },
        cuerpo: [36, 50, 46, 78], vida: 2, vel: 0, tipo: 'planta', espinas: true, soltar: 3, cadencia: 1100, alcance: 70,
    },
    espiritu: {
        carpeta: 'assets/enemigos/espiritu', ancho: 128,
        hojas: {
            walk: ['Idle', 6, 10, -1], attack: ['Shot', 8, 14, 0], dead: ['Dead', 5, 10, 0], hurt: ['Hurt', 3, 10, 0],
        },
        cuerpo: [26, 28, 51, 54], vida: 1, vel: 0.6, tipo: 'volador', soltar: 6, cadencia: 2800, alcance: 450,
    },
    alien_green: alien('green'),
    alien_blue: alien('blue'),
    alien_gray: alien('gray'),
    alien_dark_gray: alien('dark_gray'),
    alien_red: alien('red', { cadencia: 1800 }),
    alien_armor: alien('armor', { vida: 3, vel: 0.7 }),
    alien_predator_mask: alien('predator_mask', { vida: 2, vel: 1.6, corre: true }),
};

// enemigos que pueden aparecer en un nivel: los de su mezcla, más los que usan las sorpresas
// (esqueleto, zombie3) y los que reparte el azar (planta, espíritu)
export function enemigosDelNivel(nivel) {
    return [...new Set([...(nivel.mezcla || ['zombie1', 'zombie2', 'zombie3']), 'zombie3', 'esqueleto', 'planta', 'espiritu'])];
}

// MEMORIA: cada zombi o alien HD ocupa ~17 MB en la tarjeta de video y entre todos pasan de 180 MB
// (demasiado para un celular de 4 GB). Por eso se cargan al entrar a cada nivel solo los que
// usa (tipos) y se sueltan los que ya no se usan. Lo que ya está cargado no se vuelve a cargar.
export function cargarEnemigos(scene, tipos) {
    Object.entries(ENEMIGOS).forEach(([id, def]) => {
        const usar = tipos.includes(id);
        Object.entries(def.hojas).forEach(([clave, [archivo]]) => {
            const key = `${id}-${clave}`;
            if (usar && !scene.textures.exists(key)) {
                scene.load.spritesheet(key, `${def.carpeta}/${archivo}.png`, { frameWidth: def.ancho, frameHeight: def.alto ?? 128 });
            } else if (!usar && scene.textures.exists(key)) {
                scene.anims.remove(key);
                scene.textures.remove(key);
            }
        });
    });
    // bola de fuego del espíritu
    if (!scene.textures.exists('bola_espiritu')) {
        scene.load.spritesheet('bola_espiritu', 'assets/enemigos/espiritu/Charge.png', { frameWidth: 64, frameHeight: 64 });
    }
}

// (solo los enemigos cargados; los que se cargan después reciben sus animaciones al llegar)
export function crearAnimacionesEnemigos(scene) {
    Object.entries(ENEMIGOS).forEach(([id, def]) => {
        Object.entries(def.hojas).forEach(([clave, [, frames, frameRate, repeat]]) => {
            const key = `${id}-${clave}`;
            if (!scene.textures.exists(key) || scene.anims.exists(key)) return;
            scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(key, { start: 0, end: frames - 1 }), frameRate, repeat });
        });
    });
    if (scene.anims.exists('bola_espiritu-giro') || !scene.textures.exists('bola_espiritu')) return;
    scene.anims.create({
        key: 'bola_espiritu-giro',
        frames: scene.anims.generateFrameNumbers('bola_espiritu', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
}
