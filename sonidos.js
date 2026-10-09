// Sonidos del juego.
// - assets/sound/effects y assets/sound/music: los que ya tenía el juego
// - assets/sound/generados: efectos creados para el juego (espada, arco, magia, rayo, láser,
//   trueno, rugido, pinchos, latigazo, viento, apagón, latido, trompeta triste, menú...)

const GEN = 'assets/sound/generados';

export function cargarSonidos(scene) {
    [
        'espada', 'arco', 'magia', 'rayo', 'laser', 'trueno', 'rugido', 'pinchos', 'latigo', 'golpe_enemigo',
        'viento', 'apagon', 'latido', 'trampa', 'menu_mover', 'menu_ok', 'vacio', 'game_over', 'emboscada',
    ].forEach(n => scene.load.audio(n, `${GEN}/${n}.wav`));
    scene.load.audio('salto', 'assets/sound/effects/jump.mp3');
    scene.load.audio('fuego', 'assets/sound/effects/fireball.mp3');
    scene.load.audio('punto_control', 'assets/sound/effects/consume-powerup.mp3');
}

// reproduce un sonido solo si lo que lo produce está cerca de la pantalla
export function sonarCerca(scene, clave, x, opciones = {}) {
    const izq = scene.cameras.main.scrollX;
    if (x > izq - 150 && x < izq + 790 + 150) scene.sound.play(clave, opciones);
}
