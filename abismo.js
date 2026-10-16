// Las Ruinas del Abismo: lo que solo existe en este mapa. Se usa en todos los modos:
//   - nivel 7 de la historia (niveles.js), solo o en Aventura en cadena (con sus tramos de equipo)
//   - pista de carrera (pistas.js)
//   - arena de duelo y por equipos (arena.js: tablones frágiles y dos portales)
// Las zonas están en tramos.js; nivel.abismo = true activa este módulo.
//
// Visual (moderado, sin texturas nuevas: gráficos y el 'brillo' de ambiente.js):
//   - dos capas extra de fondo con parallax: volcanes lejanos con su resplandor y ruinas
//     (torres rotas, arcos, columnas) más cerca, por delante de las montañas de ambiente.js
//   - el puente de la zona 2: postes y cuerdas (la del tramo roto cuelga cortada)
//   - grietas en los tablones frágiles (la pista) y grietas de mentira en losas firmes
//   - la caverna de la zona 3: boca de roca, penumbra (solo visual: nunca tapa lo que mata) y luz
//     cálida en la salida
//   - brillo de lava que se escapa por las juntas de las losas falsas de los tríos
//   - el Portal de la meta: arco de piedra, remolino y una columna de luz que se ve desde lejos
//
// Mecanismos (cada uno con estados claros; los que tienen ritmo usan un reloj compartido, así van
// a la vez en todas las pantallas: el de la carrera, o en línea el del anfitrión):
//   aplastadores [x, ciclo, desfase]   espera → aviso (0,6 s: polvo, runas rojas, baja un poco)
//                                       → golpe (mata) → abajo (mata) → sube (inofensivo)
//   portales [x, pie, saltoX, llegadaY, abierto, cerrado]
//                                       cerrado → abriéndose (parpadea) → abierto (te lleva)
//                                       → cerrándose (parpadea, todavía sirve) → cerrado
//                                       Atados en el mismo teclado, el compañero cruza contigo; atados en
//                                       línea, el portal está SELLADO (separaría la cadena)
//   murosAbismo [xActiva, xFin]         dormido → aviso (1 s, temblor) → persigue (165 px/s,
//                                       tocarlo es caer) → se deshace al llegar a xFin
//
// api (la da game.js): { killgesi(scene), mensaje(scene, texto, ms) }

import { carreraActiva } from "./carrera.js"

const SUELO_Y = 332;
const PROF = 36; // por delante del personaje (34) y detrás de la oscuridad (40)

const APLASTADOR_ANCHO = 64;
const APLASTADOR = { aviso: 600, golpe: 120, abajo: 380, sube: 900 }; // ms (lo que sobra del ciclo: espera)
const PORTAL_CAMBIO = 400;      // ms que parpadea al abrirse o cerrarse
const PORTAL_ESPERA = 700;      // ms sin volver a usar un portal después de cruzarlo
const MURO_DETRAS = 520;        // px detrás de donde se activa
const MURO_AVISO = 1000;        // ms de temblor antes de que avance
const MURO_VEL = 165;           // px/s (el héroe más lento corre a 209)

let api = null;
export function iniciarAbismo(ganchos) { api = ganchos; }

// reloj compartido: en la carrera, ms desde la salida; si no, el reloj del nivel (en línea, el del
// anfitrión: game.js lo ajusta con desfaseReloj)
const reloj = scene => {
    const c = carreraActiva();
    if (c && scene.carrera) return Date.now() - c.salida;
    return scene.inicioNivel != null ? scene.time.now - scene.inicioNivel + (scene.desfaseReloj || 0) : scene.time.now;
};
const sonar = (scene, clave, opciones) => { if (scene.cache.audio.exists(clave)) scene.sound.play(clave, opciones); };
const rect = b => new Phaser.Geom.Rectangle(b.left, b.top, b.width, b.height);

