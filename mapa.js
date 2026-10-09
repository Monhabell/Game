// Mapa del mundo: aparece al pasar de nivel. El personaje camina por el camino
// desde el nivel que terminó hasta el siguiente y, al llegar, empieza ese nivel.
// Se puede saltar con ENTER o ESPACIO.

import { NIVELES } from "./niveles.js"
import { CASTILLO_META } from "./castillos.js"
import { crearNieblaSeleccion, moverNieblaSeleccion } from "./ambiente.js"

// posición de cada nivel en el mapa (el camino pasa por estos puntos)
const PUNTOS = [[80, 300], [205, 215], [345, 285], [485, 195], [620, 270], [720, 150]];
const DURACION_CAMINATA = 2600;

const estiloTexto = (tam, color = '#ffffff') => ({
    fontFamily: '"Press Start 2P", monospace', fontSize: tam, color, stroke: '#000000', strokeThickness: 4, align: 'center',
});

// data: { desde, hasta, personaje, vidas, maxVidas, score, zoom }
export function crearMapa(scene, data) {
    const { desde, hasta, personaje, vidas, maxVidas, score, zoom } = data;
    scene.cameras.main.setOrigin(0).setZoom(zoom);
    scene.cameras.main.fadeIn(400, 0, 0, 0);
    crearNieblaSeleccion(scene);
    scene.nieblaAlta.setDepth(1).setAlpha(0.2);

    scene.add.text(395, 26, 'MAPA DEL MUNDO', estiloTexto('16px', '#ffe9a8')).setOrigin(0.5).setDepth(10);

    // camino curvo que une los niveles
    const camino = new Phaser.Curves.Spline(PUNTOS.slice(0, NIVELES.length).map(([x, y]) => new Phaser.Math.Vector2(x, y)));
    const total = NIVELES.length - 1;
    const g = scene.add.graphics().setDepth(2);
    const largo = camino.getLength();
    for (let d = 0; d < largo; d += 12) {
        const t = camino.getTFromDistance ? camino.getTFromDistance(d) : d / largo;
        const p = camino.getPoint(t);
        const recorrido = t <= desde / total + 0.001;
        g.fillStyle(recorrido ? 0xffd27a : 0x8a7f6a, recorrido ? 0.95 : 0.55);
        g.fillCircle(p.x, p.y, recorrido ? 3 : 2.5);
    }

    // cada nivel: su castillo, número y nombre
    PUNTOS.slice(0, NIVELES.length).forEach(([x, y], i) => {
        const completado = i <= desde;
        const siguiente = i === hasta;
        if (siguiente) {
            const halo = scene.add.image(x, y - 22, 'brillo').setScale(1.6).setTint(0xffd27a).setAlpha(0.5).setBlendMode('ADD').setDepth(3);
            scene.tweens.add({ targets: halo, scale: 2.1, alpha: 0.2, yoyo: true, repeat: -1, duration: 700 });
        }
        const castillo = scene.add.image(x, y + 6, `castillo_${CASTILLO_META[i % CASTILLO_META.length]}`)
            .setOrigin(0.5, 1).setScale(0.13).setDepth(4);
        if (!completado && !siguiente) castillo.setTint(0x3a3f55);
        else if (completado) castillo.setTint(0xd8d0c0);
        scene.add.circle(x, y + 12, 9, completado ? 0xffd27a : siguiente ? 0xff9a40 : 0x3a3f55).setStrokeStyle(2, 0x000000).setDepth(5);
        scene.add.text(x, y + 12, String(i + 1), estiloTexto('8px')).setOrigin(0.5).setDepth(6);
        scene.add.text(x, y + 30, NIVELES[i].nombre, {
            fontFamily: 'monospace', fontSize: '10px', color: completado || siguiente ? '#ffe9a8' : '#8890a8',
            stroke: '#000', strokeThickness: 3, align: 'center', wordWrap: { width: 120 },
        }).setOrigin(0.5, 0).setDepth(6);
    });

    // HUD: vidas y puntaje
    for (let i = 0; i < maxVidas; i++) {
        const c = scene.add.image(28 + i * 26, 24, 'mz_corazon', 9).setScale(0.75).setDepth(10);
        if (i >= vidas) c.setTint(0x555555).setAlpha(0.5);
    }
    scene.add.text(20, 42, `Puntaje: ${score}`, { fontSize: '13px', color: '#ffffff', stroke: '#000', strokeThickness: 3 }).setDepth(10);
    scene.add.text(395, 362, 'ENTER o ESPACIO: saltar', { fontFamily: 'monospace', fontSize: '11px', color: '#9fe6ff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(10);

    // el personaje camina por el camino hasta el siguiente nivel
    const tIni = desde / total, tFin = hasta / total;
    const pIni = camino.getPoint(tIni);
    const caminante = scene.add.sprite(pIni.x, pIni.y + 6, `${personaje}-run`).setOrigin(0.5, 1).setScale(0.55).setDepth(8);
    caminante.anims.play(`${personaje}-run`);
    const sombra = scene.add.ellipse(pIni.x, pIni.y + 6, 26, 6, 0x000000, 0.45).setDepth(7);
    const estado = { t: tIni };
    scene.terminado = false;

    const empezar = () => {
        if (scene.terminado) return;
        scene.terminado = true;
        scene.cameras.main.fadeOut(350, 0, 0, 0);
        scene.time.delayedCall(360, () => scene.scene.start('juego'));
    };
    const llegar = () => {
        caminante.anims.play(`${personaje}-idle`);
        scene.sound.play('punto_control', { volume: 0.6 });
        const aviso = scene.add.text(395, 92, `NIVEL ${hasta + 1}\n${NIVELES[hasta].nombre}`, { ...estiloTexto('14px', '#ffe9a8'), lineSpacing: 8 })
            .setOrigin(0.5).setDepth(10).setScale(0.6).setAlpha(0);
        scene.tweens.add({ targets: aviso, scale: 1, alpha: 1, duration: 300, ease: 'Back.out' });
        scene.time.delayedCall(1300, empezar);
    };

    scene.tweens.add({
        targets: estado, t: tFin, delay: 500, duration: DURACION_CAMINATA, ease: 'Sine.inOut',
        onUpdate: () => {
            const p = camino.getPoint(estado.t);
            caminante.setFlipX(p.x < caminante.x - 0.01);
            caminante.setPosition(p.x, p.y + 6);
            sombra.setPosition(p.x, p.y + 6);
        },
        onComplete: llegar,
    });
    // pasos suaves mientras camina
    scene.time.addEvent({
        delay: 330, repeat: Math.floor(DURACION_CAMINATA / 330), startAt: -500,
        callback: () => !scene.terminado && scene.sound.play('golpe_enemigo', { volume: 0.12, rate: 2.2 }),
    });

    const teclas = scene.input.keyboard.addKeys({ enter: 'ENTER', espacio: 'SPACE' });
    scene.saltarMapa = () => {
        const JD = Phaser.Input.Keyboard.JustDown;
        if (JD(teclas.enter) || JD(teclas.espacio)) empezar();
    };
}

export function actualizarMapa(scene, time) {
    moverNieblaSeleccion(scene, time);
    scene.saltarMapa?.();
}
