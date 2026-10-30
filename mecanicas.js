// MECÁNICAS DE LOS TEMAS: cada tema de los mundos (niveles.js: TEMAS) cambia algo de cómo se juega, no solo
// cómo se ve. Valen en los niveles, en la carrera y en las arenas de los temas (los que tienen nivel.tema).
//
//   ❄️ hielo     el suelo resbala: cuesta arrancar y frenar
//   🟫 barro     charcos de barro en el suelo: se camina a la mitad
//   🕸 pegajoso  telarañas / enredaderas: frenan en el suelo y en el aire
//   ⏳ movediza  arena movediza: te frena y, si te quedas, te traga (¡salta!)
//   🔥 calor     baldosas que se calientan: brillan naranja, se ponen rojas y queman
//   🍄 rebote    hongos / calabazas / gelatina: al pisarlos sales disparado hacia arriba
//   💨 viento    ráfagas cada tanto que empujan hacia un lado (más en el aire)
//   🌌 gravedad  ratos de gravedad baja: saltos enormes, casi volar
//   🌑 eclipse   ratos de oscuridad (o niebla): solo ves cerca de ti
//   🩸 sangre    luna de sangre: un rato los enemigos corren más
//   🪨 caen      cosas que caen del techo (rocas, estalactitas, libros, carámbanos): su sombra avisa
//   🌊 agua      más cuevas inundadas (niveles.js: tieneAgua)
//
// Lo que va con el reloj (viento, gravedad, eclipse, luna de sangre, calor) sale de Date.now: en línea pasa
// a la vez en todas las pantallas. Los charcos y hongos salen de la semilla del nivel: iguales para todos.
//
// api (la da game.js): { killgesi(scene, causa, origenX), mensaje(scene, texto, ms) }

import { SUELO_Y } from "./alcance.js"

const MECANICAS = {
    'Las Grutas Rojas': [{ tipo: 'caen', que: 'estalactita' }],
    'Los Pantanos Muertos': [{ tipo: 'barro' }],
    'Las Forjas del Troll': [{ tipo: 'calor' }],
    'Las Torres del Cielo': [{ tipo: 'viento', fuerza: 1 }],
    'El Abismo sin Fondo': [{ tipo: 'gravedad' }],
    'El Bosque Helado': [{ tipo: 'hielo' }],
    'Las Minas de Oro': [{ tipo: 'caen', que: 'roca' }],
    'El Desierto de Huesos': [{ tipo: 'movediza' }],
    'La Cripta de Cristal': [{ tipo: 'hielo' }],
    'El Jardín de Calabazas': [{ tipo: 'rebote', que: 'calabaza' }],
    'El Reino de los Hongos': [{ tipo: 'rebote', que: 'hongo' }],
    'El Castillo Sangriento': [{ tipo: 'sangre' }],
    'El Glaciar Eterno': [{ tipo: 'hielo' }, { tipo: 'caen', que: 'carambano' }],
    'El Mar de Niebla': [{ tipo: 'eclipse', niebla: true }],
    'La Ciudad Hundida': [{ tipo: 'agua' }],
    'El Volcán Dormido': [{ tipo: 'calor' }],
    'La Biblioteca Maldita': [{ tipo: 'caen', que: 'libro' }],
    'La Selva Embrujada': [{ tipo: 'pegajoso', que: 'enredadera' }],
    'El Nido de Arañas': [{ tipo: 'pegajoso', que: 'telarana' }],
    'El Bosque Otoñal': [{ tipo: 'viento', fuerza: 0.6 }],
    'La Cueva de los Ecos': [{ tipo: 'caen', que: 'estalactita' }],
    'El Templo del Sol Negro': [{ tipo: 'eclipse' }],
    'El Corazón del Volcán': [{ tipo: 'calor' }, { tipo: 'caen', que: 'roca' }],
    'El Reino de Caramelo Podrido': [{ tipo: 'rebote', que: 'gelatina' }],
    'El Cementerio de Barcos': [{ tipo: 'agua' }, { tipo: 'viento', fuerza: 0.8 }],
    'Las Cumbres de la Tormenta': [{ tipo: 'viento', fuerza: 1.3 }],
    'El Fin del Mundo': [{ tipo: 'gravedad' }],
    // (los niveles medievales 5-7)
    'El Volcán': [{ tipo: 'calor' }],
    'El Reino de las Nubes': [{ tipo: 'viento', fuerza: 0.8 }],
    'Las Ruinas del Abismo': [{ tipo: 'gravedad' }],
};
const AVISOS = {
    hielo: '❄️ HIELO: el suelo resbala',
    barro: '🟫 BARRO: los charcos frenan',
    pegajoso: '🕸 TELARAÑAS: te atrapan',
    movediza: '⏳ ARENA MOVEDIZA: ¡no te quedes!',
    calor: '🔥 SUELO ARDIENTE: mira las baldosas',
    rebote: '🍄 ¡PISA Y SALTA ALTO!',
    viento: '💨 VIENTO: ráfagas de lado',
    gravedad: '🌌 GRAVEDAD LOCA',
    eclipse: '🌑 ECLIPSES: llega la oscuridad',
    sangre: '🩸 LUNA DE SANGRE',
    caen: '🪨 CUIDADO ARRIBA: mira las sombras',
};
const AVISO_PEGAJOSO = { enredadera: '🌿 ENREDADERAS: te atrapan' };
const AVISO_ECLIPSE = '🌫 NIEBLA: llega la niebla';

