export const monedas = (game) => {

    game.coins = game.physics.add.staticGroup();
    game.coins.create(280, 312, 'coins').anims.play('coins-giro', true).setScale(1.5);
    

 }