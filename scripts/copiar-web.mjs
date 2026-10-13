// Copia los archivos del juego a www/ (la carpeta que Capacitor mete dentro del APK).
// Solo lo que el navegador necesita: index.html, los .js del juego, Phaser y assets/.
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const raiz = join(import.meta.dirname, '..');
const www = join(raiz, 'www');
const fuera = new Set(['niveles_test.js']); // pruebas, no van en la app

rmSync(www, { recursive: true, force: true });
mkdirSync(www);
for (const f of readdirSync(raiz)) {
    if (f === 'index.html' || (f.endsWith('.js') && !fuera.has(f))) cpSync(join(raiz, f), join(www, f));
}
cpSync(join(raiz, 'assets'), join(www, 'assets'), { recursive: true });
console.log('Juego copiado a www/');
