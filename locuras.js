// Locuras: trampas troll nuevas que se desbloquean nivel a nivel (cada nivel trae las suyas
// y mezcla las de antes). Se reparten al azar en cada intento (ver azar.js, campo 'locuras').
//
// Reglas de justicia: todas tienen una señal clara antes de hacer daño y tiempo para reaccionar.
// Muchas invierten lo aprendido: con la roca hay que frenar; con el cartel que cae, seguir.
//
//   Nivel 1  monedaHuye    la moneda salta lejos cada vez que te acercas (y al final se deja tomar)
//            cartelCae     el cartel cruje y se cae hacia ti: no te detengas
//            seta          seta trampolín: rebota... y a veces te lanza demasiado alto
//   Nivel 2  estalactita   una roca que te sigue por el techo y cae al quedar encima
//            ola           la lava de un foso sube en olas (burbujas antes de cada ola)
//            techoBaja     el túnel se derrumba detrás de ti: ¡corre!
//   Nivel 3  puente        la plataforma tiembla al pisarla y se cae (vuelve a los 3 s)
//            ascensor      el ascensor sube y, sin esperar, baja de golpe
//            viento        ráfagas que empujan (antes se ven las líneas de viento)
//   Nivel 4  quieto        suelo agrietado: si te quedas quieto salen pinchos
//            antorcha      la antorcha se vuelve azul y te persigue un fuego fatuo
//            puerta        una reja cae detrás de ti y llegan enemigos
//   Nivel 5  geiser        un chorro de lava sale del foso cada tanto
//            cadena        el suelo se hunde en cadena detrás de ti
//   Nivel 6  runaMaldita   pisar la runa morada invierte izquierda y derecha
//            sombra        tu sombra repite tus pasos con retraso: no te detengas
//            gravedad      zona de gravedad loca (liviana y pesada por turnos)
// Remixes de trampas viejas: monedaBuena (parece trampa y es buena), estatuaRoja (ojos rojos...
// pero es un punto de control de verdad) y runaDerrumba (la runa crea losas que se rompen la
// primera vez: hay que golpearla de nuevo).
//
// api: { killgesi(scene), crearEnemigo(scene, x, y, tipo), mostrarMensaje(scene, texto, ms) }

import { crearAntorcha, colgarRoca } from "./mazmorra.js"

const SUELO_Y = 332;
const PROFUNDIDAD = 41; // por encima de la oscuridad

// tiempos (a 220 px/s, la velocidad de carrera)
const SALTO_MONEDA = 160;       // px que salta la moneda que huye
const HUIDAS_MONEDA = 3;        // después de esto se deja tomar
const CRUJE_CARTEL = 450;       // ms que cruje el cartel antes de caer
const SIGUE_ESTALACTITA = 150;  // px/s con los que la estalactita te sigue
const AVISO_LAVA = 650;         // ms de burbujas antes de la ola o el géiser
const ACTIVA_LAVA = 750;        // ms que dura la ola o el chorro
const PAUSA_LAVA = 1700;        // ms de calma entre olas
const RETUMBA_TUNEL = 800;      // ms de temblor antes de que el túnel empiece a caer
const DERRUMBE_TUNEL = 140;     // px/s del derrumbe (corriendo se escapa sin problema)
const TIEMBLA_PUENTE = 700;     // ms que tiembla la plataforma antes de caer
const VUELVE_PUENTE = 3000;     // ms hasta que la plataforma vuelve
const EMPUJE_VIENTO = 110;      // px/s
const QUIETO_AVISO = 450;       // ms quieto: el suelo tiembla
const QUIETO_PINCHOS = 950;     // ms quieto: salen los pinchos
const FUEGO_VEL = 150;          // px/s del fuego fatuo (más lento que tú)
const FUEGO_VIDA = 2600;        // ms que dura el fuego fatuo
const PUERTA_MAX = 12000;       // ms máximos que la reja queda cerrada
const PASO_CADENA = 520;        // ms entre losas que se hunden (100 px: ~190 px/s)
const INVERTIDO_MS = 3500;      // ms con los controles invertidos
const RETRASO_SOMBRA = 1200;    // ms de retraso de la sombra
const VIDA_SOMBRA = 7000;       // ms que dura la sombra
const TURNO_GRAVEDAD = 1600;    // ms de cada turno de la gravedad loca

const rect = b => new Phaser.Geom.Rectangle(b.left ?? b.x, b.top ?? b.y, b.width, b.height);
const choca = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);
const enSuelo = g => g.body.blocked.down || g.body.touching.down;

