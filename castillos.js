// Castillos y ruinas (CraftPix "Free Castle 2D Game Assets").
// Estilos: 1 = piedra café, 2 = piedra gris oscura, 3 = arena.
// castillo_21..29: castillos completos (21-23 café, 24-26 arena, 27-29 gris; intacto, dañado, destruido)

import { SUELO_Y } from "./niveles.js"

const TORRES = [24, 25, 26, 27, 28, 29, 30, 31, 32];
const MUROS = [33, 34, 35, 36, 37, 38];

// castillo de la meta y estilo de las ruinas de cada nivel (se repite si hay más niveles)
const CASTILLO_META = [21, 24, 22, 27, 25, 28];
const ESTILO_RUINAS = [1, 3, 1, 2, 3, 2];

export function cargarCastillos(scene) {
    for (let n = 21; n <= 29; n++) scene.load.image(`castillo_${n}`, `assets/castillos/castillo_${n}.png`);
    for (const estilo of [1, 2, 3]) {
        TORRES.forEach(n => scene.load.image(`torre_${estilo}_${n}`, `assets/castillos/torre_${estilo}_${n}.png`));
        MUROS.forEach(n => scene.load.image(`muro_${estilo}_${n}`, `assets/castillos/muro_${estilo}_${n}.png`));
    }
    scene.load.image('paisaje', 'assets/castillos/paisaje.jpg');
}

// paisaje nocturno para los niveles al aire libre
export function crearPaisaje(scene, nivel, tinte) {
    const escala = 0.7, ancho = 1024 * escala, factor = 0.3;
    const cuantos = Math.ceil((nivel.ancho * factor + 790) / ancho) + 1;
    for (let i = 0; i < cuantos; i++) {
        scene.add.image(i * ancho, 190, 'paisaje').setOrigin(0, 0.5).setScale(escala)
            .setScrollFactor(factor).setTint(tinte);
    }
}

// ruinas de castillo al fondo (torres y murallas rotas), con efecto de profundidad
export function crearRuinas(scene, nivel, indice, tinte) {
    const estilo = ESTILO_RUINAS[indice % ESTILO_RUINAS.length];
    let semilla = 1234 + indice * 977;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    const factor = 0.55;
    const hasta = nivel.ancho * factor + 800;
    for (let x = 80; x < hasta; x += 260 + azar() * 300) {
        const esTorre = azar() < 0.55;
        const lista = esTorre ? TORRES : MUROS;
        const n = lista[Math.floor(azar() * lista.length)];
        scene.add.image(x, SUELO_Y + 12, `${esTorre ? 'torre' : 'muro'}_${estilo}_${n}`)
            .setOrigin(0.5, 1).setScale(0.55 + azar() * 0.35).setScrollFactor(factor)
            .setFlipX(azar() < 0.5).setTint(tinte).setAlpha(0.9);
    }
}

// castillo al final del nivel, detrás de la bandera
export function crearCastilloMeta(scene, x, indice, tinte) {
    const n = CASTILLO_META[indice % CASTILLO_META.length];
    return scene.add.image(x, SUELO_Y + 6, `castillo_${n}`).setOrigin(0, 1).setScale(220 / 260).setTint(tinte);
}
