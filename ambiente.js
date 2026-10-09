// Ambiente de terror: fondo con profundidad atmosférica, niebla en capas,
// partículas, oscuridad con luz de antorcha, brillo de la lava y relámpagos.
//
// Capas de atrás hacia adelante:
//   cielo (degradado) · estrellas · luna con halo · rayos de luz
//   montañas lejanas · niebla lejana · ruinas lejanas · niebla media · ruinas cercanas
//   [nivel: suelo, enemigos, personaje]
//   niebla alta · niebla del suelo · partículas · oscuridad · luz cálida y brillo de lava · HUD
//
// Lo lejano se ve más claro y del color de la niebla (perspectiva atmosférica),
// lo cercano más oscuro y con más contraste.
// Cada nivel puede tener 'oscuridad' (0 = nada, 1 = negro total fuera de la luz).
//
// La niebla cambia sola: a veces se despeja y luego se vuelve densa (ver cicloNiebla).
// La luz también: a veces todo se ilumina y otras se oscurece casi por completo (ver cicloLuz).
// En los niveles más altos la niebla densa aparece más seguido.

import { crearPaisaje, crearRuinas } from "./castillos.js"
import { crearFondoCueva, moverFondoCueva } from "./mazmorra.js"

const ANCHO = 790;
const ALTO = 380;
const SUELO_Y = 332;

// si el sistema pide menos movimiento: sin relámpagos ni titileo y menos partículas
const reducirMovimiento = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// paletas por tipo de nivel
const PALETAS = {
    afuera: {
        cielo: ['#03050c', '#0b1426', '#1d2c3f', '#33475a'],
        niebla: 0x8fa3bf,   // niebla fría azulada
        nieblaSuelo: 0x8fbf8a, // niebla verdosa de cementerio
        oscuridad: [3, 6, 16],
        particula: [0xcfe8c0, 0xa8c7ff],
        rayo: 0xb8c8ff,
    },
    cueva: {
        cielo: ['#020103', '#0b0608', '#1d0f0c', '#3a1a10'],
        niebla: 0xa08a80,   // humo cálido
        nieblaSuelo: 0x9fb092,
        oscuridad: [8, 4, 6],
        particula: [0xff8a3d, 0xffc06b, 0xff5a1f],
        rayo: 0xffb070,
    },
};

// mezcla dos colores: t = 0 -> a, t = 1 -> b
export function mezclar(a, b, t) {
    const c = (x, s) => (x >> s) & 0xff;
    const m = s => Math.round(c(a, s) + (c(b, s) - c(a, s)) * t);
    return (m(16) << 16) | (m(8) << 8) | m(0);
}

// mezcla un color con negro: factor 1 = igual, 0 = negro
export function oscurecer(color, factor) {
    return mezclar(0x000000, color, factor);
}

// fondo y nubes más oscuros en cada nivel
export function tinteOscuro(tinte, nivelIndice) {
    return oscurecer(tinte ?? 0xffffff, Math.max(0.35, 0.6 - nivelIndice * 0.04));
}

function lienzo(scene, clave, w, h, dibujar) {
    if (scene.textures.exists(clave)) return;
    const t = scene.textures.createCanvas(clave, w, h);
    dibujar(t.getContext(), w, h);
    t.refresh();
}