// texturas propias (se dibujan una sola vez)
function crearTexturas(scene) {
    if (scene.textures.exists('seta_trampolin')) return;
    const g = scene.make.graphics({ add: false });
    // seta: sombrero rojo con puntos y tallo claro
    g.fillStyle(0xf2e6c8).fillRect(11, 12, 10, 10);
    g.fillStyle(0xd9342b).fillEllipse(16, 10, 30, 18);
    g.fillStyle(0xfff4e0).fillCircle(9, 8, 2.5).fillCircle(20, 5, 2.5).fillCircle(24, 11, 2);
    g.generateTexture('seta_trampolin', 32, 22);
    g.clear();
    // runa maldita: losa oscura con un círculo morado
    g.fillStyle(0x2a1838).fillRect(0, 0, 32, 8);
    g.lineStyle(2, 0xc77dff).strokeCircle(16, 4, 3).lineBetween(4, 4, 10, 4).lineBetween(22, 4, 28, 4);
    g.generateTexture('runa_maldita', 32, 8);
    g.destroy();
}

function burla(scene, api, texto, ms = 1000) {
    api.mostrarMensaje(scene, texto, ms);
    scene.sound.play('trampa', { volume: 0.45 });
}

export function crearLocuras(scene, nivel, inicioX) {
    crearTexturas(scene);
    const adelante = x => x > inicioX + 40;
    scene.locuras = [];
    scene.invertidoHasta = 0;
    scene.gravedadBase = null; // se toma de Gesi al entrar a la gravedad loca (aún no existe aquí)

    (nivel.locuras || []).forEach(([x, tipo, extra]) => {
        if (!adelante(tipo === 'techoBaja' ? extra : x)) return;
        const l = { x, tipo, extra, hecha: false };
        const crear = CREAR[tipo];
        if (crear && crear(scene, l) !== false) scene.locuras.push(l);
    });
}

