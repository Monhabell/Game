// Copia los archivos del juego a www/ (la carpeta que Capacitor mete dentro del APK).
// Solo lo que el navegador necesita: index.html, los .js del juego, Phaser y assets/.
//
// VERSIÓN EN LOS IMPORTS: cada copia marca los .js con "?v=<versión>" (en index.html y en cada
// `import ... from "./x.js"`). Así, al subir una versión nueva a la página, el navegador baja los archivos
// nuevos en vez de usar los que tenía guardados. (Antes podía pasar que un jugador siguiera con el juego
// viejo: en la carrera sus golpes recibidos se revisan en SU pantalla y con código viejo no le pegaban.)
// Todos los imports se marcan igual: si uno quedara sin marca, el navegador cargaría ese archivo dos veces.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';

const raiz = join(import.meta.dirname, '..');
const www = join(raiz, 'www');
const fuera = new Set(['niveles_test.js']); // pruebas, no van en la app
const version = Date.now().toString(36);
// "./algo.js" (con comillas simples o dobles) -> "./algo.js?v=…"
const marcar = texto => texto.replace(/(["'])\.\/([\w.-]+\.js)\1/g, (_t, c, f) => `${c}./${f}?v=${version}${c}`);

rmSync(www, { recursive: true, force: true });
mkdirSync(www);
for (const f of readdirSync(raiz)) {
    if (f === 'phaser.min.js') cpSync(join(raiz, f), join(www, f));
    else if (f === 'index.html' || (f.endsWith('.js') && !fuera.has(f))) {
        writeFileSync(join(www, f), marcar(readFileSync(join(raiz, f), 'utf8')));
    }
}
// (las heroínas HD que se quitaron del juego: sus imágenes no van — 4 MB menos)
const sinUsar = ['paladina', 'asesina', 'elfa'].map(pj => join(raiz, 'assets', 'personajes', pj));
cpSync(join(raiz, 'assets'), join(www, 'assets'), { recursive: true, filter: f => !sinUsar.some(d => f === d || f.startsWith(d + sep)) });
console.log(`Juego copiado a www/ (versión ${version})`);
