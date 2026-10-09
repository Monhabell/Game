// Personajes que se pueden elegir (sprites de CraftPix "Free Fantasy Chibi Male Sprites").
// Todos los frames miden 128x128 y miran a la derecha.
//
// hojas: clave -> [archivo, cantidad de frames, frameRate, repeat]
// habilidades (teclas ESPACIO, X y C):
//   anim: hoja que se reproduce   soltar: frame en el que sale el ataque
//   tipo: 'proyectil' | 'golpe' | 'rayo' | 'embestida' | 'escudo'
//   costo: flechas o maná que gasta   enfriamiento: ms antes de poder repetirla

export const PERSONAJES = [
    {
        id: 'arquera',
        nombre: 'Gesi',
        titulo: 'La Arquera',
        color: 0xff4d6d,
        carpeta: 'assets/personajes/arquera',
        hojas: {
            idle: ['Idle', 6, 8, -1],
            run: ['Run', 8, 13, -1],
            jump: ['Jump', 9, 14, 0],
            dead: ['Dead', 3, 6, 0],
            shot1: ['Shot_1', 14, 32, 0],
            shot2: ['Shot_2', 13, 30, 0],
            atk1: ['Attack_1', 4, 14, 0],
        },
        velocidad: 1,
        salto: 520,
        dobleSalto: false,
        recurso: 'flechas',
        pasiva: 'Salta más alto',
        habilidades: {
            espacio: { nombre: 'Flecha', anim: 'shot1', soltar: 7, tipo: 'proyectil', textura: 'flecha_pj', vel: 560, vida: 1400, costo: 1, enfriamiento: 450 },
            x: { nombre: 'Flecha perforante', anim: 'shot2', soltar: 6, tipo: 'proyectil', textura: 'flecha_pj', vel: 720, vida: 1400, costo: 2, perfora: true, tinte: 0x66ddff, enfriamiento: 900 },
            c: { nombre: 'Golpe de arco', anim: 'atk1', soltar: 2, tipo: 'golpe', alcance: 55, enfriamiento: 350 },
        },
    },
    {
        id: 'espadachin',
        nombre: 'Leo',
        titulo: 'El Espadachín',
        color: 0xf2c14e,
        carpeta: 'assets/personajes/espadachin',
        hojas: {
            idle: ['Idle', 8, 8, -1],
            run: ['Run', 8, 14, -1],
            jump: ['Jump', 8, 13, 0],
            dead: ['Dead', 3, 6, 0],
            atk1: ['Attack_1', 6, 20, 0],
            atk2: ['Attack_2', 3, 12, 0],
            atk3: ['Attack_3', 4, 16, 0],
        },
        velocidad: 1.2,
        salto: 480,
        dobleSalto: false,
        recurso: 'ninguno',
        pasiva: 'Corre más rápido',
        habilidades: {
            espacio: { nombre: 'Espadazo', anim: 'atk1', soltar: 3, tipo: 'golpe', alcance: 65, enfriamiento: 300 },
            x: { nombre: 'Onda de espada', anim: 'atk2', soltar: 1, tipo: 'proyectil', textura: 'onda', escala: 2, vel: 450, vida: 600, perfora: true, enfriamiento: 1200 },
            c: { nombre: 'Embestida', anim: 'atk3', soltar: 0, tipo: 'embestida', duracion: 260, vel: 520, enfriamiento: 2000 },
        },
    },
    {
        id: 'mago',
        nombre: 'Zeno',
        titulo: 'El Mago',
        color: 0x9d7bff,
        carpeta: 'assets/personajes/mago',
        hojas: {
            idle: ['Idle', 6, 8, -1],
            run: ['Run', 8, 13, -1],
            jump: ['Jump', 11, 16, 0],
            dead: ['Dead', 4, 7, 0],
            atk1: ['Attack_1', 10, 26, 0],
            atk2: ['Attack_2', 4, 10, 0],
            atk3: ['Attack_3', 7, 18, 0],
        },
        velocidad: 1,
        salto: 480,
        dobleSalto: true,
        recurso: 'mana',
        pasiva: 'Doble salto',
        habilidades: {
            espacio: { nombre: 'Bola mágica', anim: 'atk1', soltar: 7, tipo: 'proyectil', textura: 'magia', animProyectil: 'magia-giro', escala: 1.2, vel: 400, vida: 1300, costo: 15, enfriamiento: 450 },
            x: { nombre: 'Rayo', anim: 'atk3', soltar: 4, tipo: 'rayo', alcance: 340, costo: 35, enfriamiento: 1000 },
            c: { nombre: 'Escudo mágico', anim: 'atk2', soltar: 1, tipo: 'escudo', duracion: 2000, costo: 40, enfriamiento: 5000 },
        },
    },
];

export const MANA_MAXIMO = 100;

export function cargarPersonajes(scene) {
    PERSONAJES.forEach(pj => {
        Object.entries(pj.hojas).forEach(([clave, [archivo]]) => {
            scene.load.spritesheet(`${pj.id}-${clave}`, `${pj.carpeta}/${archivo}.png`, { frameWidth: 128, frameHeight: 128 });
        });
    });
    scene.load.image('flecha_pj', 'assets/personajes/arquera/Arrow.png');
    scene.load.image('onda', 'assets/personajes/espadachin/Onda.png');
    scene.load.spritesheet('magia', 'assets/personajes/mago/Magia.png', { frameWidth: 32, frameHeight: 40 });
}

export function crearAnimacionesPersonajes(scene) {
    if (scene.anims.exists('magia-giro')) return;
    PERSONAJES.forEach(pj => {
        Object.entries(pj.hojas).forEach(([clave, [, frames, frameRate, repeat]]) => {
            const key = `${pj.id}-${clave}`;
            scene.anims.create({
                key,
                frames: scene.anims.generateFrameNumbers(key, { start: 0, end: frames - 1 }),
                frameRate,
                repeat
            });
        });
    });
    scene.anims.create({
        key: 'magia-giro',
        frames: scene.anims.generateFrameNumbers('magia', { start: 0, end: 1 }),
        frameRate: 10,
        repeat: -1
    });
}
