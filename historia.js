// Presentación del juego: pantalla de título, historia de introducción y final.
//
// La historia: el Rey Troll robó el Cristal del Alba y desde entonces la noche nunca
// termina en Monhabell (por eso todos los niveles son oscuros). Sus trolls llenaron el
// camino de trampas: carteles que mienten, monedas falsas, suelos que desaparecen...
//
// Todas las pantallas miden 790x380 "por dentro" (la cámara hace zoom, igual que el juego).

import { crearNieblaSeleccion, moverNieblaSeleccion } from "./ambiente.js"
import { PERSONAJES } from "./personajes.js"

const ANCHO = 790;
const ALTO = 380;
const CLAVE_HISTORIA = 'monhabell-aventura-historia-vista';
const PIXEL = '"Press Start 2P", monospace';

const texto = (tam, color = '#fff', extra = {}) => ({
    fontFamily: PIXEL, fontSize: tam, color, stroke: '#000', strokeThickness: 5, align: 'center', ...extra,
});
const hex = n => '#' + n.toString(16).padStart(6, '0');
const reducirMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function historiaVista() {
    try { return localStorage.getItem(CLAVE_HISTORIA) === '1'; } catch (_e) { return false; }
}

function marcarHistoriaVista() {
    try { localStorage.setItem(CLAVE_HISTORIA, '1'); } catch (_e) { /* se vuelve a mostrar, no pasa nada */ }
}

// barra de carga (se llama desde el preload de la pantalla de título)
export function mostrarCarga(scene, zoom) {
    const w = ANCHO * zoom, h = ALTO * zoom;
    const marco = scene.add.rectangle(w / 2, h / 2 + 40, 420 * zoom / 2, 16 * zoom / 2).setStrokeStyle(2, 0x00ffff);
    const barra = scene.add.rectangle(marco.x - marco.width / 2 + 3, marco.y, 0, marco.height - 6, 0x00ffff).setOrigin(0, 0.5);
    const titulo = scene.add.text(w / 2, h / 2 - 20, 'MONHABELL', texto('32px', '#9ff3ff', { resolution: 1 })).setOrigin(0.5);
    const pie = scene.add.text(w / 2, h / 2 + 90, 'Cargando...', texto('14px', '#ffe066', { resolution: 1 })).setOrigin(0.5);
    scene.load.on('progress', p => { barra.width = (marco.width - 6) * p; });
    scene.load.once('complete', () => [marco, barra, titulo, pie].forEach(o => o.destroy()));
}

// fondo compartido: cielo nocturno, castillo y niebla
function fondoNoche(scene, zoom) {
    scene.cameras.main.setOrigin(0).setZoom(zoom);
    crearNieblaSeleccion(scene);
    scene.add.image(ANCHO / 2, ALTO + 10, 'castillo_28').setOrigin(0.5, 1).setScale(0.625).setTint(0x2c3140);
    scene.nieblaAlta.setDepth(1);
}