function crearTexturasAmbiente(scene) {
    let semilla = 3;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;

    // niebla: manchas suaves que se repiten sin cortes de lado a lado
    lienzo(scene, 'niebla', 512, 256, (ctx, w, h) => {
        // muchas manchas grandes y bastante opacas: la niebla se nota de verdad
        for (let i = 0; i < 150; i++) {
            const x = azar() * w, y = azar() * h, r = 40 + azar() * 80, a = 0.1 + azar() * 0.16;
            for (const dx of [-w, 0, w]) {
                const gr = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r);
                gr.addColorStop(0, `rgba(255,255,255,${a})`);
                gr.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = gr;
                ctx.fillRect(x + dx - r, y - r, r * 2, r * 2);
            }
        }
    });

    // banda de niebla: más espesa abajo y transparente arriba y abajo (sin bordes rectos)
    const banda = (clave, alto, perfil) => lienzo(scene, clave, 512, alto, (ctx, w, h) => {
        const fuente = scene.textures.get('niebla').getSourceImage();
        ctx.drawImage(fuente, 0, 0, w, h);
        ctx.drawImage(fuente, 0, 0, w, h);
        ctx.globalCompositeOperation = 'destination-in';
        const m = ctx.createLinearGradient(0, 0, 0, h);
        perfil.forEach(([p, a]) => m.addColorStop(p, `rgba(0,0,0,${a})`));
        ctx.fillStyle = m;
        ctx.fillRect(0, 0, w, h);
    });
    banda('niebla_baja', 140, [[0, 0], [0.55, 0.8], [1, 1]]);
    banda('niebla_banda', 200, [[0, 0], [0.45, 0.9], [0.8, 0.9], [1, 0]]);

    // oscuridad: color de noche con un agujero de luz en el centro (doble del tamaño de la pantalla)
    for (const [tipo, p] of Object.entries(PALETAS)) {
        const [r, g, b] = p.oscuridad;
        // 4 veces la pantalla: así cubre todo aunque el círculo de luz se achique (modo oscuro)
        lienzo(scene, `oscuridad_${tipo}`, ANCHO * 4, ALTO * 4, (ctx, w, h) => {
            const gr = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 430);
            gr.addColorStop(0, `rgba(${r},${g},${b},0)`);
            gr.addColorStop(0.22, `rgba(${r},${g},${b},0.04)`);
            gr.addColorStop(0.6, `rgba(${r},${g},${b},0.66)`);
            gr.addColorStop(1, `rgba(${r},${g},${b},1)`);
            ctx.fillStyle = gr;
            ctx.fillRect(0, 0, w, h);
        });
        // cielo: degradado vertical
        lienzo(scene, `cielo_${tipo}`, 4, ALTO, (ctx, w, h) => {
            const gr = ctx.createLinearGradient(0, 0, 0, h);
            p.cielo.forEach((c, i) => gr.addColorStop(i / (p.cielo.length - 1), c));
            ctx.fillStyle = gr;
            ctx.fillRect(0, 0, w, h);
        });
    }

    // brillo suave (luz de antorcha, halo de la luna, brillo de la lava, partículas)
    lienzo(scene, 'brillo', 128, 128, (ctx, w, h) => {
        const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(255,255,255,1)');
        gr.addColorStop(0.35, 'rgba(255,255,255,0.45)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
    });
    lienzo(scene, 'particula', 8, 8, (ctx) => {
        const gr = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
        gr.addColorStop(0, 'rgba(255,255,255,1)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, 8, 8);
    });

    // montañas en silueta (se repiten sin cortes) con árboles secos en la capa cercana
    const montanas = (clave, alto, picos, rugosidad, colorArriba, colorAbajo, arboles) => lienzo(scene, clave, 1024, alto, (ctx, w, h) => {
        // cresta con desplazamiento del punto medio; el primer y último punto coinciden
        let alturas = [h * 0.45, h * 0.45];
        let amp = h * 0.35;
        for (let n = 0; n < picos; n++) {
            const nuevas = [];
            for (let i = 0; i < alturas.length - 1; i++) {
                nuevas.push(alturas[i], (alturas[i] + alturas[i + 1]) / 2 + (azar() - 0.5) * amp);
            }
            nuevas.push(alturas[alturas.length - 1]);
            alturas = nuevas;
            amp *= rugosidad;
        }
        const paso = w / (alturas.length - 1);
        const gr = ctx.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, colorArriba);
        gr.addColorStop(1, colorAbajo);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(0, h);
        alturas.forEach((y, i) => ctx.lineTo(i * paso, Math.max(4, Math.min(h - 10, y))));
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        // árboles secos y retorcidos sobre la cresta
        for (let k = 0; k < arboles; k++) {
            const x = 30 + azar() * (w - 60);
            const i = Math.round(x / paso);
            const base = Math.max(4, Math.min(h - 10, alturas[i])) + 4;
            const alto = 30 + azar() * 45;
            ctx.strokeStyle = colorAbajo;
            ctx.lineCap = 'round';
            const rama = (x0, y0, largo, ang, grosor) => {
                if (grosor < 0.8 || largo < 4) return;
                const x1 = x0 + Math.cos(ang) * largo, y1 = y0 + Math.sin(ang) * largo;
                ctx.lineWidth = grosor;
                ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
                rama(x1, y1, largo * 0.68, ang - 0.45 - azar() * 0.35, grosor * 0.62);
                rama(x1, y1, largo * 0.62, ang + 0.35 + azar() * 0.4, grosor * 0.6);
            };
            rama(x, base, alto * 0.45, -Math.PI / 2 + (azar() - 0.5) * 0.3, 4 + azar() * 2);
        }
    });
    montanas('montanas_lejos', 220, 7, 0.55, '#2a3550', '#141c30', 0);
    montanas('montanas_cerca', 200, 7, 0.6, '#151b2a', '#06080f', 14);

    // luna con cráteres
    lienzo(scene, 'luna', 64, 64, (ctx) => {
        const gr = ctx.createRadialGradient(26, 26, 4, 32, 32, 30);
        gr.addColorStop(0, '#fbf8e8');
        gr.addColorStop(1, '#cfcab0');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(150,145,120,0.35)';
        [[22, 24, 6], [40, 36, 8], [30, 46, 4], [42, 20, 3]].forEach(([x, y, r]) => {
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        });
    });

    // estrellas (dos capas para que titilen alternadas)
    for (const k of [1, 2]) {
        lienzo(scene, `estrellas_${k}`, ANCHO, 220, (ctx, w, h) => {
            for (let i = 0; i < 70; i++) {
                const x = azar() * w, y = azar() * h * (0.3 + azar() * 0.7), t = azar();
                ctx.fillStyle = `rgba(220,230,255,${0.3 + t * 0.6})`;
                ctx.fillRect(x, y, t > 0.85 ? 2 : 1, t > 0.85 ? 2 : 1);
            }
        });
    }

    // rayo de luz: haz vertical suave que se desvanece hacia abajo
    lienzo(scene, 'rayo_luz', 120, 420, (ctx, w, h) => {
        const gh = ctx.createLinearGradient(0, 0, w, 0);
        gh.addColorStop(0, 'rgba(255,255,255,0)');
        gh.addColorStop(0.5, 'rgba(255,255,255,1)');
        gh.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gh;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'destination-in';
        const gv = ctx.createLinearGradient(0, 0, 0, h);
        gv.addColorStop(0, 'rgba(0,0,0,1)');
        gv.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gv;
        ctx.fillRect(0, 0, w, h);
    });
}

