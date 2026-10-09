// Ambiente oscuro de terror: oscuridad con luz alrededor del personaje,
// niebla que flota, niebla verdosa a ras del suelo y relámpagos.
//
// Cada nivel puede tener 'oscuridad' (0 = nada, 1 = negro total fuera de la luz).
// Si no la tiene, se oscurece un poco más en cada nivel.

const ANCHO = 790;
const ALTO = 380;

// mezcla un color con negro: factor 1 = igual, 0 = negro
export function oscurecer(color, factor) {
    const r = Math.round(((color >> 16) & 0xff) * factor);
    const g = Math.round(((color >> 8) & 0xff) * factor);
    const b = Math.round((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
}

function crearTexturasAmbiente(scene) {
    if (scene.textures.exists('niebla')) return;

    // niebla: manchas suaves que se repiten sin cortes de lado a lado
    const nw = 512, nh = 256;
    const niebla = scene.textures.createCanvas('niebla', nw, nh);
    const ctx = niebla.getContext();
    let semilla = 3;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) {
        const x = azar() * nw, y = azar() * nh, r = 30 + azar() * 70, a = 0.05 + azar() * 0.12;
        for (const dx of [-nw, 0, nw]) {
            const gr = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r);
            gr.addColorStop(0, `rgba(255,255,255,${a})`);
            gr.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gr;
            ctx.fillRect(x + dx - r, y - r, r * 2, r * 2);
        }
    }
    niebla.refresh();

    // niebla del suelo: la misma niebla pero desvaneciéndose hacia arriba (sin borde recto)
    const baja = scene.textures.createCanvas('niebla_baja', nw, 140);
    const c3 = baja.getContext();
    c3.drawImage(niebla.getSourceImage(), 0, 0, nw, 140);
    c3.drawImage(niebla.getSourceImage(), 0, 0, nw, 140); // más espesa
    c3.globalCompositeOperation = 'destination-in';
    const mascara = c3.createLinearGradient(0, 0, 0, 140);
    mascara.addColorStop(0, 'rgba(0,0,0,0)');
    mascara.addColorStop(0.55, 'rgba(0,0,0,0.8)');
    mascara.addColorStop(1, 'rgba(0,0,0,1)');
    c3.fillStyle = mascara;
    c3.fillRect(0, 0, nw, 140);
    baja.refresh();

    // oscuridad: negro con un agujero de luz en el centro (doble del tamaño de la pantalla)
    const ow = ANCHO * 2, oh = ALTO * 2;
    const oscuridad = scene.textures.createCanvas('oscuridad', ow, oh);
    const c2 = oscuridad.getContext();
    const gr = c2.createRadialGradient(ow / 2, oh / 2, 40, ow / 2, oh / 2, 430);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.25, 'rgba(0,0,0,0.05)');
    gr.addColorStop(0.6, 'rgba(0,0,0,0.65)');
    gr.addColorStop(1, 'rgba(0,0,0,1)');
    c2.fillStyle = gr;
    c2.fillRect(0, 0, ow, oh);
    oscuridad.refresh();
}

// fondo y nubes más oscuros
export function tinteOscuro(tinte, nivelIndice) {
    return oscurecer(tinte ?? 0xffffff, Math.max(0.35, 0.6 - nivelIndice * 0.04));
}

export function crearAmbiente(scene, nivel, nivelIndice) {
    crearTexturasAmbiente(scene);
    const oscuridad = nivel.oscuridad ?? Math.min(0.92, 0.62 + nivelIndice * 0.06);

    // niebla general (se mueve lento y un poco con la cámara)
    scene.nieblaAlta = scene.add.tileSprite(0, 0, ANCHO, ALTO, 'niebla')
        .setOrigin(0).setScrollFactor(0).setDepth(30).setAlpha(0.35).setTint(0xb8c0d0);

    // niebla verdosa a ras del suelo, más espesa
    scene.nieblaBaja = scene.add.tileSprite(0, ALTO - 140, ANCHO, 140, 'niebla_baja')
        .setOrigin(0).setScrollFactor(0).setDepth(31).setAlpha(0.75).setTint(0x9fc29a);

    // oscuridad con luz alrededor del personaje
    scene.oscuridad = scene.add.image(0, 0, 'oscuridad')
        .setScrollFactor(0).setDepth(40).setAlpha(oscuridad);

    // relámpagos en los niveles al aire libre
    if (nivel.nubes) {
        const relampago = () => {
            scene.cameras.main.flash(90, 200, 210, 255);
            scene.time.delayedCall(160, () => scene.cameras.main.flash(60, 160, 170, 220));
            scene.time.delayedCall(Phaser.Math.Between(7000, 15000), relampago);
        };
        scene.time.delayedCall(Phaser.Math.Between(4000, 9000), relampago);
    }
}

export function actualizarAmbiente(scene, time, objetivo) {
    if (!scene.oscuridad) return;
    const cam = scene.cameras.main;
    scene.nieblaAlta.tilePositionX = cam.scrollX * 0.5 + time * 0.012;
    scene.nieblaBaja.tilePositionX = cam.scrollX * 1.1 + time * 0.03;
    scene.nieblaBaja.y = ALTO - 140 + Math.sin(time / 1500) * 5; // sube y baja suavemente
    // la luz sigue al personaje (con un leve parpadeo, como una antorcha)
    const parpadeo = 1 + Math.sin(time / 90) * 0.012 + Math.sin(time / 37) * 0.008;
    scene.oscuridad.setPosition(objetivo.x - cam.scrollX, objetivo.y - cam.scrollY + 10).setScale(parpadeo);
}

// niebla para la pantalla de selección de personaje
export function crearNieblaSeleccion(scene) {
    crearTexturasAmbiente(scene);
    scene.nieblaAlta = scene.add.tileSprite(0, 0, ANCHO, ALTO, 'niebla').setOrigin(0).setAlpha(0.3).setTint(0xb8c0d0);
    scene.nieblaBaja = scene.add.tileSprite(0, ALTO - 140, ANCHO, 140, 'niebla_baja').setOrigin(0).setAlpha(0.7).setTint(0x9fc29a);
}

export function moverNieblaSeleccion(scene, time) {
    if (!scene.nieblaAlta) return;
    scene.nieblaAlta.tilePositionX = time * 0.015;
    scene.nieblaBaja.tilePositionX = time * 0.035;
}