export const mecanicasDe = tema => MECANICAS[tema?.nombre] || [];
export const tieneAgua = tema => mecanicasDe(tema).some(m => m.tipo === 'agua');

const HIELO_MS = 380;          // lo que tarda en llegar a la velocidad (o en frenar) sobre el hielo
const BARRO = 0.5, PEGAJOSO = 0.5, MOVEDIZA = 0.4; // velocidad dentro
const TRAGA_MS = 2600;         // lo que aguanta la arena movediza antes de tragarte
const REBOTE = 1.55;           // el salto de un hongo (por el salto del personaje)
const VIENTO_SUELO = 40, VIENTO_AIRE = 95;  // px/s que empuja una ráfaga
const GRAVEDAD_BAJA = 130;     // la gravedad propia del personaje en gravedad baja (normal: 480)
// los ciclos (ms): [largo, empieza el aviso, empieza el efecto, termina]
const CICLO = {
    viento: [15000, 9000, 10500, 15000],
    gravedad: [18000, 11000, 12000, 18000],
    eclipse: [20000, 11500, 13000, 18500],
    sangre: [22000, 15000, 16000, 22000],
};
const CALOR = [4200, 2200, 3200]; // [ciclo, se pone naranja, quema]

let api = null;
export const configurarMecanicas = a => { api = a; };

