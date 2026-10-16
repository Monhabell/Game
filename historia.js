// Presentación del juego: pantalla de título, historia de introducción y final.
//
// La historia: el Rey Troll robó el Cristal del Alba y desde entonces la noche nunca
// termina en Albora (por eso todos los niveles son oscuros). Sus trolls llenaron el
// camino de trampas: carteles que mienten, monedas falsas, suelos que desaparecen...
//
// Todas las pantallas miden 790x380 "por dentro" (la cámara hace zoom, igual que el juego).

import { crearNieblaSeleccion, moverNieblaSeleccion } from "./ambiente.js"
import { PERSONAJES, resDe } from "./personajes.js"
import { animDe, prepararVariante } from "./vestidor.js"

const ANCHO = 790;
const ALTO = 380;
const CLAVE_HISTORIA = 'monhabell-aventura-historia-vista';
const PIXEL = '"Press Start 2P", monospace';

const texto = (tam, color = '#fff', extra = {}) => ({
    fontFamily: PIXEL, fontSize: tam, color, stroke: '#000', strokeThickness: 5, align: 'center', ...extra,
});
const hex = n => '#' + n.toString(16).padStart(6, '0');
const reducirMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// estilo moderno (igual que la interfaz HTML): letra Poppins y un solo color de acento
const LETRA = '"Poppins", system-ui, sans-serif';
const ACENTO = 0x8b9cff, ACENTO_FUERTE = 0x6f82ff;
const HEROE = { x: 585, pie: 322, escala: 3 }; // el héroe grande de la pantalla de título

// brillo radial suave (propio: no depende de que se haya creado el de los niveles)
function resplandor(scene) {
    if (scene.textures.exists('resplandor')) return;
    const t = scene.textures.createCanvas('resplandor', 128, 128), ctx = t.getContext();
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    t.refresh();
}
const moderno = (tam, color, peso = 500, extra = {}) => ({ fontFamily: LETRA, fontSize: `${tam}px`, color, fontStyle: String(peso), ...extra });

export function historiaVista() {
    try { return localStorage.getItem(CLAVE_HISTORIA) === '1'; } catch (_e) { return false; }
}

function marcarHistoriaVista() {
    try { localStorage.setItem(CLAVE_HISTORIA, '1'); } catch (_e) { /* se vuelve a mostrar, no pasa nada */ }
}

// barra de carga (se llama desde el preload de la pantalla de título): fina, redondeada, color de acento
export function mostrarCarga(scene, zoom) {
    const w = ANCHO * zoom, h = ALTO * zoom, z = zoom;
    const ancho = 260 * z, alto = 4 * z;
    const fondo = scene.add.graphics();
    fondo.fillStyle(0xffffff, 0.08).fillRoundedRect(w / 2 - ancho / 2, h / 2 + 24 * z, ancho, alto, alto / 2);
    const barra = scene.add.graphics();
    const titulo = scene.add.text(w / 2, h / 2 - 6 * z, 'TROLL NIGHT', moderno(30 * z, '#eef1f7', 700, { resolution: 1 })).setOrigin(0.5);
    const pie = scene.add.text(w / 2, h / 2 + 46 * z, 'Cargando…', moderno(10 * z, '#7f88a6', 500, { resolution: 1 })).setOrigin(0.5);
    scene.load.on('progress', p => {
        barra.clear().fillStyle(ACENTO, 1).fillRoundedRect(w / 2 - ancho / 2, h / 2 + 24 * z, Math.max(alto, ancho * p), alto, alto / 2);
    });
    scene.load.once('complete', () => [fondo, barra, titulo, pie].forEach(o => o.destroy()));
}

// fondo compartido: cielo nocturno, castillo y niebla (historia y final)
function fondoNoche(scene, zoom) {
    scene.cameras.main.setOrigin(0).setZoom(zoom);
    crearNieblaSeleccion(scene);
    scene.add.image(ANCHO / 2, ALTO + 10, 'castillo_28').setOrigin(0.5, 1).setScale(0.625).setTint(0x2c3140);
    scene.nieblaAlta.setDepth(1);
}