// banda de niebla entre capas del fondo (se mueve con su propia profundidad)
function bandaNiebla(scene, y, alto, color, alpha, factor, vel) {
    const capa = scene.add.tileSprite(0, y, ANCHO, alto, 'niebla_banda')
        .setOrigin(0).setScrollFactor(0).setTint(color).setAlpha(alpha);
    scene.capasNiebla.push({ capa, factor, vel, base: alpha });
    return capa;
}

// ---------- Fondo (se crea antes del nivel) ----------
export function crearFondoAtmosferico(scene, nivel, indice) {
    crearTexturasAmbiente(scene);
    const tipo = nivel.nubes ? 'afuera' : 'cueva';
    const p = PALETAS[tipo];
    const reducir = reducirMovimiento();
    const luz = Math.max(0.45, 0.85 - indice * 0.06); // cada nivel un poco más oscuro
    scene.capasNiebla = [];

    // cielo
    scene.add.image(0, 0, `cielo_${tipo}`).setOrigin(0).setDisplaySize(ANCHO, ALTO).setScrollFactor(0);

    if (tipo === 'afuera') {
        // estrellas que titilan
        const e1 = scene.add.image(0, 0, 'estrellas_1').setOrigin(0).setScrollFactor(0.02);
        const e2 = scene.add.image(0, 0, 'estrellas_2').setOrigin(0).setScrollFactor(0.03).setAlpha(0.5);
        if (!reducir) {
            scene.tweens.add({ targets: e1, alpha: 0.45, yoyo: true, repeat: -1, duration: 2300, ease: 'Sine.inOut' });
            scene.tweens.add({ targets: e2, alpha: 1, yoyo: true, repeat: -1, duration: 1700, ease: 'Sine.inOut' });
        }
        // luna con halo
        scene.add.image(610, 70, 'brillo').setScrollFactor(0.04).setScale(3.2).setTint(0x9fb4ff).setAlpha(0.22).setBlendMode('ADD');
        scene.add.image(610, 70, 'luna').setScrollFactor(0.04).setScale(0.9).setTint(mezclar(0xffffff, 0xc8d4ff, 0.3));
    }

    // rayos de luz (luna afuera, grietas del techo en la cueva)
    const rayos = tipo === 'afuera' ? [[560, -20, 0.38], [640, -20, 0.28], [700, -20, 0.45]] : [[180, -40, 0.12], [460, -40, -0.1], [700, -40, 0.15]];
    rayos.forEach(([x, y, ang], i) => {
        const r = scene.add.image(x, y, 'rayo_luz').setOrigin(0.5, 0).setRotation(ang).setScrollFactor(0.08 + i * 0.03)
            .setScale(1 + i * 0.3, 1).setTint(p.rayo).setAlpha(tipo === 'afuera' ? 0.07 : 0.05).setBlendMode('ADD');
        if (!reducir) scene.tweens.add({ targets: r, alpha: r.alpha * 0.4, yoyo: true, repeat: -1, duration: 3000 + i * 900, ease: 'Sine.inOut' });
    });

    if (tipo === 'afuera') {
        if (nivel.fondo === 'montanas') {
            // montañas en silueta: las lejanas azuladas y las cercanas casi negras con árboles secos
            scene.capasMontanas = [
                { capa: scene.add.tileSprite(0, 125, ANCHO, 220, 'montanas_lejos').setOrigin(0).setScrollFactor(0), factor: 0.08 },
                { capa: scene.add.tileSprite(0, 175, ANCHO, 200, 'montanas_cerca').setOrigin(0).setScrollFactor(0), factor: 0.16 },
            ];
        } else {
            // montañas lejanas, casi del color de la niebla
            crearPaisaje(scene, nivel, mezclar(oscurecer(0x7f8fc4, 0.3 * luz), p.niebla, 0.18));
        }
        // nubes oscuras lejanas
        for (let x = 200, i = 0; x < nivel.ancho * 0.25 + 900; x += 420, i++) {
            scene.add.image(x, i % 2 ? 95 : 55, 'cloud1').setScale(0.3 + (i % 3) * 0.06).setScrollFactor(0.2)
                .setAlpha(0.35).setTint(mezclar(0x30364a, p.niebla, 0.2));
        }
    } else {
        // cueva de la mazmorra en capas: fondo, columnas de roca, bruma, techo y suelo de estalagmitas
        crearFondoCueva(scene, mezclar(oscurecer(nivel.tinte ?? 0xffffff, 0.75 * luz), 0x3a1a10, 0.25));
    }

    // niebla lejana, ruinas lejanas, niebla media, ruinas cercanas
    bandaNiebla(scene, 150, 200, p.niebla, tipo === 'afuera' ? 0.28 : 0.38, 0.2, 0.006);
    crearRuinas(scene, nivel, indice, mezclar(oscurecer(0x9a9aae, 0.35 * luz), p.niebla, 0.45),
        { factor: 0.3, escala: [0.32, 0.5], semilla: 1, paso: [150, 330], base: -18, alpha: 0.85 });
    bandaNiebla(scene, 190, 200, p.niebla, tipo === 'afuera' ? 0.22 : 0.3, 0.4, 0.012);
    crearRuinas(scene, nivel, indice, mezclar(oscurecer(0x9a9aae, 0.55 * luz), p.niebla, 0.12),
        { factor: 0.55, escala: [0.55, 0.9], semilla: 2, paso: [300, 620] });
}