const CREAR = {
    monedaHuye(scene, l) {
        l.m = scene.coins.create(l.x, 300, 'coins').anims.play('coins-giro', true).setScale(0.75).refreshBody();
        l.huidas = 0;
    },
    monedaBuena(scene, l) {
        // remix: gira lento como las monedas trampa... pero es buena
        scene.coins.create(l.x, 300, 'coins').anims.play('coins-giro', true).setScale(0.75).refreshBody().anims.timeScale = 0.8;
        return false;
    },
    cartelCae(scene, l) {
        const textos = ['NO TE DETENGAS', 'SIGUE, SIGUE', 'TODO FIRME', '¡QUÉ BIEN VAS!'];
        l.cartel = scene.add.container(l.x, SUELO_Y).setDepth(PROFUNDIDAD);
        const palo = scene.add.rectangle(0, -85, 4, 170, 0x4a3420);
        const texto = scene.add.text(0, -170, textos[Math.floor(Math.random() * textos.length)], {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#ffe9a8',
            backgroundColor: '#3b2a1a', padding: { x: 6, y: 5 },
        }).setOrigin(0.5);
        l.cartel.add([palo, texto]);
    },
    seta(scene, l) {
        l.img = scene.add.image(l.x, SUELO_Y, 'seta_trampolin').setOrigin(0.5, 1);
        l.listaHasta = 0;
    },
    estalactita(scene, l) {
        l.img = scene.cueva
            ? scene.add.image(l.x, -8, 'mz_stalactite5').setOrigin(0.5, 0).setScale(1.4).setTint(0xc8a0a0)
            : scene.add.image(l.x, 10, 'mz_bloque').setOrigin(0.5, 0).setScale(2.2).setTint(0xa08a8a);
        l.muro = colgarRoca(scene, l.img); // se mueve junto con la estalactita
    },
    ola(scene, l) { prepararLava(scene, l, l.x, l.extra); },
    geiser(scene, l) { prepararLava(scene, l, l.x, l.extra); },
    techoBaja(scene, l) { l.frente = l.x; },
    puente(scene, l) {
        l.p = scene.floor.getChildren().find(p => p.esPlataforma && Math.abs(p.body.left - l.x) < 4);
        if (!l.p) return false;
    },
    ascensor(scene, l) {
        const p = scene.moviles.getChildren().find(m => m.eje === 'y' && Math.abs(m.x - l.x) < 4);
        if (!p) return false;
        p.tramposo = true;
        return false; // lo maneja game.js (actualizarMundo) y revisarAscensores
    },
    viento(scene, l) {
        l.dir = l.extra || 1;
        l.fase = 'calma';
        l.hasta = 0;
    },
    quieto(scene, l) {
        // grietas en el suelo (la señal: siempre visibles)
        const g = scene.add.graphics().setDepth(PROFUNDIDAD - 5);
        g.lineStyle(1, 0x1a1008, 0.8);
        for (let i = 0; i < 6; i++) {
            const x0 = l.x - 70 + i * 28;
            g.lineBetween(x0, SUELO_Y + 1, x0 + 8, SUELO_Y + 6).lineBetween(x0 + 8, SUELO_Y + 6, x0 + 4, SUELO_Y + 12);
        }
        l.quietoDesde = 0;
    },
    antorcha(scene, l) {
        scene.add.rectangle(l.x, SUELO_Y - 40, 4, 80, 0x4a3420);
        crearAntorcha(scene, l.x, SUELO_Y - 88);
    },
    puerta() {},
    cadena(scene, l) {
        // las losas del suelo falso de este tramo se hunden en cadena (no al pisarlas)
        l.losas = scene.floor.getChildren()
            .filter(p => p.esFalso && p.body && p.body.left >= l.x - 160 && p.body.right <= l.x + 160)
            .sort((a, b) => a.body.left - b.body.left);
        l.losas.forEach(p => { p.esFalso = false; p.esCadena = true; });
        if (!l.losas.length) return false;
    },
    runaMaldita(scene, l) {
        l.img = scene.add.image(l.x, SUELO_Y - 4, 'runa_maldita').setDepth(PROFUNDIDAD - 5);
        l.brillo = scene.add.image(l.x, SUELO_Y - 6, 'brillo').setDepth(PROFUNDIDAD).setScale(0.8, 0.3)
            .setTint(0xc77dff).setAlpha(0.5).setBlendMode('ADD');
        scene.tweens.add({ targets: l.brillo, alpha: 0.2, yoyo: true, repeat: -1, duration: 600 });
    },
    sombra(scene, l) { l.rastro = []; },
    gravedad(scene, l) {
        l.zona = scene.add.rectangle(l.x, SUELO_Y - 150, 300, 300, 0x7a5cff, 0.07).setDepth(PROFUNDIDAD - 5);
        l.liviana = true;
        l.cambio = 0;
    },
    estatuaRoja(scene, l) {
        // remix: un punto de control de verdad con ojos rojos (parece una estatua falsa)
        const cp = (scene.checkpoints || []).find(c => Math.abs(c.x - l.x) < 4 && !c.activo);
        if (!cp) return false;
        l.cp = cp;
        l.ojos = scene.add.image(l.x, SUELO_Y - 48, 'brillo').setDepth(PROFUNDIDAD).setScale(0.3).setTint(0xff2020).setAlpha(0);
        scene.tweens.add({ targets: l.ojos, alpha: 0.8, yoyo: true, repeat: -1, repeatDelay: 1800, duration: 300 });
    },
    runaDerrumba(scene, l) {
        const runa = scene.floor.getChildren().find(b => b.esRuna && Math.abs(b.body.left - l.x) < 4);
        if (!runa) return false;
        runa.tramposa = true; // ver engañoDeRuna
        return false;
    },
};

// lava que sube (ola: todo el foso, baja; géiser: un chorro alto en el centro)
function prepararLava(scene, l, a, b) {
    l.a = a; l.b = b;
    const ola = l.tipo === 'ola';
    const ancho = ola ? b - a : 34, centro = (a + b) / 2;
    const alto = ola ? 44 : 200;
    l.lava = scene.add.rectangle(centro, SUELO_Y + 30, ancho, alto, 0xff6a1a).setOrigin(0.5, 0).setDepth(PROFUNDIDAD - 2);
    l.luz = scene.add.image(centro, SUELO_Y, 'brillo').setDepth(PROFUNDIDAD).setScale(ancho / 40, 1).setTint(0xff7a2a).setAlpha(0).setBlendMode('ADD');
    l.alto = alto;
    l.fase = 'calma';
    l.hasta = 0;
}

export function actualizarLocuras(scene, api) {
    const g = scene.mascotaGesi;
    if (!scene.locuras || g.isDead || scene.nivelTerminado) return;
    const ahora = scene.time.now, dt = scene.game.loop.delta / 1000;
    const gb = g.body, gx = gb.center.x;
    const rGesi = rect(gb);
    scene.locuras.forEach(l => ACTUALIZAR[l.tipo]?.(scene, l, api, { g, gb, gx, rGesi, ahora, dt }));
}