// ---------- Pantalla de título ----------
// Cinematográfica y minimalista: a la derecha, un héroe grande (van pasando los 6: entra corriendo,
// se luce con un ataque y sale) con el Rey Troll asomándose detrás de las montañas; a la izquierda,
// el logo y el menú. Las capas se mueven un poco con el mouse (profundidad) y el troll aparece con un rugido.
// alJugar(): ir a elegir personaje   alHistoria(): ver la historia   alAmigos(): sala en línea
export function crearTitulo(scene, { zoom, alJugar, alHistoria, alAmigos }) {
    scene.cameras.main.setOrigin(0).setZoom(zoom);
    const quieto = reducirMovimiento();
    const capas = []; // [objeto, profundidad] para el movimiento con el mouse

    // cielo: degradado de azul noche a casi negro
    const cielo = scene.add.graphics().setDepth(0);
    cielo.fillGradientStyle(0x141b38, 0x141b38, 0x05060c, 0x05060c, 1).fillRect(-20, -20, ANCHO + 40, ALTO + 40);

    // estrellas que titilan
    const estrellas = scene.add.container(0, 0).setDepth(1);
    for (let i = 0; i < 70; i++) {
        const e = scene.add.circle(Phaser.Math.Between(-10, ANCHO + 10), Phaser.Math.Between(-10, 250),
            Math.random() < 0.15 ? 1.2 : 0.6, 0xdfe4ff, Phaser.Math.FloatBetween(0.25, 0.9));
        estrellas.add(e);
        if (!quieto) scene.tweens.add({ targets: e, alpha: 0.1, yoyo: true, repeat: -1, duration: Phaser.Math.Between(900, 2600), delay: Phaser.Math.Between(0, 2000) });
    }
    capas.push([estrellas, 0.15]);

    resplandor(scene);
    // el Rey Troll: una sombra gigante que se asoma detrás de las montañas
    const rey = scene.add.sprite(660, ALTO + 30, 'troll3_Idle').setOrigin(0.5, 1).setScale(0.85)
        .setFlipX(true).setTint(0x1d2546).setDepth(3);
    rey.anims.play('troll3-idle');
    capas.push([rey, 0.4]);

    // el héroe: grande, con una luz de su color detrás y un aro de luz en el piso
    const luz = scene.add.image(HEROE.x, HEROE.pie - 100, 'resplandor').setScale(3.4).setAlpha(0.3).setBlendMode('ADD').setDepth(7);
    const piso = scene.add.image(HEROE.x, HEROE.pie, 'resplandor').setScale(1.8, 0.3).setAlpha(0.55).setBlendMode('ADD').setDepth(7);
    scene.add.ellipse(HEROE.x, HEROE.pie, 100, 14, 0x000000, 0.45).setDepth(7);
    const heroe = scene.add.sprite(HEROE.x, HEROE.pie + 4, `${PERSONAJES[0].id}-idle`).setOrigin(0.5, 1)
        .setScale(HEROE.escala).setFlipX(true).setDepth(8);
    const nombreHeroe = scene.add.text(HEROE.x, HEROE.pie + 22, '', moderno(11, '#ffffff', 600)).setOrigin(0.5).setDepth(10);
    let cual = Math.floor(Math.random() * PERSONAJES.length);
    heroe.on('animationcomplete', anim => {
        if (!anim.key.endsWith('-idle') && !anim.key.endsWith('-run')) heroe.anims.play(`${prepararVariante(scene, animDe(PERSONAJES[cual]))}-idle`, true);
    });
    // cada héroe entra corriendo, se luce con un ataque y sale; después viene el siguiente
    const mostrarHeroe = () => {
        if (!heroe.active) return;
        const pj = PERSONAJES[cual];
        const a = prepararVariante(scene, animDe(pj)); // con los colores del vestidor
        [luz, piso].forEach(o => o.setTint(pj.color));
        heroe.setScale(HEROE.escala / resDe(pj)); // (héroes HD: hojas al doble)
        nombreHeroe.setText(`${pj.nombre} · ${pj.titulo}`).setColor(hex(pj.color));
        if (quieto) { heroe.anims.play(`${a}-idle`, true); return; }
        heroe.anims.play(`${a}-run`, true);
        heroe.setAlpha(0).x = HEROE.x + 70;
        nombreHeroe.setAlpha(0);
        scene.tweens.add({
            targets: heroe, x: HEROE.x, alpha: 1, duration: 450, ease: 'Cubic.out',
            onComplete: () => heroe.anims.play(`${a}-idle`, true),
        });
        scene.tweens.add({ targets: nombreHeroe, alpha: 1, delay: 250, duration: 400 });
        scene.time.delayedCall(1300, () => {
            const lucirse = pj.hojas.atk1 ? 'atk1' : pj.hojas.slash ? 'slash' : null; // (los ángeles: tajo)
            if (heroe.active && lucirse) heroe.anims.play(`${a}-${lucirse}`, true);
        });
        scene.time.delayedCall(4300, () => {
            if (!heroe.active) return;
            heroe.anims.play(`${a}-run`, true);
            scene.tweens.add({ targets: [heroe], x: HEROE.x - 60, alpha: 0, duration: 380, ease: 'Cubic.in' });
            scene.tweens.add({
                targets: nombreHeroe, alpha: 0, duration: 300,
                onComplete: () => { cual = (cual + 1) % PERSONAJES.length; mostrarHeroe(); },
            });
        });
    };

    // montañas en capas (de la más lejana a la más cercana)
    [[0x10162c, 250, 26, 0.7], [0x0b1022, 285, 20, 0.85], [0x06080f, 318, 14, 1.1]].map(([color, base, alto, prof], k) => {
        const g = scene.add.graphics().setDepth(4 + k);
        g.fillStyle(color, 1).beginPath().moveTo(-40, ALTO + 20);
        for (let x = -40; x <= ANCHO + 40; x += 30) {
            const y = base - alto * (0.5 + 0.5 * Math.sin(x * 0.013 + k * 2.1) * Math.cos(x * 0.031 + k));
            g.lineTo(x, y);
        }
        g.lineTo(ANCHO + 40, ALTO + 20).closePath().fillPath();
        capas.push([g, prof]);
    });
    // niebla baja: una franja que se desvanece
    const niebla = scene.add.graphics().setDepth(7);
    niebla.fillGradientStyle(0x8b9cff, 0x8b9cff, 0x8b9cff, 0x8b9cff, 0, 0, 0.08, 0.08).fillRect(-20, 270, ANCHO + 40, 110);

    // brasas de luz que suben despacio
    if (!quieto) {
        for (let i = 0; i < 22; i++) {
            const b = scene.add.circle(Phaser.Math.Between(0, ANCHO), ALTO + 10, Phaser.Math.FloatBetween(0.6, 1.6), ACENTO, 0.8)
                .setDepth(8).setBlendMode('ADD');
            const subir = () => {
                b.setPosition(Phaser.Math.Between(0, ANCHO), ALTO + 10).setAlpha(Phaser.Math.FloatBetween(0.3, 0.8));
                scene.tweens.add({
                    targets: b, y: Phaser.Math.Between(120, 260), x: b.x + Phaser.Math.Between(-40, 40), alpha: 0,
                    duration: Phaser.Math.Between(5000, 9000), onComplete: subir,
                });
            };
            scene.time.delayedCall(Phaser.Math.Between(0, 6000), subir);
        }
    }

    // velo a la izquierda para que el texto se lea siempre
    const velo = scene.add.graphics().setDepth(9);
    velo.fillGradientStyle(0x05060c, 0x05060c, 0x05060c, 0x05060c, 0.75, 0, 0.75, 0).fillRect(0, 0, 430, ALTO);

    // logo y textos (columna izquierda)
    const X = 64;
    const etiqueta = scene.add.text(X, 70, 'UN PLATAFORMAS TROLL', moderno(10, '#8b9cff', 600)).setOrigin(0, 0.5).setDepth(10);
    const logo = scene.add.text(X - 3, 110, 'TROLL NIGHT', moderno(54, '#ffffff', 700)).setOrigin(0, 0.5).setDepth(10);
    logo.setTint(0xffffff, 0xffffff, 0xc3cbff, 0xc3cbff);
    logo.setShadow(0, 0, '#6f82ff', 22, false, true);
    const subtitulo = scene.add.text(X, 152, 'La Noche Eterna', moderno(20, '#c9d0e6', 400)).setOrigin(0, 0.5).setDepth(10);
    const lema = scene.add.text(X, 178, 'Nada es lo que parece.', moderno(11, '#7f88a6', 400, { fontStyle: 'italic' })).setOrigin(0, 0.5).setDepth(10);
    const textos = [etiqueta, logo, subtitulo, lema];

    // menú: botones de píldora; el elegido se llena con el color de acento
    const opciones = historiaVista()
        ? [['Jugar', alJugar], ['Jugar con amigos', alAmigos], ['Ver la historia', alHistoria]]
        : [['Nueva aventura', alHistoria], ['Jugar con amigos', alAmigos]];
    // en la app del celular se puede cerrar el juego por completo (en el navegador no se puede cerrar la página)
    const app = window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.App;
    if (app) opciones.push(['Salir del juego', () => app.exitApp()]);
    let sel = 0, elegido = false;
    // con 4 opciones los botones van un poco más juntos (para que quepa la ayuda de abajo)
    const BOTON = opciones.length > 3 ? { w: 220, h: 30, paso: 38, y0: 210 } : { w: 220, h: 34, paso: 44, y0: 222 };
    const items = opciones.map(([nombre, accion], i) => {
        const y = BOTON.y0 + i * BOTON.paso;
        const marco = scene.add.graphics().setDepth(10);
        const t = scene.add.text(X + 20, y, nombre, moderno(13, '#c9d0e6', 500)).setOrigin(0, 0.5).setDepth(11);
        const flecha = scene.add.text(X + BOTON.w - 20, y, '→', moderno(14, '#ffffff', 500)).setOrigin(1, 0.5).setDepth(11);
        const zona = scene.add.zone(X + BOTON.w / 2, y, BOTON.w, BOTON.h).setDepth(12).setInteractive({ useHandCursor: true });
        zona.on('pointerover', () => { if (sel !== i) { sel = i; marcar(); scene.sound.play('menu_mover', { volume: 0.4 }); } });
        zona.on('pointerdown', () => elegir(accion));
        return { t, flecha, marco, y };
    });
    function marcar() {
        items.forEach((it, i) => {
            const activo = i === sel, top = it.y - BOTON.h / 2;
            it.marco.clear();
            if (activo) {
                it.marco.fillStyle(ACENTO_FUERTE, 1).fillRoundedRect(X, top, BOTON.w, BOTON.h, BOTON.h / 2);
            } else {
                it.marco.fillStyle(0xffffff, 0.05).fillRoundedRect(X, top, BOTON.w, BOTON.h, BOTON.h / 2);
                it.marco.lineStyle(1, 0xffffff, 0.12).strokeRoundedRect(X, top, BOTON.w, BOTON.h, BOTON.h / 2);
            }
            it.t.setColor(activo ? '#ffffff' : '#c9d0e6');
            it.flecha.setAlpha(activo ? 1 : 0);
        });
        if (!quieto) {
            const f = items[sel].flecha;
            scene.tweens.killTweensOf(f);
            f.x = X + BOTON.w - 26;
            scene.tweens.add({ targets: f, x: X + BOTON.w - 20, duration: 180, ease: 'Quad.out' });
        }
    }
    marcar();

    function elegir(accion) {
        if (elegido) return;
        elegido = true;
        scene.sound.play('menu_ok', { volume: 0.6 });
        scene.cameras.main.fadeOut(380, 5, 6, 12);
        scene.cameras.main.once('camerafadeoutcomplete', accion);
    }

    // ayuda de teclas y créditos (discretos)
    const ayuda = opciones.length > 1 ? '↑ ↓  elegir   ·   Enter  jugar   ·   F  pantalla completa' : 'Enter  empezar   ·   F  pantalla completa';
    const pie = scene.add.text(X, ALTO - 26, ayuda, moderno(9, '#6c7591', 500)).setOrigin(0, 0.5).setDepth(10);
    const autor = scene.add.text(X, ALTO - 12, '© 2026 · Desarrollado por Monhabell', moderno(8, '#4f5770', 500)).setOrigin(0, 0.5).setDepth(10);

    const base = capas.map(([o]) => [o.x, o.y]); // (antes de la entrada, que mueve al troll)

    // entrada: todo aparece en orden; el troll se alza con un rugido y después llega el primer héroe
    if (!quieto) {
        [...textos, ...items.flatMap(it => [it.marco, it.t]), pie, autor].forEach((o, i) => {
            const y = o.y;
            o.setAlpha(0).setY(y + 10);
            scene.tweens.add({ targets: o, alpha: 1, y, delay: 250 + i * 60, duration: 500, ease: 'Cubic.out' });
        });
        items.forEach(it => it.flecha.setAlpha(0));
        scene.time.delayedCall(250 + items.length * 120 + 600, () => marcar());
        rey.setAlpha(0).y = ALTO + 120;
        scene.tweens.add({
            targets: rey, alpha: 1, y: ALTO + 30, delay: 500, duration: 1300, ease: 'Cubic.out',
            onStart: () => {
                scene.sound.play('rugido', { volume: 0.35, rate: 0.8 });
                scene.cameras.main.shake(500, 0.0025);
            },
        });
        heroe.setAlpha(0);
        scene.time.delayedCall(1300, mostrarHeroe);
    } else {
        mostrarHeroe();
    }

    // profundidad: las capas se corren un poco según dónde esté el mouse
    let mx = 0, my = 0;
    scene.input.on('pointermove', p => {
        mx = p.x / scene.scale.width - 0.5;
        my = p.y / scene.scale.height - 0.5;
    });

    const k = scene.input.keyboard.addKeys({ arriba: 'UP', abajo: 'DOWN', enter: 'ENTER', espacio: 'SPACE' });
    scene.actualizarTitulo = () => {
        if (!quieto) {
            capas.forEach(([o, prof], i) => {
                o.x += (base[i][0] - mx * 16 * prof - o.x) * 0.06;
                o.y += (base[i][1] - my * 8 * prof - o.y) * 0.06;
            });
        }
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
    scene.cameras.main.fadeIn(600, 5, 6, 12);
}

// ---------- Historia de introducción ----------
const PAGINAS = [
    {
        texto: 'Hace mucho tiempo, el reino de ALBORA despertaba cada mañana con la luz del CRISTAL DEL ALBA.',
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
        texto: 'Tres héroes se atreven a cruzar la noche: GESI, LEO y ZENO.\n\nRecuerda: en Albora... NADA ES LO QUE PARECE.',
        dibujo(scene) {
            return PERSONAJES.slice(0, 3).map((pj, i) => {
                const s = scene.add.sprite(ANCHO / 2 + (i - 1) * 110, 172, `${pj.id}-idle`).setOrigin(0.5, 1).setScale(1.1 / resDe(pj));
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
    if (muertes < 15) return ['HÉROE DE ALBORA', '#ffe066'];
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
    const heroe = scene.add.sprite(ANCHO / 2, ALTO - 20, `${pj.id}-idle`).setOrigin(0.5, 1).setScale(1 / resDe(pj)).setDepth(3);
    heroe.anims.play(`${pj.id}-idle`);

    scene.add.text(ANCHO / 2, 34, '¡EL SOL VUELVE A ALBORA!', texto('16px', '#ffe066')).setOrigin(0.5).setDepth(4);
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
