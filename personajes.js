// Personajes que se pueden elegir (sprites de CraftPix "Free Fantasy Chibi Male Sprites" y
// "Free Fantasy Chibi Female Sprites"). Todos los frames miden 128x128 y miran a la derecha.
//
// hojas: clave -> [archivo, cantidad de frames, frameRate, repeat]
// habilidades (teclas ESPACIO, X y C):
//   anim: hoja que se reproduce   soltar: frame en el que sale el ataque
//   tipo: 'proyectil' | 'golpe' | 'rayo' | 'embestida' | 'escudo' | 'voltereta'
//   costo: flechas o maná que gasta   enfriamiento: ms antes de poder repetirla
//   sonido: efecto al usarla (y rate: más agudo > 1, más grave < 1)
//
// Equilibrio: cada uno sobrevive de una forma distinta (ninguno es mejor en todo)
//   Gesi (EVASIÓN):     voltereta con invulnerabilidad corta; salta más alto; recoge flechas sola
//                       débil: poco daño de cerca y depende de las flechas
//   Leo  (RESISTENCIA): el espadazo PARA los golpes de frente si lo lanzas justo a tiempo;
//                       su escudo se recarga antes; corre más rápido
//                       débil: no ataca de lejos más allá de la onda y no tiene doble salto
//   Zeno (CONTROL):     doble salto, rayo largo y escudo mágico que absorbe UN golpe
//                       débil: todo cuesta maná y el escudo tarda en volver
//   Lira (HIELO):       congela enemigos (quietos y sin atacar) y su maná vuelve rápido
//                       débil: no hace daño extra y la ventisca es corta
//   Aria (FUERZA):      tajo de doble daño, torbellino a los dos lados, guardia sin costo
//                       débil: la más lenta, salta poco y no ataca de lejos
//   Rubí (AGILIDAD):    salta más alto que nadie, estocada larga, corte de viento y arremetida
//                       débil: no tiene ninguna defensa
//   Valeria (DEFENSA):  espada y escudo: espadazo, carga con el escudo y defensa mágica; algo lenta
//                       débil: salta poco y no ataca de lejos
//   Kira (VELOCIDAD):   dos dagas: cortes muy rápidos, cuchilla lanzada y un salto doble; la más veloz
//                       débil: alcance corto y ninguna defensa
//   Elara (DISTANCIA):  arquera élfica: flechas sin gastar nada, flecha triple perforante y voltereta
//                       débil: casi nada de daño de cerca
//   (Valeria, Kira y Elara: CraftPix "2D Fantasy Woman Warrior", en HD)
//
// res: resolución de las hojas (1 = cuadros de 128x128; 2 = HD, cuadros de 256x256 que el juego dibuja
//      a la mitad: así una ilustración grande se ve nítida). Todo lo que dibuja un héroe usa resDe()
//
// Propiedades extra: daño (golpe), ambosLados (golpe), congela (proyectil y rayo, en ms),
//                    color (rayo), regeneraMana (personaje, multiplica la recarga del maná)

