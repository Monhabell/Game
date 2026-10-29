// LUZ de los niveles oscuros (personalidades Cuevas, Embrujado y Pesadilla de los niveles infinitos).
//
// Es luz "falsa", liviana para el celular (al estilo de la luz 2D de Godot): una capa a media resolución
// que se MULTIPLICA con la escena. La capa es azul de noche (lo lejano queda en penumbra, se ven las
// siluetas) y cada luz pinta en ella un círculo de su color (naranja de fuego): lo que está cerca de una
// luz se TIÑE de ese color, como la luz de verdad. Como mucho LUCES_MAX luces a la vez (las más cercanas
// que se ven). Nada de luces calculadas por píxel ni sombras proyectadas.
//   🔦 tu ANTORCHA: alumbra alrededor tuyo y se va gastando; cuando se acaba, casi no ves.
//   🔥 BRASEROS: repartidos por el nivel; al pasar junto a uno se enciende (queda prendido, alumbra
//      su zona) y te recarga la antorcha.
//   La lava y las antorchas de las paredes también alumbran.
//   👻 ENEMIGOS SOMBRA (Embrujado y Pesadilla): algunos enemigos solo se ven cuando les llega la luz.
//   ☀️ RAYOS de luz que entran por las grietas de los techos de los sótanos.
// Además, en todos los niveles con estilo medieval: una SOMBRA bajo el personaje y los enemigos que se ven.
//
// nivel.luz (niveles.js, bosque_troll.js, criptas_troll.js): { oscuridad, sombras, sinGasto }
//   sinGasto: la antorcha no se gasta (y no hay barra): la Noche del Troll
// nivel.braseros: [x, …] (sobre el suelo)
// De afuera (troll.js): scene.lucesExtra() → [{ x, y, r, color, fuerza }] luces que cambian (las antorchas
// encendidas, el altar) y scene.luzOscurecer (0 a 1): más oscuro (el apagón del troll, las catacumbas)
//
// MODO TÚNEL (todos los demás niveles): si el nivel no es oscuro pero tiene túneles, sótanos o pisos de
// losas (zonasTunel), la misma oscuridad aparece SOLO bajo techo: al entrar se oscurece en ~0,5 s y te
// queda la luz de tu antorcha (que en los túneles no se gasta); al salir vuelve a aclararse. Adentro hay
// antorchas en la pared cada tanto y los rayos de las grietas del techo. Cuanto más alto el nivel, más
// oscuro (de penumbra a casi negro).

import { SUELO_Y } from "./alcance.js"

const ANCHO = 790, ALTO = 380;   // la pantalla, en las medidas de los objetos fijos (como ambiente.js)
const RESOLUCION_CAPA = 0.5;    // la oscuridad se dibuja a media resolución (y se agranda): más liviano
const LUCES_MAX = 6;            // círculos de luz a la vez (el tuyo incluido)
const ANTORCHA_MS = 55000;      // lo que dura la antorcha llena
const RADIO_ANTORCHA = [110, 300]; // radio de tu luz (antorcha vacía, llena)
const RADIO_BRASERO = 300, RADIO_LAVA = 190, RADIO_PARED = 210;
const CERCA_BRASERO = 55;
const REDIBUJAR_MS = 33;        // la capa se repinta ~30 veces por segundo (no en cada cuadro)
const ENTRA_TUNEL_MS = 500;     // lo que tarda en oscurecerse (o aclararse) al entrar (o salir) de un túnel
const ANTORCHA_TUNEL = 520;     // px entre las antorchas de la pared dentro de un túnel

// los lugares bajo techo de un nivel: [x0, x1, abajo] (abajo: donde termina el techo)
export function zonasTunel(nivel) {
    return [
        ...(nivel.techos || []).map(([a, b, abajo]) => [a, b, abajo]),
        ...(nivel.losas || []).map(([a, b, arriba, grosor]) => [a, b, arriba + (grosor ?? 30)]),
    ].filter(([a, b]) => b - a >= 200);
}

