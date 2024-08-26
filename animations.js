export const createAnimations = (game) => {
    game.anims.create({ // crear animacion
        key: 'gesi-walk',
        frames: [
            { key: 'mascotaGesi', frame: 1 },
            { key: 'mascotaGesi', frame: 2 },
            { key: 'mascotaGesi', frame: 3 },
            { key: 'mascotaGesi', frame: 4 },
            { key: 'mascotaGesi', frame: 5 },
            { key: 'mascotaGesi', frame: 6 },
            { key: 'mascotaGesi', frame: 7 },
            { key: 'mascotaGesi', frame: 8 },
            { key: 'mascotaGesi', frame: 9 },
            { key: 'mascotaGesi', frame: 10 },
            { key: 'mascotaGesi', frame: 11 },
            
        ],
        frameRate: 25,
        repeat: -1
    })

    game.anims.create({
        key: 'gesi-idle',
        frames: [{
            key: 'mascotaGesi', frame: 0
        }]
    })

    game.anims.create({
        key: 'gesi-salto',
        frames: [{
            key: 'mascotaGesi', frame: 5
        }]
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
        ],
        frameRate: 15,
        repeat: -1
    })

    game.anims.create({
        key: 'enemy-muerte',
        frames: [
            { key: 'malo', frame: 2 },
        ],
        frameRate: 15,
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
}