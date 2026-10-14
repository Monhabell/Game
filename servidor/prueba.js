// Prueba rápida del servidor: dos jugadores crean y se unen a una sala, empiezan y se mandan estados.
// Uso: node prueba.js [ws://127.0.0.1:2567]   (con el servidor ya corriendo)
import WebSocket from 'ws';

const URL = process.argv[2] || 'ws://127.0.0.1:2567';
const esperar = (ws, t) => new Promise(ok => ws.on('message', function f(d) {
    const m = JSON.parse(d);
    if (m.t === t) { ws.off('message', f); ok(m); }
}));
const abrir = () => new Promise((ok, mal) => { const ws = new WebSocket(URL); ws.on('open', () => ok(ws)); ws.on('error', mal); });

const a = await abrir();
a.send(JSON.stringify({ t: 'crear', nombre: 'Ana', pj: 'arquera' }));
const sala = await esperar(a, 'sala');
console.log('sala creada:', sala.codigo, 'anfitrión', sala.anfitrion);

const b = await abrir();
const listaA = esperar(a, 'sala');
b.send(JSON.stringify({ t: 'unirse', codigo: sala.codigo, nombre: 'Beto', pj: 'mago' }));
const salaB = await esperar(b, 'sala');
await listaA;
console.log('Beto entró como id', salaB.tuId, '· jugadores:', salaB.jugadores.map(j => `${j.nombre}(${j.pj})`).join(', '));

const empA = esperar(a, 'empezar'), empB = esperar(b, 'empezar');
a.send(JSON.stringify({ t: 'empezar', nivel: 0 }));
const [ea, eb] = await Promise.all([empA, empB]);
console.log('empezó, misma semilla:', ea.semilla === eb.semilla);

const llega = esperar(a, 'estado');
b.send(JSON.stringify({ t: 'estado', x: 120, y: 300 }));
const e = await llega;
console.log('estado reenviado de', e.de, '→', e.x, e.y);

const sale = esperar(a, 'sala');
b.close();
const despues = await sale;
console.log('Beto salió, quedan', despues.jugadores.length);
a.close();
console.log('PRUEBA OK');