// ---------- fondo: volcanes y ruinas con parallax (se llama justo después del fondo de ambiente.js) ----------
export function crearFondoAbismo(scene, nivel) {
    if (!nivel.abismo) return;
    const ancho = nivel.ancho;
    // capa lejana (0.12): volcanes con resplandor en la cima y un río de lava al pie
    const f1 = 0.12, lejos = scene.add.graphics().setScrollFactor(f1, 0.05);
    const largo1 = ancho * f1 + 900;
    lejos.fillStyle(0x2a1424, 1);
    for (let x = -100; x < largo1; x += 420) {
        const alto = 120 + ((x * 7919) % 90), base = 300, cima = base - alto;
        lejos.fillTriangle(x, base, x + 170, cima, x + 340, base);
        lejos.fillStyle(0x3a1a22, 1).fillTriangle(x + 150, cima + 8, x + 170, cima, x + 190, cima + 8).fillStyle(0x2a1424, 1);
        const humo = scene.add.image(x + 170, cima, 'brillo').setScrollFactor(f1, 0.05).setScale(1.6, 0.9)
            .setTint(0xff5a2a).setAlpha(0.28).setBlendMode('ADD');
        scene.tweens.add({ targets: humo, alpha: 0.12, yoyo: true, repeat: -1, duration: 1800 + (x % 700), ease: 'Sine.inOut' });
    }
    lejos.fillStyle(0x5a1a10, 0.6).fillRect(-100, 296, largo1 + 200, 8);
    // capa media (0.3): ruinas antiguas en silueta (torres rotas, arcos, columnas caídas)
    const f2 = 0.3, ruinas = scene.add.graphics().setScrollFactor(f2, 0.12);
    const largo2 = ancho * f2 + 900;
    ruinas.fillStyle(0x140d18, 1);
    for (let x = 0, i = 0; x < largo2; x += 260 + ((i * 131) % 120), i++) {
        const tipo = i % 3;
        if (tipo === 0) {
            // torre rota con ventana
            const h = 110 + ((i * 53) % 60);
            ruinas.fillRect(x, 330 - h, 46, h).fillTriangle(x, 330 - h, x + 18, 330 - h - 22, x + 30, 330 - h);
            ruinas.fillStyle(0x3a1c18, 1).fillRect(x + 17, 330 - h + 26, 10, 16).fillStyle(0x140d18, 1);
        } else if (tipo === 1) {
            // arco en ruinas
            ruinas.fillRect(x, 230, 18, 100).fillRect(x + 92, 250, 18, 80);
            ruinas.slice(x + 55, 240, 52, Math.PI, Math.PI * 1.75, false).fillPath();
        } else {
            // columnas, una caída
            ruinas.fillRect(x, 260, 14, 70).fillRect(x + 40, 245, 14, 85);
            ruinas.fillRect(x + 70, 318, 60, 12);
        }
    }
}

// ---------- al crear el nivel (después del suelo y las trampas) ----------
export function crearAbismo(scene, nivel) {
    scene.abismo = null;
    if (!nivel.abismo) return;
    const a = scene.abismo = { aplastadores: [], portales: [], muros: [] };
    puentes(scene, nivel);
    grietas(scene, nivel);
    juntasDeLava(scene, nivel);
    cavernas(scene, nivel);
    (nivel.aplastadores || []).forEach(d => a.aplastadores.push(crearAplastador(scene, nivel, d)));
    (nivel.portales || []).forEach(d => a.portales.push(crearPortal(scene, d)));
    (nivel.murosAbismo || []).forEach(([x, fin]) => a.muros.push({ x, fin, fase: 'dormido' }));
    if (!nivel.arena) portalMeta(scene, nivel.meta);
}

// puente de cuerdas: un poste en cada tablón y la cuerda que los une (cortada en el tramo roto)
function puentes(scene, nivel) {
    const g = scene.add.graphics();
    (nivel.puentes || []).forEach(([a, b, roto]) => {
        const tablas = (nivel.plataformas || []).filter(([x]) => x >= a && x < b).sort((p, q) => p[0] - q[0]);
        const postes = [[a, SUELO_Y], ...tablas.flatMap(([x, arriba, w]) => [[x + 4, arriba], [x + w - 4, arriba]]), [b, SUELO_Y]];
        postes.forEach(([x, y]) => g.fillStyle(0x3b2616, 1).fillRect(x - 2, y - 34, 4, 34).fillStyle(0x5a3a20, 1).fillRect(x - 3, y - 36, 6, 4));
        for (let i = 0; i < postes.length - 1; i++) {
            const [x0, y0] = postes[i], [x1, y1] = postes[i + 1];
            const medio = (x0 + x1) / 2;
            if (roto > 0 && medio > x0 && Math.abs(medio - roto) < 20 && x1 - x0 > 120) {
                // la cuerda rota cuelga de cada lado
                g.lineStyle(2, 0x8a6a40, 0.9).lineBetween(x0, y0 - 32, x0 + 14, y0 + 6).lineBetween(x1, y1 - 32, x1 - 12, y1 + 10);
                continue;
            }
            const curva = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x0, y0 - 32), new Phaser.Math.Vector2(medio, Math.max(y0, y1) - 18), new Phaser.Math.Vector2(x1, y1 - 32));
            g.lineStyle(2, 0x8a6a40, 0.9);
            curva.draw(g, 12);
        }
    });
}

