export const createAnimations = (game) => {
    game.anims.create({ // crear animacion
        key: 'gesi-walk',
        frames: [
            { key: 'mascotaGesi', frame: 0 },
            { key: 'mascotaGesi', frame: 1 },
            { key: 'mascotaGesi', frame: 2 },
            { key: 'mascotaGesi', frame: 3 },
            { key: 'mascotaGesi', frame: 4 },
            { key: 'mascotaGesi', frame: 5 },
            { key: 'mascotaGesi', frame: 6 },
            
        ],
        frameRate: 13,
        repeat: -1
    })

    game.anims.create({
        key: 'gesi-idle',
        frames: [
            { key: 'mascotaGesiload', frame: 0 },
            { key: 'mascotaGesiload', frame: 1 },
            { key: 'mascotaGesiload', frame: 2 },
            { key: 'mascotaGesiload', frame: 3 },
            { key: 'mascotaGesiload', frame: 4 },
        ],
        frameRate: 8,
        repeat: -1
    })

    game.anims.create({
        key: 'gesi-salto',
        frames: [
            { key: 'saltar', frame: 0 },
            { key: 'saltar', frame: 1 },
            { key: 'saltar', frame: 2 },
        ],
        frameRate: 3,
        repeat: -1
    })

    game.anims.create({
        key: 'gesi-muerto',
        frames: [{
            key: 'mascotaGesi', frame: 0
        }]
    })

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
        frames: [
            { key: 'coins', frame: 0 },
            { key: 'coins', frame: 1 },
            { key: 'coins', frame: 2 },
            { key: 'coins', frame: 3 },

        ],
        frameRate: 8,
        repeat: -1
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