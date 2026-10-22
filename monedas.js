export const monedas = (game, posiciones = []) => {

    game.coins = game.physics.add.staticGroup();
    posiciones.forEach(([x, y]) => {
        const m = game.coins.create(x, y, 'coins').anims.play('coins-giro', true).setScale(0.75).refreshBody();
        // (la carrera la reconoce por su lugar: es el mismo en todas las pantallas)
        m.clave = `${Math.round(x)},${Math.round(y)}`;
    });

 }