// grietas: en los tablones frágiles (la pista de que se caen) y en losas firmes (mienten)
function dibujarGrieta(g, x, y, ancho) {
    g.lineStyle(2, 0x0c0606, 0.95);
    const pasos = Math.max(2, Math.round(ancho / 22));
    for (let i = 0; i < pasos; i++) {
        const x0 = x + 8 + i * (ancho - 16) / pasos;
        g.lineBetween(x0, y + 1, x0 + 6, y + 7).lineBetween(x0 + 6, y + 7, x0 + 2, y + 13).lineBetween(x0 + 6, y + 7, x0 + 12, y + 10);
    }
}
function grietas(scene, nivel) {
    const g = scene.add.graphics().setDepth(1);
    (nivel.plataformas || []).filter(p => p[3] === 'fragil').forEach(([x, arriba, w]) => {
        dibujarGrieta(g, x, arriba, w);
        // el tablón frágil cuelga un poco torcido: polvo que cae de vez en cuando
        const polvo = scene.add.rectangle(x + w / 2, arriba + 16, 3, 3, 0xb8a080).setDepth(1);
        scene.tweens.add({ targets: polvo, y: arriba + 70, alpha: 0, duration: 900, repeat: -1, repeatDelay: 1600 + (x % 900) });
    });
    (nivel.grietasFalsas || []).forEach(x => dibujarGrieta(g, x - 40, SUELO_Y, 80));
}

// losa falsa de un trío: por las juntas se escapa un brillo de lava (cada tanto: hay que mirar)
function juntasDeLava(scene, nivel) {
    (nivel.trios || []).forEach(([x, falsa]) => {
        const x0 = x + falsa * 96;
        [x0 + 2, x0 + 94].forEach((jx, i) => {
            const luz = scene.add.image(jx, SUELO_Y + 2, 'brillo').setDepth(41).setScale(0.16, 0.5).setTint(0xff6a1a).setAlpha(0).setBlendMode('ADD');
            scene.tweens.add({ targets: luz, alpha: 0.75, yoyo: true, repeat: -1, duration: 380, repeatDelay: 1900, delay: i * 200 + (x % 700) });
        });
    });
}

