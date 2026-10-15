// Mecanismos de equipo (solo en los niveles en equipo: ver equipo.js).
//
// Placas de presión: se hunden con los jugadores encima y muestran cuántos hacen falta ("1/2").
// Puertas: un muro de piedra que se abre mientras las placas de su grupo estén pisadas por
//   suficientes jugadores, y SIGUE abierto ESPERA_PUERTA ms después de soltarlas: con la cadena,
//   el que sostiene la placa no alcanza a pasar mientras la pisa; hay que soltarla y correr juntos.
//
// Cuántos hacen falta depende de cuántos juegan (necesarios): 2 jugadores -> 1, 4 -> 2, 6 u 8 -> 3.
// En línea decide el anfitrión (cuenta a todos con las posiciones que recibe) y avisa a los demás
// con un evento: así ninguna pantalla ve abierta una puerta que en otra está cerrada. El margen de
// la puerta absorbe la diferencia de tiempo entre pantallas.
//
// Argollas: anillas en lo alto. Saltando cerca, el personaje se agarra solo y se columpia (← →
//   dan impulso); con el salto se suelta (con un empujón hacia arriba). Sobre un foso más ancho que
//   la cadena, el que cruza arrastra al de atrás: se ancla del otro lado y la cadena lo rescata.
//   Cada pantalla mueve a sus propios jugadores (los demás se ven por la red, como siempre).
//
// Datos del nivel: placas: [x, grupo]   puertas: [x, grupo]   (los grupos unen placas con puertas)
//                  argollas: [x, y]

import { red, enLinea, esAnfitrion, enviarEvento, alRecibir } from "./red.js"

const SUELO_Y = 332;
const ANCHO_PLACA = 52;
const ALTO_PUERTA = 140;
const ANCHO_PUERTA = 26;
const ESPERA_PUERTA = 1500; // ms que la puerta sigue abierta después de soltar las placas
const REENVIO_MS = 1000;    // el anfitrión repite el estado de las puertas (por si alguien se perdió un aviso)
const MITAD_CUERPO = 34;    // alto del cuerpo / 2 (los remotos mandan el centro del cuerpo)
// argollas
const RADIO_ARGOLLA = 54;   // px desde la argolla al centro del cuerpo para agarrarse
const CUERDA_MIN = 46, CUERDA_MAX = 90; // largo del agarre (lo que había al agarrarse, dentro de estos límites)
const IMPULSO = 420;        // px/s² con ← → al columpiarse
const SOLTAR_EMPUJE = 160;  // px/s hacia arriba al soltarse
const ESPERA_REAGARRE = 350; // ms antes de poder agarrarse de nuevo

// jugadores en el equipo y cuántos deben pisar las placas de un grupo
const jugadores = scene => (scene.compa?.active ? 2 : scene.remotos ? Math.max(1, red.jugadores.length) : 1);
export const necesarios = scene => Math.min(3, Math.max(1, Math.floor(jugadores(scene) / 2)));

let escenaMec = null;
// en línea, las pantallas que no son el anfitrión siguen lo que él dice
alRecibir('evento', m => {
    const scene = escenaMec;
    if (m.tipo !== 'mecanismo' || !scene?.sys?.isActive() || m.nivel !== scene.nivelMecanismos) return;
    if (esAnfitrion()) return;
    scene.gruposAbiertos[m.grupo] = !!m.abierto;
});

export function crearMecanismos(scene, nivel, indice) {
    escenaMec = scene;
    scene.nivelMecanismos = indice;
    scene.gruposAbiertos = {};
    scene.abiertoHasta = {};
    scene.proxReenvio = 0;

    scene.placas = (nivel.placas || []).map(([x, grupo]) => {
        const g = scene.add.graphics().setDepth(6);
        const texto = scene.add.text(x, SUELO_Y - 26, '', { fontSize: '11px', fontStyle: '700', color: '#ffffff', stroke: '#000', strokeThickness: 3 })
            .setOrigin(0.5).setDepth(41);
        return { x, grupo, g, texto, encima: 0, hundida: -1 };
    });

    scene.puertas = (nivel.puertas || []).map(([x, grupo]) => {
        // la puerta es un bloque de piedra sólido (con el suelo: choca con jugadores y enemigos)
        const p = scene.floor.create(x, SUELO_Y, 'mz_bloque').setOrigin(0.5, 1)
            .setDisplaySize(ANCHO_PUERTA, ALTO_PUERTA).setTint(0x8a8fa8).refreshBody();
        const luz = scene.add.circle(x, SUELO_Y - ALTO_PUERTA - 8, 5, 0xff5a5a).setDepth(41);
        const marco = scene.add.rectangle(x, SUELO_Y - ALTO_PUERTA - 2, ANCHO_PUERTA + 14, 6, 0x3a3f55).setDepth(5);
        return { x, grupo, p, luz, marco, abierta: false };
    });
    scene.puertas.forEach(pu => { scene.gruposAbiertos[pu.grupo] = false; });

    // argollas: un soporte que baja del cielo y la anilla dorada
    scene.argollas = (nivel.argollas || []).map(([x, y]) => {
        const g = scene.add.graphics().setDepth(7);
        g.lineStyle(3, 0x5a5f70, 1).lineBetween(x, y - 90, x, y - 10);
        g.lineStyle(3, 0xffd27a, 1).strokeCircle(x, y, 9);
        const brillo = scene.add.circle(x, y, 14, 0xffd27a, 0.15).setDepth(6);
        scene.tweens.add({ targets: brillo, alpha: 0.05, yoyo: true, repeat: -1, duration: 700 });
        return { x, y };
    });
    scene.cuerdas = scene.argollas.length ? scene.add.graphics().setDepth(33) : null;
}

