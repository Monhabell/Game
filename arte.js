// Gráficos propios del juego, dibujados por código (no dependen de imágenes de otros juegos).
// Usan las mismas claves y tamaños que las imágenes que reemplazan, así la física no cambia.
//
//   'misterio' / 'misterio_cueva'  piedra rúnica (3 cuadros: la runa late)      16x16 x3
//   'vacio' / 'vacio_cueva'        piedra rúnica apagada (ya usada o invisible)  16x16
//   'mastil'                       columna del Faro del Alba (la meta)           16x167
//   'bandera'                      cristal del faro (se enciende al llegar)      16x16
//   'bola'                         bola de fuego que salta de la lava (4 cuadros) 8x8 x4
//   'cloud1'                       nube del fondo                                294x143
//   'suelo' / 'suelo_cueva'        cuerpo físico del suelo (no se ve: lo visten los tiles de roca) 128x32

// colores de cada ambiente: [piedra, luz de la piedra, sombra, runa encendida, brillo de la runa]
const PIEDRA = {
    '': ['#5a5470', '#8a82a6', '#2e2a3c', '#7fe8ff', 'rgba(127,232,255,'],
    '_cueva': ['#5a4040', '#8a6660', '#2e1e1e', '#ffb050', 'rgba(255,176,80,'],
};

function lienzo(scene, clave, w, h, dibujar) {
    const t = scene.textures.createCanvas(clave, w, h);
    dibujar(t.getContext(), t);
    t.refresh();
    return t;
}

const px = (ctx, color, x, y, w = 1, h = 1) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

// piedra con borde biselado (ox: desplazamiento del cuadro dentro de la hoja)
function piedra(ctx, ox, [base, luz, sombra]) {
    px(ctx, base, ox, 0, 16, 16);
    px(ctx, luz, ox, 0, 16, 1); px(ctx, luz, ox, 0, 1, 16);
    px(ctx, sombra, ox, 15, 16, 1); px(ctx, sombra, ox + 15, 0, 1, 16);
    px(ctx, sombra, ox + 3, 3, 10, 1); px(ctx, sombra, ox + 3, 3, 1, 10); // panel tallado
    px(ctx, luz, ox + 3, 12, 10, 1); px(ctx, luz, ox + 12, 3, 1, 10);
}

// runa en forma de rombo con un punto en el centro
const RUNA = [[8, 4], [9, 5], [10, 6], [11, 7], [10, 8], [9, 9], [8, 10], [7, 9], [6, 8], [5, 7], [6, 6], [7, 5]];
function runa(ctx, ox, color, brillo, intensidad) {
    if (brillo) RUNA.forEach(([x, y]) => px(ctx, `${brillo}${0.25 * intensidad})`, ox + x - 1, y - 1, 3, 3));
    RUNA.forEach(([x, y]) => px(ctx, color, ox + x, y));
    px(ctx, color, ox + 8, 7);
}

export function crearArteOriginal(scene) {
    if (scene.textures.exists('misterio')) return; // se crean una sola vez para todo el juego
    Object.entries(PIEDRA).forEach(([s, colores]) => {
        // piedra rúnica: la runa late en 3 intensidades
        const t = lienzo(scene, 'misterio' + s, 48, 16, ctx => {
            [0.5, 0.8, 1].forEach((k, i) => {
                piedra(ctx, i * 16, colores);
                ctx.globalAlpha = 0.55 + 0.45 * k;
                runa(ctx, i * 16, colores[3], colores[4], k);
                ctx.globalAlpha = 1;
            });
        });
        [0, 1, 2].forEach(i => t.add(i, 0, i * 16, 0, 16, 16));
        // apagada: la runa queda tallada en oscuro
        lienzo(scene, 'vacio' + s, 16, 16, ctx => { piedra(ctx, 0, colores); runa(ctx, 0, colores[2], null, 0); });
        // cuerpo físico del suelo (invisible en el juego)
        lienzo(scene, 'suelo' + s, 128, 32, ctx => px(ctx, colores[0], 0, 0, 128, 32));
    });

    // columna del Faro del Alba: capitel arriba, base abajo y juntas de piedra
    lienzo(scene, 'mastil', 16, 167, ctx => {
        px(ctx, '#6a6680', 3, 8, 10, 147);
        px(ctx, '#8e8aa6', 3, 8, 2, 147);
        px(ctx, '#45425a', 11, 8, 2, 147);
        for (let y = 26; y < 150; y += 20) px(ctx, '#45425a', 3, y, 10, 1);
        px(ctx, '#8e8aa6', 0, 0, 16, 3); px(ctx, '#6a6680', 1, 3, 14, 5); // capitel
        px(ctx, '#6a6680', 0, 155, 16, 12); px(ctx, '#8e8aa6', 0, 155, 16, 2); // base
    });

    // cristal del faro (apagado: azul pálido; al llegar a la meta se tiñe de oro y brilla)
    lienzo(scene, 'bandera', 16, 16, ctx => {
        const filas = [[7, 2], [6, 4], [5, 6], [4, 8], [3, 10], [3, 10], [4, 8], [5, 6], [6, 4], [7, 2]];
        filas.forEach(([x, w], i) => px(ctx, '#b8c8ff', x, i + 3, w, 1));
        filas.forEach(([x, w], i) => px(ctx, '#e8f0ff', x, i + 3, Math.max(1, w / 2 - 1), 1)); // cara iluminada
        px(ctx, '#ffffff', 6, 6, 1, 2);
        px(ctx, '#45425a', 4, 13, 8, 3); // soporte
    });

    // bola de fuego: núcleo amarillo y una llama que gira alrededor
    const t = lienzo(scene, 'bola', 32, 8, ctx => {
        const llama = [[6, 3], [3, 6], [1, 3], [3, 1]];
        llama.forEach(([lx, ly], i) => {
            const ox = i * 8;
            px(ctx, '#c2301a', ox + 2, 1, 4, 6); px(ctx, '#c2301a', ox + 1, 2, 6, 4);
            px(ctx, '#ff7a1f', ox + 2, 2, 4, 4);
            px(ctx, '#ffe27a', ox + 3, 3, 2, 2);
            px(ctx, '#ffb050', ox + lx, ly, 1, 1);
        });
    });
    [0, 1, 2, 3].forEach(i => t.add(i, 0, i * 8, 0, 8, 8));

    // nube del fondo: manchas suaves superpuestas (el juego la tiñe de oscuro)
    lienzo(scene, 'cloud1', 294, 143, ctx => {
        [[70, 90, 55], [130, 70, 65], [195, 80, 58], [240, 100, 40], [110, 105, 45], [170, 108, 48]].forEach(([x, y, r]) => {
            const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
            g.addColorStop(0, 'rgba(255,255,255,0.95)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        });
    });
}
