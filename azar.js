// Trampas aleatorias y vidas al azar.
//
// aleatorizarNivel: cada vez que empieza un intento (al entrar al nivel o al reaparecer)
// las trampas se reparten de nuevo, para que no se puedan memorizar. Se mantiene
// aproximadamente la cantidad de cada trampa que tiene el nivel (así cada nivel sigue
// siendo más difícil que el anterior) y se respetan reglas para que siempre se pueda pasar.
//
// Corazones al azar: si te falta alguna vida, de vez en cuando aparece uno delante de ti,
// y los enemigos derrotados a veces sueltan uno.

const SUELO_Y = 332;
const azar = (a, b) => a + Math.random() * (b - a);
const moneda = p => Math.random() < p;
const mezclar = lista => {
    for (let i = lista.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
};

// cantidad mínima de trampas por nivel: siempre sube
const MINIMO_TRAMPAS = [15, 21, 26, 33, 52, 72];

export function contarTrampas(n) {
    const c = ch => (n.bloques || []).reduce((a, b) => a + [...b[2]].filter(x => x === ch).length, 0);
    const L = k => (n[k] || []).length;
    return c('H') + c('E') + c('C') + c('F') + L('falsos') + L('pinchos') + L('emboscadas') + L('plantas') +
        L('monedasTrampa') + L('rocas') + L('estatuasFalsas') + L('mordedoras') + L('banderasFalsas') + L('persecuciones');
}

const BURLAS_CARTEL = ['¡SALTA AQUÍ!', 'ATAJO →', 'TODO BIEN :)', 'NO HAY TRAMPAS', 'CONFÍA EN MÍ', '¡CASI LLEGAS!', 'ZONA SEGURA', 'NO CORRAS'];

// sueloExtra: rangos de suelo hechos a mano (nivel 1)
export function aleatorizarNivel(nivel, indice, sueloExtra = []) {
    const n = { ...nivel };
    const meta = nivel.meta;
    const checkpoints = nivel.checkpoints || [];
    const largo = (lista) => (lista || []).length;

    // zonas donde no puede haber trampas que necesitan espacio arriba (bloques bajos y escaleras)
    const bloquesBajos = (nivel.bloques || []).filter(([, y]) => y >= 200).map(([x, , p]) => [x - 40, x + p.length * 32 + 40]);
    const escaleras = (nivel.escaleras || []).map(([x, h]) => [x - 60, x + h * 32 + 60]);
    const falsos = (nivel.falsos || []).map(([a, b]) => [a - 60, b + 60]);
    const dentro = (x, rangos) => rangos.some(([a, b]) => x >= a && x <= b);

    // lugares posibles: sobre suelo firme, lejos del inicio, de la meta y de los puntos de control
    const candidatos = [];
    [...(nivel.suelo || []), ...sueloExtra].forEach(([a, b]) => {
        for (let x = a + 110; x <= b - 110; x += 50) {
            if (x < 350 || x > meta - 760) continue; // la arena del jefe queda libre de trampas
            if (checkpoints.some(cp => Math.abs(x - cp) < 150)) continue;
            if (dentro(x, escaleras) || dentro(x, falsos)) continue;
            candidatos.push(x);
        }
    });
    mezclar(candidatos);
    const usados = [];
    let separacion = Math.max(80, 125 - 10 * indice); // en niveles altos las trampas quedan más juntas
    const tomar = (sinBloques = false, desde = 0) => {
        const i = candidatos.findIndex(x => x >= desde && !usados.some(u => Math.abs(u - x) < separacion) && !(sinBloques && dentro(x, bloquesBajos)));
        if (i < 0) return null;
        const x = candidatos.splice(i, 1)[0];
        usados.push(x);
        return x;
    };
    // cantidad: alrededor de la del nivel, con un poco de variación
    const cuanto = (base) => base ? Math.max(1, Math.round(base * azar(0.9, 1.2))) : 0;
    const repartir = (base, crear, opciones = {}) => {
        const lista = [];
        for (let i = 0; i < cuanto(base); i++) {
            const x = tomar(opciones.sinBloques, opciones.desde);
            if (x !== null) lista.push(crear(x));
        }
        return lista;
    };

    const pinchosPorGrupo = indice >= 3 ? 2 : 1;
    n.pinchos = repartir(largo(nivel.pinchos), x => [x, pinchosPorGrupo, true]);
    n.rocas = repartir(largo(nivel.rocas), x => x, { sinBloques: true });
    n.monedasTrampa = repartir(largo(nivel.monedasTrampa), x => [x, 300]);
    n.estatuasFalsas = repartir(largo(nivel.estatuasFalsas), x => x);
    n.emboscadas = repartir(largo(nivel.emboscadas), x => [x, [x + 200, x + 330]]);
    n.plantas = repartir(largo(nivel.plantas), x => x);
    n.persecuciones = repartir(largo(nivel.persecuciones), x => x, { desde: meta * 0.3 });

    // plataformas que muerden: las que están sobre la lava se quedan a veces; las del suelo cambian de lugar
    const mordedoras = nivel.mordedoras || [];
    n.mordedoras = [
        ...mordedoras.filter(([, y]) => y < 300 && moneda(0.7)),
        ...repartir(mordedoras.filter(([, y]) => y >= 300).length, x => [x, 316], { sinBloques: true }),
    ];

    // bandera falsa: en algún lugar del último tramo del nivel
    n.banderasFalsas = repartir(largo(nivel.banderasFalsas), x => x, { desde: meta * 0.6 });

    // carteles: algunos de los originales y otros nuevos en lugares al azar
    n.carteles = [
        ...(nivel.carteles || []).filter(() => moneda(0.5)),
        ...n.banderasFalsas.map(x => [x, 120, '¡META!']),
        ...repartir(Math.max(2, largo(nivel.carteles)), x => [x, Math.round(azar(130, 180)), BURLAS_CARTEL[Math.floor(Math.random() * BURLAS_CARTEL.length)]]),
    ];

    // bloques: cualquier "?" puede soltar un enemigo y cualquier ladrillo bajo puede caer
    const pE = 0.15 + 0.05 * indice, pC = 0.1 + 0.04 * indice;
    n.bloques = (nivel.bloques || []).filter(([, , p]) => p !== 'H' || moneda(0.6)).map(([x, y, patron]) => {
        const bajo = y >= 200 && y <= 240;
        const nuevo = [...patron].map(c => {
            if (c === '?') return moneda(pE) ? 'E' : '?';
            if (c === 'E') return moneda(0.5) ? 'E' : '?';
            if (c === 'B' && bajo) return moneda(pC) ? 'C' : 'B';
            if (c === 'C') return moneda(0.6) ? 'C' : 'B';
            return c;
        }).join('');
        return [x, y, nuevo];
    });
    // bloque invisible al borde de algún hueco de lava
    const pH = 0.2 + 0.07 * indice;
    (nivel.lava || []).forEach(([x0]) => {
        const yaHay = n.bloques.some(([x, , p]) => p === 'H' && Math.abs(x - x0) < 40);
        if (!yaHay && moneda(pH)) n.bloques.push([x0 - 12, 232, 'H']);
    });

    // la arena del jefe (antes de la meta) queda despejada: sin escaleras ni bloques
    const inicioArena = meta - 760;
    n.escaleras = (nivel.escaleras || []).filter(([x]) => x < inicioArena);
    n.bloques = n.bloques.filter(([x, , p]) => x + p.length * 32 < inicioArena);

    // cargas de escudo repartidas al azar por el nivel
    n.escudos = repartir(indice >= 3 ? 2 : 1, x => [x, 296]);

    // si quedaron menos trampas que el mínimo del nivel, se agregan más
    const minimo = MINIMO_TRAMPAS[Math.min(indice, MINIMO_TRAMPAS.length - 1)];
    const extras = [
        () => { const x = tomar(); return x !== null && n.pinchos.push([x, pinchosPorGrupo, true]); },
        () => { const x = tomar(true); return x !== null && n.rocas.push(x); },
        () => { const x = tomar(); return x !== null && n.monedasTrampa.push([x, 300]); },
        () => { const x = tomar(); return x !== null && n.plantas.push(x); },
        () => { const x = tomar(); return x !== null && n.emboscadas.push([x, [x + 200, x + 330]]); },
    ];
    const rellenar = () => {
        for (let i = 0, fallos = 0; contarTrampas(n) < minimo && fallos < extras.length; i++) {
            fallos = extras[i % extras.length]() ? 0 : fallos + 1;
        }
    };
    rellenar();
    // si no alcanzó el suelo: trampas un poco más juntas
    if (contarTrampas(n) < minimo) {
        separacion = 75;
        rellenar();
    }
    // y si aún faltan: bloques invisibles en todos los bordes de lava y bloques traicioneros
    if (contarTrampas(n) < minimo) {
        (nivel.lava || []).forEach(([x0]) => {
            if (contarTrampas(n) < minimo && !n.bloques.some(([x, , p]) => p === 'H' && Math.abs(x - x0) < 40)) n.bloques.push([x0 - 12, 232, 'H']);
        });
        // se convierten de a uno hasta llegar al mínimo
        for (const fila of n.bloques) {
            const [, y] = fila;
            const letras = [...fila[2]];
            for (let i = 0; i < letras.length && contarTrampas(n) < minimo; i++) {
                if (letras[i] === '?') letras[i] = 'E';
                else if (letras[i] === 'B' && y >= 200 && y <= 240) letras[i] = 'C';
                fila[2] = letras.join('');
            }
        }
    }

    return n;
}

// ---------- Cargas de escudo al azar ----------
// si no tienes escudo, de vez en cuando aparece una carga delante de ti (fuera de la pelea con el jefe)
export function iniciarEscudosAlAzar(scene, soltarEscudo, ancho) {
    const programar = () => scene.time.delayedCall(azar(22000, 38000), intentar);
    const intentar = () => {
        const g = scene.mascotaGesi;
        if (!g.isDead && !scene.nivelTerminado && !scene.tieneEscudo && !scene.peleaJefe) {
            for (let i = 0; i < 10; i++) {
                const x = g.x + azar(160, 380);
                if (x > ancho - 100) break;
                const y = alturaSobreSuelo(scene, x);
                if (y !== null) {
                    soltarEscudo(scene, x, y - 2);
                    scene.mostrarMensajeCorto?.('¡UN ESCUDO!');
                    break;
                }
            }
        }
        programar();
    };
    programar();
}

// ---------- Corazones al azar ----------

// busca suelo firme en x (no lava) y devuelve la altura donde poner el premio
function alturaSobreSuelo(scene, x) {
    let mejor = null;
    scene.floor.getChildren().forEach(p => {
        const b = p.body;
        if (!p.active || !b || !b.enable || p.esGotero || p.esFalso) return;
        if (x > b.left + 10 && x < b.right - 10 && b.top >= 150 && b.top <= SUELO_Y + 4) {
            if (mejor === null || b.top > mejor) mejor = b.top;
        }
    });
    return mejor === null ? null : mejor - 28;
}

export function soltarCorazon(scene, x, y, mensaje) {
    const c = scene.premios.create(x, y, 'mz_corazon').anims.play('mz_corazon', true).refreshBody();
    c.tipoPremio = 'corazon';
    const brillo = scene.add.image(x, y, 'brillo').setDepth(41).setScale(0.9).setTint(0xff4d6d).setAlpha(0.4).setBlendMode('ADD');
    c.setScale(0.2);
    scene.tweens.add({ targets: c, scale: 1, duration: 300, ease: 'Back.out' });
    scene.sound.play('aparece', { volume: 0.5 });
    if (mensaje) scene.mostrarMensajeCorto?.(mensaje);

    // parpadea y desaparece si no lo tomas
    scene.time.delayedCall(7000, () => {
        if (c.active) scene.tweens.add({ targets: [c, brillo], alpha: 0.2, yoyo: true, repeat: 5, duration: 250 });
    });
    scene.time.delayedCall(10000, () => {
        if (c.active) c.destroy();
        brillo.destroy();
    });
    c.on('destroy', () => brillo.active && brillo.destroy());
    return c;
}

// cada cierto tiempo, si faltan vidas, aparece un corazón delante del jugador
export function iniciarCorazonesAlAzar(scene, faltanVidas, ancho) {
    const programar = () => scene.time.delayedCall(azar(18000, 32000), intentar);
    const intentar = () => {
        const g = scene.mascotaGesi;
        if (!g.isDead && !scene.nivelTerminado && faltanVidas()) {
            for (let i = 0; i < 10; i++) {
                const x = g.x + azar(140, 360);
                if (x > ancho - 100 || (scene.limiteDerecho && x > scene.limiteDerecho)) break;
                const y = alturaSobreSuelo(scene, x);
                if (y !== null) {
                    soltarCorazon(scene, x, y, '¡UNA VIDA!');
                    break;
                }
            }
        }
        programar();
    };
    programar();
}