// pies de todos los jugadores: los de esta pantalla y los que llegan por la red
function piesDeTodos(scene) {
    const pies = [];
    [scene.mascotaGesi, scene.compa].forEach(s => {
        if (!s?.active || s.isDead) return;
        pies.push({ x: s.body.center.x, abajo: s.body.bottom, suelo: s.body.blocked.down || s.body.touching.down });
    });
    scene.remotos?.forEach(r => {
        const e = r.estado;
        if (r.visible && e) pies.push({ x: e.cx, abajo: e.cy + MITAD_CUERPO, suelo: !!e.suelo });
    });
    return pies;
}

export function actualizarMecanismos(scene) {
    if (scene.argollas?.length) actualizarArgollas(scene);
    if (!scene.placas?.length && !scene.puertas?.length) return;
    const ahora = scene.time.now, necesita = necesarios(scene);
    const pies = piesDeTodos(scene);

    // placas: cuántos hay encima (se hunden y muestran "1/2")
    scene.placas.forEach(pl => {
        pl.encima = pies.filter(f => f.suelo && Math.abs(f.abajo - SUELO_Y) < 12 && Math.abs(f.x - pl.x) < ANCHO_PLACA / 2 + 6).length;
        const lista = pl.encima >= necesita;
        const hundida = pl.encima > 0 ? 1 : 0;
        if (hundida !== pl.hundida || pl.lista !== lista) {
            pl.hundida = hundida;
            pl.lista = lista;
            pl.g.clear()
                .fillStyle(0x2a2f40, 1).fillRect(pl.x - ANCHO_PLACA / 2 - 3, SUELO_Y - 3, ANCHO_PLACA + 6, 4)
                .fillStyle(lista ? 0x4fd1a5 : pl.encima ? 0xffd27a : 0x8b9cff, 1)
                .fillRect(pl.x - ANCHO_PLACA / 2, SUELO_Y - (hundida ? 3 : 7), ANCHO_PLACA, hundida ? 3 : 5);
            if (hundida) scene.sound.play('golpe_enemigo', { volume: 0.2, rate: 1.6 });
        }
        pl.texto.setText(`${Math.min(pl.encima, necesita)}/${necesita}`).setColor(lista ? '#4fd1a5' : '#ffffff');
    });

    // quién decide: sin conexión esta pantalla; en línea, el anfitrión
    if (!enLinea() || esAnfitrion()) {
        const grupos = new Set(scene.puertas.map(pu => pu.grupo));
        grupos.forEach(grupo => {
            const enGrupo = scene.placas.filter(pl => pl.grupo === grupo);
            const pisadas = enGrupo.reduce((n, pl) => n + pl.encima, 0);
            if (enGrupo.length && pisadas >= necesita) scene.abiertoHasta[grupo] = ahora + ESPERA_PUERTA;
            const abierto = ahora < (scene.abiertoHasta[grupo] || 0);
            if (abierto !== scene.gruposAbiertos[grupo]) {
                scene.gruposAbiertos[grupo] = abierto;
                if (enLinea()) enviarEvento('mecanismo', { grupo, abierto, nivel: scene.nivelMecanismos });
            }
        });
        if (enLinea() && ahora > scene.proxReenvio) {
            scene.proxReenvio = ahora + REENVIO_MS;
            Object.entries(scene.gruposAbiertos).forEach(([grupo, abierto]) =>
                enviarEvento('mecanismo', { grupo, abierto, nivel: scene.nivelMecanismos }));
        }
    }

    // puertas: suben (sin choque) o bajan (sólidas) según su grupo
    scene.puertas.forEach(pu => {
        const abrir = !!scene.gruposAbiertos[pu.grupo];
        if (abrir === pu.abierta) {
            // a punto de cerrarse: la luz parpadea (aviso para correr)
            if (abrir && !enLinea() || abrir && esAnfitrion()) {
                const falta = (scene.abiertoHasta[pu.grupo] || 0) - ahora;
                pu.luz.setAlpha(falta < ESPERA_PUERTA && Math.floor(ahora / 150) % 2 ? 0.3 : 1);
            }
            return;
        }
        pu.abierta = abrir;
        scene.tweens.killTweensOf(pu.p);
        pu.luz.setFillStyle(abrir ? 0x4fd1a5 : 0xff5a5a).setAlpha(1);
        scene.sound.play('romper', { volume: 0.25, rate: abrir ? 1.3 : 0.8 });
        if (abrir) {
            pu.p.body.enable = false;
            scene.tweens.add({ targets: pu.p, y: SUELO_Y - ALTO_PUERTA + 10, duration: 260, ease: 'Quad.out' });
        } else {
            scene.tweens.add({
                targets: pu.p, y: SUELO_Y, duration: 200, ease: 'Quad.in',
                onComplete: () => { pu.p.body.enable = true; pu.p.refreshBody(); scene.cameras.main.shake(80, 0.002); },
            });
        }
    });
}