// ---------- Adelante del nivel ----------
export function crearAmbiente(scene, nivel, nivelIndice, lavaExtra = []) {
    crearTexturasAmbiente(scene);
    const tipo = nivel.nubes ? 'afuera' : 'cueva';
    const p = PALETAS[tipo];
    const reducir = reducirMovimiento();
    const oscuridad = nivel.oscuridad ?? Math.min(0.9, 0.62 + nivelIndice * 0.055);
    scene.capasNiebla = scene.capasNiebla || [];

    // niebla general suave sobre todo
    scene.nieblaAlta = scene.add.tileSprite(0, 0, ANCHO, ALTO, 'niebla')
        .setOrigin(0).setScrollFactor(0).setDepth(30).setAlpha(0.22).setTint(p.niebla);

    // niebla a ras del suelo (se puede ver a través para no esconder del todo los peligros)
    scene.nieblaBaja = scene.add.tileSprite(0, ALTO - 140, ANCHO, 140, 'niebla_baja')
        .setOrigin(0).setScrollFactor(0).setDepth(31).setAlpha(0.6).setTint(p.nieblaSuelo);

    // partículas: brasas que suben en la cueva, polvo y esporas afuera
    const frecuencia = reducir ? 400 : (tipo === 'cueva' ? 110 : 170);
    scene.particulas = scene.add.particles(0, 0, 'particula', tipo === 'cueva' ? {
        x: { min: 0, max: ANCHO }, y: ALTO + 5,
        speedY: { min: -55, max: -18 }, speedX: { min: -12, max: 12 },
        lifespan: { min: 4000, max: 7000 }, scale: { start: 0.9, end: 0.1 },
        alpha: { start: 0.9, end: 0 }, tint: p.particula, blendMode: 'ADD', frequency: frecuencia,
    } : {
        x: { min: -20, max: ANCHO }, y: { min: 40, max: ALTO },
        speedX: { min: 4, max: 18 }, speedY: { min: -8, max: 6 },
        lifespan: { min: 5000, max: 9000 }, scale: { start: 0.7, end: 0.2 },
        alpha: { start: 0.5, end: 0 }, tint: p.particula, blendMode: 'ADD', frequency: frecuencia,
    }).setScrollFactor(0).setDepth(32);

    // oscuridad del color de la noche, con luz alrededor del personaje
    // pared de niebla que solo se ve cuando la niebla está densa
    scene.nieblaDensa = scene.add.tileSprite(0, 0, ANCHO, ALTO, 'niebla')
        .setOrigin(0).setScrollFactor(0).setDepth(33).setAlpha(0).setTint(p.niebla).setTileScale(1.6);

    scene.oscuridad = scene.add.image(0, 0, `oscuridad_${tipo}`)
        .setScrollFactor(0).setDepth(40).setAlpha(oscuridad);
    scene.oscuridadBase = oscuridad;

    cicloNiebla(scene, nivelIndice);
    cicloLuz(scene, nivelIndice, oscuridad);

    // luz cálida de antorcha alrededor del personaje
    scene.luzCalida = scene.add.image(0, 0, 'brillo').setDepth(41).setScale(2.6)
        .setTint(0xff9a40).setAlpha(0.16).setBlendMode('ADD');

    // la lava brilla a través de la oscuridad: siempre se ve dónde está el peligro
    [...(nivel.lava || []), ...(nivel.falsos || []), ...lavaExtra].forEach(([x0, x1]) => {
        const ancho = x1 - x0;
        const brillo = scene.add.image(x0 + ancho / 2, SUELO_Y + 30, 'brillo').setDepth(41)
            .setDisplaySize(ancho * 1.5 + 60, 190).setTint(0xff5a1f).setAlpha(0.42).setBlendMode('ADD');
        if (!reducir) scene.tweens.add({ targets: brillo, alpha: 0.26, yoyo: true, repeat: -1, duration: 900 + Math.random() * 700, ease: 'Sine.inOut' });
    });

    // relámpagos en los niveles al aire libre (no si el sistema pide reducir movimiento)
    if (nivel.nubes && !reducir) {
        const relampago = () => {
            scene.cameras.main.flash(110, 90, 105, 150);
            scene.time.delayedCall(Phaser.Math.Between(250, 700), () => scene.sound.play('trueno', { volume: 0.55 }));
            scene.time.delayedCall(200, () => scene.cameras.main.flash(80, 60, 70, 110));
            scene.time.delayedCall(Phaser.Math.Between(8000, 16000), relampago);
        };
        scene.time.delayedCall(Phaser.Math.Between(4000, 9000), relampago);
    }
}