const ACTUALIZAR = {
    monedaHuye(scene, l, api, { gx }) {
        if (!l.m.active || l.saltando || l.huidas >= HUIDAS_MONEDA || Math.abs(gx - l.m.x) > 80 || gx > l.m.x) return;
        l.saltando = true;
        l.huidas++;
        l.m.body.enable = false;
        scene.sound.play('salto', { volume: 0.25, rate: 1.6 });
        scene.tweens.add({ targets: l.m, x: l.m.x + SALTO_MONEDA, duration: 380 });
        scene.tweens.add({
            targets: l.m, y: 250, yoyo: true, duration: 190, ease: 'Quad.easeOut',
            onComplete: () => {
                if (!l.m.active) return;
                l.m.body.enable = true;
                l.m.refreshBody();
                l.saltando = false;
                if (l.huidas === 1) api.mostrarMensaje(scene, '¡ATRÁPAME!', 700);
                if (l.huidas === HUIDAS_MONEDA) api.mostrarMensaje(scene, 'BUENO, YA...', 700);
            },
        });
    },
    cartelCae(scene, l, api, { gx, rGesi }) {
        if (!l.hecha && gx > l.x - 120 && gx < l.x) {
            l.hecha = true;
            scene.sound.play('romper', { volume: 0.3, rate: 0.6 });
            scene.tweens.add({ targets: l.cartel, angle: -4, yoyo: true, repeat: 3, duration: CRUJE_CARTEL / 8 });
            scene.time.delayedCall(CRUJE_CARTEL, () => {
                scene.tweens.add({
                    targets: l.cartel, angle: -90, duration: 380, ease: 'Quad.easeIn',
                    onComplete: () => {
                        scene.sound.play('romper');
                        scene.cameras.main.shake(100, 0.004);
                        // te aplasta si te quedaste debajo (a la izquierda del palo)
                        const zona = new Phaser.Geom.Rectangle(l.x - 190, SUELO_Y - 26, 180, 26);
                        if (choca(zona, rect(scene.mascotaGesi.body))) api.killgesi(scene);
                        else api.mostrarMensaje(scene, '¡UY! CASI', 700);
                        scene.tweens.add({ targets: l.cartel, alpha: 0, delay: 900, duration: 400 });
                    },
                });
            });
        }
    },
    seta(scene, l, _api, { g, gb, rGesi, ahora }) {
        if (ahora < l.listaHasta || gb.velocity.y < 0) return;
        const r = new Phaser.Geom.Rectangle(l.x - 14, SUELO_Y - 20, 28, 20);
        if (!choca(r, rGesi)) return;
        l.listaHasta = ahora + 500;
        const demasiado = Math.random() < 0.35;
        g.setVelocityY(-scene.pj.salto * (demasiado ? 1.55 : 1.3));
        scene.sound.play('salto', { volume: 0.4, rate: demasiado ? 0.7 : 1.2 });
        scene.tweens.add({ targets: l.img, scaleY: 0.6, yoyo: true, duration: 90 });
        if (demasiado) scene.mostrarMensajeCorto?.('¡DEMASIADO!');
    },
    estalactita(scene, l, _api, { gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 360) return;
        // te sigue por el techo; cuando queda encima se convierte en una roca normal (tiembla y cae)
        const d = gx - l.x;
        if (Math.abs(d) < 10) {
            l.hecha = true;
            l.img.destroy();
            l.muro.forEach(p => p.destroy());
            scene.rocas.push(crearRocaEn(scene, l.x));
            return;
        }
        const paso = Math.sign(d) * Math.min(Math.abs(d), SIGUE_ESTALACTITA * scene.game.loop.delta / 1000);
        l.x += paso;
        l.img.x = l.x;
        l.muro.forEach(p => { p.x += paso; });
    },
    ola: cicloLava,
    geiser: cicloLava,
    techoBaja(scene, l, api, { gx, gb, dt }) {
        const [a, b] = [l.x, l.extra];
        if (!l.hecha) {
            if (gx < a + 120 || gx > b) return;
            l.hecha = true;
            l.empieza = scene.time.now + RETUMBA_TUNEL;
            l.frente = a;
            scene.cameras.main.shake(RETUMBA_TUNEL, 0.003);
            scene.sound.play('rugido', { volume: 0.4, rate: 0.6 });
            burla(scene, api, '¡EL TÚNEL SE CAE!\n¡CORRE!', 1300);
            return;
        }
        if (scene.time.now < l.empieza || l.frente >= b) return;
        const antes = l.frente;
        l.frente = Math.min(b, l.frente + DERRUMBE_TUNEL * dt);
        // cada 40 px cae un bloque de roca
        if (Math.floor(l.frente / 40) !== Math.floor(antes / 40)) {
            const roca = scene.add.image(l.frente, 196, 'mz_bloque').setOrigin(0.5, 0).setScale(1.3).setTint(0x8a7a6a);
            scene.tweens.add({ targets: roca, y: SUELO_Y - 40, duration: 220, ease: 'Quad.easeIn' });
            if (Math.random() < 0.3) scene.sound.play('romper', { volume: 0.25 });
        }
        if (gb.left < l.frente) api.killgesi(scene);
        // aplasta también a los enemigos
        scene.enemies.getChildren().forEach(e => {
            if (!e.isDead && e.x < l.frente && e.x > a) { e.isDead = true; e.destroy(); }
        });
    },
    puente(scene, l, api, { g, gb }) {
        if (l.hecha || !l.p.body.enable || !enSuelo(g)) return;
        const pb = l.p.body;
        if (Math.abs(gb.bottom - pb.top) > 4 || gb.right < pb.left || gb.left > pb.right) return;
        l.hecha = true;
        const partes = [l.p, ...(l.p.visuales || [])];
        const ys = partes.map(p => p.y);
        partes.forEach(p => p.setTint?.(0xff8a8a));
        scene.tweens.add({ targets: partes, x: '+=2', yoyo: true, repeat: Math.floor(TIEMBLA_PUENTE / 80), duration: 40 });
        scene.sound.play('romper', { volume: 0.3, rate: 1.4 });
        scene.time.delayedCall(TIEMBLA_PUENTE, () => {
            l.p.body.enable = false;
            scene.sound.play('romper');
            scene.tweens.add({ targets: partes, y: '+=40', alpha: 0, duration: 350 });
        });
        scene.time.delayedCall(TIEMBLA_PUENTE + VUELVE_PUENTE, () => {
            partes.forEach((p, i) => { p.y = ys[i]; p.clearTint?.(); });
            scene.tweens.add({ targets: partes, alpha: 1, duration: 300 });
            l.p.body.enable = true;
            l.p.refreshBody();
            l.hecha = false; // puede volver a pasar
        });
    },
    viento(scene, l, api, { g, gx, ahora, dt }) {
        const cerca = Math.abs(gx - l.x) < 175;
        if (l.fase === 'calma') {
            if (!cerca || ahora < l.hasta) return;
            l.fase = 'aviso';
            l.hasta = ahora + 700;
            lineasDeViento(scene, l, 700);
            if (!l.avisado) { l.avisado = true; api.mostrarMensaje(scene, '¡VIENTO!', 700); }
        } else if (l.fase === 'aviso') {
            if (ahora >= l.hasta) { l.fase = 'sopla'; l.hasta = ahora + 1200; lineasDeViento(scene, l, 1200); }
        } else if (l.fase === 'sopla') {
            if (cerca) g.x += l.dir * EMPUJE_VIENTO * dt;
            if (ahora >= l.hasta) { l.fase = 'calma'; l.hasta = ahora + 2000; }
        }
    },
    quieto(scene, l, api, { g, gb, gx, ahora }) {
        const encima = Math.abs(gx - l.x) < 80 && enSuelo(g) && Math.abs(gb.velocity.x) < 5;
        if (!encima) { l.quietoDesde = 0; return; }
        if (!l.quietoDesde) l.quietoDesde = ahora;
        const t = ahora - l.quietoDesde;
        if (t > QUIETO_AVISO && !l.temblando) {
            l.temblando = true;
            scene.cameras.main.shake(300, 0.002);
            scene.sound.play('romper', { volume: 0.2, rate: 1.8 });
            if (!l.avisado) { l.avisado = true; api.mostrarMensaje(scene, '¡NO TE QUEDES QUIETO!', 900); }
        }
        if (t > QUIETO_PINCHOS) {
            l.quietoDesde = 0;
            l.temblando = false;
            const pinchos = [0, 1, 2, 3].map(i => scene.add.image(gx - 64 + i * 32, SUELO_Y + 18, 'pincho').setOrigin(0, 1));
            scene.tweens.add({ targets: pinchos, y: SUELO_Y, duration: 90 });
            scene.time.delayedCall(90, () => {
                if (Math.abs(scene.mascotaGesi.body.center.x - gx) < 60 && scene.mascotaGesi.body.bottom > SUELO_Y - 20) api.killgesi(scene);
            });
            scene.tweens.add({ targets: pinchos, y: SUELO_Y + 18, delay: 700, duration: 200, onComplete: () => pinchos.forEach(p => p.destroy()) });
        }
    },
    antorcha(scene, l, api, { gx }) {
        if (l.hecha || Math.abs(gx - l.x) > 230) return;
        l.hecha = true;
        const luz = scene.add.image(l.x, SUELO_Y - 88, 'brillo').setDepth(PROFUNDIDAD).setScale(1.6).setTint(0x4aa8ff).setAlpha(0).setBlendMode('ADD');
        scene.tweens.add({ targets: luz, alpha: 0.8, yoyo: true, repeat: 2, duration: 110 });
        scene.sound.play('aparece', { volume: 0.4, rate: 0.7 });
        scene.time.delayedCall(650, () => {
            luz.destroy();
            api.mostrarMensaje(scene, '¡ERA UN ESPÍRITU!', 900);
            const fuego = scene.add.image(l.x, SUELO_Y - 88, 'brillo').setDepth(PROFUNDIDAD).setScale(0.9).setTint(0x4aa8ff).setBlendMode('ADD');
            const nucleo = scene.add.circle(l.x, SUELO_Y - 88, 5, 0xd8f0ff).setDepth(PROFUNDIDAD);
            const fin = scene.time.now + FUEGO_VIDA;
            const mover = scene.time.addEvent({
                delay: 16, loop: true, callback: () => {
                    const g = scene.mascotaGesi;
                    if (scene.time.now > fin || g.isDead || scene.nivelTerminado) {
                        mover.remove();
                        scene.tweens.add({ targets: [fuego, nucleo], alpha: 0, duration: 250, onComplete: () => { fuego.destroy(); nucleo.destroy(); } });
                        return;
                    }
                    const ang = Phaser.Math.Angle.Between(nucleo.x, nucleo.y, g.body.center.x, g.body.center.y);
                    nucleo.x += Math.cos(ang) * FUEGO_VEL * 0.016;
                    nucleo.y += Math.sin(ang) * FUEGO_VEL * 0.016;
                    fuego.setPosition(nucleo.x, nucleo.y);
                    if (Phaser.Geom.Rectangle.Contains(rect(g.body), nucleo.x, nucleo.y)) {
                        api.killgesi(scene);
                        mover.remove();
                        fuego.destroy(); nucleo.destroy();
                    }
                },
            });
        });
    },
    puerta(scene, l, api, { gx }) {
        if (l.hecha || gx < l.x + 40) return;
        l.hecha = true;
        // la reja cae detrás (no deja volver) y llegan dos enemigos del cielo
        const reja = scene.add.image(l.x, SUELO_Y - 400, 'mz_bloque').setOrigin(0.5, 1).setScale(1, 3.6).setTint(0x7a7a8a);
        scene.tweens.add({
            targets: reja, y: SUELO_Y, duration: 260, ease: 'Quad.easeIn',
            onComplete: () => { scene.sound.play('romper'); scene.cameras.main.shake(150, 0.005); },
        });
        const tope = scene.floor.create(l.x, SUELO_Y, 'mz_bloque').setOrigin(0.5, 1).setScale(1, 3.6).refreshBody().setVisible(false);
        burla(scene, api, '¡NO HAY VUELTA ATRÁS!', 1100);
        const enemigos = [200, 330].map(dx => api.crearEnemigo(scene, l.x + dx, 0));
        const abrir = () => {
            if (!tope.active) return;
            tope.destroy();
            scene.tweens.add({ targets: reja, y: SUELO_Y - 400, duration: 500, onComplete: () => reja.destroy() });
        };
        const revisar = scene.time.addEvent({
            delay: 300, loop: true, callback: () => {
                if (enemigos.every(e => !e.active || e.isDead)) { revisar.remove(); abrir(); }
            },
        });
        scene.time.delayedCall(PUERTA_MAX, () => { revisar.remove(); abrir(); });
    },
    cadena(scene, l, api, { gx, g }) {
        if (l.hecha || gx < l.losas[0].body.left + 10 || gx > l.losas[l.losas.length - 1].body.right || !enSuelo(g)) return;
        l.hecha = true;
        scene.cameras.main.shake(300, 0.003);
        burla(scene, api, '¡CORRE!', 900);
        // la cadena empieza detrás de ti (la losa más a la izquierda) y avanza
        l.losas.forEach((p, i) => scene.time.delayedCall(450 + i * PASO_CADENA, () => {
            const partes = [p, ...(p.visuales || [])];
            scene.tweens.add({ targets: partes, x: '+=3', yoyo: true, repeat: 2, duration: 40 });
            scene.time.delayedCall(150, () => {
                p.body.enable = false;
                scene.sound.play('romper', { volume: 0.5 });
                scene.tweens.add({ targets: partes, y: '+=300', alpha: 0, duration: 700 });
            });
        }));
    },
    runaMaldita(scene, l, api, { rGesi, ahora }) {
        if (l.hecha) return;
        if (!choca(new Phaser.Geom.Rectangle(l.x - 14, SUELO_Y - 10, 28, 10), rGesi)) return;
        l.hecha = true;
        maldecir(scene, api, ahora, '¡IZQUIERDA ES DERECHA!');
        scene.tweens.add({ targets: [l.img, l.brillo], alpha: 0, duration: 600 });
    },
    sombra(scene, l, api, { g, gx, rGesi, ahora }) {
        if (!l.hecha) {
            if (gx < l.x) return;
            l.hecha = true;
            l.fin = ahora + VIDA_SOMBRA + RETRASO_SOMBRA;
            burla(scene, api, 'TU SOMBRA TE SIGUE...\n¡NO TE DETENGAS!', 1300);
        }
        if (l.terminada) return;
        l.rastro.push({ t: ahora, x: g.x, y: g.y, frame: g.frame.name, tex: g.texture.key, flip: g.flipX });
        while (l.rastro.length > 1 && l.rastro[1].t <= ahora - RETRASO_SOMBRA) l.rastro.shift();
        const p = l.rastro[0];
        if (ahora - p.t < RETRASO_SOMBRA - 50) return; // todavía no sale
        if (!l.img) {
            l.img = scene.add.sprite(p.x, p.y, p.tex, p.frame).setScale(g.scaleX, g.scaleY).setTintFill(0x1a0830).setAlpha(0.75).setDepth(g.depth);
            scene.sound.play('aparece', { volume: 0.4, rate: 0.5 });
        }
        l.img.setTexture(p.tex, p.frame).setPosition(p.x, p.y).setFlipX(p.flip);
        // te alcanza si te detienes o vuelves: te empuja y te maldice (no quita vida)
        const s = l.img.getBounds();
        const cuerpo = new Phaser.Geom.Rectangle(s.centerX - 8, s.centerY - 12, 16, 24);
        if (choca(cuerpo, rGesi) && ahora > (l.toque || 0)) {
            l.toque = ahora + 1500;
            g.setVelocity((g.x >= s.centerX ? 1 : -1) * 200, -200); // lejos de la sombra
            scene.empujadoHasta = ahora + 250;
            maldecir(scene, api, ahora, '¡TE ALCANZÓ TU SOMBRA!');
        }
        if (ahora > l.fin) {
            l.terminada = true;
            scene.tweens.add({ targets: l.img, alpha: 0, duration: 400, onComplete: () => l.img.destroy() });
        }
    },
    gravedad(scene, l, api, { g, gx, ahora }) {
        const dentro = Math.abs(gx - l.x) < 150;
        if (!dentro) {
            if (l.dentro) { g.body.setGravityY(scene.gravedadBase); l.dentro = false; }
            return;
        }
        if (!l.dentro) {
            scene.gravedadBase ??= g.body.gravity.y;
            l.dentro = true;
            l.cambio = ahora + TURNO_GRAVEDAD;
            if (!l.avisado) { l.avisado = true; api.mostrarMensaje(scene, '¡GRAVEDAD LOCA!', 900); }
        }
        if (ahora > l.cambio) {
            l.liviana = !l.liviana;
            l.cambio = ahora + TURNO_GRAVEDAD;
            scene.sound.play('aparece', { volume: 0.25, rate: l.liviana ? 1.5 : 0.6 });
        }
        // liviana: saltos altos (zona azul); pesada: saltos cortos (zona roja)
        g.body.setGravityY(l.liviana ? scene.gravedadBase - 330 : scene.gravedadBase + 420);
        l.zona.setFillStyle(l.liviana ? 0x5ca8ff : 0xff5c5c, 0.09);
    },
    estatuaRoja(scene, l, api) {
        if (l.hecha || !l.cp.activo) return;
        l.hecha = true;
        l.ojos.destroy();
        scene.time.delayedCall(1300, () => api.mostrarMensaje(scene, 'ESTA SÍ ERA DE VERDAD :)', 1100));
    },
};

