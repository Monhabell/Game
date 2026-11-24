// Economía: de dónde salen las monedas de la TIENDA (◉).
// Antes cada moneda del camino daba ◉ 1 y la tienda salía muy barata. Ahora:
//   - las monedas del camino dan solo PUNTAJE (y cuentan para la estrella del 80 %)
//   - MONEDAS DE ORO: 1 a 3 por nivel, en lugares fijos (iguales para todos), brillan y dan ◉ ORO_VALE.
//     Cada una se cobra UNA vez (si no, repetir el nivel 1 sería una mina): después es una moneda normal
//   - PREMIO DEL NIVEL (premioNivel): terminarlo la 1ª vez, repetirlo y cada estrella nueva
//   - la recompensa diaria (diario.js), subir de nivel y los hitos (progreso.js, hitos.js), la carrera y la arena
// (en la carrera no hay monedas de oro: ahí se gana con el premio de la carrera)

export const ORO_VALE = 5;
const CADA = 30;                 // ~1 de oro cada 30 monedas del nivel
const MIN_ORO = 1, MAX_ORO = 3;
const CLAVE = 'troll-night-oro'; // las de oro ya cobradas: "nivel:x,y"

let cobradas = null;
function leer() {
    if (cobradas) return cobradas;
    try { cobradas = new Set(JSON.parse(localStorage.getItem(CLAVE)) || []); } catch (_e) { cobradas = new Set(); }
    return cobradas;
}
function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify([...leer()])); } catch (_e) { /* sin almacenamiento */ }
}

// número "al azar" fijo para cada lugar (el mismo en todas las pantallas y en cada intento)
const mezclar = (x, y, n) => {
    let h = Math.imul(Math.round(x) ^ 0x9e3779b9, 2654435761) ^ Math.imul(Math.round(y) + n * 7919, 1597334677);
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    return (h ^ (h >>> 13)) >>> 0;
};

// marca las monedas de oro del nivel 'nivel' (índice) entre las del grupo scene.coins
export function marcarOro(scene, nivel) {
    const lista = scene.coins?.getChildren() || [];
    if (!lista.length) return;
    const cuantas = Math.max(MIN_ORO, Math.min(MAX_ORO, Math.round(lista.length / CADA)));
    const vistas = leer();
    [...lista].sort((a, b) => mezclar(a.x, a.y, nivel) - mezclar(b.x, b.y, nivel)).slice(0, cuantas).forEach(m => {
        const clave = `${nivel}:${m.clave}`;
        if (vistas.has(clave)) return; // (ya la cobraste: queda como una moneda normal)
        m.oro = clave;
        m.setTint(0xffd84a).setScale(1);
        // brillo que late alrededor (que se note que es especial)
        const brillo = scene.add.image(m.x, m.y, 'brillo').setDepth(m.depth - 0.1).setTint(0xffc94a).setBlendMode('ADD').setAlpha(0.5).setScale(0.9);
        scene.tweens.add({ targets: brillo, scale: 1.3, alpha: 0.15, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
        m.brilloOro = brillo;
    });
}

// se tomó una moneda de oro: su ◉ va a la bolsa y queda PENDIENTE; recién al guardar la bolsa (punto de
// control o meta: confirmarOro) queda cobrada para siempre. Si mueres antes, la vuelves a encontrar de oro
export function tomarOro(scene, m) {
    (scene.oroPendiente ||= []).push(m.oro);
    m.brilloOro?.destroy();
}
export function confirmarOro(scene) {
    if (!scene.oroPendiente?.length) return;
    scene.oroPendiente.forEach(k => leer().add(k));
    scene.oroPendiente = [];
    guardar();
}

// premio en ◉ al terminar un nivel: la 1ª vez más (y más en los niveles altos), repetirlo poco, y cada
// estrella nueva suma
export function premioNivel(indice, primeraVez, estrellasNuevas = 0) {
    const base = primeraVez ? 30 + Math.min(indice + 1, 40) : 8;
    return base + 10 * Math.max(0, estrellasNuevas);
}