function azar(semilla) {
    let s = semilla >>> 0 || 1;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = txt => [...String(txt)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

// ---------- texturas (dibujadas una vez) ----------
function texturas(scene) {
    const hacer = (clave, w, h, dibujar) => {
        if (scene.textures.exists(clave)) return;
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        dibujar(g);
        g.generateTexture(clave, w, h);
        g.destroy();
    };
    hacer('mec_linea', 26, 2, g => g.fillStyle(0xffffff, 1).fillRect(0, 0, 26, 2));
    hacer('mec_punto', 4, 4, g => g.fillStyle(0xffffff, 1).fillCircle(2, 2, 2));
    hacer('mec_roca', 26, 22, g => { g.fillStyle(0x6a5a50, 1).fillRoundedRect(0, 2, 26, 20, 7); g.fillStyle(0x8a7a6a, 1).fillRoundedRect(4, 4, 12, 8, 4); });
    hacer('mec_estalactita', 18, 40, g => { g.fillStyle(0x8a6a60, 1).fillTriangle(0, 0, 18, 0, 9, 40); g.fillStyle(0xa88a80, 1).fillTriangle(3, 0, 9, 0, 8, 26); });
    hacer('mec_carambano', 16, 40, g => { g.fillStyle(0xc8ecff, 1).fillTriangle(0, 0, 16, 0, 8, 40); g.fillStyle(0xffffff, 1).fillTriangle(3, 0, 7, 0, 7, 24); });
    hacer('mec_libro', 26, 20, g => { g.fillStyle(0x7a2a2a, 1).fillRect(0, 0, 26, 20); g.fillStyle(0xf0e0c0, 1).fillRect(3, 3, 20, 14); g.fillStyle(0xd0a040, 1).fillRect(0, 0, 4, 20); });
    hacer('mec_hongo', 54, 30, g => { g.fillStyle(0xf0e0d0, 1).fillRect(20, 14, 14, 16); g.fillStyle(0xd040c0, 1).fillEllipse(27, 13, 54, 26); g.fillStyle(0xffe0ff, 1).fillCircle(15, 9, 4).fillCircle(34, 6, 3).fillCircle(42, 13, 3); });
    hacer('mec_calabaza', 50, 30, g => { g.fillStyle(0xe07a20, 1).fillEllipse(25, 17, 50, 26); g.fillStyle(0xb85a10, 1).fillRect(16, 6, 2, 22).fillRect(32, 6, 2, 22); g.fillStyle(0x4a7a2a, 1).fillRect(23, 0, 5, 7); });
    hacer('mec_gelatina', 54, 24, g => { g.fillStyle(0xff70b0, 0.9).fillRoundedRect(0, 2, 54, 22, 10); g.fillStyle(0xffd0e8, 1).fillRoundedRect(8, 5, 16, 5, 2); });
    hacer('mec_sombra', 48, 12, g => g.fillStyle(0x000000, 1).fillEllipse(24, 6, 48, 12));
    // (el eclipse: negro con un agujero difuso en el centro)
    if (!scene.textures.exists('mec_eclipse')) {
        const T = 256, c = scene.textures.createCanvas('mec_eclipse', T, T), ctx = c.getContext();
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, T, T); // (blanco: el tinte le da el color)
        ctx.globalCompositeOperation = 'destination-out';
        const r = ctx.createRadialGradient(T / 2, T / 2, 6, T / 2, T / 2, 30);
        r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = r; ctx.fillRect(0, 0, T, T);
        c.refresh();
    }
}

// los lugares del suelo donde va un charco, una baldosa o un hongo (sin trampas, agua ni puntos de control)
function lugaresDelSuelo(scene, nivel, r, ancho, separacion) {
    const ocupados = [];
    ['pinchos', 'locuras', 'mordedoras', 'emboscadas', 'rocas', 'cebos', 'monedasTrampa', 'estatuasFalsas', 'plantas']
        .forEach(k => (nivel[k] || []).forEach(v => { const x = Array.isArray(v) ? v[0] : v; if (typeof x === 'number') ocupados.push(x); }));
    (nivel.checkpoints || []).forEach(x => ocupados.push(x));
    const agua = nivel.agua || [];
    const fin = (nivel.meta || 1e9) - 1800; // (ni en la arena del jefe ni cerca de la meta)
    const libre = x => x > 600 && x + ancho < fin && !ocupados.some(o => o > x - 110 && o < x + ancho + 110) &&
        !agua.some(([a, b]) => x + ancho > a - 60 && x < b + 60) &&
        !solidos.some(c => c.right > x - 20 && c.left < x + ancho + 20 && c.bottom > SUELO_Y - 70 && c.top < SUELO_Y - 8); // (ni pegado a un muro o un bloque)
    const solidos = (scene.floor?.getChildren() || []).map(o => o.body).filter(Boolean);
    const lugares = [];
    (nivel.suelo || []).forEach(([a, b]) => {
        for (let x = a + 120 + r() * 160; x + ancho < b - 120; x += separacion * (0.8 + r() * 0.6)) if (libre(x)) lugares.push(x);
    });
    return lugares;
}

export function crearMecanicas(scene, nivel) {
    scene.mec = null;
    if (scene.noche || scene.catacumbas || scene.minas) return;
    const lista = mecanicasDe(nivel.tema).filter(m => m.tipo !== 'agua');
    if (!lista.length) return;
    texturas(scene);
    const r = azar(hash(nivel.semilla ?? nivel.nombre));
    const m = scene.mec = { lista, tipos: new Set(lista.map(x => x.tipo)), parches: [], antes: {}, vxHielo: 0, gravedadNormal: 480,
        proximaCaida: scene.time.now + 4000, tragado: 0 };
    const de = tipo => lista.find(x => x.tipo === tipo);

    // charcos de barro, telarañas y arena movediza
    for (const tipo of ['barro', 'pegajoso', 'movediza']) {
        if (!de(tipo)) continue;
        const ancho = tipo === 'movediza' ? 150 : 130;
        lugaresDelSuelo(scene, nivel, r, ancho, tipo === 'pegajoso' ? 560 : 460).forEach(x => {
            let dibujo;
            if (tipo === 'pegajoso') {
                dibujo = scene.add.graphics().setDepth(34.5);
                const verde = de(tipo).que === 'enredadera';
                dibujo.lineStyle(1.5, verde ? 0x5aa040 : 0xe8f0e0, verde ? 0.85 : 0.6);
                for (let i = 0; i <= 6; i++) dibujo.lineBetween(x + i * ancho / 6, SUELO_Y, x + ancho / 2, SUELO_Y - 120);
                for (let k = 1; k <= 4; k++) dibujo.strokeEllipse(x + ancho / 2, SUELO_Y - 120 + k * 30, k * ancho / 4.5, k * 12);
            } else {
                dibujo = scene.add.graphics().setDepth(34.5);
                const color = tipo === 'barro' ? 0x6a4a28 : 0xd8b070, brillo = tipo === 'barro' ? 0x9a7448 : 0xf0d090;
                dibujo.fillStyle(color, 0.95).fillEllipse(x + ancho / 2, SUELO_Y + 2, ancho, 16);
                dibujo.fillStyle(brillo, 0.8).fillEllipse(x + ancho / 2 - 20, SUELO_Y, ancho * 0.4, 5);
                if (tipo === 'movediza') scene.tweens.add({ targets: dibujo, alpha: 0.75, yoyo: true, repeat: -1, duration: 900 });
            }
            m.parches.push({ tipo, x0: x, x1: x + ancho, alto: tipo === 'pegajoso' ? 125 : 20, dibujo });
        });
    }
    // baldosas ardientes
    if (de('calor')) {
        lugaresDelSuelo(scene, nivel, r, 110, 460).forEach((x, i) => {
            const dibujo = scene.add.rectangle(x + 55, SUELO_Y + 2, 110, 12, 0x5a2a20).setDepth(34.5);
            const brasas = scene.add.particles(0, 0, 'mec_punto', { x: { min: x, max: x + 110 }, y: SUELO_Y - 2, speedY: { min: -60, max: -20 },
                lifespan: 700, scale: { start: 0.8, end: 0 }, tint: [0xffd060, 0xff5020], blendMode: 'ADD', frequency: 60, emitting: false }).setDepth(34.6);
            m.parches.push({ tipo: 'calor', x0: x, x1: x + 110, alto: 20, dibujo, brasas, desfase: (i * 1300) % CALOR[0] });
        });
    }
    // hongos, calabazas y gelatina que hacen saltar
    if (de('rebote')) {
        const tex = `mec_${de('rebote').que}`;
        lugaresDelSuelo(scene, nivel, r, 54, 520).forEach(x => {
            const dibujo = scene.add.image(x + 27, SUELO_Y + 2, tex).setOrigin(0.5, 1).setDepth(34.5);
            m.parches.push({ tipo: 'rebote', x0: x + 2, x1: x + 52, alto: 40, dibujo });
        });
    }
    // el viento: rayitas que cruzan la pantalla
    // (las partículas van con el emisor: el emisor sigue a la cámara)
    if (de('viento')) m.lineas = scene.add.particles(0, 0, 'mec_linea', { y: { min: 0, max: 420 }, lifespan: 1300, alpha: { start: 0.55, end: 0 },
        emitting: false, frequency: 40 }).setDepth(35);
    // la gravedad baja: puntitos que suben
    if (de('gravedad')) m.estrellas = scene.add.particles(0, 0, 'mec_punto', { x: { min: 0, max: 1000 }, lifespan: 2200, speedY: { min: -70, max: -30 }, alpha: { start: 0.8, end: 0 },
        tint: [0xd0a0ff, 0xffffff], blendMode: 'ADD', emitting: false, frequency: 70 }).setDepth(35);
    // el eclipse o la niebla: lo oscuro, con un agujero alrededor del personaje
    m.niebla = !!de('eclipse')?.niebla;
    if (de('eclipse')) m.oscuro = scene.add.image(0, 0, 'mec_eclipse').setDepth(45).setAlpha(0).setTint(de('eclipse').niebla ? 0x9aa0b0 : 0x000000);
    // la luna de sangre: un velo rojo
    if (de('sangre')) m.velo = scene.add.rectangle(0, 0, 10, 10, 0xc01020, 1).setOrigin(0).setDepth(44).setAlpha(0).setBlendMode('MULTIPLY');
    // las cosas que caen
    if (de('caen')) m.caen = de('caen').que;

    // el aviso al empezar (después del nombre del nivel)
    const pegajoso = de('pegajoso'), eclipse = de('eclipse');
    const avisos = lista.map(x => (x.tipo === 'pegajoso' && AVISO_PEGAJOSO[pegajoso.que]) || (x.tipo === 'eclipse' && eclipse.niebla && AVISO_ECLIPSE) || AVISOS[x.tipo]);
    scene.time.delayedCall(2600, () => api?.mensaje(scene, avisos.join('\n'), 1800));
}

// en qué parte del ciclo está ahora un efecto con reloj: 'calma' | 'aviso' | 'efecto', y cuánto (0-1) lleva
function fase(tipo) {
    const [largo, aviso, efecto, fin] = CICLO[tipo];
    const t = Date.now() % largo;
    if (t >= efecto && t < fin) return ['efecto', (t - efecto) / (fin - efecto)];
    if (t >= aviso && t < efecto) return ['aviso', (t - aviso) / (efecto - aviso)];
    return ['calma', 0];
}
const vueltaDe = tipo => Math.floor(Date.now() / CICLO[tipo][0]);

// lo que se ve y pasa solo (va siempre, aunque el personaje esté muerto)
export function animarMecanicas(scene) {
    const m = scene.mec;
    if (!m) return;
    const cam = scene.cameras.main, vista = cam.worldView;
    // baldosas ardientes
    m.parches.forEach(p => {
        if (p.tipo !== 'calor') return;
        const t = (Date.now() + p.desfase) % CALOR[0];
        const estado = t >= CALOR[2] ? 'quema' : t >= CALOR[1] ? 'calienta' : 'fria';
        if (estado === p.estado) { if (estado === 'calienta') p.dibujo.setAlpha(0.6 + 0.4 * Math.abs(Math.sin(Date.now() / 70))); return; }
        p.estado = estado;
        p.dibujo.setFillStyle(estado === 'quema' ? 0xff3010 : estado === 'calienta' ? 0xff9a30 : 0x5a2a20).setAlpha(1);
        p.brasas.emitting = estado === 'quema';
    });
    // viento
    if (m.lineas) {
        const [f] = fase('viento'), dir = vueltaDe('viento') % 2 ? -1 : 1;
        m.dirViento = dir;
        m.vientoSopla = f === 'efecto';
        m.lineas.emitting = f !== 'calma';
        if (f !== 'calma') {
            m.lineas.speedX = dir * (f === 'efecto' ? 700 : 300);
            m.lineas.setPosition(dir > 0 ? vista.x - 30 : vista.right + 30, vista.y);
            m.lineas.frequency = f === 'efecto' ? 25 : 90;
        }
        if (f !== m.antes.viento) {
            if (f === 'aviso') api?.mensaje(scene, dir > 0 ? '💨 VIENTO ➡' : '⬅ VIENTO 💨', 1100);
            m.antes.viento = f;
        }
    }
    // gravedad baja
    if (m.estrellas) {
        const [f] = fase('gravedad');
        m.gravedadBaja = f === 'efecto';
        m.estrellas.emitting = f !== 'calma';
        if (f !== 'calma') m.estrellas.setPosition(vista.x, vista.bottom);
        if (f !== m.antes.gravedad) {
            if (f === 'aviso') api?.mensaje(scene, '🌌 GRAVEDAD BAJA', 1100);
            if (f === 'calma' && m.antes.gravedad === 'efecto') api?.mensaje(scene, '⬇ VUELVE LA GRAVEDAD', 900);
            m.antes.gravedad = f;
        }
    }
    // eclipse / niebla
    if (m.oscuro) {
        const [f, k] = fase('eclipse');
        const g = scene.mascotaGesi;
        const alfa = f === 'aviso' ? k : f === 'efecto' ? (k > 0.9 ? (1 - k) * 10 : 1) : 0;
        m.oscuro.setAlpha(alfa * 0.9).setVisible(alfa > 0);
        if (alfa > 0) m.oscuro.setPosition(g.x, g.body.center.y).setScale(Math.max(vista.width, vista.height) * 2.4 / 256);
        if (f !== m.antes.eclipse) {
            if (f === 'aviso') api?.mensaje(scene, m.niebla ? '🌫 ¡NIEBLA!' : '🌑 ¡ECLIPSE!', 1100);
            m.antes.eclipse = f;
        }
    }
    // luna de sangre
    if (m.velo) {
        const [f, k] = fase('sangre');
        const alfa = f === 'aviso' ? k : f === 'efecto' ? (k > 0.92 ? (1 - k) * 12 : 1) : 0;
        m.velo.setPosition(vista.x, vista.y).setSize(vista.width, vista.height).setAlpha(alfa * 0.35);
        const furia = f === 'efecto';
        if (furia !== !!m.furia) {
            m.furia = furia;
            if (furia) api?.mensaje(scene, '🩸 ¡LUNA DE SANGRE!', 1100);
            scene.enemies?.getChildren().forEach(e => enfurecer(e, furia));
        } else if (furia) scene.enemies?.getChildren().forEach(e => { if (!e.furia) enfurecer(e, true); }); // (los que aparecen durante la luna)
    }
}
function enfurecer(e, si) {
    if (!e.active || !e.velBase || !!e.furia === si) return;
    e.furia = si;
    const f = si ? 1.5 : 1 / 1.5;
    e.velBase *= f;
    if (e.body) e.body.velocity.x *= f;
}

const dentro = (p, g) => g.body.right > p.x0 + 6 && g.body.left < p.x1 - 6 && g.body.bottom > SUELO_Y - p.alto && g.body.bottom < SUELO_Y + 8;

// lo que le pasa al personaje (después de moverse y saltar, en game.js)
export function moverConMecanicas(scene, time, delta, enSuelo) {
    const m = scene.mec;
    if (!m) return;
    const g = scene.mascotaGesi;
    const libre = time >= (scene.dashHasta || 0) && time >= (scene.volteretaHasta || 0) && time >= (scene.empujadoHasta || 0) && !scene.bajoAgua;
    const v = g.body.velocity;

    // hielo: la velocidad llega (y se va) de a poco
    if (m.tipos.has('hielo')) {
        if (enSuelo && libre) {
            const k = 1 - Math.exp(-delta / HIELO_MS);
            g.setVelocityX(m.vxHielo + (v.x - m.vxHielo) * k);
        }
        m.vxHielo = v.x;
    }
    // charcos, telarañas, arena movediza, baldosas y hongos
    let enArena = false;
    for (const p of m.parches) {
        if (!dentro(p, g)) continue;
        if (p.tipo === 'barro' && enSuelo && libre) g.setVelocityX(v.x * BARRO);
        else if (p.tipo === 'pegajoso' && libre) { g.setVelocityX(v.x * PEGAJOSO); if (v.y > 90) g.setVelocityY(90); }
        else if (p.tipo === 'movediza' && enSuelo) { enArena = true; if (libre) g.setVelocityX(v.x * MOVEDIZA); }
        else if (p.tipo === 'calor' && enSuelo && p.estado === 'quema') api?.killgesi(scene, 'fuego', (p.x0 + p.x1) / 2);
        else if (p.tipo === 'rebote' && v.y >= 0 && g.body.bottom > SUELO_Y - 8 && time > (m.reboteHasta || 0)) {
            m.reboteHasta = time + 250;
            g.setVelocityY(-scene.pj.salto * REBOTE);
            scene.sound.play('salto', { volume: 0.35, rate: 0.7 });
            scene.tweens.add({ targets: p.dibujo, scaleY: 0.6, scaleX: 1.2, yoyo: true, duration: 90 });
        }
    }
    // la arena movediza traga si te quedas
    if (enArena) {
        m.tragado += delta;
        g.setTint(0xd8b070);
        if (m.tragado > TRAGA_MS * 0.5 && !m.avisoArena) { m.avisoArena = true; api?.mensaje(scene, '⏳ ¡SALTA!', 700); }
        if (m.tragado > TRAGA_MS) { m.tragado = 0; g.clearTint(); api?.killgesi(scene, 'arena', g.x); }
    } else if (m.tragado) { m.tragado = 0; m.avisoArena = false; g.clearTint(); }

    // viento: empuja (más en el aire)
    if (m.vientoSopla && libre) g.setVelocityX(v.x + m.dirViento * (enSuelo ? VIENTO_SUELO : VIENTO_AIRE) * m.lista.find(x => x.tipo === 'viento').fuerza);
    // gravedad baja
    if (m.tipos.has('gravedad')) {
        const quiere = m.gravedadBaja ? GRAVEDAD_BAJA : m.gravedadNormal;
        if (g.body.gravity.y !== quiere) g.setGravityY(quiere);
    }
    // cosas que caen del techo: la sombra avisa dónde
    if (m.caen && time > m.proximaCaida && !scene.peleaJefe && !scene.nivelTerminado) {
        m.proximaCaida = time + 4500 + Math.random() * 3500;
        soltar(scene, m.caen, g.x + v.x * 0.9 + (Math.random() - 0.5) * 80, enSuelo ? g.body.bottom : SUELO_Y);
    }
}

function soltar(scene, que, x, piso) {
    const sombra = scene.add.image(x, piso, 'mec_sombra').setDepth(34.4).setAlpha(0.15).setScale(0.4);
    scene.tweens.add({ targets: sombra, alpha: 0.55, scaleX: 1, scaleY: 1, duration: 1000 });
    const vista = scene.cameras.main.worldView;
    const cosa = scene.add.image(x, Math.min(vista.y - 30, piso - 300), `mec_${que}`).setOrigin(0.5, 1).setDepth(34.8);
    if (que === 'libro' || que === 'roca') scene.tweens.add({ targets: cosa, angle: 360, duration: 1100 });
    scene.tweens.add({ targets: cosa, y: piso, duration: 420, delay: 680, ease: 'Quad.in', onComplete: () => {
        sombra.destroy();
        const g = scene.mascotaGesi;
        if (g.active && !g.isDead && Math.abs(g.x - x) < 26 && g.body.bottom > piso - 70 && g.body.top < piso) api?.killgesi(scene, 'golpe', x);
        scene.sound.play('bump', { volume: 0.35 });
        const pedazos = scene.add.particles(x, piso - 6, que === 'libro' ? 'mec_punto' : `mec_${que}`, { speed: { min: 60, max: 160 }, angle: { min: 200, max: 340 },
            scale: { start: que === 'libro' ? 1.4 : 0.3, end: 0 }, lifespan: 450, gravityY: 500, emitting: false }).setDepth(34.8);
        pedazos.explode(7);
        scene.time.delayedCall(600, () => pedazos.destroy());
        cosa.destroy();
    } });
}