// controles invertidos por un rato (game.js lee scene.invertidoHasta)
function maldecir(scene, api, ahora, texto) {
    scene.invertidoHasta = ahora + INVERTIDO_MS;
    burla(scene, api, texto, 1100);
    const g = scene.mascotaGesi;
    g.setTint(0xc77dff);
    scene.time.delayedCall(INVERTIDO_MS, () => g.active && g.clearTint());
}

function lineasDeViento(scene, l, ms) {
    for (let i = 0; i < 6; i++) {
        const y = SUELO_Y - 20 - Math.random() * 120;
        const x0 = l.x - l.dir * 180;
        const linea = scene.add.rectangle(x0, y, 26, 1, 0xe8f4ff, 0.6).setDepth(PROFUNDIDAD);
        scene.tweens.add({ targets: linea, x: x0 + l.dir * 360, alpha: 0, delay: i * (ms / 8), duration: 500, onComplete: () => linea.destroy() });
    }
}

// ola y géiser: calma -> burbujas (aviso) -> sube -> baja
function cicloLava(scene, l, api, { gx, rGesi, ahora }) {
    const cerca = gx > l.a - 400 && gx < l.b + 400;
    if (l.fase === 'calma') {
        if (!cerca || ahora < l.hasta) return;
        l.fase = 'aviso';
        l.hasta = ahora + AVISO_LAVA;
        scene.tweens.add({ targets: l.luz, alpha: 0.7, yoyo: true, repeat: 2, duration: AVISO_LAVA / 6 });
        for (let i = 0; i < 6; i++) {
            const bx = l.tipo === 'ola' ? Phaser.Math.Between(l.a + 8, l.b - 8) : (l.a + l.b) / 2 + Phaser.Math.Between(-12, 12);
            const burbuja = scene.add.circle(bx, SUELO_Y + 6, 3, 0xffb347).setDepth(PROFUNDIDAD);
            scene.tweens.add({ targets: burbuja, y: SUELO_Y - 14, alpha: 0, delay: i * 90, duration: 380, onComplete: () => burbuja.destroy() });
        }
        if (!l.avisado) { l.avisado = true; api.mostrarMensaje(scene, l.tipo === 'ola' ? '¡OLA DE LAVA!' : '¡GÉISER!', 800); }
    } else if (l.fase === 'aviso') {
        if (ahora < l.hasta) return;
        l.fase = 'activa';
        l.hasta = ahora + ACTIVA_LAVA;
        scene.sound.play('romper', { volume: 0.3, rate: 0.7 });
        scene.tweens.add({ targets: l.lava, y: SUELO_Y + 30 - l.alto - 30, yoyo: true, hold: ACTIVA_LAVA - 300, duration: 150 });
    } else if (l.fase === 'activa') {
        if (choca(l.lava.getBounds(), rGesi)) api.killgesi(scene);
        if (ahora >= l.hasta) { l.fase = 'calma'; l.hasta = ahora + PAUSA_LAVA; }
    }
}