export const PERSONAJES = [
    {
        id: 'arquera',
        nombre: 'Gesi',
        titulo: 'La Arquera',
        frase: 'Nunca falla un tiro... casi nunca.',
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
        regeneraFlechas: 3000, // recoge una flecha cada 3 s mientras tenga menos de 5
        pasiva: 'Salta alto · recoge flechas',
        habilidades: {
            espacio: { nombre: 'Flecha', anim: 'shot1', soltar: 7, tipo: 'proyectil', textura: 'flecha_pj', vel: 560, vida: 1400, costo: 1, enfriamiento: 450, sonido: 'arco' },
            x: { nombre: 'Flecha perforante', anim: 'shot2', soltar: 6, tipo: 'proyectil', textura: 'flecha_pj', vel: 720, vida: 1400, costo: 2, perfora: true, tinte: 0x66ddff, enfriamiento: 900, sonido: 'arco', rate: 0.8 },
            // voltereta: rueda hacia donde mira y durante 0,35 s atraviesa enemigos y disparos (no la lava)
            c: { nombre: 'Voltereta', anim: 'jump', soltar: 0, tipo: 'voltereta', duracion: 350, vel: 380, enfriamiento: 1600, sonido: 'salto', rate: 1.5 },
        },
    },
    {
        id: 'espadachin',
        nombre: 'Leo',
        titulo: 'El Espadachín',
        frase: 'Primero corre, después pregunta.',
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
        recargaEscudo: 600, // px que hay que avanzar para recargar el escudo (los demás: 900)
        pasiva: 'Corre rápido · aguanta más',
        habilidades: {
            // parada: durante los primeros 250 ms del espadazo, los golpes y disparos de frente se anulan
            espacio: { nombre: 'Espadazo / Parada', anim: 'atk1', soltar: 3, tipo: 'golpe', alcance: 65, parada: 250, enfriamiento: 300, sonido: 'espada' },
            x: { nombre: 'Onda de espada', anim: 'atk2', soltar: 1, tipo: 'proyectil', textura: 'onda', escala: 2, vel: 450, vida: 600, perfora: true, enfriamiento: 1200, sonido: 'espada', rate: 0.75 },
            c: { nombre: 'Embestida', anim: 'atk3', soltar: 0, tipo: 'embestida', duracion: 260, vel: 520, enfriamiento: 2000, sonido: 'espada', rate: 0.55 },
        },
    },
    {
        id: 'mago',
        nombre: 'Zeno',
        titulo: 'El Mago',
        frase: 'Sabe hechizos. No sabe ver trampas.',
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
            espacio: { nombre: 'Bola mágica', anim: 'atk1', soltar: 7, tipo: 'proyectil', textura: 'magia', animProyectil: 'magia-giro', escala: 1.2, vel: 400, vida: 1300, costo: 15, enfriamiento: 450, sonido: 'magia' },
            x: { nombre: 'Rayo', anim: 'atk3', soltar: 4, tipo: 'rayo', alcance: 340, costo: 35, enfriamiento: 1000, sonido: 'rayo' },
            // escudo mágico: absorbe UN golpe durante 1,5 s (antes: inmune a todo 2 s cada 5 s y dañaba al tocar)
            c: { nombre: 'Escudo mágico', anim: 'atk2', soltar: 1, tipo: 'escudo', duracion: 1500, costo: 40, enfriamiento: 7000, sonido: 'magia', rate: 0.7 },
        },
    },
    // ---------- "Free Fantasy Chibi Female Sprites" (mismo formato: 128x128, miran a la derecha) ----------
    {
        id: 'hechicera',
        nombre: 'Lira',
        titulo: 'La Hechicera',
        frase: 'El invierno llega cuando ella quiere.',
        color: 0x5fd0ff,
        carpeta: 'assets/personajes/hechicera',
        hojas: {
            idle: ['Idle', 5, 8, -1],
            run: ['Run', 8, 13, -1],
            jump: ['Jump', 8, 13, 0],
            dead: ['Dead', 5, 8, 0],
            atk1: ['Attack_1', 6, 16, 0],
            atk2: ['Attack_2', 3, 10, 0],
            atk4: ['Attack_4', 10, 24, 0],
        },
        velocidad: 1,
        salto: 500,
        dobleSalto: false,
        recurso: 'mana',
        regeneraMana: 1.6, // el maná vuelve 60% más rápido que el de Zeno
        pasiva: 'Congela · maná rápido',
        habilidades: {
            // congela: el enemigo queda quieto (y sin atacar) esos ms
            espacio: { nombre: 'Cristal de hielo', anim: 'atk4', soltar: 4, tipo: 'proyectil', textura: 'hielo', escala: 1.2, vel: 420, vida: 1300, costo: 12, congela: 1500, enfriamiento: 500, sonido: 'magia', rate: 1.3 },
            x: { nombre: 'Media luna helada', anim: 'atk1', soltar: 4, tipo: 'proyectil', textura: 'onda', escala: 2, tinte: 0x8fe9ff, vel: 480, vida: 650, perfora: true, costo: 20, enfriamiento: 1100, sonido: 'espada', rate: 1.2 },
            c: { nombre: 'Ventisca', anim: 'atk2', soltar: 1, tipo: 'rayo', alcance: 200, color: 0x9fe8ff, congela: 2500, costo: 40, enfriamiento: 5000, sonido: 'rayo', rate: 1.4 },
        },
    },
    {
        id: 'caballera',
        nombre: 'Aria',
        titulo: 'La Caballera',
        frase: 'Lenta, sí. Pero cuando pega, pega.',
        color: 0xc9d6e8,
        carpeta: 'assets/personajes/caballera',
        hojas: {
            idle: ['Idle', 6, 8, -1],
            run: ['Run', 7, 12, -1],
            jump: ['Jump', 6, 11, 0],
            dead: ['Dead', 4, 7, 0],
            atk1: ['Attack_1', 5, 16, 0],
            atk2: ['Attack_2', 2, 10, 0],
            atk3: ['Attack_3', 5, 16, 0],
        },
        velocidad: 0.95,
        salto: 470,
        dobleSalto: false,
        recurso: 'ninguno',
        recargaEscudo: 500, // el escudo se recarga antes que el de todos
        pasiva: 'Golpe doble · escudo rápido',
        habilidades: {
            espacio: { nombre: 'Tajo pesado', anim: 'atk1', soltar: 3, tipo: 'golpe', alcance: 70, daño: 2, enfriamiento: 550, sonido: 'espada', rate: 0.8 },
            // torbellino: golpea delante y detrás a la vez
            x: { nombre: 'Torbellino', anim: 'atk3', soltar: 3, tipo: 'golpe', alcance: 75, ambosLados: true, enfriamiento: 1400, sonido: 'espada', rate: 0.65 },
            // guardia: como el escudo mágico (absorbe UN golpe), sin costo pero tarda más en volver
            c: { nombre: 'Guardia', anim: 'atk2', soltar: 0, tipo: 'escudo', duracion: 2000, enfriamiento: 6500, sonido: 'espada', rate: 1.6 },
        },
    },
    {
        id: 'mosquetera',
        nombre: 'Rubí',
        titulo: 'La Mosquetera',
        frase: 'Un salto, una estocada, adiós.',
        color: 0xff6a3d,
        carpeta: 'assets/personajes/mosquetera',
        hojas: {
            idle: ['Idle', 5, 8, -1],
            run: ['Run', 8, 14, -1],
            jump: ['Jump', 7, 13, 0],
            dead: ['Dead', 4, 7, 0],
            atk2: ['Attack_2', 4, 14, 0],
            atk3: ['Attack_3', 6, 20, 0],
            atk4: ['Attack_4', 5, 16, 0],
        },
        velocidad: 1.1,
        salto: 540,
        dobleSalto: false,
        recurso: 'ninguno',
        pasiva: 'Salta alto · llega lejos',
        habilidades: {
            espacio: { nombre: 'Estocada', anim: 'atk3', soltar: 4, tipo: 'golpe', alcance: 90, enfriamiento: 300, sonido: 'espada', rate: 1.4 },
            x: { nombre: 'Corte de viento', anim: 'atk2', soltar: 2, tipo: 'proyectil', textura: 'onda', escala: 1.6, tinte: 0xffb08a, vel: 560, vida: 450, perfora: true, enfriamiento: 950, sonido: 'espada', rate: 1.2 },
            c: { nombre: 'Arremetida', anim: 'atk4', soltar: 0, tipo: 'embestida', duracion: 240, vel: 580, enfriamiento: 1700, sonido: 'espada', rate: 0.7 },
        },
    },
    {
        id: 'paladina',
        nombre: 'Valeria',
        titulo: 'La Paladina',
        frase: 'Su escudo ya paró a tres trolls. Hoy va por el cuarto.',
        color: 0xf2c94c,
        carpeta: 'assets/personajes/paladina',
        res: 2, // HD (CraftPix "2D Fantasy Woman Warrior")
        hojas: {
            idle: ['Idle', 8, 10, -1],
            walk: ['Walk', 8, 12, -1],
            run: ['Run', 8, 14, -1],
            jump: ['Jump', 8, 12, 0],
            hurt: ['Hurt', 6, 14, 0],
            dead: ['Dead', 8, 10, 0],
            atk1: ['Attack', 8, 18, 0],
        },
        velocidad: 0.98,
        salto: 485,
        dobleSalto: false,
        recurso: 'ninguno',
        pasiva: 'Espada y escudo',
        habilidades: {
            espacio: { nombre: 'Espadazo', anim: 'atk1', soltar: 4, tipo: 'golpe', alcance: 72, enfriamiento: 420, sonido: 'espada', rate: 1 },
            x: { nombre: 'Carga con escudo', anim: 'run', soltar: 0, tipo: 'embestida', duracion: 240, vel: 520, enfriamiento: 1900, sonido: 'espada', rate: 0.6 },
            c: { nombre: 'Defensa', anim: 'hurt', soltar: 0, tipo: 'escudo', duracion: 1800, enfriamiento: 6500, sonido: 'magia', rate: 0.8 },
        },
    },
    {
        id: 'asesina',
        nombre: 'Kira',
        titulo: 'La Asesina',
        frase: 'Dos dagas, cero paciencia.',
        color: 0xe0503a,
        carpeta: 'assets/personajes/asesina',
        res: 2, // HD
        hojas: {
            idle: ['Idle', 8, 10, -1],
            walk: ['Walk', 8, 12, -1],
            run: ['Run', 8, 14, -1],
            jump: ['Jump', 8, 12, 0],
            hurt: ['Hurt', 6, 14, 0],
            dead: ['Dead', 8, 10, 0],
            atk1: ['Attack', 8, 18, 0],
        },
        velocidad: 1.15,
        salto: 500,
        dobleSalto: true,
        recurso: 'ninguno',
        pasiva: 'La más rápida · doble salto',
        habilidades: {
            espacio: { nombre: 'Dagas', anim: 'atk1', soltar: 3, tipo: 'golpe', alcance: 60, enfriamiento: 260, sonido: 'espada', rate: 1.4 },
            x: { nombre: 'Cuchilla lanzada', anim: 'atk1', soltar: 3, tipo: 'proyectil', textura: 'onda', escala: 1.2, tinte: 0xff7a5a, vel: 600, vida: 420, enfriamiento: 900, sonido: 'espada', rate: 1.5 },
            c: { nombre: 'Arremetida', anim: 'run', soltar: 0, tipo: 'embestida', duracion: 220, vel: 600, enfriamiento: 1600, sonido: 'espada', rate: 0.8 },
        },
    },
    {
        id: 'elfa',
        nombre: 'Elara',
        titulo: 'La Elfa',
        frase: 'Nunca falla. Bueno, casi nunca.',
        color: 0x4fb3c8,
        carpeta: 'assets/personajes/elfa',
        res: 2, // HD
        hojas: {
            idle: ['Idle', 8, 10, -1],
            walk: ['Walk', 8, 12, -1],
            run: ['Run', 8, 14, -1],
            jump: ['Jump', 8, 12, 0],
            hurt: ['Hurt', 6, 14, 0],
            dead: ['Dead', 8, 10, 0],
            atk1: ['Attack', 8, 18, 0],
        },
        velocidad: 1,
        salto: 510,
        dobleSalto: false,
        recurso: 'ninguno',
        pasiva: 'Flechas infinitas',
        habilidades: {
            espacio: { nombre: 'Flecha', anim: 'atk1', soltar: 5, tipo: 'proyectil', textura: 'flecha_pj', vel: 560, vida: 1300, enfriamiento: 650, sonido: 'arco' },
            x: { nombre: 'Flecha élfica', anim: 'atk1', soltar: 5, tipo: 'proyectil', textura: 'flecha_pj', escala: 1.4, tinte: 0x7fffd4, vel: 760, vida: 1400, perfora: true, enfriamiento: 1300, sonido: 'arco', rate: 0.8 },
            c: { nombre: 'Voltereta', anim: 'jump', soltar: 0, tipo: 'voltereta', duracion: 350, vel: 380, enfriamiento: 1700, sonido: 'salto', rate: 1.5 },
        },
    },
];
// resolución de las hojas de un héroe (o de un prefijo de animación como "paladina~...")
export const resDe = pj => (typeof pj === 'string' ? PERSONAJES.find(p => p.id === pj.split('~')[0]) : pj)?.res || 1;
// prefijo de las animaciones de cada héroe ("arquera-run"...); con otros colores, el vestidor
// arma variantes con otro prefijo (vestidor.js)
PERSONAJES.forEach(pj => { pj.anim = pj.id; });

export const MANA_MAXIMO = 100;

export function cargarPersonajes(scene) {
    PERSONAJES.forEach(pj => {
        Object.entries(pj.hojas).forEach(([clave, [archivo]]) => {
            const t = 128 * resDe(pj); // (HD: cuadros de 256x256)
            scene.load.spritesheet(`${pj.id}-${clave}`, `${pj.carpeta}/${archivo}.png`, { frameWidth: t, frameHeight: t });
        });
    });
    scene.load.image('flecha_pj', 'assets/personajes/arquera/Arrow.png');
    scene.load.image('onda', 'assets/personajes/espadachin/Onda.png');
    scene.load.image('hielo', 'assets/personajes/hechicera/Hielo.png'); // recortado de su Attack_4
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