// ---------- Pantalla de título ----------
// alJugar(): ir a elegir personaje   alHistoria(): ver la historia
export function crearTitulo(scene, { zoom, alJugar, alHistoria }) {
    fondoNoche(scene, zoom);
    const quieto = reducirMovimiento();

    // el Rey Troll vigila desde la sombra, detrás del castillo
    const rey = scene.add.sprite(ANCHO - 120, ALTO - 30, 'troll3_Idle').setOrigin(0.5, 1).setScale(0.5)
        .setFlipX(true).setTint(0x1a1d2b).setAlpha(0.9).setDepth(0);
    rey.anims.play('troll3-idle');

    // los tres héroes corren por abajo
    PERSONAJES.forEach((pj, i) => {
        const s = scene.add.sprite(110 + i * 70, ALTO - 18, `${pj.id}-run`).setOrigin(0.5, 1).setScale(0.75).setDepth(3);
        s.anims.play(`${pj.id}-run`);
        if (!quieto) scene.tweens.add({ targets: s, x: s.x + 20, yoyo: true, repeat: -1, duration: 1400 + i * 200, ease: 'Sine.inOut' });
    });

    // velo oscuro detrás del logo y el menú para que se lean sobre el castillo
    const velo = scene.add.graphics().setDepth(2);
    velo.fillGradientStyle(0x05070f, 0x05070f, 0x05070f, 0x05070f, 0, 0, 0.75, 0.75);
    velo.fillRect(0, 40, ANCHO, 90);
    velo.fillStyle(0x05070f, 0.75).fillRect(0, 130, ANCHO, 140);
    velo.fillGradientStyle(0x05070f, 0x05070f, 0x05070f, 0x05070f, 0.75, 0.75, 0, 0);
    velo.fillRect(0, 270, ANCHO, 50);

    // logo con halo de luz
    const halo = scene.add.image(ANCHO / 2, 92, 'brillo').setScale(9, 2.6).setTint(0x00c8ff).setAlpha(0.35)
        .setBlendMode('ADD').setDepth(3);
    const sombra = scene.add.text(ANCHO / 2 + 4, 92 + 4, 'MONHABELL', texto('48px', '#04121f', { strokeThickness: 0 })).setOrigin(0.5).setDepth(4);
    const logo = scene.add.text(ANCHO / 2, 92, 'MONHABELL', texto('48px', '#ffffff', { stroke: '#062c4a', strokeThickness: 10 }))
        .setOrigin(0.5).setDepth(5);
    logo.setTint(0xfffbe0, 0xfffbe0, 0x8ff0ff, 0x8ff0ff);
    logo.setShadow(0, 0, '#00e5ff', 18, true, true);
    // línea decorativa con el subtítulo en medio
    const deco = scene.add.graphics().setDepth(5);
    deco.lineStyle(2, 0xffcf5a, 0.8);
    deco.lineBetween(ANCHO / 2 - 250, 140, ANCHO / 2 - 178, 140).lineBetween(ANCHO / 2 + 178, 140, ANCHO / 2 + 250, 140);
    deco.fillStyle(0xffcf5a).fillRect(ANCHO / 2 - 254, 137, 6, 6).fillRect(ANCHO / 2 + 248, 137, 6, 6);
    const sub = scene.add.text(ANCHO / 2, 140, 'AVENTURA · LA NOCHE ETERNA', texto('12px', '#ffcf5a')).setOrigin(0.5).setDepth(5);
    const lema = scene.add.text(ANCHO / 2, 164, 'Nada es lo que parece...', texto('9px', '#ff8a9a', { strokeThickness: 4 }))
        .setOrigin(0.5).setDepth(5).setAlpha(0);
    if (!quieto) {
        scene.tweens.add({ targets: [logo, sombra, halo], y: '-=4', yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.inOut' });
        scene.tweens.add({ targets: halo, alpha: 0.2, yoyo: true, repeat: -1, duration: 2200, ease: 'Sine.inOut' });
        logo.setScale(0.6).setAlpha(0);
        scene.tweens.add({ targets: logo, scale: 1, alpha: 1, duration: 700, ease: 'Back.out' });
        [sub, deco].forEach(o => o.setAlpha(0));
        scene.tweens.add({ targets: [sub, deco], alpha: 1, delay: 400, duration: 600 });
    }
    scene.tweens.add({ targets: lema, alpha: 1, delay: 900, duration: 800 });

    // menú: botones con marco, el elegido se ilumina
    const opciones = historiaVista()
        ? [['JUGAR', alJugar], ['VER LA HISTORIA', alHistoria]]
        : [['NUEVA AVENTURA', alHistoria]];
    let sel = 0, elegido = false;
    const BOTON = { w: 230, h: 30 };
    const items = opciones.map(([nombre, accion], i) => {
        const y = 212 + i * 40;
        const marco = scene.add.graphics().setDepth(5);
        const t = scene.add.text(ANCHO / 2, y, nombre, texto('13px', '#ffffff', { strokeThickness: 4 })).setOrigin(0.5).setDepth(6);
        const zona = scene.add.zone(ANCHO / 2, y, BOTON.w, BOTON.h).setDepth(7).setInteractive({ useHandCursor: true });
        zona.on('pointerover', () => { if (sel !== i) { sel = i; marcar(); scene.sound.play('menu_mover', { volume: 0.4 }); } });
        zona.on('pointerdown', () => elegir(accion));
        return { t, marco, y };
    });
    function dibujarBoton({ marco, y }, activo) {
        const x = ANCHO / 2 - BOTON.w / 2, top = y - BOTON.h / 2;
        marco.clear();
        marco.fillStyle(0x000000, 0.45).fillRoundedRect(x + 3, top + 4, BOTON.w, BOTON.h, 6);
        marco.fillStyle(activo ? 0x3a2a05 : 0x06182b, 0.92).fillRoundedRect(x, top, BOTON.w, BOTON.h, 6);
        marco.lineStyle(2, activo ? 0xffe066 : 0x2f8fb0, 1).strokeRoundedRect(x, top, BOTON.w, BOTON.h, 6);
    }
    const flechas = [-1, 1].map(lado => scene.add.text(0, 0, lado < 0 ? '►' : '◄', texto('11px', '#ffe066', { strokeThickness: 3 }))
        .setOrigin(0.5).setDepth(6));
    function marcar() {
        items.forEach((it, i) => {
            dibujarBoton(it, i === sel);
            it.t.setColor(i === sel ? '#ffe066' : '#c9d6ff');
        });
        flechas.forEach((f, j) => f.setPosition(ANCHO / 2 + (j ? 1 : -1) * (BOTON.w / 2 - 16), items[sel].y));
    }
    marcar();
    if (!quieto) scene.tweens.add({ targets: flechas, alpha: 0.25, yoyo: true, repeat: -1, duration: 450 });

    function elegir(accion) {
        if (elegido) return;
        elegido = true;
        scene.sound.play('menu_ok', { volume: 0.6 });
        scene.cameras.main.flash(120, 255, 230, 120);
        scene.cameras.main.fadeOut(350, 0, 0, 0);
        scene.cameras.main.once('camerafadeoutcomplete', accion);
    }

    // ayuda de teclas
    const ayuda = opciones.length > 1 ? '↑↓ ELEGIR  ·  ENTER JUGAR  ·  F PANTALLA COMPLETA' : 'ENTER EMPEZAR  ·  F PANTALLA COMPLETA';
    scene.add.text(ANCHO / 2, 300, ayuda, texto('7px', '#9fb4d8', { strokeThickness: 3 })).setOrigin(0.5).setDepth(5);

    scene.add.text(ANCHO / 2, ALTO - 8, '© 2026 Monhabell', texto('7px', '#8fa3bf', { strokeThickness: 3 })).setOrigin(0.5, 1).setDepth(5);

    const k = scene.input.keyboard.addKeys({ arriba: 'UP', abajo: 'DOWN', enter: 'ENTER', espacio: 'SPACE' });
    scene.actualizarTitulo = (time) => {
        moverNieblaSeleccion(scene, time);
        const JD = Phaser.Input.Keyboard.JustDown;
        if (JD(k.arriba) || JD(k.abajo)) {
            sel = (sel + (JD(k.abajo) ? 1 : opciones.length - 1)) % opciones.length;
            marcar();
            scene.sound.play('menu_mover', { volume: 0.4 });
        }
        if (JD(k.enter) || JD(k.espacio)) elegir(opciones[sel][1]);
    };

    // música suave (el navegador la activa con la primera tecla o clic)
    scene.musica = scene.sound.add('musica', { loop: true, volume: 0.18 });
    scene.musica.play();
    scene.events.once('shutdown', () => scene.musica.destroy());
    scene.cameras.main.fadeIn(400, 0, 0, 0);
}

// ---------- Historia de introducción ----------
const PAGINAS = [
    {
        texto: 'Hace mucho tiempo, el reino de MONHABELL despertaba cada mañana con la luz del CRISTAL DEL ALBA.',
        dibujo(scene) {
            const c = scene.add.sprite(ANCHO / 2, 118, 'mz_cristal').setScale(3.2).anims.play('mz_cristal');
            const brillo = scene.add.image(ANCHO / 2, 118, 'brillo').setScale(3).setTint(0xffd27a).setBlendMode('ADD').setAlpha(0.6);
            scene.tweens.add({ targets: brillo, scale: 3.6, alpha: 0.35, yoyo: true, repeat: -1, duration: 1200 });
            return [c, brillo];
        },
    },
    {
        texto: 'Una noche, el REY TROLL lo robó... y desde entonces el sol nunca volvió a salir.',
        dibujo(scene) {
            const t = scene.add.sprite(ANCHO / 2, 196, 'troll3_Idle').setOrigin(0.5, 1).setScale(0.42).anims.play('troll3-idle');
            t.setTint(0x9fb0c8);
            scene.cameras.main.shake(300, 0.004);
            scene.sound.play('trampa', { volume: 0.5 });
            return [t];
        },
    },
    {
        texto: 'Sus trolls llenaron el camino de trampas: carteles que mienten, monedas falsas y suelos que desaparecen bajo tus pies.',
        dibujo(scene) {
            const cartel = scene.add.text(ANCHO / 2 - 120, 110, '¡POR AQUÍ\nES SEGURO!', {
                fontFamily: PIXEL, fontSize: '9px', color: '#ffe9a8', backgroundColor: '#3b2a1a', padding: { x: 6, y: 5 }, align: 'center',
            }).setOrigin(0.5);
            const moneda = scene.add.sprite(ANCHO / 2, 116, 'coins').setScale(1.6);
            if (scene.anims.exists('coins-giro')) moneda.anims.play('coins-giro');
            const calavera = scene.add.text(ANCHO / 2 + 120, 112, '☠', { fontSize: '44px', color: '#ff6b81' }).setOrigin(0.5);
            scene.tweens.add({ targets: calavera, angle: { from: -10, to: 10 }, yoyo: true, repeat: -1, duration: 500 });
            return [cartel, moneda, calavera];
        },
    },
    {
        texto: 'Tres héroes se atreven a cruzar la noche: GESI, LEO y ZENO.\n\nRecuerda: en Monhabell... NADA ES LO QUE PARECE.',
        dibujo(scene) {
            return PERSONAJES.map((pj, i) => {
                const s = scene.add.sprite(ANCHO / 2 + (i - 1) * 110, 172, `${pj.id}-idle`).setOrigin(0.5, 1).setScale(1.1);
                s.anims.play(`${pj.id}-idle`);
                const n = scene.add.text(s.x, 182, pj.nombre, texto('10px', hex(pj.color), { strokeThickness: 4 })).setOrigin(0.5, 0);
                return [s, n];
            }).flat();
        },
    },
];

export function crearIntro(scene, { zoom, alTerminar }) {
    fondoNoche(scene, zoom);
    scene.add.rectangle(0, 0, ANCHO, ALTO, 0x000000, 0.55).setOrigin(0).setDepth(2);
    const caja = scene.add.rectangle(ANCHO / 2, 285, ANCHO - 80, 110, 0x05070f, 0.85).setStrokeStyle(2, 0x00ffff).setDepth(3);
    const parrafo = scene.add.text(caja.x - caja.width / 2 + 20, caja.y - caja.height / 2 + 16, '', {
        fontFamily: PIXEL, fontSize: '11px', color: '#f2f6ff', lineSpacing: 8, wordWrap: { width: caja.width - 40 },
    }).setDepth(4);
    const ayuda = scene.add.text(ANCHO - 46, ALTO - 12, 'ENTER sigue  ·  ESC salta', texto('8px', '#ffe066', { strokeThickness: 3 }))
        .setOrigin(1, 1).setDepth(4);
    const puntos = PAGINAS.map((_, i) => scene.add.circle(ANCHO / 2 - 30 + i * 20, 352, 4, 0x445577).setDepth(4));

    let pagina = -1, dibujos = [], escribiendo = null, terminado = false;

    function terminar() {
        if (terminado) return;
        terminado = true;
        marcarHistoriaVista();
        scene.sound.play('menu_ok', { volume: 0.6 });
        scene.cameras.main.fadeOut(400, 0, 0, 0);
        scene.cameras.main.once('camerafadeoutcomplete', alTerminar);
    }

    function mostrar(i) {
        pagina = i;
        dibujos.forEach(o => o.destroy());
        dibujos = PAGINAS[i].dibujo(scene);
        dibujos.forEach(o => { o.setDepth(4); o.setAlpha(0); scene.tweens.add({ targets: o, alpha: 1, duration: 500 }); });
        puntos.forEach((p, j) => p.setFillStyle(j === i ? 0x00ffff : 0x445577));
        const completo = PAGINAS[i].texto;
        let n = 0;
        parrafo.setText('');
        escribiendo?.remove();
        escribiendo = scene.time.addEvent({
            delay: 28, repeat: completo.length - 1,
            callback: () => {
                n++;
                parrafo.setText(completo.slice(0, n));
                if (n % 3 === 0 && completo[n - 1] !== ' ') scene.sound.play('menu_mover', { volume: 0.08, rate: 1.6 });
                if (n >= completo.length) escribiendo = null;
            },
        });
    }

    function avanzar() {
        if (terminado) return;
        if (escribiendo) {
            // primero termina de escribir la página
            escribiendo.remove();
            escribiendo = null;
            parrafo.setText(PAGINAS[pagina].texto);
            return;
        }
        if (pagina >= PAGINAS.length - 1) terminar();
        else mostrar(pagina + 1);
    }

    const k = scene.input.keyboard.addKeys({ enter: 'ENTER', espacio: 'SPACE', esc: 'ESC' });
    scene.input.on('pointerdown', avanzar);
    scene.actualizarIntro = (time) => {
        moverNieblaSeleccion(scene, time);
        const JD = Phaser.Input.Keyboard.JustDown;
        if (JD(k.enter) || JD(k.espacio)) avanzar();
        if (JD(k.esc)) terminar();
    };

    scene.musica = scene.sound.add('musica_cueva', { loop: true, volume: 0.2 });
    scene.musica.play();
    scene.events.once('shutdown', () => scene.musica.destroy());
    scene.cameras.main.fadeIn(400, 0, 0, 0);
    mostrar(0);
    ayuda.setAlpha(0.85);
}

// ---------- Final del juego ----------
// rango según cuántas veces moriste: da ganas de volver a jugar (y de presumirlo)
function rango(muertes) {
    if (muertes === 0) return ['LEYENDA SIN MANCHA', '#7dffc8'];
    if (muertes < 15) return ['HEROE DE MONHABELL', '#ffe066'];
    if (muertes < 50) return ['SUPERVIVIENTE TERCO', '#ffb35a'];
    return ['VICTIMA FAVORITA DE LOS TROLLS', '#ff8a9a'];
}

export function crearFinal(scene, { zoom, personaje, score, muertes, alTerminar }) {
    scene.cameras.main.setOrigin(0).setZoom(zoom);
    const pj = PERSONAJES.find(p => p.id === personaje) || PERSONAJES[0];
    crearNieblaSeleccion(scene);
    scene.nieblaAlta.setDepth(1);

    // amanece: el cielo pasa de noche a dorado
    const amanecer = scene.add.rectangle(0, 0, ANCHO, ALTO, 0xff9a4a, 0).setOrigin(0).setBlendMode('ADD').setDepth(0);
    scene.tweens.add({ targets: amanecer, fillAlpha: 0.35, duration: 4000, ease: 'Sine.out' });
    const sol = scene.add.image(ANCHO / 2, ALTO + 40, 'brillo').setScale(6).setTint(0xffc46b).setBlendMode('ADD').setDepth(0);
    scene.tweens.add({ targets: sol, y: ALTO - 40, duration: 4000, ease: 'Sine.out' });

    const cristal = scene.add.sprite(ANCHO / 2, 120, 'mz_cristal').setScale(2.6).anims.play('mz_cristal').setDepth(3).setAlpha(0);
    scene.tweens.add({ targets: cristal, alpha: 1, y: 100, duration: 1500, ease: 'Sine.out' });
    const heroe = scene.add.sprite(ANCHO / 2, ALTO - 20, `${pj.id}-idle`).setOrigin(0.5, 1).setScale(1).setDepth(3);
    heroe.anims.play(`${pj.id}-idle`);

    scene.add.text(ANCHO / 2, 34, '¡EL SOL VUELVE A MONHABELL!', texto('16px', '#ffe066')).setOrigin(0.5).setDepth(4);
    scene.add.text(ANCHO / 2, 160, `${pj.nombre} derrotó al Rey Troll y devolvió\nel Cristal del Alba al reino.`, texto('10px', '#ffffff', { strokeThickness: 4, lineSpacing: 8 }))
        .setOrigin(0.5).setDepth(4);

    const [nombreRango, colorRango] = rango(muertes);
    const datos = scene.add.text(ANCHO / 2, 228,
        `PUNTAJE  ${score}\nMUERTES  ${muertes}`, texto('12px', '#9ff3ff', { strokeThickness: 4, lineSpacing: 10 }))
        .setOrigin(0.5).setDepth(4).setAlpha(0);
    const r = scene.add.text(ANCHO / 2, 272, nombreRango, texto('12px', colorRango, { strokeThickness: 4 })).setOrigin(0.5).setDepth(4).setScale(0);
    scene.tweens.add({ targets: datos, alpha: 1, delay: 1800, duration: 600 });
    scene.tweens.add({ targets: r, scale: 1, delay: 2500, duration: 500, ease: 'Back.out' });

    const pie = scene.add.text(ANCHO / 2, ALTO - 10, '¿Puedes terminarlo con menos muertes?  ·  ENTER', texto('8px', '#ffffff', { strokeThickness: 3 }))
        .setOrigin(0.5, 1).setDepth(4).setAlpha(0);
    scene.tweens.add({ targets: pie, alpha: 1, delay: 3500, duration: 600 });

    scene.sound.play('victoria', { volume: 0.5 });
    let listo = false;
    scene.time.delayedCall(3500, () => { listo = true; });
    const k = scene.input.keyboard.addKeys({ enter: 'ENTER', espacio: 'SPACE' });
    const salir = () => {
        if (!listo) return;
        listo = false;
        scene.cameras.main.fadeOut(500, 0, 0, 0);
        scene.cameras.main.once('camerafadeoutcomplete', alTerminar);
    };
    scene.input.on('pointerdown', salir);
    scene.actualizarFinal = (time) => {
        moverNieblaSeleccion(scene, time);
        const JD = Phaser.Input.Keyboard.JustDown;
        if (JD(k.enter) || JD(k.espacio)) salir();
    };
    scene.cameras.main.fadeIn(800, 0, 0, 0);
}