// caverna: boca de roca a la entrada, penumbra dentro y luz cálida en la salida
function cavernas(scene, nivel) {
    (nivel.cuevas || []).forEach(([a, b]) => {
        const g = scene.add.graphics().setDepth(29);
        // penumbra: más densa en el centro, se aclara cerca de la entrada y la salida (por debajo
        // del personaje, de los aplastadores y de las antorchas: lo peligroso siempre se ve)
        for (let i = 0; i < 6; i++) {
            const borde = 40 + i * 50;
            g.fillStyle(0x05030a, 0.07).fillRect(a + borde, 150, b - a - borde * 2, SUELO_Y - 150);
        }
        // boca de la caverna: rocas que sobresalen alrededor de la entrada
        const boca = scene.add.graphics().setDepth(2);
        boca.fillStyle(0x1a1218, 1)
            .fillTriangle(a - 60, 200, a + 10, 120, a + 20, 210)
            .fillTriangle(a - 30, -40, a + 40, -40, a + 5, 120)
            .fillTriangle(a - 80, SUELO_Y, a - 40, 230, a - 10, SUELO_Y);
        boca.fillStyle(0x2a1c22, 1).fillTriangle(a - 20, 205, a + 10, 150, a + 22, 210);
        // salida: luz cálida que se ve desde dentro (para no perderse)
        const luz = scene.add.image(b + 30, SUELO_Y - 80, 'brillo').setDepth(41).setScale(2.2, 2.8).setTint(0xffc070).setAlpha(0.35).setBlendMode('ADD');
        scene.tweens.add({ targets: luz, alpha: 0.2, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' });
    });
}

// ---------- aplastadores ----------
function crearAplastador(scene, nivel, [x, ciclo, desfase]) {
    const techo = (nivel.techos || []).find(([a, b]) => x >= a && x < b);
    const arriba = techo ? techo[2] : 196;
    const alto = 56;
    // vástago desde el techo y la cabeza con dientes
    const vastago = scene.add.rectangle(x + APLASTADOR_ANCHO / 2, arriba, 14, 1, 0x2a2430).setOrigin(0.5, 0).setDepth(PROF - 1);
    const cabeza = scene.add.container(x, arriba + 8 - alto).setDepth(PROF);
    const g = scene.add.graphics();
    g.fillStyle(0x4a4252, 1).fillRect(0, 0, APLASTADOR_ANCHO, alto - 8);
    g.fillStyle(0x6a6274, 1).fillRect(0, 0, APLASTADOR_ANCHO, 6);
    g.fillStyle(0x2a2430, 1);
    for (let i = 0; i < 4; i++) g.fillTriangle(i * 16, alto - 8, i * 16 + 8, alto, i * 16 + 16, alto - 8);
    const runas = scene.add.rectangle(APLASTADOR_ANCHO / 2, (alto - 8) / 2, 30, 6, 0xff3a2a).setAlpha(0.15);
    cabeza.add([g, runas]);
    // marca en el suelo: dónde cae (siempre visible, se enciende en el aviso)
    const marca = scene.add.rectangle(x + APLASTADOR_ANCHO / 2, SUELO_Y - 1, APLASTADOR_ANCHO, 3, 0xff3a2a).setDepth(PROF - 1).setAlpha(0.3);
    return { x, ciclo, desfase, arriba, alto, cabeza, runas, vastago, marca, fase: 'espera' };
}

function faseAplastador(ap, t) {
    const T = APLASTADOR, espera = ap.ciclo - T.aviso - T.golpe - T.abajo - T.sube;
    let m = ((t + ap.desfase) % ap.ciclo + ap.ciclo) % ap.ciclo;
    if (m < espera) return ['espera', 0];
    m -= espera;
    if (m < T.aviso) return ['aviso', m / T.aviso];
    m -= T.aviso;
    if (m < T.golpe) return ['golpe', m / T.golpe];
    m -= T.golpe;
    if (m < T.abajo) return ['abajo', 1];
    m -= T.abajo;
    return ['sube', m / T.sube];
}

function actualizarAplastador(scene, ap, t, g) {
    const [fase, k] = faseAplastador(ap, t);
    const recorrido = SUELO_Y - (ap.arriba + 8); // de guardado (dientes asomando) a tocar el suelo
    let baja = 0;
    if (fase === 'aviso') baja = 6 + Math.sin(t / 25) * 2;
    else if (fase === 'golpe') baja = recorrido * k * k;
    else if (fase === 'abajo') baja = recorrido;
    else if (fase === 'sube') baja = recorrido * (1 - k);
    const y = ap.arriba + 8 - ap.alto + baja;
    ap.cabeza.y = y;
    ap.vastago.setSize(14, Math.max(1, y - ap.arriba + 4));
    ap.runas.setAlpha(fase === 'aviso' || fase === 'golpe' ? 0.9 : 0.15);
    ap.marca.setAlpha(fase === 'aviso' ? 0.6 + Math.sin(t / 40) * 0.3 : fase === 'golpe' || fase === 'abajo' ? 0.9 : 0.3);
    const cerca = Math.abs(g.body.center.x - (ap.x + APLASTADOR_ANCHO / 2)) < 500;
    if (fase !== ap.fase && cerca) {
        if (fase === 'aviso') {
            // polvo que cae del techo: el aviso
            for (let i = 0; i < 4; i++) {
                const p = scene.add.rectangle(ap.x + 8 + i * 16, ap.arriba + 10, 3, 3, 0xb8a890).setDepth(PROF);
                scene.tweens.add({ targets: p, y: SUELO_Y - 4, alpha: 0, duration: 500 + i * 60, onComplete: () => p.destroy() });
            }
            sonar(scene, 'romper', { volume: 0.15, rate: 1.8 });
        } else if (fase === 'abajo') {
            scene.cameras.main.shake(90, 0.003);
            sonar(scene, 'romper', { volume: 0.35, rate: 0.7 });
        }
    }
    ap.fase = fase;
    if (fase !== 'golpe' && fase !== 'abajo') return;
    const cuerpo = new Phaser.Geom.Rectangle(ap.x + 4, y, APLASTADOR_ANCHO - 8, ap.alto);
    if (Phaser.Geom.Intersects.RectangleToRectangle(cuerpo, rect(g.body))) api.killgesi(scene);
}

// ---------- portales ----------
function crearPortal(scene, [x, pie, saltoX, llegada, abierto, cerrado]) {
    const cy = pie - 50;
    const anillo = scene.add.ellipse(x, cy, 46, 96).setStrokeStyle(4, 0xc77dff).setDepth(PROF - 3);
    const centro = scene.add.ellipse(x, cy, 34, 82, 0x7a3cff, 0.6).setDepth(PROF - 4);
    const luz = scene.add.image(x, cy, 'brillo').setDepth(41).setScale(1.2, 1.8).setTint(0xb07aff).setAlpha(0.4).setBlendMode('ADD');
    scene.tweens.add({ targets: centro, scaleX: 0.85, yoyo: true, repeat: -1, duration: 500 });
    // la salida: un anillo más chico (se ve adónde lleva)
    const dx = x + saltoX, dy = llegada - 50, dir = Math.sign(saltoX) || 1;
    const salida = scene.add.ellipse(dx, dy, 30, 70).setStrokeStyle(3, 0xc77dff, 0.7).setDepth(PROF - 3);
    const cartel = scene.add.text(x, pie - 118, 'PORTAL', {
        fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#e0c8ff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(42);
    return { x, pie, dx, dir, llegada, abierto, cerrado, anillo, centro, luz, salida, cartel, estado: '' };
}

function estadoPortal(p, t) {
    const ciclo = p.abierto + p.cerrado;
    const m = ((t % ciclo) + ciclo) % ciclo;
    if (m < PORTAL_CAMBIO) return 'abriendose';
    if (m < p.abierto - PORTAL_CAMBIO) return 'abierto';
    if (m < p.abierto) return 'cerrandose';
    return 'cerrado';
}

function actualizarPortal(scene, p, t, g) {
    // atados en línea: el portal separaría la cadena
    const estado = scene.cadenaRed ? 'sellado' : estadoPortal(p, t);
    const parpadeo = Math.floor(t / 80) % 2;
    const visible = estado === 'abierto' || ((estado === 'abriendose' || estado === 'cerrandose') && parpadeo);
    p.centro.setVisible(visible);
    p.luz.setAlpha(visible ? 0.45 : 0.08);
    p.anillo.setStrokeStyle(4, estado === 'cerrado' || estado === 'sellado' ? 0x4a3a5a : 0xc77dff);
    p.salida.setAlpha(visible ? 1 : 0.35);
    if (estado !== p.estado) {
        p.estado = estado;
        p.cartel.setText(estado === 'sellado' ? 'SELLADO' : estado === 'cerrado' ? 'CERRADO' : 'PORTAL');
    }
    if (estado === 'sellado') return;
    // sirve abierto y mientras se cierra (la puerta no se cierra en la cara del que ya llegaba)
    if (estado === 'cerrado' || estado === 'abriendose' || scene.time.now < (scene.portalHasta || 0)) return;
    const zona = new Phaser.Geom.Rectangle(p.x - 14, p.pie - 96, 28, 96);
    if (!Phaser.Geom.Intersects.RectangleToRectangle(zona, rect(g.body))) return;
    scene.portalHasta = scene.time.now + PORTAL_ESPERA;
    // se mueve el cuerpo entero (sprite y física juntos) hasta el anillo de salida
    const vx = g.body.velocity.x;
    const llevar = s => {
        s.body.reset(s.x + (p.dx + p.dir * 20 - s.body.center.x), s.y + (p.llegada - 4 - s.body.bottom));
        s.setVelocity(vx, -120);
    };
    llevar(g);
    if (scene.compa?.body && !scene.compa.isDead) llevar(scene.compa); // (atados en el mismo teclado: cruzan juntos)
    scene.cameras.main.flash(160, 190, 120, 255);
    sonar(scene, 'aparece', { volume: 0.5, rate: 1.3 });
    api.mensaje(scene, '¡PORTAL!', 600);
}

// ---------- el Muro del Abismo: persigue al que pasa por su lugar ----------
function actualizarMuro(scene, m, g, dt) {
    const gx = g.body.center.x;
    if (m.fase === 'dormido') {
        if (gx < m.x || gx > m.fin) return;
        m.fase = 'aviso';
        m.frente = m.x - MURO_DETRAS;
        m.empieza = scene.time.now + MURO_AVISO;
        crearMuroVisual(scene, m);
        scene.cameras.main.shake(MURO_AVISO, 0.004);
        sonar(scene, 'rugido', { volume: 0.5, rate: 0.5 });
        api.mensaje(scene, '¡EL ABISMO DESPIERTA!\n¡CORRE!', 1300);
        return;
    }
    if (m.fase === 'fin') return;
    if (m.fase === 'aviso' && scene.time.now >= m.empieza) m.fase = 'persigue';
    if (m.fase === 'persigue') m.frente += MURO_VEL * dt;
    m.cuerpo.x = m.frente;
    m.borde.x = m.frente;
    m.luz.x = m.frente;
    if (m.frente >= m.fin) {
        // se deshace al llegar: ya se salvó
        m.fase = 'fin';
        scene.tweens.add({ targets: [m.cuerpo, m.borde, m.luz], alpha: 0, duration: 600, onComplete: () => [m.cuerpo, m.borde, m.luz].forEach(o => o.destroy()) });
        if (Math.abs(gx - m.fin) < 900) api.mensaje(scene, '¡TE SALVASTE!', 900);
        return;
    }
    // (un poco de tolerancia: lo que mata es el borde, no el resplandor)
    if (g.body.left < m.frente - 8) api.killgesi(scene);
}

function crearMuroVisual(scene, m) {
    m.cuerpo = scene.add.rectangle(m.frente, SUELO_Y + 60, 900, 1000, 0x12051e, 0.92).setOrigin(1, 1).setDepth(PROF + 1);
    m.borde = scene.add.rectangle(m.frente, SUELO_Y + 60, 10, 1000, 0xd06aff, 0.9).setOrigin(1, 1).setDepth(PROF + 1).setBlendMode('ADD');
    m.luz = scene.add.image(m.frente, SUELO_Y - 120, 'brillo').setOrigin(0.7, 0.5).setDepth(41).setScale(2.4, 5).setTint(0xb04aff).setAlpha(0.6).setBlendMode('ADD');
    scene.tweens.add({ targets: m.borde, alpha: 0.5, yoyo: true, repeat: -1, duration: 120 });
}

// ---------- Portal de la meta: se ve desde lejos ----------
function portalMeta(scene, x) {
    const g = scene.add.graphics().setDepth(2);
    // arco de piedra
    g.fillStyle(0x2a2430, 1).fillRect(x - 70, SUELO_Y - 170, 22, 170).fillRect(x + 48, SUELO_Y - 170, 22, 170);
    g.fillStyle(0x3a3442, 1).fillRect(x - 78, SUELO_Y - 186, 156, 18);
    g.fillStyle(0xffd27a, 1).fillRect(x - 6, SUELO_Y - 194, 12, 12);
    const remolino = scene.add.ellipse(x, SUELO_Y - 80, 90, 150, 0xffc94a, 0.25).setDepth(2);
    scene.tweens.add({ targets: remolino, scaleX: 0.8, alpha: 0.4, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
    // columna de luz que se ve en la aproximación final
    const columna = scene.add.image(x, SUELO_Y - 240, 'brillo').setDepth(41).setScale(1.4, 9).setTint(0xffd27a).setAlpha(0.35).setBlendMode('ADD');
    scene.tweens.add({ targets: columna, alpha: 0.18, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.inOut' });
    // chispas doradas (pocas)
    for (let i = 0; i < 6; i++) {
        const c = scene.add.rectangle(x - 40 + i * 16, SUELO_Y - 10, 3, 3, 0xffe9a8).setDepth(41).setBlendMode('ADD');
        scene.tweens.add({ targets: c, y: SUELO_Y - 170, alpha: 0, duration: 1600, delay: i * 260, repeat: -1 });
    }
}

// ---------- cada fotograma ----------
export function actualizarAbismo(scene) {
    const a = scene.abismo, g = scene.mascotaGesi;
    if (!a || !g?.body || g.isDead || scene.nivelTerminado) return;
    const t = reloj(scene), dt = scene.game.loop.delta / 1000;
    a.aplastadores.forEach(ap => actualizarAplastador(scene, ap, t, g));
    if (scene.cinematica) return;
    a.portales.forEach(p => actualizarPortal(scene, p, t, g));
    a.muros.forEach(m => actualizarMuro(scene, m, g, dt));
}