// ---------- argollas ----------
function actualizarArgollas(scene) {
    const ahora = scene.time.now, dt = scene.game.loop.delta / 1000;
    scene.cuerdas.clear();
    const locales = [
        [scene.mascotaGesi, scene.keys && { salto: scene.keys.up, izq: scene.keys.left, der: scene.keys.right }],
        [scene.compa?.active ? scene.compa : null, scene.teclasCompa],
    ];
    locales.forEach(([s, t]) => {
        if (!s || !t) return;
        const b = s.body;
        const salto = t.salto.isDown, saltoNuevo = salto && !s.saltoAntes; // (sin JustDown: el juego ya lo usa)
        s.saltoAntes = salto;
        const enSuelo = b.blocked.down || b.touching.down;

        if (!s.argolla) {
            if (enSuelo || s.isDead || s.colgando || ahora < (s.soltoHasta || 0)) return;
            const a = scene.argollas.find(r => Phaser.Math.Distance.Between(r.x, r.y, b.center.x, b.center.y) < RADIO_ARGOLLA);
            if (!a) return;
            s.argolla = a;
            s.cuerda = Phaser.Math.Clamp(Phaser.Math.Distance.Between(a.x, a.y, b.center.x, b.center.y), CUERDA_MIN, CUERDA_MAX);
            scene.sound.play('golpe_enemigo', { volume: 0.3, rate: 1.8 });
        }
        const a = s.argolla;
        // soltarse: con el salto (o si murió / tocó el suelo)
        if (saltoNuevo || s.isDead || enSuelo) {
            s.argolla = null;
            s.soltoHasta = ahora + ESPERA_REAGARRE;
            s.enArgolla = false;
            if (saltoNuevo && !s.isDead) s.setVelocityY(b.velocity.y - SOLTAR_EMPUJE);
            return;
        }
        // colgado: el movimiento normal no manda (empujadoHasta en el jugador 1, enArgolla en el 2)
        s.enArgolla = true;
        if (s === scene.mascotaGesi) scene.empujadoHasta = ahora + 60;
        const dx = b.center.x - a.x, dy = b.center.y - a.y, dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist, ny = dy / dist;
        // impulso con ← → (a lo largo del arco)
        const dir = (t.der.isDown ? 1 : 0) - (t.izq.isDown ? 1 : 0);
        if (dir) { b.velocity.x += ny * dir * IMPULSO * dt; b.velocity.y -= nx * dir * IMPULSO * dt; }
        // la cuerda no se estira: se corrige la posición y se anula la velocidad hacia afuera
        if (dist > s.cuerda) {
            s.x -= nx * (dist - s.cuerda);
            s.y -= ny * (dist - s.cuerda);
            const haciaFuera = b.velocity.x * nx + b.velocity.y * ny;
            if (haciaFuera > 0) { b.velocity.x -= nx * haciaFuera; b.velocity.y -= ny * haciaFuera; }
        }
        if (dir) s.flipX = dir < 0;
        scene.cuerdas.lineStyle(2, 0xc9a090, 1).lineBetween(a.x, a.y, b.center.x, b.center.y - 10);
    });
}
