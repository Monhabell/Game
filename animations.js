export const createAnimations = (game) => {
    // las animaciones de los personajes jugables están en personajes.js

    // animaciones para enemigos

    game.anims.create({
        key: 'enemy-walk',
        frames: [
            { key: 'malo', frame: 0 },
            { key: 'malo', frame: 1 },
            { key: 'malo', frame: 2 },
            { key: 'malo', frame: 3 },
            { key: 'malo', frame: 4 },
            { key: 'malo', frame: 5 },
            { key: 'malo', frame: 6 },
        ],
        frameRate: 15,
        repeat: -1
    })

    game.anims.create({
        key: 'enemy-muerte',
        frames: [
            { key: 'maloDead', frame: 0 },
            { key: 'maloDead', frame: 1 },
            { key: 'maloDead', frame: 2 },
        ],
        frameRate: 10,
    })

    game.anims.create({
        key: 'coins-giro',
        frames: game.anims.generateFrameNumbers('coins', { start: 0, end: 9 }),
        frameRate: 14,
        repeat: -1,
        yoyo: true
    })


    game.anims.create({
        key: 'bola-giro',
        frames: game.anims.generateFrameNumbers('bola', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: -1
    })

    // bloques sorpresa
    const bloquesSorpresa = ['misterio', 'misterio_cueva'];
    bloquesSorpresa.forEach(key => {
        game.anims.create({
            key: `${key}-brillo`,
            frames: game.anims.generateFrameNumbers(key, { start: 0, end: 2 }),
            frameRate: 4,
            repeat: -1
        })
    })

    game.anims.create({
        key: 'lava_quema',
        frames: [
            { key: 'lava', frame: 0 },
            { key: 'lava', frame: 1 },
        ],
        frameRate: 3,
        repeat: -1
    })

    game.anims.create({
        key: 'lavacaer',
        frames: [
            { key: 'lava_falling', frame: 0},
            { key: 'lava_falling', frame: 1 },
        ],
        frameRate: 1,
        repeat: -1
    })

    game.anims.create({
        key: 'lavacaergota',
        frames: [
            { key: 'lava_falling', frame: 4},
            { key: 'lava_falling', frame: 4 },
        ],
        frameRate: 1,
        repeat: -1
    })

    game.anims.create({
        key: 'lavacaergotaSplash',
        frames: [
            { key: 'lava_falling', frame: 5},
            { key: 'lava_falling', frame: 6 },
            { key: 'lava_falling', frame: 7 },

        ],
        frameRate: 4,
        repeat: -1
    })
}