// ---------- Niebla que cambia: despejada, normal y densa ----------
// despejada = sin nada de niebla; cada nivel (y cada intento) empieza despejado
const ESTADOS_NIEBLA = { despejada: 0, normal: 1, densa: 2 };

function cicloNiebla(scene, nivelIndice) {
    // cada nivel (y cada intento) empieza despejado, sin niebla; la niebla llega después
    scene.estadoNiebla = { v: 0, nombre: 'despejada' };
    const probDensa = Math.min(0.6, 0.3 + 0.06 * nivelIndice); // más niebla densa en niveles altos

    const cambiar = () => {
        if (!scene.sys.isActive()) return;
        const actual = scene.estadoNiebla.nombre;
        // nunca repite el mismo estado dos veces seguidas
        let siguiente;
        if (actual === 'densa') siguiente = Math.random() < 0.6 ? 'despejada' : 'normal';
        else if (actual === 'despejada') siguiente = Math.random() < probDensa + 0.25 ? 'densa' : 'normal';
        else siguiente = Math.random() < probDensa ? 'densa' : 'despejada';

        scene.estadoNiebla.nombre = siguiente;
        scene.tweens.add({ targets: scene.estadoNiebla, v: ESTADOS_NIEBLA[siguiente], duration: Phaser.Math.Between(3500, 5000), ease: 'Sine.inOut' });
        if (siguiente === 'densa') {
            scene.mostrarMensajeCorto?.('La niebla se espesa...');
            scene.sound.play('viento', { volume: 0.4 });
        }
        scene.time.delayedCall(Phaser.Math.Between(10000, 22000), cambiar);
    };
    scene.time.delayedCall(Phaser.Math.Between(8000, 14000), cambiar);
}

