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
    // se quita el cielo de día del paisaje: la parte de arriba se desvanece
    // para que las montañas se fundan con el cielo de noche (luna y estrellas)
    if (!scene.textures.exists('paisaje_noche')) {
        const fuente = scene.textures.get('paisaje').getSourceImage();
        const t = scene.textures.createCanvas('paisaje_noche', fuente.width, fuente.height);
        const ctx = t.getContext();
        ctx.drawImage(fuente, 0, 0);
        ctx.globalCompositeOperation = 'destination-in';
        const m = ctx.createLinearGradient(0, 0, 0, fuente.height);
        m.addColorStop(0, 'rgba(0,0,0,0)');
        m.addColorStop(0.2, 'rgba(0,0,0,0)');
        m.addColorStop(0.42, 'rgba(0,0,0,1)');
        m.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = m;
        ctx.fillRect(0, 0, fuente.width, fuente.height);
        t.refresh();
    }
    const escala = 0.7 * 1024 / 1920, ancho = 1920 * escala, factor = 0.15; // imagen en alta resolución
    const cuantos = Math.ceil((nivel.ancho * factor + 790) / ancho) + 1;
    for (let i = 0; i < cuantos; i++) {
        scene.add.image(i * ancho, 215, 'paisaje_noche').setOrigin(0, 0.5).setScale(escala)
            .setScrollFactor(factor).setTint(tinte);
    }
}

// ruinas de castillo al fondo (torres y murallas rotas), con efecto de profundidad.
// factor: cuánto se mueven con la cámara (más bajo = más lejos); escala: [mínima, máxima]
export function crearRuinas(scene, nivel, indice, tinte, { factor = 0.55, escala = [0.55, 0.9], semilla = 0, paso = [260, 560], base = 12, alpha = 0.9 } = {}) {
    const estilo = ESTILO_RUINAS[indice % ESTILO_RUINAS.length];
    let s = 1234 + indice * 977 + semilla * 7919;
    const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const hasta = nivel.ancho * factor + 800;
    for (let x = 80 + azar() * 200; x < hasta; x += paso[0] + azar() * (paso[1] - paso[0])) {
        const esTorre = azar() < 0.55;
        const lista = esTorre ? TORRES : MUROS;
        const n = lista[Math.floor(azar() * lista.length)];
        scene.add.image(x, SUELO_Y + base, `${esTorre ? 'torre' : 'muro'}_${estilo}_${n}`)
            .setOrigin(0.5, 1).setScale((escala[0] + azar() * (escala[1] - escala[0])) / 2).setScrollFactor(factor) // imágenes al doble
            .setFlipX(azar() < 0.5).setTint(tinte).setAlpha(alpha);
    }
}

// castillo al final del nivel, detrás de la bandera
export function crearCastilloMeta(scene, x, indice, tinte) {
    const n = CASTILLO_META[indice % CASTILLO_META.length];
    return scene.add.image(x, SUELO_Y + 6, `castillo_${n}`).setOrigin(0, 1).setScale(220 / 520).setTint(tinte);
}