// indice: el número de nivel (los túneles son más oscuros en los niveles altos)
export function crearLuz(scene, nivel, resolucion, indice = 0) {
    scene.luz = null;
    scene.sombrasPj = scene.add.graphics().setDepth(32.9); // (sombras bajo los pies: detrás de los personajes)
    const tuneles = nivel.luz ? [] : zonasTunel(nivel);
    if (!nivel.luz && !tuneles.length) return;
    texturas(scene);
    const config = nivel.luz || { oscuridad: Math.min(0.95, 0.82 + indice * 0.0004), sinGasto: true }; // (como las catacumbas; casi negro en los niveles altos)
    if (nivel.luz) {
        // la oscuridad de siempre (ambiente.js) se apaga: esta la reemplaza. Y la niebla también: debajo de
        // la luz blanquea todo y la noche se ve lechosa, sin contraste
        scene.oscuridad?.setVisible(false);
        [...(scene.capasNiebla || []).map(c => c.capa), scene.nieblaDensa, scene.nieblaAlta, scene.nieblaBaja].forEach(o => o?.setVisible(false));
    }
    const w = Math.ceil(ANCHO * RESOLUCION_CAPA), h = Math.ceil(ALTO * RESOLUCION_CAPA);
    const capa = scene.add.renderTexture(0, 0, w, h).setOrigin(0).setScrollFactor(0).setDepth(40).setScale(1 / RESOLUCION_CAPA)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
    // el pincel suma su color sobre la noche (más luces juntas: más claro)
    const pincel = scene.make.image({ key: 'luz_pincel', add: false }).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD);
    // el resplandor naranja de tu antorcha (por encima de la oscuridad, sumando luz)
    const calida = scene.add.image(0, 0, 'brillo').setDepth(41).setTint(0xff9a3d).setBlendMode('ADD');
    scene.luzCalida?.setVisible(false); // (la de ambiente.js: esta la reemplaza)
    // luces fijas: braseros, lava y antorchas de las paredes
    const fijas = [];
    (nivel.lava || []).forEach(([a, b]) => { for (let x = a + 60; x < b; x += 220) fijas.push({ x, y: SUELO_Y - 10, r: RADIO_LAVA, color: 0xff6a2a, fuerza: 0.9 }); });
    (nivel.antorchas || []).forEach(([x, y]) => fijas.push({ x, y, r: RADIO_PARED, color: 0xffa050, fuerza: 0.8 }));
    const braseros = (nivel.braseros || []).map(x => {
        const palo = scene.add.rectangle(x, SUELO_Y, 8, 46, 0x4a3420).setOrigin(0.5, 1).setDepth(3);
        const fuego = scene.add.image(x, SUELO_Y - 46, 'cr_torch').setOrigin(0.5, 1).setScale(1.3).setDepth(3.1).setTint(0x555566);
        const brillo = scene.add.image(x, SUELO_Y - 60, 'brillo').setDepth(41).setScale(4.2).setTint(0xff9a3d).setBlendMode('ADD').setAlpha(0);
        const luz = { x, y: SUELO_Y - 50, r: 0, color: 0xff9a40, fuerza: 1 };
        fijas.push(luz);
        return { x, palo, fuego, brillo, luz, prendido: false };
    });
    // túneles: antorchas en la pared cada tanto (las primeras, a la entrada)
    tuneles.forEach(([a, b, abajo]) => {
        for (let x = a + 140; x < b - 60; x += ANTORCHA_TUNEL) {
            if ((nivel.agua || []).some(([a0, a1]) => x > a0 - 20 && x < a1 + 20)) continue; // (bajo el agua no hay antorchas)
            const y = Math.min(SUELO_Y - 90, abajo + 50);
            scene.add.image(x, y, 'cr_torch').setOrigin(0.5, 1).setDepth(2).setScale(0.9);
            fijas.push({ x, y: y - 14, r: RADIO_PARED * 0.85, color: 0xffa050, fuerza: 0.8 });
        }
    });
    // rayos de luz por las grietas de los techos (los sótanos y túneles)
    (nivel.techos || []).forEach(([a, b, abajo]) => {
        for (let x = a + 160; x < b - 100; x += 380) {
            scene.add.image(x, abajo, 'luz_rayo').setOrigin(0.5, 0).setDisplaySize(70, SUELO_Y - abajo + 10).setDepth(41).setBlendMode('ADD').setAlpha(0.35);
            fijas.push({ x, y: (abajo + SUELO_Y) / 2, r: 90, color: 0xfff0c8, fuerza: 0.6 });
        }
    });
    // la barra de la antorcha (arriba a la izquierda, debajo de los corazones)
    const barra = scene.add.text(ANCHO / 2, 44, '', { fontSize: '11px', fontStyle: '700', color: '#ffc94a', stroke: '#000', strokeThickness: 3 })
        .setOrigin(0.5).setScrollFactor(0).setDepth(50);
    // (penumbra azul: lo lejano se ve como siluetas, no negro)
    const n = Math.min(200, Math.round(38 + 255 * (1 - config.oscuridad) * 1.6));
    const noche = Phaser.Display.Color.GetColor(Math.round(n * 0.5), Math.round(n * 0.62), Math.min(255, Math.round(n * 1.15)));
    scene.luz = { nivel, capa, pincel, calida, fijas, braseros, barra, noche, sinGasto: !!config.sinGasto, antorcha: 1, oscuridad: config.oscuridad, sombras: !!config.sombras,
        resolucion, ultimo: 0, avisoVacia: false,
        tuneles: tuneles.length ? tuneles : null, adentro: tuneles.length ? 0 : 1 }; // (adentro: 0 afuera … 1 bajo techo)
    if (tuneles.length) { capa.setAlpha(0).setVisible(false); calida.setAlpha(0); }
}