// ---------- Luz que cambia: iluminado, normal y oscuro ----------
// alpha: qué tan oscuro está lejos del personaje; radio: tamaño del círculo de luz
function cicloLuz(scene, nivelIndice, oscuridadNormal) {
    const ESTADOS = {
        iluminado: { alpha: 0.12, radio: 2.3 },
        normal: { alpha: oscuridadNormal, radio: 1 },
        oscuro: { alpha: 0.97, radio: 0.55 },
    };
    scene.estadoLuz = { ...ESTADOS.normal, nombre: 'normal' };
    const probOscuro = Math.min(0.6, 0.3 + 0.06 * nivelIndice); // más oscuridad en niveles altos

    const cambiar = () => {
        if (!scene.sys.isActive()) return;
        const actual = scene.estadoLuz.nombre;
        let siguiente;
        if (actual === 'oscuro') siguiente = Math.random() < 0.6 ? 'iluminado' : 'normal';
        else if (actual === 'iluminado') siguiente = Math.random() < probOscuro + 0.25 ? 'oscuro' : 'normal';
        else siguiente = Math.random() < probOscuro ? 'oscuro' : 'iluminado';

        scene.estadoLuz.nombre = siguiente;
        scene.tweens.add({
            targets: scene.estadoLuz, ...ESTADOS[siguiente],
            duration: Phaser.Math.Between(3000, 4500), ease: 'Sine.inOut',
        });
        if (siguiente === 'oscuro') {
            scene.mostrarMensajeCorto?.('Se apagan las luces...');
            scene.sound.play('apagon', { volume: 0.45 });
        }
        scene.time.delayedCall(Phaser.Math.Between(9000, 18000), cambiar);
    };
    scene.time.delayedCall(Phaser.Math.Between(12000, 18000), cambiar);
}

// cuánto se ve cada capa según la intensidad v (0 = despejada, 1 = normal, 2 = densa)
const subir = (v, normal, densa) => v <= 1 ? normal * v : normal + (densa - normal) * Math.min(1, v - 1);