// igual a la roca de sorpresas.js (tiembla y cae al llegar cerca): se crea ya sobre ti
function crearRocaEn(scene, x) {
    const img = scene.cueva
        ? scene.add.image(x, -8, 'mz_stalactite5').setOrigin(0.5, 0).setScale(1.4).setTint(0xc8a0a0)
        : scene.add.image(x, 10, 'mz_bloque').setOrigin(0.5, 0).setScale(2.2).setTint(0xa08a8a);
    colgarRoca(scene, img);
    return { x, img, estado: null };
}

// remix de la runa: la primera vez las losas aparecen agrietadas y se rompen; hay que golpearla otra vez.
// Se llama desde activarRuna (game.js) después de que aparecen las losas.
export function engañoDeRuna(scene, runa, api) {
    if (!runa.tramposa) return;
    runa.tramposa = false;
    runa.losas.forEach(losa => losa.visuales.forEach(v => v.setTint(0xff9a7a)));
    scene.time.delayedCall(950, () => {
        runa.losas.forEach(losa => {
            losa.body.enable = false;
            losa.visuales.forEach(v => { v.setTint(0xffe9a8); scene.tweens.add({ targets: v, alpha: 0.22, duration: 200 }); });
        });
        scene.sound.play('romper');
        api.mostrarMensaje(scene, '¡JA! GOLPÉALA OTRA VEZ', 1100);
        // la runa vuelve a brillar
        runa.usado = false;
        runa.setTexture('misterio' + scene.sufijo).setTint(0xffd27a);
        runa.anims.play(`misterio${scene.sufijo}-brillo`, true);
    });
}