function texturas(scene) {
    if (scene.textures.exists('luz_pincel')) return;
    // el pincel: un círculo blanco que se desvanece (lo que se "borra" de la oscuridad)
    const t = scene.textures.createCanvas('luz_pincel', 256, 256);
    const ctx = t.getContext();
    const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    // (caída suave, como la luz de verdad: fuerte en el centro y larga hacia afuera)
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.4)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    t.refresh();
    // un rayo de luz vertical que se desvanece hacia abajo y a los lados
    const r = scene.textures.createCanvas('luz_rayo', 64, 256);
    const c2 = r.getContext();
    const v = c2.createLinearGradient(0, 0, 0, 256);
    v.addColorStop(0, 'rgba(255,230,170,0.9)');
    v.addColorStop(1, 'rgba(255,230,170,0)');
    c2.fillStyle = v;
    c2.fillRect(16, 0, 32, 256);
    r.refresh();
}

export function actualizarLuz(scene, time, delta) {
    pintarSombras(scene);
    const L = scene.luz;
    if (!L) return;
    const g = scene.mascotaGesi;
    const vivo = g && !g.isDead && !scene.nivelTerminado;
    // la antorcha se gasta (no en el Juicio ni muerto)
    if (vivo && !L.sinGasto) L.antorcha = Math.max(0, L.antorcha - delta / ANTORCHA_MS);
    // braseros: se encienden al pasar y recargan la antorcha
    if (vivo) L.braseros.forEach(b => {
        if (Math.abs(g.body.center.x - b.x) > CERCA_BRASERO || Math.abs(g.body.bottom - SUELO_Y) > 60) return;
        if (L.antorcha < 0.98) { L.antorcha = 1; L.avisoVacia = false; scene.sound.play('punto_control', { volume: 0.3, rate: 1.6 }); }
        if (!b.prendido) {
            b.prendido = true;
            b.fuego.clearTint();
            b.brillo.setAlpha(0.55);
            b.luz.r = RADIO_BRASERO;
            scene.tweens.add({ targets: b.brillo, alpha: 0.4, scale: 3.9, yoyo: true, repeat: -1, duration: 260 + Math.random() * 200 });
        }
    });
    if (vivo && L.antorcha <= 0 && !L.avisoVacia) { L.avisoVacia = true; scene.mostrarMensajeCorto?.('🔦 ¡SE APAGÓ LA ANTORCHA! Busca un brasero'); }
    const lleno = Math.round(L.antorcha * 8);
    const texto = L.sinGasto ? '' : `🔦 ${'▮'.repeat(lleno)}${'▯'.repeat(8 - lleno)}`;
    if (L.barra.text !== texto) L.barra.setText(texto).setColor(L.antorcha < 0.2 ? '#ff6b6b' : '#ffc94a');

    // modo túnel: la oscuridad va y viene al entrar y salir de abajo de un techo
    if (L.tuneles) {
        const cx = g?.body?.center.x ?? 0, arriba = g?.body?.top ?? 0;
        const bajoTecho = !!g && L.tuneles.some(([a, b, abajo]) => cx > a && cx < b && arriba > abajo - 20);
        L.adentro = Phaser.Math.Clamp(L.adentro + (bajoTecho ? 1 : -1) * delta / ENTRA_TUNEL_MS, 0, 1);
        L.capa.setVisible(L.adentro > 0).setAlpha(L.adentro);
        if (L.adentro <= 0) { L.calida.setAlpha(0); return; } // (afuera no se dibuja nada: no gasta)
    }
    if (time - L.ultimo < REDIBUJAR_MS) return;
    L.ultimo = time;
    const cam = scene.cameras.main, z = cam.zoom / L.resolucion, k = RESOLUCION_CAPA;
    const enPantalla = (x, y) => [(x - cam.scrollX) * z * k, (y - cam.scrollY) * z * k];
    const v = cam.worldView;
    // tu luz (con un parpadeo de llama) y las fijas más cercanas que se ven
    const parpadeo = 1 + Math.sin(time / 80) * 0.03 + Math.sin(time / 33) * 0.02;
    // (más oscuro: el apagón del troll achica tu luz y apaga la noche)
    const oscurecer = Phaser.Math.Clamp(scene.luzOscurecer || 0, 0, 1);
    const radioTuyo = (RADIO_ANTORCHA[0] + (RADIO_ANTORCHA[1] - RADIO_ANTORCHA[0]) * L.antorcha) * parpadeo * (1 - 0.45 * oscurecer) * (L.tuneles ? 0.72 : 1); // (en los túneles, tu luz es más chica)
    const luces = g ? [{ x: g.body?.center.x ?? g.x, y: g.body?.center.y ?? g.y, r: radioTuyo, color: 0xffc27a, fuerza: 0.55 + 0.45 * L.antorcha }] : [];
    [...L.fijas, ...(scene.lucesExtra?.() || [])].filter(f => f.r > 0 && f.x > v.x - f.r && f.x < v.right + f.r && f.y > v.y - f.r && f.y < v.bottom + f.r)
        .sort((a, b) => Math.abs(a.x - luces[0]?.x) - Math.abs(b.x - luces[0]?.x))
        .slice(0, LUCES_MAX - 1).forEach(f => luces.push(f));
    L.luces = luces;
    const noche = oscurecer ? Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(L.noche), Phaser.Display.Color.ValueToColor(0x05060f), 100, Math.round(oscurecer * 100)) : null;
    L.capa.clear().fill(noche ? Phaser.Display.Color.GetColor(noche.r, noche.g, noche.b) : L.noche, 1);
    luces.forEach(l => {
        const [sx, sy] = enPantalla(l.x, l.y);
        const radio = l.r * z * k;
        L.pincel.setScale((radio * 2) / 256).setTint(l.color).setAlpha(l.fuerza);
        L.capa.draw(L.pincel, sx - radio, sy - radio);
    });
    // la luz cálida de la antorcha (naranja) sobre tu personaje y la de los braseros: el contraste
    // cálido / frío es lo que se siente como luz de verdad
    if (g && L.calida) L.calida.setPosition(luces[0].x, luces[0].y - 6).setScale(radioTuyo / 160).setAlpha((0.12 + 0.12 * L.antorcha) * L.adentro);
    // enemigos sombra: solo se ven con luz
    if (L.sombras) scene.enemies.getChildren().forEach(e => {
        if (!e.active || e.isDead || !e.body) return;
        if (e.esSombra === undefined) e.esSombra = (e.redId ?? Math.round(e.x)) % 3 === 0;
        if (!e.esSombra) return;
        const cx = e.body.center.x, cy = e.body.center.y;
        const alumbrado = luces.some(l => Math.hypot(l.x - cx, l.y - cy) < l.r * 0.8);
        e.setAlpha(alumbrado ? 1 : 0.05);
        if (!e.tinteSombra) { e.tinteSombra = true; e.setTint(0x8a6aff); }
    });
}

// una sombra ovalada bajo el personaje y los enemigos que se ven (un solo dibujo por cuadro)
function pintarSombras(scene) {
    const s = scene.sombrasPj;
    if (!s) return;
    s.clear();
    const v = scene.cameras.main.worldView;
    const sombra = (cx, pie, ancho) => {
        // (más chica y clara si está en el aire: se busca el piso de abajo, a lo sumo 80 px)
        s.fillStyle(0x000000, 0.35).fillEllipse(cx, pie, ancho, ancho * 0.22);
    };
    const g = scene.mascotaGesi;
    if (g?.body && !g.isDead && (g.body.blocked.down || g.body.touching.down)) sombra(g.body.center.x, g.body.bottom, 34);
    scene.enemies?.getChildren().forEach(e => {
        const b = e.body;
        if (!e.active || e.isDead || !b || !e.visible || e.alpha < 0.3 || !b.blocked.down) return;
        if (b.center.x < v.x - 40 || b.center.x > v.right + 40) return;
        sombra(b.center.x, b.bottom, Math.min(70, b.width * 1.3));
    });
}