function aplicarNiebla(scene) {
    const v = scene.estadoNiebla ? scene.estadoNiebla.v : 1;
    scene.capasNiebla.forEach(({ capa, base }) => capa.setAlpha(Math.min(0.9, base * v)));
    scene.nieblaAlta.setAlpha(subir(v, 0.25, 0.5));
    scene.nieblaBaja.setAlpha(subir(v, 0.55, 0.85));
    scene.nieblaDensa.setAlpha(subir(v, 0.2, 0.6));
    // con niebla densa todo se ve un poco más oscuro; despejada, un poco más claro
    const luz = scene.estadoLuz;
    scene.oscuridad.setAlpha(Phaser.Math.Clamp(luz.alpha + (v - 1) * 0.06, 0, 0.97));
}

export function actualizarAmbiente(scene, time, objetivo) {
    if (!scene.oscuridad) return;
    const cam = scene.cameras.main;
    aplicarNiebla(scene);
    scene.nieblaDensa.tilePositionX = cam.scrollX * 0.7 + time * 0.02;
    scene.capasNiebla.forEach(({ capa, factor, vel }) => { capa.tilePositionX = cam.scrollX * factor + time * vel; });
    (scene.capasMontanas || []).forEach(({ capa, factor }) => { capa.tilePositionX = cam.scrollX * factor; });
    moverFondoCueva(scene, time);
    scene.nieblaAlta.tilePositionX = cam.scrollX * 0.5 + time * 0.012;
    scene.nieblaBaja.tilePositionX = cam.scrollX * 1.1 + time * 0.03;
    scene.nieblaBaja.y = ALTO - 140 + Math.sin(time / 1500) * 5; // sube y baja suavemente

    // la luz sigue al personaje (con un leve parpadeo, como una antorcha)
    const parpadeo = 1 + Math.sin(time / 90) * 0.012 + Math.sin(time / 37) * 0.008;
    const radio = scene.estadoLuz.radio;
    scene.oscuridad.setPosition(objetivo.x - cam.scrollX, objetivo.y - cam.scrollY + 10).setScale(parpadeo * radio);
    scene.luzCalida.setPosition(objetivo.x, objetivo.y + 8).setScale(2.6 * parpadeo * Math.sqrt(radio));
}

// ---------- Pantalla de selección de personaje ----------
export function crearNieblaSeleccion(scene) {
    crearTexturasAmbiente(scene);
    scene.capasNiebla = [];
    scene.add.image(0, 0, 'cielo_afuera').setOrigin(0).setDisplaySize(ANCHO, ALTO).setDepth(-2);
    scene.add.image(0, 0, 'estrellas_1').setOrigin(0).setDepth(-2);
    scene.add.image(700, 28, 'brillo').setScale(2).setTint(0x9fb4ff).setAlpha(0.22).setBlendMode('ADD').setDepth(-2);
    scene.add.image(700, 28, 'luna').setScale(0.5).setDepth(-2);
    scene.nieblaAlta = scene.add.tileSprite(0, 150, ANCHO, 200, 'niebla_banda').setOrigin(0).setAlpha(0.35).setTint(0x8fa3bf);
    scene.nieblaBaja = scene.add.tileSprite(0, ALTO - 140, ANCHO, 140, 'niebla_baja').setOrigin(0).setAlpha(0.6).setTint(0x8fbf8a);
    scene.add.particles(0, 0, 'particula', {
        x: { min: -20, max: ANCHO }, y: { min: 40, max: ALTO }, speedX: { min: 4, max: 16 }, speedY: { min: -8, max: 6 },
        lifespan: { min: 5000, max: 9000 }, scale: { start: 0.7, end: 0.2 }, alpha: { start: 0.5, end: 0 },
        tint: [0xcfe8c0, 0xa8c7ff], blendMode: 'ADD', frequency: reducirMovimiento() ? 500 : 220,
    });
}

export function moverNieblaSeleccion(scene, time) {
    if (!scene.nieblaAlta) return;
    scene.nieblaAlta.tilePositionX = time * 0.015;
    scene.nieblaBaja.tilePositionX = time * 0.035;
}
