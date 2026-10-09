export const monedas = (game, posiciones = []) => {

    game.coins = game.physics.add.staticGroup();
    posiciones.forEach(([x, y]) => {
        game.coins.create(x, y, 'coins').anims.play('coins-giro', true).setScale(0.75).refreshBody();
    });

 }
