// ¿Se puede llegar a cada plataforma? Comprobación para los niveles con altura.
//
// Junta todas las superficies donde se puede estar de pie (suelo, plataformas flotantes,
// filas de bloques, escalones y plataformas móviles) y busca a cuáles se llega desde el inicio
// saltando y cayendo. Usa el salto MÁS CORTO de los tres personajes (Leo y Zeno sin doble salto),
// con margen: si así se llega, llegan todos. Lo usan las pruebas (niveles_test.js).
//
// Muros ('muros'): columnas macizas que no se pueden atravesar; solo se pasa por encima.
//
// Medido en el juego: Gesi sube 169 px, Leo y Zeno 144 px; un salto completo avanza ~338 px.

export const SALTO = {
    alto: 128,       // lo más alto que se sube con un salto (con margen sobre los 144 px de Leo y Zeno)
    largo: 220,      // hueco que se cruza saltando entre superficies a la misma altura
    largoSubiendo: 150, // hueco que se cruza subiendo lo máximo
    asomar: 40,      // para subir a algo que está justo encima hay que saltar desde fuera de su borde
};
export const SUELO_Y = 332;
const MEDIO_MOVIL = 64; // la plataforma móvil mide 128 px de ancho

// tramos sólidos de una fila de bloques: 'B', '?', 'E' y 'C' se pisan; ' ', 'F' (falso) y 'H' (invisible) no
function tramosDeBloques([x, y, patron]) {
    const tramos = [];
    let ini = null;
    [...patron, ' '].forEach((c, i) => {
        const solido = 'B?EC'.includes(c);
        if (solido && ini === null) ini = i;
        if (!solido && ini !== null) { tramos.push({ x0: x + ini * 32, x1: x + i * 32, top: y - 16, tipo: 'bloques' }); ini = null; }
    });
    return tramos;
}

// quita de un tramo [a, b] los trozos ocupados por muros
function cortarPorMuros(a, b, muros) {
    let trozos = [[a, b]];
    muros.forEach(([mx, , ancho]) => {
        trozos = trozos.flatMap(([x0, x1]) => (mx >= x1 || mx + ancho <= x0) ? [[x0, x1]]
            : [[x0, mx], [mx + ancho, x1]].filter(([p, q]) => q - p > 0));
    });
    return trozos;
}

// todas las superficies del nivel (sueloExtra: suelo hecho a mano, como en el nivel 1)
export function superficies(nivel, sueloExtra = []) {
    const s = [];
    const muros = nivel.muros || [];
    [...(nivel.suelo || []), ...sueloExtra].forEach(([a, b]) =>
        cortarPorMuros(a, b, muros).forEach(([x0, x1]) => s.push({ x0, x1, top: SUELO_Y, tipo: 'suelo' })));
    // muro: columna maciza desde el suelo hasta 'arriba'; se puede pisar su cima
    muros.forEach(([x, arriba, ancho]) => s.push({ x0: x, x1: x + ancho, top: arriba, tipo: 'muro' }));
    (nivel.plataformas || []).forEach(([x, top, ancho]) => s.push({ x0: x, x1: x + ancho, top, tipo: 'plataforma' }));
    // runas: la piedra se puede pisar y sus losas cuentan como plataformas (una vez activada; para
    // activarla hay que poder golpearla desde abajo, lo que comprueba la prueba de las runas)
    (nivel.runas || []).forEach(([x, y, losas]) => {
        s.push({ x0: x, x1: x + 32, top: y - 16, tipo: 'runa' });
        losas.forEach(([lx, top, ancho]) => s.push({ x0: lx, x1: lx + ancho, top, tipo: 'losa' }));
    });
    (nivel.bloques || []).forEach(fila => s.push(...tramosDeBloques(fila)));
    (nivel.escaleras || []).forEach(([x, altura]) => {
        for (let col = 0; col < altura; col++) s.push({ x0: x + col * 32, x1: x + (col + 1) * 32, top: SUELO_Y - 32 * (col + 1), tipo: 'escalon' });
    });
    (nivel.moviles || []).forEach(([x, y, eje, recorrido], i) => {
        if (eje === 'x') {
            s.push({ x0: x - MEDIO_MOVIL, x1: x + recorrido + MEDIO_MOVIL, top: y - 16, tipo: 'movil', movil: i });
        } else {
            // ascensor: se puede subir abajo y bajarse arriba (y en cualquier punto del recorrido)
            s.push({ x0: x - MEDIO_MOVIL, x1: x + MEDIO_MOVIL, top: y - 16, tipo: 'ascensor', movil: i });
            s.push({ x0: x - MEDIO_MOVIL, x1: x + MEDIO_MOVIL, top: y - recorrido - 16, tipo: 'ascensor', movil: i });
        }
    });
    return s;
}

// ¿hay un muro entre a y b que sea más alto que las dos? (no se puede atravesar ni saltar)
function muroEnMedio(a, b, muros) {
    const izq = Math.min(a.x1, b.x1), der = Math.max(a.x0, b.x0);
    return muros.some(([mx, arriba, ancho]) => mx >= izq - 1 && mx + ancho <= der + 1 && arriba < Math.min(a.top, b.top));
}

// ¿se puede pasar de la superficie a a la b?
export function seLlega(a, b, muros = []) {
    if (muroEnMedio(a, b, muros)) return false;
    const sube = a.top - b.top; // > 0: b está más arriba
    const hueco = Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1); // > 0: hay hueco entre las dos; <= 0: se solapan
    if (a.movil !== undefined && a.movil === b.movil) return true; // los dos extremos del mismo ascensor
    if (sube <= 0) {
        // bajar o seguir a la misma altura: se llega caminando, cayendo o saltando el hueco
        return hueco <= SALTO.largo;
    }
    if (sube > SALTO.alto) return false;
    if (hueco > 0) return hueco <= SALTO.largo - (SALTO.largo - SALTO.largoSubiendo) * (sube / SALTO.alto);
    // b está justo encima de a: hay que poder saltar desde un trozo de a que asome fuera de b
    return a.x1 - b.x1 >= SALTO.asomar || b.x0 - a.x0 >= SALTO.asomar;
}

// superficies a las que no se puede llegar desde el inicio: en el suelo en x = inicioX, o
// donde diga nivel.inicio [x, y] (la primera superficie debajo de ese punto)
export function inalcanzables(nivel, { sueloExtra = [], inicioX = 50 } = {}) {
    const s = superficies(nivel, sueloExtra);
    const [ix, iy] = nivel.inicio || [inicioX, SUELO_Y - 1];
    let inicio = -1;
    s.forEach((t, i) => {
        if (ix >= t.x0 && ix <= t.x1 && t.top > iy && (inicio < 0 || t.top < s[inicio].top)) inicio = i;
    });
    if (inicio < 0) return s;
    const visto = new Set([inicio]);
    const cola = [inicio];
    while (cola.length) {
        const a = s[cola.shift()];
        s.forEach((b, i) => {
            if (!visto.has(i) && seLlega(a, b, nivel.muros || [])) { visto.add(i); cola.push(i); }
        });
    }
    return s.filter((_, i) => !visto.has(i));
}
